/**
 * 🌸 FloresYa Frontend Logging System
 * Professional TypeScript logger with advanced debugging capabilities
 * Elegant, performant, and psychologically positive logging
 */

import type { Logger } from '@shared/types/frontend.js';

interface LogLevel {
    value: number;
    color: string;
    icon: string;
    method: 'error' | 'warn' | 'info' | 'log';
}

interface LogLevels {
    ERROR: LogLevel;
    WARN: LogLevel;
    INFO: LogLevel;
    DEBUG: LogLevel;
    SUCCESS: LogLevel;
    API: LogLevel;
    USER: LogLevel;
    CART: LogLevel;
    PERF: LogLevel;
}

interface LogEntry {
    timestamp: string;
    level: keyof LogLevels;
    category: string;
    message: string;
    data: any;
    context: Record<string, any>;
    sessionId: string;
    url: string;
}

interface Timer {
    end: (category?: string) => { duration: number };
}

interface ApiRequestData {
    headers?: any;
    body?: any;
}

interface ApiResponseData {
    duration?: number;
    size?: string | number;
}

interface LogsPayload {
    sessionId: string;
    logs: LogEntry[];
    url: string;
    timestamp: string;
}

// Global window interface for logger
declare global {
    interface Window {
        floresyaLogger?: FloresYaLogger;
        MutationObserver?: typeof MutationObserver;
    }
}

class FloresYaLogger implements Logger {
    private levels!: LogLevels;
    private sessionId!: string;
    private logs: LogEntry[] = [];
    private maxLogs: number = 500;
    private context: Record<string, any> = {};
    private isDevMode!: boolean;
    private endpoint: string = '/api/logs/frontend';
    private endpointExists?: boolean;

    constructor() {
        this.init();
    }

    private init(): void {
        // Configuration
        this.levels = {
            ERROR:   { value: 0, color: '#dc3545', icon: '❌', method: 'error' },
            WARN:    { value: 1, color: '#ffc107', icon: '⚠️', method: 'warn' },
            INFO:    { value: 2, color: '#0dcaf0', icon: 'ℹ️', method: 'info' },
            DEBUG:   { value: 3, color: '#6f42c1', icon: '🐛', method: 'log' },
            SUCCESS: { value: 2, color: '#198754', icon: '✅', method: 'log' },
            API:     { value: 2, color: '#0d6efd', icon: '🌐', method: 'log' },
            USER:    { value: 2, color: '#fd7e14', icon: '👤', method: 'log' },
            CART:    { value: 2, color: '#20c997', icon: '🛒', method: 'log' },
            PERF:    { value: 2, color: '#6610f2', icon: '⚡', method: 'log' }
        };

        this.sessionId = this.generateSessionId();
        this.isDevMode = window.location.hostname === 'localhost' || localStorage.getItem('floresya_dev_mode') === 'true';

        // Only activate heavy features in development mode
        if (this.isDevMode) {
            this.monitorFetch();
            this.observeDOM();
            this.showDebugPanel();
        }

        // Initialize listeners
        this.setupGlobalErrorHandling();
        this.setupPageLifecycleTracking();

        this.success('SYSTEM', 'Frontend Logger initialized', {
            sessionId: this.sessionId,
            logLevel: 'INFO',
            url: window.location.href,
            devMode: this.isDevMode
        });
    }

    private generateSessionId(): string {
        return `floresya_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    private setupGlobalErrorHandling(): void {
        // Global JS Errors
        window.addEventListener('error', (event: ErrorEvent) => {
            this.error('GLOBAL', 'JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Unhandled Promise Rejections
        window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
            this.error('GLOBAL', 'Unhandled Promise Rejection', {
                reason: event.reason?.message || event.reason,
                promise: event.promise.toString()
            });
        });
    }

    private setupPageLifecycleTracking(): void {
        // Page Load
        window.addEventListener('load', () => {
            this.info('PAGE', 'Page loaded', {
                url: window.location.href,
                referrer: document.referrer,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            });
        });

        // Page Visibility
        document.addEventListener('visibilitychange', () => {
            this.info('PAGE', `Page ${document.hidden ? 'hidden' : 'visible'}`, {
                visibilityState: document.visibilityState
            });
        });
    }

    // ============ CORE LOGGING METHODS ============

    private shouldLog(level: keyof LogLevels): boolean {
        if (!this.levels[level]) return false;
        return this.levels[level].value <= this.levels.INFO.value; // Only INFO and above in production
    }

    private formatMessage(level: keyof LogLevels, category: string, message: string, data: any = {}): LogEntry {
        const timestamp = new Date().toISOString();
        const levelInfo = this.levels[level] || this.levels.INFO;
        
        const logEntry: LogEntry = {
            timestamp,
            level,
            category,
            message,
            data: this.sanitizeData(data),
            context: { ...this.context },
            sessionId: this.sessionId,
            url: window.location.href
        };

        // Store in memory
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Store critical logs in localStorage
        if (level === 'ERROR' || level === 'WARN') {
            this.storeCriticalLog(logEntry);
        }

        return logEntry;
    }

    private sanitizeData(data: any): any {
        // Avoid circular references and very large data
        if (!data || typeof data !== 'object') return data;
        
        const safeData: Record<string, any> = {};
        for (const key in data) {
            if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
                safeData[key] = '[Object]';
            } else if (Array.isArray(data[key]) && data[key].length > 10) {
                safeData[key] = `[Array(${data[key].length})]`;
            } else {
                safeData[key] = data[key];
            }
        }
        return safeData;
    }

    private storeCriticalLog(logEntry: LogEntry): void {
        try {
            const storedLogs = JSON.parse(localStorage.getItem('floresya_critical_logs') || '[]');
            storedLogs.push(logEntry);
            if (storedLogs.length > 20) storedLogs.splice(0, storedLogs.length - 20);
            localStorage.setItem('floresya_critical_logs', JSON.stringify(storedLogs));
        } catch (e) {
            console.warn('⚠️ Could not save critical log to localStorage');
        }
    }

    private log(level: keyof LogLevels, category: string, message: string, data: any = {}): LogEntry | undefined {
        if (!this.shouldLog(level)) return undefined;

        const logEntry = this.formatMessage(level, category, message, data);
        const levelInfo = this.levels[level] || this.levels.INFO;
        const contextStr = Object.keys(this.context).length > 0 
            ? ` [${Object.entries(this.context).map(([k, v]) => `${k}:${v}`).join(', ')}]` 
            : '';

        const consoleMessage = `%c${levelInfo.icon} [${level}] [${category}]${contextStr} ${message}`;
        const consoleStyle = `color: ${levelInfo.color}; font-weight: bold;`;

        // Only show in console if development or error/warn
        if (this.isDevMode || level === 'ERROR' || level === 'WARN') {
            console[levelInfo.method](consoleMessage, consoleStyle, data);
        }

        return logEntry;
    }

    // Public Logger interface methods
    public error(module: string, message: string, data: any = {}): void {
        this.log('ERROR', module, message, data);
    }

    public warn(module: string, message: string, data: any = {}): void {
        this.log('WARN', module, message, data);
    }

    public info(module: string, message: string, data: any = {}): void {
        this.log('INFO', module, message, data);
    }

    public debug(module: string, message: string, data: any = {}): void {
        if (this.isDevMode) this.log('DEBUG', module, message, data);
    }

    public success(module: string, message: string, data: any = {}): void {
        this.log('SUCCESS', module, message, data);
    }

    // ============ SPECIALIZED LOGGERS ============

    public api(method: string, url: string, data: ApiRequestData = {}): LogEntry | undefined {
        return this.log('API', 'REQUEST', `${method.toUpperCase()} ${url}`, {
            headers: data.headers ? '[HEADERS]' : undefined,
            body: data.body ? '[BODY]' : undefined
        });
    }

    public apiResponse(method: string, url: string, status: number, data: ApiResponseData = {}): LogEntry | undefined {
        const level: keyof LogLevels = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'SUCCESS';
        return this.log(level, 'API', `${method.toUpperCase()} ${url} - ${status}`, {
            duration: data.duration || 0,
            size: data.size || 'unknown'
        });
    }

    public user(action: string, data: any = {}): LogEntry | undefined {
        return this.log('USER', 'ACTION', action, data);
    }

    public cart(action: string, data: any = {}): LogEntry | undefined {
        return this.log('CART', 'ACTION', action, data);
    }

    // ============ PERFORMANCE & TIMERS ============

    public startTimer(label: string): Timer {
        const startTime = performance.now();
        return {
            end: (category: string = 'PERF') => {
                const duration = performance.now() - startTime;
                this.info(category, `Timer '${label}' completed`, {
                    duration: `${duration.toFixed(2)}ms`,
                    label
                });
                return { duration };
            }
        };
    }

    // ============ FETCH MONITORING (DEV ONLY) ============

    private monitorFetch(): void {
        if (!this.isDevMode) return;
        
        const originalFetch = window.fetch;
        const logger = this;

        window.fetch = async function(url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
            const timer = logger.startTimer(`fetch:${url}`);
            const method = options.method || 'GET';
            const urlString = typeof url === 'string' ? url : url.toString();

            logger.api(method, urlString, {
                headers: options.headers,
                body: options.body ? '[BODY]' : undefined
            });

            try {
                const response = await originalFetch(url, options);
                const duration = timer.end('API');
                
                logger.apiResponse(method, urlString, response.status, {
                    duration: duration.duration,
                    size: response.headers.get('content-length') || 'unknown'
                });

                return response;
            } catch (error) {
                timer.end('API');
                logger.error('API', `Fetch failed: ${method} ${urlString}`, {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
                throw error;
            }
        };
    }

    // ============ DOM OBSERVER (DEV ONLY) ============

    private observeDOM(): void {
        if (!this.isDevMode || !window.MutationObserver) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    this.debug('DOM', 'Nodes added', {
                        count: mutation.addedNodes.length,
                        target: (mutation.target as Element).tagName
                    });
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ============ DEBUG PANEL (DEV ONLY) ============

    private showDebugPanel(): void {
        if (document.getElementById('floresya-debug-panel')) return;

        // Wait for DOM to be ready
        if (document.readyState !== 'loading') {
            this.createDebugPanel();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.createDebugPanel();
            });
        }
    }

    private createDebugPanel(): void {
        const panel = document.createElement('div');
        panel.id = 'floresya-debug-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 450px;
            max-height: 600px;
            background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%);
            border: 1px solid #404040;
            border-radius: 12px;
            padding: 0;
            z-index: 10000;
            font-family: 'Consolas', monospace;
            font-size: 11px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            backdrop-filter: blur(10px);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #ff6b9d 0%, #ff8ec7 100%);
            color: white;
            padding: 12px 15px;
            border-radius: 12px 12px 0 0;
            font-weight: bold;
            font-size: 13px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `
            <span>🌸 FloresYa Debug Panel</span>
            <div>
                <button onclick="window.floresyaLogger?.copyAllLogs()" 
                        style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 4px 8px; margin-right: 4px; border-radius: 4px; font-size: 10px; cursor: pointer;">
                    📋 Copiar
                </button>
                <button onclick="window.floresyaLogger?.clearDebugPanel()" 
                        style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 4px 8px; margin-right: 4px; border-radius: 4px; font-size: 10px; cursor: pointer;">
                    🗑️ Limpiar
                </button>
                <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" 
                        style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;">×</button>
            </div>
        `;
        panel.appendChild(header);

        const logContainer = document.createElement('div');
        logContainer.id = 'debug-logs';
        logContainer.style.cssText = `
            padding: 15px;
            max-height: 520px;
            overflow-y: auto;
            background: #1e1e1e;
            color: #e0e0e0;
            line-height: 1.4;
            border-radius: 0 0 12px 12px;
        `;
        panel.appendChild(logContainer);
        document.body.appendChild(panel);

        // Update logs every second
        const updateLogs = () => {
            const lastLogs = this.logs.slice(-20);
            logContainer.innerHTML = lastLogs.map(log => {
                const levelInfo = this.levels[log.level];
                const timestamp = new Date(log.timestamp).toLocaleTimeString();
                const hasData = log.data && Object.keys(log.data).length > 0;
                
                return `<div style="
                    margin: 4px 0; 
                    padding: 8px; 
                    background: rgba(255,255,255,0.05);
                    border-left: 3px solid ${levelInfo.color};
                    border-radius: 4px;
                    font-size: 11px;
                ">
                    <div style="color: ${levelInfo.color}; font-weight: bold;">
                        ${levelInfo.icon} [${timestamp}] ${log.level} [${log.category}]
                    </div>
                    <div style="color: #e0e0e0; margin: 4px 0; font-weight: normal;">
                        ${log.message}
                    </div>
                    ${hasData ? `<details style="margin-top: 4px;">
                        <summary style="color: #888; cursor: pointer; font-size: 10px;">📄 Ver datos</summary>
                        <pre style="color: #aaa; font-size: 10px; margin: 4px 0 0 0; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; white-space: pre-wrap; word-break: break-all; max-height: 100px; overflow-y: auto;">${JSON.stringify(log.data, null, 2)}</pre>
                    </details>` : ''}
                </div>`;
            }).join('');
            logContainer.scrollTop = logContainer.scrollHeight;
        };

        updateLogs();
        setInterval(updateLogs, 1000);
    }

    public copyAllLogs(): void {
        const allLogsText = this.logs.map(log => {
            const timestamp = new Date(log.timestamp).toLocaleTimeString();
            const dataStr = log.data && Object.keys(log.data).length > 0 ? 
                `\n  Data: ${JSON.stringify(log.data, null, 2)}` : '';
            return `[${timestamp}] ${log.level} [${log.category}] ${log.message}${dataStr}`;
        }).join('\n\n');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(allLogsText).then(() => {
                this.success('DEBUG-PANEL', 'Logs copiados al portapapeles', { logsCount: this.logs.length });
                this.showCopyFeedback();
            }).catch(err => {
                console.error('Error al copiar:', err);
            });
        }
    }

    private showCopyFeedback(): void {
        const button = document.querySelector('button[onclick="window.floresyaLogger?.copyAllLogs()"]') as HTMLButtonElement;
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = '✅ ¡Copiado!';
            button.style.background = '#28a745';
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = 'rgba(255,255,255,0.2)';
            }, 2000);
        }
    }

    public clearDebugPanel(): void {
        const logContainer = document.getElementById('debug-logs');
        if (logContainer) {
            logContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 30px 20px; font-style: italic; background: rgba(255,255,255,0.02); border-radius: 8px;">🧹 Panel limpiado</div>';
        }
        this.logs = [];
        this.success('DEBUG-PANEL', 'Panel de debug limpiado');
    }

    // ============ SERVER LOG SENDING (WITH ERROR CONTROL) ============

    public async sendLogsToServer(): Promise<void> {
        // Only in production and only if endpoint exists
        if (!this.isDevMode && window.location.hostname !== 'localhost') {
            try {
                // Check endpoint only once and cache result
                if (typeof this.endpointExists === 'undefined') {
                    const check = await fetch(this.endpoint, { method: 'HEAD' });
                    this.endpointExists = check.ok;
                    if (!this.endpointExists) {
                        console.warn('Log endpoint not available. Logs not sent.');
                        return;
                    }
                }

                if (!this.endpointExists) return; // Use cache

                const logsToSend = this.logs.filter(log => 
                    log.level === 'ERROR' || log.level === 'WARN' || log.category === 'API'
                );

                if (logsToSend.length === 0) return;

                const payload: LogsPayload = {
                    sessionId: this.sessionId,
                    logs: logsToSend,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                };

                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    this.success('SYSTEM', 'Logs enviados al servidor', { count: logsToSend.length });
                } else {
                    console.warn('No se pudieron enviar los logs al servidor');
                }
            } catch (error) {
                if (this.isDevMode) {
                    console.error('Error enviando logs:', error);
                }
            }
        }
    }

    // Send logs every 5 minutes (only in production)
    public startAutoSend(intervalMinutes: number = 5): void {
        if (!this.isDevMode) {
            setInterval(() => {
                this.sendLogsToServer();
            }, intervalMinutes * 60 * 1000);
        }
    }

    // Additional utility methods
    public setContext(key: string, value: any): void {
        this.context[key] = value;
    }

    public clearContext(): void {
        this.context = {};
    }

    public getLogs(): LogEntry[] {
        return [...this.logs];
    }

    public getSessionId(): string {
        return this.sessionId;
    }
}

// ============ GLOBAL INSTANCE AND EXPORT ============

// Only create one instance
if (typeof window.floresyaLogger === 'undefined') {
    window.floresyaLogger = new FloresYaLogger();
    
    // Start automatic log sending (production only)
    window.floresyaLogger.startAutoSend(5);
    
    console.log('%c[✅] FloresYaLogger initialized - Clean experience, no distractions', 
        'color: #ff6b9d; font-weight: bold;');
}

// Alias for compatibility
const logger = window.floresyaLogger;

// Export for module systems
export default FloresYaLogger;
export { logger, FloresYaLogger };
export type { LogEntry, LogLevels, Timer };