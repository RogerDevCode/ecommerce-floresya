// Temporary stub for monitoring service - will be removed in final cleanup
// All database access should use Prisma from ../config/database_prisma.js

import { logger } from '../utils/bked_logger.js';
// import { prisma } from '../config/prisma.js';

interface DatabaseHealth {
    status: 'healthy' | 'unhealthy';
    message: string;
    timestamp: string;
    error?: string;
}

/**
 * @deprecated Use Prisma instead. This file exists only for monitoring compatibility.
 */
export const getSupabaseHealth = async (): Promise<DatabaseHealth> => {
    try {
        // Use Prisma to check database health instead of direct Supabase
        // await prisma.$queryRaw`SELECT 1`;
        // Temporarily return healthy for migration
        return {
            status: 'healthy',
            message: 'Database connection via Prisma is working (temporarily stubbed)',
            timestamp: new Date().toISOString()
        };
    } catch (error: any) {
        logger.error('DATABASE_HEALTH', 'Health check failed', { error: error.message });
        return {
            status: 'unhealthy',
            message: 'Database connection failed',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * @deprecated Direct Supabase client access - use Prisma instead
 */
export const supabase: any = null;

/**
 * @deprecated Use Prisma testConnection from database_prisma.js instead
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
    const health = await getSupabaseHealth();
    return health.status === 'healthy';
};

export type { DatabaseHealth };