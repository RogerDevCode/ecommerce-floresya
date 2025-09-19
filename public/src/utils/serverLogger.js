import fs from 'fs';
import path from 'path';
class ServerLogger {
    constructor(config = {}) {
        this.logs = [];
        this.maxLogs = 1000;
        this.currentLogFile = '';
        this.config = {
            level: process.env.LOG_LEVEL || 'INFO',
            enableFileLogging: process.env.NODE_ENV === 'production',
            logDirectory: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
            maxFileSize: 10 * 1024 * 1024,
            maxFiles: 5,
            enableConsole: process.env.NODE_ENV !== 'production',
            enableStructured: true,
            ...config
        };
        this.initializeLogger();
    }
    initializeLogger() {
        if (this.config.enableFileLogging) {
            this.ensureLogDirectory();
            this.rotateLogFile();
        }
        this.info('SYSTEM', 'Server Logger initialized', {
            level: this.config.level,
            fileLogging: this.config.enableFileLogging,
            consoleLogging: this.config.enableConsole,
            environment: process.env.NODE_ENV
        });
    }
    ensureLogDirectory() {
        if (!fs.existsSync(this.config.logDirectory)) {
            fs.mkdirSync(this.config.logDirectory, { recursive: true });
        }
    }
    rotateLogFile() {
        const timestamp = new Date().toISOString().split('T')[0];
        const logFileName = `floresya-${timestamp}.log`;
        const logFilePath = path.join(this.config.logDirectory, logFileName);
        if (this.logFileStream) {
            this.logFileStream.end();
        }
        if (fs.existsSync(logFilePath)) {
            const stats = fs.statSync(logFilePath);
            if (stats.size >= this.config.maxFileSize) {
                this.rotateOldLogs(logFilePath);
            }
        }
        this.currentLogFile = logFilePath;
        this.logFileStream = fs.createWriteStream(logFilePath, { flags: 'a' });
    }
    rotateOldLogs(currentFile) {
        const files = fs.readdirSync(this.config.logDirectory)
            .filter(file => file.startsWith('floresya-') && file.endsWith('.log'))
            .sort()
            .reverse();
        while (files.length >= this.config.maxFiles) {
            const oldestFile = files.pop();
            if (oldestFile) {
                fs.unlinkSync(path.join(this.config.logDirectory, oldestFile));
            }
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = `floresya-${timestamp}.log`;
        fs.renameSync(currentFile, path.join(this.config.logDirectory, backupFile));
    }
    shouldLog(level) {
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'SUCCESS', 'API', 'DB', 'SECURITY', 'PERF'];
        const currentLevelIndex = levels.indexOf(this.config.level);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
    createLogEntry(level, module, message, data) {
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
    getRequestId() {
        return undefined;
    }
    getUserId() {
        return undefined;
    }
    getSessionId() {
        return undefined;
    }
    formatConsoleLog(entry) {
        const icon = this.getLevelIcon(entry.level);
        const _color = this.getLevelColor(entry.level);
        const prefix = `[${icon} ${entry.module}]`;
        return `${prefix} ${entry.message}`;
    }
    getLevelIcon(level) {
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
        return icons[level] || '📝';
    }
    getLevelColor(level) {
        const colors = {
            ERROR: '\x1b[31m',
            WARN: '\x1b[33m',
            INFO: '\x1b[36m',
            DEBUG: '\x1b[35m',
            SUCCESS: '\x1b[32m',
            API: '\x1b[34m',
            DB: '\x1b[37m',
            SECURITY: '\x1b[91m',
            PERF: '\x1b[93m'
        };
        return colors[level] || '\x1b[0m';
    }
    writeToFile(entry) {
        if (!this.logFileStream)
            return;
        const logLine = this.config.enableStructured
            ? JSON.stringify(entry) + '\n'
            : `${entry.timestamp} [${entry.level}] ${entry.module}: ${entry.message}\n`;
        this.logFileStream.write(logLine);
    }
    addLog(entry) {
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        if (this.config.enableFileLogging) {
            this.writeToFile(entry);
        }
        if (this.config.enableConsole && this.shouldLog(entry.level)) {
            const consoleMethod = this.getConsoleMethod(entry.level);
            const formattedMessage = this.formatConsoleLog(entry);
            if (entry.data && Object.keys(entry.data).length > 0) {
                console[consoleMethod](formattedMessage, entry.data);
            }
            else {
                console[consoleMethod](formattedMessage);
            }
        }
    }
    getConsoleMethod(level) {
        switch (level) {
            case 'ERROR':
            case 'SECURITY':
                return 'error';
            case 'WARN':
                return 'warn';
            case 'DEBUG':
                return 'log';
            default:
                return 'info';
        }
    }
    error(module, message, data) {
        const entry = this.createLogEntry('ERROR', module, message, data);
        this.addLog(entry);
    }
    warn(module, message, data) {
        const entry = this.createLogEntry('WARN', module, message, data);
        this.addLog(entry);
    }
    info(module, message, data) {
        const entry = this.createLogEntry('INFO', module, message, data);
        this.addLog(entry);
    }
    debug(module, message, data) {
        const entry = this.createLogEntry('DEBUG', module, message, data);
        this.addLog(entry);
    }
    success(module, message, data) {
        const entry = this.createLogEntry('SUCCESS', module, message, data);
        this.addLog(entry);
    }
    api(module, message, data) {
        const entry = this.createLogEntry('API', module, message, data);
        this.addLog(entry);
    }
    db(module, message, data) {
        const entry = this.createLogEntry('DB', module, message, data);
        this.addLog(entry);
    }
    security(module, message, data) {
        const entry = this.createLogEntry('SECURITY', module, message, data);
        this.addLog(entry);
    }
    perf(module, message, data) {
        const entry = this.createLogEntry('PERF', module, message, data);
        this.addLog(entry);
    }
    createRequestLogger() {
        return (req, res, next) => {
            const startTime = Date.now();
            const requestId = this.generateRequestId();
            res.requestId = requestId;
            this.api('HTTP', `${req.method} ${req.path}`, {
                requestId,
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                query: req.query,
                body: req.method !== 'GET' ? this.sanitizeBody(req.body) : undefined
            });
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                const statusCode = res.statusCode || 200;
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
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    sanitizeBody(body) {
        if (!body || typeof body !== 'object')
            return body;
        const sanitized = { ...body };
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        return sanitized;
    }
    createErrorLogger() {
        return (error, req, res, next) => {
            const requestId = res.requestId || 'unknown';
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
    logDatabaseOperation(operation, table, data, error) {
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
        }
        else {
            this.db('DATABASE', `Successful ${operation} on ${table}`, {
                operation,
                table,
                data: this.sanitizeData(data)
            });
        }
    }
    sanitizeData(data) {
        if (!data)
            return data;
        const sanitized = { ...data };
        const sensitiveFields = ['password_hash', 'token', 'secret', 'api_key'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        return sanitized;
    }
    startTimer(label) {
        const startTime = process.hrtime.bigint();
        return () => {
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1000000;
            this.perf('TIMER', `${label} completed`, {
                label,
                duration: Math.round(duration * 100) / 100,
                unit: 'ms'
            });
        };
    }
    getLogs(level) {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return [...this.logs];
    }
    clearLogs() {
        this.logs = [];
        this.info('SYSTEM', 'Logs cleared');
    }
    shutdown() {
        if (this.logFileStream) {
            this.logFileStream.end();
        }
        this.info('SYSTEM', 'Server Logger shut down gracefully');
    }
}
export const serverLogger = new ServerLogger();
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
