/**
 * Prisma Client Configuration - ES6+ Version
 * Enhanced with modern JavaScript features and better error handling
 */

import { PrismaClient } from '../../src/generated/prisma/index.js';
import { logger, logError } from '../utils/logger.js';

// Environment detection
const { NODE_ENV } = process.env;
const isProduction = NODE_ENV === 'production';
const isDevelopment = NODE_ENV === 'development';

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
                { emit: 'event', level: 'warn' }
            ],
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
const prisma = new PrismaClient(createPrismaConfig());

// Enhanced event handlers using arrow functions and destructuring
const setupEventHandlers = () => {
    // Error handler with enhanced logging
    prisma.$on('error', (e) => {
        logError('PRISMA', 'Database error occurred', e, {
            level: 'critical',
            service: 'database',
            timestamp: new Date().toISOString()
        });
    });

    // Warning handler
    prisma.$on('warn', (e) => {
        logger.warn('PRISMA', 'Database warning', {
            message: e.message,
            target: e.target,
            timestamp: new Date().toISOString()
        });
    });

    // Info handler
    prisma.$on('info', (e) => {
        logger.info('PRISMA', 'Database info', {
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
        const message = isSlowQuery 
            ? `Slow query detected (${duration}ms)` 
            : `Query executed (${duration}ms)`;

        logger[logLevel]('PRISMA_QUERY', message, {
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
        logger.success('PRISMA', 'Database connection established successfully', {
            environment: NODE_ENV,
            timestamp: new Date().toISOString()
        });
        return true;
    } catch (error) {
        logError('PRISMA', 'Failed to connect to database', error, {
            environment: NODE_ENV,
            databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
            timestamp: new Date().toISOString()
        });
        return false;
    }
};

const disconnectPrisma = async () => {
    try {
        await prisma.$disconnect();
        logger.info('PRISMA', 'Database connection closed successfully');
        return true;
    } catch (error) {
        logError('PRISMA', 'Error closing database connection', error);
        return false;
    }
};

// Health check function
const healthCheck = async () => {
    try {
        // Simple query to test connection
        await prisma.$queryRaw`SELECT 1`;
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: NODE_ENV
        };
    } catch (error) {
        logError('PRISMA', 'Health check failed', error);
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
            environment: NODE_ENV
        };
    }
};

// Transaction helper with enhanced error handling
const executeTransaction = async (operations, options = {}) => {
    const { timeout = 5000, maxWait = 2000 } = options;
    
    try {
        const result = await prisma.$transaction(operations, {
            timeout,
            maxWait
        });
        
        logger.info('PRISMA_TRANSACTION', 'Transaction completed successfully', {
            operationsCount: operations.length,
            timeout,
            maxWait
        });
        
        return { success: true, result };
    } catch (error) {
        logError('PRISMA_TRANSACTION', 'Transaction failed', error, {
            operationsCount: operations.length,
            timeout,
            maxWait
        });
        
        return { success: false, error };
    }
};

// Setup event handlers
setupEventHandlers();

// Graceful shutdown handling
const setupGracefulShutdown = () => {
    const shutdown = async (signal) => {
        logger.info('PRISMA', `Received ${signal}, closing database connection...`);
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
export {
    prisma,
    connectPrisma,
    disconnectPrisma,
    healthCheck,
    executeTransaction,
    isProduction,
    isDevelopment
};

// Default export for main functionality
export default prisma;