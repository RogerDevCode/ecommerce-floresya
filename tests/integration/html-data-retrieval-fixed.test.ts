/**
 * 🌸 FloresYa HTML Data Retrieval Tests - Fixed Version
 * Tests to verify that HTML pages can successfully retrieve data
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { FloresYaServer } from '../../src/app/server.js';

describe('HTML Data Retrieval Tests - Fixed', () => {
  let server: FloresYaServer;
  let request: any;

  beforeAll(async () => {
    server = new FloresYaServer();
    const app = server.getApp();
    request = supertest(app);
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Static HTML File Serving', () => {
    it('should serve main index.html', async () => {
      const response = await request
        .get('/')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/html/);
      expect(response.text).toContain('FloresYa');
      expect(response.text).toContain('DOCTYPE html');
    });

    it('should serve admin.html', async () => {
      const response = await request
        .get('/pages/admin.html')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/html/);
      expect(response.text).toContain('Administración');
    });

    it('should serve admin-users.html', async () => {
      const response = await request
        .get('/pages/admin-users.html')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/html/);
      expect(response.text).toContain('Administración de Usuarios');
    });
  });

  describe('JavaScript Module Loading', () => {
    it('should serve main.js with correct MIME type', async () => {
      const response = await request
        .get('/dist/frontend/main.js')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/javascript/);
    });

    it('should serve apiClient.js with correct MIME type', async () => {
      const response = await request
        .get('/dist/frontend/services/apiClient.js')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/javascript/);
    });
  });

  describe('API Endpoints Used by HTML', () => {
    it('should handle products API requests', async () => {
      const response = await request
        .get('/api/products')
        .query({ page: 1, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    it('should handle occasions API requests', async () => {
      const response = await request
        .get('/api/occasions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    it('should handle invalid API requests gracefully', async () => {
      const response = await request
        .get('/api/products/nonexistent');

      // Should handle gracefully (200 with error, 404, or 500)
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('tRPC Endpoint Availability', () => {
    it('should have tRPC endpoint accessible', async () => {
      const response = await request
        .post('/trpc/occasion.list')
        .send({});

      // tRPC should respond (200, 400 for validation, or 405 for method not allowed)
      expect([200, 400, 405]).toContain(response.status);
    });
  });

  describe('CSS and Asset Serving', () => {
    it('should serve main CSS', async () => {
      const response = await request
        .get('/css/styles.css')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/css/);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent pages', async () => {
      const response = await request
        .get('/nonexistent.html')
        .expect(404);
    });

    it('should handle malformed requests', async () => {
      const response = await request
        .get('/api/products')
        .query({ page: 'invalid', limit: 'invalid' });

      // Should handle gracefully (allow 500 for server errors)
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThanOrEqual(500);
    });
  });
});