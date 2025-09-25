#!/usr/bin/env node

/**
 * Fix incorrect relative paths in specific files
 */

import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Fixing incorrect relative paths...');

const fixes = [
  {
    file: 'src/services/TypeSafeDatabaseService.ts',
    replacements: [
      { from: './config/supabase', to: '../config/supabase' }
    ]
  },
  {
    file: 'src/controllers/ProductController.ts',
    replacements: [
      { from: './config/supabase', to: '../config/supabase' }
    ]
  },
  {
    file: 'src/controllers/UserController.ts',
    replacements: [
      { from: './config/supabase', to: '../config/supabase' }
    ]
  },
  {
    file: 'src/utils/schema-extractor.ts',
    replacements: [
      { from: './config/supabase', to: '../config/supabase' }
    ]
  },
  {
    file: 'src/services/OccasionsService.ts',
    replacements: [
      { from: './shared/types', to: '../shared/types' }
    ]
  },
  {
    file: 'src/services/OrderService.ts',
    replacements: [
      { from: './shared/types', to: '../shared/types' }
    ]
  },
  {
    file: 'src/services/ProductService.ts',
    replacements: [
      { from: './shared/types', to: '../shared/types' },
      { from: './shared/utils', to: '../shared/utils' }
    ]
  },
  {
    file: 'src/services/UserService.ts',
    replacements: [
      { from: './shared/types', to: '../shared/types' }
    ]
  }
];

let totalChanges = 0;

for (const { file, replacements } of fixes) {
  let content = readFileSync(file, 'utf8');
  const originalContent = content;

  for (const { from, to } of replacements) {
    content = content.replace(`from '${from}'`, `from '${to}'`);
    content = content.replace(`from "${from}"`, `from "${to}"`);
    content = content.replace(`require('${from}')`, `require('${to}')`);
    content = content.replace(`require("${from}")`, `require("${to}")`);
  }

  if (content !== originalContent) {
    writeFileSync(file, content);
    totalChanges++;
    console.log(`✅ Fixed: ${file}`);
  }
}

console.log(`✅ Incorrect path fixes completed: ${totalChanges} files modified`);