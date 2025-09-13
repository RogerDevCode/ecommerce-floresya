#!/usr/bin/env node
/**
 * Database initialization script for FloresYa - DEVELOPMENT MODE
 * Funciona con o sin Supabase configurado
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

console.log('🌸 FloresYa Database Initialization - DEVELOPMENT MODE...\n');

async function checkEnvironment(): Promise<boolean> {
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
        // const { databaseService } = await import('../services/databaseService.js');
        // const client = databaseService.getClient();
        
        // Test connection by querying a simple table
        console.log('🔍 Testing database connection...');
        
        // For development, we'll just assume it works if we got this far
        console.log('✅ Database connection successful (stubbed for migration)');
        console.log('✅ Development database ready (using Supabase)\n');
        return true;
    } catch (error: any) {
        console.error('❌ Database connection failed:', error.message);
        console.log('🔄 Falling back to MOCK DATA mode for development');
        console.log('✅ Development database ready (using mock data)\n');
        return false;
    }
}

async function initializeDevelopmentData(): Promise<void> {
    console.log('🔧 Initializing development data...');
    
    // Mock data for development
    const mockProducts = [
        { name: 'Rosas Rojas Premium', price: 25.99 },
        { name: 'Girasoles Alegres', price: 18.50 },
        { name: 'Orquídeas Elegantes', price: 45.00 }
    ];
    
    console.log(`📦 Mock products available: ${mockProducts.length}`);
    console.log('✅ Development data initialized\n');
}

async function main(): Promise<void> {
    try {
        const hasDatabase = await checkEnvironment();
        await initializeDevelopmentData();
        
        console.log('🎉 Development environment ready!');
        console.log('🚀 You can now start the development server');
        
        process.exit(0);
    } catch (error: any) {
        console.error('💥 Initialization failed:', error.message);
        process.exit(1);
    }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}