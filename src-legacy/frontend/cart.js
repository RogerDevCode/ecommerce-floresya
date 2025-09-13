class ShoppingCart {
    constructor() {
        this.items = this.loadCartFromStorage();
        this.shippingFeeUSD = 7.00; // Tarifa de envío fija en USD
        this.exchangeRateBCV = null; // Tasa de cambio Bs/USD
        this.listeners = [];
        
        // Initialize with logging
        if (window.logger) {
            window.logger.info('CART', '✅ ShoppingCart initialized');
        } else {
            console.log('[🛒 CART] ShoppingCart initialized');
        }
        
        this.init();
    }

    log(message, data = null, level = 'info') {
        // Use window.logger if available
        if (window.logger) {
            window.logger[level]('CART', message, data);
        } else {
            const prefix = '[🛒 CART]';
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

    async init() {
        this.log('🔄 Initializing ShoppingCart', {}, 'info');
        
        try {
            await this.fetchExchangeRate();
            this.updateCartDisplay();
            this.bindEvents();
            this.log('✅ ShoppingCart initialized successfully', {}, 'success');
        } catch (error) {
            this.log('❌ Error initializing ShoppingCart', { error: error.message }, 'error');
        }
    }

    async fetchExchangeRate() {
        this.log('🔄 Fetching exchange rate', {}, 'info');
        
        try {
            // Asumimos que la tasa se guarda con la key 'exchange_rate_bcv'
            const response = await api.getSetting('exchange_rate_bcv');
            if (response.success && response.data.setting_value) {
                this.exchangeRateBCV = parseFloat(response.data.setting_value);
                this.log('✅ Exchange rate loaded successfully', { rate: this.exchangeRateBCV }, 'success');
            } else {
                // Fallback si no se encuentra la tasa
                this.exchangeRateBCV = 36.5; // Tasa de fallback
                this.log('⚠️ Exchange rate not found, using fallback', { rate: this.exchangeRateBCV }, 'warn');
            }
        } catch (error) {
            this.exchangeRateBCV = 36.5; // Tasa de fallback
            this.log('❌ Error fetching exchange rate, using fallback', { error: error.message }, 'error');
        }
    }

    loadCartFromStorage() {
        this.log('🔄 Loading cart from storage', {}, 'info');
        
        try {
            const saved = localStorage.getItem('floresya_cart');
            const items = saved ? JSON.parse(saved) : [];
            this.log('✅ Cart loaded from storage', { itemCount: items.length }, 'success');
            return items;
        } catch (error) {
            this.log('❌ Error loading cart from storage', { error: error.message }, 'error');
            return [];
        }
    }

    saveCartToStorage() {
        this.log('🔄 Saving cart to storage', { itemCount: this.items.length }, 'info');
        
        try {
            localStorage.setItem('floresya_cart', JSON.stringify(this.items));
            this.log('✅ Cart saved to storage', { itemCount: this.items.length }, 'success');
        } catch (error) {
            this.log('❌ Error saving cart to storage', { error: error.message }, 'error');
        }
    }

    onChange(callback) {
        this.log('🔄 Adding change listener', {}, 'info');
        this.listeners.push(callback);
        this.log('✅ Change listener added', { listenerCount: this.listeners.length }, 'success');
    }

    notifyListeners() {
        this.log('🔄 Notifying listeners', { listenerCount: this.listeners.length }, 'info');
        this.listeners.forEach(callback => callback(this.items));
        this.log('✅ Listeners notified', {}, 'success');
    }

    async addItem(productId, quantity = 1) {
        this.log('🔄 Adding item to cart', { productId, quantity }, 'info');
        
        try {
            const response = await api.getProductById(productId);
            if (!response.success) throw new Error('Producto no encontrado');

            const product = response.data.product;
            const existingItem = this.items.find(item => item.product_id === productId);

            if (existingItem) {
                existingItem.quantity += quantity;
                this.log('✅ Item quantity updated', { 
                    productId, 
                    name: product.name, 
                    quantity: existingItem.quantity 
                }, 'success');
            } else {
                this.items.push({ 
                    product_id: productId, 
                    name: product.name, 
                    price: parseFloat(product.price), 
                    quantity, 
                    image_url: product.primary_image || product.image_url 
                });
                this.log('✅ New item added to cart', { 
                    productId, 
                    name: product.name, 
                    quantity 
                }, 'success');
            }

            this.saveCartToStorage();
            this.updateCartDisplay();
            this.notifyListeners();
            api.showNotification(`${product.name} agregado al carrito`, 'success');
            this.log('✅ Item added to cart successfully', { 
                productId, 
                name: product.name, 
                quantity 
            }, 'success');
        } catch (error) {
            this.log('❌ Error adding item to cart', { error: error.message, productId }, 'error');
            api.handleError(error);
        }
    }

    removeItem(productId) {
        this.log('🔄 Removing item from cart', { productId }, 'info');
        
        const originalLength = this.items.length;
        this.items = this.items.filter(item => item.product_id !== productId);
        const removed = originalLength - this.items.length;
        
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.notifyListeners();
        
        if (removed > 0) {
            this.log('✅ Item removed from cart', { productId, removed }, 'success');
        } else {
            this.log('⚠️ Item not found in cart', { productId }, 'warn');
        }
    }

    updateQuantity(productId, newQuantity) {
        this.log('🔄 Updating item quantity', { productId, newQuantity }, 'info');
        
        const item = this.items.find(item => item.product_id === productId);
        if (item) {
            if (newQuantity > 0) {
                item.quantity = newQuantity;
                this.log('✅ Item quantity updated', { productId, newQuantity }, 'success');
            } else {
                this.log('🔄 Removing item due to zero quantity', { productId }, 'info');
                this.removeItem(productId);
                return;
            }
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.notifyListeners();
        } else {
            this.log('⚠️ Item not found for quantity update', { productId }, 'warn');
        }
    }

    getSubtotal() {
        const subtotal = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        this.log('📊 Calculating subtotal', { subtotal, itemCount: this.items.length }, 'info');
        return subtotal;
    }

    getFinalTotalUSD() {
        const subtotal = this.getSubtotal();
        const totalUSD = subtotal > 0 ? subtotal + this.shippingFeeUSD : 0;
        this.log('📊 Calculating final total USD', { subtotal, shippingFee: this.shippingFeeUSD, totalUSD }, 'info');
        return totalUSD;
    }

    getFinalTotalBCV() {
        const totalUSD = this.getFinalTotalUSD();
        const totalBCV = this.exchangeRateBCV ? totalUSD * this.exchangeRateBCV : 0;
        this.log('📊 Calculating final total BCV', { totalUSD, exchangeRate: this.exchangeRateBCV, totalBCV }, 'info');
        return totalBCV;
    }

    getItemCount() {
        const count = this.items.reduce((count, item) => count + item.quantity, 0);
        this.log('📊 Getting item count', { count }, 'info');
        return count;
    }

    clear() {
        this.log('🔄 Clearing cart', { itemCount: this.items.length }, 'info');
        
        this.items = [];
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.notifyListeners();
        this.log('✅ Cart cleared successfully', {}, 'success');
    }

    updateCartDisplay() {
        this.log('🔄 Updating cart display', { itemCount: this.getItemCount() }, 'info');
        
        const cartCount = document.getElementById('cartCount');
        const cartPulse = document.getElementById('cartPulse');
        const cartIcon = document.querySelector('.cart-icon');
        
        if (cartCount) {
            const count = this.getItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'inline-block' : 'none';
            
            // Add pulse animation when items are added
            if (cartPulse && count > 0) {
                cartPulse.classList.add('pulse-active');
                setTimeout(() => {
                    cartPulse.classList.remove('pulse-active');
                }, 1000);
            }
        }
        
        // Update cart icon visual state
        if (cartIcon) {
            const count = this.getItemCount();
            if (count > 0) {
                cartIcon.classList.add('cart-has-items');
            } else {
                cartIcon.classList.remove('cart-has-items');
            }
        }
        
        this.updateCartOffcanvas();
        this.updateGuestBanner();
        this.log('✅ Cart display updated successfully', {}, 'success');
    }

    updateCartOffcanvas() {
        this.log('🔄 Updating cart offcanvas', { itemCount: this.items.length }, 'info');
        
        const cartItemsEl = document.getElementById('cartItems');
        const emptyCartEl = document.getElementById('emptyCart');
        const cartSummaryEl = document.getElementById('cartSummary');
        const cartActionsEl = document.getElementById('cartActions');
        const quickActionsEl = document.getElementById('quickActions');
        const cartSubtotalEl = document.getElementById('cartSubtotal');
        const cartTotalEl = document.getElementById('cartTotal');

        if (!cartItemsEl) {
            this.log('⚠️ Cart items element not found', {}, 'warn');
            return;
        }

        if (this.items.length === 0) {
            // Show empty state
            emptyCartEl?.style.setProperty('display', 'block');
            cartSummaryEl?.style.setProperty('display', 'none');
            cartActionsEl?.style.setProperty('display', 'none');
            quickActionsEl?.style.setProperty('display', 'none');
            cartItemsEl.innerHTML = '';
            this.log('✅ Cart offcanvas updated - empty state', {}, 'success');
        } else {
            // Hide empty state, show cart content
            emptyCartEl?.style.setProperty('display', 'none');
            cartSummaryEl?.style.setProperty('display', 'block');
            cartActionsEl?.style.setProperty('display', 'block');
            quickActionsEl?.style.setProperty('display', 'block');

            // Render cart items with enhanced design
            cartItemsEl.innerHTML = this.items.map(item => `
                <div class="cart-item d-flex align-items-center p-3 mb-2 bg-white rounded shadow-sm">
                    <img src="${item.image_url || '/images/placeholder-product-2.webp'}" alt="${item.name}" 
                         class="cart-item-image rounded me-3" 
                         style="width: 60px; height: 60px; object-fit: cover;">
                    <div class="cart-item-details flex-grow-1">
                        <h6 class="mb-1">${item.name}</h6>
                        <div class="d-flex align-items-center">
                            <div class="quantity-controls me-3">
                                <button class="btn btn-sm btn-outline-secondary" 
                                        onclick="cart.updateQuantity(${item.product_id}, ${item.quantity - 1})">
                                    <i class="bi bi-dash"></i>
                                </button>
                                <span class="mx-2 fw-bold">${item.quantity}</span>
                                <button class="btn btn-sm btn-outline-secondary" 
                                        onclick="cart.updateQuantity(${item.product_id}, ${item.quantity + 1})">
                                    <i class="bi bi-plus"></i>
                                </button>
                            </div>
                            <span class="text-muted small">${api.formatCurrency(item.price)} c/u</span>
                        </div>
                    </div>
                    <div class="cart-item-actions text-end">
                        <div class="fw-bold text-primary-custom">${api.formatCurrency(item.price * item.quantity)}</div>
                        <button class="btn btn-sm btn-outline-danger mt-1" 
                                onclick="cart.removeItem(${item.product_id})" 
                                title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            // Update totals
            const subtotal = this.getSubtotal();
            const totalUSD = this.getFinalTotalUSD();

            if (cartSubtotalEl) cartSubtotalEl.textContent = api.formatCurrency(subtotal);
            if (cartTotalEl) cartTotalEl.textContent = api.formatCurrency(totalUSD);
            this.log('✅ Cart offcanvas updated - items displayed', { itemCount: this.items.length }, 'success');
        }
    }

    updateGuestBanner() {
        this.log('🔄 Updating guest banner', {}, 'info');
        
        const guestBanner = document.getElementById('guestBanner');
        const user = api?.getUser();
        
        if (guestBanner) {
            if (!user && this.items.length > 0) {
                guestBanner.style.display = 'block';
                this.log('✅ Guest banner shown', {}, 'success');
            } else {
                guestBanner.style.display = 'none';
                this.log('✅ Guest banner hidden', {}, 'success');
            }
        }
    }

    bindEvents() {
        this.log('🔄 Binding cart events', {}, 'info');
        
        // Cart toggle (already handled by Bootstrap data attributes in HTML)
        
        // FloresYa Express Checkout
        document.getElementById('floresyaCheckoutBtn')?.addEventListener('click', () => {
            if (this.items.length > 0) {
                this.log('✅ FloresYa Express checkout initiated', {}, 'success');
                this.handleFloresYaCheckout();
            } else {
                this.log('⚠️ FloresYa Express checkout attempted with empty cart', {}, 'warn');
            }
        });

        // Regular Checkout
        document.getElementById('regularCheckoutBtn')?.addEventListener('click', () => {
            if (this.items.length > 0) {
                this.log('✅ Regular checkout initiated', {}, 'success');
                window.location.href = '/pages/payment.html';
            } else {
                this.log('⚠️ Regular checkout attempted with empty cart', {}, 'warn');
            }
        });
        
        this.log('✅ Cart events bound successfully', {}, 'success');
    }

    async handleFloresYaCheckout() {
        this.log('🔄 Handling FloresYa checkout', {}, 'info');
        
        const user = api?.getUser();
        
        if (!user) {
            // Guest user - show quick checkout modal
            this.log('✅ Guest user detected, showing FloresYa modal', {}, 'success');
            this.showGuestFloresYaModal();
        } else {
            // Logged in user - direct to payment
            this.log('✅ Logged in user detected, redirecting to payment', {}, 'success');
            window.location.href = '/pages/payment.html?floresya=true';
        }
    }

    showGuestFloresYaModal() {
        this.log('🔄 Showing guest FloresYa modal', {}, 'info');
        
        const totalItems = this.getItemCount();
        const totalPrice = this.getFinalTotalUSD();
        
        const modalHTML = `
            <div class="modal fade" id="cartFloresYaModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-gradient-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-cart-check"></i> FloresYa Express
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <i class="bi bi-bag-heart display-4 text-primary-custom mb-3"></i>
                                <h6>${totalItems} producto${totalItems > 1 ? 's' : ''} en tu carrito</h6>
                                <p class="text-primary-custom fw-bold fs-5">${api.formatCurrency(totalPrice)}</p>
                            </div>
                            
                            <div class="alert alert-info">
                                <i class="bi bi-rocket-takeoff"></i>
                                <strong>¡Checkout súper rápido!</strong><br>
                                Solo completa tus datos de envío y paga en segundos.
                            </div>

                            <form id="cartGuestForm">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Nombre completo *</label>
                                        <input type="text" class="form-control" id="cartGuestName" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Teléfono *</label>
                                        <input type="tel" class="form-control" id="cartGuestPhone" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="cartGuestEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Dirección de entrega *</label>
                                    <textarea class="form-control" id="cartGuestAddress" rows="2" 
                                             placeholder="Dirección completa con referencias" required></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary-custom btn-lg" onclick="cart.processCartFloresYa()">
                                <i class="bi bi-cart-check"></i> FloresYa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('cartFloresYaModal');
        if (existingModal) {
            existingModal.remove();
            this.log('✅ Existing FloresYa modal removed', {}, 'success');
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.log('✅ FloresYa modal added to DOM', {}, 'success');

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('cartFloresYaModal'));
        modal.show();
        this.log('✅ FloresYa modal shown', {}, 'success');

        // Close cart offcanvas
        const cartOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
        if (cartOffcanvas) {
            cartOffcanvas.hide();
            this.log('✅ Cart offcanvas hidden', {}, 'success');
        }
    }

    processCartFloresYa() {
        this.log('🔄 Processing FloresYa checkout', {}, 'info');
        
        const form = document.getElementById('cartGuestForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            this.log('⚠️ FloresYa checkout form invalid', {}, 'warn');
            return;
        }

        const guestData = {
            name: document.getElementById('cartGuestName').value,
            phone: document.getElementById('cartGuestPhone').value,
            email: document.getElementById('cartGuestEmail').value,
            address: document.getElementById('cartGuestAddress').value
        };

        // Store guest data
        sessionStorage.setItem('floresya_guest', JSON.stringify(guestData));
        this.log('✅ Guest data stored in sessionStorage', { guestData }, 'success');

        // Show success animation
        this.showFloresYaAnimation();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('cartFloresYaModal'));
        modal.hide();
        this.log('✅ FloresYa modal hidden', {}, 'success');

        // Redirect to payment
        setTimeout(() => {
            window.location.href = '/pages/payment.html?floresya=true&guest=true';
            this.log('✅ Redirecting to payment page', {}, 'success');
        }, 1500);
    }

    showFloresYaAnimation() {
        this.log('🔄 Showing FloresYa animation', {}, 'info');
        
        const animationHTML = `
            <div id="cart-floresya-animation" class="position-fixed top-50 start-50 translate-middle" 
                 style="z-index: 9999; text-align: center;">
                <div class="bg-primary-custom text-white p-4 rounded-3 shadow-lg">
                    <i class="bi bi-cart-check display-1 mb-3 floresya-pulse"></i>
                    <h4 class="fw-bold">FloresYa</h4>
                    <p class="mb-0">Procesando tu pedido...</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', animationHTML);
        this.log('✅ FloresYa animation added to DOM', {}, 'success');

        setTimeout(() => {
            const animation = document.getElementById('cart-floresya-animation');
            if (animation) {
                animation.remove();
                this.log('✅ FloresYa animation removed', {}, 'success');
            }
        }, 1500);
    }

    // Additional cart utility functions
    clearCart() {
        this.log('🔄 Clearing cart - user confirmation requested', {}, 'info');
        
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            this.items = [];
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.notifyListeners();
            api.showNotification('Carrito vaciado', 'info');
            this.log('✅ Cart cleared by user confirmation', {}, 'success');
        } else {
            this.log('ℹ️ Cart clear canceled by user', {}, 'info');
        }
    }

    saveForLater() {
        this.log('🔄 Saving cart for later', { itemCount: this.items.length }, 'info');
        
        if (this.items.length > 0) {
            const savedItems = JSON.stringify(this.items);
            localStorage.setItem('floresya_saved_cart', savedItems);
            api.showNotification('Carrito guardado para más tarde', 'success');
            this.log('✅ Cart saved for later', { itemCount: this.items.length }, 'success');
        } else {
            this.log('⚠️ Attempt to save empty cart for later', {}, 'warn');
        }
    }

    loadSavedCart() {
        this.log('🔄 Loading saved cart', {}, 'info');
        
        try {
            const saved = localStorage.getItem('floresya_saved_cart');
            if (saved) {
                this.items = JSON.parse(saved);
                this.saveCartToStorage();
                this.updateCartDisplay();
                localStorage.removeItem('floresya_saved_cart');
                api.showNotification('Carrito guardado cargado', 'success');
                this.log('✅ Saved cart loaded successfully', { itemCount: this.items.length }, 'success');
            } else {
                this.log('ℹ️ No saved cart found', {}, 'info');
            }
        } catch (error) {
            this.log('❌ Error loading saved cart', { error: error.message }, 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.logger) {
        window.logger.info('CART', '🔄 Initializing ShoppingCart on DOMContentLoaded');
    }
    window.cart = new ShoppingCart();
    
    if (window.logger) {
        window.logger.success('CART', '✅ Global cart instance created');
    } else {
        console.log('[🛒 CART] Global cart instance created');
    }
});