/**
 * 🌸 FloresYa Product Routes - TypeScript Enterprise Edition
 * RESTful API routes with comprehensive validation
 */

import { Router } from 'express';
import { ProductController, productValidators } from '../../controllers/ProductController.js';

export function createProductRoutes(): Router {
  const router = Router();
  const productController = new ProductController();

  // GET /api/products/carousel - Get carousel products (NEW carousel_order logic)
  router.get('/carousel', productController.getCarousel.bind(productController));

  // GET /api/products/featured - Get featured products
  router.get('/featured', productController.getFeatured.bind(productController));

  // GET /api/products/search - Search products
  router.get('/search', 
    productValidators.searchProducts,
    productController.searchProducts.bind(productController)
  );

  // GET /api/products/:id - Get single product
  router.get('/:id',
    productValidators.getProductById,
    productController.getProductById.bind(productController)
  );

  // GET /api/products - Get all products with filtering
  router.get('/',
    productValidators.getProducts,
    productController.getProducts.bind(productController)
  );

  // POST /api/products - Create new product (admin only)
  router.post('/',
    productValidators.createProduct,
    productController.createProduct.bind(productController)
  );

  // PUT /api/products/:id - Update product (admin only)
  router.put('/:id',
    productValidators.updateProduct,
    productController.updateProduct.bind(productController)
  );

  // PATCH /api/products/:id/carousel - Update carousel order (admin only)
  router.patch('/:id/carousel',
    productValidators.updateCarouselOrder,
    productController.updateCarouselOrder.bind(productController)
  );

  return router;
}