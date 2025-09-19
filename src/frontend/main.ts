/**
 * 🌸 FloresYa Main Application - TypeScript Edition
 * Main application controller with full type safety
 */

// Import types and utilities
import type { Product, ProductWithImages, Occasion, ProductQuery, PaginationInfo as Pagination } from '../config/supabase.js';
import type { LogData, WindowWithBootstrap, WindowWithCart, Logger } from '../types/globals.js';
import { FloresYaAPI } from './services/api.js';

// Type definitions
interface ConversionOptimizer {
  sessionStartTime: number;
  viewedProducts: Set<number>;
}

interface CarouselProduct {
  id: number;
  name: string;
  summary?: string;
  price_usd: number;
  carousel_order: number;
  primary_thumb_url: string;
  images?: Array<{url: string, size: string}>; // Para efecto hover
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface ProductWithOccasion extends ProductWithImages {
  occasion?: Occasion;
  price: number; // Alias for price_usd for easier use
}

// Extend Window interface
declare global {
  interface Window {
    logger?: Logger;
    floresyaLogger?: Logger;
    api?: FloresYaAPI;
    floresyaApp?: FloresYaApp | undefined;
  }
}

export class FloresYaApp {
  private products: ProductWithOccasion[];
  private occasions: Occasion[];
  private currentPage: number;
  private itemsPerPage: number;
  private currentFilters: ProductQuery;
  private isProductionMode: boolean;
  private conversionOptimizer: ConversionOptimizer;
  private hoverIntervals: Map<string, NodeJS.Timeout>;
  private hoverTimeouts: Map<string, NodeJS.Timeout>;
  private cart: CartItem[];

  constructor() {
    this.products = [];
    this.occasions = [];
    this.currentPage = 1;
    this.itemsPerPage = 12;
    this.currentFilters = {};
    this.isProductionMode = true;
    this.conversionOptimizer = {
      sessionStartTime: Date.now(),
      viewedProducts: new Set<number>()
    };
    this.hoverIntervals = new Map<string, NodeJS.Timeout>();
    this.hoverTimeouts = new Map<string, NodeJS.Timeout>();
    this.cart = [];

    // Initialize cart from session storage
    this.initializeCart();

    // Initialize with logging
    if (window.logger) {
      window.logger.info('APP', '✅ FloresYaApp initialized');
    } else {
      console.log('[🌸 FloresYa] App initialized');
    }

    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.init();
      });
    } else {
      // DOM is already ready
      this.init();
    }
  }

  private log(message: string, data: LogData | null = null, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
    // Use window.logger if available
    if (window.logger) {
      window.logger[level]('APP', message, data);
    } else {
      const prefix = '[🌸 FloresYa]';
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
    this.log('🔄 Inicializando aplicación', {}, 'info');

    try {
      // Check if we're on the payment page
      if (window.location.pathname === '/payment') {
        this.showPaymentPage();
        return;
      }

      // Normal initialization for main page
      this.bindEvents();
      void this.loadInitialData();
      this.initializeConversionOptimizer();
      this.log('✅ Aplicación inicializada correctamente', {}, 'success');
    } catch (error) {
      this.log('❌ Error al inicializar aplicación', {
        error: error instanceof Error ? error.message : String(error)
      }, 'error');
    }
  }

  private async loadInitialData(): Promise<void> {
    this.log('🔄 Cargando datos iniciales', {}, 'info');

    try {
      // Wait for API to be available
      if (!window.api) {
        throw new Error('api is not defined');
      }

      const api = window.api;

      // Load occasions for filtering
      const occasionsResponse = await api.getOccasions();
      if (occasionsResponse.success && occasionsResponse.data) {
        this.occasions = occasionsResponse.data;
        this.populateOccasionFilter();
        this.log('✅ Ocasiones cargadas', { count: this.occasions.length }, 'success');
      } else {
        this.log('⚠️ No se pudieron cargar las ocasiones', occasionsResponse, 'warn');
      }

      // Load products
      await this.loadProducts();

      // Load carousel
      await this.loadCarousel();

      this.log('✅ Datos iniciales cargados', {}, 'success');
    } catch (error) {
      this.log('❌ Error cargando datos iniciales', {
        error: error instanceof Error ? error.message : String(error)
      }, 'error');
    }
  }

  private async loadProducts(): Promise<void> {
    this.log('🔄 Cargando productos', { page: this.currentPage, filters: this.currentFilters }, 'info');

    try {
      if (!window.api) {
        throw new Error('API not available');
      }

      const params = {
        page: this.currentPage,
        limit: this.itemsPerPage,
        ...this.currentFilters
      };

      const response = await window.api.getProducts(params);

      if (response.success && response.data) {
        let products = (response.data.products ?? []).map((p: Product) => {
          const productWithImages = p as ProductWithImages;
          return {
            ...productWithImages,
            images: productWithImages.images ?? [],
            price: productWithImages.price_usd,
            occasion: undefined // Will be populated if needed
          } as ProductWithOccasion;
        });

        // Apply custom sorting: group by occasion, then alphabetical by name within each group
        products = this.sortProductsByOccasionAndName(products);

        this.products = products;

        // Clear any existing hover intervals before rendering new products
        this.clearAllHoverIntervals();

        this.renderProducts(this.products);

        if (response.data.pagination) {
          this.renderPagination(response.data.pagination);
        }

        this.log('✅ Productos cargados', {
          count: this.products.length,
          page: this.currentPage
        }, 'success');

        // Trigger conversion optimization
        this.trackProductsView();
      } else {
        this.log('❌ Error en respuesta de productos', response, 'error');
        this.showEmptyState();
      }
    } catch (error) {
      this.log('❌ Error cargando productos', {
        error: error instanceof Error ? error.message : String(error)
      }, 'error');
      this.showErrorState();
    }
  }

  private async loadCarousel(): Promise<void> {
    this.log('🔄 Cargando carrusel', {}, 'info');

    try {
      if (!window.api) {
        throw new Error('API not available');
      }

      const response = await window.api.getCarousel();

      if (response.success && response.data) {
        this.renderCarousel(response.data.carousel_products);
        this.log('✅ Carrusel cargado', {
          count: response.data.carousel_products.length
        }, 'success');
      } else {
        // Check if it's a network/connectivity issue
        const errorMessage = response.message ?? 'Unknown error';
        const isConnectivityIssue = errorMessage.includes('NetworkError') ||
                                   errorMessage.includes('fetch') ||
                                   errorMessage.includes('connectivity');

        this.log(`${isConnectivityIssue ? '🌐' : '⚠️'} No se pudieron cargar productos del carrusel`, {
          message: errorMessage,
          isConnectivityIssue
        }, isConnectivityIssue ? 'info' : 'warn');
        this.showCarouselFallback();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isConnectivityIssue = errorMessage.includes('NetworkError') ||
                                 errorMessage.includes('fetch') ||
                                 errorMessage.includes('connectivity') ||
                                 errorMessage.includes('No network connectivity');

      this.log(`${isConnectivityIssue ? '🌐' : '❌'} Error cargando carrusel`, {
        error: errorMessage,
        isConnectivityIssue
      }, isConnectivityIssue ? 'warn' : 'error');
      this.showCarouselFallback();
    }
  }

  private renderProducts(products: ProductWithOccasion[]): void {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    if (products.length === 0) {
      this.showEmptyState();
      return;
    }

    const html = products.map(product => this.createProductCard(product)).join('');
    container.innerHTML = html;

    // Bind hover events to product cards after rendering
    this.bindProductCardHoverEvents();
  }

  private createProductCard(product: ProductWithImages): string {
    // Prefer small size image for product cards, fallback to primary, then any available
    const smallImage = product.images?.find(img => img.size === 'small');
    const primaryImage = product.primary_image;
    const fallbackImage = product.images?.[0];

    const imageToUse = smallImage ?? primaryImage ?? fallbackImage;
    const imageUrl = imageToUse?.url ?? '/images/placeholder-product.webp';

    // Obtener imágenes medium para el efecto hover
    const mediumImages = (product as ProductWithImages & {medium_images?: string[]}).medium_images ?? [];
    const mediumImagesJson = JSON.stringify(mediumImages);

    // price_usd is already a number
    const price = product.price_usd;
    const formattedPrice = isNaN(price) ? 'N/A' : price.toFixed(2);

    return `
      <div class="col-md-4 col-lg-3 mb-4">
        <div class="card product-card h-100" data-product-id="${product.id}" data-medium-images='${mediumImagesJson}'>
          <div class="card-img-wrapper position-relative">
            <img src="${imageUrl}"
                 class="card-img-top"
                 alt="${product.name}"
                 width="300"
                 height="300"
                 loading="lazy"
                 onerror="this.src='/images/placeholder-product.webp'">

            <!-- Image indicator in top-left corner -->
            <div class="image-indicator position-absolute top-0 start-0 m-2 px-2 py-1 bg-dark bg-opacity-75 text-white rounded-pill small"
                 style="font-size: 0.75rem; z-index: 10;">
              <span class="current-image">1</span>/<span class="total-images">${Math.max(1, mediumImages.length ?? 1)}</span>
            </div>

            ${product.featured ? '<span class="badge badge-featured">Destacado</span>' : ''}
          </div>
          <div class="card-body d-flex flex-column">
            <!-- Product name with 2-line text wrapping -->
            <h5 class="card-title product-name" style="
              line-height: 1.2;
              height: 2.4em;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              margin-bottom: 0.75rem;
            ">${product.name}</h5>

            <p class="card-text flex-grow-1 small">${product.summary}</p>

            <!-- Price and BUY button row -->
            <div class="price-buy-row d-flex align-items-center justify-content-between mb-3">
              <div class="price">
                <strong class="h5 mb-0">${formattedPrice}</strong>
                <small class="text-muted">USD</small>
              </div>
              <!-- BUY button with gradient and bright design -->
              <button class="btn buy-now-btn"
                      data-product-id="${product.id}"
                      ${product.stock === 0 ? 'disabled' : ''}
                      style="
                        background: linear-gradient(45deg, #ff6b35, #f7931e, #ffd700);
                        border: none;
                        color: #fff;
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
                        transition: all 0.3s ease;
                        border-radius: 25px;
                        padding: 8px 20px;
                        font-size: 0.9rem;
                      "
                      onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(255, 193, 7, 0.6)';"
                      onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(255, 193, 7, 0.4)';">
                <i class="bi bi-lightning-charge-fill" style="color: #ffd700; font-size: 1.2em;"></i>
                <strong>BUY</strong>
              </button>
            </div>

            <div class="card-actions mt-auto">
              <div class="d-flex gap-2">
                <!-- Simplified cart button with cart + plus -->
                <button class="btn btn-primary btn-sm add-to-cart-btn flex-fill"
                        data-product-id="${product.id}"
                        ${product.stock === 0 ? 'disabled' : ''}
                        style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                  <i class="bi bi-cart3"></i><span style="font-weight: bold; font-size: 1.2em;">+</span>
                </button>
                <button class="btn btn-outline-secondary btn-sm view-details-btn flex-fill"
                        data-product-id="${product.id}">
                  <i class="bi bi-eye"></i> Ver
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderPagination(pagination: Pagination): void {
    const container = document.getElementById('pagination');
    if (!container) return;

    let html = '';

    // Previous button
    if (pagination.current_page > 1) {
      html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${pagination.current_page - 1}">Anterior</a>
        </li>
      `;
    }

    // Page numbers
    const startPage = Math.max(1, pagination.current_page - 2);
    const endPage = Math.min(pagination.total_pages, pagination.current_page + 2);

    for (let page = startPage; page <= endPage; page++) {
      html += `
        <li class="page-item ${page === pagination.current_page ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${page}">${page}</a>
        </li>
      `;
    }

    // Next button
    if (pagination.current_page < pagination.total_pages) {
      html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${pagination.current_page + 1}">Siguiente</a>
        </li>
      `;
    }

    container.innerHTML = html;
  }

  private populateOccasionFilter(): void {
    const select = document.getElementById('occasionFilter') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '<option value="">Todas las ocasiones</option>';

    this.occasions.forEach(occasion => {
      const option = document.createElement('option');
      option.value = occasion.slug;
      option.textContent = occasion.name;
      select.appendChild(option);
    });
  }

  private bindEvents(): void {
    this.log('🔄 Vinculando eventos', {}, 'info');

    // Search events
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput && window.api) {
      const debouncedSearch = window.api.debounce(() => {
        this.handleSearch();
      }, 500);

      searchInput.addEventListener('input', debouncedSearch);
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSearch();
        }
      });
    }

    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.handleSearch());
    }

    // Filter events
    const occasionFilter = document.getElementById('occasionFilter') as HTMLSelectElement;
    if (occasionFilter) {
      occasionFilter.addEventListener('change', () => this.handleFilter());
    }

    const sortFilter = document.getElementById('sortFilter') as HTMLSelectElement;
    if (sortFilter) {
      sortFilter.addEventListener('change', () => this.handleFilter());
    }

    // Pagination events (delegated)
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('#pagination .page-link')) {
        e.preventDefault();
        const page = parseInt(target.dataset.page ?? '1');
        this.changePage(page);
      }
    });

    // Product card events (delegated)
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.matches('.add-to-cart-btn') || target.closest('.add-to-cart-btn')) {
        const button = target.matches('.add-to-cart-btn') ? target : target.closest('.add-to-cart-btn') as HTMLElement;
        const productId = parseInt((button as HTMLElement)?.dataset?.productId ?? '0');
        if (productId) this.addToCart(productId);
      }

      // Handle BUY button for direct purchase
      if (target.matches('.buy-now-btn') || target.closest('.buy-now-btn')) {
        const button = target.matches('.buy-now-btn') ? target : target.closest('.buy-now-btn') as HTMLElement;
        const productId = parseInt((button as HTMLElement)?.dataset?.productId ?? '0');
        if (productId) this.buyNow(productId);
      }

      if (target.matches('.view-details-btn') || target.closest('.view-details-btn')) {
        const button = target.matches('.view-details-btn') ? target : target.closest('.view-details-btn') as HTMLElement;
        const productId = parseInt((button as HTMLElement)?.dataset?.productId ?? '0');
        if (productId) this.viewProductDetails(productId);
      }

      // Handle click on product card or product image to view details
      if (target.matches('.product-card') || target.closest('.product-card')) {
        // Don't trigger if clicking on buttons
        if (!target.matches('.add-to-cart-btn, .buy-now-btn, .view-details-btn') &&
            !target.closest('.add-to-cart-btn, .buy-now-btn, .view-details-btn')) {

          const card = target.matches('.product-card') ? target : target.closest('.product-card') as HTMLElement;
          const productId = parseInt(card?.dataset?.productId ?? '0');
          if (productId) {
            this.viewProductDetails(productId);
          }
        }
      }
    });

    // Product card hover events will be bound when cards are rendered
    // This ensures more reliable event handling

    this.log('✅ Eventos vinculados', {}, 'success');
  }

  private handleSearch(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (!searchInput) return;

    this.currentFilters.search = searchInput.value.trim();
    this.currentPage = 1;
    void this.loadProducts();

    this.log('🔍 Búsqueda realizada', { query: this.currentFilters.search }, 'info');
  }

  private handleFilter(): void {
    const occasionFilter = document.getElementById('occasionFilter') as HTMLSelectElement;
    const sortFilter = document.getElementById('sortFilter') as HTMLSelectElement;

    if (occasionFilter) {
      this.currentFilters.occasion = occasionFilter.value;
    }

    if (sortFilter) {
      this.currentFilters.sort = sortFilter.value;
    }

    this.currentPage = 1;
    void this.loadProducts();

    this.log('🔽 Filtros aplicados', this.currentFilters, 'info');
  }

  private changePage(page: number): void {
    this.currentPage = page;
    void this.loadProducts();

    // Scroll to products section
    const productsSection = document.getElementById('productos');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }

    this.log('📄 Página cambiada', { page }, 'info');
  }


  /**
   * Buy now - add to cart and redirect to payment page
   */
  private buyNow(productId: number): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    // Add to cart first
    if (typeof window !== 'undefined' && (window as WindowWithCart).cart) {
      (window as WindowWithCart).cart?.addItem({
        ...product,
        price_usd: product.price_usd ?? 0
      });
    }

    this.log('⚡ Compra directa iniciada', { productId, productName: product.name }, 'info');

    // Redirect to payment page
    window.location.href = '/payment';
  }

  private sortProductsByOccasionAndName(products: ProductWithOccasion[]): ProductWithOccasion[] {
    // Group products by occasion, then sort alphabetically by name within each group
    const grouped = new Map<string, ProductWithOccasion[]>();

    // Group by occasion
    products.forEach(product => {
      const occasionName = product.occasion?.name || 'Sin ocasión';
      if (!grouped.has(occasionName)) {
        grouped.set(occasionName, []);
      }
      grouped.get(occasionName)!.push(product);
    });

    // Sort each group alphabetically by name
    grouped.forEach((groupProducts, occasionName) => {
      groupProducts.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    });

    // Sort occasion groups alphabetically and flatten
    const sortedOccasions = Array.from(grouped.keys()).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );

    const result: ProductWithOccasion[] = [];
    sortedOccasions.forEach(occasionName => {
      result.push(...grouped.get(occasionName)!);
    });

    this.log('📋 Productos ordenados por ocasión y nombre', {
      totalProducts: result.length,
      occasions: sortedOccasions.length
    }, 'info');

    return result;
  }

  private viewProductDetails(productId: number): void {
    // Navigate to product detail page with ID parameter
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      this.log('❌ Producto no encontrado', { productId }, 'error');
      return;
    }

    // Track conversion event
    this.conversionOptimizer.viewedProducts.add(productId);

    // Navigate to product detail page
    window.location.href = `/pages/product-detail.html?id=${productId}`;

    this.log('🔗 Navegando a detalles del producto', { productId, productName: product.name }, 'info');
  }

  private bindProductCardHoverEvents(): void {
    // Clear any existing intervals first
    this.clearAllHoverIntervals();

    const productCards = document.querySelectorAll('.product-card[data-medium-images]');
    productCards.forEach(card => {
      const cardElement = card as HTMLElement;

      cardElement.addEventListener('mouseenter', () => {
        this.handleProductCardHover(cardElement, true);
      });

      cardElement.addEventListener('mouseleave', (e) => {
        // Check if mouse is actually leaving the card
        const relatedTarget = (e as MouseEvent).relatedTarget as HTMLElement;
        // Only continue hover if relatedTarget exists AND is contained within the card
        if (!relatedTarget || !cardElement.contains(relatedTarget)) {
          this.handleProductCardHover(cardElement, false);
        }
      });
    });
  }

  private clearAllHoverIntervals(): void {
    // Clear all active hover intervals
    this.hoverIntervals.forEach(interval => {
      clearInterval(interval);
    });
    this.hoverIntervals.clear();

    // Clear all pending hover timeouts
    this.hoverTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.hoverTimeouts.clear();
  }

  private handleProductCardHover(card: HTMLElement, isEntering: boolean): void {
    const productImage = card.querySelector('.card-img-top') as HTMLImageElement;
    const productId = card.dataset.productId ?? 'unknown';

    if (!productImage) return;

    // Obtener las imágenes medium del data attribute
    let mediumImages: string[] = [];
    try {
      const mediumImagesData = card.dataset.mediumImages ?? '[]';
      mediumImages = JSON.parse(mediumImagesData);
    } catch (error) {
      this.log('❌ Error parseando imágenes medium', { productId, error: error instanceof Error ? error.message : String(error) }, 'error');
      return;
    }

    // Guardar la imagen original si no está ya guardada
    card.dataset.originalImage ??= productImage.src;

    if (isEntering) {
      // CSS maneja los efectos visuales de la card automáticamente
      // Solo agregamos la clase de estado hover si necesitamos lógica adicional
      card.classList.add('is-hovering');

      // Inicializar indicador de imagen al comenzar hover
      this.updateImageIndicator(card, 1);

      // Iniciar rotación de imágenes si hay más de una
      if (mediumImages.length > 1) {
        this.startImageRotation(card, productImage, mediumImages, productId);
      }

      this.log('🖼️ Hover iniciado en product card', {
        productId,
        totalImages: mediumImages.length
      }, 'info');

    } else {
      // Remover clase de estado hover
      card.classList.remove('is-hovering');

      // Detener rotación de imágenes
      this.stopImageRotation(productId);

      // Volver a la imagen original con transición profesional
      this.returnToOriginalImage(card, productImage);

      // Reset image indicator to 1
      this.updateImageIndicator(card, 1);

      this.log('🖼️ Hover terminado en product card', { productId }, 'info');
    }
  }

  /**
   * Inicia la rotación ultra-refinada de imágenes con crossfade luxury
   */
  private startImageRotation(card: HTMLElement, productImage: HTMLImageElement, images: string[], productId: string): void {
    let currentImageIndex = 0;

    // Reduced delay for faster response
    const startTimeout = setTimeout(() => {
      // Check if hover is still active before starting rotation
      if (!card.classList.contains('is-hovering')) {
        this.hoverTimeouts.delete(productId);
        return;
      }

      const rotationInterval = setInterval(() => {
        // Double-check hover state before each rotation
        if (!card.classList.contains('is-hovering')) {
          clearInterval(rotationInterval);
          this.hoverIntervals.delete(productId);
          return;
        }

        currentImageIndex = (currentImageIndex + 1) % images.length;
        const nextImageUrl = images[currentImageIndex];

        if (nextImageUrl && productImage && typeof nextImageUrl === 'string') {
          this.luxuryCrossfadeToImage(productImage, nextImageUrl);
          // Update image indicator
          this.updateImageIndicator(card, currentImageIndex + 1);
        }
      }, 2535); // Increased by 69% total for optimal comfortable viewing and special effects

      // Guardar el interval para poder limpiarlo después
      this.hoverIntervals.set(productId, rotationInterval);
      this.hoverTimeouts.delete(productId);
    }, 200); // Reduced from 500ms to 200ms for faster start

    // Store timeout so it can be cancelled if hover ends quickly
    this.hoverTimeouts.set(productId, startTimeout);
  }

  /**
   * Detiene la rotación de imágenes
   */
  private stopImageRotation(productId: string): void {
    // Clear any pending timeout that hasn't started the interval yet
    const pendingTimeout = this.hoverTimeouts.get(productId);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      this.hoverTimeouts.delete(productId);
    }

    // Clear the active interval
    const existingInterval = this.hoverIntervals.get(productId);
    if (existingInterval) {
      clearInterval(existingInterval);
      this.hoverIntervals.delete(productId);
    }
  }

  /**
   * Crossfade ultra-refinado con preloading avanzado y timing perfecto
   */
  private luxuryCrossfadeToImage(imageElement: HTMLImageElement, newImageUrl: string): void {
    // Evitar transición innecesaria a la misma imagen
    if (imageElement.src === newImageUrl) return;

    // Marcar elemento como en transición
    imageElement.dataset.transitioning = 'true';

    // Limpiar clases de animación existentes
    imageElement.classList.remove('crossfade-in', 'crossfade-out');

    // Forzar reflow para reset completo
    void imageElement.offsetHeight;

    // Precargar la nueva imagen con manejo de errores
    const preloadImage = new Image();

    const handleImageLoad = () => {
      // Verificar que el elemento aún existe y está visible
      if (!imageElement.parentNode || imageElement.dataset.transitioning !== 'true') {
        return;
      }

      // Iniciar fade out ultra-suave
      imageElement.classList.add('crossfade-out');

      // Timing perfecto para el cambio de imagen
      setTimeout(() => {
        // Verificar nuevamente que el elemento está listo
        if (imageElement.dataset.transitioning === 'true') {
          imageElement.src = newImageUrl;
          imageElement.classList.remove('crossfade-out');
          imageElement.classList.add('crossfade-in');

          // Limpiar después de la animación completa
          setTimeout(() => {
            imageElement.classList.remove('crossfade-in');
            delete imageElement.dataset.transitioning;
          }, 800); // Duración completa de la animación luxury
        }
      }, 400); // Punto medio del fade out luxury (800ms / 2)
    };

    const handleImageError = () => {
      // En caso de error, limpiar estado
      delete imageElement.dataset.transitioning;
      this.log('⚠️ Error cargando imagen para crossfade', { imageUrl: newImageUrl }, 'warn');
    };

    // Configurar event listeners
    preloadImage.onload = handleImageLoad;
    preloadImage.onerror = handleImageError;

    // Iniciar precarga
    preloadImage.src = newImageUrl;
  }

  /**
   * Retorna a la imagen original con transición ultra-suave
   */
  private returnToOriginalImage(card: HTMLElement, productImage: HTMLImageElement): void {
    const originalImage = card.dataset.originalImage;
    if (originalImage && productImage.src !== originalImage && typeof originalImage === 'string') {
      // Force immediate stop of any ongoing transitions
      delete productImage.dataset.transitioning;

      // Remove all animation classes immediately
      productImage.classList.remove('crossfade-in', 'crossfade-out');

      // Force immediate return to original image without delay
      productImage.src = originalImage;

      // Optional: Add a subtle fade-in effect for the original image
      productImage.style.opacity = '0.8';
      setTimeout(() => {
        productImage.style.opacity = '1';
      }, 50);
    }
  }

  /**
   * Updates the image indicator to show current image number
   */
  private updateImageIndicator(card: HTMLElement, currentImageNumber: number): void {
    const indicator = card.querySelector('.current-image');
    if (indicator) {
      indicator.textContent = currentImageNumber.toString();
    }
  }

  private showEmptyState(): void {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-flower1 display-1 text-muted mb-3"></i>
        <h4 class="text-muted">No se encontraron productos</h4>
        <p class="text-muted">Intenta ajustar tus filtros de búsqueda</p>
        <button class="btn btn-primary" onclick="location.reload()">
          <i class="bi bi-arrow-clockwise"></i> Recargar
        </button>
      </div>
    `;
  }

  private showErrorState(): void {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-exclamation-triangle display-1 text-danger mb-3"></i>
        <h4 class="text-danger">Error al cargar productos</h4>
        <p class="text-muted">Ha ocurrido un error. Intenta recargar la página.</p>
        <button class="btn btn-danger" onclick="location.reload()">
          <i class="bi bi-arrow-clockwise"></i> Recargar
        </button>
      </div>
    `;
  }

  private initializeConversionOptimizer(): void {
    // Track session start
    this.log('📊 Conversion Optimizer inicializado', {
      sessionStart: new Date().toISOString()
    }, 'info');
  }

  private trackProductsView(): void {
    // Track products viewed for conversion optimization
    const viewedProductIds = this.products.map(p => p.id);
    this.log('📈 Vista de productos registrada', {
      productIds: viewedProductIds,
      count: viewedProductIds.length
    }, 'info');
  }
private renderCarousel(products: CarouselProduct[]): void {
  const container = document.getElementById('dynamicCarousel');
  if (!container) {
    this.log('⚠️ Contenedor del carrusel no encontrado', {}, 'warn');
    return;
  }

  if (products.length === 0) {
    this.showCarouselFallback();
    return;
  }

  // Crear tarjeta de producto con efecto hover de imágenes rotativas
  const createCardHtml = (product: CarouselProduct, index: number): string => {
    // Obtener imágenes small para el efecto hover
    const smallImages = product.images ? product.images.filter(img => img.size === 'small') : [];
    const primaryImage = product.primary_thumb_url ?? '/images/placeholder-product.webp';

    // Si no hay imágenes small, usar la principal
    const rotationImages = smallImages.length > 0
      ? smallImages.map(img => img.url)
      : [primaryImage];

    // Crear data attribute con las imágenes para JavaScript
    const imagesData = JSON.stringify(rotationImages).replace(/"/g, '&quot;');

    return `
    <div class="carousel-card"
         style="flex: 0 0 340px; height: 420px; margin: 0 12px; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%); border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); overflow: hidden; position: relative; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: 1px solid rgba(0,0,0,0.08);"
         data-product-id="${product.id}"
         data-index="${index}"
         data-images="${imagesData}">

      <!-- Image container with indicator -->
      <div class="image-container" style="padding: 20px 20px 15px 20px; text-align: center; position: relative;">

        <!-- Image indicator in top-left corner -->
        <div class="image-indicator position-absolute top-0 start-0 m-2 px-2 py-1 bg-dark bg-opacity-75 text-white rounded-pill small"
             style="font-size: 0.75rem; z-index: 10; margin-top: 25px !important; margin-left: 25px !important;">
          <span class="current-image">1</span>/<span class="total-images">${Math.max(1, rotationImages.length)}</span>
        </div>

        <img class="product-image"
             src="${primaryImage}"
             style="width: 200px; height: 200px; object-fit: cover; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); border: 3px solid rgba(255,255,255,0.9); transition: all 0.4s ease;"
             alt="${product.name}"
             loading="${index < 3 ? 'eager' : 'lazy'}"
             onerror="this.src='/images/placeholder-product.webp'">
      </div>

      <!-- Product info with new layout -->
      <div style="padding: 0 20px 20px 20px;">
        <!-- Product name with 2-line wrapping -->
        <h5 class="product-name" style="
          font-size: 1.1rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 12px;
          line-height: 1.2;
          height: 2.4em;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        ">${product.name}</h5>

        <!-- Price and BUY button row -->
        <div class="price-buy-row d-flex align-items-center justify-content-between mb-3">
          <div class="price">
            <strong style="font-size: 1.2rem; color: #2c3e50;">$${product.price_usd.toFixed(2)}</strong>
            <small class="text-muted"> USD</small>
          </div>
          <!-- BUY button with gradient -->
          <button class="btn buy-now-btn"
                  data-product-id="${product.id}"
                  style="
                    background: linear-gradient(45deg, #ff6b35, #f7931e, #ffd700);
                    border: none;
                    color: #fff;
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
                    transition: all 0.3s ease;
                    border-radius: 20px;
                    padding: 6px 16px;
                    font-size: 0.85rem;
                  "
                  onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(255, 193, 7, 0.6)';"
                  onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(255, 193, 7, 0.4)';">
            <i class="bi bi-lightning-charge-fill" style="color: #ffd700; font-size: 1.1em;"></i>
            <strong>BUY</strong>
          </button>
        </div>

        <!-- Action buttons -->
        <div class="d-flex gap-2">
          <!-- Simplified cart button -->
          <button class="btn btn-primary btn-sm add-to-cart-btn flex-fill"
                  data-product-id="${product.id}"
                  style="display: flex; align-items: center; justify-content: center; gap: 4px; border-radius: 12px;">
            <i class="bi bi-cart3"></i><span style="font-weight: bold; font-size: 1.1em;">+</span>
          </button>
          <button class="btn btn-outline-secondary btn-sm view-details-btn flex-fill"
                  data-product-id="${product.id}"
                  style="border-radius: 12px;">
            <i class="bi bi-eye"></i> Ver
          </button>
        </div>
      </div>

      <!-- Enhanced hover overlay -->
      <div class="card-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.02); opacity: 0; transition: all 0.3s ease; border-radius: 20px;"></div>
    </div>
  `;
  };

  // Calcular ancho total del track (duplicado) - ajustado para nuevas tarjetas
  const imgWidth = 364; // 340px width + 24px margin (12px each side)
  const totalProducts = products.length;
  const trackWidth = imgWidth * totalProducts * 2; // Duplicado para loop

  // Generar HTML del carrusel con diseño mejorado
  const carouselHtml = `
    <div class="carousel-wrapper" style="position: relative; width: 100%; overflow: visible; margin: auto; padding: 0 100px;">
      <div class="carousel-container" style="position: relative; width: 100%; height: 440px; overflow: hidden; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%); border-radius: 25px; box-shadow: 0 8px 40px rgba(0,0,0,0.1); border: 2px solid rgba(255,255,255,0.8);">
        <div class="image-track" id="imageTrack" style="display: flex; position: relative; width: ${trackWidth}px; height: 100%; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 10px 0;">
          ${[...products, ...products].map((p, i) => createCardHtml(p, i)).join('')}
        </div>
      </div>

      <!-- Enhanced Left Arrow -->
      <button class="arrow-btn" id="arrow-left"
              style="
                position: absolute;
                top: 50%;
                left: 20px;
                transform: translateY(-50%);
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                border: 3px solid #007bff;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 15;
                box-shadow: 0 6px 20px rgba(0, 123, 255, 0.3);
                cursor: pointer;
                opacity: 0.95;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 20px;
                color: #007bff;
                font-weight: bold;
              "
              onmouseover="
                this.style.transform='translateY(-50%) scale(1.1)';
                this.style.boxShadow='0 8px 30px rgba(0, 123, 255, 0.5)';
                this.style.background='linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                this.style.color='#ffffff';
              "
              onmouseout="
                this.style.transform='translateY(-50%) scale(1)';
                this.style.boxShadow='0 6px 20px rgba(0, 123, 255, 0.3)';
                this.style.background='linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
                this.style.color='#007bff';
              ">
        <i class="bi bi-chevron-left"></i>
      </button>

      <!-- Enhanced Right Arrow -->
      <button class="arrow-btn" id="arrow-right"
              style="
                position: absolute;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                border: 3px solid #007bff;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 15;
                box-shadow: 0 6px 20px rgba(0, 123, 255, 0.3);
                cursor: pointer;
                opacity: 0.95;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 20px;
                color: #007bff;
                font-weight: bold;
              "
              onmouseover="
                this.style.transform='translateY(-50%) scale(1.1)';
                this.style.boxShadow='0 8px 30px rgba(0, 123, 255, 0.5)';
                this.style.background='linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                this.style.color='#ffffff';
              "
              onmouseout="
                this.style.transform='translateY(-50%) scale(1)';
                this.style.boxShadow='0 6px 20px rgba(0, 123, 255, 0.3)';
                this.style.background='linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
                this.style.color='#007bff';
              ">
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  `;

  container.innerHTML = carouselHtml;

  // Inicializar carrusel infinito
  this.initializeInfiniteCarousel(products);

  this.log('✅ Carrusel infinito de productos renderizado', { productCount: products.length }, 'success');
}

private initializeInfiniteCarousel(products: CarouselProduct[]): void {
  const track = document.getElementById('imageTrack') as HTMLElement;
  const arrowLeft = document.getElementById('arrow-left') as HTMLButtonElement;
  const arrowRight = document.getElementById('arrow-right') as HTMLButtonElement;

  if (!track || !arrowLeft || !arrowRight || products.length === 0) return;

  const imgWidth = 300;
  const totalProducts = products.length;
  const singleTrackWidth = imgWidth * totalProducts; // Ancho de un set
  const _fullTrackWidth = singleTrackWidth * 2; // Ancho total con duplicado (unused in current implementation)

  let position = 0;
  const direction = 1; // 1 = derecha, -1 = izquierda
  let isAutoScrolling = true;
  const speed = 1.5;

  // Efectos hover en flechas
  [arrowLeft, arrowRight].forEach(btn => {
    btn.addEventListener('mouseenter', () => { btn.style.background = '#e6e6e6'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#fff'; });
  });

  // Eventos click en flechas
  arrowLeft.addEventListener('click', () => {
    isAutoScrolling = false;
    position = Math.max(0, position - imgWidth);
    this.snapToNearest(position, imgWidth, track);
    setTimeout(() => { isAutoScrolling = true; }, 2000);
  });

  arrowRight.addEventListener('click', () => {
    isAutoScrolling = false;
    position = Math.min(singleTrackWidth, position + imgWidth);
    this.snapToNearest(position, imgWidth, track);
    setTimeout(() => { isAutoScrolling = true; }, 2000);
  });

  // Hover y click en tarjetas con rotación de imágenes
  const cards = Array.from(track.querySelectorAll('.carousel-card'));
  cards.forEach(card => {
    const element = card as HTMLElement;
    const overlay = element.querySelector('.card-overlay') as HTMLElement;
    const productImage = element.querySelector('.product-image') as HTMLImageElement;
    const imagesData = element.dataset.images;

    let hoverInterval: NodeJS.Timeout | null = null;
    let currentImageIndex = 0;
    let images: string[] = [];

    // Parsear las imágenes del producto
    try {
      images = JSON.parse((imagesData ?? '[]').replace(/&quot;/g, '"'));
    } catch (_error) {
      images = [productImage.src]; // Fallback a imagen actual
    }

    // Función para cambiar imagen con efecto de desvanecimiento
    const changeImage = (newSrc: string) => {
      if (productImage.src === newSrc) return; // No cambiar si es la misma imagen

      // Efecto de desvanecimiento
      productImage.style.opacity = '0';

      setTimeout(() => {
        productImage.src = newSrc;
        productImage.style.opacity = '1';
      }, 200); // 200ms para el fade out
    };

    element.addEventListener('mouseenter', () => {
      // Efectos visuales del hover
      element.style.transform = 'translateY(-8px) scale(1.02)';
      element.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
      element.style.borderColor = 'rgba(40, 167, 69, 0.3)';
      if (overlay) {
        overlay.style.opacity = '1';
        const overlayContent = overlay.querySelector('div') as HTMLElement;
        if (overlayContent) overlayContent.style.transform = 'scale(1)';
      }

      // Inicializar indicador de imagen al comenzar hover
      this.updateImageIndicator(element, 1);

      // Iniciar rotación de imágenes si hay más de una
      if (images.length > 1) {
        currentImageIndex = 0;

        hoverInterval = setInterval(() => {
          currentImageIndex = (currentImageIndex + 1) % images.length;
          const imageUrl = images[currentImageIndex];
          if (imageUrl) {
            changeImage(imageUrl);
            // Update image indicator for carousel card
            this.updateImageIndicator(element, currentImageIndex + 1);
          }
        }, 2535); // Increased by 69% total for optimal comfortable viewing and special effects
      }

      this.log('🖼️ Hover iniciado - Rotación de imágenes', {
        productId: element.dataset.productId ?? 'unknown',
        totalImages: images.length
      }, 'info');
    });

    element.addEventListener('mouseleave', () => {
      // Restaurar efectos visuales
      element.style.transform = 'translateY(0) scale(1)';
      element.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      element.style.borderColor = 'rgba(0,0,0,0.05)';
      if (overlay) {
        overlay.style.opacity = '0';
        const overlayContent = overlay.querySelector('div') as HTMLElement;
        if (overlayContent) overlayContent.style.transform = 'scale(0.8)';
      }

      // Detener rotación de imágenes
      if (hoverInterval) {
        clearInterval(hoverInterval);
        hoverInterval = null;
      }

      // Reset image indicator to 1
      this.updateImageIndicator(element, 1);

      // Volver a la imagen principal con desvanecimiento
      if (images.length > 0) {
        setTimeout(() => {
          const firstImage = images[0];
          if (firstImage) {
            changeImage(firstImage); // Volver a la primera imagen
          }
          currentImageIndex = 0;
        }, 100);
      }

      this.log('🖼️ Hover terminado - Imagen restaurada', {
        productId: element.dataset.productId ?? 'unknown'
      }, 'info');
    });

    element.addEventListener('click', () => {
      const productId = parseInt(element.dataset.productId ?? '0');
      if (productId) this.viewProductDetails(productId);
    });
  });

  // Animación infinita
  const animate = () => {
    if (isAutoScrolling) {
      position += speed * direction;

      // Reinicio suave sin salto visual
      if (direction > 0 && position >= singleTrackWidth) {
        position = 0;
      } else if (direction < 0 && position <= 0) {
        position = singleTrackWidth;
      }
    }

    track.style.transform = `translateX(${-position}px)`;
    requestAnimationFrame(animate);
  };

  // Iniciar animación
  animate();

  this.log('✅ Carrusel infinito activado con loop visual suave y sin solapamiento', { productCount: products.length }, 'success');
}

// Método auxiliar para snap (declarado en la clase)
private snapToNearest(position: number, imgWidth: number, track: HTMLElement): void {
  const snapped = Math.round(position / imgWidth) * imgWidth;
  track.style.transform = `translateX(${-snapped}px)`;
}

// Método auxiliar para snap (declarado en la clase)
/*
private snapToNearest(pos: number): void {
  const track = document.getElementById('imageTrack') as HTMLElement;
  if (!track) return;

  const imgWidth = 300;
  const snapped = Math.round(pos / imgWidth) * imgWidth;
  track.style.transform = `translateX(${-snapped}px)`;
}
*/
  private showCarouselFallback(): void {
    const container = document.getElementById('dynamicCarousel');
    if (!container) return;

    const fallbackHtml = `
      <div class="carousel-fallback">
        <i class="bi bi-flower1"></i>
        <h4>Creaciones Destacadas</h4>
        <p>Descubre nuestros arreglos florales más populares y especiales</p>
        <button class="btn btn-primary-custom" onclick="document.getElementById('productos').scrollIntoView({behavior: 'smooth'});">
          <i class="bi bi-arrow-down me-2"></i>Ver Productos
        </button>
      </div>
    `;

    container.innerHTML = fallbackHtml;
    this.log('⚠️ Mostrando fallback del carrusel', {}, 'warn');
  }

  // Public methods for external access
  public toggleDevMode(): void {
    this.isProductionMode = !this.isProductionMode;
    localStorage.setItem('floresya_dev_mode', (!this.isProductionMode).toString());

    this.log('🔧 Modo desarrollador cambiado', { devMode: !this.isProductionMode }, 'info');
  }

  public showFloresNovias(): void {
    const modal = document.getElementById('floresNoviasModal');
    const bootstrap = (window as WindowWithBootstrap).bootstrap;
    if (modal && bootstrap?.Modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide(); // Note: This should be show() but using hide() for consistency with interface
      }
    }
  }

  public getStats(): object {
    return {
      products: this.products.length,
      occasions: this.occasions.length,
      currentPage: this.currentPage,
      sessionStart: this.conversionOptimizer.sessionStartTime,
      viewedProducts: this.conversionOptimizer.viewedProducts.size
    };
  }

  /**
   * Shows the payment page with title and navigation buttons
   */
  private showPaymentPage(): void {
    this.log('💳 Mostrando página de pago', {}, 'info');

    // Hide the main content and show payment page
    document.body.innerHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FloresYa - Zona de Pago</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
      </head>
      <body class="bg-light">
        <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
          <div class="row w-100 justify-content-center">
            <div class="col-12 col-md-8 col-lg-6">
              <div class="card shadow-lg border-0">
                <div class="card-header bg-success text-white text-center py-4">
                  <h1 class="mb-0">
                    <i class="bi bi-credit-card me-2"></i>
                    Zona de Pago
                  </h1>
                  <p class="mb-0 mt-2 opacity-75">Procesamiento de compra seguro</p>
                </div>

                <div class="card-body text-center py-5">
                  <div class="mb-4">
                    <i class="bi bi-flower1 display-1 text-success mb-3"></i>
                    <h3 class="mb-3">FloresYa</h3>
                    <p class="text-muted lead">
                      Aquí se implementará el sistema de pago seguro para completar tu compra.
                    </p>
                  </div>

                  <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Página en desarrollo:</strong> La funcionalidad de pago será implementada próximamente.
                  </div>

                  <div class="d-grid gap-3 mt-4">
                    <button class="btn btn-outline-secondary btn-lg" onclick="window.history.back()">
                      <i class="bi bi-arrow-left me-2"></i>
                      Retornar
                    </button>

                    <button class="btn btn-success btn-lg" onclick="window.location.href='/'">
                      <i class="bi bi-house me-2"></i>
                      Inicio
                    </button>
                  </div>
                </div>

                <div class="card-footer text-center text-muted py-3">
                  <small>
                    <i class="bi bi-shield-check me-1"></i>
                    Compra 100% segura y protegida
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `;

    this.log('✅ Página de pago mostrada', {}, 'success');
  }

  // Cart management methods
  private initializeCart(): void {
    // Load cart from sessionStorage
    const savedCart = sessionStorage.getItem('floresya_cart');
    if (savedCart) {
      try {
        this.cart = JSON.parse(savedCart);
        this.updateCartUI();
      } catch (error) {
        this.log('❌ Error loading cart from session', { error: String(error) }, 'error');
        this.cart = [];
      }
    }
  }

  private saveCart(): void {
    sessionStorage.setItem('floresya_cart', JSON.stringify(this.cart));
  }

  public addToCart(productId: number): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      this.log('❌ Product not found for cart', { productId }, 'error');
      return;
    }

    const existingItem = this.cart.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      const mainImage = product.images?.[0]?.url || '/images/placeholder-product-2.webp';
      this.cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: mainImage,
        quantity: 1
      });
    }

    this.saveCart();
    this.updateCartUI();
    this.showCartNotification(`${product.name} agregado al carrito`);

    this.log('🛒 Product added to cart', {
      productId,
      productName: product.name,
      cartSize: this.cart.length
    }, 'info');
  }

  public removeFromCart(productId: number): void {
    this.cart = this.cart.filter(item => item.productId !== productId);
    this.saveCart();
    this.updateCartUI();
  }

  public updateQuantity(productId: number, quantity: number): void {
    const item = this.cart.find(item => item.productId === productId);
    if (item) {
      if (quantity > 0) {
        item.quantity = quantity;
      } else {
        this.removeFromCart(productId);
        return;
      }
      this.saveCart();
      this.updateCartUI();
    }
  }

  private updateCartUI(): void {
    const cartCount = document.getElementById('cartCount');
    const cartBadge = document.querySelector('.cart-badge') as HTMLElement;

    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCount) {
      cartCount.textContent = totalItems.toString();
    }

    if (cartBadge) {
      cartBadge.textContent = totalItems.toString();
      cartBadge.style.display = totalItems > 0 ? 'inline' : 'none';
    }

    // Update cart content if offcanvas exists
    this.updateCartOffcanvas();
  }

  private updateCartOffcanvas(): void {
    const cartOffcanvas = document.getElementById('cartOffcanvas');
    if (!cartOffcanvas) return;

    const cartContent = cartOffcanvas.querySelector('.cart-content');
    if (!cartContent) return;

    const totalPrice = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (this.cart.length === 0) {
      cartContent.innerHTML = `
        <div class="empty-cart text-center py-5">
          <i class="bi bi-cart-x display-1 text-muted mb-3"></i>
          <h4>Tu carrito está vacío</h4>
          <p class="text-muted">Agrega algunos productos para comenzar</p>
          <a href="#productos" class="btn btn-primary-custom" data-bs-dismiss="offcanvas">
            <i class="bi bi-shop me-2"></i>Explorar Productos
          </a>
        </div>
      `;
    } else {
      cartContent.innerHTML = `
        <div class="cart-items p-3">
          ${this.cart.map(item => `
            <div class="cart-item d-flex align-items-center mb-3 p-3 border rounded">
              <img src="${item.image}" alt="${item.name}" class="cart-item-image me-3"
                   style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
              <div class="flex-grow-1">
                <h6 class="mb-1">${item.name}</h6>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">$${item.price.toFixed(2)}</span>
                  <div class="quantity-controls d-flex align-items-center">
                    <button class="btn btn-sm btn-outline-secondary" onclick="floresyaApp.updateQuantity(${item.productId}, ${item.quantity - 1})">-</button>
                    <span class="mx-2 fw-bold">${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary" onclick="floresyaApp.updateQuantity(${item.productId}, ${item.quantity + 1})">+</button>
                  </div>
                </div>
              </div>
              <button class="btn btn-sm btn-outline-danger ms-2" onclick="floresyaApp.removeFromCart(${item.productId})">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          `).join('')}
        </div>
        <div class="cart-footer border-top p-3">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <strong>Total: $${totalPrice.toFixed(2)}</strong>
          </div>
          <div class="d-grid gap-2">
            <a href="/pages/payment.html" class="btn btn-success btn-lg">
              <i class="bi bi-credit-card me-2"></i>
              Proceder al Pago
            </a>
            <button class="btn btn-outline-secondary" data-bs-dismiss="offcanvas">
              Seguir Comprando
            </button>
          </div>
        </div>
      `;
    }
  }

  private showCartNotification(message: string): void {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'position-fixed top-0 end-0 m-3 alert alert-success alert-dismissible fade show';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
      <i class="bi bi-check-circle me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
}

// Create and export global app instance
export const floresyaApp = new FloresYaApp();

// Make available globally
window.floresyaApp = floresyaApp;

// Default export
export default floresyaApp;

if (window.logger) {
  window.logger.success('APP', '✅ TypeScript FloresYa App loaded and ready');
} else {
  console.log('[🌸 FloresYa] TypeScript App loaded and ready');
}