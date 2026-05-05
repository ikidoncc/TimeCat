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

  await broadcastMessage({ action: "block_page" });
  console.log(`[TimeCat] BLOCK ACTIVATED. Ends at: ${new Date(breakEndTime).toLocaleTimeString()}`);
}

/**
 * Desativa o estado de bloqueio.
 */
async function deactivateBlock() {
  isBlocked = false;
  breakEndTime = null;
  startTime = Date.now();

  await broadcastMessage({ action: "unblock_page" });
  console.log(`[TimeCat] BLOCK DEACTIVATED. Resetting usage timer.`);
}

/**
 * Escuta pedidos de sincronização de novas abas
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "request_status") {
    const now = Date.now();
    const secondsLeft = isBlocked ? Math.ceil((breakEndTime - now) / 1000) : 0;
    sendResponse({ isBlocked, secondsLeft });
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

