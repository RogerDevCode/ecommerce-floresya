#!/usr/bin/env node

/**
 * Fix .js imports to .ts in compiled files
 */

import { readFileSync, writeFileSync } from 'fs';

import { glob } from 'glob';

const files = await glob('src/**/*.ts');

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  const originalContent = content;

  // Replace .js imports with .ts (without extension for TypeScript compilation)
  content = content.replace(/from\s+['"](.+?)\.js['"];?/g, (match, path) => {
    if (path.startsWith('./') || path.startsWith('../')) {
      return match.replace('.js', '');
    }
    return match;
  });

  // Replace require .js imports with .ts
  content = content.replace(/require\(['"](.+?)\.js['"]\)/g, (match, path) => {
    if (path.startsWith('./') || path.startsWith('../')) {
      return match.replace('.js', '');
    }
    return match;
  });

  if (content !== originalContent) {
    writeFileSync(file, content);
    console.log(`Fixed: ${file}`);
  }
}

console.log('✅ Import fixes completed');