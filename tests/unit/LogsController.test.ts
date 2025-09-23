/**
 * 🌸 FloresYa Logs Controller Tests - Enterprise TypeScript Edition
 * Comprehensive unit tests for frontend logging endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { LogsController } from '../../src/controllers/LogsController.js';
import type { LogEntry } from '../../src/shared/types/index.js';

describe('LogsController', () => {
  let logsController: LogsController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    // Create a new instance of LogsController
    logsController = new LogsController();

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

  describe('receiveFrontendLogs', () => {
    it('should receive and process frontend logs successfully', () => {
      const mockLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'INFO',
          module: 'CartManager',
          message: 'Item added to cart',
          data: { productId: 1, quantity: 2 }
        },
        {
          timestamp: '2024-01-01T00:01:00Z',
          level: 'ERROR',
          module: 'PaymentService',
          message: 'Payment failed',
          data: { error: 'Insufficient funds' }
        }
      ];

      const sessionId = 'test-session-123';

      mockRequest = {
        body: {
          logs: mockLogs,
          sessionId: sessionId
        }
      };

      logsController.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 2,
        sessionId: sessionId
      });
    });

    it('should handle logs with errors and warnings', () => {
      const mockLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'INFO',
          module: 'CartManager',
          message: 'Item added to cart',
          data: { productId: 1, quantity: 2 }
        },
        {
          timestamp: '2024-01-01T00:01:00Z',
          level: 'ERROR',
          module: 'PaymentService',
          message: 'Payment failed',
          data: { error: 'Insufficient funds' }
        },
        {
          timestamp: '2024-01-01T00:02:00Z',
          level: 'WARN',
          module: 'ImageService',
          message: 'Image loading slow',
          data: { loadTime: 5000 }
        }
      ];

      const sessionId = 'test-session-456';

      // Mock console.warn to verify it's called
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockRequest = {
        body: {
          logs: mockLogs,
          sessionId: sessionId
        }
      };

      logsController.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 3,
        sessionId: sessionId
      });

      // Verify that console.warn was called for errors and warnings
      // 1 general message + 2 individual error/warning messages = 3 total calls
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ Issues detected: 2 errors/warnings');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[ERROR] PaymentService: Payment failed', { error: 'Insufficient funds' });
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] ImageService: Image loading slow', { loadTime: 5000 });

      consoleWarnSpy.mockRestore();
    });

    it('should handle validation errors', () => {
      mockRequest = {
        body: {
          logs: 'invalid-logs-format',
          sessionId: 'test-session'
        }
      };

      logsController.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Logs must be an array'
      });
    });

    it('should return 400 when logs is not an array', () => {
      mockRequest = {
        body: {
          logs: 'not-an-array',
          sessionId: 'test-session'
        }
      };

      logsController.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Logs must be an array'
      });
    });

    it('should handle empty logs array', () => {
      mockRequest = {
        body: {
          logs: [],
          sessionId: 'test-session'
        }
      };

      logsController.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 0,
        sessionId: 'test-session'
      });
    });

    it('should handle logs without sessionId', () => {
      const mockLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'INFO',
          module: 'CartManager',
          message: 'Item added to cart',
          data: { productId: 1, quantity: 2 }
        }
      ];

      mockRequest = {
        body: {
          logs: mockLogs
        }
      };

      logsController.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 1,
        sessionId: undefined
      });
    });

    it('should handle service errors', () => {
      // Mock console.error to verify it's called
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockRequest = {
        body: null as any // This will cause an error when accessing req.body
      };

      logsController.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to process frontend logs',
        error: expect.any(String)
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle logs with different levels correctly', () => {
      const mockLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'DEBUG',
          module: 'TestModule',
          message: 'Debug message',
          data: { debug: true }
        },
        {
          timestamp: '2024-01-01T00:01:00Z',
          level: 'INFO',
          module: 'TestModule',
          message: 'Info message',
          data: { info: 'test' }
        },
        {
          timestamp: '2024-01-01T00:02:00Z',
          level: 'WARN',
          module: 'TestModule',
          message: 'Warning message',
          data: { warning: 'test' }
        },
        {
          timestamp: '2024-01-01T00:03:00Z',
          level: 'ERROR',
          module: 'TestModule',
          message: 'Error message',
          data: { error: 'test' }
        }
      ];

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockRequest = {
        body: {
          logs: mockLogs,
          sessionId: 'test-session'
        }
      };

      logsController.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 4,
        sessionId: 'test-session'
      });

      // Should only log errors and warnings (1 general message + 2 individual messages = 3 total calls)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
      consoleWarnSpy.mockRestore();
    });

    it('should handle logs with null or undefined data', () => {
      const mockLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'ERROR',
          module: 'TestModule',
          message: 'Error with null data',
          data: null
        },
        {
          timestamp: '2024-01-01T00:01:00Z',
          level: 'WARN',
          module: 'TestModule',
          message: 'Warning with undefined data',
          data: undefined
        }
      ];

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockRequest = {
        body: {
          logs: mockLogs,
          sessionId: 'test-session'
        }
      };

      logsController.receiveFrontendLogs(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Logs received successfully',
        received: 2,
        sessionId: 'test-session'
      });

      // Should log 1 general message + 2 individual messages = 3 total calls
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
      consoleWarnSpy.mockRestore();
    });
  });
});