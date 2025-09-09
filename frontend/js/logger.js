/**
 * 🌸 Sistema de Logging para Frontend - FloresYa
 * Logging elegante, performante y psicológicamente positivo.
 * Sin distracciones. Solo información útil, cuando es útil.
 */

class FloresYaLogger {
    constructor() {
        this.init();
    }

    init() {
        // Configuración inicial
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
        this.logs = [];
        this.maxLogs = 500; // Reducido para evitar acumulación innecesaria
        this.context = {};
        this.isDevMode = window.location.hostname === 'localhost' || localStorage.getItem('floresya_dev_mode') === 'true';
        this.endpoint = '/api/logs/frontend'; // Configurable
        this.endpointExists = undefined; // ← Cache para endpoint

        // Solo activar features pesadas en modo desarrollo
        if (this.isDevMode) {
            this.monitorFetch();
            this.observeDOM();
            this.showDebugPanel();
        }

        // Inicializar listeners
        this.setupGlobalErrorHandling();
        this.setupPageLifecycleTracking();

        this.success('SYSTEM', 'Frontend Logger initialized', {
            sessionId: this.sessionId,
            logLevel: 'INFO',
            url: window.location.href,
            devMode: this.isDevMode
        });
    }

    generateSessionId() {
        return `floresya_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    setupGlobalErrorHandling() {
        // Global JS Errors
        window.addEventListener('error', (event) => {
            this.error('GLOBAL', 'JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Unhandled Promise Rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.error('GLOBAL', 'Unhandled Promise Rejection', {
                reason: event.reason?.message || event.reason,
                promise: event.promise.toString()
            });
        });
    }

    setupPageLifecycleTracking() {
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

    shouldLog(level) {
        if (!this.levels[level]) return false;
        return this.levels[level].value <= this.levels.INFO.value; // Solo INFO y superiores en producción
    }

    formatMessage(level, category, message, data = {}) {
        const timestamp = new Date().toISOString();
        const levelInfo = this.levels[level] || this.levels.INFO;
        
        const logEntry = {
            timestamp,
            level,
            category,
            message,
            data: this.sanitizeData(data),
            context: { ...this.context },
            sessionId: this.sessionId,
            url: window.location.href
        };

        // Guardar en memoria
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Guardar errores críticos en localStorage
        if (level === 'ERROR' || level === 'WARN') {
            this.storeCriticalLog(logEntry);
        }

        return logEntry;
    }

    sanitizeData(data) {
        // Evitar circular references y datos muy grandes
        if (!data || typeof data !== 'object') return data;
        
        const safeData = {};
        for (let key in data) {
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

    storeCriticalLog(logEntry) {
        try {
            const storedLogs = JSON.parse(localStorage.getItem('floresya_critical_logs') || '[]');
            storedLogs.push(logEntry);
            if (storedLogs.length > 20) storedLogs.splice(0, storedLogs.length - 20);
            localStorage.setItem('floresya_critical_logs', JSON.stringify(storedLogs));
        } catch (e) {
            console.warn('⚠️ No se pudo guardar log crítico en localStorage');
        }
    }

    log(level, category, message, data = {}) {
        if (!this.shouldLog(level)) return;

        const logEntry = this.formatMessage(level, category, message, data);
        const levelInfo = this.levels[level] || this.levels.INFO;
        const contextStr = Object.keys(this.context).length > 0 
            ? ` [${Object.entries(this.context).map(([k, v]) => `${k}:${v}`).join(', ')}]` 
            : '';

        const consoleMessage = `%c${levelInfo.icon} [${level}] [${category}]${contextStr} ${message}`;
        const consoleStyle = `color: ${levelInfo.color}; font-weight: bold;`;

        // Solo mostrar en consola si es desarrollo o es error/warn
        if (this.isDevMode || level === 'ERROR' || level === 'WARN') {
            console[levelInfo.method](consoleMessage, consoleStyle, data);
        }

        return logEntry;
    }

    // Shortcuts
    error(category, message, data = {}) { return this.log('ERROR', category, message, data); }
    warn(category, message, data = {}) { return this.log('WARN', category, message, data); }
    info(category, message, data = {}) { return this.log('INFO', category, message, data); }
    debug(category, message, data = {}) { if (this.isDevMode) return this.log('DEBUG', category, message, data); }
    success(category, message, data = {}) { return this.log('SUCCESS', category, message, data); }

    // ============ SPECIALIZED LOGGERS ============

    api(method, url, data = {}) {
        return this.log('API', 'REQUEST', `${method.toUpperCase()} ${url}`, {
            headers: data.headers ? '[HEADERS]' : undefined,
            body: data.body ? '[BODY]' : undefined
        });
    }

    apiResponse(method, url, status, data = {}) {
        const level = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'SUCCESS';
        return this.log(level, 'API', `${method.toUpperCase()} ${url} - ${status}`, {
            duration: data.duration || 0,
            size: data.size || 'unknown'
        });
    }

    user(action, data = {}) { return this.log('USER', 'ACTION', action, data); }
    cart(action, data = {}) { return this.log('CART', 'ACTION', action, data); }

    // ============ PERFORMANCE & TIMERS ============

    startTimer(label) {
        const startTime = performance.now();
        return {
            end: (category = 'PERF') => {
                const duration = performance.now() - startTime;
                this.info(category, `Timer '${label}' completed`, {
                    duration: `${duration.toFixed(2)}ms`,
                    label
                });
                return { duration };
            }
        };
    }

    // ============ FETCH MONITORING (SOLO EN DEV) ============

    monitorFetch() {
        if (!this.isDevMode) return;
        
        const originalFetch = window.fetch;
        const logger = this;

        window.fetch = async function(url, options = {}) {
            const timer = logger.startTimer(`fetch:${url}`);
            const method = options.method || 'GET';

            logger.api(method, url, {
                headers: options.headers,
                body: options.body ? '[BODY]' : undefined
            });

            try {
                const response = await originalFetch(url, options);
                const duration = timer.end('API');
                
                logger.apiResponse(method, url, response.status, {
                    duration: duration.duration,
                    size: response.headers.get('content-length') || 'unknown'
                });

                return response;
            } catch (error) {
                timer.end('API');
                logger.error('API', `Fetch failed: ${method} ${url}`, {
                    error: error.message,
                    stack: error.stack
                });
                throw error;
            }
        };
    }

    // ============ DOM OBSERVER (SOLO EN DEV) ============

    observeDOM() {
        if (!this.isDevMode || !window.MutationObserver) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    this.debug('DOM', 'Nodes added', { // ← CORREGIDO: this.debug, no logger.debug
                        count: mutation.addedNodes.length,
                        target: mutation.target.tagName
                    });
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ============ DEBUG PANEL (SOLO EN DEV) ============

    showDebugPanel() {
        if (document.getElementById('floresya-debug-panel')) return;

        // ✅ Esperar a que el DOM esté listo
        if (document.readyState !== 'loading') {
            this.createDebugPanel();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                this.createDebugPanel();
            });
        }
    }

    createDebugPanel() {
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
                <button onclick="window.floresyaLogger.copyAllLogs()" 
                        style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 4px 8px; margin-right: 4px; border-radius: 4px; font-size: 10px; cursor: pointer;">
                    📋 Copiar
                </button>
                <button onclick="window.floresyaLogger.clearDebugPanel()" 
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

    copyAllLogs() {
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

    showCopyFeedback() {
        const button = document.querySelector('button[onclick="window.floresyaLogger.copyAllLogs()"]');
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

    clearDebugPanel() {
        const logContainer = document.getElementById('debug-logs');
        if (logContainer) {
            logContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 30px 20px; font-style: italic; background: rgba(255,255,255,0.02); border-radius: 8px;">🧹 Panel limpiado</div>';
        }
        this.logs = [];
        this.success('DEBUG-PANEL', 'Panel de debug limpiado');
    }

    // ============ ENVÍO DE LOGS AL SERVIDOR (CON CONTROL DE ERRORES) ============

    async sendLogsToServer() {
        // Solo en producción y solo si el endpoint existe
        if (!this.isDevMode && window.location.hostname !== 'localhost') {
            try {
                // ✅ Verificar endpoint solo una vez, y cachear resultado
                if (typeof this.endpointExists === 'undefined') {
                    const check = await fetch(this.endpoint, { method: 'HEAD' });
                    this.endpointExists = check.ok;
                    if (!this.endpointExists) {
                        console.warn('Endpoint de logs no disponible. Logs no enviados.');
                        return;
                    }
                }

                if (!this.endpointExists) return; // ← Usar caché

                const logsToSend = this.logs.filter(log => 
                    log.level === 'ERROR' || log.level === 'WARN' || log.category === 'API'
                );

                if (logsToSend.length === 0) return;

                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: this.sessionId,
                        logs: logsToSend,
                        url: window.location.href,
                        timestamp: new Date().toISOString()
                    })
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

    // Enviar logs cada 5 minutos (solo si estamos en producción)
    startAutoSend(intervalMinutes = 5) {
        if (!this.isDevMode) {
            setInterval(() => {
                this.sendLogsToServer();
            }, intervalMinutes * 60 * 1000);
        }
    }
}

// 👇👇👇 INSTANCIA GLOBAL Y EXPORTACIÓN 👇👇👇

// Solo crear una instancia
if (typeof window.floresyaLogger === 'undefined') {
    window.floresyaLogger = new FloresYaLogger();
    
    // Iniciar envío automático de logs (solo en producción)
    window.floresyaLogger.startAutoSend(5);
    
    console.log('%c[✅] FloresYaLogger inicializado - Experiencia limpia, sin distracciones', 
        'color: #ff6b9d; font-weight: bold;');
}

// Alias para compatibilidad
const logger = window.floresyaLogger;

// ✅ Exportar para compatibilidad global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { logger, FloresYaLogger };
    module.exports.default = logger;
}