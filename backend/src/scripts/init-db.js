#!/usr/bin/env node
/**
 * Database initialization script for FloresYa
 * This script creates the SQLite database and populates it with sample data
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../../../database/floresya.db');
const SCHEMA_PATH = path.join(__dirname, '../../../database/schema_sqlite.sql');
const SEED_DATA_PATH = path.join(__dirname, '../../../database/seed_data_sqlite.sql');

console.log('🌸 Initializing FloresYa Database...\n');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('📁 Created database directory');
}

// Check if database already exists
const dbExists = fs.existsSync(DB_PATH);
if (dbExists) {
    console.log('✅ Database already exists, skipping initialization');
    console.log('   Use "npm run db:reset" to recreate the database\n');
    process.exit(0);
}

// Create database and initialize
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error creating database:', err);
        process.exit(1);
    }
    console.log('✅ Created SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) {
        console.error('❌ Error enabling foreign keys:', err);
        process.exit(1);
    }
    console.log('✅ Enabled foreign key constraints');
});

// Read and execute schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

// Better SQL statement parsing that handles multi-line statements and BEGIN/END blocks
const schemaStatements = [];
let currentStatement = '';
let blockDepth = 0;
const lines = schema.split('\n');

for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and standalone comments
    if (!trimmedLine || (trimmedLine.startsWith('--') && !currentStatement)) {
        continue;
    }
    
    // Don't skip inline comments that are part of a statement
    if (trimmedLine.startsWith('--') && currentStatement) {
        continue;
    }
    
    currentStatement += line + '\n';
    
    // Track BEGIN/END blocks
    if (trimmedLine.toUpperCase().includes('BEGIN')) {
        blockDepth++;
    }
    if (trimmedLine.toUpperCase().includes('END;')) {
        blockDepth--;
    }
    
    // If line ends with semicolon and we're not inside a block, it's the end of a statement
    if (trimmedLine.endsWith(';') && blockDepth === 0) {
        const statement = currentStatement.trim();
        if (statement && statement !== 'PRAGMA foreign_keys = ON;') {
            schemaStatements.push(statement);
        }
        currentStatement = '';
    }
}

// Add any remaining statement
if (currentStatement.trim()) {
    schemaStatements.push(currentStatement.trim());
}

console.log(`📋 Executing ${schemaStatements.length} schema statements...`);

let executed = 0;
const executeNext = () => {
    if (executed >= schemaStatements.length) {
        loadSeedData();
        return;
    }
    
    const statement = schemaStatements[executed];
    db.run(statement, (err) => {
        if (err) {
            console.error(`❌ Error executing schema statement ${executed + 1}:`, err);
            console.error('Statement:', statement.substring(0, 100) + '...');
            process.exit(1);
        }
        executed++;
        executeNext();
    });
};

const loadSeedData = () => {
    console.log('✅ Schema created successfully');
    console.log('📊 Loading sample data...');
    
    const seedData = fs.readFileSync(SEED_DATA_PATH, 'utf8');
    
    // Parse seed data statements with same logic as schema
    const seedStatements = [];
    let currentStatement = '';
    let blockDepth = 0;
    const lines = seedData.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines and standalone comments
        if (!trimmedLine || (trimmedLine.startsWith('--') && !currentStatement)) {
            continue;
        }
        
        // Don't skip inline comments that are part of a statement
        if (trimmedLine.startsWith('--') && currentStatement) {
            continue;
        }
        
        currentStatement += line + '\n';
        
        // Track BEGIN/END blocks
        if (trimmedLine.toUpperCase().includes('BEGIN')) {
            blockDepth++;
        }
        if (trimmedLine.toUpperCase().includes('END;')) {
            blockDepth--;
        }
        
        // If line ends with semicolon and we're not inside a block, it's the end of a statement
        if (trimmedLine.endsWith(';') && blockDepth === 0) {
            const statement = currentStatement.trim();
            if (statement) {
                seedStatements.push(statement);
            }
            currentStatement = '';
        }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
        seedStatements.push(currentStatement.trim());
    }
    
    let seedExecuted = 0;
    const executeSeedNext = () => {
        if (seedExecuted >= seedStatements.length) {
            finalizateSetup();
            return;
        }
        
        const statement = seedStatements[seedExecuted];
        db.run(statement, (err) => {
            if (err) {
                console.error(`❌ Error executing seed statement ${seedExecuted + 1}:`, err);
                console.error('Statement:', statement.substring(0, 100) + '...');
                process.exit(1);
            }
            seedExecuted++;
            executeSeedNext();
        });
    };
    
    executeSeedNext();
};

const finalizateSetup = () => {
    console.log('✅ Sample data loaded successfully');
    
    // Verify setup by counting records
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (err) {
            console.error('❌ Error verifying setup:', err);
            process.exit(1);
        }
        
        console.log(`📦 ${row.count} products loaded`);
        
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (err) {
                console.error('❌ Error verifying users:', err);
                process.exit(1);
            }
            
            console.log(`👥 ${row.count} users loaded`);
            
            db.get("SELECT COUNT(*) as count FROM orders", (err, row) => {
                if (err) {
                    console.error('❌ Error verifying orders:', err);
                    process.exit(1);
                }
                
                console.log(`📋 ${row.count} sample orders loaded`);
                
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err);
                        process.exit(1);
                    }
                    
                    console.log('\n🎉 Database initialization completed successfully!');
                    console.log('\n📖 Demo Accounts:');
                    console.log('   👨‍💼 Admin: admin@floresya.com / admin123');
                    console.log('   👤 Customer: cliente@ejemplo.com / customer123');
                    console.log('   👤 Customer: juan@ejemplo.com / customer123');
                    console.log('\n🚀 Starting application...\n');
                });
            });
        });
    });
};

// Start the process
executeNext();

// Handle errors and cleanup
process.on('SIGINT', () => {
    console.log('\n⚠️  Initialization interrupted');
    if (db) {
        db.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught exception:', err);
    if (db) {
        db.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});