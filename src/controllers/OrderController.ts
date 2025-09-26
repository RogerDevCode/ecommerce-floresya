/**
 * 🌸 FloresYa Order Controller - Enterprise TypeScript Edition
 * Complete order management with payments and status tracking
 */

import { Request, Response } from 'express';
import { z } from 'zod';

import { OrderService } from '../services/OrderService.js';
import {
  // Validation Schemas
  OrderCreateRequestSchema,
  OrderUpdateRequestSchema,
  OrderStatusUpdateRequestSchema,
  OrderQueryRequestSchema,
  ProductIdParamsSchema,
  // Types only (no unused schemas)
  OrderCreateRequestValidated,
  OrderUpdateRequestValidated,
  OrderStatusUpdateRequestValidated,
  OrderQueryRequestValidated,
  ProductIdParamsValidated,
  OrderStatus,
  // Interface types
  AuthenticatedRequest,
} from '../shared/types/index.js';

// ============================================
// ZOD VALIDATION HELPERS - STANDARDIZED
// ============================================

/**
 * Validates request body with Zod schema
 */
function validateRequestBody<T>(schema: z.ZodSchema<T>, req: Request): T {
  try {
    return schema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      throw new ValidationError('Request body validation failed', errors);
    }
    throw error;
  }
}

/**
 * Validates request params with Zod schema
 */
function validateRequestParams<T>(schema: z.ZodSchema<T>, req: Request): T {
  try {
    return schema.parse(req.params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      throw new ValidationError('Request params validation failed', errors);
    }
    throw error;
  }
}

/**
 * Validates request query with Zod schema
 */
function validateRequestQuery<T>(schema: z.ZodSchema<T>, req: Request): T {
  try {
    return schema.parse(req.query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      throw new ValidationError('Request query validation failed', errors);
    }
    throw error;
  }
}

/**
 * Custom validation error class
 */
class ValidationError extends Error {
  constructor(public message: string, public errors: Array<{ field: string; message: string; code: string }>) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Factory function for dependency injection
const createOrderService = () => new OrderService();

export class OrderController {
  private orderService: OrderService;

  constructor(orderServiceFactory: () => OrderService = createOrderService) {
    this.orderService = orderServiceFactory();
  }
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
      // 🔥 ZOD RUNTIME VALIDATION!
      const queryParams = validateRequestQuery(OrderQueryRequestSchema, req);

      const query = {
        page: queryParams.page ?? 1,
        limit: Math.min(queryParams.limit ?? 20, 100),
        status: queryParams.status,
        customer_email: queryParams.customer_email,
        date_from: queryParams.date_from,
        date_to: queryParams.date_to,
        sort_by: queryParams.sort_by ?? 'created_at',
        sort_direction: queryParams.sort_direction ?? 'desc'
      };

      const result = await this.orderService.getOrders(query);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Orders retrieved successfully'
      });
    } catch (error) {
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
      // 🔥 ZOD RUNTIME VALIDATION!
      const params = validateRequestParams(ProductIdParamsSchema, req);
      const orderId = params.id;
      const order = await this.orderService.getOrderById(orderId);

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
      // 🔥 ZOD RUNTIME VALIDATION!
      const orderData = validateRequestBody(OrderCreateRequestSchema, req);
      const order = await this.orderService.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: { order },
        message: 'Order created successfully'
      });
    } catch (error) {
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
      // 🔥 ZOD RUNTIME VALIDATION!
      const params = validateRequestParams(ProductIdParamsSchema, req);
      const bodyData = validateRequestBody(OrderUpdateRequestSchema.omit({ id: true }), req);
      const updateData = { ...bodyData, id: params.id };

      if (Object.keys(req.body).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No update data provided'
        });
        return;
      }

      const order = await this.orderService.updateOrder(updateData);

      res.status(200).json({
        success: true,
        data: { order },
        message: 'Order updated successfully'
      });
    } catch (error) {
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
      // 🔥 ZOD RUNTIME VALIDATION!
      const params = validateRequestParams(ProductIdParamsSchema, req);
      const bodyData = validateRequestBody(OrderStatusUpdateRequestSchema, req);
      const orderId = params.id;
      const { status, notes } = bodyData;
      const userId = (req as unknown as AuthenticatedRequest).user?.id; // From auth middleware

      const order = await this.orderService.updateOrderStatus(orderId, status, notes, userId);

      res.status(200).json({
        success: true,
        data: { order },
        message: 'Order status updated successfully'
      });
    } catch (error) {
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
      // 🔥 ZOD RUNTIME VALIDATION!
      const params = validateRequestParams(ProductIdParamsSchema, req);
      const orderId = params.id;
      const history = await this.orderService.getOrderStatusHistory(orderId);

      res.status(200).json({
        success: true,
        data: { history },
        message: 'Order status history retrieved successfully'
      });
    } catch (error) {
            res.status(500).json({
        success: false,
        message: 'Failed to fetch order status history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// ============================================
// ZOD VALIDATION COMPLETE - EXPRESS-VALIDATOR REMOVED
// ============================================
// All validation now handled by Zod schemas with runtime type safety
// OrderController fully migrated to enterprise-grade validation