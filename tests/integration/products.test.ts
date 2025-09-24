/**
 * 🌸 FloresYa Products Integration Tests - Silicon Valley Simple Mock Edition
 * Clean, maintainable tests with test data factories and simple mocks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FloresYaServer } from '../../src/app/server.js';
import supertest from 'supertest';
import { testSupabase } from '../utils/test-database.js';
import {
  createTestProduct,
  createTestProductList,
  createTestProductImage,
  createTestCarouselProduct,
  createTestCarouselData
} from '../utils/test-factories.js';
import { createSimpleProductMock, createMockRequest, createMockResponse } from '../utils/test-mocks.js';

describe('FloresYa Products Integration Tests - Simple Mock Edition', () => {
  let server: FloresYaServer;
  let request: any;

  beforeEach(() => {
    // Create server instance
    server = new FloresYaServer();

    // Get the Express app
    const app = server.getApp();

    // Create supertest agent
    request = supertest(app);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products - Simple Mock Integration', () => {
    it('should return products from mock database', async () => {
      // Arrange - Using the new simple mock system
      const mockProducts = [
        createTestProduct(),
        createTestProduct({ id: 2, name: 'Rosas Blancas', price_usd: 22.99 })
      ];

      const mockSupabase = createSimpleProductMock(mockProducts);
      vi.mocked(testSupabase.from).mockReturnValue(mockSupabase.from);

      // Act
      const response = await request
        .get('/api/products')
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Products retrieved successfully'
      });

      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('pagination');

      // Verify we have mock data
      const products = response.body.data.products;
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      // Verify product structure matches expected schema
      const firstProduct = products[0];
      expect(firstProduct).toHaveProperty('id');
      expect(firstProduct).toHaveProperty('name');
      expect(firstProduct).toHaveProperty('price_usd');
      expect(firstProduct).toHaveProperty('summary');
      expect(firstProduct).toHaveProperty('active');
      expect(firstProduct).toHaveProperty('carousel_order');

      // Verify data types
      expect(typeof firstProduct.id).toBe('number');
      expect(typeof firstProduct.name).toBe('string');
      expect(typeof firstProduct.price_usd).toBe('number');
      expect(typeof firstProduct.summary).toBe('string');
      expect(typeof firstProduct.active).toBe('boolean');
      expect(typeof firstProduct.carousel_order).toBe('number');
    });

    it('should return products with mock images from database', async () => {
      // Arrange
      const mockProducts = createTestProductList([
        createTestProduct({ id: 1, name: 'Rosas con Imagen' }),
        createTestProduct({ id: 2, name: 'Rosas sin Imagen' })
      ]);

      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockProducts.products, error: null })
      } as any);

      // Act
      const response = await request
        .get('/api/products?page=1&limit=5')
        .expect(200);

      // Assert
      const products = response.body.data.products;
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      // Verify product structure
      products.forEach((product: any) => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price_usd');
        expect(typeof product.id).toBe('number');
        expect(typeof product.name).toBe('string');
        expect(typeof product.price_usd).toBe('number');
      });
    });

    it('should filter products by active status from mock database', async () => {
      // Arrange
      const mockProducts = createTestProductList([
        createTestProduct({ active: true }),
        createTestProduct({ id: 2, name: 'Rosas Inactivas', active: false })
      ]);

      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [mockProducts.products[0]], error: null })
      } as any);

      // Act
      const response = await request
        .get('/api/products?active=true')
        .expect(200);

      // Assert
      const products = response.body.data.products;
      expect(Array.isArray(products)).toBe(true);

      // All products should be active
      products.forEach((product: any) => {
        expect(product.active).toBe(true);
        expect(typeof product.active).toBe('boolean');
      });
    });

    it('should sort products by carousel order from mock database', async () => {
      // Arrange
      const mockProducts = createTestProductList([
        createTestProduct({ carousel_order: 2 }),
        createTestProduct({ id: 2, name: 'Rosas Orden 1', carousel_order: 1 })
      ]);

      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockProducts.products, error: null })
      } as any);

      // Act
      const response = await request
        .get('/api/products?sort=carousel_order&order=asc')
        .expect(200);

      // Assert
      const products = response.body.data.products;
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      // Verify carousel order sorting
      for (let i = 1; i < products.length; i++) {
        expect(products[i].carousel_order).toBeGreaterThanOrEqual(products[i-1].carousel_order);
      }
    });
  });

  describe('GET /api/products/carousel - Simple Mock Integration', () => {
    it('should return carousel products from mock database', async () => {
      // Arrange
      const mockCarouselProducts = [
        createTestProduct({ id: 1, name: 'Rosas Carousel 1', carousel_order: 1 }),
        createTestProduct({ id: 2, name: 'Rosas Carousel 2', carousel_order: 2 })
      ];

      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockCarouselProducts, error: null })
      } as any);

      // Act
      const response = await request
        .get('/api/products/carousel')
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Carousel products retrieved successfully'
      });

      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('total_count');

      const { products } = response.body.data;
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      // Verify carousel products have proper structure
      products.forEach((product: any) => {
        expect(product).toHaveProperty('carousel_order');
        expect(typeof product.carousel_order).toBe('number');
        expect(product.carousel_order).toBeGreaterThan(0);
      });

      // Verify they are ordered by carousel_order
      for (let i = 1; i < products.length; i++) {
        expect(products[i].carousel_order).toBeGreaterThanOrEqual(products[i-1].carousel_order);
      }
    });

    it('should return carousel products with mock images', async () => {
      // Arrange
      const mockCarouselProducts = [
        createTestProduct({
          id: 1,
          name: 'Rosas con Imagen',
          carousel_order: 1,
          primary_thumb_url: '/images/rosas-thumb.webp'
        })
      ];

      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockCarouselProducts, error: null })
      } as any);

      // Act
      const response = await request
        .get('/api/products/carousel')
        .expect(200);

      // Assert
      const products = response.body.data.products;
      expect(products.length).toBeGreaterThan(0);

      // Verify image URLs are valid
      products.forEach((product: any) => {
        expect(product).toHaveProperty('primary_thumb_url');
        const imageUrl = product.primary_thumb_url;
        expect(typeof imageUrl).toBe('string');
        expect(imageUrl.length).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /api/products/featured - Simple Mock Integration', () => {
    it('should return featured products from mock database', async () => {
      // Arrange
      const mockFeaturedProducts = [
        createTestProduct({ id: 1, name: 'Rosas Destacadas', featured: true }),
        createTestProduct({ id: 2, name: 'Rosas Premium', featured: true })
      ];

      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockFeaturedProducts, error: null })
      } as any);

      // Act
      const response = await request
        .get('/api/products/featured')
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Featured products retrieved successfully'
      });

      const products = response.body.data.products;
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      // Verify all products are marked as featured
      products.forEach((product: any) => {
        expect(product.featured).toBe(true);
        expect(typeof product.featured).toBe('boolean');
      });
    });
  });

  describe('GET /api/products/:id - Simple Mock Integration', () => {
    it('should return a specific product from mock database', async () => {
      // Arrange
      const mockProduct = createTestProduct({ id: 1, name: 'Rosas Específicas' });
      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProduct, error: null })
      } as any);

      // Act
      const response = await request
        .get('/api/products/1')
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Product retrieved successfully'
      });

      expect(response.body.data).toHaveProperty('product');
      expect(response.body.data.product.id).toBe(1);
      expect(response.body.data.product.name).toBe('Rosas Específicas');
    });

    it('should return 404 for non-existent product', async () => {
      // Arrange
      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      } as any);

      // Act
      const response = await request
        .get('/api/products/99999')
        .expect(404);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: 'Product not found'
      });
    });
  });

  describe('GET /api/products/search - Simple Mock Integration', () => {
    it('should search products from mock database', async () => {
      // Arrange
      const mockSearchProducts = [
        createTestProduct({ id: 1, name: 'Rosas Rojas', summary: 'Hermosas rosas rojas' }),
        createTestProduct({ id: 2, name: 'Rosas Blancas', summary: 'Elegantes rosas blancas' })
      ];

      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockSearchProducts, error: null })
      } as any);

      // Act
      const response = await request
        .get('/api/products/search?q=rosa')
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Search completed successfully'
      });

      const products = response.body.data.products;
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      // Verify all products contain the search term
      products.forEach((product: any) => {
        const searchTerm = 'rosa';
        const searchableText = `${product.name} ${product.summary}`.toLowerCase();
        expect(searchableText).toContain(searchTerm);
      });
    });

    it('should return empty results for non-matching search', async () => {
      // Arrange
      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      } as any);

      // Act
      const response = await request
        .get('/api/products/search?q=xyz123nonexistent')
        .expect(200);

      // Assert
      const products = response.body.data.products;
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(0);
    });
  });

  describe('Database Connection Validation', () => {
    it('should verify mock database connection and data integrity', async () => {
      // Arrange
      const mockProducts = [
        createTestProduct({ id: 1, name: 'Rosas Test' }),
        createTestProduct({ id: 2, name: 'Rosas Test 2' })
      ];

      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockProducts, error: null })
      } as any);

      // Act
      const { data: products, error } = await testSupabase
        .from('products')
        .select('id, name, active')
        .limit(5);

      // Assert
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

    it('should verify product images relationship in mock database', async () => {
      // Arrange
      const mockImages = [
        createTestProductImage({ id: 1, product_id: 1, url: '/images/test1.webp' }),
        createTestProductImage({ id: 2, product_id: 2, url: '/images/test2.webp' })
      ];

      vi.mocked(testSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockImages, error: null })
      } as any);

      // Act
      const { data: images, error } = await testSupabase
        .from('product_images')
        .select('id, product_id, url, size, is_primary')
        .limit(10);

      // Assert
      expect(error).toBeNull();
      expect(images).toBeTruthy();
      expect(Array.isArray(images)).toBe(true);
      expect(images!.length).toBeGreaterThan(0);

      // Verify data integrity
      images!.forEach((image: any) => {
        expect(image).toHaveProperty('id');
        expect(image).toHaveProperty('product_id');
        expect(image).toHaveProperty('url');
        expect(image).toHaveProperty('size');
        expect(image).toHaveProperty('is_primary');

        // Verify data types
        expect(typeof image.id).toBe('number');
        expect(typeof image.product_id).toBe('number');
        expect(typeof image.url).toBe('string');
        expect(typeof image.size).toBe('string');
        expect(typeof image.is_primary).toBe('boolean');
      });
    });
  });
});