/**
 * 🌸 FloresYa - Frontend Type Definitions
 * Types for frontend components and services
 */

export interface FloresYaAppConfig {
  isProductionMode: boolean;
  itemsPerPage: number;
  apiBaseUrl?: string;
  debugMode?: boolean;
}

export interface ConversionOptimizer {
  sessionStartTime: number;
  viewedProducts: Set<number>;
  exitIntentShown?: boolean;
}

export interface ProductFilters {
  search?: string;
  occasionId?: number;
  priceMin?: number;
  priceMax?: number;
  category?: string;
}

export interface ResponsiveImageConfig {
  lazyLoad: boolean;
  placeholder: string;
  errorImage: string;
  contexts: {
    card: { width: number; height: number };
    detail: { width: number; height: number };
    carousel: { width: number; height: number };
  };
}

export interface Logger {
  info(module: string, message: string, data?: any): void;
  success(module: string, message: string, data?: any): void;
  warn(module: string, message: string, data?: any): void;
  error(module: string, message: string, data?: any): void;
  debug(module: string, message: string, data?: any): void;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: {
    id: number;
    email: string;
    name?: string;
    role?: string;
  };
  token?: string;
  expiresAt?: number;
}

export interface CartState {
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  total: number;
  itemCount: number;
}

export interface UIState {
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  selectedFilters: ProductFilters;
}