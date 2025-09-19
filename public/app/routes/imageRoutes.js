import { Router } from 'express';
import { ImageController, imageValidators, imageUpload } from '../../controllers/ImageController.js';
export function createImageRoutes() {
    const router = Router();
    const imageController = new ImageController();
    router.post('/upload/:productId', imageValidators.uploadProductImage, imageUpload, imageController.uploadProductImage.bind(imageController));
    router.delete('/product/:productId', imageValidators.deleteProductImages, imageController.deleteProductImages.bind(imageController));
    router.get('/gallery', imageValidators.getImagesGallery, imageController.getImagesGallery.bind(imageController));
    router.post('/site', imageValidators.uploadSiteImage, imageUpload, imageController.uploadSiteImage.bind(imageController));
    router.get('/site/current', imageController.getCurrentSiteImages.bind(imageController));
    router.get('/products-with-counts', imageController.getProductsWithImageCounts.bind(imageController));
    return router;
}
