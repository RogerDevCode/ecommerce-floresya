const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { paymentValidation } = require('../middleware/validation');
const {
    createPayment,
    getPaymentsByOrder,
    getAllPayments,
    verifyPayment,
    uploadPaymentProof
} = require('../controllers/paymentController');

router.post('/', optionalAuth, uploadPaymentProof, paymentValidation, createPayment);

router.get('/order/:order_id', optionalAuth, getPaymentsByOrder);

router.get('/admin/all', authenticateToken, requireRole(['admin']), getAllPayments);

router.patch('/:id/verify', authenticateToken, requireRole(['admin']), verifyPayment);

module.exports = router;