// options.js

// Carrega as configurações ao abrir a página
document.addEventListener('DOMContentLoaded', () => {
    // Valores padrão em segundos (conforme background.js) convertidos para minutos para exibição
    chrome.storage.local.get({
        usageLimit: 20 * 60,
        breakDuration: 5 * 60
    }, (items) => {
        document.getElementById('usageLimit').value = items.usageLimit / 60;
        document.getElementById('breakDuration').value = items.breakDuration / 60;
    });
});

// Salva as configurações
document.getElementById('save').addEventListener('click', () => {
    const usageLimit = parseInt(document.getElementById('usageLimit').value) * 60;
    const breakDuration = parseInt(document.getElementById('breakDuration').value) * 60;

    if (isNaN(usageLimit) || isNaN(breakDuration) || usageLimit <= 0 || breakDuration <= 0) {
        showStatus('Please enter valid positive numbers.', '#e74c3c');
        return;
    }

    chrome.storage.local.set({
        usageLimit,
        breakDuration
    }, () => {
        showStatus('Settings saved successfully! 🐾');
    });
});

/**
 * Exibe uma mensagem de status temporária
 */
function showStatus(message, color = '#27ae60') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.style.color = color;
    status.style.opacity = '1';

    setTimeout(() => {
        status.style.opacity = '0';
    }, 2000);
}
