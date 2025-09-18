#!/usr/bin/env node

/**
 * 🔍 Script para verificar configuración de variables de entorno
 * Ejecutar con: node scripts/check-env.js
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

console.log('🔍 Verificando configuración de variables de entorno...\n');

// 1. Verificar que existan las variables
let allPresent = true;
for (const envVar of required) {
  const value = process.env[envVar];
  if (!value) {
    console.log(`❌ ${envVar}: NO CONFIGURADA`);
    allPresent = false;
  } else {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`);
  }
}

if (!allPresent) {
  console.log('\n❌ Faltan variables de entorno. Configúralas y vuelve a ejecutar.');
  process.exit(1);
}

// 2. Verificar conexión a Supabase
console.log('\n🔗 Verificando conexión a Supabase...');

try {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Test básico de conexión
  const { data, error } = await supabase
    .from('occasions')
    .select('count')
    .limit(1);

  if (error) {
    console.log(`⚠️  Conexión establecida pero query falló: ${error.message}`);
  } else {
    console.log('✅ Conexión a Supabase exitosa');
  }

} catch (error) {
  console.log(`❌ Error conectando a Supabase: ${error.message}`);
}

console.log('\n📋 Valores para GitHub Secrets:');
console.log('========================');
for (const envVar of required) {
  console.log(`${envVar}=${process.env[envVar]}`);
}

console.log('\n🔧 Copia estos valores a:');
console.log('GitHub > Repository > Settings > Secrets and variables > Actions');