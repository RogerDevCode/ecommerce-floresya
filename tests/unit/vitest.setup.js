/**
 * 🌸 FloresYa - Vitest Setup
 * Configuración global para tests con Vitest
 */

import { vi } from 'vitest';

// Global mocks
global.vi = vi;

// Mock console methods to reduce noise in tests
const originalConsole = global.console;

beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: vi.fn(),
    debug: vi.fn(), 
    info: vi.fn(),
    error: originalConsole.error,
    warn: originalConsole.warn
  };
});

afterEach(() => {
  global.console = originalConsole;
  vi.clearAllMocks();
});

// Global test utilities
global.createMockRequest = (overrides = {}) => ({
  method: 'GET',
  originalUrl: '/',
  query: {},
  body: {},
  params: {},
  user: null,
  ...overrides
});

global.createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
  };
  return res;
};

// Mock timers
vi.useFakeTimers();