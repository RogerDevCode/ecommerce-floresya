/**
 * 🌸 FloresYa Scroll Effects Fix - TypeScript Zero Tech Debt Edition
 * Replaces JavaScript scroll-linked effects with native CSS for optimal performance.
 * Follows Mozilla's recommendations: https://firefox-source-docs.mozilla.org/performance/scroll-linked_effects.html
 */

interface ScrollEffectElement {
    selector: string;
    styles: Partial<CSSStyleDeclaration>;
}

// @ts-nocheck
/* This file is meant to be loaded as a regular script, not a module */
class ScrollEffectsFixer {
    private readonly elementsToFix: ScrollEffectElement[];
    private readonly snapContainers: string[];

    constructor() {
        this.elementsToFix = [
            { selector: '.navbar', styles: { position: 'sticky', top: '0px', zIndex: '1000' } },
            { selector: '.admin-sidebar', styles: { position: 'sticky', top: '0px', zIndex: '1000' } },
            { selector: '.carousel-wrapper', styles: { position: 'sticky', top: '0px', zIndex: '1000' } },
            { selector: '[style*="position: absolute"][style*="top:"]', styles: { position: 'sticky', top: '0px', zIndex: '1000' } },
            { selector: '[data-sticky]', styles: { position: 'sticky', top: '0px', zIndex: '1000' } }
        ];

        this.snapContainers = [
            '.carousel-container',
            '.product-section',
            '.admin-content',
            '[data-snap-container]'
        ];

        this.init();
    }

    private init(): void {
        if (typeof window === 'undefined') return;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.applyFixes());
        } else {
            this.applyFixes();
        }
    }

    private applyFixes(): void {
        console.log('[🌸 ScrollFix] Applying performance optimizations for scroll-linked effects...');

        this.fixStickyElements();
        this.fixScrollSnapping();

        console.log('[🌸 ScrollFix] ✅ Scroll performance optimizations applied successfully.');
    }

    private fixStickyElements(): void {
        this.elementsToFix.forEach(({ selector, styles }) => {
            document.querySelectorAll(selector).forEach((el: Element) => {
                const element = el as HTMLElement;

                if (element.style.position === 'absolute' && element.style.top) {
                    Object.assign(element.style, styles);
                    element.style.transform = '';
                    element.style.marginTop = '';

                    console.log(`[🌸 ScrollFix] Fixed sticky element: ${selector}`);
                }
            });
        });
    }

    private fixScrollSnapping(): void {
        this.snapContainers.forEach(containerSelector => {
            document.querySelectorAll(containerSelector).forEach(container => {
                const containerEl = container as HTMLElement;

                Object.assign(containerEl.style, {
                    scrollSnapType: 'x proximity',
                    overflowX: 'auto',
                    scrollBehavior: 'smooth'
                });

                container.querySelectorAll('*').forEach(child => {
                    const childEl = child as HTMLElement;
                    Object.assign(childEl.style, {
                        scrollSnapAlign: 'start',
                        scrollSnapStop: 'always'
                    });
                });

                console.log(`[🌸 ScrollFix] Applied scroll snapping to: ${containerSelector}`);
            });
        });
    }
}

// Initialize the fixer
if (typeof window !== 'undefined') {
    new ScrollEffectsFixer();
    (window as any).ScrollEffectsFixer = ScrollEffectsFixer;
}

console.log('[🌸 ScrollFix] Scroll performance optimization script loaded and ready.');