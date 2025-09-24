#!/usr/bin/env node

/**
 * 🌸 FloresYa Frontend Post-Build Script
 * Moves compiled frontend files to correct structure without duplication
 */

import { promises as fs } from 'fs';
import path from 'path';

const DIST_FRONTEND = './dist/frontend';
const FRONTEND_SUBFOLDER = './dist/frontend/frontend';

async function moveFilesToRoot() {
  try {
    console.log('🔧 Post-build: Moving frontend files to correct structure...');

    // Check if the nested frontend folder exists
    const frontendSubfolderExists = await fs.access(FRONTEND_SUBFOLDER)
      .then(() => true)
      .catch(() => false);

    if (!frontendSubfolderExists) {
      console.log('✅ No nested frontend folder found - structure is already correct');
      return;
    }

    // Get all items in the subfolder
    const items = await fs.readdir(FRONTEND_SUBFOLDER, { withFileTypes: true });

    for (const item of items) {
      const sourcePath = path.join(FRONTEND_SUBFOLDER, item.name);
      const targetPath = path.join(DIST_FRONTEND, item.name);

      try {
        // Check if target already exists and remove it to avoid conflicts
        await fs.access(targetPath);
        if (item.isDirectory()) {
          await fs.rm(targetPath, { recursive: true, force: true });
        } else {
          await fs.unlink(targetPath);
        }
      } catch {
        // Target doesn't exist, which is fine
      }

      // Move the item
      await fs.rename(sourcePath, targetPath);
      console.log(`✅ Moved: ${item.name}`);
    }

    // Remove the now-empty subfolder
    await fs.rmdir(FRONTEND_SUBFOLDER);
    console.log('🗑️  Removed empty frontend subfolder');

    // Create compatibility symlinks for legacy file names
    console.log('🔗 Creating compatibility symlinks...');

    const symlinks = [
      {
        target: './authManager.js', // Relative path for symlink
        link: path.join(DIST_FRONTEND, 'auth.js')
      },
      {
        target: './apiClient.js', // Relative path for symlink
        link: path.join(DIST_FRONTEND, 'services/api.js')
      }
    ];

    for (const { target, link } of symlinks) {
      try {
        // Remove existing symlink if it exists
        await fs.unlink(link).catch(() => {}); // Ignore error if file doesn't exist

        // Create new symlink
        await fs.symlink(target, link);
        console.log(`✅ Created symlink: ${path.basename(link)} -> ${path.basename(target)}`);
      } catch (error) {
        console.log(`⚠️  Warning: Could not create symlink ${path.basename(link)}: ${error.message}`);
      }
    }

    console.log('✅ Post-build: Frontend structure corrected successfully!');

  } catch (error) {
    console.error('❌ Post-build error:', error.message);
    process.exit(1);
  }
}

// Run the script
moveFilesToRoot();