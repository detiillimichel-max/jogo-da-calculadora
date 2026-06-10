const operationScreen = document.getElementById('operation');
const resultScreen = document.getElementById('result');

let currentInput = '';
let previousInput = '';
let operator = null;
let shouldResetScreen = false;

function appendNumber(number) {
    if (resultScreen.textContent === '0' || shouldResetScreen) {
        resetScreen();
    }
    // Evita múltiplos pontos decimais
    if (number === '.' && resultScreen.textContent.includes('.')) return;
    
    currentInput += number;
    resultScreen.textContent = currentInput;
}

function resetScreen() {
    resultScreen.textContent = '';
    shouldResetScreen = false;
}

function clearScreen() {
    currentInput = '';
    previousInput = '';
    operator = null;
    resultScreen.textContent = '0';
    operationScreen.textContent = '';
}

function deleteLast() {
    if (shouldResetScreen) return;
    currentInput = currentInput.toString().slice(0, -1);
    if (currentInput === '') {
        resultScreen.textContent = '0';
    } else {
        resultScreen.textContent = currentInput;
    }
}

function appendOperator(op) {
    if (operator !== null) calculate();
    previousInput = resultScreen.textContent;
    operator = op;
    operationScreen.textContent = `${previousInput} ${convertOperator(op)}`;
    shouldResetScreen = true;
    currentInput = '';
}

function convertOperator(op) {
    if (op === '*') return '×';
    if (op === '/') return '÷';
    return op;
}

function calculate() {
    if (operator === null || shouldResetScreen) return;
    if (operator === '/' && resultScreen.textContent === '0') {
        resultScreen.textContent = "Erro (Div por 0)";
        currentInput = '';
        operator = null;
        return;
    }

    let result;
    const prev = parseFloat(previousInput);
    const current = parseFloat(resultScreen.textContent);

    switch (operator) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '*': result = prev * current; break;
        case '/': result = prev / current; break;
        default: return;
    }

    // Corrige problemas de precisão decimal (ex: 0.1 + 0.2)
    result = Math.round(result * 100000000) / 100000000;

    operationScreen.textContent = `${previousInput} ${convertOperator(operator)} ${current} =`;
    resultScreen.textContent = result;
    currentInput = result;
    operator = null;
}
