/**
 * TimeCat - Content Script
 * 
 * Este script é injetado nas páginas web para criar e gerenciar o overlay de bloqueio.
 */

let overlayElement = null;
let observer = null;
let isBlockActive = false;

/**
 * Cria o elemento de overlay se ele ainda não existir.
 */
function createOverlay() {
    if (document.getElementById('time-cat-blocking-overlay')) return;

    overlayElement = document.createElement('div');
    overlayElement.id = 'time-cat-blocking-overlay';
    overlayElement.className = 'time-cat-overlay';
    
    overlayElement.innerHTML = `
        <div class="time-cat-content">
            <h1 class="time-cat-title">Time to Pause! 🐾</h1>
            <p class="time-cat-message">You've reached your continuous usage limit. Take a short break.</p>
            <div id="time-cat-timer" style="font-size: 2rem; font-weight: bold;">--:--</div>
        </div>
    `;

    // Inserir como o primeiro filho do body ou documentElement para maior prioridade
    (document.body || document.documentElement).appendChild(overlayElement);
    document.body.classList.add('time-cat-blocked');

    // Bloqueio extra: impedir propagação de eventos de teclado
    window.addEventListener('keydown', blockEvents, true);
    window.addEventListener('keyup', blockEvents, true);
    window.addEventListener('keypress', blockEvents, true);

    startAntiBypass();
}

/**
 * Remove o overlay e restaura a interação.
 */
function removeOverlay() {
    isBlockActive = false;
    stopAntiBypass();

    const el = document.getElementById('time-cat-blocking-overlay');
    if (el) el.remove();
    overlayElement = null;
    
    document.body.classList.remove('time-cat-blocked');
    
    window.removeEventListener('keydown', blockEvents, true);
    window.removeEventListener('keyup', blockEvents, true);
    window.removeEventListener('keypress', blockEvents, true);
}

/**
 * Estratégia Anti-Bypass: MutationObserver
 * Detecta se alguém tentar remover o overlay ou a classe do body.
 */
function startAntiBypass() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
        if (!isBlockActive) return;

        for (const mutation of mutations) {
            // Se o overlay for removido, recria
            if (!document.getElementById('time-cat-blocking-overlay')) {
                createOverlay();
            }
            // Se a classe do body for removida, readiciona
            if (!document.body.classList.contains('time-cat-blocked')) {
                document.body.classList.add('time-cat-blocked');
            }
        }
    });

    observer.observe(document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true
    });

    // Verificação secundária periódica (fail-safe)
    const heartbeat = setInterval(() => {
        if (!isBlockActive) {
            clearInterval(heartbeat);
            return;
        }
        if (!document.getElementById('time-cat-blocking-overlay')) createOverlay();
        if (!document.body.classList.contains('time-cat-blocked')) document.body.classList.add('time-cat-blocked');
    }, 1000);
}

function stopAntiBypass() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
}

/**
 * Função para capturar e anular eventos indesejados.
 */
function blockEvents(event) {
    if (isBlockActive) {
        event.stopImmediatePropagation();
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
            isBlockActive = true;
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
        isBlockActive = true;
        createOverlay();
    } else if (request.action === "unblock_page") {
        removeOverlay();
    } else if (request.action === "update_countdown") {
        isBlockActive = true;
        const timerElement = document.getElementById('time-cat-timer');
        if (timerElement) {
            timerElement.innerText = formatTime(request.secondsLeft);
        } else {
            createOverlay();
        }
    }
});


