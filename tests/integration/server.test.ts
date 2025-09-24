/**
 * 🌸 FloresYa Server Integration Tests - Enterprise TypeScript Edition
 * Comprehensive integration tests for the Express server
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FloresYaServer } from '../../src/app/server';
import supertest from 'supertest';

describe('FloresYa Server Integration Tests', () => {
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

  describe('Health Check Endpoint', () => {
    it('should return server health status', async () => {
      const response = await request
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'FloresYa API is running',
        version: '2.0.0'
      });

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');

      // Validate timestamp format
      expect(() => new Date(response.body.timestamp)).not.toThrow();

      // Validate memory object structure
      expect(response.body.memory).toHaveProperty('rss');
      expect(response.body.memory).toHaveProperty('heapTotal');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('external');
    });

    it('should return valid JSON content type', async () => {
      const response = await request
        .get('/api/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('API Routes Structure', () => {
    it('should have products routes available', async () => {
      const response = await request
        .get('/api/products')
        .expect(200);

      // Should return products or handle gracefully
      expect(response.status).toBe(200);
    });

    it('should have occasions routes available', async () => {
      const response = await request
        .get('/api/occasions')
        .expect(200);

      // Should return occasions or handle gracefully
      expect(response.status).toBe(200);
    });

    it('should have orders routes available', async () => {
      const response = await request
        .get('/api/orders')
        .expect(200);

      // Should return orders or handle gracefully
      expect(response.status).toBe(200);
    });

    it('should have logs routes available', async () => {
      const response = await request
        .post('/api/logs/frontend')
        .send({
          logs: [
            {
              timestamp: new Date().toISOString(),
              level: 'INFO',
              module: 'TestModule',
              message: 'Test log message',
              data: { test: true }
            }
          ],
          sessionId: 'test-session'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logs received successfully'
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent API endpoints', async () => {
      const response = await request
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'API endpoint not found'
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request
        .post('/api/logs/frontend')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(500); // Server returns 500 for unhandled JSON parsing errors
  
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request
        .get('/api/health')
        .expect(200);

      // Check for security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request
        .options('/api/products')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204); // OPTIONS requests typically return 204 No Content

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });

  describe('Static File Serving', () => {
    it('should serve static files from public directory', async () => {
      const response = await request
        .get('/index.html')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    it('should serve CSS files with correct MIME type', async () => {
      const response = await request
        .get('/css/styles.css')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/css/);
    });

    it('should serve JavaScript files with correct MIME type', async () => {
      const response = await request
        .get('/config/supabase')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/(application\/javascript|text\/javascript)/);
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger API documentation', async () => {
      const response = await request
        .get('/api-docs')
        .redirects(1) // Follow redirects
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    it('should serve Swagger JSON specification', async () => {
      const response = await request
        .get('/api-docs.json')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
    });
  });
});