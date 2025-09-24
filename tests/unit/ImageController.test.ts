/**
 * 🌸 FloresYa ImageController Unit Tests - Silicon Valley Simple Mock Edition
 * Clean, maintainable tests with one mock per test pattern
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ImageController, imageValidators } from '../../src/controllers/ImageController';
import { ImageService } from '../../src/services/ImageService';

// Mock dependencies
vi.mock('../../src/services/ImageService', () => ({
  ImageService: vi.fn().mockImplementation(() => ({
    validateImageFile: vi.fn(),
    uploadProductImage: vi.fn(),
    deleteProductImages: vi.fn(),
    getProductImages: vi.fn(),
    getImagesGallery: vi.fn(),
    uploadSiteImage: vi.fn(),
    getCurrentSiteImages: vi.fn(),
    getProductsWithImageCounts: vi.fn()
  }))
}));

// Mock express-validator
vi.mock('express-validator', () => ({
  body: vi.fn(() => ({
    isInt: vi.fn().mockReturnThis(),
    isIn: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis()
  })),
  param: vi.fn(() => ({
    isInt: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis()
  })),
  query: vi.fn(() => ({
    optional: vi.fn().mockReturnThis(),
    isInt: vi.fn().mockReturnThis(),
    isIn: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis()
  })),
  validationResult: vi.fn()
}));

describe('ImageController', () => {
  let controller: ImageController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: any;
  let statusSpy: any;
  let mockImageService: any;

  // Test data factories
  const createTestProductImage = (overrides = {}) => ({
    id: 1,
    product_id: 1,
    size: 'medium' as const,
    url: 'https://example.com/image.webp',
    file_hash: 'abc123',
    is_primary: true,
    image_index: 0,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides
  });

  const createTestImageUploadResult = (overrides = {}) => ({
    success: true,
    images: [
      { size: 'thumb' as const, url: 'https://example.com/thumb.webp', fileHash: 'hash1' },
      { size: 'small' as const, url: 'https://example.com/small.webp', fileHash: 'hash2' },
      { size: 'medium' as const, url: 'https://example.com/medium.webp', fileHash: 'hash3' },
      { size: 'large' as const, url: 'https://example.com/large.webp', fileHash: 'hash4' }
    ],
    primaryImage: createTestProductImage(),
    message: 'Successfully uploaded 4 image variations',
    ...overrides
  });

  const createTestSiteImageResult = (overrides = {}) => ({
    success: true,
    url: 'https://example.com/site-hero.webp',
    type: 'hero' as const,
    message: 'Successfully uploaded hero image',
    ...overrides
  });

  const createTestGalleryResult = (overrides = {}) => ({
    images: [createTestProductImage()],
    pagination: {
      page: 1,
      total: 1,
      pages: 1
    },
    ...overrides
  });

  const createTestProductsWithCounts = (overrides = {}) => ({
    products: [
      {
        id: 1,
        name: 'Rose Bouquet',
        price_usd: 75.00,
        image_count: 4
      }
    ],
    ...overrides
  });

  const createValidationResult = (isEmpty = true, errors: any[] = []) => ({
    isEmpty: () => isEmpty,
    array: () => errors,
    formatter: vi.fn(),
    errors,
    mapped: vi.fn(),
    formatWith: vi.fn(),
    throw: vi.fn()
  } as any);

  const createMockFile = (overrides = {}) => ({
    buffer: Buffer.from('fake image data'),
    originalname: 'test-image.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    fieldname: 'file',
    encoding: '7bit',
    stream: null,
    destination: '',
    filename: 'test-image.jpg',
    path: '',
    ...overrides
  } as any);

  beforeEach(() => {
    // Create new controller instance with mocked service
    const MockImageService = vi.mocked(ImageService);
    mockImageService = {
      validateImageFile: vi.fn(),
      uploadProductImage: vi.fn(),
      deleteProductImages: vi.fn(),
      getProductImages: vi.fn(),
      getImagesGallery: vi.fn(),
      uploadSiteImage: vi.fn(),
      getCurrentSiteImages: vi.fn(),
      getProductsWithImageCounts: vi.fn()
    };
    MockImageService.mockImplementation(() => mockImageService);

    controller = new ImageController();

    jsonSpy = vi.fn().mockReturnThis();
    statusSpy = vi.fn().mockReturnThis();

    mockResponse = {
      json: jsonSpy,
      status: statusSpy
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadProductImage', () => {
    it('should upload product image successfully', async () => {
      // Arrange
      const testUploadResult = createTestImageUploadResult();
      mockImageService.validateImageFile.mockReturnValue({ valid: true });
      mockImageService.uploadProductImage.mockResolvedValue(testUploadResult);

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const mockFile = createMockFile();
      mockRequest = {
        params: { productId: '1' },
        body: { imageIndex: '0', isPrimary: 'true' },
        file: mockFile
      };

      // Act
      await controller.uploadProductImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockImageService.validateImageFile).toHaveBeenCalledWith(mockFile);
      expect(mockImageService.uploadProductImage).toHaveBeenCalledWith({
        productId: 1,
        imageIndex: 0,
        file: mockFile,
        isPrimary: true
      });
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          images: testUploadResult.images,
          primaryImage: testUploadResult.primaryImage
        },
        message: testUploadResult.message
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult(false, [{ field: 'productId', message: 'Invalid product ID' }]));

      mockRequest = {
        params: { productId: 'invalid' },
        body: {}
      };

      // Act
      await controller.uploadProductImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'productId', message: 'Invalid product ID' }]
      });
    });

    it('should handle missing file', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { productId: '1' },
        body: { imageIndex: '0' }
        // No file provided
      };

      // Act
      await controller.uploadProductImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'No image file provided'
      });
    });

    it('should handle invalid image file', async () => {
      // Arrange
      mockImageService.validateImageFile.mockReturnValue({
        valid: false,
        error: 'Invalid file type'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const mockFile = createMockFile({ mimetype: 'image/gif' });
      mockRequest = {
        params: { productId: '1' },
        body: { imageIndex: '0' },
        file: mockFile
      };

      // Act
      await controller.uploadProductImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockImageService.validateImageFile).toHaveBeenCalledWith(mockFile);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid file type'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockImageService.validateImageFile.mockReturnValue({ valid: true });
      mockImageService.uploadProductImage.mockResolvedValue({
        success: false,
        images: [],
        message: 'Database connection failed'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const mockFile = createMockFile();
      mockRequest = {
        params: { productId: '1' },
        body: { imageIndex: '0' },
        file: mockFile
      };

      // Act
      await controller.uploadProductImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed'
      });
    });
  });

  describe('deleteProductImages', () => {
    it('should delete product images successfully', async () => {
      // Arrange
      mockImageService.deleteProductImages.mockResolvedValue(true);

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { productId: '1' }
      };

      // Act
      await controller.deleteProductImages(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockImageService.deleteProductImages).toHaveBeenCalledWith(1);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully deleted all images for product 1'
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult(false, [{ field: 'productId', message: 'Invalid product ID' }]));

      mockRequest = {
        params: { productId: 'invalid' }
      };

      // Act
      await controller.deleteProductImages(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'productId', message: 'Invalid product ID' }]
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockImageService.deleteProductImages.mockResolvedValue(false);

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { productId: '1' }
      };

      // Act
      await controller.deleteProductImages(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete product images'
      });
    });
  });

  describe('getProductImages', () => {
    it('should return product images successfully', async () => {
      // Arrange
      const testImages = [createTestProductImage()];
      mockImageService.getProductImages.mockResolvedValue(testImages);

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { productId: '1' }
      };

      // Act
      await controller.getProductImages(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockImageService.getProductImages).toHaveBeenCalledWith(1);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          images: testImages
        },
        message: 'Product images retrieved successfully'
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult(false, [{ field: 'productId', message: 'Invalid product ID' }]));

      mockRequest = {
        params: { productId: 'invalid' }
      };

      // Act
      await controller.getProductImages(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: [{ field: 'productId', message: 'Invalid product ID' }]
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockImageService.getProductImages.mockRejectedValue(new Error('Database connection failed'));

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { productId: '1' }
      };

      // Act
      await controller.getProductImages(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get product images'
      });
    });
  });

  describe('getImagesGallery', () => {
    it('should return images gallery successfully', async () => {
      // Arrange
      const testGalleryResult = createTestGalleryResult();
      mockImageService.getImagesGallery.mockResolvedValue(testGalleryResult);

      mockRequest = {
        query: { filter: 'all', page: '1', limit: '20' }
      };

      // Act
      await controller.getImagesGallery(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockImageService.getImagesGallery).toHaveBeenCalledWith('all', 1, 20);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: testGalleryResult,
        message: 'Images gallery retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockImageService.getImagesGallery.mockRejectedValue(new Error('Database connection failed'));

      mockRequest = {
        query: { filter: 'all', page: '1', limit: '20' }
      };

      // Act
      await controller.getImagesGallery(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve images gallery',
        error: 'Database connection failed'
      });
    });
  });

  describe('uploadSiteImage', () => {
    it('should upload site image successfully', async () => {
      // Arrange
      const testSiteImageResult = createTestSiteImageResult();
      mockImageService.validateImageFile.mockReturnValue({ valid: true });
      mockImageService.uploadSiteImage.mockResolvedValue(testSiteImageResult);

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const mockFile = createMockFile();
      mockRequest = {
        body: { type: 'hero' },
        file: mockFile
      };

      // Act
      await controller.uploadSiteImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockImageService.validateImageFile).toHaveBeenCalledWith(mockFile);
      expect(mockImageService.uploadSiteImage).toHaveBeenCalledWith(mockFile, 'hero');
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          url: testSiteImageResult.url,
          type: testSiteImageResult.type
        },
        message: 'Successfully uploaded hero image'
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult(false, [{ field: 'type', message: 'Invalid type' }]));

      mockRequest = {
        body: { type: 'invalid' }
      };

      // Act
      await controller.uploadSiteImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'type', message: 'Invalid type' }]
      });
    });

    it('should handle missing file', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        body: { type: 'hero' }
        // No file provided
      };

      // Act
      await controller.uploadSiteImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'No image file provided'
      });
    });
  });

  describe('getCurrentSiteImages', () => {
    it('should return current site images successfully', () => {
      // Arrange
      mockImageService.getCurrentSiteImages.mockReturnValue({
        hero: '/images/hero-flowers.webp',
        logo: '/images/logoFloresYa.jpeg'
      });

      // Act
      controller.getCurrentSiteImages(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockImageService.getCurrentSiteImages).toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          hero: '/images/hero-flowers.webp',
          logo: '/images/logoFloresYa.jpeg'
        },
        message: 'Current site images retrieved successfully'
      });
    });

    it('should handle service errors', () => {
      // Arrange
      mockImageService.getCurrentSiteImages.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act
      controller.getCurrentSiteImages(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve current site images',
        error: 'Database connection failed'
      });
    });
  });

  describe('getProductsWithImageCounts', () => {
    it('should return products with image counts successfully', async () => {
      // Arrange
      const testProductsWithCounts = createTestProductsWithCounts();
      mockImageService.getProductsWithImageCounts.mockResolvedValue(testProductsWithCounts);

      mockRequest = {
        query: { sort_by: 'image_count', sort_direction: 'asc' }
      };

      // Act
      await controller.getProductsWithImageCounts(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockImageService.getProductsWithImageCounts).toHaveBeenCalledWith('image_count', 'asc');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: testProductsWithCounts,
        message: 'Products with image counts retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockImageService.getProductsWithImageCounts.mockRejectedValue(new Error('Database connection failed'));

      mockRequest = {
        query: { sort_by: 'name', sort_direction: 'desc' }
      };

      // Act
      await controller.getProductsWithImageCounts(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve products with image counts',
        error: 'Database connection failed'
      });
    });
  });

  describe('imageValidators', () => {
    it('should validate uploadProductImage correctly', () => {
      // Arrange
      const validators = imageValidators.uploadProductImage;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate deleteProductImages correctly', () => {
      // Arrange
      const validators = imageValidators.deleteProductImages;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate getProductImages correctly', () => {
      // Arrange
      const validators = imageValidators.getProductImages;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate getImagesGallery correctly', () => {
      // Arrange
      const validators = imageValidators.getImagesGallery;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate uploadSiteImage correctly', () => {
      // Arrange
      const validators = imageValidators.uploadSiteImage;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });
  });
});