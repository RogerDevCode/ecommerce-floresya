const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getAllCarouselImages,
    getAllCarouselImagesAdmin,
    getCarouselImageById,
    createCarouselImage,
    updateCarouselImage,
    deleteCarouselImage,
    updateCarouselOrder
} = require('../controllers/carouselController');

// Public routes
router.get('/', getAllCarouselImages);

// Admin routes (temporarily without auth for development)
router.get('/admin', getAllCarouselImagesAdmin);
router.get('/:id', getCarouselImageById);
router.post('/', createCarouselImage);
router.put('/:id', updateCarouselImage);
router.delete('/:id', deleteCarouselImage);
router.put('/order/update', updateCarouselOrder);

module.exports = router;