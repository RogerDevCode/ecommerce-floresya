#!/usr/bin/env node
/**
 * Database reset script for FloresYa
 * This script deletes the existing database and recreates it
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../../database/floresya.db');

console.log('🔄 Resetting FloresYa Database...\n');

// Check if database exists
if (fs.existsSync(DB_PATH)) {
    try {
        fs.unlinkSync(DB_PATH);
        console.log('✅ Deleted existing database');
    } catch (err) {
        console.error('❌ Error deleting database:', err);
        process.exit(1);
    }
} else {
    console.log('ℹ️  No existing database found');
}

console.log('🔄 Database reset completed');
console.log('   Run "npm run dev" or "npm run demo" to reinitialize\n');