// API utility functions for FloresYa
// Logging exhaustivo para confirmar ejecución y errores

class FloresYaAPI {
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

    log(message, data = null, level = 'info') {
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
    getHeaders(includeAuth = false) {
        this.log('🔄 Getting headers', { includeAuth }, 'info');
        
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers.Authorization = `Bearer ${this.token}`;
            this.log('✅ Authorization header added', {}, 'success');
        } else if (includeAuth && !this.token) {
            this.log('⚠️ Authorization requested but no token available', {}, 'warn');
        }

        return headers;
    }

    // Helper method to handle responses
    async handleResponse(response) {
        this.log('🔄 Handling response', { 
            url: response.url,
            status: response.status,
            ok: response.ok
        }, 'info');
        
        try {
            const data = await response.json();
            
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
            }, 'success');
            
            return data;
        } catch (error) {
            this.log('❌ Error handling response', { 
                error: error.message,
                responseUrl: response.url
            }, 'error');
            throw error;
        }
    }

    // Show/hide loading spinner
    showLoading() {
        this.log('🔄 Showing loading spinner', {}, 'info');
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('show');
            this.log('✅ Loading spinner shown', {}, 'success');
        } else {
            this.log('⚠️ Loading spinner not found', {}, 'warn');
        }
    }

    hideLoading() {
        this.log('🔄 Hiding loading spinner', {}, 'info');
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('show');
            this.log('✅ Loading spinner hidden', {}, 'success');
        } else {
            this.log('⚠️ Loading spinner not found', {}, 'warn');
        }
    }

    // Authentication methods
    async login(email, password) {
        this.log('🔄 Login attempt', { email }, 'info');
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email, password })
            });

            const data = await this.handleResponse(response);
            
            if (data.success) {
                this.setAuth(data.data.token, data.data.user);
                this.log('✅ Login successful', { user: data.data.user }, 'success');
            } else {
                this.log('⚠️ Login failed', { data }, 'warn');
            }
            
            return data;
        } catch (error) {
            this.log('❌ Login error', { error: error.message }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async register(userData) {
        this.log('🔄 Register attempt', { email: userData.email }, 'info');
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(userData)
            });

            const data = await this.handleResponse(response);
            
            if (data.success) {
                this.setAuth(data.data.token, data.data.user);
                this.log('✅ Registration successful', { user: data.data.user }, 'success');
            } else {
                this.log('⚠️ Registration failed', { data }, 'warn');
            }
            
            return data;
        } catch (error) {
            this.log('❌ Registration error', { error: error.message }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async getProfile() {
        this.log('🔄 Getting user profile', {}, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/auth/profile`, {
                headers: this.getHeaders(true)
            });

            const data = await this.handleResponse(response);
            this.log('✅ Profile retrieved successfully', { data }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error getting profile', { error: error.message }, 'error');
            throw error;
        }
    }

    // Product methods
    async getProducts(params = {}) {
        this.log('🔄 Getting products', { params }, 'info');
        
        try {
            this.showLoading();
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.baseURL}/products?${queryString}`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse(response);
            this.log('✅ Products retrieved successfully', { count: data.data?.length || 0 }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error getting products', { error: error.message, params }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async getFeaturedProducts(limit = 8) {
        this.log('🔄 Getting featured products', { limit }, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/products/featured?limit=${limit}`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse(response);
            this.log('✅ Featured products retrieved successfully', { count: data.data?.length || 0 }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error getting featured products', { error: error.message, limit }, 'error');
            throw error;
        }
    }

    async getProductById(id) {
        this.log('🔄 Getting product by ID', { id }, 'info');
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/products/${id}`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse(response);
            this.log('✅ Product retrieved successfully', { id, product: data.data }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error getting product by ID', { error: error.message, id }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Alias for getProductById
    async getProduct(id) {
        this.log('🔄 Getting product (alias)', { id }, 'info');
        return await this.getProductById(id);
    }

    // Get all products with admin support
    async getAllProducts(params = {}) {
        this.log('🔄 Getting all products', { params }, 'info');
        
        try {
            this.showLoading();
            
            // Add admin_mode if user is admin
            const user = this.getUser();
            if (user && user.role === 'admin') {
                params.admin_mode = 'true';
                this.log('✅ Admin mode enabled for products request', {}, 'success');
            }
            
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.baseURL}/products?${queryString}`, {
                headers: this.getHeaders(true) // Include auth for admin
            });

            const data = await this.handleResponse(response);
            this.log('✅ All products retrieved successfully', { count: data.data?.length || 0 }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error getting all products', { error: error.message, params }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Category methods
    async getCategories() {
        this.log('🔄 Getting categories', {}, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/categories`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse(response);
            this.log('✅ Categories retrieved successfully', { count: data.data?.length || 0 }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error getting categories', { error: error.message }, 'error');
            throw error;
        }
    }

    // Get occasions
    async getOccasions() {
        this.log('🔄 Getting occasions', {}, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/occasions`, {
                headers: this.getHeaders()
            });
            const data = await this.handleResponse(response);
            this.log('✅ Occasions retrieved successfully', { count: data.data?.length || 0 }, 'success');
            return data;
        } catch (error) {
            this.log('⚠️ Failed to load occasions, using fallback', { error: error.message }, 'warn');
            // Return fallback occasions if API fails
            const fallbackData = {
                success: true,
                data: [
                    { id: 1, name: 'San Valentín', icon: 'bi-heart-fill', color: '#dc3545' },
                    { id: 4, name: 'Cumpleaños', icon: 'bi-gift-fill', color: '#ffc107' },
                    { id: 5, name: 'Aniversario', icon: 'bi-heart-arrow', color: '#e91e63' },
                    { id: 2, name: 'Día de la Madre', icon: 'bi-person-heart', color: '#fd7e14' }
                ]
            };
            this.log('✅ Fallback occasions provided', { count: fallbackData.data.length }, 'success');
            return fallbackData;
        }
    }

    // Order methods
    async createOrder(orderData) {
        this.log('🔄 Creating order', { orderData }, 'info');
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify(orderData)
            });

            const data = await this.handleResponse(response);
            this.log('✅ Order created successfully', { orderId: data.data?.id }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error creating order', { error: error.message, orderData }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async getOrder(orderId) {
        this.log('🔄 Getting order by ID', { orderId }, 'info');
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/orders/${orderId}`, {
                headers: this.getHeaders(true)
            });

            const data = await this.handleResponse(response);
            this.log('✅ Order retrieved successfully', { orderId, order: data.data }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error getting order by ID', { error: error.message, orderId }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async getUserOrders(params = {}) {
        this.log('🔄 Getting user orders', { params }, 'info');
        
        try {
            this.showLoading();
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.baseURL}/orders/my-orders?${queryString}`, {
                headers: this.getHeaders(true)
            });

            const data = await this.handleResponse(response);
            this.log('✅ User orders retrieved successfully', { count: data.data?.length || 0 }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error getting user orders', { error: error.message, params }, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Payment methods
    async getPaymentMethods() {
        this.log('🔄 Getting payment methods', {}, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/payment-methods`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse(response);
            this.log('✅ Payment methods retrieved successfully', { count: data.data?.length || 0 }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error getting payment methods', { error: error.message }, 'error');
            throw error;
        }
    }

    // Settings methods
    async getSettings() {
        this.log('🔄 Getting settings', {}, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/settings`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse(response);
            this.log('✅ Settings retrieved successfully', { count: Object.keys(data.data || {}).length }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error getting settings', { error: error.message }, 'error');
            throw error;
        }
    }

    async getSetting(key) {
        this.log('🔄 Getting setting by key', { key }, 'info');
        
        try {
            const response = await fetch(`${this.baseURL}/settings/${key}`, {
                headers: this.getHeaders()
            });

            const data = await this.handleResponse(response);
            this.log('✅ Setting retrieved successfully', { key, value: data.data }, 'success');
            return data;
        } catch (error) {
            this.log('❌ Error getting setting by key', { error: error.message, key }, 'error');
            throw error;
        }
    }

    // Authentication helpers
    setAuth(token, user) {
        this.log('🔄 Setting authentication', { user }, 'info');
        
        this.token = token;
        localStorage.setItem('floresya_token', token);
        localStorage.setItem('floresya_user', JSON.stringify(user));
        this.log('✅ Authentication set successfully', {}, 'success');
    }

    clearAuth() {
        this.log('🔄 Clearing authentication', {}, 'info');
        
        this.token = null;
        localStorage.removeItem('floresya_token');
        localStorage.removeItem('floresya_user');
        this.log('✅ Authentication cleared successfully', {}, 'success');
    }

    getUser() {
        this.log('🔄 Getting user from localStorage', {}, 'info');
        
        const userData = localStorage.getItem('floresya_user');
        if (userData) {
            const user = JSON.parse(userData);
            this.log('✅ User retrieved successfully', { user }, 'success');
            return user;
        } else {
            this.log('⚠️ No user found in localStorage', {}, 'warn');
            return null;
        }
    }

    isAuthenticated() {
        const isAuthenticated = !!this.token;
        this.log('🔄 Checking authentication status', { isAuthenticated }, 'info');
        return isAuthenticated;
    }

    // Utility methods
    formatCurrency(amount) {
        this.log('🔄 Formatting currency', { amount }, 'info');
        
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
        
        this.log('✅ Currency formatted successfully', { amount, formatted }, 'success');
        return formatted;
    }

    formatDate(dateString) {
        this.log('🔄 Formatting date', { dateString }, 'info');
        
        const date = new Date(dateString);
        const formatted = date.toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        this.log('✅ Date formatted successfully', { dateString, formatted }, 'success');
        return formatted;
    }

    // Show notifications
    showNotification(message, type = 'success') {
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
                this.log('✅ Notification removed after timeout', { message, type }, 'success');
            }
        }, 5000);
        
        this.log('✅ Notification shown successfully', { message, type }, 'success');
    }

    // Handle errors
    handleError(error) {
        this.log('❌ Handling error', { error: error.message }, 'error');
        console.error('API Error:', error);
        this.showNotification(error.message || 'Ha ocurrido un error', 'danger');
    }

    // Debounce utility for search
    debounce(func, wait) {
        this.log('🔄 Creating debounce function', { wait }, 'info');
        
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Create global API instance
const api = new FloresYaAPI();

if (window.logger) {
    window.logger.success('API', '✅ Global API instance created');
} else {
    console.log('[🌐 API] Global API instance created');
}