// Authentication functionality for FloresYa

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateAuthState();
    }

    // Bind authentication events
    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Profile link
        const viewProfile = document.getElementById('viewProfile');
        if (viewProfile) {
            viewProfile.addEventListener('click', this.showProfile.bind(this));
        }

        // Orders link
        const viewOrders = document.getElementById('viewOrders');
        if (viewOrders) {
            viewOrders.addEventListener('click', this.showOrders.bind(this));
        }
    }

    // Handle login form submission
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            api.showNotification('Por favor completa todos los campos', 'warning');
            return;
        }

        try {
            const response = await api.login(email, password);
            
            if (response.success) {
                api.showNotification(`¡Bienvenido ${response.data.user.first_name}!`, 'success');
                
                // Hide modal
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                if (loginModal) {
                    loginModal.hide();
                }

                // Update UI
                this.updateAuthState();
                
                // Reset form
                document.getElementById('loginForm').reset();
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // Handle register form submission
    async handleRegister(e) {
        e.preventDefault();
        
        const userData = {
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            email: document.getElementById('registerEmail').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('registerPassword').value
        };

        // Basic validation
        if (!userData.first_name || !userData.last_name || !userData.email || !userData.password) {
            api.showNotification('Por favor completa todos los campos obligatorios', 'warning');
            return;
        }

        if (userData.password.length < 6) {
            api.showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }

        try {
            const response = await api.register(userData);
            
            if (response.success) {
                api.showNotification(`¡Bienvenido ${response.data.user.first_name}! Cuenta creada exitosamente.`, 'success');
                
                // Hide modal
                const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                if (registerModal) {
                    registerModal.hide();
                }

                // Update UI
                this.updateAuthState();
                
                // Reset form
                document.getElementById('registerForm').reset();
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // Handle logout
    handleLogout(e) {
        e.preventDefault();
        
        api.clearAuth();
        this.updateAuthState();
        
        api.showNotification('Sesión cerrada correctamente', 'info');
        
        // Clear cart if needed
        if (window.cart) {
            // Don't clear cart, keep it for guest checkout
        }
    }

    // Update authentication state in UI
    updateAuthState() {
        const isAuthenticated = api.isAuthenticated();
        const user = api.getUser();

        const loginBtn = document.getElementById('loginBtn');
        const userDropdown = document.getElementById('userDropdown');
        const userMenu = document.getElementById('userMenu');
        const adminPanel = document.getElementById('adminPanel');

        if (isAuthenticated && user) {
            // Show user menu, hide login button
            if (loginBtn) loginBtn.style.display = 'none';
            if (userDropdown) userDropdown.style.display = 'block';
            if (userMenu) {
                userMenu.innerHTML = `<i class="bi bi-person-circle"></i> ${user.first_name}`;
            }
            
            // Show admin panel option only for admin users
            if (adminPanel) {
                if (user.role === 'admin') {
                    adminPanel.style.display = 'block';
                } else {
                    adminPanel.style.display = 'none';
                }
            }
        } else {
            // Show login button, hide user menu
            if (loginBtn) loginBtn.style.display = 'block';
            if (userDropdown) userDropdown.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'none';
        }
    }

    // Show user profile
    async showProfile(e) {
        e.preventDefault();

        try {
            const response = await api.getProfile();
            
            if (response.success) {
                this.showProfileModal(response.data.user);
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // Show profile modal
    showProfileModal(user) {
        // Create or get profile modal
        let profileModal = document.getElementById('profileModal');
        
        if (!profileModal) {
            profileModal = this.createProfileModal();
            document.body.appendChild(profileModal);
        }

        // Update modal content
        this.updateProfileModal(user);
        
        const modal = new bootstrap.Modal(profileModal);
        modal.show();
    }

    // Create profile modal
    createProfileModal() {
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
        const profileModalBody = document.getElementById('profileModalBody');
        if (!profileModalBody) return;

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
        }
    }

    // Handle profile update
    async handleUpdateProfile(e) {
        e.preventDefault();
        
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
                
                // Hide modal
                const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
                if (profileModal) {
                    profileModal.hide();
                }
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // Show user orders
    async showOrders(e) {
        e.preventDefault();

        try {
            const response = await api.getUserOrders();
            
            if (response.success) {
                this.showOrdersModal(response.data.orders);
            }

        } catch (error) {
            api.handleError(error);
        }
    }

    // Show orders modal
    showOrdersModal(orders) {
        // Create or get orders modal
        let ordersModal = document.getElementById('ordersModal');
        
        if (!ordersModal) {
            ordersModal = this.createOrdersModal();
            document.body.appendChild(ordersModal);
        }

        // Update modal content
        this.updateOrdersModal(orders);
        
        const modal = new bootstrap.Modal(ordersModal);
        modal.show();
    }

    // Create orders modal
    createOrdersModal() {
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

        return modal;
    }

    // Update orders modal content
    updateOrdersModal(orders) {
        const ordersModalBody = document.getElementById('ordersModalBody');
        if (!ordersModalBody) return;

        if (orders.length === 0) {
            ordersModalBody.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-bag-x"></i>
                    <h6>No tienes pedidos aún</h6>
                    <p class="text-muted">Cuando realices un pedido, aparecerá aquí</p>
                </div>
            `;
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
        // Create or get order details modal
        let orderDetailsModal = document.getElementById('orderDetailsModal');
        
        if (!orderDetailsModal) {
            orderDetailsModal = this.createOrderDetailsModal();
            document.body.appendChild(orderDetailsModal);
        }

        // Update modal content
        this.updateOrderDetailsModal(order);
        
        const modal = new bootstrap.Modal(orderDetailsModal);
        modal.show();
    }

    // Create order details modal
    createOrderDetailsModal() {
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
        const orderDetailsModalBody = document.getElementById('orderDetailsModalBody');
        if (!orderDetailsModalBody) return;

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
    }
}

// Development helper functions for quick login
function fillAdminCredentials() {
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (emailField && passwordField) {
        emailField.value = 'admin@floresya.com';
        passwordField.value = 'admin123';
    }
}

function fillClientCredentials() {
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (emailField && passwordField) {
        emailField.value = 'cliente@ejemplo.com';
        passwordField.value = 'customer123';
    }
}

// Hide dev buttons in production
function setupDevModeVisibility() {
    const isProduction = window.location.hostname.includes('vercel.app') || 
                       window.location.hostname === 'floresya.com' ||
                       window.location.hostname === 'www.floresya.com';
    
    if (isProduction) {
        const devSections = document.querySelectorAll('.dev-only-section');
        devSections.forEach(section => {
            section.style.display = 'none';
        });
    }
}

// Initialize dev mode visibility on DOM load
document.addEventListener('DOMContentLoaded', setupDevModeVisibility);

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});