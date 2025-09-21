/**
 * Product Detail Page Manager
 * Handles product detail page functionality including navigation, cart operations, and UI management
 */

import { FloresYaAPI } from './services/api.js';
import type { Occasion, Product } from '../config/supabase.js';
import type { WindowWithBootstrap } from '../types/globals.js';

interface ProductWithImagesAndOccasion extends Product {
  images?: Array<{ id: number; url: string; alt_text?: string; display_order?: number; }>;
  occasion?: Occasion;
  price: number; // Alias for price_usd
}

interface APIProductResponse {
  product: Product & { images?: Array<{ id: number; url: string; alt_text?: string; display_order?: number; }> };
}

declare global {
  interface Window {
    productDetail?: ProductDetailManager;
  }
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

class ProductDetailManager {
  private product: ProductWithImagesAndOccasion | null = null;
  private allProducts: ProductWithImagesAndOccasion[] = [];
  private currentProductIndex = 0;
  private cart: CartItem[] = [];
  private currentImageIndex = 0;
  private api: FloresYaAPI;

  constructor() {
    this.api = new FloresYaAPI();
    this.initializeCart();
  }

  async init(): Promise<void> {
    try {
      // Get product ID from URL
      const productId = this.getProductIdFromURL();
      if (!productId) {
        this.showError('ID de producto no válido');
        return;
      }

      // Load all products to enable navigation
      await this.loadAllProducts();

      // Load specific product
      await this.loadProduct(productId);

      // Setup UI and events
      this.setupUI();
      this.bindEvents();
      this.updateCartUI();

      // Product Detail initialized successfully
    } catch (error) {
      console.error('❌ Error initializing product detail:', error);
      this.showError('Error al cargar el producto');
    }
  }

  private getProductIdFromURL(): number | null {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const productId = idParam ? parseInt(idParam, 10) : null;

    if (!productId || isNaN(productId)) {
      console.error('Invalid product ID in URL:', idParam);
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
              images: productWithImages.images ?? [],
              price: p.price_usd,
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
      console.error('Error loading all products:', error);
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
      const response = await this.api.getProductById(productId);

      if (response.success && response.data) {
        // The API returns data wrapped in { product: ... }
        const productData = response.data as unknown as (Product & { images?: Array<{ id: number; url: string; alt_text?: string; display_order?: number; }> });
        if (!productData) {
          throw new Error('Product data not found in response');
        }

        this.product = {
          ...productData,
          images: productData.images ?? [],
          price: productData.price_usd,
          occasion: undefined // Will be populated if needed
        };

        // Find current product index in the sorted array
        this.currentProductIndex = this.allProducts.findIndex(p => p.id === productId);
        if (this.currentProductIndex === -1) {
          this.currentProductIndex = 0;
        }

        // Product loaded successfully
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      throw error;
    }
  }

  private setupUI(): void {
    if (!this.product) {
      console.error('setupUI: No product data available');
      return;
    }

    // Starting UI setup

    try {
      // Update page title
      document.title = `${this.product.name} - FloresYa`;
      // Page title updated

      // Update breadcrumb
      this.updateBreadcrumb();
      // Breadcrumb updated

      // Update product info
      this.updateProductInfo();
      // Product info updated

      // Update images
      this.updateProductImages();
      // Product images updated

      // Update navigation counter
      this.updateNavigationCounter();
      // Navigation counter updated

      // Hide loading spinner and show content
      const spinner = document.getElementById('loading-spinner');
      const content = document.getElementById('product-content');

      // DOM elements found and validated

      if (spinner) {
        spinner.classList.add('d-none');
        // Loading spinner hidden
      } else {
        console.warn('Loading spinner element not found');
      }

      if (content) {
        content.classList.add('show');

        // Force a reflow to ensure the change takes effect
        void content.offsetHeight;

        // Product content shown successfully
      } else {
        console.error('Product content element not found');
      }

      // UI setup completed successfully

      // Final fallback: Force visibility after a short delay (similar to main products page)
      setTimeout(() => {
        const finalContent = document.getElementById('product-content');
        const finalSpinner = document.getElementById('loading-spinner');

        if (finalContent) {
          finalContent.classList.add('show');
          finalContent.classList.remove('d-none');
          // Final fallback: Content forced visible
        }

        if (finalSpinner) {
          finalSpinner.classList.add('d-none');
          // Final fallback: Spinner hidden
        }
      }, 100);

    } catch (error) {
      console.error('Error during UI setup:', error);
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
      }).format(this.product.price);
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
          mainImage.alt = primaryImage.alt_text ?? this.product.name;
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
        thumbnailContainer.innerHTML = images.map((image, index) => `
          <div class="thumbnail-wrapper ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${image.url}" alt="${image.alt_text ?? (this.product ? this.product.name : 'Product image')}"
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

    if (prevBtn) {prevBtn.addEventListener('click', () => this.navigateToPrevious());}
    if (nextBtn) {nextBtn.addEventListener('click', () => this.navigateToNext());}
    if (backBtn) {backBtn.addEventListener('click', () => history.back());}
    if (homeBtn) {homeBtn.addEventListener('click', () => window.location.href = '/');}

    // Cart buttons
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');

    if (addToCartBtn) {addToCartBtn.addEventListener('click', () => this.addToCart());}
    if (buyNowBtn) {buyNowBtn.addEventListener('click', () => this.buyNow());}

    // Cart toggle
    const cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {cartToggle.addEventListener('click', () => this.toggleCartPanel());}

    // Image zoom
    const mainImage = document.getElementById('main-image');
    if (mainImage) {mainImage.addEventListener('click', () => this.zoomImage());}
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
        mainImage.alt = image.alt_text ?? this.product.name;
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
    const toast = document.createElement('div');
    toast.className = 'position-fixed top-0 start-50 translate-middle-x mt-3 alert alert-info alert-dismissible';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
      <small>${message}</small>
      <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  private addToCart(): void {
    if (!this.product) {return;}

    const existingItem = this.cart.find(item => item.productId === (this.product ? this.product.id : 0));

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      const mainImage = this.product.images?.[0]?.url ?? '/images/placeholder-product-2.webp';
      this.cart.push({
        productId: this.product.id,
        name: this.product.name,
        price: this.product.price,
        image: mainImage,
        quantity: 1
      });
    }

    this.saveCart();
    this.updateCartUI();
    this.showCartPanel();
    this.showAddToCartMessage();

    console.warn('🛒 Product added to cart', {
      productId: this.product.id,
      cartSize: this.cart.length
    });
  }

  private buyNow(): void {
    if (!this.product) {return;}

    // Add to cart first
    this.addToCart();

    // Redirect to checkout
    setTimeout(() => {
      window.location.href = '/pages/payment.html';
    }, 500);
  }

  private initializeCart(): void {
    // Load cart from sessionStorage
    const savedCart = sessionStorage.getItem('floresya_cart');
    if (savedCart) {
      try {
        this.cart = JSON.parse(savedCart);
      } catch (error) {
        console.error('Error loading cart from session:', error);
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

    // Update cart badge
    if (cartBadge) {
      cartBadge.textContent = totalItems.toString();
      if (totalItems > 0) {
        cartBadge.classList.remove('cart-badge-hidden');
      } else {
        cartBadge.classList.add('cart-badge-hidden');
      }
    }

    if (cartCount) {
      cartCount.textContent = totalItems.toString();
    }

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
                  <button class="btn btn-sm btn-outline-secondary me-1" onclick="productDetail.decreaseQuantity(${item.productId})">-</button>
                  <span class="mx-2">${item.quantity}</span>
                  <button class="btn btn-sm btn-outline-secondary ms-1" onclick="productDetail.increaseQuantity(${item.productId})">+</button>
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
  increaseQuantity(productId: number): void {
    const item = this.cart.find(item => item.productId === productId);
    if (item) {
      item.quantity += 1;
      this.saveCart();
      this.updateCartUI();
    }
  }

  decreaseQuantity(productId: number): void {
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
    const toast = document.createElement('div');
    toast.className = 'position-fixed top-0 start-50 translate-middle-x mt-3 alert alert-success alert-dismissible';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
      <i class="bi bi-check-circle me-2"></i>
      <span>¡Producto agregado al carrito!</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
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
    const modal = document.createElement('div');
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

    // Show modal
    const bootstrap = (window as unknown as WindowWithBootstrap).bootstrap;
    if (bootstrap) {
      const modalInstance = new bootstrap.Modal(modal as HTMLElement);
      modalInstance.show();

      // Remove modal from DOM when hidden
      modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
      });
    }
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
                <a href="/" class="btn btn-primary">Volver al inicio</a>
              </div>
            </div>
          </div>
        </div>
      `;
      container.classList.add('show');
    }

    const spinner = document.getElementById('loading-spinner');
    if (spinner) {spinner.classList.add('d-none');}
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  void (async () => {
  try {
    window.productDetail = new ProductDetailManager();
    await window.productDetail.init();
  } catch (error) {
    console.error('Failed to initialize product detail:', error);
  }
  })();
});

// Export for module usage
export { ProductDetailManager };