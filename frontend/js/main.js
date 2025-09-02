// Main JavaScript functionality for FloresYa

class FloresYaApp {
    constructor() {
        this.currentPage = 1;
        this.currentFilters = {};
        this.products = [];
        this.categories = [];
        this.init();
    }

    async init() {
        this.setupDevMode();
        await this.loadInitialData();
        this.bindEvents();
        this.loadProducts();
        this.loadDynamicCarousel();
    }

    // Setup development mode visibility
    setupDevMode() {
        const isProduction = window.location.hostname.includes('vercel.app') || 
                           window.location.hostname === 'floresya.com' ||
                           window.location.hostname === 'www.floresya.com';
        
        if (isProduction) {
            // Hide DEV MODE menu in production
            const devMenu = document.querySelector('.navbar-nav .dropdown');
            if (devMenu && devMenu.textContent.includes('DEV MODE')) {
                devMenu.style.display = 'none';
            }
        }
        
        console.log(isProduction ? '🚀 Production Mode' : '🛠️ Development Mode');
    }

    // Load initial data (categories, settings, etc.)
    async loadInitialData() {
        try {
            // Load categories
            const categoriesResponse = await api.getCategories();
            
            if (categoriesResponse.success) {
                this.categories = categoriesResponse.data.categories;
                this.populateCategoryFilter();
                this.populateCategoryDropdown();
            }

            // Load settings if needed
            // const settingsResponse = await api.getSettings();

        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    // Populate category filter dropdown
    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    // Populate navigation category dropdown
    populateCategoryDropdown() {
        const categoriesDropdown = document.getElementById('categoriesDropdown');
        if (!categoriesDropdown) {
            console.warn('Categories dropdown not found');
            return;
        }

        console.log('Populating categories dropdown with', this.categories.length, 'categories');
        categoriesDropdown.innerHTML = '';
        
        // Add "All Categories" option
        const allLi = document.createElement('li');
        allLi.innerHTML = `<a class="dropdown-item" href="#productos" data-category-id="">
            <i class="bi bi-grid me-2"></i>Todas las categorías
        </a>`;
        categoriesDropdown.appendChild(allLi);

        if (this.categories.length > 0) {
            // Add separator
            const separator = document.createElement('li');
            separator.innerHTML = '<hr class="dropdown-divider">';
            categoriesDropdown.appendChild(separator);
            
            // Add category options
            this.categories.forEach(category => {
                const li = document.createElement('li');
                li.innerHTML = `<a class="dropdown-item" href="#productos" data-category-id="${category.id}">
                    <i class="bi bi-flower1 me-2"></i>${category.name}
                </a>`;
                categoriesDropdown.appendChild(li);
            });
        } else {
            // Add fallback categories if none loaded from API
            const fallbackCategories = [
                { id: 1, name: 'Rosas' },
                { id: 2, name: 'Bouquets' },
                { id: 3, name: 'Arreglos' },
                { id: 4, name: 'Plantas' }
            ];
            
            const separator = document.createElement('li');
            separator.innerHTML = '<hr class="dropdown-divider">';
            categoriesDropdown.appendChild(separator);
            
            fallbackCategories.forEach(category => {
                const li = document.createElement('li');
                li.innerHTML = `<a class="dropdown-item" href="#productos" data-category-id="${category.id}">
                    <i class="bi bi-flower1 me-2"></i>${category.name}
                </a>`;
                categoriesDropdown.appendChild(li);
            });
        }
    }

    // Bind all events
    bindEvents() {
        this.bindSearchEvents();
        this.bindFilterEvents();
        this.bindProductEvents();
        this.bindNavigationEvents();
        this.bindMenuEvents();
    }

    // Bind search events
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

    // Bind filter events
    bindFilterEvents() {
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.handleFilterChange();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                this.handleFilterChange();
            });
        }
    }

    // Bind product events
    bindProductEvents() {
        // Delegate product card events
        document.addEventListener('click', (e) => {
            // Product card click (redirect to detail page)
            const productCard = e.target.closest('.product-card');
            if (productCard && !e.target.closest('.btn-add-to-cart') && !e.target.closest('.btn-view-details')) {
                e.preventDefault();
                const productId = parseInt(productCard.dataset.productId);
                if (productId) {
                    window.location.href = `/pages/product-detail.html?id=${productId}`;
                }
            }

            // Add to cart button
            if (e.target.classList.contains('btn-add-to-cart') || e.target.closest('.btn-add-to-cart')) {
                e.preventDefault();
                const btn = e.target.classList.contains('btn-add-to-cart') ? e.target : e.target.closest('.btn-add-to-cart');
                const productId = parseInt(btn.dataset.productId);
                if (productId && window.cart) {
                    window.cart.addItem(productId, 1);
                }
            }

            // Product details button functionality removed - using direct page navigation instead

            // Product card click is already handled above - no duplicate needed
        });
    }

    // Bind navigation events
    bindNavigationEvents() {
        // Category dropdown clicks
        document.addEventListener('click', (e) => {
            if (e.target.dataset.categoryId) {
                e.preventDefault();
                this.filterByCategory(parseInt(e.target.dataset.categoryId));
            }

            if (e.target.dataset.occasion) {
                e.preventDefault();
                this.filterByOccasion(e.target.dataset.occasion);
            }
        });

        // Pagination clicks
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

    // Handle search
    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            this.currentFilters.search = searchInput.value.trim();
            this.currentPage = 1;
            this.loadProducts();
        }
    }

    // Handle filter changes
    handleFilterChange() {
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');

        if (categoryFilter) {
            this.currentFilters.category_id = categoryFilter.value || undefined;
        }

        if (sortFilter) {
            const [sort, order] = sortFilter.value.split(':');
            this.currentFilters.sort = sort;
            this.currentFilters.order = order;
        }

        this.currentPage = 1;
        this.loadProducts();
    }

    // Filter by category
    filterByCategory(categoryId) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = categoryId;
        }
        
        this.currentFilters.category_id = categoryId;
        this.currentPage = 1;
        this.loadProducts();

        // Scroll to products section
        document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
    }

    // Filter by occasion
    filterByOccasion(occasion) {
        this.currentFilters.occasion = occasion;
        this.currentPage = 1;
        this.loadProducts();

        // Scroll to products section
        document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
    }

    // Load products with current filters
    async loadProducts() {
        try {
            const params = {
                page: this.currentPage,
                limit: 12,
                ...this.currentFilters
            };

            // Remove undefined values
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
            api.handleError(error);
        }
    }

    // Render products grid
    renderProducts(products) {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="bi bi-search"></i>
                        <h6>No se encontraron productos</h6>
                        <p class="text-muted">Intenta ajustar tus filtros de búsqueda</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
    }

    // Create product card HTML
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

        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card product-card h-100" data-product-id="${product.id}">
                    ${product.featured ? '<span class="badge-featured">Destacado</span>' : ''}
                    <img data-responsive 
                         data-src="${product.primary_image || product.image_url || '/images/placeholder-product.jpg'}" 
                         data-context="card"
                         class="card-img-top product-image" 
                         alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description ? this.truncateText(product.description, 80) : ''}</p>
                        <div class="product-occasion mb-2">
                            <span class="badge-occasion">${occasionText}</span>
                        </div>
                        <div class="product-price mb-3">${api.formatCurrency(product.price)}</div>
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
                                    Sin Stock
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render pagination
    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        if (!container) return;

        const { page, pages, total } = pagination;

        if (pages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        if (page > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${page - 1}">Anterior</a>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">Anterior</span>
                </li>
            `;
        }

        // Page numbers
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

        // Next button
        if (page < pages) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${page + 1}">Siguiente</a>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">Siguiente</span>
                </li>
            `;
        }

        container.innerHTML = paginationHTML;
    }

    // Product details are now handled by the dedicated product-detail.html page

    // Product modal functionality removed - using dedicated product-detail.html page instead

    // Utility function to truncate text
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    // Load featured products for homepage
    async loadFeaturedProducts() {
        try {
            const response = await api.getFeaturedProducts(8);
            
            if (response.success) {
                this.renderProducts(response.data.products);
            }

        } catch (error) {
            console.error('Error loading featured products:', error);
        }
    }

    // Filter products by category
    filterByCategory(categoryId) {
        console.log('FloresYa: Filtering by category:', categoryId);
        this.currentFilters.category_id = categoryId;
        this.currentPage = 1;
        this.loadProducts();
        
        // Update category filter dropdown if it exists
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = categoryId;
        }
        
        // Smooth scroll to products section
        const productsSection = document.getElementById('productos');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Filter products by occasion
    filterByOccasion(occasion) {
        console.log('FloresYa: Filtering by occasion:', occasion);
        this.currentFilters.occasion = occasion;
        this.currentPage = 1;
        this.loadProducts();
        
        // Smooth scroll to products section
        const productsSection = document.getElementById('productos');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Load dynamic carousel from admin-managed content
    async loadDynamicCarousel() {
        // Load carousel section settings and images
        await this.loadCarouselSettings();
        await this.loadCarouselImages();
    }

    // Load carousel section settings
    async loadCarouselSettings() {
        try {
            const response = await fetch('/api/settings/homepage/all');
            const data = await response.json();
            
            if (data.success) {
                const settings = data.data;
                
                // Update carousel section title and subtitle
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
            console.error('Error loading carousel settings:', error);
        }
    }

    // Load and render carousel images
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
            console.error('Error loading carousel images:', error);
            this.renderFallbackCarousel();
        }
    }

    // Render carousel images
    renderCarouselImages(images) {
        const carousel = document.getElementById('dynamicCarousel');
        if (!carousel) return;

        // Duplicate images to create infinite scroll effect
        const extendedImages = [...images, ...images];
        
        const carouselHTML = extendedImages.map((image, index) => {
            return `
                <div class="carousel-item" data-link-url="${image.link_url || ''}">
                    <img src="${image.image_url}" 
                         alt="${image.title}" 
                         loading="lazy"
                         onerror="this.src='/images/placeholder.jpg'">
                    <div class="carousel-overlay">
                        <h5>${image.title}</h5>
                        ${image.description ? `<p>${image.description}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        carousel.innerHTML = carouselHTML;

        // Bind click events to carousel items
        carousel.addEventListener('click', (e) => {
            const item = e.target.closest('.carousel-item');
            if (item && item.dataset.linkUrl) {
                window.location.href = item.dataset.linkUrl;
            }
        });
    }

    // Render dynamic carousel (legacy - for products)
    renderDynamicCarousel(products) {
        const carousel = document.getElementById('dynamicCarousel');
        if (!carousel) return;

        // Duplicate products to create infinite scroll effect
        const extendedProducts = [...products, ...products];
        
        const carouselHTML = extendedProducts.map((product, index) => {
            return `
                <div class="carousel-item" data-product-id="${product.id}">
                    <img src="${product.primary_image || product.image_url || '/images/placeholder.jpg'}" 
                         alt="${product.name}" 
                         loading="lazy">
                    <div class="carousel-overlay">
                        <h5>${product.name}</h5>
                    </div>
                </div>
            `;
        }).join('');

        carousel.innerHTML = carouselHTML;

        // Bind click events to carousel items
        carousel.addEventListener('click', (e) => {
            const item = e.target.closest('.carousel-item');
            if (item) {
                const productId = parseInt(item.dataset.productId);
                if (productId) {
                    this.showProductDetails(productId);
                }
            }
        });
    }

    // Render fallback carousel with placeholder content
    renderFallbackCarousel() {
        const carousel = document.getElementById('dynamicCarousel');
        if (!carousel) return;

        const fallbackItems = [
            { name: 'Rosas Rojas', image: '/images/placeholder.jpg', id: 1 },
            { name: 'Bouquet Primavera', image: '/images/placeholder.jpg', id: 2 },
            { name: 'Arreglo Tropical', image: '/images/placeholder.jpg', id: 3 },
            { name: 'Flores de Cumpleaños', image: '/images/placeholder.jpg', id: 4 },
            { name: 'Ramo Nupcial', image: '/images/placeholder.jpg', id: 5 },
            { name: 'Condolencias', image: '/images/placeholder.jpg', id: 6 }
        ];

        // Duplicate for infinite scroll
        const extendedItems = [...fallbackItems, ...fallbackItems];

        const carouselHTML = extendedItems.map((item, index) => {
            return `
                <div class="carousel-item" data-product-id="${item.id}">
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

    // Bind menu events for dropdowns
    bindMenuEvents() {
        // Ensure Bootstrap dropdowns work
        const dropdownElements = document.querySelectorAll('[data-bs-toggle="dropdown"]');
        dropdownElements.forEach(element => {
            // Force Bootstrap dropdown initialization if needed
            if (!bootstrap.Dropdown.getInstance(element)) {
                new bootstrap.Dropdown(element);
            }
        });

        // Handle footer links for occasions
        document.addEventListener('click', (e) => {
            if (e.target.dataset && e.target.dataset.occasion) {
                e.preventDefault();
                this.filterByOccasion(e.target.dataset.occasion);
            }
        });

        // Debug logging for dropdown issues
        dropdownElements.forEach(element => {
            element.addEventListener('click', (e) => {
                console.log('Dropdown clicked:', element.id || element.textContent.trim());
            });
        });

        // Bind Flores Ya Novias form
        this.bindFloresNoviasForm();
    }

    // Show Flores Ya Novias modal
    showFloresNovias() {
        const modal = new bootstrap.Modal(document.getElementById('floresNoviasModal'));
        modal.show();
    }

    // =============================
    // FLORESYA RAPID PURCHASE FUNCTIONS
    // =============================

    async buyNow(productId, quantity = 1) {
        try {
            // Show loading state
            const button = document.querySelector(`[onclick*="buyNow(${productId})"]`);
            if (button) {
                button.disabled = true;
                button.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';
            }

            // Get product details
            const productResponse = await api.getProductById(productId);
            if (!productResponse.success) {
                api.showNotification('Error al obtener información del producto', 'danger');
                return;
            }

            const product = productResponse.data;

            // Check stock
            if (product.stock_quantity < quantity) {
                api.showNotification('Stock insuficiente', 'warning');
                return;
            }

            // Check if user is logged in
            const user = api.getUser();
            if (!user) {
                // Show quick login/register modal for guests
                this.showQuickPurchaseModal(product, quantity);
                return;
            }

            // Add to cart and redirect to checkout
            const addResponse = await cart.addItem(productId, quantity);
            if (addResponse.success) {
                // Show success animation
                this.showFloresYaAnimation();
                
                // Small delay for UX, then redirect
                setTimeout(() => {
                    window.location.href = '/pages/payment.html?floresya=true';
                }, 1500);
            }

        } catch (error) {
            console.error('Error in buyNow:', error);
            api.showNotification('Error al procesar la compra', 'danger');
        } finally {
            // Reset button state
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

        // Remove existing modal
        const existingModal = document.getElementById('quickPurchaseModal');
        if (existingModal) existingModal.remove();

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
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

            // Store guest data in session storage
            sessionStorage.setItem('floresya_guest', JSON.stringify(guestData));
            sessionStorage.setItem('floresya_purchase', JSON.stringify({
                productId, 
                quantity,
                timestamp: Date.now()
            }));

            // Add to cart as guest
            await cart.addItem(productId, quantity);

            // Show animation
            this.showFloresYaAnimation();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('quickPurchaseModal'));
            modal.hide();

            // Redirect to payment
            setTimeout(() => {
                window.location.href = '/pages/payment.html?floresya=true&guest=true';
            }, 1500);

        } catch (error) {
            console.error('Error processing quick purchase:', error);
            api.showNotification('Error al procesar la compra', 'danger');
        }
    }

    showFloresYaAnimation() {
        // Create and show success animation
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

        // Remove animation after delay
        setTimeout(() => {
            const animation = document.getElementById('floresya-animation');
            if (animation) animation.remove();
        }, 1500);
    }

    // Bind Flores Ya Novias form events
    bindFloresNoviasForm() {
        const form = document.getElementById('noviasContactForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Validate form
                if (!form.checkValidity()) {
                    e.stopPropagation();
                    form.classList.add('was-validated');
                    return;
                }

                try {
                    // Collect form data
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

                    // Show loading
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Enviando...';
                    submitBtn.disabled = true;

                    // Here you would normally send to your backend
                    // For now, simulate success
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Show success message
                    api.showNotification('¡Gracias! Tu consulta ha sido enviada. Te contactaremos pronto para programar tu cita personalizada.', 'success');
                    
                    // Reset form
                    form.reset();
                    form.classList.remove('was-validated');
                    
                    // Hide modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('floresNoviasModal'));
                    if (modal) {
                        modal.hide();
                    }

                    // Restore button
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;

                } catch (error) {
                    api.showNotification('Ha ocurrido un error. Por favor intenta nuevamente.', 'danger');
                    
                    // Restore button
                    const submitBtn = form.querySelector('button[type="submit"]');
                    submitBtn.innerHTML = '<i class="bi bi-send me-2"></i>Solicitar Consulta Gratuita';
                    submitBtn.disabled = false;
                }
            });
        }
    }
}

// Wait for stylesheets to load before initializing
function waitForStylesheets() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
            return;
        }
        
        // Check if all stylesheets are loaded
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        let loadedCount = 0;
        
        function checkLoaded() {
            loadedCount++;
            if (loadedCount >= links.length) {
                // Wait an additional frame to ensure layout is stable
                requestAnimationFrame(resolve);
            }
        }
        
        if (links.length === 0) {
            requestAnimationFrame(resolve);
            return;
        }
        
        links.forEach(link => {
            if (link.sheet) {
                checkLoaded();
            } else {
                link.addEventListener('load', checkLoaded);
            }
        });
        
        // Fallback timeout
        setTimeout(resolve, 1000);
    });
}

// Initialize app when DOM and stylesheets are loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌸 FloresYa: DOM loaded, waiting for stylesheets...');
    
    // Wait for stylesheets to load
    await waitForStylesheets();
    
    // Make page visible after stylesheets are loaded
    document.documentElement.classList.add('stylesheets-loaded');
    console.log('🎨 Stylesheets loaded, initializing app...');
    
    // Check if Bootstrap is loaded
    if (typeof bootstrap === 'undefined') {
        console.error('❌ Bootstrap not loaded!');
        return;
    }
    console.log('✅ Bootstrap loaded');
    
    // Initialize main app
    window.floresyaApp = new FloresYaApp();
    
    // Initialize auth manager
    if (typeof AuthManager !== 'undefined') {
        window.authManager = new AuthManager();
        console.log('✅ Auth Manager initialized');
    }
    
    // Initialize cart
    if (typeof ShoppingCart !== 'undefined') {
        window.cart = new ShoppingCart();
        console.log('✅ Shopping Cart initialized');
    }
    
    console.log('🎉 FloresYa: All systems initialized!');
});