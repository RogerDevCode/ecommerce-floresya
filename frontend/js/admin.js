// Admin Panel JavaScript for FloresYa

class AdminApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.orders = [];
        this.payments = [];
        this.products = [];
        this.occasions = [];
        this.currentOrdersPage = 1;
        this.currentPaymentsPage = 1;
        this.selectedFiles = [];
        this.existingImages = [];
        this.primaryNewImageIndex = null;
        this.init();
    }

    async init() {
        // Check if user is admin
        if (!this.checkAdminAccess()) {
            return;
        }

        this.bindEvents();
        await this.loadDashboard();
        this.showSection('dashboard');
    }

    // Check admin access
    checkAdminAccess() {
        const user = api.getUser();
        if (!user || user.role !== 'admin') {
            api.showNotification('Acceso denegado. Solo administradores pueden acceder.', 'danger');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return false;
        }
        
        // Update admin user menu
        const adminUserMenu = document.getElementById('adminUserMenu');
        if (adminUserMenu) {
            adminUserMenu.innerHTML = `<i class="bi bi-person-circle"></i> ${user.first_name}`;
        }
        
        return true;
    }

    // Bind events
    bindEvents() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.dataset.section) {
                e.preventDefault();
                this.showSection(e.target.dataset.section);
            }
        });

        // Admin logout
        const adminLogout = document.getElementById('adminLogout');
        if (adminLogout) {
            adminLogout.addEventListener('click', (e) => {
                e.preventDefault();
                api.clearAuth();
                window.location.href = '/';
            });
        }

        // Order status filter
        const orderStatusFilter = document.getElementById('orderStatusFilter');
        if (orderStatusFilter) {
            orderStatusFilter.addEventListener('change', () => {
                this.currentOrdersPage = 1;
                this.loadOrders();
            });
        }

        // Payment status filter
        const paymentStatusFilter = document.getElementById('paymentStatusFilter');
        if (paymentStatusFilter) {
            paymentStatusFilter.addEventListener('change', () => {
                this.currentPaymentsPage = 1;
                this.loadPayments();
            });
        }

        // Search inputs
        const orderSearchInput = document.getElementById('orderSearchInput');
        if (orderSearchInput) {
            const debouncedSearch = api.debounce(() => {
                this.currentOrdersPage = 1;
                this.loadOrders();
            }, 500);
            orderSearchInput.addEventListener('input', debouncedSearch);
        }

        const paymentSearchInput = document.getElementById('paymentSearchInput');
        if (paymentSearchInput) {
            const debouncedSearch = api.debounce(() => {
                this.currentPaymentsPage = 1;
                this.loadPayments();
            }, 500);
            paymentSearchInput.addEventListener('input', debouncedSearch);
        }
    }

    // Show section
    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll(`[data-section="${sectionName}"]`).forEach(item => {
            item.classList.add('active');
        });

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const section = document.getElementById(`${sectionName}-section`);
        if (section) {
            section.classList.add('active');
            this.currentSection = sectionName;
        }

        // Load section data
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'payments':
                this.loadPayments();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'occasions':
                this.loadOccasions();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // Load dashboard data
    async loadDashboard() {
        try {
            // Load recent orders
            const ordersResponse = await fetch('/api/orders/admin/all?limit=5', {
                headers: api.getHeaders(true)
            });
            const ordersData = await api.handleResponse(ordersResponse);

            if (ordersData.success) {
                this.renderRecentOrders(ordersData.data.orders);
                this.updateDashboardStats(ordersData.data.orders);
            }

        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    // Update dashboard stats
    async updateDashboardStats(recentOrders) {
        try {
            // Calculate today's stats
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = recentOrders.filter(order => 
                order.created_at.startsWith(today)
            );

            document.getElementById('todayOrders').textContent = todayOrders.length;
            
            const todaySales = todayOrders.reduce((sum, order) => 
                sum + parseFloat(order.total_amount), 0
            );
            document.getElementById('todaySales').textContent = api.formatCurrency(todaySales);

            // Load pending payments
            const paymentsResponse = await fetch('/api/payments/admin/all?status=pending&limit=1', {
                headers: api.getHeaders(true)
            });
            const paymentsData = await api.handleResponse(paymentsResponse);
            
            if (paymentsData.success) {
                document.getElementById('pendingPayments').textContent = paymentsData.data.pagination.total;
                document.getElementById('pendingPaymentsCount').textContent = paymentsData.data.pagination.total;
            }

            // Load products count
            const productsResponse = await api.getProducts({ limit: 1 });
            if (productsResponse.success) {
                document.getElementById('activeProducts').textContent = productsResponse.data.pagination.total;
            }

            // Update pending orders count
            const pendingOrders = recentOrders.filter(order => order.status === 'pending').length;
            document.getElementById('pendingOrdersCount').textContent = pendingOrders;

        } catch (error) {
            console.error('Error updating dashboard stats:', error);
        }
    }

    // Render recent orders
    renderRecentOrders(orders) {
        const tbody = document.querySelector('#recentOrdersTable tbody');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">No hay pedidos recientes</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${order.order_number}</strong></td>
                <td>${order.user_first_name ? `${order.user_first_name} ${order.user_last_name}` : order.guest_email || 'Cliente invitado'}</td>
                <td>${api.formatCurrency(order.total_amount)}</td>
                <td><span class="badge status-badge status-${order.status}">${this.getStatusText(order.status)}</span></td>
                <td>${api.formatDate(order.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="adminApp.viewOrderDetails(${order.id})">
                        Ver
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Load orders
    async loadOrders() {
        try {
            const statusFilter = document.getElementById('orderStatusFilter')?.value || '';
            const searchQuery = document.getElementById('orderSearchInput')?.value || '';

            const params = new URLSearchParams({
                page: this.currentOrdersPage,
                limit: 20
            });

            if (statusFilter) params.append('status', statusFilter);
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/orders/admin/all?${params}`, {
                headers: api.getHeaders(true)
            });
            const data = await api.handleResponse(response);

            if (data.success) {
                this.orders = data.data.orders;
                this.renderOrdersTable(data.data.orders);
                this.renderOrdersPagination(data.data.pagination);
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // Render orders table
    renderOrdersTable(orders) {
        const tbody = document.querySelector('#ordersTable tbody');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">No se encontraron pedidos</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${order.order_number}</strong></td>
                <td>${order.user_first_name ? `${order.user_first_name} ${order.user_last_name}` : order.guest_email || 'Cliente invitado'}</td>
                <td>${api.formatCurrency(order.total_amount)}</td>
                <td><span class="badge status-badge status-${order.status}">${this.getStatusText(order.status)}</span></td>
                <td>${api.formatDate(order.created_at)}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary" onclick="adminApp.viewOrderDetails(${order.id})">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                        <button class="btn btn-sm btn-outline-warning" onclick="adminApp.updateOrderStatus(${order.id})">
                            <i class="bi bi-arrow-repeat"></i> Estado
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    // Render orders pagination
    renderOrdersPagination(pagination) {
        const container = document.getElementById('ordersPagination');
        if (!container) return;

        const { page, pages } = pagination;
        if (pages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';

        // Previous
        if (page > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="adminApp.goToOrdersPage(${page - 1})">Anterior</a></li>`;
        }

        // Pages
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            html += `<li class="page-item ${i === page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="adminApp.goToOrdersPage(${i})">${i}</a>
            </li>`;
        }

        // Next
        if (page < pages) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="adminApp.goToOrdersPage(${page + 1})">Siguiente</a></li>`;
        }

        container.innerHTML = html;
    }

    // Load payments
    async loadPayments() {
        try {
            const statusFilter = document.getElementById('paymentStatusFilter')?.value || '';
            const searchQuery = document.getElementById('paymentSearchInput')?.value || '';

            const params = new URLSearchParams({
                page: this.currentPaymentsPage,
                limit: 20
            });

            if (statusFilter) params.append('status', statusFilter);
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/payments/admin/all?${params}`, {
                headers: api.getHeaders(true)
            });
            const data = await api.handleResponse(response);

            if (data.success) {
                this.payments = data.data.payments;
                this.renderPaymentsTable(data.data.payments);
                this.renderPaymentsPagination(data.data.pagination);
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // Render payments table
    renderPaymentsTable(payments) {
        const tbody = document.querySelector('#paymentsTable tbody');
        if (!tbody) return;

        if (payments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">No se encontraron pagos</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td><strong>${payment.order_number}</strong></td>
                <td>${payment.payment_method_name}</td>
                <td>${api.formatCurrency(payment.amount)}</td>
                <td>${payment.reference_number || 'N/A'}</td>
                <td><span class="badge status-badge status-${payment.status}">${this.getPaymentStatusText(payment.status)}</span></td>
                <td>${api.formatDate(payment.created_at)}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary" onclick="adminApp.viewPaymentDetails(${payment.id})">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    ${payment.status === 'pending' ? `
                        <button class="btn btn-sm btn-outline-success" onclick="adminApp.verifyPayment(${payment.id}, 'verified')">
                            <i class="bi bi-check"></i> Verificar
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="adminApp.verifyPayment(${payment.id}, 'failed')">
                            <i class="bi bi-x"></i> Rechazar
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    // Get status text
    getStatusText(status) {
        const statusTexts = {
            'pending': 'Pendiente',
            'verified': 'Verificado',
            'preparing': 'Preparando',
            'shipped': 'Enviado',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        };
        return statusTexts[status] || status;
    }

    // Get payment status text
    getPaymentStatusText(status) {
        const statusTexts = {
            'pending': 'Pendiente',
            'verified': 'Verificado',
            'failed': 'Rechazado',
            'refunded': 'Reembolsado'
        };
        return statusTexts[status] || status;
    }

    // View order details
    async viewOrderDetails(orderId) {
        try {
            const response = await api.getOrder(orderId);
            
            if (response.success) {
                this.showOrderDetailsModal(response.data.order);
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // Show order details modal
    showOrderDetailsModal(order) {
        const modalBody = document.getElementById('orderDetailsModalBody');
        if (!modalBody) return;

        const itemsHtml = order.items.map(item => `
            <tr>
                <td>${item.product_name || 'Producto no disponible'}</td>
                <td>${item.quantity}</td>
                <td>${api.formatCurrency(item.unit_price)}</td>
                <td>${api.formatCurrency(item.total_price)}</td>
            </tr>
        `).join('');

        const statusHistoryHtml = order.status_history.map(history => `
            <div class="timeline-item ${history.new_status}">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${this.getStatusText(history.new_status)}</strong>
                        ${history.notes ? `<br><small class="text-muted">${history.notes}</small>` : ''}
                        ${history.first_name ? `<br><small class="text-muted">Por: ${history.first_name} ${history.last_name}</small>` : ''}
                    </div>
                    <small class="text-muted">${api.formatDate(history.created_at)}</small>
                </div>
            </div>
        `).join('');

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información General</h6>
                    <p><strong>Número de Orden:</strong> ${order.order_number}</p>
                    <p><strong>Estado:</strong> <span class="badge status-badge status-${order.status}">${this.getStatusText(order.status)}</span></p>
                    <p><strong>Cliente:</strong> ${order.user_first_name ? `${order.user_first_name} ${order.user_last_name}` : order.guest_email || 'Cliente invitado'}</p>
                    <p><strong>Email:</strong> ${order.user_email || order.guest_email || 'N/A'}</p>
                    <p><strong>Total:</strong> ${api.formatCurrency(order.total_amount)}</p>
                    <p><strong>Fecha:</strong> ${api.formatDate(order.created_at)}</p>
                    ${order.delivery_date ? `<p><strong>Fecha de entrega:</strong> ${new Date(order.delivery_date).toLocaleDateString('es-VE')}</p>` : ''}
                    ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ''}
                </div>
                <div class="col-md-6">
                    <h6>Dirección de Entrega</h6>
                    <address>
                        ${order.shipping_address.first_name} ${order.shipping_address.last_name}<br>
                        ${order.shipping_address.address_line_1}<br>
                        ${order.shipping_address.address_line_2 ? order.shipping_address.address_line_2 + '<br>' : ''}
                        ${order.shipping_address.city}, ${order.shipping_address.state}<br>
                        Tel: ${order.shipping_address.phone}
                    </address>

                    ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                        <div class="mt-3">
                            <button class="btn btn-warning" onclick="adminApp.updateOrderStatus(${order.id})">
                                <i class="bi bi-arrow-repeat"></i> Cambiar Estado
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <hr>
            
            <h6>Productos</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr class="table-success">
                            <th colspan="3">Total del Pedido:</th>
                            <th>${api.formatCurrency(order.total_amount)}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <hr>
            
            <h6>Historial de Estados</h6>
            <div class="order-timeline">
                ${statusHistoryHtml}
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        modal.show();
    }

    // Update order status
    updateOrderStatus(orderId) {
        // Simple prompt for now - can be enhanced with a proper modal
        const newStatus = prompt('Nuevo estado (pending, verified, preparing, shipped, delivered, cancelled):');
        const notes = prompt('Notas (opcional):');

        if (newStatus && ['pending', 'verified', 'preparing', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
            this.submitOrderStatusUpdate(orderId, newStatus, notes);
        } else if (newStatus) {
            api.showNotification('Estado inválido', 'warning');
        }
    }

    // Submit order status update
    async submitOrderStatusUpdate(orderId, status, notes) {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: api.getHeaders(true),
                body: JSON.stringify({ status, notes })
            });

            const data = await api.handleResponse(response);

            if (data.success) {
                api.showNotification('Estado actualizado exitosamente', 'success');
                this.loadOrders();
                this.loadDashboard();
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // View payment details
    async viewPaymentDetails(paymentId) {
        try {
            // This would need a dedicated endpoint, for now show basic info
            const payment = this.payments.find(p => p.id === paymentId);
            if (payment) {
                this.showPaymentDetailsModal(payment);
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // Show payment details modal
    showPaymentDetailsModal(payment) {
        const modalBody = document.getElementById('paymentDetailsModalBody');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información del Pago</h6>
                    <p><strong>Orden:</strong> ${payment.order_number}</p>
                    <p><strong>Método:</strong> ${payment.payment_method_name}</p>
                    <p><strong>Monto:</strong> ${api.formatCurrency(payment.amount)}</p>
                    <p><strong>Estado:</strong> <span class="badge status-badge status-${payment.status}">${this.getPaymentStatusText(payment.status)}</span></p>
                    <p><strong>Referencia:</strong> ${payment.reference_number || 'N/A'}</p>
                    <p><strong>Fecha:</strong> ${api.formatDate(payment.created_at)}</p>
                    ${payment.verified_at ? `<p><strong>Verificado:</strong> ${api.formatDate(payment.verified_at)}</p>` : ''}
                    ${payment.verified_by_first_name ? `<p><strong>Verificado por:</strong> ${payment.verified_by_first_name} ${payment.verified_by_last_name}</p>` : ''}
                </div>
                <div class="col-md-6">
                    ${payment.payment_details ? `
                        <h6>Detalles del Pago</h6>
                        <pre class="bg-light p-2 rounded">${JSON.stringify(payment.payment_details, null, 2)}</pre>
                    ` : ''}
                    
                    ${payment.proof_image_url ? `
                        <h6>Comprobante</h6>
                        <img src="${payment.proof_image_url}" class="img-fluid rounded" onclick="window.open(this.src, '_blank')" style="cursor: pointer; max-height: 300px;">
                    ` : ''}
                    
                    ${payment.status === 'pending' ? `
                        <div class="mt-3">
                            <button class="btn btn-success me-2" onclick="adminApp.verifyPayment(${payment.id}, 'verified')">
                                <i class="bi bi-check"></i> Verificar
                            </button>
                            <button class="btn btn-danger" onclick="adminApp.verifyPayment(${payment.id}, 'failed')">
                                <i class="bi bi-x"></i> Rechazar
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            ${payment.notes ? `
                <hr>
                <h6>Notas</h6>
                <p>${payment.notes}</p>
            ` : ''}
        `;

        const modal = new bootstrap.Modal(document.getElementById('paymentDetailsModal'));
        modal.show();
    }

    // Verify payment
    async verifyPayment(paymentId, status) {
        const notes = prompt('Notas (opcional):');

        try {
            const response = await fetch(`/api/payments/${paymentId}/verify`, {
                method: 'PATCH',
                headers: api.getHeaders(true),
                body: JSON.stringify({ status, notes })
            });

            const data = await api.handleResponse(response);

            if (data.success) {
                api.showNotification(`Pago ${status === 'verified' ? 'verificado' : 'rechazado'} exitosamente`, 'success');
                this.loadPayments();
                this.loadDashboard();
                
                // Hide modal if open
                const modal = bootstrap.Modal.getInstance(document.getElementById('paymentDetailsModal'));
                if (modal) {
                    modal.hide();
                }
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // Pagination handlers
    goToOrdersPage(page) {
        this.currentOrdersPage = page;
        this.loadOrders();
    }

    goToPaymentsPage(page) {
        this.currentPaymentsPage = page;
        this.loadPayments();
    }

    // Refresh functions
    refreshDashboard() {
        this.loadDashboard();
    }

    refreshOrders() {
        this.loadOrders();
    }

    refreshPayments() {
        this.loadPayments();
    }

    refreshProducts() {
        this.loadProducts();
    }

    // Search functions
    searchOrders() {
        this.currentOrdersPage = 1;
        this.loadOrders();
    }

    searchPayments() {
        this.currentPaymentsPage = 1;
        this.loadPayments();
    }

    // Load products (basic implementation)
    async loadProducts() {
        const container = document.getElementById('productsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                La gestión avanzada de productos se implementará en una próxima actualización.
                Por ahora puedes ver los productos desde la página principal.
            </div>
            <div class="text-center">
                <a href="/" class="btn btn-primary" target="_blank">Ver Productos en la Tienda</a>
            </div>
        `;
    }

    // Show product modal (placeholder)
    showProductModal() {
        api.showNotification('Función en desarrollo', 'info');
    }

    // Load settings
    async loadSettings() {
        try {
            // Load exchange rate
            const exchangeRateResponse = await api.getSetting('exchange_rate_bcv');
            if (exchangeRateResponse.success) {
                document.getElementById('defaultBcvRate').value = exchangeRateResponse.data.setting_value;
            }

            // Load shipping cost
            const shippingResponse = await api.getSetting('shipping_cost');
            if (shippingResponse.success) {
                document.getElementById('shippingCost').value = shippingResponse.data.setting_value;
            }

            // Load admin email
            const adminEmailResponse = await api.getSetting('admin_email');
            if (adminEmailResponse.success) {
                document.getElementById('adminEmail').value = adminEmailResponse.data.setting_value;
            }

            // Load email notifications setting
            const emailNotificationsResponse = await api.getSetting('email_notifications');
            if (emailNotificationsResponse.success) {
                document.getElementById('emailNotifications').checked = 
                    emailNotificationsResponse.data.setting_value === 'true';
            }

        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    // Save settings
    async saveSettings() {
        try {
            api.showLoading();

            const settings = [
                {
                    key: 'exchange_rate_bcv',
                    value: document.getElementById('defaultBcvRate').value || '36.50'
                },
                {
                    key: 'shipping_cost',
                    value: document.getElementById('shippingCost').value || '7.00'
                },
                {
                    key: 'admin_email',
                    value: document.getElementById('adminEmail').value || ''
                },
                {
                    key: 'email_notifications',
                    value: document.getElementById('emailNotifications').checked ? 'true' : 'false'
                }
            ];

            // Save each setting
            for (const setting of settings) {
                await this.saveSetting(setting.key, setting.value);
            }

            api.showNotification('Configuraciones guardadas exitosamente', 'success');

            // Refresh cart to update exchange rate if cart is initialized
            if (window.cart) {
                await window.cart.fetchExchangeRate();
                window.cart.updateCartDisplay();
            }

        } catch (error) {
            api.handleError(error);
        } finally {
            api.hideLoading();
        }
    }

    // Save individual setting
    async saveSetting(key, value) {
        const response = await fetch(`/api/settings/${key}`, {
            method: 'PUT',
            headers: api.getHeaders(true),
            body: JSON.stringify({ value })
        });

        return await api.handleResponse(response);
    }

    // Add carousel item with enhanced UI
    addCarouselItem() {
        const modalHtml = `
            <div class="modal fade" id="carouselModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Gestionar Carrusel de Imágenes</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <ul class="nav nav-pills mb-3" role="tablist">
                                <li class="nav-item">
                                    <a class="nav-link active" href="#product-tab" role="tab" data-bs-toggle="tab">
                                        <i class="bi bi-box"></i> Desde Producto
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#manual-tab" role="tab" data-bs-toggle="tab">
                                        <i class="bi bi-pencil"></i> Manual
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#random-tab" role="tab" data-bs-toggle="tab">
                                        <i class="bi bi-shuffle"></i> Aleatorio
                                    </a>
                                </li>
                            </ul>
                            
                            <div class="tab-content">
                                <!-- Product Selection Tab -->
                                <div class="tab-pane fade show active" id="product-tab">
                                    <div class="alert alert-info">
                                        <i class="bi bi-info-circle"></i>
                                        Selecciona un producto para agregarlo al carrusel con su imagen principal
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Seleccionar Producto *</label>
                                        <select class="form-select" id="productSelect">
                                            <option value="">Cargando productos...</option>
                                        </select>
                                    </div>
                                    <div id="productPreview" class="d-none">
                                        <div class="card">
                                            <img id="previewImage" class="card-img-top" style="height: 200px; object-fit: cover;">
                                            <div class="card-body">
                                                <h6 id="previewTitle" class="card-title"></h6>
                                                <p id="previewDescription" class="card-text"></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Manual Entry Tab -->
                                <div class="tab-pane fade" id="manual-tab">
                                    <form id="manualCarouselForm">
                                        <div class="mb-3">
                                            <label class="form-label">Título *</label>
                                            <input type="text" class="form-control" id="carouselTitle" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Descripción</label>
                                            <textarea class="form-control" id="carouselDescription" rows="2"></textarea>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">URL de Imagen *</label>
                                            <input type="url" class="form-control" id="carouselImageUrl" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">URL de Enlace</label>
                                            <input type="url" class="form-control" id="carouselLinkUrl">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Orden de Visualización</label>
                                            <input type="number" class="form-control" id="carouselOrder" value="0" min="0">
                                        </div>
                                    </form>
                                </div>
                                
                                <!-- Random Generation Tab -->
                                <div class="tab-pane fade" id="random-tab">
                                    <div class="alert alert-warning">
                                        <i class="bi bi-exclamation-triangle"></i>
                                        <strong>¡Atención!</strong> Esta acción reemplazará todas las imágenes actuales del carrusel.
                                    </div>
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <i class="bi bi-shuffle display-4 text-primary mb-3"></i>
                                            <h5>Generar Carrusel Aleatorio</h5>
                                            <p class="text-muted">Se seleccionarán automáticamente 5 productos activos con imágenes para crear un carrusel variado</p>
                                            <button type="button" class="btn btn-primary" onclick="adminApp.generateRandomCarousel()">
                                                <i class="bi bi-shuffle"></i> Generar Carrusel Aleatorio
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-success" id="saveCarouselBtn" onclick="adminApp.saveCarouselItem()">
                                <i class="bi bi-check"></i> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('carouselModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Load products for selection
        this.loadProductsForCarousel();
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('carouselModal'));
        modal.show();
        
        // Update save button visibility based on active tab
        document.querySelectorAll('#carouselModal .nav-link').forEach(tab => {
            tab.addEventListener('click', () => {
                const saveBtn = document.getElementById('saveCarouselBtn');
                if (tab.getAttribute('href') === '#random-tab') {
                    saveBtn.style.display = 'none';
                } else {
                    saveBtn.style.display = 'block';
                }
            });
        });
    }

    // Refresh carousel
    async refreshCarousel() {
        try {
            const response = await fetch('/api/carousel/admin');
            const data = await response.json();

            if (data.success) {
                this.displayCarouselItems(data.data.images);
                api.showNotification(`Carrusel actualizado - ${data.data.count} imágenes`, 'success');
            } else {
                api.showNotification(data.message || 'Error al cargar carrusel', 'error');
            }
        } catch (error) {
            console.error('Error refreshing carousel:', error);
            api.showNotification('Error al actualizar carrusel', 'error');
        }
    }

    // Display carousel items in admin
    displayCarouselItems(images) {
        const container = document.getElementById('carouselItemsContainer');
        if (!container) return;

        let html = '';
        
        if (images.length === 0) {
            html = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i>
                        No hay imágenes en el carrusel. Haz clic en "Agregar Imagen" para comenzar.
                    </div>
                </div>
            `;
        } else {
            images.forEach(image => {
                const statusBadge = image.active 
                    ? '<span class="badge bg-success">Activa</span>'
                    : '<span class="badge bg-secondary">Inactiva</span>';

                html += `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card">
                            <img src="${image.image_url}" class="card-img-top" alt="${image.title}" style="height: 200px; object-fit: cover;" onerror="this.src='/images/placeholder.jpg'">
                            <div class="card-body">
                                <h6 class="card-title">${image.title} ${statusBadge}</h6>
                                <p class="card-text text-muted small">${image.description || 'Sin descripción'}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">Orden: ${image.display_order}</small>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="adminApp.editCarouselItem(${image.id})">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="adminApp.deleteCarouselItem(${image.id})">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        container.innerHTML = html;
    }

    // Edit carousel item
    async editCarouselItem(id) {
        try {
            const response = await fetch(`/api/carousel/${id}`);
            const data = await response.json();
            
            if (!data.success) {
                api.showNotification('Error al obtener datos de la imagen', 'error');
                return;
            }

            const image = data.data;
            const title = prompt('Título:', image.title);
            if (title === null) return;

            const description = prompt('Descripción:', image.description || '');
            const imageUrl = prompt('URL de la imagen:', image.image_url);
            if (!imageUrl) return;

            const linkUrl = prompt('URL de enlace:', image.link_url || '');
            const displayOrder = prompt('Orden de visualización:', image.display_order) || 0;
            const active = confirm('¿Imagen activa?');

            const updateResponse = await fetch(`/api/carousel/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    image_url: imageUrl,
                    link_url: linkUrl,
                    display_order: parseInt(displayOrder),
                    active
                })
            });

            const updateData = await updateResponse.json();
            if (updateData.success) {
                api.showNotification('Imagen actualizada', 'success');
                this.refreshCarousel();
            } else {
                api.showNotification(updateData.message || 'Error al actualizar imagen', 'error');
            }
        } catch (error) {
            console.error('Error editing carousel item:', error);
            api.showNotification('Error al editar imagen', 'error');
        }
    }

    // Delete carousel item
    async deleteCarouselItem(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta imagen del carrusel?')) {
            return;
        }

        try {
            const response = await fetch(`/api/carousel/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                api.showNotification('Imagen eliminada del carrusel', 'success');
                this.refreshCarousel();
            } else {
                api.showNotification(data.message || 'Error al eliminar imagen', 'error');
            }
        } catch (error) {
            console.error('Error deleting carousel item:', error);
            api.showNotification('Error al eliminar imagen del carrusel', 'error');
        }
    }

    // Testing Functions
    async testAPI(endpoint) {
        const testResults = document.getElementById('testResults');
        this.addTestResult(`🧪 Testing ${endpoint} API...`);

        const tests = {
            health: [
                { url: '/api/health', name: 'Health Check' }
            ],
            products: [
                { url: '/api/products', name: 'Get All Products' },
                { url: '/api/products/featured', name: 'Get Featured Products' },
                { url: '/api/products/homepage', name: 'Get Homepage Products' }
            ],
            categories: [
                { url: '/api/categories', name: 'Get All Categories' }
            ],
            carousel: [
                { url: '/api/carousel', name: 'Get Carousel Images' },
                { url: '/api/carousel/admin', name: 'Get Carousel Images (Admin)' }
            ],
            homepage: [
                { url: '/api/settings/homepage/all', name: 'Get Homepage Settings' },
                { url: '/api/products/homepage', name: 'Get Homepage Products' }
            ]
        };

        const endpointTests = tests[endpoint] || [];
        let passedCount = 0;
        let totalCount = endpointTests.length;

        for (const test of endpointTests) {
            try {
                const startTime = performance.now();
                const response = await fetch(test.url);
                const endTime = performance.now();
                const data = await response.json();
                const responseTime = Math.round(endTime - startTime);

                if (response.ok && data.success) {
                    this.addTestResult(`✅ ${test.name}: OK (${responseTime}ms)`);
                    passedCount++;
                } else {
                    this.addTestResult(`❌ ${test.name}: FAIL - ${data.message || response.statusText}`);
                }
            } catch (error) {
                this.addTestResult(`❌ ${test.name}: ERROR - ${error.message}`);
            }
        }

        this.addTestResult(`📊 ${endpoint.toUpperCase()} Test Summary: ${passedCount}/${totalCount} passed\n`);
    }

    testCSP() {
        this.addTestResult('🛡️ Testing CSP (Content Security Policy)...');
        
        // Test inline script execution
        try {
            eval('console.log("CSP Test: Inline script execution")');
            this.addTestResult('✅ CSP allows inline script execution');
        } catch (error) {
            this.addTestResult('❌ CSP blocks inline script execution');
        }

        // Test onclick handlers
        const testButton = document.createElement('button');
        testButton.onclick = () => console.log('CSP Test: onclick handler');
        testButton.setAttribute('onclick', 'console.log("CSP Test: onclick attribute")');
        
        try {
            testButton.click();
            this.addTestResult('✅ CSP allows onclick handlers');
        } catch (error) {
            this.addTestResult('❌ CSP blocks onclick handlers');
        }

        // Test blob URLs
        try {
            const blob = new Blob(['test'], { type: 'text/plain' });
            const blobUrl = URL.createObjectURL(blob);
            this.addTestResult(`✅ CSP allows blob URLs: ${blobUrl.substring(0, 50)}...`);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            this.addTestResult('❌ CSP blocks blob URLs');
        }

        this.addTestResult('🛡️ CSP Test completed\n');
    }

    testJavaScript() {
        this.addTestResult('⚡ Testing JavaScript functionality...');

        // Test basic JavaScript features
        const tests = [
            {
                name: 'Array methods',
                test: () => [1, 2, 3].map(x => x * 2).join(',') === '2,4,6'
            },
            {
                name: 'Fetch API',
                test: () => typeof fetch === 'function'
            },
            {
                name: 'Local Storage',
                test: () => typeof localStorage !== 'undefined'
            },
            {
                name: 'DOM manipulation',
                test: () => typeof document.createElement === 'function'
            },
            {
                name: 'Bootstrap components',
                test: () => typeof bootstrap !== 'undefined'
            }
        ];

        tests.forEach(test => {
            try {
                if (test.test()) {
                    this.addTestResult(`✅ ${test.name}: Working`);
                } else {
                    this.addTestResult(`❌ ${test.name}: Failed`);
                }
            } catch (error) {
                this.addTestResult(`❌ ${test.name}: Error - ${error.message}`);
            }
        });

        this.addTestResult('⚡ JavaScript Test completed\n');
    }

    async generateTestReport() {
        this.addTestResult('📋 Generating comprehensive test report...\n');

        // Run all tests
        await this.testAPI('health');
        await this.testAPI('products');
        await this.testAPI('categories');
        await this.testAPI('carousel');
        await this.testAPI('homepage');
        this.testCSP();
        this.testJavaScript();

        this.addTestResult('📋 Comprehensive test report completed!');
        api.showNotification('Test report generated successfully', 'success');
    }

    addTestResult(message) {
        const testResults = document.getElementById('testResults');
        if (testResults) {
            const timestamp = new Date().toLocaleTimeString();
            const resultLine = `[${timestamp}] ${message}`;
            
            if (testResults.innerHTML.includes('Resultados de las pruebas aparecerán aquí...')) {
                testResults.innerHTML = resultLine;
            } else {
                testResults.innerHTML += '\n' + resultLine;
            }
            
            // Scroll to bottom
            testResults.scrollTop = testResults.scrollHeight;
        }
    }

    // ======================= PRODUCTS MANAGEMENT =======================

    async loadProducts() {
        try {
            api.showLoading();
            
            const response = await api.getAllProducts({ page: 1, limit: 50 });
            
            if (response.success) {
                this.products = response.data.products || [];
                this.renderProducts();
                await this.loadCategories();
            } else {
                api.showNotification('Error al cargar productos: ' + response.message, 'danger');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            api.showNotification('Error al cargar productos', 'danger');
        } finally {
            api.hideLoading();
        }
    }

    renderProducts() {
        const productsSection = document.getElementById('products-section');
        if (!productsSection) return;

        productsSection.innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2">Gestión de Productos</h1>
                <div class="btn-toolbar mb-2 mb-md-0">
                    <button type="button" class="btn btn-sm btn-primary me-2" onclick="adminApp.showProductForm()">
                        <i class="bi bi-plus-circle"></i> Nuevo Producto
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="adminApp.loadProducts()">
                        <i class="bi bi-arrow-clockwise"></i> Actualizar
                    </button>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="input-group">
                        <input type="text" class="form-control" placeholder="Buscar productos..." id="productSearchInput">
                        <button class="btn btn-outline-secondary" type="button" onclick="adminApp.searchProducts()">
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-3">
                    <select class="form-select" id="productCategoryFilter">
                        <option value="">Todas las categorías</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <select class="form-select" id="productStatusFilter">
                        <option value="">Todos los estados</option>
                        <option value="1">Activos</option>
                        <option value="0">Inactivos</option>
                    </select>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="productsTable">
                            <thead>
                                <tr>
                                    <th width="80">Imagen</th>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th>Precio</th>
                                    <th>Stock</th>
                                    <th>Estado</th>
                                    <th width="150">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderProductsRows()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Populate category filter
        this.populateProductCategoryFilter();
    }

    renderProductsRows() {
        if (!this.products || this.products.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="bi bi-box display-4 text-muted d-block mb-2"></i>
                        <span class="text-muted">No hay productos disponibles</span>
                    </td>
                </tr>
            `;
        }

        return this.products.map(product => `
            <tr>
                <td>
                    <img data-responsive
                         data-src="${product.primary_image || product.image_url || '/images/placeholder-product.jpg'}" 
                         data-context="admin_thumb"
                         alt="${product.name}" 
                         class="img-thumbnail" 
                         style="width: 50px; height: 50px; object-fit: cover;">
                </td>
                <td>
                    <strong>${product.name}</strong>
                    ${product.featured ? '<span class="badge bg-warning ms-1">Destacado</span>' : ''}
                </td>
                <td>${product.category_name || 'Sin categoría'}</td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>
                    <span class="badge ${product.stock_quantity > 10 ? 'bg-success' : product.stock_quantity > 0 ? 'bg-warning' : 'bg-danger'}">
                        ${product.stock_quantity || 0}
                    </span>
                </td>
                <td>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" 
                               id="activeSwitch${product.id}" 
                               ${product.active ? 'checked' : ''}
                               onchange="adminApp.toggleProductStatus(${product.id}, this.checked)">
                        <label class="form-check-label" for="activeSwitch${product.id}">
                            <span class="badge ${product.active ? 'bg-success' : 'bg-secondary'}">
                                ${product.active ? 'Activo' : 'Inactivo'}
                            </span>
                        </label>
                    </div>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="adminApp.editProductInline(${product.id})" title="Editar rápido">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="adminApp.showProductForm(${product.id})" title="Editar completo">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="adminApp.viewProduct(${product.id})" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-${product.active ? 'warning' : 'success'}" 
                                onclick="adminApp.toggleProductStatus(${product.id}, ${!product.active})" 
                                title="${product.active ? 'Desactivar' : 'Activar'}">
                            <i class="bi bi-${product.active ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="adminApp.deleteProduct(${product.id})" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async populateProductCategoryFilter() {
        const categoryFilter = document.getElementById('productCategoryFilter');
        if (!categoryFilter || !this.categories) return;

        // Keep existing options
        const existingOptions = categoryFilter.innerHTML;
        
        // Add category options
        const categoryOptions = this.categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');
        
        categoryFilter.innerHTML = existingOptions + categoryOptions;
    }

    showProductForm(productId = null) {
        const isEditing = productId !== null;
        const modalTitle = document.getElementById('productModalTitle');
        const modalBody = document.getElementById('productModalBody');
        
        modalTitle.textContent = isEditing ? 'Editar Producto' : 'Nuevo Producto';
        
        modalBody.innerHTML = `
            <form id="productForm" enctype="multipart/form-data">
                <div class="row">
                    <div class="col-md-8">
                        <div class="mb-3">
                            <label for="productName" class="form-label">Nombre *</label>
                            <input type="text" class="form-control" id="productName" required>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="productCategory" class="form-label">Categoría *</label>
                                    <select class="form-select" id="productCategory" required>
                                        <option value="">Seleccionar categoría</option>
                                        ${this.categories ? this.categories.map(cat => 
                                            `<option value="${cat.id}">${cat.name}</option>`
                                        ).join('') : ''}
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="productPrice" class="form-label">Precio (USD) *</label>
                                    <input type="number" class="form-control" id="productPrice" step="0.01" min="0" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="productStock" class="form-label">Stock *</label>
                                    <input type="number" class="form-control" id="productStock" min="0" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Ocasiones</label>
                                    <div class="border rounded p-2" style="max-height: 150px; overflow-y: auto;">
                                        <div id="productOccasionsContainer">
                                            <div class="text-muted text-center py-2">
                                                <small>Cargando ocasiones...</small>
                                            </div>
                                        </div>
                                    </div>
                                    <small class="form-text text-muted">Selecciona todas las ocasiones apropiadas para este producto</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="productDescription" class="form-label">Descripción</label>
                            <textarea class="form-control" id="productDescription" rows="4" 
                                placeholder="Descripción detallada del producto..."></textarea>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-4">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="productActive" checked>
                                    <label class="form-check-label" for="productActive">Activo</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="productFeatured">
                                    <label class="form-check-label" for="productFeatured">Destacado</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="productHomepage">
                                    <label class="form-check-label" for="productHomepage">Mostrar en inicio</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="mb-3">
                            <label class="form-label">Imágenes del Producto</label>
                            
                            <!-- Image Upload Area -->
                            <div class="image-upload-area border-2 border-dashed rounded p-3 text-center mb-3" 
                                 id="imageUploadArea"
                                 style="border-color: #dee2e6; min-height: 150px; cursor: pointer;"
                                 onclick="document.getElementById('productImages').click()">
                                <div id="uploadPlaceholder">
                                    <i class="bi bi-cloud-upload display-4 text-muted d-block mb-2"></i>
                                    <p class="text-muted mb-2">Click aquí o arrastra imágenes</p>
                                    <small class="text-muted">Máximo 10 archivos, 5MB cada uno</small>
                                </div>
                            </div>
                            
                            <input type="file" 
                                   class="form-control d-none" 
                                   id="productImages" 
                                   multiple 
                                   accept="image/jpeg,image/jpg,image/png,image/webp,image/gif">
                            
                            <!-- Image Preview Area -->
                            <div id="imagePreviewArea" class="mt-3">
                                <!-- Previews will be added here -->
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;
        
        // Initialize form functionality
        this.initProductForm(isEditing, productId);
        
        // Show modal
        const productModal = new bootstrap.Modal(document.getElementById('productModal'));
        productModal.show();
    }

    initProductForm(isEditing, productId) {
        const fileInput = document.getElementById('productImages');
        const uploadArea = document.getElementById('imageUploadArea');
        const previewArea = document.getElementById('imagePreviewArea');
        let selectedFiles = [];
        let existingImages = [];

        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            handleFileSelection(e.target.files);
        });

        // Handle drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#007bff';
            uploadArea.style.backgroundColor = '#f8f9fa';
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#dee2e6';
            uploadArea.style.backgroundColor = 'transparent';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#dee2e6';
            uploadArea.style.backgroundColor = 'transparent';
            handleFileSelection(e.dataTransfer.files);
        });

        function handleFileSelection(files) {
            // Convert FileList to Array and add to selectedFiles
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/') && selectedFiles.length + existingImages.length < 10) {
                    selectedFiles.push(file);
                }
            });
            
            updateImagePreview();
        }

        // Reference to the method for updating image preview
        const updateImagePreview = () => this.updateImagePreview();

        // Store references for removal functions
        this.selectedFiles = selectedFiles;
        this.existingImages = existingImages;

        // Handle form submission
        const form = document.getElementById('productForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct(isEditing, productId);
        });

        // Load occasions for the multi-select
        this.loadProductOccasions();

        // Load existing product data if editing
        if (isEditing && productId) {
            this.loadProductForEditing(productId, existingImages, updateImagePreview);
        }
    }

    removeSelectedImage(index) {
        this.selectedFiles.splice(index, 1);
        // Re-initialize to update preview
        const form = document.getElementById('productForm');
        if (form) {
            this.initProductForm(false, null);
        }
    }

    removeExistingImage(index) {
        this.existingImages.splice(index, 1);
        // Update preview
        // This would need to be implemented based on the current context
    }

    async loadProductForEditing(productId, existingImages, updateCallback) {
        try {
            const response = await api.getProductById(productId);
            
            if (response.success && response.data) {
                const product = response.data;
                
                // Populate form fields
                document.getElementById('productName').value = product.name || '';
                document.getElementById('productCategory').value = product.category_id || '';
                document.getElementById('productPrice').value = product.price || '';
                document.getElementById('productStock').value = product.stock_quantity || '';
                document.getElementById('productOccasion').value = product.occasion || 'other';
                document.getElementById('productDescription').value = product.description || '';
                document.getElementById('productActive').checked = product.active;
                document.getElementById('productFeatured').checked = product.featured;
                document.getElementById('productHomepage').checked = product.show_on_homepage;
                
                // Load existing images
                existingImages.length = 0; // Clear array
                
                // Add main image
                if (product.image_url) {
                    existingImages.push({
                        url: product.image_url,
                        filename: product.image_url.split('/').pop()
                    });
                }
                
                // Add additional images
                if (product.additional_images) {
                    const additionalImages = typeof product.additional_images === 'string' 
                        ? JSON.parse(product.additional_images) 
                        : product.additional_images;
                    
                    if (Array.isArray(additionalImages)) {
                        additionalImages.forEach(imageUrl => {
                            existingImages.push({
                                url: imageUrl,
                                filename: imageUrl.split('/').pop()
                            });
                        });
                    }
                }
                
                updateCallback();
            }
        } catch (error) {
            console.error('Error loading product for editing:', error);
            api.showNotification('Error al cargar producto para editar', 'danger');
        }
    }

    async saveProduct(isEditing, productId) {
        try {
            const formData = new FormData();
            
            // Add form fields
            formData.append('name', document.getElementById('productName').value);
            formData.append('category_id', document.getElementById('productCategory').value);
            formData.append('price', document.getElementById('productPrice').value);
            formData.append('stock_quantity', document.getElementById('productStock').value);
            formData.append('occasion', document.getElementById('productOccasion').value);
            formData.append('description', document.getElementById('productDescription').value);
            formData.append('active', document.getElementById('productActive').checked ? 1 : 0);
            formData.append('featured', document.getElementById('productFeatured').checked ? 1 : 0);
            formData.append('show_on_homepage', document.getElementById('productHomepage').checked ? 1 : 0);
            
            // Add new images
            if (this.selectedFiles && this.selectedFiles.length > 0) {
                this.selectedFiles.forEach(file => {
                    formData.append('images', file);
                });
            }
            
            // Add existing images (for updates)
            if (this.existingImages && this.existingImages.length > 0) {
                formData.append('existing_images', JSON.stringify(this.existingImages.map(img => img.url)));
            }

            api.showLoading();
            
            let response;
            if (isEditing) {
                response = await this.updateProduct(productId, formData);
            } else {
                response = await this.createProduct(formData);
            }
            
            if (response.success) {
                api.showNotification(
                    `Producto ${isEditing ? 'actualizado' : 'creado'} exitosamente`, 
                    'success'
                );
                
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
                
                // Reload products
                await this.loadProducts();
            } else {
                api.showNotification('Error: ' + response.message, 'danger');
            }
            
        } catch (error) {
            console.error('Error saving product:', error);
            api.showNotification('Error al guardar producto', 'danger');
        } finally {
            api.hideLoading();
        }
    }

    async createProduct(formData) {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${api.token}`
            },
            body: formData
        });
        
        return await response.json();
    }

    async updateProduct(productId, formData) {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${api.token}`
            },
            body: formData
        });
        
        return await response.json();
    }

    async editProduct(productId) {
        this.showProductForm(productId);
    }

    async viewProduct(productId) {
        window.open(`/pages/product-detail.html?id=${productId}`, '_blank');
    }

    async deleteProduct(productId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            return;
        }

        try {
            api.showLoading();
            
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${api.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                api.showNotification('Producto eliminado exitosamente', 'success');
                await this.loadProducts();
            } else {
                api.showNotification('Error: ' + result.message, 'danger');
            }
            
        } catch (error) {
            console.error('Error deleting product:', error);
            api.showNotification('Error al eliminar producto', 'danger');
        } finally {
            api.hideLoading();
        }
    }

    async searchProducts() {
        const searchTerm = document.getElementById('productSearchInput').value;
        const categoryFilter = document.getElementById('productCategoryFilter').value;
        const statusFilter = document.getElementById('productStatusFilter').value;
        
        try {
            api.showLoading();
            
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (categoryFilter) params.category = categoryFilter;
            if (statusFilter !== '') params.active = statusFilter;
            
            const response = await api.getAllProducts(params);
            
            if (response.success) {
                this.products = response.data.products || [];
                this.renderProducts();
            }
            
        } catch (error) {
            console.error('Error searching products:', error);
            api.showNotification('Error en la búsqueda', 'danger');
        } finally {
            api.hideLoading();
        }
    }

    // =============================
    // DATABASE BROWSER FUNCTIONS
    // =============================

    async loadTableData() {
        const tableSelect = document.getElementById('tableSelect');
        const limitSelect = document.getElementById('limitSelect');
        const offsetInput = document.getElementById('offsetInput');
        
        const table = tableSelect.value;
        if (!table) {
            api.showNotification('Por favor selecciona una tabla', 'warning');
            return;
        }

        const limit = parseInt(limitSelect.value) || 25;
        const offset = parseInt(offsetInput.value) || 0;

        // Show loading
        this.showTableLoading(true);

        try {
            const response = await fetch(`/api/database/browse/${table}?limit=${limit}&offset=${offset}`);
            const data = await response.json();

            if (data.success) {
                this.renderTable(data.data);
                this.updateTableInfo(data.data);
                this.updatePagination(data.data);
            } else {
                api.showNotification(data.message || 'Error cargando datos', 'error');
            }

        } catch (error) {
            console.error('Error loading table data:', error);
            api.showNotification('Error cargando datos de la tabla', 'error');
        } finally {
            this.showTableLoading(false);
        }
    }

    showTableLoading(show) {
        const loading = document.getElementById('tableLoading');
        const container = document.getElementById('tableContainer');
        
        if (show) {
            loading.classList.remove('d-none');
            container.style.display = 'none';
        } else {
            loading.classList.add('d-none');
            container.style.display = 'block';
        }
    }

    renderTable(data) {
        const table = document.getElementById('dataTable');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        // Clear existing content
        thead.innerHTML = '';
        tbody.innerHTML = '';

        if (!data.rows || data.rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" class="text-center text-muted py-4">No hay datos disponibles</td></tr>';
            return;
        }

        // Create header
        const headerRow = document.createElement('tr');
        data.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            th.style.minWidth = '120px';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Create rows
        data.rows.forEach(row => {
            const tr = document.createElement('tr');
            data.columns.forEach(column => {
                const td = document.createElement('td');
                let value = row[column];
                
                // Format value for display
                if (value === null || value === undefined) {
                    td.innerHTML = '<span class="text-muted">NULL</span>';
                } else if (typeof value === 'boolean') {
                    td.innerHTML = `<span class="badge bg-${value ? 'success' : 'danger'}">${value}</span>`;
                } else if (typeof value === 'object') {
                    td.innerHTML = `<code>${JSON.stringify(value)}</code>`;
                } else if (String(value).length > 100) {
                    td.innerHTML = `<span title="${value}">${String(value).substring(0, 100)}...</span>`;
                } else {
                    td.textContent = value;
                }
                
                td.style.maxWidth = '300px';
                td.style.whiteSpace = 'nowrap';
                td.style.overflow = 'hidden';
                td.style.textOverflow = 'ellipsis';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        // Show container
        document.getElementById('tableContainer').style.display = 'block';
    }

    updateTableInfo(data) {
        document.getElementById('recordCount').textContent = data.count;
        document.getElementById('lastQuery').textContent = new Date().toLocaleTimeString();
        document.getElementById('tableInfo').classList.remove('d-none');
    }

    updatePagination(data) {
        const pagination = document.getElementById('tablePagination');
        const currentPage = Math.floor(data.offset / data.limit) + 1;
        const startRecord = data.offset + 1;
        const endRecord = data.offset + data.count;

        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('recordRange').textContent = `${startRecord}-${endRecord}`;

        // Update buttons
        document.getElementById('prevPageBtn').disabled = data.offset === 0;
        document.getElementById('nextPageBtn').disabled = !data.hasMore;

        pagination.classList.remove('d-none');
    }

    refreshTableData() {
        this.loadTableData();
    }

    nextPage() {
        const offsetInput = document.getElementById('offsetInput');
        const limitSelect = document.getElementById('limitSelect');
        const limit = parseInt(limitSelect.value) || 25;
        const currentOffset = parseInt(offsetInput.value) || 0;
        
        offsetInput.value = currentOffset + limit;
        this.loadTableData();
    }

    prevPage() {
        const offsetInput = document.getElementById('offsetInput');
        const limitSelect = document.getElementById('limitSelect');
        const limit = parseInt(limitSelect.value) || 25;
        const currentOffset = parseInt(offsetInput.value) || 0;
        
        if (currentOffset >= limit) {
            offsetInput.value = currentOffset - limit;
            this.loadTableData();
        }
    }

    async exportTableData() {
        const tableSelect = document.getElementById('tableSelect');
        const table = tableSelect.value;
        
        if (!table) {
            api.showNotification('Por favor selecciona una tabla primero', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/database/browse/${table}?limit=1000&offset=0`);
            const data = await response.json();

            if (data.success && data.data.rows.length > 0) {
                // Convert to CSV
                const csv = this.convertToCSV(data.data);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                
                // Download
                const a = document.createElement('a');
                a.href = url;
                a.download = `${table}_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                api.showNotification('Datos exportados exitosamente', 'success');
            } else {
                api.showNotification('No hay datos para exportar', 'warning');
            }

        } catch (error) {
            console.error('Error exporting data:', error);
            api.showNotification('Error exportando datos', 'error');
        }
    }

    convertToCSV(data) {
        if (!data.rows || data.rows.length === 0) return '';

        const headers = data.columns.join(',');
        const rows = data.rows.map(row => {
            return data.columns.map(column => {
                let value = row[column];
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') value = JSON.stringify(value);
                // Escape quotes and wrap in quotes if contains comma
                value = String(value).replace(/"/g, '""');
                if (value.includes(',') || value.includes('\n')) {
                    value = `"${value}"`;
                }
                return value;
            }).join(',');
        });

        return [headers, ...rows].join('\n');
    }

    // =============================
    // IMAGE MANAGEMENT FUNCTIONS
    // =============================
    
    setPrimaryImage(index, type) {
        if (type === 'existing') {
            // Mark all existing images as non-primary
            this.existingImages.forEach(img => img.isPrimary = false);
            // Set selected as primary
            this.existingImages[index].isPrimary = true;
        } else if (type === 'new') {
            // For new images, we'll handle this in the form submission
            this.primaryNewImageIndex = index;
        }
        
        // Re-render the preview to show changes
        const form = document.getElementById('productForm');
        if (form) {
            const previewArea = document.getElementById('imagePreviewArea');
            if (previewArea) {
                this.updateImagePreview();
            }
        }
        
        api.showNotification('Imagen principal seleccionada', 'success');
    }

    updateImagePreview() {
        const previewArea = document.getElementById('imagePreviewArea');
        if (!previewArea) return;

        const totalImages = this.selectedFiles.length + this.existingImages.length;
        previewArea.innerHTML = '';
        
        // Show existing images (for editing)
        this.existingImages.forEach((image, index) => {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'image-preview-item d-inline-block position-relative m-1';
            const isPrimary = image.isPrimary || index === 0;
            imageDiv.innerHTML = `
                <div class="border ${isPrimary ? 'border-primary border-2' : ''} rounded p-1">
                    <img src="${image.url}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover;">
                    <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-1" 
                            onclick="adminApp.removeExistingImage(${index})" style="width: 20px; height: 20px; font-size: 10px;">
                        <i class="bi bi-x"></i>
                    </button>
                    ${isPrimary ? 
                        '<small class="badge bg-primary position-absolute bottom-0 start-0">Principal</small>' : 
                        `<button type="button" class="btn btn-sm btn-outline-primary position-absolute bottom-0 start-0" 
                                 onclick="adminApp.setPrimaryImage(${index}, 'existing')" style="font-size: 10px;">
                            <i class="bi bi-star"></i>
                         </button>`
                    }
                </div>
            `;
            previewArea.appendChild(imageDiv);
        });
        
        // Show new selected images
        this.selectedFiles.forEach((file, index) => {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'image-preview-item d-inline-block position-relative m-1';
            const isPrimary = (this.existingImages.length === 0 && index === 0) || 
                             (this.primaryNewImageIndex === index);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                imageDiv.innerHTML = `
                    <div class="border ${isPrimary ? 'border-primary border-2' : ''} rounded p-1">
                        <img src="${e.target.result}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover;">
                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-1" 
                                onclick="adminApp.removeSelectedImage(${index})" style="width: 20px; height: 20px; font-size: 10px;">
                            <i class="bi bi-x"></i>
                        </button>
                        ${isPrimary ? 
                            '<small class="badge bg-primary position-absolute bottom-0 start-0">Principal</small>' : 
                            `<button type="button" class="btn btn-sm btn-outline-primary position-absolute bottom-0 start-0" 
                                     onclick="adminApp.setPrimaryImage(${index}, 'new')" style="font-size: 10px;">
                                <i class="bi bi-star"></i>
                             </button>`
                        }
                    </div>
                `;
            };
            reader.readAsDataURL(file);
            
            previewArea.appendChild(imageDiv);
        });

        // Update upload area text
        const placeholder = document.getElementById('uploadPlaceholder');
        if (totalImages > 0) {
            placeholder.innerHTML = `
                <i class="bi bi-images display-6 text-muted d-block mb-1"></i>
                <small class="text-muted">${totalImages}/10 imágenes seleccionadas</small>
            `;
        } else {
            placeholder.innerHTML = `
                <i class="bi bi-cloud-upload display-4 text-muted d-block mb-2"></i>
                <p class="text-muted mb-2">Click aquí o arrastra imágenes</p>
                <small class="text-muted">Máximo 10 archivos, 5MB cada uno</small>
            `;
        }
    }

    async loadProductOccasions() {
        const container = document.getElementById('productOccasionsContainer');
        if (!container) return;

        try {
            // Show loading
            container.innerHTML = `
                <div class="text-center py-2">
                    <div class="spinner-border spinner-border-sm" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <small class="text-muted ms-2">Cargando ocasiones...</small>
                </div>
            `;

            // Load occasions from API
            const response = await fetch('/api/occasions', {
                headers: {
                    'Authorization': `Bearer ${api.token}`
                }
            });
            
            const result = await response.json();
            
            if (result.success && result.data) {
                const occasions = result.data.sort((a, b) => a.sort_order - b.sort_order);
                
                if (occasions.length === 0) {
                    container.innerHTML = `
                        <div class="text-center py-2">
                            <small class="text-muted">No hay ocasiones disponibles</small>
                        </div>
                    `;
                    return;
                }

                // Create checkboxes for each occasion
                container.innerHTML = occasions.map(occasion => `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" 
                               id="occasion_${occasion.id}" 
                               value="${occasion.id}"
                               data-occasion-name="${occasion.name}">
                        <label class="form-check-label d-flex align-items-center" for="occasion_${occasion.id}">
                            <i class="bi ${occasion.icon || 'bi-calendar-heart'}" 
                               style="color: ${occasion.color || '#28a745'}; margin-right: 8px;"></i>
                            <span>${occasion.name}</span>
                            ${occasion.description ? 
                                `<small class="text-muted ms-2">${occasion.description}</small>` : 
                                ''
                            }
                        </label>
                    </div>
                `).join('');
                
            } else {
                container.innerHTML = `
                    <div class="text-center py-2">
                        <small class="text-danger">Error cargando ocasiones</small>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Error loading occasions:', error);
            container.innerHTML = `
                <div class="text-center py-2">
                    <small class="text-danger">Error cargando ocasiones</small>
                </div>
            `;
        }
    }

    getSelectedOccasions() {
        const container = document.getElementById('productOccasionsContainer');
        if (!container) return [];

        const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => ({
            id: parseInt(cb.value),
            name: cb.dataset.occasionName
        }));
    }

    setSelectedOccasions(occasionIds) {
        const container = document.getElementById('productOccasionsContainer');
        if (!container) return;

        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = occasionIds.includes(parseInt(cb.value));
        });
    }

    // =============================
    // ENHANCED CAROUSEL FUNCTIONS
    // =============================
    
    async loadProductsForCarousel() {
        try {
            const response = await api.getAllProducts({ limit: 50 });
            if (response.success && response.data.products) {
                const select = document.getElementById('productSelect');
                if (select) {
                    select.innerHTML = '<option value="">Seleccione un producto...</option>' +
                        response.data.products
                            .filter(p => p.image_url && p.active) // Only products with images
                            .map(p => 
                                `<option value="${p.id}" data-image="${p.image_url}" data-name="${p.name}" data-price="${p.price}">
                                    ${p.name} - $${p.price} USD
                                </option>`
                            ).join('');
                        
                    // Add change event listener
                    select.addEventListener('change', this.previewSelectedProduct.bind(this));
                }
            }
        } catch (error) {
            console.error('Error loading products for carousel:', error);
            api.showNotification('Error cargando productos', 'error');
        }
    }

    previewSelectedProduct() {
        const select = document.getElementById('productSelect');
        const preview = document.getElementById('productPreview');
        
        if (!select || !preview) return;
        
        const selectedOption = select.options[select.selectedIndex];
        
        if (selectedOption.value) {
            const name = selectedOption.dataset.name;
            const image = selectedOption.dataset.image;
            const price = selectedOption.dataset.price;
            
            document.getElementById('previewImage').src = image;
            document.getElementById('previewTitle').textContent = name;
            document.getElementById('previewDescription').textContent = `Hermoso arreglo floral - $${price} USD`;
            
            preview.classList.remove('d-none');
        } else {
            preview.classList.add('d-none');
        }
    }

    saveCarouselItem() {
        const activeTab = document.querySelector('#carouselModal .tab-pane.active');
        
        if (activeTab && activeTab.id === 'manual-tab') {
            this.saveManualCarouselItem();
        } else if (activeTab && activeTab.id === 'product-tab') {
            this.saveProductCarouselItem();
        }
    }

    saveManualCarouselItem() {
        const title = document.getElementById('carouselTitle')?.value;
        const description = document.getElementById('carouselDescription')?.value;
        const imageUrl = document.getElementById('carouselImageUrl')?.value;
        const linkUrl = document.getElementById('carouselLinkUrl')?.value;
        const order = parseInt(document.getElementById('carouselOrder')?.value) || 0;
        
        if (!title || !imageUrl) {
            api.showNotification('Por favor complete los campos requeridos', 'warning');
            return;
        }
        
        this.createCarouselImage(title, description, imageUrl, linkUrl, order);
    }

    saveProductCarouselItem() {
        const select = document.getElementById('productSelect');
        if (!select) return;
        
        const selectedOption = select.options[select.selectedIndex];
        
        if (!selectedOption || !selectedOption.value) {
            api.showNotification('Por favor seleccione un producto', 'warning');
            return;
        }
        
        const title = selectedOption.dataset.name;
        const description = `Hermoso arreglo floral - $${selectedOption.dataset.price} USD`;
        const imageUrl = selectedOption.dataset.image;
        const linkUrl = `/pages/product-detail.html?id=${selectedOption.value}`;
        const order = 0; // Auto-assign order
        
        this.createCarouselImage(title, description, imageUrl, linkUrl, order);
    }

    async createCarouselImage(title, description, imageUrl, linkUrl, displayOrder) {
        try {
            api.showLoading();
            
            const response = await fetch('/api/carousel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    image_url: imageUrl,
                    link_url: linkUrl,
                    display_order: displayOrder,
                    active: true
                })
            });

            const data = await response.json();

            if (data.success) {
                api.showNotification('Imagen agregada al carrusel exitosamente', 'success');
                await this.refreshCarousel();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('carouselModal'));
                if (modal) modal.hide();
            } else {
                api.showNotification(data.message || 'Error al agregar imagen', 'error');
            }
        } catch (error) {
            console.error('Error adding carousel item:', error);
            api.showNotification('Error al agregar imagen al carrusel', 'error');
        } finally {
            api.hideLoading();
        }
    }

    async generateRandomCarousel() {
        try {
            if (!confirm('¿Está seguro? Esto reemplazará todas las imágenes actuales del carrusel.')) {
                return;
            }
            
            api.showLoading();
            api.showNotification('Generando carrusel aleatorio...', 'info');
            
            // Get random products
            const response = await api.getAllProducts({ limit: 50 });
            if (!response.success || !response.data.products) {
                api.showNotification('Error al obtener productos', 'danger');
                return;
            }
            
            // Select products with images
            const productsWithImages = response.data.products.filter(p => p.image_url && p.active);
            
            if (productsWithImages.length < 3) {
                api.showNotification('Se necesitan al menos 3 productos activos con imágenes', 'warning');
                return;
            }
            
            // Shuffle and select 5 random products
            const randomProducts = this.shuffleArray(productsWithImages).slice(0, 5);
            
            // Clear existing carousel images
            const existingResponse = await fetch('/api/carousel/admin');
            const existingData = await existingResponse.json();
            
            if (existingData.success && existingData.data.images) {
                for (const image of existingData.data.images) {
                    await fetch(`/api/carousel/${image.id}`, { 
                        method: 'DELETE',
                        headers: api.getHeaders(true)
                    });
                }
            }
            
            // Add new random images
            for (let i = 0; i < randomProducts.length; i++) {
                const product = randomProducts[i];
                await fetch('/api/carousel', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...api.getHeaders(true)
                    },
                    body: JSON.stringify({
                        title: product.name,
                        description: `Hermoso arreglo floral - $${product.price} USD`,
                        image_url: product.image_url,
                        link_url: `/pages/product-detail.html?id=${product.id}`,
                        display_order: i + 1,
                        active: true
                    })
                });
            }
            
            api.showNotification(`✨ Carrusel aleatorio generado con ${randomProducts.length} productos`, 'success');
            await this.refreshCarousel();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('carouselModal'));
            if (modal) modal.hide();
            
        } catch (error) {
            console.error('Error generating random carousel:', error);
            api.showNotification('Error al generar carrusel aleatorio', 'danger');
        } finally {
            api.hideLoading();
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // =============================
    // PRODUCT CRUD FUNCTIONS
    // =============================

    async toggleProductStatus(productId, newStatus) {
        try {
            api.showLoading();
            
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...api.getHeaders(true)
                },
                body: JSON.stringify({
                    active: newStatus
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update local data
                const productIndex = this.products.findIndex(p => p.id === productId);
                if (productIndex !== -1) {
                    this.products[productIndex].active = newStatus;
                }
                
                const statusText = newStatus ? 'activado' : 'desactivado';
                api.showNotification(`Producto ${statusText} exitosamente`, 'success');
                
                // Update the UI elements
                this.updateProductStatusUI(productId, newStatus);
                
            } else {
                api.showNotification(data.message || 'Error al cambiar estado del producto', 'error');
                // Revert the checkbox
                const checkbox = document.getElementById(`activeSwitch${productId}`);
                if (checkbox) checkbox.checked = !newStatus;
            }
        } catch (error) {
            console.error('Error toggling product status:', error);
            api.showNotification('Error al cambiar estado del producto', 'error');
            // Revert the checkbox
            const checkbox = document.getElementById(`activeSwitch${productId}`);
            if (checkbox) checkbox.checked = !newStatus;
        } finally {
            api.hideLoading();
        }
    }

    updateProductStatusUI(productId, isActive) {
        // Update badge
        const badge = document.querySelector(`#activeSwitch${productId} + label .badge`);
        if (badge) {
            badge.className = `badge ${isActive ? 'bg-success' : 'bg-secondary'}`;
            badge.textContent = isActive ? 'Activo' : 'Inactivo';
        }
        
        // Update toggle button
        const toggleBtn = document.querySelector(`button[onclick*="toggleProductStatus(${productId}"]`);
        if (toggleBtn) {
            toggleBtn.className = `btn btn-outline-${isActive ? 'warning' : 'success'} btn-sm`;
            toggleBtn.title = isActive ? 'Desactivar' : 'Activar';
            
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = `bi bi-${isActive ? 'pause' : 'play'}`;
            }
            
            // Update onclick
            toggleBtn.setAttribute('onclick', `adminApp.toggleProductStatus(${productId}, ${!isActive})`);
        }
    }

    async editProductInline(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            api.showNotification('Producto no encontrado', 'error');
            return;
        }

        // Create inline edit modal
        const modalHtml = `
            <div class="modal fade" id="quickEditModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-pencil-square"></i> Edición Rápida
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="quickEditForm">
                                <div class="row">
                                    <div class="col-md-8">
                                        <div class="mb-3">
                                            <label class="form-label">Nombre del Producto</label>
                                            <input type="text" class="form-control" id="quickEditName" value="${product.name || ''}">
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label class="form-label">Precio (USD)</label>
                                            <input type="number" step="0.01" class="form-control" id="quickEditPrice" value="${product.price || ''}">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Stock</label>
                                            <input type="number" class="form-control" id="quickEditStock" value="${product.stock_quantity || 0}">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Categoría</label>
                                            <select class="form-select" id="quickEditCategory">
                                                ${this.categories ? this.categories.map(cat => 
                                                    `<option value="${cat.id}" ${cat.id === product.category_id ? 'selected' : ''}>${cat.name}</option>`
                                                ).join('') : ''}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Descripción</label>
                                    <textarea class="form-control" rows="3" id="quickEditDescription">${product.description || ''}</textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="quickEditActive" ${product.active ? 'checked' : ''}>
                                            <label class="form-check-label" for="quickEditActive">Activo</label>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="quickEditFeatured" ${product.featured ? 'checked' : ''}>
                                            <label class="form-check-label" for="quickEditFeatured">Destacado</label>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="quickEditHomepage" ${product.show_on_homepage ? 'checked' : ''}>
                                            <label class="form-check-label" for="quickEditHomepage">En inicio</label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="adminApp.saveQuickEdit(${productId})">
                                <i class="bi bi-check"></i> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('quickEditModal');
        if (existingModal) existingModal.remove();

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('quickEditModal'));
        modal.show();
    }

    async saveQuickEdit(productId) {
        try {
            api.showLoading();

            const updateData = {
                name: document.getElementById('quickEditName')?.value,
                price: parseFloat(document.getElementById('quickEditPrice')?.value),
                stock_quantity: parseInt(document.getElementById('quickEditStock')?.value),
                category_id: parseInt(document.getElementById('quickEditCategory')?.value),
                description: document.getElementById('quickEditDescription')?.value,
                active: document.getElementById('quickEditActive')?.checked,
                featured: document.getElementById('quickEditFeatured')?.checked,
                show_on_homepage: document.getElementById('quickEditHomepage')?.checked
            };

            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...api.getHeaders(true)
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (data.success) {
                api.showNotification('Producto actualizado exitosamente', 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('quickEditModal'));
                if (modal) modal.hide();
                
                // Refresh products
                await this.loadProducts();
                
            } else {
                api.showNotification(data.message || 'Error al actualizar producto', 'error');
            }
        } catch (error) {
            console.error('Error saving quick edit:', error);
            api.showNotification('Error al actualizar producto', 'error');
        } finally {
            api.hideLoading();
        }
    }

    // Enhanced product search with status filter
    async searchProducts() {
        const searchTerm = document.getElementById('productSearchInput')?.value || '';
        const categoryFilter = document.getElementById('productCategoryFilter')?.value || '';
        const statusFilter = document.getElementById('productStatusFilter')?.value || '';
        
        try {
            api.showLoading();
            
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (categoryFilter) params.append('category_id', categoryFilter);
            if (statusFilter !== '') params.append('active', statusFilter);
            
            const response = await api.getAllProducts({ 
                limit: 50,
                ...Object.fromEntries(params)
            });
            
            if (response.success) {
                this.products = response.data.products || [];
                this.renderProducts();
                
                const resultText = `${this.products.length} producto(s) encontrado(s)`;
                api.showNotification(resultText, 'info');
            }
            
        } catch (error) {
            console.error('Error searching products:', error);
            api.showNotification('Error en la búsqueda', 'danger');
        } finally {
            api.hideLoading();
        }
    }

    // OCCASIONS MANAGEMENT METHODS

    // Load occasions section
    async loadOccasions() {
        try {
            api.showLoading();
            await this.loadOccasionsList();
            await this.updateOccasionsStats();
        } catch (error) {
            console.error('Error loading occasions:', error);
            api.showNotification('Error al cargar ocasiones', 'danger');
        } finally {
            api.hideLoading();
        }
    }

    // Load occasions list
    async loadOccasionsList() {
        try {
            const response = await fetch('/api/occasions', {
                headers: api.getHeaders()
            });
            const data = await api.handleResponse(response);
            
            if (data.success) {
                this.occasions = data.data;
                this.renderOccasionsList();
                this.updateOccasionFilter();
            }
        } catch (error) {
            console.error('Error loading occasions list:', error);
            api.showNotification('Error al cargar lista de ocasiones', 'danger');
        }
    }

    // Render occasions list
    renderOccasionsList() {
        const container = document.getElementById('occasionsContent');
        if (!container) return;

        if (this.occasions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-calendar-x text-muted" style="font-size: 3rem;"></i>
                    <h5 class="mt-3 text-muted">No hay ocasiones disponibles</h5>
                    <button type="button" class="btn btn-primary mt-2" onclick="adminApp.createOccasion()">
                        <i class="bi bi-plus"></i> Crear Primera Ocasión
                    </button>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Ícono</th>
                            <th>Color</th>
                            <th>Orden</th>
                            <th>Estado</th>
                            <th>Productos</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.occasions.map(occasion => `
                            <tr>
                                <td><span class="badge bg-secondary">${occasion.id}</span></td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="${occasion.icon || 'bi-star'}" style="color: ${occasion.color}; font-size: 1.2rem;"></i>
                                        <strong class="ms-2">${occasion.name}</strong>
                                    </div>
                                </td>
                                <td class="text-muted">${occasion.description || '-'}</td>
                                <td><code>${occasion.icon || 'N/A'}</code></td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="color-preview me-2" style="width: 20px; height: 20px; background: ${occasion.color}; border-radius: 3px; border: 1px solid #ddd;"></div>
                                        <code>${occasion.color}</code>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-info">${occasion.sort_order}</span>
                                </td>
                                <td>
                                    <span class="badge ${occasion.active ? 'bg-success' : 'bg-secondary'}">
                                        ${occasion.active ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-info" onclick="adminApp.viewOccasionProducts(${occasion.id})">
                                        <i class="bi bi-eye"></i> Ver
                                    </button>
                                </td>
                                <td>
                                    <div class="btn-group" role="group">
                                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="adminApp.editOccasion(${occasion.id})">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-${occasion.active ? 'warning' : 'success'}" 
                                                onclick="adminApp.toggleOccasionStatus(${occasion.id}, ${!occasion.active})">
                                            <i class="bi bi-${occasion.active ? 'pause' : 'play'}-circle"></i>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="adminApp.deleteOccasion(${occasion.id})">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    // Update occasions statistics
    async updateOccasionsStats() {
        try {
            const totalOccasions = this.occasions.length;
            const activeOccasions = this.occasions.filter(o => o.active).length;
            
            document.getElementById('totalOccasions').textContent = totalOccasions;
            document.getElementById('activeOccasions').textContent = activeOccasions;
            document.getElementById('totalOccasionsCount').textContent = totalOccasions;
            document.getElementById('occasionRelations').textContent = '8'; // Placeholder
            document.getElementById('topOccasion').textContent = 'San Valentín';
        } catch (error) {
            console.error('Error updating occasions stats:', error);
        }
    }

    // Update occasion filter dropdown
    updateOccasionFilter() {
        const filter = document.getElementById('occasionFilter');
        if (!filter) return;

        filter.innerHTML = '<option value="">Todas las ocasiones</option>' + 
            this.occasions
                .filter(o => o.active)
                .map(o => `<option value="${o.id}">${o.name}</option>`)
                .join('');
    }

    // Create new occasion
    async createOccasion() {
        const modalHTML = `
            <div class="modal fade" id="occasionModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-plus-circle me-2"></i>Nueva Ocasión
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="occasionForm">
                                <div class="mb-3">
                                    <label for="occasionName" class="form-label">Nombre *</label>
                                    <input type="text" class="form-control" id="occasionName" required>
                                </div>
                                <div class="mb-3">
                                    <label for="occasionDescription" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="occasionDescription" rows="3"></textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <label for="occasionIcon" class="form-label">Ícono Bootstrap</label>
                                        <div class="input-group">
                                            <span class="input-group-text">
                                                <i id="iconPreview" class="bi bi-star"></i>
                                            </span>
                                            <input type="text" class="form-control" id="occasionIcon" 
                                                   placeholder="bi-heart-fill" value="bi-star">
                                        </div>
                                        <small class="form-text text-muted">
                                            <a href="https://icons.getbootstrap.com" target="_blank">Ver íconos disponibles</a>
                                        </small>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="occasionColor" class="form-label">Color</label>
                                        <input type="color" class="form-control form-control-color" id="occasionColor" value="#28a745">
                                    </div>
                                </div>
                                <div class="mt-3">
                                    <label for="occasionOrder" class="form-label">Orden de visualización</label>
                                    <input type="number" class="form-control" id="occasionOrder" value="${this.occasions.length + 1}" min="0">
                                </div>
                                <div class="form-check mt-3">
                                    <input class="form-check-input" type="checkbox" id="occasionActive" checked>
                                    <label class="form-check-label" for="occasionActive">
                                        Ocasión activa
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-success" onclick="adminApp.saveOccasion()">
                                <i class="bi bi-check2"></i> Guardar Ocasión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('occasionModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('occasionModal'));
        modal.show();

        document.getElementById('occasionIcon').addEventListener('input', (e) => {
            document.getElementById('iconPreview').className = `bi ${e.target.value || 'bi-star'}`;
        });
    }

    // Save occasion
    async saveOccasion(occasionId = null) {
        try {
            const form = document.getElementById('occasionForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const occasionData = {
                name: document.getElementById('occasionName').value,
                description: document.getElementById('occasionDescription').value,
                icon: document.getElementById('occasionIcon').value || 'bi-star',
                color: document.getElementById('occasionColor').value,
                sort_order: parseInt(document.getElementById('occasionOrder').value),
                active: document.getElementById('occasionActive').checked
            };

            api.showLoading();

            const url = occasionId ? `/api/occasions/${occasionId}` : '/api/occasions';
            const method = occasionId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: api.getHeaders(true),
                body: JSON.stringify(occasionData)
            });

            const data = await api.handleResponse(response);

            if (data.success) {
                api.showNotification(
                    occasionId ? 'Ocasión actualizada exitosamente' : 'Ocasión creada exitosamente', 
                    'success'
                );
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('occasionModal'));
                if (modal) modal.hide();

                await this.loadOccasions();
            }
        } catch (error) {
            console.error('Error saving occasion:', error);
            api.showNotification('Error al guardar ocasión', 'danger');
        } finally {
            api.hideLoading();
        }
    }

    // Edit occasion
    async editOccasion(occasionId) {
        const occasion = this.occasions.find(o => o.id === occasionId);
        if (!occasion) return;

        await this.createOccasion();

        document.getElementById('occasionName').value = occasion.name;
        document.getElementById('occasionDescription').value = occasion.description || '';
        document.getElementById('occasionIcon').value = occasion.icon || 'bi-star';
        document.getElementById('occasionColor').value = occasion.color || '#28a745';
        document.getElementById('occasionOrder').value = occasion.sort_order || 0;
        document.getElementById('occasionActive').checked = occasion.active;

        document.querySelector('#occasionModal .modal-title').innerHTML = 
            '<i class="bi bi-pencil me-2"></i>Editar Ocasión';

        const saveButton = document.querySelector('#occasionModal .btn-success');
        saveButton.setAttribute('onclick', `adminApp.saveOccasion(${occasionId})`);
        saveButton.innerHTML = '<i class="bi bi-check2"></i> Actualizar Ocasión';

        document.getElementById('iconPreview').className = `bi ${occasion.icon || 'bi-star'}`;
    }

    // Toggle occasion status
    async toggleOccasionStatus(occasionId, newStatus) {
        try {
            api.showLoading();

            const response = await fetch(`/api/occasions/${occasionId}`, {
                method: 'PUT',
                headers: api.getHeaders(true),
                body: JSON.stringify({ active: newStatus })
            });

            const data = await api.handleResponse(response);

            if (data.success) {
                api.showNotification(
                    `Ocasión ${newStatus ? 'activada' : 'desactivada'} exitosamente`, 
                    'success'
                );
                await this.loadOccasions();
            }
        } catch (error) {
            console.error('Error toggling occasion status:', error);
            api.showNotification('Error al cambiar estado de ocasión', 'danger');
        } finally {
            api.hideLoading();
        }
    }

    // Delete occasion
    async deleteOccasion(occasionId) {
        const occasion = this.occasions.find(o => o.id === occasionId);
        if (!occasion) return;

        if (!confirm(`¿Estás seguro de que quieres eliminar la ocasión "${occasion.name}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            api.showLoading();

            const response = await fetch(`/api/occasions/${occasionId}`, {
                method: 'DELETE',
                headers: api.getHeaders(true)
            });

            const data = await api.handleResponse(response);

            if (data.success) {
                api.showNotification('Ocasión eliminada exitosamente', 'success');
                await this.loadOccasions();
            }
        } catch (error) {
            console.error('Error deleting occasion:', error);
            api.showNotification('Error al eliminar ocasión', 'danger');
        } finally {
            api.hideLoading();
        }
    }

    // View occasion products
    async viewOccasionProducts(occasionId) {
        try {
            const occasion = this.occasions.find(o => o.id === occasionId);
            if (!occasion) return;

            api.showLoading();

            const response = await fetch(`/api/occasions/${occasionId}/products`, {
                headers: api.getHeaders()
            });
            
            const data = await api.handleResponse(response);

            if (data.success) {
                this.showOccasionProductsModal(occasion, data.data);
            }
        } catch (error) {
            console.error('Error loading occasion products:', error);
            api.showNotification('Error al cargar productos de la ocasión', 'danger');
        } finally {
            api.hideLoading();
        }
    }

    // Show occasion products modal
    showOccasionProductsModal(occasion, products) {
        const modalHTML = `
            <div class="modal fade" id="occasionProductsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="${occasion.icon}" style="color: ${occasion.color};"></i>
                                Productos para ${occasion.name}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${products.length === 0 ? `
                                <div class="text-center py-4">
                                    <i class="bi bi-box text-muted" style="font-size: 3rem;"></i>
                                    <h6 class="mt-3 text-muted">No hay productos asociados a esta ocasión</h6>
                                </div>
                            ` : `
                                <div class="row">
                                    ${products.map(product => `
                                        <div class="col-md-6 mb-3">
                                            <div class="card">
                                                <div class="card-body">
                                                    <div class="d-flex">
                                                        <img src="${product.primary_image || product.image_url}" 
                                                             class="rounded me-3" width="60" height="60" style="object-fit: cover;">
                                                        <div class="flex-grow-1">
                                                            <h6 class="card-title mb-1">${product.name}</h6>
                                                            <strong class="text-success">$${product.price}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('occasionProductsModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('occasionProductsModal'));
        modal.show();
    }

    // Refresh occasions
    async refreshOccasions() {
        await this.loadOccasions();
        api.showNotification('Ocasiones actualizadas', 'success');
    }
}

// Initialize admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
});