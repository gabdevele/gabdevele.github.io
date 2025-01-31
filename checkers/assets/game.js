const dame = [
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2]
]
let lastClicked = null;
let selectedcells = [];
let info;
let turno = 2;

function handleClick(e){
    let pos = [e.target.parentNode.rowIndex, e.target.cellIndex]; //posizione della cella cliccata

    let pedina = dame[pos[0]][pos[1]]; //tipo di pedina nella cella cliccata

    if(pedina > 2) pedina -= 2; //se è una dama, la pedina diventa 1 o 2

    // se non è stata cliccata nessuna pedina e la cella è vuota
    if((lastClicked == null && pedina == 0)) 
        return;

    //se è stata cliccata una pedina e la cella è vuota o è stata cliccata una pedina avversaria 
    if(lastClicked != null && pedina != 0 && pedina != turno){ 
        info.textContent = "You can't move the opponent's pieces!";
        return;
    }

    if(pedina != 0 && turno != pedina){
        info.textContent = "It's not your turn!";
        return;
    } 

    if(e.target.children[0] && !e.target.children[0].classList.contains('movable')){
        info.textContent = "You can't move this piece!";
        return;
    }

    // se lastClicked è diverso da null e quindi è stata cliccata una pedina
    if(lastClicked != null){    
        let lastpos = [lastClicked.target.parentNode.rowIndex, lastClicked.target.cellIndex];
        if(pos[0] == lastpos[0] && pos[1] == lastpos[1]) return; // se la cella cliccata è la stessa della precedente
        
        if (pedina != dame[lastpos[0]][lastpos[1]]) {
            if(moveDama(lastpos, pos)){
                lastClicked = null; 
                

                //controlla se quello che è stato appena fatto è stato un salto
                //in caso fai saltare la pedina ancora se possibile
                if (Math.abs(lastpos[0] - pos[0]) == 2) {
                    const newJumpsPos = getAvailableSalti(pos);
                    if(newJumpsPos.length === 0){
                        turno = turno == 1 ? 2 : 1;
                    }
                } else {
                    turno = turno == 1 ? 2 : 1;
                }
                highlightAvailable();
                info.textContent = "It's " + (turno == 2 ? "white's" : "black") + " turn";
            }
            return;
        }
        //se non ha fatto mosse ma ha cambiato pedina da muovere
        //rimuovi la selezione delle mosse disponibili
        lastClicked.target.children[0].classList.remove('selected');
        lastClicked = null;
        selectedcells.forEach((cell) => {
            cell.classList.remove('available');
        });
    }
    //se abbiamo soltato selezionato la pedian da muovere
    e.target.children[0].classList.add("selected");
    let availablepos = getAvailablePos(pos);
    
    if(availablepos.length != 0){
        let table = document.querySelector('table');
        for(let i = 0; i < availablepos.length; i++){
            table.children[availablepos[i][0]].children[availablepos[i][1]].classList.add('available');
            selectedcells.push(table.children[availablepos[i][0]].children[availablepos[i][1]]);
        }
        info.textContent = "Select one of the available cells";
    }else{
        info.textContent = 'There are no available moves';
    }
    lastClicked = e;
}

function createTable(){
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



function addPedine(){
    let table = document.querySelector('table');
    for(let i = 0; i < 8; i++){
        for(let j = 0; j < 8; j++){
            if(dame[i][j] == 1){
                let dama = document.createElement('span');
                dama.classList.add('dama');
                dama.classList.add('nera');
                table.children[i].children[j].appendChild(dama);
            }else if(dame[i][j] == 2){
                let dama = document.createElement('span');
                dama.classList.add('dama');
                dama.classList.add('bianca');
                table.children[i].children[j].appendChild(dama);
            }else if(dame[i][j] == 3){
                let dama = document.createElement('span');
                let crown = createCrownSvg('#e3dacc');
                dama.appendChild(crown);
                dama.classList.add('dama');
                dama.classList.add('nera');
                table.children[i].children[j].appendChild(dama);
            }else if(dame[i][j] == 4){
                let dama = document.createElement('span');
                let crown = createCrownSvg('#212121');
                dama.appendChild(crown);
                dama.classList.add('dama');
                dama.classList.add('bianca');
                table.children[i].children[j].appendChild(dama);
            }
            table.children[i].children[j].onclick = handleClick;
        }
    }
}

function posValid(x, y){
    if(x >= 0 && x <= 7 && y >= 0 && y <= 7){
        return true;
    }
    return false;
}

function getAvailableSalti(pos){
    let pedina = dame[pos[0]][pos[1]];
    let posInMezzo = [];
    let posSalto = [];

    if (pedina == 1) {
        posInMezzo = [
            [pos[0] + 1, pos[1] - 1],
            [pos[0] + 1, pos[1] + 1],
        ];
        posSalto = [
            [pos[0] + 2, pos[1] - 2],
            [pos[0] + 2, pos[1] + 2],
        ];
    } else {
        posInMezzo = [
            [pos[0] - 1, pos[1] - 1],
            [pos[0] - 1, pos[1] + 1],
        ];
        posSalto = [
            [pos[0] - 2, pos[1] - 2],
            [pos[0] - 2, pos[1] + 2],
        ];
    }

    if (pedina == 3 || pedina == 4) {
        posInMezzo.push(
            [pos[0] + 1, pos[1] - 1],
            [pos[0] + 1, pos[1] + 1]
        );
        posSalto.push(
            [pos[0] + 2, pos[1] - 2],
            [pos[0] + 2, pos[1] + 2]
        );
    }

    let posFinali = [];
    for(let i = 0; i < posSalto.length; i++){
        if(posValid(posSalto[i][0], posSalto[i][1]) && posValid(posInMezzo[i][0], posInMezzo[i][1])){
            let pedinaInMezzo = dame[posInMezzo[i][0]][posInMezzo[i][1]];
            if((dame[posSalto[i][0]][posSalto[i][1]] == 0) && (pedinaInMezzo != 0 && pedina != pedinaInMezzo)){
                posFinali.push([posSalto[i], posInMezzo[i]]);
            }
        }
    }
    return posFinali;
}

function getAvailableSpost(pos){
    let pedina = dame[pos[0]][pos[1]];
    let posDiagonali = [
        [pos[0] - 1, pos[1] + 1],
        [pos[0] - 1, pos[1] - 1],
    ];
    let posDama = [
        [pos[0] + 1, pos[1] + 1],
        [pos[0] + 1, pos[1] - 1]
    ];
    if(pedina == 1){
        posDiagonali = [
            [pos[0] + 1, pos[1] + 1], 
            [pos[0] + 1, pos[1] - 1]
        ];
        posDama = [
            [pos[0] - 1, pos[1] + 1],
            [pos[0] - 1, pos[1] - 1]
        ];
    }
    let posFinali = [];
    for(let i = 0; i < posDiagonali.length; i++){
        if(posValid(posDiagonali[i][0], posDiagonali[i][1])){
            if(dame[posDiagonali[i][0]][posDiagonali[i][1]] == 0){
                posFinali.push(posDiagonali[i]);
            }
        }
        if((pedina == 3 || pedina == 4) && posValid(posDama[i][0], posDama[i][1])){
            if(dame[posDama[i][0]][posDama[i][1]] == 0){
                posFinali.push(posDama[i]);
            }
        }
    }
    return posFinali;
}

function getAvailablePos(pos){
    let posFinali = [];
    let posSalti = getAvailableSalti(pos);
    if(posSalti.length > 0){
        posSalti.forEach((ped) => {
            posFinali.push(ped[0]);
        });  
        return posFinali;
    }
    let posSpost = getAvailableSpost(pos);
    return posSpost;
}

function moveDama(from, to){
    let damainiziale = dame[from[0]][from[1]];
    if((to[0] + to[1]) % 2 != 0){
        info.textContent = "Mossa non valida!";
        return false;
    };
    let pos1 = getAvailableSalti(from);
    let available = false;
    if(pos1.length > 0){
        for(let i = 0; i < pos1.length; i++){
            if((pos1[i][0][0] == to[0]) && (pos1[i][0][1] == to[1])){
                available = true;
                dame[pos1[i][1][0]][pos1[i][1][1]] = 0;
            }
        }
        if(!available){
            info.textContent = "Mossa non valida!";
            return false;
        }
    }else{
        let pos2 = getAvailableSpost(from);
        for(let i = 0; i < pos2.length; i++){
            if((pos2[i][0] == to[0]) && (pos2[i][1] == to[1]))
                available =  true;
        }
        if(!available){
            info.textContent = "Mossa non valida!";
            return false;
        }
    }
    dame[from[0]][from[1]] = 0;
    //azzerrare in caso di dama in mezzo
    console.log(to[0], damainiziale);
    if((to[0] == 7 && damainiziale == 1) || (to[0] == 0 && damainiziale == 2))
        damainiziale += 2;
    dame[to[0]][to[1]] = damainiziale;
    document.querySelector('table').remove();
    createTable();
    addPedine();

    return true;
}

const highlightAvailable = () => {
    const toHighlight = [];
    let mandatory = false;
    for(i = 0; i < dame.length; i++){
        for(j = 0; j < dame[i].length; j++){
            let pedina = dame[i][j] > 2 ? dame[i][j] - 2 : dame[i][j];
            if(pedina == 0 || pedina != turno) continue;
            const availablePos = getAvailablePos([i, j]);
            if(availablePos.length === 0 ) continue;
            const jumpPos = getAvailableSalti([i, j]);
            let found = false;
            for(let k = 0; k < availablePos.length; k++){
                for(let l = 0; l < jumpPos.length; l++){
                    if(availablePos[k][0] == jumpPos[l][0][0] && availablePos[k][1] == jumpPos[l][0][1]){
                        found = true;
                        break;
                    }
                }
                if(found){
                    if(!mandatory){
                        toHighlight.length = 0;
                        mandatory = true;
                    }
                    toHighlight.push([i, j]);
                    break;
                };
            }

            if(!mandatory){
                toHighlight.push([i, j]);
            }
        }
    }
    const table = document.querySelector('table');
    toHighlight.forEach(pos => {
        table.children[pos[0]].children[pos[1]].querySelector("span").classList.add('movable');
    });
}
const removeHighlights = () => {
    const highlights = document.querySelectorAll('.movable');
    highlights.forEach(highlight => {
        highlight.classList.remove('movable');
    });
}
window.onload = () => {
    createTable();
    addPedine();
    highlightAvailable();
    info = document.querySelector('.console > p');
    info.textContent = "It's white's turn";
};