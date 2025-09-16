/**
 * 🌸 FloresYa Image Routes - API REST for Image Management
 * Routes for image upload, processing, and management
 */

import { Router } from 'express';
import { ImageController, imageValidators, imageUpload } from '../../controllers/ImageController.js';

export function createImageRoutes(): Router {
  const router = Router();
  const imageController = new ImageController();

  // POST /api/images/upload/:productId - Upload and process product images
  router.post('/upload/:productId',
    imageValidators.uploadProductImage,
    imageUpload,
    imageController.uploadProductImage.bind(imageController)
  );

  // DELETE /api/images/product/:productId - Delete all images for a product
  router.delete('/product/:productId',
    imageValidators.deleteProductImages,
    imageController.deleteProductImages.bind(imageController)
  );

  return router;
}