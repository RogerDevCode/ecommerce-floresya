"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.prisma = exports.isProduction = exports.isDevelopment = exports.healthCheck = exports.executeTransaction = exports.disconnectPrisma = exports.default = exports.connectPrisma = void 0;




var _index = require("../../src/generated/prisma/index.js");
var _logger = require("../utils/logger.js"); /**
 * Prisma Client Configuration - ES6+ Version
 * Enhanced with modern JavaScript features and better error handling
 */ // Environment detection
const { NODE_ENV } = process.env;const isProduction = exports.isProduction = NODE_ENV === 'production';
const isDevelopment = exports.isDevelopment = NODE_ENV === 'development';

// Enhanced logging configuration using object shorthand
const createPrismaConfig = () => {
  const baseConfig = {
    // Connection pooling settings
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  };

  if (isProduction) {
    return {
      ...baseConfig,
      log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' }],

      // Production optimizations
      errorFormat: 'minimal'
    };
  }

  // Development configuration with enhanced logging
  return {
    ...baseConfig,
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty'
  };
};

// Create Prisma client with enhanced configuration
const prisma = exports.prisma = new _index.PrismaClient(createPrismaConfig());

// Enhanced event handlers using arrow functions and destructuring
const setupEventHandlers = () => {
  // Error handler with enhanced logging
  prisma.$on('error', (e) => {
    (0, _logger.logError)('PRISMA', 'Database error occurred', e, {
      level: 'critical',
      service: 'database',
      timestamp: new Date().toISOString()
    });
  });

  // Warning handler
  prisma.$on('warn', (e) => {
    _logger.logger.warn('PRISMA', 'Database warning', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString()
    });
  });

  // Info handler
  prisma.$on('info', (e) => {
    _logger.logger.info('PRISMA', 'Database info', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString()
    });
  });

  // Enhanced query handler for development
  prisma.$on('query', (e) => {
    if (!isDevelopment) return;

    const { query, params, duration, target } = e;

    // Performance warning for slow queries
    const durationMs = parseInt(duration, 10);
    const isSlowQuery = durationMs > 1000; // 1 second threshold

    const logLevel = isSlowQuery ? 'warn' : 'debug';
    const message = isSlowQuery ?
    `Slow query detected (${duration}ms)` :
    `Query executed (${duration}ms)`;

    _logger.logger[logLevel]('PRISMA_QUERY', message, {
      query: query.length > 200 ? `${query.substring(0, 200)}...` : query,
      params: params.length > 100 ? `${params.substring(0, 100)}...` : params,
      duration,
      target,
      isSlowQuery,
      timestamp: new Date().toISOString()
    });
  });
};

// Connection management with enhanced error handling
const connectPrisma = async () => {
  try {
    await prisma.$connect();
    _logger.logger.success('PRISMA', 'Database connection established successfully', {
      environment: NODE_ENV,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    (0, _logger.logError)('PRISMA', 'Failed to connect to database', error, {
      environment: NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      timestamp: new Date().toISOString()
    });
    return false;
  }
};exports.connectPrisma = connectPrisma;

const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
    _logger.logger.info('PRISMA', 'Database connection closed successfully');
    return true;
  } catch (error) {
    (0, _logger.logError)('PRISMA', 'Error closing database connection', error);
    return false;
  }
};

// Health check function
exports.disconnectPrisma = disconnectPrisma;const healthCheck = async () => {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV
    };
  } catch (error) {
    (0, _logger.logError)('PRISMA', 'Health check failed', error);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: NODE_ENV
    };
  }
};

// Transaction helper with enhanced error handling
exports.healthCheck = healthCheck;const executeTransaction = async (operations, options = {}) => {
  const { timeout = 5000, maxWait = 2000 } = options;

  try {
    const result = await prisma.$transaction(operations, {
      timeout,
      maxWait
    });

    _logger.logger.info('PRISMA_TRANSACTION', 'Transaction completed successfully', {
      operationsCount: operations.length,
      timeout,
      maxWait
    });

    return { success: true, result };
  } catch (error) {
    (0, _logger.logError)('PRISMA_TRANSACTION', 'Transaction failed', error, {
      operationsCount: operations.length,
      timeout,
      maxWait
    });

    return { success: false, error };
  }
};

// Setup event handlers
exports.executeTransaction = executeTransaction;setupEventHandlers();

// Graceful shutdown handling
const setupGracefulShutdown = () => {
  const shutdown = async (signal) => {
    _logger.logger.info('PRISMA', `Received ${signal}, closing database connection...`);
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart
};

// Setup graceful shutdown in non-test environments
if (NODE_ENV !== 'test') {
  setupGracefulShutdown();
}

// Enhanced exports with both named and default exports










// Default export for main functionality
var _default = exports.default = prisma;
//# sourceMappingURL=prisma.js.map