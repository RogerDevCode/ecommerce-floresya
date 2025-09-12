/**
 * Orders Routes - ES6+ Version  
 * Enhanced with modern JavaScript patterns and improved error handling
 */

import express from 'express';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { orderValidation } from '../middleware/validation.js';
import { logger, trackPerformance } from '../utils/logger.js';
import { asyncErrorHandler } from '../utils/errorHandler.js';
import {
    createOrder,
    getOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus
} from '../controllers/orderController.js';

const router = express.Router();

/**
 * @route POST /api/orders
 * @desc Create new order with enhanced tracking
 * @access Public (with optional auth)
 */
router.post('/', 
    optionalAuth, 
    orderValidation, 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('create-order');
        
        logger.info('ORDERS_API', 'Order creation initiated', {
            userId: req.user?.id,
            isAuthenticated: !!req.user,
            orderItems: req.body.items?.length || 0,
            timestamp: new Date().toISOString()
        });

        try {
            await createOrder(req, res, next);
            performanceTracker.end();
            
            logger.success('ORDERS_API', 'Order creation completed', {
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            logger.error('ORDERS_API', 'Order creation failed', {
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route GET /api/orders/my-orders
 * @desc Get current user's orders
 * @access Private
 */
router.get('/my-orders', 
    authenticateToken, 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('get-user-orders');
        
        logger.info('ORDERS_API', 'User orders requested', {
            userId: req.user?.id,
            timestamp: new Date().toISOString()
        });

        try {
            await getUserOrders(req, res, next);
            performanceTracker.end();
            
            logger.success('ORDERS_API', 'User orders retrieved', {
                userId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            logger.error('ORDERS_API', 'User orders retrieval failed', {
                userId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route GET /api/orders/admin/all
 * @desc Get all orders (admin only) with enhanced filtering
 * @access Private (Admin)
 */
router.get('/admin/all', 
    authenticateToken, 
    requireRole(['admin']), 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('get-all-orders-admin');
        const { page, limit, status, startDate, endDate } = req.query;
        
        logger.info('ORDERS_API', 'Admin orders requested', {
            adminId: req.user?.id,
            filters: { page, limit, status, startDate, endDate },
            timestamp: new Date().toISOString()
        });

        try {
            await getAllOrders(req, res, next);
            performanceTracker.end();
            
            logger.success('ORDERS_API', 'Admin orders retrieved', {
                adminId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            logger.error('ORDERS_API', 'Admin orders retrieval failed', {
                adminId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route GET /api/orders/:id
 * @desc Get specific order by ID
 * @access Public (with optional auth for ownership validation)
 */
router.get('/:id', 
    optionalAuth, 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('get-order-by-id');
        const { id } = req.params;
        
        // Enhanced parameter validation
        const orderId = parseInt(id, 10);
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID',
                details: {
                    field: 'id',
                    received: id,
                    expected: 'positive integer'
                }
            });
        }

        logger.info('ORDERS_API', 'Order details requested', {
            orderId,
            userId: req.user?.id,
            isAuthenticated: !!req.user,
            timestamp: new Date().toISOString()
        });

        try {
            await getOrder(req, res, next);
            performanceTracker.end();
            
            logger.success('ORDERS_API', 'Order details retrieved', {
                orderId,
                userId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            logger.error('ORDERS_API', 'Order details retrieval failed', {
                orderId,
                userId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route PATCH /api/orders/:id/status
 * @desc Update order status (admin only)
 * @access Private (Admin)
 */
router.patch('/:id/status', 
    authenticateToken, 
    requireRole(['admin']), 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('update-order-status');
        const { id } = req.params;
        const { status } = req.body;
        
        // Enhanced parameter validation
        const orderId = parseInt(id, 10);
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID',
                details: {
                    field: 'id',
                    received: id,
                    expected: 'positive integer'
                }
            });
        }

        // Status validation
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status',
                details: {
                    field: 'status',
                    received: status,
                    expected: validStatuses
                }
            });
        }

        logger.info('ORDERS_API', 'Order status update initiated', {
            orderId,
            newStatus: status,
            adminId: req.user?.id,
            timestamp: new Date().toISOString()
        });

        try {
            await updateOrderStatus(req, res, next);
            performanceTracker.end();
            
            logger.success('ORDERS_API', 'Order status updated', {
                orderId,
                newStatus: status,
                adminId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            logger.error('ORDERS_API', 'Order status update failed', {
                orderId,
                newStatus: status,
                adminId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

export default router;