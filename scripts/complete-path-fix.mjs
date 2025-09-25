#!/usr/bin/env node

/**
 * Complete the path fixing for all remaining files
 */

import { readFileSync, writeFileSync } from 'fs';

import { glob } from 'glob';

console.log('🔧 Completing path fixes...');

// Files that need ./shared and ./config to work properly
const filesToFix = [
  'src/controllers/ProductController.ts',
  'src/controllers/UserController.ts',
  'src/services/OccasionsService.ts',
  'src/services/OrderService.ts',
  'src/services/ProductService.ts',
  'src/services/TypeSafeDatabaseService.ts',
  'src/services/UserService.ts',
  'src/utils/schema-extractor.ts'
];

for (const filePath of filesToFix) {
  let content = readFileSync(filePath, 'utf8');
  const originalContent = content;

  // These files should use relative paths to shared and config
  // Since they're at the same level as those directories

  // Fix config imports - remove any extensions
  content = content.replace(/from\s+['"]\.\/config\/([^'"]+)['"];?/g, (match, configPath) => {
    const cleanPath = configPath.replace(/\.js$/, '').replace(/\.ts$/, '');
    return match.replace(configPath, cleanPath);
  });

  // Fix shared imports - remove any extensions
  content = content.replace(/from\s+['"]\.\/shared\/([^'"]+)['"];?/g, (match, sharedPath) => {
    const cleanPath = sharedPath.replace(/\.js$/, '').replace(/\.ts$/, '');
    return match.replace(sharedPath, cleanPath);
  });

  if (content !== originalContent) {
    writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log('✅ All path fixes completed!');