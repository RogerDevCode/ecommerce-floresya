// Product Detail Page JavaScript

class ProductDetail {
    constructor() {
        this.productId = null;
        this.product = null;
        this.currentImageIndex = 0;
        this.images = [];
        this.cart = null;
        this.exchangeRate = 36.5; // Default fallback
        this.init();
    }

    async init() {
        // Get product ID from URL parameters
        this.productId = this.getProductIdFromURL();
        
        if (!this.productId) {
            this.showError('ID de producto no válido');
            return;
        }

        // Initialize cart
        this.cart = new ShoppingCart();
        
        // Wait for cart to initialize and get exchange rate
        await this.cart.init();
        this.exchangeRate = this.cart.exchangeRateBCV || 36.5;

        // Load product data
        await this.loadProduct();
        
        // Update cart display
        this.updateCartCount();
        
        // Listen for cart changes
        this.cart.onChange(() => {
            this.updateCartCount();
            this.updateCartDisplay();
        });
    }

    getProductIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async loadProduct() {
        try {
            const response = await api.getProduct(this.productId);
            
            if (!response.success) {
                throw new Error(response.message || 'Producto no encontrado');
            }

            this.product = response.data;
            this.setupImages();
            this.renderProduct();
            
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Error al cargar el producto: ' + error.message);
        }
    }

    setupImages() {
        this.images = [];
        
        // Add main image (prioritize primary_image)
        if (this.product.primary_image) {
            this.images.push(this.product.primary_image);
        } else if (this.product.image_url) {
            this.images.push(this.product.image_url);
        }
        
        // Add additional images
        if (this.product.additional_images) {
            try {
                const additionalImages = typeof this.product.additional_images === 'string' 
                    ? JSON.parse(this.product.additional_images) 
                    : this.product.additional_images;
                
                if (Array.isArray(additionalImages)) {
                    this.images.push(...additionalImages);
                }
            } catch (error) {
                console.error('Error parsing additional images:', error);
            }
        }
        
        // Fallback image if no images available
        if (this.images.length === 0) {
            this.images.push('/images/placeholder-product.jpg');
        }
    }

    renderProduct() {
        // Hide loading and show content
        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('product-content').style.display = 'block';
        document.getElementById('product-description-section').style.display = 'block';

        // Set page title
        document.title = `${this.product.name} - FloresYa`;
        document.getElementById('page-title').textContent = `${this.product.name} - FloresYa`;

        // Render images
        this.renderImages();

        // Render product info
        this.renderProductInfo();

        // Render description
        this.renderDescription();

        // Update breadcrumb
        this.updateBreadcrumb();
    }

    renderImages() {
        // Set main image with responsive attributes
        const mainImage = document.getElementById('main-image');
        const currentImageUrl = this.images[this.currentImageIndex] || '/images/placeholder-product.jpg';
        
        // Use responsive image utility
        window.responsiveImage.makeResponsive(mainImage, currentImageUrl, 'detail');
        mainImage.alt = this.product.name;

        // Set modal image
        document.getElementById('modal-image-title').textContent = this.product.name;

        // Render thumbnails
        const thumbnailsContainer = document.getElementById('thumbnails');
        thumbnailsContainer.innerHTML = '';

        this.images.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('img');
            
            // Use responsive image utility for thumbnails
            window.responsiveImage.makeResponsive(thumbnail, imageUrl, 'thumbnail');
            thumbnail.alt = `${this.product.name} - Imagen ${index + 1}`;
            thumbnail.className = `thumbnail ${index === this.currentImageIndex ? 'active' : ''}`;
            thumbnail.onclick = () => this.selectImage(index);
            
            thumbnailsContainer.appendChild(thumbnail);
        });
    }

    renderProductInfo() {
        // Product title
        document.getElementById('product-title').textContent = this.product.name;

        // Product summary (use first part of description or name)
        const summary = this.product.description 
            ? this.product.description.substring(0, 200) + '...'
            : `Hermoso arreglo floral ${this.product.name}`;
        document.getElementById('product-summary').textContent = summary;

        // Prices
        const priceUSD = parseFloat(this.product.price);
        const priceVES = priceUSD * this.exchangeRate;
        
        document.getElementById('price-usd').textContent = `$${priceUSD.toFixed(2)}`;
        document.getElementById('price-ves').textContent = `Bs. ${priceVES.toLocaleString('es-VE', {minimumFractionDigits: 2})}`;

        // Stock status
        const stockQuantity = parseInt(this.product.stock_quantity) || 0;
        const stockAvailable = document.getElementById('stock-available');
        const stockUnavailable = document.getElementById('stock-unavailable');
        const quantityInput = document.getElementById('quantity');
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        const buyNowBtn = document.getElementById('buy-now-btn');

        if (stockQuantity > 0) {
            stockAvailable.style.display = 'block';
            stockUnavailable.style.display = 'none';
            document.getElementById('stock-quantity').textContent = stockQuantity;
            
            quantityInput.max = stockQuantity;
            quantityInput.disabled = false;
            addToCartBtn.disabled = false;
            buyNowBtn.disabled = false;
        } else {
            stockAvailable.style.display = 'none';
            stockUnavailable.style.display = 'block';
            
            quantityInput.disabled = true;
            addToCartBtn.disabled = true;
            buyNowBtn.disabled = true;
            addToCartBtn.innerHTML = '<i class="bi bi-x-circle me-2"></i>Agotado';
            buyNowBtn.innerHTML = '<i class="bi bi-x-circle me-2"></i>No Disponible';
        }
    }

    renderDescription() {
        const descriptionContainer = document.getElementById('product-description');
        
        let description = this.product.description || 'No hay descripción disponible para este producto.';
        
        // Convert line breaks to HTML
        description = description.replace(/\n/g, '<br>');
        
        descriptionContainer.innerHTML = description;
    }

    updateBreadcrumb() {
        // Update category breadcrumb if category info is available
        if (this.product.category_name) {
            document.getElementById('category-breadcrumb').textContent = this.product.category_name;
        }
        
        document.getElementById('product-breadcrumb').textContent = this.product.name;
    }

    selectImage(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentImageIndex = index;
            this.renderImages();
        }
    }

    showError(message) {
        document.getElementById('loading-spinner').innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error:</strong> ${message}
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="goBack()">
                        <i class="bi bi-arrow-left me-1"></i>Volver
                    </button>
                </div>
            </div>
        `;
    }

    updateCartCount() {
        const cartCount = this.cart.getItemCount();
        const cartBadge = document.getElementById('cart-count');
        
        if (cartCount > 0) {
            cartBadge.textContent = cartCount;
            cartBadge.style.display = 'block';
        } else {
            cartBadge.style.display = 'none';
        }
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (this.cart.items.length === 0) {
            cartItems.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-bag display-4 d-block mb-2"></i>
                    <p>Tu carrito está vacío</p>
                </div>
            `;
            cartTotal.textContent = '$0.00';
            return;
        }

        cartItems.innerHTML = this.cart.items.map(item => `
            <div class="cart-item d-flex align-items-center mb-3 pb-3 border-bottom">
                <img src="${item.image || '/images/placeholder-product.jpg'}" 
                     alt="${item.name}" 
                     class="cart-item-image me-3"
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${item.name}</h6>
                    <small class="text-muted">$${item.price} × ${item.quantity}</small>
                </div>
                <div class="text-end">
                    <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
                    <button class="btn btn-sm btn-outline-danger ms-2" 
                            onclick="productDetail.removeFromCart(${item.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        const total = this.cart.getTotal();
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    removeFromCart(productId) {
        this.cart.removeItem(productId);
    }
}

// Global functions
function goBack() {
    if (document.referrer && document.referrer.includes(window.location.host)) {
        window.history.back();
    } else {
        window.location.href = '/';
    }
}

function changeQuantity(delta) {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value) || 1;
    const newValue = currentValue + delta;
    const maxValue = parseInt(quantityInput.max) || 99;
    const minValue = parseInt(quantityInput.min) || 1;

    if (newValue >= minValue && newValue <= maxValue) {
        quantityInput.value = newValue;
    }
}

function addToCart() {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    const cartItem = {
        id: productDetail.product.id,
        name: productDetail.product.name,
        price: parseFloat(productDetail.product.price),
        image: productDetail.images[0],
        quantity: quantity
    };

    productDetail.cart.addItem(cartItem);
    
    // Show success feedback
    const btn = document.getElementById('add-to-cart-btn');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="bi bi-check2 me-2"></i>¡Agregado!';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-success');
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-primary');
    }, 2000);
}

function buyNow() {
    addToCart();
    setTimeout(() => {
        window.location.href = '/pages/payment.html';
    }, 500);
}

// FloresYa rapid purchase function
function floresYaBuyNow() {
    if (!productDetail || !productDetail.product) {
        api.showNotification('Error: Producto no cargado', 'danger');
        return;
    }

    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    // Check stock
    if (productDetail.product.stock_quantity < quantity) {
        api.showNotification('Stock insuficiente', 'warning');
        return;
    }

    // Show loading state
    const button = document.getElementById('floresya-btn');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Procesando...';

    try {
        // Check if user is logged in
        const user = api.getUser();
        
        if (!user) {
            // Show quick guest purchase modal
            showFloresYaGuestModal(productDetail.product, quantity);
        } else {
            // Add to cart and redirect
            const cartItem = {
                id: productDetail.product.id,
                name: productDetail.product.name,
                price: parseFloat(productDetail.product.price),
                image: productDetail.images[0],
                quantity: quantity
            };
            
            productDetail.cart.addItem(cartItem);
            showFloresYaAnimation();
            
            // Redirect after animation
            setTimeout(() => {
                window.location.href = '/pages/payment.html?floresya=true';
            }, 1500);
        }
        
    } catch (error) {
        console.error('Error in FloresYa purchase:', error);
        api.showNotification('Error al procesar la compra', 'danger');
    } finally {
        // Reset button after delay (if not redirected)
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalText;
        }, 2000);
    }
}

function showFloresYaGuestModal(product, quantity) {
    const modalHTML = `
        <div class="modal fade" id="floresyaGuestModal" tabindex="-1">
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
                            <img src="${product.primary_image || product.image_url}" alt="${product.name}" 
                                 class="img-fluid rounded" style="max-height: 180px; object-fit: cover;">
                            <h6 class="mt-3">${product.name}</h6>
                            <p class="text-primary-custom fw-bold">
                                ${api.formatCurrency(product.price * quantity)} 
                                <small class="text-muted">(${quantity} unidad${quantity > 1 ? 'es' : ''})</small>
                            </p>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="bi bi-rocket-takeoff"></i>
                            <strong>¡Compra súper rápida!</strong><br>
                            Solo llena los datos y compra en 30 segundos.
                        </div>

                        <form id="floresyaGuestForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Nombre completo *</label>
                                    <input type="text" class="form-control" id="guestNameDetail" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Teléfono *</label>
                                    <input type="tel" class="form-control" id="guestPhoneDetail" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email *</label>
                                <input type="email" class="form-control" id="guestEmailDetail" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Dirección de entrega *</label>
                                <textarea class="form-control" id="guestAddressDetail" rows="2" 
                                         placeholder="Dirección completa con referencias" required></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary-custom btn-lg" onclick="processFloresYaGuest(${quantity})">
                            <i class="bi bi-lightning-fill"></i> ¡FloresYa!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('floresyaGuestModal');
    if (existingModal) existingModal.remove();

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('floresyaGuestModal'));
    modal.show();
}

function processFloresYaGuest(quantity) {
    const form = document.getElementById('floresyaGuestForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const guestData = {
        name: document.getElementById('guestNameDetail').value,
        phone: document.getElementById('guestPhoneDetail').value,
        email: document.getElementById('guestEmailDetail').value,
        address: document.getElementById('guestAddressDetail').value
    };

    // Store guest data in session storage
    sessionStorage.setItem('floresya_guest', JSON.stringify(guestData));
    sessionStorage.setItem('floresya_purchase', JSON.stringify({
        productId: productDetail.product.id,
        quantity,
        timestamp: Date.now()
    }));

    // Add to cart
    const cartItem = {
        id: productDetail.product.id,
        name: productDetail.product.name,
        price: parseFloat(productDetail.product.price),
        image: productDetail.images[0],
        quantity: quantity
    };
    
    productDetail.cart.addItem(cartItem);

    // Show animation
    showFloresYaAnimation();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('floresyaGuestModal'));
    modal.hide();

    // Redirect to payment
    setTimeout(() => {
        window.location.href = '/pages/payment.html?floresya=true&guest=true';
    }, 1500);
}

function showFloresYaAnimation() {
    const animationHTML = `
        <div id="floresya-detail-animation" class="position-fixed top-50 start-50 translate-middle" 
             style="z-index: 9999; text-align: center;">
            <div class="bg-primary-custom text-white p-4 rounded-3 shadow-lg">
                <i class="bi bi-lightning-fill display-1 mb-3 floresya-pulse"></i>
                <h4 class="fw-bold">¡FloresYa!</h4>
                <p class="mb-0">Procesando compra express...</p>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', animationHTML);

    // Remove animation after delay
    setTimeout(() => {
        const animation = document.getElementById('floresya-detail-animation');
        if (animation) animation.remove();
    }, 1500);
}

function toggleCart() {
    const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
    cartOffcanvas.toggle();
}

function openImageModal() {
    const modalImage = document.getElementById('modal-image');
    const currentImageUrl = productDetail.images[productDetail.currentImageIndex];
    
    // Use large/zoom context for modal
    window.responsiveImage.makeResponsive(modalImage, currentImageUrl, 'zoom');
    modalImage.alt = productDetail.product.name;
    
    const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
    imageModal.show();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productDetail = new ProductDetail();
});