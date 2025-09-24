/**
 * 🌸 FloresYa Test Mocks - Silicon Valley Simple Edition
 * Ultra-simple mock utilities for consistent testing
 */

import { vi } from 'vitest';

// Simple Mock Builder for Supabase
export class SimpleSupabaseMock {
  private mockData: Map<string, any[]> = new Map();
  private mockError: any = null;

  constructor() {
    // Initialize with empty arrays for common tables
    this.mockData.set('products', []);
    this.mockData.set('occasions', []);
    this.mockData.set('product_images', []);
    this.mockData.set('product_occasions', []);
    this.mockData.set('settings', []);
  }

  // Set mock data for a specific table
  setTableData(tableName: string, data: any[]) {
    this.mockData.set(tableName, data);
    return this;
  }

  // Set error for all operations
  setError(error: any) {
    this.mockError = error;
    return this;
  }

  // Create the mock Supabase client
  build(): any {
    const self = this;
    const mockSupabase = {
      from: vi.fn((tableName: string) => {
        const tableData = self.mockData.get(tableName) || [];

        return {
          select: vi.fn(() => self),
          eq: vi.fn(() => self),
          order: vi.fn(() => self),
          limit: vi.fn(() => self),
          range: vi.fn(() => self),
          ilike: vi.fn(() => self),
          or: vi.fn(() => self),
          single: vi.fn(() => self),
          then: vi.fn((resolve: Function) => {
            resolve({ data: tableData, error: self.mockError });
          })
        };
      })
    };

    return mockSupabase;
  }
}

// Quick mock setup functions
export const createSimpleProductMock = (products: any[] = []) => {
  return new SimpleSupabaseMock()
    .setTableData('products', products)
    .build();
};

export const createSimpleOccasionMock = (occasions: any[] = []) => {
  return new SimpleSupabaseMock()
    .setTableData('occasions', occasions)
    .build();
};

export const createSimpleImageMock = (images: any[] = []) => {
  return new SimpleSupabaseMock()
    .setTableData('product_images', images)
    .build();
};

// Mock HTTP Request/Response
export const createMockRequest = (options: any = {}) => ({
  params: options.params || {},
  query: options.query || {},
  body: options.body || {},
  headers: options.headers || {},
  method: options.method || 'GET',
  ...options
});

export const createMockResponse = () => {
  const res: any = {};

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);

  return res;
};

// Mock Service Methods
export const createMockService = (methods: Record<string, any>) => {
  const mockService: any = {};

  Object.keys(methods).forEach(methodName => {
    if (typeof methods[methodName] === 'function') {
      mockService[methodName] = vi.fn(methods[methodName]);
    } else {
      mockService[methodName] = vi.fn().mockResolvedValue(methods[methodName]);
    }
  });

  return mockService;
};

// Mock Database Service
export const createMockDatabaseService = (overrides: any = {}) => {
  const defaultMethods = {
    getProductImages: vi.fn().mockResolvedValue([]),
    getProductOccasionReferences: vi.fn().mockResolvedValue([]),
    getClient: vi.fn().mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      }))
    })
  };

  return createMockService({ ...defaultMethods, ...overrides });
};

// Mock Error Factory
export const createMockError = (message: string, statusCode: number = 500) => ({
  message,
  statusCode,
  name: 'MockError'
});

// Mock Success Response Factory
export const createMockSuccessResponse = (data: any, message: string = 'Success') => ({
  success: true,
  data,
  message
});

// Mock Error Response Factory
export const createMockErrorResponse = (message: string, statusCode: number = 500) => ({
  success: false,
  message,
  statusCode
});

// Time Mock Utilities
export const createMockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);
  return mockDate;
};

export const restoreRealDate = () => {
  vi.useRealTimers();
};

// Environment Mock
export const createMockEnv = (variables: Record<string, string>) => {
  const originalEnv = { ...process.env };

  Object.keys(variables).forEach(key => {
    process.env[key] = variables[key];
  });

  return () => {
    process.env = originalEnv;
  };
};