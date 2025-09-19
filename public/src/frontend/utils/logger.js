export class FloresYaLogger {
    constructor() {
        this.levels = {};
        this.sessionId = '';
        this.logs = [];
        this.maxLogs = 500;
        this.context = {};
        this.isDevMode = false;
        this.logLevel = 'ERROR';
        this.endpoint = '';
        this.init();
    }
    init() {
        this.levels = {
            ERROR: { value: 0, color: '#dc3545', icon: '❌', method: 'error' },
            WARN: { value: 1, color: '#ffc107', icon: '⚠️', method: 'warn' },
            INFO: { value: 2, color: '#0dcaf0', icon: 'ℹ️', method: 'info' },
            DEBUG: { value: 3, color: '#6f42c1', icon: '🐛', method: 'log' },
            SUCCESS: { value: 2, color: '#198754', icon: '✅', method: 'log' },
            API: { value: 2, color: '#0d6efd', icon: '🌐', method: 'log' },
            USER: { value: 2, color: '#fd7e14', icon: '👤', method: 'log' },
            CART: { value: 2, color: '#20c997', icon: '🛒', method: 'log' },
            PERF: { value: 2, color: '#6610f2', icon: '⚡', method: 'log' }
        };
        this.sessionId = this.generateSessionId();
        this.logs = [];
        this.maxLogs = 500;
        this.context = {};
        this.isDevMode = window.location.hostname === 'localhost' ||
            localStorage.getItem('floresya_dev_mode') === 'true';
        this.endpoint = '/api/logs/frontend';
        this.endpointExists = undefined;
        if (this.isDevMode) {
            this.monitorFetch();
            this.observeDOM();
            this.showDebugPanel();
        }
        this.setupGlobalErrorHandling();
        this.setupPageLifecycleTracking();
        this.success('SYSTEM', 'Frontend Logger initialized', {
            sessionId: this.sessionId,
            logLevel: this.logLevel,
            url: window.location.href,
            devMode: this.isDevMode
        });
    }
    generateSessionId() {
        return `floresya_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.error('GLOBAL', 'JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack
            });
        });
        window.addEventListener('unhandledrejection', (event) => {
            this.error('GLOBAL', 'Unhandled Promise Rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });
    }
    setupPageLifecycleTracking() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.info('PAGE', 'DOM Content Loaded', {
                    url: window.location.href,
                    referrer: document.referrer,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
            });
        }
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.info('PAGE', 'Page visibility changed to hidden', {
                    hidden: document.hidden,
                    timestamp: new Date().toISOString()
                });
            }
        });
        window.addEventListener('beforeunload', () => {
            this.info('PAGE', 'Page unloading', {
                url: window.location.href,
                timestamp: new Date().toISOString()
            });
            this.sendLogs();
        });
    }
    monitorFetch() {
        if (!this.isDevMode)
            return;
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0] instanceof Request ? args[0].url : args[0];
            const method = args[1]?.method || 'GET';
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                if (!response.ok) {
                    this.warn('FETCH', `${method} ${url} - Failed`, {
                        status: response.status,
                        statusText: response.statusText,
                        duration: Math.round(endTime - startTime)
                    });
                }
                return response;
            }
            catch (error) {
                const endTime = performance.now();
                this.error('FETCH', `${method} ${url} - Failed`, {
                    error: error instanceof Error ? error.message : String(error),
                    duration: Math.round(endTime - startTime)
                });
                throw error;
            }
        };
    }
    observeDOM() {
        return;
    }
    showDebugPanel() {
        if (localStorage.getItem('floresya_debug_panel') === 'true') {
            const panel = document.createElement('div');
            panel.id = 'floresya-debug-panel';
            panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        height: 200px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 10px;
        font-family: monospace;
        font-size: 12px;
        border-radius: 5px;
        z-index: 10000;
        overflow-y: auto;
      `;
            document.body.appendChild(panel);
        }
    }
    createLogEntry(level, module, message, data) {
        return {
            timestamp: new Date().toISOString(),
            level,
            module,
            message,
            data,
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
    }
    extractErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return 'Unknown error occurred';
    }
    addLog(entry) {
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }
    logToConsole(level, module, message, data) {
        const levelInfo = this.levels[level] || this.levels.INFO;
        const prefix = `[${levelInfo.icon} ${module}]`;
        const style = `color: ${levelInfo.color}; font-weight: bold;`;
        if (data && Object.keys(data).length > 0) {
            console[levelInfo.method](`%c${prefix} ${message}`, style, data);
        }
        else {
            console[levelInfo.method](`%c${prefix} ${message}`, style);
        }
        const panel = document.getElementById('floresya-debug-panel');
        if (panel) {
            const logLine = `[${new Date().toLocaleTimeString()}] ${level} ${module}: ${message}`;
            panel.innerHTML += logLine + '<br>';
            panel.scrollTop = panel.scrollHeight;
        }
    }
    error(module, message, data) {
        const entry = this.createLogEntry('ERROR', module, message, data);
        this.addLog(entry);
        this.logToConsole('ERROR', module, message, data);
    }
    warn(module, message, data) {
        const entry = this.createLogEntry('WARN', module, message, data);
        this.addLog(entry);
        this.logToConsole('WARN', module, message, data);
    }
    info(module, message, data) {
        if ((this.logLevel === 'WARN' || this.logLevel === 'ERROR') && !this.isDevMode)
            return;
        const entry = this.createLogEntry('INFO', module, message, data);
        this.addLog(entry);
        this.logToConsole('INFO', module, message, data);
    }
    debug(module, message, data) {
        if (!this.isDevMode)
            return;
        const entry = this.createLogEntry('DEBUG', module, message, data);
        this.addLog(entry);
        this.logToConsole('DEBUG', module, message, data);
    }
    success(module, message, data) {
        const entry = this.createLogEntry('SUCCESS', module, message, data);
        this.addLog(entry);
        this.logToConsole('SUCCESS', module, message, data);
    }
    api(module, message, data) {
        const entry = this.createLogEntry('API', module, message, data);
        this.addLog(entry);
        this.logToConsole('API', module, message, data);
    }
    user(module, message, data) {
        const entry = this.createLogEntry('USER', module, message, data);
        this.addLog(entry);
        this.logToConsole('USER', module, message, data);
    }
    cart(module, message, data) {
        const entry = this.createLogEntry('CART', module, message, data);
        this.addLog(entry);
        this.logToConsole('CART', module, message, data);
    }
    perf(module, message, data) {
        const entry = this.createLogEntry('PERF', module, message, data);
        this.addLog(entry);
        this.logToConsole('PERF', module, message, data);
    }
    setContext(key, value) {
        this.context[key] = value;
    }
    clearContext() {
        this.context = {};
    }
    getLogs() {
        return [...this.logs];
    }
    clearLogs() {
        this.logs = [];
        this.info('SYSTEM', 'Logs cleared');
    }
    async sendLogs() {
        if (this.logs.length === 0 || !this.isDevMode)
            return;
        if (this.endpointExists === false)
            return;
        console.log(`[🌸 Logger] Would send ${this.logs.length} logs to server (temporarily disabled)`);
        return;
    }
    startAutoSend(intervalMinutes = 5) {
        this.stopAutoSend();
        this.autoSendInterval = setInterval(() => {
            this.sendLogs();
        }, intervalMinutes * 60 * 1000);
    }
    stopAutoSend() {
        if (this.autoSendInterval) {
            clearInterval(this.autoSendInterval);
            this.autoSendInterval = undefined;
        }
    }
}
export const logger = new FloresYaLogger();
window.floresyaLogger = logger;
window.logger = logger;
export default logger;
if (typeof window.floresyaLogger === 'undefined') {
    window.floresyaLogger = new FloresYaLogger();
    if (window.floresyaLogger && 'startAutoSend' in window.floresyaLogger) {
        window.floresyaLogger?.startAutoSend(5);
    }
    console.log('%c[✅] FloresYaLogger TypeScript initialized - Experiencia limpia, sin distracciones', 'color: #ff6b9d; font-weight: bold;');
}
