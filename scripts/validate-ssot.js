#!/usr/bin/env node

/**
 * 🌸 FloresYa SSOT (Single Source of Truth) Validator
 * ===================================================
 * Validates that there are no duplicate type definitions across the project
 * Ensures compliance with the SSOT rule
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const EXCLUDE_DIRS = ['node_modules', 'dist', '.git'];
const EXCLUDE_FILES = ['*.d.ts', '**/node_modules/**', '**/dist/**'];

// ANSI colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Logging functions
function logError(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.warn(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`${colors.cyan}${colors.bold}📋 ${message}${colors.reset}`);
}

/**
 * Get all TypeScript files in the project
 */
function getTypeScriptFiles() {
  try {
    const findCommand = `find ${SRC_DIR} -name "*.ts" -type f ${EXCLUDE_FILES.map(f => `-not -path "${f}"`).join(' ')}`;
    const output = execSync(findCommand, { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    logError(`Failed to find TypeScript files: ${error.message}`);
    return [];
  }
}

/**
 * Extract export declarations from a TypeScript file
 */
function extractExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const exports = [];

    // Match export patterns
    const exportPatterns = [
      // export interface Name
      /export\s+interface\s+([A-Za-z_][A-Za-z0-9_]*)/g,
      // export type Name
      /export\s+type\s+([A-Za-z_][A-Za-z0-9_]*)/g,
      // export enum Name
      /export\s+enum\s+([A-Za-z_][A-Za-z0-9_]*)/g,
      // export const Name
      /export\s+const\s+([A-Za-z_][A-Za-z0-9_]*)/g,
      // export class Name
      /export\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/g,
      // export function Name
      /export\s+function\s+([A-Za-z_][A-Za-z0-9_]*)/g,
      // export { Name }
      /export\s*{\s*([A-Za-z_][A-Za-z0-9_]*)\s*}/g,
      // export { Name as Alias }
      /export\s*{\s*[A-Za-z_][A-Za-z0-9_]*\s+as\s+([A-Za-z_][A-Za-z0-9_]*)\s*}/g
    ];

    exportPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const exportName = match[1];
        if (exportName && !exports.includes(exportName)) {
          exports.push(exportName);
        }
      }
    });

    return exports;
  } catch (error) {
    logWarning(`Failed to read file ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Check for duplicate exports across all files
 */
function checkForDuplicates(files) {
  const exportMap = new Map();
  const duplicates = [];
  const violations = [];

  files.forEach(filePath => {
    const exports = extractExports(filePath);
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    exports.forEach(exportName => {
      if (exportMap.has(exportName)) {
        const existing = exportMap.get(exportName);
        duplicates.push({
          name: exportName,
          files: [existing.file, relativePath],
          locations: [existing.location, filePath]
        });
      } else {
        exportMap.set(exportName, {
          file: relativePath,
          location: filePath
        });
      }
    });
  });

  // Check for violations of SSOT rules
  duplicates.forEach(duplicate => {
    // Allow duplicates in shared/ directory (index.ts files)
    const isSharedIndex = duplicate.files.every(file =>
      file.includes('src/shared/') && file.endsWith('index.ts')
    );

    // Allow duplicates in frontend/types/ (re-exports)
    const isFrontendReExport = duplicate.files.some(file =>
      file.includes('src/frontend/types/') && !file.includes('globals.d.ts')
    );

    // Allow duplicates in shared subdirectories (types, utils, constants)
    const isSharedSubdirectory = duplicate.files.every(file =>
      file.includes('src/shared/') && (
        file.includes('/types/') ||
        file.includes('/utils/') ||
        file.includes('/constants/')
      ) && file.endsWith('index.ts')
    );

    if (!isSharedIndex && !isFrontendReExport && !isSharedSubdirectory) {
      violations.push(duplicate);
    }
  });

  return { duplicates, violations };
}

/**
 * Check for file name duplicates
 */
function checkFileNameDuplicates() {
  const violations = [];

  try {
    const findCommand = `find ${SRC_DIR} -type f ${EXCLUDE_FILES.map(f => `-not -path "${f}"`).join(' ')}`;
    const output = execSync(findCommand, { encoding: 'utf8' });
    const files = output.trim().split('\n').filter(file => file.length > 0);

    const fileNameMap = new Map();

    files.forEach(filePath => {
      const fileName = path.basename(filePath);
      const relativePath = path.relative(PROJECT_ROOT, filePath);

      // Allow index.ts files in different directories (standard module pattern)
      if (fileName === 'index.ts') {
        return; // Skip index.ts files - they are allowed to be duplicated
      }

      if (fileNameMap.has(fileName)) {
        const existing = fileNameMap.get(fileName);
        violations.push({
          name: fileName,
          files: [existing, relativePath]
        });
      } else {
        fileNameMap.set(fileName, relativePath);
      }
    });
  } catch (error) {
    logError(`Failed to check file name duplicates: ${error.message}`);
  }

  return violations;
}

/**
 * Main validation function
 */
function validateSSOT() {
  logHeader('FloresYa SSOT (Single Source of Truth) Validation');
  logInfo('Scanning TypeScript files for violations...');

  const files = getTypeScriptFiles();
  logInfo(`Found ${files.length} TypeScript files to analyze`);

  // Check for duplicate exports
  const { duplicates, violations: exportViolations } = checkForDuplicates(files);

  // Check for duplicate file names
  const fileNameViolations = checkFileNameDuplicates();

  // Report results
  let hasViolations = false;

  if (exportViolations.length > 0) {
    hasViolations = true;
    logError(`\n🚨 EXPORT VIOLATIONS FOUND (${exportViolations.length}):`);
    exportViolations.forEach((violation, index) => {
      logError(`  ${index + 1}. ${violation.name}:`);
      violation.files.forEach(file => {
        logError(`     - ${file}`);
      });
    });
  } else {
    logSuccess('\n✅ No export violations found');
  }

  if (fileNameViolations.length > 0) {
    hasViolations = true;
    logError(`\n🚨 FILE NAME VIOLATIONS FOUND (${fileNameViolations.length}):`);
    fileNameViolations.forEach((violation, index) => {
      logError(`  ${index + 1}. ${violation.name}:`);
      violation.files.forEach(file => {
        logError(`     - ${file}`);
      });
    });
  } else {
    logSuccess('✅ No file name violations found');
  }

  // Report allowed duplicates
  if (duplicates.length > exportViolations.length) {
    const allowedCount = duplicates.length - exportViolations.length;
    logInfo(`\nℹ️  Found ${allowedCount} allowed duplicates (shared/index.ts files)`);
  }

  // Summary
  if (hasViolations) {
    logError('\n❌ SSOT VALIDATION FAILED');
    logError('Please resolve the violations above before committing');
    process.exit(1);
  } else {
    logSuccess('\n✅ SSOT VALIDATION PASSED');
    logSuccess('All type definitions follow Single Source of Truth principles');
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateSSOT();
}

export { validateSSOT };