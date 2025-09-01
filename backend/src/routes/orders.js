const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { orderValidation } = require('../middleware/validation');
const {
    createOrder,
    getOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');

router.post('/', optionalAuth, orderValidation, createOrder);

router.get('/my-orders', authenticateToken, getUserOrders);

router.get('/admin/all', authenticateToken, requireRole(['admin']), getAllOrders);

router.get('/:id', optionalAuth, getOrder);

router.patch('/:id/status', authenticateToken, requireRole(['admin']), updateOrderStatus);

module.exports = router;