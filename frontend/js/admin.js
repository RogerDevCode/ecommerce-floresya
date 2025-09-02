// Admin Panel JavaScript for FloresYa

class AdminApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.orders = [];
        this.payments = [];
        this.products = [];
        this.currentOrdersPage = 1;
        this.currentPaymentsPage = 1;
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

    // Add carousel item
    async addCarouselItem() {
        const title = prompt('Título de la imagen:');
        if (!title) return;

        const description = prompt('Descripción (opcional):');
        const imageUrl = prompt('URL de la imagen:');
        if (!imageUrl) return;

        const linkUrl = prompt('URL de enlace (opcional):');
        const displayOrder = prompt('Orden de visualización (número):') || 0;

        try {
            const response = await fetch('/api/carousel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    image_url: imageUrl,
                    link_url: linkUrl,
                    display_order: parseInt(displayOrder)
                })
            });

            const data = await response.json();
            if (data.success) {
                api.showNotification('Imagen agregada al carrusel', 'success');
                this.refreshCarousel();
            } else {
                api.showNotification(data.message || 'Error al agregar imagen', 'error');
            }
        } catch (error) {
            console.error('Error adding carousel item:', error);
            api.showNotification('Error al agregar imagen al carrusel', 'error');
        }
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
                         data-src="${product.image_url || '/images/placeholder-product.jpg'}" 
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
                    <span class="badge ${product.active ? 'bg-success' : 'bg-secondary'}">
                        ${product.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="adminApp.editProduct(${product.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="adminApp.viewProduct(${product.id})" title="Ver">
                            <i class="bi bi-eye"></i>
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
                                    <label for="productOccasion" class="form-label">Ocasión</label>
                                    <select class="form-select" id="productOccasion">
                                        <option value="other">Otra</option>
                                        <option value="birthday">Cumpleaños</option>
                                        <option value="wedding">Boda</option>
                                        <option value="anniversary">Aniversario</option>
                                        <option value="valentine">San Valentín</option>
                                        <option value="funeral">Funeral</option>
                                        <option value="graduation">Graduación</option>
                                    </select>
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

        function updateImagePreview() {
            const totalImages = selectedFiles.length + existingImages.length;
            
            previewArea.innerHTML = '';
            
            // Show existing images (for editing)
            existingImages.forEach((image, index) => {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview-item d-inline-block position-relative m-1';
                imageDiv.innerHTML = `
                    <img src="${image.url}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover;">
                    <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-1" 
                            onclick="adminApp.removeExistingImage(${index})" style="width: 20px; height: 20px; font-size: 10px;">
                        <i class="bi bi-x"></i>
                    </button>
                    ${index === 0 ? '<small class="badge bg-primary position-absolute bottom-0 start-0">Principal</small>' : ''}
                `;
                previewArea.appendChild(imageDiv);
            });
            
            // Show new selected images
            selectedFiles.forEach((file, index) => {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview-item d-inline-block position-relative m-1';
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    imageDiv.innerHTML = `
                        <img src="${e.target.result}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover;">
                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-1" 
                                onclick="adminApp.removeSelectedImage(${index})" style="width: 20px; height: 20px; font-size: 10px;">
                            <i class="bi bi-x"></i>
                        </button>
                        ${existingImages.length === 0 && index === 0 ? '<small class="badge bg-primary position-absolute bottom-0 start-0">Principal</small>' : ''}
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

        // Store references for removal functions
        this.selectedFiles = selectedFiles;
        this.existingImages = existingImages;

        // Handle form submission
        const form = document.getElementById('productForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct(isEditing, productId);
        });

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
}

// Initialize admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
});