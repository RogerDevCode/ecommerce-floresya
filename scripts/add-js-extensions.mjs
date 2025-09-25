#!/usr/bin/env node

/**
 * Add .js extensions to relative imports for ES module compatibility
 */

import { readFileSync, writeFileSync } from 'fs';

import { glob } from 'glob';

console.log('🔧 Adding .js extensions to imports...');

const files = await glob('src/**/*.ts', {
  ignore: ['**/node_modules/**', '**/dist/**']
});

let totalChanges = 0;

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Add .js extension to relative imports (those starting with ./ or ../)
  content = content.replace(
    /from\s+['"](\.[^'"]*?)['"];?/g,
    (match, importPath) => {
      // Skip if already has an extension
      if (importPath.includes('.')) {
        return match;
      }

      // Add .js extension
      return match.replace(importPath, `${importPath}.js`);
    }
  );

  // Also handle require statements
  content = content.replace(
    /require\(['"](\.[^'"]*?)['"]\)/g,
    (match, importPath) => {
      // Skip if already has an extension
      if (importPath.includes('.')) {
        return match;
      }

      // Add .js extension
      return match.replace(importPath, `${importPath}.js`);
    }
  );

  if (content !== originalContent) {
    writeFileSync(filePath, content);
    totalChanges++;
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log(`✅ Added .js extensions: ${totalChanges} files modified`);