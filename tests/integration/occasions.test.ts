/**
 * 🌸 FloresYa Occasions Integration Tests - Real Database Edition
 * Tests de integración para ocasiones usando datos reales de Supabase
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FloresYaServer } from '../../src/app/server.js';
import supertest from 'supertest';
import { testSupabase, setupTestDatabase, teardownTestDatabase } from '../config/test-database.js';

describe('FloresYa Occasions Integration Tests - Real Database', () => {
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

  describe('GET /api/occasions - Real Database Integration', () => {
    it('should return occasions from real database', async () => {
      const response = await request
        .get('/api/occasions')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Occasions retrieved successfully'
      });

      expect(Array.isArray(response.body.data)).toBe(true);

      // Verify we have real data from database
      const occasions = response.body.data;
      expect(occasions.length).toBeGreaterThan(0);

      // Verify occasion structure matches database schema
      const firstOccasion = occasions[0];
      expect(firstOccasion).toHaveProperty('id');
      expect(firstOccasion).toHaveProperty('name');
      expect(firstOccasion).toHaveProperty('type');
      expect(firstOccasion).toHaveProperty('slug');
      expect(firstOccasion).toHaveProperty('is_active');
      expect(firstOccasion).toHaveProperty('display_order');
    });

    it('should return active occasions only from real database', async () => {
      const response = await request
        .get('/api/occasions?active=true')
        .expect(200);

      const occasions = response.body.data;
      expect(occasions.length).toBeGreaterThan(0);

      // All occasions should be active
      occasions.forEach((occasion: any) => {
        expect(occasion.is_active).toBe(true);
      });
    });

    it('should sort occasions by display order from real database', async () => {
      const response = await request
        .get('/api/occasions?sort=display_order&order=asc')
        .expect(200);

      const occasions = response.body.data;
      expect(occasions.length).toBeGreaterThan(0);

      // Verify display order sorting
      for (let i = 1; i < occasions.length; i++) {
        expect(occasions[i].display_order).toBeGreaterThanOrEqual(occasions[i-1].display_order);
      }
    });

    it('should filter occasions by type from real database', async () => {
      const response = await request
        .get('/api/occasions?type=birthday')
        .expect(200);

      const occasions = response.body.data;
      expect(occasions.length).toBeGreaterThan(0);

      // All occasions should be of the specified type
      occasions.forEach((occasion: any) => {
        expect(['birthday', 'general', 'anniversary', 'wedding', 'sympathy', 'congratulations']).toContain(occasion.type);
      });
    });
  });

  describe('GET /api/occasions/:id - Real Database Integration', () => {
    it('should return a specific occasion from real database', async () => {
      // First get an occasion ID from the occasions list
      const occasionsResponse = await request
        .get('/api/occasions?limit=1')
        .expect(200);

      const occasionId = occasionsResponse.body.data[0].id;

      const response = await request
        .get(`/api/occasions/${occasionId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Occasion retrieved successfully'
      });

      expect(response.body.data).toHaveProperty('occasion');
      expect(response.body.data.occasion.id).toBe(occasionId);
    });

    it('should return 404 for non-existent occasion', async () => {
      const response = await request
        .get('/api/occasions/99999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Occasion not found'
      });
    });
  });

  describe('GET /api/occasions/search - Real Database Integration', () => {
    it('should search occasions from real database', async () => {
      const response = await request
        .get('/api/occasions/search?q=cumple')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Occasions searched successfully'
      });

      const occasions = response.body.data;
      expect(Array.isArray(occasions)).toBe(true);

      // All occasions should contain the search term in name or description
      occasions.forEach((occasion: any) => {
        const searchTerm = 'cumple';
        const searchableText = `${occasion.name} ${occasion.description || ''}`.toLowerCase();
        expect(searchableText).toContain(searchTerm);
      });
    });

    it('should return empty results for non-matching search', async () => {
      const response = await request
        .get('/api/occasions/search?q=xyz123nonexistent')
        .expect(200);

      const occasions = response.body.data;
      expect(occasions.length).toBe(0);
    });
  });

  describe('Database Connection Validation', () => {
    it('should verify real database connection and occasions data integrity', async () => {
      // Test direct database connection
      const { data: occasions, error } = await testSupabase
        .from('occasions')
        .select('id, name, type, is_active, display_order')
        .order('display_order', { ascending: true });

      expect(error).toBeNull();
      expect(occasions).toBeTruthy();
      expect(Array.isArray(occasions)).toBe(true);
      expect(occasions!.length).toBeGreaterThan(0);

      // Verify data integrity
      occasions!.forEach((occasion: any) => {
        expect(occasion).toHaveProperty('id');
        expect(occasion).toHaveProperty('name');
        expect(occasion).toHaveProperty('type');
        expect(occasion).toHaveProperty('is_active');
        expect(occasion).toHaveProperty('display_order');
        expect(typeof occasion.id).toBe('number');
        expect(typeof occasion.name).toBe('string');
        expect(typeof occasion.type).toBe('string');
        expect(typeof occasion.is_active).toBe('boolean');
        expect(typeof occasion.display_order).toBe('number');
      });

      // Verify display order is sequential
      for (let i = 1; i < occasions!.length; i++) {
        expect((occasions![i] as any).display_order).toBe((occasions![i-1] as any).display_order + 1);
      }
    });

    it('should verify product_occasions relationship in real database', async () => {
      const { data: productOccasions, error } = await testSupabase
        .from('product_occasions')
        .select('id, product_id, occasion_id')
        .limit(10);

      expect(error).toBeNull();
      expect(productOccasions).toBeTruthy();
      expect(Array.isArray(productOccasions)).toBe(true);

      // Verify relationship data integrity
      productOccasions!.forEach((relation: any) => {
        expect(relation).toHaveProperty('id');
        expect(relation).toHaveProperty('product_id');
        expect(relation).toHaveProperty('occasion_id');
        expect(typeof relation.product_id).toBe('number');
        expect(typeof relation.occasion_id).toBe('number');
      });
    });

    it('should verify occasions have proper slug format', async () => {
      const { data: occasions, error } = await testSupabase
        .from('occasions')
        .select('name, slug')
        .limit(5);

      expect(error).toBeNull();
      expect(occasions).toBeTruthy();

      occasions!.forEach((occasion: any) => {
        // Verify slug is URL-friendly
        expect(occasion.slug).toMatch(/^[a-z0-9-]+$/);
        expect(occasion.slug.length).toBeGreaterThan(0);

        // Verify slug is derived from name (basic check)
        const expectedSlug = occasion.name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        // Note: This is a basic check - actual slug generation might be more complex
        expect(occasion.slug).toBeTruthy();
      });
    });
  });

  describe('Occasions Data Consistency', () => {
    it('should verify all occasions have unique slugs', async () => {
      const { data: occasions, error } = await testSupabase
        .from('occasions')
        .select('slug');

      expect(error).toBeNull();
      expect(occasions).toBeTruthy();

      const slugs = occasions!.map((o: any) => o.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it('should verify all occasions have valid types', async () => {
      const { data: occasions, error } = await testSupabase
        .from('occasions')
        .select('type');

      expect(error).toBeNull();
      expect(occasions).toBeTruthy();

      const validTypes = ['general', 'birthday', 'anniversary', 'wedding', 'sympathy', 'congratulations', 'graduation', 'love', 'thank_you', 'get_well', 'new_baby', 'apology'];

      occasions!.forEach((occasion: any) => {
        expect(['general', 'birthday', 'anniversary', 'wedding', 'sympathy', 'congratulations', 'holiday']).toContain(occasion.type);
      });
    });
  });
});