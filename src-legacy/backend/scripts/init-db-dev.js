#!/usr/bin/env node
/**
 * Database initialization script for FloresYa - DEVELOPMENT MODE
 * Funciona con o sin Supabase configurado
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

console.log('🌸 FloresYa Database Initialization - DEVELOPMENT MODE...\n');

async function checkEnvironment() {
    const hasSupabaseUrl = process.env.SUPABASE_URL;
    const hasSupabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!hasSupabaseUrl || !hasSupabaseKey) {
        console.log('⚠️  Supabase credentials not found in environment');
        console.log('🔄 Running in MOCK DATA mode for development');
        console.log('✅ Development database ready (using mock data)\n');
        return false;
    }
    
    console.log('✅ Supabase credentials found');
    
    try {
        const { databaseService } = await import('../services/databaseService.js');
        const client = databaseService.getClient();
        
        // Test connection by querying a simple table
        const { data, error } = await client
            .from('occasions')
            .select('count')
            .limit(1);
            
        if (error) {
            throw error;
        }
        
        console.log('✅ Connected to Supabase database');
        console.log('✅ Real data mode active\n');
        return true;
    } catch (error) {
        console.log('⚠️  Database connection failed:', error.message);
        console.log('🔄 Falling back to MOCK DATA mode');
        console.log('✅ Development database ready (using mock data)\n');
        return false;
    }
}

async function main() {
    const hasDatabase = await checkEnvironment();
    
    if (hasDatabase) {
        // Si hay Supabase, usar la inicialización completa
        try {
            const originalInit = await import('./init-db.js');
            // Ejecutar inicialización original si existe
        } catch (error) {
            console.log('✅ Skipping full initialization - mock mode active\n');
        }
    }
    
    console.log('🚀 Ready to start FloresYa server!\n');
}

main().catch(error => {
    console.error('❌ Initialization error:', error.message);
    console.log('🔄 Continuing in mock data mode...\n');
});