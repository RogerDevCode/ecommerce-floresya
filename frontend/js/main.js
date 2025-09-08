/**
 * 🌸 FloresYaApp - Motor principal de la experiencia de usuario
 * Carga diferida, eventos delegados, optimizado para conversión y performance.
 */

class FloresYaApp {
    constructor() {
        this.currentPage = 1;
        this.currentFilters = {};
        this.products = [];
        this.occasions = [];
        this.isProductionMode = false;
        this.logger = window.floresyaLogger || console;
        this.performanceOptimizer = null;
        this.accessibilityEnhancer = null;
        
        this.init();
    }

    async init() {
        const initTimer = this.logger.startTimer ? this.logger.startTimer('FloresYaApp.init') : null;
        
        try {
            this.logger.info('APP', 'Inicializando FloresYa', {
                url: window.location.href,
                timestamp: new Date().toISOString()
            });

            // Inicializar módulos críticos
            this.initializePerformanceOptimizer();
            this.initializeAccessibilityEnhancer();

            // Defer operaciones pesadas
            requestAnimationFrame(() => {
                this.loadInitialData()
                    .then(() => {
                        this.bindEvents();
                        requestAnimationFrame(() => {
                            this.loadProducts();
                            this.loadDynamicCarousel();
                            requestAnimationFrame(() => {
                                this.setupDevMode();
                            });
                        });
                    })
                    .catch(error => {
                        this.logger.error('APP', 'Error cargando datos iniciales', { error: error.message });
                    });
            });

            this.logger.success('APP', '✅ FloresYa inicializado correctamente');

        } catch (error) {
            this.logger.error('APP', 'Error crítico en inicialización', { error: error.message });
            throw error;
        } finally {
            if (initTimer) initTimer.end('APP');
        }
    }

    // ============ INICIALIZACIÓN DE MÓDULOS ============

    initializePerformanceOptimizer() {
        if (typeof PerformanceOptimizer !== 'undefined') {
            this.performanceOptimizer = new PerformanceOptimizer({
                lazyLoadOffset: 200,
                imageQuality: 'auto',
                enableWebP: true,
                enablePrefetch: true,
                debounceDelay: 150,
                intersectionThreshold: 0.15
            });
            this.logger.info('APP', '✅ Optimizador de performance inicializado');
        }
    }

    initializeAccessibilityEnhancer() {
        if (typeof AccessibilityEnhancer !== 'undefined') {
            this.accessibilityEnhancer = new AccessibilityEnhancer({
                enableKeyboardNavigation: true,
                enableAriaLabels: true,
                enableFocusManagement: true,
                announceChanges: true
            });
            this.logger.info('APP', '✅ Mejorador de accesibilidad inicializado');
        }
    }

    // ============ MODO DESARROLLO/PRODUCCIÓN ============

    setupDevMode() {
        this.isProductionMode = window.location.hostname.includes('vercel.app') || 
                               window.location.hostname === 'floresya.com' ||
                               window.location.hostname === 'www.floresya.com';

        if (this.isProductionMode) {
            this.hideDevMode();
            this.logger.info('APP', '🚀 Modo Producción');
        } else {
            this.logger.info('APP', '🛠️ Modo Desarrollo');
        }

        this.updateDevModeToggle();
    }

    toggleDevMode() {
        this.isProductionMode = !this.isProductionMode;
        
        if (this.isProductionMode) {
            this.hideDevMode();
            this.logger.info('APP', '🚀 Cambiado a Modo Producción');
        } else {
            this.showDevMode();
            this.logger.info('APP', '🛠️ Cambiado a Modo Desarrollo');
        }

        this.updateDevModeToggle();
    }

    hideDevMode() {
        const devMenus = document.querySelectorAll('.navbar-nav .dropdown');
        devMenus.forEach(dropdown => {
            const linkElement = dropdown.querySelector('a[role="button"]');
            if (linkElement && linkElement.innerHTML.includes('DEV MODE')) {
                dropdown.style.display = 'none';
            }
        });
    }

    showDevMode() {
        const devMenus = document.querySelectorAll('.navbar-nav .dropdown');
        devMenus.forEach(dropdown => {
            const linkElement = dropdown.querySelector('a[role="button"]');
            if (linkElement && linkElement.innerHTML.includes('DEV MODE')) {
                dropdown.style.display = 'block';
            }
        });
    }

    updateDevModeToggle() {
        const toggleBtn = document.getElementById('devModeToggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = this.isProductionMode ? 
                '<i class="bi bi-code-slash"></i> Activar Dev' : 
                '<i class="bi bi-shield-check"></i> Activar Prod';
            toggleBtn.className = this.isProductionMode ? 
                'btn btn-outline-warning btn-sm' : 
                'btn btn-outline-success btn-sm';
        }
    }

    // ============ CARGA DE DATOS ============

    async loadInitialData() {
        try {
            const occasionsResponse = await api.getOccasions();
            if (occasionsResponse.success) {
                this.occasions = occasionsResponse.data;
                this.populateOccasionFilter();
                this.populateOccasionsDropdown();
            }
        } catch (error) {
            this.logger.error('APP', 'Error cargando ocasiones', { error: error.message });
        }
    }

    populateOccasionFilter() {
        const occasionFilter = document.getElementById('occasionFilter');
        if (!occasionFilter) return;

        occasionFilter.innerHTML = '<option value="">Todas las ocasiones</option>';
        this.occasions.forEach(occasion => {
            const option = document.createElement('option');
            option.value = occasion.id;
            option.textContent = occasion.name;
            occasionFilter.appendChild(option);
        });
    }

    populateOccasionsDropdown() {
        const occasionsDropdown = document.querySelector('#occasionsDropdownToggle + .dropdown-menu');
        if (!occasionsDropdown) return;

        occasionsDropdown.innerHTML = '';
        
        // Opción "Todas las ocasiones"
        const allOccasionsLi = document.createElement('li');
        allOccasionsLi.innerHTML = `<a class="dropdown-item" href="#productos" data-occasion-id="">
            <i class="bi bi-calendar-heart me-2" style="color: #6c757d"></i>
            Todas las ocasiones
        </a>`;
        occasionsDropdown.appendChild(allOccasionsLi);

        // Divider
        const divider = document.createElement('li');
        divider.innerHTML = '<hr class="dropdown-divider">';
        occasionsDropdown.appendChild(divider);

        // Opciones de ocasiones
        if (this.occasions.length > 0) {
            this.occasions.forEach(occasion => {
                const li = document.createElement('li');
                li.innerHTML = `<a class="dropdown-item" href="#productos" data-occasion-id="${occasion.id}">
                    <i class="${occasion.icon || 'bi bi-calendar-event'} me-2" style="color: ${occasion.color || '#28a745'}"></i>
                    ${occasion.name}
                </a>`;
                occasionsDropdown.appendChild(li);
            });
        }
    }

    // ============ EVENTOS ============

    bindEvents() {
        this.bindSearchEvents();
        this.bindFilterEvents();
        this.bindProductEvents();
        this.bindNavigationEvents();
        this.bindMenuEvents();
    }

    bindSearchEvents() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        if (searchInput) {
            const debouncedSearch = api.debounce(() => {
                this.handleSearch();
            }, 500);

            searchInput.addEventListener('input', debouncedSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch();
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.handleSearch();
            });
        }
    }

    bindFilterEvents() {
        const occasionFilter = document.getElementById('occasionFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (occasionFilter) {
            occasionFilter.addEventListener('change', () => {
                this.filterByOccasionId(occasionFilter.value);
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                const [sort, order] = sortFilter.value.split(':');
                this.currentFilters.sort = sort;
                this.currentFilters.order = order;
                this.currentPage = 1;
                this.loadProducts();
            });
        }
    }

    bindProductEvents() {
        // Delegación de eventos para tarjetas de producto
        document.addEventListener('click', (e) => {
            // Click en tarjeta (navegación a detalle)
            const productCard = e.target.closest('.product-card');
            if (productCard && !e.target.closest('.btn-add-to-cart') && !e.target.closest('.btn-floresya')) {
                e.preventDefault();
                const productId = parseInt(productCard.dataset.productId);
                if (productId) {
                    window.location.href = `/pages/product-detail.html?id=${productId}`;
                }
            }

            // Click en "¡FloresYa!" (compra rápida)
            if (e.target.classList.contains('btn-floresya') || e.target.closest('.btn-floresya')) {
                e.preventDefault();
                const btn = e.target.classList.contains('btn-floresya') ? e.target : e.target.closest('.btn-floresya');
                const productId = parseInt(btn.dataset.productId);
                if (productId) {
                    this.buyNow(productId, 1);
                }
            }

            // Click en "Al Carrito"
            if (e.target.classList.contains('btn-add-to-cart') || e.target.closest('.btn-add-to-cart')) {
                e.preventDefault();
                const btn = e.target.classList.contains('btn-add-to-cart') ? e.target : e.target.closest('.btn-add-to-cart');
                const productId = parseInt(btn.dataset.productId);
                if (productId && window.cart) {
                    window.cart.addItem(productId, 1);
                }
            }
        });
    }

    bindNavigationEvents() {
        // Click en dropdown de ocasiones
        document.addEventListener('click', (e) => {
            if (e.target.dataset.occasionId !== undefined) {
                e.preventDefault();
                this.filterByOccasionId(e.target.dataset.occasionId);
            }
        });

        // Click en paginación
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link') && e.target.dataset.page) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadProducts();
                }
            }
        });
    }

    // ============ FILTROS Y BÚSQUEDA ============

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            this.currentFilters.search = searchInput.value.trim();
            this.currentPage = 1;
            this.loadProducts();
        }
    }

    filterByOccasionId(occasionId) {
        // Sincronizar dropdowns
        const occasionFilter = document.getElementById('occasionFilter');
        const navbarDropdownToggle = document.getElementById('occasionsDropdownToggle');

        if (occasionFilter) {
            occasionFilter.value = occasionId || '';
        }

        if (navbarDropdownToggle) {
            if (!occasionId || occasionId === '') {
                navbarDropdownToggle.textContent = 'Ocasiones';
            } else {
                const selectedOccasion = this.occasions.find(occ => occ.id == occasionId);
                if (selectedOccasion) {
                    navbarDropdownToggle.innerHTML = `<i class="${selectedOccasion.icon || 'bi bi-calendar-event'} me-2"></i>${selectedOccasion.name}`;
                } else {
                    navbarDropdownToggle.textContent = 'Ocasiones';
                }
            }
        }

        // Aplicar filtro
        if (occasionId === '' || occasionId === null || occasionId === undefined) {
            delete this.currentFilters.occasionId;
        } else {
            this.currentFilters.occasionId = occasionId;
        }

        delete this.currentFilters.occasion;
        this.currentPage = 1;
        this.loadProducts();

        // Scroll suave a productos
        document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
    }

    // ============ CARGA Y RENDERIZADO DE PRODUCTOS ============

    async loadProducts() {
        try {
            const params = {
                page: this.currentPage,
                limit: 100,
                ...this.currentFilters
            };

            // Limpiar parámetros vacíos
            Object.keys(params).forEach(key => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            const response = await api.getProducts(params);
            if (response.success) {
                this.products = response.data.products;
                this.renderProducts(response.data.products);
                this.renderPagination(response.data.pagination);
            }
        } catch (error) {
            this.logger.error('APP', 'Error cargando productos', { error: error.message });
        }
    }

    renderProducts(products) {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state text-center py-5">
                        <svg width="120" height="120" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="100" cy="100" r="95" fill="#FF1493" stroke="#fff" stroke-width="4"/>
                            <path d="M100 60 C90 70, 85 85, 90 100 C95 115, 110 115, 115 100 C120 85, 115 70, 105 60 Z" fill="#fff" />
                            <circle cx="100" cy="70" r="5" fill="#fff"/>
                            <text x="100" y="140" font-family="Arial, sans-serif" font-size="20" fill="#fff" text-anchor="middle" opacity="0.9">
                                No disponible
                            </text>
                        </svg>
                        <h4 class="text-primary-custom mb-3 mt-4">No encontramos productos</h4>
                        <p class="text-muted mb-4">No hay productos disponibles con los filtros aplicados</p>
                        <button class="btn btn-outline-primary-custom" onclick="floresyaApp.clearAllFilters()">
                            <i class="bi bi-arrow-clockwise me-2"></i>Ver todos los productos
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
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
        } else {
            // Placeholder SVG integrado
            allProductImages = ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk1IiBmaWxsPSIjRkYxNDkzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPgogICAgPHBhdGggZD0iTTEwMCA2MCBDOTAgNzAsIDg1IDg1LCA5MCAxMDAgQzk1IDExNSwgMTEwIDExNSwgMTE1IDEwMCBDMTIwIDg1LCAxMTUgNzAsIDEwNSA2MCBaIiBmaWxsPSIjZmZmIiAvPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjUiIGZpbGw9IiNmZmYiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOSI+CiAgICAgICAgTm8gZGlzcG9uaWJsZQogICAgPC90ZXh0Pgo8L3N2Zz4='];
        }

        const dataImages = allProductImages.length > 1 ? JSON.stringify(allProductImages) : JSON.stringify([allProductImages[0]]);
        const primaryImage = allProductImages[0];

        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card product-card h-100 hover-lift" data-product-id="${product.id}">
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
                             data-images='${dataImages}'
                             data-current-index="0"
                             loading="lazy"
                             style="height: 250px; object-fit: cover; transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk1IiBmaWxsPSIjRkYxNDkzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPgogICAgPHBhdGggZD0iTTEwMCA2MCBDOTAgNzAsIDg1IDg1LCA5MCAxMDAgQzk1IDExNSwgMTEwIDExNSwgMTE1IDEwMCBDMTIwIDg1LCAxMTUgNzAsIDEwNSA2MCBaIiBmaWxsPSIjZmZmIiAvPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjUiIGZpbGw9IiNmZmYiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOSI+CiAgICAgICAgTm8gZGlzcG9uaWJsZQogICAgPC90ZXh0Pgo8L3N2Zz4='">
                        
                        <!-- Quick Add Button (appears on hover) -->
                        <div class="position-absolute bottom-0 end-0 m-2 d-none d-md-block">
                            <button class="btn btn-primary-custom btn-sm rounded-circle pulse-shadow" onclick="event.stopPropagation(); floresyaApp.addToCart(${product.id})" title="Agregar al carrito rápido">
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
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
                        
                        <!-- Trust Indicator -->
                        <div class="text-center mb-3">
                            <small class="text-muted">
                                <i class="bi bi-star-fill text-warning me-1"></i>
                                <span class="fw-medium">4.8</span> • 100% garantizado
                            </small>
                        </div>
                        
                        <div class="mt-auto">
                            ${product.stock_quantity > 0 ? `
                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary-custom btn-floresya fw-bold" data-product-id="${product.id}" onclick="floresyaApp.buyNow(${product.id})">
                                        <i class="bi bi-lightning-fill"></i> ¡FloresYa!
                                    </button>
                                    <button class="btn btn-outline-success btn-add-to-cart" data-product-id="${product.id}">
                                        <i class="bi bi-bag-plus"></i> Al Carrito
                                    </button>
                                </div>
                            ` : `
                                <button class="btn btn-secondary w-100" disabled>
                                    <i class="bi bi-x-circle"></i> Sin Stock
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        if (!container) return;

        const { page, pages, total } = pagination;
        if (pages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Botón anterior
        paginationHTML += page > 1 ? 
            `<li class="page-item"><a class="page-link" href="#" data-page="${page - 1}">« Anterior</a></li>` :
            `<li class="page-item disabled"><span class="page-link">« Anterior</span></li>`;

        // Números de página
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        if (startPage > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        if (endPage < pages) {
            if (endPage < pages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${pages}">${pages}</a></li>`;
        }

        // Botón siguiente
        paginationHTML += page < pages ? 
            `<li class="page-item"><a class="page-link" href="#" data-page="${page + 1}">Siguiente »</a></li>` :
            `<li class="page-item disabled"><span class="page-link">Siguiente »</span></li>`;

        container.innerHTML = paginationHTML;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    // ============ CARRUSEL DINÁMICO ============

    async loadDynamicCarousel() {
        await this.loadCarouselSettings();
        await this.loadCarouselImages();
    }

    async loadCarouselSettings() {
        try {
            const response = await fetch('/api/settings/homepage/all');
            const data = await response.json();
            if (data.success) {
                const settings = data.data;
                const titleElement = document.getElementById('carouselSectionTitle');
                const subtitleElement = document.getElementById('carouselSectionSubtitle');
                
                if (titleElement && settings.carousel_section_title) {
                    titleElement.textContent = settings.carousel_section_title;
                }
                if (subtitleElement && settings.carousel_section_subtitle) {
                    subtitleElement.textContent = settings.carousel_section_subtitle;
                }
            }
        } catch (error) {
            this.logger.error('APP', 'Error cargando configuración de carrusel', { error: error.message });
        }
    }

    async loadCarouselImages() {
        try {
            const response = await fetch('/api/carousel');
            const data = await response.json();
            if (data.success && data.data.images.length > 0) {
                this.renderCarouselImages(data.data.images);
            } else {
                this.renderFallbackCarousel();
            }
        } catch (error) {
            this.logger.error('APP', 'Error cargando imágenes de carrusel', { error: error.message });
            this.renderFallbackCarousel();
        }
    }

    renderCarouselImages(images) {
        const carousel = document.getElementById('dynamicCarousel');
        if (!carousel) return;

        const extendedImages = [...images, ...images];
        const carouselHTML = extendedImages.map((image, index) => {
            return `
                <div class="carousel-item ${index === 0 ? 'active' : ''}" data-link-url="${image.link_url || ''}">
                    <img src="${image.image_url}" 
                         alt="${image.title}" 
                         loading="lazy"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk1IiBmaWxsPSIjRkYxNDkzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPgogICAgPHBhdGggZD0iTTEwMCA2MCBDOTAgNzAsIDg1IDg1LCA5MCAxMDAgQzk1IDExNSwgMTEwIDExNSwgMTE1IDEwMCBDMTIwIDg1LCAxMTUgNzAsIDEwNSA2MCBaIiBmaWxsPSIjZmZmIiAvPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjUiIGZpbGw9IiNmZmYiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOSI+CiAgICAgICAgTm8gZGlzcG9uaWJsZQogICAgPC90ZXh0Pgo8L3N2Zz4='">
                    <div class="carousel-overlay">
                        <h5>${image.title}</h5>
                        ${image.description ? `<p>${image.description}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        carousel.innerHTML = carouselHTML;

        // Inicializar carrusel de Bootstrap
        const carouselInstance = new bootstrap.Carousel(carousel, {
            interval: 5000,
            ride: 'carousel'
        });

        // Eventos de click
        carousel.addEventListener('click', (e) => {
            const item = e.target.closest('.carousel-item');
            if (item && item.dataset.linkUrl) {
                window.location.href = item.dataset.linkUrl;
            }
        });
    }

    renderFallbackCarousel() {
        const carousel = document.getElementById('dynamicCarousel');
        if (!carousel) return;

        const fallbackItems = [
            { name: 'Rosas Rojas', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk1IiBmaWxsPSIjRkYxNDkzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPgogICAgPHBhdGggZD0iTTEwMCA2MCBDOTAgNzAsIDg1IDg1LCA5MCAxMDAgQzk1IDExNSwgMTEwIDExNSwgMTE1IDEwMCBDMTIwIDg1LCAxMTUgNzAsIDEwNSA2MCBaIiBmaWxsPSIjZmZmIiAvPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjUiIGZpbGw9IiNmZmYiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOSI+CiAgICAgICAgTm8gZGlzcG9uaWJsZQogICAgPC90ZXh0Pgo8L3N2Zz4=', id: 1 },
            { name: 'Bouquet Primavera', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk1IiBmaWxsPSIjRkYxNDkzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPgogICAgPHBhdGggZD0iTTEwMCA2MCBDOTAgNzAsIDg1IDg1LCA5MCAxMDAgQzk1IDExNSwgMTEwIDExNSwgMTE1IDEwMCBDMTIwIDg1LCAxMTUgNzAsIDEwNSA2MCBaIiBmaWxsPSIjZmZmIiAvPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjUiIGZpbGw9IiNmZmYiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOSI+CiAgICAgICAgTm8gZGlzcG9uaWJsZQogICAgPC90ZXh0Pgo8L3N2Zz4=', id: 2 },
            { name: 'Arreglo Tropical', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk1IiBmaWxsPSIjRkYxNDkzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPgogICAgPHBhdGggZD0iTTEwMCA2MCBDOTAgNzAsIDg1IDg1LCA5MCAxMDAgQzk1IDExNSwgMTEwIDExNSwgMTE1IDEwMCBDMTIwIDg1LCAxMTUgNzAsIDEwNSA2MCBaIiBmaWxsPSIjZmZmIiAvPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjUiIGZpbGw9IiNmZmYiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOSI+CiAgICAgICAgTm8gZGlzcG9uaWJsZQogICAgPC90ZXh0Pgo8L3N2Zz4=', id: 3 }
        ];

        const extendedItems = [...fallbackItems, ...fallbackItems];
        const carouselHTML = extendedItems.map((item, index) => {
            return `
                <div class="carousel-item ${index === 0 ? 'active' : ''}" data-product-id="${item.id}">
                    <img src="${item.image}" 
                         alt="${item.name}" 
                         loading="lazy">
                    <div class="carousel-overlay">
                        <h5>${item.name}</h5>
                    </div>
                </div>
            `;
        }).join('');

        carousel.innerHTML = carouselHTML;
    }

    // ============ MENÚ Y FORMULARIOS ============

    bindMenuEvents() {
        // Inicializar dropdowns de Bootstrap
        const dropdownElements = document.querySelectorAll('[data-bs-toggle="dropdown"]');
        dropdownElements.forEach(element => {
            if (!bootstrap.Dropdown.getInstance(element)) {
                new bootstrap.Dropdown(element);
            }
        });

        // Footer links
        document.addEventListener('click', (e) => {
            if (e.target.dataset && e.target.dataset.occasion) {
                e.preventDefault();
                this.filterByOccasion(e.target.dataset.occasion);
            }
        });

        // Formulario Flores Ya Novias
        this.bindFloresNoviasForm();
    }

    bindFloresNoviasForm() {
        const form = document.getElementById('noviasContactForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!form.checkValidity()) {
                    e.stopPropagation();
                    form.classList.add('was-validated');
                    return;
                }

                try {
                    const formData = {
                        nombre: document.getElementById('noviaName').value,
                        telefono: document.getElementById('noviaPhone').value,
                        email: document.getElementById('noviaEmail').value,
                        fecha_boda: document.getElementById('weddingDate').value,
                        cantidad_invitados: document.getElementById('guestCount').value,
                        lugar_celebracion: document.getElementById('weddingVenue').value,
                        mensaje: document.getElementById('noviasMessage').value,
                        presupuesto: document.getElementById('budget').value,
                        tipo_consulta: 'flores_novias'
                    };

                    const submitBtn = form.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Enviando...';
                    submitBtn.disabled = true;

                    // Simular éxito
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    api.showNotification('¡Gracias! Tu consulta ha sido enviada. Te contactaremos pronto para programar tu cita personalizada.', 'success');
                    form.reset();
                    form.classList.remove('was-validated');

                    const modal = bootstrap.Modal.getInstance(document.getElementById('floresNoviasModal'));
                    if (modal) modal.hide();

                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;

                } catch (error) {
                    api.showNotification('Ha ocurrido un error. Por favor intenta nuevamente.', 'danger');
                    const submitBtn = form.querySelector('button[type="submit"]');
                    submitBtn.innerHTML = '<i class="bi bi-send me-2"></i>Solicitar Consulta Gratuita';
                    submitBtn.disabled = false;
                }
            });
        }
    }

    // ============ COMPRA RÁPIDA ============

    async buyNow(productId, quantity = 1) {
        try {
            const button = document.querySelector(`[onclick*="buyNow(${productId})"]`);
            if (button) {
                button.disabled = true;
                button.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';
            }

            const productResponse = await api.getProductById(productId);
            if (!productResponse.success) {
                api.showNotification('Error al obtener información del producto', 'danger');
                return;
            }

            const product = productResponse.data;
            if (product.stock_quantity < quantity) {
                api.showNotification('Stock insuficiente', 'warning');
                return;
            }

            const user = api.getUser();
            if (!user) {
                this.showQuickPurchaseModal(product, quantity);
                return;
            }

            const addResponse = await cart.addItem(productId, quantity);
            if (addResponse.success) {
                this.showFloresYaAnimation();
                setTimeout(() => {
                    window.location.href = '/pages/payment.html?floresya=true';
                }, 1500);
            }
        } catch (error) {
            console.error('Error in buyNow:', error);
            api.showNotification('Error al procesar la compra', 'danger');
        } finally {
            const button = document.querySelector(`[onclick*="buyNow(${productId})"]`);
            if (button) {
                button.disabled = false;
                button.innerHTML = '<i class="bi bi-lightning-fill"></i> ¡FloresYa!';
            }
        }
    }

    showQuickPurchaseModal(product, quantity) {
        const modalHTML = `
            <div class="modal fade" id="quickPurchaseModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-gradient-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-lightning-fill"></i> ¡FloresYa! Compra Express
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <img src="${product.primary_image || product.image_url}" alt="${product.name}" 
                                     class="img-fluid rounded" style="max-height: 200px; object-fit: cover;">
                                <h6 class="mt-3">${product.name}</h6>
                                <p class="text-primary-custom fw-bold">${api.formatCurrency(product.price * quantity)}</p>
                            </div>
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i>
                                <strong>¡Compra como invitado en 30 segundos!</strong><br>
                                Solo necesitamos tus datos de envío.
                            </div>
                            <form id="quickPurchaseForm">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Nombre *</label>
                                        <input type="text" class="form-control" id="guestName" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Teléfono *</label>
                                        <input type="tel" class="form-control" id="guestPhone" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="guestEmail" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Dirección de Entrega *</label>
                                    <textarea class="form-control" id="guestAddress" rows="2" required></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary-custom" onclick="floresyaApp.processQuickPurchase(${product.id}, ${quantity})">
                                <i class="bi bi-lightning-fill"></i> ¡FloresYa!
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('quickPurchaseModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('quickPurchaseModal'));
        modal.show();
    }

    async processQuickPurchase(productId, quantity) {
        try {
            const form = document.getElementById('quickPurchaseForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const guestData = {
                name: document.getElementById('guestName').value,
                phone: document.getElementById('guestPhone').value,
                email: document.getElementById('guestEmail').value,
                address: document.getElementById('guestAddress').value
            };

            sessionStorage.setItem('floresya_guest', JSON.stringify(guestData));
            sessionStorage.setItem('floresya_purchase', JSON.stringify({
                productId, 
                quantity,
                timestamp: Date.now()
            }));

            await cart.addItem(productId, quantity);
            this.showFloresYaAnimation();

            const modal = bootstrap.Modal.getInstance(document.getElementById('quickPurchaseModal'));
            modal.hide();

            setTimeout(() => {
                window.location.href = '/pages/payment.html?floresya=true&guest=true';
            }, 1500);
        } catch (error) {
            console.error('Error processing quick purchase:', error);
            api.showNotification('Error al procesar la compra', 'danger');
        }
    }

    showFloresYaAnimation() {
        const animationHTML = `
            <div id="floresya-animation" class="position-fixed top-50 start-50 translate-middle" 
                 style="z-index: 9999; text-align: center;">
                <div class="bg-primary-custom text-white p-4 rounded-3 shadow-lg">
                    <i class="bi bi-lightning-fill display-1 mb-3 floresya-pulse"></i>
                    <h4 class="fw-bold">¡FloresYa!</h4>
                    <p class="mb-0">Redirigiendo al pago...</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', animationHTML);
        setTimeout(() => {
            const animation = document.getElementById('floresya-animation');
            if (animation) animation.remove();
        }, 1500);
    }

    clearAllFilters() {
        this.currentFilters = {};
        this.currentPage = 1;
        
        const occasionFilter = document.getElementById('occasionFilter');
        const sortFilter = document.getElementById('sortFilter');
        const searchInput = document.getElementById('searchInput');
        
        if (occasionFilter) occasionFilter.value = '';
        if (sortFilter) sortFilter.value = 'created_at:DESC';
        if (searchInput) searchInput.value = '';
        
        this.updateNavbarDropdownText('');
        this.loadProducts();
    }

    updateNavbarDropdownText(occasionId) {
        const navbarDropdownToggle = document.getElementById('occasionsDropdownToggle');
        if (!navbarDropdownToggle) return;
        
        if (!occasionId || occasionId === '') {
            navbarDropdownToggle.textContent = 'Ocasiones';
            return;
        }
        
        const selectedOccasion = this.occasions.find(occ => occ.id == occasionId);
        if (selectedOccasion) {
            navbarDropdownToggle.innerHTML = `<i class="${selectedOccasion.icon || 'bi bi-calendar-event'} me-2"></i>${selectedOccasion.name}`;
        } else {
            navbarDropdownToggle.textContent = 'Ocasiones';
        }
    }
}

// Funciones de inicialización

function waitForStylesheets() {
    return new Promise((resolve) => {
        const safeResolve = () => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
                });
            });
        };
        
        if (document.readyState === 'complete') {
            safeResolve();
            return;
        }
        
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        let loadedCount = 0;
        
        function checkLoaded() {
            loadedCount++;
            if (loadedCount >= links.length) {
                safeResolve();
            }
        }
        
        if (links.length === 0) {
            safeResolve();
            return;
        }
        
        links.forEach(link => {
            try {
                if (link.sheet && link.sheet.cssRules) {
                    checkLoaded();
                } else if (link.sheet) {
                    checkLoaded();
                } else {
                    link.addEventListener('load', checkLoaded, { once: true });
                    link.addEventListener('error', checkLoaded, { once: true });
                }
            } catch (e) {
                if (link.sheet) {
                    checkLoaded();
                } else {
                    link.addEventListener('load', checkLoaded, { once: true });
                    link.addEventListener('error', checkLoaded, { once: true });
                }
            }
        });
        
        setTimeout(() => {
            safeResolve();
        }, 600);
    });
}

// Filtrar warnings de consola
const originalConsoleWarn = console.warn;
console.warn = function(...args) {
    const message = args.join(' ');
    const ignoredPatterns = [
        '__cf_bm',
        'invalid domain',
        'Cookie.*rejected',
        'has been rejected',
        'Layout was forced before',
        'sectioned h1 element',
        'font-size or margin properties',
        'index\\.js:1113'
    ];
    
    for (const pattern of ignoredPatterns) {
        if (message.match(new RegExp(pattern, 'i'))) {
            return;
        }
    }
    originalConsoleWarn.apply(console, args);
};

// Optimizar carga de imágenes
function optimizeImageLoading() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        img.addEventListener('error', function(e) {
            console.log('Image load failed:', e.target.src);
        }, { once: true });
    });
}

// Inicializar app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌸 FloresYa: DOM loaded, waiting for stylesheets...');
    
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
    
    setTimeout(async () => {
        await waitForStylesheets();
        document.documentElement.classList.add('stylesheets-loaded');
        console.log('🎨 Stylesheets loaded, initializing app...');
        
        if (typeof bootstrap === 'undefined') {
            console.error('❌ Bootstrap not loaded!');
            return;
        }
        console.log('✅ Bootstrap loaded');
        
        window.floresyaApp = new FloresYaApp();
        
        if (typeof AuthManager !== 'undefined') {
            window.authManager = new AuthManager();
            console.log('✅ Auth Manager initialized');
        }
        
        if (typeof ShoppingCart !== 'undefined') {
            window.cart = new ShoppingCart();
            console.log('✅ Shopping Cart initialized');
        }
        
        console.log('🎉 FloresYa: All systems initialized!');
        optimizeImageLoading();
    }, 10);
});

// Funciones de desarrollo (DEV ONLY)
window.fillAdminCredentials = function() {
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    if (emailField && passwordField) {
        emailField.value = 'admin@floresya.com';
        passwordField.value = 'admin123';
        emailField.classList.add('bg-success', 'bg-opacity-10');
        passwordField.classList.add('bg-success', 'bg-opacity-10');
        setTimeout(() => {
            emailField.classList.remove('bg-success', 'bg-opacity-10');
            passwordField.classList.remove('bg-success', 'bg-opacity-10');
        }, 1500);
    }
};

window.fillClientCredentials = function() {
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    if (emailField && passwordField) {
        emailField.value = 'cliente@example.com';
        passwordField.value = 'cliente123';
        emailField.classList.add('bg-info', 'bg-opacity-10');
        passwordField.classList.add('bg-info', 'bg-opacity-10');
        setTimeout(() => {
            emailField.classList.remove('bg-info', 'bg-opacity-10');
            passwordField.classList.remove('bg-info', 'bg-opacity-10');
        }, 1500);
    }
};