/**
 * 🌸 FloresYa Professional Carousel Service - TypeScript
 * Enhanced carousel with industry-standard features and TypeScript typing
 * Migrated from legacy carousel.js with professional TypeScript implementation
 */

import type { 
  CarouselImage, 
  CarouselConfig, 
  CarouselState, 
  CarouselEvents,
  BootstrapCarousel,
  ApiCarouselImage,
  LogLevel 
} from '@shared/types/carousel.js';

export class CarouselService {
  private carouselElement: HTMLElement | null = null;
  private carouselInstance: BootstrapCarousel | null = null;
  private images: CarouselImage[] = [];
  private containerId: string = '';
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private config: CarouselConfig;
  private state: CarouselState;
  private events: CarouselEvents;

  constructor(config: Partial<CarouselConfig> = {}, events: CarouselEvents = {}) {
    // Default configuration with professional standards
    this.config = {
      autoplay: config.autoplay ?? true,
      interval: config.interval ?? 5000,
      indicators: config.indicators ?? true,
      controls: config.controls ?? true,
      pauseOnHover: config.pauseOnHover ?? true,
      wrap: config.wrap ?? true,
      touch: config.touch ?? true,
      keyboard: config.keyboard ?? true,
      height: config.height ?? 500,
      width: config.width ?? '100%',
      theme: config.theme ?? 'default',
    };

    // Event callbacks
    this.events = events;

    // Internal state
    this.state = {
      isInitialized: false,
      isLoading: false,
      currentSlide: 0,
      totalSlides: 0,
      imagesCount: 0,
      containerId: '',
      config: this.config,
      errors: []
    };

    this.log('🎠 CarouselService initialized', 'info');
  }

  /**
   * Initialize carousel with enhanced error handling and performance optimization
   */
  public async initialize(containerId: string, apiImages: ApiCarouselImage[]): Promise<boolean> {
    try {
      this.state.isLoading = true;
      this.containerId = containerId;
      this.state.containerId = containerId;
      
      const container = document.getElementById(containerId);
      
      if (!container) {
        throw new Error(`Contenedor con ID ${containerId} no encontrado`);
      }

      if (!apiImages || apiImages.length === 0) {
        this.log('⚠️ No se proporcionaron imágenes, usando fallback', 'warn');
        this.renderFallback(container);
        this.state.isLoading = false;
        return false;
      }

      // Convertir y normalizar imágenes
      this.images = this.normalizeImages(apiImages);
      this.state.imagesCount = this.images.length;
      this.state.totalSlides = this.images.length;
      
      this.log(`🎠 Inicializando carrusel con ${this.images.length} imágenes`, 'info');
      
      // Renderizar estado de carga
      this.renderLoadingState(container);
      
      // Precargar imágenes con optimización
      await this.preloadImages();
      
      // Renderizar carrusel
      this.renderCarousel(container);
      
      // Inicializar Bootstrap
      await this.initializeBootstrapCarousel();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Configurar observadores para performance
      this.setupObservers();
      
      this.state.isInitialized = true;
      this.state.isLoading = false;
      
      this.log('✅ Carrusel inicializado correctamente', 'success');
      
      if (this.events.onLoad) {
        this.events.onLoad();
      }
      
      return true;
      
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.log(`❌ Error al inicializar: ${errorMessage}`, 'error');
      this.state.errors.push(errorMessage);
      this.state.isLoading = false;
      
      const container = document.getElementById(containerId);
      if (container) {
        this.renderFallback(container);
      }
      
      if (this.events.onError) {
        this.events.onError(error as Error);
      }
      
      return false;
    }
  }

  /**
   * Enhanced image normalization with optimization
   */
  private normalizeImages(apiImages: ApiCarouselImage[]): CarouselImage[] {
    return apiImages
      .filter((img) => img && (img.image_url || img.url)) // Filter invalid images
      .map((img, index) => {
        // Optimizar URLs de imágenes para performance
        let optimizedUrl = img.image_url || img.url || '';
        
        if (optimizedUrl && optimizedUrl.includes('/large/')) {
          optimizedUrl = optimizedUrl.replace('/large/', '/medium/');
          optimizedUrl = optimizedUrl.replace('_large.webp', '_medium.webp');
          this.log(`🔄 Imagen optimizada: large → medium`, 'debug');
        }

        return {
          id: (img.id?.toString() || `carousel-${index}`),
          url: optimizedUrl,
          alt: img.alt_text || img.alt || `Imagen FloresYa ${index + 1}`,
          title: img.title || `Imagen ${index + 1}`,
          description: img.description || undefined,
          order: img.display_order || img.order || index,
          is_active: img.is_active ?? (index === 0)
        };
      })
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Professional loading state with shimmer effect
   */
  private renderLoadingState(container: HTMLElement): void {
    container.innerHTML = `
      <div class="carousel-loading">
        <div class="text-center">
          <div class="spinner-border mb-3" role="status" style="color: var(--carousel-primary);">
            <span class="visually-hidden">Cargando carrusel...</span>
          </div>
          <p class="text-muted mb-0">Preparando imágenes optimizadas...</p>
          <small class="text-muted">FloresYa Professional Carousel</small>
        </div>
      </div>
    `;
  }

  /**
   * Enhanced preloading with progress tracking
   */
  private async preloadImages(): Promise<void> {
    this.log('🖼️ Precargando imágenes...', 'info');
    
    const preloadPromises = this.images.map((image, index) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          this.log(`✅ Imagen precargada: ${image.title}`, 'debug');
          if (this.events.onImageLoad) {
            this.events.onImageLoad(index, image);
          }
          resolve();
        };
        
        img.onerror = (error) => {
          this.log(`⚠️ Error cargando: ${image.title}`, 'warn');
          // Usar imagen de fallback
          image.url = this.getFallbackImageUrl();
          if (this.events.onImageError) {
            this.events.onImageError(index, image, error as unknown as Error);
          }
          resolve();
        };
        
        // Configuración de carga optimizada
        if ('loading' in img) {
          img.loading = index === 0 ? 'eager' : 'lazy';
        }
        if ('decoding' in img) {
          img.decoding = 'async';
        }
        img.src = image.url;
      });
    });

    await Promise.allSettled(preloadPromises);
    this.log('✅ Precarga de imágenes completada', 'success');
  }

  /**
   * Enhanced carousel rendering with theme support
   */
  private renderCarousel(container: HTMLElement): void {
    const carouselId = `floresyaCarousel-${Date.now()}`;
    const themeClass = `carousel-theme-${this.config.theme}`;
    
    const carouselHTML = `
      <div id="${carouselId}" 
           class="carousel slide ${themeClass}" 
           data-bs-ride="${this.config.autoplay ? 'carousel' : 'false'}" 
           data-bs-interval="${this.config.interval}" 
           data-bs-pause="${this.config.pauseOnHover ? 'hover' : 'false'}"
           data-bs-wrap="${this.config.wrap}" 
           data-bs-touch="${this.config.touch}" 
           data-bs-keyboard="${this.config.keyboard}"
           role="img"
           aria-label="Carrusel de imágenes FloresYa">
        
        ${this.config.indicators ? this.renderIndicators(carouselId) : ''}
        
        <div class="carousel-inner" style="height: ${this.config.height}px;">
          ${this.images.map((image, index) => this.renderSlide(image, index)).join('')}
        </div>
        
        ${this.config.controls ? this.renderControls(carouselId) : ''}
      </div>
    `;

    container.innerHTML = carouselHTML;
    this.carouselElement = document.getElementById(carouselId);
  }

  private renderIndicators(carouselId: string): string {
    return `
      <div class="carousel-indicators" role="tablist" aria-label="Indicadores del carrusel">
        ${this.images.map((_, index) => `
          <button type="button" 
                  data-bs-target="#${carouselId}" 
                  data-bs-slide-to="${index}" 
                  class="${index === 0 ? 'active' : ''}" 
                  aria-current="${index === 0 ? 'true' : 'false'}"
                  aria-label="Ir a imagen ${index + 1}"
                  role="tab"
                  aria-controls="carousel-slide-${index}"></button>
        `).join('')}
      </div>
    `;
  }

  private renderSlide(image: CarouselImage, index: number): string {
    return `
      <div class="carousel-item ${index === 0 ? 'active' : ''}" 
           id="carousel-slide-${index}"
           role="tabpanel"
           aria-label="${image.alt}">
        <img src="${image.url}" 
             class="d-block w-100 carousel-image" 
             alt="${image.alt}" 
             title="${image.title}"
             loading="${index === 0 ? 'eager' : 'lazy'}" 
             decoding="async"
             data-slide-index="${index}"
             data-no-responsive="true"
             width="${this.config.width}"
             height="${this.config.height}"
             onerror="this.src='${this.getFallbackImageUrl()}'; this.onerror=null;">
        
        ${image.title || image.description ? `
          <div class="carousel-caption d-none d-md-block">
            ${image.title ? `<h5>${this.escapeHtml(image.title)}</h5>` : ''}
            ${image.description ? `<p>${this.escapeHtml(image.description)}</p>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderControls(carouselId: string): string {
    return `
      <button class="carousel-control-prev" 
              type="button" 
              data-bs-target="#${carouselId}" 
              data-bs-slide="prev" 
              aria-label="Imagen anterior">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Anterior</span>
      </button>
      <button class="carousel-control-next" 
              type="button" 
              data-bs-target="#${carouselId}" 
              data-bs-slide="next" 
              aria-label="Siguiente imagen">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Siguiente</span>
      </button>
    `;
  }

  /**
   * Enhanced Bootstrap initialization with error handling
   */
  private async initializeBootstrapCarousel(): Promise<void> {
    if (!this.carouselElement) {
      throw new Error('Elemento carrusel no encontrado para inicialización');
    }

    // Esperar a que Bootstrap esté disponible
    if (typeof (window as any).bootstrap === 'undefined') {
      await this.waitForBootstrap();
    }

    try {
      const Bootstrap = (window as any).bootstrap;
      
      // Configuración avanzada del carrusel
      const carouselOptions = {
        interval: this.config.interval,
        pause: this.config.pauseOnHover ? 'hover' : false,
        wrap: this.config.wrap,
        touch: this.config.touch,
        keyboard: this.config.keyboard
      };

      this.carouselInstance = new Bootstrap.Carousel(this.carouselElement, carouselOptions);

      this.log('✅ Bootstrap carousel inicializado', 'success');
    } catch (error) {
      throw new Error(`Error inicializando Bootstrap: ${(error as Error).message}`);
    }
  }

  /**
   * Wait for Bootstrap to be available with timeout
   */
  private async waitForBootstrap(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      
      const checkBootstrap = () => {
        attempts++;
        if (typeof (window as any).bootstrap !== 'undefined') {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Bootstrap no se cargó en el tiempo esperado'));
        } else {
          setTimeout(checkBootstrap, 100);
        }
      };
      
      checkBootstrap();
    });
  }

  /**
   * Enhanced event listeners with proper cleanup
   */
  private setupEventListeners(): void {
    if (!this.carouselElement) return;

    // Bootstrap carousel events
    this.carouselElement.addEventListener('slid.bs.carousel', (event: any) => {
      this.state.currentSlide = event.to;
      this.log(`🎠 Slide cambiado a: ${event.to}`, 'debug');
      
      if (this.events.onSlideChanged) {
        this.events.onSlideChanged(event.to);
      }
    });

    this.carouselElement.addEventListener('slide.bs.carousel', (event: any) => {
      this.log(`🎠 Iniciando transición: ${event.from} → ${event.to}`, 'debug');
      
      if (this.events.onSlideChange) {
        this.events.onSlideChange(event.from, event.to);
      }
    });

    // Keyboard navigation enhancement
    this.carouselElement.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.prev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.next();
      }
    });

    // Touch gesture support
    let startX = 0;
    let endX = 0;

    this.carouselElement.addEventListener('touchstart', (event: TouchEvent) => {
      startX = event.touches[0].clientX;
    });

    this.carouselElement.addEventListener('touchend', (event: TouchEvent) => {
      endX = event.changedTouches[0].clientX;
      const threshold = 50;
      
      if (startX - endX > threshold) {
        this.next();
      } else if (endX - startX > threshold) {
        this.prev();
      }
    });
  }

  /**
   * Setup performance observers
   */
  private setupObservers(): void {
    // Intersection Observer for lazy loading
    if ('IntersectionObserver' in window && this.carouselElement) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src && !img.src) {
              img.src = img.dataset.src;
            }
          }
        });
      });

      // Observe carousel images
      const images = this.carouselElement.querySelectorAll('img[data-src]');
      images.forEach(img => this.intersectionObserver?.observe(img));
    }

    // Resize Observer for responsive adjustments
    if ('ResizeObserver' in window && this.carouselElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.carouselElement);
    }
  }

  /**
   * Handle responsive adjustments
   */
  private handleResize(): void {
    if (!this.carouselElement) return;
    
    const containerWidth = this.carouselElement.clientWidth;
    
    // Adjust height based on aspect ratio
    let newHeight: number;
    if (containerWidth < 576) {
      newHeight = 280;
    } else if (containerWidth < 768) {
      newHeight = 350;
    } else if (containerWidth < 1200) {
      newHeight = 450;
    } else {
      newHeight = 550;
    }
    
    this.config.height = newHeight;
    
    const carouselInner = this.carouselElement.querySelector('.carousel-inner') as HTMLElement;
    if (carouselInner) {
      carouselInner.style.height = `${newHeight}px`;
    }
  }

  /**
   * Enhanced fallback with better UX
   */
  private renderFallback(container: HTMLElement): void {
    container.innerHTML = `
      <div class="carousel-fallback">
        <i class="bi bi-flower1" aria-hidden="true"></i>
        <h4>FloresYa - Belleza Natural</h4>
        <p>Descubre nuestros hermosos arreglos florales</p>
        <div class="d-flex gap-2 justify-content-center">
          <button class="btn btn-outline-light btn-sm" onclick="location.reload()">
            <i class="bi bi-arrow-clockwise me-1"></i>
            Reintentar
          </button>
          <a href="#productos" class="btn btn-light btn-sm">
            <i class="bi bi-arrow-down-circle me-1"></i>
            Ver Productos
          </a>
        </div>
      </div>
    `;
  }

  // Public API methods
  public next(): void {
    this.carouselInstance?.next();
  }

  public prev(): void {
    this.carouselInstance?.prev();
  }

  public goTo(index: number): void {
    if (this.carouselInstance && index >= 0 && index < this.images.length) {
      this.carouselInstance.to(index);
    }
  }

  public play(): void {
    this.carouselInstance?.cycle();
  }

  public pause(): void {
    this.carouselInstance?.pause();
  }

  public getState(): CarouselState {
    return { ...this.state };
  }

  public updateConfig(newConfig: Partial<CarouselConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.state.config = this.config;
  }

  /**
   * Update images dynamically
   */
  public async updateImages(newImages: ApiCarouselImage[]): Promise<boolean> {
    try {
      this.images = this.normalizeImages(newImages);
      this.state.imagesCount = this.images.length;
      this.state.totalSlides = this.images.length;
      
      if (this.carouselElement) {
        const container = document.getElementById(this.containerId);
        if (container) {
          await this.preloadImages();
          this.renderCarousel(container);
          await this.initializeBootstrapCarousel();
          this.setupEventListeners();
          this.setupObservers();
          this.log('✅ Imágenes actualizadas correctamente', 'success');
          return true;
        }
      }
      return false;
    } catch (error) {
      this.log(`❌ Error actualizando imágenes: ${(error as Error).message}`, 'error');
      return false;
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Clean up Bootstrap instance
    if (this.carouselInstance) {
      try {
        this.carouselInstance.dispose();
        this.log('✅ Instancia Bootstrap destruida', 'success');
      } catch (error) {
        this.log(`⚠️ Error destruyendo instancia: ${(error as Error).message}`, 'warn');
      }
      this.carouselInstance = null;
    }

    // Clean up observers
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Clean up DOM
    if (this.carouselElement) {
      this.carouselElement.innerHTML = '';
      this.carouselElement = null;
    }
    
    // Reset state
    this.images = [];
    this.containerId = '';
    this.state.isInitialized = false;
    this.state.imagesCount = 0;
    this.state.totalSlides = 0;
    this.state.currentSlide = 0;
    this.state.errors = [];
    
    this.log('✅ Carrusel destruido y recursos liberados', 'success');
  }

  // Utility methods
  private getFallbackImageUrl(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDkwMCA1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNGRjY5QjQiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRjE0OTMiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iOTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0idXJsKCNhKSIvPjxjaXJjbGUgY3g9IjQ1MCIgY3k9IjI1MCIgcj0iODAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4zKSIvPjxwYXRoIGQ9Ik00NTAgMTkwQzQzNSAyMDAsIDQzMCAyMjAsIDQzNSAyNDVDNDQwIDI3MCwgNDYwIDI3MCwgNDY1IDI0NUM0NzAgMjIwLCA0NjUgMjAwLCA0NTAgMTkwWiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjQ1MCIgY3k9IjIwNSIgcj0iOCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjQ1MCIgeT0iMzIwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOSI+RmxvcmVzWWEgQ2Fycm91c2VsPC90ZXh0Pjwvc3ZnPg==';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private log(message: string, level: LogLevel = 'info'): void {
    const colors = {
      info: '#007bff',
      success: '#28a745',
      warn: '#ffc107',
      error: '#dc3545',
      debug: '#6c757d'
    };
    
    const style = `color: ${colors[level] || '#000000'}; font-weight: bold;`;
    
    if (level === 'debug' && !this.isDebugMode()) {
      return;
    }
    
    console.log(`%c[🌸 Carousel TS] ${message}`, style);
  }

  private isDebugMode(): boolean {
    return localStorage.getItem('floresya-debug') === 'true' || 
           (window as any).floresyaDebug === true;
  }
}

// Create and export singleton instance
export const carouselService = new CarouselService();

// Make available globally for compatibility
declare global {
  interface Window {
    carouselService: CarouselService;
  }
}

if (typeof window !== 'undefined') {
  window.carouselService = carouselService;
}