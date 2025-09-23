/**
 * 🌸 FloresYa Supabase Configuration - Enterprise Edition
 * Type-safe Supabase client with performance monitoring
 * Uses consolidated types from single source of truth
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
class SupabaseManager {
    static instance;
    client;
    serviceClient;
    constructor() {
        const config = this.getConfig();
        this.client = createClient(config.url, config.anonKey, {
            auth: { persistSession: false }
        });
        this.serviceClient = createClient(config.url, config.serviceKey ?? config.anonKey, {
            auth: { persistSession: false }
        });
    }
    static getInstance() {
        if (!SupabaseManager.instance) {
            SupabaseManager.instance = new SupabaseManager();
        }
        return SupabaseManager.instance;
    }
    getConfig() {
        const url = process.env.SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !anonKey) {
            throw new Error('Missing required Supabase environment variables');
        }
        return { url, anonKey, serviceKey };
    }
    async testConnection() {
        try {
            const { error } = await this.client.from('settings').select('id').limit(1);
            return !error;
        }
        catch (error) {
            console.error('Supabase connection test failed:', error);
            return false;
        }
    }
    getPerformanceMetrics() {
        return {
            timestamp: new Date().toISOString(),
            connectionStatus: 'connected',
            lastQuery: Date.now()
        };
    }
}
// Export singleton instance
const supabaseManager = SupabaseManager.getInstance();
export const supabase = supabaseManager.client;
export const supabaseService = supabaseManager.serviceClient;
export default supabaseManager;
// ============================================
// UTILITY FUNCTIONS
// ============================================
export async function testSupabaseConnection() {
    return supabaseManager.testConnection();
}
export function getSupabaseMetrics() {
    return supabaseManager.getPerformanceMetrics();
}
// ============================================
// TYPE GUARDS
// ============================================
export function isValidOrderStatus(status) {
    return ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status);
}
export function isValidUserRole(role) {
    return ['user', 'admin', 'support'].includes(role);
}
// ============================================
// CONSOLIDATED CONSTANTS
// ============================================
// Re-export consolidated constants
export { Tables, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../shared/constants/index.js';
