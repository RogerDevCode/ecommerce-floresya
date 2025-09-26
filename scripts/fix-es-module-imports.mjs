#!/usr/bin/env node

/**
 * Fix ES module imports - add .js extensions to all local imports
 */

import { readFileSync, writeFileSync } from 'fs';

import { glob } from 'glob';

console.log('🔧 Fixing ES module imports by adding .js extensions...');

// Find all TypeScript files in src
const files = await glob('src/**/*.ts', {
  ignore: ['**/node_modules/**', '**/dist/**']
});

let totalChanges = 0;

for (const filePath of files) {
  const content = readFileSync(filePath, 'utf8');
  const originalContent = content;
  let modifiedContent = content;

  // Fix imports from local files (starting with ./ or ../)
  // More comprehensive regex to catch all local imports
  modifiedContent = modifiedContent.replace(
    /(from\s+['"])(\.\.?\/[^'"]+?)(['"];?)/g,
    (match, prefix, importPath, suffix) => {
      // Skip if already has .js extension
      if (importPath.endsWith('.js')) {
        return match;
      }
      // Skip if has other extension (like .json, .css, etc)
      if (importPath.match(/\.[a-z]+$/)) {
        return match;
      }
      // Add .js extension
      return `${prefix}${importPath}.js${suffix}`;
    }
  );

  if (modifiedContent !== originalContent) {
    writeFileSync(filePath, modifiedContent);
    totalChanges++;
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log(`✅ ES module import fixes completed: ${totalChanges} files modified`);