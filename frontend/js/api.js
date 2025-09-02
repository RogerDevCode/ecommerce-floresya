// API utility functions for FloresYa

class FloresYaAPI {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('floresya_token');
    }

    // Helper method to get headers
    getHeaders(includeAuth = false) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Helper method to handle responses
    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                this.clearAuth();
                window.location.reload();
            }
            throw new Error(data.message || 'Error en la solicitud');
        }
        
        return data;
    }

    // Show/hide loading spinner
    showLoading() {
        document.getElementById('loadingSpinner')?.classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingSpinner')?.classList.remove('show');
    }

    // Authentication methods
    async login(email, password) {
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
            }
            
            return data;
        } catch (error) {
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async register(userData) {
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
            }
            
            return data;
        } catch (error) {
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async getProfile() {
        try {
            const response = await fetch(`${this.baseURL}/auth/profile`, {
                headers: this.getHeaders(true)
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Product methods
    async getProducts(params = {}) {
        try {
            this.showLoading();
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.baseURL}/products?${queryString}`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async getFeaturedProducts(limit = 8) {
        try {
            const response = await fetch(`${this.baseURL}/products/featured?limit=${limit}`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    async getProductById(id) {
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/products/${id}`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Alias for getProductById
    async getProduct(id) {
        return await this.getProductById(id);
    }

    // Get all products with admin support
    async getAllProducts(params = {}) {
        try {
            this.showLoading();
            
            // Add admin_mode if user is admin
            const user = this.getUser();
            if (user && user.role === 'admin') {
                params.admin_mode = 'true';
            }
            
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.baseURL}/products?${queryString}`, {
                headers: this.getHeaders(true) // Include auth for admin
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Category methods
    async getCategories() {
        try {
            const response = await fetch(`${this.baseURL}/categories`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Order methods
    async createOrder(orderData) {
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify(orderData)
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async getOrder(orderId) {
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/orders/${orderId}`, {
                headers: this.getHeaders(true)
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async getUserOrders(params = {}) {
        try {
            this.showLoading();
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.baseURL}/orders/my-orders?${queryString}`, {
                headers: this.getHeaders(true)
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    // Payment methods
    async getPaymentMethods() {
        try {
            const response = await fetch(`${this.baseURL}/payment-methods`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Settings methods
    async getSettings() {
        try {
            const response = await fetch(`${this.baseURL}/settings`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    async getSetting(key) {
        try {
            const response = await fetch(`${this.baseURL}/settings/${key}`, {
                headers: this.getHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Authentication helpers
    setAuth(token, user) {
        this.token = token;
        localStorage.setItem('floresya_token', token);
        localStorage.setItem('floresya_user', JSON.stringify(user));
    }

    clearAuth() {
        this.token = null;
        localStorage.removeItem('floresya_token');
        localStorage.removeItem('floresya_user');
    }

    getUser() {
        const userData = localStorage.getItem('floresya_user');
        return userData ? JSON.parse(userData) : null;
    }

    isAuthenticated() {
        return !!this.token;
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Show notifications
    showNotification(message, type = 'success') {
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
            }
        }, 5000);
    }

    // Handle errors
    handleError(error) {
        console.error('API Error:', error);
        this.showNotification(error.message || 'Ha ocurrido un error', 'danger');
    }

    // Debounce utility for search
    debounce(func, wait) {
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