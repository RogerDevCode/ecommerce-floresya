import { Router } from 'express';
import { ProductController, productValidators } from '../../controllers/ProductController.js';
export function createProductRoutes() {
    const router = Router();
    const productController = new ProductController();
    router.get('/carousel', productController.getCarousel.bind(productController));
    router.get('/featured', productController.getFeatured.bind(productController));
    router.get('/search', productValidators.searchProducts, productController.searchProducts.bind(productController));
    router.get('/:id/with-occasions', productValidators.getProductById, productController.getProductByIdWithOccasions.bind(productController));
    router.get('/:id', productValidators.getProductById, productController.getProductById.bind(productController));
    router.get('/', productValidators.getProducts, productController.getProducts.bind(productController));
    router.post('/', productValidators.createProduct, productController.createProduct.bind(productController));
    router.put('/:id', productValidators.updateProduct, productController.updateProduct.bind(productController));
    router.patch('/:id/carousel', productValidators.updateCarouselOrder, productController.updateCarouselOrder.bind(productController));
    router.delete('/:id', productValidators.deleteProduct, productController.deleteProduct.bind(productController));
    return router;
}
