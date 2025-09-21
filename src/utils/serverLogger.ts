/**
 * 🌸 FloresYa Server Logger - Enterprise TypeScript Edition
 * Comprehensive server-side logging with structured output and critical process tracking
 */

import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'SUCCESS' | 'API' | 'DB' | 'SECURITY' | 'PERF';
  module: string;
  message: string;
  data?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface LogConfig {
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  enableFileLogging: boolean;
  logDirectory: string;
  maxFileSize: number; // in bytes
  maxFiles: number;
  enableConsole: boolean;
  enableStructured: boolean;
}

class ServerLogger {
  private config: LogConfig;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logFileStream?: fs.WriteStream;
  private currentLogFile = '';

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      level: process.env.LOG_LEVEL as LogConfig['level'] ?? 'INFO',
      enableFileLogging: process.env.NODE_ENV === 'production',
      logDirectory: process.env.LOG_DIR ?? path.join(process.cwd(), 'logs'),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      enableConsole: process.env.NODE_ENV !== 'production',
      enableStructured: true,
      ...config
    };

    this.initializeLogger();
  }

  private initializeLogger(): void {
    if (this.config.enableFileLogging) {
      this.ensureLogDirectory();
      this.rotateLogFile();
    }

    // Log system startup
    this.info('SYSTEM', 'Server Logger initialized', {
      level: this.config.level,
      fileLogging: this.config.enableFileLogging,
      consoleLogging: this.config.enableConsole,
      environment: process.env.NODE_ENV
    });
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDirectory)) {
      fs.mkdirSync(this.config.logDirectory, { recursive: true });
    }
  }

  private rotateLogFile(): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const logFileName = `floresya-${timestamp}.log`;
    const logFilePath = path.join(this.config.logDirectory, logFileName);

    // Close existing stream
    if (this.logFileStream) {
      this.logFileStream.end();
    }

    // Check if file exists and its size
    if (fs.existsSync(logFilePath)) {
      const stats = fs.statSync(logFilePath);
      if (stats.size >= this.config.maxFileSize) {
        this.rotateOldLogs(logFilePath);
      }
    }

    this.currentLogFile = logFilePath;
    this.logFileStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  }

  private rotateOldLogs(currentFile: string): void {
    const files = fs.readdirSync(this.config.logDirectory)
      .filter(file => file.startsWith('floresya-') && file.endsWith('.log'))
      .sort()
      .reverse();

    // Remove oldest files if we exceed maxFiles
    while (files.length >= this.config.maxFiles) {
      const oldestFile = files.pop();
      if (oldestFile) {
        fs.unlinkSync(path.join(this.config.logDirectory, oldestFile));
      }
    }

    // Rename current file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `floresya-${timestamp}.log`;
    fs.renameSync(currentFile, path.join(this.config.logDirectory, backupFile));
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'SUCCESS', 'API', 'DB', 'SECURITY', 'PERF'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private createLogEntry(
    level: LogEntry['level'],
    module: string,
    message: string,
    data?: Record<string, unknown>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
      requestId: this.getRequestId(),
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    };
  }

  private getRequestId(): string | undefined {
    // This would be set by middleware in a real implementation
    return undefined;
  }

  private getUserId(): string | undefined {
    // This would be extracted from request context
    return undefined;
  }

  private getSessionId(): string | undefined {
    // This would be extracted from request/session context
    return undefined;
  }

  private formatConsoleLog(entry: LogEntry): string {
    const icon = this.getLevelIcon(entry.level);
    const _color = this.getLevelColor(entry.level);
    const prefix = `[${icon} ${entry.module}]`;
    return `${prefix} ${entry.message}`;
  }

  private getLevelIcon(level: LogEntry['level']): string {
    const icons = {
      ERROR: '❌',
      WARN: '⚠️',
      INFO: 'ℹ️',
      DEBUG: '🐛',
      SUCCESS: '✅',
      API: '🌐',
      DB: '🗄️',
      SECURITY: '🔒',
      PERF: '⚡'
    };
    return icons[level] ?? '📝';
  }

  private getLevelColor(level: LogEntry['level']): string {
    const colors = {
      ERROR: '\x1b[31m',    // Red
      WARN: '\x1b[33m',     // Yellow
      INFO: '\x1b[36m',     // Cyan
      DEBUG: '\x1b[35m',    // Magenta
      SUCCESS: '\x1b[32m',  // Green
      API: '\x1b[34m',      // Blue
      DB: '\x1b[37m',       // White
      SECURITY: '\x1b[91m', // Bright Red
      PERF: '\x1b[93m'      // Bright Yellow
    };
    return colors[level] ?? '\x1b[0m';
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.logFileStream) {return;}

    const logLine = this.config.enableStructured
      ? JSON.stringify(entry) + '\n'
      : `${entry.timestamp} [${entry.level}] ${entry.module}: ${entry.message}\n`;

    this.logFileStream.write(logLine);
  }
  
  private getConsoleMethod(level: LogEntry['level']): 'warn' | 'error' {
    switch (level) {
      case 'ERROR':
      case 'SECURITY':
        return 'error';
      case 'WARN':
        return 'warn';
      case 'DEBUG':
      case 'INFO':
      case 'SUCCESS':
      case 'API':
      case 'DB':
      case 'PERF':
        return 'warn'; // ✅ Reemplazado console.log/console.info → console.warn
      default:
        return 'warn';
    }
  }
  
  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Maintain log buffer size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Write to file if enabled
    if (this.config.enableFileLogging) {
      this.writeToFile(entry);
    }

    // Console logging
    if (this.config.enableConsole && this.shouldLog(entry.level)) {
      const formattedMessage = this.formatConsoleLog(entry);

      if (entry.data && Object.keys(entry.data).length > 0) {
        console.warn(formattedMessage, entry.data); // ✅ Reemplazado console[consoleMethod] → console.warn
      } else {
        console.warn(formattedMessage); // ✅ Reemplazado console[consoleMethod] → console.warn
      }      
    }
  }

  // Public logging methods
  public error(module: string, message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('ERROR', module, message, data);
    this.addLog(entry);
  }

  public warn(module: string, message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('WARN', module, message, data);
    this.addLog(entry);
  }

  public info(module: string, message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('INFO', module, message, data);
    this.addLog(entry);
  }

  public debug(module: string, message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('DEBUG', module, message, data);
    this.addLog(entry);
  }

  public success(module: string, message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('SUCCESS', module, message, data);
    this.addLog(entry);
  }

  public api(module: string, message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('API', module, message, data);
    this.addLog(entry);
  }

  public db(module: string, message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('DB', module, message, data);
    this.addLog(entry);
  }

  public security(module: string, message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('SECURITY', module, message, data);
    this.addLog(entry);
  }

  public perf(module: string, message: string, data?: Record<string, unknown>): void {
    const entry = this.createLogEntry('PERF', module, message, data);
    this.addLog(entry);
  }

  // Request logging middleware
  public createRequestLogger() {
    return (req: { method: string; path: string; ip?: string; get: (header: string) => string | undefined; query?: Record<string, unknown>; body?: unknown }, res: { statusCode?: number; on: (event: string, callback: () => void) => void }, next: () => void) => {
      const startTime = Date.now();
      const requestId = this.generateRequestId();

      // Add request ID to response for tracking
      (res as { requestId?: string }).requestId = requestId;

      // Log incoming request
      this.api('HTTP', `${req.method} ${req.path}`, {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
        body: req.method !== 'GET' ? this.sanitizeBody(req.body as Record<string, unknown> | string | number | boolean | null) : undefined
      });

      // Log response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode ?? 200;
        const _level = statusCode >= 400 ? 'WARN' : 'INFO';

        this.api('HTTP', `Response ${statusCode}`, {
          requestId,
          method: req.method,
          path: req.path,
          statusCode,
          duration,
          ip: req.ip
        });
      });

      next();
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private sanitizeBody(body: Record<string, unknown> | string | number | boolean | null): Record<string, unknown> | string | number | boolean | null {
    if (!body || typeof body !== 'object') {return body;}

    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Error logging middleware
  public createErrorLogger() {
    return (error: Error, req: { method: string; path: string; ip?: string; get: (header: string) => string | undefined }, res: { requestId?: string }, next: (error?: Error) => void) => {
      const requestId = res.requestId ?? 'unknown';

      this.error('HTTP', `Request error: ${error.message}`, {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      });

      next(error);
    };
  }

  // Database operation logging
  public logDatabaseOperation(operation: string, table: string, data?: Record<string, unknown>, error?: Error): void {
    if (error) {
      this.db('DATABASE', `Failed ${operation} on ${table}`, {
        operation,
        table,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        data: this.sanitizeData(data)
      });
    } else {
      this.db('DATABASE', `Successful ${operation} on ${table}`, {
        operation,
        table,
        data: this.sanitizeData(data)
      });
    }
  }

  private sanitizeData(data: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    if (!data) {return data;}

    const sanitized = { ...data };

    // Remove sensitive fields from database logs
    const sensitiveFields = ['password_hash', 'token', 'secret', 'api_key'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Performance monitoring
  public startTimer(label: string): () => void {
    const startTime = process.hrtime.bigint();

    return () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

      this.perf('TIMER', `${label} completed`, {
        label,
        duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
        unit: 'ms'
      });
    };
  }

  // Get logs for debugging
  public getLogs(level?: LogEntry['level']): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Clear logs
  public clearLogs(): void {
    this.logs = [];
    this.info('SYSTEM', 'Logs cleared');
  }

  // Graceful shutdown
  public shutdown(): void {
    if (this.logFileStream) {
      this.logFileStream.end();
    }
    this.info('SYSTEM', 'Server Logger shut down gracefully');
  }
}

// Create and export singleton instance
export const serverLogger = new ServerLogger();

// Graceful shutdown handling
process.on('SIGINT', () => {
  serverLogger.info('SYSTEM', 'Received SIGINT, shutting down gracefully');
  serverLogger.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverLogger.info('SYSTEM', 'Received SIGTERM, shutting down gracefully');
  serverLogger.shutdown();
  process.exit(0);
});

export default serverLogger;
