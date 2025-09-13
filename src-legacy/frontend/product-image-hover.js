/**
 * 🌸 Product Image Hover System - FloresYa
 * Cambio suave de imágenes al pasar el mouse, solo si hay múltiples imágenes.
 * Sin distracciones. Sin errores. Solo belleza funcional.
 * Logging exhaustivo para confirmar ejecución y errores.
 */

class ProductImageHover {
    constructor() {
        this.activeImages = new Map(); // Track active hover states
        this.debug = window.location.hostname === 'localhost' || localStorage.getItem('floresya_dev_mode') === 'true';
        
        // Initialize with logging
        if (window.logger) {
            window.logger.info('PRODUCT-IMAGE-HOVER', '✅ ProductImageHover initialized');
        } else {
            console.log('%c[✅] ProductImageHover inicializado - FloresYa', 'color: #ff6b9d; font-weight: bold;');
        }
        
        this.init();
    }

    log(message, data = null, level = 'info') {
        if (!this.debug) return;

        // Use window.logger if available
        if (window.logger) {
            window.logger[level]('PRODUCT-IMAGE-HOVER', message, data);
        } else {
            const prefix = '[🖼️ ProductImageHover]';
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

    init() {
        this.log('🔄 Inicializando ProductImageHover', {}, 'info');
        
        // Bind events when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindEvents();
                this.log('✅ Eventos vinculados después de DOMContentLoaded', {}, 'success');
            });
        } else {
            this.bindEvents();
            this.log('✅ Eventos vinculados inmediatamente', {}, 'success');
        }
    }

    bindEvents() {
        this.log('🔄 Vinculando eventos de mouse', {}, 'info');
        
        // Event delegation for dynamic content
        document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
        
        this.log('✅ Eventos de mouse vinculados correctamente', {}, 'success');
    }

    handleMouseEnter(e) {
        const imageElement = this.getTargetProductImage(e.target);
        if (!imageElement) {
            return;
        }

        const productId = imageElement.dataset.productId;
        if (!productId) {
            this.log('⚠️ Imagen sin data-product-id', { src: imageElement.src }, 'warn');
            return;
        }

        this.log(`✅ Hover iniciado en producto`, { productId, src: imageElement.src }, 'success');
        this.startImageCycle(imageElement);
    }

    handleMouseLeave(e) {
        const imageElement = this.getTargetProductImage(e.target);
        if (!imageElement) {
            return;
        }

        const productId = imageElement.dataset.productId;
        if (!productId) {
            this.log('⚠️ Imagen sin data-product-id al salir', { src: imageElement.src }, 'warn');
            return;
        }

        this.log(`✅ Hover finalizado en producto`, { productId, src: imageElement.src }, 'success');
        this.stopImageCycle(imageElement);
    }

    getTargetProductImage(element) {
        
        // Support for both direct image and container hover
        let target = element;
        while (target && target !== document) {
            if (target.tagName === 'IMG' && target.classList.contains('product-image')) {
                // Skip carousel images
                if (target.hasAttribute('data-carousel') || target.classList.contains('carousel-image')) {
                    return null;
                }
                return target;
            }
            if (target.classList.contains('product-card') || target.classList.contains('card')) {
                const img = target.querySelector('img.product-image');
                if (img) {
                    // Skip carousel images
                    if (img.hasAttribute('data-carousel') || img.classList.contains('carousel-image')) {
                        return null;
                    }
                    return img;
                } else {
                    return null;
                }
            }
            target = target.parentElement;
        }
        
        return null;
    }

    startImageCycle(imageElement) {
        this.log('🔄 Iniciando ciclo de imágenes', { src: imageElement.src }, 'info');
        
        // Clear any existing cycle for this image
        this.stopImageCycle(imageElement);

        const imagesData = imageElement.getAttribute('data-images');
        if (!imagesData) {
            this.log('⚠️ No se encontró atributo data-images', {}, 'warn');
            return;
        }

        let images;
        try {
            images = JSON.parse(imagesData);
            // Filter out empty or invalid URLs
            images = images.filter(url => url && typeof url === 'string' && url.trim().length > 0);
            this.log('✅ Imágenes parseadas correctamente', { count: images.length, images }, 'success');
        } catch (e) {
            this.log('❌ Error parsing images data', { error: e.message, data: imagesData }, 'error');
            return;
        }

        if (!images || images.length <= 1) {
            this.log(`⚠️ No hay suficientes imágenes para ciclo: ${images?.length || 0}`, { images }, 'warn');
            return;
        }

        this.log(`✅ Ciclo de imágenes iniciado (${images.length} imágenes)`, { images }, 'success');

        const state = {
            images: images,
            currentIndex: 0,
            element: imageElement,
            intervalId: null,
            // Store original state
            originalSrc: imageElement.src,
            originalSrcset: imageElement.getAttribute('srcset'),
            originalSizes: imageElement.getAttribute('sizes'),
            originalDataSrc: imageElement.getAttribute('data-src')
        };

        // Preload next images (except the first one, which is already loaded)
        this.preloadImages(images.slice(1));

        // Start cycling through images every 1.2 seconds (industry standard for product hovers)
        state.intervalId = setInterval(() => {
            state.currentIndex = (state.currentIndex + 1) % state.images.length;
            const newImageUrl = state.images[state.currentIndex];
            
            if (!newImageUrl) {
                this.log('⚠️ URL de imagen inválida', { currentIndex: state.currentIndex }, 'warn');
                return;
            }

            // Create a temporary image to preload
            const tempImg = new Image();
            tempImg.onload = () => {
                this.log('✅ Imagen precargada exitosamente', { url: newImageUrl }, 'success');
                
                // Apply smooth fade transition (optimized for better UX)
                imageElement.style.opacity = '0.8';
                imageElement.style.transition = 'opacity 0.2s ease-in-out';
                setTimeout(() => {
                    // Direct assignment (bypass responsive system for hover)
                    imageElement.src = newImageUrl;
                    imageElement.removeAttribute('srcset');
                    imageElement.removeAttribute('sizes');
                    imageElement.removeAttribute('data-src');
                    imageElement.style.opacity = '1';
                    
                    this.log('✅ Imagen cambiada exitosamente', { 
                        oldIndex: (state.currentIndex - 1 + images.length) % images.length,
                        newIndex: state.currentIndex,
                        url: newImageUrl 
                    }, 'success');
                }, 120);
            };
            
            tempImg.onerror = (error) => {
                this.log('❌ Error al cargar imagen', { 
                    url: newImageUrl, 
                    error: error.message,
                    currentIndex: state.currentIndex 
                }, 'error');
                
                // Skip to next image if this one fails
                state.currentIndex = (state.currentIndex + 1) % state.images.length;
            };
            
            tempImg.src = newImageUrl;
            
        }, 1200); // 1.2 seconds - industry standard for smooth product hover experience

        // Store state
        this.activeImages.set(imageElement, state);
        this.log('✅ Estado de ciclo almacenado', { element: imageElement, state }, 'success');
    }

    preloadImages(imageUrls) {
        this.log('🔄 Preloading images', { count: imageUrls.length }, 'info');
        
        // Preload images in background to avoid flickering
        imageUrls.forEach(url => {
            if (url) {
                const img = new Image();
                img.onload = () => {
                    this.log('✅ Imagen precargada', { url }, 'success');
                };
                img.onerror = (error) => {
                    this.log('❌ Error al precargar imagen', { url, error: error.message }, 'error');
                };
                img.src = url;
                this.log(`🔄 Iniciando precarga: ${url}`, {}, 'info');
            } else {
                this.log('⚠️ URL de imagen inválida para precarga', { url }, 'warn');
            }
        });
    }

    stopImageCycle(imageElement) {
        const state = this.activeImages.get(imageElement);
        if (!state) {
            this.log('⚠️ No hay ciclo activo para esta imagen', { src: imageElement.src }, 'warn');
            return;
        }

        this.log('🔄 Deteniendo ciclo de imágenes', { src: imageElement.src }, 'info');
        
        // Clear interval
        if (state.intervalId) {
            clearInterval(state.intervalId);
            this.log('✅ Intervalo de ciclo limpiado', {}, 'success');
        }

        // Restore original image and attributes
        if (state.originalSrc) {
            imageElement.src = state.originalSrc;
            this.log('✅ Imagen original restaurada', { src: state.originalSrc }, 'success');
        }
        
        if (state.originalSrcset !== null) {
            imageElement.setAttribute('srcset', state.originalSrcset);
            this.log('✅ srcset original restaurado', { srcset: state.originalSrcset }, 'success');
        }
        if (state.originalSizes !== null) {
            imageElement.setAttribute('sizes', state.originalSizes);
            this.log('✅ sizes original restaurado', { sizes: state.originalSizes }, 'success');
        }
        if (state.originalDataSrc !== null) {
            imageElement.setAttribute('data-src', state.originalDataSrc);
            this.log('✅ data-src original restaurado', { dataSrc: state.originalDataSrc }, 'success');
        }

        // Remove from active images
        this.activeImages.delete(imageElement);
        this.log('✅ Estado de ciclo eliminado', { element: imageElement }, 'success');
    }
}

// Initialize immediately
if (typeof window.floresyaProductImageHover === 'undefined') {
    window.floresyaProductImageHover = new ProductImageHover();
    
    // Log initialization with window.logger if available
    if (window.logger) {
        window.logger.success('PRODUCT-IMAGE-HOVER', '✅ ProductImageHover global instance created');
    }
}