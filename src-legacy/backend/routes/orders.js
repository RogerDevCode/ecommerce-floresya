import express from 'express';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/bked_auth_middleware.js';
import { orderValidation } from '../middleware/validation.js';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

// POST create order
router.post('/', optionalAuth, orderValidation, orderController.createOrder);

// GET all orders (admin)
router.get('/admin/all', authenticateToken, requireRole(['admin']), orderController.getAllOrders);

// GET order stats (admin)
router.get('/stats/summary', authenticateToken, requireRole(['admin']), orderController.getOrderStats);

// GET order by ID
router.get('/:id', optionalAuth, orderController.getOrderById);

// PATCH update order status (admin)
router.patch('/:id/status', authenticateToken, requireRole(['admin']), orderController.updateOrderStatus);

export default router;
