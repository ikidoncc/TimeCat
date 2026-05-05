// popup.js

// Initialize Logger for Popup Context
TimeCatLogger.initGlobalHandlers('POPUP');

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function renderLogs() {
    const logs = await TimeCatLogger.getLogs();
    const container = document.getElementById('log-container');
    if (!container) return;

    container.innerHTML = logs.reverse().map(log => `
        <div class="log-entry">
            <span class="log-time">[${log.time.split('T')[1].split('.')[0]}]</span>
            <span class="log-context ${log.context === 'ERROR' ? 'error' : ''}">[${log.context}]</span>
            <span class="log-message">${log.message}</span>
        </div>
    `).join('');
}

function updateStatus() {
    chrome.storage.local.get(['startTime', 'activeTabId'], (data) => {
        if (data.startTime) {
            const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
            document.getElementById('usage-time').innerText = formatTime(elapsed);
        } else {
            document.getElementById('usage-time').innerText = "00:00";
        }
    });
    renderLogs();
}

// Update every second
setInterval(updateStatus, 1000);
updateStatus();

document.getElementById('open-options').addEventListener('click', () => {
    TimeCatLogger.log('POPUP', 'Opening options page');
    chrome.runtime.openOptionsPage();
});

document.getElementById('clear-logs').addEventListener('click', async () => {
    await TimeCatLogger.clearLogs();
    renderLogs();
});
