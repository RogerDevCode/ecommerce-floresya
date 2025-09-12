/**
 * Payment Methods Routes - ES6+ Version
 * Enhanced with modern JavaScript patterns and improved error handling
 */

import express from 'express';
import { getAllPaymentMethods } from '../controllers/paymentMethodController.js';
import { logger, trackPerformance } from '../utils/logger.js';
import { asyncErrorHandler } from '../utils/errorHandler.js';

const router = express.Router();

/**
 * @route GET /api/payment-methods
 * @desc Get all available payment methods with enhanced caching
 * @access Public
 */
router.get('/', asyncErrorHandler(async (req, res, next) => {
    const performanceTracker = trackPerformance('get-payment-methods');
    
    logger.info('PAYMENT_METHODS_API', 'Payment methods requested', {
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    try {
        await getAllPaymentMethods(req, res, next);
        performanceTracker.end();
        
        logger.success('PAYMENT_METHODS_API', 'Payment methods retrieved', {
            performance: performanceTracker.getDuration()
        });
    } catch (error) {
        performanceTracker.end();
        logger.error('PAYMENT_METHODS_API', 'Failed to retrieve payment methods', {
            error: error.message,
            performance: performanceTracker.getDuration()
        });
        throw error;
    }
}));

export default router;