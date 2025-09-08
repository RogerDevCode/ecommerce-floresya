/**
 * Responsive Image Utility for FloresYa
 * Handles WebP images with multiple sizes for optimal loading
 */

// responsive-image.js
document.addEventListener("DOMContentLoaded", function() {
    console.log("[🖼️] Iniciando Lazy Load de Imágenes - FloresYa");

    const lazyImages = [].slice.call(document.querySelectorAll("img[data-src]"));

    if ("IntersectionObserver" in window) {
        let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    let lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove("lazy");
                    lazyImageObserver.unobserve(lazyImage);
                    console.log(`[🖼️✅] Imagen cargada: ${lazyImage.dataset.src}`);
                }
            });
        });

        lazyImages.forEach(function(lazyImage) {
            lazyImageObserver.observe(lazyImage);
        });
    } else {
        // Fallback para navegadores antiguos
        lazyImages.forEach(function(img) {
            img.src = img.dataset.src;
            console.warn(`[🖼️⚠️] Fallback: Imagen cargada sin IntersectionObserver: ${img.dataset.src}`);
        });
    }
});



class ResponsiveImageUtil {
    constructor() {
        this.sizes = {
            thumb: { width: 200, suffix: '-thumb' },
            medium: { width: 500, suffix: '-medium' },
            large: { width: 800, suffix: '-large' }
        };
    }

    /**
     * Generate responsive URLs from base image URL
     * @param {string} baseUrl - Base image URL (large size)
     * @returns {Object} - Object with all size variants
     */
    getResponsiveUrls(baseUrl) {
        if (!baseUrl || !baseUrl.includes('.webp')) {
            return {
                thumb: baseUrl,
                medium: baseUrl,
                large: baseUrl
            };
        }

        // Prevent double processing of URLs that already have duplicate suffixes
        if (baseUrl.includes('-medium.webp-thumb.webp') || 
            baseUrl.includes('-thumb.webp-thumb.webp') || 
            baseUrl.includes('-large.webp-thumb.webp') ||
            baseUrl.includes('-medium.webp-medium.webp') ||
            baseUrl.includes('-thumb.webp-medium.webp')) {
            console.warn('ResponsiveImage: Double-processed URL detected, returning original:', baseUrl);
            // Try to clean the URL by removing the duplicate suffix
            const cleanUrl = baseUrl
                .replace('-medium.webp-thumb.webp', '-medium.webp')
                .replace('-thumb.webp-thumb.webp', '-thumb.webp')
                .replace('-large.webp-thumb.webp', '-large.webp')
                .replace('-medium.webp-medium.webp', '-medium.webp')
                .replace('-thumb.webp-medium.webp', '-thumb.webp');
            
            return {
                thumb: cleanUrl,
                medium: cleanUrl,
                large: cleanUrl
            };
        }

        // For Supabase images, we need to replace the size in the path
        // From: /large/filename-large.webp
        // To: /medium/filename-medium.webp or /thumb/filename-thumb.webp
        
        if (baseUrl.includes('/large/') && baseUrl.includes('-large.webp')) {
            const largeUrl = baseUrl;
            const mediumUrl = baseUrl.replace('/large/', '/medium/').replace('-large.webp', '-medium.webp');
            const thumbUrl = baseUrl.replace('/large/', '/thumb/').replace('-large.webp', '-thumb.webp');
            
            return {
                large: largeUrl,    // 800x800
                medium: mediumUrl,  // 500x500  
                thumb: thumbUrl     // 200x200
            };
        }

        // Support for local proxy URLs
        if (baseUrl.includes('supabase.co/storage')) {
            // Use local proxy as fallback for CORS issues
            const filename = baseUrl.split('/').pop();
            
            // Remove any existing size suffix to get base filename
            let baseFilename = filename
                .replace('-large.webp', '')
                .replace('-medium.webp', '') 
                .replace('-thumb.webp', '');
                
            // If filename still has .webp, remove it for proper reconstruction
            if (baseFilename.endsWith('.webp')) {
                baseFilename = baseFilename.replace('.webp', '');
            }
            
            return {
                large: `/api/images/direct/large/${baseFilename}-large.webp`,
                medium: `/api/images/direct/medium/${baseFilename}-medium.webp`,
                thumb: `/api/images/direct/thumb/${baseFilename}-thumb.webp`
            };
        }

        // Fallback for other URL patterns
        return {
            thumb: baseUrl,
            medium: baseUrl,
            large: baseUrl
        };
    }

    /**
     * Generate srcset attribute for responsive images
     * @param {string} baseUrl - Base image URL
     * @returns {string} - srcset attribute value
     */
    generateSrcSet(baseUrl) {
        if (!baseUrl) return '';

        const urls = this.getResponsiveUrls(baseUrl);
        
        return [
            `${urls.thumb} 200w`,
            `${urls.medium} 500w`,
            `${urls.large} 800w`
        ].join(', ');
    }

    /**
     * Generate sizes attribute based on container context
     * @param {string} context - Context: 'thumbnail', 'card', 'detail', 'zoom'
     * @returns {string} - sizes attribute value
     */
    generateSizes(context = 'card') {
        const sizeMap = {
            thumbnail: '200px',
            card: '(max-width: 576px) 50vw, (max-width: 768px) 33vw, (max-width: 992px) 25vw, 300px',
            detail: '(max-width: 768px) 100vw, (max-width: 992px) 50vw, 500px',
            zoom: '(max-width: 768px) 100vw, 800px',
            admin_thumb: '200px'
        };

        return sizeMap[context] || sizeMap.card;
    }

    /**
     * Get optimal image URL based on container width
     * @param {string} baseUrl - Base image URL
     * @param {number} containerWidth - Expected container width
     * @returns {string} - Optimal image URL
     */
    getOptimalUrl(baseUrl, containerWidth = 300) {
        if (!baseUrl) return baseUrl;

        const urls = this.getResponsiveUrls(baseUrl);
        
        if (containerWidth <= 200) return urls.thumb;
        if (containerWidth <= 500) return urls.medium;
        return urls.large;
    }

    /**
     * Create a responsive image element
     * @param {string} src - Base image URL
     * @param {string} alt - Alt text
     * @param {string} context - Image context
     * @param {Object} attributes - Additional attributes
     * @returns {HTMLImageElement} - Configured img element
     */
    createImage(src, alt = '', context = 'card', attributes = {}) {
        const img = document.createElement('img');
        
        if (!src) {
            img.src = '/images/placeholder-product.jpg';
            img.alt = alt || 'Imagen no disponible';
            return img;
        }

        // Set responsive attributes
        img.srcset = this.generateSrcSet(src);
        img.sizes = this.generateSizes(context);
        img.src = this.getOptimalUrl(src, context === 'thumbnail' ? 200 : 300);
        img.alt = alt;
        
        // Add loading optimization
        img.loading = 'lazy';
        img.decoding = 'async';
        
        // Apply additional attributes
        Object.assign(img, attributes);
        
        return img;
    }

    /**
     * Update existing img element with responsive attributes
     * @param {HTMLImageElement} img - Image element to update
     * @param {string} src - Base image URL
     * @param {string} context - Image context
     */
    makeResponsive(img, src, context = 'card') {
        if (!img || !src) return;

        img.srcset = this.generateSrcSet(src);
        img.sizes = this.generateSizes(context);
        img.src = this.getOptimalUrl(src, context === 'thumbnail' ? 200 : 300);
        img.loading = 'lazy';
        img.decoding = 'async';
    }

    /**
     * Preload critical images
     * @param {Array} imageUrls - Array of image URLs to preload
     * @param {string} context - Context for size selection
     */
    preloadImages(imageUrls, context = 'card') {
        if (!Array.isArray(imageUrls)) return;

        imageUrls.forEach(url => {
            if (!url) return;
            
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = this.getOptimalUrl(url, context === 'thumbnail' ? 200 : 300);
            
            if (context === 'detail') {
                // Preload multiple sizes for detail pages
                link.imagesrcset = this.generateSrcSet(url);
                link.imagesizes = this.generateSizes(context);
            }
            
            document.head.appendChild(link);
        });
    }

    /**
     * Handle image loading errors with fallback
     * @param {HTMLImageElement} img - Image element
     * @param {string} fallbackSrc - Fallback image URL
     */
    handleError(img, fallbackSrc = '/images/placeholder-product.jpg') {
        img.onerror = () => {
            img.src = fallbackSrc;
            img.srcset = '';
            img.onerror = null; // Prevent infinite loop
        };
    }

    /**
     * Initialize responsive images in a container
     * @param {string|HTMLElement} container - Container selector or element
     * @param {string} context - Image context
     */
    initializeContainer(container, context = 'card') {
        const containerEl = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
            
        if (!containerEl) return;

        const images = containerEl.querySelectorAll('img[data-responsive]');
        
        images.forEach(img => {
            const src = img.dataset.src || img.src;
            const imgContext = img.dataset.context || context;
            
            this.makeResponsive(img, src, imgContext);
            this.handleError(img);
        });
    }
}

// Create global instance
window.responsiveImage = new ResponsiveImageUtil();

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all responsive images
    window.responsiveImage.initializeContainer(document.body);
    
    // Watch for dynamically added images
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches && node.matches('img[data-responsive]')) {
                        const src = node.dataset.src || node.src;
                        const context = node.dataset.context || 'card';
                        window.responsiveImage.makeResponsive(node, src, context);
                        window.responsiveImage.handleError(node);
                    }
                    
                    // Check child images
                    const childImages = node.querySelectorAll && node.querySelectorAll('img[data-responsive]');
                    if (childImages) {
                        childImages.forEach(img => {
                            const src = img.dataset.src || img.src;
                            const context = img.dataset.context || 'card';
                            window.responsiveImage.makeResponsive(img, src, context);
                            window.responsiveImage.handleError(img);
                        });
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});