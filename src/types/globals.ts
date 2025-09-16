/**
 * 🌸 FloresYa Global Types - Strict TypeScript Edition
 * Tipos estrictos para eliminar cualquier uso de 'any'
 */

// ============================================
// LOGGING TYPES
// ============================================

export interface LogData {
  timestamp?: string;
  userId?: string | number;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  error?: Error | string;
  stackTrace?: string;
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response?: {
    status?: number;
    headers?: Record<string, string>;
    body?: unknown;
  };
  performance?: {
    duration?: number;
    memory?: number;
    cpu?: number;
  };
  // Allow any additional properties for flexible logging
  [key: string]: unknown;
}

export interface Logger {
  startAutoSend(intervalMinutes: number): void;
  stopAutoSend(): void;
  sendLogs(): Promise<void>;
  info(module: string, message: string, data?: LogData | null): void;
  success(module: string, message: string, data?: LogData | null): void;
  error(module: string, message: string, data?: LogData | null): void;
  warn(module: string, message: string, data?: LogData | null): void;
  debug(module: string, message: string, data?: LogData | null): void;
  api(module: string, message: string, data?: LogData | null): void;
  user(module: string, message: string, data?: LogData | null): void;
  cart(module: string, message: string, data?: LogData | null): void;
  perf(module: string, message: string, data?: LogData | null): void;
}

// ============================================
// AUTHENTICATION TYPES
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

// ============================================
// FRONTEND WINDOW EXTENSIONS
// ============================================

export interface WindowWithBootstrap extends Window {
  bootstrap?: {
    Modal: {
      new (element: Element): { show(): void; hide(): void };
      getInstance(element: Element): { hide(): void } | null;
    };
    Carousel?: new (element: Element, options?: unknown) => {
      cycle(): void;
    };
  };
}

export interface WindowWithCart extends Window {
  cart?: {
    addItem(product: {
      id: number;
      name: string;
      price_usd: number;
      quantity?: number;
    }): void;
    removeItem(productId: number): void;
    getItems(): Array<{
      id: number;
      name: string;
      price_usd: number;
      quantity: number;
    }>;
    clear(): void;
  };
}

export interface WindowWithFloresyaLogger extends Window {
  floresyaLogger?: Logger;
}

// ============================================
// DEBOUNCE FUNCTION TYPE
// ============================================

export type DebounceFunction<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  (...args: Parameters<T>): void;
  cancel(): void;
};