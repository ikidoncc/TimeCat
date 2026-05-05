/**
 * TimeCat Logger Utility
 * 
 * Provides centralized, persistent logging across Background, Content, and Popup contexts.
 */

const LOG_LIMIT = 200;

const Logger = {
    /**
     * Primary log function
     * @param {string} context - BACKGROUND, CONTENT, POPUP, or ERROR
     * @param {string} message - The log message
     * @param {any} data - Optional additional data
     */
    async log(context, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            time: timestamp,
            context: context.toUpperCase(),
            message: message,
            data: data
        };

        // Output to console for immediate visibility
        const consoleMsg = `[${timestamp}] [${logEntry.context}] ${message}`;
        if (logEntry.context === 'ERROR') {
            console.error(consoleMsg, data || '');
        } else {
            console.log(consoleMsg, data || '');
        }

        // Persist to chrome.storage
        try {
            const result = await chrome.storage.local.get({ logs: [] });
            let logs = result.logs;
            
            logs.push(logEntry);
            
            // Limit history
            if (logs.length > LOG_LIMIT) {
                logs = logs.slice(-LOG_LIMIT);
            }

            await chrome.storage.local.set({ logs });
        } catch (e) {
            console.error('Failed to save log to storage', e);
        }
    },

    /**
     * Clears all logs from storage
     */
    async clearLogs() {
        await chrome.storage.local.set({ logs: [] });
        console.log('[TimeCat] Logs cleared.');
    },

    /**
     * Retrieves all logs from storage
     */
    async getLogs() {
        const result = await chrome.storage.local.get({ logs: [] });
        return result.logs;
    },

    /**
     * Sets up global error listeners for the current context
     */
    initGlobalHandlers(context) {
        // Use self which works in both Window and Worker contexts
        self.onerror = (message, source, lineno, colno, error) => {
            this.log('ERROR', `Global Error: ${message}`, { source, lineno, colno, stack: error?.stack });
        };

        self.onunhandledrejection = (event) => {
            this.log('ERROR', `Unhandled Promise Rejection: ${event.reason}`, { stack: event.reason?.stack });
        };
        
        this.log(context, `Logger initialized for ${context}`);
    }
};

// Export for Background/Popup (ES Modules) or attach to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
} else {
    // self is the safest way to target the global scope in any extension context
    self.TimeCatLogger = Logger;
}
