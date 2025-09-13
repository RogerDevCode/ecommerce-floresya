/**
 * 🌸 FloresYa Shopping Cart Service
 * Professional TypeScript e-commerce cart with express checkout and currency conversion
 */

import type { Product, ApiResponse } from '@shared/types/api.js';
import type { Logger, CartState } from '@shared/types/frontend.js';

interface CartItem {
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
}

interface GuestData {
    name: string;
    phone: string;
    email: string;
    address: string;
}

interface CartListener {
    (items: CartItem[]): void;
}

// Global window interface for cart service
declare global {
    interface Window {
        cart?: ShoppingCart;
        logger?: Logger;
        api?: any;
        bootstrap?: any;
    }
}

class ShoppingCart {
    private items: CartItem[] = [];
    private shippingFeeUSD: number = 7.00;
    private exchangeRateBCV: number | null = null;
    private listeners: CartListener[] = [];

    constructor() {
        this.items = this.loadCartFromStorage();
        
        // Initialize with logging
        if (window.logger) {
            window.logger.info('CART', '✅ ShoppingCart initialized');
        } else {
            console.log('[🛒 CART] ShoppingCart initialized');
        }
        
        this.init();
    }

    private log(message: string, data: any = null, level: keyof Logger = 'info'): void {
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

    private async init(): Promise<void> {
        this.log('🔄 Initializing ShoppingCart', {}, 'info');
        
        try {
            await this.fetchExchangeRate();
            this.updateCartDisplay();
            this.bindEvents();
            this.log('✅ ShoppingCart initialized successfully', {}, 'info');
        } catch (error) {
            this.log('❌ Error initializing ShoppingCart', { 
                error: error instanceof Error ? error.message : String(error) 
            }, 'error');
        }
    }

    private async fetchExchangeRate(): Promise<void> {
        this.log('🔄 Fetching exchange rate', {}, 'info');
        
        try {
            // Assume the rate is saved with key 'exchange_rate_bcv'
            const response: ApiResponse<{ setting_value: string }> = await window.api.getSetting('exchange_rate_bcv');
            if (response.success && response.data?.setting_value) {
                this.exchangeRateBCV = parseFloat(response.data.setting_value);
                this.log('✅ Exchange rate loaded successfully', { rate: this.exchangeRateBCV }, 'info');
            } else {
                // Fallback if rate not found
                this.exchangeRateBCV = 36.5; // Fallback rate
                this.log('⚠️ Exchange rate not found, using fallback', { rate: this.exchangeRateBCV }, 'warn');
            }
        } catch (error) {
            this.exchangeRateBCV = 36.5; // Fallback rate
            this.log('❌ Error fetching exchange rate, using fallback', { 
                error: error instanceof Error ? error.message : String(error) 
            }, 'error');
        }
    }

    private loadCartFromStorage(): CartItem[] {
        this.log('🔄 Loading cart from storage', {}, 'info');
        
        try {
            const saved = localStorage.getItem('floresya_cart');
            const items: CartItem[] = saved ? JSON.parse(saved) : [];
            this.log('✅ Cart loaded from storage', { itemCount: items.length }, 'info');
            return items;
        } catch (error) {
            this.log('❌ Error loading cart from storage', { 
                error: error instanceof Error ? error.message : String(error) 
            }, 'error');
            return [];
        }
    }

    private saveCartToStorage(): void {
        this.log('🔄 Saving cart to storage', { itemCount: this.items.length }, 'info');
        
        try {
            localStorage.setItem('floresya_cart', JSON.stringify(this.items));
            this.log('✅ Cart saved to storage', { itemCount: this.items.length }, 'info');
        } catch (error) {
            this.log('❌ Error saving cart to storage', { 
                error: error instanceof Error ? error.message : String(error) 
            }, 'error');
        }
    }

    public onChange(callback: CartListener): void {
        this.log('🔄 Adding change listener', {}, 'info');
        this.listeners.push(callback);
        this.log('✅ Change listener added', { listenerCount: this.listeners.length }, 'info');
    }

    private notifyListeners(): void {
        this.log('🔄 Notifying listeners', { listenerCount: this.listeners.length }, 'info');
        this.listeners.forEach(callback => callback(this.items));
        this.log('✅ Listeners notified', {}, 'info');
    }

    public async addItem(productId: number, quantity: number = 1): Promise<void> {
        this.log('🔄 Adding item to cart', { productId, quantity }, 'info');
        
        try {
            const response: ApiResponse<Product> = await window.api.getProductById(productId);
            if (!response.success || !response.data) throw new Error('Producto no encontrado');

            const product = response.data;
            const existingItem = this.items.find(item => item.product_id === productId);

            if (existingItem) {
                existingItem.quantity += quantity;
                this.log('✅ Item quantity updated', { 
                    productId, 
                    name: product.name, 
                    quantity: existingItem.quantity 
                }, 'info');
            } else {
                this.items.push({ 
                    product_id: productId, 
                    name: product.name, 
                    price: parseFloat(String(product.price_usd)), 
                    quantity, 
                    image_url: product.image_url 
                });
                this.log('✅ New item added to cart', { 
                    productId, 
                    name: product.name, 
                    quantity 
                }, 'info');
            }

            this.saveCartToStorage();
            this.updateCartDisplay();
            this.notifyListeners();
            window.api?.showNotification(`${product.name} agregado al carrito`, 'success');
            this.log('✅ Item added to cart successfully', { 
                productId, 
                name: product.name, 
                quantity 
            }, 'info');
        } catch (error) {
            this.log('❌ Error adding item to cart', { 
                error: error instanceof Error ? error.message : String(error), 
                productId 
            }, 'error');
            window.api?.handleError(error);
        }
    }

    public removeItem(productId: number): void {
        this.log('🔄 Removing item from cart', { productId }, 'info');
        
        const originalLength = this.items.length;
        this.items = this.items.filter(item => item.product_id !== productId);
        const removed = originalLength - this.items.length;
        
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.notifyListeners();
        
        if (removed > 0) {
            this.log('✅ Item removed from cart', { productId, removed }, 'info');
        } else {
            this.log('⚠️ Item not found in cart', { productId }, 'warn');
        }
    }

    public updateQuantity(productId: number, newQuantity: number): void {
        this.log('🔄 Updating item quantity', { productId, newQuantity }, 'info');
        
        const item = this.items.find(item => item.product_id === productId);
        if (item) {
            if (newQuantity > 0) {
                item.quantity = newQuantity;
                this.log('✅ Item quantity updated', { productId, newQuantity }, 'info');
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

    public getSubtotal(): number {
        const subtotal = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        this.log('📊 Calculating subtotal', { subtotal, itemCount: this.items.length }, 'info');
        return subtotal;
    }

    public getFinalTotalUSD(): number {
        const subtotal = this.getSubtotal();
        const totalUSD = subtotal > 0 ? subtotal + this.shippingFeeUSD : 0;
        this.log('📊 Calculating final total USD', { subtotal, shippingFee: this.shippingFeeUSD, totalUSD }, 'info');
        return totalUSD;
    }

    public getFinalTotalBCV(): number {
        const totalUSD = this.getFinalTotalUSD();
        const totalBCV = this.exchangeRateBCV ? totalUSD * this.exchangeRateBCV : 0;
        this.log('📊 Calculating final total BCV', { totalUSD, exchangeRate: this.exchangeRateBCV, totalBCV }, 'info');
        return totalBCV;
    }

    public getItemCount(): number {
        const count = this.items.reduce((count, item) => count + item.quantity, 0);
        this.log('📊 Getting item count', { count }, 'info');
        return count;
    }

    public clear(): void {
        this.log('🔄 Clearing cart', { itemCount: this.items.length }, 'info');
        
        this.items = [];
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.notifyListeners();
        this.log('✅ Cart cleared successfully', {}, 'info');
    }

    private updateCartDisplay(): void {
        this.log('🔄 Updating cart display', { itemCount: this.getItemCount() }, 'info');
        
        const cartCount = document.getElementById('cartCount') as HTMLElement;
        const cartPulse = document.getElementById('cartPulse') as HTMLElement;
        const cartIcon = document.querySelector('.cart-icon') as HTMLElement;
        
        if (cartCount) {
            const count = this.getItemCount();
            cartCount.textContent = String(count);
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
        this.log('✅ Cart display updated successfully', {}, 'info');
    }

    private updateCartOffcanvas(): void {
        this.log('🔄 Updating cart offcanvas', { itemCount: this.items.length }, 'info');
        
        const cartItemsEl = document.getElementById('cartItems') as HTMLElement;
        const emptyCartEl = document.getElementById('emptyCart') as HTMLElement;
        const cartSummaryEl = document.getElementById('cartSummary') as HTMLElement;
        const cartActionsEl = document.getElementById('cartActions') as HTMLElement;
        const quickActionsEl = document.getElementById('quickActions') as HTMLElement;
        const cartSubtotalEl = document.getElementById('cartSubtotal') as HTMLElement;
        const cartTotalEl = document.getElementById('cartTotal') as HTMLElement;

        if (!cartItemsEl) {
            this.log('⚠️ Cart items element not found', {}, 'warn');
            return;
        }

        if (this.items.length === 0) {
            // Show empty state
            if (emptyCartEl) emptyCartEl.style.setProperty('display', 'block');
            if (cartSummaryEl) cartSummaryEl.style.setProperty('display', 'none');
            if (cartActionsEl) cartActionsEl.style.setProperty('display', 'none');
            if (quickActionsEl) quickActionsEl.style.setProperty('display', 'none');
            cartItemsEl.innerHTML = '';
            this.log('✅ Cart offcanvas updated - empty state', {}, 'info');
        } else {
            // Hide empty state, show cart content
            if (emptyCartEl) emptyCartEl.style.setProperty('display', 'none');
            if (cartSummaryEl) cartSummaryEl.style.setProperty('display', 'block');
            if (cartActionsEl) cartActionsEl.style.setProperty('display', 'block');
            if (quickActionsEl) quickActionsEl.style.setProperty('display', 'block');

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
                                        onclick="window.cart?.updateQuantity(${item.product_id}, ${item.quantity - 1})">
                                    <i class="bi bi-dash"></i>
                                </button>
                                <span class="mx-2 fw-bold">${item.quantity}</span>
                                <button class="btn btn-sm btn-outline-secondary" 
                                        onclick="window.cart?.updateQuantity(${item.product_id}, ${item.quantity + 1})">
                                    <i class="bi bi-plus"></i>
                                </button>
                            </div>
                            <span class="text-muted small">${window.api?.formatCurrency(item.price) || `$${item.price.toFixed(2)}`} c/u</span>
                        </div>
                    </div>
                    <div class="cart-item-actions text-end">
                        <div class="fw-bold text-primary-custom">${window.api?.formatCurrency(item.price * item.quantity) || `$${(item.price * item.quantity).toFixed(2)}`}</div>
                        <button class="btn btn-sm btn-outline-danger mt-1" 
                                onclick="window.cart?.removeItem(${item.product_id})" 
                                title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            // Update totals
            const subtotal = this.getSubtotal();
            const totalUSD = this.getFinalTotalUSD();

            if (cartSubtotalEl) cartSubtotalEl.textContent = window.api?.formatCurrency(subtotal) || `$${subtotal.toFixed(2)}`;
            if (cartTotalEl) cartTotalEl.textContent = window.api?.formatCurrency(totalUSD) || `$${totalUSD.toFixed(2)}`;
            this.log('✅ Cart offcanvas updated - items displayed', { itemCount: this.items.length }, 'info');
        }
    }

    private updateGuestBanner(): void {
        this.log('🔄 Updating guest banner', {}, 'info');
        
        const guestBanner = document.getElementById('guestBanner') as HTMLElement;
        const user = window.api?.getUser();
        
        if (guestBanner) {
            if (!user && this.items.length > 0) {
                guestBanner.style.display = 'block';
                this.log('✅ Guest banner shown', {}, 'info');
            } else {
                guestBanner.style.display = 'none';
                this.log('✅ Guest banner hidden', {}, 'info');
            }
        }
    }

    private bindEvents(): void {
        this.log('🔄 Binding cart events', {}, 'info');
        
        // Cart toggle (already handled by Bootstrap data attributes in HTML)
        
        // FloresYa Express Checkout
        const floresyaCheckoutBtn = document.getElementById('floresyaCheckoutBtn');
        floresyaCheckoutBtn?.addEventListener('click', () => {
            if (this.items.length > 0) {
                this.log('✅ FloresYa Express checkout initiated', {}, 'info');
                this.handleFloresYaCheckout();
            } else {
                this.log('⚠️ FloresYa Express checkout attempted with empty cart', {}, 'warn');
            }
        });

        // Regular Checkout
        const regularCheckoutBtn = document.getElementById('regularCheckoutBtn');
        regularCheckoutBtn?.addEventListener('click', () => {
            if (this.items.length > 0) {
                this.log('✅ Regular checkout initiated', {}, 'info');
                window.location.href = '/pages/payment.html';
            } else {
                this.log('⚠️ Regular checkout attempted with empty cart', {}, 'warn');
            }
        });
        
        this.log('✅ Cart events bound successfully', {}, 'info');
    }

    private async handleFloresYaCheckout(): Promise<void> {
        this.log('🔄 Handling FloresYa checkout', {}, 'info');
        
        const user = window.api?.getUser();
        
        if (!user) {
            // Guest user - show quick checkout modal
            this.log('✅ Guest user detected, showing FloresYa modal', {}, 'info');
            this.showGuestFloresYaModal();
        } else {
            // Logged in user - direct to payment
            this.log('✅ Logged in user detected, redirecting to payment', {}, 'info');
            window.location.href = '/pages/payment.html?floresya=true';
        }
    }

    private showGuestFloresYaModal(): void {
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
                                <p class="text-primary-custom fw-bold fs-5">${window.api?.formatCurrency(totalPrice) || `$${totalPrice.toFixed(2)}`}</p>
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
                            <button type="button" class="btn btn-primary-custom btn-lg" onclick="window.cart?.processCartFloresYa()">
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
            this.log('✅ Existing FloresYa modal removed', {}, 'info');
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.log('✅ FloresYa modal added to DOM', {}, 'info');

        // Show modal
        if (window.bootstrap) {
            const modal = new window.bootstrap.Modal(document.getElementById('cartFloresYaModal'));
            modal.show();
            this.log('✅ FloresYa modal shown', {}, 'info');

            // Close cart offcanvas
            const cartOffcanvasEl = document.getElementById('cartOffcanvas');
            if (cartOffcanvasEl) {
                const cartOffcanvas = window.bootstrap.Offcanvas.getInstance(cartOffcanvasEl);
                if (cartOffcanvas) {
                    cartOffcanvas.hide();
                    this.log('✅ Cart offcanvas hidden', {}, 'info');
                }
            }
        }
    }

    public processCartFloresYa(): void {
        this.log('🔄 Processing FloresYa checkout', {}, 'info');
        
        const form = document.getElementById('cartGuestForm') as HTMLFormElement;
        if (!form || !form.checkValidity()) {
            form?.reportValidity();
            this.log('⚠️ FloresYa checkout form invalid', {}, 'warn');
            return;
        }

        const guestData: GuestData = {
            name: (document.getElementById('cartGuestName') as HTMLInputElement)?.value || '',
            phone: (document.getElementById('cartGuestPhone') as HTMLInputElement)?.value || '',
            email: (document.getElementById('cartGuestEmail') as HTMLInputElement)?.value || '',
            address: (document.getElementById('cartGuestAddress') as HTMLTextAreaElement)?.value || ''
        };

        // Store guest data
        sessionStorage.setItem('floresya_guest', JSON.stringify(guestData));
        this.log('✅ Guest data stored in sessionStorage', { guestData }, 'info');

        // Show success animation
        this.showFloresYaAnimation();

        // Close modal
        if (window.bootstrap) {
            const modalEl = document.getElementById('cartFloresYaModal');
            if (modalEl) {
                const modal = window.bootstrap.Modal.getInstance(modalEl);
                if (modal) {
                    modal.hide();
                    this.log('✅ FloresYa modal hidden', {}, 'info');
                }
            }
        }

        // Redirect to payment
        setTimeout(() => {
            window.location.href = '/pages/payment.html?floresya=true&guest=true';
            this.log('✅ Redirecting to payment page', {}, 'info');
        }, 1500);
    }

    private showFloresYaAnimation(): void {
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
        this.log('✅ FloresYa animation added to DOM', {}, 'info');

        setTimeout(() => {
            const animation = document.getElementById('cart-floresya-animation');
            if (animation) {
                animation.remove();
                this.log('✅ FloresYa animation removed', {}, 'info');
            }
        }, 1500);
    }

    // Additional cart utility functions
    public clearCart(): void {
        this.log('🔄 Clearing cart - user confirmation requested', {}, 'info');
        
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            this.items = [];
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.notifyListeners();
            window.api?.showNotification('Carrito vaciado', 'info');
            this.log('✅ Cart cleared by user confirmation', {}, 'info');
        } else {
            this.log('ℹ️ Cart clear canceled by user', {}, 'info');
        }
    }

    public saveForLater(): void {
        this.log('🔄 Saving cart for later', { itemCount: this.items.length }, 'info');
        
        if (this.items.length > 0) {
            const savedItems = JSON.stringify(this.items);
            localStorage.setItem('floresya_saved_cart', savedItems);
            window.api?.showNotification('Carrito guardado para más tarde', 'success');
            this.log('✅ Cart saved for later', { itemCount: this.items.length }, 'info');
        } else {
            this.log('⚠️ Attempt to save empty cart for later', {}, 'warn');
        }
    }

    public loadSavedCart(): void {
        this.log('🔄 Loading saved cart', {}, 'info');
        
        try {
            const saved = localStorage.getItem('floresya_saved_cart');
            if (saved) {
                this.items = JSON.parse(saved);
                this.saveCartToStorage();
                this.updateCartDisplay();
                this.notifyListeners();
                localStorage.removeItem('floresya_saved_cart');
                window.api?.showNotification('Carrito guardado cargado', 'success');
                this.log('✅ Saved cart loaded successfully', { itemCount: this.items.length }, 'info');
            } else {
                this.log('ℹ️ No saved cart found', {}, 'info');
            }
        } catch (error) {
            this.log('❌ Error loading saved cart', { 
                error: error instanceof Error ? error.message : String(error) 
            }, 'error');
        }
    }

    // Public getters for external access
    public getItems(): CartItem[] {
        return [...this.items];
    }

    public getState(): CartState {
        return {
            items: this.items.map(item => ({
                productId: item.product_id,
                quantity: item.quantity,
                price: item.price
            })),
            total: this.getFinalTotalUSD(),
            itemCount: this.getItemCount()
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.logger) {
        window.logger.info('CART', '🔄 Initializing ShoppingCart on DOMContentLoaded');
    }
    window.cart = new ShoppingCart();
    
    if (window.logger) {
        window.logger.info('CART', '✅ Global cart instance created');
    } else {
        console.log('[🛒 CART] Global cart instance created');
    }
});

// Export for module systems
export default ShoppingCart;
export { ShoppingCart };
export type { CartItem, GuestData, CartListener };