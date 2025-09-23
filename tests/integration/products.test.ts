/**
 * 🌸 FloresYa Products Integration Tests - Real Database Edition
 * Tests de integración para productos usando datos reales de Supabase
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FloresYaServer } from '../../src/app/server.js';
import supertest from 'supertest';
import { testSupabase, setupTestDatabase, teardownTestDatabase } from '../config/test-database.js';

describe('FloresYa Products Integration Tests - Real Database', () => {
  let server: FloresYaServer;
  let request: any;

  beforeAll(async () => {
    // Setup test database connection
    await setupTestDatabase();

    // Create server instance
    server = new FloresYaServer();

    // Get the Express app
    const app = server.getApp();

    // Create supertest agent
    request = supertest(app);
  });

  afterAll(async () => {
    // Cleanup test data
    await teardownTestDatabase();
  });

  describe('GET /api/products - Real Database Integration', () => {
    it('should return products from real database', async () => {
      const response = await request
        .get('/api/products')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Products retrieved successfully'
      });

      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('pagination');

      // Verify we have real data from database
      const products = response.body.data.products;
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      // Verify product structure matches database schema
      const firstProduct = products[0];
      expect(firstProduct).toHaveProperty('id');
      expect(firstProduct).toHaveProperty('name');
      expect(firstProduct).toHaveProperty('price_usd');
      expect(firstProduct).toHaveProperty('summary');
      expect(firstProduct).toHaveProperty('active');
      expect(firstProduct).toHaveProperty('carousel_order');
    });

    it('should return products with real images from database', async () => {
      const response = await request
        .get('/api/products?page=1&limit=5')
        .expect(200);

      expect(response.body.data.products.length).toBeLessThanOrEqual(5);

      // Check if products have images (from real database)
      const productsWithImages = response.body.data.products.filter(
        (p: any) => p.images && p.images.length > 0
      );

      expect(productsWithImages.length).toBeGreaterThan(0);

      // Verify image structure
      const productWithImage = productsWithImages[0];
      expect(productWithImage.images[0]).toHaveProperty('url');
      expect(productWithImage.images[0]).toHaveProperty('size');
      expect(productWithImage.images[0]).toHaveProperty('is_primary');
    });

    it('should filter products by active status from real database', async () => {
      const response = await request
        .get('/api/products?active=true')
        .expect(200);

      const products = response.body.data.products;
      expect(products.length).toBeGreaterThan(0);

      // All products should be active
      products.forEach((product: any) => {
        expect(product.active).toBe(true);
      });
    });

    it('should sort products by carousel order from real database', async () => {
      const response = await request
        .get('/api/products?sort=carousel_order&order=asc')
        .expect(200);

      const products = response.body.data.products;
      expect(products.length).toBeGreaterThan(0);

      // Verify carousel order sorting
      for (let i = 1; i < products.length; i++) {
        expect(products[i].carousel_order).toBeGreaterThanOrEqual(products[i-1].carousel_order);
      }
    });
  });

  describe('GET /api/products/carousel - Real Database Integration', () => {
    it('should return carousel products from real database', async () => {
      const response = await request
        .get('/api/products/carousel')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Carousel products retrieved successfully'
      });

      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('total_count');

      const { products } = response.body.data;
      expect(Array.isArray(products)).toBe(true);

      // Verify carousel products are properly ordered
      products.forEach((product: any, index: number) => {
        expect(product).toHaveProperty('carousel_order');
        expect(product.carousel_order).toBe(index + 1);
      });
    });

    it('should return carousel products with real images', async () => {
      const response = await request
        .get('/api/products/carousel')
        .expect(200);

      const products = response.body.data.products;

      // Check that carousel products have primary images
      products.forEach((product: any) => {
        expect(product).toHaveProperty('primary_thumb_url');
        expect(product.primary_thumb_url).toMatch(/^https:\/\/dcbavpdlkcjdtjdkntde\.supabase\.co\/storage\/v1\/object\/public\/product-images\//);
      });
    });
  });

  describe('GET /api/products/featured - Real Database Integration', () => {
    it('should return featured products from real database', async () => {
      const response = await request
        .get('/api/products/featured')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Featured products retrieved successfully'
      });

      const products = response.body.data.products;
      expect(Array.isArray(products)).toBe(true);

      // All products should be featured
      products.forEach((product: any) => {
        expect(product.featured).toBe(true);
      });
    });
  });

  describe('GET /api/products/:id - Real Database Integration', () => {
    it('should return a specific product from real database', async () => {
      // First get a product ID from the products list
      const productsResponse = await request
        .get('/api/products?limit=1')
        .expect(200);

      const productId = productsResponse.body.data.products[0].id;

      const response = await request
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Product retrieved successfully'
      });

      expect(response.body.data).toHaveProperty('product');
      expect(response.body.data.product.id).toBe(productId);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request
        .get('/api/products/99999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Product not found'
      });
    });
  });

  describe('GET /api/products/search - Real Database Integration', () => {
    it('should search products from real database', async () => {
      const response = await request
        .get('/api/products/search?q=rosa')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Search completed successfully'
      });

      const products = response.body.data.products;
      expect(Array.isArray(products)).toBe(true);

      // All products should contain the search term in name or description
      products.forEach((product: any) => {
        const searchTerm = 'rosa';
        const searchableText = `${product.name} ${product.summary} ${product.description}`.toLowerCase();
        expect(searchableText).toContain(searchTerm);
      });
    });

    it('should return empty results for non-matching search', async () => {
      const response = await request
        .get('/api/products/search?q=xyz123nonexistent')
        .expect(200);

      const products = response.body.data.products;
      expect(products.length).toBe(0);
    });
  });

  describe('Database Connection Validation', () => {
    it('should verify real database connection and data integrity', async () => {
      // Test direct database connection
      const { data: products, error } = await testSupabase
        .from('products')
        .select('id, name, active')
        .limit(5);

      expect(error).toBeNull();
      expect(products).toBeTruthy();
      expect(Array.isArray(products)).toBe(true);
      expect(products!.length).toBeGreaterThan(0);

      // Verify data integrity
      products!.forEach((product: any) => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('active');
        expect(typeof product.id).toBe('number');
        expect(typeof product.name).toBe('string');
        expect(typeof product.active).toBe('boolean');
      });
    });

    it('should verify product images relationship in real database', async () => {
      const { data: images, error } = await testSupabase
        .from('product_images')
        .select('id, product_id, url, size, is_primary')
        .limit(10);

      expect(error).toBeNull();
      expect(images).toBeTruthy();
      expect(Array.isArray(images)).toBe(true);

      // Verify image data integrity
      images!.forEach(image => {
        expect(image).toHaveProperty('id');
        expect(image).toHaveProperty('product_id');
        expect(image).toHaveProperty('url');
        expect(image).toHaveProperty('size');
        expect(image).toHaveProperty('is_primary');
      });
    });
  });
});