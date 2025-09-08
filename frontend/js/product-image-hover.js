/**
 * 🌸 Product Image Hover System - FloresYa
 * Cambio suave de imágenes al pasar el mouse, solo si hay múltiples imágenes.
 * Sin distracciones. Sin errores. Solo belleza funcional.
 */

class ProductImageHover {
    constructor() {
        this.activeImages = new Map(); // Track active hover states
        this.debug = window.location.hostname === 'localhost' || localStorage.getItem('floresya_dev_mode') === 'true';
        this.init();
    }

    log(message, ...args) {
        if (this.debug) {
            console.log(`[🖼️ ProductImageHover] ${message}`, ...args);
        }
    }

    init() {
        this.log('Inicializado');
        
        // Bind events when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    bindEvents() {
        // Event delegation for dynamic content
        document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
    }

    handleMouseEnter(e) {
        const imageElement = this.getTargetProductImage(e.target);
        if (!imageElement) return;

        const productId = imageElement.dataset.productId;
        this.log(`Hover start: ${productId}`);
        this.startImageCycle(imageElement);
    }

    handleMouseLeave(e) {
        const imageElement = this.getTargetProductImage(e.target);
        if (!imageElement) return;

        const productId = imageElement.dataset.productId;
        this.log(`Hover end: ${productId}`);
        this.stopImageCycle(imageElement);
    }

    getTargetProductImage(element) {
        // Support for both direct image and container hover
        let target = element;
        while (target && target !== document) {
            if (target.tagName === 'IMG' && target.classList.contains('product-image')) {
                return target;
            }
            if (target.classList.contains('product-card') || target.classList.contains('card')) {
                const img = target.querySelector('img.product-image');
                return img || null;
            }
            target = target.parentElement;
        }
        return null;
    }

    startImageCycle(imageElement) {
        // Clear any existing cycle for this image
        this.stopImageCycle(imageElement);

        const imagesData = imageElement.getAttribute('data-images');
        if (!imagesData) {
            this.log('No data-images found');
            return;
        }

        let images;
        try {
            images = JSON.parse(imagesData);
            // Filter out empty or invalid URLs
            images = images.filter(url => url && typeof url === 'string' && url.trim().length > 0);
        } catch (e) {
            this.log('Error parsing images data:', e);
            return;
        }

        if (!images || images.length <= 1) {
            this.log(`Not enough images for cycle: ${images?.length || 0}`);
            return;
        }

        this.log(`Image cycle started (${images.length} images)`);

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

        // Start cycling through images every 2.5 seconds (more elegant, less distracting)
        state.intervalId = setInterval(() => {
            state.currentIndex = (state.currentIndex + 1) % state.images.length;
            const newImageUrl = state.images[state.currentIndex];
            
            if (!newImageUrl) return;

            // Create a temporary image to preload
            const tempImg = new Image();
            tempImg.onload = () => {
                // Apply smooth fade transition
                imageElement.style.opacity = '0.7';
                setTimeout(() => {
                    // Direct assignment (bypass responsive system for hover)
                    imageElement.src = newImageUrl;
                    imageElement.removeAttribute('srcset');
                    imageElement.removeAttribute('sizes');
                    imageElement.removeAttribute('data-src');
                    imageElement.style.opacity = '1';
                }, 150);
            };
            
            tempImg.onerror = () => {
                console.warn(`[🖼️ ProductImageHover] Failed to load image: ${newImageUrl}`);
                // Skip to next image if this one fails
                state.currentIndex = (state.currentIndex + 1) % state.images.length;
            };
            
            tempImg.src = newImageUrl;
            
        }, 2500); // 2.5 seconds - more elegant than 2 seconds

        // Store state
        this.activeImages.set(imageElement, state);
    }

    preloadImages(imageUrls) {
        // Preload images in background to avoid flickering
        imageUrls.forEach(url => {
            if (url) {
                const img = new Image();
                img.src = url;
                // Optional: add to cache
                this.log(`Preloading image: ${url}`);
            }
        });
    }

    stopImageCycle(imageElement) {
        const state = this.activeImages.get(imageElement);
        if (!state) return;

        this.log('Image cycle stopped');
        
        // Clear interval
        if (state.intervalId) {
            clearInterval(state.intervalId);
        }

        // Restore original image and attributes
        if (state.originalSrc) {
            imageElement.src = state.originalSrc;
        }
        
        if (state.originalSrcset !== null) {
            imageElement.setAttribute('srcset', state.originalSrcset);
        }
        if (state.originalSizes !== null) {
            imageElement.setAttribute('sizes', state.originalSizes);
        }
        if (state.originalDataSrc !== null) {
            imageElement.setAttribute('data-src', state.originalDataSrc);
        }

        // Remove from active images
        this.activeImages.delete(imageElement);
    }
}

// Initialize immediately
if (typeof window.floresyaProductImageHover === 'undefined') {
    window.floresyaProductImageHover = new ProductImageHover();
    console.log('%c[✅] ProductImageHover inicializado - FloresYa', 'color: #ff6b9d; font-weight: bold;');
}