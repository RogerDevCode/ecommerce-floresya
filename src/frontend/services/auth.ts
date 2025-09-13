/**
 * 🌸 FloresYa Authentication Service
 * Professional TypeScript authentication manager with comprehensive UI state management
 */

import type { User, AuthResponse, ApiResponse } from '@shared/types/api.js';
import type { Logger } from '@shared/types/frontend.js';

// Global window interfaces for this service
declare global {
    interface Window {
        logger?: Logger;
        authManager?: AuthManager;
        bootstrap?: any;
    }
}

interface UserData {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
}

interface ProfileUpdateData {
    first_name: string;
    last_name: string;
    phone?: string;
}

interface Order {
    id: number;
    order_number: string;
    status: 'pending' | 'verified' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
    total_amount: number;
    items_count: number;
    delivery_date?: string;
    created_at: string;
    notes?: string;
    shipping_address: {
        first_name: string;
        last_name: string;
        address_line_1: string;
        address_line_2?: string;
        city: string;
        state: string;
        phone: string;
    };
    items: Array<{
        product_name: string;
        product_image?: string;
        quantity: number;
        unit_price: number;
        total_price: number;
    }>;
    status_history: Array<{
        new_status: string;
        notes?: string;
        created_at: string;
    }>;
}

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

    private log(message: string, data: any = null, level: keyof Logger = 'info'): void {
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

    private init(): void {
        this.log('🔄 Initializing AuthManager', {}, 'info');
        
        try {
            this.bindEvents();
            this.updateAuthState();
            this.log('✅ AuthManager initialized successfully', {}, 'info');
        } catch (error) {
            this.log('❌ Error initializing AuthManager', { 
                error: error instanceof Error ? error.message : String(error) 
            }, 'error');
        }
    }

    // Bind authentication events
    private bindEvents(): void {
        this.log('🔄 Binding authentication events', {}, 'info');
        
        // Login form
        const loginForm = document.getElementById('loginForm') as HTMLFormElement;
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
            this.log('✅ Login form event bound', {}, 'info');
        } else {
            this.log('⚠️ Login form not found', {}, 'warn');
        }

        // Register form
        const registerForm = document.getElementById('registerForm') as HTMLFormElement;
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
            this.log('✅ Register form event bound', {}, 'info');
        } else {
            this.log('⚠️ Register form not found', {}, 'warn');
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
            this.log('✅ Logout button event bound', {}, 'info');
        } else {
            this.log('⚠️ Logout button not found', {}, 'warn');
        }

        // Profile link
        const viewProfile = document.getElementById('viewProfile') as HTMLAnchorElement;
        if (viewProfile) {
            viewProfile.addEventListener('click', this.showProfile.bind(this));
            this.log('✅ Profile link event bound', {}, 'info');
        } else {
            this.log('⚠️ Profile link not found', {}, 'warn');
        }

        // Orders link
        const viewOrders = document.getElementById('viewOrders') as HTMLAnchorElement;
        if (viewOrders) {
            viewOrders.addEventListener('click', this.showOrders.bind(this));
            this.log('✅ Orders link event bound', {}, 'info');
        } else {
            this.log('⚠️ Orders link not found', {}, 'warn');
        }
    }

    // Handle login form submission
    private async handleLogin(e: Event): Promise<void> {
        e.preventDefault();
        this.log('🔄 Handling login form submission', {}, 'info');
        
        const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
        const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;

        const email = emailInput?.value || '';
        const password = passwordInput?.value || '';

        if (!email || !password) {
            this.log('⚠️ Login validation failed - missing fields', { email, password: '***' }, 'warn');
            (window as any).api?.showNotification('Por favor completa todos los campos', 'warning');
            return;
        }

        try {
            this.log('✅ Login attempt', { email }, 'info');
            const response: ApiResponse<AuthResponse> = await (window as any).api.login(email, password);
            
            if (response.success && response.data?.user) {
                this.log('✅ Login successful', { user: response.data.user }, 'info');
                (window as any).api?.showNotification(`¡Bienvenido ${response.data.user.name || 'Usuario'}!`, 'success');
                
                // Hide modal
                const loginModalElement = document.getElementById('loginModal');
                if (loginModalElement && window.bootstrap) {
                    const loginModal = window.bootstrap.Modal.getInstance(loginModalElement);
                    if (loginModal) {
                        loginModal.hide();
                        this.log('✅ Login modal hidden', {}, 'info');
                    }
                }

                // Update UI
                this.updateAuthState();
                
                // Reset form
                const loginForm = document.getElementById('loginForm') as HTMLFormElement;
                if (loginForm) {
                    loginForm.reset();
                    this.log('✅ Login form reset', {}, 'info');
                }
            } else {
                this.log('⚠️ Login failed', { response }, 'warn');
            }

        } catch (error) {
            this.log('❌ Login error', { 
                error: error instanceof Error ? error.message : String(error), 
                email 
            }, 'error');
            (window as any).api?.handleError(error);
        }
    }

    // Handle register form submission
    private async handleRegister(e: Event): Promise<void> {
        e.preventDefault();
        this.log('🔄 Handling register form submission', {}, 'info');
        
        const userData: UserData = {
            first_name: (document.getElementById('firstName') as HTMLInputElement)?.value || '',
            last_name: (document.getElementById('lastName') as HTMLInputElement)?.value || '',
            email: (document.getElementById('registerEmail') as HTMLInputElement)?.value || '',
            phone: (document.getElementById('phone') as HTMLInputElement)?.value || '',
            password: (document.getElementById('registerPassword') as HTMLInputElement)?.value || ''
        };

        // Basic validation
        if (!userData.first_name || !userData.last_name || !userData.email || !userData.password) {
            this.log('⚠️ Registration validation failed - missing fields', { userData: { ...userData, password: '***' } }, 'warn');
            (window as any).api?.showNotification('Por favor completa todos los campos obligatorios', 'warning');
            return;
        }

        if (userData.password.length < 6) {
            this.log('⚠️ Registration validation failed - password too short', { passwordLength: userData.password.length }, 'warn');
            (window as any).api?.showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }

        try {
            this.log('✅ Registration attempt', { email: userData.email }, 'info');
            const response: ApiResponse<AuthResponse> = await (window as any).api.register(userData);
            
            if (response.success && response.data?.user) {
                this.log('✅ Registration successful', { user: response.data.user }, 'info');
                (window as any).api?.showNotification(`¡Bienvenido ${response.data.user.name || 'Usuario'}! Cuenta creada exitosamente.`, 'success');
                
                // Hide modal
                const registerModalElement = document.getElementById('registerModal');
                if (registerModalElement && window.bootstrap) {
                    const registerModal = window.bootstrap.Modal.getInstance(registerModalElement);
                    if (registerModal) {
                        registerModal.hide();
                        this.log('✅ Register modal hidden', {}, 'info');
                    }
                }

                // Update UI
                this.updateAuthState();
                
                // Reset form
                const registerForm = document.getElementById('registerForm') as HTMLFormElement;
                if (registerForm) {
                    registerForm.reset();
                    this.log('✅ Register form reset', {}, 'info');
                }
            } else {
                this.log('⚠️ Registration failed', { response }, 'warn');
            }

        } catch (error) {
            this.log('❌ Registration error', { 
                error: error instanceof Error ? error.message : String(error), 
                email: userData.email 
            }, 'error');
            (window as any).api?.handleError(error);
        }
    }

    // Handle logout
    private handleLogout(e: Event): void {
        e.preventDefault();
        this.log('🔄 Handling logout', {}, 'info');
        
        (window as any).api?.clearAuth();
        this.updateAuthState();
        
        (window as any).api?.showNotification('Sesión cerrada correctamente', 'info');
        this.log('✅ Logout completed successfully', {}, 'info');
        
        // Clear cart if needed
        if ((window as any).cart) {
            // Don't clear cart, keep it for guest checkout
            this.log('ℹ️ Cart preserved for guest checkout', {}, 'info');
        }
    }

    // Update authentication state in UI
    private updateAuthState(): void {
        this.log('🔄 Updating authentication state', {}, 'info');
        
        const isAuthenticated = (window as any).api?.isAuthenticated() || false;
        const user: User | null = (window as any).api?.getUser() || null;

        const loginBtn = document.getElementById('loginBtn') as HTMLElement;
        const userDropdown = document.getElementById('userDropdown') as HTMLElement;
        const userMenu = document.getElementById('userMenu') as HTMLElement;
        const adminPanel = document.getElementById('adminPanel') as HTMLElement;

        if (isAuthenticated && user) {
            // Show user menu, hide login button
            if (loginBtn) {
                loginBtn.style.display = 'none';
                this.log('✅ Login button hidden', {}, 'info');
            }
            if (userDropdown) {
                userDropdown.style.display = 'block';
                this.log('✅ User dropdown shown', {}, 'info');
            }
            if (userMenu) {
                userMenu.innerHTML = `<i class="bi bi-person-circle"></i> ${user.name || 'Usuario'}`;
                this.log('✅ User menu updated', { name: user.name }, 'info');
            }
            
            // Show admin panel option only for admin users
            if (adminPanel) {
                if (user.role === 'admin') {
                    adminPanel.style.display = 'block';
                    this.log('✅ Admin panel shown for admin user', {}, 'info');
                } else {
                    adminPanel.style.display = 'none';
                    this.log('✅ Admin panel hidden for non-admin user', {}, 'info');
                }
            }
        } else {
            // Show login button, hide user menu
            if (loginBtn) {
                loginBtn.style.display = 'block';
                this.log('✅ Login button shown', {}, 'info');
            }
            if (userDropdown) {
                userDropdown.style.display = 'none';
                this.log('✅ User dropdown hidden', {}, 'info');
            }
            if (adminPanel) {
                adminPanel.style.display = 'none';
                this.log('✅ Admin panel hidden', {}, 'info');
            }
        }
    }

    // Show user profile
    private async showProfile(e: Event): Promise<void> {
        e.preventDefault();
        this.log('🔄 Showing user profile', {}, 'info');

        try {
            const response: ApiResponse<User> = await (window as any).api.getProfile();
            
            if (response.success && response.data) {
                this.log('✅ Profile retrieved successfully', { user: response.data }, 'info');
                this.showProfileModal(response.data);
            } else {
                this.log('⚠️ Failed to retrieve profile', { response }, 'warn');
            }

        } catch (error) {
            this.log('❌ Error showing profile', { error: error instanceof Error ? error.message : String(error) }, 'error');
            (window as any).api?.handleError(error);
        }
    }

    // Show profile modal
    private showProfileModal(user: User): void {
        this.log('🔄 Showing profile modal', { user }, 'info');
        
        // Create or get profile modal
        let profileModal = document.getElementById('profileModal');
        
        if (!profileModal) {
            profileModal = this.createProfileModal();
            document.body.appendChild(profileModal);
            this.log('✅ Profile modal created and added to DOM', {}, 'info');
        }

        // Update modal content
        this.updateProfileModal(user);
        
        if (window.bootstrap) {
            const modal = new window.bootstrap.Modal(profileModal);
            modal.show();
            this.log('✅ Profile modal shown', {}, 'info');
        }
    }

    // Create profile modal
    private createProfileModal(): HTMLElement {
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
    private updateProfileModal(user: User): void {
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
                            <input type="text" class="form-control" id="profileFirstName" value="${user.name?.split(' ')[0] || ''}" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="profileLastName" class="form-label">Apellido</label>
                            <input type="text" class="form-control" id="profileLastName" value="${user.name?.split(' ').slice(1).join(' ') || ''}" required>
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
                    <input type="tel" class="form-control" id="profilePhone" value="" placeholder="+58414-1234567">
                </div>
                <div class="mb-3">
                    <label class="form-label">Tipo de cuenta</label>
                    <input type="text" class="form-control" value="${user.role === 'admin' ? 'Administrador' : 'Cliente'}" disabled>
                </div>
                <div class="mb-3">
                    <label class="form-label">Miembro desde</label>
                    <input type="text" class="form-control" value="${user.created_at ? (window as any).api?.formatDate(user.created_at) : 'N/A'}" disabled>
                </div>
                <div class="d-flex justify-content-between">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-success">Actualizar Perfil</button>
                </div>
            </form>
        `;

        // Bind profile form
        const profileForm = document.getElementById('profileForm') as HTMLFormElement;
        if (profileForm) {
            profileForm.addEventListener('submit', this.handleUpdateProfile.bind(this));
            this.log('✅ Profile form event bound', {}, 'info');
        } else {
            this.log('⚠️ Profile form not found', {}, 'warn');
        }
    }

    // Handle profile update
    private async handleUpdateProfile(e: Event): Promise<void> {
        e.preventDefault();
        this.log('🔄 Handling profile update', {}, 'info');
        
        const updateData: ProfileUpdateData = {
            first_name: (document.getElementById('profileFirstName') as HTMLInputElement)?.value || '',
            last_name: (document.getElementById('profileLastName') as HTMLInputElement)?.value || '',
            phone: (document.getElementById('profilePhone') as HTMLInputElement)?.value || ''
        };

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: (window as any).api?.getHeaders(true) || { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            const data: ApiResponse<{ user: User }> = await (window as any).api?.handleResponse(response);
            
            if (data.success && data.data?.user) {
                // Update stored user data
                const currentToken = (window as any).api?.token;
                (window as any).api?.setAuth(currentToken, data.data.user);
                
                // Update UI
                this.updateAuthState();
                
                (window as any).api?.showNotification('Perfil actualizado correctamente', 'success');
                this.log('✅ Profile updated successfully', { user: data.data.user }, 'info');
                
                // Hide modal
                const profileModalElement = document.getElementById('profileModal');
                if (profileModalElement && window.bootstrap) {
                    const profileModal = window.bootstrap.Modal.getInstance(profileModalElement);
                    if (profileModal) {
                        profileModal.hide();
                        this.log('✅ Profile modal hidden', {}, 'info');
                    }
                }
            } else {
                this.log('⚠️ Profile update failed', { response: data }, 'warn');
            }

        } catch (error) {
            this.log('❌ Error updating profile', { error: error instanceof Error ? error.message : String(error) }, 'error');
            (window as any).api?.handleError(error);
        }
    }

    // Show user orders
    private async showOrders(e: Event): Promise<void> {
        e.preventDefault();
        this.log('🔄 Showing user orders', {}, 'info');

        try {
            const response: ApiResponse<{ orders: Order[] }> = await (window as any).api.getUserOrders();
            
            if (response.success && response.data?.orders) {
                this.log('✅ Orders retrieved successfully', { orderCount: response.data.orders.length }, 'info');
                this.showOrdersModal(response.data.orders);
            } else {
                this.log('⚠️ Failed to retrieve orders', { response }, 'warn');
            }

        } catch (error) {
            this.log('❌ Error showing orders', { error: error instanceof Error ? error.message : String(error) }, 'error');
            (window as any).api?.handleError(error);
        }
    }

    // Show orders modal
    private showOrdersModal(orders: Order[]): void {
        this.log('🔄 Showing orders modal', { orderCount: orders.length }, 'info');
        
        // Create or get orders modal
        let ordersModal = document.getElementById('ordersModal');
        
        if (!ordersModal) {
            ordersModal = this.createOrdersModal();
            document.body.appendChild(ordersModal);
            this.log('✅ Orders modal created and added to DOM', {}, 'info');
        }

        // Update modal content
        this.updateOrdersModal(orders);
        
        if (window.bootstrap) {
            // Get existing modal instance or create new one
            let modal = window.bootstrap.Modal.getInstance(ordersModal);
            if (!modal) {
                modal = new window.bootstrap.Modal(ordersModal, {
                    backdrop: true,
                    keyboard: true
                });
            }
            
            // Clean up any existing backdrop before showing
            const existingBackdrop = document.querySelector('.modal-backdrop');
            if (existingBackdrop) {
                existingBackdrop.remove();
                this.log('✅ Existing backdrop removed', {}, 'info');
            }
            
            modal.show();
            this.log('✅ Orders modal shown', {}, 'info');
        }
    }

    // Create orders modal
    private createOrdersModal(): HTMLElement {
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
                this.log('✅ Modal backdrop removed on hide', {}, 'info');
            }
            // Also clean up body classes
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        });

        return modal;
    }

    // Update orders modal content
    private updateOrdersModal(orders: Order[]): void {
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
            this.log('✅ Empty orders state displayed', {}, 'info');
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
                        <small class="text-muted">${(window as any).api?.formatDate(order.created_at) || order.created_at}</small>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Detalles del Pedido</h6>
                                <p class="mb-1"><strong>Total:</strong> ${(window as any).api?.formatCurrency(order.total_amount) || `$${order.total_amount}`}</p>
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
                            <button type="button" class="btn btn-sm btn-outline-primary" onclick="window.authManager?.viewOrderDetails(${order.id})">
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        ordersModalBody.innerHTML = ordersHtml;
        this.log('✅ Orders modal content updated successfully', {}, 'info');
    }

    // View order details - public method for onclick handlers
    public async viewOrderDetails(orderId: number): Promise<void> {
        this.log('🔄 Viewing order details', { orderId }, 'info');
        
        try {
            const response: ApiResponse<{ order: Order }> = await (window as any).api.getOrder(orderId);
            
            if (response.success && response.data?.order) {
                this.log('✅ Order details retrieved successfully', { orderId, order: response.data.order }, 'info');
                this.showOrderDetailsModal(response.data.order);
            } else {
                this.log('⚠️ Failed to retrieve order details', { orderId, response }, 'warn');
            }

        } catch (error) {
            this.log('❌ Error viewing order details', { 
                error: error instanceof Error ? error.message : String(error), 
                orderId 
            }, 'error');
            (window as any).api?.handleError(error);
        }
    }

    // Show order details modal
    private showOrderDetailsModal(order: Order): void {
        this.log('🔄 Showing order details modal', { orderId: order.id }, 'info');
        
        // Create or get order details modal
        let orderDetailsModal = document.getElementById('orderDetailsModal');
        
        if (!orderDetailsModal) {
            orderDetailsModal = this.createOrderDetailsModal();
            document.body.appendChild(orderDetailsModal);
            this.log('✅ Order details modal created and added to DOM', {}, 'info');
        }

        // Update modal content
        this.updateOrderDetailsModal(order);
        
        if (window.bootstrap) {
            const modal = new window.bootstrap.Modal(orderDetailsModal);
            modal.show();
            this.log('✅ Order details modal shown', {}, 'info');
        }
    }

    // Create order details modal
    private createOrderDetailsModal(): HTMLElement {
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
    private updateOrderDetailsModal(order: Order): void {
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
                <td>${(window as any).api?.formatCurrency(item.unit_price) || `$${item.unit_price}`}</td>
                <td>${(window as any).api?.formatCurrency(item.total_price) || `$${item.total_price}`}</td>
            </tr>
        `).join('');

        const statusHistoryHtml = order.status_history.map(history => `
            <div class="d-flex justify-content-between border-bottom pb-2 mb-2">
                <div>
                    <strong>${history.new_status}</strong>
                    ${history.notes ? `<br><small class="text-muted">${history.notes}</small>` : ''}
                </div>
                <small class="text-muted">${(window as any).api?.formatDate(history.created_at) || history.created_at}</small>
            </div>
        `).join('');

        orderDetailsModalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información General</h6>
                    <p><strong>Número de Orden:</strong> ${order.order_number}</p>
                    <p><strong>Estado:</strong> <span class="badge bg-${statusClass}">${statusText}</span></p>
                    <p><strong>Fecha:</strong> ${(window as any).api?.formatDate(order.created_at) || order.created_at}</p>
                    <p><strong>Total:</strong> ${(window as any).api?.formatCurrency(order.total_amount) || `$${order.total_amount}`}</p>
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
                            <th>${(window as any).api?.formatCurrency(order.total_amount) || `$${order.total_amount}`}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <h6 class="mt-4">Historial de Estado</h6>
            <div class="status-history">
                ${statusHistoryHtml}
            </div>
        `;
        this.log('✅ Order details modal content updated successfully', {}, 'info');
    }
}

// Development helper functions for quick login
function fillAdminCredentials(): void {
    if (window.logger) {
        window.logger.info('AUTH', '🔄 Filling admin credentials');
    }
    
    const emailField = document.getElementById('loginEmail') as HTMLInputElement;
    const passwordField = document.getElementById('loginPassword') as HTMLInputElement;
    
    if (emailField && passwordField) {
        emailField.value = 'admin@floresya.com';
        passwordField.value = 'admin123';
        if (window.logger) {
            window.logger.info('AUTH', '✅ Admin credentials filled');
        }
    } else {
        if (window.logger) {
            window.logger.warn('AUTH', '⚠️ Login fields not found for admin credentials');
        }
    }
}

function fillClientCredentials(): void {
    if (window.logger) {
        window.logger.info('AUTH', '🔄 Filling client credentials');
    }
    
    const emailField = document.getElementById('loginEmail') as HTMLInputElement;
    const passwordField = document.getElementById('loginPassword') as HTMLInputElement;
    
    if (emailField && passwordField) {
        emailField.value = 'cliente@ejemplo.com';
        passwordField.value = 'customer123';
        if (window.logger) {
            window.logger.info('AUTH', '✅ Client credentials filled');
        }
    } else {
        if (window.logger) {
            window.logger.warn('AUTH', '⚠️ Login fields not found for client credentials');
        }
    }
}

// Hide dev buttons in production
function setupDevModeVisibility(): void {
    const isProduction = window.location.hostname.includes('vercel.app') || 
                       window.location.hostname === 'floresya.com' ||
                       window.location.hostname === 'www.floresya.com';
    
    if (window.logger) {
        window.logger.info('AUTH', '🔄 Setting up dev mode visibility', { isProduction });
    }
    
    if (isProduction) {
        const devSections = document.querySelectorAll('.dev-only-section');
        devSections?.forEach(section => {
            (section as HTMLElement).style.display = 'none';
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
        window.logger.info('AUTH', '✅ Global authManager instance created');
    } else {
        console.log('[👤 AUTH] Global authManager instance created');
    }
});

// Export for module systems
export default AuthManager;
export { fillAdminCredentials, fillClientCredentials, setupDevModeVisibility };