/**
 * 🌸 FloresYa Product Routes - TypeScript Enterprise Edition
 * RESTful API routes with comprehensive validation
 */

import { Router } from 'express';

import { ImageController } from '../../controllers/ImageController.js';
import { ProductController } from '../../controllers/ProductController.js';

export function createProductRoutes(): Router {
  const router = Router();
  const productController = new ProductController();
  const imageController = new ImageController();

  // GET /api/products/carousel - Get carousel products (NEW carousel_order logic)
  router.get('/carousel', productController.getCarousel.bind(productController));

  // GET /api/products/featured - Get featured products
  router.get('/featured', productController.getFeatured.bind(productController));

  // GET /api/products/search - Search products
  router.get('/search',
    productController.searchProducts.bind(productController)
  );

  // GET /api/products/:id/images - Get product images
  router.get('/:productId/images',
    imageController.getProductImages.bind(imageController)
  );

  // GET /api/products/:id/with-occasions - Get single product with occasions for editing
  router.get('/:id/with-occasions',
    productController.getProductByIdWithOccasions.bind(productController)
  );

  // GET /api/products/:id - Get single product
  router.get('/:id',
    productController.getProductById.bind(productController)
  );

  // GET /api/products - Get all products with filtering
  router.get('/',
    productController.getProducts.bind(productController)
  );

  // POST /api/products - Create new product (admin only)
  router.post('/',
    productController.createProduct.bind(productController)
  );

  // PUT /api/products/:id - Update product (admin only)
  router.put('/:id',
    productController.updateProduct.bind(productController)
  );

  // PATCH /api/products/:id/carousel - Update carousel order (admin only)
  router.patch('/:id/carousel',
    productController.updateCarouselOrder.bind(productController)
  );

  // DELETE /api/products/:id - Delete product (conditional)
  router.delete('/:id',
    productController.deleteProduct.bind(productController)
  );

  return router;
}