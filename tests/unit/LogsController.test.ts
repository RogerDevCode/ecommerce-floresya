/**
 * 🌸 FloresYa LogsController Unit Tests - Silicon Valley Simple Mock Edition
 * Clean, maintainable tests with one mock per test pattern
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LogsController, logsValidators } from '../../src/controllers/LogsController.js';

// Mock dependencies
vi.mock('express-validator', () => ({
  body: vi.fn(() => ({
    isArray: vi.fn().mockReturnThis(),
    isISO8601: vi.fn().mockReturnThis(),
    isString: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis()
  })),
  validationResult: vi.fn()
}));

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('LogsController', () => {
  let controller: LogsController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: any;
  let statusSpy: any;

  // Test data factories
  const createTestLogEntry = (overrides = {}) => ({
    timestamp: '2024-01-01T00:00:00.000Z',
    level: 'ERROR' as const,
    module: 'TestModule',
    message: 'Test error message',
    data: { error: 'Test error details' },
    ...overrides
  });

  const createTestLogEntryWarn = (overrides = {}) => ({
    timestamp: '2024-01-01T00:00:01.000Z',
    level: 'WARN' as const,
    module: 'TestModule',
    message: 'Test warning message',
    data: { warning: 'Test warning details' },
    ...overrides
  });

  const createTestLogEntryInfo = (overrides = {}) => ({
    timestamp: '2024-01-01T00:00:02.000Z',
    level: 'INFO' as const,
    module: 'TestModule',
    message: 'Test info message',
    data: { info: 'Test info details' },
    ...overrides
  });

  const createValidationResult = (isEmpty = true, errors: any[] = []) => ({
    isEmpty: () => isEmpty,
    array: () => errors,
    formatter: vi.fn(),
    errors,
    mapped: vi.fn(),
    formatWith: vi.fn(),
    throw: vi.fn()
  } as any);

  beforeEach(() => {
    controller = new LogsController();
    jsonSpy = vi.fn().mockReturnThis();
    statusSpy = vi.fn().mockReturnThis();

    mockResponse = {
      json: jsonSpy,
      status: statusSpy
    };

    // Mock console methods
    console.warn = vi.fn();
    console.error = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original console methods
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe('receiveFrontendLogs', () => {
    it('should receive logs successfully', () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const logData = {
        logs: [createTestLogEntry(), createTestLogEntryInfo()],
        sessionId: 'test-session-123'
      };

      mockRequest = {
        body: logData
      };

      // Act
      controller.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 2,
        sessionId: 'test-session-123'
      });
    });

    it('should handle validation errors', () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult(false, [{ field: 'logs', message: 'Logs must be an array' }]));

      mockRequest = {
        body: { logs: 'invalid' }
      };

      // Act
      controller.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid log data',
        errors: [{ field: 'logs', message: 'Logs must be an array' }]
      });
    });

    it('should handle invalid logs format (not an array)', () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        body: { logs: 'not-an-array' }
      };

      // Act
      controller.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Logs must be an array'
      });
    });

    it('should handle empty logs array', () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const logData = {
        logs: [],
        sessionId: 'test-session-123'
      };

      mockRequest = {
        body: logData
      };

      // Act
      controller.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 0,
        sessionId: 'test-session-123'
      });
    });

    it('should log errors and warnings to console', () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const logData = {
        logs: [createTestLogEntry(), createTestLogEntryWarn(), createTestLogEntryInfo()],
        sessionId: 'test-session-123'
      };

      mockRequest = {
        body: logData
      };

      // Act
      controller.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(vi.mocked(console.warn)).toHaveBeenCalledWith('⚠️ Issues detected: 2 errors/warnings');
      expect(vi.mocked(console.warn)).toHaveBeenCalledWith(
        '[ERROR] TestModule: Test error message',
        { error: 'Test error details' }
      );
      expect(vi.mocked(console.warn)).toHaveBeenCalledWith(
        '[WARN] TestModule: Test warning message',
        { warning: 'Test warning details' }
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 3,
        sessionId: 'test-session-123'
      });
    });

    it('should handle logs without sessionId', () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const logData = {
        logs: [createTestLogEntryInfo()]
      };

      mockRequest = {
        body: logData
      };

      // Act
      controller.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 1,
        sessionId: undefined
      });
    });

    it('should handle service errors', () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      // Mock an error that occurs during processing
      mockRequest = {
        body: null // This will cause an error when accessing properties
      } as any;

      // Act
      controller.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(vi.mocked(console.error)).toHaveBeenCalledWith(
        'LogsController.receiveFrontendLogs error:',
        expect.any(TypeError)
      );
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to process frontend logs',
        error: expect.any(String)
      });
    });

    it('should handle logs with different levels correctly', () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const logData = {
        logs: [
          { ...createTestLogEntry(), level: 'ERROR' as const },
          { ...createTestLogEntryWarn(), level: 'WARN' as const },
          { ...createTestLogEntryInfo(), level: 'INFO' as const },
          { ...createTestLogEntryInfo(), level: 'DEBUG' as const }
        ]
      };

      mockRequest = {
        body: logData
      };

      // Act
      controller.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(vi.mocked(console.warn)).toHaveBeenCalledWith('⚠️ Issues detected: 2 errors/warnings');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 4,
        sessionId: undefined
      });
    });

    it('should handle logs with missing optional data field', () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const logData = {
        logs: [
          {
            timestamp: '2024-01-01T00:00:00.000Z',
            level: 'INFO' as const,
            module: 'TestModule',
            message: 'Test message without data'
            // No data field
          }
        ]
      };

      mockRequest = {
        body: logData
      };

      // Act
      controller.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 1,
        sessionId: undefined
      });
    });
  });

  describe('logsValidators', () => {
    it('should validate receiveFrontendLogs correctly', () => {
      // Arrange
      const validators = logsValidators.receiveFrontendLogs;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should have proper validation rules', () => {
      // Arrange
      const validators = logsValidators.receiveFrontendLogs;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(Array.isArray(validators)).toBe(true);
      expect(validators.length).toBe(6); // Should have 6 validation rules
    });
  });
});