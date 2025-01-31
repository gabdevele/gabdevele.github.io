const BLACK = 'black';
const WHITE = 'white';

class Piece {
    color: string;
    public x: number;
    public y: number;
    dama: boolean;
    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.dama = false;
    }

    getColor(): string {
        return this.color;
    }

    isWhite(): boolean {
        return this.color === WHITE;
    }

    isBlack(): boolean {
        return this.color === BLACK;
    }

    isDama(): boolean {
        return this.dama;
    }

    makeDama(): void {
        this.dama = true;
    }

    move(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
}

class Empty {}

class Board {
    board: (Piece | Empty)[][];

    constructor() {
        this.board = [];
        this.createBoard();
    }

    createBoard() {
        const piecesPlacement: number[][] = [
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 2, 0, 2, 0, 2, 0, 2],
            [2, 0, 2, 0, 2, 0, 2, 0],
            [0, 2, 0, 2, 0, 2, 0, 2]
        ];
        for (let i = 0; i < 8; i++) {
            this.board[i] = [];
            for (let j = 0; j < 8; j++) {
                if (piecesPlacement[i][j] === 1) {
                    this.board[i][j] = new Piece(i, j, BLACK);
                } else if (piecesPlacement[i][j] === 2) {
                    this.board[i][j] = new Piece(i, j, WHITE);
                } else {
                    this.board[i][j] = new Empty();
                }
            }
        }
    }

    movePiece(piece: Piece, x: number, y: number) {
        this.removePiece(piece);
        piece.move(x, y);
        this.board[x][y] = piece;
    }

    removePiece(piece: Piece) {
        this.board[piece.x][piece.y] = new Empty();
    }

    getPiece(x: number, y: number): Piece | Empty {
        return this.board[x][y];
    }

    isPiece(x: number, y: number): boolean {
        return this.board[x][y] instanceof Piece;
    }

    isEmpty(x: number, y: number): boolean {
        return this.board[x][y] instanceof Empty;
    }

    printBoard() {
        //formatted print
        for (let i = 0; i < 8; i++) {
            let row = '';
            for (let j = 0; j < 8; j++) {
                if (this.board[i][j] instanceof Piece) {
                    row += 'P';
                } else {
                    row += 'E';
                }
            }
            console.log(row);
        }
    }
}

class CheckersGame {
    board: Board;
    currentPlayer: string;

    constructor() {
        this.board = new Board();
        this.currentPlayer = 'white';
    }

    getCurrentPlayer(): string {
        return this.currentPlayer;
    }

    changePlayer(): void {
        this.currentPlayer = this.currentPlayer === WHITE ? BLACK : WHITE;
    }

    isPositionValid(x: number, y: number): boolean {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    }

    getPieceArrayOffset(piece: Piece, offset: number): number[][] {
        const positions: number[][] = [];
        if (piece.isWhite()) {
            positions.push([piece.x - offset, piece.y - offset]);
            positions.push([piece.x - offset, piece.y + offset]);
        } else {
            positions.push([piece.x + offset, piece.y - offset]);
            positions.push([piece.x + offset, piece.y + offset]);
        }

        if(piece.isDama()) {
            offset = offset < 0 ? -offset : offset;
            positions.push([piece.x + offset, piece.y - offset]);
            positions.push([piece.x + offset, piece.y + offset]);
        }
        return positions;
    }

    getPossibleJumps(piece: Piece): number[][] {
        let offset = piece.isWhite() ? 1 : -1;

        const positionsPiecesToJump: number[][] = 
                this.getPieceArrayOffset(piece, offset);
        offset *= 2;
        const positionsToLand: number[][] = 
                this.getPieceArrayOffset(piece, offset);

        const possibleJumps: number[][] = [];
    
        for(let i = 0; i < 2; i++) {
            if(this.isPositionValid(positionsPiecesToJump[i][0], positionsPiecesToJump[i][1]) &&
                this.isPositionValid(positionsToLand[i][0], positionsToLand[i][1])) {
                
                const pieceToJump = this.board.getPiece(positionsPiecesToJump[i][0], positionsPiecesToJump[i][1]);
                const landPosition = this.board.getPiece(positionsToLand[i][0], positionsToLand[i][1]);

                if(landPosition instanceof Empty && pieceToJump instanceof Piece && pieceToJump.getColor() !== piece.getColor()) {
                    possibleJumps.push([positionsToLand[i][0], positionsToLand[i][1]]);
                }
            }
        }
        return possibleJumps;
    }

    getPossibleMoves(piece: Piece): number[][] {
        let posDiagonali: number[][] = [];
        let posDama: number[][] = [];
    
        if (piece.isWhite() || piece.isDama()) {
            posDiagonali.push(
                [piece.x - 1, piece.y + 1],
                [piece.x - 1, piece.y - 1]
            );
            posDama.push(
                [piece.x + 1, piece.y + 1],
                [piece.x + 1, piece.y - 1]
            );
        }
    
        if (piece.isBlack() || piece.isDama()) {
            posDiagonali.push(
                [piece.x + 1, piece.y + 1],
                [piece.x + 1, piece.y - 1]
            );
            posDama.push(
                [piece.x - 1, piece.y + 1],
                [piece.x - 1, piece.y - 1]
            );
        }
    
        let posFinali: number[][] = [];
        for (let i = 0; i < posDiagonali.length; i++) {
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
    }


    movePiece(x1: number, y1: number, x2: number, y2: number) {
        if(!this.isPositionValid(x1, y1) || !this.isPositionValid(x2, y2)) {
            throw new Error('Invalid position');
        }
        if((x2+y2) % 2 !== 0) {
            throw new Error('Invalid move');
        }
    }
}
//simulate game
const game = new CheckersGame();
game.board.printBoard();
game.board.movePiece(game.board.getPiece(2, 1) as Piece, 3, 2);
game.board.printBoard();
game.board.movePiece(game.board.getPiece(5, 2) as Piece, 4, 3);
game.board.printBoard();