class PerformanceOptimizer {
  constructor(options = {}) {
    this.config = {
      lazyLoadOffset: 100,
      imageQuality: 'auto',
      enableWebP: true,
      enablePrefetch: true,
      enableImageOptimization: true,
      enableResourceHints: true,
      enableCompression: true,
      debounceDelay: 100,
      intersectionThreshold: 0.1,
      ...options
    };

    this.observers = {
      intersection: null,
      mutation: null
    };

    this.cache = {
      images: new Map(),
      prefetched: new Set()
    };

    this.metrics = {
      imagesLoaded: 0,
      imageErrors: 0,
      totalLoadTime: 0,
      memoryUsage: 0,
      startTime: performance.now()
    };

    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.setupMutationObserver();
    this.enableImageOptimizations();
    this.setupResourceHints();
    this.monitorPerformance();
    this.initializeLazyLoading();
    this.optimizeFirstContentfulPaint();
    this.setupAdvancedResourceHints();
    
    if (window.logger) {
      window.logger.success('PERFORMANCE', '✅ Performance optimizer initialized with FCP optimizations', this.config);
    }
  }

  optimizeFirstContentfulPaint() {
    if (window.logger) {
      window.logger.info('PERFORMANCE', '🚀 Optimizing First Contentful Paint...');
    }
    
    try {
      // Inline critical CSS if not already present
      const criticalCSS = `
        /* Critical above-the-fold styles for FCP */
        .hero-section { 
          background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%); 
          min-height: 300px;
        }
        .product-card { 
          opacity: 0; 
          animation: fadeInUp 0.6s ease forwards; 
        }
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .skeleton-loading { 
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); 
          background-size: 200% 100%; 
          animation: skeleton-pulse 1.5s infinite;
        }
        @keyframes skeleton-pulse { 
          0% { background-position: -200px 0; } 
          100% { background-position: calc(200px + 100%) 0; } 
        }
        .glass-morphism {
          backdrop-filter: blur(8px);
          background: rgba(255, 255, 255, 0.9);
        }
      `;
      
      if (!document.querySelector('#critical-css-fcp')) {
        const style = document.createElement('style');
        style.id = 'critical-css-fcp';
        style.textContent = criticalCSS;
        document.head.insertBefore(style, document.head.firstChild);
      }
      
      // Apply skeleton loading to product cards
      requestAnimationFrame(() => {
        this.applySkeletonLoading();
      });
      
      if (window.logger) {
        window.logger.success('PERFORMANCE', '✅ FCP optimizations applied');
      }
    } catch (error) {
      if (window.logger) {
        window.logger.error('PERFORMANCE', '❌ Error in FCP optimization', { error: error.message });
      }
    }
  }

  setupAdvancedResourceHints() {
    if (window.logger) {
      window.logger.info('PERFORMANCE', '🔗 Setting up advanced resource hints...');
    }
    
    try {
      // Critical resource preloads for FloresYa
      const criticalResources = [
        { href: '/css/styles.css', as: 'style', importance: 'high' },
        { href: '/js/main.js', as: 'script' },
        { href: '/js/cart.js', as: 'script' },
        { href: '/images/placeholder-product-2.webp', as: 'image' },
        { href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css', as: 'style' }
      ];

      // DNS prefetch for external domains
      const dnsPrefetchDomains = [
        '//cdn.jsdelivr.net',
        '//cdnjs.cloudflare.com',
        '//fonts.googleapis.com'
      ];

      // Add critical resource preloads
      criticalResources.forEach(resource => {
        const existingLink = document.querySelector(`link[href="${resource.href}"][rel="preload"]`);
        if (!existingLink) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = resource.href;
          link.as = resource.as;
          if (resource.importance) {
            link.setAttribute('importance', resource.importance);
          }
          document.head.appendChild(link);
        }
      });

      // Add DNS prefetch hints
      dnsPrefetchDomains.forEach(domain => {
        const existingLink = document.querySelector(`link[href="${domain}"][rel="dns-prefetch"]`);
        if (!existingLink) {
          const link = document.createElement('link');
          link.rel = 'dns-prefetch';
          link.href = domain;
          document.head.appendChild(link);
        }
      });

      if (window.logger) {
        window.logger.success('PERFORMANCE', '✅ Advanced resource hints configured');
      }
    } catch (error) {
      if (window.logger) {
        window.logger.error('PERFORMANCE', '❌ Error setting up advanced resource hints', { error: error.message });
      }
    }
  }

  applySkeletonLoading() {
    // Apply skeleton loading to product containers
    const productContainers = document.querySelectorAll('#productsContainer .col-lg-3, #productsContainer .col-md-4, #productsContainer .col-sm-6');
    productContainers.forEach((container, index) => {
      // Stagger animation delays for smooth loading
      container.style.animationDelay = `${index * 0.1}s`;
      
      // Add skeleton loading to images that haven't loaded yet
      const img = container.querySelector('img[data-src], img:not([src])');
      if (img && !img.complete) {
        img.classList.add('skeleton-loading');
        img.addEventListener('load', () => {
          img.classList.remove('skeleton-loading');
          img.style.opacity = '1';
        }, { once: true });
      }
    });

    // Apply to other loading elements
    const loadingElements = document.querySelectorAll('.loading-placeholder');
    loadingElements.forEach(el => {
      el.classList.add('skeleton-loading');
    });
  }

  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      this.fallbackLazyLoading();
      return;
    }

    this.observers.intersection = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: `${this.config.lazyLoadOffset}px`,
        threshold: this.config.intersectionThreshold
      }
    );
  }

  setupMutationObserver() {
    if (!('MutationObserver' in window)) return;

    this.observers.mutation = new MutationObserver(
      this.debounce(this.handleMutations.bind(this), this.config.debounceDelay)
    );

    this.observers.mutation.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'data-src', 'srcset', 'data-srcset']
    });
  }

  handleMutations(mutations) {
    let newImages = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const images = node.querySelectorAll ? 
              [
                ...node.querySelectorAll('img[data-src], img[data-srcset]'),
                ...(node.matches && node.matches('img[data-src], img[data-srcset]') ? [node] : [])
              ] : [];
            
            if (images.length > 0) {
              newImages = true;
              this.observeImages(images);
            }
          }
        });
      }
    });

    if (newImages && window.logger) {
      window.logger.debug('PERFORMANCE', 'New lazy images detected and observed');
    }
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.observers.intersection.unobserve(entry.target);
      }
    });
  }

  initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src], img[data-srcset]');
    this.observeImages(images);

    if (window.logger && images.length > 0) {
      window.logger.info('PERFORMANCE', `Initialized lazy loading for ${images.length} images`);
    }
  }

  observeImages(images) {
    if (!this.observers.intersection) {
      this.fallbackLazyLoading();
      return;
    }

    images.forEach(img => {
      if (!img.dataset.observed) {
        this.optimizeImageElement(img);
        this.observers.intersection.observe(img);
        img.dataset.observed = 'true';
      }
    });
  }

  optimizeImageElement(img) {
    if (img.dataset.optimized) return;

    img.style.transition = 'opacity 0.3s ease-in-out';
    img.style.opacity = '0';
    img.setAttribute('loading', 'lazy');

    if (this.config.enableWebP && this.supportsWebP()) {
      const webpSrc = this.convertToWebP(img.dataset.src || img.src);
      if (webpSrc) {
        img.dataset.webpSrc = webpSrc;
      }
    }

    this.addImagePlaceholder(img);
    img.dataset.optimized = 'true';
  }

  addImagePlaceholder(img) {
    if (img.dataset.placeholder) return;

    const width = img.width || img.dataset.width || 300;
    const height = img.height || img.dataset.height || 200;
    
    const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%23999' text-anchor='middle' dy='.3em'%3ELoading...%3C/text%3E%3C/svg%3E`;
    
    img.src = placeholder;
    img.dataset.placeholder = 'true';
  }

  async loadImage(img) {
    const startTime = performance.now();
    const src = img.dataset.webpSrc || img.dataset.src;
    const srcset = img.dataset.srcset;

    if (!src && !srcset) {
      if (window.logger) {
        window.logger.warn('PERFORMANCE', 'No src or srcset found for lazy image', { img });
      }
      return;
    }

    try {
      img.classList.add('loading');

      if (this.cache.images.has(src)) {
        this.applyImageSource(img, src, srcset);
        this.handleImageLoad(img, startTime, true);
        return;
      }

      const preloadImage = new Image();
      
      await new Promise((resolve, reject) => {
        preloadImage.onload = () => {
          this.cache.images.set(src, {
            loaded: true,
            timestamp: Date.now(),
            size: this.estimateImageSize(preloadImage)
          });
          resolve();
        };
        
        preloadImage.onerror = () => {
          this.metrics.imageErrors++;
          reject(new Error(`Failed to load image: ${src}`));
        };

        preloadImage.src = src;
        if (srcset) preloadImage.srcset = srcset;
      });

      this.applyImageSource(img, src, srcset);
      this.handleImageLoad(img, startTime, false);

    } catch (error) {
      this.handleImageError(img, error);
    }
  }

  applyImageSource(img, src, srcset) {
    if (src) img.src = src;
    if (srcset) img.srcset = srcset;
    
    img.removeAttribute('data-src');
    img.removeAttribute('data-srcset');
  }

  handleImageLoad(img, startTime, fromCache) {
    const loadTime = performance.now() - startTime;
    
    img.style.opacity = '1';
    img.classList.remove('loading');
    img.classList.add('loaded');

    this.metrics.imagesLoaded++;
    this.metrics.totalLoadTime += loadTime;

    if (window.logger) {
      window.logger.info('PERFORMANCE', 'Image loaded', {
        src: img.src,
        loadTime: Math.round(loadTime),
        fromCache,
        totalLoaded: this.metrics.imagesLoaded
      });
    }

    img.dispatchEvent(new CustomEvent('lazyImageLoaded', {
      detail: { loadTime, fromCache, metrics: this.getMetrics() }
    }));
  }

  handleImageError(img, error) {
    img.classList.remove('loading');
    img.classList.add('error');
    
    const fallbackSrc = img.dataset.fallback || this.generateFallbackImage(img);
    if (fallbackSrc) {
      img.src = fallbackSrc;
    }

    this.metrics.imageErrors++;

    if (window.logger) {
      window.logger.error('PERFORMANCE', 'Image load failed', {
        src: img.dataset.src,
        error: error.message
      });
    }

    img.dispatchEvent(new CustomEvent('lazyImageError', {
      detail: { error, metrics: this.getMetrics() }
    }));
  }

  generateFallbackImage(img) {
    const width = img.width || 300;
    const height = img.height || 200;
    
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23f8f9fa' stroke='%23dee2e6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='12' fill='%236c757d' text-anchor='middle' dy='.3em'%3EImagen no disponible%3C/text%3E%3C/svg%3E`;
  }

  fallbackLazyLoading() {
    let ticking = false;

    const checkImages = () => {
      const images = document.querySelectorAll('img[data-src]:not([data-loaded])');
      
      images.forEach(img => {
        if (this.isInViewport(img)) {
          this.loadImage(img);
          img.dataset.loaded = 'true';
        }
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(checkImages);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onScroll);
    
    checkImages();
  }

  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    const offset = this.config.lazyLoadOffset;

    return (
      rect.bottom >= -offset &&
      rect.right >= -offset &&
      rect.top <= window.innerHeight + offset &&
      rect.left <= window.innerWidth + offset
    );
  }

  enableImageOptimizations() {
    if (!this.config.enableImageOptimization) return;

    const style = document.createElement('style');
    style.textContent = `
      img[data-src], img[data-srcset] {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading-shimmer 2s infinite ease-in-out;
      }
      
      @keyframes loading-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      img.loaded {
        animation: none;
        background: none;
      }
      
      img.loading {
        filter: blur(2px);
        opacity: 0.7;
      }
      
      img.error {
        filter: grayscale(100%);
        opacity: 0.5;
      }
    `;
    
    document.head.appendChild(style);
  }

  setupResourceHints() {
    if (!this.config.enableResourceHints) return;

    const criticalImages = document.querySelectorAll('img[data-critical="true"]');
    criticalImages.forEach(img => {
      const src = img.dataset.src || img.src;
      if (src && !this.cache.prefetched.has(src)) {
        this.prefetchImage(src);
      }
    });

    const links = document.querySelectorAll('link[rel="preload"][as="image"]');
    links.forEach(link => {
      this.cache.prefetched.add(link.href);
    });
  }

  prefetchImage(src) {
    if (!this.config.enablePrefetch || this.cache.prefetched.has(src)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = src;
    link.as = 'image';
    
    document.head.appendChild(link);
    this.cache.prefetched.add(src);

    if (window.logger) {
      window.logger.debug('PERFORMANCE', 'Prefetching image', { src });
    }
  }

  convertToWebP(src) {
    if (!src || src.startsWith('data:')) return null;

    const url = new URL(src, window.location.href);
    
    if (url.pathname.match(/\.(jpg|jpeg|png)$/i)) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    return null;
  }

  supportsWebP() {
    if (this._webpSupport !== undefined) return this._webpSupport;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    this._webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    return this._webpSupport;
  }

  estimateImageSize(img) {
    return Math.round((img.width || 0) * (img.height || 0) * 4 / 1024);
  }

  monitorPerformance() {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.initiatorType === 'img') {
            this.trackImagePerformance(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      
    } catch (error) {
      if (window.logger) {
        window.logger.warn('PERFORMANCE', 'Performance monitoring setup failed', { error: error.message });
      }
    }
  }

  trackImagePerformance(entry) {
    const metrics = {
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize,
      cached: entry.transferSize === 0,
      protocol: entry.nextHopProtocol
    };

    if (window.logger) {
      window.logger.info('PERFORMANCE', 'Image resource timing', metrics);
    }
  }

  getMetrics() {
    const runtime = performance.now() - this.metrics.startTime;
    const avgLoadTime = this.metrics.imagesLoaded > 0 ? 
      this.metrics.totalLoadTime / this.metrics.imagesLoaded : 0;

    return {
      ...this.metrics,
      runtime,
      avgLoadTime: Math.round(avgLoadTime),
      errorRate: this.metrics.imagesLoaded > 0 ? 
        (this.metrics.imageErrors / (this.metrics.imagesLoaded + this.metrics.imageErrors)) * 100 : 0,
      cacheHitRate: this.cache.images.size > 0 ? 
        (this.cache.images.size / this.metrics.imagesLoaded) * 100 : 0
    };
  }

  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      config: this.config,
      metrics: this.getMetrics(),
      cache: {
        images: this.cache.images.size,
        prefetched: this.cache.prefetched.size
      },
      browser: {
        webpSupport: this.supportsWebP(),
        intersectionObserver: 'IntersectionObserver' in window,
        performanceObserver: 'PerformanceObserver' in window
      }
    };
  }

  optimizeExistingImages() {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach(img => {
      if (!img.src || img.src.startsWith('data:')) return;

      const dataSrc = img.src;
      img.dataset.src = dataSrc;
      img.removeAttribute('src');
      
      this.optimizeImageElement(img);
      
      if (this.observers.intersection) {
        this.observers.intersection.observe(img);
      }
    });

    if (window.logger && images.length > 0) {
      window.logger.info('PERFORMANCE', `Converted ${images.length} existing images to lazy loading`);
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  destroy() {
    if (this.observers.intersection) {
      this.observers.intersection.disconnect();
    }
    
    if (this.observers.mutation) {
      this.observers.mutation.disconnect();
    }

    this.cache.images.clear();
    this.cache.prefetched.clear();

    if (window.logger) {
      window.logger.info('PERFORMANCE', 'Performance optimizer destroyed', this.getMetrics());
    }
  }
}

if (typeof window !== 'undefined') {
  window.PerformanceOptimizer = PerformanceOptimizer;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceOptimizer;
}