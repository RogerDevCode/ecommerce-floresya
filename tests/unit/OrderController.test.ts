/**
 * 🌸 FloresYa Order Controller Tests - Enterprise TypeScript Edition
 * Comprehensive unit tests for order management endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { OrderController } from '../../src/controllers/OrderController.js';
import { OrderService } from '../../src/services/OrderService.js';
import type {
  OrderWithItems,
  OrderWithItemsAndPayments,
  OrderResponse,
  OrderStatus,
  OrderCreateRequest,
  OrderUpdateRequest
} from '../../src/shared/types/index.js';

// Mock express-validator
vi.mock('express-validator', () => {
  const mockValidationChain = {
    isInt: vi.fn().mockReturnThis(),
    isIn: vi.fn().mockReturnThis(),
    isEmail: vi.fn().mockReturnThis(),
    isLength: vi.fn().mockReturnThis(),
    isDecimal: vi.fn().mockReturnThis(),
    isBoolean: vi.fn().mockReturnThis(),
    isArray: vi.fn().mockReturnThis(),
    isISO8601: vi.fn().mockReturnThis(),
    notEmpty: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis()
  };

  const defaultValidationResult = {
    isEmpty: vi.fn().mockReturnValue(true),
    array: vi.fn().mockReturnValue([])
  };

  return {
    body: vi.fn().mockReturnValue(mockValidationChain),
    param: vi.fn().mockReturnValue(mockValidationChain),
    query: vi.fn().mockReturnValue(mockValidationChain),
    validationResult: vi.fn().mockReturnValue(defaultValidationResult)
  };
});

// Mock the OrderService
vi.mock('../../src/services/OrderService.js', () => ({
  OrderService: vi.fn().mockImplementation(() => ({
    getOrders: vi.fn(),
    getOrderById: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
    getOrderStatusHistory: vi.fn()
  }))
}));

// Create a mock instance for testing
const mockOrderServiceInstance = {
  getOrders: vi.fn(),
  getOrderById: vi.fn(),
  createOrder: vi.fn(),
  updateOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
  getOrderStatusHistory: vi.fn()
} as any;

describe('OrderController', () => {
  let orderController: OrderController;
  let mockOrderService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(async () => {
    // Create a new instance of OrderController with mocked service
    orderController = new OrderController(() => mockOrderServiceInstance);
    mockOrderService = mockOrderServiceInstance;

    // Reset the validationResult mock to default (no errors)
    const { validationResult } = await import('express-validator');
    (validationResult as any).mockReturnValue({
      isEmpty: vi.fn().mockReturnValue(true),
      array: vi.fn().mockReturnValue([])
    });

    // Mock response methods
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should return orders successfully', async () => {
      const mockOrders: OrderResponse = {
        orders: [
          {
            id: 1,
            customer_email: 'test@example.com',
            customer_name: 'Test Customer',
            status: 'pending' as OrderStatus,
            total_amount_usd: 50.99,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            items: [
              {
                id: 1,
                order_id: 1,
                product_id: 1,
                product_name: 'Rosas Rojas',
                unit_price_usd: 25.99,
                quantity: 2,
                subtotal_usd: 51.98
              }
            ],
            user: {
              id: 1,
              full_name: 'Admin User',
              email: 'admin@example.com'
            }
          }
        ],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1,
          items_per_page: 20
        }
      };

      mockOrderService.getOrders.mockResolvedValue(mockOrders);

      mockRequest = {
        query: {
          page: '1',
          limit: '20',
          status: 'pending',
          sort_by: 'created_at',
          sort_direction: 'desc'
        }
      };

      await orderController.getOrders(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockOrders,
        message: 'Orders retrieved successfully'
      });
    });

    it('should handle validation errors', async () => {
      // Mock validation errors
      const mockErrors = [
        { param: 'page', msg: 'Page must be a positive integer' },
        { param: 'limit', msg: 'Limit must be between 1 and 100' }
      ];
      const { validationResult } = await import('express-validator');
      (validationResult as any).mockReturnValue({
        isEmpty: vi.fn().mockReturnValue(false),
        array: vi.fn().mockReturnValue(mockErrors)
      });

      mockRequest = {
        query: {
          page: 'invalid',
          limit: '200'
        }
      };

      await orderController.getOrders(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid query parameters',
        errors: mockErrors
      });
    });

    it('should handle service errors', async () => {
      mockOrderService.getOrders.mockRejectedValue(new Error('Database error'));

      mockRequest = {
        query: {
          page: '1',
          limit: '20'
        }
      };

      await orderController.getOrders(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch orders',
        error: 'Database error'
      });
    });

    it('should handle empty query parameters', async () => {
      const mockOrders: OrderResponse = {
        orders: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_items: 0,
          items_per_page: 20
        }
      };

      mockOrderService.getOrders.mockResolvedValue(mockOrders);

      mockRequest = {
        query: {}
      };

      await orderController.getOrders(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_direction: 'desc'
      });
    });
  });

  describe('getOrderById', () => {
    it('should return order successfully', async () => {
      const mockOrder: OrderWithItemsAndPayments = {
        id: 1,
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        status: 'pending' as OrderStatus,
        total_amount_usd: 50.99,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        items: [
          {
            id: 1,
            order_id: 1,
            product_id: 1,
            product_name: 'Rosas Rojas',
            unit_price_usd: 25.99,
            quantity: 2,
            subtotal_usd: 51.98
          }
        ],
        payments: [],
        status_history: [],
      };

      mockOrderService.getOrderById.mockResolvedValue(mockOrder);

      mockRequest = {
        params: { id: '1' }
      };

      await orderController.getOrderById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { order: mockOrder },
        message: 'Order retrieved successfully'
      });
    });

    it('should return 404 for non-existent order', async () => {
      mockOrderService.getOrderById.mockResolvedValue(null);

      mockRequest = {
        params: { id: '999' }
      };

      await orderController.getOrderById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Order not found'
      });
    });

    it('should handle validation errors', async () => {
      // Mock validation errors
      const mockErrors = [{ param: 'id', msg: 'Order ID must be a positive integer' }];
      const { validationResult } = await import('express-validator');
      (validationResult as any).mockReturnValue({
        isEmpty: vi.fn().mockReturnValue(false),
        array: vi.fn().mockReturnValue(mockErrors)
      });

      mockRequest = {
        params: { id: 'invalid' }
      };

      await orderController.getOrderById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid order ID',
        errors: mockErrors
      });
    });

    it('should handle service errors', async () => {
      mockOrderService.getOrderById.mockRejectedValue(new Error('Database error'));

      mockRequest = {
        params: { id: '1' }
      };

      await orderController.getOrderById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch order',
        error: 'Database error'
      });
    });
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const mockOrderData: OrderCreateRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        customer_phone: '+58 412 123 4567',
        delivery_address: 'Calle Principal 123, Caracas, Venezuela',
        delivery_date: '2024-01-20',
        notes: 'Ring doorbell twice',
        items: [
          {
            product_id: 1,
            quantity: 2,
            unit_price_usd: 25.99
          }
        ],
      };

      const mockCreatedOrder: OrderWithItems = {
        id: 1,
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        customer_phone: '+58 412 123 4567',
        delivery_address: 'Calle Principal 123, Caracas, Venezuela',
        delivery_date: '2024-01-20',
        status: 'pending' as OrderStatus,
        total_amount_usd: 51.98,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        items: [
          {
            id: 1,
            order_id: 1,
            product_id: 1,
            product_name: 'Rosas Rojas',
            unit_price_usd: 25.99,
            quantity: 2,
            subtotal_usd: 51.98
          }
        ],
        notes: 'Birthday surprise delivery'
      };

      mockOrderService.createOrder.mockResolvedValue(mockCreatedOrder);

      mockRequest = {
        body: mockOrderData
      };

      await orderController.createOrder(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { order: mockCreatedOrder },
        message: 'Order created successfully'
      });
    });

    it('should handle validation errors', async () => {
      // Mock validation errors
      const mockErrors = [
        { param: 'customer_email', msg: 'Valid email is required' },
        { param: 'customer_name', msg: 'Customer name must be 2-100 characters' },
        { param: 'delivery_address', msg: 'Delivery address must be 10-500 characters' },
        { param: 'items', msg: 'Order must contain at least one item' }
      ];
      const { validationResult } = await import('express-validator');
      (validationResult as any).mockReturnValue({
        isEmpty: vi.fn().mockReturnValue(false),
        array: vi.fn().mockReturnValue(mockErrors)
      });

      mockRequest = {
        body: {
          customer_email: 'invalid-email',
          customer_name: '',
          delivery_address: 'short',
          items: []
        }
      };

      await orderController.createOrder(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: mockErrors
      });
    });

    it('should handle service errors', async () => {
      const mockOrderData: OrderCreateRequest = {
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        delivery_address: 'Calle Principal 123, Caracas, Venezuela',
        items: [
          {
            product_id: 1,
            quantity: 2,
            unit_price_usd: 25.99
          }
        ]
      };

      mockOrderService.createOrder.mockRejectedValue(new Error('Database error'));

      mockRequest = {
        body: mockOrderData
      };

      await orderController.createOrder(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create order',
        error: 'Database error'
      });
    });
  });

  describe('updateOrder', () => {
    it('should update order successfully', async () => {
      const mockUpdateData: OrderUpdateRequest = {
        id: 1,
        status: 'confirmed' as OrderStatus
      };

      const mockUpdatedOrder = {
        id: 1,
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        status: 'confirmed' as OrderStatus,
        total_amount_usd: 50.99,
        admin_notes: 'Order confirmed and ready for processing',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockOrderService.updateOrder.mockResolvedValue(mockUpdatedOrder);

      mockRequest = {
        params: { id: '1' },
        body: {
          status: 'confirmed',
          admin_notes: 'Order confirmed and ready for processing'
        }
      };

      await orderController.updateOrder(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { order: mockUpdatedOrder },
        message: 'Order updated successfully'
      });
    });

    it('should return 400 for empty update data', async () => {
      mockRequest = {
        params: { id: '1' },
        body: {}
      };

      await orderController.updateOrder(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'No update data provided'
      });
    });

    it('should handle validation errors', async () => {
      // Mock validation errors
      const mockErrors = [
        { param: 'id', msg: 'Order ID must be a positive integer' },
        { param: 'status', msg: 'Invalid status' }
      ];
      const { validationResult } = await import('express-validator');
      (validationResult as any).mockReturnValue({
        isEmpty: vi.fn().mockReturnValue(false),
        array: vi.fn().mockReturnValue(mockErrors)
      });

      mockRequest = {
        params: { id: 'invalid' },
        body: {
          status: 'invalid-status'
        }
      };

      await orderController.updateOrder(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: mockErrors
      });
    });

    it('should handle service errors', async () => {
      mockOrderService.updateOrder.mockRejectedValue(new Error('Database error'));

      mockRequest = {
        params: { id: '1' },
        body: {
          status: 'confirmed'
        }
      };

      await orderController.updateOrder(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update order',
        error: 'Database error'
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockUpdatedOrder = {
        id: 1,
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        status: 'preparing' as OrderStatus,
        total_amount_usd: 50.99,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockOrderService.updateOrderStatus.mockResolvedValue(mockUpdatedOrder);

      mockRequest = {
        params: { id: '1' },
        body: {
          status: 'preparing',
          notes: 'Order is being prepared for delivery'
        },
        user: {
          id: 1,
          email: 'admin@example.com',
          role: 'admin' as const
        }
      } as any;

      await orderController.updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(1, 'preparing', 'Order is being prepared for delivery', 1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { order: mockUpdatedOrder },
        message: 'Order status updated successfully'
      });
    });

    it('should handle validation errors', async () => {
      // Mock validation errors
      const mockErrors = [
        { param: 'id', msg: 'Order ID must be a positive integer' },
        { param: 'status', msg: 'Valid status is required' }
      ];
      const { validationResult } = await import('express-validator');
      (validationResult as any).mockReturnValue({
        isEmpty: vi.fn().mockReturnValue(false),
        array: vi.fn().mockReturnValue(mockErrors)
      });

      mockRequest = {
        params: { id: 'invalid' },
        body: {
          status: 'invalid-status'
        }
      };

      await orderController.updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: mockErrors
      });
    });

    it('should handle service errors', async () => {
      mockOrderService.updateOrderStatus.mockRejectedValue(new Error('Database error'));

      mockRequest = {
        params: { id: '1' },
        body: {
          status: 'preparing'
        },
        user: {
          id: 1,
          email: 'admin@example.com',
          role: 'admin' as const
        }
      } as any;

      await orderController.updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update order status',
        error: 'Database error'
      });
    });
  });

  describe('getOrderStatusHistory', () => {
    it('should return order status history successfully', async () => {
      const mockHistory = [
        {
          id: 1,
          order_id: 1,
          old_status: 'pending' as OrderStatus,
          new_status: 'confirmed' as OrderStatus,
          notes: 'Order confirmed by admin',
          changed_by: 1,
          created_at: '2024-01-01T00:00:00Z',
          users: {
            full_name: 'Admin User'
          }
        },
        {
          id: 2,
          order_id: 1,
          old_status: 'confirmed' as OrderStatus,
          new_status: 'preparing' as OrderStatus,
          notes: 'Order is being prepared',
          changed_by: 1,
          created_at: '2024-01-01T01:00:00Z',
          users: {
            full_name: 'Admin User'
          }
        }
      ];

      mockOrderService.getOrderStatusHistory.mockResolvedValue(mockHistory);

      mockRequest = {
        params: { id: '1' }
      };

      await orderController.getOrderStatusHistory(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { history: mockHistory },
        message: 'Order status history retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      mockOrderService.getOrderStatusHistory.mockRejectedValue(new Error('Database error'));

      mockRequest = {
        params: { id: '1' }
      };

      await orderController.getOrderStatusHistory(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch order status history',
        error: 'Database error'
      });
    });
  });
});