"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.trackUserAction = exports.trackPerformance = exports.trackConversion = exports.startTimer = exports.requestLogger = exports.logger = exports.logError = exports.log = exports.default = exports.COLORS = void 0; /**
 * FloresYa Backend Logger - ES6+ Version
 * Versión: 2.0.0
 * Propósito: Logging estructurado, solo en desarrollo, con colores y timestamps.
 * Cumple con: "Logging detallado en consola para procesos críticos durante desarrollo"
 */

const LOG_PREFIX = '[FLORESYA-BACKEND]';
const isDev = process.env.NODE_ENV === 'development';

// Color constants using template literals
const COLORS = exports.COLORS = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

/**
 * Función principal de logging con ES6+ features
 * @param {string} message - Mensaje descriptivo
 * @param {any} data - Datos adicionales (objeto, error, etc.)
 * @param {string} level - Nivel: 'info' | 'warn' | 'error' | 'success'
 */
const log = (message, data = null, level = 'info') => {
  // Solo loguear en desarrollo (a menos que se fuerce con LOG_LEVEL=debug)
  if (!isDev && process.env.LOG_LEVEL !== 'debug') {
    return;
  }

  const timestamp = new Date().toISOString();
  const output = `${LOG_PREFIX} [${level.toUpperCase()}] ${timestamp} — ${message}`;

  // Colores en consola usando destructuring y template literals
  const colorMap = {
    error: () => {
      console.error(`${COLORS.red}${output}${COLORS.reset}`);
      if (data) console.error(data);
    },
    warn: () => {
      console.warn(`${COLORS.yellow}${output}${COLORS.reset}`);
      if (data) console.warn(data);
    },
    success: () => {
      console.log(`${COLORS.green}${output}${COLORS.reset}`);
      if (data) console.log(data);
    },
    info: () => {
      console.log(`${COLORS.cyan}${output}${COLORS.reset}`);
      if (data) console.log(data);
    }
  };

  (colorMap[level] || colorMap.info)();
};

/**
 * Enhanced logger object with method shorthand syntax
 */exports.log = log;
const logger = exports.logger = {
  info(context, msg, data) {
    return log(`[${context}] ${msg}`, data, 'info');
  },

  warn(context, msg, data) {
    return log(`[${context}] ${msg}`, data, 'warn');
  },

  error(context, msg, data, errorObj) {
    const enhancedData = errorObj ? { ...data, error: errorObj } : data;
    return log(`[${context}] ${msg}`, enhancedData, 'error');
  },

  success(context, msg, data) {
    return log(`[${context}] ${msg}`, data, 'success');
  },

  // Enhanced conversion tracking methods with ES6+ features
  conversion(event, data) {
    return log(`[CONVERSION] ${event}`, data, 'success');
  },

  performance(metric, data) {
    return log(`[PERFORMANCE] ${metric}`, data, 'info');
  },

  userAction(action, data) {
    return log(`[USER_ACTION] ${action}`, data, 'info');
  },

  // New ES6+ method for debugging with enhanced formatting
  debug(context, msg, data) {
    if (process.env.LOG_LEVEL === 'debug') {
      return log(`[DEBUG][${context}] ${msg}`, data, 'info');
    }
  },

  // Sanitize body method for safe logging
  sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...body };

    for (const [key, value] of Object.entries(sanitized)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = `${value.substring(0, 100)}... [TRUNCATED]`;
      }
    }

    return sanitized;
  }
};

/**
 * Middleware Express para logging de requests usando arrow function
 * Uso: app.use(requestLogger);
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    // Destructuring para obtener headers importantes
    const { 'user-agent': userAgent, 'x-forwarded-for': forwardedFor } = req.headers;

    log(
      `${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`,
      {
        ip: forwardedFor || req.ip,
        userAgent,
        duration,
        statusCode: res.statusCode,
        method: req.method,
        path: req.originalUrl
      },
      level
    );
  });

  next();
};

/**
 * Función para medir tiempos de ejecución con ES6+ features
 * Uso:
 *   const timer = startTimer('fetchProduct');
 *   // ... código ...
 *   timer.end('CONTEXT'); // → [TIMER] fetchProduct completed in 150ms
 */exports.requestLogger = requestLogger;
const startTimer = (label) => {
  const start = process.hrtime.bigint();

  return {
    end(context = 'TIMER') {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1e6; // nanosegundos → milisegundos

      logger.info(context, `[TIMER] ${label} completed in ${duration.toFixed(2)}ms`, {
        duration: Math.round(duration),
        label,
        timestamp: new Date().toISOString()
      });

      return duration;
    },

    // New method to get duration without logging
    getDuration() {
      const end = process.hrtime.bigint();
      return Number(end - start) / 1e6;
    }
  };
};

/**
 * Enhanced logging for conversion optimization using ES6+ features
 * Track user behavior, performance metrics, and business KPIs
 */exports.startTimer = startTimer;
const trackConversion = (event, data = {}) => {
  const conversionData = {
    timestamp: new Date().toISOString(),
    event,
    ...data, // Spread operator
    sessionInfo: {
      userAgent: data.userAgent,
      ip: data.ip,
      referrer: data.referrer,
      // Enhanced session tracking
      sessionId: data.sessionId,
      userId: data.userId
    }
  };

  logger.conversion(event, conversionData);

  // Return data for potential chaining or further processing
  return conversionData;
};exports.trackConversion = trackConversion;

const trackPerformance = (metric, value, context = {}) => {
  const performanceData = {
    metric,
    value,
    timestamp: new Date().toISOString(),
    // Enhanced performance context
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    ...context
  };

  logger.performance(metric, performanceData);
  return performanceData;
};exports.trackPerformance = trackPerformance;

const trackUserAction = (action, details = {}) => {
  const actionData = {
    action,
    timestamp: new Date().toISOString(),
    // Enhanced action tracking
    sessionDuration: details.sessionDuration,
    pageLoadTime: details.pageLoadTime,
    ...details
  };

  logger.userAction(action, actionData);
  return actionData;
};

// Enhanced error logging with stack trace
exports.trackUserAction = trackUserAction;const logError = (context, message, error, additionalData = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  logger.error(context, message, errorData, error);
  return errorData;
};

// ES6+ exports with both default and named exports
exports.logError = logError;











// Default export for main functionality
var _default = exports.default = {
  log,
  logger,
  requestLogger,
  startTimer,
  trackConversion,
  trackPerformance,
  trackUserAction,
  logError
};
//# sourceMappingURL=logger.js.map