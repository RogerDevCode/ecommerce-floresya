/**
 * 🌸 FloresYa Carousel Service - JavaScript Version
 * Servicio optimizado para manejar el carrusel con mejores transiciones y centrado
 */

class CarouselService {
  constructor(config = {}) {
    this.carouselElement = null;
    this.carouselInstance = null;
    this.images = [];
    this.containerId = '';
    
    this.config = {
      autoplay: config.autoplay ?? true,
      interval: config.interval ?? 4000,
      indicators: config.indicators ?? true,
      controls: config.controls ?? true,
      pauseOnHover: config.pauseOnHover ?? true,
      wrap: config.wrap ?? true,
      touch: config.touch ?? true,
      keyboard: config.keyboard ?? true,
      height: config.height ?? 400,
    };
  }

  async initialize(containerId, apiImages) {
    try {
      this.containerId = containerId;
      const container = document.getElementById(containerId);
      
      if (!container) {
        throw new Error(`Contenedor con ID ${containerId} no encontrado`);
      }

      if (!apiImages || apiImages.length === 0) {
        this.log('⚠️ No se proporcionaron imágenes, usando fallback', 'warn');
        this.renderFallback(container);
        return false;
      }

      // Convertir formato API a formato interno
      this.images = this.normalizeImages(apiImages);
      
      this.log(`🎠 Inicializando carrusel con ${this.images.length} imágenes`, 'info');
      
      this.renderLoadingState(container);
      await this.preloadImages();
      this.renderCarousel(container);
      await this.initializeBootstrapCarousel();
      this.setupEventListeners();
      
      this.log('✅ Carrusel inicializado correctamente', 'success');
      return true;
      
    } catch (error) {
      this.log(`❌ Error al inicializar: ${error.message}`, 'error');
      const container = document.getElementById(containerId);
      if (container) {
        this.renderFallback(container);
      }
      return false;
    }
  }

  normalizeImages(apiImages) {
    return apiImages.map((img, index) => {
      // Optimizar URLs de imágenes
      let optimizedUrl = img.image_url || img.url;
      if (optimizedUrl && optimizedUrl.includes('/large/')) {
        optimizedUrl = optimizedUrl.replace('/large/', '/medium/');
        optimizedUrl = optimizedUrl.replace('_large.webp', '_medium.webp');
        this.log(`🔄 Imagen optimizada: large → medium`, 'info');
      }

      return {
        id: img.id?.toString() || `carousel-${index}`,
        url: optimizedUrl || '/images/placeholder-carousel.jpg',
        alt: img.alt_text || img.alt || `Imagen ${index + 1}`,
        title: img.title || `Imagen ${index + 1}`,
        description: img.description,
        order: img.display_order || img.order || index
      };
    }).sort((a, b) => a.order - b.order);
  }

  renderLoadingState(container) {
    container.innerHTML = `
      <div class="carousel-loading">
        <div class="text-center">
          <div class="spinner-border mb-3" role="status" style="color: #FF69B4;">
            <span class="visually-hidden">Cargando carrusel...</span>
          </div>
          <p class="text-muted">Preparando imágenes optimizadas...</p>
        </div>
      </div>
    `;
  }

  async preloadImages() {
    this.log('🖼️ Precargando imágenes...', 'info');
    
    const preloadPromises = this.images.map((image) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.log(`✅ Imagen precargada: ${image.title}`, 'success');
          resolve();
        };
        img.onerror = () => {
          this.log(`⚠️ Error cargando: ${image.title}`, 'warn');
          // Usar imagen de fallback
          image.url = '/images/placeholder-product.webp';
          resolve();
        };
        img.src = image.url;
      });
    });

    await Promise.allSettled(preloadPromises);
    this.log('✅ Precarga de imágenes completada', 'success');
  }

  renderCarousel(container) {
    const carouselId = `floresyaCarousel-${Date.now()}`;
    
    const carouselHTML = `
      <div id="${carouselId}" class="carousel slide" 
           data-bs-ride="${this.config.autoplay ? 'carousel' : 'false'}" 
           data-bs-interval="${this.config.interval}" 
           data-bs-pause="${this.config.pauseOnHover ? 'hover' : 'false'}"
           data-bs-wrap="${this.config.wrap}" 
           data-bs-touch="${this.config.touch}" 
           data-bs-keyboard="${this.config.keyboard}">
        
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

  renderIndicators(carouselId) {
    return `
      <div class="carousel-indicators">
        ${this.images.map((_, index) => `
          <button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${index}" 
                  class="${index === 0 ? 'active' : ''}" 
                  aria-current="${index === 0 ? 'true' : 'false'}" 
                  aria-label="Ir a imagen ${index + 1}"></button>
        `).join('')}
      </div>
    `;
  }

  renderSlide(image, index) {
    return `
      <div class="carousel-item ${index === 0 ? 'active' : ''}">
        <img src="${image.url}" 
             class="d-block w-100 carousel-image" 
             alt="${image.alt}" 
             title="${image.title}"
             loading="${index === 0 ? 'eager' : 'lazy'}" 
             decoding="async"
             data-no-responsive="true"
             onerror="this.src='/images/placeholder-product.webp'; this.onerror=null;">
        
        ${image.title ? `
          <div class="carousel-caption d-none d-md-block">
            <h5>${image.title}</h5>
            ${image.description ? `<p>${image.description}</p>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderControls(carouselId) {
    return `
      <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev" aria-label="Imagen anterior">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Anterior</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next" aria-label="Siguiente imagen">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Siguiente</span>
      </button>
    `;
  }

  async initializeBootstrapCarousel() {
    if (!this.carouselElement) {
      throw new Error('Elemento carrusel no encontrado para inicialización');
    }

    // Esperar a que Bootstrap esté disponible
    if (typeof window.bootstrap === 'undefined') {
      await this.waitForBootstrap();
    }

    try {
      // Inicializar carrusel Bootstrap
      this.carouselInstance = new window.bootstrap.Carousel(this.carouselElement, {
        interval: this.config.interval,
        pause: this.config.pauseOnHover ? 'hover' : false,
        wrap: this.config.wrap,
        touch: this.config.touch,
        keyboard: this.config.keyboard
      });

      this.log('✅ Bootstrap carousel inicializado', 'success');
    } catch (error) {
      throw new Error(`Error inicializando Bootstrap: ${error.message}`);
    }
  }

  async waitForBootstrap() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkBootstrap = () => {
        attempts++;
        if (typeof window.bootstrap !== 'undefined') {
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

  setupEventListeners() {
    if (!this.carouselElement) return;

    this.carouselElement.addEventListener('slid.bs.carousel', (event) => {
      this.log(`🎠 Slide cambiado a: ${event.to}`, 'info');
    });

    this.carouselElement.addEventListener('slide.bs.carousel', (event) => {
      this.log(`🎠 Iniciando transición: ${event.from} → ${event.to}`, 'info');
    });
  }

  renderFallback(container) {
    container.innerHTML = `
      <div class="carousel-fallback">
        <i class="bi bi-flower1"></i>
        <h4>FloresYa - Belleza Natural</h4>
        <p>Descubre nuestros hermosos arreglos florales</p>
        <a href="#productos" class="btn btn-outline-primary btn-sm">
          <i class="bi bi-arrow-down-circle me-1"></i>
          Ver Productos
        </a>
      </div>
    `;
  }

  log(message, level = 'info') {
    const colors = {
      info: '#007bff',
      success: '#28a745',
      warn: '#ffc107',
      error: '#dc3545'
    };
    
    const style = `color: ${colors[level]}; font-weight: bold;`;
    console.log(`%c[🌸 Carousel] ${message}`, style);
  }

  async updateImages(newImages) {
    try {
      this.images = this.normalizeImages(newImages);
      
      if (this.carouselElement) {
        const container = document.getElementById(this.containerId);
        if (container) {
          await this.preloadImages();
          this.renderCarousel(container);
          await this.initializeBootstrapCarousel();
          this.setupEventListeners();
          this.log('✅ Imágenes actualizadas correctamente', 'success');
          return true;
        }
      }
      return false;
    } catch (error) {
      this.log(`❌ Error actualizando imágenes: ${error.message}`, 'error');
      return false;
    }
  }

  destroy() {
    if (this.carouselInstance) {
      try {
        this.carouselInstance.dispose();
        this.log('✅ Instancia Bootstrap destruida', 'success');
      } catch (error) {
        this.log(`⚠️ Error destruyendo instancia: ${error.message}`, 'warn');
      }
      this.carouselInstance = null;
    }
    
    if (this.carouselElement) {
      this.carouselElement.innerHTML = '';
      this.carouselElement = null;
    }
    
    this.images = [];
    this.containerId = '';
    this.log('✅ Carrusel destruido y recursos liberados', 'success');
  }

  getState() {
    return {
      isInitialized: !!this.carouselInstance,
      imagesCount: this.images.length,
      containerId: this.containerId,
      config: this.config
    };
  }
}

// Exportar instancia singleton
window.carouselService = new CarouselService();