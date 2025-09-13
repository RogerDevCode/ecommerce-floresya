/**
 * FloresYa Backend Logger
 * Versión: 1.1.0
 * Propósito: Logging estructurado, solo en desarrollo, con colores y timestamps.
 * Cumple con: "Logging detallado en consola para procesos críticos durante desarrollo"
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface SessionInfo {
    userAgent?: string;
    ip?: string;
    referrer?: string;
}

interface ConversionData {
    timestamp: string;
    event: string;
    sessionInfo: SessionInfo;
    [key: string]: any;
}

interface PerformanceData {
    metric: string;
    value: number;
    timestamp: string;
    [key: string]: any;
}

interface ActionData {
    action: string;
    timestamp: string;
    [key: string]: any;
}

interface Timer {
    end(context?: string): number;
}

interface LoggerMethods {
    info(context: string, msg: string, data?: any): void;
    warn(context: string, msg: string, data?: any): void;
    error(context: string, msg: string, data?: any): void;
    success(context: string, msg: string, data?: any): void;
    conversion(event: string, data?: any): void;
    performance(metric: string, data?: any): void;
    userAction(action: string, data?: any): void;
}

const LOG_PREFIX = '[FLORESYA-BACKEND]';
const isDev = process.env.NODE_ENV === 'development';

/**
 * Función principal de logging
 */
function log(message: string, data: any = null, level: LogLevel = 'info'): void {
    // Solo loguear en desarrollo (a menos que se fuerce con LOG_LEVEL=debug)
    if (!isDev && process.env.LOG_LEVEL !== 'debug') {
        return;
    }

    const timestamp = new Date().toISOString();
    const output = `${LOG_PREFIX} [${level.toUpperCase()}] ${timestamp} — ${message}`;

    // Colores en consola (solo entornos que lo soportan)
    switch (level) {
    case 'error':
        console.error('\x1b[31m%s\x1b[0m', output); // Rojo
        if (data) console.error(data);
        break;

    case 'warn':
        console.warn('\x1b[33m%s\x1b[0m', output); // Amarillo
        if (data) console.warn(data);
        break;

    case 'success':
        console.log('\x1b[32m%s\x1b[0m', output); // Verde
        if (data) console.log(data);
        break;

    default: // 'info'
        console.log('\x1b[36m%s\x1b[0m', output); // Cyan
        if (data) console.log(data);
        break;
    }
}

/**
 * Alias para compatibilidad con frontend o estilos antiguos
 */
const logger: LoggerMethods = {
    info: (context: string, msg: string, data?: any) => log(`[${context}] ${msg}`, data, 'info'),
    warn: (context: string, msg: string, data?: any) => log(`[${context}] ${msg}`, data, 'warn'),
    error: (context: string, msg: string, data?: any) => log(`[${context}] ${msg}`, data, 'error'),
    success: (context: string, msg: string, data?: any) => log(`[${context}] ${msg}`, data, 'success'),
    
    // ✨ Enhanced conversion tracking methods
    conversion: (event: string, data?: any) => log(`[CONVERSION] ${event}`, data, 'success'),
    performance: (metric: string, data?: any) => log(`[PERFORMANCE] ${metric}`, data, 'info'),
    userAction: (action: string, data?: any) => log(`[USER_ACTION] ${action}`, data, 'info')
};

/**
 * Middleware Express para logging de requests (opcional)
 * Uso: app.use(requestLogger);
 */
function requestLogger(req: any, res: any, next: () => void): void {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level: LogLevel = res.statusCode >= 400 ? 'warn' : 'info';
        log(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        }, level);
    });

    next();
}

/**
 * Función para medir tiempos de ejecución (timers)
 * Uso:
 *   const timer = startTimer('fetchProduct');
 *   // ... código ...
 *   timer.end('CONTEXT'); // → [TIMER] fetchProduct completed in 150ms
 */
function startTimer(label: string): Timer {
    const start = process.hrtime.bigint();

    return {
        end(context = 'TIMER'): number {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1e6; // nanosegundos → milisegundos
            logger.info(context, `[TIMER] ${label} completed in ${duration.toFixed(2)}ms`, { duration, label });
            return duration;
        }
    };
}

/**
 * ✨ Enhanced logging for conversion optimization
 * Track user behavior, performance metrics, and business KPIs
 */
function trackConversion(event: string, data: Record<string, any> = {}): void {
    const conversionData: ConversionData = {
        timestamp: new Date().toISOString(),
        event,
        ...data,
        sessionInfo: {
            userAgent: data.userAgent,
            ip: data.ip,
            referrer: data.referrer
        }
    };
    
    logger.conversion(event, conversionData);
}

function trackPerformance(metric: string, value: number, context: Record<string, any> = {}): void {
    const performanceData: PerformanceData = {
        metric,
        value,
        timestamp: new Date().toISOString(),
        ...context
    };
    
    logger.performance(metric, performanceData);
}

function trackUserAction(action: string, details: Record<string, any> = {}): void {
    const actionData: ActionData = {
        action,
        timestamp: new Date().toISOString(),
        ...details
    };
    
    logger.userAction(action, actionData);
}

// ES module exports
export {
    log,
    logger,
    requestLogger,
    startTimer,
    // ✨ Enhanced tracking functions
    trackConversion,
    trackPerformance,
    trackUserAction
};

// Type exports
export type {
    LogLevel,
    LoggerMethods,
    Timer,
    ConversionData,
    PerformanceData,
    ActionData,
    SessionInfo
};