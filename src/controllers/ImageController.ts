/**
 * 🌸 FloresYa Image Controller - API REST for Image Upload
 * Handles image upload, processing, and storage endpoints
 */

import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
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

      const productId = parseInt(req.params.productId as string);
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

      const productId = parseInt(req.params.productId as string);

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
  ]
};