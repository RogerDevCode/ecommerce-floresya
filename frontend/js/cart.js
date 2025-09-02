class ShoppingCart {
    constructor() {
        this.items = this.loadCartFromStorage();
        this.shippingFeeUSD = 7.00; // Tarifa de envío fija en USD
        this.exchangeRateBCV = null; // Tasa de cambio Bs/USD
        this.listeners = [];
        this.init();
    }

    async init() {
        await this.fetchExchangeRate();
        this.updateCartDisplay();
        this.bindEvents();
    }

    async fetchExchangeRate() {
        try {
            // Asumimos que la tasa se guarda con la key 'exchange_rate_bcv'
            const response = await api.getSetting('exchange_rate_bcv');
            if (response.success && response.data.setting_value) {
                this.exchangeRateBCV = parseFloat(response.data.setting_value);
                console.log(`Tasa de cambio cargada: ${this.exchangeRateBCV}`);
            } else {
                // Fallback si no se encuentra la tasa
                this.exchangeRateBCV = 36.5; // Tasa de fallback
                console.warn('No se pudo cargar la tasa de cambio. Usando fallback.');
            }
        } catch (error) {
            this.exchangeRateBCV = 36.5; // Tasa de fallback
            console.error('Error fetching exchange rate, using fallback:', error);
        }
    }

    loadCartFromStorage() {
        try {
            const saved = localStorage.getItem('floresya_cart');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            return [];
        }
    }

    saveCartToStorage() {
        localStorage.setItem('floresya_cart', JSON.stringify(this.items));
    }

    onChange(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.items));
    }

    async addItem(productId, quantity = 1) {
        try {
            const response = await api.getProductById(productId);
            if (!response.success) throw new Error('Producto no encontrado');

            const product = response.data.product;
            const existingItem = this.items.find(item => item.product_id === productId);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                this.items.push({ 
                    product_id: productId, 
                    name: product.name, 
                    price: parseFloat(product.price), 
                    quantity, 
                    image_url: product.primary_image || product.image_url 
                });
            }

            this.saveCartToStorage();
            this.updateCartDisplay();
            this.notifyListeners();
            api.showNotification(`${product.name} agregado al carrito`, 'success');
        } catch (error) {
            api.handleError(error);
        }
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.product_id !== productId);
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.notifyListeners();
    }

    updateQuantity(productId, newQuantity) {
        const item = this.items.find(item => item.product_id === productId);
        if (item) {
            if (newQuantity > 0) {
                item.quantity = newQuantity;
            } else {
                this.removeItem(productId);
            }
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.notifyListeners();
        }
    }

    getSubtotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getFinalTotalUSD() {
        const subtotal = this.getSubtotal();
        return subtotal > 0 ? subtotal + this.shippingFeeUSD : 0;
    }

    getFinalTotalBCV() {
        const totalUSD = this.getFinalTotalUSD();
        return this.exchangeRateBCV ? totalUSD * this.exchangeRateBCV : 0;
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    clear() {
        this.items = [];
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.notifyListeners();
    }

    updateCartDisplay() {
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
    }

    updateCartOffcanvas() {
        const cartItemsEl = document.getElementById('cartItems');
        const emptyCartEl = document.getElementById('emptyCart');
        const cartSummaryEl = document.getElementById('cartSummary');
        const cartActionsEl = document.getElementById('cartActions');
        const quickActionsEl = document.getElementById('quickActions');
        const cartSubtotalEl = document.getElementById('cartSubtotal');
        const cartTotalEl = document.getElementById('cartTotal');

        if (!cartItemsEl) return;

        if (this.items.length === 0) {
            // Show empty state
            emptyCartEl?.style.setProperty('display', 'block');
            cartSummaryEl?.style.setProperty('display', 'none');
            cartActionsEl?.style.setProperty('display', 'none');
            quickActionsEl?.style.setProperty('display', 'none');
            cartItemsEl.innerHTML = '';
        } else {
            // Hide empty state, show cart content
            emptyCartEl?.style.setProperty('display', 'none');
            cartSummaryEl?.style.setProperty('display', 'block');
            cartActionsEl?.style.setProperty('display', 'block');
            quickActionsEl?.style.setProperty('display', 'block');

            // Render cart items with enhanced design
            cartItemsEl.innerHTML = this.items.map(item => `
                <div class="cart-item d-flex align-items-center p-3 mb-2 bg-white rounded shadow-sm">
                    <img src="${item.image_url || '/images/placeholder.jpg'}" alt="${item.name}" 
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
        }
    }

    updateGuestBanner() {
        const guestBanner = document.getElementById('guestBanner');
        const user = auth?.getUser();
        
        if (guestBanner) {
            if (!user && this.items.length > 0) {
                guestBanner.style.display = 'block';
            } else {
                guestBanner.style.display = 'none';
            }
        }
    }

    bindEvents() {
        // Cart toggle (already handled by Bootstrap data attributes in HTML)
        
        // FloresYa Express Checkout
        document.getElementById('floresyaCheckoutBtn')?.addEventListener('click', () => {
            if (this.items.length > 0) {
                this.handleFloresYaCheckout();
            }
        });

        // Regular Checkout
        document.getElementById('regularCheckoutBtn')?.addEventListener('click', () => {
            if (this.items.length > 0) {
                window.location.href = '/pages/payment.html';
            }
        });
    }

    async handleFloresYaCheckout() {
        const user = auth?.getUser();
        
        if (!user) {
            // Guest user - show quick checkout modal
            this.showGuestFloresYaModal();
        } else {
            // Logged in user - direct to payment
            window.location.href = '/pages/payment.html?floresya=true';
        }
    }

    showGuestFloresYaModal() {
        const totalItems = this.getItemCount();
        const totalPrice = this.getFinalTotalUSD();
        
        const modalHTML = `
            <div class="modal fade" id="cartFloresYaModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-gradient-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-lightning-fill"></i> ¡FloresYa! Express
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
                                <i class="bi bi-lightning-fill"></i> ¡FloresYa!
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('cartFloresYaModal');
        if (existingModal) existingModal.remove();

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('cartFloresYaModal'));
        modal.show();

        // Close cart offcanvas
        const cartOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
        if (cartOffcanvas) cartOffcanvas.hide();
    }

    processCartFloresYa() {
        const form = document.getElementById('cartGuestForm');
        if (!form.checkValidity()) {
            form.reportValidity();
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

        // Show success animation
        this.showFloresYaAnimation();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('cartFloresYaModal'));
        modal.hide();

        // Redirect to payment
        setTimeout(() => {
            window.location.href = '/pages/payment.html?floresya=true&guest=true';
        }, 1500);
    }

    showFloresYaAnimation() {
        const animationHTML = `
            <div id="cart-floresya-animation" class="position-fixed top-50 start-50 translate-middle" 
                 style="z-index: 9999; text-align: center;">
                <div class="bg-primary-custom text-white p-4 rounded-3 shadow-lg">
                    <i class="bi bi-lightning-fill display-1 mb-3 floresya-pulse"></i>
                    <h4 class="fw-bold">¡FloresYa!</h4>
                    <p class="mb-0">Procesando tu pedido...</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', animationHTML);

        setTimeout(() => {
            const animation = document.getElementById('cart-floresya-animation');
            if (animation) animation.remove();
        }, 1500);
    }

    // Additional cart utility functions
    clearCart() {
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            this.items = [];
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.notifyListeners();
            api.showNotification('Carrito vaciado', 'info');
        }
    }

    saveForLater() {
        if (this.items.length > 0) {
            const savedItems = JSON.stringify(this.items);
            localStorage.setItem('floresya_saved_cart', savedItems);
            api.showNotification('Carrito guardado para más tarde', 'success');
        }
    }

    loadSavedCart() {
        try {
            const saved = localStorage.getItem('floresya_saved_cart');
            if (saved) {
                this.items = JSON.parse(saved);
                this.saveCartToStorage();
                this.updateCartDisplay();
                localStorage.removeItem('floresya_saved_cart');
                api.showNotification('Carrito guardado cargado', 'success');
            }
        } catch (error) {
            console.error('Error loading saved cart:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
});
