/**
 * 🌸 FloresYa Given-When-Then Structure - Silicon Valley Advanced Edition
 * Declarative test structure inspired by Behavior Driven Development
 */

import { vi } from 'vitest';
import { typeSafeDatabaseService } from '../../src/services/TypeSafeDatabaseService';
import { TestDataFactory } from './test-data-builders';
import { MockSetupUtils, TestExecutionUtils, TestAssertionUtils } from './test-scenario-utils';

// Given-When-Then Builder
export class GWTBuilder {
  private context: {
    given: (() => void) | null;
    when: (() => Promise<any>) | null;
    then: ((result: any) => void) | null;
    cleanup?: () => void;
  } = {
    given: null,
    when: null,
    then: null
  };

  private mockService: any = null;

  static forOrderService(): GWTBuilder {
    return new GWTBuilder();
  }

  // GIVEN methods
  givenValidOrderData(): this {
    this.context.given = () => {
      this.mockService = MockSetupUtils.setupSuccessfulOrderRetrieval(
        TestDataFactory.validOrder().build()
      );
    };
    return this;
  }

  givenEmptyDatabase(): this {
    this.context.given = () => {
      this.mockService = MockSetupUtils.setupSuccessfulOrderRetrieval(null);
    };
    return this;
  }

  givenDatabaseError(errorMessage: string = 'Database connection failed'): this {
    this.context.given = () => {
      this.mockService = MockSetupUtils.setupSuccessfulOrderRetrieval(null);
      // Override with error mock
      this.mockService.getClient.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: { message: errorMessage, code: 'DB_ERROR' }
              }))
            }))
          }))
        }))
      });
    };
    return this;
  }

  givenOrderWithStatus(status: string): this {
    this.context.given = () => {
      const order = TestDataFactory.order()
        .withStatus(status as any)
        .build();
      this.mockService = MockSetupUtils.setupSuccessfulOrderRetrieval(order);
    };
    return this;
  }

  givenOrderWithItems(count: number): this {
    this.context.given = () => {
      const order = TestDataFactory.orderWithMultipleItems().build();
      this.mockService = MockSetupUtils.setupSuccessfulOrderRetrieval(order);
    };
    return this;
  }

  givenProductValidation(productData: any): this {
    this.context.given = () => {
      this.mockService = MockSetupUtils.setupProductValidation(productData);
    };
    return this;
  }

  // WHEN methods
  whenGetOrders(params?: any): this {
    this.context.when = async () => {
      const { OrderService } = await import('../../src/services/OrderService');
      const service = new OrderService();
      return await service.getOrders(params);
    };
    return this;
  }

  whenGetOrderById(id: number): this {
    this.context.when = async () => {
      const { OrderService } = await import('../../src/services/OrderService');
      const service = new OrderService();
      return await service.getOrderById(id);
    };
    return this;
  }

  whenCreateOrder(orderData: any): this {
    this.context.when = async () => {
      const { OrderService } = await import('../../src/services/OrderService');
      const service = new OrderService();
      return await service.createOrder(orderData);
    };
    return this;
  }

  whenUpdateOrder(updateData: any): this {
    this.context.when = async () => {
      const { OrderService } = await import('../../src/services/OrderService');
      const service = new OrderService();
      return await service.updateOrder(updateData);
    };
    return this;
  }

  whenUpdateOrderStatus(orderId: number, status: string, notes?: string, userId?: number): this {
    this.context.when = async () => {
      const { OrderService } = await import('../../src/services/OrderService');
      const service = new OrderService();
      return await service.updateOrderStatus(orderId, status as any, notes, userId);
    };
    return this;
  }

  // THEN methods
  thenReturn(expectedResult: any): this {
    this.context.then = (result: any) => {
      expect(result).toEqual(expectedResult);
    };
    return this;
  }

  thenReturnNull(): this {
    this.context.then = (result: any) => {
      expect(result).toBeNull();
    };
    return this;
  }

  thenThrow(expectedMessage: string): this {
    this.context.then = async (result: any) => {
      await expect(result).rejects.toThrow(expectedMessage);
    };
    return this;
  }

  thenSatisfy(predicate: (result: any) => boolean): this {
    this.context.then = (result: any) => {
      expect(predicate(result)).toBe(true);
    };
    return this;
  }

  thenHaveOrderStructure(): this {
    this.context.then = (result: any) => {
      TestAssertionUtils.expectOrderStructure(result);
    };
    return this;
  }

  thenHavePaginatedStructure(): this {
    this.context.then = (result: any) => {
      TestAssertionUtils.expectPaginatedResponse(result);
    };
    return this;
  }

  thenHaveValidOrderItems(): this {
    this.context.then = (result: any) => {
      if (result.items && result.items.length > 0) {
        result.items.forEach((item: any) => {
          TestAssertionUtils.expectOrderItemStructure(item);
        });
      }
    };
    return this;
  }

  // Execute the test
  async execute(): Promise<void> {
    if (!this.context.given || !this.context.when || !this.context.then) {
      throw new Error('GWT test must have given, when, and then defined');
    }

    // Setup mocks
    this.context.given();

    try {
      // Execute test
      const result = await this.context.when();

      // Assert result
      await this.context.then(result);

      // Cleanup
      this.context.cleanup?.();
    } catch (error) {
      // Cleanup on error
      this.context.cleanup?.();
      throw error;
    }
  }

  cleanup(cleanupFn: () => void): this {
    this.context.cleanup = cleanupFn;
    return this;
  }
}

// Predefined GWT Test Scenarios
export const createGWTScenarios = {
  successfulOrderRetrieval: () =>
    GWTBuilder.forOrderService()
      .givenValidOrderData()
      .whenGetOrders()
      .thenHavePaginatedStructure(),

  orderNotFound: () =>
    GWTBuilder.forOrderService()
      .givenEmptyDatabase()
      .whenGetOrderById(999)
      .thenReturnNull(),

  databaseError: (errorMessage: string = 'Database connection failed') =>
    GWTBuilder.forOrderService()
      .givenDatabaseError(errorMessage)
      .whenGetOrders()
      .thenThrow(`Failed to fetch orders: ${errorMessage}`),

  orderCreationWithValidData: () =>
    GWTBuilder.forOrderService()
      .givenProductValidation(TestDataFactory.product().build())
      .whenCreateOrder({
        user_id: 1,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        items: [{ product_id: 1, quantity: 2, unit_price_usd: 75.00 }]
      })
      .thenHaveOrderStructure(),

  orderUpdate: () =>
    GWTBuilder.forOrderService()
      .givenValidOrderData()
      .whenUpdateOrder({ id: 1, status: 'confirmed' })
      .thenHaveOrderStructure(),

  orderStatusUpdate: () =>
    GWTBuilder.forOrderService()
      .givenValidOrderData()
      .whenUpdateOrderStatus(1, 'confirmed', 'Order confirmed by admin', 1)
      .thenHaveOrderStructure()
};

// Test Runner for GWT
export class GWTRunner {
  static async run(testName: string, gwtBuilder: GWTBuilder): Promise<void> {
    try {
      await gwtBuilder.execute();
      console.log(`✅ ${testName} - PASSED`);
    } catch (error) {
      console.error(`❌ ${testName} - FAILED:`, error);
      throw error;
    }
  }

  static async runMultiple(tests: Array<{ name: string; test: GWTBuilder }>): Promise<void> {
    for (const { name, test } of tests) {
      await this.run(name, test);
    }
  }
}