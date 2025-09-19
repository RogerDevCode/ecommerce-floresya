export class FloresYaAPI {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('floresya_token');
        if (window.logger) {
            window.logger.info('API', '✅ FloresYaAPI initialized');
        }
        else {
            console.log('[🌐 API] FloresYaAPI initialized');
        }
    }
    log(message, data = null, level = 'info') {
        if (window.logger) {
            window.logger[level]('API', message, data);
        }
        else {
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
    getHeaders(includeAuth = false) {
        this.log('🔄 Getting headers', { includeAuth }, 'info');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (includeAuth && this.token) {
            headers.Authorization = `Bearer ${this.token}`;
            this.log('✅ Authorization header added', {}, 'success');
        }
        return headers;
    }
    async checkConnectivity() {
        try {
            const response = await fetch('/favicon.ico', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async fetchData(endpoint, options = {}) {
        const startTime = Date.now();
        const url = `${this.baseURL}${endpoint}`;
        this.log('🔄 Fetching data', { url, method: options.method || 'GET' }, 'info');
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
            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                }
                catch (jsonError) {
                    this.log('❌ Invalid JSON response', {
                        endpoint,
                        contentType,
                        status: response.status,
                        error: jsonError instanceof Error ? jsonError.message : String(jsonError)
                    }, 'error');
                    throw new Error(`Invalid JSON response from server: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
                }
            }
            else {
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
                    data: null
                };
            }
            if (!response.ok) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isNetworkError = errorMessage.includes('NetworkError') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch');
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
    async getProducts(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (typeof value === 'boolean') {
                    params.append(key, value.toString());
                }
                else {
                    params.append(key, value.toString());
                }
            }
        });
        const queryString = params.toString();
        const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
        this.log('🔄 Getting products', filters, 'info');
        return this.fetchData(endpoint);
    }
    async getProduct(id) {
        this.log('🔄 Getting product', { id }, 'info');
        return this.fetchData(`/products/${id}`);
    }
    async getProductById(id) {
        return this.getProduct(id);
    }
    async getProductByIdWithOccasions(id) {
        this.log('🔄 Getting product with occasions', { id }, 'info');
        return this.fetchData(`/products/${id}/with-occasions`);
    }
    async createProduct(productData) {
        this.log('🔄 Creating product', { name: productData.name }, 'info');
        return this.fetchData('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }
    async updateProduct(productData) {
        const { id, ...updateData } = productData;
        this.log('🔄 Updating product', { id, name: updateData.name }, 'info');
        return this.fetchData(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }
    async deleteProduct(id) {
        this.log('🔄 Deleting product', { id }, 'info');
        return this.fetchData(`/products/${id}`, {
            method: 'DELETE'
        });
    }
    async getOccasions() {
        this.log('🔄 Getting occasions', {}, 'info');
        return this.fetchData('/occasions');
    }
    async getOccasionById(id) {
        this.log('🔄 Getting occasion by ID', { id }, 'info');
        return this.fetchData(`/occasions/${id}`);
    }
    async createOccasion(occasionData) {
        this.log('🔄 Creating occasion', { name: occasionData.name, type: occasionData.type }, 'info');
        return this.fetchData('/occasions', {
            method: 'POST',
            body: JSON.stringify(occasionData)
        });
    }
    async updateOccasion(occasionData) {
        const { id, ...updateData } = occasionData;
        this.log('🔄 Updating occasion', { id, name: updateData.name }, 'info');
        return this.fetchData(`/occasions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }
    async deleteOccasion(id) {
        this.log('🔄 Deleting occasion', { id }, 'info');
        return this.fetchData(`/occasions/${id}`, {
            method: 'DELETE'
        });
    }
    async getCarousel() {
        this.log('🔄 Getting carousel products', {}, 'info');
        const response = await this.fetchData('/products/carousel');
        if (response.success && response.data) {
            this.log('✅ Carousel data received', {
                count: response.data.carousel_products?.length ?? 0,
                firstProduct: response.data.carousel_products?.[0] ?? null
            }, 'success');
        }
        return response;
    }
    async getSetting(key) {
        this.log('🔄 Getting setting', { key }, 'info');
        return this.fetchData(`/settings/${key}`);
    }
    async login(email, password) {
        this.log('🔄 Attempting login', { email }, 'info');
        const response = await this.fetchData('/auth/login', {
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
    async register(userData) {
        this.log('🔄 Attempting registration', { email: userData.email }, 'info');
        const response = await this.fetchData('/auth/register', {
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
    async logout() {
        this.log('🔄 Logging out', {}, 'info');
        this.token = null;
        localStorage.removeItem('floresya_token');
        this.log('✅ Logout successful', {}, 'success');
    }
    async createUser(userData) {
        this.log('🔄 Creating user', { email: userData.email, role: userData.role }, 'info');
        return this.fetchData('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    async getUsers(params = {}) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value.toString());
            }
        });
        const queryString = queryParams.toString();
        const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
        this.log('🔄 Getting users', params, 'info');
        return this.fetchData(endpoint);
    }
    async getUserById(id) {
        this.log('🔄 Getting user by ID', { id }, 'info');
        return this.fetchData(`/users/${id}`);
    }
    async updateUser(userData) {
        const { id, ...updateData } = userData;
        this.log('🔄 Updating user', { id, email: updateData.email }, 'info');
        return this.fetchData(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }
    async deleteUser(id) {
        this.log('🔄 Deleting user', { id }, 'info');
        return this.fetchData(`/users/${id}`, {
            method: 'DELETE'
        });
    }
    getUser() {
        const token = this.token;
        if (!token)
            return null;
        try {
            const parts = token.split('.');
            if (parts.length !== 3 || !parts[1])
                return null;
            const decodedPayload = atob(parts[1]);
            if (!decodedPayload)
                return null;
            const payload = JSON.parse(decodedPayload);
            return payload.user || null;
        }
        catch (error) {
            this.log('❌ Error decoding token', { error: error instanceof Error ? error.message : String(error) }, 'error');
            return null;
        }
    }
    isAuthenticated() {
        return !!this.token && !!this.getUser();
    }
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    }
    showNotification(message, type = 'info') {
        this.log('🔄 Showing notification', { message, type }, 'info');
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                this.log('✅ Notification removed after timeout', { message, type }, 'success');
            }
        }, 5000);
        this.log('✅ Notification shown successfully', { message, type }, 'success');
    }
    handleError(error) {
        const errorMessage = error instanceof Error ? error.message : error;
        this.log('❌ Handling error', { error: errorMessage }, 'error');
        console.error('API Error:', error);
        this.showNotification(errorMessage || 'Ha ocurrido un error', 'danger');
    }
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
    async getCurrentSiteImages() {
        this.log('🔄 Getting current site images', {}, 'info');
        return this.fetchData('/images/site/current');
    }
    async getImagesGallery(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.filter)
            queryParams.append('filter', params.filter);
        if (params.page)
            queryParams.append('page', params.page.toString());
        if (params.limit)
            queryParams.append('limit', params.limit.toString());
        const queryString = queryParams.toString();
        const endpoint = `/images/gallery${queryString ? `?${queryString}` : ''}`;
        this.log('🔄 Getting images gallery', params, 'info');
        return this.fetchData(endpoint);
    }
    async uploadSiteImage(formData) {
        this.log('🔄 Uploading site image', {}, 'info');
        const url = `${this.baseURL}/images/site`;
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        this.log('✅ Site image uploaded successfully', { type: data.data?.type ?? 'unknown' }, 'success');
        return data;
    }
    async deleteImage(imageId) {
        this.log('🔄 Deleting image', { imageId }, 'info');
        return this.fetchData(`/images/${imageId}`, {
            method: 'DELETE'
        });
    }
    async getProductsWithImageCounts(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.sort_by)
            queryParams.append('sort_by', params.sort_by);
        if (params.sort_direction)
            queryParams.append('sort_direction', params.sort_direction);
        const queryString = queryParams.toString();
        const endpoint = `/images/products-with-counts${queryString ? `?${queryString}` : ''}`;
        this.log('🔄 Getting products with image counts', params, 'info');
        return this.fetchData(endpoint);
    }
    async request(endpoint, options = {}) {
        let url = endpoint;
        if (options.params) {
            const searchParams = new URLSearchParams();
            Object.entries(options.params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    searchParams.append(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                url += (url.includes('?') ? '&' : '?') + queryString;
            }
        }
        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (options.body) {
            requestOptions.body = JSON.stringify(options.body);
        }
        return this.fetchData(url, requestOptions);
    }
}
export const api = new FloresYaAPI();
window.api = api;
export default api;
if (window.logger) {
    window.logger.success('API', '✅ TypeScript API module loaded and exported');
}
else {
    console.log('[🌐 API] TypeScript API module loaded and exported');
}
