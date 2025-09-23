/**
 * 🌸 FloresYa Main Application - TypeScript Edition
 * Main application controller with full type safety
 */

// Import types and utilities
import type {
  ApiResponse,
  CarouselProduct,
  CarouselResponse,
  CartItem,
  ConversionOptimizer,
  Occasion,
  PaginationInfo as Pagination,
  Product,
  ProductQuery,
  ProductResponse,
  ProductWithImages,
  ProductWithOccasion,
  WindowWithBootstrap
} from '../shared/types/index.js';

// Window interface extensions are now centralized in src/types/globals.ts

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
      // FloresYa App initialized
    }

    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        void this.init().catch(error => this.log('Error en inicialización', { error }, 'error'));
      });
    } else {
      // DOM is already ready
      void this.init().catch(error => this.log('Error en inicialización', { error }, 'error'));
    }
  }

  private log(message: string, data: unknown = null, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
    // Use window.logger if available
    if (window.logger) {
      window.logger[level]('APP', message, data as Record<string, unknown> | null);
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
          console.warn(output, data);
          break;
      }
    }
  }

  public async init(): Promise<void> {
    this.log('🔄 Inicializando aplicación', {}, 'info');

    try {
      // Check if we're on the payment page
      if (window.location.pathname === '/payment') {
        this.showPaymentPage();
        return;
      }

      // Normal initialization for main page
      this.bindEvents();
      await this.loadInitialData();
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
      const occasionsResponse = await api.getOccasions() as ApiResponse<Occasion[]>;
      if (occasionsResponse.success && occasionsResponse.data) {
        this.occasions = occasionsResponse.data;
        this.populateOccasionFilter();
        this.log('✅ Ocasiones cargadas', { count: this.occasions.length }, 'success');
      } else {
        this.log('⚠️ No se pudieron cargar las ocasiones', occasionsResponse, 'warn');
      }

      // Initialize default filters from UI state
      this.initializeDefaultFilters();

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

      const response = await window.api.getProducts(params) as ApiResponse<ProductResponse>;

      if (response.success && response.data) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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

      const response = await window.api.getCarousel() as ApiResponse<CarouselResponse>;

      if (response.success && response.data) {
        // Check if carousel_products exists and is an array
        const carouselProducts = response.data.carousel_products || [];

        if (Array.isArray(carouselProducts) && carouselProducts.length > 0) {
          this.renderCarousel(carouselProducts);
          this.log('✅ Carrusel cargado', {
            count: carouselProducts.length
          }, 'success');
        } else {
          this.log('ℹ️ No hay productos para mostrar en el carrusel', {
            count: 0
          }, 'info');
          this.showCarouselFallback();
        }
      } else {
        // Check if it's a network/connectivity issue
        const responseWithMessage = response as { message?: unknown };
        const errorMessage = typeof responseWithMessage.message === 'string' ? responseWithMessage.message : 'Unknown error';
        const isConnectivityIssue = typeof errorMessage === 'string' && (
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('connectivity')
        );

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
    if (!container) {return;}

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
    const primaryImage = product.primary_image_url;
    const fallbackImage = product.images?.[0];

    const imageToUse = smallImage ?? primaryImage ?? fallbackImage;
    const imageUrl = (typeof imageToUse === 'object' && imageToUse !== null && 'url' in imageToUse)
      ? imageToUse.url
      : (typeof imageToUse === 'string' ? imageToUse : '/images/placeholder-product.webp');

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
            <h5 class="card-title product-name product-name-text">${product.name}</h5>

            <p class="card-text flex-grow-1 small">${product.summary}</p>

            <!-- Price and BUY button row -->
            <div class="price-buy-row d-flex align-items-center justify-content-between mb-3">
              <div class="price">
                <strong class="h5 mb-0">${formattedPrice}</strong>
                <small class="text-muted">USD</small>
              </div>
              <!-- BUY button with gradient and bright design -->
              <button class="btn buy-now-btn product-buy-btn"
                      data-product-id="${product.id}"
                      ${product.stock === 0 ? 'disabled' : ''}>
                <i class="bi bi-lightning-charge-fill" style="color: #ffd700; font-size: 1.2em;"></i>
                <strong>BUY</strong>
              </button>
            </div>

            <div class="card-actions mt-auto">
              <div class="d-flex gap-2">
                <!-- Simplified cart button with cart + plus -->
                <button class="btn btn-primary btn-sm add-to-cart-btn flex-fill product-cart-btn"
                        data-product-id="${product.id}"
                        ${product.stock === 0 ? 'disabled' : ''}>
                  <i class="bi bi-cart3"></i><span class="product-cart-plus">+</span>
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
    if (!container) {return;}

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
    if (!select) {return;}

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
        const button = target.matches('.add-to-cart-btn') ? target : target.closest('.add-to-cart-btn');
        if (!(button instanceof HTMLElement)) return;
        const productId = parseInt((button)?.dataset?.productId ?? '0');
        if (productId) {this.addToCart(productId);}
      }

      // Handle BUY button for direct purchase
      if (target.matches('.buy-now-btn') || target.closest('.buy-now-btn')) {
        const button = target.matches('.buy-now-btn') ? target : target.closest('.buy-now-btn');
        if (!(button instanceof HTMLElement)) return;
        const productId = parseInt((button)?.dataset?.productId ?? '0');
        if (productId) {this.buyNow(productId);}
      }

      if (target.matches('.view-details-btn') || target.closest('.view-details-btn')) {
        const button = target.matches('.view-details-btn') ? target : target.closest('.view-details-btn');
        if (!(button instanceof HTMLElement)) return;
        const productId = parseInt((button)?.dataset?.productId ?? '0');
        if (productId) {this.viewProductDetails(productId);}
      }

      // Handle click on product card or product image to view details
      if (target.matches('.product-card') || target.closest('.product-card')) {
        // Don't trigger if clicking on buttons
        if (!target.matches('.add-to-cart-btn, .buy-now-btn, .view-details-btn') &&
            !target.closest('.add-to-cart-btn, .buy-now-btn, .view-details-btn')) {

          const card = target.matches('.product-card') ? target : target.closest('.product-card');
          if (!(card instanceof HTMLElement)) return;
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
    if (!searchInput) {return;}

    this.currentFilters.search = searchInput.value.trim();
    this.currentPage = 1;
    void this.loadProducts();

    this.log('🔍 Búsqueda realizada', { query: this.currentFilters.search }, 'info');
  }

  private initializeDefaultFilters(): void {
    // Initialize filters based on the current UI state
    const occasionFilter = document.getElementById('occasionFilter') as HTMLSelectElement;
    const sortFilter = document.getElementById('sortFilter') as HTMLSelectElement;

    if (occasionFilter?.value) {
      this.currentFilters.occasion = parseInt(occasionFilter.value);
    }

    if (sortFilter?.value) {
      // Parse sort format: "field:direction" -> sort_by and sort_direction
      const [sortBy, sortDirection] = sortFilter.value.split(':');

      // Validate sort_by field
      const validSortFields = ['name', 'price_usd', 'created_at', 'carousel_order', 'stock'];
      if (sortBy && validSortFields.includes(sortBy)) {
        this.currentFilters.sort_by = sortBy as 'name' | 'price_usd' | 'created_at' | 'carousel_order' | 'stock';
      }

      // Validate sort_direction
      if (sortDirection && (sortDirection.toLowerCase() === 'asc' || sortDirection.toLowerCase() === 'desc')) {
        this.currentFilters.sort_direction = sortDirection.toLowerCase() as 'asc' | 'desc';
      }
    }

    this.log('🔧 Filtros por defecto inicializados', this.currentFilters, 'info');
  }

  private handleFilter(): void {
    const occasionFilter = document.getElementById('occasionFilter') as HTMLSelectElement;
    const sortFilter = document.getElementById('sortFilter') as HTMLSelectElement;

    if (occasionFilter) {
      this.currentFilters.occasion = parseInt(occasionFilter.value);
    }

    if (sortFilter?.value) {
      // Parse sort format: "field:direction" -> sort_by and sort_direction
      const [sortBy, sortDirection] = sortFilter.value.split(':');

      // Validate sort_by field
      const validSortFields = ['name', 'price_usd', 'created_at', 'carousel_order', 'stock'];
      if (sortBy && validSortFields.includes(sortBy)) {
        this.currentFilters.sort_by = sortBy as 'name' | 'price_usd' | 'created_at' | 'carousel_order' | 'stock';
      }

      // Validate sort_direction
      if (sortDirection && (sortDirection.toLowerCase() === 'asc' || sortDirection.toLowerCase() === 'desc')) {
        this.currentFilters.sort_direction = sortDirection.toLowerCase() as 'asc' | 'desc';
      }

      // Remove old sort property if it exists
      delete this.currentFilters.sort;
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
  public buyNow(productId: number): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) {return;}

    // Add to cart first
    if (typeof window !== 'undefined' && window.cart) {
      const cart = window.cart;
      if (cart && typeof cart.addItem === 'function') {
        cart.addItem({
          id: product.id,
          name: product.name,
          price_usd: product.price_usd ?? 0,
          quantity: 1
        });
      }
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
      const group = grouped.get(occasionName);
      if (group) {
        group.push(product);
      }
    });

    // Sort each group alphabetically by name
    grouped.forEach((groupProducts, _occasionName) => {
      groupProducts.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    });

    // Sort occasion groups alphabetically and flatten
    const sortedOccasions = Array.from(grouped.keys()).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );

    const result: ProductWithOccasion[] = [];
    sortedOccasions.forEach(occasionName => {
      const group = grouped.get(occasionName);
      if (group) {
        result.push(...group);
      }
    });

    this.log('📋 Productos ordenados por ocasión y nombre', {
      totalProducts: result.length,
      occasions: sortedOccasions.length
    }, 'info');

    return result;
  }

  public viewProductDetails(productId: number): void {
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
        const relatedTarget = (e).relatedTarget as HTMLElement;
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
    const productImage = card.querySelector('.card-img-top');
    if (!(productImage instanceof HTMLImageElement)) return;
    const productId = card.dataset.productId ?? 'unknown';

    if (!productImage) {return;}

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
      }, 1500); // Optimal image rotation timing based on UX guidelines

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
    if (imageElement.src === newImageUrl) {return;}

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
    if (!container) {return;}

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
    if (!container) {return;}

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
  const indicators = document.getElementById('carouselIndicators');
  const slides = document.getElementById('carouselSlides');

  if (!indicators || !slides) {
    this.log('⚠️ Contenedores del carrusel Bootstrap no encontrados', {}, 'warn');
    return;
  }

  if (products.length === 0) {
    this.showCarouselFallback();
    return;
  }

  // Generate indicators
  const indicatorsHtml = products.map((_, index) => `
    <button type="button"
            data-bs-target="#featuredCarousel"
            data-bs-slide-to="${index}"
            ${index === 0 ? 'class="active" aria-current="true"' : ''}
            aria-label="Slide ${index + 1}"></button>
  `).join('');

  // Generate slides using Bootstrap structure
  const slidesHtml = products.map((product, index) => {
    const primaryImage = product.primary_thumb_url ?? '/images/placeholder-product.webp';
    const isActive = index === 0 ? 'active' : '';

    return `
      <div class="carousel-item ${isActive}">
        <div class="row g-0">
          <div class="col-md-8">
            <img src="${primaryImage}"
                 class="d-block"
                 alt="${product.name}"
                 style="height: 150px; width: 150px; object-fit: cover; margin: 0 auto;"
                 onerror="this.src='/images/placeholder-product.webp'">
          </div>
          <div class="col-md-4 d-flex align-items-center bg-light">
            <div class="p-4 text-center w-100">
              <h5 class="card-title fw-bold mb-3">${product.name}</h5>
              <p class="card-text text-muted mb-3">${product.summary || 'Hermoso arreglo floral'}</p>
              <p class="h4 text-primary mb-3">$${product.price_usd.toFixed(2)}</p>
              <button class="btn btn-primary btn-lg add-to-cart-btn" data-product-id="${product.id}">
                <i class="bi bi-cart-plus me-2"></i>Comprar Ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update DOM
  indicators.innerHTML = indicatorsHtml;
  slides.innerHTML = slidesHtml;

  // Bootstrap carousel will initialize automatically via data-bs-ride="carousel"
  // Manual initialization can be added later if needed

  this.log('✅ Carrusel Bootstrap renderizado', { productCount: products.length }, 'success');
}

private initializeInfiniteCarousel(products: CarouselProduct[]): void {
  const track = document.getElementById('imageTrack');
  const arrowLeft = document.getElementById('arrow-left');
  const arrowRight = document.getElementById('arrow-right');

  if (!(track instanceof HTMLElement) || !(arrowLeft instanceof HTMLButtonElement) || !(arrowRight instanceof HTMLButtonElement)) {
    return;
  }

  if (!track || !arrowLeft || !arrowRight || products.length === 0) {return;}

  const imgWidth = 312;
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
    const element = card;
    if (!(element instanceof HTMLElement)) return;

    const overlay = element.querySelector('.card-overlay');
    if (!(overlay instanceof HTMLElement)) return;

    const productImage = element.querySelector('.product-image');
    if (!(productImage instanceof HTMLImageElement)) return;
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
      if (productImage.src === newSrc) {return;} // No cambiar si es la misma imagen

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
        if (overlayContent) {overlayContent.style.transform = 'scale(1)';}
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
        }, 1500); // Optimal image rotation timing based on UX guidelines
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
        if (overlayContent) {overlayContent.style.transform = 'scale(0.8)';}
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
      if (productId) {this.viewProductDetails(productId);}
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
    if (!container) {return;}

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
    const bootstrap = (window as unknown as WindowWithBootstrap).bootstrap;
    if (modal && bootstrap?.Modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance && typeof modalInstance.hide === 'function') {
        modalInstance.hide();
      }
    }
  }

  public showError(message: string): void {
    this.log(`❌ ${message}`, {}, 'error');
  }

  public showSuccess(message: string): void {
    this.log(`✅ ${message}`, {}, 'success');
  }

  public navigate(path: string): void {
    window.location.href = path;
  }

  public getStats(): Record<string, unknown> {
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
    const cartBadge = document.querySelector('.cart-badge');
    if (!(cartBadge instanceof HTMLElement)) return;

    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCount) {
      cartCount.textContent = totalItems.toString();
    }

    if (cartBadge) {
      cartBadge.textContent = totalItems.toString();
      if (totalItems > 0) {
        cartBadge.classList.remove('cart-badge');
      } else {
        cartBadge.classList.add('cart-badge');
      }
    }

    // Update cart content if offcanvas exists
    this.updateCartOffcanvas();
  }

  private updateCartOffcanvas(): void {
    const cartOffcanvas = document.getElementById('cartOffcanvas');
    if (!cartOffcanvas) {return;}

    const cartContent = cartOffcanvas.querySelector('.cart-content');
    if (!cartContent) {return;}

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
              <img src="${item.image}" alt="${item.name}" class="cart-item-image me-3">
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
  // TypeScript FloresYa App loaded and ready
}