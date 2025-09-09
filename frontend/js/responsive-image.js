/**
 * Responsive Image Utility for FloresYa
 * Handles WebP images with multiple sizes for optimal loading
 * Logging exhaustivo para confirmar ejecución y errores
 */

class ResponsiveImageUtil {
    constructor() {
        this.sizes = {
            thumb: { width: 200, suffix: '-thumb' },
            medium: { width: 500, suffix: '-medium' },
            large: { width: 800, suffix: '-large' }
        };

        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '✅ ResponsiveImageUtil initialized');
        } else {
            console.log('[🖼️] ResponsiveImageUtil initialized');
        }
    }

    /**
     * Generate responsive URLs from base image URL
     * @param {string} baseUrl - Base image URL (large size)
     * @returns {Object} - Object with all size variants
     */
    getResponsiveUrls(baseUrl) {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Generating responsive URLs', { baseUrl });
        } else {
            console.log(`[🖼️] Generating responsive URLs for: ${baseUrl}`);
        }

        if (!baseUrl || !baseUrl.includes('.webp')) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Base URL not provided or not WebP, returning original', { baseUrl });
            } else {
                console.warn(`[🖼️⚠️] Base URL not provided or not WebP, returning original: ${baseUrl}`);
            }
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
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Double-processed URL detected, attempting to clean', { baseUrl });
            } else {
                console.warn(`[🖼️⚠️] Double-processed URL detected, attempting to clean: ${baseUrl}`);
            }
            
            // Try to clean the URL by removing the duplicate suffix
            const cleanUrl = baseUrl
                .replace('-medium.webp-thumb.webp', '-medium.webp')
                .replace('-thumb.webp-thumb.webp', '-thumb.webp')
                .replace('-large.webp-thumb.webp', '-large.webp')
                .replace('-medium.webp-medium.webp', '-medium.webp')
                .replace('-thumb.webp-medium.webp', '-thumb.webp');
            
            if (window.logger) {
                window.logger.info('RESPONSIVE-IMAGE', '✅ Cleaned URL', { original: baseUrl, cleaned: cleanUrl });
            } else {
                console.log(`[🖼️✅] Cleaned URL: ${cleanUrl}`);
            }

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
            
            if (window.logger) {
                window.logger.success('RESPONSIVE-IMAGE', '✅ Generated responsive URLs for Supabase image', { 
                    thumb: thumbUrl, 
                    medium: mediumUrl, 
                    large: largeUrl 
                });
            } else {
                console.log(`[🖼️✅] Generated responsive URLs for Supabase image`);
            }
            
            return {
                large: largeUrl,    // 800x800
                medium: mediumUrl,  // 500x500  
                thumb: thumbUrl     // 200x200
            };
        }

        // Support for local proxy URLs
        if (baseUrl.includes('supabase.co/storage')) {
            if (window.logger) {
                window.logger.info('RESPONSIVE-IMAGE', '🔄 Generating proxy URLs for Supabase image', { baseUrl });
            } else {
                console.log(`[🖼️] Generating proxy URLs for Supabase image: ${baseUrl}`);
            }

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
            
            const urls = {
                large: `/api/images/direct/large/${baseFilename}-large.webp`,
                medium: `/api/images/direct/medium/${baseFilename}-medium.webp`,
                thumb: `/api/images/direct/thumb/${baseFilename}-thumb.webp`
            };

            if (window.logger) {
                window.logger.success('RESPONSIVE-IMAGE', '✅ Generated proxy URLs', { urls });
            } else {
                console.log(`[🖼️✅] Generated proxy URLs`);
            }

            return urls;
        }

        // Fallback for other URL patterns
        if (window.logger) {
            window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Unknown URL pattern, returning original', { baseUrl });
        } else {
            console.warn(`[🖼️⚠️] Unknown URL pattern, returning original: ${baseUrl}`);
        }

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
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Generating srcset', { baseUrl });
        } else {
            console.log(`[🖼️] Generating srcset for: ${baseUrl}`);
        }

        if (!baseUrl) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ No base URL provided for srcset');
            } else {
                console.warn('[🖼️⚠️] No base URL provided for srcset');
            }
            return '';
        }

        try {
            const urls = this.getResponsiveUrls(baseUrl);
            
            const srcset = [
                `${urls.thumb} 200w`,
                `${urls.medium} 500w`,
                `${urls.large} 800w`
            ].join(', ');

            if (window.logger) {
                window.logger.success('RESPONSIVE-IMAGE', '✅ Srcset generated', { srcset });
            } else {
                console.log(`[🖼️✅] Srcset generated`);
            }

            return srcset;
        } catch (error) {
            if (window.logger) {
                window.logger.error('RESPONSIVE-IMAGE', '❌ Error generating srcset', { error: error.message, baseUrl });
            } else {
                console.error(`[🖼️❌] Error generating srcset for ${baseUrl}:`, error);
            }
            return '';
        }
    }

    /**
     * Generate sizes attribute based on container context
     * @param {string} context - Context: 'thumbnail', 'card', 'detail', 'zoom'
     * @returns {string} - sizes attribute value
     */
    generateSizes(context = 'card') {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Generating sizes', { context });
        } else {
            console.log(`[🖼️] Generating sizes for context: ${context}`);
        }

        const sizeMap = {
            thumbnail: '200px',
            card: '(max-width: 576px) 50vw, (max-width: 768px) 33vw, (max-width: 992px) 25vw, 300px',
            detail: '(max-width: 768px) 100vw, (max-width: 992px) 50vw, 500px',
            zoom: '(max-width: 768px) 100vw, 800px',
            admin_thumb: '200px'
        };

        const sizes = sizeMap[context] || sizeMap.card;

        if (window.logger) {
            window.logger.success('RESPONSIVE-IMAGE', '✅ Sizes generated', { context, sizes });
        } else {
            console.log(`[🖼️✅] Sizes generated for context ${context}`);
        }

        return sizes;
    }

    /**
     * Get optimal image URL based on container width
     * @param {string} baseUrl - Base image URL
     * @param {number} containerWidth - Expected container width
     * @returns {string} - Optimal image URL
     */
    getOptimalUrl(baseUrl, containerWidth = 300) {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Getting optimal URL', { baseUrl, containerWidth });
        } else {
            console.log(`[🖼️] Getting optimal URL for: ${baseUrl}, containerWidth: ${containerWidth}`);
        }

        if (!baseUrl) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ No base URL provided for optimal URL');
            } else {
                console.warn('[🖼️⚠️] No base URL provided for optimal URL');
            }
            return baseUrl;
        }

        try {
            const urls = this.getResponsiveUrls(baseUrl);
            
            let optimalUrl;
            if (containerWidth <= 200) {
                optimalUrl = urls.thumb;
            } else if (containerWidth <= 500) {
                optimalUrl = urls.medium;
            } else {
                optimalUrl = urls.large;
            }

            if (window.logger) {
                window.logger.success('RESPONSIVE-IMAGE', '✅ Optimal URL selected', { 
                    containerWidth, 
                    selected: optimalUrl,
                    allUrls: urls
                });
            } else {
                console.log(`[🖼️✅] Optimal URL selected: ${optimalUrl}`);
            }

            return optimalUrl;
        } catch (error) {
            if (window.logger) {
                window.logger.error('RESPONSIVE-IMAGE', '❌ Error getting optimal URL', { error: error.message, baseUrl, containerWidth });
            } else {
                console.error(`[🖼️❌] Error getting optimal URL for ${baseUrl}:`, error);
            }
            return baseUrl;
        }
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
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Creating responsive image', { src, alt, context });
        } else {
            console.log(`[🖼️] Creating responsive image for: ${src}`);
        }

        try {
            const img = document.createElement('img');
            
            if (!src) {
                img.src = '/images/placeholder-product.jpg';
                img.alt = alt || 'Imagen no disponible';
                
                if (window.logger) {
                    window.logger.warn('RESPONSIVE-IMAGE', '⚠️ No source provided, using placeholder', { alt });
                } else {
                    console.warn('[🖼️⚠️] No source provided, using placeholder');
                }
                
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
            
            if (window.logger) {
                window.logger.success('RESPONSIVE-IMAGE', '✅ Responsive image created', { 
                    src: img.src, 
                    srcset: img.srcset, 
                    sizes: img.sizes 
                });
            } else {
                console.log(`[🖼️✅] Responsive image created with src: ${img.src}`);
            }

            return img;
        } catch (error) {
            if (window.logger) {
                window.logger.error('RESPONSIVE-IMAGE', '❌ Error creating responsive image', { error: error.message, src, alt, context });
            } else {
                console.error(`[🖼️❌] Error creating responsive image for ${src}:`, error);
            }
            
            // Return fallback image
            const fallbackImg = document.createElement('img');
            fallbackImg.src = '/images/placeholder-product.jpg';
            fallbackImg.alt = alt || 'Imagen no disponible';
            return fallbackImg;
        }
    }

    /**
     * Update existing img element with responsive attributes
     * @param {HTMLImageElement} img - Image element to update
     * @param {string} src - Base image URL
     * @param {string} context - Image context
     */
    makeResponsive(img, src, context = 'card') {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Making image responsive', { src, context });
        } else {
            console.log(`[🖼️] Making image responsive: ${src}`);
        }

        if (!img || !src) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Invalid image or source provided', { img, src });
            } else {
                console.warn('[🖼️⚠️] Invalid image or source provided');
            }
            return;
        }

        try {
            img.srcset = this.generateSrcSet(src);
            img.sizes = this.generateSizes(context);
            img.src = this.getOptimalUrl(src, context === 'thumbnail' ? 200 : 300);
            img.loading = 'lazy';
            img.decoding = 'async';

            if (window.logger) {
                window.logger.success('RESPONSIVE-IMAGE', '✅ Image made responsive', { 
                    src: img.src, 
                    srcset: img.srcset, 
                    sizes: img.sizes 
                });
            } else {
                console.log(`[🖼️✅] Image made responsive with src: ${img.src}`);
            }
        } catch (error) {
            if (window.logger) {
                window.logger.error('RESPONSIVE-IMAGE', '❌ Error making image responsive', { error: error.message, src, context });
            } else {
                console.error(`[🖼️❌] Error making image responsive for ${src}:`, error);
            }
        }
    }

    /**
     * Preload critical images
     * @param {Array} imageUrls - Array of image URLs to preload
     * @param {string} context - Context for size selection
     */
    preloadImages(imageUrls, context = 'card') {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Preloading images', { imageUrls, context });
        } else {
            console.log(`[🖼️] Preloading ${imageUrls.length} images`);
        }

        if (!Array.isArray(imageUrls)) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Image URLs not provided as array', { imageUrls });
            } else {
                console.warn('[🖼️⚠️] Image URLs not provided as array');
            }
            return;
        }

        imageUrls.forEach(url => {
            if (!url) return;
            
            try {
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

                if (window.logger) {
                    window.logger.success('RESPONSIVE-IMAGE', '✅ Image preloaded', { url: link.href });
                } else {
                    console.log(`[🖼️✅] Image preloaded: ${link.href}`);
                }
            } catch (error) {
                if (window.logger) {
                    window.logger.error('RESPONSIVE-IMAGE', '❌ Error preloading image', { error: error.message, url });
                } else {
                    console.error(`[🖼️❌] Error preloading image ${url}:`, error);
                }
            }
        });
    }

    /**
     * Handle image loading errors with fallback
     * @param {HTMLImageElement} img - Image element
     * @param {string} fallbackSrc - Fallback image URL
     */
    handleError(img, fallbackSrc = '/images/placeholder-product.jpg') {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Setting up error handler', { fallbackSrc });
        } else {
            console.log(`[🖼️] Setting up error handler with fallback: ${fallbackSrc}`);
        }

        img.onerror = () => {
            if (window.logger) {
                window.logger.error('RESPONSIVE-IMAGE', '❌ Image load failed, using fallback', { 
                    originalSrc: img.src, 
                    fallbackSrc 
                });
            } else {
                console.error(`[🖼️❌] Image load failed, using fallback: ${fallbackSrc}`);
            }
            
            img.src = fallbackSrc;
            img.srcset = '';
            img.onerror = null; // Prevent infinite loop
            
            if (window.logger) {
                window.logger.success('RESPONSIVE-IMAGE', '✅ Fallback image applied', { fallbackSrc });
            } else {
                console.log(`[🖼️✅] Fallback image applied: ${fallbackSrc}`);
            }
        };
    }

    /**
     * Initialize responsive images in a container
     * @param {string|HTMLElement} container - Container selector or element
     * @param {string} context - Image context
     */
    initializeContainer(container, context = 'card') {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Initializing container', { container, context });
        } else {
            console.log(`[🖼️] Initializing container for context: ${context}`);
        }

        const containerEl = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
            
        if (!containerEl) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Container not found', { container });
            } else {
                console.warn(`[🖼️⚠️] Container not found: ${container}`);
            }
            return;
        }

        const images = containerEl.querySelectorAll('img[data-responsive]');
        
        if (images.length === 0) {
            if (window.logger) {
                window.logger.info('RESPONSIVE-IMAGE', 'ℹ️ No responsive images found in container', { container });
            } else {
                console.log(`[🖼️ℹ️] No responsive images found in container`);
            }
            return;
        }

        images.forEach(img => {
            const src = img.dataset.src || img.src;
            const imgContext = img.dataset.context || context;
            
            this.makeResponsive(img, src, imgContext);
            this.handleError(img);
        });

        if (window.logger) {
            window.logger.success('RESPONSIVE-IMAGE', '✅ Container initialized', { 
                container, 
                imagesCount: images.length 
            });
        } else {
            console.log(`[🖼️✅] Container initialized with ${images.length} images`);
        }
    }
}

// Create global instance
window.responsiveImage = new ResponsiveImageUtil();

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (window.logger) {
        window.logger.info('RESPONSIVE-IMAGE', '🔄 Auto-initializing responsive images');
    } else {
        console.log('[🖼️] Auto-initializing responsive images');
    }

    // Initialize all responsive images
    window.responsiveImage.initializeContainer(document.body);
    
    // Watch for dynamically added images
    const observer = new MutationObserver(mutations => {
        if (window.logger) {
            window.logger.debug('RESPONSIVE-IMAGE', '🔍 MutationObserver triggered', { mutationsCount: mutations.length });
        } else {
            console.log(`[🖼️🔍] MutationObserver triggered with ${mutations.length} mutations`);
        }

        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches && node.matches('img[data-responsive]')) {
                        const src = node.dataset.src || node.src;
                        const context = node.dataset.context || 'card';
                        
                        if (window.logger) {
                            window.logger.info('RESPONSIVE-IMAGE', '🔄 Processing dynamically added image', { src, context });
                        } else {
                            console.log(`[🖼️] Processing dynamically added image: ${src}`);
                        }
                        
                        window.responsiveImage.makeResponsive(node, src, context);
                        window.responsiveImage.handleError(node);
                    }
                    
                    // Check child images
                    const childImages = node.querySelectorAll && node.querySelectorAll('img[data-responsive]');
                    if (childImages) {
                        childImages.forEach(img => {
                            const src = img.dataset.src || img.src;
                            const context = img.dataset.context || 'card';
                            
                            if (window.logger) {
                                window.logger.info('RESPONSIVE-IMAGE', '🔄 Processing child image', { src, context });
                            } else {
                                console.log(`[🖼️] Processing child image: ${src}`);
                            }
                            
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

    if (window.logger) {
        window.logger.success('RESPONSIVE-IMAGE', '✅ Auto-initialization completed');
    } else {
        console.log('[🖼️✅] Auto-initialization completed');
    }
});

// Legacy lazy load for backward compatibility
document.addEventListener("DOMContentLoaded", function() {
    if (window.logger) {
        window.logger.info('RESPONSIVE-IMAGE', '🔄 Starting legacy lazy load for images');
    } else {
        console.log("[🖼️] Iniciando Lazy Load de Imágenes - FloresYa");
    }

    const lazyImages = [].slice.call(document.querySelectorAll("img[data-src]"));

    if ("IntersectionObserver" in window) {
        let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    let lazyImage = entry.target;
                    
                    if (window.logger) {
                        window.logger.info('RESPONSIVE-IMAGE', '🔄 Loading lazy image', { src: lazyImage.dataset.src });
                    } else {
                        console.log(`[🖼️] Loading lazy image: ${lazyImage.dataset.src}`);
                    }
                    
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove("lazy");
                    lazyImageObserver.unobserve(lazyImage);
                    
                    if (window.logger) {
                        window.logger.success('RESPONSIVE-IMAGE', '✅ Lazy image loaded', { src: lazyImage.dataset.src });
                    } else {
                        console.log(`[🖼️✅] Imagen cargada: ${lazyImage.dataset.src}`);
                    }
                }
            });
        });

        lazyImages.forEach(function(lazyImage) {
            lazyImageObserver.observe(lazyImage);
        });
    } else {
        // Fallback para navegadores antiguos
        if (window.logger) {
            window.logger.warn('RESPONSIVE-IMAGE', '⚠️ IntersectionObserver not supported, using fallback');
        } else {
            console.warn("[🖼️⚠️] IntersectionObserver not supported, using fallback");
        }
        
        lazyImages.forEach(function(img) {
            img.src = img.dataset.src;
            
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Fallback: Image loaded without IntersectionObserver', { src: img.dataset.src });
            } else {
                console.warn(`[🖼️⚠️] Fallback: Imagen cargada sin IntersectionObserver: ${img.dataset.src}`);
            }
        });
    }
});