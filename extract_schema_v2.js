#!/usr/bin/env node

/**
 * Alternative script to extract database schema from Supabase
 * Uses direct table queries and RPC functions
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

// Known tables in the FloresYa project
const knownTables = [
  'products',
  'product_images',
  'occasions',
  'orders',
  'order_items',
  'order_status_history',
  'users',
  'logs'
];

async function extractSchema() {
  console.log('🔍 Extracting schema from Supabase using table sampling...');

  try {
    let schema = `-- 🌸 FloresYa Database Schema\n-- Generated: ${new Date().toISOString()}\n-- Extracted using table sampling method\n\n`;

    for (const tableName of knownTables) {
      console.log(`  📄 Processing table: ${tableName}`);

      try {
        // Get a sample row to infer column structure
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (sampleError) {
          console.log(`  ⚠️  Unable to access table ${tableName}: ${sampleError.message}`);
          schema += `-- Table: ${tableName} (access restricted)\n\n`;
          continue;
        }

        schema += `-- Table: ${tableName}\n`;

        if (sampleData && sampleData.length > 0) {
          const sample = sampleData[0];
          schema += `-- Sample structure based on existing data:\n`;
          schema += `CREATE TABLE public.${tableName} (\n`;

          const columns = Object.keys(sample).map(columnName => {
            const value = sample[columnName];
            let type = 'text';

            // Infer PostgreSQL type from JavaScript type
            if (typeof value === 'number') {
              type = Number.isInteger(value) ? 'integer' : 'numeric';
            } else if (typeof value === 'boolean') {
              type = 'boolean';
            } else if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))) {
              type = 'timestamp with time zone';
            } else if (typeof value === 'string') {
              if (value.length > 255) {
                type = 'text';
              } else {
                type = `varchar(${Math.max(255, value.length * 2)})`;
              }
            }

            // Special handling for common column names
            if (columnName === 'id' || columnName.endsWith('_id')) {
              type = 'uuid';
            } else if (columnName === 'created_at' || columnName === 'updated_at') {
              type = 'timestamp with time zone';
            } else if (columnName === 'email') {
              type = 'varchar(255)';
            } else if (columnName === 'price' || columnName === 'total' || columnName === 'subtotal') {
              type = 'numeric(10,2)';
            }

            return `  ${columnName} ${type}`;
          });

          schema += columns.join(',\n');
          schema += '\n);\n\n';
        } else {
          schema += `-- Empty table\nCREATE TABLE public.${tableName} (\n  -- Structure unknown (empty table)\n);\n\n`;
        }

      } catch (tableError) {
        console.log(`  ❌ Error processing table ${tableName}:`, tableError.message);
        schema += `-- Table: ${tableName} (error: ${tableError.message})\n\n`;
      }
    }

    // Add notes about extraction method
    schema += `-- NOTES:\n`;
    schema += `-- This schema was extracted by sampling existing data\n`;
    schema += `-- Column types are inferred from JavaScript types and may not match exact PostgreSQL definitions\n`;
    schema += `-- For authoritative schema, use Supabase Dashboard or pg_dump with direct database access\n`;
    schema += `-- Generated on: ${new Date().toISOString()}\n`;

    // Write to file
    fs.writeFileSync('/home/manager/Sync/ecommerce-floresya/supabase_schema.sql', schema);
    console.log('✅ Schema extracted to supabase_schema.sql');
    console.log(`📊 Processed ${knownTables.length} tables`);

  } catch (error) {
    console.error('💥 Error extracting schema:', error);
  }
}

extractSchema();