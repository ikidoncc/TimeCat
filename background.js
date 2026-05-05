/**
 * TimeCat - Background Service Worker
 */

importScripts('utils/logger.js');

// Initialize Logger for Background
TimeCatLogger.initGlobalHandlers('BACKGROUND');

// Estado interno do monitoramento
let activeTabId = null;
let startTime = null;
let isBlocked = false;
let breakEndTime = null;

// Inicializa o estado a partir do storage
chrome.storage.local.get(['activeTabId', 'startTime', 'isBlocked', 'breakEndTime'], (data) => {
  activeTabId = data.activeTabId || null;
  startTime = data.startTime || null;
  isBlocked = data.isBlocked || false;
  breakEndTime = data.breakEndTime || null;
  
  TimeCatLogger.log('BACKGROUND', 'State initialized from storage', { isBlocked, startTime });
});

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

  const tabChanged = activeTabId !== tabId;
  const isNewSession = startTime === null;

  if (tabChanged || isNewSession) {
    activeTabId = tabId;
    
    if (isNewSession) {
      startTime = Date.now();
      TimeCatLogger.log('BACKGROUND', `New session started on tab: ${tabId}`);
    }
    
    chrome.storage.local.set({ activeTabId, startTime });
  }
}

/**
 * Interrompe o monitoramento atual.
 */
function stopTracking() {
  if (isBlocked) return;
  
  TimeCatLogger.log('BACKGROUND', `Stopped monitoring tab: ${activeTabId}`);
  
  activeTabId = null;
  // Não limpamos o startTime aqui para que a sessão continue ao focar novamente
  chrome.storage.local.set({ activeTabId });
}

/**
 * Notifica todas as abas sobre uma mudança de estado ou atualização.
 */
async function broadcastMessage(message) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    // Verificamos se a URL é válida para evitar erro em páginas do sistema (chrome://)
    if (tab.url && (tab.url.startsWith('http') || tab.url.startsWith('https'))) {
      chrome.tabs.sendMessage(tab.id, message).catch(err => {
        // Silenciosamente ignora abas onde o content script ainda não carregou
      });
    }
  }
}

/**
 * Ativa o estado de bloqueio.
 */
async function activateBlock() {
  isBlocked = true;
  const { breakDuration } = await getSettings();
  breakEndTime = Date.now() + (breakDuration * 1000);

  await chrome.storage.local.set({ isBlocked, breakEndTime });

  TimeCatLogger.log('BACKGROUND', 'BLOCK ACTIVATED', { duration: breakDuration });

  await broadcastMessage({ action: "block_page" });
}

/**
 * Desativa o estado de bloqueio.
 */
async function deactivateBlock() {
  isBlocked = false;
  breakEndTime = null;
  startTime = Date.now();

  await chrome.storage.local.set({ 
    isBlocked, 
    breakEndTime, 
    startTime 
  });

  TimeCatLogger.log('BACKGROUND', 'BLOCK DEACTIVATED');

  await broadcastMessage({ action: "unblock_page" });
}

/**
 * Escuta pedidos de sincronização de novas abas
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "request_status") {
    const now = Date.now();
    const secondsLeft = isBlocked ? Math.max(0, Math.ceil((breakEndTime - now) / 1000)) : 0;
    sendResponse({ isBlocked, secondsLeft });
  }
  return true; // Mantém o canal aberto para respostas assíncronas
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
      const secondsLeft = Math.ceil(remainingMs / 1000);
      await broadcastMessage({ 
        action: "update_countdown", 
        secondsLeft 
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

// Listeners para mudanças de aba e janela
chrome.tabs.onActivated.addListener((activeInfo) => {
  startTracking(activeInfo.tabId);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTracking();
  } else {
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs[0]) startTracking(tabs[0].id);
    });
  }
});

