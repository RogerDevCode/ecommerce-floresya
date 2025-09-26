/**
 * FloresYa API Service - ZOD VALIDATED EDITION
 * Runtime validated API client with ZERO generics
 */


import { z } from 'zod';

import {
  ProductApiResponseSchema,
  ProductListApiResponseSchema,
  UserApiResponseSchema,
  UserListApiResponseSchema,
  CarouselApiResponseSchema,
  OccasionSchema
} from '../../shared/types/index.js';
import type {
  RegisterData,
  LogData,
  CarouselResponse
,
  Product,
  Occasion,
  User,
  PaginationInfo as Pagination,
  ApiResponse,
  ProductQuery,
  ProductListApiResponse,
  CarouselApiResponse
} from "shared/types/index";


// Import Zod schemas for validation

// Create quick schema for occasions array response
const OccasionsApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(OccasionSchema).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  errors: z.array(z.any()).optional(),
});
type OccasionsApiResponse = z.infer<typeof OccasionsApiResponseSchema>;


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
      // FloresYaAPI initialized
    }
  }

  // ============================================
  // ZOD VALIDATION HELPERS - FRONTEND EDITION
  // ============================================

  /**
   * Validates API response with Zod schema and provides detailed error logging
   */
  private validateResponse<T>(schema: z.ZodSchema<T>, data: unknown, endpoint: string): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        this.log(`❌ Response validation failed for ${endpoint}`, {
          errors: errorMessages,
          receivedData: data
        }, 'error');
        throw new Error(`[${endpoint}] API response validation failed: ${errorMessages}`);
      }
      throw error;
    }
  }

  private log(message: string, data: LogData | null = null, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
    // Only show important logs to reduce console noise
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

    // Always show errors and warnings
    if (level === 'error' || level === 'warn') {
      const prefix = '[🌐 API]';
      const timestamp = new Date().toISOString();
      const output = `${prefix} [${level.toUpperCase()}] ${timestamp} — ${message}`;

      if (level === 'error') {
        console.error(output, data || '');
      } else {
        console.warn(output, data || '');
      }
      return;
    }

    // Show success logs only for critical operations (auth, creation, etc.)
    const isCriticalSuccess = level === 'success' && (
      message.includes('Login successful') ||
      message.includes('Registration successful') ||
      message.includes('created successfully') ||
      message.includes('deleted successfully') ||
      message.includes('uploaded successfully')
    );

    // Show info logs only in development or for critical operations
    const shouldShowInfo = isDevelopment || isCriticalSuccess;

    if (shouldShowInfo) {
      // Use window.logger if available
      if (window.logger) {
        window.logger[level]('API', message, data);
      } else {
        const prefix = '[🌐 API]';
        const timestamp = new Date().toISOString();
        const output = `${prefix} [${level.toUpperCase()}] ${timestamp} — ${message}`;
        console.log(output, data || '');
      }
    }
  }

  // Helper method to get headers
  private getHeaders(includeAuth = false): Record<string, string> {
    // Removed verbose log for headers

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (includeAuth && this.token) {
          headers.Authorization = `Bearer ${this.token}`;
          // Authorization header added silently
        }

    return headers;
  }

  // Check network connectivity
  private async checkConnectivity(): Promise<boolean> {
    try {
      // Try to ping the API endpoint to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.baseURL}/health`, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      }).catch((): Response | null => null);

      clearTimeout(timeoutId);

      // If health check fails, assume we're still connected
      // (backend might not have a health endpoint)
      return response ? (response.ok || response.status === 404) : true;
    } catch {
      // Assume connected if check fails to avoid false negatives
      return true;
    }
  }

  // Generic fetch method with error handling
  private async fetchData<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const url = `${this.baseURL}${endpoint}`;
    // Fetching data (verbose log removed)

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

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      let data: ApiResponse<T>;

      if (contentType?.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError: unknown) {
          const errorMessage = jsonError instanceof Error ? jsonError.message : 'Unknown error';
          this.log('❌ Invalid JSON response', {
            endpoint,
            contentType,
            status: response.status,
            error: errorMessage
          }, 'error');
          throw new Error(`Invalid JSON response from server: ${errorMessage}`);
        }
      } else {
        // If not JSON, read as text and create error response
        const textResponse = await response.text();
        this.log('❌ Non-JSON response received', {
          endpoint,
          contentType,
          status: response.status,
          responsePreview: textResponse.substring(0, 200)
        }, 'error');

        data = {
          success: false,
          message: `Server returned non-JSON response: ${response.status} ${response.statusText}`,
          data: null as T
        };
      }

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
  async getProducts(filters: ProductQuery = {}): Promise<ProductListApiResponse> {
    const params = new URLSearchParams();

    // Filter out undefined values and handle boolean conversion
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'boolean') {
          params.append(key, value.toString());
        } else {
          if (typeof value === 'object' && value !== null) {
            params.append(key, JSON.stringify(value));
          } else if (typeof value === 'string' || typeof value === 'number') {
            params.append(key, String(value));
          } else {
            params.append(key, JSON.stringify(value));
          }
        }
      }
    });

    const queryString = params.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

    // Getting products (verbose log removed)

    // 🔥 FETCH WITH ZOD VALIDATION!
    const rawResponse = await this.fetchData<{ products: Product[], pagination: Pagination }>(endpoint);
    return this.validateResponse(ProductListApiResponseSchema, rawResponse, endpoint);
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    this.log('🔄 Getting product', { id }, 'info');
    return this.fetchData<Product>(`/products/${id}`);
  }

  async getProductById(id: number): Promise<ApiResponse<Product>> {
    return this.getProduct(id);
  }

  async getProductByIdWithOccasions(id: number): Promise<ApiResponse<{ product: Product & { occasion_ids: number[] } }>> {
    this.log('🔄 Getting product with occasions', { id }, 'info');
    return this.fetchData<{ product: Product & { occasion_ids: number[] } }>(`/products/${id}/with-occasions`);
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
  async getOccasions(): Promise<OccasionsApiResponse> {
    // Getting occasions (verbose log removed)

    // 🔥 FETCH WITH ZOD VALIDATION!
    const rawResponse = await this.fetchData<Occasion[]>('/occasions');
    return this.validateResponse(OccasionsApiResponseSchema, rawResponse, '/occasions');
  }

  async getOccasionById(id: number): Promise<ApiResponse<{ occasion: Occasion }>> {
    this.log('🔄 Getting occasion by ID', { id }, 'info');
    return this.fetchData<{ occasion: Occasion }>(`/occasions/${id}`);
  }

  async createOccasion(occasionData: {
    name: string;
    type?: string;
    description?: string;
    slug?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<Occasion>> {
    this.log('🔄 Creating occasion', { name: occasionData.name, type: occasionData.type }, 'info');
    return this.fetchData<Occasion>('/occasions', {
      method: 'POST',
      body: JSON.stringify(occasionData)
    });
  }

  async updateOccasion(occasionData: Partial<Occasion> & { id: number }): Promise<ApiResponse<Occasion>> {
    const { id, ...updateData } = occasionData;
    this.log('🔄 Updating occasion', { id, name: updateData.name }, 'info');
    return this.fetchData<Occasion>(`/occasions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async deleteOccasion(id: number): Promise<ApiResponse<{ success: boolean }>> {
    this.log('🔄 Deleting occasion', { id }, 'info');
    return this.fetchData<{ success: boolean }>(`/occasions/${id}`, {
      method: 'DELETE'
    });
  }

  // Carousel API
  async getCarousel(): Promise<CarouselApiResponse> {
    // Getting carousel products (verbose log removed)

    // 🔥 FETCH WITH ZOD VALIDATION!
    const rawResponse = await this.fetchData<CarouselResponse>('/products/carousel');
    const validatedResponse = this.validateResponse(CarouselApiResponseSchema, rawResponse, '/products/carousel');

    // Log the actual data structure for debugging
    if (validatedResponse.success && validatedResponse.data) {
      const carouselProducts = validatedResponse.data.carousel_products || validatedResponse.data.products || [];
      this.log('✅ Carousel data validated and received', {
        count: carouselProducts.length,
        firstProduct: carouselProducts[0] ?? null
      }, 'success');
    }

    return validatedResponse;
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

  logout(): void {
    this.log('🔄 Logging out', {}, 'info');

    this.token = null;
    localStorage.removeItem('floresya_token');

    this.log('✅ Logout successful', {}, 'success');
  }

  // Users API
  async createUser(userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'admin' | 'support';
    is_active?: boolean;
    email_verified?: boolean;
  }): Promise<ApiResponse<User>> {
    this.log('🔄 Creating user', { email: userData.email, role: userData.role }, 'info');
    return this.fetchData<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    is_active?: boolean;
    email_verified?: boolean;
    sort_by?: string;
    sort_direction?: string;
  } = {}): Promise<ApiResponse<{ users: User[], pagination: Pagination }>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

    this.log('🔄 Getting users', params, 'info');
    return this.fetchData<{ users: User[], pagination: Pagination }>(endpoint);
  }

  async getUserById(id: number): Promise<ApiResponse<User>> {
    this.log('🔄 Getting user by ID', { id }, 'info');
    return this.fetchData<User>(`/users/${id}`);
  }

  async updateUser(userData: Partial<User> & { id: number }): Promise<ApiResponse<User>> {
    const { id, ...updateData } = userData;
    this.log('🔄 Updating user', { id, email: updateData.email }, 'info');
    return this.fetchData<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async deleteUser(id: number): Promise<ApiResponse<{ success: boolean }>> {
    this.log('🔄 Deleting user', { id }, 'info');
    return this.fetchData<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // User utilities
  getUser(): User | null {
    const token = this.token;
    if (!token) return null;

    try {
      // Simple JWT decode (for demo purposes - in production use a proper library)
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) return null;

      const decodedPayload = typeof window?.atob !== 'undefined' ? window.atob(parts[1]) : typeof globalThis?.atob !== 'undefined' ? globalThis.atob(parts[1]) : typeof Buffer !== 'undefined' ? Buffer.from(parts[1], 'base64').toString('utf8') : parts[1];
      if (!decodedPayload) return null;

      const payload = JSON.parse(decodedPayload) as { user?: User };
      return payload.user || null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('❌ Error decoding token', { error: errorMessage }, 'error');
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
      currency,
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
        this.showNotification(errorMessage || 'Ha ocurrido un error', 'danger');
  }

  // Debounce utility for search
  debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    // Creating debounce function (verbose log removed)

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

  // Images API
  async getCurrentSiteImages(): Promise<ApiResponse<{ hero: string; logo: string }>> {
    this.log('🔄 Getting current site images', {}, 'info');
    return this.fetchData<{ hero: string; logo: string }>('/images/site/current');
  }

  async getImagesGallery(params: { filter?: 'all' | 'used' | 'unused'; page?: number; limit?: number } = {}): Promise<ApiResponse<{
    images: Array<{
      id: number;
      product_id: number | null;
      product_name: string | null;
      size: string;
      url: string;
      file_hash: string;
      is_primary: boolean;
      created_at: string;
    }>;
    pagination: {
      page: number;
      total: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params.filter) queryParams.append('filter', params.filter);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/images/gallery${queryString ? `?${queryString}` : ''}`;

    this.log('🔄 Getting images gallery', params, 'info');
    return this.fetchData(endpoint);
  }

  async uploadSiteImage(formData: FormData): Promise<ApiResponse<{ url: string; type: string }>> {
    this.log('🔄 Uploading site image', {}, 'info');

    // Custom fetch for FormData (multipart)
    const url = `${this.baseURL}/images/site`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const data: ApiResponse<{ url: string; type: string }> = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    this.log('✅ Site image uploaded successfully', { type: data.data?.type ?? 'unknown' }, 'success');
    return data;
  }

  async deleteImage(imageId: number): Promise<ApiResponse<{ success: boolean }>> {
    this.log('🔄 Deleting image', { imageId }, 'info');
    return this.fetchData<{ success: boolean }>(`/images/${imageId}`, {
      method: 'DELETE'
    });
  }

  async getProductsWithImageCounts(params: { sort_by?: 'name' | 'image_count'; sort_direction?: 'asc' | 'desc' } = {}): Promise<ApiResponse<{
    products: Array<{
      id: number;
      name: string;
      price_usd: number;
      image_count: number;
    }>;
  }>> {
    const queryParams = new URLSearchParams();
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);

    const queryString = queryParams.toString();
    const endpoint = `/images/products-with-counts${queryString ? `?${queryString}` : ''}`;

    this.log('🔄 Getting products with image counts', params, 'info');
    return this.fetchData(endpoint);
  }

  // Generic request method for custom API calls
  async request<T>(endpoint: string, options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    params?: Record<string, unknown>;
  } = {}): Promise<ApiResponse<T>> {
    let url = endpoint;

    // Handle query parameters
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'object' && value !== null) {
            searchParams.append(key, JSON.stringify(value));
          } else if (typeof value === 'string' || typeof value === 'number') {
            searchParams.append(key, String(value));
          } else {
            searchParams.append(key, JSON.stringify(value));
          }
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (options.body) {
      requestOptions.body = JSON.stringify(options.body);
    }

    return this.fetchData<T>(url, requestOptions);
  }
}

// Create and export global API instance
export const api = new FloresYaAPI();

// Make available globally for legacy scripts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.api = api as any;

// Default export
export default api;

if (window.logger) {
  window.logger.success('API', '✅ TypeScript API module loaded and exported');
} else {
  // TypeScript API module loaded and exported
}