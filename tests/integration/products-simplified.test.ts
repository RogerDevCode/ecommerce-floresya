/**
 * 🌸 FloresYa Products Integration Tests - Ultra Simple Silicon Valley Edition
 * The simplest possible tests using our new mock system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FloresYaServer } from '../../src/app/server';
import supertest from 'supertest';
import { testSupabase } from '../utils/test-database';
import {
  createTestProduct,
  createTestProductList,
  createTestCarouselProduct,
  createTestCarouselData
} from '../utils/test-factories';
import { createSimpleProductMock } from '../utils/test-mocks';

describe('FloresYa Products - Ultra Simple Tests', () => {
  let server: FloresYaServer;
  let request: any;

  beforeEach(() => {
    server = new FloresYaServer();
    const app = server.getApp();
    request = supertest(app);
  });

  describe('GET /api/products', () => {
    it('should return products - one line setup', async () => {
      // One line setup - that's it!
      const mockSupabase = createSimpleProductMock([
        createTestProduct({ id: 1, name: 'Rosas Rojas' }),
        createTestProduct({ id: 2, name: 'Rosas Blancas' })
      ]);
      testSupabase.from = mockSupabase.from;

      const response = await request.get('/api/products').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.products[0].name).toBe('Rosas Rojas');
    });

    it('should filter active products only', async () => {
      const mockSupabase = createSimpleProductMock([
        createTestProduct({ id: 1, name: 'Rosas Activas', active: true }),
        createTestProduct({ id: 2, name: 'Rosas Inactivas', active: false })
      ]);
      testSupabase.from = mockSupabase.from;

      const response = await request.get('/api/products?active=true').expect(200);

      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].active).toBe(true);
    });
  });

  describe('GET /api/products/carousel', () => {
    it('should return carousel products - dead simple', async () => {
      const mockSupabase = createSimpleProductMock([
        createTestCarouselProduct({ id: 1, name: 'Carousel Rosa 1', carousel_order: 1 }),
        createTestCarouselProduct({ id: 2, name: 'Carousel Rosa 2', carousel_order: 2 })
      ]);
      testSupabase.from = mockSupabase.from;

      const response = await request.get('/api/products/carousel').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.products[0].carousel_order).toBe(1);
      expect(response.body.data.products[1].carousel_order).toBe(2);
    });
  });

  describe('GET /api/products/featured', () => {
    it('should return featured products - minimal setup', async () => {
      const mockSupabase = createSimpleProductMock([
        createTestProduct({ id: 1, name: 'Rosa Destacada', featured: true }),
        createTestProduct({ id: 2, name: 'Rosa Normal', featured: false })
      ]);
      testSupabase.from = mockSupabase.from;

      const response = await request.get('/api/products/featured').expect(200);

      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].featured).toBe(true);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return specific product', async () => {
      const mockSupabase = createSimpleProductMock([
        createTestProduct({ id: 42, name: 'Rosa Específica' })
      ]);
      testSupabase.from = mockSupabase.from;

      const response = await request.get('/api/products/42').expect(200);

      expect(response.body.data.product.id).toBe(42);
      expect(response.body.data.product.name).toBe('Rosa Específica');
    });

    it('should return 404 for non-existent product', async () => {
      const mockSupabase = createSimpleProductMock([]);
      testSupabase.from = mockSupabase.from;

      await request.get('/api/products/999').expect(404);
    });
  });

  describe('GET /api/products/search', () => {
    it('should search products', async () => {
      const mockSupabase = createSimpleProductMock([
        createTestProduct({ id: 1, name: 'Rosas Rojas', summary: 'Hermosas rosas' }),
        createTestProduct({ id: 2, name: 'Tulipanes', summary: 'Coloridos tulipanes' })
      ]);
      testSupabase.from = mockSupabase.from;

      const response = await request.get('/api/products/search?q=rosa').expect(200);

      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Rosas Rojas');
    });
  });
});