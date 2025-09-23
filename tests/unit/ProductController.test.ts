/**
 * 🌸 FloresYa ProductController Unit Tests - Mock Edition
 * Tests unitarios para ProductController usando mocks
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

// Mock request and response
const mockRequest = (options: any = {}) => ({
  params: options.params || {},
  query: options.query || {},
  body: options.body || {},
  ...options
});

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
};

describe('ProductController Unit Tests', () => {
  let controller: ProductController;
  let mockProductService: any;

  beforeEach(() => {
    // Reset all mocks
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
      const mockCarouselData = {
        products: [
          {
            id: 1,
            name: 'Rosas Rojas',
            summary: 'Hermosas rosas rojas',
            price_usd: 25.99,
            carousel_order: 1,
            primary_thumb_url: '/images/rosas-thumb.webp',
            images: [{ url: '/images/rosas-small.webp', size: 'small' }]
          }
        ],
        total_count: 1
      };

      mockProductService.getCarouselProducts.mockResolvedValue(mockCarouselData);

      const req = mockRequest();
      const res = mockResponse();

      await controller.getCarousel(req as any, res as any);

      expect(mockProductService.getCarouselProducts).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCarouselData,
        message: 'Carousel products retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Database connection failed';
      mockProductService.getCarouselProducts.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest();
      const res = mockResponse();

      await controller.getCarousel(req as any, res as any);

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
      const mockProducts = {
        products: [
          {
            id: 1,
            name: 'Rosas Rojas',
            price_usd: 25.99,
            active: true,
            featured: false,
            images: [],
            primary_image_url: '/images/rosas.webp'
          }
        ],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1,
          items_per_page: 20
        }
      };

      mockProductService.getProducts.mockResolvedValue(mockProducts);

      const req = mockRequest({
        query: { page: '1', limit: '20' }
      });
      const res = mockResponse();

      await controller.getProducts(req as any, res as any);

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
        data: mockProducts,
        message: 'Products retrieved successfully'
      });
    });

    it('should handle validation errors', async () => {
      const mockProducts = {
        products: [
          {
            id: 1,
            name: 'Rosas Rojas',
            price_usd: 25.99,
            active: true,
            featured: false,
            images: [],
            primary_image_url: '/images/rosas.webp'
          }
        ],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1,
          items_per_page: 20
        }
      };

      mockProductService.getProducts.mockResolvedValue(mockProducts);

      const req = mockRequest({
        query: { page: 'invalid' }
      });
      const res = mockResponse();

      await controller.getProducts(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProducts,
        message: 'Products retrieved successfully'
      });
    });
  });

  describe('getFeatured', () => {
    it('should return featured products successfully', async () => {
      const mockFeaturedProducts = [
        {
          id: 1,
          name: 'Rosas Rojas',
          price_usd: 25.99,
          active: true,
          featured: true,
          images: [],
          primary_image_url: '/images/rosas.webp'
        }
      ];

      mockProductService.getFeaturedProducts.mockResolvedValue(mockFeaturedProducts);

      const req = mockRequest({
        query: { limit: '8' }
      });
      const res = mockResponse();

      await controller.getFeatured(req as any, res as any);

      expect(mockProductService.getFeaturedProducts).toHaveBeenCalledWith(8);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { products: mockFeaturedProducts, count: 1 },
        message: 'Featured products retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Database connection failed';
      mockProductService.getFeaturedProducts.mockRejectedValue(new Error(errorMessage));

      const req = mockRequest();
      const res = mockResponse();

      await controller.getFeatured(req as any, res as any);

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
      const mockProduct = {
        id: 1,
        name: 'Rosas Rojas',
        price_usd: 25.99,
        active: true,
        featured: false,
        images: [
          {
            id: 1,
            product_id: 1,
            url: '/images/rosas.webp',
            size: 'medium',
            is_primary: true,
            image_index: 0
          }
        ],
        primary_image_url: '/images/rosas.webp'
      };

      mockProductService.getProductById.mockResolvedValue(mockProduct);

      const req = mockRequest({
        params: { id: '1' }
      });
      const res = mockResponse();

      await controller.getProductById(req as any, res as any);

      expect(mockProductService.getProductById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { product: mockProduct },
        message: 'Product retrieved successfully'
      });
    });

    it('should handle product not found', async () => {
      mockProductService.getProductById.mockResolvedValue(null);

      const req = mockRequest({
        params: { id: '999' }
      });
      const res = mockResponse();

      await controller.getProductById(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });
  });

  describe('searchProducts', () => {
    it('should search products successfully', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Rosas Rojas',
          price_usd: 25.99,
          active: true,
          featured: false,
          images: [],
          primary_image_url: '/images/rosas.webp'
        }
      ];

      mockProductService.searchProducts.mockResolvedValue(mockProducts);

      const req = mockRequest({
        query: { q: 'rosas', limit: '10' }
      });
      const res = mockResponse();

      await controller.searchProducts(req as any, res as any);

      expect(mockProductService.searchProducts).toHaveBeenCalledWith('rosas', 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { products: mockProducts, count: 1 },
        message: 'Search completed successfully'
      });
    });

    it('should handle missing search term', async () => {
      const req = mockRequest({
        query: { limit: '10' }
      });
      const res = mockResponse();

      await controller.searchProducts(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search term is required'
      });
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const mockProduct = {
        id: 1,
        name: 'Rosas Rojas',
        price_usd: 25.99,
        active: true,
        featured: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockProductService.createProduct.mockResolvedValue(mockProduct);

      const req = mockRequest({
        body: {
          name: 'Rosas Rojas',
          description: 'Hermosas rosas rojas para cualquier ocasión',
          price_usd: 25.99,
          stock: 100,
          featured: false
        }
      });
      const res = mockResponse();

      await controller.createProduct(req as any, res as any);

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
        data: { product: mockProduct },
        message: 'Product created successfully'
      });
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const mockProduct = {
        id: 1,
        name: 'Rosas Rojas Premium',
        price_usd: 29.99,
        active: true,
        featured: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockProductService.updateProduct.mockResolvedValue(mockProduct);

      const req = mockRequest({
        params: { id: '1' },
        body: {
          name: 'Rosas Rojas Premium',
          price_usd: 29.99,
          featured: true
        }
      });
      const res = mockResponse();

      await controller.updateProduct(req as any, res as any);

      expect(mockProductService.updateProduct).toHaveBeenCalledWith({
        id: 1,
        name: 'Rosas Rojas Premium',
        price_usd: 29.99,
        featured: true
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { product: mockProduct },
        message: 'Product updated successfully'
      });
    });
  });

  describe('updateCarouselOrder', () => {
    it('should update carousel order successfully', async () => {
      const mockProduct = {
        id: 1,
        name: 'Rosas Rojas',
        price_usd: 25.99,
        carousel_order: 2,
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockProductService.updateCarouselOrder.mockResolvedValue(mockProduct);

      const req = mockRequest({
        params: { id: '1' },
        body: {
          carousel_order: 2
        }
      });
      const res = mockResponse();

      await controller.updateCarouselOrder(req as any, res as any);

      expect(mockProductService.updateCarouselOrder).toHaveBeenCalledWith(1, 2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { product: mockProduct },
        message: 'Carousel order updated successfully'
      });
    });
  });

  describe('deleteProduct', () => {
    it('should perform logical deletion when product has references', async () => {
      const mockProduct = {
        id: 1,
        name: 'Rosas Rojas',
        price_usd: 25.99,
        active: false,
        featured: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockProductService.getProductById.mockResolvedValue(mockProduct);
      mockProductService.updateProduct.mockResolvedValue(mockProduct);

      // Mock TypeSafeDatabaseService to return images (simulating references)
      (typeSafeDatabaseService.getProductImages as any).mockResolvedValue([
        { id: 1, product_id: 1, url: '/images/test.jpg' }
      ]);

      const req = mockRequest({
        params: { id: '1' }
      });
      const res = mockResponse();

      await controller.deleteProduct(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          product: mockProduct,
          deletion_type: 'logical',
          has_references: true
        },
        message: 'Product deactivated successfully (has references in other tables)'
      });
    });

    it('should perform physical deletion when product has no references', async () => {
      const mockProduct = {
        id: 1,
        name: 'Rosas Rojas',
        price_usd: 25.99,
        active: true,
        featured: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockProductService.getProductById.mockResolvedValue(mockProduct);
      mockProductService.checkProductReferences.mockResolvedValue(false);
      mockProductService.deleteProduct.mockResolvedValue(undefined);

      const req = mockRequest({
        params: { id: '1' }
      });
      const res = mockResponse();

      await controller.deleteProduct(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledWith();
    });
  });
});