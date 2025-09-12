// Migration compatibility layer - redirects to Prisma
// This file exists temporarily to maintain compatibility during migration
// All new code should import from database_prisma.js directly

import { prisma, testConnection as prismaTestConnection } from './database_prisma.js';
import { logger } from '../utils/bked_logger.js';

// Legacy compatibility - redirect everything to Prisma
export const sequelize = null; // No longer used
export const supabase = null;  // No longer used
export const useSupabase = false; // Force Prisma usage

// Redirect testConnection to Prisma
export const testConnection = prismaTestConnection;

// Legacy executeQuery function - now using Prisma
export const executeQuery = async (query, params = []) => {
    logger.warn('DATABASE', '🔄 Using legacy executeQuery - migrate to Prisma queries', {
        query: `${query.substring(0, 50)}...`,
        params: params?.length || 0
    });
    
    try {
        // For simple queries, use Prisma raw SQL
        const result = await prisma.$queryRawUnsafe(query, ...params);
        return result;
    } catch (error) {
        logger.error('DATABASE', '❌ Legacy query failed', {
            query: `${query.substring(0, 50)}...`,
            error: error.message
        });
        throw error;
    }
};

// Migration notice
logger.info('DATABASE', '🔄 Using database compatibility layer - migrate to database_prisma.js');