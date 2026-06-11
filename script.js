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

// ==========================================
// CONFIGURAÇÃO COMPLETA DE FASES (1 ATÉ 20+)
// ==========================================
function getPhaseSettings(phase) {
    if (phase <= 3) {
        // Fases 1 a 3: Soma e Subtração de números baixos
        return { min: 1, max: 9, speed: 1.0 + (phase * 0.15), ops: ['+', '-'] };
    } else if (phase <= 5) {
        // Fases 4 e 5: Soma, Subtração, Vezes e Dividir (números baixos)
        return { min: 2, max: 9, speed: 1.4 + (phase * 0.1), ops: ['+', '-', '*', '/'] };
    } else if (phase <= 10) {
        // Fases 6 a 10: Números maiores
        return { min: 10, max: 30, speed: 1.8 + (phase * 0.08), ops: ['+', '-', '*', '/'] };
    } else if (phase <= 15) {
        // Fases 11 a 15: Números bem maiores
        return { min: 25, max: 70, speed: 2.2 + (phase * 0.05), ops: ['+', '-', '*', '/'] };
    } else if (phase <= 20) {
        // Fases 16 a 20: Desafio Ninja Avançado
        return { min: 50, max: 120, speed: 2.5 + (phase * 0.04), ops: ['+', '-', '*', '/'] };
    } else {
        // Modo Infinito (Pós Fase 20): Pequenas mudanças e evolução contínua
        return { min: 60 + phase, max: 130 + (phase * 2), speed: 3.3, ops: ['+', '-', '*', '/'] };
    }
}

// ==========================================
// MOTORES PRINCIPAIS (INICIALIZAÇÃO)
// ==========================================
function startGame() {
    clearTimeout(gameInterval);
    activeBlocks.forEach(b => b.element.remove());
    activeBlocks = [];
    
    setTimeout(() => {
        spawnBlock();
    }, 1000);
}

function spawnBlock() {
    if (lives <= 0) return;

    const settings = getPhaseSettings(currentPhase);
    const op = settings.ops[Math.floor(Math.random() * settings.ops.length)];
    
    let num1, num2, answer;
    let questionText = "";

    // Geração Inteligente baseada na Operação Sorteada
    if (op === '/') {
        // Garante divisão exata sem quebrar números: (Resultado * Divisor = Dividendo)
        let maxResult = settings.phase <= 5 ? 5 : 10;
        let divisor = Math.floor(Math.random() * (settings.max - settings.min + 1)) + settings.min;
        let simulatedResult = Math.floor(Math.random() * maxResult) + 2;
        
        num1 = divisor * simulatedResult;
        num2 = divisor;
        answer = simulatedResult;
        questionText = `${num1}÷${num2}`;
    } else if (op === '*') {
        // Simplifica a multiplicação para tabuadas aceitáveis por crianças
        num1 = Math.floor(Math.random() * (settings.max > 12 ? 10 : settings.max - settings.min + 1)) + settings.min;
        num2 = Math.floor(Math.random() * 9) + 2;
        answer = num1 * num2;
        questionText = `${num1}×${num2}`;
    } else {
        // Soma e Subtração Padrão
        num1 = Math.floor(Math.random() * (settings.max - settings.min + 1)) + settings.min;
        num2 = Math.floor(Math.random() * (settings.max - settings.min + 1)) + settings.min;
        
        if (op === '-') {
            if (num1 < num2) { let temp = num1; num1 = num2; num2 = temp; }
            answer = num1 - num2;
            questionText = `${num1}-${num2}`;
        } else {
            answer = num1 + num2;
            questionText = `${num1}+${num2}`;
        }
    }

    // Criar elemento visual do bloco na tela
    const blockEl = document.createElement('div');
    blockEl.className = 'falling-block';
    blockEl.textContent = questionText;
    
    gameScreen.appendChild(blockEl);

    let maxLeft = gameScreen.clientWidth - blockEl.clientWidth - 15;
    if (maxLeft < 0) maxLeft = 10;
    let randomLeft = Math.floor(Math.random() * maxLeft);
    
    blockEl.style.left = `${randomLeft}px`;
    blockEl.style.top = '0px';

    const blockObj = {
        element: blockEl,
        answer: answer,
        top: 0,
        speed: settings.speed
    };

    activeBlocks.push(blockObj);

    // Ajuste dinâmico do tempo de spawn baseado na fase
    let nextSpawnTime = Math.max(1500, 4800 - (currentPhase * 200));
    gameInterval = setTimeout(spawnBlock, nextSpawnTime);
}

function updateGame() {
    if (lives <= 0) return;

    for (let i = activeBlocks.length - 1; i >= 0; i--) {
        let block = activeBlocks[i];
        block.top += block.speed;
        block.element.style.top = `${block.top}px`;

        if (block.top >= gameScreen.clientHeight - block.element.clientHeight) {
            block.element.remove();
            activeBlocks.splice(i, 1);
            loseLife();
        }
    }
    requestAnimationFrame(updateGame);
}

// ==========================================
// CONTROLES E DIGITAÇÃO (DESTRAVADO)
// ==========================================
function pressKey(key) {
    if (key === 'C') {
        currentAnswer = "";
    } else if (key === 'BACK') {
        currentAnswer = currentAnswer.slice(0, -1);
    } else {
        if (currentAnswer.length < 6) {
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
        activeBlocks[foundIndex].element.remove();
        activeBlocks.splice(foundIndex, 1);
        
        score += 5; 
        scoreEl.textContent = score;
        
        currentAnswer = "";
        displayEl.textContent = "?";

        checkPhaseProgress();
    } else {
        currentAnswer = "";
        displayEl.textContent = "?";
    }
}

function checkPhaseProgress() {
    // Avança de fase a cada 30 pontos acumulados
    let targetPhase = Math.floor(score / 30) + 1;
    
    if (targetPhase > currentPhase) {
        currentPhase = targetPhase;
        if (currentPhase <= 20) {
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
        alert(`Fim de Jogo! 🥷\nVocê chegou à ${phaseEl.textContent} e acumulou ${score} moedas!`);
        resetGame();
    }
}

// ==========================================
// LOJA VIRTUAL NINJA
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
            alert("Comprou 1 Vida Extra! ❤️");
        } else {
            alert("Suas vidas já estão cheias!");
        }
    } else {
        alert("Precisa de 15 moedas ⭐ para comprar vida.");
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

window.onload = () => {
    startGame();
    requestAnimationFrame(updateGame);
};
