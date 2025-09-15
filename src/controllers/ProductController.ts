/**
 * 🌸 FloresYa Product Controller - API REST Enterprise Edition
 * Implements new carousel_order logic with zero technical debt
 */

import { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { ProductService } from '../services/ProductService.js';
import type { ProductQuery, ProductCreateRequest, ProductUpdateRequest } from '../config/supabase.js';

const productService = new ProductService();

export class ProductController {
  /**
   * GET /api/products/carousel
   * Fetch carousel products using carousel_order optimization
   */
  public async getCarousel(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.getCarouselProducts();

      res.status(200).json({
        success: true,
        data: result,
        message: 'Carousel products retrieved successfully'
      });
    } catch (error) {
      console.error('ProductController.getCarousel error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch carousel products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/products
   * Get all products with filtering and pagination
   */
  public async getProducts(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: errors.array()
        });
        return;
      }

      const query: ProductQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 20, 100), // Max 100 items
        search: req.query.search as string || undefined,
        occasion_id: req.query.occasion_id ? parseInt(req.query.occasion_id as string) : undefined,
        category: req.query.category as string || undefined,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        has_carousel_order: req.query.has_carousel_order === 'true' ? true : req.query.has_carousel_order === 'false' ? false : undefined,
        sort_by: (req.query.sort_by as 'name' | 'price_usd' | 'created_at' | 'carousel_order') || 'created_at',
        sort_direction: (req.query.sort_direction as 'asc' | 'desc') || 'desc'
      };

      const result = await productService.getProducts(query);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Products retrieved successfully'
      });
    } catch (error) {
      console.error('ProductController.getProducts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/products/featured
   * Get featured products
   */
  public async getFeatured(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 8, 20);
      const products = await productService.getFeaturedProducts(limit);

      res.status(200).json({
        success: true,
        data: { products, count: products.length },
        message: 'Featured products retrieved successfully'
      });
    } catch (error) {
      console.error('ProductController.getFeatured error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured products',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/products/:id
   * Get single product by ID
   */
  public async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Invalid product ID',
          errors: errors.array()
        });
        return;
      }

      const productId = parseInt(req.params.id as string);
      const product = await productService.getProductById(productId);

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { product },
        message: 'Product retrieved successfully'
      });
    } catch (error) {
      console.error('ProductController.getProductById error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/products/search
   * Search products
   */
  public async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Invalid search parameters',
          errors: errors.array()
        });
        return;
      }

      const searchTerm = req.query.q as string;

      if (!searchTerm) {
        res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
        return;
      }
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      const products = await productService.searchProducts(searchTerm, limit);

      res.status(200).json({
        success: true,
        data: { products, count: products.length },
        message: 'Search completed successfully'
      });
    } catch (error) {
      console.error('ProductController.searchProducts error:', error);
      res.status(500).json({
        success: false,
        message: 'Search failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/products
   * Create new product (admin only)
   */
  public async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const productData: ProductCreateRequest = req.body;
      const product = await productService.createProduct(productData);

      res.status(201).json({
        success: true,
        data: { product },
        message: 'Product created successfully'
      });
    } catch (error) {
      console.error('ProductController.createProduct error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /api/products/:id
   * Update product (admin only)
   */
  public async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const productId = parseInt(req.params.id as string);
      const updateData: ProductUpdateRequest = { ...req.body, id: productId };

      if (Object.keys(req.body).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No update data provided'
        });
        return;
      }

      const product = await productService.updateProduct(updateData);

      res.status(200).json({
        success: true,
        data: { product },
        message: 'Product updated successfully'
      });
    } catch (error) {
      console.error('ProductController.updateProduct error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PATCH /api/products/:id/carousel
   * Update product carousel position (admin only)
   */
  public async updateCarouselOrder(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const productId = parseInt(req.params.id as string);
      const { carousel_order } = req.body;

      if (carousel_order !== null && (!Number.isInteger(carousel_order) || carousel_order < 1)) {
        res.status(400).json({
          success: false,
          message: 'carousel_order must be null or a positive integer'
        });
        return;
      }

      const product = await productService.updateCarouselOrder(productId, carousel_order);

      res.status(200).json({
        success: true,
        data: { product },
        message: 'Carousel order updated successfully'
      });
    } catch (error) {
      console.error('ProductController.updateCarouselOrder error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update carousel order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Validation middleware
export const productValidators = {
  getProducts: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('occasion_id').optional().isInt({ min: 1 }).withMessage('Occasion ID must be a positive integer'),
    query('featured').optional().isIn(['true', 'false']).withMessage('featured must be true or false'),
    query('has_carousel_order').optional().isIn(['true', 'false']).withMessage('has_carousel_order must be true or false'),
    query('sort_by').optional().isIn(['name', 'price_usd', 'created_at', 'carousel_order']).withMessage('Invalid sort field'),
    query('sort_direction').optional().isIn(['asc', 'desc']).withMessage('Sort direction must be asc or desc')
  ],

  getProductById: [
    param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
  ],

  searchProducts: [
    query('q').notEmpty().isLength({ min: 2, max: 100 }).withMessage('Search query must be 2-100 characters'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],

  createProduct: [
    body('name').notEmpty().isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
    body('description').notEmpty().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
    body('summary').optional().isLength({ max: 500 }).withMessage('Summary must not exceed 500 characters'),
    body('price_usd').notEmpty().isDecimal().withMessage('price_usd must be a decimal string').custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Price must be a positive number');
      }
      return true;
    }),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be non-negative'),
    body('featured').optional().isBoolean().withMessage('featured must be boolean'),
    body('carousel_order').optional().isInt({ min: 1 }).withMessage('Carousel order must be a positive integer'),
    body('occasion_id').optional().isInt({ min: 1 }).withMessage('Occasion ID must be a positive integer'),
    body('category').optional().isLength({ max: 100 }).withMessage('Category must not exceed 100 characters')
  ],

  updateProduct: [
    param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    body('name').optional().isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
    body('description').optional().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
    body('summary').optional().isLength({ max: 500 }).withMessage('Summary must not exceed 500 characters'),
    body('price_usd').optional().isDecimal().withMessage('price_usd must be a decimal string').custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Price must be a positive number');
      }
      return true;
    }),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
    body('active').optional().isBoolean().withMessage('active must be boolean'),
    body('featured').optional().isBoolean().withMessage('featured must be boolean'),
    body('carousel_order').optional().custom((value) => {
      if (value === null || (Number.isInteger(value) && value > 0)) {
        return true;
      }
      throw new Error('Carousel order must be null or positive integer');
    })
  ],

  updateCarouselOrder: [
    param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    body('carousel_order').custom((value) => {
      if (value === null || (Number.isInteger(value) && value > 0)) {
        return true;
      }
      throw new Error('Carousel order must be null or positive integer');
    })
  ]
};