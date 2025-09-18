class ScrollEffectsFixer {
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
    init() {
        if (typeof window === 'undefined')
            return;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.applyFixes());
        }
        else {
            this.applyFixes();
        }
    }
    applyFixes() {
        console.log('[🌸 ScrollFix] Applying performance optimizations for scroll-linked effects...');
        this.fixStickyElements();
        this.fixScrollSnapping();
        console.log('[🌸 ScrollFix] ✅ Scroll performance optimizations applied successfully.');
    }
    fixStickyElements() {
        this.elementsToFix.forEach(({ selector, styles }) => {
            document.querySelectorAll(selector).forEach((el) => {
                const element = el;
                if (element.style.position === 'absolute' && element.style.top) {
                    Object.assign(element.style, styles);
                    element.style.transform = '';
                    element.style.marginTop = '';
                    console.log(`[🌸 ScrollFix] Fixed sticky element: ${selector}`);
                }
            });
        });
    }
    fixScrollSnapping() {
        this.snapContainers.forEach(containerSelector => {
            document.querySelectorAll(containerSelector).forEach(container => {
                const containerEl = container;
                Object.assign(containerEl.style, {
                    scrollSnapType: 'x proximity',
                    overflowX: 'auto',
                    scrollBehavior: 'smooth'
                });
                container.querySelectorAll('*').forEach(child => {
                    const childEl = child;
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
if (typeof window !== 'undefined') {
    new ScrollEffectsFixer();
    window.ScrollEffectsFixer = ScrollEffectsFixer;
}
console.log('[🌸 ScrollFix] Scroll performance optimization script loaded and ready.');
export {};
