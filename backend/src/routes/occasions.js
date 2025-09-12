import express from 'express';
import { authenticateToken, requireRole } from '../middleware/bked_auth_middleware.js';
import {
    getAllOccasions,
    getOccasionById,
    getProductsByOccasion,
    createOccasion,
    updateOccasion,
    deleteOccasion,
    addProductToOccasion,
    removeProductFromOccasion,
    getProductOccasions
} from '../controllers/occasionController.js';

const router = express.Router();

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

export default router;
