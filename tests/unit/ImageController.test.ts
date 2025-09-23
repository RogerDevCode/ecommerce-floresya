/**
 * 🌸 FloresYa Image Controller Tests - Enterprise TypeScript Edition
 * Comprehensive unit tests for image management endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { ImageController } from '../../src/controllers/ImageController.js';
import { ImageService } from '../../src/services/ImageService.js';
import type {
  ProductImage,
  ImageSize,
  ImageUploadResult,
  MulterFile
} from '../../src/shared/types/index.js';

// Mock express-validator with all required functions
vi.mock('express-validator', () => {
  const mockValidationChain = {
    isInt: vi.fn().mockReturnThis(),
    isIn: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis()
  };

  // Default validation result (no errors)
  const defaultValidationResult = {
    isEmpty: vi.fn().mockReturnValue(true),
    array: vi.fn().mockReturnValue([])
  };

  return {
    body: vi.fn().mockReturnValue(mockValidationChain),
    param: vi.fn().mockReturnValue(mockValidationChain),
    query: vi.fn().mockReturnValue(mockValidationChain),
    validationResult: vi.fn().mockReturnValue(defaultValidationResult)
  };
});

// Mock the ImageService
vi.mock('../../src/services/ImageService.js', () => ({
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


// Create a mock instance for testing
const mockImageServiceInstance = {
  validateImageFile: vi.fn(),
  uploadProductImage: vi.fn(),
  deleteProductImages: vi.fn(),
  getProductImages: vi.fn(),
  getImagesGallery: vi.fn(),
  uploadSiteImage: vi.fn(),
  getCurrentSiteImages: vi.fn(),
  getProductsWithImageCounts: vi.fn(),
  processImage: vi.fn(),
  uploadImagesToStorage: vi.fn(),
  saveImageRecords: vi.fn(),
  resizeImage: vi.fn(),
  generateFileName: vi.fn(),
  generateFileHash: vi.fn(),
  IMAGE_SIZES: {
    large: { width: 1200, height: 1200 },
    medium: { width: 600, height: 600 },
    small: { width: 300, height: 300 },
    thumb: { width: 150, height: 150 }
  }
} as any;

describe('ImageController', () => {
  let imageController: ImageController;
  let mockImageService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(async () => {
    // Create a new instance of ImageController with mocked service
    imageController = new ImageController(() => mockImageServiceInstance);
    mockImageService = mockImageServiceInstance;

    // Mock response methods
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };

    // Clear all mocks before each test
    vi.clearAllMocks();

    // Reset the validationResult mock to default (no errors)
    const { validationResult } = await import('express-validator');
    (validationResult as any).mockReturnValue({
      isEmpty: vi.fn().mockReturnValue(true),
      array: vi.fn().mockReturnValue([])
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadProductImage', () => {

    it('should upload product image successfully', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size: 1024,
        stream: null,
        destination: '',
        filename: 'test-image.jpg',
        path: '/tmp/test-image.jpg'
      } as any;

      const mockUploadResult: ImageUploadResult = {
        success: true,
        images: [
          {
            size: 'thumb' as ImageSize,
            url: '/images/products/1/thumb-test-image.jpg',
            fileHash: 'abc123'
          },
          {
            size: 'small' as ImageSize,
            url: '/images/products/1/small-test-image.jpg',
            fileHash: 'def456'
          }
        ],
        primaryImage: {
          id: 1,
          product_id: 1,
          url: '/images/products/1/thumb-test-image.jpg',
          alt_text: 'Test image',
          size: 'thumb' as ImageSize,
          is_primary: true,
          display_order: 0,
          created_at: '2024-01-01T00:00:00Z'
        },
        message: 'Image uploaded successfully'
      };

      mockImageService.validateImageFile.mockReturnValue({ valid: true });
      mockImageService.uploadProductImage.mockResolvedValue(mockUploadResult);

      mockRequest = {
        params: { productId: '1' },
        body: {
          imageIndex: '0',
          isPrimary: 'true'
        },
        file: mockFile
      };

      await imageController.uploadProductImage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          images: mockUploadResult.images,
          primaryImage: mockUploadResult.primaryImage
        },
        message: mockUploadResult.message
      });
    });

    it('should handle validation errors', async () => {
        // Mock validationResult to return errors
        const mockErrors = [{ param: 'productId', msg: 'Product ID must be a positive integer' }];

        // Update the mock to return validation errors
        const { validationResult } = await import('express-validator');
        (validationResult as any).mockReturnValue({
          isEmpty: vi.fn().mockReturnValue(false),
          array: vi.fn().mockReturnValue(mockErrors)
        });

        mockRequest = {
          params: { productId: 'invalid' },
          body: {
            imageIndex: 'invalid',
            isPrimary: 'invalid'
          },
          file: {
            fieldname: 'image',
            originalname: 'test.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            buffer: Buffer.from('fake'),
            size: 1024,
            stream: null,
            destination: '',
            filename: 'test.jpg',
            path: '/tmp/test.jpg'
          } as any // File provided to avoid the "No image file provided" error
        };

        await imageController.uploadProductImage(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: mockErrors
        });
      });

    it('should return 400 when no file is provided', async () => {
      mockRequest = {
        params: { productId: '1' },
        body: {
          imageIndex: '0',
          isPrimary: 'false'
        }
      };

      await imageController.uploadProductImage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'No image file provided'
      });
    });

    it('should handle invalid image file', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'test-image.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('fake-text-data'),
        size: 1024,
        stream: null,
        destination: '',
        filename: 'test-image.txt',
        path: '/tmp/test-image.txt'
      } as any;
      mockImageService.validateImageFile.mockReturnValue({
        valid: false,
        error: 'Only JPEG, PNG, and WebP images are allowed'
      });

      mockRequest = {
        params: { productId: '1' },
        body: {
          imageIndex: '0',
          isPrimary: 'false'
        },
        file: mockFile
      };

      await imageController.uploadProductImage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Only JPEG, PNG, and WebP images are allowed'
      });
    });

    it('should handle service errors', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size: 1024,
        stream: null,
        destination: '',
        filename: 'test-image.jpg',
        path: '/tmp/test-image.jpg'
      } as any;

      mockImageService.validateImageFile.mockReturnValue({ valid: true });
      mockImageService.uploadProductImage.mockRejectedValue(new Error('Upload failed'));

      mockRequest = {
        params: { productId: '1' },
        body: {
          imageIndex: '0',
          isPrimary: 'false'
        },
        file: mockFile as any
      };

      await imageController.uploadProductImage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to upload image',
        error: 'Upload failed'
      });
    });
  });

  describe('deleteProductImages', () => {
    it('should delete product images successfully', async () => {
      mockImageService.deleteProductImages.mockResolvedValue(true);

      mockRequest = {
        params: { productId: '1' }
      };

      await imageController.deleteProductImages(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully deleted all images for product 1'
      });
    });

    it('should handle validation errors', async () => {
        // Mock validationResult to return errors
        const mockErrors = [{ param: 'productId', msg: 'Product ID must be a positive integer' }];

        // Update the global mock to return validation errors
        const { validationResult } = await import('express-validator');
        (validationResult as any).mockReturnValue({
          isEmpty: vi.fn().mockReturnValue(false),
          array: vi.fn().mockReturnValue(mockErrors)
        });

        mockRequest = {
          params: { productId: 'invalid' }
        };

        await imageController.deleteProductImages(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: mockErrors
        });
      });

    it('should handle service errors', async () => {
      mockImageService.deleteProductImages.mockRejectedValue(new Error('Delete failed'));

      mockRequest = {
        params: { productId: '1' }
      };

      await imageController.deleteProductImages(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete images',
        error: 'Delete failed'
      });
    });

    it('should handle service returning false', async () => {
      mockImageService.deleteProductImages.mockResolvedValue(false);

      mockRequest = {
        params: { productId: '1' }
      };

      await imageController.deleteProductImages(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete product images'
      });
    });
  });

  describe('getProductImages', () => {
    it('should return product images successfully', async () => {
      const mockImages: ProductImage[] = [
        {
          id: 1,
          product_id: 1,
          url: '/images/products/1/thumb-image.jpg',
          alt_text: 'Product image 1',
          size: 'thumb' as ImageSize,
          is_primary: true,
          display_order: 0,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          product_id: 1,
          url: '/images/products/1/small-image.jpg',
          alt_text: 'Product image 2',
          size: 'small' as ImageSize,
          is_primary: false,
          display_order: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockImageService.getProductImages.mockResolvedValue(mockImages);

      mockRequest = {
        params: { productId: '1' }
      };

      await imageController.getProductImages(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          images: mockImages
        },
        message: 'Product images retrieved successfully'
      });
    });

    it('should handle validation errors', async () => {
        // Mock validationResult to return errors
        const mockErrors = [{ param: 'productId', msg: 'Product ID must be a positive integer' }];

        // Update the global mock to return validation errors
        const { validationResult } = await import('express-validator');
        (validationResult as any).mockReturnValue({
          isEmpty: vi.fn().mockReturnValue(false),
          array: vi.fn().mockReturnValue(mockErrors)
        });

        mockRequest = {
          params: { productId: 'invalid' }
        };

        await imageController.getProductImages(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          message: 'Validation errors',
          errors: mockErrors
        });
      });

    it('should handle service errors', async () => {
      mockImageService.getProductImages.mockRejectedValue(new Error('Database error'));

      mockRequest = {
        params: { productId: '1' }
      };

      await imageController.getProductImages(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get product images'
      });
    });
  });

  describe('getImagesGallery', () => {
    it('should return images gallery successfully', async () => {
      const mockGalleryResult = {
        images: [
          {
            id: 1,
            product_id: 1,
            product_name: 'Rosas Rojas',
            size: 'thumb' as ImageSize,
            url: '/images/products/1/thumb-image.jpg',
            file_hash: 'abc123',
            is_primary: true,
            created_at: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          total: 10,
          pages: 1
        }
      };

      mockImageService.getImagesGallery.mockResolvedValue(mockGalleryResult);

      mockRequest = {
        query: {
          filter: 'all',
          page: '1',
          limit: '20'
        }
      };

      await imageController.getImagesGallery(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockGalleryResult,
        message: 'Images gallery retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      mockImageService.getImagesGallery.mockRejectedValue(new Error('Database error'));

      mockRequest = {
        query: {
          filter: 'all',
          page: '1',
          limit: '20'
        }
      };

      await imageController.getImagesGallery(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve images gallery',
        error: 'Database error'
      });
    });
  });

  describe('uploadSiteImage', () => {
    it('should upload site image successfully', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'hero-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size: 1024,
        stream: null,
        destination: '',
        filename: 'hero-image.jpg',
        path: '/tmp/hero-image.jpg'
      } as any;

      const mockUploadResult = {
        success: true,
        url: '/images/site/hero-image.jpg',
        type: 'hero' as const,
        message: 'Site image uploaded successfully'
      };

      mockImageService.validateImageFile.mockReturnValue({ valid: true });
      mockImageService.uploadSiteImage.mockResolvedValue(mockUploadResult);

      mockRequest = {
        body: {
          type: 'hero'
        },
        file: mockFile
      };

      await imageController.uploadSiteImage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          url: mockUploadResult.url,
          type: mockUploadResult.type
        },
        message: 'Successfully uploaded hero image'
      });
    });

    it('should handle validation errors', async () => {
        // Mock validationResult to return errors
        const mockErrors = [{ param: 'type', msg: 'Type must be hero or logo' }];

        // Update the global mock to return validation errors
        const { validationResult } = await import('express-validator');
        (validationResult as any).mockReturnValue({
          isEmpty: vi.fn().mockReturnValue(false),
          array: vi.fn().mockReturnValue(mockErrors)
        });

        mockRequest = {
          body: {
            type: 'invalid-type'
          }
        };

        await imageController.uploadSiteImage(mockRequest as Request, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: mockErrors
        });
      });

    it('should return 400 when no file is provided', async () => {
      mockRequest = {
        body: {
          type: 'hero'
        }
      };

      await imageController.uploadSiteImage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'No image file provided'
      });
    });

    it('should handle invalid image type', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'hero-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size: 1024,
        stream: null,
        destination: '',
        filename: 'hero-image.jpg',
        path: '/tmp/hero-image.jpg'
      } as any;

      mockRequest = {
        body: {
          type: 'invalid'
        },
        file: mockFile
      };

      await imageController.uploadSiteImage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid image type. Must be "hero" or "logo"'
      });
    });

    it('should handle service errors', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'hero-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size: 1024
      } as any;

      mockImageService.validateImageFile.mockReturnValue({ valid: true });
      mockImageService.uploadSiteImage.mockRejectedValue(new Error('Upload failed'));

      mockRequest = {
        body: {
          type: 'hero'
        },
        file: mockFile
      };

      await imageController.uploadSiteImage(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to upload site image',
        error: 'Upload failed'
      });
    });
  });

  describe('getCurrentSiteImages', () => {
    it('should return current site images successfully', () => {
      const mockSiteImages = {
        hero: '/images/site/hero-image.jpg',
        logo: '/images/site/logo-image.png'
      };

      mockImageService.getCurrentSiteImages.mockReturnValue(mockSiteImages);

      imageController.getCurrentSiteImages(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockSiteImages,
        message: 'Current site images retrieved successfully'
      });
    });

    it('should handle service errors', () => {
      mockImageService.getCurrentSiteImages.mockImplementation(() => {
        throw new Error('Service error');
      });

      imageController.getCurrentSiteImages(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve current site images',
        error: 'Service error'
      });
    });
  });

  describe('getProductsWithImageCounts', () => {
    it('should return products with image counts successfully', async () => {
      const mockProductsWithCounts = {
        products: [
          {
            id: 1,
            name: 'Rosas Rojas',
            price_usd: 25.99,
            image_count: 3
          },
          {
            id: 2,
            name: 'Tulipanes Blancos',
            price_usd: 19.99,
            image_count: 2
          }
        ]
      };

      mockImageService.getProductsWithImageCounts.mockResolvedValue(mockProductsWithCounts);

      mockRequest = {
        query: {
          sort_by: 'image_count',
          sort_direction: 'asc'
        }
      };

      await imageController.getProductsWithImageCounts(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockProductsWithCounts,
        message: 'Products with image counts retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      mockImageService.getProductsWithImageCounts.mockRejectedValue(new Error('Database error'));

      mockRequest = {
        query: {
          sort_by: 'name',
          sort_direction: 'desc'
        }
      };

      await imageController.getProductsWithImageCounts(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve products with image counts',
        error: 'Database error'
      });
    });
  });
});