/**
 * FloresYa Backend Logger
 * Versión: 1.1.0
 * Propósito: Logging estructurado, solo en desarrollo, con colores y timestamps.
 * Cumple con: "Logging detallado en consola para procesos críticos durante desarrollo"
 */

const LOG_PREFIX = '[FLORESYA-BACKEND]';
const isDev = process.env.NODE_ENV === 'development';

/**
 * Función principal de logging
 * @param {string} message - Mensaje descriptivo
 * @param {any} data - Datos adicionales (objeto, error, etc.)
 * @param {string} level - Nivel: 'info' | 'warn' | 'error' | 'success'
 */
function log(message, data = null, level = 'info') {
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
const logger = {
    info: (msg, data) => log(msg, data, 'info'),
    warn: (msg, data) => log(msg, data, 'warn'),
    error: (msg, data) => log(msg, data, 'error'),
    success: (msg, data) => log(msg, data, 'success')
};

/**
 * Middleware Express para logging de requests (opcional)
 * Uso: app.use(requestLogger);
 */
function requestLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'warn' : 'info';
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
 *   timer.end(); // → [TIMER] fetchProduct completed in 150ms
 */
function startTimer(label) {
    const start = process.hrtime.bigint();

    return {
        end: function() {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1e6; // nanosegundos → milisegundos
            log(`[TIMER] ${label} completed in ${duration.toFixed(2)}ms`, {}, 'info');
        }
    };
}

// CommonJS exports
module.exports = {
    log,
    logger,
    requestLogger,
    startTimer
};