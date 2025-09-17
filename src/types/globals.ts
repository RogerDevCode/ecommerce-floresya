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
    Toast: {
      new (element: Element, options?: { delay?: number }): { show(): void; hide(): void };
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
// USER MANAGEMENT TYPES
// ============================================

export interface UserCreateRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'user' | 'admin' | 'support';
  is_active?: boolean;
  email_verified?: boolean;
}

export interface UserUpdateRequest {
  id: number;
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'support';
  is_active?: boolean;
  email_verified?: boolean;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name?: string;
  phone?: string;
  role: 'user' | 'admin' | 'support';
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  users: UserResponse[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'user' | 'admin' | 'support';
  is_active?: boolean;
  email_verified?: boolean;
  sort_by?: 'email' | 'full_name' | 'role' | 'created_at' | 'updated_at';
  sort_direction?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface UserFormData {
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  password?: string;
}

export interface UserValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface UserOperationResult {
  success: boolean;
  data?: UserResponse;
  message: string;
  errors?: UserValidationError[];
}

// ============================================
// DEBOUNCE FUNCTION TYPE
// ============================================

export type DebounceFunction<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  (...args: Parameters<T>): void;
  cancel(): void;
};