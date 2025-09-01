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
                    image_url: product.image_url 
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
        if (cartCount) {
            const count = this.getItemCount();
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'inline-block' : 'none';
        }
        this.updateCartOffcanvas();
    }

    updateCartOffcanvas() {
        const cartItemsEl = document.getElementById('cartItems');
        const cartTotalEl = document.getElementById('cartTotal');
        if (!cartItemsEl || !cartTotalEl) return;

        if (this.items.length === 0) {
            cartItemsEl.innerHTML = `<div class="text-center p-4"><p>Tu carrito está vacío.</p></div>`;
            cartTotalEl.innerHTML = '';
        } else {
            cartItemsEl.innerHTML = this.items.map(item => `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <img src="${item.image_url}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover;" class="rounded">
                    <div class="mx-2 flex-grow-1">
                        <div>${item.name}</div>
                        <small>${item.quantity} x ${api.formatCurrency(item.price)}</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-danger" onclick="cart.removeItem(${item.product_id})">X</button>
                    </div>
                </div>
            `).join('');

            const subtotal = this.getSubtotal();
            const totalUSD = this.getFinalTotalUSD();
            const totalBCV = this.getFinalTotalBCV();

            cartTotalEl.innerHTML = `
                <div class="d-flex justify-content-between">
                    <span>Subtotal:</span>
                    <span>${api.formatCurrency(subtotal)}</span>
                </div>
                <div class="d-flex justify-content-between">
                    <span>Envío:</span>
                    <span>${api.formatCurrency(this.shippingFeeUSD)}</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between fw-bold">
                    <span>Total (USD):</span>
                    <span>${api.formatCurrency(totalUSD)}</span>
                </div>
                <div class="d-flex justify-content-between text-muted">
                    <span>Total (VES):</span>
                    <span>Bs. ${totalBCV.toFixed(2)}</span>
                </div>
            `;
        }
    }

    bindEvents() {
        document.getElementById('cartToggle')?.addEventListener('click', (e) => {
            e.preventDefault();
            const offcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
            offcanvas.show();
        });

        document.getElementById('checkoutBtn')?.addEventListener('click', () => {
            if (this.items.length > 0) {
                window.location.href = '/pages/payment.html';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
});
