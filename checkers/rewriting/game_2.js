var BLACK = '#e3dacc';
var WHITE = '#212121';
var Piece = /** @class */ (function () {
    function Piece(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.dama = false;
    }
    Piece.prototype.getColor = function () {
        return this.color;
    };
    Piece.prototype.isWhite = function () {
        return this.color === WHITE;
    };
    Piece.prototype.isBlack = function () {
        return this.color === BLACK;
    };
    Piece.prototype.isDama = function () {
        return this.dama;
    };
    Piece.prototype.makeDama = function () {
        this.dama = true;
    };
    Piece.prototype.move = function (x, y) {
        this.x = x;
        this.y = y;
    };
    return Piece;
}());
var Empty = /** @class */ (function () {
    function Empty() {
    }
    return Empty;
}());
var Board = /** @class */ (function () {
    function Board() {
        this.board = [];
        this.createBoard();
    }
    Board.prototype.createBoard = function () {
        var piecesPlacement = [
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 2, 0, 2, 0, 2, 0, 2],
            [2, 0, 2, 0, 2, 0, 2, 0],
            [0, 2, 0, 2, 0, 2, 0, 2]
        ];
        for (var i = 0; i < 8; i++) {
            this.board[i] = [];
            for (var j = 0; j < 8; j++) {
                if (piecesPlacement[i][j] === 1) {
                    this.board[i][j] = new Piece(i, j, BLACK);
                }
                else if (piecesPlacement[i][j] === 2) {
                    this.board[i][j] = new Piece(i, j, WHITE);
                }
                else {
                    this.board[i][j] = new Empty();
                }
            }
        }
    };
    Board.prototype.movePiece = function (piece, x, y) {
        this.removePiece(piece);
        piece.move(x, y);
        this.board[x][y] = piece;
    };
    Board.prototype.removePiece = function (piece) {
        this.board[piece.x][piece.y] = new Empty();
    };
    Board.prototype.getPiece = function (x, y) {
        return this.board[x][y];
    };
    Board.prototype.isPiece = function (x, y) {
        return this.board[x][y] instanceof Piece;
    };
    Board.prototype.isEmpty = function (x, y) {
        return this.board[x][y] instanceof Empty;
    };
    Board.prototype.printBoard = function () {
        //formatted print
        for (var i = 0; i < 8; i++) {
            var row = '';
            for (var j = 0; j < 8; j++) {
                if (this.board[i][j] instanceof Piece) {
                    row += 'P';
                }
                else {
                    row += 'E';
                }
            }
            console.log(row);
        }
    };
    return Board;
}());
var CheckersGame = /** @class */ (function () {
    function CheckersGame() {
        this.board = new Board();
        this.currentPlayer = 'white';
    }
    CheckersGame.prototype.getCurrentPlayer = function () {
        return this.currentPlayer;
    };
    CheckersGame.prototype.changePlayer = function () {
        this.currentPlayer = this.currentPlayer === WHITE ? BLACK : WHITE;
    };
    CheckersGame.prototype.isPositionValid = function (x, y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    };
    CheckersGame.prototype.getPieceArrayOffset = function (piece, offset) {
        var positions = [];
        if (piece.isWhite()) {
            positions.push([piece.x - offset, piece.y - offset]);
            positions.push([piece.x - offset, piece.y + offset]);
        }
        else {
            positions.push([piece.x + offset, piece.y - offset]);
            positions.push([piece.x + offset, piece.y + offset]);
        }
        if (piece.isDama()) {
            offset = offset < 0 ? -offset : offset;
            positions.push([piece.x + offset, piece.y - offset]);
            positions.push([piece.x + offset, piece.y + offset]);
        }
        return positions;
    };
    CheckersGame.prototype.getPossibleJumps = function (piece) {
        var offset = piece.isWhite() ? 1 : -1;
        var positionsPiecesToJump = this.getPieceArrayOffset(piece, offset);
        offset *= 2;
        var positionsToLand = this.getPieceArrayOffset(piece, offset);
        var possibleJumps = [];
        for (var i = 0; i < 2; i++) {
            if (this.isPositionValid(positionsPiecesToJump[i][0], positionsPiecesToJump[i][1]) &&
                this.isPositionValid(positionsToLand[i][0], positionsToLand[i][1])) {
                var pieceToJump = this.board.getPiece(positionsPiecesToJump[i][0], positionsPiecesToJump[i][1]);
                var landPosition = this.board.getPiece(positionsToLand[i][0], positionsToLand[i][1]);
                if (landPosition instanceof Empty && pieceToJump instanceof Piece && pieceToJump.getColor() !== piece.getColor()) {
                    possibleJumps.push([positionsToLand[i][0], positionsToLand[i][1]]);
                }
            }
        }
        return possibleJumps;
    };
    CheckersGame.prototype.getPossibleMoves = function (piece) {
        var posDiagonali = [];
        var posDama = [];
        if (piece.isWhite() || piece.isDama()) {
            posDiagonali.push([piece.x - 1, piece.y + 1], [piece.x - 1, piece.y - 1]);
            posDama.push([piece.x + 1, piece.y + 1], [piece.x + 1, piece.y - 1]);
        }
        if (piece.isBlack() || piece.isDama()) {
            posDiagonali.push([piece.x + 1, piece.y + 1], [piece.x + 1, piece.y - 1]);
            posDama.push([piece.x - 1, piece.y + 1], [piece.x - 1, piece.y - 1]);
        }
        var posFinali = [];
        for (var i = 0; i < posDiagonali.length; i++) {
            if (this.isPositionValid(posDiagonali[i][0], posDiagonali[i][1])) {
                if (this.board.getPiece(posDiagonali[i][0], posDiagonali[i][1]) instanceof Empty) {
                    posFinali.push(posDiagonali[i]);
                }
            }
            if (piece.isDama() && this.isPositionValid(posDama[i][0], posDama[i][1])) {
                if (this.board.getPiece(posDama[i][0], posDama[i][1]) instanceof Empty) {
                    posFinali.push(posDama[i]);
                }
            }
        }
        return posFinali;
    };
    CheckersGame.prototype.movePiece = function (x1, y1, x2, y2) {
        if (!this.isPositionValid(x1, y1) || !this.isPositionValid(x2, y2)) {
            throw new Error('Invalid position');
        }
        if ((x2 + y2) % 2 !== 0) {
            throw new Error('Invalid move');
        }
    };
    return CheckersGame;
}());

const game = new CheckersGame();
let table;

const createTable = () => {
    let table = document.createElement('table');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('cellpadding', '0');
    for(let i = 0; i < 8; i++){
        let riga = document.createElement('tr');
        for(let j = 0; j < 8; j++){
            let cella = document.createElement('td');
            if((i+j) % 2 == 0){
                cella.classList.add('marrone');
            }else{
                cella.classList.add('beige');
            }
            riga.appendChild(cella);
        }
        table.appendChild(riga);
    }
    document.querySelector('#game').appendChild(table);
}

function createCrownSvg(color){
    const svgNS = "http://www.w3.org/2000/svg";
    const viewBox = "0 0 576 512";
    const pathData = "M576 136c0 22.09-17.91 40-40 40c-.248 0-.4551-.1266-.7031-.1305l-50.52 277.9C482 468.9 468.8 480 453.3 480H122.7c-15.46 0-28.72-11.06-31.48-26.27L40.71 175.9C40.46 175.9 40.25 176 39.1 176c-22.09 0-40-17.91-40-40S17.91 96 39.1 96s40 17.91 40 40c0 8.998-3.521 16.89-8.537 23.57l89.63 71.7c15.91 12.73 39.5 7.544 48.61-10.68l57.6-115.2C255.1 98.34 247.1 86.34 247.1 72C247.1 49.91 265.9 32 288 32s39.1 17.91 39.1 40c0 14.34-7.963 26.34-19.3 33.4l57.6 115.2c9.111 18.22 32.71 23.4 48.61 10.68l89.63-71.7C499.5 152.9 496 144.1 496 136C496 113.9 513.9 96 536 96S576 113.9 576 136z";
    const svgElement = document.createElementNS(svgNS, "svg");
    svgElement.setAttribute("viewBox", viewBox);
    svgElement.setAttribute("xmlns", svgNS);
    const pathElement = document.createElementNS(svgNS, "path");
    pathElement.setAttribute("d", pathData);
    pathElement.setAttribute("fill", color);
    svgElement.appendChild(pathElement);
    return svgElement;
}

const addPiecesToTable = () => {
    for(let i = 0; i < 8; i++){
        for(let j = 0; j < 8; j++){
            const piece = game.board.getPiece(i, j);
            if(piece instanceof Piece){
                const cella = table.rows[i].cells[j];
                const pedina = document.createElement('span');
                pedina.classList.add('pedina');
                if(piece.isWhite()){
                    pedina.classList.add('bianca');
                }else{
                    pedina.classList.add('nera');
                }
                if(piece.isDama()){
                    pedina.appendChild(createCrownSvg(piece.getColor()));
                }
                cella.appendChild(pedina);
            }
        }
    }
}


window.onload = () => {
    createTable();
    table = document.querySelector('table');
    addPiecesToTable();
}