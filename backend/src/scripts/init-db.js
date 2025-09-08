#!/usr/bin/env node
/**
 * Database initialization script for FloresYa
 * PostgreSQL/Supabase ONLY - No SQLite support
 */

const { supabase, testConnection } = require('../config/database');
require('dotenv').config();

console.log('🌸 FloresYa Database Initialization (PostgreSQL/Supabase Only)...\n');

async function checkDatabaseConnection() {
    try {
        const connected = await testConnection();
        if (!connected) {
            console.error('❌ Could not connect to PostgreSQL/Supabase database');
            console.error('   Please check your SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
            process.exit(1);
        }
        console.log('✅ Connected to PostgreSQL/Supabase database');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('   Please verify your Supabase configuration');
        process.exit(1);
    }
}

async function initializeDatabase() {
    try {
        // Test connection
        await checkDatabaseConnection();
        
        // Check if tables exist (basic check)
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id')
            .limit(1);

        if (productsError && productsError.code === '42P01') {
            console.log('⚠️  Tables do not exist. Please create them in Supabase dashboard first.');
            console.log('   Refer to the PostgreSQL schema files in /database/ directory');
            process.exit(1);
        }

        if (products && products.length > 0) {
            console.log('✅ Database tables exist and contain data');
            console.log('   Database is ready for use\n');
        } else {
            console.log('ℹ️  Database tables exist but are empty');
            console.log('   You may need to seed data manually or via Supabase dashboard\n');
        }

        // Check occasions table
        const { data: occasions, error: occasionsError } = await supabase
            .from('occasions')
            .select('id, name')
            .order('sort_order');

        if (occasions && occasions.length > 0) {
            console.log(`✅ Found ${occasions.length} occasions configured:`);
            occasions.forEach(occasion => {
                console.log(`   - ${occasion.name}`);
            });
        }

        console.log('\n🚀 Database initialization completed successfully');
        console.log('🌐 Your FloresYa application is ready to use!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        // Log technical details for debugging
        console.log('🔍 Technical details (for debugging):');
        console.log(error);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };