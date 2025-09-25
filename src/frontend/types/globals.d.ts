/**
 * 🌸 FloresYa Frontend Global Types
 * =================================
 * Global type declarations for frontend
 */

import type {
  WindowWithLogger,
  WindowWithCart,
  Logger,
  CartManager
} from "shared/types/index";

// Extend the global Window interface
declare global {
  interface Window extends
    WindowWithLogger,
    WindowWithCart {
    // Frontend app instances
    floresyaApp?: {
      init(): Promise<void>;
      showError(message: string): void;
      showSuccess(message: string): void;
      navigate(path: string): void;
      addToCart(productId: number): void;
      removeFromCart(productId: number): void;
      updateQuantity(productId: number, quantity: number): void;
      buyNow(productId: number): void;
      viewProductDetails(productId: number): void;
      getStats(): Record<string, unknown>;
      toggleDevMode(): void;
      showFloresNovias(): void;
    };

    // Product detail manager
    productDetail?: {
      init(): Promise<void>;
      addToCart(productId: number, quantity: number): Promise<boolean>;
      showImages(productId: number): void;
      increaseQuantity(productId: number): void;
      decreaseQuantity(productId: number): void;
      removeFromCart(productId: number): void;
      getProductIdFromURL(): number | null;
    };

    // Auth manager
    authManager?: {
      init(): void;
      login(email: string, password: string): Promise<boolean>;
      logout(): void;
      isAuthenticated(): boolean;
      getCurrentUser(): Promise<unknown>;
    };

    // Admin panel manager
    adminPanel?: unknown;

    // Logger instance
    floresyaLogger?: {
      startAutoSend(intervalMinutes: number): void;
      stopAutoSend(): void;
      sendLogs(): Promise<void>;
      info(module: string, message: string, data?: Record<string, unknown> | null): void;
      success(module: string, message: string, data?: Record<string, unknown> | null): void;
      error(module: string, message: string, data?: Record<string, unknown> | null): void;
      warn(module: string, message: string, data?: Record<string, unknown> | null): void;
      debug(module: string, message: string, data?: Record<string, unknown> | null): void;
      api(module: string, message: string, data?: Record<string, unknown> | null): void;
      user(module: string, message: string, data?: Record<string, unknown> | null): void;
      cart(module: string, message: string, data?: Record<string, unknown> | null): void;
      perf(module: string, message: string, data?: Record<string, unknown> | null): void;
    };

    // Legacy logger property
    logger?: {
      startAutoSend(intervalMinutes: number): void;
      stopAutoSend(): void;
      sendLogs(): Promise<void>;
      info(module: string, message: string, data?: Record<string, unknown> | null): void;
      success(module: string, message: string, data?: Record<string, unknown> | null): void;
      error(module: string, message: string, data?: Record<string, unknown> | null): void;
      warn(module: string, message: string, data?: Record<string, unknown> | null): void;
      debug(module: string, message: string, data?: Record<string, unknown> | null): void;
      api(module: string, message: string, data?: Record<string, unknown> | null): void;
      user(module: string, message: string, data?: Record<string, unknown> | null): void;
      cart(module: string, message: string, data?: Record<string, unknown> | null): void;
      perf(module: string, message: string, data?: Record<string, unknown> | null): void;
    };

    // API client - using Record<string, unknown> to avoid generic type issues
    api?: Record<string, unknown> & {
      getOccasions(): Promise<unknown>;
      getProducts(query?: Record<string, unknown>): Promise<unknown>;
      getCarousel(): Promise<unknown>;
      login(email: string, password: string): Promise<unknown>;
      register(userData: Record<string, unknown>): Promise<unknown>;
      logout(): void;
      getUser(): unknown;
      isAuthenticated(): boolean;
      formatCurrency(amount: number, currency?: string): string;
      showNotification(message: string, type?: string): void;
      handleError(error: Error | string): void;
      debounce<T extends (...args: never[]) => unknown>(func: T, delay: number): T;
    };

    // Cart manager
    cart?: CartManager;

  }
}

// Export empty object to make this a module
export {};