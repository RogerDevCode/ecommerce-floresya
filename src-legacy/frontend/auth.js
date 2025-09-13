// Authentication functionality for FloresYa
// Logging exhaustivo para confirmar ejecución y errores

class AuthManager {
    constructor() {
        // Initialize with logging
        if (window.logger) {
            window.logger.info('AUTH', '✅ AuthManager initialized');
        } else {
            console.log('[👤 AUTH] AuthManager initialized');
        }
        
        this.init();
    }

    log(message, data = null, level = 'info') {
        // Use window.logger if available
        if (window.logger) {
            window.logger[level]('AUTH', message, data);
        } else {
            const prefix = '[👤 AUTH]';
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

    init() {
        this.log('🔄 Initializing AuthManager', {}, 'info');
        
        try {
            this.bindEvents();
            this.updateAuthState();
            this.log('✅ AuthManager initialized successfully', {}, 'success');
        } catch (error) {
            this.log('❌ Error initializing AuthManager', { error: error.message }, 'error');
        }
    }

    // Bind authentication events
    bindEvents() {
        this.log('🔄 Binding authentication events', {}, 'info');
        
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
            this.log('✅ Login form event bound', {}, 'success');
        } else {
            this.log('⚠️ Login form not found', {}, 'warn');
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
            this.log('✅ Register form event bound', {}, 'success');
        } else {
            this.log('⚠️ Register form not found', {}, 'warn');
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
            this.log('✅ Logout button event bound', {}, 'success');
        } else {
            this.log('⚠️ Logout button not found', {}, 'warn');
        }

        // Profile link
        const viewProfile = document.getElementById('viewProfile');
        if (viewProfile) {
            viewProfile.addEventListener('click', this.showProfile.bind(this));
            this.log('✅ Profile link event bound', {}, 'success');
        } else {
            this.log('⚠️ Profile link not found', {}, 'warn');
        }

        // Orders link
        const viewOrders = document.getElementById('viewOrders');
        if (viewOrders) {
            viewOrders.addEventListener('click', this.showOrders.bind(this));
            this.log('✅ Orders link event bound', {}, 'success');
        } else {
            this.log('⚠️ Orders link not found', {}, 'warn');
        }
    }

    // Handle login form submission
    async handleLogin(e) {
        e.preventDefault();
        this.log('🔄 Handling login form submission', {}, 'info');
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.log('⚠️ Login validation failed - missing fields', { email, password }, 'warn');
            api.showNotification('Por favor completa todos los campos', 'warning');
            return;
        }

        try {
            this.log('✅ Login attempt', { email }, 'info');
            const response = await api.login(email, password);
            
            if (response.success) {
                this.log('✅ Login successful', { user: response.data.user }, 'success');
                api.showNotification(`¡Bienvenido ${response.data.user.first_name}!`, 'success');
                
                // Hide modal
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                if (loginModal) {
                    loginModal.hide();
                    this.log('✅ Login modal hidden', {}, 'success');
                }

                // Update UI
                this.updateAuthState();
                
                // Reset form
                document.getElementById('loginForm').reset();
                this.log('✅ Login form reset', {}, 'success');
            } else {
                this.log('⚠️ Login failed', { response }, 'warn');
            }

        } catch (error) {
            this.log('❌ Login error', { error: error.message, email }, 'error');
            api.handleError(error);
        }
    }

    // Handle register form submission
    async handleRegister(e) {
        e.preventDefault();
        this.log('🔄 Handling register form submission', {}, 'info');
        
        const userData = {
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            email: document.getElementById('registerEmail').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('registerPassword').value
        };

        // Basic validation
        if (!userData.first_name || !userData.last_name || !userData.email || !userData.password) {
            this.log('⚠️ Registration validation failed - missing fields', { userData }, 'warn');
            api.showNotification('Por favor completa todos los campos obligatorios', 'warning');
            return;
        }

        if (userData.password.length < 6) {
            this.log('⚠️ Registration validation failed - password too short', { passwordLength: userData.password.length }, 'warn');
            api.showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }

        try {
            this.log('✅ Registration attempt', { email: userData.email }, 'info');
            const response = await api.register(userData);
            
            if (response.success) {
                this.log('✅ Registration successful', { user: response.data.user }, 'success');
                api.showNotification(`¡Bienvenido ${response.data.user.first_name}! Cuenta creada exitosamente.`, 'success');
                
                // Hide modal
                const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                if (registerModal) {
                    registerModal.hide();
                    this.log('✅ Register modal hidden', {}, 'success');
                }

                // Update UI
                this.updateAuthState();
                
                // Reset form
                document.getElementById('registerForm').reset();
                this.log('✅ Register form reset', {}, 'success');
            } else {
                this.log('⚠️ Registration failed', { response }, 'warn');
            }

        } catch (error) {
            this.log('❌ Registration error', { error: error.message, email: userData.email }, 'error');
            api.handleError(error);
        }
    }

    // Handle logout
    handleLogout(e) {
        e.preventDefault();
        this.log('🔄 Handling logout', {}, 'info');
        
        api.clearAuth();
        this.updateAuthState();
        
        api.showNotification('Sesión cerrada correctamente', 'info');
        this.log('✅ Logout completed successfully', {}, 'success');
        
        // Clear cart if needed
        if (window.cart) {
            // Don't clear cart, keep it for guest checkout
            this.log('ℹ️ Cart preserved for guest checkout', {}, 'info');
        }
    }

    // Update authentication state in UI
    updateAuthState() {
        this.log('🔄 Updating authentication state', {}, 'info');
        
        const isAuthenticated = api.isAuthenticated();
        const user = api.getUser();

        const loginBtn = document.getElementById('loginBtn');
        const userDropdown = document.getElementById('userDropdown');
        const userMenu = document.getElementById('userMenu');
        const adminPanel = document.getElementById('adminPanel');

        if (isAuthenticated && user) {
            // Show user menu, hide login button
            if (loginBtn) {
                loginBtn.style.display = 'none';
                this.log('✅ Login button hidden', {}, 'success');
            }
            if (userDropdown) {
                userDropdown.style.display = 'block';
                this.log('✅ User dropdown shown', {}, 'success');
            }
            if (userMenu) {
                userMenu.innerHTML = `<i class="bi bi-person-circle"></i> ${user.first_name}`;
                this.log('✅ User menu updated', { firstName: user.first_name }, 'success');
            }
            
            // Show admin panel option only for admin users
            if (adminPanel) {
                if (user.role === 'admin') {
                    adminPanel.style.display = 'block';
                    this.log('✅ Admin panel shown for admin user', {}, 'success');
                } else {
                    adminPanel.style.display = 'none';
                    this.log('✅ Admin panel hidden for non-admin user', {}, 'success');
                }
            }
        } else {
            // Show login button, hide user menu
            if (loginBtn) {
                loginBtn.style.display = 'block';
                this.log('✅ Login button shown', {}, 'success');
            }
            if (userDropdown) {
                userDropdown.style.display = 'none';
                this.log('✅ User dropdown hidden', {}, 'success');
            }
            if (adminPanel) {
                adminPanel.style.display = 'none';
                this.log('✅ Admin panel hidden', {}, 'success');
            }
        }
    }

    // Show user profile
    async showProfile(e) {
        e.preventDefault();
        this.log('🔄 Showing user profile', {}, 'info');

        try {
            const response = await api.getProfile();
            
            if (response.success) {
                this.log('✅ Profile retrieved successfully', { user: response.data.user }, 'success');
                this.showProfileModal(response.data.user);
            } else {
                this.log('⚠️ Failed to retrieve profile', { response }, 'warn');
            }

        } catch (error) {
            this.log('❌ Error showing profile', { error: error.message }, 'error');
            api.handleError(error);
        }
    }

    // Show profile modal
    showProfileModal(user) {
        this.log('🔄 Showing profile modal', { user }, 'info');
        
        // Create or get profile modal
        let profileModal = document.getElementById('profileModal');
        
        if (!profileModal) {
            profileModal = this.createProfileModal();
            document.body.appendChild(profileModal);
            this.log('✅ Profile modal created and added to DOM', {}, 'success');
        }

        // Update modal content
        this.updateProfileModal(user);
        
        const modal = new bootstrap.Modal(profileModal);
        modal.show();
        this.log('✅ Profile modal shown', {}, 'success');
    }

    // Create profile modal
    createProfileModal() {
        this.log('🔄 Creating profile modal', {}, 'info');
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'profileModal';
        modal.tabIndex = -1;
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Mi Perfil</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="profileModalBody">
                        <!-- Profile content will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    // Update profile modal content
    updateProfileModal(user) {
        this.log('🔄 Updating profile modal content', { user }, 'info');
        
        const profileModalBody = document.getElementById('profileModalBody');
        if (!profileModalBody) {
            this.log('⚠️ Profile modal body not found', {}, 'warn');
            return;
        }

        profileModalBody.innerHTML = `
            <form id="profileForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="profileFirstName" class="form-label">Nombre</label>
                            <input type="text" class="form-control" id="profileFirstName" value="${user.first_name}" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="profileLastName" class="form-label">Apellido</label>
                            <input type="text" class="form-control" id="profileLastName" value="${user.last_name}" required>
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="profileEmail" class="form-label">Email</label>
                    <input type="email" class="form-control" id="profileEmail" value="${user.email}" disabled>
                    <div class="form-text">No puedes cambiar tu email</div>
                </div>
                <div class="mb-3">
                    <label for="profilePhone" class="form-label">Teléfono</label>
                    <input type="tel" class="form-control" id="profilePhone" value="${user.phone || ''}" placeholder="+58414-1234567">
                </div>
                <div class="mb-3">
                    <label class="form-label">Tipo de cuenta</label>
                    <input type="text" class="form-control" value="${user.role === 'admin' ? 'Administrador' : 'Cliente'}" disabled>
                </div>
                <div class="mb-3">
                    <label class="form-label">Miembro desde</label>
                    <input type="text" class="form-control" value="${api.formatDate(user.created_at)}" disabled>
                </div>
                <div class="d-flex justify-content-between">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-success">Actualizar Perfil</button>
                </div>
            </form>
        `;

        // Bind profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', this.handleUpdateProfile.bind(this));
            this.log('✅ Profile form event bound', {}, 'success');
        } else {
            this.log('⚠️ Profile form not found', {}, 'warn');
        }
    }

    // Handle profile update
    async handleUpdateProfile(e) {
        e.preventDefault();
        this.log('🔄 Handling profile update', {}, 'info');
        
        const updateData = {
            first_name: document.getElementById('profileFirstName').value,
            last_name: document.getElementById('profileLastName').value,
            phone: document.getElementById('profilePhone').value
        };

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: api.getHeaders(true),
                body: JSON.stringify(updateData)
            });

            const data = await api.handleResponse(response);
            
            if (data.success) {
                // Update stored user data
                const currentToken = api.token;
                api.setAuth(currentToken, data.data.user);
                
                // Update UI
                this.updateAuthState();
                
                api.showNotification('Perfil actualizado correctamente', 'success');
                this.log('✅ Profile updated successfully', { user: data.data.user }, 'success');
                
                // Hide modal
                const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
                if (profileModal) {
                    profileModal.hide();
                    this.log('✅ Profile modal hidden', {}, 'success');
                }
            } else {
                this.log('⚠️ Profile update failed', { response: data }, 'warn');
            }

        } catch (error) {
            this.log('❌ Error updating profile', { error: error.message }, 'error');
            api.handleError(error);
        }
    }

    // Show user orders
    async showOrders(e) {
        e.preventDefault();
        this.log('🔄 Showing user orders', {}, 'info');

        try {
            const response = await api.getUserOrders();
            
            if (response.success) {
                this.log('✅ Orders retrieved successfully', { orderCount: response.data.orders.length }, 'success');
                this.showOrdersModal(response.data.orders);
            } else {
                this.log('⚠️ Failed to retrieve orders', { response }, 'warn');
            }

        } catch (error) {
            this.log('❌ Error showing orders', { error: error.message }, 'error');
            api.handleError(error);
        }
    }

    // Show orders modal
    showOrdersModal(orders) {
        this.log('🔄 Showing orders modal', { orderCount: orders.length }, 'info');
        
        // Create or get orders modal
        let ordersModal = document.getElementById('ordersModal');
        
        if (!ordersModal) {
            ordersModal = this.createOrdersModal();
            document.body.appendChild(ordersModal);
            this.log('✅ Orders modal created and added to DOM', {}, 'success');
        }

        // Update modal content
        this.updateOrdersModal(orders);
        
        // Get existing modal instance or create new one
        let modal = bootstrap.Modal.getInstance(ordersModal);
        if (!modal) {
            modal = new bootstrap.Modal(ordersModal, {
                backdrop: true,
                keyboard: true
            });
        }
        
        // Clean up any existing backdrop before showing
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
            this.log('✅ Existing backdrop removed', {}, 'success');
        }
        
        modal.show();
        this.log('✅ Orders modal shown', {}, 'success');
    }

    // Create orders modal
    createOrdersModal() {
        this.log('🔄 Creating orders modal', {}, 'info');
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'ordersModal';
        modal.tabIndex = -1;
        
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Mis Pedidos</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="ordersModalBody">
                        <!-- Orders content will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        // Add event listeners to clean up backdrop when modal is hidden
        modal.addEventListener('hidden.bs.modal', () => {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
                this.log('✅ Modal backdrop removed on hide', {}, 'success');
            }
            // Also clean up body classes
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        });

        return modal;
    }

    // Update orders modal content
    updateOrdersModal(orders) {
        this.log('🔄 Updating orders modal content', { orderCount: orders.length }, 'info');
        
        const ordersModalBody = document.getElementById('ordersModalBody');
        if (!ordersModalBody) {
            this.log('⚠️ Orders modal body not found', {}, 'warn');
            return;
        }

        if (orders.length === 0) {
            ordersModalBody.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-bag-x"></i>
                    <h6>No tienes pedidos aún</h6>
                    <p class="text-muted">Cuando realices un pedido, aparecerá aquí</p>
                </div>
            `;
            this.log('✅ Empty orders state displayed', {}, 'success');
            return;
        }

        const ordersHtml = orders.map(order => {
            const statusClass = {
                'pending': 'warning',
                'verified': 'info',
                'preparing': 'primary',
                'shipped': 'success',
                'delivered': 'success',
                'cancelled': 'danger'
            }[order.status] || 'secondary';

            const statusText = {
                'pending': 'Pendiente',
                'verified': 'Verificado',
                'preparing': 'Preparando',
                'shipped': 'Enviado',
                'delivered': 'Entregado',
                'cancelled': 'Cancelado'
            }[order.status] || order.status;

            return `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Orden ${order.order_number}</strong>
                            <span class="badge bg-${statusClass} ms-2">${statusText}</span>
                        </div>
                        <small class="text-muted">${api.formatDate(order.created_at)}</small>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Detalles del Pedido</h6>
                                <p class="mb-1"><strong>Total:</strong> ${api.formatCurrency(order.total_amount)}</p>
                                <p class="mb-1"><strong>Productos:</strong> ${order.items_count} artículo(s)</p>
                                ${order.delivery_date ? `<p class="mb-0"><strong>Fecha de entrega:</strong> ${new Date(order.delivery_date).toLocaleDateString('es-VE')}</p>` : ''}
                            </div>
                            <div class="col-md-6">
                                <h6>Dirección de Entrega</h6>
                                <p class="mb-0">
                                    ${order.shipping_address.first_name} ${order.shipping_address.last_name}<br>
                                    ${order.shipping_address.address_line_1}<br>
                                    ${order.shipping_address.city}, ${order.shipping_address.state}<br>
                                    Tel: ${order.shipping_address.phone}
                                </p>
                            </div>
                        </div>
                        <div class="mt-2">
                            <button type="button" class="btn btn-sm btn-outline-primary" onclick="window.authManager.viewOrderDetails(${order.id})">
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        ordersModalBody.innerHTML = ordersHtml;
        this.log('✅ Orders modal content updated successfully', {}, 'success');
    }

    // View order details
    async viewOrderDetails(orderId) {
        this.log('🔄 Viewing order details', { orderId }, 'info');
        
        try {
            const response = await api.getOrder(orderId);
            
            if (response.success) {
                this.log('✅ Order details retrieved successfully', { orderId, order: response.data.order }, 'success');
                this.showOrderDetailsModal(response.data.order);
            } else {
                this.log('⚠️ Failed to retrieve order details', { orderId, response }, 'warn');
            }

        } catch (error) {
            this.log('❌ Error viewing order details', { error: error.message, orderId }, 'error');
            api.handleError(error);
        }
    }

    // Show order details modal
    showOrderDetailsModal(order) {
        this.log('🔄 Showing order details modal', { orderId: order.id }, 'info');
        
        // Create or get order details modal
        let orderDetailsModal = document.getElementById('orderDetailsModal');
        
        if (!orderDetailsModal) {
            orderDetailsModal = this.createOrderDetailsModal();
            document.body.appendChild(orderDetailsModal);
            this.log('✅ Order details modal created and added to DOM', {}, 'success');
        }

        // Update modal content
        this.updateOrderDetailsModal(order);
        
        const modal = new bootstrap.Modal(orderDetailsModal);
        modal.show();
        this.log('✅ Order details modal shown', {}, 'success');
    }

    // Create order details modal
    createOrderDetailsModal() {
        this.log('🔄 Creating order details modal', {}, 'info');
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'orderDetailsModal';
        modal.tabIndex = -1;
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalles del Pedido</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="orderDetailsModalBody">
                        <!-- Order details content will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    // Update order details modal content
    updateOrderDetailsModal(order) {
        this.log('🔄 Updating order details modal content', { orderId: order.id }, 'info');
        
        const orderDetailsModalBody = document.getElementById('orderDetailsModalBody');
        if (!orderDetailsModalBody) {
            this.log('⚠️ Order details modal body not found', {}, 'warn');
            return;
        }

        const statusClass = {
            'pending': 'warning',
            'verified': 'info',
            'preparing': 'primary',
            'shipped': 'success',
            'delivered': 'success',
            'cancelled': 'danger'
        }[order.status] || 'secondary';

        const statusText = {
            'pending': 'Pendiente',
            'verified': 'Verificado',
            'preparing': 'Preparando',
            'shipped': 'Enviado',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        }[order.status] || order.status;

        const itemsHtml = order.items.map(item => `
            <tr>
                <td>
                    <img src="${item.product_image || '/images/placeholder.jpg'}" 
                         alt="${item.product_name}" 
                         style="width: 50px; height: 50px; object-fit: cover;" 
                         class="rounded">
                </td>
                <td>${item.product_name || 'Producto no disponible'}</td>
                <td>${item.quantity}</td>
                <td>${api.formatCurrency(item.unit_price)}</td>
                <td>${api.formatCurrency(item.total_price)}</td>
            </tr>
        `).join('');

        const statusHistoryHtml = order.status_history.map(history => `
            <div class="d-flex justify-content-between border-bottom pb-2 mb-2">
                <div>
                    <strong>${history.new_status}</strong>
                    ${history.notes ? `<br><small class="text-muted">${history.notes}</small>` : ''}
                </div>
                <small class="text-muted">${api.formatDate(history.created_at)}</small>
            </div>
        `).join('');

        orderDetailsModalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información General</h6>
                    <p><strong>Número de Orden:</strong> ${order.order_number}</p>
                    <p><strong>Estado:</strong> <span class="badge bg-${statusClass}">${statusText}</span></p>
                    <p><strong>Fecha:</strong> ${api.formatDate(order.created_at)}</p>
                    <p><strong>Total:</strong> ${api.formatCurrency(order.total_amount)}</p>
                    ${order.delivery_date ? `<p><strong>Fecha de entrega:</strong> ${new Date(order.delivery_date).toLocaleDateString('es-VE')}</p>` : ''}
                    ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ''}
                </div>
                <div class="col-md-6">
                    <h6>Dirección de Entrega</h6>
                    <p>
                        ${order.shipping_address.first_name} ${order.shipping_address.last_name}<br>
                        ${order.shipping_address.address_line_1}<br>
                        ${order.shipping_address.address_line_2 ? order.shipping_address.address_line_2 + '<br>' : ''}
                        ${order.shipping_address.city}, ${order.shipping_address.state}<br>
                        Tel: ${order.shipping_address.phone}
                    </p>
                </div>
            </div>
            
            <h6 class="mt-4">Productos</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Imagen</th>
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
                        <tr>
                            <th colspan="4" class="text-end">Total del Pedido:</th>
                            <th>${api.formatCurrency(order.total_amount)}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <h6 class="mt-4">Historial de Estado</h6>
            <div class="status-history">
                ${statusHistoryHtml}
            </div>
        `;
        this.log('✅ Order details modal content updated successfully', {}, 'success');
    }
}

// Development helper functions for quick login
function fillAdminCredentials() {
    if (window.logger) {
        window.logger.info('AUTH', '🔄 Filling admin credentials');
    }
    
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (emailField && passwordField) {
        emailField.value = 'admin@floresya.com';
        passwordField.value = 'admin123';
        if (window.logger) {
            window.logger.success('AUTH', '✅ Admin credentials filled');
        }
    } else {
        if (window.logger) {
            window.logger.warn('AUTH', '⚠️ Login fields not found for admin credentials');
        }
    }
}

function fillClientCredentials() {
    if (window.logger) {
        window.logger.info('AUTH', '🔄 Filling client credentials');
    }
    
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (emailField && passwordField) {
        emailField.value = 'cliente@ejemplo.com';
        passwordField.value = 'customer123';
        if (window.logger) {
            window.logger.success('AUTH', '✅ Client credentials filled');
        }
    } else {
        if (window.logger) {
            window.logger.warn('AUTH', '⚠️ Login fields not found for client credentials');
        }
    }
}

// Hide dev buttons in production
function setupDevModeVisibility() {
    const isProduction = window.location.hostname.includes('vercel.app') || 
                       window.location.hostname === 'floresya.com' ||
                       window.location.hostname === 'www.floresya.com';
    
    if (window.logger) {
        window.logger.info('AUTH', '🔄 Setting up dev mode visibility', { isProduction });
    }
    
    if (isProduction) {
        const devSections = document.querySelectorAll('.dev-only-section');
        devSections.forEach(section => {
            section.style.display = 'none';
            if (window.logger) {
                window.logger.info('AUTH', '✅ Dev section hidden in production', { section });
            }
        });
    } else {
        if (window.logger) {
            window.logger.info('AUTH', 'ℹ️ Dev mode active - dev sections visible');
        }
    }
}

// Initialize dev mode visibility on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (window.logger) {
        window.logger.info('AUTH', '🔄 Initializing dev mode visibility on DOMContentLoaded');
    }
    setupDevModeVisibility();
});

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.logger) {
        window.logger.info('AUTH', '🔄 Initializing AuthManager on DOMContentLoaded');
    }
    window.authManager = new AuthManager();
    
    if (window.logger) {
        window.logger.success('AUTH', '✅ Global authManager instance created');
    } else {
        console.log('[👤 AUTH] Global authManager instance created');
    }
});