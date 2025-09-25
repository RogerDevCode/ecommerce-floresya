#!/usr/bin/env node

/**
 * 🚀 FloresYa Import Migration Script
 * Migrates import paths for new compilation architecture
 * Uses Factory Pattern + Dictionary-based mapping for maximum efficiency
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// 📖 Dictionary-based Import Mappings
const IMPORT_MAPPINGS = {
  backend: {
    // Shared imports
    '../shared/types': './shared/types',
    '../../shared/types': './shared/types',
    '../shared/utils': './shared/utils',
    '../../shared/utils': './shared/utils',
    '../shared/': './shared/',
    '../../shared/': './shared/',

    // Config imports
    '../config/': './config/',
    '../../config/': './config/',
    '../config/supabase': './config/supabase',
    '../../config/supabase': './config/supabase',
    '../config/swagger': './config/swagger',
    '../../config/swagger': './config/swagger',
  },
  frontend: {
    // Shared imports
    '../shared/types': './shared/types',
    '../../shared/types': './shared/types',
    '../shared/utils': './shared/utils',
    '../../shared/utils': './shared/utils',
    '../shared/': './shared/',
    '../../shared/': './shared/',

    // Config imports
    '../config/': './config/',
    '../../config/': './config/',
    '../config/supabase': './config/supabase',
    '../../config/supabase': './config/supabase',
    '../config/swagger': './config/swagger',
    '../../config/swagger': './config/swagger',
  }
};

// 🏭 Migration Factory Pattern
class MigrationFactory {
  static create(fileType) {
    switch(fileType) {
      case 'backend':
        return new BackendImportMigrator();
      case 'frontend':
        return new FrontendImportMigrator();
      case 'shared':
        return new SharedImportMigrator();
      case 'config':
        return new ConfigImportMigrator();
      default:
        throw new Error(`Unknown file type: ${fileType}`);
    }
  }
}

// 🎯 Base Import Migrator
class BaseImportMigrator {
  constructor(mappings) {
    this.mappings = mappings;
    this.changesCount = 0;
  }

  migrateImports(content, filePath) {
    let modifiedContent = content;

    // Regex patterns for different import styles
    const importPatterns = [
      // import ... from '...'
      /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"];?/g,
      // const ... = require('...')
      /const\s+(?:\{[^}]*\}|\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
      // require('...')
      /require\(['"]([^'"]+)['"]\)/g,
      // Dynamic imports
      /import\(['"]([^'"]+)['"]\)/g,
    ];

    for (const pattern of importPatterns) {
      modifiedContent = modifiedContent.replace(pattern, (match, importPath) => {
        const newPath = this.transformPath(importPath, filePath);
        if (newPath !== importPath) {
          this.changesCount++;
          return match.replace(importPath, newPath);
        }
        return match;
      });
    }

    return modifiedContent;
  }

  transformPath(importPath, filePath) {
    // Check exact matches first
    if (this.mappings[importPath]) {
      console.log(`  📝 ${importPath} → ${this.mappings[importPath]}`);
      return this.mappings[importPath];
    }

    // Check partial matches
    for (const [oldPath, newPath] of Object.entries(this.mappings)) {
      if (importPath.startsWith(oldPath)) {
        const transformed = importPath.replace(oldPath, newPath);
        console.log(`  📝 ${importPath} → ${transformed}`);
        return transformed;
      }
    }

    return importPath;
  }

  getChangesCount() {
    return this.changesCount;
  }
}

// 🏢 Backend Import Migrator
class BackendImportMigrator extends BaseImportMigrator {
  constructor() {
    super(IMPORT_MAPPINGS.backend);
  }
}

// 🎨 Frontend Import Migrator
class FrontendImportMigrator extends BaseImportMigrator {
  constructor() {
    super(IMPORT_MAPPINGS.frontend);
  }
}

// 🤝 Shared Import Migrator
class SharedImportMigrator extends BaseImportMigrator {
  constructor() {
    // Shared files use backend mappings since they're compiled to both locations
    super(IMPORT_MAPPINGS.backend);
  }
}

// ⚙️ Config Import Migrator
class ConfigImportMigrator extends BaseImportMigrator {
  constructor() {
    // Config files use backend mappings since they're compiled to both locations
    super(IMPORT_MAPPINGS.backend);
  }
}

// 🔍 File Type Detector
class FileTypeDetector {
  static detect(filePath) {
    const normalizedPath = filePath.replace(/\\\\/g, '/');

    if (normalizedPath.includes('/frontend/')) {
      return 'frontend';
    } else if (normalizedPath.includes('/shared/')) {
      return 'shared';
    } else if (normalizedPath.includes('/config/')) {
      return 'config';
    } else {
      // Default to backend for other src files
      return 'backend';
    }
  }
}

// 📊 Migration Statistics
class MigrationStats {
  constructor() {
    this.filesProcessed = 0;
    this.filesModified = 0;
    this.totalChanges = 0;
    this.errors = [];
  }

  addFile(modified, changes) {
    this.filesProcessed++;
    if (modified) {
      this.filesModified++;
      this.totalChanges += changes;
    }
  }

  addError(error) {
    this.errors.push(error);
  }

  print() {
    console.log('\\n📊 Migration Statistics:');
    console.log(`  📁 Files processed: ${this.filesProcessed}`);
    console.log(`  ✏️  Files modified: ${this.filesModified}`);
    console.log(`  🔄 Total changes: ${this.totalChanges}`);

    if (this.errors.length > 0) {
      console.log(`  ❌ Errors: ${this.errors.length}`);
      this.errors.forEach(error => console.log(`    - ${error}`));
    } else {
      console.log(`  ✅ No errors detected`);
    }
  }
}

// 🚀 Main Migration Engine
class MigrationEngine {
  constructor() {
    this.stats = new MigrationStats();
    this.dryRun = false;
  }

  async migrate(options = {}) {
    this.dryRun = options.dryRun || false;

    console.log('🚀 FloresYa Import Migration Engine');
    console.log(`📁 Project root: ${PROJECT_ROOT}`);
    console.log(`${this.dryRun ? '🧪 DRY RUN MODE' : '✏️  WRITE MODE'}`);
    console.log('\\n📂 Scanning TypeScript files...');

    // Find all TypeScript files in src
    const pattern = join(PROJECT_ROOT, 'src/**/*.ts');
    const files = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    });

    console.log(`📄 Found ${files.length} TypeScript files`);

    for (const filePath of files) {
      await this.processFile(filePath);
    }

    this.stats.print();

    if (!this.dryRun && this.stats.totalChanges > 0) {
      console.log('\\n✅ Migration completed successfully!');
      console.log('🔧 Next steps:');
      console.log('  1. Run: npm run type:check');
      console.log('  2. Run: npm run build:backend');
      console.log('  3. Run: npm run build:frontend');
    }
  }

  async processFile(filePath) {
    try {
      const relativePath = filePath.replace(PROJECT_ROOT, '');
      console.log(`\\n📄 Processing: ${relativePath}`);

      if (!existsSync(filePath)) {
        this.stats.addError(`File not found: ${relativePath}`);
        return;
      }

      const content = readFileSync(filePath, 'utf8');
      const fileType = FileTypeDetector.detect(filePath);

      console.log(`  🏷️  Type: ${fileType}`);

      const migrator = MigrationFactory.create(fileType);
      const modifiedContent = migrator.migrateImports(content, filePath);

      const changes = migrator.getChangesCount();
      const wasModified = changes > 0;

      if (wasModified) {
        console.log(`  ✏️  Changes: ${changes}`);

        if (!this.dryRun) {
          writeFileSync(filePath, modifiedContent, 'utf8');
          console.log(`  💾 File saved`);
        } else {
          console.log(`  🧪 Would save (dry run)`);
        }
      } else {
        console.log(`  ✅ No changes needed`);
      }

      this.stats.addFile(wasModified, changes);

    } catch (error) {
      const relativePath = filePath.replace(PROJECT_ROOT, '');
      const errorMsg = `Error processing ${relativePath}: ${error.message}`;
      console.error(`  ❌ ${errorMsg}`);
      this.stats.addError(errorMsg);
    }
  }
}

// 🎮 CLI Handler
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
🚀 FloresYa Import Migration Script

Usage:
  node scripts/migrate-imports.mjs [options]

Options:
  --dry-run, -d    Run without making changes (preview mode)
  --help, -h       Show this help message

Examples:
  node scripts/migrate-imports.mjs --dry-run    # Preview changes
  node scripts/migrate-imports.mjs             # Apply changes
`);
    process.exit(0);
  }

  const engine = new MigrationEngine();
  await engine.migrate({ dryRun });
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

export { MigrationEngine, MigrationFactory };