#!/usr/bin/env node

/**
 * Debug Build Script for Vercel
 * Shows what files exist before running TypeScript compilation
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 Debugging build environment...');
console.log('Current working directory:', process.cwd());

console.log('\n📁 Contents of src directory:');
try {
  const srcContents = execSync('find src -type f -name "*.ts" | head -20', { encoding: 'utf8' });
  console.log(srcContents);
} catch (error) {
  console.log('Error listing src contents:', error.message);
}

console.log('\n📋 TypeScript config:');
try {
  const tsconfig = readFileSync('tsconfig.node.json', 'utf8');
  console.log(tsconfig);
} catch (error) {
  console.log('Error reading tsconfig:', error.message);
}

console.log('\n🔨 Running TypeScript compilation...');
try {
  const result = execSync('npx tsc -p tsconfig.node.json --listFiles', {
    encoding: 'utf8',
    stdio: 'inherit'
  });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed:', error.message);
  process.exit(1);
}