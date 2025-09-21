/**
 * 🌸 FloresYa Supabase Configuration - Enterprise Edition
 * Type-safe Supabase client with performance monitoring
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
            auth: { persistSession: false, autoRefreshToken: false }
        });
    }
    static getInstance() {
        if (!SupabaseManager.instance) {
            SupabaseManager.instance = new SupabaseManager();
        }
        return SupabaseManager.instance;
    }
    getConfig() {
        const url = process.env.SUPABASE_URL ?? 'https://placeholder.supabase.co';
        const anonKey = process.env.SUPABASE_ANON_KEY ?? 'placeholder-anon-key';
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        return { url, anonKey, serviceKey };
    }
    async testConnection() {
        try {
            const { error } = await this.client.from('products').select('id').limit(1);
            return !error;
        }
        catch {
            return false;
        }
    }
}
export const supabaseManager = SupabaseManager.getInstance();
export const supabase = supabaseManager.client;
export const supabaseService = supabaseManager.serviceClient;
