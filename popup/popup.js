// popup.js

// Initialize Logger for Popup Context
TimeCatLogger.initGlobalHandlers('POPUP');

function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateStatus() {
    chrome.storage.local.get([
        'startTime', 
        'isBlocked', 
        'breakEndTime', 
        'usageLimit'
    ], (data) => {
        const now = Date.now();
        const usageLimit = data.usageLimit || (20 * 60); // Default 20 mins
        const statusLabel = document.getElementById('status-label');
        const timeDisplay = document.getElementById('usage-time');

        if (data.isBlocked) {
            statusLabel.innerText = "Break ends in:";
            const remaining = Math.ceil((data.breakEndTime - now) / 1000);
            timeDisplay.innerText = formatTime(remaining);
            timeDisplay.style.color = "#e74c3c"; // Red for break
        } else if (data.startTime) {
            statusLabel.innerText = "Time until next break:";
            const elapsed = Math.floor((now - data.startTime) / 1000);
            const remaining = usageLimit - elapsed;
            timeDisplay.innerText = formatTime(remaining);
            timeDisplay.style.color = "#3498db"; // Blue for usage
        } else {
            statusLabel.innerText = "Ready to start!";
            timeDisplay.innerText = formatTime(usageLimit);
            timeDisplay.style.color = "#27ae60"; // Green for ready
        }
    });
}

// Update every second
setInterval(updateStatus, 1000);
updateStatus();

document.getElementById('open-options').addEventListener('click', () => {
    TimeCatLogger.log('POPUP', 'Opening options page');
    chrome.runtime.openOptionsPage();
});
