/**
 * Payments Routes - ES6+ Version
 * Enhanced with modern JavaScript patterns and improved error handling
 */

import express from 'express';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { paymentValidation } from '../middleware/validation.js';
import { logger, trackPerformance } from '../utils/logger.js';
import { asyncErrorHandler } from '../utils/errorHandler.js';
import {
    createPayment,
    getPaymentsByOrder,
    getAllPayments,
    verifyPayment,
    uploadPaymentProof
} from '../controllers/paymentController.js';

const router = express.Router();

// Enhanced parameter validation helper
const validateOrderId = (orderId) => {
    const numericOrderId = parseInt(orderId, 10);
    if (isNaN(numericOrderId) || numericOrderId <= 0) {
        throw new Error(`Invalid order ID: expected positive integer, received '${orderId}'`);
    }
    return numericOrderId;
};

const validatePaymentId = (paymentId) => {
    const numericPaymentId = parseInt(paymentId, 10);
    if (isNaN(numericPaymentId) || numericPaymentId <= 0) {
        throw new Error(`Invalid payment ID: expected positive integer, received '${paymentId}'`);
    }
    return numericPaymentId;
};

/**
 * @route POST /api/payments
 * @desc Create new payment with proof upload and enhanced security
 * @access Public (with optional auth)
 */
router.post('/', 
    optionalAuth, 
    uploadPaymentProof, 
    paymentValidation, 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('create-payment');
        
        // Enhanced security logging for payment creation
        logger.info('PAYMENTS_API', 'Payment creation initiated', {
            orderId: req.body.order_id,
            paymentMethod: req.body.payment_method,
            amount: req.body.amount,
            currency: req.body.currency || 'USD',
            userId: req.user?.id,
            isAuthenticated: !!req.user,
            hasProofFile: !!req.file,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        try {
            await createPayment(req, res, next);
            performanceTracker.end();
            
            logger.success('PAYMENTS_API', 'Payment created successfully', {
                orderId: req.body.order_id,
                paymentMethod: req.body.payment_method,
                userId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            logger.error('PAYMENTS_API', 'Payment creation failed', {
                orderId: req.body.order_id,
                paymentMethod: req.body.payment_method,
                userId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route GET /api/payments/order/:order_id
 * @desc Get all payments for specific order with enhanced validation
 * @access Public (with optional auth for ownership validation)
 */
router.get('/order/:order_id', 
    optionalAuth, 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('get-payments-by-order');
        
        try {
            const orderId = validateOrderId(req.params.order_id);
            
            logger.info('PAYMENTS_API', 'Order payments requested', {
                orderId,
                userId: req.user?.id,
                isAuthenticated: !!req.user,
                timestamp: new Date().toISOString()
            });

            // Add validated ID to params for controller
            req.params.validatedOrderId = orderId;
            
            await getPaymentsByOrder(req, res, next);
            performanceTracker.end();
            
            logger.success('PAYMENTS_API', 'Order payments retrieved', {
                orderId,
                userId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            
            if (error.message.includes('Invalid order ID')) {
                logger.warn('PAYMENTS_API', 'Invalid order ID provided', {
                    providedId: req.params.order_id,
                    performance: performanceTracker.getDuration()
                });
                
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID',
                    details: {
                        field: 'order_id',
                        received: req.params.order_id,
                        expected: 'positive integer'
                    }
                });
            }
            
            logger.error('PAYMENTS_API', 'Failed to retrieve order payments', {
                orderId: req.params.order_id,
                userId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route GET /api/payments/admin/all
 * @desc Get all payments with advanced filtering (admin only)
 * @access Private (Admin)
 */
router.get('/admin/all', 
    authenticateToken, 
    requireRole(['admin']), 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('get-all-payments-admin');
        const { 
            page = 1, 
            limit = 20, 
            status, 
            paymentMethod, 
            startDate, 
            endDate,
            orderId,
            minAmount,
            maxAmount
        } = req.query;
        
        logger.info('PAYMENTS_API', 'Admin payments requested', {
            adminId: req.user?.id,
            filters: { 
                page, 
                limit, 
                status, 
                paymentMethod, 
                startDate, 
                endDate,
                orderId,
                minAmount,
                maxAmount
            },
            timestamp: new Date().toISOString()
        });

        try {
            await getAllPayments(req, res, next);
            performanceTracker.end();
            
            logger.success('PAYMENTS_API', 'Admin payments retrieved', {
                adminId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            logger.error('PAYMENTS_API', 'Admin payments retrieval failed', {
                adminId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route PATCH /api/payments/:id/verify
 * @desc Verify payment status (admin only) with enhanced audit logging
 * @access Private (Admin)
 */
router.patch('/:id/verify', 
    authenticateToken, 
    requireRole(['admin']), 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('verify-payment');
        
        try {
            const paymentId = validatePaymentId(req.params.id);
            const { status, adminNotes } = req.body;
            
            // Enhanced validation for verification status
            const validStatuses = ['verified', 'rejected', 'pending_review'];
            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification status',
                    details: {
                        field: 'status',
                        received: status,
                        expected: validStatuses
                    }
                });
            }
            
            logger.info('PAYMENTS_API', 'Payment verification initiated', {
                paymentId,
                newStatus: status,
                adminId: req.user?.id,
                hasAdminNotes: !!adminNotes,
                timestamp: new Date().toISOString()
            });

            // Add validated data to request for controller
            req.params.validatedId = paymentId;
            req.body.validatedStatus = status;
            
            await verifyPayment(req, res, next);
            performanceTracker.end();
            
            logger.success('PAYMENTS_API', 'Payment verification completed', {
                paymentId,
                newStatus: status,
                adminId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            
            if (error.message.includes('Invalid payment ID')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment ID',
                    details: {
                        field: 'id',
                        received: req.params.id,
                        expected: 'positive integer'
                    }
                });
            }
            
            logger.error('PAYMENTS_API', 'Payment verification failed', {
                paymentId: req.params.id,
                adminId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

export default router;