import express from 'express';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/bked_auth_middleware.js';
import { paymentValidation } from '../middleware/validation.js';
import {
    createPayment,
    getPaymentsByOrder,
    getAllPayments,
    verifyPayment,
    uploadPaymentProof
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/', optionalAuth, uploadPaymentProof, paymentValidation, createPayment);

router.get('/order/:order_id', optionalAuth, getPaymentsByOrder);

router.get('/admin/all', authenticateToken, requireRole(['admin']), getAllPayments);

router.patch('/:id/verify', authenticateToken, requireRole(['admin']), verifyPayment);

export default router;
