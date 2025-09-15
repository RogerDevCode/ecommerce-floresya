/**
 * 🌸 FloresYa Main Application - TypeScript Edition
 * Main application controller with full type safety
 */

// Import types and utilities
import type { Product, ProductWithImages, Occasion, ProductFilters, PaginationInfo as Pagination, LogData, WindowWithBootstrap, WindowWithCart, Logger } from '@frontend-types/*';
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
}

// Extend Window interface
declare global {
  interface Window {
    logger?: Logger;
    floresyaLogger?: Logger;
    api?: FloresYaAPI;
    floresyaApp?: FloresYaApp;
  }
}

export class FloresYaApp {
  private products: Product[];
  private occasions: Occasion[];
  private currentPage: number;
  private itemsPerPage: number;
  private currentFilters: ProductFilters;
  private isProductionMode: boolean;
  private conversionOptimizer: ConversionOptimizer;

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
      this.bindEvents();
      this.loadInitialData();
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

      // Load occasions first
      const occasionsResponse = await api.getOccasions();
      if (occasionsResponse.success && occasionsResponse.data) {
        this.occasions = occasionsResponse.data;
        this.populateOccasionFilter();
        this.populateOccasionsDropdown();
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
        this.products = (response.data.products || []).map(p => ({ ...p, images: (p as ProductWithImages).images || [] }));
        this.renderProducts(this.products as ProductWithImages[]);

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
        this.log('⚠️ No se pudieron cargar productos del carrusel', response, 'warn');
        this.showCarouselFallback();
      }
    } catch (error) {
      this.log('❌ Error cargando carrusel', {
        error: error instanceof Error ? error.message : String(error)
      }, 'error');
      this.showCarouselFallback();
    }
  }

  private renderProducts(products: ProductWithImages[]): void {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    if (products.length === 0) {
      this.showEmptyState();
      return;
    }

    const html = products.map(product => this.createProductCard(product)).join('');
    container.innerHTML = html;
  }

  private createProductCard(product: ProductWithImages): string {
    // Prefer small size image for product cards, fallback to primary, then any available
    const smallImage = product.images?.find(img => img.size === 'small');
    const primaryImage = product.primary_image;
    const fallbackImage = product.images?.[0];

    const imageToUse = smallImage || primaryImage || fallbackImage;
    const imageUrl = imageToUse?.url || '/images/placeholder-product.webp';

    // price_usd is already a number
    const price = product.price_usd;
    const formattedPrice = isNaN(price) ? 'N/A' : price.toFixed(2);

    return `
      <div class="col-md-4 col-lg-3 mb-4">
        <div class="card product-card h-100" data-product-id="${product.id}">
          <div class="card-img-wrapper">
            <img src="${imageUrl}"
                 class="card-img-top"
                 alt="${product.name}"
                 loading="lazy"
                 onerror="this.src='/images/placeholder-product.webp'">
            ${product.featured ? '<span class="badge badge-featured">Destacado</span>' : ''}
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text flex-grow-1">${product.summary}</p>
            <div class="product-meta">
              <div class="price">
                <strong>${formattedPrice}</strong>
                <small class="text-muted">USD</small>
              </div>
              <div class="stock ${product.stock < 5 ? 'low-stock' : ''}">
                ${product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
              </div>
            </div>
            <div class="card-actions mt-3">
              <button class="btn btn-primary btn-sm add-to-cart-btn"
                      data-product-id="${product.id}"
                      ${product.stock === 0 ? 'disabled' : ''}>
                <i class="bi bi-cart-plus"></i> Agregar
              </button>
              <button class="btn btn-outline-secondary btn-sm view-details-btn"
                      data-product-id="${product.id}">
                <i class="bi bi-eye"></i> Ver
              </button>
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

  private populateOccasionsDropdown(): void {
    const dropdown = document.getElementById('occasionsDropdownMenu');
    if (!dropdown) return;

    dropdown.innerHTML = this.occasions.map(occasion => `
      <li>
        <a class="dropdown-item" href="#" data-occasion="${occasion.slug}">
          ${occasion.name}
        </a>
      </li>
    `).join('');
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
        const page = parseInt(target.dataset.page || '1');
        this.changePage(page);
      }
    });

    // Product card events (delegated)
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.matches('.add-to-cart-btn') || target.closest('.add-to-cart-btn')) {
        const button = target.matches('.add-to-cart-btn') ? target : target.closest('.add-to-cart-btn') as HTMLElement;
        const productId = parseInt((button as HTMLElement)?.dataset?.productId || '0');
        if (productId) this.addToCart(productId);
      }

      if (target.matches('.view-details-btn') || target.closest('.view-details-btn')) {
        const button = target.matches('.view-details-btn') ? target : target.closest('.view-details-btn') as HTMLElement;
        const productId = parseInt((button as HTMLElement)?.dataset?.productId || '0');
        if (productId) this.viewProductDetails(productId);
      }
    });

    this.log('✅ Eventos vinculados', {}, 'success');
  }

  private handleSearch(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (!searchInput) return;

    this.currentFilters.search = searchInput.value.trim();
    this.currentPage = 1;
    this.loadProducts();

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
    this.loadProducts();

    this.log('🔽 Filtros aplicados', this.currentFilters, 'info');
  }

  private changePage(page: number): void {
    this.currentPage = page;
    this.loadProducts();

    // Scroll to products section
    const productsSection = document.getElementById('productos');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }

    this.log('📄 Página cambiada', { page }, 'info');
  }

  private addToCart(productId: number): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    // Use global cart instance if available
    if (typeof window !== 'undefined' && (window as WindowWithCart).cart) {
      (window as WindowWithCart).cart?.addItem({
        ...product,
        price_usd: product.price_usd || 0
      });
    }

    this.log('🛒 Producto agregado al carrito', { productId, productName: product.name }, 'info');
  }

  private viewProductDetails(productId: number): void {
    // Open product detail modal or navigate to product page
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    // Track conversion event
    this.conversionOptimizer.viewedProducts.add(productId);

    this.log('👁️ Detalles del producto visualizados', { productId, productName: product.name }, 'info');
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

  // Crear tarjeta de producto
  const createCardHtml = (product: CarouselProduct, index: number): string => `
    <div class="train-product-card" style="flex: 0 0 300px; height: 380px; margin: 10px; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%); border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; position: relative; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: 1px solid rgba(0,0,0,0.05);" data-product-id="${product.id}" data-index="${index}">
      <!-- Decorative background elements -->
      <div style="position: absolute; top: 15px; left: 15px; width: 40px; height: 40px; border-radius: 50%; background: rgba(220, 53, 69, 0.1);"></div>
      <div style="position: absolute; bottom: 15px; right: 15px; width: 30px; height: 30px; border-radius: 50%; background: rgba(40, 167, 69, 0.1);"></div>

      <!-- Product image -->
      <div style="padding: 30px 20px 20px 20px; text-align: center;">
        <img src="${product.primary_thumb_url}"
             style="width: 180px; height: 180px; object-fit: cover; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); border: 3px solid rgba(255,255,255,0.9); margin-bottom: 20px;"
             alt="${product.name}"
             loading="${index < 3 ? 'eager' : 'lazy'}"
             onerror="this.src='/images/placeholder-product.webp'">
      </div>

      <!-- Product info -->
      <div style="padding: 0 20px 25px 20px; text-align: center;">
        <h5 style="font-size: 1.1rem; font-weight: 700; color: #2c3e50; margin-bottom: 12px; line-height: 1.3;">${product.name}</h5>
        <div style="display: inline-block; background: rgba(40, 167, 69, 0.95); color: white; padding: 8px 16px; border-radius: 25px; font-weight: 700; font-size: 1rem; box-shadow: 0 3px 10px rgba(40, 167, 69, 0.4);">
          $${product.price_usd.toFixed(2)} USD
        </div>
      </div>

      <!-- Hover overlay -->
      <div class="train-card-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(40, 167, 69, 0.05); opacity: 0; transition: opacity 0.3s ease; display: flex; align-items: center; justify-content: center;">
        <div style="background: rgba(40, 167, 69, 0.9); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; transform: scale(0.8); transition: transform 0.3s ease;">
          <i class="bi bi-eye me-1"></i>Ver Detalles
        </div>
      </div>
    </div>
  `;

  // Calcular ancho total del track (duplicado)
  const imgWidth = 300; // 280 + 20 margen
  const totalProducts = products.length;
  const trackWidth = imgWidth * totalProducts * 2; // Duplicado para loop

  // Generar HTML del carrusel
  const carouselHtml = `
    <div class="carousel-wrapper" style="position: relative; width: 100%; overflow: visible; margin: auto; padding: 0 80px;">
      <div class="carousel-container" style="position: relative; width: 100%; height: 400px; overflow: hidden; background: #f9f9f9; border-radius: 20px;">
        <div class="image-track" id="imageTrack" style="display: flex; position: relative; width: ${trackWidth}px; height: 100%; will-change: transform; transition: transform 0.2s linear;">
          ${[...products, ...products].map((p, i) => createCardHtml(p, i)).join('')}
        </div>
      </div>
      <button class="arrow-btn" id="arrow-left" style="position: absolute; top: 50%; left: 80px; transform: translateY(-50%); background: #fff; border: 2px solid #333; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; z-index: 10; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer; opacity: 0.90; transition: background 0.2s;">
        &#9664;
      </button>
      <button class="arrow-btn" id="arrow-right" style="position: absolute; top: 50%; right: 80px; transform: translateY(-50%); background: #fff; border: 2px solid #333; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; z-index: 10; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer; opacity: 0.90; transition: background 0.2s;">
        &#9654;
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
  const fullTrackWidth = singleTrackWidth * 2; // Ancho total con duplicado

  let position = 0;
  let direction = 1; // 1 = derecha, -1 = izquierda
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

  // Hover y click en tarjetas
  const cards = Array.from(track.querySelectorAll('.train-product-card'));
  cards.forEach(card => {
    const element = card as HTMLElement;
    const overlay = element.querySelector('.train-card-overlay') as HTMLElement;

    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateY(-8px) scale(1.02)';
      element.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
      element.style.borderColor = 'rgba(40, 167, 69, 0.3)';
      if (overlay) overlay.style.opacity = '1';
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = 'translateY(0) scale(1)';
      element.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      element.style.borderColor = 'rgba(0,0,0,0.05)';
      if (overlay) overlay.style.opacity = '0';
    });

    element.addEventListener('click', () => {
      const productId = parseInt(element.dataset.productId || '0');
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
    if (modal && (window as WindowWithBootstrap).bootstrap) {
      const bootstrap = (window as WindowWithBootstrap).bootstrap as {
        Modal: new (element: Element) => { show(): void; hide(): void; dispose(): void; };
      };
      const modalInstance = new bootstrap.Modal(modal);
      modalInstance.show();
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