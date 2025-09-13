/**
 * 🌸 FloresYa API Service
 * Professional TypeScript API client for all backend operations
 */

import type {
    ApiResponse,
    Product,
    Occasion,
    User,
    AuthResponse,
    PaginationInfo
} from '@shared/types/api.js';
import type { Logger } from '@shared/types/frontend.js';

// Global window interfaces for this service
declare global {
    interface Window {
        logger?: Logger;
    }
}

interface ApiHeaders {
    [key: string]: string;
}

interface ProductParams {
    page?: number;
    limit?: number;
    search?: string;
    occasionId?: number;
    priceMin?: number;
    priceMax?: number;
    category?: string;
    admin_mode?: string;
}

interface OrderData {
    products: Array<{
        id: number;
        quantity: number;
        price: number;
    }>;
    total: number;
    shipping_address?: string;
    payment_method?: string;
}

interface UserData {
    email: string;
    password: string;
    name?: string;
    phone?: string;
}

class FloresYaAPI {
    private baseURL: string = '/api';
    private token: string | null = null;

    constructor() {
        this.token = localStorage.getItem('floresya_token');
        
        // Initialize with logging
        if (window.logger) {
            window.logger.info('API', '✅ FloresYaAPI initialized');
        } else {
            console.log('[🌐 API] FloresYaAPI initialized');
        }
    }

    private log(message: string, data: any = null, level: keyof Logger = 'info'): void {
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
    private getHeaders(includeAuth: boolean = false): ApiHeaders {
        this.log('🔄 Getting headers', { includeAuth }, 'info');
        
        const headers: ApiHeaders = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers.Authorization = `Bearer ${this.token}`;
            this.log('✅ Authorization header added', {}, 'info');
        } else if (includeAuth && !this.token) {
            this.log('⚠️ Authorization requested but no token available', {}, 'warn');
        }

        return headers;
    }

    // Helper method to handle responses
    private async handleResponse<T = any>(response: Response): Promise<ApiResponse<T>> {
        this.log('🔄 Handling response', { 
            url: response.url,
            status: response.status,
            ok: response.ok
        }, 'info');
        
        try {
            const data: ApiResponse<T> = await response.json();
            
            if (!response.ok) {
                this.log('❌ API Error Response', { 
                    status: response.status,
                    message: data.message || 'Error en la solicitud',
                    data
                }, 'error');
                
                if (response.status === 401) {
                    this.log('⚠️ Unauthorized - Clearing auth and reloading', {}, 'warn');
                    this.clearAuth();
                    window.location.reload();
                }
                throw new Error(data.message || 'Error en la solicitud');
            }
            
            this.log('✅ API Success Response', { 
                status: response.status,
                data
            }, 'info');
            
            return data;
        } catch (error) {
            this.log('❌ Error handling response', { 
                error: error instanceof Error ? error.message : String(error),
                responseUrl: response.url
            }, 'error');
            throw error;
        }
    }

    // Show/hide loading spinner
    private showLoading(): void {
        this.log('🔄 Showing loading spinner', {}, 'info');
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('show');
            this.log('✅ Loading spinner shown', {}, 'info');
        } else {
            this.log('⚠️ Loading spinner not found', {}, 'warn');
        }
    }

    private hideLoading(): void {
        this.log('🔄 Hiding loading spinner', {}, 'info');
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('show');
            this.log('✅ Loading spinner hidden', {}, 'info');
        } else {
            this.log('⚠️ Loading spinner not found', {}, 'warn');
        }
    }

    // Authentication methods
    public async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
        this.log('🔄 Login attempt', { email }, 'info');
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email, password })
            });

            const data = await this.handleResponse<AuthResponse>(response);
            
            if (data.success && data.data) {
                this.setAuth(data.data.token!, data.data.user!);
                this.log('✅ Login successful', { user: data.data.user }, 'info');
            } else {
                this.log('⚠️ Login failed', { data }, 'warn');
            }
            
            return data;
        } catch (error) {
            this.log('❌ Login error', { error: error instanceof Error ? error.message : String(error) }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    public async register(userData: UserData): Promise<ApiResponse<AuthResponse>> {
        this.log('🔄 Register attempt', { email: userData.email }, 'info');
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(userData)
            });

            const data = await this.handleResponse<AuthResponse>(response);
            
            if (data.success && data.data) {
                this.setAuth(data.data.token!, data.data.user!);
                this.log('✅ Registration successful', { user: data.data.user }, 'info');
            } else {
                this.log('⚠️ Registration failed', { data }, 'warn');
            }
            
            return data;
        } catch (error) {
            this.log('❌ Registration error', { error: error instanceof Error ? error.message : String(error) }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    public async getProfile(): Promise<ApiResponse<User>> {
        this.log('🔄 Getting user profile', {}, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/auth/profile`, {
                headers: this.getHeaders(true)
            });

            const data = await this.handleResponse<User>(response);
            this.log('✅ Profile retrieved successfully', { data }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error getting profile', { error: error instanceof Error ? error.message : String(error) }, 'error');
            throw error;
        }
    }

    // Product methods
    public async getProducts(params: ProductParams = {}): Promise<ApiResponse<{
        products: Product[];
        pagination: PaginationInfo;
    }>> {
        this.log('🔄 Getting products', { params }, 'info');
        
        try {
            this.showLoading();
            const queryString = new URLSearchParams(params as Record<string, string>).toString();
            const response = await fetch(`${this.baseURL}/products?${queryString}`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse<{
                products: Product[];
                pagination: PaginationInfo;
            }>(response);
            this.log('✅ Products retrieved successfully', { count: data.data?.products?.length || 0 }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error getting products', { error: error instanceof Error ? error.message : String(error), params }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    public async getFeaturedProducts(limit: number = 8): Promise<ApiResponse<Product[]>> {
        this.log('🔄 Getting featured products', { limit }, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/products/featured?limit=${limit}`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse<Product[]>(response);
            this.log('✅ Featured products retrieved successfully', { count: data.data?.length || 0 }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error getting featured products', { error: error instanceof Error ? error.message : String(error), limit }, 'error');
            throw error;
        }
    }

    public async getProductById(id: number): Promise<ApiResponse<Product>> {
        this.log('🔄 Getting product by ID', { id }, 'info');
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/products/${id}`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse<Product>(response);
            this.log('✅ Product retrieved successfully', { id, product: data.data }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error getting product by ID', { error: error instanceof Error ? error.message : String(error), id }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Alias for getProductById
    public async getProduct(id: number): Promise<ApiResponse<Product>> {
        this.log('🔄 Getting product (alias)', { id }, 'info');
        return await this.getProductById(id);
    }

    // Get all products with admin support
    public async getAllProducts(params: ProductParams = {}): Promise<ApiResponse<{
        products: Product[];
        pagination: PaginationInfo;
    }>> {
        this.log('🔄 Getting all products', { params }, 'info');
        
        try {
            this.showLoading();
            
            // Add admin_mode if user is admin
            const user = this.getUser();
            if (user && user.role === 'admin') {
                params.admin_mode = 'true';
                this.log('✅ Admin mode enabled for products request', {}, 'info');
            }
            
            const queryString = new URLSearchParams(params as Record<string, string>).toString();
            const response = await fetch(`${this.baseURL}/products?${queryString}`, {
                headers: this.getHeaders(true) // Include auth for admin
            });

            const data = await this.handleResponse<{
                products: Product[];
                pagination: PaginationInfo;
            }>(response);
            this.log('✅ All products retrieved successfully', { count: data.data?.products?.length || 0 }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error getting all products', { error: error instanceof Error ? error.message : String(error), params }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Category methods
    public async getCategories(): Promise<ApiResponse<any[]>> {
        this.log('🔄 Getting categories', {}, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/categories`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse<any[]>(response);
            this.log('✅ Categories retrieved successfully', { count: data.data?.length || 0 }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error getting categories', { error: error instanceof Error ? error.message : String(error) }, 'error');
            throw error;
        }
    }

    // Get occasions
    public async getOccasions(): Promise<ApiResponse<Occasion[]>> {
        this.log('🔄 Getting occasions', {}, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/occasions`, {
                headers: this.getHeaders()
            });
            const data = await this.handleResponse<Occasion[]>(response);
            this.log('✅ Occasions retrieved successfully', { count: data.data?.length || 0 }, 'info');
            return data;
        } catch (error) {
            this.log('⚠️ Failed to load occasions, using fallback', { error: error instanceof Error ? error.message : String(error) }, 'warn');
            // Return fallback occasions if API fails
            const fallbackData: ApiResponse<Occasion[]> = {
                success: true,
                data: [
                    { id: 1, name: 'San Valentín', icon: 'bi-heart-fill' },
                    { id: 4, name: 'Cumpleaños', icon: 'bi-gift-fill' },
                    { id: 5, name: 'Aniversario', icon: 'bi-heart-arrow' },
                    { id: 2, name: 'Día de la Madre', icon: 'bi-person-heart' }
                ]
            };
            this.log('✅ Fallback occasions provided', { count: fallbackData.data?.length || 0 }, 'info');
            return fallbackData;
        }
    }

    // Order methods
    public async createOrder(orderData: OrderData): Promise<ApiResponse<any>> {
        this.log('🔄 Creating order', { orderData }, 'info');
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify(orderData)
            });

            const data = await this.handleResponse<any>(response);
            this.log('✅ Order created successfully', { orderId: data.data?.id }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error creating order', { error: error instanceof Error ? error.message : String(error), orderData }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    public async getOrder(orderId: number): Promise<ApiResponse<any>> {
        this.log('🔄 Getting order by ID', { orderId }, 'info');
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/orders/${orderId}`, {
                headers: this.getHeaders(true)
            });

            const data = await this.handleResponse<any>(response);
            this.log('✅ Order retrieved successfully', { orderId, order: data.data }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error getting order by ID', { error: error instanceof Error ? error.message : String(error), orderId }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    public async getUserOrders(params: Record<string, string> = {}): Promise<ApiResponse<any[]>> {
        this.log('🔄 Getting user orders', { params }, 'info');
        
        try {
            this.showLoading();
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.baseURL}/orders/my-orders?${queryString}`, {
                headers: this.getHeaders(true)
            });

            const data = await this.handleResponse<any[]>(response);
            this.log('✅ User orders retrieved successfully', { count: data.data?.length || 0 }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error getting user orders', { error: error instanceof Error ? error.message : String(error), params }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Payment methods
    public async getPaymentMethods(): Promise<ApiResponse<any[]>> {
        this.log('🔄 Getting payment methods', {}, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/payment-methods`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse<any[]>(response);
            this.log('✅ Payment methods retrieved successfully', { count: data.data?.length || 0 }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error getting payment methods', { error: error instanceof Error ? error.message : String(error) }, 'error');
            throw error;
        }
    }

    // Settings methods
    public async getSettings(): Promise<ApiResponse<Record<string, any>>> {
        this.log('🔄 Getting settings', {}, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/settings`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse<Record<string, any>>(response);
            this.log('✅ Settings retrieved successfully', { count: Object.keys(data.data || {}).length }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error getting settings', { error: error instanceof Error ? error.message : String(error) }, 'error');
            throw error;
        }
    }

    public async getSetting(key: string): Promise<ApiResponse<any>> {
        this.log('🔄 Getting setting by key', { key }, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/settings/${key}`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse<any>(response);
            this.log('✅ Setting retrieved successfully', { key, value: data.data }, 'info');
            return data;
        } catch (error) {
            this.log('❌ Error getting setting by key', { error: error instanceof Error ? error.message : String(error), key }, 'error');
            throw error;
        }
    }

    // Authentication helpers
    public setAuth(token: string, user: User): void {
        this.log('🔄 Setting authentication', { user }, 'info');
        
        this.token = token;
        localStorage.setItem('floresya_token', token);
        localStorage.setItem('floresya_user', JSON.stringify(user));
        this.log('✅ Authentication set successfully', {}, 'info');
    }

    public clearAuth(): void {
        this.log('🔄 Clearing authentication', {}, 'info');
        
        this.token = null;
        localStorage.removeItem('floresya_token');
        localStorage.removeItem('floresya_user');
        this.log('✅ Authentication cleared successfully', {}, 'info');
    }

    public getUser(): User | null {
        this.log('🔄 Getting user from localStorage', {}, 'info');
        
        const userData = localStorage.getItem('floresya_user');
        if (userData) {
            try {
                const user: User = JSON.parse(userData);
                this.log('✅ User retrieved successfully', { user }, 'info');
                return user;
            } catch (error) {
                this.log('❌ Error parsing user data', { error }, 'error');
                return null;
            }
        } else {
            this.log('⚠️ No user found in localStorage', {}, 'warn');
            return null;
        }
    }

    public isAuthenticated(): boolean {
        const isAuthenticated = !!this.token;
        this.log('🔄 Checking authentication status', { isAuthenticated }, 'info');
        return isAuthenticated;
    }

    // Utility methods
    public formatCurrency(amount: number): string {
        this.log('🔄 Formatting currency', { amount }, 'info');
        
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
        
        this.log('✅ Currency formatted successfully', { amount, formatted }, 'info');
        return formatted;
    }

    public formatDate(dateString: string): string {
        this.log('🔄 Formatting date', { dateString }, 'info');
        
        const date = new Date(dateString);
        const formatted = date.toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        this.log('✅ Date formatted successfully', { dateString, formatted }, 'info');
        return formatted;
    }

    // Show notifications
    public showNotification(message: string, type: string = 'success'): void {
        this.log('🔄 Showing notification', { message, type }, 'info');
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                this.log('✅ Notification removed after timeout', { message, type }, 'info');
            }
        }, 5000);
        
        this.log('✅ Notification shown successfully', { message, type }, 'info');
    }

    // Handle errors
    public handleError(error: Error): void {
        this.log('❌ Handling error', { error: error.message }, 'error');
        console.error('API Error:', error);
        this.showNotification(error.message || 'Ha ocurrido un error', 'danger');
    }

    // Debounce utility for search
    public debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
        this.log('🔄 Creating debounce function', { wait }, 'info');
        
        let timeout: NodeJS.Timeout | null = null;
        return function executedFunction(...args: Parameters<T>) {
            const later = () => {
                if (timeout) clearTimeout(timeout);
                func(...args);
            };
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Create global API instance
const api = new FloresYaAPI();

// Assign to window for global access
(window as any).api = api;

if (window.logger) {
    window.logger.info('API', '✅ Global API instance created');
} else {
    console.log('[🌐 API] Global API instance created');
}

// Export for module systems
export default FloresYaAPI;
export { api };