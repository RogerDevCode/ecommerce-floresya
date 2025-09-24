/**
 * 🌸 FloresYa Test Scenarios - Silicon Valley Advanced Edition
 * Declarative test scenarios for complex business logic testing
 */

import { vi } from 'vitest';
import { typeSafeDatabaseService } from '../../src/services/TypeSafeDatabaseService.js';
import { TestScenario, MockScenario, TestResult } from './mock-contracts.js';

// Scenario Builder for OrderService Tests
export class OrderServiceScenarioBuilder {
  private scenario: Partial<TestScenario> = {};
  private mockSetup: MockScenario = {};

  static forOrderService(): OrderServiceScenarioBuilder {
    return new OrderServiceScenarioBuilder();
  }

  name(name: string): this {
    this.scenario.name = name;
    return this;
  }

  givenDatabaseState(state: Record<string, any[]>): this {
    this.mockSetup.databaseState = state;
    return this;
  }

  givenRpcResponse(functionName: string, response: any): this {
    this.mockSetup.rpcResponses = {
      ...this.mockSetup.rpcResponses,
      [functionName]: response
    };
    return this;
  }

  givenError(error: any): this {
    this.mockSetup.errors = { general: error };
    return this;
  }

  whenGetOrders(params?: any): this {
    this.scenario.when = async () => {
      this.setupMocks();
      const { OrderService } = await import('../../src/services/OrderService.js');
      const service = new OrderService();
      return await service.getOrders(params);
    };
    return this;
  }

  whenGetOrderById(id: number): this {
    this.scenario.when = async () => {
      this.setupMocks();
      const { OrderService } = await import('../../src/services/OrderService.js');
      const service = new OrderService();
      return await service.getOrderById(id);
    };
    return this;
  }

  whenCreateOrder(orderData: any): this {
    this.scenario.when = async () => {
      this.setupMocks();
      const { OrderService } = await import('../../src/services/OrderService.js');
      const service = new OrderService();
      return await service.createOrder(orderData);
    };
    return this;
  }

  whenUpdateOrder(updateData: any): this {
    this.scenario.when = async () => {
      this.setupMocks();
      const { OrderService } = await import('../../src/services/OrderService.js');
      const service = new OrderService();
      return await service.updateOrder(updateData);
    };
    return this;
  }

  whenUpdateOrderStatus(orderId: number, status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled', notes?: string, userId?: number): this {
    this.scenario.when = async () => {
      this.setupMocks();
      const { OrderService } = await import('../../src/services/OrderService.js');
      const service = new OrderService();
      return await service.updateOrderStatus(orderId, status, notes, userId);
    };
    return this;
  }

  whenGetOrderStatusHistory(orderId: number): this {
    this.scenario.when = async () => {
      this.setupMocks();
      const { OrderService } = await import('../../src/services/OrderService.js');
      const service = new OrderService();
      return await service.getOrderStatusHistory(orderId);
    };
    return this;
  }

  thenReturn(expectedResult: any): this {
    this.scenario.then = (result: any) => {
      expect(result).toEqual(expectedResult);
    };
    return this;
  }

  thenThrow(expectedError: string): this {
    this.scenario.then = async (result: any) => {
      await expect(result).rejects.toThrow(expectedError);
    };
    return this;
  }

  thenMatchObject(expectedShape: any): this {
    this.scenario.then = (result: any) => {
      expect(result).toMatchObject(expectedShape);
    };
    return this;
  }

  thenSatisfy(predicate: (result: any) => boolean): this {
    this.scenario.then = (result: any) => {
      expect(predicate(result)).toBe(true);
    };
    return this;
  }

  cleanup(cleanupFn: () => void): this {
    this.scenario.cleanup = cleanupFn;
    return this;
  }

  build(): TestScenario {
    if (!this.scenario.name || !this.scenario.when || !this.scenario.then) {
      throw new Error('TestScenario must have name, when, and then defined');
    }

    return {
      name: this.scenario.name,
      given: () => this.setupMocks(),
      when: this.scenario.when,
      then: this.scenario.then,
      cleanup: this.scenario.cleanup
    };
  }

  private setupMocks(): void {
    const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);

    // Setup database state
    if (this.mockSetup.databaseState) {
      this.setupDatabaseState(mockTypeSafeDatabaseService);
    }

    // Setup RPC responses
    if (this.mockSetup.rpcResponses) {
      this.setupRpcResponses(mockTypeSafeDatabaseService);
    }

    // Setup errors
    if (this.mockSetup.errors) {
      this.setupErrors(mockTypeSafeDatabaseService);
    }
  }

  private setupDatabaseState(mockService: any): void {
    mockService.getClient.mockReturnValue({
      from: vi.fn((tableName: string) => {
        const tableData = this.mockSetup.databaseState![tableName] || [];

        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: tableData[0], error: null })),
              order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({ data: tableData, error: null, count: tableData.length }))
              }))
            })),
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: tableData, error: null, count: tableData.length }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: tableData[0], error: null }))
              }))
            }))
          }))
        };
      })
    });
  }

  private setupRpcResponses(mockService: any): void {
    mockService.executeRpc.mockImplementation((functionName: string, params: any) => {
      const response = this.mockSetup.rpcResponses![functionName];
      return Promise.resolve(response);
    });
  }

  private setupErrors(mockService: any): void {
    if (this.mockSetup.errors?.general) {
      mockService.getClient.mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: this.mockSetup.errors!.general })),
              order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({ data: null, error: this.mockSetup.errors!.general, count: null }))
              }))
            }))
          }))
        }))
      });
    }
  }
}

// Predefined Common Scenarios
export const createSuccessfulOrderRetrievalScenario = (): TestScenario => {
  return OrderServiceScenarioBuilder
    .forOrderService()
    .name('Successful order retrieval')
    .givenDatabaseState({
      orders: [{
        id: 1,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        status: 'pending',
        total_amount_usd: 150.00,
        created_at: '2024-01-01T00:00:00Z'
      }]
    })
    .whenGetOrders()
    .thenSatisfy((result: any) => result.orders.length === 1)
    .build();
};

export const createOrderNotFoundScenario = (): TestScenario => {
  return OrderServiceScenarioBuilder
    .forOrderService()
    .name('Order not found')
    .givenDatabaseState({ orders: [] })
    .whenGetOrderById(999)
    .thenReturn(null)
    .build();
};

export const createDatabaseErrorScenario = (errorMessage: string): TestScenario => {
  return OrderServiceScenarioBuilder
    .forOrderService()
    .name('Database error scenario')
    .givenError({ message: errorMessage, code: 'DB_ERROR' })
    .whenGetOrders()
    .thenThrow(`Failed to fetch orders: ${errorMessage}`)
    .build();
};

// Scenario Runner
export class ScenarioRunner {
  static async run(scenario: TestScenario): Promise<TestResult> {
    try {
      scenario.given();
      const result = await scenario.when();
      scenario.then(result);
      scenario.cleanup?.();

      return {
        success: true,
        data: result,
        metadata: { scenarioName: scenario.name }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { scenarioName: scenario.name }
      };
    }
  }

  static async runMultiple(scenarios: TestScenario[]): Promise<TestResult[]> {
    return Promise.all(scenarios.map(scenario => this.run(scenario)));
  }
}