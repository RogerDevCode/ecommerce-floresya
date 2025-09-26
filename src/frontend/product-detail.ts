/**
 * Product Detail Page Manager
 * Handles product detail page functionality including navigation, cart operations, and UI management
 */

import { FloresYaAPI } from './services/apiClient.js';
import type { ProductWithImagesAndOccasions, Product, CartItem, ProductImage } from "shared/types/index";


type ProductWithImagesAndOccasion = ProductWithImagesAndOccasions;


class ProductDetailManager {
  private product: ProductWithImagesAndOccasion | null = null;
  private allProducts: ProductWithImagesAndOccasion[] = [];
  private currentProductIndex = 0;
  private cart: CartItem[] = [];
  private currentImageIndex = 0;
  private api: FloresYaAPI;
  private quantity = 1;
  private isLoggedIn = false;
  private previousLocation = '';
  private floatingHubExpanded = false;

  constructor() {
    this.api = new FloresYaAPI();
    this.initializeCart();
    this.checkAuthStatus();
    this.savePreviousLocation();
  }

  async init(): Promise<void> {
    try {
            // Get product ID from URL
      let productId = this.getProductIdFromURL();

      if (!productId) {
                // For testing purposes, use product ID 1 if no ID is provided
        productId = 1;
              }

            // Load all products to enable navigation
      await this.loadAllProducts();

      // Load specific product
      await this.loadProduct(productId);

      // Setup UI and events
      this.setupUI();
      this.bindEvents();
      this.bindKeyboardShortcuts();
      this.updateCartUI();
      this.initializeFloatingHub();
      this.setupDetailToggles();

          } catch (error) {
            this.showError('Error al cargar el producto. Verifique la conexión y vuelva a intentar.');
    }
  }

  public getProductIdFromURL(): number | null {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const productId = idParam ? parseInt(idParam, 10) : null;

    if (!productId || isNaN(productId)) {
            return null;
    }

    return productId;
  }

  private async loadAllProducts(): Promise<void> {
    try {
      // Load products in batches since API limits to 100 per request
      const allProducts: ProductWithImagesAndOccasion[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.api.getProducts({ page, limit: 100 });

        if (response.success && response.data?.products) {
          const batchProducts = response.data.products.map((p: Product) => {
            const productWithImages = p as Product & { images?: Array<{ id: number; url: string; alt_text?: string; display_order?: number; }> };
            return {
              ...p,
              images: (productWithImages.images ?? []).map((img: { id: number; url: string; alt_text?: string; display_order?: number; }) => ({
                id: img.id,
                product_id: p.id,
                url: img.url,
                size: 'medium' as const,
                is_primary: img.display_order === 1,
                created_at: new Date().toISOString(),
                file_hash: img.alt_text || "", // Use alt_text as file_hash if available
                image_index: img.display_order || 0, // Use display_order as image_index
                mime_type: "image/jpeg", // Set default mime_type
                updated_at: new Date().toISOString() // Set updated_at
              })),
              price: p.price_usd, // Add the price alias for compatibility
              occasion: undefined // Will be populated if needed
            } as ProductWithImagesAndOccasion;
          });

          allProducts.push(...batchProducts);

          // Check if there are more pages
          const pagination = response.data.pagination;
          if (pagination && pagination.current_page < pagination.total_pages) {
            page++;
          } else {
            hasMore = false;
          }
        } else {
          throw new Error(response.message ?? 'Failed to load products');
        }
      }

      // Apply same sorting as main page: group by occasion, then alphabetical
      this.allProducts = this.sortProductsByOccasionAndName(allProducts);

      // All products loaded via pagination
    } catch (error) {
          }
  }

  private sortProductsByOccasionAndName(products: ProductWithImagesAndOccasion[]): ProductWithImagesAndOccasion[] {
    const grouped = new Map<string, ProductWithImagesAndOccasion[]>();

    // Group by occasion
    products.forEach(product => {
      const occasionName = product.occasion?.name ?? 'Sin ocasión';
      if (!grouped.has(occasionName)) {
        grouped.set(occasionName, []);
      }
      const group = grouped.get(occasionName);
      if (group) {
        group.push(product);
      }
    });

    // Sort each group alphabetically by name
    grouped.forEach((groupProducts) => {
      groupProducts.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    });

    // Sort occasion groups alphabetically and flatten
    const sortedOccasions = Array.from(grouped.keys()).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );

    const result: ProductWithImagesAndOccasion[] = [];
    sortedOccasions.forEach(occasionName => {
      const group = grouped.get(occasionName);
      if (group) {
        result.push(...group);
      }
    });

    return result;
  }

  private async loadProduct(productId: number): Promise<void> {
    try {
      if (this.api && typeof this.api.getProductById === 'function') {
        const response = await this.api.getProductById(productId);

        if (response.success && response.data) {
          // The API returns data wrapped in { product: ... }
          const productData = response.data as unknown as (Product & { images?: Array<{ id: number; url: string; alt_text?: string; display_order?: number; }> });
          if (!productData) {
            throw new Error('Product data not found in response');
          }

          this.product = {
            ...productData,
            images: (productData.images ?? []).map((img: { id: number; url: string; alt_text?: string; display_order?: number; }) => ({
              id: img.id,
              product_id: productData.id,
              url: img.url,
              size: 'medium',
              is_primary: img.display_order === 1,
              created_at: new Date().toISOString(),
              file_hash: "", // Placeholder for missing field
              image_index: img.display_order || 0, // Use display_order as image_index
              mime_type: "image/jpeg", // Default mime_type
              updated_at: new Date().toISOString() // Default updated_at
            })),
            occasion: undefined // Will be populated if needed
          };

          // Find current product index in the sorted array
          this.currentProductIndex = this.allProducts.findIndex(p => p.id === productId);
          if (this.currentProductIndex === -1) {
            this.currentProductIndex = 0;
          }

                    return;
        }
      }

      // If API fails or returns no data, show error
      this.showError('Error al cargar el producto. El servicio no está disponible.');

    } catch (error) {
      this.showError('Error al cargar el producto. Por favor, inténtelo de nuevo.');
    }
  }

  private showProductNotFoundError(productId: number): void {
    // Show product not found error
    this.showError(`Producto con ID ${productId} no encontrado.`);
  }

  private setupUI(): void {
    if (!this.product) {
            return;
    }

    try {
      // Update page title
      document.title = `${this.product.name} - FloresYa`;

      // Update all UI elements
      this.updateBreadcrumb();
      this.updateProductInfo();
      this.updateProductImages();
      this.updateNavigationCounter();
      this.updateQuickPreview();
      this.updateLoginButton();

      // Show content with animation
      this.showProductContent();

    } catch (error) {
          }
  }

  private updateBreadcrumb(): void {
    if (!this.product) {return;}

    const productBreadcrumb = document.getElementById('product-breadcrumb');
    const categoryBreadcrumb = document.getElementById('category-breadcrumb');

    if (productBreadcrumb) {
      productBreadcrumb.textContent = this.product.name;
    }

    if (categoryBreadcrumb && this.product.occasion) {
      categoryBreadcrumb.textContent = this.product.occasion.name;
      categoryBreadcrumb.setAttribute('href', `/#productos?occasion=${this.product.occasion.slug}`);
    }
  }

  private updateProductInfo(): void {
    if (!this.product) {return;}

    // Product name
    const nameElement = document.getElementById('product-name');
    if (nameElement) {nameElement.textContent = this.product.name;}

    // Product price
    const priceElement = document.getElementById('product-price');
    if (priceElement) {
      const formattedPrice = new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'USD'
      }).format(this.product.price_usd);
      priceElement.textContent = formattedPrice;
    }

    // Product description
    const descriptionElement = document.getElementById('product-description');
    if (descriptionElement) {
      descriptionElement.textContent = this.product.description ?? 'Hermoso arreglo floral perfecto para cualquier ocasión especial.';
    }

    // Product occasion
    const occasionElement = document.getElementById('product-occasion');
    if (occasionElement && this.product.occasion) {
      occasionElement.textContent = this.product.occasion.name;
    }
  }

  private updateProductImages(): void {
    if (!this.product) {return;}

    const mainImage = document.getElementById('main-image');
    if (!(mainImage instanceof HTMLImageElement)) return;
    const thumbnailContainer = document.getElementById('image-thumbnails');
    const imageCounter = document.getElementById('current-image');
    const totalImages = document.getElementById('total-images');

    const images = this.product.images ?? [];
    const hasImages = images.length > 0;

    if (mainImage) {
      if (hasImages) {
        const primaryImage = images[0];
        if (primaryImage) {
          mainImage.src = primaryImage.url;
          mainImage.alt = this.product.name;
        }
      } else {
        mainImage.src = '/images/placeholder-product-2.webp';
        mainImage.alt = this.product.name;
      }
    }

    // Update image counter
    if (imageCounter) {imageCounter.textContent = '1';}
    if (totalImages) {totalImages.textContent = Math.max(1, images.length).toString();}

    // Update thumbnails
    if (thumbnailContainer) {
      if (hasImages && images.length > 1) {
        thumbnailContainer.innerHTML = images.map((image: ProductImage, index: number) => `
          <div class="thumbnail-wrapper ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${image.url}" alt="${this.product ? this.product.name : 'Product image'}"
                 class="img-fluid rounded cursor-pointer thumbnail-image"
                 style="width: 80px; height: 80px; object-fit: cover;">
          </div>
        `).join('');

        // Bind thumbnail click events
        this.bindThumbnailEvents();
      } else {
        thumbnailContainer.innerHTML = '';
      }
    }
  }

  private updateNavigationCounter(): void {
    const counter = document.getElementById('product-counter');
    if (counter) {
      const current = this.currentProductIndex + 1;
      const total = this.allProducts.length;
      counter.textContent = `${current}/${total}`;
    }
  }

  private bindEvents(): void {
    // Navigation buttons
    const prevBtn = document.getElementById('prev-product-btn');
    const nextBtn = document.getElementById('next-product-btn');
    const backBtn = document.getElementById('back-btn');
    const homeBtn = document.getElementById('home-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => this.navigateToPrevious());
    if (nextBtn) nextBtn.addEventListener('click', () => this.navigateToNext());
    if (backBtn) backBtn.addEventListener('click', () => this.goBack());
    if (homeBtn) homeBtn.addEventListener('click', () => window.location.href = '/');

    // Cart and purchase buttons
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    const cartToggle = document.getElementById('cart-toggle');

    if (addToCartBtn) addToCartBtn.addEventListener('click', () => void this.addToCart());
    if (buyNowBtn) buyNowBtn.addEventListener('click', () => this.buyNow());
    if (cartToggle) cartToggle.addEventListener('click', () => this.toggleCartPanel());

    // Quantity controls
    const quantityIncrease = document.getElementById('quantity-increase');
    const quantityDecrease = document.getElementById('quantity-decrease');

    if (quantityIncrease) quantityIncrease.addEventListener('click', () => this.increaseQuantity());
    if (quantityDecrease) quantityDecrease.addEventListener('click', () => this.decreaseQuantity());

    // Image controls
    const mainImage = document.getElementById('main-image');
    const zoomBtn = document.getElementById('zoom-btn');
    const imagePrevBtn = document.getElementById('image-prev-btn');
    const imageNextBtn = document.getElementById('image-next-btn');

    if (mainImage) mainImage.addEventListener('click', () => this.zoomImage());
    if (zoomBtn) zoomBtn.addEventListener('click', () => this.zoomImage());
    if (imagePrevBtn) imagePrevBtn.addEventListener('click', () => this.previousImage());
    if (imageNextBtn) imageNextBtn.addEventListener('click', () => this.nextImage());

    // Hub controls
    const hubToggle = document.getElementById('hub-toggle');
    const hubHome = document.getElementById('hub-home');
    const hubBack = document.getElementById('hub-back');
    const hubCart = document.getElementById('hub-cart');
    const hubLogin = document.getElementById('hub-login');

    if (hubToggle) hubToggle.addEventListener('click', () => this.toggleFloatingHub());
    if (hubHome) hubHome.addEventListener('click', () => window.location.href = '/');
    if (hubBack) hubBack.addEventListener('click', () => this.goBack());
    if (hubCart) hubCart.addEventListener('click', () => this.toggleCartPanel());
    if (hubLogin) hubLogin.addEventListener('click', () => this.handleLogin());

    // Login button in quick actions
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.addEventListener('click', () => this.handleLogin());

    // Return link in breadcrumb
    const returnLink = document.getElementById('return-link');
    if (returnLink) {
      returnLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.returnToPreviousLocation();
      });
    }
  }

  private bindThumbnailEvents(): void {
    const thumbnails = document.querySelectorAll('.thumbnail-wrapper');
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.addEventListener('click', () => {
        this.changeMainImage(index);
      });
    });
  }

  private changeMainImage(index: number): void {
    if (!this.product?.images || index >= this.product.images.length) {return;}

    const mainImage = document.getElementById('main-image');
    if (!(mainImage instanceof HTMLImageElement)) return;
    const currentCounter = document.getElementById('current-image');
    const thumbnails = document.querySelectorAll('.thumbnail-wrapper');

    if (mainImage) {
      const image = this.product.images[index];
      if (image) {
        mainImage.src = image.url;
        mainImage.alt = this.product.name;
      }
    }

    if (currentCounter) {
      currentCounter.textContent = (index + 1).toString();
    }

    // Update active thumbnail
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });

    this.currentImageIndex = index;
  }

  private navigateToPrevious(): void {
    if (this.allProducts.length === 0) {return;}

    let newIndex = this.currentProductIndex - 1;
    if (newIndex < 0) {
      newIndex = this.allProducts.length - 1; // Loop to last
      this.showNavigationMessage('Has vuelto al último producto');
    }

    const prevProduct = this.allProducts[newIndex];
    if (prevProduct) {
      window.location.href = `/pages/product-detail.html?id=${prevProduct.id}`;
    }
  }

  private navigateToNext(): void {
    if (this.allProducts.length === 0) {return;}

    let newIndex = this.currentProductIndex + 1;
    if (newIndex >= this.allProducts.length) {
      newIndex = 0; // Loop to first
      this.showNavigationMessage('Has vuelto al primer producto');
    }

    const nextProduct = this.allProducts[newIndex];
    if (nextProduct) {
      window.location.href = `/pages/product-detail.html?id=${nextProduct.id}`;
    }
  }

  private showNavigationMessage(message: string): void {
    // Show a subtle toast message
    const toast = document.createElement('div') as HTMLElement;
    toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg px-4 py-3 shadow-lg';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
      <div class="flex items-center justify-between">
        <small>${message}</small>
        <button type="button" class="ml-3 text-blue-600 hover:text-blue-800 focus:outline-none" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  public addToCart(productId?: number, quantity = 1): Promise<boolean> {
    if (productId && productId !== this.product?.id) {
      // If different product ID, load that product first
      return this.loadProduct(productId).then(() => {
        return this.addToCartInternal(quantity);
      });
    }
    return Promise.resolve(this.addToCartInternal(quantity));
  }

  private addToCartInternal(quantity = this.quantity): boolean {
    if (!this.product) return false;

    const existingItem = this.cart.find(item => item.productId === this.product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const mainImage = this.product.images?.[0]?.url ?? '/images/placeholder-product-2.webp';
      this.cart.push({
        productId: this.product.id,
        name: this.product.name,
        price: this.product.price_usd,
        image: mainImage,
        quantity
      });
    }

    this.saveCart();
    this.updateCartUI();
    this.updateHubCartBadge();
    this.showCartPanel();
    this.showAddToCartMessage();

        return true;
  }

  private buyNow(): void {
    if (!this.product) return;

    // Check if login is required for purchase
    if (!this.isLoggedIn) {
      this.showLoginModal();
      return;
    }

    // Add to cart first
    this.addToCartInternal();

    // Show purchase confirmation
    this.showPurchaseAnimation();

    // Redirect to checkout
    setTimeout(() => {
      window.location.href = '/pages/payment.html';
    }, 1000);
  }

  private showPurchaseAnimation(): void {
    const buyBtn = document.getElementById('buy-now-btn');
    if (buyBtn) {
      buyBtn.classList.add('purchase-success');
      buyBtn.innerHTML = `
        <i data-lucide="check-circle" class="cta-icon"></i>
        <span class="cta-text">¡Procesando!</span>
        <div class="cta-subtitle">Redirigiendo al pago...</div>
      `;
    }
  }

  private updateHubCartBadge(): void {
    const hubBadge = document.getElementById('hub-cart-badge');
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (hubBadge instanceof HTMLElement) {
      hubBadge.textContent = totalItems.toString();
      hubBadge.style.display = totalItems > 0 ? 'block' : 'none';
    }
  }

  private initializeCart(): void {
    // Load cart from sessionStorage
    const savedCart = sessionStorage.getItem('floresya_cart');
    if (savedCart) {
      try {
        this.cart = JSON.parse(savedCart);
      } catch (error) {
                this.cart = [];
      }
    }
  }

  private saveCart(): void {
    sessionStorage.setItem('floresya_cart', JSON.stringify(this.cart));
  }

  private updateCartUI(): void {
    const cartBadge = document.getElementById('cart-badge');
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update cart badges
    if (cartBadge instanceof HTMLElement) {
      cartBadge.textContent = totalItems.toString();
      cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
    }

    if (cartCount) {
      cartCount.textContent = totalItems.toString();
    }

    // Update hub cart badge
    this.updateHubCartBadge();

    // Update cart items list
    if (cartItems) {
      if (this.cart.length === 0) {
        cartItems.innerHTML = '<p class="text-muted text-center">Tu carrito está vacío</p>';
      } else {
        cartItems.innerHTML = this.cart.map(item => `
          <div class="cart-item d-flex align-items-center mb-3 p-2 border rounded">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image me-3"
                 style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
            <div class="flex-grow-1">
              <h6 class="mb-1 small">${item.name}</h6>
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted small">$${item.price.toFixed(2)}</span>
                <div class="d-flex align-items-center">
                  <button class="btn btn-sm btn-outline-secondary me-1" onclick="productDetail.decreaseCartItemQuantity(${item.productId})">-</button>
                  <span class="mx-2">${item.quantity}</span>
                  <button class="btn btn-sm btn-outline-secondary ms-1" onclick="productDetail.increaseCartItemQuantity(${item.productId})">+</button>
                </div>
              </div>
            </div>
            <button class="btn btn-sm btn-outline-danger ms-2" onclick="productDetail.removeFromCart(${item.productId})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        `).join('');
      }
    }

    // Update total
    if (cartTotal) {
      const formatted = new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'USD'
      }).format(totalPrice);
      cartTotal.textContent = formatted;
    }
  }

  // Public methods for cart operations (called from inline handlers)
  increaseCartItemQuantity(productId: number): void {
    const item = this.cart.find(item => item.productId === productId);
    if (item) {
      item.quantity += 1;
      this.saveCart();
      this.updateCartUI();
    }
  }

  decreaseCartItemQuantity(productId: number): void {
    const item = this.cart.find(item => item.productId === productId);
    if (item && item.quantity > 1) {
      item.quantity -= 1;
      this.saveCart();
      this.updateCartUI();
    }
  }

  removeFromCart(productId: number): void {
    this.cart = this.cart.filter(item => item.productId !== productId);
    this.saveCart();
    this.updateCartUI();
  }

  private toggleCartPanel(): void {
    const cartPanel = document.getElementById('cart-panel');
    if (cartPanel) {
      const isVisible = cartPanel.classList.contains('show');
      if (isVisible) {
        this.hideCartPanel();
      } else {
        this.showCartPanel();
      }
    }
  }

  private showCartPanel(): void {
    const cartPanel = document.getElementById('cart-panel');
    if (cartPanel) {
      cartPanel.classList.add('show');
    }
  }

  private hideCartPanel(): void {
    const cartPanel = document.getElementById('cart-panel');
    if (cartPanel) {
      cartPanel.classList.remove('show');
    }
  }

  private showAddToCartMessage(): void {
    const toast = document.createElement('div') as HTMLElement;
    toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-50 text-green-800 border border-green-200 rounded-lg px-4 py-3 shadow-lg';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span>¡Producto agregado al carrito!</span>
        </div>
        <button type="button" class="ml-3 text-green-600 hover:text-green-800 focus:outline-none" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  private zoomImage(): void {
    // Simple image zoom implementation
    const mainImage = document.getElementById('main-image');
    if (!(mainImage instanceof HTMLImageElement)) return;
    if (!mainImage) {return;}

    // Create modal for zoomed image
    const modal = document.createElement('div') as HTMLElement;
    modal.className = 'modal fade';
    modal.innerHTML = `
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${this.product?.name ?? 'Imagen del producto'}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <img src="${mainImage.src}" alt="${mainImage.alt}" class="img-fluid">
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Show modal with custom implementation
    modal.style.display = 'block';
    modal.classList.add('show');
    (document.body).style.overflow = 'hidden';

    // Add close functionality
    const closeBtn = modal.querySelector('.btn-close');
    const closeModal = () => {
      modal.style.display = 'none';
      modal.classList.remove('show');
      (document.body).style.overflow = '';
      modal.remove();
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Close on escape key
    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  // Public method required by global interface
  public showImages(productId: number): void {
    // Navigate to product detail page to show images
    window.location.href = `/pages/product-detail.html?id=${productId}`;
  }

  // New methods for enhanced UX/UI functionality
  private checkAuthStatus(): void {
    // Check if user is logged in (implement your auth logic here)
    const token = localStorage.getItem('floresya_auth_token');
    this.isLoggedIn = !!token;
  }

  private savePreviousLocation(): void {
    const referrer = document.referrer;
    if (referrer && referrer.includes(window.location.hostname)) {
      this.previousLocation = referrer;
      sessionStorage.setItem('floresya_previous_location', referrer);
    } else {
      this.previousLocation = sessionStorage.getItem('floresya_previous_location') || '/';
    }
  }

  private returnToPreviousLocation(): void {
    const previousLocation = this.previousLocation || sessionStorage.getItem('floresya_previous_location');
    if (previousLocation && previousLocation !== window.location.href) {
      window.location.href = previousLocation;
    } else {
      window.location.href = '/#productos';
    }
  }

  private goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.returnToPreviousLocation();
    }
  }

  private updateQuickPreview(): void {
    const preview = document.getElementById('product-title-preview');
    if (preview && this.product) {
      preview.textContent = this.product.name;
      preview.classList.remove('loading-text');
    }
  }

  private updateLoginButton(): void {
    const loginBtn = document.getElementById('login-btn');
    const hubLogin = document.getElementById('hub-login');

    if (this.isLoggedIn) {
      if (loginBtn) {
        loginBtn.innerHTML = '<i data-lucide="user-check"></i><span>Mi Cuenta</span>';
        loginBtn.title = 'Mi Cuenta';
      }
      if (hubLogin) {
        hubLogin.innerHTML = '<i data-lucide="user-check"></i>';
        hubLogin.title = 'Mi Cuenta';
      }
    } else {
      if (loginBtn) {
        loginBtn.innerHTML = '<i data-lucide="user"></i><span>Iniciar Sesión</span>';
        loginBtn.title = 'Iniciar Sesión';
      }
      if (hubLogin) {
        hubLogin.innerHTML = '<i data-lucide="user"></i>';
        hubLogin.title = 'Iniciar Sesión';
      }
    }
  }

  private handleLogin(): void {
    if (this.isLoggedIn) {
      // Go to user account page
      window.location.href = '/pages/admin.html';
    } else {
      // Show login modal or redirect to login
      this.showLoginModal();
    }
  }

  private showLoginModal(): void {
    // Create and show login modal
    const modal = document.createElement('div');
    modal.className = 'login-modal-overlay';
    modal.innerHTML = `
      <div class="login-modal">
        <div class="login-modal-header">
          <h3>Iniciar Sesión</h3>
          <button class="login-modal-close" type="button">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="login-modal-body">
          <p class="mb-3">Inicia sesión para una experiencia personalizada</p>
          <div class="d-grid gap-2">
            <button class="btn btn-primary" onclick="window.location.href='/pages/admin.html'">
              <i data-lucide="log-in" class="me-2"></i>
              Ir al Login
            </button>
            <button class="btn btn-outline-secondary" onclick="productDetail.continueAsGuest()">
              Continuar como invitado
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.login-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  public continueAsGuest(): void {
    // Close any open modals
    const modal = document.querySelector('.login-modal-overlay');
    if (modal) modal.remove();
  }

  private showProductContent(): void {
    const spinner = document.getElementById('loading-spinner');
    const content = document.getElementById('product-content');

    if (spinner) spinner.classList.add('d-none');
    if (content) {
      content.classList.add('show');
      void content.offsetHeight; // Force reflow
    }

    // Fallback with delay
    setTimeout(() => {
      if (content) {
        content.classList.add('show');
        content.classList.remove('d-none');
      }
      if (spinner) spinner.classList.add('d-none');
    }, 100);
  }

  private initializeFloatingHub(): void {
    // Close hub when clicking outside
    document.addEventListener('click', (e) => {
      const hub = document.getElementById('floating-hub');
      if (hub && !hub.contains(e.target as Node) && this.floatingHubExpanded) {
        this.toggleFloatingHub();
      }
    });
  }

  private toggleFloatingHub(): void {
    const hubActions = document.getElementById('hub-actions');
    const hubIcon = document.querySelector('.hub-icon');

    if (hubActions && hubIcon instanceof HTMLElement) {
      this.floatingHubExpanded = !this.floatingHubExpanded;
      hubActions.classList.toggle('active', this.floatingHubExpanded);
      hubIcon.style.transform = this.floatingHubExpanded ? 'rotate(45deg)' : 'rotate(0deg)';
    }
  }

  private setupDetailToggles(): void {
    const toggles = document.querySelectorAll('.detail-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const section = toggle.getAttribute('data-section');
        if (section) {
          this.toggleDetailSection(section);
        }
      });
    });
  }

  private toggleDetailSection(section: string): void {
    const toggle = document.querySelector(`[data-section="${section}"]`);
    const content = document.getElementById(`${section}-content`);

    if (toggle && content) {
      const isActive = toggle.classList.contains('active');
      toggle.classList.toggle('active', !isActive);
      content.classList.toggle('active', !isActive);
    }
  }

  private bindKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when not typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.navigateToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.navigateToNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.previousImage();
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.nextImage();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          void this.addToCart();
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          this.buyNow();
          break;
        case 'Escape':
          e.preventDefault();
          this.goBack();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          window.location.href = '/';
          break;
        case '+':
        case '=':
          e.preventDefault();
          this.increaseQuantity();
          break;
        case '-':
          e.preventDefault();
          this.decreaseQuantity();
          break;
      }
    });
  }

  private increaseQuantity(): void {
    this.quantity = Math.min(this.quantity + 1, 10); // Max 10 items
    this.updateQuantityDisplay();
  }

  private decreaseQuantity(): void {
    this.quantity = Math.max(this.quantity - 1, 1); // Min 1 item
    this.updateQuantityDisplay();
  }

  private updateQuantityDisplay(): void {
    const display = document.getElementById('quantity-display');
    if (display) {
      display.textContent = this.quantity.toString();
    }
  }

  private previousImage(): void {
    if (!this.product?.images || this.product.images.length <= 1) return;

    this.currentImageIndex = this.currentImageIndex > 0
      ? this.currentImageIndex - 1
      : this.product.images.length - 1;

    this.changeMainImage(this.currentImageIndex);
  }

  private nextImage(): void {
    if (!this.product?.images || this.product.images.length <= 1) return;

    this.currentImageIndex = this.currentImageIndex < this.product.images.length - 1
      ? this.currentImageIndex + 1
      : 0;

    this.changeMainImage(this.currentImageIndex);
  }

  private showError(message: string): void {
    const container = document.getElementById('product-content');
    if (container) {
      container.innerHTML = `
        <div class="container mt-5">
          <div class="row justify-content-center">
            <div class="col-md-6 text-center">
              <div class="alert alert-danger">
                <h4>Error</h4>
                <p>${message}</p>
                <button onclick="window.location.href='/'" class="btn btn-primary">Volver al inicio</button>
              </div>
            </div>
          </div>
        </div>
      `;
      container.classList.add('show');
    }

    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.classList.add('d-none');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  void (async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.productDetail = new ProductDetailManager() as any;
    await window.productDetail.init();
  } catch (error) {
      }
  })();
});

// Export for module usage
export { ProductDetailManager };