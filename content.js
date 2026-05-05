/**
 * TimeCat - Content Script
 * 
 * Este script é injetado nas páginas web para criar e gerenciar o overlay de bloqueio.
 */

let overlayElement = null;

/**
 * Cria o elemento de overlay se ele ainda não existir.
 */
function createOverlay() {
    if (overlayElement) return;

    overlayElement = document.createElement('div');
    overlayElement.id = 'time-cat-blocking-overlay';
    overlayElement.className = 'time-cat-overlay';
    
    overlayElement.innerHTML = `
        <div class="time-cat-content">
            <h1 class="time-cat-title">Time to Pause! 🐾</h1>
            <p class="time-cat-message">You've reached your continuous usage limit. Take a short break.</p>
            <div id="time-cat-timer" style="font-size: 2rem; font-weight: bold;"></div>
        </div>
    `;

    document.body.appendChild(overlayElement);
    document.body.classList.add('time-cat-blocked');

    // Bloqueio extra: impedir propagação de eventos de teclado
    window.addEventListener('keydown', blockEvents, true);
    window.addEventListener('keyup', blockEvents, true);
    window.addEventListener('keypress', blockEvents, true);
}

/**
 * Remove o overlay e restaura a interação.
 */
function removeOverlay() {
    if (overlayElement) {
        overlayElement.remove();
        overlayElement = null;
    }
    document.body.classList.remove('time-cat-blocked');
    
    window.removeEventListener('keydown', blockEvents, true);
    window.removeEventListener('keyup', blockEvents, true);
    window.removeEventListener('keypress', blockEvents, true);
}

/**
 * Função para capturar e anular eventos indesejados.
 */
function blockEvents(event) {
    if (overlayElement) {
        event.stopPropagation();
        // Não usamos preventDefault() em tudo para não quebrar o browser, 
        // mas o stopPropagation garante que o site por baixo não receba o comando.
    }
}

/**
 * Formata segundos em MM:SS
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Inicialização: Sincroniza o estado atual com o background script.
 */
function initialize() {
    chrome.runtime.sendMessage({ action: "request_status" }, (response) => {
        if (chrome.runtime.lastError) return;
        
        if (response && response.isBlocked) {
            createOverlay();
            const timerElement = document.getElementById('time-cat-timer');
            if (timerElement) {
                timerElement.innerText = formatTime(response.secondsLeft);
            }
        }
    });
}

// Executa a inicialização assim que o script for injetado
initialize();

/**
 * Escuta mensagens do Background Service Worker
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === "block_page") {
        createOverlay();
    } else if (request.action === "unblock_page") {
        removeOverlay();
    } else if (request.action === "update_countdown") {
        const timerElement = document.getElementById('time-cat-timer');
        if (timerElement) {
            timerElement.innerText = formatTime(request.secondsLeft);
        } else if (!overlayElement) {
            // Caso o overlay não exista mas recebemos atualização, garantimos o bloqueio
            createOverlay();
        }
    }
});

