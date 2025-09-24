/**
 * 🌸 FloresYa Test Scenario Utilities - Silicon Valley Advanced Edition
 * Common test scenarios and utilities for consistent testing patterns
 */

import { vi } from 'vitest';
import { typeSafeDatabaseService } from '../../src/services/TypeSafeDatabaseService.js';
import { TestDataFactory } from './test-data-builders.js';
import { createDatabaseServiceMock, createErrorMock } from './mock-factory.js';

// Common Test Scenarios
export const CommonScenarios = {
  // Database scenarios
  databaseError: (errorMessage: string = 'Database connection failed') => {
    const mockService = createDatabaseServiceMock().create();
    mockService.getClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: createErrorMock().withMessage(errorMessage).build()
            }))
          }))
        }))
      }))
    });
    return mockService;
  },

  emptyResult: () => {
    const mockService = createDatabaseServiceMock().create();
    mockService.getClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
            }))
          }))
        }))
      }))
    });
    return mockService;
  },

  successfulOrderCreation: (orderData: any) => {
    const mockService = createDatabaseServiceMock().create();
    mockService.executeRpc.mockResolvedValue(orderData);
    return mockService;
  },

  // Product scenarios
  productNotFound: () => {
    const mockService = createDatabaseServiceMock().create();
    mockService.getClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    });
    return mockService;
  },

  insufficientStock: (availableStock: number = 1) => {
    const product = TestDataFactory.product()
      .withStock(availableStock)
      .build();

    const mockService = createDatabaseServiceMock().create();
    mockService.getClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [product], error: null }))
          }))
        }))
      }))
    });
    return mockService;
  },

  invalidPrice: () => {
    const product = TestDataFactory.product()
      .withInvalidPrice()
      .build();

    const mockService = createDatabaseServiceMock().create();
    mockService.getClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [product], error: null }))
          }))
        }))
      }))
    });
    return mockService;
  }
};

// Test Data Scenarios
export const TestDataScenarios = {
  validOrder: () => TestDataFactory.validOrder().build(),

  orderWithMultipleItems: () => TestDataFactory.orderWithMultipleItems().build(),

  orderWithStatusHistory: () => TestDataFactory.orderWithStatusHistory().build(),

  featuredProduct: () => TestDataFactory.featuredProduct().build(),

  outOfStockProduct: () => TestDataFactory.outOfStockProduct().build(),

  orderWithPayment: () => TestDataFactory.order()
    .addItem(1, 2, 75.00)
    .addPayment(150.00, 'credit_card')
    .build(),

  orderWithDeliveryInfo: () => TestDataFactory.order()
    .withCustomerInfo('John Doe', 'john@example.com', '+1234567890')
    .withDeliveryInfo('123 Main St', '2024-12-25')
    .addItem(1, 1, 100.00)
    .build(),

  bulkOrder: () => TestDataFactory.order()
    .addItem(1, 5, 50.00)
    .addItem(2, 3, 75.00)
    .addItem(3, 2, 100.00)
    .addPayment(850.00, 'bank_transfer')
    .build()
};

// Mock Setup Utilities
export class MockSetupUtils {
  static setupSuccessfulOrderRetrieval(orderData: any) {
    const mockService = createDatabaseServiceMock().create();
    mockService.getClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({
                data: [orderData],
                error: null,
                count: 1
              }))
            }))
          }))
        }))
      }))
    });
    return mockService;
  }

  static setupOrderUpdate(updateData: any, updatedOrder: any) {
    const mockService = createDatabaseServiceMock().create();
    mockService.getClient.mockReturnValue({
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: updatedOrder,
                error: null
              }))
            }))
          }))
        }))
      }))
    });
    return mockService;
  }

  static setupOrderStatusUpdate(orderId: number, newStatus: string, updatedOrder: any) {
    const mockService = createDatabaseServiceMock().create();
    mockService.executeRpc.mockImplementation((functionName: string, params: any) => {
      if (functionName === 'update_order_status' && params.order_id === orderId) {
        return Promise.resolve(updatedOrder);
      }
      return Promise.resolve(null);
    });
    return mockService;
  }

  static setupProductValidation(productData: any) {
    const mockService = createDatabaseServiceMock().create();
    mockService.getClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: [productData],
              error: null
            }))
          }))
        }))
      }))
    });
    return mockService;
  }
}

// Test Assertion Utilities
export class TestAssertionUtils {
  static expectOrderStructure(order: any) {
    expect(order).toHaveProperty('id');
    expect(order).toHaveProperty('customer_name');
    expect(order).toHaveProperty('customer_email');
    expect(order).toHaveProperty('status');
    expect(order).toHaveProperty('total_amount_usd');
    expect(order).toHaveProperty('created_at');
  }

  static expectPaginatedResponse(response: any) {
    expect(response).toHaveProperty('orders');
    expect(response).toHaveProperty('pagination');
    expect(response.pagination).toHaveProperty('current_page');
    expect(response.pagination).toHaveProperty('total_pages');
    expect(response.pagination).toHaveProperty('total_items');
    expect(response.pagination).toHaveProperty('items_per_page');
  }

  static expectErrorResponse(error: any, expectedMessage: string, expectedCode?: string) {
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain(expectedMessage);
    if (expectedCode) {
      expect(error.message).toContain(expectedCode);
    }
  }

  static expectOrderItemStructure(item: any) {
    expect(item).toHaveProperty('product_id');
    expect(item).toHaveProperty('product_name');
    expect(item).toHaveProperty('quantity');
    expect(item).toHaveProperty('unit_price_usd');
    expect(item).toHaveProperty('subtotal_usd');
  }
}

// Test Execution Utilities
export class TestExecutionUtils {
  static async withMockedService<T>(
    mockSetup: () => any,
    testFunction: () => Promise<T>
  ): Promise<T> {
    const mockService = mockSetup();
    vi.mocked(typeSafeDatabaseService).getClient.mockReturnValue(mockService.getClient());
    vi.mocked(typeSafeDatabaseService).executeRpc.mockImplementation(mockService.executeRpc);

    try {
      return await testFunction();
    } finally {
      vi.clearAllMocks();
    }
  }

  static async expectToThrowWithMessage<T>(
    testFunction: () => Promise<T>,
    expectedMessage: string
  ): Promise<void> {
    await expect(testFunction()).rejects.toThrow(expectedMessage);
  }

  static createTestTimeout(milliseconds: number = 5000) {
    return { timeout: milliseconds };
  }
}

// Test Data Validation Utilities
export class TestDataValidationUtils {
  static isValidOrderId(id: any): boolean {
    return typeof id === 'number' && id > 0;
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone);
  }

  static isValidOrderStatus(status: string): boolean {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    return validStatuses.includes(status);
  }

  static isValidCurrency(amount: number): boolean {
    return typeof amount === 'number' && amount >= 0 && amount < 1000000;
  }
}