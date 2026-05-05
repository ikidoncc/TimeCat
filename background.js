/**
 * TimeCat - Background Service Worker
 * 
 * Este script é o coração da extensão. Ele monitora a atividade das abas
 * e rastreia quanto tempo o usuário passa ativamente em cada uma.
 */

// Estado interno do monitoramento
let activeTabId = null;
let startTime = null;

/**
 * Inicia o cronômetro para uma aba específica.
 * @param {number} tabId 
 */
function startTracking(tabId) {
  // Se já estávamos rastreando a mesma aba, não resetamos (evita loops em alguns eventos)
  if (activeTabId === tabId) return;

  activeTabId = tabId;
  startTime = Date.now();
  
  console.log(`[TimeCat] Monitorando aba: ${tabId} iniciada em ${new Date(startTime).toLocaleTimeString()}`);
  
  // Aqui poderíamos salvar no chrome.storage se quiséssemos persistência entre reinicializações do worker
  chrome.storage.local.set({ 
    activeTabId: activeTabId, 
    startTime: startTime 
  });
}

/**
 * Interrompe o monitoramento atual.
 */
function stopTracking() {
  if (activeTabId === null) return;
  
  const duration = Math.floor((Date.now() - startTime) / 1000);
  console.log(`[TimeCat] Parou de monitorar aba: ${activeTabId}. Tempo total: ${duration}s`);
  
  activeTabId = null;
  startTime = null;
  
  chrome.storage.local.remove(['activeTabId', 'startTime']);
}

// 1. Detectar quando o usuário troca de aba
chrome.tabs.onActivated.addListener((activeInfo) => {
  // Ao trocar de aba, o tempo da aba anterior é "resetado" (conforme requisito)
  // e iniciamos a contagem para a nova aba.
  startTracking(activeInfo.tabId);
});

// 2. Detectar quando o foco da janela muda (ex: usuário minimiza o browser)
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser perdeu o foco total
    stopTracking();
  } else {
    // Browser ganhou foco, pegamos a aba ativa dessa janela
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs[0]) {
        startTracking(tabs[0].id);
      }
    });
  }
});

// 3. Monitorar atualizações na aba (como refresh ou navegação)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Se a aba foi atualizada e está ativa, garantimos que o monitoramento continue
  // No nosso caso, se o usuário navegar para outro site na mesma aba, 
  // o requisito de "resetar" pode ser interpretado como começar do zero.
  if (tab.active && changeInfo.status === 'complete') {
    // Opcional: Resetar o tempo ao navegar dentro da mesma aba
    // startTime = Date.now(); 
  }
});

/**
 * Verificação Periódica (Check Loop)
 * No Manifest V3, o service worker pode ser suspenso. 
 * Para extensões de bloqueio, geralmente usamos um intervalo enquanto o worker está vivo.
 */
setInterval(() => {
  if (activeTabId && startTime) {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    // Log para depuração (pode ser removido depois)
    // console.log(`Aba ${activeTabId} ativa por ${elapsedSeconds}s`);

    // Aqui será inserida a lógica de bloqueio no próximo passo
    // checkLimitAndBlock(elapsedSeconds);
  }
}, 1000);

// Inicialização: Verificar aba ativa ao carregar a extensão
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    startTracking(tabs[0].id);
  }
});
