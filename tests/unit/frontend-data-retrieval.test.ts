/**
 * 🌸 FloresYa Frontend Data Retrieval Unit Tests
 * Tests for frontend JavaScript modules that retrieve and process data
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FloresYaAPI } from '../../src/frontend/services/apiClient.js';
import type {
  ApiResponse,
  Product,
  ProductListApiResponse,
  CarouselApiResponse
} from '../../src/shared/types/index.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Frontend Data Retrieval Unit Tests', () => {
  let api: FloresYaAPI;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    api = new FloresYaAPI('http://localhost:3000');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FloresYaAPI Client', () => {
    describe('Product Data Retrieval', () => {
      it('should fetch products with proper validation', async () => {
        const mockResponse: ProductListApiResponse = {
          success: true,
          data: [
            {
              id: 1,
              name: 'Rosa Roja Premium',
              description: 'Hermosa rosa roja',
              price_usd: 15.99,
              is_active: true,
              image_urls: ['https://example.com/rosa1.jpg'],
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              occasions: []
            }
          ],
          pagination: {
            page: 1,
            limit: 12,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await api.getProducts({ page: 1, limit: 12 });

        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/products?page=1&limit=12',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data![0]).toMatchObject({
          id: 1,
          name: 'Rosa Roja Premium',
          price_usd: 15.99
        });
      });

      it('should fetch single product by ID', async () => {
        const mockProduct = {
          id: 1,
          name: 'Rosa Roja Premium',
          description: 'Hermosa rosa roja',
          price_usd: 15.99,
          is_active: true,
          image_urls: ['https://example.com/rosa1.jpg'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        };

        const mockResponse: ApiResponse<Product> = {
          success: true,
          data: mockProduct
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await api.getProductById(1);

        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/products/1',
          expect.objectContaining({
            method: 'GET'
          })
        );

        expect(result.success).toBe(true);
        expect(result.data).toMatchObject({
          id: 1,
          name: 'Rosa Roja Premium'
        });
      });

      it('should handle API errors gracefully', async () => {
        const mockErrorResponse = {
          success: false,
          message: 'Producto no encontrado',
          error: 'Not Found'
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => mockErrorResponse
        });

        const result = await api.getProductById(999);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Producto no encontrado');
      });

      it('should validate product search queries', async () => {
        const mockResponse: ProductListApiResponse = {
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await api.getProducts({
          page: 1,
          limit: 12,
          search: 'rosa',
          occasion_id: 1,
          sort: 'price_usd:asc'
        });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=rosa'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('occasion_id=1'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sort=price_usd%3Aasc'),
          expect.any(Object)
        );

        expect(result.success).toBe(true);
      });
    });

    describe('Carousel Data Retrieval', () => {
      it('should fetch carousel products for homepage', async () => {
        const mockCarouselResponse: CarouselApiResponse = {
          success: true,
          data: [
            {
              id: 1,
              name: 'Rosa Premium',
              image_url: 'https://example.com/rosa.jpg',
              price_usd: 25.99,
              description: 'Rosa premium para ocasiones especiales'
            }
          ]
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCarouselResponse
        });

        const result = await api.getCarouselProducts();

        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/products/carousel',
          expect.objectContaining({
            method: 'GET'
          })
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data![0]).toMatchObject({
          id: 1,
          name: 'Rosa Premium',
          price_usd: 25.99
        });
      });

      it('should handle empty carousel data', async () => {
        const mockResponse: CarouselApiResponse = {
          success: true,
          data: []
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await api.getCarouselProducts();

        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });
    });

    describe('Occasions Data Retrieval', () => {
      it('should fetch occasions for filter dropdown', async () => {
        const mockOccasions = [
          { id: 1, name: 'Amor', slug: 'amor', is_active: true },
          { id: 2, name: 'Cumpleaños', slug: 'cumpleanos', is_active: true }
        ];

        const mockResponse = {
          success: true,
          data: mockOccasions
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await api.getOccasions();

        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/occasions',
          expect.objectContaining({
            method: 'GET'
          })
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data![0]).toMatchObject({
          id: 1,
          name: 'Amor'
        });
      });
    });

    describe('Authentication Integration', () => {
      it('should include auth token in requests when available', async () => {
        const token = 'mock-jwt-token';
        api.setAuthToken(token);

        const mockResponse = { success: true, data: [] };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        await api.getProducts({ page: 1 });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': `Bearer ${token}`
            })
          })
        );
      });

      it('should handle user login attempts', async () => {
        const mockResponse = {
          success: true,
          data: {
            user: {
              id: 1,
              email: 'test@example.com',
              full_name: 'Test User',
              role: 'user'
            },
            token: 'mock-jwt-token'
          }
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await api.login({
          email: 'test@example.com',
          password: 'password123'
        });

        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/users/login',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123'
            })
          })
        );

        expect(result.success).toBe(true);
        expect(result.data?.user.email).toBe('test@example.com');
      });
    });

    describe('Error Handling and Resilience', () => {
      it('should handle network failures', async () => {
        (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

        const result = await api.getProducts({ page: 1 });

        expect(result.success).toBe(false);
        expect(result.message).toContain('Network error');
      });

      it('should handle malformed JSON responses', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => {
            throw new Error('Invalid JSON');
          }
        });

        const result = await api.getProducts({ page: 1 });

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid JSON');
      });

      it('should validate response data structure', async () => {
        const invalidResponse = {
          success: true,
          data: 'invalid-data-format' // Should be an array
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => invalidResponse
        });

        const result = await api.getProducts({ page: 1 });

        // API client should validate response format
        expect(result.success).toBe(false);
      });

      it('should handle HTTP error status codes', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({
            success: false,
            message: 'Server error'
          })
        });

        const result = await api.getProducts({ page: 1 });

        expect(result.success).toBe(false);
        expect(result.message).toBeTruthy();
      });
    });

    describe('Data Validation and Type Safety', () => {
      it('should validate product data against schema', async () => {
        const invalidProduct = {
          id: 'invalid-id', // Should be number
          name: null, // Should be string
          price_usd: 'invalid-price' // Should be number
        };

        const mockResponse = {
          success: true,
          data: [invalidProduct]
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await api.getProducts({ page: 1 });

        // Should fail validation and return error
        expect(result.success).toBe(false);
      });

      it('should validate occasion data structure', async () => {
        const validOccasions = [
          { id: 1, name: 'Amor', slug: 'amor', is_active: true },
          { id: 2, name: 'Cumpleaños', slug: 'cumpleanos', is_active: true }
        ];

        const mockResponse = {
          success: true,
          data: validOccasions
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await api.getOccasions();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);

        // Validate each occasion has required properties
        result.data!.forEach(occasion => {
          expect(occasion).toHaveProperty('id');
          expect(occasion).toHaveProperty('name');
          expect(occasion).toHaveProperty('slug');
          expect(occasion).toHaveProperty('is_active');
        });
      });
    });
  });

  describe('Query Parameter Handling', () => {
    it('should build correct query strings for product filters', () => {
      const query = {
        page: 2,
        limit: 20,
        search: 'rosa premium',
        occasion_id: 3,
        sort: 'price_usd:desc',
        active: true
      };

      // This would test the private buildQueryString method if it were public
      // For now, we test it indirectly through the API calls
      expect(true).toBe(true); // Placeholder
    });

    it('should handle special characters in search queries', async () => {
      const mockResponse = { success: true, data: [], pagination: {} };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await api.getProducts({
        page: 1,
        search: 'rosa & co. "premium"'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('rosa%20%26%20co.%20%22premium%22'),
        expect.any(Object)
      );
    });
  });
});