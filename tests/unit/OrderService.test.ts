/**
 * 🌸 FloresYa OrderService Unit Tests - Basic Edition
 * Simple tests for OrderService functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Create hoisted mocks
const mockTypeSafeDatabaseService = vi.hoisted(() => ({
  getClient: vi.fn(),
  executeRpc: vi.fn()
}));

// Mock the TypeSafeDatabaseService module with hoisted values
vi.mock('../../src/services/TypeSafeDatabaseService', () => ({
  typeSafeDatabaseService: mockTypeSafeDatabaseService
}));

// Import after mocking
import { typeSafeDatabaseService } from '../../src/services/TypeSafeDatabaseService';
import { OrderService } from '../../src/services/OrderService';

// Helper functions for test data
function createTestOrder() {
  return {
    id: 1,
    user_id: 1,
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    status: 'pending',
    total_amount_usd: 150,
    created_at: '2024-01-01T00:00:00Z'
  };
}

function createTestOrderWithItems() {
  return {
    id: 1,
    user_id: 1,
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    status: 'pending',
    total_amount_usd: 150,
    created_at: '2024-01-01T00:00:00Z',
    order_items: [
      {
        id: 1,
        product_id: 1,
        quantity: 2,
        unit_price_usd: 75,
        subtotal_usd: 150
      }
    ]
  };
}

function createTestProduct(overrides = {}) {
  return {
    id: 1,
    name: 'Rose Bouquet',
    summary: 'Beautiful red roses',
    price_usd: 75,
    stock: 10,
    is_active: true,
    ...overrides
  };
}

function createTestError(message: string) {
  return {
    message,
    code: 'TEST_ERROR'
  };
}

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = new OrderService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should return orders successfully', async () => {
      // Arrange
      const mockOrders = [
        {
          id: 1,
          user_id: 1,
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          status: 'pending',
          total_amount_usd: 150,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockQueryBuilder = {
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockOrders,
          error: null,
          count: 1
        }),
        in: vi.fn().mockReturnThis()
      };

      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => mockQueryBuilder)
        }))
      };

      (typeSafeDatabaseService.getClient as any).mockReturnValue(mockClient);

      // Act
      const result = await orderService.getOrders();

      // Assert
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0]).toMatchObject({
        id: 1,
        user_id: 1,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        status: 'pending',
        total_amount_usd: 150,
        created_at: '2024-01-01T00:00:00Z'
      });
      expect(result.pagination?.total_items).toBe(1);
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockQueryBuilder = {
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
          count: null
        }),
        in: vi.fn().mockReturnThis()
      };

      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => mockQueryBuilder)
        }))
      };

      (typeSafeDatabaseService.getClient as any).mockReturnValue(mockClient);

      // Act & Assert
      await expect(orderService.getOrders()).rejects.toThrow('Failed to fetch orders: Database connection failed');
    });
  });

  describe('getOrderById', () => {
    it('should return order successfully', async () => {
      // Arrange
      const mockOrderWithDetails = {
        ...createTestOrder(),
        order_items: [],
        payments: [],
        order_status_history: [],
        users: {
          id: 1,
          full_name: 'Test User',
          email: 'test@example.com'
        }
      };

      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockOrderWithDetails,
                error: null
              }))
            }))
          }))
        }))
      };

      mockTypeSafeDatabaseService.getClient.mockReturnValue(mockClient);

      // Act
      const result = await orderService.getOrderById(1);

      // Assert
      expect(result).toMatchObject({
        id: 1,
        user_id: 1,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        status: 'pending',
        total_amount_usd: 150,
        created_at: '2024-01-01T00:00:00Z',
        order_items: [],
        payments: [],
        order_status_history: [],
        users: {
          id: 1,
          full_name: 'Test User',
          email: 'test@example.com'
        }
      });
    });

    it('should return null for non-existent order', async () => {
      // Arrange
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' }
              }))
            }))
          }))
        }))
      };

      vi.mocked(typeSafeDatabaseService).getClient.mockReturnValue(mockClient as any);

      // Act
      const result = await orderService.getOrderById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      // Arrange
      const mockOrder = createTestOrder();

      const orderData = {
        user_id: 1,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '+1234567890',
        delivery_address: '123 Test Street',
        delivery_date: '2024-12-25',
        notes: 'Test order',
        items: [
          {
            product_id: 1,
            quantity: 2,
            unit_price_usd: 75.00,
            unit_price_ves: 37500.00
          }
        ]
      };

      const mockProducts = [
        {
          id: 1,
          name: 'Rose Bouquet',
          summary: 'Beautiful red roses',
          price_usd: 75,
          stock: 10
        }
      ];

      // Create separate mock query builders for different tables
      const mockProductQueryBuilder = {
        select: vi.fn(() => ({
          in: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: mockProducts,
            error: null
          })
        }))
      };

      const mockOrderQueryBuilder = {
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockProducts,
          error: null,
          count: mockProducts.length
        }),
        single: vi.fn().mockResolvedValue({
          data: mockProducts[0],
          error: null
        }),
        order: vi.fn().mockReturnThis()
      };

      const mockClient = {
        from: vi.fn((tableName) => {
          if (tableName === 'products') {
            return mockProductQueryBuilder;
          }
          return mockOrderQueryBuilder;  // Default for other tables
        })
      };

      mockTypeSafeDatabaseService.getClient.mockReturnValue(mockClient);
      mockTypeSafeDatabaseService.executeRpc.mockResolvedValue(mockOrder);

      // Act
      const result = await orderService.createOrder(orderData);

      // Assert
      expect(result).toEqual(mockOrder);
    });

    it('should handle RPC failure', async () => {
      // Arrange
      const orderData = {
        user_id: 1,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        items: [
          {
            product_id: 1,
            quantity: 2,
            unit_price_usd: 75.00,
            unit_price_ves: 37500.00
          }
        ]
      };

      const mockProducts = [
        {
          id: 1,
          name: 'Rose Bouquet',
          summary: 'Beautiful red roses',
          price_usd: 75,
          stock: 10
        }
      ];

      // Create separate mock query builders for different tables
      const mockProductQueryBuilder = {
        select: vi.fn(() => ({
          in: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: mockProducts,
            error: null
          })
        }))
      };

      const mockOrderQueryBuilder = {
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockProducts,
          error: null,
          count: mockProducts.length
        }),
        single: vi.fn().mockResolvedValue({
          data: mockProducts[0],
          error: null
        }),
        order: vi.fn().mockReturnThis()
      };

      const mockClient = {
        from: vi.fn((tableName) => {
          if (tableName === 'products') {
            return mockProductQueryBuilder;
          }
          return mockOrderQueryBuilder;  // Default for other tables
        })
      };

      mockTypeSafeDatabaseService.getClient.mockReturnValue(mockClient);
      mockTypeSafeDatabaseService.executeRpc.mockResolvedValue(null);

      // Act & Assert
      await expect(orderService.createOrder(orderData)).rejects.toThrow('No data returned from order creation transaction');
    });
  });

  describe('updateOrder', () => {
    it('should update order successfully', async () => {
      // Arrange
      const mockOrder = createTestOrder();

      const updateData = {
        id: 1,
        status: 'confirmed' as const,
        notes: 'Updated order'
      };

      const mockQueryBuilder = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockOrder,
                error: null
              }))
            }))
          }))
        }))
      };

      const mockClient = {
        from: vi.fn(() => mockQueryBuilder)
      };

      vi.mocked(typeSafeDatabaseService).getClient.mockReturnValue(mockClient as any);

      // Act
      const result = await orderService.updateOrder(updateData);

      // Assert
      expect(result).toEqual(mockOrder);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      // Arrange
      const mockOrder = createTestOrder();

      mockTypeSafeDatabaseService.executeRpc.mockResolvedValue(mockOrder);

      // Act
      const result = await orderService.updateOrderStatus(1, 'confirmed', 'Order confirmed by admin', 1);

      // Assert
      expect(result).toEqual(mockOrder);
    });
  });

  describe('getOrderStatusHistory', () => {
    it('should return order status history successfully', async () => {
      // Arrange
      const mockStatusHistory = [
        {
          id: 1,
          order_id: 1,
          status: 'pending',
          notes: 'Order created',
          user_id: 1,
          created_at: '2024-01-01T00:00:00Z',
          users: {
            full_name: 'Admin User'
          }
        }
      ];

      const mockQueryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: mockStatusHistory,
              error: null
            }))
          }))
        }))
      };

      const mockClient = {
        from: vi.fn(() => mockQueryBuilder)
      };

      vi.mocked(typeSafeDatabaseService).getClient.mockReturnValue(mockClient as any);

      // Act
      const result = await orderService.getOrderStatusHistory(1);

      // Assert
      expect(result).toEqual(mockStatusHistory);
    });
  });
});