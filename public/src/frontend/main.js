export class FloresYaApp {
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
        this.hoverIntervals = new Map();
        this.hoverTimeouts = new Map();
        if (window.logger) {
            window.logger.info('APP', '✅ FloresYaApp initialized');
        }
        else {
            console.log('[🌸 FloresYa] App initialized');
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        }
        else {
            this.init();
        }
    }
    log(message, data = null, level = 'info') {
        if (window.logger) {
            window.logger[level]('APP', message, data);
        }
        else {
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
            if (window.location.pathname === '/payment') {
                this.showPaymentPage();
                return;
            }
            this.bindEvents();
            void this.loadInitialData();
            this.initializeConversionOptimizer();
            this.log('✅ Aplicación inicializada correctamente', {}, 'success');
        }
        catch (error) {
            this.log('❌ Error al inicializar aplicación', {
                error: error instanceof Error ? error.message : String(error)
            }, 'error');
        }
    }
    async loadInitialData() {
        this.log('🔄 Cargando datos iniciales', {}, 'info');
        try {
            if (!window.api) {
                throw new Error('api is not defined');
            }
            const api = window.api;
            const occasionsResponse = await api.getOccasions();
            if (occasionsResponse.success && occasionsResponse.data) {
                this.occasions = occasionsResponse.data;
                this.populateOccasionFilter();
                this.log('✅ Ocasiones cargadas', { count: this.occasions.length }, 'success');
            }
            else {
                this.log('⚠️ No se pudieron cargar las ocasiones', occasionsResponse, 'warn');
            }
            await this.loadProducts();
            await this.loadCarousel();
            this.log('✅ Datos iniciales cargados', {}, 'success');
        }
        catch (error) {
            this.log('❌ Error cargando datos iniciales', {
                error: error instanceof Error ? error.message : String(error)
            }, 'error');
        }
    }
    async loadProducts() {
        this.log('🔄 Cargando productos', { page: this.currentPage, filters: this.currentFilters }, 'info');
        try {
            if (!window.api) {
                throw new Error('API not available');
            }
            const params = {
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.currentFilters
            };
            const response = await window.api.getProducts(params);
            if (response.success && response.data) {
                this.products = (response.data.products ?? []).map((p) => ({ ...p, images: p.images ?? [] }));
                this.clearAllHoverIntervals();
                this.renderProducts(this.products);
                if (response.data.pagination) {
                    this.renderPagination(response.data.pagination);
                }
                this.log('✅ Productos cargados', {
                    count: this.products.length,
                    page: this.currentPage
                }, 'success');
                this.trackProductsView();
            }
            else {
                this.log('❌ Error en respuesta de productos', response, 'error');
                this.showEmptyState();
            }
        }
        catch (error) {
            this.log('❌ Error cargando productos', {
                error: error instanceof Error ? error.message : String(error)
            }, 'error');
            this.showErrorState();
        }
    }
    async loadCarousel() {
        this.log('🔄 Cargando carrusel', {}, 'info');
        try {
            if (!window.api) {
                throw new Error('API not available');
            }
            const response = await window.api.getCarousel();
            if (response.success && response.data) {
                this.renderCarousel(response.data.carousel_products);
                this.log('✅ Carrusel cargado', {
                    count: response.data.carousel_products.length
                }, 'success');
            }
            else {
                const errorMessage = response.message ?? 'Unknown error';
                const isConnectivityIssue = errorMessage.includes('NetworkError') ||
                    errorMessage.includes('fetch') ||
                    errorMessage.includes('connectivity');
                this.log(`${isConnectivityIssue ? '🌐' : '⚠️'} No se pudieron cargar productos del carrusel`, {
                    message: errorMessage,
                    isConnectivityIssue
                }, isConnectivityIssue ? 'info' : 'warn');
                this.showCarouselFallback();
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isConnectivityIssue = errorMessage.includes('NetworkError') ||
                errorMessage.includes('fetch') ||
                errorMessage.includes('connectivity') ||
                errorMessage.includes('No network connectivity');
            this.log(`${isConnectivityIssue ? '🌐' : '❌'} Error cargando carrusel`, {
                error: errorMessage,
                isConnectivityIssue
            }, isConnectivityIssue ? 'warn' : 'error');
            this.showCarouselFallback();
        }
    }
    renderProducts(products) {
        const container = document.getElementById('productsContainer');
        if (!container)
            return;
        if (products.length === 0) {
            this.showEmptyState();
            return;
        }
        const html = products.map(product => this.createProductCard(product)).join('');
        container.innerHTML = html;
        this.bindProductCardHoverEvents();
    }
    createProductCard(product) {
        const smallImage = product.images?.find(img => img.size === 'small');
        const primaryImage = product.primary_image;
        const fallbackImage = product.images?.[0];
        const imageToUse = smallImage ?? primaryImage ?? fallbackImage;
        const imageUrl = imageToUse?.url ?? '/images/placeholder-product.webp';
        const mediumImages = product.medium_images ?? [];
        const mediumImagesJson = JSON.stringify(mediumImages);
        const price = product.price_usd;
        const formattedPrice = isNaN(price) ? 'N/A' : price.toFixed(2);
        return `
      <div class="col-md-4 col-lg-3 mb-4">
        <div class="card product-card h-100" data-product-id="${product.id}" data-medium-images='${mediumImagesJson}'>
          <div class="card-img-wrapper position-relative">
            <img src="${imageUrl}"
                 class="card-img-top"
                 alt="${product.name}"
                 width="300"
                 height="300"
                 loading="lazy"
                 onerror="this.src='/images/placeholder-product.webp'">

            <!-- Image indicator in top-left corner -->
            <div class="image-indicator position-absolute top-0 start-0 m-2 px-2 py-1 bg-dark bg-opacity-75 text-white rounded-pill small"
                 style="font-size: 0.75rem; z-index: 10;">
              <span class="current-image">1</span>/<span class="total-images">${Math.max(1, mediumImages.length ?? 1)}</span>
            </div>

            ${product.featured ? '<span class="badge badge-featured">Destacado</span>' : ''}
          </div>
          <div class="card-body d-flex flex-column">
            <!-- Product name with 2-line text wrapping -->
            <h5 class="card-title product-name" style="
              line-height: 1.2;
              height: 2.4em;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              margin-bottom: 0.75rem;
            ">${product.name}</h5>

            <p class="card-text flex-grow-1 small">${product.summary}</p>

            <!-- Price and BUY button row -->
            <div class="price-buy-row d-flex align-items-center justify-content-between mb-3">
              <div class="price">
                <strong class="h5 mb-0">${formattedPrice}</strong>
                <small class="text-muted">USD</small>
              </div>
              <!-- BUY button with gradient and bright design -->
              <button class="btn buy-now-btn"
                      data-product-id="${product.id}"
                      ${product.stock === 0 ? 'disabled' : ''}
                      style="
                        background: linear-gradient(45deg, #ff6b35, #f7931e, #ffd700);
                        border: none;
                        color: #fff;
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
                        transition: all 0.3s ease;
                        border-radius: 25px;
                        padding: 8px 20px;
                        font-size: 0.9rem;
                      "
                      onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(255, 193, 7, 0.6)';"
                      onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(255, 193, 7, 0.4)';">
                <i class="bi bi-lightning-charge-fill" style="color: #ffd700; font-size: 1.2em;"></i>
                <strong>BUY</strong>
              </button>
            </div>

            <div class="card-actions mt-auto">
              <div class="d-flex gap-2">
                <!-- Simplified cart button with cart + plus -->
                <button class="btn btn-primary btn-sm add-to-cart-btn flex-fill"
                        data-product-id="${product.id}"
                        ${product.stock === 0 ? 'disabled' : ''}
                        style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                  <i class="bi bi-cart3"></i><span style="font-weight: bold; font-size: 1.2em;">+</span>
                </button>
                <button class="btn btn-outline-secondary btn-sm view-details-btn flex-fill"
                        data-product-id="${product.id}">
                  <i class="bi bi-eye"></i> Ver
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    }
    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        if (!container)
            return;
        let html = '';
        if (pagination.current_page > 1) {
            html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${pagination.current_page - 1}">Anterior</a>
        </li>
      `;
        }
        const startPage = Math.max(1, pagination.current_page - 2);
        const endPage = Math.min(pagination.total_pages, pagination.current_page + 2);
        for (let page = startPage; page <= endPage; page++) {
            html += `
        <li class="page-item ${page === pagination.current_page ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${page}">${page}</a>
        </li>
      `;
        }
        if (pagination.current_page < pagination.total_pages) {
            html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${pagination.current_page + 1}">Siguiente</a>
        </li>
      `;
        }
        container.innerHTML = html;
    }
    populateOccasionFilter() {
        const select = document.getElementById('occasionFilter');
        if (!select)
            return;
        select.innerHTML = '<option value="">Todas las ocasiones</option>';
        this.occasions.forEach(occasion => {
            const option = document.createElement('option');
            option.value = occasion.slug;
            option.textContent = occasion.name;
            select.appendChild(option);
        });
    }
    bindEvents() {
        this.log('🔄 Vinculando eventos', {}, 'info');
        const searchInput = document.getElementById('searchInput');
        if (searchInput && window.api) {
            const debouncedSearch = window.api.debounce(() => {
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
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }
        const occasionFilter = document.getElementById('occasionFilter');
        if (occasionFilter) {
            occasionFilter.addEventListener('change', () => this.handleFilter());
        }
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.handleFilter());
        }
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.matches('#pagination .page-link')) {
                e.preventDefault();
                const page = parseInt(target.dataset.page ?? '1');
                this.changePage(page);
            }
        });
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.matches('.add-to-cart-btn') || target.closest('.add-to-cart-btn')) {
                const button = target.matches('.add-to-cart-btn') ? target : target.closest('.add-to-cart-btn');
                const productId = parseInt(button?.dataset?.productId ?? '0');
                if (productId)
                    this.addToCart(productId);
            }
            if (target.matches('.buy-now-btn') || target.closest('.buy-now-btn')) {
                const button = target.matches('.buy-now-btn') ? target : target.closest('.buy-now-btn');
                const productId = parseInt(button?.dataset?.productId ?? '0');
                if (productId)
                    this.buyNow(productId);
            }
            if (target.matches('.view-details-btn') || target.closest('.view-details-btn')) {
                const button = target.matches('.view-details-btn') ? target : target.closest('.view-details-btn');
                const productId = parseInt(button?.dataset?.productId ?? '0');
                if (productId)
                    this.viewProductDetails(productId);
            }
        });
        this.log('✅ Eventos vinculados', {}, 'success');
    }
    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput)
            return;
        this.currentFilters.search = searchInput.value.trim();
        this.currentPage = 1;
        void this.loadProducts();
        this.log('🔍 Búsqueda realizada', { query: this.currentFilters.search }, 'info');
    }
    handleFilter() {
        const occasionFilter = document.getElementById('occasionFilter');
        const sortFilter = document.getElementById('sortFilter');
        if (occasionFilter) {
            this.currentFilters.occasion = occasionFilter.value;
        }
        if (sortFilter) {
            this.currentFilters.sort = sortFilter.value;
        }
        this.currentPage = 1;
        void this.loadProducts();
        this.log('🔽 Filtros aplicados', this.currentFilters, 'info');
    }
    changePage(page) {
        this.currentPage = page;
        void this.loadProducts();
        const productsSection = document.getElementById('productos');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
        this.log('📄 Página cambiada', { page }, 'info');
    }
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product)
            return;
        if (typeof window !== 'undefined' && window.cart) {
            window.cart?.addItem({
                ...product,
                price_usd: product.price_usd ?? 0
            });
        }
        this.log('🛒 Producto agregado al carrito', { productId, productName: product.name }, 'info');
    }
    buyNow(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product)
            return;
        if (typeof window !== 'undefined' && window.cart) {
            window.cart?.addItem({
                ...product,
                price_usd: product.price_usd ?? 0
            });
        }
        this.log('⚡ Compra directa iniciada', { productId, productName: product.name }, 'info');
        window.location.href = '/payment';
    }
    viewProductDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product)
            return;
        this.conversionOptimizer.viewedProducts.add(productId);
        this.log('👁️ Detalles del producto visualizados', { productId, productName: product.name }, 'info');
    }
    bindProductCardHoverEvents() {
        this.clearAllHoverIntervals();
        const productCards = document.querySelectorAll('.product-card[data-medium-images]');
        productCards.forEach(card => {
            const cardElement = card;
            cardElement.addEventListener('mouseenter', () => {
                this.handleProductCardHover(cardElement, true);
            });
            cardElement.addEventListener('mouseleave', (e) => {
                const relatedTarget = e.relatedTarget;
                if (!relatedTarget || !cardElement.contains(relatedTarget)) {
                    this.handleProductCardHover(cardElement, false);
                }
            });
        });
    }
    clearAllHoverIntervals() {
        this.hoverIntervals.forEach(interval => {
            clearInterval(interval);
        });
        this.hoverIntervals.clear();
        this.hoverTimeouts.forEach(timeout => {
            clearTimeout(timeout);
        });
        this.hoverTimeouts.clear();
    }
    handleProductCardHover(card, isEntering) {
        var _a;
        const productImage = card.querySelector('.card-img-top');
        const productId = card.dataset.productId ?? 'unknown';
        if (!productImage)
            return;
        let mediumImages = [];
        try {
            const mediumImagesData = card.dataset.mediumImages ?? '[]';
            mediumImages = JSON.parse(mediumImagesData);
        }
        catch (error) {
            this.log('❌ Error parseando imágenes medium', { productId, error: error instanceof Error ? error.message : String(error) }, 'error');
            return;
        }
        (_a = card.dataset).originalImage ?? (_a.originalImage = productImage.src);
        if (isEntering) {
            card.classList.add('is-hovering');
            this.updateImageIndicator(card, 1);
            if (mediumImages.length > 1) {
                this.startImageRotation(card, productImage, mediumImages, productId);
            }
            this.log('🖼️ Hover iniciado en product card', {
                productId,
                totalImages: mediumImages.length
            }, 'info');
        }
        else {
            card.classList.remove('is-hovering');
            this.stopImageRotation(productId);
            this.returnToOriginalImage(card, productImage);
            this.updateImageIndicator(card, 1);
            this.log('🖼️ Hover terminado en product card', { productId }, 'info');
        }
    }
    startImageRotation(card, productImage, images, productId) {
        let currentImageIndex = 0;
        const startTimeout = setTimeout(() => {
            if (!card.classList.contains('is-hovering')) {
                this.hoverTimeouts.delete(productId);
                return;
            }
            const rotationInterval = setInterval(() => {
                if (!card.classList.contains('is-hovering')) {
                    clearInterval(rotationInterval);
                    this.hoverIntervals.delete(productId);
                    return;
                }
                currentImageIndex = (currentImageIndex + 1) % images.length;
                const nextImageUrl = images[currentImageIndex];
                if (nextImageUrl && productImage && typeof nextImageUrl === 'string') {
                    this.luxuryCrossfadeToImage(productImage, nextImageUrl);
                    this.updateImageIndicator(card, currentImageIndex + 1);
                }
            }, 2535);
            this.hoverIntervals.set(productId, rotationInterval);
            this.hoverTimeouts.delete(productId);
        }, 200);
        this.hoverTimeouts.set(productId, startTimeout);
    }
    stopImageRotation(productId) {
        const pendingTimeout = this.hoverTimeouts.get(productId);
        if (pendingTimeout) {
            clearTimeout(pendingTimeout);
            this.hoverTimeouts.delete(productId);
        }
        const existingInterval = this.hoverIntervals.get(productId);
        if (existingInterval) {
            clearInterval(existingInterval);
            this.hoverIntervals.delete(productId);
        }
    }
    luxuryCrossfadeToImage(imageElement, newImageUrl) {
        if (imageElement.src === newImageUrl)
            return;
        imageElement.dataset.transitioning = 'true';
        imageElement.classList.remove('crossfade-in', 'crossfade-out');
        void imageElement.offsetHeight;
        const preloadImage = new Image();
        const handleImageLoad = () => {
            if (!imageElement.parentNode || imageElement.dataset.transitioning !== 'true') {
                return;
            }
            imageElement.classList.add('crossfade-out');
            setTimeout(() => {
                if (imageElement.dataset.transitioning === 'true') {
                    imageElement.src = newImageUrl;
                    imageElement.classList.remove('crossfade-out');
                    imageElement.classList.add('crossfade-in');
                    setTimeout(() => {
                        imageElement.classList.remove('crossfade-in');
                        delete imageElement.dataset.transitioning;
                    }, 800);
                }
            }, 400);
        };
        const handleImageError = () => {
            delete imageElement.dataset.transitioning;
            this.log('⚠️ Error cargando imagen para crossfade', { imageUrl: newImageUrl }, 'warn');
        };
        preloadImage.onload = handleImageLoad;
        preloadImage.onerror = handleImageError;
        preloadImage.src = newImageUrl;
    }
    returnToOriginalImage(card, productImage) {
        const originalImage = card.dataset.originalImage;
        if (originalImage && productImage.src !== originalImage && typeof originalImage === 'string') {
            delete productImage.dataset.transitioning;
            productImage.classList.remove('crossfade-in', 'crossfade-out');
            productImage.src = originalImage;
            productImage.style.opacity = '0.8';
            setTimeout(() => {
                productImage.style.opacity = '1';
            }, 50);
        }
    }
    updateImageIndicator(card, currentImageNumber) {
        const indicator = card.querySelector('.current-image');
        if (indicator) {
            indicator.textContent = currentImageNumber.toString();
        }
    }
    showEmptyState() {
        const container = document.getElementById('productsContainer');
        if (!container)
            return;
        container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-flower1 display-1 text-muted mb-3"></i>
        <h4 class="text-muted">No se encontraron productos</h4>
        <p class="text-muted">Intenta ajustar tus filtros de búsqueda</p>
        <button class="btn btn-primary" onclick="location.reload()">
          <i class="bi bi-arrow-clockwise"></i> Recargar
        </button>
      </div>
    `;
    }
    showErrorState() {
        const container = document.getElementById('productsContainer');
        if (!container)
            return;
        container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-exclamation-triangle display-1 text-danger mb-3"></i>
        <h4 class="text-danger">Error al cargar productos</h4>
        <p class="text-muted">Ha ocurrido un error. Intenta recargar la página.</p>
        <button class="btn btn-danger" onclick="location.reload()">
          <i class="bi bi-arrow-clockwise"></i> Recargar
        </button>
      </div>
    `;
    }
    initializeConversionOptimizer() {
        this.log('📊 Conversion Optimizer inicializado', {
            sessionStart: new Date().toISOString()
        }, 'info');
    }
    trackProductsView() {
        const viewedProductIds = this.products.map(p => p.id);
        this.log('📈 Vista de productos registrada', {
            productIds: viewedProductIds,
            count: viewedProductIds.length
        }, 'info');
    }
    renderCarousel(products) {
        const container = document.getElementById('dynamicCarousel');
        if (!container) {
            this.log('⚠️ Contenedor del carrusel no encontrado', {}, 'warn');
            return;
        }
        if (products.length === 0) {
            this.showCarouselFallback();
            return;
        }
        const createCardHtml = (product, index) => {
            const smallImages = product.images ? product.images.filter(img => img.size === 'small') : [];
            const primaryImage = product.primary_thumb_url ?? '/images/placeholder-product.webp';
            const rotationImages = smallImages.length > 0
                ? smallImages.map(img => img.url)
                : [primaryImage];
            const imagesData = JSON.stringify(rotationImages).replace(/"/g, '&quot;');
            return `
    <div class="carousel-card"
         style="flex: 0 0 340px; height: 420px; margin: 0 12px; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%); border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); overflow: hidden; position: relative; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: 1px solid rgba(0,0,0,0.08);"
         data-product-id="${product.id}"
         data-index="${index}"
         data-images="${imagesData}">

      <!-- Image container with indicator -->
      <div class="image-container" style="padding: 20px 20px 15px 20px; text-align: center; position: relative;">

        <!-- Image indicator in top-left corner -->
        <div class="image-indicator position-absolute top-0 start-0 m-2 px-2 py-1 bg-dark bg-opacity-75 text-white rounded-pill small"
             style="font-size: 0.75rem; z-index: 10; margin-top: 25px !important; margin-left: 25px !important;">
          <span class="current-image">1</span>/<span class="total-images">${Math.max(1, rotationImages.length)}</span>
        </div>

        <img class="product-image"
             src="${primaryImage}"
             style="width: 200px; height: 200px; object-fit: cover; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); border: 3px solid rgba(255,255,255,0.9); transition: all 0.4s ease;"
             alt="${product.name}"
             loading="${index < 3 ? 'eager' : 'lazy'}"
             onerror="this.src='/images/placeholder-product.webp'">
      </div>

      <!-- Product info with new layout -->
      <div style="padding: 0 20px 20px 20px;">
        <!-- Product name with 2-line wrapping -->
        <h5 class="product-name" style="
          font-size: 1.1rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 12px;
          line-height: 1.2;
          height: 2.4em;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        ">${product.name}</h5>

        <!-- Price and BUY button row -->
        <div class="price-buy-row d-flex align-items-center justify-content-between mb-3">
          <div class="price">
            <strong style="font-size: 1.2rem; color: #2c3e50;">$${product.price_usd.toFixed(2)}</strong>
            <small class="text-muted"> USD</small>
          </div>
          <!-- BUY button with gradient -->
          <button class="btn buy-now-btn"
                  data-product-id="${product.id}"
                  style="
                    background: linear-gradient(45deg, #ff6b35, #f7931e, #ffd700);
                    border: none;
                    color: #fff;
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
                    transition: all 0.3s ease;
                    border-radius: 20px;
                    padding: 6px 16px;
                    font-size: 0.85rem;
                  "
                  onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(255, 193, 7, 0.6)';"
                  onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(255, 193, 7, 0.4)';">
            <i class="bi bi-lightning-charge-fill" style="color: #ffd700; font-size: 1.1em;"></i>
            <strong>BUY</strong>
          </button>
        </div>

        <!-- Action buttons -->
        <div class="d-flex gap-2">
          <!-- Simplified cart button -->
          <button class="btn btn-primary btn-sm add-to-cart-btn flex-fill"
                  data-product-id="${product.id}"
                  style="display: flex; align-items: center; justify-content: center; gap: 4px; border-radius: 12px;">
            <i class="bi bi-cart3"></i><span style="font-weight: bold; font-size: 1.1em;">+</span>
          </button>
          <button class="btn btn-outline-secondary btn-sm view-details-btn flex-fill"
                  data-product-id="${product.id}"
                  style="border-radius: 12px;">
            <i class="bi bi-eye"></i> Ver
          </button>
        </div>
      </div>

      <!-- Enhanced hover overlay -->
      <div class="card-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.02); opacity: 0; transition: all 0.3s ease; border-radius: 20px;"></div>
    </div>
  `;
        };
        const imgWidth = 364;
        const totalProducts = products.length;
        const trackWidth = imgWidth * totalProducts * 2;
        const carouselHtml = `
    <div class="carousel-wrapper" style="position: relative; width: 100%; overflow: visible; margin: auto; padding: 0 100px;">
      <div class="carousel-container" style="position: relative; width: 100%; height: 440px; overflow: hidden; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%); border-radius: 25px; box-shadow: 0 8px 40px rgba(0,0,0,0.1); border: 2px solid rgba(255,255,255,0.8);">
        <div class="image-track" id="imageTrack" style="display: flex; position: relative; width: ${trackWidth}px; height: 100%; will-change: transform; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 10px 0;">
          ${[...products, ...products].map((p, i) => createCardHtml(p, i)).join('')}
        </div>
      </div>

      <!-- Enhanced Left Arrow -->
      <button class="arrow-btn" id="arrow-left"
              style="
                position: absolute;
                top: 50%;
                left: 20px;
                transform: translateY(-50%);
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                border: 3px solid #007bff;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 15;
                box-shadow: 0 6px 20px rgba(0, 123, 255, 0.3);
                cursor: pointer;
                opacity: 0.95;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 20px;
                color: #007bff;
                font-weight: bold;
              "
              onmouseover="
                this.style.transform='translateY(-50%) scale(1.1)';
                this.style.boxShadow='0 8px 30px rgba(0, 123, 255, 0.5)';
                this.style.background='linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                this.style.color='#ffffff';
              "
              onmouseout="
                this.style.transform='translateY(-50%) scale(1)';
                this.style.boxShadow='0 6px 20px rgba(0, 123, 255, 0.3)';
                this.style.background='linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
                this.style.color='#007bff';
              ">
        <i class="bi bi-chevron-left"></i>
      </button>

      <!-- Enhanced Right Arrow -->
      <button class="arrow-btn" id="arrow-right"
              style="
                position: absolute;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                border: 3px solid #007bff;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 15;
                box-shadow: 0 6px 20px rgba(0, 123, 255, 0.3);
                cursor: pointer;
                opacity: 0.95;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-size: 20px;
                color: #007bff;
                font-weight: bold;
              "
              onmouseover="
                this.style.transform='translateY(-50%) scale(1.1)';
                this.style.boxShadow='0 8px 30px rgba(0, 123, 255, 0.5)';
                this.style.background='linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                this.style.color='#ffffff';
              "
              onmouseout="
                this.style.transform='translateY(-50%) scale(1)';
                this.style.boxShadow='0 6px 20px rgba(0, 123, 255, 0.3)';
                this.style.background='linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
                this.style.color='#007bff';
              ">
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  `;
        container.innerHTML = carouselHtml;
        this.initializeInfiniteCarousel(products);
        this.log('✅ Carrusel infinito de productos renderizado', { productCount: products.length }, 'success');
    }
    initializeInfiniteCarousel(products) {
        const track = document.getElementById('imageTrack');
        const arrowLeft = document.getElementById('arrow-left');
        const arrowRight = document.getElementById('arrow-right');
        if (!track || !arrowLeft || !arrowRight || products.length === 0)
            return;
        const imgWidth = 300;
        const totalProducts = products.length;
        const singleTrackWidth = imgWidth * totalProducts;
        const _fullTrackWidth = singleTrackWidth * 2;
        let position = 0;
        const direction = 1;
        let isAutoScrolling = true;
        const speed = 1.5;
        [arrowLeft, arrowRight].forEach(btn => {
            btn.addEventListener('mouseenter', () => { btn.style.background = '#e6e6e6'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = '#fff'; });
        });
        arrowLeft.addEventListener('click', () => {
            isAutoScrolling = false;
            position = Math.max(0, position - imgWidth);
            this.snapToNearest(position, imgWidth, track);
            setTimeout(() => { isAutoScrolling = true; }, 2000);
        });
        arrowRight.addEventListener('click', () => {
            isAutoScrolling = false;
            position = Math.min(singleTrackWidth, position + imgWidth);
            this.snapToNearest(position, imgWidth, track);
            setTimeout(() => { isAutoScrolling = true; }, 2000);
        });
        const cards = Array.from(track.querySelectorAll('.carousel-card'));
        cards.forEach(card => {
            const element = card;
            const overlay = element.querySelector('.card-overlay');
            const productImage = element.querySelector('.product-image');
            const imagesData = element.dataset.images;
            let hoverInterval = null;
            let currentImageIndex = 0;
            let images = [];
            try {
                images = JSON.parse((imagesData ?? '[]').replace(/&quot;/g, '"'));
            }
            catch (_error) {
                images = [productImage.src];
            }
            const changeImage = (newSrc) => {
                if (productImage.src === newSrc)
                    return;
                productImage.style.opacity = '0';
                setTimeout(() => {
                    productImage.src = newSrc;
                    productImage.style.opacity = '1';
                }, 200);
            };
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'translateY(-8px) scale(1.02)';
                element.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                element.style.borderColor = 'rgba(40, 167, 69, 0.3)';
                if (overlay) {
                    overlay.style.opacity = '1';
                    const overlayContent = overlay.querySelector('div');
                    if (overlayContent)
                        overlayContent.style.transform = 'scale(1)';
                }
                this.updateImageIndicator(element, 1);
                if (images.length > 1) {
                    currentImageIndex = 0;
                    hoverInterval = setInterval(() => {
                        currentImageIndex = (currentImageIndex + 1) % images.length;
                        const imageUrl = images[currentImageIndex];
                        if (imageUrl) {
                            changeImage(imageUrl);
                            this.updateImageIndicator(element, currentImageIndex + 1);
                        }
                    }, 2535);
                }
                this.log('🖼️ Hover iniciado - Rotación de imágenes', {
                    productId: element.dataset.productId ?? 'unknown',
                    totalImages: images.length
                }, 'info');
            });
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translateY(0) scale(1)';
                element.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                element.style.borderColor = 'rgba(0,0,0,0.05)';
                if (overlay) {
                    overlay.style.opacity = '0';
                    const overlayContent = overlay.querySelector('div');
                    if (overlayContent)
                        overlayContent.style.transform = 'scale(0.8)';
                }
                if (hoverInterval) {
                    clearInterval(hoverInterval);
                    hoverInterval = null;
                }
                this.updateImageIndicator(element, 1);
                if (images.length > 0) {
                    setTimeout(() => {
                        const firstImage = images[0];
                        if (firstImage) {
                            changeImage(firstImage);
                        }
                        currentImageIndex = 0;
                    }, 100);
                }
                this.log('🖼️ Hover terminado - Imagen restaurada', {
                    productId: element.dataset.productId ?? 'unknown'
                }, 'info');
            });
            element.addEventListener('click', () => {
                const productId = parseInt(element.dataset.productId ?? '0');
                if (productId)
                    this.viewProductDetails(productId);
            });
        });
        const animate = () => {
            if (isAutoScrolling) {
                position += speed * direction;
                if (direction > 0 && position >= singleTrackWidth) {
                    position = 0;
                }
                else if (direction < 0 && position <= 0) {
                    position = singleTrackWidth;
                }
            }
            track.style.transform = `translateX(${-position}px)`;
            requestAnimationFrame(animate);
        };
        animate();
        this.log('✅ Carrusel infinito activado con loop visual suave y sin solapamiento', { productCount: products.length }, 'success');
    }
    snapToNearest(position, imgWidth, track) {
        const snapped = Math.round(position / imgWidth) * imgWidth;
        track.style.transform = `translateX(${-snapped}px)`;
    }
    showCarouselFallback() {
        const container = document.getElementById('dynamicCarousel');
        if (!container)
            return;
        const fallbackHtml = `
      <div class="carousel-fallback">
        <i class="bi bi-flower1"></i>
        <h4>Creaciones Destacadas</h4>
        <p>Descubre nuestros arreglos florales más populares y especiales</p>
        <button class="btn btn-primary-custom" onclick="document.getElementById('productos').scrollIntoView({behavior: 'smooth'});">
          <i class="bi bi-arrow-down me-2"></i>Ver Productos
        </button>
      </div>
    `;
        container.innerHTML = fallbackHtml;
        this.log('⚠️ Mostrando fallback del carrusel', {}, 'warn');
    }
    toggleDevMode() {
        this.isProductionMode = !this.isProductionMode;
        localStorage.setItem('floresya_dev_mode', (!this.isProductionMode).toString());
        this.log('🔧 Modo desarrollador cambiado', { devMode: !this.isProductionMode }, 'info');
    }
    showFloresNovias() {
        const modal = document.getElementById('floresNoviasModal');
        const bootstrap = window.bootstrap;
        if (modal && bootstrap?.Modal) {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    }
    getStats() {
        return {
            products: this.products.length,
            occasions: this.occasions.length,
            currentPage: this.currentPage,
            sessionStart: this.conversionOptimizer.sessionStartTime,
            viewedProducts: this.conversionOptimizer.viewedProducts.size
        };
    }
    showPaymentPage() {
        this.log('💳 Mostrando página de pago', {}, 'info');
        document.body.innerHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FloresYa - Zona de Pago</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
      </head>
      <body class="bg-light">
        <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
          <div class="row w-100 justify-content-center">
            <div class="col-12 col-md-8 col-lg-6">
              <div class="card shadow-lg border-0">
                <div class="card-header bg-success text-white text-center py-4">
                  <h1 class="mb-0">
                    <i class="bi bi-credit-card me-2"></i>
                    Zona de Pago
                  </h1>
                  <p class="mb-0 mt-2 opacity-75">Procesamiento de compra seguro</p>
                </div>

                <div class="card-body text-center py-5">
                  <div class="mb-4">
                    <i class="bi bi-flower1 display-1 text-success mb-3"></i>
                    <h3 class="mb-3">FloresYa</h3>
                    <p class="text-muted lead">
                      Aquí se implementará el sistema de pago seguro para completar tu compra.
                    </p>
                  </div>

                  <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Página en desarrollo:</strong> La funcionalidad de pago será implementada próximamente.
                  </div>

                  <div class="d-grid gap-3 mt-4">
                    <button class="btn btn-outline-secondary btn-lg" onclick="window.history.back()">
                      <i class="bi bi-arrow-left me-2"></i>
                      Retornar
                    </button>

                    <button class="btn btn-success btn-lg" onclick="window.location.href='/'">
                      <i class="bi bi-house me-2"></i>
                      Inicio
                    </button>
                  </div>
                </div>

                <div class="card-footer text-center text-muted py-3">
                  <small>
                    <i class="bi bi-shield-check me-1"></i>
                    Compra 100% segura y protegida
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `;
        this.log('✅ Página de pago mostrada', {}, 'success');
    }
}
export const floresyaApp = new FloresYaApp();
window.floresyaApp = floresyaApp;
export default floresyaApp;
if (window.logger) {
    window.logger.success('APP', '✅ TypeScript FloresYa App loaded and ready');
}
else {
    console.log('[🌸 FloresYa] TypeScript App loaded and ready');
}
