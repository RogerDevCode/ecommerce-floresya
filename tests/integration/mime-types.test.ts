/**
 * 🌸 FloresYa MIME Types Integration Tests - Enterprise TypeScript Edition
 * Comprehensive tests for MIME type validation across all JavaScript files
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FloresYaServer } from '../../src/app/server.js';
import supertest from 'supertest';

describe('FloresYa MIME Types Integration Tests', () => {
  let server: FloresYaServer;
  let request: any;

  beforeAll(async () => {
    // Create server instance
    server = new FloresYaServer();

    // Get the Express app
    const app = server.getApp();

    // Create supertest agent
    request = supertest(app);
  });

  afterAll(async () => {
    // Server cleanup if needed
    // Note: In a real scenario, you might want to close the server
    // server.close();
  });

  describe('Frontend JavaScript Files MIME Types', () => {
    const testFiles = [
      '/dist/frontend/main.js',
      '/dist/frontend/authManager.js',
      '/dist/frontend/auth.js', // Symlink to authManager.js
      '/dist/frontend/utils/logger.js',
      '/dist/frontend/services/apiClient.js',
      '/dist/frontend/services/api.js', // Symlink to apiClient.js
      '/dist/frontend/scroll-effects-fix.js',
      '/dist/frontend/adminPanel.js',
      '/dist/frontend/product-detail.js',
      '/dist/frontend/users-admin.js',
    ];

    testFiles.forEach((filePath) => {
      it(`should serve ${filePath} with correct MIME type`, async () => {
        const response = await request
          .get(filePath)
          .expect(200);

        // Verify correct MIME type
        expect(response.headers['content-type']).toBe('application/javascript');

        // Ensure no nosniff concatenation issue
        expect(response.headers['content-type']).not.toContain('nosniff');
        expect(response.headers['content-type']).not.toMatch(/nosniffapplication\/javascript/);

        // Verify response is not HTML (which would indicate a 404 or wrong handler)
        expect(response.headers['content-type']).not.toContain('text/html');

        // Verify file content is actually JavaScript (basic check)
        const content = response.text;
        expect(content.length).toBeGreaterThan(0);

        // Basic JavaScript validation - should not be HTML
        expect(content).not.toMatch(/^<!DOCTYPE html>/i);
        expect(content).not.toMatch(/^<html/i);
      });
    });
  });

  describe('Frontend JavaScript Source Maps MIME Types', () => {
    const sourceMapFiles = [
      '/dist/frontend/main.js.map',
      '/dist/frontend/authManager.js.map',
      '/dist/frontend/product-detail.js.map',
      '/dist/frontend/users-admin.js.map',
    ];

    sourceMapFiles.forEach((filePath) => {
      it(`should serve ${filePath} with correct MIME type`, async () => {
        const response = await request
          .get(filePath)
          .expect(200);

        // Verify correct MIME type for source maps
        expect(response.headers['content-type']).toBe('application/json');

        // Ensure no nosniff concatenation issue
        expect(response.headers['content-type']).not.toContain('nosniff');
      });
    });
  });

  describe('Security Headers Validation', () => {
    it('should include X-Content-Type-Options header', async () => {
      const response = await request
        .get('/dist/frontend/main.js')
        .expect(200);

      // Verify security headers are present
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');

      // But Content-Type should be separate and correct
      expect(response.headers['content-type']).toBe('application/javascript');
    });

    it('should not have concatenated MIME types in any headers', async () => {
      const response = await request
        .get('/dist/frontend/main.js')
        .expect(200);

      // Check all headers for any concatenation issues
      Object.values(response.headers).forEach((headerValue) => {
        if (typeof headerValue === 'string') {
          expect(headerValue).not.toContain('nosniffapplication/javascript');
          expect(headerValue).not.toContain('applicationnosniff');
        }
      });
    });
  });

  describe('Error Handling for MIME Type Issues', () => {
    it('should handle non-existent JavaScript files gracefully', async () => {
      const response = await request
        .get('/dist/frontend/non-existent-file.js')
        .expect(404);

      // Should return proper 404, not serve HTML with wrong MIME type
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    it('should not serve HTML files with JavaScript MIME type', async () => {
      const response = await request
        .get('/index.html')
        .expect(200);

      // HTML files should have HTML MIME type, not JavaScript
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.headers['content-type']).not.toBe('application/javascript');
    });
  });

  describe('Symlink Resolution', () => {
    it('should serve auth.js symlink with correct MIME type', async () => {
      const response = await request
        .get('/dist/frontend/auth.js')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/javascript');
    });

    it('should serve services/api.js symlink with correct MIME type', async () => {
      const response = await request
        .get('/dist/frontend/services/api.js')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/javascript');
    });
  });
});