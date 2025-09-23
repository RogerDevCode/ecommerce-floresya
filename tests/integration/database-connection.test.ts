/**
 * 🌸 FloresYa Database Connection Tests - Real Database Edition
 * Tests básicos de conexión y datos de Supabase
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testSupabase, setupTestDatabase, teardownTestDatabase } from '../config/test-database.js';

describe('FloresYa Database Connection Tests - Real Database', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Basic Database Connection', () => {
    it('should connect to Supabase successfully', async () => {
      const { data, error } = await testSupabase
        .from('settings')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });

    it('should have real data in products table', async () => {
      const { data: products, error } = await testSupabase
        .from('products')
        .select('id, name, price_usd, active')
        .limit(5);

      expect(error).toBeNull();
      expect(products).toBeTruthy();
      expect(Array.isArray(products)).toBe(true);

      if (products && products.length > 0) {
        const product = products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price_usd');
        expect(product).toHaveProperty('active');
        expect(typeof product.id).toBe('number');
        expect(typeof product.name).toBe('string');
        expect(typeof product.price_usd).toBe('number');
        expect(typeof product.active).toBe('boolean');
      }
    });

    it('should have real data in occasions table', async () => {
      const { data: occasions, error } = await testSupabase
        .from('occasions')
        .select('id, name, type, is_active, display_order')
        .order('display_order', { ascending: true });

      expect(error).toBeNull();
      expect(occasions).toBeTruthy();
      expect(Array.isArray(occasions)).toBe(true);
      expect(occasions!.length).toBeGreaterThan(0);

      // Verify data structure
      occasions!.forEach((occasion: any) => {
        expect(occasion).toHaveProperty('id');
        expect(occasion).toHaveProperty('name');
        expect(occasion).toHaveProperty('type');
        expect(occasion).toHaveProperty('is_active');
        expect(occasion).toHaveProperty('display_order');
      });
    });

    it('should have real data in product_images table', async () => {
      const { data: images, error } = await testSupabase
        .from('product_images')
        .select('id, product_id, url, size, is_primary')
        .limit(10);

      expect(error).toBeNull();
      expect(images).toBeTruthy();
      expect(Array.isArray(images)).toBe(true);

      if (images && images.length > 0) {
        const image = images[0];
        expect(image).toHaveProperty('id');
        expect(image).toHaveProperty('product_id');
        expect(image).toHaveProperty('url');
        expect(image).toHaveProperty('size');
        expect(image).toHaveProperty('is_primary');
        expect(typeof image.product_id).toBe('number');
        expect(typeof image.url).toBe('string');
        expect(typeof image.size).toBe('string');
        expect(typeof image.is_primary).toBe('boolean');
      }
    });

    it('should have real data in product_occasions table', async () => {
      const { data: productOccasions, error } = await testSupabase
        .from('product_occasions')
        .select('id, product_id, occasion_id')
        .limit(10);

      expect(error).toBeNull();
      expect(productOccasions).toBeTruthy();
      expect(Array.isArray(productOccasions)).toBe(true);

      if (productOccasions && productOccasions.length > 0) {
        const relation = productOccasions[0];
        expect(relation).toHaveProperty('id');
        expect(relation).toHaveProperty('product_id');
        expect(relation).toHaveProperty('occasion_id');
        expect(typeof relation.product_id).toBe('number');
        expect(typeof relation.occasion_id).toBe('number');
      }
    });
  });

  describe('Data Relationships', () => {
    it('should verify product-occasion relationships', async () => {
      const { data: relations, error } = await testSupabase
        .from('product_occasions')
        .select(`
          id,
          product_id,
          occasion_id,
          products:product_id (id, name),
          occasions:occasion_id (id, name, type)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(relations).toBeTruthy();
      expect(Array.isArray(relations)).toBe(true);

      if (relations && relations.length > 0) {
        const relation = relations[0];
        expect(relation).toHaveProperty('id');
        expect(relation).toHaveProperty('product_id');
        expect(relation).toHaveProperty('occasion_id');

        // Check if JOIN data exists (might be null if foreign key constraints aren't set up)
        if (relation.products) {
          expect(relation.products).toHaveProperty('id');
          expect(relation.products).toHaveProperty('name');
        }

        if (relation.occasions) {
          expect(relation.occasions).toHaveProperty('id');
          expect(relation.occasions).toHaveProperty('name');
          expect(relation.occasions).toHaveProperty('type');
        }
      }
    });

    it('should verify product-images relationships', async () => {
      const { data: images, error } = await testSupabase
        .from('product_images')
        .select(`
          id,
          product_id,
          url,
          size,
          is_primary,
          products:product_id (id, name)
        `)
        .limit(5);

      expect(error).toBeNull();
      expect(images).toBeTruthy();
      expect(Array.isArray(images)).toBe(true);

      if (images && images.length > 0) {
        const image = images[0] as any;
        expect(image).toHaveProperty('id');
        expect(image).toHaveProperty('product_id');
        expect(image).toHaveProperty('url');
        expect(image).toHaveProperty('size');
        expect(image).toHaveProperty('is_primary');

        // Check if JOIN data exists (might be null if foreign key constraints aren't set up)
        if (image.products) {
          expect(image.products).toHaveProperty('id');
          expect(image.products).toHaveProperty('name');
        }
      }
    });
  });

  describe('Data Integrity Checks', () => {
    it('should verify all products have valid data', async () => {
      const { data: products, error } = await testSupabase
        .from('products')
        .select('id, name, price_usd, active, carousel_order')
        .limit(20);

      expect(error).toBeNull();
      expect(products).toBeTruthy();

      products!.forEach((product: any) => {
        expect(product.id).toBeGreaterThan(0);
        expect(product.name.length).toBeGreaterThan(0);
        expect(product.price_usd).toBeGreaterThan(0);
        expect(typeof product.active).toBe('boolean');
        expect(typeof product.carousel_order).toBe('number');
      });
    });

    it('should verify all occasions have valid data', async () => {
      const { data: occasions, error } = await testSupabase
        .from('occasions')
        .select('id, name, type, is_active, display_order, slug');

      expect(error).toBeNull();
      expect(occasions).toBeTruthy();

      occasions!.forEach((occasion: any) => {
        expect(occasion.id).toBeGreaterThan(0);
        expect(occasion.name.length).toBeGreaterThan(0);
        expect(occasion.type.length).toBeGreaterThan(0);
        expect(typeof occasion.is_active).toBe('boolean');
        expect(typeof occasion.display_order).toBe('number');
        expect(occasion.slug.length).toBeGreaterThan(0);
        expect(occasion.slug).toMatch(/^[a-z0-9-]+$/);
      });
    });

    it('should verify image URLs are valid', async () => {
      const { data: images, error } = await testSupabase
        .from('product_images')
        .select('url, size')
        .limit(10);

      expect(error).toBeNull();
      expect(images).toBeTruthy();

      images!.forEach((image: any) => {
        expect(image.url.length).toBeGreaterThan(0);
        expect(['thumb', 'small', 'medium', 'large']).toContain(image.size);
      });
    });
  });

  describe('Database Performance', () => {
    it('should perform basic queries efficiently', async () => {
      const startTime = Date.now();

      const { data: products, error } = await testSupabase
        .from('products')
        .select('id, name')
        .limit(10);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(error).toBeNull();
      expect(products).toBeTruthy();
      expect(queryTime).toBeLessThan(1000); // Should be under 1 second
    });

    it('should handle multiple concurrent queries', async () => {
      const promises = [
        testSupabase.from('products').select('id').limit(5),
        testSupabase.from('occasions').select('id').limit(5),
        testSupabase.from('product_images').select('id').limit(5)
      ];

      const results = await Promise.all(promises);

      // All queries should succeed (no errors)
      results.forEach(({ error }) => {
        expect(error).toBeNull();
      });

      // At least some queries should return data
      const successfulQueries = results.filter(result => result.data && result.data.length > 0);
      expect(successfulQueries.length).toBeGreaterThan(0);
    });
  });
});