/**
 * 🌸 FloresYa OrderController Unit Tests - Silicon Valley Style Simple Mocks
 * Clean dependency injection testing with proper mocking
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OrderController, orderValidators } from '../../src/controllers/OrderController';
import { OrderService } from '../../src/services/OrderService';
import { createMockRequest, createMockResponse, createMockService } from '../utils/test-mocks';
import { createTestOrder, createTestOrderList, createTestStatusHistory } from '../utils/test-factories';

// Clean mock for express-validator
vi.mock('express-validator', () => ({
  body: vi.fn(() => ({
    isEmail: vi.fn().mockReturnThis(),
    notEmpty: vi.fn().mockReturnThis(),
    isLength: vi.fn().mockReturnThis(),
    isArray: vi.fn().mockReturnThis(),
    isInt: vi.fn().mockReturnThis(),
    isIn: vi.fn().mockReturnThis(),
    isISO8601: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis()
  })),
  param: vi.fn(() => ({
    isInt: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis()
  })),
  query: vi.fn(() => ({
    optional: vi.fn().mockReturnThis(),
    isInt: vi.fn().mockReturnThis(),
    isIn: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis()
  })),
  validationResult: vi.fn()
}));

describe('OrderController - Silicon Valley Simple Tests', () => {
  let controller: OrderController;
  let mockOrderService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: any;
  let statusSpy: any;

  beforeEach(() => {
    // Create clean mock service
    mockOrderService = {
      getOrders: vi.fn(),
      getOrderById: vi.fn(),
      createOrder: vi.fn(),
      updateOrder: vi.fn(),
      updateOrderStatus: vi.fn(),
      getOrderStatusHistory: vi.fn(),
      calculateOrderTotals: vi.fn()
    };

    // Inject mock via factory function - Silicon Valley pattern
    controller = new OrderController(() => mockOrderService);

    jsonSpy = vi.fn().mockReturnThis();
    statusSpy = vi.fn().mockReturnThis();

    mockResponse = {
      json: jsonSpy,
      status: statusSpy,
      send: vi.fn()
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Simple validation result factory
  const createValidationResult = (overrides = {}) => ({
    isEmpty: () => true,
    array: () => [],
    ...overrides
  } as any);

  describe('getOrders', () => {
    it('should return orders successfully - clean simple test', async () => {
      // Arrange - One line setup!
      mockOrderService.getOrders.mockResolvedValue(createTestOrderList());

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = createMockRequest({
        query: { page: '1', limit: '20' }
      });

      // Act
      await controller.getOrders(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockOrderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_direction: 'desc'
      });
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: createTestOrderList(),
        message: 'Orders retrieved successfully'
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult({
        isEmpty: () => false,
        array: () => [{ field: 'page', message: 'Invalid page' }]
      }));

      mockRequest = createMockRequest({
        query: { page: 'invalid' }
      });

      // Act
      await controller.getOrders(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid query parameters',
        errors: [{ field: 'page', message: 'Invalid page' }]
      });
    });

    it('should handle service errors', async () => {
      // Arrange - Clean error setup
      mockOrderService.getOrders.mockRejectedValue(new Error('Database connection failed'));

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = createMockRequest({
        query: { page: '1', limit: '20' }
      });

      // Act
      await controller.getOrders(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch orders',
        error: 'Database connection failed'
      });
    });

    it('should use default values when query params are missing', async () => {
      // Arrange - Clean defaults test
      mockOrderService.getOrders.mockResolvedValue(createTestOrderList());

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = createMockRequest({
        query: {}
      });

      // Act
      await controller.getOrders(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockOrderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_direction: 'desc'
      });
    });

    it('should limit maximum limit value', async () => {
      // Arrange - Clean limit test
      mockOrderService.getOrders.mockResolvedValue(createTestOrderList());

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = createMockRequest({
        query: { limit: '200' } // Should be limited to 100
      });

      // Act
      await controller.getOrders(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockOrderService.getOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 100, // Should be limited to 100
        sort_by: 'created_at',
        sort_direction: 'desc'
      });
    });
  });

  describe('getOrderById', () => {
    it('should return order successfully', async () => {
      // Arrange - Clean setup
      mockOrderService.getOrderById.mockResolvedValue(createTestOrder());

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      // Act
      await controller.getOrderById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(1);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { order: createTestOrder() },
        message: 'Order retrieved successfully'
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult({
        isEmpty: () => false,
        array: () => [{ field: 'id', message: 'Invalid order ID' }]
      }));

      mockRequest = createMockRequest({
        params: { id: 'invalid' }
      });

      // Act
      await controller.getOrderById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid order ID',
        errors: [{ field: 'id', message: 'Invalid order ID' }]
      });
    });

    it('should handle order not found', async () => {
      // Arrange - Clean null response
      mockOrderService.getOrderById.mockResolvedValue(null);

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      // Act
      await controller.getOrderById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(1);
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Order not found'
      });
    });

    it('should handle service errors', async () => {
      // Arrange - Clean error test
      mockOrderService.getOrderById.mockRejectedValue(new Error('Database connection failed'));

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      // Act
      await controller.getOrderById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch order',
        error: 'Database connection failed'
      });
    });
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      // Arrange - Clean order creation
      mockOrderService.createOrder.mockResolvedValue(createTestOrder());

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const newOrderData = {
        customer_email: 'customer@example.com',
        customer_name: 'Test Customer',
        customer_phone: '+1234567890',
        delivery_address: '123 Test Street',
        delivery_city: 'Test City',
        delivery_state: 'Test State',
        delivery_zip: '12345',
        delivery_date: '2024-01-20',
        delivery_time_slot: '10:00-12:00',
        delivery_notes: 'Please ring the doorbell',
        items: [
          {
            product_id: 1,
            quantity: 2
          }
        ],
        notes: 'Birthday order'
      };

      mockRequest = createMockRequest({
        body: newOrderData
      });

      // Act
      await controller.createOrder(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(newOrderData);
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { order: createTestOrder() },
        message: 'Order created successfully'
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult({
        isEmpty: () => false,
        array: () => [{ field: 'customer_email', message: 'Invalid email' }]
      }));

      mockRequest = createMockRequest({
        body: { customer_email: 'invalid-email' }
      });

      // Act
      await controller.createOrder(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'customer_email', message: 'Invalid email' }]
      });
    });

    it('should handle service errors', async () => {
      // Arrange - Clean error handling
      mockOrderService.createOrder.mockRejectedValue(new Error('Database connection failed'));

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = createMockRequest({
        body: {
          customer_email: 'customer@example.com',
          customer_name: 'Test Customer',
          delivery_address: '123 Test Street',
          items: [{ product_id: 1, quantity: 1 }]
        }
      });

      // Act
      await controller.createOrder(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create order',
        error: 'Database connection failed'
      });
    });
  });

  describe('updateOrder', () => {
    it('should update order successfully', async () => {
      // Arrange - Clean update test
      mockOrderService.updateOrder.mockResolvedValue(createTestOrder());

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const updateData = {
        status: 'confirmed' as const,
        delivery_date: '2024-01-21',
        admin_notes: 'Updated by admin'
      };

      mockRequest = createMockRequest({
        params: { id: '1' },
        body: updateData
      });

      // Act
      await controller.updateOrder(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockOrderService.updateOrder).toHaveBeenCalledWith({
        id: 1,
        ...updateData
      });
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { order: createTestOrder() },
        message: 'Order updated successfully'
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult({
        isEmpty: () => false,
        array: () => [{ field: 'status', message: 'Invalid status' }]
      }));

      mockRequest = createMockRequest({
        params: { id: '1' },
        body: { status: 'invalid' }
      });

      // Act
      await controller.updateOrder(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'status', message: 'Invalid status' }]
      });
    });

    it('should handle empty update data', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = createMockRequest({
        params: { id: '1' },
        body: {}
      });

      // Act
      await controller.updateOrder(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'No update data provided'
      });
    });

    it('should handle service errors', async () => {
      // Arrange - Clean update error
      mockOrderService.updateOrder.mockRejectedValue(new Error('Database connection failed'));

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = createMockRequest({
        params: { id: '1' },
        body: { status: 'confirmed' }
      });

      // Act
      await controller.updateOrder(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update order',
        error: 'Database connection failed'
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      // Arrange - Clean status update
      mockOrderService.updateOrderStatus.mockResolvedValue(createTestOrder());

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const statusUpdate = {
        status: 'confirmed' as const,
        notes: 'Order confirmed by admin'
      };

      mockRequest = createMockRequest({
        params: { id: '1' },
        body: statusUpdate,
        user: { id: 1 } // Mock authenticated user
      } as any);

      // Act
      await controller.updateOrderStatus(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(1, 'confirmed', 'Order confirmed by admin', 1);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { order: createTestOrder() },
        message: 'Order status updated successfully'
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult({
        isEmpty: () => false,
        array: () => [{ field: 'status', message: 'Invalid status' }]
      }));

      mockRequest = createMockRequest({
        params: { id: '1' },
        body: { status: 'invalid' }
      });

      // Act
      await controller.updateOrderStatus(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'status', message: 'Invalid status' }]
      });
    });

    it('should handle service errors', async () => {
      // Arrange - Clean status error
      mockOrderService.updateOrderStatus.mockRejectedValue(new Error('Database connection failed'));

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = createMockRequest({
        params: { id: '1' },
        body: { status: 'confirmed' },
        user: { id: 1 }
      } as any);

      // Act
      await controller.updateOrderStatus(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update order status',
        error: 'Database connection failed'
      });
    });
  });

  describe('getOrderStatusHistory', () => {
    it('should return order status history successfully', async () => {
      // Arrange - Clean history test
      mockOrderService.getOrderStatusHistory.mockResolvedValue(createTestStatusHistory());

      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      // Act
      await controller.getOrderStatusHistory(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockOrderService.getOrderStatusHistory).toHaveBeenCalledWith(1);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { history: createTestStatusHistory() },
        message: 'Order status history retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      // Arrange - Clean history error
      mockOrderService.getOrderStatusHistory.mockRejectedValue(new Error('Database connection failed'));

      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      // Act
      await controller.getOrderStatusHistory(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch order status history',
        error: 'Database connection failed'
      });
    });
  });

  describe('orderValidators', () => {
    it('should validate getOrders correctly', () => {
      // Arrange
      const validators = orderValidators.getOrders;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate getOrderById correctly', () => {
      // Arrange
      const validators = orderValidators.getOrderById;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate createOrder correctly', () => {
      // Arrange
      const validators = orderValidators.createOrder;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate updateOrder correctly', () => {
      // Arrange
      const validators = orderValidators.updateOrder;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate updateOrderStatus correctly', () => {
      // Arrange
      const validators = orderValidators.updateOrderStatus;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });
  });
});