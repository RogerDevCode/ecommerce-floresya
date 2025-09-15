/**
 * 🌸 FloresYa - Database Migration Runner
 * Execute SQL migrations against Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runMigration(migrationPath) {
  try {
    console.log(`🔄 Running migration: ${migrationPath}`);

    // Read the SQL file
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          return false;
        }
      }
    }

    console.log('✅ Migration completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

async function main() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('❌ Usage: node run-migration.js <migration-file.sql>');
    process.exit(1);
  }

  const migrationPath = path.resolve(migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  console.log('🌸 FloresYa Database Migration Runner');
  console.log('=====================================');
  console.log(`📁 Migration file: ${migrationPath}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log('');

  const success = await runMigration(migrationPath);

  if (success) {
    console.log('');
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } else {
    console.log('');
    console.log('💥 Migration failed!');
    process.exit(1);
  }
}

main();