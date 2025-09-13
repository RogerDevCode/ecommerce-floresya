/**
 * 🌸 FloresYa Responsive Image Utility
 * Professional TypeScript implementation for WebP image management
 * Handles multiple sizes with optimal loading performance
 */

import type { ResponsiveImageConfig, Logger } from '@shared/types/frontend.js';

interface ImageSizes {
    thumb: { width: number; suffix: string };
    medium: { width: number; suffix: string };
    large: { width: number; suffix: string };
}

interface ResponsiveUrls {
    thumb: string;
    medium: string;
    large: string;
}

interface SizeMap {
    [key: string]: string;
    thumbnail: string;
    card: string;
    detail: string;
    zoom: string;
    admin_thumb: string;
}

// Global window interface for responsive image utility
declare global {
    interface Window {
        responsiveImage?: ResponsiveImageUtil;
        logger?: Logger;
        MutationObserver?: typeof MutationObserver;
    }
    
    interface Node {
        matches?: (selector: string) => boolean;
        querySelectorAll?: (selector: string) => NodeListOf<Element>;
    }
}

class ResponsiveImageUtil {
    private sizes: ImageSizes;

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
     * @param baseUrl - Base image URL (large size)
     * @returns Object with all size variants
     */
    public getResponsiveUrls(baseUrl: string): ResponsiveUrls {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Enter getResponsiveUrls', { baseUrl });
        } else {
            console.log('[🖼️] Enter getResponsiveUrls with baseUrl:', baseUrl);
        }

        if (!baseUrl || !baseUrl.includes('.webp')) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Base URL not provided or not WebP, returning original', { baseUrl });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting getResponsiveUrls with original baseUrl');
            } else {
                console.warn('[🖼️⚠️] Base URL not provided or not WebP, returning original:', baseUrl);
                console.log('[🖼️] Exiting getResponsiveUrls with original baseUrl');
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
                console.warn('[🖼️⚠️] Double-processed URL detected, attempting to clean:', baseUrl);
            }

            const cleanUrl = baseUrl
                .replace('-medium.webp-thumb.webp', '-medium.webp')
                .replace('-thumb.webp-thumb.webp', '-thumb.webp')
                .replace('-large.webp-thumb.webp', '-large.webp')
                .replace('-medium.webp-medium.webp', '-medium.webp')
                .replace('-thumb.webp-medium.webp', '-thumb.webp');

            if (window.logger) {
                window.logger.info('RESPONSIVE-IMAGE', '✅ Cleaned URL', { original: baseUrl, cleaned: cleanUrl });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting getResponsiveUrls with cleaned URL');
            } else {
                console.log('[🖼️✅] Cleaned URL:', cleanUrl);
                console.log('[🖼️] Exiting getResponsiveUrls with cleaned URL');
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
                window.logger.info('RESPONSIVE-IMAGE', '✅ Generated responsive URLs for Supabase image', {
                    thumb: thumbUrl,
                    medium: mediumUrl,
                    large: largeUrl
                });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting getResponsiveUrls with Supabase URLs');
            } else {
                console.log('[🖼️✅] Generated responsive URLs for Supabase image', { thumb: thumbUrl, medium: mediumUrl, large: largeUrl });
                console.log('[🖼️] Exiting getResponsiveUrls with Supabase URLs');
            }
            return {
                large: largeUrl, // 800x800
                medium: mediumUrl, // 500x500
                thumb: thumbUrl // 200x200
            };
        }

        // Support for local proxy URLs (supabase.co/storage)
        if (baseUrl.includes('supabase.co/storage')) {
            if (window.logger) {
                window.logger.info('RESPONSIVE-IMAGE', '🔄 Generating proxy URLs for Supabase image', { baseUrl });
            } else {
                console.log('[🖼️] Generating proxy URLs for Supabase image:', baseUrl);
            }

            // Use local proxy as fallback for CORS issues
            const filename = baseUrl.split('/').pop();
            
            if (window.logger) {
                window.logger.info('@2 RESPONSIVE-IMAGE', '🔄 Generating proxy URLs for Supabase image', { baseUrl });
            } else {
                console.log('@2 [🖼️] Generating proxy URLs for Supabase image:', baseUrl);
            }
            
            if (!filename) {
                if (window.logger) {
                    window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Could not extract filename from URL', { baseUrl });
                } else {
                    console.warn('[🖼️⚠️] Could not extract filename from URL:', baseUrl);
                }
                return {
                    thumb: baseUrl,
                    medium: baseUrl,
                    large: baseUrl
                };
            }
            
            // Remove any existing size suffix to get base filename
            let baseFilename = filename
                .replace('-large.webp', '')
                .replace('-medium.webp', '')
                .replace('-thumb.webp', '');
            // If filename still has .webp, remove it for proper reconstruction
            if (baseFilename.endsWith('.webp')) {
                baseFilename = baseFilename.replace('.webp', '');
            }

            const urls: ResponsiveUrls = {
                large: `/api/images/direct/large/${baseFilename}-large.webp`,
                medium: `/api/images/direct/medium/${baseFilename}-medium.webp`,
                thumb: `/api/images/direct/thumb/${baseFilename}-thumb.webp`
            };
            if (window.logger) {
                window.logger.info('RESPONSIVE-IMAGE', '✅ Generated proxy URLs', { urls });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting getResponsiveUrls with proxy URLs');
            } else {
                console.log('[🖼️✅] Generated proxy URLs', urls);
                console.log('[🖼️] Exiting getResponsiveUrls with proxy URLs');
            }
            return urls;
        }

        if (window.logger) {
            window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Unknown URL pattern, returning original', { baseUrl });
            window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting getResponsiveUrls with original baseUrl');
        } else {
            console.warn('[🖼️⚠️] Unknown URL pattern, returning original:', baseUrl);
            console.log('[🖼️] Exiting getResponsiveUrls with original baseUrl');
        }
        return {
            thumb: baseUrl,
            medium: baseUrl,
            large: baseUrl
        };
    }

    /**
     * Generate srcset attribute for responsive images
     * @param baseUrl - Base image URL
     * @returns srcset attribute value
     */
    public generateSrcSet(baseUrl: string): string {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Enter generateSrcSet', { baseUrl });
        } else {
            console.log('[🖼️] Enter generateSrcSet with baseUrl:', baseUrl);
        }

        if (!baseUrl) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ No base URL provided for srcset');
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting generateSrcSet with empty string');
            } else {
                console.warn('[🖼️⚠️] No base URL provided for srcset');
                console.log('[🖼️] Exiting generateSrcSet with empty string');
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
                window.logger.info('RESPONSIVE-IMAGE', '✅ Srcset generated', { srcset });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting generateSrcSet with srcset');
            } else {
                console.log('[🖼️✅] Srcset generated:', srcset);
                console.log('[🖼️] Exiting generateSrcSet with srcset');
            }
            return srcset;
        } catch (error) {
            if (window.logger) {
                window.logger.error('RESPONSIVE-IMAGE', '❌ Error generating srcset', { 
                    error: error instanceof Error ? error.message : String(error), 
                    baseUrl 
                });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting generateSrcSet on error with empty string');
            } else {
                console.error(`[🖼️❌] Error generating srcset for ${baseUrl}:`, error);
                console.log('[🖼️] Exiting generateSrcSet on error with empty string');
            }
            return '';
        }
    }

    /**
     * Generate sizes attribute based on container context
     * @param context - Context: 'thumbnail', 'card', 'detail', 'zoom'
     * @returns sizes attribute value
     */
    public generateSizes(context: string = 'card'): string {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Enter generateSizes', { context });
        } else {
            console.log('[🖼️] Enter generateSizes with context:', context);
        }

        const sizeMap: SizeMap = {
            thumbnail: '200px',
            card: '(max-width: 576px) 50vw, (max-width: 768px) 33vw, (max-width: 992px) 25vw, 300px',
            detail: '(max-width: 768px) 100vw, (max-width: 992px) 50vw, 500px',
            zoom: '(max-width: 768px) 100vw, 800px',
            admin_thumb: '200px'
        };

        const sizes = sizeMap[context] || sizeMap.card;

        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '✅ Sizes generated', { context, sizes });
            window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting generateSizes with sizes');
        } else {
            console.log('[🖼️✅] Sizes generated for context', context, ':', sizes);
            console.log('[🖼️] Exiting generateSizes with sizes');
        }

        return sizes;
    }

    /**
     * Get optimal image URL based on container width
     * @param baseUrl - Base image URL
     * @param containerWidth - Expected container width
     * @returns Optimal image URL
     */
    public getOptimalUrl(baseUrl: string, containerWidth: number = 300): string {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Enter getOptimalUrl', { baseUrl, containerWidth });
        } else {
            console.log('[🖼️] Enter getOptimalUrl with baseUrl:', baseUrl, 'containerWidth:', containerWidth);
        }

        if (!baseUrl) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ No base URL provided for optimal URL');
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting getOptimalUrl with original baseUrl');
            } else {
                console.warn('[🖼️⚠️] No base URL provided for optimal URL');
                console.log('[🖼️] Exiting getOptimalUrl with original baseUrl');
            }
            return baseUrl;
        }

        try {
            const urls = this.getResponsiveUrls(baseUrl);
            let optimalUrl: string;
            if (containerWidth <= 200) {
                optimalUrl = urls.thumb;
            } else if (containerWidth <= 500) {
                optimalUrl = urls.medium;
            } else {
                optimalUrl = urls.large;
            }

            if (window.logger) {
                window.logger.info('RESPONSIVE-IMAGE', '✅ Optimal URL selected', {
                    containerWidth,
                    selected: optimalUrl,
                    allUrls: urls
                });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting getOptimalUrl with optimal URL');
            } else {
                console.log('[🖼️✅] Optimal URL selected:', optimalUrl, 'for containerWidth:', containerWidth);
                console.log('[🖼️] Exiting getOptimalUrl with optimal URL');
            }
            return optimalUrl;
        } catch (error) {
            if (window.logger) {
                window.logger.error('RESPONSIVE-IMAGE', '❌ Error getting optimal URL', { 
                    error: error instanceof Error ? error.message : String(error), 
                    baseUrl, 
                    containerWidth 
                });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting getOptimalUrl on error with original baseUrl');
            } else {
                console.error('[🖼️❌] Error getting optimal URL for', baseUrl, ':', error);
                console.log('[🖼️] Exiting getOptimalUrl on error with original baseUrl');
            }
            return baseUrl;
        }
    }

    /**
     * Create a responsive image element
     * @param src - Base image URL
     * @param alt - Alt text
     * @param context - Image context
     * @param attributes - Additional attributes
     * @returns Configured img element
     */
    public createImage(
        src: string, 
        alt: string = '', 
        context: string = 'card', 
        attributes: Partial<HTMLImageElement> = {}
    ): HTMLImageElement {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Enter createImage', { src, alt, context });
        } else {
            console.log('[🖼️] Enter createImage with src:', src, 'alt:', alt, 'context:', context);
        }

        try {
            const img = document.createElement('img');
            if (!src) {
                img.src = '/images/placeholder-product.jpg';
                img.alt = alt || 'Imagen no disponible';
                if (window.logger) {
                    window.logger.warn('RESPONSIVE-IMAGE', '⚠️ No source provided, using placeholder', { alt });
                    window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting createImage with placeholder img');
                } else {
                    console.warn('[🖼️⚠️] No source provided, using placeholder');
                    console.log('[🖼️] Exiting createImage with placeholder img');
                }
                return img;
            }

            img.srcset = this.generateSrcSet(src);
            img.sizes = this.generateSizes(context);
            img.src = this.getOptimalUrl(src, context === 'thumbnail' ? 200 : 300);
            img.alt = alt;
            img.loading = 'lazy';
            img.decoding = 'async';

            Object.assign(img, attributes);

            if (window.logger) {
                window.logger.info('RESPONSIVE-IMAGE', '✅ Responsive image created', {
                    src: img.src,
                    srcset: img.srcset,
                    sizes: img.sizes
                });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting createImage with created img');
            } else {
                console.log('[🖼️✅] Responsive image created with src:', img.src);
                console.log('[🖼️] Exiting createImage with created img');
            }

            return img;

        } catch (error) {
            if (window.logger) {
                window.logger.error('RESPONSIVE-IMAGE', '❌ Error creating responsive image', { 
                    error: error instanceof Error ? error.message : String(error), 
                    src, 
                    alt, 
                    context 
                });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting createImage on error with fallback img');
            } else {
                console.error('[🖼️❌] Error creating responsive image for', src, ':', error);
                console.log('[🖼️] Exiting createImage on error with fallback img');
            }
            const fallbackImg = document.createElement('img');
            fallbackImg.src = '/images/placeholder-product.jpg';
            fallbackImg.alt = alt || 'Imagen no disponible';
            return fallbackImg;
        }
    }

    /**
     * Update existing img element with responsive attributes
     * @param img - Image element to update
     * @param src - Base image URL
     * @param context - Image context
     */
    public makeResponsive(img: HTMLImageElement, src: string, context: string = 'card'): void {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Enter makeResponsive', { src, context });
            window.logger.info('RESPONSIVE-IMAGE', '🔄 img element:', img);
        } else {
            console.log('[🖼️] Enter makeResponsive with src:', src, 'and context:', context);
            console.log('[🖼️] img element:', img);
        }

        if (!img || !src) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Invalid image or source provided', { img, src });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting makeResponsive due to invalid arguments');
            } else {
                console.warn('[🖼️⚠️] Invalid image or source provided:', img, src);
                console.log('[🖼️] Exiting makeResponsive due to invalid arguments');
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
                window.logger.info('RESPONSIVE-IMAGE', '✅ Image made responsive', {
                    src: img.src,
                    srcset: img.srcset,
                    sizes: img.sizes
                });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting makeResponsive with success');
            } else {
                console.log('[🖼️✅] Image made responsive with src:', img.src);
                console.log('[🖼️] Exiting makeResponsive with success');
            }
        } catch (error) {
            if (window.logger) {
                window.logger.error('RESPONSIVE-IMAGE', '❌ Error making image responsive', { 
                    error: error instanceof Error ? error.message : String(error), 
                    src, 
                    context 
                });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting makeResponsive on error');
            } else {
                console.error('[🖼️❌] Error making image responsive for', src, ':', error);
                console.log('[🖼️] Exiting makeResponsive on error');
            }
        }
    }

    /**
     * Preload critical images
     * @param imageUrls - Array of image URLs to preload
     * @param context - Context for size selection
     */
    public preloadImages(imageUrls: string[], context: string = 'card'): void {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Enter preloadImages', { imageUrls, context });
        } else {
            console.log('[🖼️] Preloading', imageUrls.length, 'images with context:', context);
        }

        if (!Array.isArray(imageUrls)) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Image URLs not provided as array', { imageUrls });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting preloadImages due to invalid argument');
            } else {
                console.warn('[🖼️⚠️] Image URLs not provided as array:', imageUrls);
                console.log('[🖼️] Exiting preloadImages due to invalid argument');
            }
            return;
        }

        imageUrls.forEach((url: string) => {
            if (!url) return;
            try {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = this.getOptimalUrl(url, context === 'thumbnail' ? 200 : 300);
                if (context === 'detail') {
                    // Preload multiple sizes for detail pages
                    (link as any).imagesrcset = this.generateSrcSet(url);
                    (link as any).imagesizes = this.generateSizes(context);
                }
                document.head.appendChild(link);
                if (window.logger) {
                    window.logger.info('RESPONSIVE-IMAGE', '✅ Image preloaded', { url: link.href });
                } else {
                    console.log('[🖼️✅] Image preloaded:', link.href);
                }
            } catch (error) {
                if (window.logger) {
                    window.logger.error('RESPONSIVE-IMAGE', '❌ Error preloading image', { 
                        error: error instanceof Error ? error.message : String(error), 
                        url 
                    });
                } else {
                    console.error('[🖼️❌] Error preloading image', url, ':', error);
                }
            }
        });

        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting preloadImages');
        } else {
            console.log('[🖼️] Exiting preloadImages');
        }
    }

    /**
     * Handle image loading errors with fallback
     * @param img - Image element
     * @param fallbackSrc - Fallback image URL
     */
    public handleError(img: HTMLImageElement, fallbackSrc: string = '/images/placeholder-product.jpg'): void {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Setting up error handler', { fallbackSrc });
        } else {
            console.log('[🖼️] Setting up error handler with fallback:', fallbackSrc);
        }

        img.onerror = function() {
            if (window.logger) {
                window.logger.error('RESPONSIVE-IMAGE', '❌ Image load failed, using fallback', {
                    originalSrc: img.src,
                    fallbackSrc: fallbackSrc
                });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Fallback image applied and error handler cleared');
            } else {
                console.error('[🖼️❌] Image load failed, using fallback:', fallbackSrc);
                console.log('[🖼️] Fallback image applied and error handler cleared');
            }

            img.src = fallbackSrc;
            img.srcset = '';
            img.onerror = null; // Prevent infinite loop
        };
    }

    /**
     * Initialize responsive images in a container
     * @param container - Container selector or element
     * @param context - Image context
     */
    public initializeContainer(container: string | HTMLElement, context: string = 'card'): void {
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '🔄 Enter initializeContainer', { container, context });
        } else {
            console.log('[🖼️] Enter initializeContainer for context:', context, ' container:', container);
        }

        const containerEl = typeof container === 'string'
            ? document.querySelector(container) as HTMLElement
            : container;

        if (!containerEl) {
            if (window.logger) {
                window.logger.warn('RESPONSIVE-IMAGE', '⚠️ Container not found', { container });
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting initializeContainer due to missing container');
            } else {
                console.warn('[🖼️⚠️] Container not found:', container);
                console.log('[🖼️] Exiting initializeContainer due to missing container');
            }
            return;
        }

        const images = containerEl.querySelectorAll('img[data-responsive]') as NodeListOf<HTMLImageElement>;
        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', 'ℹ️ Images found in container', { count: images.length });
        } else {
            console.log('[🖼️ℹ️] Images found in container:', images.length);
        }

        if (images.length === 0) {
            if (window.logger) {
                window.logger.info('RESPONSIVE-IMAGE', 'ℹ️ No responsive images found in container');
                window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting initializeContainer, no images to update');
            } else {
                console.log('[🖼️ℹ️] No responsive images found in container');
                console.log('[🖼️] Exiting initializeContainer, no images to update');
            }
            return;
        }

        images.forEach((img: HTMLImageElement) => {
            const src = (img.dataset.src || img.src) as string;
            const imgContext = (img.dataset.context || context) as string;

            if (window.logger) {
                window.logger.info('RESPONSIVE-IMAGE', '🔄 Updating responsive image', { src, imgContext });
            } else {
                console.log('[🖼️] Updating responsive image:', src, 'context:', imgContext);
            }

            this.makeResponsive(img, src, imgContext);
            this.handleError(img);
        });

        if (window.logger) {
            window.logger.info('RESPONSIVE-IMAGE', '✅ Container initialized', { container, imageCount: images.length });
            window.logger.info('RESPONSIVE-IMAGE', '⏹ Exiting initializeContainer with success');
        } else {
            console.log(`[🖼️✅] Container initialized with ${images.length} images`);
            console.log('[🖼️] Exiting initializeContainer with success');
        }
    }
}

// Global instance creation
window.responsiveImage = new ResponsiveImageUtil();

// Auto-initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.logger) {
        window.logger.info('RESPONSIVE-IMAGE', '🔄 Auto-initializing responsive images');
    } else {
        console.log('[🖼️] Auto-initializing responsive images');
    }

    window.responsiveImage?.initializeContainer(document.body);

    // Use MutationObserver to detect dynamically added images
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations: MutationRecord[]) {
            if (window.logger) {
                window.logger.debug('RESPONSIVE-IMAGE', '🔍 MutationObserver triggered', { mutationsCount: mutations.length });
            } else {
                console.log('[🖼️🔍] MutationObserver triggered with ' + mutations.length + ' mutations');
            }

            mutations.forEach(function(mutation: MutationRecord) {
                mutation.addedNodes.forEach(function(node: Node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        if (element.matches && element.matches('img[data-responsive]')) {
                            const img = element as HTMLImageElement;
                            const src = img.dataset.src || img.src;
                            const context = img.dataset.context || 'card';
                            if (window.logger) {
                                window.logger.info('RESPONSIVE-IMAGE', '🔄 Processing newly added image', { src, context });
                            } else {
                                console.log('[🖼️] Processing newly added image: ' + src);
                            }
                            window.responsiveImage?.makeResponsive(img, src, context);
                            window.responsiveImage?.handleError(img);
                        }
                        // Process child images within new nodes
                        const childImages = element.querySelectorAll?.('img[data-responsive]') as NodeListOf<HTMLImageElement> | undefined;
                        if (childImages && childImages.length) {
                            childImages.forEach(function(img: HTMLImageElement) {
                                const src = img.dataset.src || img.src;
                                const context = img.dataset.context || 'card';
                                if (window.logger) {
                                    window.logger.info('RESPONSIVE-IMAGE', '🔄 Processing newly added child image', { src, context });
                                } else {
                                    console.log('[🖼️] Processing newly added child image: ' + src);
                                }
                                window.responsiveImage?.makeResponsive(img, src, context);
                                window.responsiveImage?.handleError(img);
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
    }

    if (window.logger) {
        window.logger.info('RESPONSIVE-IMAGE', '✅ Auto-initialization completed');
    } else {
        console.log('[🖼️✅] Auto-initialization completed');
    }
});

// Export for module systems
export default ResponsiveImageUtil;
export { ResponsiveImageUtil };
export type { ResponsiveUrls, ImageSizes, SizeMap };