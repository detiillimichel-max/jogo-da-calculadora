// ==========================================
// ESTADO DO JOGO NINJA
// ==========================================
let score = 0;
let lives = 3;
let currentPhase = 1;
let isInfiniteMode = false;
let currentAnswer = "";
let gameInterval = null;
let activeBlocks = [];

// Elementos da Interface (DOM)
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const phaseEl = document.getElementById('phase-display');
const displayEl = document.getElementById('calc-display');
const gameScreen = document.getElementById('game-screen');
const shopModal = document.getElementById('shop-modal');

// Configurações das 10 Fases Iniciais (Matemática Educativa)
const phaseSettings = {
    1: { min: 1, max: 5, speed: 1.2, op: '+' },
    2: { min: 1, max: 10, speed: 1.5, op: '+' },
    3: { min: 5, max: 12, speed: 1.7, op: '-' },
    4: { min: 10, max: 20, speed: 1.9, op: '-' },
    5: { min: 2, max: 5, speed: 1.8, op: '*' },
    6: { min: 10, max: 25, speed: 2.1, op: '+' },
    7: { min: 15, max: 35, speed: 2.3, op: '-' },
    8: { min: 3, max: 7, speed: 2.4, op: '*' },
    9: { min: 20, max: 45, speed: 2.6, op: '+' },
    10: { min: 25, max: 60, speed: 2.8, op: '-' }
};

// ==========================================
// MOTORES PRINCIPAIS (INICIALIZAÇÃO)
// ==========================================
function startGame() {
    clearTimeout(gameInterval);
    activeBlocks.forEach(b => b.element.remove());
    activeBlocks = [];
    
    // Pequeno atraso para garantir o carregamento do layout mobile
    setTimeout(() => {
        spawnBlock();
    }, 1000);
}

function spawnBlock() {
    if (lives <= 0) return;

    let min, max, speed, op;

    if (!isInfiniteMode) {
        const settings = phaseSettings[currentPhase] || phaseSettings[1];
        min = settings.min;
        max = settings.max;
        speed = settings.speed;
        op = settings.op;
    } else {
        // Modo Infinito (Pós Fase 10)
        min = 10 + currentPhase;
        max = 50 + (currentPhase * 2);
        speed = 2.8 + (currentPhase * 0.1);
        const ops = ['+', '-', '*'];
        op = ops[Math.floor(Math.random() * ops.length)];
    }

    let num1 = Math.floor(Math.random() * (max - min + 1)) + min;
    let num2 = Math.floor(Math.random() * (max - min + 1)) + min;

    // Evita resultados negativos para manter divertido e educativo
    if (op === '-' && num1 < num2) {
        let temp = num1;
        num1 = num2;
        num2 = temp;
    }

    let questionText = `${num1}${op === '*' ? '×' : op}${num2}`;
    let answer = 0;
    if (op === '+') answer = num1 + num2;
    if (op === '-') answer = num1 - num2;
    if (op === '*') answer = num1 * num2;

    // Criar o bloco visualmente
    const blockEl = document.createElement('div');
    blockEl.className = 'falling-block';
    blockEl.textContent = questionText;
    
    gameScreen.appendChild(blockEl);

    // Ajuste de largura para telas mobile
    let maxLeft = gameScreen.clientWidth - blockEl.clientWidth - 15;
    if (maxLeft < 0) maxLeft = 10;
    let randomLeft = Math.floor(Math.random() * maxLeft);
    
    blockEl.style.left = `${randomLeft}px`;
    blockEl.style.top = '0px';

    const blockObj = {
        element: blockEl,
        answer: answer,
        top: 0,
        speed: speed
    };

    activeBlocks.push(blockObj);

    // Tempo de surgimento do próximo bloco
    let nextSpawnTime = Math.max(1800, 4500 - (currentPhase * 250));
    gameInterval = setTimeout(spawnBlock, nextSpawnTime);
}

// Loop de Atualização de Quadros (Queda dos blocos)
function updateGame() {
    if (lives <= 0) return;

    for (let i = activeBlocks.length - 1; i >= 0; i--) {
        let block = activeBlocks[i];
        block.top += block.speed;
        block.element.style.top = `${block.top}px`;

        // Se passar do limite da linha tracejada vermelha
        if (block.top >= gameScreen.clientHeight - block.element.clientHeight) {
            block.element.remove();
            activeBlocks.splice(i, 1);
            loseLife();
        }
    }
    requestAnimationFrame(updateGame);
}

// ==========================================
// CONTROLES E ENTRADAS DO JOGADOR
// ==========================================
function pressKey(key) {
    if (key === 'C') {
        currentAnswer = "";
    } else if (key === 'BACK') {
        currentAnswer = currentAnswer.slice(0, -1);
    } else {
        if (currentAnswer.length < 5) {
            currentAnswer += key;
        }
    }
    displayEl.textContent = currentAnswer === "" ? "?" : currentAnswer;
}

function checkAnswer() {
    let playerNum = parseInt(currentAnswer);
    if (isNaN(playerNum)) return;

    let foundIndex = activeBlocks.findIndex(b => b.answer === playerNum);

    if (foundIndex !== -1) {
        // Acertou o alvo ninja!
        activeBlocks[foundIndex].element.remove();
        activeBlocks.splice(foundIndex, 1);
        
        score += 5; 
        scoreEl.textContent = score;
        
        currentAnswer = "";
        displayEl.textContent = "?";

        checkPhaseProgress();
    } else {
        // Se errar, limpa o painel para digitação rápida
        currentAnswer = "";
        displayEl.textContent = "?";
    }
}

function checkPhaseProgress() {
    // Avança de fase a cada 30 pontos (6 acertos)
    let targetPhase = Math.floor(score / 30) + 1;
    
    if (targetPhase > currentPhase) {
        currentPhase = targetPhase;
        if (currentPhase <= 10) {
            phaseEl.textContent = `Fase ${currentPhase}`;
        } else {
            isInfiniteMode = true;
            phaseEl.textContent = `Modo Infinito (${currentPhase})`;
        }
    }
}

function loseLife() {
    lives--;
    livesEl.textContent = `${lives}/3`;
    if (lives <= 0) {
        alert(`Fim de Jogo! 🥷\nVocê alcançou a ${phaseEl.textContent} e coletou ${score} estrelas!`);
        resetGame();
    }
}

// ==========================================
// SISTEMA DA LOJA NINJA
// ==========================================
function toggleShop(open) {
    shopModal.style.display = open ? 'flex' : 'none';
}

function buyLife() {
    if (score >= 15) {
        if (lives < 3) {
            score -= 15;
            lives++;
            scoreEl.textContent = score;
            livesEl.textContent = `${lives}/3`;
            alert("Vida restaurada com sucesso! ❤️");
        } else {
            alert("Sua vida já está no limite máximo (3/3)!");
        }
    } else {
        alert("Estrelas insuficientes! Junte 15 ⭐ para comprar.");
    }
}

function resetGame() {
    score = 0;
    lives = 3;
    currentPhase = 1;
    isInfiniteMode = false;
    currentAnswer = "";
    scoreEl.textContent = score;
    livesEl.textContent = "3/3";
    phaseEl.textContent = "Fase 1";
    displayEl.textContent = "?";
    startGame();
}

// Inicialização automática do Jogo
window.onload = () => {
    startGame();
    requestAnimationFrame(updateGame);
};
         
