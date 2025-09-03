const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
    getAllOccasions,
    getOccasionById,
    getProductsByOccasion,
    createOccasion,
    updateOccasion,
    deleteOccasion,
    addProductToOccasion,
    removeProductFromOccasion,
    getProductOccasions
} = require('../controllers/occasionController');

// Public routes
router.get('/', getAllOccasions);
router.get('/:id', getOccasionById);
router.get('/:id/products', getProductsByOccasion);

// Product-occasion relationship routes
router.get('/products/:productId/occasions', getProductOccasions);

// Admin routes
router.post('/', authenticateToken, requireRole(['admin']), createOccasion);
router.put('/:id', authenticateToken, requireRole(['admin']), updateOccasion);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteOccasion);

// Product-occasion management (admin only)
router.post('/:id/products/:productId', authenticateToken, requireRole(['admin']), addProductToOccasion);
router.delete('/:id/products/:productId', authenticateToken, requireRole(['admin']), removeProductFromOccasion);

module.exports = router;