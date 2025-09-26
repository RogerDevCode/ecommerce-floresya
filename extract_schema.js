#!/usr/bin/env node

/**
 * Script to extract database schema from Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function extractSchema() {
  console.log('🔍 Extracting schema from Supabase...');

  try {
    // Get table definitions
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);
      return;
    }

    console.log(`📋 Found ${tables.length} tables`);

    let schema = `-- 🌸 FloresYa Database Schema\n-- Generated: ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
      if (table.table_type === 'BASE TABLE') {
        console.log(`  📄 Processing table: ${table.table_name}`);

        // Get column information
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position');

        if (columnsError) {
          console.error(`❌ Error fetching columns for ${table.table_name}:`, columnsError);
          continue;
        }

        schema += `-- Table: ${table.table_name}\n`;
        schema += `CREATE TABLE public.${table.table_name} (\n`;

        const columnDefs = columns.map(col => {
          let def = `  ${col.column_name} ${col.data_type}`;

          if (col.character_maximum_length) {
            def += `(${col.character_maximum_length})`;
          }

          if (col.is_nullable === 'NO') {
            def += ' NOT NULL';
          }

          if (col.column_default) {
            def += ` DEFAULT ${col.column_default}`;
          }

          return def;
        });

        schema += columnDefs.join(',\n');
        schema += '\n);\n\n';
      }
    }

    // Get enum types
    const { data: enums, error: enumsError } = await supabase
      .from('information_schema.enum_types')
      .select('*');

    if (!enumsError && enums && enums.length > 0) {
      schema += '-- Enum Types\n';
      for (const enumType of enums) {
        schema += `-- ENUM: ${enumType.type_name}\n`;
      }
      schema += '\n';
    }

    // Write to file
    fs.writeFileSync('/home/manager/Sync/ecommerce-floresya/supabase_schema.sql', schema);
    console.log('✅ Schema extracted to supabase_schema.sql');

  } catch (error) {
    console.error('💥 Error extracting schema:', error);
  }
}

extractSchema();