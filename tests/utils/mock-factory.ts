/**
 * 🌸 FloresYa Mock Factory - Silicon Valley Advanced Edition
 * Centralized mock creation with consistent behavior and easy maintenance
 */

import { vi } from 'vitest';
import { MockFactory, QueryBuilderContract, SupabaseClientContract } from './mock-contracts.js';

// Base Mock Factory
export abstract class BaseMockFactory<T> implements MockFactory<T> {
  protected instances: T[] = [];
  protected defaultData: T;

  constructor(defaultData: T) {
    this.defaultData = defaultData;
  }

  create(overrides: Partial<T> = {}): T {
    const instance = { ...this.defaultData, ...overrides } as T;
    this.instances.push(instance);
    return instance;
  }

  createMany(count: number, overrides: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  reset(): void {
    this.instances = [];
  }

  getInstances(): T[] {
    return [...this.instances];
  }
}

// Database Service Mock Factory
export class DatabaseServiceMockFactory extends BaseMockFactory<any> {
  constructor() {
    super({
      getClient: vi.fn(),
      executeRpc: vi.fn()
    });
  }

  create(overrides: any = {}): any {
    const mockService = super.create(overrides);

    // Setup default client behavior
    const mockClient = this.createSupabaseClient();
    mockService.getClient.mockReturnValue(mockClient);

    // Setup default RPC behavior
    if (!overrides.executeRpc) {
      mockService.executeRpc.mockResolvedValue(null);
    }

    return mockService;
  }

  private createSupabaseClient(): SupabaseClientContract {
    return {
      from: vi.fn((tableName: string) => this.createQueryBuilder(tableName))
    };
  }

  private createQueryBuilder(tableName: string): QueryBuilderContract {
    const queryBuilder: any = {};

    // Make all methods chainable and return the builder
    const methods = ['select', 'eq', 'ilike', 'gte', 'lte', 'order', 'limit', 'range', 'in', 'or'];
    methods.forEach(method => {
      queryBuilder[method] = vi.fn().mockReturnValue(queryBuilder);
    });

    // Setup default responses
    queryBuilder.single = vi.fn().mockResolvedValue({ data: null, error: null });
    queryBuilder.then = vi.fn((resolve: Function) => resolve({ data: [], error: null }));

    return queryBuilder;
  }

  withRpcResponse(functionName: string, response: any): this {
    const lastInstance = this.instances[this.instances.length - 1];
    if (lastInstance) {
      lastInstance.executeRpc.mockImplementation((name: string) => {
        if (name === functionName) {
          return Promise.resolve(response);
        }
        return Promise.resolve(null);
      });
    }
    return this;
  }

  withQueryResponse(tableName: string, response: any): this {
    const lastInstance = this.instances[this.instances.length - 1];
    if (lastInstance) {
      const mockClient = lastInstance.getClient();
      const mockQueryBuilder = mockClient.from(tableName);

      // Override the chain methods to return the response
      mockQueryBuilder.then = vi.fn((resolve: Function) => resolve(response));
      mockQueryBuilder.single = vi.fn().mockResolvedValue(response);
    }
    return this;
  }
}

// Query Builder Mock Factory
export class QueryBuilderMockFactory extends BaseMockFactory<any> {
  private tableName: string;

  constructor(tableName: string) {
    super({});
    this.tableName = tableName;
  }

  create(overrides: any = {}): any {
    const queryBuilder: any = super.create(overrides);

    // Make all methods chainable
    const methods = ['select', 'eq', 'ilike', 'gte', 'lte', 'order', 'limit', 'range', 'in', 'or'];
    methods.forEach(method => {
      queryBuilder[method] = vi.fn().mockReturnValue(queryBuilder);
    });

    // Setup default responses
    queryBuilder.single = vi.fn().mockResolvedValue({ data: null, error: null });
    queryBuilder.then = vi.fn((resolve: Function) => resolve({ data: [], error: null }));

    return queryBuilder;
  }

  withSingleResponse(response: any): this {
    const lastInstance = this.instances[this.instances.length - 1];
    if (lastInstance) {
      lastInstance.single.mockResolvedValue(response);
    }
    return this;
  }

  withChainResponse(response: any): this {
    const lastInstance = this.instances[this.instances.length - 1];
    if (lastInstance) {
      lastInstance.then = vi.fn((resolve: Function) => resolve(response));
    }
    return this;
  }
}

// HTTP Request/Response Mock Factory
export class HttpMockFactory {
  static createRequest(overrides: any = {}): any {
    return {
      params: {},
      query: {},
      body: {},
      headers: {},
      method: 'GET',
      ...overrides
    };
  }

  static createResponse(): any {
    const res: any = {};

    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    res.setHeader = vi.fn().mockReturnValue(res);

    return res;
  }

  static createErrorResponse(message: string, statusCode: number = 500): any {
    const res = this.createResponse();
    res.status.mockReturnValue(res);
    res.json.mockImplementation((data: any) => {
      throw new Error(`${statusCode}: ${message}`);
    });
    return res;
  }
}

// Error Mock Factory
export class ErrorMockFactory {
  private data: any;

  constructor() {
    this.data = {
      message: 'Mock error',
      code: 'MOCK_ERROR',
      statusCode: 500
    };
  }

  withMessage(message: string): ErrorMockFactory {
    this.data.message = message;
    return this;
  }

  withCode(code: string): ErrorMockFactory {
    this.data.code = code;
    return this;
  }

  withStatusCode(statusCode: number): ErrorMockFactory {
    this.data.statusCode = statusCode;
    return this;
  }

  databaseError(): ErrorMockFactory {
    return this.withMessage('Database connection failed').withCode('DB_ERROR').withStatusCode(500);
  }

  notFoundError(): ErrorMockFactory {
    return this.withMessage('Resource not found').withCode('NOT_FOUND').withStatusCode(404);
  }

  validationError(): ErrorMockFactory {
    return this.withMessage('Validation failed').withCode('VALIDATION_ERROR').withStatusCode(400);
  }

  build(): any {
    return { ...this.data };
  }
}

// Success Response Mock Factory
export class SuccessResponseMockFactory {
  private data: any;

  constructor() {
    this.data = {
      success: true,
      message: 'Success',
      data: null
    };
  }

  withData(data: any): SuccessResponseMockFactory {
    this.data.data = data;
    return this;
  }

  withMessage(message: string): SuccessResponseMockFactory {
    this.data.message = message;
    return this;
  }

  withMetadata(metadata: Record<string, any>): SuccessResponseMockFactory {
    this.data.metadata = metadata;
    return this;
  }

  build(): any {
    return { ...this.data };
  }
}

// Main Mock Factory Registry
export class MockFactoryRegistry {
  private static instance: MockFactoryRegistry;
  private factories: Map<string, any> = new Map();

  static getInstance(): MockFactoryRegistry {
    if (!MockFactoryRegistry.instance) {
      MockFactoryRegistry.instance = new MockFactoryRegistry();
    }
    return MockFactoryRegistry.instance;
  }

  register(name: string, factory: any): void {
    this.factories.set(name, factory);
  }

  get<T>(name: string): T {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Mock factory '${name}' not found`);
    }
    return factory;
  }

  create<T>(name: string, overrides?: any): T {
    const factory = this.get<any>(name);
    return factory.create(overrides);
  }

  resetAll(): void {
    this.factories.forEach(factory => factory.reset?.());
  }
}

// Pre-configured Mock Factories
export const createDatabaseServiceMock = () => new DatabaseServiceMockFactory();
export const createQueryBuilderMock = (tableName: string) => new QueryBuilderMockFactory(tableName);
export const createErrorMock = () => new ErrorMockFactory();
export const createSuccessResponseMock = () => new SuccessResponseMockFactory();

// Initialize registry with common factories
const registry = MockFactoryRegistry.getInstance();
registry.register('databaseService', new DatabaseServiceMockFactory());
registry.register('error', new ErrorMockFactory());
registry.register('successResponse', new SuccessResponseMockFactory());