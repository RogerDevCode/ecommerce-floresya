/**
 * 🌸 FloresYa Image Routes - API REST for Image Management
 * Routes for image upload, processing, and management
 */

import { Router } from 'express';

import { ImageController, imageUpload } from '../../controllers/ImageController.js';

export function createImageRoutes(): Router {
  const router = Router();
  const imageController = new ImageController();

  // POST /api/images/upload/:productId - Upload and process product images
  router.post('/upload/:productId',
    imageUpload,
    imageController.uploadProductImage.bind(imageController)
  );

  // GET /api/images/product/:productId - Get images for a specific product
  router.get('/product/:productId',
    imageController.getProductImages.bind(imageController)
  );

  // DELETE /api/images/product/:productId - Delete all images for a product
  router.delete('/product/:productId',
    imageController.deleteProductImages.bind(imageController)
  );

  // GET /api/images/gallery - Get all product images for gallery
  router.get('/gallery',
    imageController.getImagesGallery.bind(imageController)
  );

  // POST /api/images/site - Upload site images (hero, logo)
  router.post('/site',
    imageUpload,
    imageController.uploadSiteImage.bind(imageController)
  );

  // GET /api/images/site/current - Get current site images
  router.get('/site/current',
    imageController.getCurrentSiteImages.bind(imageController)
  );

  // GET /api/images/products-with-counts - Get products with image counts
  router.get('/products-with-counts',
    imageController.getProductsWithImageCounts.bind(imageController)
  );

  return router;
}