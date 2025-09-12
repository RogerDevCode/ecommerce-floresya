#!/usr/bin/env node

/**
 * Script de migración de base de datos FloresYa
 * Ejecuta los scripts SQL usando el cliente Supabase nativo
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Faltan variables de entorno');
    console.error('   SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Ejecuta un archivo SQL usando rpc (stored procedure)
 */
async function executeSQLFile(filename, description) {
    try {
        console.log(`\n🔄 Ejecutando: ${description}`);
        console.log(`📄 Archivo: ${filename}`);
        
        const sqlContent = readFileSync(join(__dirname, filename), 'utf8');
        
        // Para scripts complejos, usar rpc con función personalizada
        // O dividir en comandos más simples
        console.log(`📝 Contenido leído: ${sqlContent.length} caracteres`);
        
        // Supabase no permite ejecutar SQL arbitrario por seguridad
        // Recomendación: usar SQL Editor del dashboard
        console.log('⚠️  Para ejecutar este script:');
        console.log('   1. Ve a https://supabase.com/dashboard');
        console.log('   2. Abre tu proyecto FloresYa');
        console.log('   3. Ve al SQL Editor');
        console.log('   4. Copia y pega el contenido del archivo');
        console.log('   5. Clic en "Run"');
        console.log('');
        console.log('📋 CONTENIDO A COPIAR:');
        console.log('═'.repeat(80));
        console.log(sqlContent);
        console.log('═'.repeat(80));
        
        return true;
        
    } catch (error) {
        console.error(`❌ Error ejecutando ${filename}:`, error.message);
        return false;
    }
}

/**
 * Función principal de migración
 */
async function migrate() {
    console.log('🚀 Iniciando migración de base de datos FloresYa');
    console.log('================================================');
    
    const scripts = [
        {
            file: 'supabase_check_before_migration.sql',
            desc: 'Verificación pre-migración (SOLO CONSULTA)'
        },
        {
            file: 'supabase_migration_safe.sql', 
            desc: 'Migración completa y segura'
        },
        {
            file: 'supabase_seed_data.sql',
            desc: 'Datos iniciales del sistema'
        }
    ];
    
    console.log('📋 Scripts a ejecutar:');
    scripts.forEach((script, i) => {
        console.log(`   ${i + 1}. ${script.desc}`);
    });
    
    console.log('\n⚠️  IMPORTANTE: Los scripts se mostrarán para copiar al SQL Editor');
    console.log('   Supabase no permite ejecución directa de SQL por seguridad');
    
    for (const script of scripts) {
        const success = await executeSQLFile(script.file, script.desc);
        if (!success) {
            console.error('❌ Migración interrumpida por error');
            process.exit(1);
        }
        
        // Pausa para copiar contenido
        console.log('\n⏸️  Presiona Enter cuando hayas ejecutado este script en Supabase...');
        await new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });
    }
    
    console.log('\n✅ ¡Migración completada!');
    console.log('🔄 Ahora ejecuta: npm run dev');
}

// Ejecutar migración
migrate().catch(error => {
    console.error('❌ Error en migración:', error);
    process.exit(1);
});