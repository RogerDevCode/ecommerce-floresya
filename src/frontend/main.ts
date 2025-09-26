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
  ProductWithOccasion
} from "shared/types/index";

// Window interface extensions are now centralized in src/types/globals.ts.js

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
                    break;
        case 'warn':
                    break;
        default:
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
      const occasionsResponse = await api.getOccasions(); // ZOD VALIDATED
      if (occasionsResponse && typeof occasionsResponse === 'object' && 'success' in occasionsResponse && occasionsResponse.success && 'data' in occasionsResponse && Array.isArray(occasionsResponse.data)) {
        const typedResponse = occasionsResponse as { success: true; data: Occasion[] };
        this.occasions = typedResponse.data;
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

      const response = await window.api.getProducts(params); // ZOD VALIDATED

      if (response && typeof response === 'object' && 'success' in response && response.success && 'data' in response && response.data) {
        const typedResponse = response as { success: true; data: { products: Product[]; pagination?: Pagination } };
        let products = (typedResponse.data.products ?? []).map((p: Product) => {
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

        if (typedResponse.data.pagination) {
          this.renderPagination(typedResponse.data.pagination);
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
      if (window.api) {
        const response: Awaited<ReturnType<typeof window.api.getCarousel>> = await window.api.getCarousel(); // ZOD VALIDATED

        // Log detallado de la respuesta completa
        this.log('🔍 Respuesta completa del carousel API', {
          success: response && typeof response === 'object' && 'success' in response ? response.success : 'unknown',
          hasData: response && typeof response === 'object' && 'data' in response ? !!response.data : false,
          rawResponse: response
        }, 'info');

        if (response && typeof response === 'object' && 'success' in response && response.success && 'data' in response && response.data) {
          const typedResponse = response as { success: true; data: { carousel_products?: CarouselProduct[]; products?: CarouselProduct[] } };
          // Access carousel products with proper typing
          // The API response can have either 'products' or 'carousel_products' field for compatibility
          const carouselProducts = typedResponse.data.carousel_products || typedResponse.data.products || [];

          // Log detallado de los productos
          this.log('🔍 Productos del carousel recibidos', {
            hasProducts: !!carouselProducts,
            isArray: Array.isArray(carouselProducts),
            count: carouselProducts.length,
            firstProduct: carouselProducts[0] || null,
            allProductIds: carouselProducts.map(p => p.id)
          }, 'info');

          if (Array.isArray(carouselProducts) && carouselProducts.length > 0) {
            this.log('🎯 INICIANDO renderCarousel con productos', {
              productCount: carouselProducts.length,
              products: carouselProducts
            }, 'success');

            this.renderCarousel(carouselProducts);

            this.log('✅ Carrusel cargado desde API', {
              count: carouselProducts.length
            }, 'success');
            return;
          } else {
            this.log('⚠️ Array de productos vacío o inválido', {
              carouselProducts,
              type: typeof carouselProducts
            }, 'warn');
          }
        } else {
          this.log('❌ Respuesta API inválida', {
            success: response && typeof response === 'object' && 'success' in response ? response.success : 'unknown',
            data: response && typeof response === 'object' && 'data' in response ? response.data : undefined,
            message: response && typeof response === 'object' && 'message' in response ? response.message : undefined
          }, 'error');
        }
      } else {
        this.log('❌ window.api no disponible', {}, 'error');
      }

      // If API fails or returns no data, try to use regular products as fallback to show exactly 5
      this.log('🔄 API del carrusel no disponible, usando productos regulares como fallback para mostrar 5 productos', {}, 'info');
      if (this.products.length > 0) {
        // Use first 5 products as carousel items (or all if less than 5)
        // Map regular products to carousel products format to match expected type
        const carouselProducts = this.products.slice(0, 5).map((product, index) => ({
          ...product,
          id: product.id,
          name: product.name,
          summary: product.summary || product.description,
          price_usd: product.price_usd,
          carousel_order: product.carousel_order || index + 1,
          primary_image_url: product.primary_image_url,
          primary_thumb_url: product.primary_image_url || product.images?.[0]?.url || '/images/placeholder-product.webp',
          images: product.images
        }));

        this.renderCarousel(carouselProducts);
        this.log('✅ Carrusel cargado con productos regulares como fallback', {
          count: carouselProducts.length
        }, 'success');
      } else {
        // If no products at all are available, hide the carousel
        this.hideCarousel();
        this.log('ℹ️ No hay productos disponibles para el carrusel, ocultado', {}, 'info');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('❌ Error cargando carrusel', { error: errorMessage }, 'error');
      this.hideCarousel();
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
    // Optimized image selection for better visual impact
    const smallImage = product.images?.find(img => img.size === 'small');
    const primaryImage = product.primary_image_url;
    const fallbackImage = product.images?.[0];

    const imageToUse = smallImage ?? primaryImage ?? fallbackImage;
    const imageUrl = (typeof imageToUse === 'object' && imageToUse !== null && 'url' in imageToUse)
      ? imageToUse.url
      : (typeof imageToUse === 'string' ? imageToUse : '/images/placeholder-product.webp');

    // Medium images for hover gallery effect - use medium_images field if available
    const productImages = product.images ?? [];
    // Check if product has medium_images field (from ProductService)
    const mediumImagesArray = ('medium_images' in product && Array.isArray((product as any).medium_images))
      ? (product as any).medium_images as string[]
      : productImages
          .filter(img => img && img.url && img.size === 'medium')
          .map(img => img.url);

    const mediumImages = mediumImagesArray.slice(0, 5); // Limit to 5 images for performance
    const mediumImagesJson = JSON.stringify(mediumImages);

    // Price formatting with proper currency display
    const price = product.price_usd;
    const formattedPrice = isNaN(price) ? 'N/A' : price.toFixed(2);

    return `
      <article class="product-card container-query fade-in-up" data-product-id="${product.id}" data-medium-images='${mediumImagesJson}'>
        <!-- Premium Image Container -->
        <div class="product-card-image">
          <img src="${imageUrl}"
               alt="${product.name}"
               width="400"
               height="400"
               loading="lazy"
               decoding="async"
               onerror="this.src='/images/placeholder-product.webp'">

          <!-- Elegant Image Overlay with Quick View -->
          <div class="image-overlay">
            <button class="quick-view-btn view-details-btn"
                    data-product-id="${product.id}"
                    title="Vista rápida de ${product.name}"
                    aria-label="Ver detalles del producto">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
          </div>

          <!-- Clean Image Navigation for Multiple Images -->
          ${mediumImages.length > 1 ? `
          <div class="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button class="bg-white/80 backdrop-blur-sm text-gray-700 p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200 image-nav-prev"
                    data-product-id="${product.id}"
                    aria-label="Imagen anterior">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button class="bg-white/80 backdrop-blur-sm text-gray-700 p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200 image-nav-next"
                    data-product-id="${product.id}"
                    aria-label="Siguiente imagen">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
          ` : ''}

          <!-- Simple Image Counter -->
          ${mediumImages.length > 1 ? `
          <div class="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
            <span class="current-image">1</span>/<span class="total-images">${mediumImages.length}</span>
          </div>
          ` : ''}
        </div>

        <!-- Premium Product Information -->
        <div class="product-info">
          <!-- Product Title -->
          <h3 class="product-title">
            ${product.name}
          </h3>

          <!-- Product Description -->
          <p class="product-description">
            ${product.summary || 'Hermoso arreglo floral perfecto para cualquier ocasión especial.'}
          </p>

          <!-- Prominent Price Display -->
          <div class="product-price">
            $${formattedPrice}
            <span class="currency">USD</span>
          </div>

          <!-- Modern Action Buttons -->
          <div class="product-actions">
            <!-- Add to Cart Button (narrower with tooltip) -->
            <button class="product-btn product-btn-cart add-to-cart-btn"
                    data-product-id="${product.id}"
                    ${product.stock === 0 ? 'disabled aria-disabled="true"' : ''}
                    title="Agregar ${product.name} al carrito"
                    data-tooltip="Agregar al carrito">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 4M7 13l2.5 4M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z"/>
              </svg>
              <span class="btn-text">Carrito</span>
            </button>

            <!-- Buy Now Button -->
            <button class="product-btn product-btn-buy buy-now-btn"
                    data-product-id="${product.id}"
                    ${product.stock === 0 ? 'disabled aria-disabled="true"' : ''}
                    title="Comprar ${product.name} inmediatamente"
                    data-tooltip="Comprar ahora">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span class="btn-text">Comprar</span>
            </button>

            <!-- View Details Button -->
            <button class="product-btn product-btn-details view-details-btn"
                    data-product-id="${product.id}"
                    title="Ver detalles completos de ${product.name}"
                    data-tooltip="Ver detalles">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <span class="btn-text">Detalles</span>
            </button>
          </div>

          ${product.stock === 0 ? `
          <!-- Out of Stock Indicator -->
          <div class="mt-2 text-center text-sm text-gray-500 font-medium">
            Temporalmente agotado
          </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  private renderPagination(pagination: Pagination): void {
    const container = document.getElementById('pagination');
    if (!container) {return;}

    let html = '';

    // Previous button
    if (pagination.current_page > 1) {
      html += `
        <li class="hover:bg-gray-50">
          <a class="block px-3 py-2 border border-gray-300 rounded" href="#" data-page="${pagination.current_page - 1}">Anterior</a>
        </li>
      `;
    }

    // Page numbers
    const startPage = Math.max(1, pagination.current_page - 2);
    const endPage = Math.min(pagination.total_pages, pagination.current_page + 2);

    for (let page = startPage; page <= endPage; page++) {
      html += `
        <li class="${page === pagination.current_page ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 hover:bg-blue-50'}">
          <a class="block px-3 py-2 border border-gray-300 rounded" href="#" data-page="${page}">${page}</a>
        </li>
      `;
    }

    // Next button
    if (pagination.current_page < pagination.total_pages) {
      html += `
        <li class="hover:bg-gray-50">
          <a class="block px-3 py-2 border border-gray-300 rounded" href="#" data-page="${pagination.current_page + 1}">Siguiente</a>
        </li>
      `;
    }

    container.innerHTML = `<ul class="flex space-x-1">${html}</ul>`;
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

    // Carousel navigation events
  const carouselPrevBtn = document.getElementById('carousel-prev');
  const carouselNextBtn = document.getElementById('carousel-next');
  
  if (carouselPrevBtn) {
    carouselPrevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateCarousel('prev');
    });
  }
  
  if (carouselNextBtn) {
    carouselNextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.navigateCarousel('next');
    });
  }

  // Carousel indicator clicks
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('#carouselIndicators button')) {
      e.preventDefault();
      const button = target.closest('#carouselIndicators button');
      const slideIndex = parseInt(button.getAttribute('data-slide-index') ?? '0');
      if (!isNaN(slideIndex)) {
        this.goToCarouselSlide(slideIndex);
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

      // Bind navigation button events
      const prevBtn = cardElement.querySelector('.image-nav-prev');
      const nextBtn = cardElement.querySelector('.image-nav-next');

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.navigateProductImage(cardElement, 'prev');
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.navigateProductImage(cardElement, 'next');
        });
      }

      // Auto-cycle images on hover (optional)
      cardElement.addEventListener('mouseenter', () => {
        this.handleProductCardHover(cardElement, true);
      });

      cardElement.addEventListener('mouseleave', (e) => {
        const relatedTarget = (e).relatedTarget as HTMLElement;
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

  private navigateProductImage(card: HTMLElement, direction: 'prev' | 'next'): void {
    const productImage = card.querySelector('img');
    const imageIndicator = card.querySelector('.image-indicator');
    if (!productImage || !imageIndicator) return;

    // Get medium images from data attribute
    let mediumImages: string[] = [];
    try {
      const mediumImagesData = card.dataset.mediumImages ?? '[]';
      mediumImages = JSON.parse(mediumImagesData);
    } catch (error) {
      this.log('⚠️ Error parsing medium images', { error, card: card.dataset.productId }, 'warn');
      return;
    }

    if (mediumImages.length <= 1) return;

    // Get current image index
    const currentSrc = productImage.src;
    let currentIndex = mediumImages.findIndex(img => currentSrc.includes(img));
    if (currentIndex === -1) currentIndex = 0;

    // Calculate next index
    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % mediumImages.length;
    } else {
      nextIndex = (currentIndex - 1 + mediumImages.length) % mediumImages.length;
    }

    // Update image and counter
    productImage.src = mediumImages[nextIndex];

    const currentImageSpan = imageIndicator.querySelector('.current-image');
    if (currentImageSpan) {
      currentImageSpan.textContent = (nextIndex + 1).toString();
    }

    this.log('🖼️ Imagen navegada', {
      direction,
      currentIndex,
      nextIndex,
      productId: card.dataset.productId
    }, 'info');
  }

  private handleProductCardHover(card: HTMLElement, isEntering: boolean): void {
    const productImage = card.querySelector('img');
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
    const preloadImage = document.createElement('img');

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
      <div class="col-span-full text-center py-12">
        <i class="bi bi-flower1 text-6xl text-gray-400 mb-4 block"></i>
        <h4 class="text-gray-500 text-xl mb-2">No se encontraron productos</h4>
        <p class="text-gray-500 mb-6">Intenta ajustar tus filtros de búsqueda</p>
        <button class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors" onclick="location.reload()">
          <i class="bi bi-arrow-clockwise mr-2"></i>Recargar
        </button>
      </div>
    `;
  }

  private showErrorState(): void {
    const container = document.getElementById('productsContainer');
    if (!container) {return;}

    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="bi bi-exclamation-triangle text-6xl text-red-500 mb-4 block"></i>
        <h4 class="text-red-600 text-xl mb-2">Error al cargar productos</h4>
        <p class="text-gray-500 mb-6">Ha ocurrido un error. Intenta recargar la página.</p>
        <button class="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors" onclick="location.reload()">
          <i class="bi bi-arrow-clockwise mr-2"></i>Recargar
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
  this.log('🎨 EJECUTANDO renderCarousel', {
    productCount: products.length,
    firstProductId: products[0]?.id,
    firstProductName: products[0]?.name
  }, 'info');

  const indicators = document.getElementById('carouselIndicators');
  const slides = document.getElementById('carouselSlides');

  this.log('🔍 Verificando contenedores DOM', {
    hasIndicators: !!indicators,
    hasSlides: !!slides
  }, 'info');

  if (!indicators || !slides) {
    this.log('⚠️ Contenedores del carrusel no encontrados', {
      indicatorsElement: indicators,
      slidesElement: slides
    }, 'warn');
    return;
  }

  if (products.length === 0) {
    this.log('⚠️ Array de productos vacío en renderCarousel', {}, 'warn');
    this.hideCarousel();
    return;
  }

  // Generate modern indicators with smooth animations
  const indicatorsHtml = products.map((_, index) => `
    <button type="button"
            class="w-3 h-3 rounded-full transition-all duration-300 hover:scale-110 ${index === 0 ? 'bg-white shadow-lg' : 'bg-white/60 hover:bg-white/80'}"
            data-slide-index="${index}"
            aria-label="Ver producto ${index + 1}">
    </button>
  `).join('');

  // Generate premium magazine-style slides
  const slidesHtml = products.map((product, index) => {
    const primaryImage = product.primary_thumb_url ?? '/images/placeholder-product.webp';
    const isActive = index === 0 ? 'active' : '';
    const formattedPrice = product.price_usd.toFixed(2);

    return `
      <div class="carousel-slide ${isActive}" data-slide-index="${index}">
        <!-- Magazine Layout Container -->
        <div class="carousel-image-container">
          <img src="${primaryImage}"
               alt="${product.name}"
               loading="${index === 0 ? 'eager' : 'lazy'}"
               decoding="async"
               onerror="this.src='/images/placeholder-product.webp'">
        </div>

        <div class="carousel-content">
          <!-- Product Title -->
          <h2 class="carousel-title">
            ${product.name}
          </h2>

          <!-- Product Description -->
          <p class="carousel-description">
            ${product.summary || 'Hermoso arreglo floral creado especialmente para momentos únicos y ocasiones especiales.'}
          </p>

          <!-- Prominent Price -->
          <div class="carousel-price">
            $${formattedPrice}
          </div>

          <!-- Strong Call-to-Action -->
          <div class="flex gap-4">
            <button class="btn-primary carousel-cta add-to-cart-btn flex-1"
                    data-product-id="${product.id}"
                    title="Agregar ${product.name} al carrito">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 4M7 13l2.5 4M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z"/>
              </svg>
              Agregar al Carrito
            </button>

            <button class="btn-secondary view-details-btn"
                    data-product-id="${product.id}"
                    title="Ver detalles de ${product.name}">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update DOM with new content
  indicators.innerHTML = indicatorsHtml;
  slides.innerHTML = slidesHtml;

  // Set up slides with proper classes
  const allSlides = Array.from(slides.querySelectorAll('.carousel-slide'));
  allSlides.forEach((slide, index) => {
    const slideElement = slide as HTMLElement;
    if (index === 0) {
      slideElement.classList.add('active');
      slideElement.classList.remove('hidden');
    } else {
      slideElement.classList.remove('active');
      slideElement.classList.add('hidden');
    }
  });

  // Make sure carousel container is visible after rendering
  const container = document.getElementById('featuredCarousel');
  if (container) {
    container.style.display = 'block';
    this.log('✅ Carousel container made visible', {}, 'success');
  }

  this.log('✅ Carrusel configurado', {
    productCount: products.length,
    activeSlide: 0
  }, 'success');

  this.log('✅ Carrusel magazine renderizado', {
    productCount: products.length,
    style: 'magazine-layout'
  }, 'success');
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
  private hideCarousel(): void {
    const container = document.getElementById('featuredCarousel');
    if (container) {
      container.style.display = 'none';
      this.log('ℹ️ Carousel ocultado (sin productos)', {}, 'info');
    }
  }

  // Public methods for external access
  public toggleDevMode(): void {
    this.isProductionMode = !this.isProductionMode;
    localStorage.setItem('floresya_dev_mode', (!this.isProductionMode).toString());

    this.log('🔧 Modo desarrollador cambiado', { devMode: !this.isProductionMode }, 'info');
  }

  public showFloresNovias(): void {
    const modal = document.getElementById('floresNoviasModal');
    if (modal) {
      // Hide modal using custom implementation
      modal.classList.add('hidden');
      modal.classList.remove('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'bg-black', 'bg-opacity-50');
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

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min"></script>
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
    this.updateNavbarCartCount();
    this.showSuccessNotification(`¡${product.name} agregado al carrito!`, product.images?.[0]?.url);

    this.log('🛒 Product added to cart', {
      productId,
      productName: product.name,
      cartSize: this.cart.length,
      totalItems: this.cart.reduce((sum, item) => sum + item.quantity, 0)
    }, 'success');
  }

  public buyNow(productId: number): void {
    // Add to cart first
    this.addToCart(productId);

    // Redirect to payment page after brief delay
    setTimeout(() => {
      window.location.href = '/pages/payment.html';
    }, 500);
  }

  private updateNavbarCartCount(): void {
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    // Update cart badge in navbar
    const cartBadges = document.querySelectorAll('.cart-badge, #cart-badge, [data-cart-count]');
    cartBadges.forEach(badge => {
      if (badge instanceof HTMLElement) {
        badge.textContent = totalItems.toString();
        badge.style.display = totalItems > 0 ? 'block' : 'none';
        if (totalItems > 0) {
          badge.classList.add('animate-bounce');
          setTimeout(() => badge.classList.remove('animate-bounce'), 500);
        }
      }
    });

    // Update cart link text
    const cartLinks = document.querySelectorAll('.cart-link-text');
    cartLinks.forEach(link => {
      if (link instanceof HTMLElement) {
        link.textContent = `Carrito (${totalItems})`;
      }
    });
  }

  private showSuccessNotification(message: string, productImage?: string): void {
    this.showNotification(message, 'success', productImage);
  }

  private showErrorNotification(message: string): void {
    this.showNotification(message, 'error');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info', productImage?: string): void {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.floresya-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification
    const notification = document.createElement('div');
    notification.className = `floresya-notification notification-${type}`;

    const iconClass = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info';
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

    notification.innerHTML = `
      <div class="notification-content">
        ${productImage ? `<img src="${productImage}" alt="Producto" class="notification-image">` : ''}
        <div class="notification-text">
          <div class="notification-icon ${bgColor}">
            <i data-lucide="${iconClass}"></i>
          </div>
          <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i data-lucide="x"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Initialize Lucide icons in the notification
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }

    // Show with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 4000);
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
  
  // Carousel navigation methods
  private navigateCarousel(direction: 'prev' | 'next'): void {
    const slidesContainer = document.getElementById('carouselSlides');
    if (!slidesContainer) {
      this.log('⚠️ Carousel container no encontrado', {}, 'warn');
      return;
    }
    
    const slides = Array.from(slidesContainer.querySelectorAll('.carousel-slide'));
    if (slides.length === 0) {
      this.log('⚠️ No hay slides para navegar', {}, 'warn');
      return;
    }
    
    // Find current active slide index
    let currentIndex = -1;
    slides.forEach((slide, index) => {
      if (!slide.classList.contains('hidden')) {
        currentIndex = index;
      }
    });
    
    // If no slide is currently active, default to first slide
    if (currentIndex === -1) {
      currentIndex = 0;
    }
    
    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % slides.length;
    } else { // prev
      nextIndex = (currentIndex - 1 + slides.length) % slides.length;
    }
    
    this.goToCarouselSlide(nextIndex);
  }
  
  private goToCarouselSlide(index: number): void {
    const slidesContainer = document.getElementById('carouselSlides');
    if (!slidesContainer) {
      this.log('⚠️ Carousel container no encontrado', {}, 'warn');
      return;
    }
    
    const slides = Array.from(slidesContainer.querySelectorAll('.carousel-slide'));
    const indicatorsContainer = document.getElementById('carouselIndicators');
    if (!indicatorsContainer) {
      this.log('⚠️ Carousel indicators container no encontrado', {}, 'warn');
      return;
    }
    
    const indicators = Array.from(indicatorsContainer.querySelectorAll('button'));
    
    // Validate index
    if (index < 0 || index >= slides.length) {
      this.log('⚠️ Índice de slide inválido', { index, max: slides.length - 1 }, 'warn');
      return;
    }
    
    // Update slide visibility using CSS classes
    slides.forEach((slide, idx) => {
      const slideElement = slide as HTMLElement;
      if (idx === index) {
        slideElement.classList.add('active');
        slideElement.classList.remove('hidden');
      } else {
        slideElement.classList.remove('active');
        slideElement.classList.add('hidden');
      }
    });
    
    // Update indicators
    indicators.forEach((indicator, idx) => {
      if (idx === index) {
        indicator.classList.remove('bg-gray-400');
        indicator.classList.add('bg-white');
      } else {
        indicator.classList.remove('bg-white');
        indicator.classList.add('bg-gray-400');
      }
    });
    
    this.log('✅ Navegación al slide completada', { index }, 'info');
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