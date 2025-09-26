/**
 * 🌸 FloresYa tRPC HTML Integration Tests
 * Tests to verify tRPC endpoints work correctly for HTML page consumption
 * These tests validate the modern tRPC approach used in trpc-demo.html
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { FloresYaServer } from '../../src/app/server.js';

describe('tRPC HTML Integration Tests', () => {
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

  describe('tRPC User Operations (used by login forms)', () => {
    it('should handle user login via tRPC', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request
        .post('/trpc/user.login')
        .send({
          json: loginData
        });

      expect(response.status).toBeOneOf([200, 400, 401]);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('result');
        expect(response.body.result).toHaveProperty('data');
        expect(response.body.result.data).toHaveProperty('success');
      }
    });

    it('should validate login input via Zod schema', async () => {
      const invalidLoginData = {
        email: 'invalid-email', // Invalid email format
        password: '' // Empty password
      };

      const response = await request
        .post('/trpc/user.login')
        .send({
          json: invalidLoginData
        });

      expect(response.status).toBeOneOf([400, 200]);

      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body.error.message).toContain('validation');
      }
    });

    it('should handle user registration via tRPC', async () => {
      const registerData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass123',
        full_name: 'Test User',
        role: 'user'
      };

      const response = await request
        .post('/trpc/user.register')
        .send({
          json: registerData
        });

      expect(response.status).toBeOneOf([200, 400]);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('result');
        expect(response.body.result.data).toHaveProperty('success');
      }
    });
  });

  describe('tRPC Product Operations (used by product displays)', () => {
    it('should fetch active products via tRPC', async () => {
      const queryData = {
        limit: 5,
        active: true
      };

      const response = await request
        .post('/trpc/product.getActive')
        .send({
          json: queryData
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('data');

      const result = response.body.result.data;
      expect(result).toHaveProperty('success', true);

      if (result.data && result.data.length > 0) {
        const product = result.data[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price_usd');
      }
    });

    it('should fetch product list with pagination via tRPC', async () => {
      const queryData = {
        page: 1,
        limit: 5,
        active: true
      };

      const response = await request
        .post('/trpc/product.list')
        .send({
          json: queryData
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result');

      const result = response.body.result.data;
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');

      if (result.data.length > 0) {
        expect(result.pagination).toMatchObject({
          page: 1,
          limit: 5,
          total: expect.any(Number),
          totalPages: expect.any(Number)
        });
      }
    });

    it('should fetch product by ID via tRPC', async () => {
      // First get a product ID
      const listResponse = await request
        .post('/trpc/product.getActive')
        .send({
          json: { limit: 1 }
        });

      if (listResponse.body.result.data.success &&
          listResponse.body.result.data.data.length > 0) {

        const productId = listResponse.body.result.data.data[0].id;

        const response = await request
          .post('/trpc/product.getById')
          .send({
            json: { id: productId }
          });

        expect(response.status).toBe(200);
        expect(response.body.result.data).toHaveProperty('success', true);
        expect(response.body.result.data.data).toMatchObject({
          id: productId,
          name: expect.any(String),
          price_usd: expect.any(Number)
        });
      }
    });

    it('should handle product search via tRPC', async () => {
      const searchData = {
        page: 1,
        limit: 10,
        search: 'rosa',
        active: true
      };

      const response = await request
        .post('/trpc/product.list')
        .send({
          json: searchData
        });

      expect(response.status).toBe(200);
      expect(response.body.result.data).toHaveProperty('success', true);
    });
  });

  describe('tRPC Occasion Operations (used by filters)', () => {
    it('should fetch occasions list via tRPC', async () => {
      const response = await request
        .post('/trpc/occasion.list')
        .send({
          json: {}
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('result');

      const result = response.body.result.data;
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');

      if (result.data.length > 0) {
        const occasion = result.data[0];
        expect(occasion).toHaveProperty('id');
        expect(occasion).toHaveProperty('name');
        expect(occasion).toHaveProperty('is_active');
      }
    });

    it('should fetch active occasions only', async () => {
      const queryData = {
        active: true
      };

      const response = await request
        .post('/trpc/occasion.list')
        .send({
          json: queryData
        });

      expect(response.status).toBe(200);

      const result = response.body.result.data;
      if (result.data.length > 0) {
        // All returned occasions should be active
        result.data.forEach((occasion: any) => {
          expect(occasion.is_active).toBe(true);
        });
      }
    });
  });

  describe('tRPC Order Operations (used by order pages)', () => {
    it('should handle getUserOrders endpoint', async () => {
      const response = await request
        .post('/trpc/order.getUserOrders')
        .send({
          json: {}
        });

      // Should return 401 without authentication, or 200 with empty data
      expect(response.status).toBeOneOf([200, 401]);

      if (response.status === 200) {
        expect(response.body.result.data).toHaveProperty('success');
      }
    });

    it('should handle getByStatus endpoint', async () => {
      const queryData = {
        status: 'pending'
      };

      const response = await request
        .post('/trpc/order.getByStatus')
        .send({
          json: queryData
        });

      expect(response.status).toBeOneOf([200, 401]);

      if (response.status === 200) {
        expect(response.body.result.data).toHaveProperty('success');
      }
    });
  });

  describe('tRPC Dashboard Operations (used by admin pages)', () => {
    it('should handle dashboard stats endpoint', async () => {
      const response = await request
        .post('/trpc/dashboard.getStats')
        .send({
          json: {}
        });

      // Should require admin authentication
      expect(response.status).toBeOneOf([200, 401, 403]);

      if (response.status === 200) {
        const result = response.body.result.data;
        expect(result).toHaveProperty('success');

        if (result.success) {
          expect(result.data).toMatchObject({
            totalProducts: expect.any(Number),
            totalUsers: expect.any(Number),
            totalOrders: expect.any(Number)
          });
        }
      }
    });

    it('should validate dashboard query parameters', async () => {
      const invalidQuery = {
        period: 'invalid-period', // Should be 'day', 'week', 'month', etc.
        start_date: 'invalid-date'
      };

      const response = await request
        .post('/trpc/dashboard.getStats')
        .send({
          json: invalidQuery
        });

      expect(response.status).toBeOneOf([400, 401, 403]);

      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('tRPC Image Operations (used by admin panels)', () => {
    it('should handle image upload endpoint', async () => {
      const response = await request
        .post('/trpc/image.upload')
        .send({
          json: {
            product_id: 1,
            url: 'https://example.com/test.jpg',
            alt_text: 'Test image'
          }
        });

      // Should require authentication
      expect(response.status).toBeOneOf([200, 401, 403]);
    });

    it('should handle get product images', async () => {
      const queryData = {
        product_id: 1
      };

      const response = await request
        .post('/trpc/image.getByProduct')
        .send({
          json: queryData
        });

      expect(response.status).toBe(200);
      expect(response.body.result.data).toHaveProperty('success');
    });
  });

  describe('tRPC Error Handling and Type Safety', () => {
    it('should return proper error format for invalid input', async () => {
      const response = await request
        .post('/trpc/product.getById')
        .send({
          json: {
            id: 'invalid-id' // Should be number
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'BAD_REQUEST');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should handle missing required parameters', async () => {
      const response = await request
        .post('/trpc/user.login')
        .send({
          json: {} // Missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('validation');
    });

    it('should provide type-safe error responses', async () => {
      const response = await request
        .post('/trpc/product.getById')
        .send({
          json: {
            id: 999999 // Non-existent product
          }
        });

      expect(response.status).toBe(200);

      const result = response.body.result.data;
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
    });
  });

  describe('tRPC Batch Operations', () => {
    it('should handle batch requests', async () => {
      const batchRequest = [
        {
          id: 0,
          method: 'query',
          params: {
            path: 'occasion.list',
            input: { json: {} }
          }
        },
        {
          id: 1,
          method: 'query',
          params: {
            path: 'product.getActive',
            input: { json: { limit: 5 } }
          }
        }
      ];

      const response = await request
        .post('/trpc')
        .send(batchRequest);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);

      // Each response should have proper structure
      response.body.forEach((result: any, index: number) => {
        expect(result).toHaveProperty('id', index);
        expect(result).toHaveProperty('result');
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(5).fill(null).map(() =>
        request
          .post('/trpc/product.getActive')
          .send({
            json: { limit: 3 }
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.result.data).toHaveProperty('success', true);
      });
    });

    it('should respond within reasonable time limits', async () => {
      const start = Date.now();

      const response = await request
        .post('/trpc/product.list')
        .send({
          json: { page: 1, limit: 10 }
        });

      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });
});