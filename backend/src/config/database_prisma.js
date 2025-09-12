import { prisma } from './prisma.js';
import dbAdapter from './database_adapter.js';
import { logger } from '../utils/bked_logger.js';

/**
 * 🌸 FloresYa Database Configuration - Prisma Only
 * This file consolidates all database access through Prisma ORM
 * Eliminates Sequelize and direct Supabase connections
 */

// Test Prisma connection
const testConnection = async () => {
    try {
        logger.info('DATABASE', '🔍 Testing Prisma connection...');
        
        // Simple query to test connection
        await prisma.$queryRaw`SELECT 1 as test`;
        
        logger.success('DATABASE', '✅ Prisma connection successful');
        return true;
    } catch (error) {
        logger.error('DATABASE', '❌ Prisma connection failed', {
            error: error.message,
            code: error.code
        });
        return false;
    }
};

// Get connection info
const getConnectionInfo = async () => {
    try {
        const result = await prisma.$queryRaw`
            SELECT 
                current_database() as database,
                current_user as user,
                inet_server_addr() as host,
                inet_server_port() as port,
                version() as version
        `;
        return result[0];
    } catch (error) {
        logger.error('DATABASE', '❌ Could not get connection info', { error: error.message });
        return null;
    }
};

// Initialize database service with smart adapter and graceful failure handling
const initializeDatabase = async () => {
    try {
        logger.info('DATABASE', '🚀 Initializing smart database service...');
        
        // Initialize the smart adapter that handles both Prisma and Supabase
        const adapterInitialized = await dbAdapter.initialize();
        
        // Try to get connection info if Prisma is available
        const connectionInfo = await getConnectionInfo();
        if (connectionInfo) {
            logger.info('DATABASE', '📊 Database connection info', {
                database: connectionInfo.database,
                user: connectionInfo.user,
                host: connectionInfo.host,
                port: connectionInfo.port
            });
        }
        
        logger.success('DATABASE', '✅ Smart database service initialized successfully');
        return adapterInitialized;
    } catch (error) {
        logger.error('DATABASE', '❌ Database initialization error:', error.message);
        logger.info('DATABASE', '💡 Server will continue with available database connections');
        return true; // Always return true to allow server to start
    }
};

// Graceful shutdown
const closeConnection = async () => {
    try {
        logger.info('DATABASE', '🔄 Closing Prisma connection...');
        await prisma.$disconnect();
        logger.success('DATABASE', '✅ Prisma connection closed successfully');
    } catch (error) {
        logger.error('DATABASE', '❌ Error closing Prisma connection', {
            error: error.message
        });
    }
};

export {
    prisma,
    dbAdapter,
    testConnection,
    getConnectionInfo,
    initializeDatabase,
    closeConnection
};