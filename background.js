/**
 * TimeCat - Background Service Worker
 * 
 * Este script é o coração da extensão. Ele monitora a atividade das abas
 * e rastreia quanto tempo o usuário passa ativamente em cada uma.
 */

// Estado interno do monitoramento
let activeTabId = null;
let startTime = null;
let isBlocked = false;
let breakEndTime = null;

// Configurações padrão (em segundos)
const DEFAULTS = {
  usageLimit: 20 * 60, // 20 minutos
  breakDuration: 5 * 60 // 5 minutos
};

/**
 * Recupera as configurações do usuário ou usa os padrões.
 */
async function getSettings() {
  const settings = await chrome.storage.local.get(['usageLimit', 'breakDuration']);
  return {
    usageLimit: settings.usageLimit || DEFAULTS.usageLimit,
    breakDuration: settings.breakDuration || DEFAULTS.breakDuration
  };
}

/**
 * Inicia o cronômetro para uma aba específica.
 */
function startTracking(tabId) {
  if (isBlocked) {
    // Se estiver no período de pausa, garante que a nova aba também seja bloqueada
    chrome.tabs.sendMessage(tabId, { action: "block_page" }).catch(() => {});
    return;
  }

  if (activeTabId === tabId) return;

  activeTabId = tabId;
  startTime = Date.now();
  
  console.log(`[TimeCat] Monitoring tab: ${tabId} started at ${new Date(startTime).toLocaleTimeString()}`);
  
  chrome.storage.local.set({ activeTabId, startTime });
}

/**
 * Interrompe o monitoramento atual.
 */
function stopTracking() {
  if (activeTabId === null || isBlocked) return;
  
  activeTabId = null;
  startTime = null;
  
  chrome.storage.local.remove(['activeTabId', 'startTime']);
}

/**
 * Ativa o estado de bloqueio.
 */
async function activateBlock() {
  isBlocked = true;
  const { breakDuration } = await getSettings();
  breakEndTime = Date.now() + (breakDuration * 1000);

  // Notifica todas as abas (ou apenas a ativa) para mostrar o overlay
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, { action: "block_page" }).catch(() => {});
  });

  console.log(`[TimeCat] BLOCK ACTIVATED. Ends at: ${new Date(breakEndTime).toLocaleTimeString()}`);
}

/**
 * Desativa o estado de bloqueio.
 */
async function deactivateBlock() {
  isBlocked = false;
  breakEndTime = null;
  
  // Reinicia o tempo para a aba atual
  startTime = Date.now();

  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, { action: "unblock_page" }).catch(() => {});
  });

  console.log(`[TimeCat] BLOCK DEACTIVATED. Resetting usage timer.`);
}

// 1. Detectar quando o usuário troca de aba
chrome.tabs.onActivated.addListener((activeInfo) => {
  startTracking(activeInfo.tabId);
});

// 2. Detectar quando o foco da janela muda
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTracking();
  } else {
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs[0]) startTracking(tabs[0].id);
    });
  }
});

/**
 * Loop principal de verificação e atualização do Countdown
 */
setInterval(async () => {
  const now = Date.now();

  if (isBlocked) {
    const remainingMs = breakEndTime - now;
    
    if (remainingMs <= 0) {
      await deactivateBlock();
    } else {
      // Enviar atualização do countdown para as abas
      const secondsLeft = Math.ceil(remainingMs / 1000);
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: "update_countdown", 
          secondsLeft 
        }).catch(() => {});
      });
    }
    return;
  }

  // Lógica de monitoramento de uso
  if (activeTabId && startTime) {
    const { usageLimit } = await getSettings();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    
    if (elapsedSeconds >= usageLimit) {
      await activateBlock();
    }
  }
}, 1000);

// Inicialização
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) startTracking(tabs[0].id);
});

