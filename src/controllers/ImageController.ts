/**
 * 🌸 FloresYa Image Controller - API REST for Image Upload
 * Handles image upload, processing, and storage endpoints
 */

import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ImageService } from '../services/ImageService.js';
import multer from 'multer';

const imageService = new ImageService();

// Configuración de Multer para memoria (no archivos temporales)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1 // Solo 1 archivo por request
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

export class ImageController {
  /**
   * @swagger
   * /api/images/upload/{productId}:
   *   post:
   *     summary: Upload and process product images
   *     description: Uploads an image file, processes it into multiple sizes, and saves it to the database
   *     tags: [Images]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID of the product to upload image for
   *       - in: formData
   *         name: image
   *         required: true
   *         type: file
   *         description: Image file to upload (JPEG, PNG, or WebP)
   *       - in: formData
   *         name: imageIndex
   *         type: integer
   *         minimum: 0
   *         description: Index position of the image
   *       - in: formData
   *         name: isPrimary
   *         type: boolean
   *         description: Whether this should be the primary image
   *     responses:
   *       201:
   *         description: Image uploaded successfully
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
   *                     images:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           size:
   *                             type: string
   *                             enum: [thumb, small, medium, large]
   *                           url:
   *                             type: string
   *                           fileHash:
   *                             type: string
   *                     primaryImage:
   *                       $ref: '#/components/schemas/ProductImage'
   *       400:
   *         description: Validation error or invalid file
   *       500:
   *         description: Server error during upload
   */
  public async uploadProductImage(req: Request, res: Response): Promise<void> {
    try {
      // Validar parámetros de la request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      // Verificar que se recibió un archivo
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
        return;
      }

      const productId = parseInt(req.params.productId);
      const imageIndex = parseInt(req.body.imageIndex ?? '0');
      const isPrimary = req.body.isPrimary === 'true';

      // Validar el archivo de imagen
      const validation = imageService.validateImageFile(req.file);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.error ?? 'Invalid image file'
        });
        return;
      }

      // Procesar y subir la imagen
      const result = await imageService.uploadProductImage({
        productId,
        imageIndex,
        file: req.file,
        isPrimary
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            images: result.images,
            primaryImage: result.primaryImage
          },
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('ImageController.uploadProductImage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/images/product/{productId}:
   *   delete:
   *     summary: Delete all images for a product
   *     description: Removes all image files and database records for a specific product
   *     tags: [Images]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID of the product to delete images for
   *     responses:
   *       200:
   *         description: Images deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Successfully deleted all images for product 123"
   *       400:
   *         description: Validation error
   *       500:
   *         description: Server error during deletion
   */
  public async deleteProductImages(req: Request, res: Response): Promise<void> {
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

      const productId = parseInt(req.params.productId);

      const success = await imageService.deleteProductImages(productId);

      if (success) {
        res.status(200).json({
          success: true,
          message: `Successfully deleted all images for product ${productId}`
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete product images'
        });
      }
    } catch (error) {
      console.error('ImageController.deleteProductImages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete images',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/products/{productId}/images:
   *   get:
   *     summary: Get images for a specific product
   *     description: Retrieves all images associated with a specific product
   *     tags: [Images]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: ID of the product to get images for
   *     responses:
   *       200:
   *         description: Product images retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 images:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       product_id:
   *                         type: integer
   *                       url:
   *                         type: string
   *                       is_primary:
   *                         type: boolean
   *                       display_order:
   *                         type: integer
   *                       created_at:
   *                         type: string
   *       404:
   *         description: Product not found
   *       500:
   *         description: Internal server error
   */
  public async getProductImages(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const productId = parseInt(req.params.productId ?? '0');

      const images = await imageService.getProductImages(productId);

      res.status(200).json({
        success: true,
        data: {
          images: images
        },
        message: 'Product images retrieved successfully'
      });

    } catch (error) {
      console.error('ImageController.getProductImages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product images'
      });
    }
  }

  /**
   * @swagger
   * /api/images/gallery:
   *   get:
   *     summary: Get all product images for gallery
   *     description: Retrieves all product images with their metadata for the admin gallery
   *     tags: [Images]
   *     parameters:
   *       - in: query
   *         name: filter
   *         schema:
   *           type: string
   *           enum: [all, used, unused]
   *         description: Filter images by usage status
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Number of images per page
   *     responses:
   *       200:
   *         description: Images retrieved successfully
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
   *                     images:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           product_id:
   *                             type: integer
   *                           product_name:
   *                             type: string
   *                           size:
   *                             type: string
   *                           url:
   *                             type: string
   *                           file_hash:
   *                             type: string
   *                           is_primary:
   *                             type: boolean
   *                           created_at:
   *                             type: string
   *                             format: date-time
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                         total:
   *                           type: integer
   *                         pages:
   *                           type: integer
   *       500:
   *         description: Server error
   */
  public async getImagesGallery(req: Request, res: Response): Promise<void> {
    try {
      const filter = req.query.filter as 'all' | 'used' | 'unused' ?? 'all';
      const page = parseInt(req.query.page as string) ?? 1;
      const limit = Math.min(parseInt(req.query.limit as string) ?? 20, 100);

      const result = await imageService.getImagesGallery(filter, page, limit);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Images gallery retrieved successfully'
      });
    } catch (error) {
      console.error('ImageController.getImagesGallery error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve images gallery',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/images/site:
   *   post:
   *     summary: Upload site images (hero, logo)
   *     description: Uploads and updates site-wide images like hero banner or logo
   *     tags: [Images]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: Image file to upload
   *               type:
   *                 type: string
   *                 enum: [hero, logo]
   *                 description: Type of site image
   *     responses:
   *       201:
   *         description: Site image uploaded successfully
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
   *                     url:
   *                       type: string
   *                     type:
   *                       type: string
   *       400:
   *         description: Validation error or invalid file
   *       500:
   *         description: Server error during upload
   */
  public async uploadSiteImage(req: Request, res: Response): Promise<void> {
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

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
        return;
      }

      const type = req.body.type as 'hero' | 'logo';
      if (!['hero', 'logo'].includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Invalid image type. Must be "hero" or "logo"'
        });
        return;
      }

      const validation = imageService.validateImageFile(req.file);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.error ?? 'Invalid image file'
        });
        return;
      }

      const result = await imageService.uploadSiteImage(req.file, type);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            url: result.url,
            type: result.type
          },
          message: `Successfully uploaded ${type} image`
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('ImageController.uploadSiteImage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload site image',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
    * @swagger
    * /api/images/site/current:
    *   get:
    *     summary: Get current site images
    *     description: Retrieves the current hero and logo images for the site
    *     tags: [Images]
    *     responses:
    *       200:
    *         description: Site images retrieved successfully
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
    *                     hero:
    *                       type: string
    *                       description: URL of the hero image
    *                     logo:
    *                       type: string
    *                       description: URL of the logo image
    *       500:
    *         description: Server error
    */
  public getCurrentSiteImages(req: Request, res: Response): void {
    try {
      const result = imageService.getCurrentSiteImages();

      res.status(200).json({
        success: true,
        data: result,
        message: 'Current site images retrieved successfully'
      });
    } catch (error) {
      console.error('ImageController.getCurrentSiteImages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve current site images',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
    * @swagger
    * /api/images/products-with-counts:
    *   get:
    *     summary: Get products with image counts
    *     description: Retrieves all products with their associated image counts for admin management
    *     tags: [Images]
    *     parameters:
    *       - in: query
    *         name: sort_by
    *         schema:
    *           type: string
    *           enum: [name, image_count]
    *         description: Sort by name or image count
    *       - in: query
    *         name: sort_direction
    *         schema:
    *           type: string
    *           enum: [asc, desc]
    *         description: Sort direction
    *     responses:
    *       200:
    *         description: Products with image counts retrieved successfully
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
    *                         type: object
    *                         properties:
    *                           id:
    *                             type: integer
    *                           name:
    *                             type: string
    *                           price_usd:
    *                             type: number
    *                           image_count:
    *                             type: integer
    *       500:
    *         description: Server error
    */
  public async getProductsWithImageCounts(req: Request, res: Response): Promise<void> {
    try {
      const sortBy = req.query.sort_by as 'name' | 'image_count' ?? 'image_count';
      const sortDirection = req.query.sort_direction as 'asc' | 'desc' ?? 'asc';

      const result = await imageService.getProductsWithImageCounts(sortBy, sortDirection);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Products with image counts retrieved successfully'
      });
    } catch (error) {
      console.error('ImageController.getProductsWithImageCounts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve products with image counts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }


}

// Middleware para subir archivos
export const imageUpload = upload.single('image');

// Validation middleware
export const imageValidators = {
  uploadProductImage: [
    param('productId').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    body('imageIndex').optional().isInt({ min: 0 }).withMessage('Image index must be a non-negative integer'),
    body('isPrimary').optional().isIn(['true', 'false']).withMessage('isPrimary must be true or false')
  ],

  deleteProductImages: [
    param('productId').isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
  ],

  getProductImages: [
    param('productId').isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
  ],

  getImagesGallery: [
    query('filter').optional().isIn(['all', 'used', 'unused']).withMessage('Filter must be all, used, or unused'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],

  uploadSiteImage: [
    body('type').isIn(['hero', 'logo']).withMessage('Type must be hero or logo')
  ]
};