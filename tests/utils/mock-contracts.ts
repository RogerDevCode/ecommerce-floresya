/**
 * 🌸 FloresYa Mock Contracts - Silicon Valley Advanced Edition
 * Define interfaces and contracts for consistent mocking across all tests
 */

import { vi } from 'vitest';

// Database Service Contract
export interface DatabaseServiceContract {
  getClient(): SupabaseClientContract;
  executeRpc(functionName: string, params?: any): Promise<any>;
}

export interface SupabaseClientContract {
  from(table: string): QueryBuilderContract;
}

export interface QueryBuilderContract {
  select(columns?: string): QueryBuilderContract;
  eq(column: string, value: any): QueryBuilderContract;
  ilike(column: string, pattern: string): QueryBuilderContract;
  gte(column: string, value: any): QueryBuilderContract;
  lte(column: string, value: any): QueryBuilderContract;
  order(column: string, options?: { ascending?: boolean }): QueryBuilderContract;
  limit(count: number): QueryBuilderContract;
  range(from: number, to: number): QueryBuilderContract;
  in(column: string, values: any[]): QueryBuilderContract;
  or(condition: string): QueryBuilderContract;
  single(): Promise<{ data: any; error: any }>;
  then(resolve: Function): Promise<{ data: any; error: any }>;
}

// Test Scenario Contracts
export interface TestScenario<T = any> {
  name: string;
  given: () => void;
  when: () => Promise<T>;
  then: (result: T) => void;
  cleanup?: () => void;
}

export interface MockScenario {
  databaseState?: Record<string, any[]>;
  rpcResponses?: Record<string, any>;
  errors?: Record<string, any>;
  customMocks?: Record<string, any>;
}

// Test Data Builder Contract
export interface TestDataBuilder<T> {
  with(overrides: Partial<T>): TestDataBuilder<T>;
  build(): T;
  buildMany(count: number): T[];
}

// Mock Factory Contract
export interface MockFactory<T> {
  create(overrides?: Partial<T>): T;
  createMany(count: number, overrides?: Partial<T>): T[];
  reset(): void;
}

// Common Test Result Types
export interface TestResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

// Error Types for Testing
export interface TestError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

// Mock Response Builder
export class MockResponseBuilder {
  private data: any = null;
  private error: any = null;
  private count: number = 0;

  static success<T>(data: T, count: number = 1): MockResponseBuilder {
    return new MockResponseBuilder().withData(data).withCount(count);
  }

  static error(error: any): MockResponseBuilder {
    return new MockResponseBuilder().withError(error);
  }

  static empty(count: number = 0): MockResponseBuilder {
    return new MockResponseBuilder().withCount(count);
  }

  withData(data: any): this {
    this.data = data;
    return this;
  }

  withError(error: any): this {
    this.error = error;
    return this;
  }

  withCount(count: number): this {
    this.count = count;
    return this;
  }

  build(): { data: any; error: any; count?: number } {
    return {
      data: this.data,
      error: this.error,
      count: this.count
    };
  }
}

// Query Chain Builder for Complex Mocks
export class QueryChainBuilder {
  private operations: string[] = [];
  private finalResult: any = { data: null, error: null };

  select(columns?: string): this {
    this.operations.push(`select(${columns || '*'})`);
    return this;
  }

  eq(column: string, value: any): this {
    this.operations.push(`eq(${column}, ${value})`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.operations.push(`order(${column}, ${JSON.stringify(options)})`);
    return this;
  }

  range(from: number, to: number): this {
    this.operations.push(`range(${from}, ${to})`);
    return this;
  }

  single(): this {
    this.operations.push('single()');
    return this;
  }

  returns(result: any): this {
    this.finalResult = result;
    return this;
  }

  build(): any {
    const mockChain = {
      ...this.finalResult,
      _operations: this.operations
    };

    // Make all methods chainable
    this.operations.forEach(op => {
      const methodName = op.split('(')[0];
      mockChain[methodName] = vi.fn().mockReturnValue(mockChain);
    });

    return mockChain;
  }
}