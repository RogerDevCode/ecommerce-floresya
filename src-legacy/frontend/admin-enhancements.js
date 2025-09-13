/**
 * Mejoras para el Panel de Administración - FloresYa
 * Logging avanzado y funcionalidades CRUD mejoradas
 */

// Enhanced logging functions for admin panel
if (typeof AdminApp !== 'undefined' && AdminApp.prototype) {
    
    // Override critical functions with enhanced logging
    const originalInit = AdminApp.prototype.init;
    AdminApp.prototype.init = async function() {
        const timer = this.logger?.startTimer ? this.logger.startTimer('AdminApp.init') : null;
        
        try {
            this.logger?.info && this.logger.info('ADMIN', 'Initializing Admin Panel', {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            });
            
            const result = await originalInit.call(this);
            
            this.logger?.success && this.logger.success('ADMIN', 'Admin Panel initialized successfully');
            return result;
            
        } catch (error) {
            this.logger?.error && this.logger.error('ADMIN', 'Failed to initialize Admin Panel', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        } finally {
            timer && timer.end('ADMIN');
        }
    };

    // Enhanced product creation logging
    const originalShowProductModal = AdminApp.prototype.showProductModal;
    AdminApp.prototype.showProductModal = function() {
        this.logger?.user && this.logger.user('ADMIN', 'Product modal opened');
        return originalShowProductModal.call(this);
    };

    // Enhanced order management logging
    const originalLoadOrders = AdminApp.prototype.loadOrders;
    AdminApp.prototype.loadOrders = async function() {
        const timer = this.logger?.startTimer ? this.logger.startTimer('loadOrders') : null;
        
        try {
            this.logger?.info && this.logger.info('ADMIN', 'Loading orders data');
            const result = await originalLoadOrders.call(this);
            
            this.logger?.success && this.logger.success('ADMIN', 'Orders loaded successfully', {
                orderCount: this.orders?.length || 0
            });
            
            return result;
        } catch (error) {
            this.logger?.error && this.logger.error('ADMIN', 'Failed to load orders', {
                error: error.message
            });
            throw error;
        } finally {
            timer && timer.end('ADMIN');
        }
    };

    // Enhanced search functionality with logging
    AdminApp.prototype.enhancedSearch = function(searchType, searchTerm, filters = {}) {
        const timer = this.logger?.startTimer ? this.logger.startTimer(`search-${searchType}`) : null;
        
        this.logger?.user && this.logger.user('SEARCH', `${searchType} search initiated`, {
            searchTerm,
            filters,
            timestamp: new Date().toISOString()
        });

        try {
            let results = [];
            
            switch (searchType) {
                case 'products':
                    results = this.searchProductsEnhanced(searchTerm, filters);
                    break;
                case 'orders':
                    results = this.searchOrdersEnhanced(searchTerm, filters);
                    break;
                case 'payments':
                    results = this.searchPaymentsEnhanced(searchTerm, filters);
                    break;
            }

            this.logger?.success && this.logger.success('SEARCH', `${searchType} search completed`, {
                searchTerm,
                resultCount: results.length,
                duration: timer ? timer.end('ADMIN').duration : 0
            });

            return results;
        } catch (error) {
            this.logger?.error && this.logger.error('SEARCH', `${searchType} search failed`, {
                searchTerm,
                error: error.message
            });
            timer && timer.end('ADMIN');
            throw error;
        }
    };

    // Enhanced product search
    AdminApp.prototype.searchProductsEnhanced = function(searchTerm, filters) {
        if (!this.products) return [];

        return this.products.filter(product => {
            // Text search
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Category filter
            const matchesCategory = !filters.category || 
                product.category === filters.category;

            // Status filter
            const matchesStatus = filters.status === undefined || 
                (filters.status === 'active' && product.active) ||
                (filters.status === 'inactive' && !product.active) ||
                (filters.status === 'featured' && product.featured);

            // Stock filter
            const matchesStock = !filters.lowStock || 
                (product.stock_quantity || 0) < 5;

            return matchesSearch && matchesCategory && matchesStatus && matchesStock;
        });
    };

    // Enhanced order search
    AdminApp.prototype.searchOrdersEnhanced = function(searchTerm, filters) {
        if (!this.orders) return [];

        return this.orders.filter(order => {
            // Text search
            const matchesSearch = !searchTerm || 
                (order.order_number || '').toString().includes(searchTerm) ||
                (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const matchesStatus = !filters.status || order.status === filters.status;

            // Date range filter
            const orderDate = new Date(order.created_at);
            const matchesDateFrom = !filters.dateFrom || orderDate >= new Date(filters.dateFrom);
            const matchesDateTo = !filters.dateTo || orderDate <= new Date(filters.dateTo + 'T23:59:59');

            // Amount filter
            const matchesAmount = !filters.minAmount || 
                parseFloat(order.total_amount) >= parseFloat(filters.minAmount);

            return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesAmount;
        });
    };

    // Enhanced payment search
    AdminApp.prototype.searchPaymentsEnhanced = function(searchTerm, filters) {
        if (!this.payments) return [];

        return this.payments.filter(payment => {
            // Text search
            const matchesSearch = !searchTerm || 
                (payment.reference_number || '').toString().includes(searchTerm) ||
                (payment.order_number || '').toString().includes(searchTerm);

            // Status filter
            const matchesStatus = !filters.status || payment.status === filters.status;

            // Payment method filter
            const matchesMethod = !filters.method || payment.payment_method === filters.method;

            return matchesSearch && matchesStatus && matchesMethod;
        });
    };

    // Enhanced error handling with detailed logging
    AdminApp.prototype.handleError = function(error, context = {}) {
        const errorDetails = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            currentSection: this.currentSection,
            ...context
        };

        this.logger?.error && this.logger.error('ADMIN', 'Admin panel error', errorDetails, error);

        // Store error in session for debugging
        try {
            const sessionErrors = JSON.parse(sessionStorage.getItem('admin_errors') || '[]');
            sessionErrors.push(errorDetails);
            
            // Keep only last 50 errors
            if (sessionErrors.length > 50) {
                sessionErrors.splice(0, sessionErrors.length - 50);
            }
            
            sessionStorage.setItem('admin_errors', JSON.stringify(sessionErrors));
        } catch (storageError) {
            console.warn('Failed to store error in session storage:', storageError);
        }

        // Show user-friendly error message
        const userMessage = this.getUserFriendlyErrorMessage(error);
        api?.showNotification?.(userMessage, 'danger') || alert(userMessage);
    };

    // Convert technical errors to user-friendly messages
    AdminApp.prototype.getUserFriendlyErrorMessage = function(error) {
        const errorMappings = {
            'Network request failed': 'Error de conexión. Verifica tu internet.',
            'fetch failed': 'Error de conexión con el servidor.',
            'Unauthorized': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            'Forbidden': 'No tienes permisos para realizar esta acción.',
            'Not Found': 'El recurso solicitado no existe.',
            'Internal Server Error': 'Error interno del servidor. Intenta más tarde.',
            'Bad Request': 'Los datos enviados no son válidos.'
        };

        const message = error.message || error.toString();
        
        for (const [techMessage, userMessage] of Object.entries(errorMappings)) {
            if (message.includes(techMessage)) {
                return userMessage;
            }
        }

        return 'Ha ocurrido un error inesperado. Intenta nuevamente.';
    };

    // Performance monitoring for admin actions
    AdminApp.prototype.monitorPerformance = function(actionName, actionFunction) {
        return async (...args) => {
            const startTime = performance.now();
            const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            try {
                this.logger?.info && this.logger.info('PERF', `Starting ${actionName}`);
                
                const result = await actionFunction.apply(this, args);
                
                const endTime = performance.now();
                const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                const duration = endTime - startTime;
                const memoryDelta = endMemory - startMemory;

                this.logger?.info && this.logger.info('PERF', `${actionName} completed`, {
                    duration: `${duration.toFixed(2)}ms`,
                    memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
                    success: true
                });

                // Log slow operations
                if (duration > 1000) {
                    this.logger?.warn && this.logger.warn('PERF', `Slow operation detected: ${actionName}`, {
                        duration: `${duration.toFixed(2)}ms`
                    });
                }

                return result;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;

                this.logger?.error && this.logger.error('PERF', `${actionName} failed`, {
                    duration: `${duration.toFixed(2)}ms`,
                    error: error.message
                });

                throw error;
            }
        };
    };

    // Advanced validation functions
    AdminApp.prototype.validateProductData = function(productData) {
        const errors = [];

        // Required fields validation
        if (!productData.name || productData.name.trim().length < 3) {
            errors.push('El nombre del producto debe tener al menos 3 caracteres');
        }

        if (!productData.price || productData.price <= 0) {
            errors.push('El precio debe ser mayor a 0');
        }

        if (productData.stock_quantity < 0) {
            errors.push('El stock no puede ser negativo');
        }

        // Business rules validation
        if (productData.price > 1000) {
            errors.push('El precio parece muy alto. Verifica que sea correcto.');
        }

        if (productData.name.length > 100) {
            errors.push('El nombre del producto es muy largo (máximo 100 caracteres)');
        }

        // Log validation results
        if (errors.length > 0) {
            this.logger?.warn && this.logger.warn('VALIDATION', 'Product validation failed', {
                errors,
                productData: { ...productData, description: '[truncated]' }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    };

    // Real-time data refresh with logging
    AdminApp.prototype.setupAutoRefresh = function(intervalMinutes = 5) {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        this.logger?.info && this.logger.info('ADMIN', 'Setting up auto-refresh', {
            intervalMinutes
        });

        this.autoRefreshInterval = setInterval(async () => {
            if (document.hidden) {
                // Don't refresh when page is not visible
                this.logger?.debug && this.logger.debug('ADMIN', 'Skipping auto-refresh - page not visible');
                return;
            }

            try {
                this.logger?.info && this.logger.info('ADMIN', 'Auto-refresh triggered');

                // Refresh current section data
                switch (this.currentSection) {
                    case 'dashboard':
                        await this.loadDashboard();
                        break;
                    case 'orders':
                        await this.loadOrders();
                        break;
                    case 'payments':
                        await this.loadPayments();
                        break;
                    case 'products':
                        await this.loadProducts();
                        break;
                }

                this.logger?.success && this.logger.success('ADMIN', 'Auto-refresh completed');
            } catch (error) {
                this.logger?.error && this.logger.error('ADMIN', 'Auto-refresh failed', {
                    error: error.message
                });
            }
        }, intervalMinutes * 60 * 1000);
    };

    // Enhanced data export functionality
    AdminApp.prototype.exportData = function(dataType, format = 'csv') {
        const timer = this.logger?.startTimer ? this.logger.startTimer(`export-${dataType}`) : null;

        try {
            this.logger?.user && this.logger.user('EXPORT', `Data export initiated`, {
                dataType,
                format
            });

            let data = [];
            let filename = '';
            let headers = [];

            switch (dataType) {
                case 'products':
                    data = this.products || [];
                    filename = `productos_${new Date().toISOString().split('T')[0]}.${format}`;
                    headers = ['ID', 'Nombre', 'Precio', 'Stock', 'Categoría', 'Estado'];
                    break;
                case 'orders':
                    data = this.orders || [];
                    filename = `pedidos_${new Date().toISOString().split('T')[0]}.${format}`;
                    headers = ['ID', 'Número', 'Cliente', 'Total', 'Estado', 'Fecha'];
                    break;
                case 'payments':
                    data = this.payments || [];
                    filename = `pagos_${new Date().toISOString().split('T')[0]}.${format}`;
                    headers = ['ID', 'Pedido', 'Monto', 'Método', 'Estado', 'Fecha'];
                    break;
            }

            if (data.length === 0) {
                throw new Error('No hay datos para exportar');
            }

            let exportContent = '';

            if (format === 'csv') {
                exportContent = this.generateCSV(data, headers, dataType);
            } else if (format === 'json') {
                exportContent = JSON.stringify(data, null, 2);
            }

            this.downloadFile(exportContent, filename, format);

            this.logger?.success && this.logger.success('EXPORT', 'Data exported successfully', {
                dataType,
                format,
                recordCount: data.length,
                filename
            });

            timer && timer.end('ADMIN');

        } catch (error) {
            this.logger?.error && this.logger.error('EXPORT', 'Data export failed', {
                dataType,
                format,
                error: error.message
            });

            timer && timer.end('ADMIN');
            throw error;
        }
    };

    // Generate CSV content
    AdminApp.prototype.generateCSV = function(data, headers, dataType) {
        const csvRows = [headers.join(',')];

        data.forEach(item => {
            let row = [];
            
            switch (dataType) {
                case 'products':
                    row = [
                        item.id || '',
                        `"${(item.name || '').replace(/"/g, '""')}"`,
                        item.price || '0',
                        item.stock_quantity || '0',
                        item.category || '',
                        item.active ? 'Activo' : 'Inactivo'
                    ];
                    break;
                case 'orders':
                    row = [
                        item.id || '',
                        item.order_number || '',
                        `"${(item.customer_name || '').replace(/"/g, '""')}"`,
                        item.total_amount || '0',
                        item.status || '',
                        new Date(item.created_at).toLocaleDateString()
                    ];
                    break;
                case 'payments':
                    row = [
                        item.id || '',
                        item.order_id || '',
                        item.amount || '0',
                        item.payment_method || '',
                        item.status || '',
                        new Date(item.created_at).toLocaleDateString()
                    ];
                    break;
            }
            
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    };

    // Download file utility
    AdminApp.prototype.downloadFile = function(content, filename, format) {
        const mimeTypes = {
            'csv': 'text/csv;charset=utf-8;',
            'json': 'application/json;charset=utf-8;'
        };

        const blob = new Blob([content], { type: mimeTypes[format] });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };
}

// Initialize enhanced admin features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof adminApp !== 'undefined') {
        // Set up auto-refresh
        adminApp.setupAutoRefresh && adminApp.setupAutoRefresh(5);
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        adminApp.logger?.user && adminApp.logger.user('SHORTCUT', 'Save shortcut triggered');
                        // Trigger save action for current section
                        break;
                    case 'r':
                        e.preventDefault();
                        adminApp.logger?.user && adminApp.logger.user('SHORTCUT', 'Refresh shortcut triggered');
                        location.reload();
                        break;
                    case 'f':
                        e.preventDefault();
                        adminApp.logger?.user && adminApp.logger.user('SHORTCUT', 'Search shortcut triggered');
                        // Focus search input
                        const searchInput = document.querySelector('input[type="search"], input[placeholder*="buscar"]');
                        if (searchInput) {
                            searchInput.focus();
                        }
                        break;
                }
            }
        });

        console.log('✅ Admin panel enhancements loaded successfully');
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminApp };
}