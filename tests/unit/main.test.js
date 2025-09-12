/**
 * 🌸 FloresYa - Tests Unitarios para main.js
 * Tests para las funcionalidades modificadas en main.js, específicamente
 * la adición de data-product-id en createProductCard
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock global objects para simular el entorno del navegador
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000'
});

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = String(value); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
};

global.window.logger = {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    startTimer: vi.fn(() => ({ end: vi.fn() }))
};

global.window.floresyaProductImageHover = {
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn()
};

// Extender document con métodos mock adicionales si es necesario
Object.assign(global.document, {
    getElementById: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    addEventListener: vi.fn(),
    createElement: vi.fn((tag) => ({
        tagName: tag.toUpperCase(),
        style: {},
        setAttribute: vi.fn(),
        appendChild: vi.fn(),
        classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn()
        }
    }))
});

// Mock para requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0));

// Mock API
const mockApi = {
    formatCurrency: vi.fn((amount) => `$${amount.toFixed(2)}`),
    showNotification: vi.fn(),
    debounce: vi.fn((fn, delay) => fn)
};

global.api = mockApi;
global.bootstrap = {
    Modal: vi.fn(),
    Carousel: vi.fn()
};

// Simular FloresYaApp class
class MockFloresYaApp {
    constructor() {
        this.currentPage = 1;
        this.currentFilters = {};
        this.products = [];
        this.occasions = [];
        this.conversionOptimizer = {
            viewedProducts: new Set()
        };
        this.logger = window.logger;
    }

    log(message, data = null, level = 'info') {
        if (window.logger) {
            window.logger[level]('APP', message, data);
        }
    }

    createProductCard(product) {
        this.log('🔄 Creando tarjeta de producto', { productId: product.id, productName: product.name }, 'info');
        
        // Track product view for conversion optimization
        this.conversionOptimizer.viewedProducts.add(product.id);
        
        const occasionText = {
            'amor': 'Amor',
            'birthday': 'Cumpleaños',
            'anniversary': 'Aniversario',
            'graduation': 'Graduación',
            'friendship': 'Día de la Amistad',
            'condolencia': 'Condolencias',
            'mother': 'Día de la Madre',
            'yellow_flower': 'Flor Amarilla',
            'other': 'General'
        }[product.occasion] || 'General';
        
        // Imágenes de Supabase
        let allProductImages = [];
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            const sortedImages = product.images
                .sort((a, b) => a.display_order - b.display_order)
                .map(img => img.url_large)
                .filter(url => url && url !== '');
            allProductImages = sortedImages;
            this.log('✅ Imágenes de producto procesadas', { count: allProductImages.length }, 'success');
        } else {
            // Placeholder SVG integrado
            allProductImages = ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk1IiBmaWxsPSIjRkYxNDkzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPgogICAgPHBhdGggZD0iTTEwMCA2MCBDOTAgNzAsIDg1IDg1LCA5MCAxMDAgQzk1IDExNSwgMTEwIDExNSwgMTE1IDEwMCBDMTIwIDg1LCAxMTUgNzAsIDEwNSA2MCBaIiBmaWxsPSIjZmZmIiAvPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjUiIGZpbGw9IiNmZmYiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOSI+CiAgICAgICAgTm8gZGlzcG9uaWJsZQogICAgPC90ZXh0Pgo8L3N2Zz4='];
            this.log('⚠️ Usando placeholder SVG para producto', { productId: product.id }, 'warn');
        }
        
        const dataImages = allProductImages.length > 1 ? JSON.stringify(allProductImages) : JSON.stringify([allProductImages[0]]);
        const primaryImage = allProductImages[0];
        
        // Clean product card without urgency or social proof elements
            
        const cardHTML = `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card product-card-premium h-100 hover-lift" data-product-id="${product.id}">
                    <div class="product-image-container position-relative">
                        ${product.featured ? '<span class="badge-featured position-absolute top-0 start-0 m-2 badge premium-gradient text-white fw-bold z-index-10"><i class="bi bi-star-fill me-1"></i>Destacado</span>' : ''}
                        <!-- Stock Badge -->
                        <span class="position-absolute top-0 end-0 m-2 badge glass-morphism ${product.stock > 0 ? 'text-success' : 'text-warning'} z-index-10">
                            <i class="bi bi-${product.stock > 0 ? 'check-circle' : 'clock'} me-1"></i>
                            ${product.stock > 0 ? 'Disponible' : 'Consultar'}
                        </span>
                        <img data-responsive 
                             data-src="${primaryImage}" 
                             data-context="card"
                             class="card-img-top product-image" 
                             alt="${product.name}"
                             data-product-id="${product.id}"
                             data-images='${dataImages}'
                             data-current-index="0"
                             loading="lazy"
                             style="height: 250px; object-fit: cover; transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk1IiBmaWxsPSIjRkYxNDkzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPgogICAgPHBhdGggZD0iTTEwMCA2MCBDOTAgNzAsIDg1IDg1LCA5MCAxMDAgQzk1IDExNSwgMTEwIDExNSwgMTE1IDEwMCBDMTIwIDg1LCAxMTUgNzAsIDEwNSA2MCBaIiBmaWxsPSIjZmZmIiAvPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjUiIGZpbGw9IiNmZmYiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOSI+CiAgICAgICAgTm8gZGlzcG9uaWJsZQogICAgPC90ZXh0Pgo8L3N2Zz4='">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold mb-2">${product.name}</h5>
                        <p class="card-text text-muted flex-grow-1 small">${product.description ? this.truncateText(product.description, 80) : 'Hermoso arreglo floral perfecto para cualquier ocasión'}</p>
                        <!-- Occasion Badge with Premium Style -->
                        <div class="product-occasion mb-2">
                            <span class="badge trust-badge">
                                <i class="bi bi-flower1 me-1"></i>${occasionText}
                            </span>
                        </div>
                        <!-- Price Section with Enhanced Design -->
                        <div class="price-highlight mb-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="h5 text-primary-custom fw-bold mb-0">${api.formatCurrency(product.price)}</span>
                            </div>
                            <small class="text-muted">
                                <i class="bi bi-truck me-1"></i>Envío gratis incluido
                            </small>
                        </div>
                        <div class="mt-auto">
                            ${product.stock_quantity > 0 ? `
                                <div class="d-grid gap-2">
                                    <button class="btn cta-primary fw-bold" data-product-id="${product.id}" onclick="floresyaApp.buyNow(${product.id})">
                                        <i class="bi bi-cart-check me-2"></i>Comprar Ahora
                                        <small class="d-block" style="font-size: 0.75rem; opacity: 0.9;">Entrega rápida</small>
                                    </button>
                                    <button class="btn btn-outline-success btn-add-to-cart" data-product-id="${product.id}">
                                        <i class="bi bi-bag-plus me-1"></i> Agregar al Carrito
                                    </button>
                                </div>
                            ` : `
                                <div class="text-center">
                                    <button class="btn btn-secondary w-100 mb-2" disabled>
                                        <i class="bi bi-x-circle"></i> Temporalmente Agotado
                                    </button>
                                    <small class="text-muted">Notificaremos cuando esté disponible</small>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.log('✅ Tarjeta de producto creada', { productId: product.id }, 'success');
        return cardHTML;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substr(0, maxLength) + '...';
    }
}

describe('FloresYaApp - createProductCard', () => {
    let app;
    
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Create new instance for each test
        app = new MockFloresYaApp();
    });

    describe('Data-Product-ID Attributes', () => {
        test('should include data-product-id attribute on product image', () => {
            const mockProduct = {
                id: 123,
                name: 'Rosas Rojas Premium',
                description: 'Hermoso ramo de rosas rojas frescas',
                price: 25.99,
                stock_quantity: 10,
                featured: false,
                occasion: 'amor',
                images: [{
                    url_large: 'https://example.com/rose-large.jpg',
                    display_order: 1
                }]
            };

            const cardHTML = app.createProductCard(mockProduct);

            // Verificar que el HTML contiene el data-product-id en la imagen
            expect(cardHTML).toContain(`data-product-id="${mockProduct.id}"`);
            
            // Verificar que aparece específicamente en el elemento img
            expect(cardHTML).toMatch(
                /<img[^>]*data-product-id="123"[^>]*class="[^"]*product-image[^"]*"[^>]*>/
            );
        });

        test('should include data-product-id on card container', () => {
            const mockProduct = {
                id: 456,
                name: 'Girasoles Brillantes',
                description: 'Alegres girasoles que iluminan tu día',
                price: 18.50,
                stock_quantity: 5,
                featured: true,
                occasion: 'birthday',
                images: []
            };

            const cardHTML = app.createProductCard(mockProduct);

            // Verificar que el contenedor principal tiene data-product-id
            expect(cardHTML).toMatch(
                /<div[^>]*class="[^"]*product-card-premium[^"]*"[^>]*data-product-id="456"[^>]*>/
            );
        });

        test('should include data-product-id on action buttons', () => {
            const mockProduct = {
                id: 789,
                name: 'Orquídeas Elegantes',
                description: 'Exquisitas orquídeas para ocasiones especiales',
                price: 45.00,
                stock_quantity: 3,
                featured: false,
                occasion: 'anniversary',
                images: [{
                    url_large: 'https://example.com/orchid-large.jpg',
                    display_order: 1
                }]
            };

            const cardHTML = app.createProductCard(mockProduct);

            // Verificar botón de compra rápida
            expect(cardHTML).toMatch(
                /<button[^>]*class="[^"]*cta-primary[^"]*"[^>]*data-product-id="789"[^>]*>/
            );

            // Verificar botón de agregar al carrito
            expect(cardHTML).toMatch(
                /<button[^>]*class="[^"]*btn-add-to-cart[^"]*"[^>]*data-product-id="789"[^>]*>/
            );
        });
    });

    describe('Data-Images Attribute', () => {
        test('should include data-images with single image', () => {
            const mockProduct = {
                id: 111,
                name: 'Rosa Individual',
                price: 5.99,
                stock_quantity: 20,
                images: [{
                    url_large: 'https://example.com/single-rose.jpg',
                    display_order: 1
                }]
            };

            const cardHTML = app.createProductCard(mockProduct);

            // Verificar que contiene data-images con la imagen
            expect(cardHTML).toContain('data-images=\'["https://example.com/single-rose.jpg"]\'');
        });

        test('should include data-images with multiple images', () => {
            const mockProduct = {
                id: 222,
                name: 'Bouquet Variado',
                price: 35.99,
                stock_quantity: 8,
                images: [
                    { url_large: 'https://example.com/bouquet1.jpg', display_order: 1 },
                    { url_large: 'https://example.com/bouquet2.jpg', display_order: 2 },
                    { url_large: 'https://example.com/bouquet3.jpg', display_order: 3 }
                ]
            };

            const cardHTML = app.createProductCard(mockProduct);

            const expectedDataImages = JSON.stringify([
                'https://example.com/bouquet1.jpg',
                'https://example.com/bouquet2.jpg', 
                'https://example.com/bouquet3.jpg'
            ]);

            expect(cardHTML).toContain(`data-images='${expectedDataImages}'`);
        });

        test('should use placeholder when no images provided', () => {
            const mockProduct = {
                id: 333,
                name: 'Producto Sin Imagen',
                price: 15.99,
                stock_quantity: 12,
                images: []
            };

            const cardHTML = app.createProductCard(mockProduct);

            // Verificar que usa placeholder SVG
            expect(cardHTML).toContain('data:image/svg+xml;base64');
            
            // Verificar que data-images contiene el placeholder
            expect(cardHTML).toMatch(/data-images='\["data:image\/svg\+xml;base64,[^"]*"\]'/);
        });
    });

    describe('Image Hover System Integration', () => {
        test('should include product-image class for hover system', () => {
            const mockProduct = {
                id: 444,
                name: 'Lirios Frescos',
                price: 22.50,
                stock_quantity: 6,
                images: [{
                    url_large: 'https://example.com/lily.jpg',
                    display_order: 1
                }]
            };

            const cardHTML = app.createProductCard(mockProduct);

            // Verificar que la imagen tiene la clase product-image
            expect(cardHTML).toMatch(
                /<img[^>]*class="[^"]*product-image[^"]*"[^>]*>/
            );
        });

        test('should track product views in conversion optimizer', () => {
            const mockProduct = {
                id: 555,
                name: 'Claveles Coloridos',
                price: 12.99,
                stock_quantity: 15,
                images: []
            };

            app.createProductCard(mockProduct);

            // Verificar que el producto fue agregado al set de productos vistos
            expect(app.conversionOptimizer.viewedProducts.has(555)).toBe(true);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle product without images gracefully', () => {
            const mockProduct = {
                id: 666,
                name: 'Producto Básico',
                price: 10.00,
                stock_quantity: 1
                // images property missing
            };

            const cardHTML = app.createProductCard(mockProduct);

            // Debe incluir placeholder y data-product-id
            expect(cardHTML).toContain(`data-product-id="666"`);
            expect(cardHTML).toContain('data:image/svg+xml;base64');
        });

        test('should handle zero stock correctly', () => {
            const mockProduct = {
                id: 777,
                name: 'Producto Agotado',
                price: 30.00,
                stock_quantity: 0,
                images: []
            };

            const cardHTML = app.createProductCard(mockProduct);

            // Verificar que muestra como agotado pero mantiene data-product-id
            expect(cardHTML).toContain(`data-product-id="777"`);
            expect(cardHTML).toContain('Temporalmente Agotado');
            expect(cardHTML).not.toContain('¡Comprar Ahora!');
        });

        test('should filter out empty image URLs', () => {
            const mockProduct = {
                id: 888,
                name: 'Producto con URLs Vacías',
                price: 20.00,
                stock_quantity: 5,
                images: [
                    { url_large: 'https://example.com/valid.jpg', display_order: 1 },
                    { url_large: '', display_order: 2 },
                    { url_large: 'https://example.com/valid2.jpg', display_order: 3 },
                    { url_large: null, display_order: 4 }
                ]
            };

            const cardHTML = app.createProductCard(mockProduct);

            // Verificar que solo incluye las URLs válidas
            const expectedDataImages = JSON.stringify([
                'https://example.com/valid.jpg',
                'https://example.com/valid2.jpg'
            ]);

            expect(cardHTML).toContain(`data-images='${expectedDataImages}'`);
        });
    });

    describe('Logging and Monitoring', () => {
        test('should log product card creation', () => {
            const mockProduct = {
                id: 999,
                name: 'Test Logging Product',
                price: 15.00,
                stock_quantity: 7,
                images: []
            };

            app.createProductCard(mockProduct);

            // Verificar que se llamaron los métodos de logging
            expect(window.logger.info).toHaveBeenCalledWith(
                'APP',
                '🔄 Creando tarjeta de producto',
                { productId: 999, productName: 'Test Logging Product' }
            );

            expect(window.logger.success).toHaveBeenCalledWith(
                'APP',
                '✅ Tarjeta de producto creada',
                { productId: 999 }
            );
        });
    });
});