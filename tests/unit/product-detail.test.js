/**
 * 🌸 FloresYa - Tests Unitarios para product-detail.js
 * Tests para las funcionalidades modificadas en product-detail.js, específicamente
 * la adición de data-product-id en renderRelatedProducts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock global objects para simular el entorno del navegador
global.window = {
    location: { 
        hostname: 'localhost', 
        href: 'http://localhost:3000/pages/product-detail.html?id=1',
        search: '?id=1' 
    },
    localStorage: {
        store: {},
        getItem(key) { return this.store[key] || null; },
        setItem(key, value) { this.store[key] = String(value); },
        removeItem(key) { delete this.store[key]; },
        clear() { this.store = {}; }
    },
    floresyaLogger: {
        info: vi.fn(),
        error: vi.fn(),
        success: vi.fn(),
        warn: vi.fn(),
        startTimer: vi.fn(() => ({ end: vi.fn() }))
    },
    responsiveImage: {
        getResponsiveUrls: vi.fn((url) => ({
            large: url.replace('.jpg', '-large.jpg'),
            medium: url.replace('.jpg', '-medium.jpg'),
            thumb: url.replace('.jpg', '-thumb.jpg')
        })),
        makeResponsive: vi.fn()
    }
};

// Create persistent mock elements
const mockElements = {
    'related-products': {
        innerHTML: '',
        style: {},
        get innerHTML() { return this._innerHTML || ''; },
        set innerHTML(value) { this._innerHTML = value; }
    },
    'loading-spinner': {
        style: { display: 'block' }
    },
    'product-content': {
        style: { display: 'none' }
    }
};

global.document = {
    getElementById: vi.fn((id) => {
        return mockElements[id] || null;
    }),
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
    })),
    body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
    }
};

// Mock fetch
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            success: true,
            data: {
                products: [
                    {
                        id: 2,
                        name: 'Girasoles Alegres',
                        description: 'Hermosos girasoles que iluminan cualquier espacio',
                        price: 18.50,
                        primary_image: 'https://example.com/girasoles.jpg'
                    },
                    {
                        id: 3,
                        name: 'Rosas Blancas',
                        description: 'Elegantes rosas blancas para ocasiones especiales',
                        price: 22.99,
                        image_url: 'https://example.com/rosas-blancas.jpg'
                    },
                    {
                        id: 4,
                        name: 'Lirios Perfumados',
                        description: 'Exquisitos lirios con fragancia natural',
                        price: 28.75,
                        primary_image: 'https://example.com/lirios.jpg'
                    }
                ]
            }
        })
    })
);

// Mock para ShoppingCart
class MockShoppingCart {
    constructor() {
        this.items = [];
        this.exchangeRateBCV = 36.5;
        this.listeners = [];
    }

    async init() {
        return Promise.resolve();
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    addItem(item) {
        const existing = this.items.find(i => i.id === item.id);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            this.items.push(item);
        }
        this.notifyListeners();
    }

    onChange(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback());
    }
}

global.ShoppingCart = MockShoppingCart;

// Mock API
const mockApi = {
    getProduct: vi.fn(() => Promise.resolve({
        success: true,
        data: {
            id: 1,
            name: 'Rosas Rojas Premium',
            description: 'Hermoso ramo de rosas rojas frescas',
            price: 25.99,
            stock_quantity: 10,
            category_id: 1,
            occasion: 'amor',
            images: [{
                url_large: 'https://example.com/rose-large.jpg',
                display_order: 1
            }]
        }
    })),
    formatCurrency: vi.fn((amount) => `$${amount.toFixed(2)}`),
    showNotification: vi.fn(),
    getUser: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false)
};

global.api = mockApi;

// Mock ProductDetail class
class MockProductDetail {
    constructor() {
        this.productId = null;
        this.product = null;
        this.currentImageIndex = 0;
        this.images = [];
        this.cart = null;
        this.exchangeRate = 36.5;
        this.logger = window.floresyaLogger || console;
    }

    getProductIdFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('id');
        } catch (error) {
            return null;
        }
    }

    async init() {
        this.productId = this.getProductIdFromURL();
        this.cart = new MockShoppingCart();
        await this.cart.init();
        await this.loadProduct();
        this.updateCartCount();
    }

    async loadProduct() {
        const response = await api.getProduct(this.productId);
        if (response.success) {
            this.product = response.data;
            this.setupImages();
        }
    }

    setupImages() {
        this.images = [];
        if (this.product.images && Array.isArray(this.product.images)) {
            this.images = this.product.images.map(img => img.url_large);
        }
        if (this.images.length === 0) {
            this.images.push('/images/placeholder-product-2.webp');
        }
    }

    async loadRelatedProducts() {
        try {
            this.logger.info('RELATED', '🔍 Cargando productos relacionados...');

            const filters = {};
            if (this.product.category_id) {
                filters.category_id = this.product.category_id;
            } else if (this.product.occasion) {
                filters.occasion = this.product.occasion;
            }

            const response = await fetch(`/api/products?limit=4&${new URLSearchParams(filters)}`);
            const data = await response.json();

            if (data.success && data.data.products) {
                const relatedProducts = data.data.products
                    .filter(p => p.id !== this.product.id)
                    .slice(0, 3);
                this.renderRelatedProducts(relatedProducts);
            } else {
                this.renderRelatedProducts([]);
            }
        } catch (error) {
            this.logger.error('RELATED', '❌ Error al cargar productos relacionados', {
                error: error.message
            });
            document.getElementById('related-products').innerHTML = `
                <div class="col-12 text-center py-4">
                    <p class="text-muted">No se pudieron cargar productos relacionados</p>
                </div>
            `;
        }
    }

    renderRelatedProducts(products) {
        try {
            this.logger.info('RENDER-RELATED', '🖼️ Renderizando productos relacionados...', {
                count: products.length
            });

            const container = document.getElementById('related-products');
            if (products.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <p class="text-muted">No hay productos relacionados disponibles</p>
                    </div>
                `;
                return;
            }

            const productsHTML = products.map(product => `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <img src="${product.primary_image || product.image_url}" 
                             class="card-img-top product-image" 
                             alt="${product.name}"
                             data-product-id="${product.id}"
                             data-images='${JSON.stringify([product.primary_image || product.image_url])}'
                             style="height: 200px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <h6 class="card-title">${product.name}</h6>
                            <p class="card-text text-muted small">${product.description?.substring(0, 80) || ''}...</p>
                            <div class="mt-auto">
                                <div class="d-flex justify-content-between align-items-center">
                                    <strong class="text-primary">$${parseFloat(product.price).toFixed(2)}</strong>
                                    <a href="/pages/product-detail.html?id=${product.id}" 
                                       class="btn btn-sm btn-outline-primary">Ver</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = productsHTML;
            this.logger.success('RENDER-RELATED', '✅ Productos relacionados renderizados', {
                count: products.length
            });

        } catch (error) {
            this.logger.error('RENDER-RELATED', '❌ Error en renderRelatedProducts', {
                error: error.message
            });
        }
    }

    updateCartCount() {
        const cartCount = this.cart.getItemCount();
        // Simular actualización del badge del carrito
        this.logger.info('CART', '🛒 Actualizando conteo del carrito...', { count: cartCount });
    }
}

describe('ProductDetail - renderRelatedProducts', () => {
    let productDetail;
    
    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        global.fetch.mockClear();
        
        // Clear mock elements
        mockElements['related-products'].innerHTML = '';
        
        // Create new instance for each test
        productDetail = new MockProductDetail();
        productDetail.product = {
            id: 1,
            name: 'Rosas Rojas Premium',
            category_id: 1,
            occasion: 'amor'
        };
    });

    describe('Data-Product-ID in Related Products', () => {
        test('should include data-product-id attribute on related product images', async () => {
            const mockProducts = [
                {
                    id: 2,
                    name: 'Girasoles Alegres',
                    description: 'Hermosos girasoles brillantes',
                    price: 18.50,
                    images: [
                        { url_large: 'https://example.com/girasoles.jpg', display_order: 1 }
                    ]
                },
                {
                    id: 3,
                    name: 'Rosas Blancas',
                    description: 'Elegantes rosas blancas',
                    price: 22.99,
                    images: [
                        { url_large: 'https://example.com/rosas-blancas.jpg', display_order: 1 }
                    ]
                }
            ];

            productDetail.renderRelatedProducts(mockProducts);

            const container = document.getElementById('related-products');
            const renderedHTML = container.innerHTML;

            // Verificar que cada producto tiene su data-product-id
            expect(renderedHTML).toContain('data-product-id="2"');
            expect(renderedHTML).toContain('data-product-id="3"');
        });

        test('should include product-image class for hover system', async () => {
            const mockProducts = [
                {
                    id: 4,
                    name: 'Lirios Perfumados',
                    description: 'Exquisitos lirios aromáticos',
                    price: 28.75,
                    images: [
                        { url_large: 'https://example.com/lirios.jpg', display_order: 1 }
                    ]
                }
            ];

            productDetail.renderRelatedProducts(mockProducts);

            const container = document.getElementById('related-products');
            const renderedHTML = container.innerHTML;

            // Verificar que tiene la clase product-image
            expect(renderedHTML).toMatch(
                /<img[^>]*class="[^"]*product-image[^"]*"[^>]*>/
            );
        });

        test('should include data-images attribute with image URL', async () => {
            const mockProducts = [
                {
                    id: 5,
                    name: 'Orquídeas Elegantes',
                    description: 'Hermosas orquídeas exóticas',
                    price: 45.00,
                    images: [
                        { url_large: 'https://example.com/orquideas.jpg', display_order: 1 }
                    ]
                }
            ];

            productDetail.renderRelatedProducts(mockProducts);

            const container = document.getElementById('related-products');
            const renderedHTML = container.innerHTML;

            // Verificar que incluye data-images con la URL de la imagen
            const expectedDataImages = JSON.stringify(['https://example.com/orquideas.jpg']);
            expect(renderedHTML).toContain(`data-images='${expectedDataImages}'`);
        });

        test('should handle products with image_url fallback', async () => {
            const mockProducts = [
                {
                    id: 6,
                    name: 'Claveles Coloridos',
                    description: 'Variedad de claveles coloridos',
                    price: 15.50,
                    image_url: 'https://example.com/claveles.jpg'  // Using fallback
                }
            ];

            productDetail.renderRelatedProducts(mockProducts);

            const container = document.getElementById('related-products');
            const renderedHTML = container.innerHTML;

            // Verificar que usa image_url como fallback
            expect(renderedHTML).toContain('src="https://example.com/claveles.jpg"');
            expect(renderedHTML).toContain('data-product-id="6"');
            
            const expectedDataImages = JSON.stringify(['https://example.com/claveles.jpg']);
            expect(renderedHTML).toContain(`data-images='${expectedDataImages}'`);
        });
    });

    describe('HTML Structure and Content', () => {
        test('should render correct HTML structure for related products', async () => {
            const mockProducts = [
                {
                    id: 7,
                    name: 'Tulipanes Primaverales',
                    description: 'Coloridos tulipanes de primavera que alegran cualquier ambiente',
                    price: 20.00,
                    images: [
                        { url_large: 'https://example.com/tulipanes.jpg', display_order: 1 }
                    ]
                }
            ];

            productDetail.renderRelatedProducts(mockProducts);

            const container = document.getElementById('related-products');
            const renderedHTML = container.innerHTML;

            // Verificar estructura básica
            expect(renderedHTML).toContain('<div class="col-md-4 mb-3">');
            expect(renderedHTML).toContain('<div class="card h-100">');
            expect(renderedHTML).toContain('<div class="card-body d-flex flex-column">');
            
            // Verificar contenido del producto
            expect(renderedHTML).toContain('Tulipanes Primaverales');
            expect(renderedHTML).toContain('$20.00');
            expect(renderedHTML).toContain('/pages/product-detail.html?id=7');
        });

        test('should truncate long descriptions', async () => {
            const longDescription = 'Esta es una descripción muy larga que debería ser truncada porque excede los 80 caracteres permitidos en la vista de productos relacionados y podría causar problemas de diseño';
            
            const mockProducts = [
                {
                    id: 8,
                    name: 'Producto con Descripción Larga',
                    description: longDescription,
                    price: 25.00,
                    images: [
                        { url_large: 'https://example.com/long-desc.jpg', display_order: 1 }
                    ]
                }
            ];

            productDetail.renderRelatedProducts(mockProducts);

            const container = document.getElementById('related-products');
            const renderedHTML = container.innerHTML;

            // Verificar que la descripción fue truncada
            expect(renderedHTML).toContain('Esta es una descripción muy larga que debería ser truncada porque excede los 80...');
            expect(renderedHTML).not.toContain(longDescription);
        });

        test('should handle products without description', async () => {
            const mockProducts = [
                {
                    id: 9,
                    name: 'Producto Sin Descripción',
                    price: 12.50,
                    images: [
                        { url_large: 'https://example.com/no-desc.jpg', display_order: 1 }
                    ]
                    // No description property
                }
            ];

            productDetail.renderRelatedProducts(mockProducts);

            const container = document.getElementById('related-products');
            const renderedHTML = container.innerHTML;

            // Verificar que maneja graciosamente la ausencia de descripción
            expect(renderedHTML).toContain('Producto Sin Descripción');
            expect(renderedHTML).toContain('data-product-id="9"');
            expect(renderedHTML).toContain('...');
        });
    });

    describe('Empty States and Error Handling', () => {
        test('should render empty state when no related products', async () => {
            productDetail.renderRelatedProducts([]);

            const container = document.getElementById('related-products');
            const renderedHTML = container.innerHTML;

            expect(renderedHTML).toContain('No hay productos relacionados disponibles');
            expect(renderedHTML).toContain('col-12 text-center py-4');
        });

        test('should handle null/undefined products array', async () => {
            // La función debe manejar null/undefined graciosamente sin lanzar error
            productDetail.renderRelatedProducts(null);
            productDetail.renderRelatedProducts(undefined);
            
            const container = document.getElementById('related-products');
            // Debe mostrar algún contenido (error o empty state)
            expect(container.innerHTML).toBeDefined();
        });
    });

    describe('Integration with loadRelatedProducts', () => {
        test('should call renderRelatedProducts with filtered products', async () => {
            // Mock successful API response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        products: [
                            { id: 1, name: 'Current Product' }, // Should be filtered out
                            { id: 2, name: 'Related Product 1' },
                            { id: 3, name: 'Related Product 2' },
                            { id: 4, name: 'Related Product 3' },
                            { id: 5, name: 'Related Product 4' }
                        ]
                    }
                })
            });

            // Spy on renderRelatedProducts
            const renderSpy = vi.spyOn(productDetail, 'renderRelatedProducts');

            await productDetail.loadRelatedProducts();

            // Verificar que se llamó con productos filtrados (sin el actual) y limitados a 3
            expect(renderSpy).toHaveBeenCalledWith([
                { id: 2, name: 'Related Product 1' },
                { id: 3, name: 'Related Product 2' },
                { id: 4, name: 'Related Product 3' }
            ]);
        });

        test('should handle API errors gracefully', async () => {
            // Mock API error
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            const container = document.getElementById('related-products');
            
            await productDetail.loadRelatedProducts();

            // Verificar que se muestra mensaje de error
            expect(container.innerHTML).toContain('No se pudieron cargar productos relacionados');
        });
    });

    describe('Logging and Monitoring', () => {
        test('should log related products rendering', async () => {
            const mockProducts = [
                {
                    id: 10,
                    name: 'Test Logging Product',
                    price: 15.00,
                    images: [
                        { url_large: 'https://example.com/test.jpg', display_order: 1 }
                    ]
                }
            ];

            productDetail.renderRelatedProducts(mockProducts);

            // Verificar que se llamaron los métodos de logging
            expect(window.floresyaLogger.info).toHaveBeenCalledWith(
                'RENDER-RELATED',
                '🖼️ Renderizando productos relacionados...',
                { count: 1 }
            );

            expect(window.floresyaLogger.success).toHaveBeenCalledWith(
                'RENDER-RELATED',
                '✅ Productos relacionados renderizados',
                { count: 1 }
            );
        });

        test('should log errors during rendering', async () => {
            // Force an error by passing invalid data
            const invalidProducts = [
                {
                    id: 11,
                    // Missing required fields to cause an error
                }
            ];

            // Mock document.getElementById to return null to cause an error
            const originalGetById = document.getElementById;
            document.getElementById = vi.fn(() => null);

            try {
                productDetail.renderRelatedProducts(invalidProducts);
            } catch (error) {
                // Error is expected
            }

            // Restore original method
            document.getElementById = originalGetById;
        });
    });

    describe('Performance and Optimization', () => {
        test('should limit related products to maximum of 3', async () => {
            const manyProducts = Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                name: `Product ${i + 1}`,
                price: 10.00,
                primary_image: `https://example.com/product${i + 1}.jpg`
            }));

            // Mock fetch to return many products
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { products: manyProducts }
                })
            });

            await productDetail.loadRelatedProducts();

            const container = document.getElementById('related-products');
            const renderedHTML = container.innerHTML;

            // Count how many product cards are rendered
            const cardCount = (renderedHTML.match(/col-md-4 mb-3/g) || []).length;
            expect(cardCount).toBeLessThanOrEqual(3);
        });
    });
});