import { body, query, param, validationResult } from 'express-validator';
import { OrderService } from '../services/OrderService.js';
const orderService = new OrderService();
export class OrderController {
    async getOrders(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid query parameters',
                    errors: errors.array()
                });
                return;
            }
            const query = {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 20, 100),
                status: req.query.status,
                customer_email: req.query.customer_email,
                date_from: req.query.date_from,
                date_to: req.query.date_to,
                sort_by: req.query.sort_by || 'created_at',
                sort_direction: req.query.sort_direction || 'desc'
            };
            const result = await orderService.getOrders(query);
            res.status(200).json({
                success: true,
                data: result,
                message: 'Orders retrieved successfully'
            });
        }
        catch (error) {
            console.error('OrderController.getOrders error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch orders',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getOrderById(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid order ID',
                    errors: errors.array()
                });
                return;
            }
            const orderId = parseInt(req.params.id);
            const order = await orderService.getOrderById(orderId);
            if (!order) {
                res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: { order },
                message: 'Order retrieved successfully'
            });
        }
        catch (error) {
            console.error('OrderController.getOrderById error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async createOrder(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const orderData = req.body;
            const order = await orderService.createOrder(orderData);
            res.status(201).json({
                success: true,
                data: { order },
                message: 'Order created successfully'
            });
        }
        catch (error) {
            console.error('OrderController.createOrder error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create order',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async updateOrder(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const orderId = parseInt(req.params.id);
            const updateData = { ...req.body, id: orderId };
            if (Object.keys(req.body).length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No update data provided'
                });
                return;
            }
            const order = await orderService.updateOrder(updateData);
            res.status(200).json({
                success: true,
                data: { order },
                message: 'Order updated successfully'
            });
        }
        catch (error) {
            console.error('OrderController.updateOrder error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async updateOrderStatus(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const orderId = parseInt(req.params.id);
            const { status, notes } = req.body;
            const userId = req.user?.id;
            const order = await orderService.updateOrderStatus(orderId, status, notes, userId);
            res.status(200).json({
                success: true,
                data: { order },
                message: 'Order status updated successfully'
            });
        }
        catch (error) {
            console.error('OrderController.updateOrderStatus error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order status',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getOrderStatusHistory(req, res) {
        try {
            const orderId = parseInt(req.params.id);
            const history = await orderService.getOrderStatusHistory(orderId);
            res.status(200).json({
                success: true,
                data: { history },
                message: 'Order status history retrieved successfully'
            });
        }
        catch (error) {
            console.error('OrderController.getOrderStatusHistory error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order status history',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
export const orderValidators = {
    getOrders: [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).withMessage('Invalid status'),
        query('sort_by').optional().isIn(['created_at', 'total_amount_usd', 'status']).withMessage('Invalid sort field'),
        query('sort_direction').optional().isIn(['asc', 'desc']).withMessage('Sort direction must be asc or desc')
    ],
    getOrderById: [
        param('id').isInt({ min: 1 }).withMessage('Order ID must be a positive integer')
    ],
    createOrder: [
        body('customer_email').isEmail().withMessage('Valid email is required'),
        body('customer_name').notEmpty().isLength({ min: 2, max: 100 }).withMessage('Customer name must be 2-100 characters'),
        body('delivery_address').notEmpty().isLength({ min: 10, max: 500 }).withMessage('Delivery address must be 10-500 characters'),
        body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
        body('items.*.product_id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
    ],
    updateOrder: [
        param('id').isInt({ min: 1 }).withMessage('Order ID must be a positive integer'),
        body('status').optional().isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).withMessage('Invalid status'),
        body('delivery_date').optional().isISO8601().withMessage('Invalid delivery date format'),
        body('admin_notes').optional().isLength({ max: 1000 }).withMessage('Admin notes must not exceed 1000 characters')
    ],
    updateOrderStatus: [
        param('id').isInt({ min: 1 }).withMessage('Order ID must be a positive integer'),
        body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).withMessage('Valid status is required'),
        body('notes').optional().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
    ]
};
