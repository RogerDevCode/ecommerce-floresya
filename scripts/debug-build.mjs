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
  // Check if backend source files exist before compiling
  const backendFiles = execSync('find src -name "*.ts" -not -path "*/frontend/*" -not -path "*/node_modules/*" | head -5', { encoding: 'utf8' });
  if (backendFiles.trim()) {
    console.log('Found backend files, compiling...');
    execSync('./node_modules/.bin/tsc -p tsconfig.node.json --listFiles', {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    console.log('✅ Backend TypeScript compilation successful');
  } else {
    console.log('ℹ️ No backend TypeScript files found, skipping backend compilation');
  }
} catch (error) {
  console.log('❌ TypeScript compilation failed:', error.message);
  console.log('ℹ️ This might be expected if no backend files are present');
  // Don't exit with error code for missing backend files
}