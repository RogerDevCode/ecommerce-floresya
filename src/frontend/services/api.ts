/**
 * FloresYa API Service - TypeScript Edition
 * Comprehensive API client with full type safety
 */

// Import shared types
import type {
  Product,
  ProductImage,
  Occasion,
  User,
  PaginationInfo as Pagination,
  ApiResponse
} from '../../config/supabase.js';
import type {
  LoginCredentials,
  RegisterData,
  Logger,
  LogData
} from '../../types/globals.js';
import type { ProductQuery } from '../../config/supabase.js';
type ProductFilters = ProductQuery;

// Define carousel types locally to avoid import issues
interface CarouselProduct {
  id: number;
  name: string;
  summary?: string;
  price_usd: number;
  carousel_order: number;
  primary_thumb_url: string;
}

interface CarouselResponse {
  carousel_products: CarouselProduct[];
  total_count: number;
}

// Note: Window interface extended in main.ts to avoid conflicts

export class FloresYaAPI {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('floresya_token');

    // Initialize with logging
    if (window.logger) {
      window.logger.info('API', '✅ FloresYaAPI initialized');
    } else {
      console.log('[🌐 API] FloresYaAPI initialized');
    }
  }

  private log(message: string, data: LogData | null = null, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
    // Use window.logger if available
    if (window.logger) {
      window.logger[level]('API', message, data);
    } else {
      const prefix = '[🌐 API]';
      const timestamp = new Date().toISOString();
      const output = `${prefix} [${level.toUpperCase()}] ${timestamp} — ${message}`;

      switch (level) {
        case 'error':
          console.error(output, data);
          break;
        case 'warn':
          console.warn(output, data);
          break;
        default:
          console.log(output, data);
          break;
      }
    }
  }

  // Helper method to get headers
  private getHeaders(includeAuth = false): Record<string, string> {
    this.log('🔄 Getting headers', { includeAuth }, 'info');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (includeAuth && this.token) {
          headers.Authorization = `Bearer ${this.token as string}`;
          this.log('✅ Authorization header added', {}, 'success');
        }

    return headers;
  }

  // Check network connectivity
  private async checkConnectivity(): Promise<boolean> {
    try {
      // Try to fetch a small resource to check connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Generic fetch method with error handling
  private async fetchData<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const url = `${this.baseURL}${endpoint}`;
    this.log('🔄 Fetching data', { url, method: options.method || 'GET' }, 'info');

    // Check connectivity before making request
    const isConnected = await this.checkConnectivity();
    if (!isConnected) {
      this.log('⚠️ No network connectivity detected', { endpoint }, 'warn');
      throw new Error('No network connectivity. Please check your internet connection.');
    }

    try {
      const requestOptions = {
        ...options,
        headers: {
          ...this.getHeaders(false),
          ...options.headers
        }
      };


      const response = await fetch(url, requestOptions);

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        // Only log as error for server errors (5xx), warn for client errors (4xx)
        const logLevel = response.status >= 500 ? 'error' : 'warn';
        this.log(`${response.status >= 500 ? '❌' : '⚠️'} FETCH ${options.method || 'GET'} ${endpoint} - ${response.status}`, {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          method: options.method || 'GET'
        }, logLevel);
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      this.log('✅ Data fetched successfully', { endpoint, dataKeys: Object.keys(data) }, 'success');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isNetworkError = errorMessage.includes('NetworkError') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch');

      // Use appropriate log level based on error type
      const logLevel = isNetworkError ? 'warn' : 'error';
      const logPrefix = isNetworkError ? '🌐 NETWORK' : '❌ FETCH';

      this.log(`${logPrefix} ${options.method || 'GET'} ${endpoint} - ${isNetworkError ? 'Connection issue' : 'Failed'}`, {
        error: errorMessage,
        endpoint,
        method: options.method || 'GET',
        duration: Date.now() - startTime
      }, logLevel);

      throw error;
    }
  }

  // Products API
  async getProducts(filters: ProductQuery = {}): Promise<ApiResponse<{ products: Product[], pagination: Pagination }>> {
    const params = new URLSearchParams();

    // Filter out undefined values and handle boolean conversion
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'boolean') {
          params.append(key, value.toString());
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const queryString = params.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

    this.log('🔄 Getting products', filters, 'info');
    return this.fetchData<{ products: Product[], pagination: Pagination }>(endpoint);
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    this.log('🔄 Getting product', { id }, 'info');
    return this.fetchData<Product>(`/products/${id}`);
  }

  async getProductById(id: number): Promise<ApiResponse<Product>> {
    return this.getProduct(id);
  }

  async createProduct(productData: Partial<Product>): Promise<ApiResponse<Product>> {
    this.log('🔄 Creating product', { name: productData.name }, 'info');
    return this.fetchData<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(productData: Partial<Product> & { id: number }): Promise<ApiResponse<Product>> {
    const { id, ...updateData } = productData;
    this.log('🔄 Updating product', { id, name: updateData.name }, 'info');
    return this.fetchData<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async deleteProduct(id: number): Promise<ApiResponse<{ success: boolean }>> {
    this.log('🔄 Deleting product', { id }, 'info');
    return this.fetchData<{ success: boolean }>(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  // Occasions API
  async getOccasions(): Promise<ApiResponse<Occasion[]>> {
    this.log('🔄 Getting occasions', {}, 'info');
    return this.fetchData<Occasion[]>('/occasions');
  }

  // Carousel API
  async getCarousel(): Promise<ApiResponse<CarouselResponse>> {
    this.log('🔄 Getting carousel products', {}, 'info');
    const response = await this.fetchData<CarouselResponse>('/products/carousel');

    // Log the actual data structure for debugging
    if (response.success && response.data) {
      this.log('✅ Carousel data received', {
        count: response.data.carousel_products?.length || 0,
        firstProduct: response.data.carousel_products?.[0] || null
      }, 'success');
    }

    return response;
  }

  // Settings API
  async getSetting(key: string): Promise<ApiResponse<{ key: string, value: string | number | boolean }>> {
    this.log('🔄 Getting setting', { key }, 'info');
    return this.fetchData<{ key: string, value: string | number | boolean }>(`/settings/${key}`);
  }

  // Authentication API
  async login(email: string, password: string): Promise<ApiResponse<{ user: User, token: string }>> {
    this.log('🔄 Attempting login', { email }, 'info');

    const response = await this.fetchData<{ user: User, token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.success && response.data) {
      this.token = response.data.token;
      localStorage.setItem('floresya_token', this.token);
      this.log('✅ Login successful', { user: response.data.user.email }, 'success');
    }

    return response;
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User, token: string }>> {
    this.log('🔄 Attempting registration', { email: userData.email }, 'info');

    const response = await this.fetchData<{ user: User, token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (response.success && response.data) {
      this.token = response.data.token;
      localStorage.setItem('floresya_token', this.token);
      this.log('✅ Registration successful', { user: response.data.user.email }, 'success');
    }

    return response;
  }

  async logout(): Promise<void> {
    this.log('🔄 Logging out', {}, 'info');

    this.token = null;
    localStorage.removeItem('floresya_token');

    this.log('✅ Logout successful', {}, 'success');
  }

  // User utilities
  getUser(): User | null {
    const token = this.token;
    if (!token) return null;

    try {
      // Simple JWT decode (for demo purposes - in production use a proper library)
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) return null;

      const decodedPayload = atob(parts[1]);
      if (!decodedPayload) return null;

      const payload = JSON.parse(decodedPayload);
      return payload.user || null;
    } catch (error) {
      this.log('❌ Error decoding token', { error: error instanceof Error ? error.message : String(error) }, 'error');
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.getUser();
  }

  // Utility methods
  formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Notification system
  showNotification(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info'): void {
    this.log('🔄 Showing notification', { message, type }, 'info');

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Add to body
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
        this.log('✅ Notification removed after timeout', { message, type }, 'success');
      }
    }, 5000);

    this.log('✅ Notification shown successfully', { message, type }, 'success');
  }

  // Handle errors
  handleError(error: Error | string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    this.log('❌ Handling error', { error: errorMessage }, 'error');
    console.error('API Error:', error);
    this.showNotification(errorMessage || 'Ha ocurrido un error', 'danger');
  }

  // Debounce utility for search
  debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    this.log('🔄 Creating debounce function', { wait }, 'info');

    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Create and export global API instance
export const api = new FloresYaAPI();

// Make available globally for legacy scripts
window.api = api;

// Default export
export default api;

if (window.logger) {
  window.logger.success('API', '✅ TypeScript API module loaded and exported');
} else {
  console.log('[🌐 API] TypeScript API module loaded and exported');
}