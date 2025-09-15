/**
 * 🌸 Sistema de Logging para Frontend - FloresYa TypeScript Edition
 * Logging elegante, performante y psicológicamente positivo con tipos estrictos.
 * Sin distracciones. Solo información útil, cuando es útil.
 */

import type { LogData, WindowWithFloresyaLogger, Logger } from '../../types/globals.js';

// Type definitions
interface LogLevel {
  value: number;
  color: string;
  icon: string;
  method: 'error' | 'warn' | 'info' | 'log';
}

interface LogEntry {
  timestamp: string;
  level: string;
  module: string;
  message: string;
  data?: LogData;
  sessionId: string;
  url: string;
  userAgent: string;
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
  [key: string]: LogLevel;
}

// Note: Window interface extended in main.ts to avoid conflicts

export class FloresYaLogger implements Logger {
  private levels: LogLevels = {} as LogLevels;
  private sessionId: string = '';
  private logs: LogEntry[] = [];
  private maxLogs: number = 500;
  private context: Record<string, LogData> = {};
  private isDevMode: boolean = false;
  private logLevel: string = 'WARN'; // Changed from INFO to WARN to reduce verbosity
  private endpoint: string = '';
  private endpointExists?: boolean;
  private autoSendInterval?: NodeJS.Timeout;

  constructor() {
    this.init();
  }

  private init(): void {
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
    this.maxLogs = 500;
    this.context = {};
    this.isDevMode = window.location.hostname === 'localhost' ||
                    localStorage.getItem('floresya_dev_mode') === 'true';
    this.endpoint = '/api/logs/frontend';
    this.endpointExists = undefined;

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
      logLevel: this.logLevel,
      url: window.location.href,
      devMode: this.isDevMode
    });
  }

  private generateSessionId(): string {
    return `floresya_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private setupGlobalErrorHandling(): void {
    // Global JS Errors
    window.addEventListener('error', (event) => {
      this.error('GLOBAL', 'JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('GLOBAL', 'Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  private setupPageLifecycleTracking(): void {
    // Page Load
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

    // Page Visibility (only log when going hidden to reduce verbosity)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.info('PAGE', 'Page visibility changed to hidden', {
          hidden: document.hidden,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Before Unload
    window.addEventListener('beforeunload', () => {
      this.info('PAGE', 'Page unloading', {
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
      this.sendLogs();
    });
  }

  private monitorFetch(): void {
    if (!this.isDevMode) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] instanceof Request ? args[0].url : args[0];
      const method = args[1]?.method || 'GET';

      // Reduced verbosity: only log failed requests
      // this.debug('FETCH', `${method} ${url}`, { args });

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();

        // Only log non-successful requests to reduce verbosity
        if (!response.ok) {
          this.warn('FETCH', `${method} ${url} - Failed`, {
            status: response.status,
            statusText: response.statusText,
            duration: Math.round(endTime - startTime)
          });
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        this.error('FETCH', `${method} ${url} - Failed`, {
          error: error instanceof Error ? error.message : String(error),
          duration: Math.round(endTime - startTime)
        });
        throw error;
      }
    };
  }

  private observeDOM(): void {
    // Disabled DOM observation to reduce excessive logging
    return;
  }

  private showDebugPanel(): void {
    // Simple debug panel for development
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

  private createLogEntry(level: string, module: string, message: string, data?: LogData): LogEntry {
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

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Mantener el limite de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private logToConsole(level: string, module: string, message: string, data?: LogData): void {
    const levelInfo = this.levels[level] || this.levels.INFO;
    const prefix = `[${levelInfo.icon} ${module}]`;
    const style = `color: ${levelInfo.color}; font-weight: bold;`;

    if (data && Object.keys(data).length > 0) {
      console[levelInfo.method](`%c${prefix} ${message}`, style, data);
    } else {
      console[levelInfo.method](`%c${prefix} ${message}`, style);
    }

    // Update debug panel if exists
    const panel = document.getElementById('floresya-debug-panel');
    if (panel) {
      const logLine = `[${new Date().toLocaleTimeString()}] ${level} ${module}: ${message}`;
      panel.innerHTML += logLine + '<br>';
      panel.scrollTop = panel.scrollHeight;
    }
  }

  // Public logging methods
  public error(module: string, message: string, data?: LogData): void {
    const entry = this.createLogEntry('ERROR', module, message, data);
    this.addLog(entry);
    this.logToConsole('ERROR', module, message, data);
  }

  public warn(module: string, message: string, data?: LogData): void {
    const entry = this.createLogEntry('WARN', module, message, data);
    this.addLog(entry);
    this.logToConsole('WARN', module, message, data);
  }

  public info(module: string, message: string, data?: LogData): void {
    // Skip INFO logs in production mode to reduce verbosity
    if (this.logLevel === 'WARN' && !this.isDevMode) return;
    const entry = this.createLogEntry('INFO', module, message, data);
    this.addLog(entry);
    this.logToConsole('INFO', module, message, data);
  }

  public debug(module: string, message: string, data?: LogData): void {
    if (!this.isDevMode) return;
    const entry = this.createLogEntry('DEBUG', module, message, data);
    this.addLog(entry);
    this.logToConsole('DEBUG', module, message, data);
  }

  public success(module: string, message: string, data?: LogData): void {
    const entry = this.createLogEntry('SUCCESS', module, message, data);
    this.addLog(entry);
    this.logToConsole('SUCCESS', module, message, data);
  }

  public api(module: string, message: string, data?: LogData): void {
    const entry = this.createLogEntry('API', module, message, data);
    this.addLog(entry);
    this.logToConsole('API', module, message, data);
  }

  public user(module: string, message: string, data?: LogData): void {
    const entry = this.createLogEntry('USER', module, message, data);
    this.addLog(entry);
    this.logToConsole('USER', module, message, data);
  }

  public cart(module: string, message: string, data?: LogData): void {
    const entry = this.createLogEntry('CART', module, message, data);
    this.addLog(entry);
    this.logToConsole('CART', module, message, data);
  }

  public perf(module: string, message: string, data?: LogData): void {
    const entry = this.createLogEntry('PERF', module, message, data);
    this.addLog(entry);
    this.logToConsole('PERF', module, message, data);
  }

  // Utility methods
  public setContext(key: string, value: LogData): void {
    this.context[key] = value;
  }

  public clearContext(): void {
    this.context = {};
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.info('SYSTEM', 'Logs cleared');
  }

  // Send logs to server
  public async sendLogs(): Promise<void> {
    if (this.logs.length === 0 || !this.isDevMode) return;

    // Check if endpoint exists (cache for performance)
    if (this.endpointExists === false) return;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: this.logs,
          context: this.context,
          sessionId: this.sessionId
        })
      });

      if (response.ok) {
        this.endpointExists = true;
        this.logs = []; // Clear logs after successful send
        this.success('SYSTEM', 'Logs sent to server');
      } else {
        this.endpointExists = false;
        this.warn('SYSTEM', 'Failed to send logs to server', { status: response.status });
      }
    } catch (error) {
      this.endpointExists = false;
      this.debug('SYSTEM', 'Cannot send logs to server', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  // Start auto-sending logs
  public startAutoSend(intervalMinutes = 5): void {
    this.stopAutoSend(); // Clear any existing interval
    this.autoSendInterval = setInterval(() => {
      this.sendLogs();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop auto-sending logs
  public stopAutoSend(): void {
    if (this.autoSendInterval) {
      clearInterval(this.autoSendInterval);
      this.autoSendInterval = undefined;
    }
  }
}

// Create and export global logger instance
export const logger = new FloresYaLogger();

// Make available globally
window.floresyaLogger = logger;
window.logger = logger;

// Default export
export default logger;

// Only create instance if it doesn't exist
if (typeof window.floresyaLogger === 'undefined') {
  window.floresyaLogger = new FloresYaLogger();

  // Start auto-sending logs
  if (window.floresyaLogger && 'startAutoSend' in window.floresyaLogger) {
    (window as WindowWithFloresyaLogger).floresyaLogger?.startAutoSend(5);
  }

  console.log('%c[✅] FloresYaLogger TypeScript initialized - Experiencia limpia, sin distracciones',
    'color: #ff6b9d; font-weight: bold;');
}