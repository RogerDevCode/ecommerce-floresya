#!/usr/bin/env node

/**
 * 🌸 FloresYa Path Correction Script
 * Fixes relative import paths after migration
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, relative } from 'path';

import { glob } from 'glob';

console.log('🔧 Fixing relative import paths for new structure...');

const files = await glob('src/**/*.ts', {
  ignore: ['**/node_modules/**', '**/dist/**']
});

let totalChanges = 0;

for (const filePath of files) {
  const content = readFileSync(filePath, 'utf8');
  const originalContent = content;
  let modifiedContent = content;

  // Calculate correct relative paths

  // Function to calculate correct relative path
  const getRelativePath = (from, to) => {
    const fromSrc = from.startsWith('src/') ? from : `src/${from}`;
    const toSrc = to.startsWith('src/') ? to : `src/${to}`;
    return relative(dirname(fromSrc), toSrc).replace(/\\/g, '/');
  };

  // Fix imports based on file location
  if (filePath.includes('src/app/')) {
    // Files in src/app/ need to go up to src level
    modifiedContent = modifiedContent.replace(
      /from\s+['"]\.\/config\/([^'"]+)['"];?/g,
      (match, configPath) => {
        const relativePath = getRelativePath(filePath, `src/config/${configPath}`);
        return match.replace(`./config/${configPath}`, relativePath);
      }
    );

    modifiedContent = modifiedContent.replace(
      /from\s+['"]\.\/shared\/([^'"]+)['"];?/g,
      (match, sharedPath) => {
        const relativePath = getRelativePath(filePath, `src/shared/${sharedPath}`);
        return match.replace(`./shared/${sharedPath}`, relativePath);
      }
    );
  }

  if (filePath.includes('src/controllers/') ||
      filePath.includes('src/services/') ||
      filePath.includes('src/utils/')) {
    // These files are at src level, so paths are correct
    // But we need to ensure proper extension handling
    modifiedContent = modifiedContent.replace(
      /from\s+['"]\.\/config\/([^'"]+)['"];?/g,
      (match, configPath) => {
        // Remove .js extension if present, let TypeScript handle it
        const cleanPath = configPath.replace(/\.js$/, '');
        return match.replace(configPath, cleanPath);
      }
    );

    modifiedContent = modifiedContent.replace(
      /from\s+['"]\.\/shared\/([^'"]+)['"];?/g,
      (match, sharedPath) => {
        // Remove .js extension if present
        const cleanPath = sharedPath.replace(/\.js$/, '');
        return match.replace(sharedPath, cleanPath);
      }
    );
  }

  if (modifiedContent !== originalContent) {
    writeFileSync(filePath, modifiedContent);
    totalChanges++;
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log(`✅ Path fixes completed: ${totalChanges} files modified`);