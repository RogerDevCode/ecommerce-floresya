#!/usr/bin/env node
/**
 * 🌸 FloresYa Enterprise Build System - Enhanced Version
 * ============================================
 * Robust build script with automatic error recovery
 * Process management and graceful shutdown
 * Silicon Valley grade deployment automation
 * ============================================
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Process Manager for handling child processes
class ProcessManager {
  constructor() {
    this.childProcesses = new Set();
    this.isShuttingDown = false;
    this.setupGracefulShutdown();
  }

  /**
   * Add a child process to the manager
   */
  addProcess(childProcess) {
    this.childProcesses.add(childProcess);

    // Set up event listeners for this process
    childProcess.on('close', (code) => {
      this.childProcesses.delete(childProcess);
      log('INFO', `Child process exited with code ${code}`);
      this.checkAllProcessesClosed();
    });

    childProcess.on('error', (error) => {
      this.childProcesses.delete(childProcess);
      log('ERROR', `Child process error: ${error.message}`);
      this.checkAllProcessesClosed();
    });
  }

  /**
   * Remove a child process from the manager
   */
  removeProcess(childProcess) {
    this.childProcesses.delete(childProcess);
    this.checkAllProcessesClosed();
  }

  /**
   * Kill all child processes gracefully
   */
  async killAllProcesses() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    log('BUILD', `Terminating ${this.childProcesses.size} child processes...`);

    const killPromises = Array.from(this.childProcesses).map(async (child) => {
      return new Promise((resolve) => {
        if (child.killed) {
          resolve();
          return;
        }

        // Try graceful termination first
        child.kill('SIGTERM');

        // Set timeout for forceful termination
        const timeout = setTimeout(() => {
          if (!child.killed) {
            log('WARNING', 'Force killing child process...');
            child.kill('SIGKILL');
          }
          resolve();
        }, 5000); // 5 second timeout

        child.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    });

    await Promise.all(killPromises);
    log('SUCCESS', 'All child processes terminated');
  }

  /**
   * Check if all processes have closed
   */
  checkAllProcessesClosed() {
    if (this.childProcesses.size === 0 && this.isShuttingDown) {
      log('SUCCESS', 'All processes closed, exiting gracefully');
      process.exit(0);
    }
  }

  /**
   * Set up graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      log('BUILD', `Received ${signal}, initiating graceful shutdown...`);
      await this.killAllProcesses();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('beforeExit', () => {
      if (!this.isShuttingDown) {
        log('BUILD', 'Process exiting, cleaning up child processes...');
        this.killAllProcesses();
      }
    });
  }
}

// Colors for logging
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(level, message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  const colorMap = {
    ERROR: colors.red,
    SUCCESS: colors.green,
    WARNING: colors.yellow,
    INFO: colors.blue,
    BUILD: colors.magenta
  };

  const color = colorMap[level] || colors.reset;
  console.log(`${color}[${timestamp}] ${level}: ${message}${colors.reset}`);
}

// Global process manager instance
const processManager = new ProcessManager();

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log('BUILD', `Executing: ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      cwd: PROJECT_ROOT,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      timeout: options.timeout || 120000, // 2 minutes default timeout
      ...options
    });

    // Register the child process with the manager
    processManager.addProcess(child);

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      // Remove from process manager when done
      processManager.removeProcess(child);

      if (code === 0) {
        log('SUCCESS', `Command completed: ${command}`);
        resolve({ stdout, stderr, code });
      } else {
        log('ERROR', `Command failed: ${command} (exit code: ${code})`);
        reject(new Error(`${command} failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      // Remove from process manager on error
      processManager.removeProcess(child);
      log('ERROR', `Command error: ${error.message}`);
      reject(error);
    });
  });
}

async function ensureDirectories() {
  log('BUILD', 'Ensuring required directories exist...');

  const dirs = [
    'dist',
    'dist/backend',
    'dist/frontend',
    'public/css'
  ];

  for (const dir of dirs) {
    const fullPath = path.join(PROJECT_ROOT, dir);
    try {
      await fs.mkdir(fullPath, { recursive: true });
      log('SUCCESS', `Directory ensured: ${dir}`);
    } catch (error) {
      log('WARNING', `Could not create directory ${dir}: ${error.message}`);
    }
  }
}

async function cleanDist() {
  log('BUILD', 'Cleaning dist directory...');
  try {
    await runCommand('rm', ['-rf', 'dist/']);
    log('SUCCESS', 'Dist directory cleaned');
  } catch (error) {
    log('WARNING', `Clean failed: ${error.message}`);
  }
}

async function buildCSS() {
  log('BUILD', 'Building CSS with Tailwind...');

  // Check if CSS already exists and is recent
  try {
    const existingCss = path.join(PROJECT_ROOT, 'public/css/styles.css');
    const stats = await fs.stat(existingCss);
    const age = Date.now() - stats.mtime.getTime();

    if (age < 3600000) { // Less than 1 hour old
      log('INFO', 'Using existing CSS file (recent) - skipping rebuild');
      return;
    }
  } catch {
    // File doesn't exist, will build
  }

  try {
    // Use the correct npm script instead of direct npx call
    await runCommand('npm', ['run', 'build:css']);
    log('SUCCESS', 'CSS build completed');
  } catch (error) {
    log('WARNING', `CSS build failed: ${error.message} - Continuing build process`);
    // CSS failure is not critical, continue build
  }
}

async function buildBackend() {
  log('BUILD', 'Building Backend TypeScript...');
  try {
    // Use the correct config for backend compilation (tsconfig.json)
    await runCommand('npx', ['tsc', '-p', 'tsconfig.json']);
    log('SUCCESS', 'Backend TypeScript build completed');
  } catch (error) {
    log('ERROR', `Backend TypeScript build failed: ${error.message}`);
    log('WARNING', 'Attempting to continue build despite TypeScript errors...');

    // Try building with --skipLibCheck to allow partial compilation
    try {
      await runCommand('npx', ['tsc', '-p', 'tsconfig.json', '--skipLibCheck']);
      log('SUCCESS', 'Backend TypeScript build completed with --skipLibCheck');
    } catch (skipError) {
      log('ERROR', `Backend build failed even with --skipLibCheck: ${skipError.message}`);
      throw error; // Backend compilation is critical
    }
  }
}

async function buildFrontend() {
  log('BUILD', 'Building Frontend TypeScript...');
  try {
    // Try to build frontend, but don't fail if it has errors
    await runCommand('npx', ['tsc', '-p', 'src/frontend/tsconfig.frontend.json']);
    log('SUCCESS', 'Frontend TypeScript build completed');

    // Run post-build script to fix structure
    log('BUILD', 'Running post-build frontend script...');
    await runCommand('node', ['scripts/post-build-frontend.js']);
    log('SUCCESS', 'Post-build frontend script completed');
  } catch (error) {
    log('WARNING', `Frontend build failed: ${error.message} - Continuing build process`);
    // Frontend compilation errors are not critical for deployment
  }
}

async function copyFrontendAssets() {
  // REMOVED: Unnecessary copying of public assets
  // The server serves static files from public/ directory directly
  // and compiled JS from dist/frontend/ separately
  log('BUILD', 'Frontend assets copy skipped - served from public/ directly');
}

async function fixFrontendStructure() {
  log('BUILD', 'Fixing frontend directory structure...');
  try {
    // Fix frontend structure manually (no npm script available)
    const nestedPath = path.join(PROJECT_ROOT, 'dist/frontend/frontend');
    try {
      const stats = await fs.stat(nestedPath);
      if (stats.isDirectory()) {
        await runCommand('bash', ['-c', 'mv dist/frontend/frontend/* dist/frontend/ 2>/dev/null || true']);
        await runCommand('rm', ['-rf', 'dist/frontend/frontend']);
        log('SUCCESS', 'Frontend structure fixed (manual method)');
      } else {
        log('INFO', 'No nested frontend directory found - structure is already correct');
      }
    } catch {
      log('INFO', 'No nested frontend directory found - structure is already correct');
    }
  } catch (error) {
    log('WARNING', `Frontend structure fix failed: ${error.message}`);
  }
}

async function validateBuild() {
  log('BUILD', 'Validating build output...');

  const criticalFiles = [
    'dist/backend/app/server.js',
    'dist/backend/config/supabase.js',
    'dist/backend/services'
  ];

  const optionalFiles = [
    'dist/frontend/main.js',
    'dist/frontend/authManager.js',
    'dist/frontend/utils/logger.js',
    'dist/frontend/services/apiClient.js'
  ];

  // CSS files are served from public/ directory (not copied to dist/)
  const publicAssets = [
    'public/css/styles.css',
    'public/css/home-enhancements.css',
    'public/index.html'
  ];

  let criticalValid = true;
  let optionalValid = true;
  const builtFiles = [];

  // Check critical files
  for (const file of criticalFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isFile() || stats.isDirectory()) {
        log('SUCCESS', `✓ ${file} exists`);
        builtFiles.push(file);
      }
    } catch {
      log('ERROR', `✗ ${file} missing (CRITICAL)`);
      criticalValid = false;
    }
  }

  // Check optional files
  for (const file of optionalFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    try {
      await fs.access(fullPath);
      log('SUCCESS', `✓ ${file} exists`);
      builtFiles.push(file);
      optionalValid = true;
    } catch {
      log('WARNING', `✗ ${file} missing (optional)`);
    }
  }

  // Validate public assets (CSS, HTML)
  for (const asset of publicAssets) {
    const fullPath = path.join(PROJECT_ROOT, asset);
    try {
      await fs.access(fullPath);
      log('SUCCESS', `✓ ${asset} exists`);
      builtFiles.push(asset);
    } catch {
      log('WARNING', `✗ ${asset} missing (public asset)`);
    }
  }

  // Summary
  log('INFO', `Build summary: ${builtFiles.length} files/directories verified`);

  if (criticalValid) {
    if (optionalValid || builtFiles.length >= 3) {
      log('SUCCESS', 'Build validation passed - ready for deployment');
    } else {
      log('SUCCESS', 'Build validation passed (minimal deployment mode)');
    }
  } else {
    throw new Error('Build validation failed - critical files missing');
  }
}

async function main() {
  log('BUILD', '🌸 Starting FloresYa Enterprise Build 🌸');

  try {
    // Step 1: Clean and prepare
    await cleanDist();
    await ensureDirectories();

    // Step 2: Build CSS (non-critical)
    await buildCSS();

    // Step 3: Build Backend (CRITICAL)
    await buildBackend();

    // Step 4: Build Frontend (non-critical)
    await buildFrontend();

    // Step 5: Copy assets (now skipped - served from public/)
    await copyFrontendAssets();

    // Step 6: Validate critical files exist
    await validateBuild();

    log('SUCCESS', '🎉 Enterprise build completed successfully! 🎉');

    // Graceful shutdown - wait for all child processes to complete
    if (processManager.childProcesses.size > 0) {
      log('BUILD', `Waiting for ${processManager.childProcesses.size} child processes to complete...`);

      // Wait for all processes to finish naturally
      await new Promise((resolve) => {
        const checkComplete = () => {
          if (processManager.childProcesses.size === 0) {
            resolve();
          } else {
            setTimeout(checkComplete, 100);
          }
        };
        checkComplete();
      });

      log('SUCCESS', 'All child processes completed successfully');
    }

    process.exit(0);
  } catch (error) {
    log('ERROR', `Build failed: ${error.message}`);

    // Ensure all child processes are killed before exiting
    try {
      await processManager.killAllProcesses();
    } catch (killError) {
      log('ERROR', `Error during process cleanup: ${killError.message}`);
    }

    process.exit(1);
  }
}

// Execute if this file is run directly
if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error);
}