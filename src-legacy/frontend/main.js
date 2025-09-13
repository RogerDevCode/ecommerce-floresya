// 🌸 FloresYa Main Application
// Logging exhaustivo para confirmar ejecución y errores

class FloresYaApp {
    constructor() {
        this.products = [];
        this.occasions = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentFilters = {};
        this.isProductionMode = true;
        this.conversionOptimizer = {
            sessionStartTime: Date.now(),
            viewedProducts: new Set()
        };

        // Initialize with logging
        if (window.logger) {
            window.logger.info('APP', '✅ FloresYaApp initialized');
        } else {
            console.log('[🌸 FloresYa] App initialized');
        }

        this.init();
    }

    log(message, data = null, level = 'info') {
        // Use window.logger if available
        if (window.logger) {
            window.logger[level]('APP', message, data);
        } else {
            const prefix = '[🌸 FloresYa]';
            const timestamp = new Date().toISOString();
            const output = `${prefix} [${level.toUpperCase()}] ${timestamp} — ${message}`;

            switch (level) {
                case 'error':
                    console.error(output, data);
                    break;
                case 'warn':
                    console.warn(output, data);
                    break;
                default:
                    console.log(output, data);
                    break;
            }
        }
    }

    init() {
        this.log('🔄 Inicializando aplicación', {}, 'info');

        try {
            this.bindEvents();
            this.loadInitialData();
            this.initializeConversionOptimizer();
            this.log('✅ Aplicación inicializada correctamente', {}, 'success');
        } catch (error) {
            this.log('❌ Error al inicializar aplicación', {
                error: error.message
            }, 'error');
        }
    }

    async loadInitialData() {
        this.log('🔄 Cargando datos iniciales', {}, 'info');

        try {
            // Load occasions first
            const occasionsResponse = await api.getOccasions();
            if (occasionsResponse.success) {
                this.occasions = occasionsResponse.data;
                this.populateOccasionFilter();
                this.populateOccasionsDropdown();
                this.log('✅ Ocasiones cargadas correctamente', {
                    count: this.occasions.length
                }, 'success');
            } else {
                this.log('⚠️ Error al cargar ocasiones', {
                    response: occasionsResponse
                }, 'warn');
            }

            // Then load products
            await this.loadProducts();
            
            // Load carousel images
            await this.loadCarousel();

        } catch (error) {
            this.log('❌ Error cargando datos iniciales', {
                error: error.message
            }, 'error');
        }
    }

    async loadProducts() {
        this.log('🔄 Cargando productos', {
            page: this.currentPage,
            filters: this.currentFilters
        }, 'info');

        try {
            const params = {
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.currentFilters
            };

            const response = await api.getProducts(params);

            if (response.success) {
                this.products = response.data.products || [];
                this.renderProducts(this.products);

                if (response.data.pagination) {
                    this.renderPagination(response.data.pagination);
                }

                this.log('✅ Productos cargados correctamente', {
                    count: this.products.length,
                    page: this.currentPage,
                    totalPages: response.data.pagination?.pages || 0
                }, 'success');
            } else {
                this.log('⚠️ Respuesta no exitosa al cargar productos', {
                    response
                }, 'warn');
                this.renderEmptyState();
            }
        } catch (error) {
            this.log('❌ Error cargando productos', {
                error: error.message
            }, 'error');
            this.renderEmptyState();
        }
    }

    renderProducts(products) {
        this.log('🔄 Renderizando productos', {
            count: products.length
        }, 'info');

        const container = document.getElementById('productsContainer');
        if (!container) {
            this.log('⚠️ Contenedor de productos no encontrado', {}, 'warn');
            return;
        }

        if (products.length === 0) {
            this.renderEmptyState();
            return;
        }

        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
        this.log('✅ Productos renderizados correctamente', {
            count: products.length
        }, 'success');

        // After rendering, start tracking images
        this.trackProductImages();
    }

    createProductCard(product) {
        if (!product || !product.id) {
            this.log('❌ Producto inválido recibido en createProductCard', {
                product
            }, 'error');
            return '';
        }

        // Get primary image
        let imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk1IiBmaWxsPSIjRkYxNDkzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPgogICAgPHBhdGggZD0iTTEwMCA2MCBDOTAgNzAsIDg1IDg1LCA5MCAxMDAgQzk1IDExNSwgMTEwIDExNSwgMTE1IDEwMCBDMTIwIDg1LCAxMTUgNzAsIDEwNSA2MCBaIiBmaWxsPSIjZmZmIiAvPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjUiIGZpbGw9IiNmZmYiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOSI+CiAgICAgICAgTm8gZGlzcG9uaWJsZQogICAgPC90ZXh0Pgo8L3N2Zz4=';
        if (product.image_url && product.image_url.includes('supabase')) {
            imageUrl = product.image_url;
        } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
            if (primaryImage && primaryImage.url_large && primaryImage.url_large.includes('supabase')) {
                imageUrl = primaryImage.url_large;
            }
        }

        // Get occasion text
        let occasionText = 'General';
        if (product.occasion && this.occasions) {
            const occasion = this.occasions.find(o => o.id == product.occasion);
            if (occasion) {
                occasionText = occasion.name;
            }
        }

        // Prepare all images for hover effect
        let allImages = [];
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            allImages = product.images
                .filter(img => img.url_large && img.url_large.includes('supabase'))
                .map(img => img.url_large);
        }
        const imagesDataAttribute = allImages.length > 1 ? JSON.stringify(allImages) : '';

        return `
        <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
            <div class="card product-card h-100 shadow-sm border-0">
                <div class="position-relative">
                    <img src="${imageUrl}" 
                         data-src="${imageUrl}"
                         data-product-id="${product.id}"
                         ${imagesDataAttribute ? `data-images='${imagesDataAttribute}'` : ''}
                         class="card-img-top product-image"
                         alt="${product.name || 'Producto sin nombre'}"
                         loading="lazy"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk1IiBmaWxsPSIjRkYxNDkzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPgogICAgPHBhdGggZD0iTTEwMCA2MCBDOTAgNzAsIDg1IDg1LCA5MCAxMDAgQzk1IDExNSwgMTEwIDExNSwgMTE1IDEwMCBDMTIwIDg1LCAxMTUgNzAsIDEwNSA2MCBaIiBmaWxsPSIjZmZmIiAvPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjUiIGZpbGw9IiNmZmYiLz4KICAgIDx0ZXh0IHg9IjEwMCIgeT0iMTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuOSI+CiAgICAgICAgTm8gZGlzcG9uaWJsZQogICAgPC90ZXh0Pgo8L3N2Zz4='">
                    <div class="product-overlay">
                        <button class="btn btn-add-to-cart" data-product-id="${product.id}">
                            <i class="bi bi-bag-plus"></i> Agregar
                        </button>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title fw-bold">${product.name || 'Producto sin nombre'}</h5>
                    <p class="card-text text-muted flex-grow-1">${this.truncateText(product.description || '', 100)}</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-bold text-success">${product.price_usd ? `$${parseFloat(product.price_usd).toFixed(2)}` : 'Precio no disponible'}</span>
                            ${product.stock && product.stock > 0 ? 
                                '<span class="badge bg-success">En stock</span>' : 
                                '<span class="badge bg-secondary">Agotado</span>'
                            }
                        </div>
                        <button class="btn btn-primary w-100" onclick="floresyaApp.buyNow(${product.id})">
                            <i class="bi bi-cart-plus"></i> Comprar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    trackProductImages() {
        this.log('🔄 Iniciando seguimiento de imágenes de productos', {}, 'info');

        try {
            const productImages = document.querySelectorAll('.product-image');
            this.log('📊 Estadísticas de imágenes de productos', {
                totalImages: productImages.length,
                supabaseImages: Array.from(productImages).filter(img => img.src.includes('supabase')).length
            }, 'info');
        } catch (error) {
            this.log('❌ Error al rastrear imágenes de productos', {
                error: error.message
            }, 'error');
        }
    }

    renderEmptyState() {
        this.log('ℹ️ Renderizando estado vacío', {}, 'info');

        const container = document.getElementById('productsContainer');
        if (!container) {
            this.log('⚠️ Contenedor de productos no encontrado', {}, 'warn');
            return;
        }

        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <div class="mb-4">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6c757d" stroke-width="2"/>
                            <path d="M8 12L10.5 14.5L16 9" stroke="#6c757d" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <h3 class="text-muted mb-3">No se encontraron productos</h3>
                    <p class="text-muted mb-4">Lo sentimos, no hay productos que coincidan con tu búsqueda.</p>
                    <button class="btn btn-outline-primary" onclick="floresyaApp.clearAllFilters()">
                        <i class="bi bi-arrow-clockwise me-2"></i>Ver todos los productos
                    </button>
                </div>
            </div>
        `;
        this.log('✅ Estado vacío renderizado', {}, 'success');
    }

    bindEvents() {
        this.log('🔄 Vinculando eventos', {}, 'info');

        // Search events
        const searchInput = document.getElementById('searchInput');
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
            this.log('✅ Eventos de búsqueda vinculados', {}, 'success');
        }

        // Occasion filter
        const occasionFilter = document.getElementById('occasionFilter');
        if (occasionFilter) {
            occasionFilter.addEventListener('change', (e) => {
                this.filterByOccasionId(e.target.value);
            });
            this.log('✅ Evento de filtro de ocasión vinculado', {}, 'success');
        }

        // Pagination events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link') && e.target.dataset.page) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadProducts();
                    this.log('✅ Cambiando a página', {
                        page
                    }, 'success');
                }
            }
        });

        // Product events
        document.addEventListener('click', (e) => {
            // Add to cart
            if (e.target.classList.contains('btn-add-to-cart') || e.target.closest('.btn-add-to-cart')) {
                e.preventDefault();
                const btn = e.target.classList.contains('btn-add-to-cart') ? e.target : e.target.closest('.btn-add-to-cart');
                const productId = parseInt(btn.dataset.productId);
                if (productId) {
                    this.log('✅ Agregando producto al carrito', {
                        productId
                    }, 'success');
                    // Implement cart logic here
                }
            }

            // Buy now
            if (e.target.closest('[onclick^="floresyaApp.buyNow"]')) {
                e.preventDefault();
                const productId = parseInt(e.target.closest('[onclick^="floresyaApp.buyNow"]').getAttribute('onclick').match(/\d+/)[0]);
                if (productId) {
                    this.buyNow(productId);
                }
            }
        });

        this.log('✅ Todos los eventos vinculados correctamente', {}, 'success');
    }

    handleSearch() {
        this.log('🔄 Manejando búsqueda', {}, 'info');
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            this.currentFilters.search = searchInput.value.trim();
            this.currentPage = 1;
            this.loadProducts();
            this.log('✅ Búsqueda aplicada', {
                searchTerm: this.currentFilters.search
            }, 'success');
        }
    }

    filterByOccasionId(occasionId) {
        this.log('🔄 Filtrando por ocasión', {
            occasionId
        }, 'info');
        if (occasionId && occasionId !== '') {
            this.currentFilters.occasionId = occasionId;
        } else {
            delete this.currentFilters.occasionId;
        }
        this.currentPage = 1;
        this.loadProducts();
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    buyNow(productId) {
        this.log('✅ Iniciando compra inmediata', {
            productId
        }, 'success');
        // Implement buy now logic here
        window.location.href = `/pages/product-detail.html?id=${productId}`;
    }

    clearAllFilters() {
        this.log('🔄 Limpiando todos los filtros', {}, 'info');
        this.currentFilters = {};
        this.currentPage = 1;

        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';

        const occasionFilter = document.getElementById('occasionFilter');
        if (occasionFilter) occasionFilter.value = '';

        this.loadProducts();
    }

    populateOccasionFilter() {
        this.log('🔄 Poblando filtro de ocasiones', {}, 'info');
        const occasionFilter = document.getElementById('occasionFilter');
        if (!occasionFilter) {
            this.log('⚠️ Filtro de ocasiones no encontrado', {}, 'warn');
            return;
        }

        occasionFilter.innerHTML = '<option value="">Todas las ocasiones</option>';
        this.occasions.forEach(occasion => {
            const option = document.createElement('option');
            option.value = occasion.id;
            option.textContent = occasion.name;
            occasionFilter.appendChild(option);
        });
        this.log('✅ Filtro de ocasiones poblado', {
            count: this.occasions.length
        }, 'success');
    }

    populateOccasionsDropdown() {
        this.log('🔄 Poblando dropdown de ocasiones', {}, 'info');
        const dropdownMenu = document.getElementById('occasionsDropdownMenu');
        if (!dropdownMenu) {
            this.log('⚠️ Dropdown de ocasiones no encontrado', {}, 'warn');
            return;
        }

        dropdownMenu.innerHTML = '';
        this.occasions.forEach(occasion => {
            const link = document.createElement('a');
            link.className = 'dropdown-item d-flex align-items-center';
            link.href = '#';
            link.dataset.occasionId = occasion.id;
            link.innerHTML = `
                <i class="${occasion.icon || 'bi bi-calendar-event'} me-2"></i>
                ${occasion.name}
            `;
            dropdownMenu.appendChild(link);
        });
        this.log('✅ Dropdown de ocasiones poblado', {
            count: this.occasions.length
        }, 'success');
    }

    // Conversion optimization methods
    initializeConversionOptimizer() {
        this.log('📊 Inicializando optimizador de conversión', {}, 'info');
        this.trackUserSession();
        this.initializeExitIntentDetection();
        this.log('✅ Optimizador de conversión inicializado', {}, 'success');
    }

    trackUserSession() {
        window.addEventListener('beforeunload', () => {
            const sessionDuration = Date.now() - this.conversionOptimizer.sessionStartTime;
            this.log('📊 Sesión terminada', {
                duration: sessionDuration,
                viewedProducts: this.conversionOptimizer.viewedProducts.size,
                currentPage: window.location.pathname
            }, 'info');
        });
    }

    initializeExitIntentDetection() {
        let exitIntentShown = false;

        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 0 && !exitIntentShown && this.conversionOptimizer.viewedProducts.size > 0) {
                exitIntentShown = true;
                this.showExitIntentModal();
                this.log('🚨 Exit intent detectado', {
                    viewedProducts: this.conversionOptimizer.viewedProducts.size
                }, 'warn');
            }
        });
    }


    showExitIntentModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'exitIntentModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content" style="border: none; border-radius: 20px; overflow: hidden;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #FF69B4, #FF1493); color: white; border: none;">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>¡Espera! No te vayas sin tus flores 🌹
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center" style="padding: 40px;">
                        <div class="mb-4">
                            <div class="success-checkmark" style="background: #FF69B4; animation: none;">
                                <div class="check-icon">
                                    <span class="icon-line line-tip"></span>
                                    <span class="icon-line line-long"></span>
                                    <div class="icon-circle"></div>
                                    <div class="icon-fix"></div>
                                </div>
                            </div>
                        </div>
                        <h4>¡Obtén un 10% de descuento ahora!</h4>
                        <p class="text-muted mb-4">Usa el código <strong class="text-success">FLORES10</strong> en tu primera compra</p>
                        <div class="d-grid gap-3">
                            <button class="btn btn-success btn-lg" onclick="document.getElementById('exitIntentModal').remove();">
                                <i class="bi bi-cart-plus me-2"></i>Quiero mi descuento
                            </button>
                            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                No, gracias
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        this.log('🚨 Modal de intención de salida mostrado', {}, 'warn');
    }

    async loadCarousel() {
        this.log('🎠 Cargando carrusel profesional', {}, 'info');

        try {
            const response = await fetch('/api/carousel');
            const data = await response.json();
            
            if (data.success && data.data.images) {
                // Usar el nuevo servicio profesional de carrusel
                const success = await window.carouselService.initialize(
                    'dynamicCarousel', 
                    data.data.images
                );
                
                if (success) {
                    this.log('✅ Carrusel profesional cargado correctamente', {
                        count: data.data.images.length
                    }, 'success');
                } else {
                    this.log('⚠️ Carrusel inicializado con fallback', {}, 'warn');
                }
            } else {
                this.log('⚠️ No se encontraron imágenes del carrusel', {}, 'warn');
                // Mostrar fallback usando el servicio
                await window.carouselService.initialize('dynamicCarousel', []);
            }
        } catch (error) {
            this.log('❌ Error cargando carrusel', {
                error: error.message
            }, 'error');
            // Mostrar fallback en caso de error
            await window.carouselService.initialize('dynamicCarousel', []);
        }
    }

    // Métodos de carrusel removidos - ahora usa window.carouselService
    // renderCarouselFallback removido - ahora usa window.carouselService

    renderPagination(pagination) {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) return;

        let paginationHTML = '<ul class="pagination justify-content-center">';

        // Previous button
        paginationHTML += pagination.page > 1 ?
            `<li class="page-item"><a class="page-link" href="#" data-page="${pagination.page - 1}">«</a></li>` :
            `<li class="page-item disabled"><span class="page-link">«</span></li>`;

        // Page numbers
        const pages = pagination.pages;
        const currentPage = pagination.page;
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }

        if (endPage < pages) {
            if (endPage < pages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${pages}">${pages}</a></li>`;
        }

        // Next button
        paginationHTML += currentPage < pages ?
            `<li class="page-item"><a class="page-link" href="#" data-page="${pagination.page + 1}">»</a></li>` :
            `<li class="page-item disabled"><span class="page-link">»</span></li>`;

        paginationHTML += '</ul>';
        paginationContainer.innerHTML = paginationHTML;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.floresyaApp = new FloresYaApp();
    });
} else {
    window.floresyaApp = new FloresYaApp();
}
