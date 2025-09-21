/**
 * 🌸 FloresYa Scroll Effects Fix - TypeScript Zero Tech Debt Edition
 * Replaces JavaScript scroll-linked effects with native CSS for optimal performance.
 * Follows Mozilla's recommendations: https://firefox-source-docs.mozilla.org/performance/scroll-linked_effects.html
 */

export interface ScrollEffectElement {
    selector: string;
    styles: Record<string, string>;
}

export interface WindowWithScrollEffectsFixer extends Window {
    ScrollEffectsFixer?: typeof ScrollEffectsFixer;
}

export class ScrollEffectsFixer {
    private readonly elementsToFix: ScrollEffectElement[];
    private readonly snapContainers: string[];

    constructor() {
        this.elementsToFix = [
            { selector: '.navbar', styles: { position: 'sticky', top: '0px', zIndex: '1000' } },
            { selector: '.admin-sidebar', styles: { position: 'sticky', top: '0px', zIndex: '1000' } },
            { selector: '.carousel-wrapper', styles: { position: 'sticky', top: '0px', zIndex: '1000' } },
            { selector: '[style*="position: absolute"][style*="top:"]', styles: { position: 'sticky', top: '0px', zIndex: '1000' } },
            { selector: '[data-sticky]', styles: { position: 'sticky', top: '0px', zIndex: '1000' } }
        ] as ScrollEffectElement[];

        this.snapContainers = [
            '.carousel-container',
            '.product-section',
            '.admin-content',
            '[data-snap-container]'
        ];

        this.init();
    }

    private init(): void {
        if (typeof window === 'undefined') {return;}

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.applyFixes());
        } else {
            this.applyFixes();
        }
    }

    private applyFixes(): void {
        // Applying performance optimizations for scroll-linked effects

        this.fixStickyElements();
        this.fixScrollSnapping();

        // Scroll performance optimizations applied successfully
    }

    private fixStickyElements(): void {
        this.elementsToFix.forEach(({ selector, styles }) => {
            document.querySelectorAll(selector).forEach((el: Element) => {
                const element = el as HTMLElement;

                if (element.style.position === 'absolute' && element.style.top) {
                    Object.assign(element.style, styles);
                    element.style.transform = '';
                    element.style.marginTop = '';

                    // Fixed sticky element: ${selector}
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

                // Applied scroll snapping to: ${containerSelector}
            });
        });
    }
}

// Auto-initialize when loaded as module
if (typeof window !== 'undefined') {
    new ScrollEffectsFixer();
    (window as WindowWithScrollEffectsFixer).ScrollEffectsFixer = ScrollEffectsFixer;
}

// Scroll performance optimization class loaded and exported