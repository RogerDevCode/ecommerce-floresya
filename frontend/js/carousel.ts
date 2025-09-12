/**
 * @swagger
 * components:
 *   schemas:
 *     CarouselImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la imagen
 *         url:
 *           type: string
 *           format: uri
 *           description: URL de la imagen
 *         alt:
 *           type: string
 *           description: Texto alternativo para accesibilidad
 *         title:
 *           type: string
 *           description: Título de la imagen
 *         description:
 *           type: string
 *           description: Descripción opcional
 *         order:
 *           type: integer
 *           description: Orden de aparición en el carrusel
 */

export interface CarouselImage {
  id: string;
  url: string;
  alt: string;
  title: string;
  description?: string;
  order: number;
}

export interface CarouselConfig {
  autoplay: boolean;
  interval: number;
  indicators: boolean;
  controls: boolean;
  pauseOnHover: boolean;
  wrap: boolean;
  touch: boolean;
  keyboard: boolean;
  height: number;
}

/**
 * Servicio para manejar el carrusel de imágenes de FloresYa
 * Soluciona problemas de centrado, transiciones y visualización
 * @class CarouselService
 */
export class CarouselService {
  private carouselElement: HTMLElement | null = null;
  private carouselInstance: any = null;
  private images: CarouselImage[] = [];
  private config: CarouselConfig;
  private containerId: string = '';

  constructor(config: Partial<CarouselConfig> = {}) {
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

  /**
   * @swagger
   * /carousel/initialize:
   *   post:
   *     summary: Inicializar el carrusel
   *     description: Crea y configura el carrusel Bootstrap con las imágenes proporcionadas
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - containerId
   *               - images
   *             properties:
   *               containerId:
   *                 type: string
   *                 description: ID del contenedor donde se insertará el carrusel
   *               images:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/CarouselImage'
   *     responses:
   *       200:
   *         description: Carrusel inicializado exitosamente
   *       400:
   *         description: Error en los parámetros de entrada
   */
  public async initialize(containerId: string, images: any[]): Promise<boolean> {
    try {
      this.containerId = containerId;
      const container = document.getElementById(containerId);
      
      if (!container) {
        throw new Error(`Contenedor con ID ${containerId} no encontrado`);
      }

      if (!images || images.length === 0) {
        this.log('⚠️ No se proporcionaron imágenes, usando fallback', 'warn');
        this.renderFallback(container);
        return false;
      }

      // Convertir formato API a formato interno
      this.images = this.normalizeImages(images);
      
      this.log(`🎠 Inicializando carrusel con ${this.images.length} imágenes`, 'info');
      
      this.renderLoadingState(container);
      await this.preloadImages();
      this.renderCarousel(container);
      await this.initializeBootstrapCarousel();
      this.setupEventListeners();
      
      this.log('✅ Carrusel inicializado correctamente', 'success');
      return true;
      
    } catch (error) {
      this.log(`❌ Error al inicializar: ${(error as Error).message}`, 'error');
      const container = document.getElementById(containerId);
      if (container) {
        this.renderFallback(container);
      }
      return false;
    }
  }

  private normalizeImages(apiImages: any[]): CarouselImage[] {
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

  private renderLoadingState(container: HTMLElement): void {
    container.innerHTML = `
      <div class="carousel-loading">
        <div class="text-center">
          <div class="spinner-border mb-3" role="status">
            <span class="visually-hidden">Cargando carrusel...</span>
          </div>
          <p class="text-muted">Preparando imágenes optimizadas...</p>
        </div>
      </div>
    `;
  }

  private async preloadImages(): Promise<void> {
    this.log('🖼️ Precargando imágenes...', 'info');
    
    const preloadPromises = this.images.map((image) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.log(`✅ Imagen precargada: ${image.title}`, 'success');
          resolve();
        };
        img.onerror = () => {
          this.log(`⚠️ Error cargando: ${image.title}`, 'warn');
          // Usar imagen de fallback
          image.url = '/images/placeholder-carousel.jpg';
          resolve();
        };
        img.src = image.url;
      });
    });

    await Promise.allSettled(preloadPromises);
    this.log('✅ Precarga de imágenes completada', 'success');
  }

  private renderCarousel(container: HTMLElement): void {
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

  private renderIndicators(carouselId: string): string {
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

  private renderSlide(image: CarouselImage, index: number): string {
    return `
      <div class="carousel-item ${index === 0 ? 'active' : ''}">
        <img src="${image.url}" 
             class="d-block w-100 carousel-image" 
             alt="${image.alt}" 
             title="${image.title}"
             loading="${index === 0 ? 'eager' : 'lazy'}" 
             decoding="async"
             data-no-responsive="true"
             onerror="this.src='/images/placeholder-carousel.jpg'; this.onerror=null;">
        
        ${image.title ? `
          <div class="carousel-caption d-none d-md-block">
            <h5>${image.title}</h5>
            ${image.description ? `<p>${image.description}</p>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderControls(carouselId: string): string {
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

  private async initializeBootstrapCarousel(): Promise<void> {
    if (!this.carouselElement) {
      throw new Error('Elemento carrusel no encontrado para inicialización');
    }

    // Esperar a que Bootstrap esté disponible
    if (typeof (window as any).bootstrap === 'undefined') {
      await this.waitForBootstrap();
    }

    try {
      // Inicializar carrusel Bootstrap
      this.carouselInstance = new (window as any).bootstrap.Carousel(this.carouselElement, {
        interval: this.config.interval,
        pause: this.config.pauseOnHover ? 'hover' : false,
        wrap: this.config.wrap,
        touch: this.config.touch,
        keyboard: this.config.keyboard
      });

      this.log('✅ Bootstrap carousel inicializado', 'success');
    } catch (error) {
      throw new Error(`Error inicializando Bootstrap: ${(error as Error).message}`);
    }
  }

  private async waitForBootstrap(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
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

  private setupEventListeners(): void {
    if (!this.carouselElement) return;

    this.carouselElement.addEventListener('slid.bs.carousel', (event: any) => {
      this.log(`🎠 Slide cambiado a: ${event.to}`, 'info');
    });

    this.carouselElement.addEventListener('slide.bs.carousel', (event: any) => {
      this.log(`🎠 Iniciando transición: ${event.from} → ${event.to}`, 'info');
    });
  }

  private renderFallback(container: HTMLElement): void {
    container.innerHTML = `
      <div class="carousel-fallback">
        <i class="bi bi-flower1"></i>
        <h4>FloresYa - Belleza Natural</h4>
        <p>Descubre nuestros hermosos arreglos florales</p>
        <button class="btn btn-outline-primary btn-sm" onclick="location.reload()">
          <i class="bi bi-arrow-clockwise me-1"></i>
          Reintentar
        </button>
      </div>
    `;
  }

  private log(message: string, level: 'info' | 'success' | 'warn' | 'error' = 'info'): void {
    const colors = {
      info: '#007bff',
      success: '#28a745',
      warn: '#ffc107',
      error: '#dc3545'
    };
    
    const style = `color: ${colors[level]}; font-weight: bold;`;
    console.log(`%c[🌸 Carousel] ${message}`, style);
  }

  /**
   * Actualiza las imágenes del carrusel dinámicamente
   */
  public async updateImages(newImages: any[]): Promise<boolean> {
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
      this.log(`❌ Error actualizando imágenes: ${(error as Error).message}`, 'error');
      return false;
    }
  }

  /**
   * Destruye la instancia del carrusel y limpia los recursos
   */
  public destroy(): void {
    if (this.carouselInstance) {
      try {
        this.carouselInstance.dispose();
        this.log('✅ Instancia Bootstrap destruida', 'success');
      } catch (error) {
        this.log(`⚠️ Error destruyendo instancia: ${(error as Error).message}`, 'warn');
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

  /**
   * Obtiene el estado actual del carrusel
   */
  public getState() {
    return {
      isInitialized: !!this.carouselInstance,
      imagesCount: this.images.length,
      containerId: this.containerId,
      config: this.config
    };
  }
}

// Exportar instancia singleton
export const carouselService = new CarouselService();