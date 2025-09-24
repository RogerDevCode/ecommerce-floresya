/**
 * 🌸 FloresYa ProductController Unit Tests - Silicon Valley Simple Mock Edition
 * Clean, maintainable tests with one mock per test pattern
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the ProductService module
vi.mock('../../src/services/ProductService.js', () => ({
  ProductService: vi.fn()
}));

// Mock the TypeSafeDatabaseService module
vi.mock('../../src/services/TypeSafeDatabaseService.js', () => ({
  typeSafeDatabaseService: {
    getProductImages: vi.fn(),
    getProductOccasionReferences: vi.fn(),
    getClient: vi.fn()
  }
}));

import { ProductController } from '../../src/controllers/ProductController.js';
import { ProductService } from '../../src/services/ProductService.js';
import { typeSafeDatabaseService } from '../../src/services/TypeSafeDatabaseService.js';

describe('ProductController Unit Tests', () => {
  let controller: ProductController;
  let mockProductService: any;

  // Test data factories
  const createTestProduct = (overrides = {}) => ({
    id: 1,
    name: 'Rosas Rojas',
    summary: 'Hermosas rosas rojas',
    price_usd: 25.99,
    stock: 100,
    active: true,
    featured: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  });

  const createTestProductList = (products = [createTestProduct()], overrides = {}) => ({
    products,
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_items: products.length,
      items_per_page: 20,
      ...overrides
    }
  });

  const createTestCarouselProduct = (overrides = {}) => ({
    id: 1,
    name: 'Rosas Rojas',
    summary: 'Hermosas rosas rojas',
    price_usd: 25.99,
    carousel_order: 1,
    primary_thumb_url: '/images/rosas-thumb.webp',
    images: [{ url: '/images/rosas-small.webp', size: 'small' }],
    ...overrides
  });

  const createTestCarouselData = (products = [createTestCarouselProduct()], overrides = {}) => ({
    products,
    total_count: products.length,
    ...overrides
  });

  const createMockRequest = (options: any = {}) => ({
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    ...options
  });

  const createMockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock ProductService instance
    mockProductService = {
      getCarouselProducts: vi.fn(),
      getProducts: vi.fn(),
      getFeaturedProducts: vi.fn(),
      getProductById: vi.fn(),
      getProductByIdWithOccasions: vi.fn(),
      searchProducts: vi.fn(),
      createProduct: vi.fn(),
      updateProduct: vi.fn(),
      updateCarouselOrder: vi.fn(),
      deleteProduct: vi.fn(),
      checkProductReferences: vi.fn()
    };

    // Mock the ProductService constructor
    (ProductService as any).mockImplementation(() => mockProductService);

    // Mock TypeSafeDatabaseService methods
    (typeSafeDatabaseService.getProductImages as any).mockResolvedValue([]);
    (typeSafeDatabaseService.getProductOccasionReferences as any).mockResolvedValue([]);
    (typeSafeDatabaseService.getClient as any).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      }))
    });

    // Create controller instance
    controller = new ProductController();
  });

  describe('getCarousel', () => {
    it('should return carousel products successfully', async () => {
      // Arrange
      const testCarouselData = createTestCarouselData();
      mockProductService.getCarouselProducts.mockResolvedValue(testCarouselData);

      const req = createMockRequest();
      const res = createMockResponse();

      // Act
      await controller.getCarousel(req as any, res as any);

      // Assert
      expect(mockProductService.getCarouselProducts).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: testCarouselData,
        message: 'Carousel products retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockProductService.getCarouselProducts.mockRejectedValue(new Error(errorMessage));

      const req = createMockRequest();
      const res = createMockResponse();

      // Act
      await controller.getCarousel(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch carousel products',
        error: errorMessage
      });
    });
  });

  describe('getProducts', () => {
    it('should return products successfully', async () => {
      // Arrange
      const testProducts = createTestProductList();
      mockProductService.getProducts.mockResolvedValue(testProducts);

      const req = createMockRequest({
        query: { page: '1', limit: '20' }
      });
      const res = createMockResponse();

      // Act
      await controller.getProducts(req as any, res as any);

      // Assert
      expect(mockProductService.getProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: undefined,
        occasion: undefined,
        featured: undefined,
        has_carousel_order: undefined,
        sort_by: 'created_at',
        sort_direction: 'desc'
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: testProducts,
        message: 'Products retrieved successfully'
      });
    });
  });

  describe('getFeatured', () => {
    it('should return featured products successfully', async () => {
      // Arrange
      const testFeaturedProducts = [createTestProduct({ featured: true })];
      mockProductService.getFeaturedProducts.mockResolvedValue(testFeaturedProducts);

      const req = createMockRequest({
        query: { limit: '8' }
      });
      const res = createMockResponse();

      // Act
      await controller.getFeatured(req as any, res as any);

      // Assert
      expect(mockProductService.getFeaturedProducts).toHaveBeenCalledWith(8);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { products: testFeaturedProducts, count: 1 },
        message: 'Featured products retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockProductService.getFeaturedProducts.mockRejectedValue(new Error(errorMessage));

      const req = createMockRequest();
      const res = createMockResponse();

      // Act
      await controller.getFeatured(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch featured products',
        error: errorMessage
      });
    });
  });

  describe('getProductById', () => {
    it('should return product successfully', async () => {
      // Arrange
      const testProduct = createTestProduct();
      mockProductService.getProductById.mockResolvedValue(testProduct);

      const req = createMockRequest({
        params: { id: '1' }
      });
      const res = createMockResponse();

      // Act
      await controller.getProductById(req as any, res as any);

      // Assert
      expect(mockProductService.getProductById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { product: testProduct },
        message: 'Product retrieved successfully'
      });
    });

    it('should handle product not found', async () => {
      // Arrange
      mockProductService.getProductById.mockResolvedValue(null);

      const req = createMockRequest({
        params: { id: '999' }
      });
      const res = createMockResponse();

      // Act
      await controller.getProductById(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });
  });

  describe('searchProducts', () => {
    it('should search products successfully', async () => {
      // Arrange
      const testProducts = [createTestProduct()];
      mockProductService.searchProducts.mockResolvedValue(testProducts);

      const req = createMockRequest({
        query: { q: 'rosas', limit: '10' }
      });
      const res = createMockResponse();

      // Act
      await controller.searchProducts(req as any, res as any);

      // Assert
      expect(mockProductService.searchProducts).toHaveBeenCalledWith('rosas', 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { products: testProducts, count: 1 },
        message: 'Search completed successfully'
      });
    });

    it('should handle missing search term', async () => {
      // Arrange
      const req = createMockRequest({
        query: { limit: '10' }
      });
      const res = createMockResponse();

      // Act
      await controller.searchProducts(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search term is required'
      });
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      // Arrange
      const testProduct = createTestProduct();
      mockProductService.createProduct.mockResolvedValue(testProduct);

      const req = createMockRequest({
        body: {
          name: 'Rosas Rojas',
          description: 'Hermosas rosas rojas para cualquier ocasión',
          price_usd: 25.99,
          stock: 100,
          featured: false
        }
      });
      const res = createMockResponse();

      // Act
      await controller.createProduct(req as any, res as any);

      // Assert
      expect(mockProductService.createProduct).toHaveBeenCalledWith({
        name: 'Rosas Rojas',
        description: 'Hermosas rosas rojas para cualquier ocasión',
        price_usd: 25.99,
        stock: 100,
        featured: false
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { product: testProduct },
        message: 'Product created successfully'
      });
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      // Arrange
      const testProduct = createTestProduct({ name: 'Rosas Rojas Premium', price_usd: 29.99, featured: true });
      mockProductService.updateProduct.mockResolvedValue(testProduct);

      const req = createMockRequest({
        params: { id: '1' },
        body: {
          name: 'Rosas Rojas Premium',
          price_usd: 29.99,
          featured: true
        }
      });
      const res = createMockResponse();

      // Act
      await controller.updateProduct(req as any, res as any);

      // Assert
      expect(mockProductService.updateProduct).toHaveBeenCalledWith({
        id: 1,
        name: 'Rosas Rojas Premium',
        price_usd: 29.99,
        featured: true
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { product: testProduct },
        message: 'Product updated successfully'
      });
    });
  });

  describe('updateCarouselOrder', () => {
    it('should update carousel order successfully', async () => {
      // Arrange
      const testProduct = createTestProduct({ carousel_order: 2 });
      mockProductService.updateCarouselOrder.mockResolvedValue(testProduct);

      const req = createMockRequest({
        params: { id: '1' },
        body: {
          carousel_order: 2
        }
      });
      const res = createMockResponse();

      // Act
      await controller.updateCarouselOrder(req as any, res as any);

      // Assert
      expect(mockProductService.updateCarouselOrder).toHaveBeenCalledWith(1, 2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { product: testProduct },
        message: 'Carousel order updated successfully'
      });
    });
  });

  describe('deleteProduct', () => {
    it('should perform logical deletion when product has references', async () => {
      // Arrange
      const testProduct = createTestProduct({ active: false });
      mockProductService.getProductById.mockResolvedValue(testProduct);
      mockProductService.updateProduct.mockResolvedValue(testProduct);

      // Mock TypeSafeDatabaseService to return images (simulating references)
      (typeSafeDatabaseService.getProductImages as any).mockResolvedValue([
        { id: 1, product_id: 1, url: '/images/test.jpg' }
      ]);

      const req = createMockRequest({
        params: { id: '1' }
      });
      const res = createMockResponse();

      // Act
      await controller.deleteProduct(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          product: testProduct,
          deletion_type: 'logical',
          has_references: true
        },
        message: 'Product deactivated successfully (has references in other tables)'
      });
    });

    it('should perform physical deletion when product has no references', async () => {
      // Arrange
      const testProduct = createTestProduct();
      mockProductService.getProductById.mockResolvedValue(testProduct);
      mockProductService.checkProductReferences.mockResolvedValue(false);
      mockProductService.deleteProduct.mockResolvedValue(undefined);

      const req = createMockRequest({
        params: { id: '1' }
      });
      const res = createMockResponse();

      // Act
      await controller.deleteProduct(req as any, res as any);

      // Assert
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledWith();
    });
  });
});