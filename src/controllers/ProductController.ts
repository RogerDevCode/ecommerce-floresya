/**
 * 🌸 FloresYa Product Controller - API REST Enterprise Edition
 * Implements new carousel_order logic with zero technical debt
 */

import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ProductService } from '../services/ProductService.js';
import { type ProductCreateRequest, ProductQuery, ProductUpdateRequest, supabaseService } from '../config/supabase.js';

const productService = new ProductService();

export class ProductController {
  /**
   * @swagger
   * /api/products/carousel:
   *   get:
   *     summary: Get carousel products
   *     description: Retrieves products configured for the homepage carousel, ordered by carousel_order
   *     tags: [Products]
   *     responses:
   *       200:
   *         description: Carousel products retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     products:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Product'
   *                     count:
   *                       type: integer
   *                       description: Number of carousel products
   *                 message:
   *                   type: string
   *                   example: "Carousel products retrieved successfully"
   *       500:
   *         description: Server error
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
   * @swagger
   * /api/products:
   *   get:
   *     summary: Get products with filtering and pagination
   *     description: Retrieves a paginated list of products with optional filtering by search, occasion, featured status, and sorting
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of products per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *           minLength: 2
   *           maxLength: 100
   *         description: Search term for product name or description
   *       - in: query
   *         name: occasion
   *         schema:
   *           type: string
   *         description: Occasion slug to filter products
   *       - in: query
   *         name: featured
   *         schema:
   *           type: boolean
   *         description: Filter by featured products only
   *       - in: query
   *         name: has_carousel_order
   *         schema:
   *           type: boolean
   *         description: Filter by products with carousel ordering
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           enum: [name:asc, name:desc, price:asc, price:desc, created_at:asc, created_at:desc, carousel_order:asc, carousel_order:desc]
   *           default: created_at:desc
   *         description: Sort field and direction (format field-direction)
   *     responses:
   *       200:
   *         description: Products retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     products:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Product'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                         limit:
   *                           type: integer
   *                         total:
   *                           type: integer
   *                         totalPages:
   *                           type: integer
   *                 message:
   *                   type: string
   *                   example: "Products retrieved successfully"
   *       400:
   *         description: Invalid query parameters
   *       500:
   *         description: Server error
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

      // Parse sort parameter (frontend sends "price:ASC" format)
      let sort_by: 'name' | 'price_usd' | 'created_at' | 'carousel_order' = 'created_at';
      let sort_direction: 'asc' | 'desc' = 'desc';

      if (req.query.sort && typeof req.query.sort === 'string') {
        const [sortField, sortDir] = req.query.sort.split(':');
        if (sortField && sortDir) {
          // Map frontend sort fields to backend fields
          const fieldMap: { [key: string]: 'name' | 'price_usd' | 'created_at' | 'carousel_order' } = {
            'name': 'name',
            'price': 'price_usd',
            'created_at': 'created_at',
            'carousel_order': 'carousel_order'
          };

          sort_by = fieldMap[sortField] ?? 'created_at';
          sort_direction = sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc';
        }
      }

      const query: ProductQuery = {
        page: parseInt(req.query.page as string) ?? 1,
        limit: Math.min(parseInt(req.query.limit as string) ?? 20, 100), // Max 100 items
        search: req.query.search as string ?? undefined,
        occasion: req.query.occasion as string ?? undefined, // Support slug-based filtering
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        has_carousel_order: req.query.has_carousel_order === 'true' ? true : req.query.has_carousel_order === 'false' ? false : undefined,
        sort_by,
        sort_direction
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
   * @swagger
   * /api/products/featured:
   *   get:
   *     summary: Get featured products
   *     description: Retrieves a list of featured products for display on the homepage
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 20
   *           default: 8
   *         description: Maximum number of featured products to return
   *     responses:
   *       200:
   *         description: Featured products retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     products:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Product'
   *                     count:
   *                       type: integer
   *                       description: Number of featured products returned
   *                 message:
   *                   type: string
   *                   example: "Featured products retrieved successfully"
   *       500:
   *         description: Server error
   */
  public async getFeatured(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) ?? 8, 20);
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
   * @swagger
   * /api/products/{id}:
   *   get:
   *     summary: Get product by ID
   *     description: Retrieves a single product by its unique identifier
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Product ID
   *     responses:
   *       200:
   *         description: Product retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     product:
   *                       $ref: '#/components/schemas/Product'
   *                 message:
   *                   type: string
   *                   example: "Product retrieved successfully"
   *       400:
   *         description: Invalid product ID
   *       404:
   *         description: Product not found
   *       500:
   *         description: Server error
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

      const productId = parseInt(req.params.id);
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
   * GET /api/products/:id/with-occasions
   * Get single product by ID with occasion associations for editing
   */
  public async getProductByIdWithOccasions(req: Request, res: Response): Promise<void> {
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

      const productId = parseInt(req.params.id);
      const product = await productService.getProductByIdWithOccasions(productId);

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
        message: 'Product with occasions retrieved successfully'
      });
    } catch (error) {
      console.error('ProductController.getProductByIdWithOccasions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product with occasions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/products/search:
   *   get:
   *     summary: Search products
   *     description: Performs a full-text search across product names and descriptions
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *           minLength: 2
   *           maxLength: 100
   *         description: Search query string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 20
   *         description: Maximum number of search results
   *     responses:
   *       200:
   *         description: Search completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     products:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Product'
   *                     count:
   *                       type: integer
   *                       description: Number of products found
   *                 message:
   *                   type: string
   *                   example: "Search completed successfully"
   *       400:
   *         description: Invalid search parameters
   *       500:
   *         description: Server error
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
      const limit = Math.min(parseInt(req.query.limit as string) ?? 20, 50);

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
   * @swagger
   * /api/products:
   *   post:
   *     summary: Create new product
   *     description: Creates a new product in the catalog (Admin only)
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - description
   *               - price_usd
   *               - stock
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 200
   *                 description: Product name
   *               description:
   *                 type: string
   *                 minLength: 10
   *                 maxLength: 2000
   *                 description: Detailed product description
   *               summary:
   *                 type: string
   *                 maxLength: 500
   *                 description: Short product summary
   *               price_usd:
   *                 type: number
   *                 minimum: 0.01
   *                 maximum: 999999.99
   *                 description: Product price in USD
   *               price_ves:
   *                 type: number
   *                 description: Product price in VES (optional)
   *               stock:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 999999
   *                 description: Available stock quantity
   *               sku:
   *                 type: string
   *                 maxLength: 100
   *                 description: Stock Keeping Unit
   *               active:
   *                 type: boolean
   *                 default: true
   *                 description: Whether product is active
   *               featured:
   *                 type: boolean
   *                 default: false
   *                 description: Whether product is featured
   *               carousel_order:
   *                 type: integer
   *                 minimum: 1
   *                 description: Display order in carousel
   *               occasion_id:
   *                 type: integer
   *                 minimum: 1
   *                 description: Associated occasion ID
   *               category:
   *                 type: string
   *                 maxLength: 100
   *                 description: Product category
   *               care_instructions:
   *                 type: string
   *                 description: Care and maintenance instructions
   *     responses:
   *       201:
   *         description: Product created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     product:
   *                       $ref: '#/components/schemas/Product'
   *                 message:
   *                   type: string
   *                   example: "Product created successfully"
   *       400:
   *         description: Validation failed
   *       401:
   *         description: Unauthorized - Admin access required
   *       500:
   *         description: Server error
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
   * @swagger
   * /api/products/{id}:
   *   put:
   *     summary: Update product
   *     description: Updates an existing product by ID (Admin only)
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Product ID to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 200
   *                 description: Product name
   *               description:
   *                 type: string
   *                 minLength: 10
   *                 maxLength: 2000
   *                 description: Detailed product description
   *               summary:
   *                 type: string
   *                 maxLength: 500
   *                 description: Short product summary
   *               price_usd:
   *                 type: number
   *                 minimum: 0.01
   *                 maximum: 999999.99
   *                 description: Product price in USD
   *               price_ves:
   *                 type: number
   *                 description: Product price in VES
   *               stock:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 999999
   *                 description: Available stock quantity
   *               sku:
   *                 type: string
   *                 maxLength: 100
   *                 description: Stock Keeping Unit
   *               active:
   *                 type: boolean
   *                 description: Whether product is active
   *               featured:
   *                 type: boolean
   *                 description: Whether product is featured
   *               carousel_order:
   *                 type: integer
   *                 minimum: 1
   *                 description: Display order in carousel
   *               occasion_id:
   *                 type: integer
   *                 minimum: 1
   *                 description: Associated occasion ID
   *               category:
   *                 type: string
   *                 maxLength: 100
   *                 description: Product category
   *               care_instructions:
   *                 type: string
   *                 description: Care and maintenance instructions
   *     responses:
   *       200:
   *         description: Product updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     product:
   *                       $ref: '#/components/schemas/Product'
   *                 message:
   *                   type: string
   *                   example: "Product updated successfully"
   *       400:
   *         description: Validation failed or no update data provided
   *       401:
   *         description: Unauthorized - Admin access required
   *       404:
   *         description: Product not found
   *       500:
   *         description: Server error
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

      const productId = parseInt(req.params.id);
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

      const productId = parseInt(req.params.id);
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

  /**
   * @swagger
   * /api/products/{id}:
   *   delete:
   *     summary: Delete product (conditional)
   *     description: |
   *       Deletes a product with conditional logic:
   *       - If product has references in other tables: performs logical deletion (active = false)
   *       - If product has no references: performs physical deletion with user confirmation
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Product ID to delete
   *     responses:
   *       200:
   *         description: Product logically deleted (deactivated)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     product:
   *                       $ref: '#/components/schemas/Product'
   *                     deletion_type:
   *                       type: string
   *                       enum: [logical, physical]
   *                       example: logical
   *                     has_references:
   *                       type: boolean
   *                       example: true
   *                 message:
   *                   type: string
   *                   example: "Product deactivated successfully (has order references)"
   *       204:
   *         description: Product physically deleted (no content returned)
   *       404:
   *         description: Product not found
   *       500:
   *         description: Server error
   */
  public async deleteProduct(req: Request, res: Response): Promise<void> {
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

      const productId = parseInt(req.params.id);

      // Get current product data
      const product = await productService.getProductById(productId);
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      // Check if product has references in related tables
      const hasReferences = await this.checkProductReferences(productId);

      if (hasReferences) {
        // Logical deletion - just deactivate
        const updatedProduct = await productService.updateProduct({
          id: productId,
          active: false
        });

        res.status(200).json({
          success: true,
          data: {
            product: updatedProduct,
            deletion_type: 'logical',
            has_references: true
          },
          message: 'Product deactivated successfully (has references in other tables)'
        });
      } else {
        // Physical deletion - no references, safe to delete
        await productService.deleteProduct(productId);

        // Return 204 No Content for successful physical deletion
        res.status(204).send();
      }
    } catch (error) {
      console.error('ProductController.deleteProduct error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check if product has references in related tables
   */
  private async checkProductReferences(productId: number): Promise<boolean> {
    try {
      // Check product_images table
      const { data: images, error: imagesError } = await supabaseService
        .from('product_images')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

      if (imagesError) {
        throw new Error(`Failed to check product images: ${imagesError.message}`);
      }

      if (images && images.length > 0) {
        return true;
      }

      // Check product_occasions table
      const { data: occasions, error: occasionsError } = await supabaseService
        .from('product_occasions')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

      if (occasionsError) {
        throw new Error(`Failed to check product occasions: ${occasionsError.message}`);
      }

      if (occasions && occasions.length > 0) {
        return true;
      }

      // Check order_items table (if orders exist)
      const { data: orderItems, error: orderItemsError } = await supabaseService
        .from('order_items')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

      if (orderItemsError) {
        // If order_items table doesn't exist yet, continue
        console.warn('Order items table may not exist yet:', orderItemsError.message);
      } else if (orderItems && orderItems.length > 0) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking product references:', error);
      throw error;
    }
  }
}

// Validation middleware
export const productValidators = {
  getProducts: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('featured').optional().isIn(['true', 'false']).withMessage('featured must be true or false'),
    query('has_carousel_order').optional().isIn(['true', 'false']).withMessage('has_carousel_order must be true or false'),
    query('sort_by').optional().isIn(['name', 'price_usd', 'created_at', 'carousel_order']).withMessage('Invalid sort field'),
    query('sort_direction').optional().isIn(['asc', 'desc']).withMessage('Sort direction must be asc or desc')
  ],

  getProductById: [
    param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
  ],

  getProductByIdWithOccasions: [
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
      const price = parseFloat(value);
      if (price <= 0) {
        throw new Error('Price must be a positive number');
      }
      if (price > 999999.99) {
        throw new Error('Price cannot exceed $999,999.99');
      }
      return true;
    }),
    body('price_ves').optional().isDecimal().withMessage('price_ves must be a decimal'),
    body('stock').isInt({ min: 0, max: 999999 }).withMessage('Stock must be between 0 and 999,999'),
    body('sku').optional().isLength({ max: 100 }).withMessage('SKU must not exceed 100 characters'),
    body('active').optional().isBoolean().withMessage('active must be boolean'),
    body('featured').optional().isBoolean().withMessage('featured must be boolean'),
    body('carousel_order').optional().isInt({ min: 1 }).withMessage('Carousel order must be a positive integer')
  ],

  updateProduct: [
    param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    body('name').optional().isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
    body('description').optional().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
    body('summary').optional().isLength({ max: 500 }).withMessage('Summary must not exceed 500 characters'),
    body('price_usd').optional().isDecimal().withMessage('price_usd must be a decimal string').custom((value) => {
      const price = parseFloat(value);
      if (price <= 0) {
        throw new Error('Price must be a positive number');
      }
      if (price > 999999.99) {
        throw new Error('Price cannot exceed $999,999.99');
      }
      return true;
    }),
    body('price_ves').optional().isDecimal().withMessage('price_ves must be a decimal'),
    body('stock').optional().isInt({ min: 0, max: 999999 }).withMessage('Stock must be between 0 and 999,999'),
    body('sku').optional().isLength({ max: 100 }).withMessage('SKU must not exceed 100 characters'),
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
  ],

  deleteProduct: [
    param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
  ]
};