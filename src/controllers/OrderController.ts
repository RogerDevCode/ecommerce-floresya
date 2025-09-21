/**
 * 🌸 FloresYa Order Controller - Enterprise TypeScript Edition
 * Complete order management with payments and status tracking
 */

import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';

// Extend Express Request to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}
import { OrderService } from '../services/OrderService.js';
import type {
  OrderCreateRequest,
  OrderStatus,
  OrderUpdateRequest
} from '../config/supabase.js';

const orderService = new OrderService();

export class OrderController {
  /**
   * @swagger
   * /api/orders:
   *   get:
   *     summary: Get orders with filtering and pagination
   *     description: Retrieves a paginated list of orders with optional filtering by status, customer email, date range, and sorting
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of orders per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, confirmed, preparing, ready, delivered, cancelled]
   *         description: Filter by order status
   *       - in: query
   *         name: customer_email
   *         schema:
   *           type: string
   *           format: email
   *         description: Filter by customer email
   *       - in: query
   *         name: date_from
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter orders from this date (YYYY-MM-DD)
   *       - in: query
   *         name: date_to
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter orders until this date (YYYY-MM-DD)
   *       - in: query
   *         name: sort_by
   *         schema:
   *           type: string
   *           enum: [created_at, total_amount_usd, status]
   *           default: created_at
   *         description: Sort field
   *       - in: query
   *         name: sort_direction
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Sort direction
   *     responses:
   *       200:
   *         description: Orders retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     orders:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Order'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                         limit:
   *                           type: integer
   *                         total:
   *                           type: integer
   *                         totalPages:
   *                           type: integer
   *                 message:
   *                   type: string
   *                   example: "Orders retrieved successfully"
   *       400:
   *         description: Invalid query parameters
   *       401:
   *         description: Unauthorized - Admin access required
   *       500:
   *         description: Server error
   */
  public async getOrders(req: Request, res: Response): Promise<void> {
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
        page: parseInt(req.query.page as string) ?? 1,
        limit: Math.min(parseInt(req.query.limit as string) ?? 20, 100),
        status: req.query.status as OrderStatus,
        customer_email: req.query.customer_email as string,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
        sort_by: (req.query.sort_by as 'created_at' | 'total_amount_usd' | 'status') ?? 'created_at',
        sort_direction: (req.query.sort_direction as 'asc' | 'desc') ?? 'desc'
      };

      const result = await orderService.getOrders(query);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Orders retrieved successfully'
      });
    } catch (error) {
      console.error('OrderController.getOrders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/orders/{id}:
   *   get:
   *     summary: Get order by ID
   *     description: Retrieves a single order by its unique identifier with all related items and payment information
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Order ID
   *     responses:
   *       200:
   *         description: Order retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     order:
   *                       $ref: '#/components/schemas/Order'
   *                 message:
   *                   type: string
   *                   example: "Order retrieved successfully"
   *       400:
   *         description: Invalid order ID
   *       401:
   *         description: Unauthorized - Admin access required
   *       404:
   *         description: Order not found
   *       500:
   *         description: Server error
   */
  public async getOrderById(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('OrderController.getOrderById error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/orders:
   *   post:
   *     summary: Create new order
   *     description: Creates a new order with customer information, delivery details, and order items
   *     tags: [Orders]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - customer_email
   *               - customer_name
   *               - delivery_address
   *               - items
   *             properties:
   *               customer_email:
   *                 type: string
   *                 format: email
   *                 description: Customer email address
   *                 example: "customer@example.com"
   *               customer_name:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 100
   *                 description: Customer full name
   *                 example: "María González"
   *               customer_phone:
   *                 type: string
   *                 description: Customer phone number
   *                 example: "+58 412 123 4567"
   *               delivery_address:
   *                 type: string
   *                 minLength: 10
   *                 maxLength: 500
   *                 description: Delivery address
   *                 example: "Calle Principal 123, Caracas, Venezuela"
   *               delivery_city:
   *                 type: string
   *                 description: Delivery city
   *                 example: "Caracas"
   *               delivery_state:
   *                 type: string
   *                 description: Delivery state/province
   *                 example: "Distrito Capital"
   *               delivery_zip:
   *                 type: string
   *                 description: Delivery postal code
   *                 example: "1010"
   *               delivery_date:
   *                 type: string
   *                 format: date
   *                 description: Requested delivery date
   *                 example: "2024-01-20"
   *               delivery_time_slot:
   *                 type: string
   *                 description: Preferred delivery time slot
   *                 example: "10:00-12:00"
   *               delivery_notes:
   *                 type: string
   *                 description: Special delivery instructions
   *                 example: "Please ring the doorbell twice"
   *               items:
   *                 type: array
   *                 minItems: 1
   *                 description: Order items
   *                 items:
   *                   type: object
   *                   required:
   *                     - product_id
   *                     - quantity
   *                   properties:
   *                     product_id:
   *                       type: integer
   *                       minimum: 1
   *                       description: Product ID
   *                       example: 1
   *                     quantity:
   *                       type: integer
   *                       minimum: 1
   *                       description: Quantity of the product
   *                       example: 2
   *               notes:
   *                 type: string
   *                 description: Order notes
   *                 example: "Birthday surprise delivery"
   *     responses:
   *       201:
   *         description: Order created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     order:
   *                       $ref: '#/components/schemas/Order'
   *                 message:
   *                   type: string
   *                   example: "Order created successfully"
   *       400:
   *         description: Validation failed
   *       500:
   *         description: Server error
   */
  public async createOrder(req: Request, res: Response): Promise<void> {
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

      const orderData: OrderCreateRequest = req.body;
      const order = await orderService.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: { order },
        message: 'Order created successfully'
      });
    } catch (error) {
      console.error('OrderController.createOrder error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/orders/{id}:
   *   put:
   *     summary: Update order
   *     description: Updates an existing order with new status, delivery information, or admin notes (Admin only)
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Order ID to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, confirmed, preparing, ready, delivered, cancelled]
   *                 description: New order status
   *                 example: "confirmed"
   *               delivery_date:
   *                 type: string
   *                 format: date
   *                 description: Updated delivery date
   *                 example: "2024-01-20"
   *               delivery_time_slot:
   *                 type: string
   *                 description: Updated delivery time slot
   *                 example: "14:00-16:00"
   *               delivery_notes:
   *                 type: string
   *                 description: Updated delivery instructions
   *                 example: "Leave at front door"
   *               admin_notes:
   *                 type: string
   *                 maxLength: 1000
   *                 description: Internal admin notes
   *                 example: "Customer requested urgent delivery"
   *     responses:
   *       200:
   *         description: Order updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     order:
   *                       $ref: '#/components/schemas/Order'
   *                 message:
   *                   type: string
   *                   example: "Order updated successfully"
   *       400:
   *         description: Validation failed or no update data provided
   *       401:
   *         description: Unauthorized - Admin access required
   *       404:
   *         description: Order not found
   *       500:
   *         description: Server error
   */
  public async updateOrder(req: Request, res: Response): Promise<void> {
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
      const updateData: OrderUpdateRequest = { ...req.body, id: orderId };

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
    } catch (error) {
      console.error('OrderController.updateOrder error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/orders/{id}/status:
   *   patch:
   *     summary: Update order status
   *     description: Updates the status of an order and creates a history record (Admin only)
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Order ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, confirmed, preparing, ready, delivered, cancelled]
   *                 description: New order status
   *                 example: "preparing"
   *               notes:
   *                 type: string
   *                 maxLength: 500
   *                 description: Status change notes
   *                 example: "Order is being prepared for delivery"
   *     responses:
   *       200:
   *         description: Order status updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     order:
   *                       $ref: '#/components/schemas/Order'
   *                 message:
   *                   type: string
   *                   example: "Order status updated successfully"
   *       400:
   *         description: Validation failed
   *       401:
   *         description: Unauthorized - Admin access required
   *       404:
   *         description: Order not found
   *       500:
   *         description: Server error
   */
  public async updateOrderStatus(req: Request, res: Response): Promise<void> {
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
      const userId = (req as AuthenticatedRequest).user?.id; // From auth middleware

      const order = await orderService.updateOrderStatus(orderId, status, notes, userId);

      res.status(200).json({
        success: true,
        data: { order },
        message: 'Order status updated successfully'
      });
    } catch (error) {
      console.error('OrderController.updateOrderStatus error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/orders/{id}/status-history:
   *   get:
   *     summary: Get order status history
   *     description: Retrieves the complete status change history for an order (Admin only)
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Order ID
   *     responses:
   *       200:
   *         description: Order status history retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     history:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                             description: History record ID
   *                           order_id:
   *                             type: integer
   *                             description: Order ID
   *                           old_status:
   *                             type: string
   *                             enum: [pending, confirmed, preparing, ready, delivered, cancelled]
   *                             description: Previous status
   *                           new_status:
   *                             type: string
   *                             enum: [pending, confirmed, preparing, ready, delivered, cancelled]
   *                             description: New status
   *                           notes:
   *                             type: string
   *                             description: Status change notes
   *                           changed_by:
   *                             type: integer
   *                             description: User ID who made the change
   *                           created_at:
   *                             type: string
   *                             format: date-time
   *                             description: When the change occurred
   *                 message:
   *                   type: string
   *                   example: "Order status history retrieved successfully"
   *       401:
   *         description: Unauthorized - Admin access required
   *       500:
   *         description: Server error
   */
  public async getOrderStatusHistory(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.id);
      const history = await orderService.getOrderStatusHistory(orderId);

      res.status(200).json({
        success: true,
        data: { history },
        message: 'Order status history retrieved successfully'
      });
    } catch (error) {
      console.error('OrderController.getOrderStatusHistory error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order status history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Validation middleware
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