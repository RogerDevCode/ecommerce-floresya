/**
 * 🌸 FloresYa Tooltip Utilities
 * Advanced tooltip management and dynamic content
 */

class TooltipManager {
    constructor() {
        this.tooltips = new Map();
        this.init();
    }

    init() {
        // Add CSS file if not already included
        if (!document.querySelector('link[href*="tooltips.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/css/tooltips.css';
            document.head.appendChild(link);
        }

        // Initialize existing tooltips
        this.initializeExistingTooltips();

        // Set up mutation observer for dynamically added elements
        this.setupMutationObserver();
    }

    initializeExistingTooltips() {
        // Find all elements that should have tooltips
        const elements = document.querySelectorAll('[data-tooltip], [title]');
        elements.forEach(el => this.processElement(el));
    }

    processElement(element) {
        // Convert title attribute to data-tooltip for consistency
        if (element.hasAttribute('title') && !element.hasAttribute('data-tooltip')) {
            element.setAttribute('data-tooltip', element.getAttribute('title'));
            element.removeAttribute('title'); // Remove title to prevent browser default
        }

        // Add tooltip-trigger class if not present
        if (element.hasAttribute('data-tooltip') && !element.classList.contains('tooltip-trigger')) {
            element.classList.add('tooltip-trigger');
        }

        // Make element focusable if it's interactive but not already focusable
        if (this.isInteractiveElement(element) && !this.isFocusable(element)) {
            element.setAttribute('tabindex', '0');
        }
    }

    isInteractiveElement(element) {
        const interactiveTags = ['button', 'a', 'input', 'textarea', 'select'];
        const interactiveRoles = ['button', 'link', 'menuitem', 'option', 'tab'];
        const hasClickHandler = element.onclick || element.addEventListener;

        return interactiveTags.includes(element.tagName.toLowerCase()) ||
               interactiveRoles.includes(element.getAttribute('role')) ||
               element.hasAttribute('onclick') ||
               element.classList.contains('clickable');
    }

    isFocusable(element) {
        return element.tabIndex >= 0 ||
               ['input', 'textarea', 'select', 'button', 'a'].includes(element.tagName.toLowerCase());
    }

    setupMutationObserver() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Process the added element
                        this.processElement(node);

                        // Process children
                        const children = node.querySelectorAll('[data-tooltip], [title]');
                        children.forEach(child => this.processElement(child));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['title', 'data-tooltip']
        });
    }

    // Method to dynamically add tooltip to an element
    addTooltip(selector, text, options = {}) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.setAttribute('data-tooltip', text);
            el.classList.add('tooltip-trigger');

            // Apply options
            if (options.position) {
                el.setAttribute(`data-tooltip-${options.position}`, text);
                el.removeAttribute('data-tooltip');
            }

            if (options.type) {
                el.classList.add(`tooltip-${options.type}`);
            }

            if (options.long) {
                el.setAttribute('data-tooltip-long', text);
                el.removeAttribute('data-tooltip');
            }

            this.processElement(el);
        });
    }

    // Method to remove tooltip from an element
    removeTooltip(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.removeAttribute('data-tooltip');
            ['top', 'bottom', 'left', 'right', 'long'].forEach(pos => {
                el.removeAttribute(`data-tooltip-${pos}`);
            });
            el.classList.remove('tooltip-trigger');
            ['success', 'warning', 'error', 'info', 'primary'].forEach(type => {
                el.classList.remove(`tooltip-${type}`);
            });
        });
    }

    // Method to update tooltip text
    updateTooltip(selector, text, options = {}) {
        this.removeTooltip(selector);
        this.addTooltip(selector, text, options);
    }

    // Method to temporarily show tooltip programmatically
    showTooltip(selector, duration = 3000) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.classList.add('tooltip-visible');
            setTimeout(() => {
                el.classList.remove('tooltip-visible');
            }, duration);
        });
    }

    // Bulk tooltip assignment for common UI patterns
    initializeCommonTooltips() {
        const commonTooltips = {
            // Navigation
            '[href="/"]': 'Ir a la página principal',
            '[href="#"]': 'Enlace de navegación',
            '.logo-brand': 'Logo de FloresYa - Ir al inicio',

            // User actions
            '#loginBtn, #loginBtnMobile': 'Iniciar sesión en tu cuenta',
            '#registerBtn': 'Crear una cuenta nueva',
            '#logoutBtn, #logoutBtnMobile': 'Cerrar sesión',
            '#cartToggle': 'Ver carrito de compras',

            // Search
            '#searchInput': 'Buscar productos por nombre o categoría',
            '#searchBtn': 'Realizar búsqueda',

            // Product actions
            '.add-to-cart': 'Agregar producto al carrito',
            '.product-image': 'Ver detalles del producto',
            '.quantity-btn': 'Cambiar cantidad del producto',

            // Cart actions
            '#cart-close': 'Cerrar carrito',
            '.remove-item': 'Eliminar producto del carrito',
            '.clear-cart': 'Vaciar todo el carrito',
            '#checkoutBtn': 'Proceder al pago',

            // Social links
            '[href*="facebook"]': 'Síguenos en Facebook',
            '[href*="instagram"]': 'Síguenos en Instagram',
            '[href*="twitter"]': 'Síguenos en Twitter',
            '[href*="whatsapp"]': 'Contáctanos por WhatsApp',

            // Form elements
            'input[type="email"]': 'Ingresa tu dirección de correo electrónico',
            'input[type="password"]': 'Ingresa tu contraseña',
            'input[type="tel"]': 'Ingresa tu número de teléfono',
            'textarea': 'Ingresa tu mensaje o comentarios',

            // Modal controls
            '.modal-close': 'Cerrar ventana',
            '.modal-overlay': 'Hacer clic para cerrar',

            // Filter and sort
            '.filter-btn': 'Filtrar productos',
            '.sort-btn': 'Ordenar productos',
            '.clear-filters': 'Limpiar todos los filtros',

            // Admin actions
            '.edit-btn': 'Editar elemento',
            '.delete-btn': 'Eliminar elemento',
            '.view-btn': 'Ver detalles',
            '.save-btn': 'Guardar cambios',
            '.cancel-btn': 'Cancelar acción'
        };

        Object.entries(commonTooltips).forEach(([selector, tooltip]) => {
            this.addTooltip(selector, tooltip);
        });
    }

    // Context-aware tooltips based on user state
    updateContextualTooltips() {
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');

        if (isLoggedIn) {
            this.updateTooltip('#loginBtn', 'Ya has iniciado sesión');
            this.updateTooltip('#cartToggle', 'Ver tu carrito de compras');
        } else {
            this.updateTooltip('#cartToggle', 'Carrito de compras (inicia sesión para guardar)');
        }

        // Update cart count tooltip
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const count = parseInt(cartCount.textContent) || 0;
            const cartText = count === 0 ? 'Carrito vacío' :
                           count === 1 ? '1 producto en el carrito' :
                           `${count} productos en el carrito`;
            this.updateTooltip('#cartToggle', cartText);
        }
    }

    // Accessibility helpers
    addAriaLabels() {
        document.querySelectorAll('[data-tooltip]').forEach(el => {
            if (!el.hasAttribute('aria-label')) {
                el.setAttribute('aria-label', el.getAttribute('data-tooltip'));
            }
        });
    }

    // Performance optimizations
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
}

// Initialize tooltip manager when DOM is ready
let tooltipManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        tooltipManager = new TooltipManager();
        tooltipManager.initializeCommonTooltips();
        tooltipManager.updateContextualTooltips();
        tooltipManager.addAriaLabels();
    });
} else {
    tooltipManager = new TooltipManager();
    tooltipManager.initializeCommonTooltips();
    tooltipManager.updateContextualTooltips();
    tooltipManager.addAriaLabels();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TooltipManager;
} else if (typeof window !== 'undefined') {
    window.TooltipManager = TooltipManager;
    window.tooltipManager = tooltipManager;
}

// Auto-update contextual tooltips when user state changes
window.addEventListener('storage', () => {
    if (tooltipManager) {
        tooltipManager.updateContextualTooltips();
    }
});

// Update tooltips when cart changes
document.addEventListener('cartUpdated', () => {
    if (tooltipManager) {
        tooltipManager.updateContextualTooltips();
    }
});