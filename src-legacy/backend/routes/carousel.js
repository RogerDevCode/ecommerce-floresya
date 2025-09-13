import express from 'express';
import { authenticateToken, requireRole } from '../middleware/bked_auth_middleware.js';
import {
    getAllCarouselImages,
    getAllCarouselImagesAdmin,
    getCarouselImageById,
    createCarouselImage,
    updateCarouselImage,
    deleteCarouselImage,
    updateCarouselOrder
} from '../controllers/carouselController.js';

const router = express.Router();

// Public routes
router.get('/', getAllCarouselImages);

// Admin routes (temporarily without auth for development)
router.get('/admin', getAllCarouselImagesAdmin);
router.get('/:id', getCarouselImageById);
router.post('/', createCarouselImage);
router.put('/:id', updateCarouselImage);
router.delete('/:id', deleteCarouselImage);
router.put('/order/update', updateCarouselOrder);

export default router;
