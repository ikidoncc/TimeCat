// popup.js

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
}

// Update every second
setInterval(updateStatus, 1000);
updateStatus();

document.getElementById('open-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});
