/**
 * 🌸 FloresYaApp - Motor principal de la experiencia de usuario
 * Carga diferida, eventos delegados, optimizado para conversión y performance.
 * Logging exhaustivo para confirmar ejecución y errores.
 */
class FloresYaApp {
    constructor() {
        this.currentPage = 1;
        this.currentFilters = {};
        this.products = [];
        this.occasions = [];
        this.isProductionMode = false;
        this.logger = window.floresyaLogger || console;
        
        // ✨ Advanced Conversion Optimization Properties
        this.conversionOptimizer = {
            urgencyTimer: null,
            socialProofInterval: null,
            exitIntentTriggered: false,
            viewedProducts: new Set(),
            sessionStartTime: Date.now(),
            abandonmentTimer: null
        };
        
        // Initialize with logging
        if (window.logger) {
            window.logger.info('APP', '✅ FloresYaApp constructor initialized');
        } else {
            console.log('[🌸 APP] FloresYaApp constructor initialized');
        }
        
        this.init();
    }

    log(message, data = null, level = 'info') {
        // Use window.logger if available
        if (window.logger) {
            window.logger[level]('APP', message, data);
        } else {
            const prefix = '[🌸 APP]';
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

    async init() {
        const initTimer = this.logger.startTimer ? this.logger.startTimer('FloresYaApp.init') : null;
        this.log('🔄 Inicializando FloresYaApp', {
            url: window.location.href,
            timestamp: new Date().toISOString()
        }, 'info');
        
        try {
            this.log('✅ FloresYaApp inicializado correctamente', {}, 'success');
            
            // Inicializar módulos críticos
            this.initializePerformanceOptimizer();
            this.initializeAccessibilityEnhancer();
            
            // ✨ Initialize Advanced Conversion Features
            this.initializeConversionOptimizer();
            this.initializeExitIntentDetection();
            this.initializeSocialProofEngine();
            
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
                        this.log('❌ Error cargando datos iniciales', { error: error.message }, 'error');
                    });
            });
        } catch (error) {
            this.log('❌ Error crítico en inicialización', { error: error.message }, 'error');
            throw error;
        } finally {
            if (initTimer) initTimer.end('APP');
        }
    }

    // ============ INICIALIZACIÓN DE MÓDULOS ============
    
    // ✨ ADVANCED CONVERSION OPTIMIZATION METHODS ✨
    initializeConversionOptimizer() {
        this.log('📊 Inicializando optimizador de conversión', {}, 'info');
        
        // Start session tracking
        this.trackUserSession();
        
        // Initialize urgency elements
        this.createUrgencyElements();
        
        // Setup A/B testing framework
        this.initializeABTesting();
        
        // Initialize personalization engine
        this.initializePersonalization();
        
        this.log('✅ Optimizador de conversión inicializado', {}, 'success');
    }
    
    initializeExitIntentDetection() {
        this.log('📚 Inicializando detección de intención de salida', {}, 'info');
        
        let exitIntentShown = false;
        
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 0 && !exitIntentShown && this.conversionOptimizer.viewedProducts.size > 0) {
                exitIntentShown = true;
                this.showExitIntentModal();
                this.log('🚨 Exit intent detectado', { viewedProducts: this.conversionOptimizer.viewedProducts.size }, 'warn');
            }
        });
        
        // Mobile exit intent (scroll to top quickly)
        let lastScrollY = 0;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < 50 && lastScrollY > 100 && !exitIntentShown) {
                exitIntentShown = true;
                this.showExitIntentModal();
            }
            lastScrollY = currentScrollY;
        });
        
        this.log('✅ Detección de intención de salida configurada', {}, 'success');
    }
    
    initializeSocialProofEngine() {
        this.log('👥 Inicializando motor de prueba social', {}, 'info');
        
        // Show recent purchases popup
        this.conversionOptimizer.socialProofInterval = setInterval(() => {
            this.showSocialProofNotification();
        }, 30000); // Every 30 seconds
        
        // Update real-time visitor count
        this.updateVisitorCount();
        
        this.log('✅ Motor de prueba social iniciado', {}, 'success');
    }
    
    trackUserSession() {
        // Track page views and time spent
        window.addEventListener('beforeunload', () => {
            const sessionDuration = Date.now() - this.conversionOptimizer.sessionStartTime;
            this.log('📊 Sesión terminada', {
                duration: sessionDuration,
                viewedProducts: this.conversionOptimizer.viewedProducts.size,
                currentPage: window.location.pathname
            }, 'info');
        });
    }
    
    createUrgencyElements() {
        // Create floating timer for limited offers
        const urgencyBar = document.createElement('div');
        urgencyBar.className = 'cart-timer';
        urgencyBar.innerHTML = '🔥 ¡Oferta por tiempo limitado! Termina en <span id="urgency-countdown">15:00</span>';
        urgencyBar.style.display = 'none';
        document.body.appendChild(urgencyBar);
        
        // Start countdown
        this.startUrgencyCountdown();
    }
    
    startUrgencyCountdown() {
        let timeLeft = 15 * 60; // 15 minutes
        const countdownElement = document.getElementById('urgency-countdown');
        
        if (!countdownElement) return;
        
        this.conversionOptimizer.urgencyTimer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(this.conversionOptimizer.urgencyTimer);
                this.hideUrgencyElements();
            }
            timeLeft--;
        }, 1000);
    }
    
    showSocialProofNotification() {
        const names = ['María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'José', 'Carmen', 'Miguel'];
        const products = ['Ramo de Rosas', 'Bouquet Premium', 'Arreglo Tropical', 'Flores de Cumpleaños'];
        const cities = ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay'];
        
        const notification = document.createElement('div');
        notification.className = 'social-proof-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 15px;
            box-shadow: 0 8px 30px rgba(255, 105, 180, 0.2);
            border-left: 4px solid #28a745;
            z-index: 1001;
            max-width: 300px;
            transform: translateX(-100%);
            transition: transform 0.5s ease;
        `;
        
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #28a745, #20c997); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.9rem;">
                    ${randomName.charAt(0)}
                </div>
                <div>
                    <strong style="color: #28a745;">${randomName}</strong> de ${randomCity}<br>
                    <small style="color: #666;">Acaba de comprar: ${randomProduct}</small>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; color: #999; cursor: pointer; margin-left: auto;">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
        
        this.log('👥 Notificación de prueba social mostrada', { name: randomName, product: randomProduct }, 'info');
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
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            ¡Espera! No te vayas sin tus flores 🌹
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center" style="padding: 40px;">
                        <div class="mb-4">
                            <div class="success-checkmark" style="background: #FF69B4; animation: none;">
                                <i class="bi bi-gift" style="color: white; font-size: 2rem;"></i>
                            </div>
                        </div>
                        <h3 class="fw-bold mb-3" style="color: #FF1493;">¡OFERTA ESPECIAL!</h3>
                        <p class="lead mb-4">Obtén <strong style="color: #28a745;">15% de descuento</strong> en tu primera compra</p>
                        <div class="d-grid gap-3">
                            <button class="btn btn-lg cta-primary" onclick="this.applyExitDiscount()">
                                <i class="bi bi-tag-fill me-2"></i>¡SÍ! Quiero mi descuento
                            </button>
                            <small class="text-muted">Código: <strong>FLORES15</strong> - Válido solo por hoy</small>
                        </div>
                        <div class="mt-4" style="background: rgba(40, 167, 69, 0.1); padding: 20px; border-radius: 15px;">
                            <div class="row text-center">
                                <div class="col-4">
                                    <i class="bi bi-truck text-success mb-2" style="font-size: 2rem;"></i>
                                    <small class="d-block"><strong>Envío Gratis</strong></small>
                                </div>
                                <div class="col-4">
                                    <i class="bi bi-shield-check text-success mb-2" style="font-size: 2rem;"></i>
                                    <small class="d-block"><strong>100% Garantizado</strong></small>
                                </div>
                                <div class="col-4">
                                    <i class="bi bi-clock text-success mb-2" style="font-size: 2rem;"></i>
                                    <small class="d-block"><strong>Entrega 24h</strong></small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Remove modal when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
        
        this.log('💪 Exit intent modal mostrado', {}, 'success');
    }
    
    updateVisitorCount() {
        // Simulate real-time visitor count
        const baseCount = 45;
        const variation = Math.floor(Math.random() * 10);
        const currentCount = baseCount + variation;
        
        // Update visitor count in social proof banner if exists
        const visitorElement = document.querySelector('[data-visitor-count]');
        if (visitorElement) {
            visitorElement.textContent = `${currentCount} personas viendo esto ahora`;
        }
    }
    
    initializeABTesting() {
        // Simple A/B testing framework
        const variant = Math.random() > 0.5 ? 'A' : 'B';
        document.body.setAttribute('data-ab-variant', variant);
        this.log('🧪 A/B Testing variante asignada', { variant }, 'info');
    }
    
    initializePersonalization() {
        // Basic personalization based on time and returning visitor
        const hour = new Date().getHours();
        let greeting = 'Buenos días';
        
        if (hour >= 12 && hour < 18) greeting = 'Buenas tardes';
        else if (hour >= 18) greeting = 'Buenas noches';
        
        // Update greeting if element exists
        const greetingElement = document.querySelector('[data-personalized-greeting]');
        if (greetingElement) {
            greetingElement.textContent = greeting;
        }
        
        this.log('👤 Personalización aplicada', { greeting, hour }, 'info');
    }
    initializePerformanceOptimizer() {
        this.log('🔄 Inicializando PerformanceOptimizer', {}, 'info');
        
        if (typeof PerformanceOptimizer !== 'undefined') {
            this.performanceOptimizer = new PerformanceOptimizer({
                lazyLoadOffset: 200,
                imageQuality: 'auto',
                enableWebP: true,
                enablePrefetch: true,
                debounceDelay: 150,
                intersectionThreshold: 0.15
            });
            this.log('✅ Optimizador de performance inicializado', {}, 'success');
        } else {
            this.log('⚠️ PerformanceOptimizer no disponible', {}, 'warn');
        }
    }

    initializeAccessibilityEnhancer() {
        this.log('🔄 Inicializando AccessibilityEnhancer', {}, 'info');
        
        if (typeof AccessibilityEnhancer !== 'undefined') {
            this.accessibilityEnhancer = new AccessibilityEnhancer({
                enableKeyboardNavigation: true,
                enableAriaLabels: true,
                enableFocusManagement: true,
                announceChanges: true
            });
            this.log('✅ Mejorador de accesibilidad inicializado', {}, 'success');
        } else {
            this.log('⚠️ AccessibilityEnhancer no disponible', {}, 'warn');
        }
    }

    // ============ MODO DESARROLLO/PRODUCCIÓN ============
    setupDevMode() {
        this.log('🔄 Configurando modo desarrollo/producción', {}, 'info');
        
        this.isProductionMode = window.location.hostname.includes('vercel.app') || 
                               window.location.hostname === 'floresya.com' ||
                               window.location.hostname === 'www.floresya.com';
        if (this.isProductionMode) {
            this.hideDevMode();
            this.log('✅ Modo Producción activado', {}, 'success');
        } else {
            this.log('✅ Modo Desarrollo activado', {}, 'success');
        }
        this.updateDevModeToggle();
    }

    toggleDevMode() {
        this.log('🔄 Cambiando modo desarrollo/producción', { currentMode: this.isProductionMode ? 'producción' : 'desarrollo' }, 'info');
        
        this.isProductionMode = !this.isProductionMode;
        if (this.isProductionMode) {
            this.hideDevMode();
            this.log('✅ Cambiado a Modo Producción', {}, 'success');
        } else {
            this.showDevMode();
            this.log('✅ Cambiado a Modo Desarrollo', {}, 'success');
        }
        this.updateDevModeToggle();
    }

    hideDevMode() {
        this.log('🔄 Ocultando modo desarrollo', {}, 'info');
        
        const devMenus = document.querySelectorAll('.navbar-nav .dropdown');
        devMenus.forEach(dropdown => {
            const linkElement = dropdown.querySelector('a[role="button"]');
            if (linkElement && linkElement.innerHTML.includes('DEV MODE')) {
                dropdown.style.display = 'none';
                this.log('✅ Menú de desarrollo ocultado', {}, 'success');
            }
        });
    }

    showDevMode() {
        this.log('🔄 Mostrando modo desarrollo', {}, 'info');
        
        const devMenus = document.querySelectorAll('.navbar-nav .dropdown');
        devMenus.forEach(dropdown => {
            const linkElement = dropdown.querySelector('a[role="button"]');
            if (linkElement && linkElement.innerHTML.includes('DEV MODE')) {
                dropdown.style.display = 'block';
                this.log('✅ Menú de desarrollo mostrado', {}, 'success');
            }
        });
    }

    updateDevModeToggle() {
        this.log('🔄 Actualizando toggle de modo desarrollo', { isProductionMode: this.isProductionMode }, 'info');
        
        const toggleBtn = document.getElementById('devModeToggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = this.isProductionMode ? 
                '<i class="bi bi-code-slash"></i> Activar Dev' : 
                '<i class="bi bi-shield-check"></i> Activar Prod';
            toggleBtn.className = this.isProductionMode ? 
                'btn btn-outline-warning btn-sm' : 
                'btn btn-outline-success btn-sm';
            this.log('✅ Toggle de modo desarrollo actualizado', {}, 'success');
        } else {
            this.log('⚠️ Botón de toggle de modo desarrollo no encontrado', {}, 'warn');
        }
    }

    // ============ CARGA DE DATOS ============
    async loadInitialData() {
        this.log('🔄 Cargando datos iniciales', {}, 'info');
        
        try {
            const occasionsResponse = await api.getOccasions();
            if (occasionsResponse.success) {
                this.occasions = occasionsResponse.data;
                this.populateOccasionFilter();
                this.populateOccasionsDropdown();
                this.log('✅ Ocasiones cargadas correctamente', { count: this.occasions.length }, 'success');
            } else {
                this.log('⚠️ Respuesta no exitosa al cargar ocasiones', { response: occasionsResponse }, 'warn');
            }
        } catch (error) {
            this.log('❌ Error cargando ocasiones', { error: error.message }, 'error');
        }
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
        this.log('✅ Filtro de ocasiones poblado correctamente', { count: this.occasions.length }, 'success');
    }

    populateOccasionsDropdown() {
        this.log('🔄 Poblando dropdown de ocasiones', {}, 'info');
        
        const occasionsDropdown = document.querySelector('#occasionsDropdownToggle + .dropdown-menu');
        if (!occasionsDropdown) {
            this.log('⚠️ Dropdown de ocasiones no encontrado', {}, 'warn');
            return;
        }
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
            this.log('✅ Dropdown de ocasiones poblado correctamente', { count: this.occasions.length }, 'success');
        } else {
            this.log('⚠️ No hay ocasiones para poblar en el dropdown', {}, 'warn');
        }
    }

    // ============ EVENTOS ============
    bindEvents() {
        this.log('🔄 Vinculando eventos', {}, 'info');
        
        this.bindSearchEvents();
        this.bindFilterEvents();
        this.bindProductEvents();
        this.bindNavigationEvents();
        this.bindMenuEvents();
        this.log('✅ Eventos vinculados correctamente', {}, 'success');
    }

    bindSearchEvents() {
        this.log('🔄 Vinculando eventos de búsqueda', {}, 'info');
        
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
            this.log('✅ Eventos de búsqueda vinculados al input', {}, 'success');
        } else {
            this.log('⚠️ Input de búsqueda no encontrado', {}, 'warn');
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.handleSearch();
            });
            this.log('✅ Evento de búsqueda vinculado al botón', {}, 'success');
        } else {
            this.log('⚠️ Botón de búsqueda no encontrado', {}, 'warn');
        }
    }

    bindFilterEvents() {
        this.log('🔄 Vinculando eventos de filtros', {}, 'info');
        
        const occasionFilter = document.getElementById('occasionFilter');
        const sortFilter = document.getElementById('sortFilter');
        if (occasionFilter) {
            occasionFilter.addEventListener('change', () => {
                this.filterByOccasionId(occasionFilter.value);
            });
            this.log('✅ Evento de cambio vinculado al filtro de ocasiones', {}, 'success');
        } else {
            this.log('⚠️ Filtro de ocasiones no encontrado', {}, 'warn');
        }
        
        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                const [sort, order] = sortFilter.value.split(':');
                this.currentFilters.sort = sort;
                this.currentFilters.order = order;
                this.currentPage = 1;
                this.loadProducts();
            });
            this.log('✅ Evento de cambio vinculado al filtro de ordenamiento', {}, 'success');
        } else {
            this.log('⚠️ Filtro de ordenamiento no encontrado', {}, 'warn');
        }
    }

    bindProductEvents() {
        this.log('🔄 Vinculando eventos de productos', {}, 'info');
        
        // Delegación de eventos para tarjetas de producto
        document.addEventListener('click', (e) => {
            // Click en tarjeta (navegación a detalle)
            const productCard = e.target.closest('.product-card');
            if (productCard && !e.target.closest('.btn-add-to-cart') && !e.target.closest('.btn-floresya')) {
                e.preventDefault();
                const productId = parseInt(productCard.dataset.productId);
                if (productId) {
                    this.log('✅ Navegación a detalle de producto', { productId }, 'success');
                    window.location.href = `/pages/product-detail.html?id=${productId}`;
                } else {
                    this.log('⚠️ ID de producto no válido en tarjeta', { element: productCard }, 'warn');
                }
            }
            // Click en "¡FloresYa!" (compra rápida)
            if (e.target.classList.contains('btn-floresya') || e.target.closest('.btn-floresya')) {
                e.preventDefault();
                const btn = e.target.classList.contains('btn-floresya') ? e.target : e.target.closest('.btn-floresya');
                const productId = parseInt(btn.dataset.productId);
                if (productId) {
                    this.log('✅ Iniciando compra rápida', { productId }, 'success');
                    this.buyNow(productId, 1);
                } else {
                    this.log('⚠️ ID de producto no válido en botón FloresYa', { element: btn }, 'warn');
                }
            }
            // Click en "Al Carrito"
            if (e.target.classList.contains('btn-add-to-cart') || e.target.closest('.btn-add-to-cart')) {
                e.preventDefault();
                const btn = e.target.classList.contains('btn-add-to-cart') ? e.target : e.target.closest('.btn-add-to-cart');
                const productId = parseInt(btn.dataset.productId);
                if (productId && window.cart) {
                    this.log('✅ Agregando producto al carrito', { productId }, 'success');
                    window.cart.addItem(productId, 1);
                } else {
                    this.log('⚠️ ID de producto no válido o carrito no disponible', { productId, cartAvailable: !!window.cart }, 'warn');
                }
            }
        });
        this.log('✅ Eventos de productos vinculados correctamente', {}, 'success');
    }

    bindNavigationEvents() {
        this.log('🔄 Vinculando eventos de navegación', {}, 'info');
        
        // Click en dropdown de ocasiones
        document.addEventListener('click', (e) => {
            if (e.target.dataset.occasionId !== undefined) {
                e.preventDefault();
                this.log('✅ Filtrando por ocasión', { occasionId: e.target.dataset.occasionId }, 'success');
                this.filterByOccasionId(e.target.dataset.occasionId);
            }
        });
        
        // Click en paginación
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link') && e.target.dataset.page) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page !== this.currentPage) {
                    this.log('✅ Cambiando página', { currentPage: this.currentPage, newPage: page }, 'success');
                    this.currentPage = page;
                    this.loadProducts();
                } else {
                    this.log('ℹ️ Intento de cambiar a página actual', { page }, 'info');
                }
            }
        });
        this.log('✅ Eventos de navegación vinculados correctamente', {}, 'success');
    }

    // ============ FILTROS Y BÚSQUEDA ============
    handleSearch() {
        this.log('🔄 Manejando búsqueda', {}, 'info');
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            this.currentFilters.search = searchInput.value.trim();
            this.currentPage = 1;
            this.loadProducts();
            this.log('✅ Búsqueda aplicada', { searchTerm: this.currentFilters.search }, 'success');
        } else {
            this.log('⚠️ Input de búsqueda no encontrado', {}, 'warn');
        }
    }

    filterByOccasionId(occasionId) {
        this.log('🔄 Filtrando por ID de ocasión', { occasionId }, 'info');
        
        // Sincronizar dropdowns
        const occasionFilter = document.getElementById('occasionFilter');
        const navbarDropdownToggle = document.getElementById('occasionsDropdownToggle');
        if (occasionFilter) {
            occasionFilter.value = occasionId || '';
            this.log('✅ Filtro de ocasiones sincronizado', {}, 'success');
        } else {
            this.log('⚠️ Filtro de ocasiones no encontrado', {}, 'warn');
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
            this.log('✅ Dropdown de navegación actualizado', {}, 'success');
        } else {
            this.log('⚠️ Dropdown de navegación no encontrado', {}, 'warn');
        }
        
        // Aplicar filtro
        if (occasionId === '' || occasionId === null || occasionId === undefined) {
            delete this.currentFilters.occasionId;
            this.log('ℹ️ Filtro de ocasión eliminado', {}, 'info');
        } else {
            this.currentFilters.occasionId = occasionId;
            this.log('✅ Filtro de ocasión aplicado', { occasionId }, 'success');
        }
        delete this.currentFilters.occasion;
        this.currentPage = 1;
        this.loadProducts();
        // Scroll suave a productos
        document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
    }

    // ============ CARGA Y RENDERIZADO DE PRODUCTOS ============
    async loadProducts() {
        this.log('🔄 Cargando productos', { page: this.currentPage, filters: this.currentFilters }, 'info');
        
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
                this.products = response.data;
                this.renderProducts(response.data);
                this.renderPagination(response.pagination);
                this.log('✅ Productos cargados correctamente', { 
                    count: response.data.length, 
                    page: response.pagination.page, 
                    totalPages: response.pagination.pages 
                }, 'success');
            } else {
                this.log('⚠️ Respuesta no exitosa al cargar productos', { response }, 'warn');
            }
        } catch (error) {
            this.log('❌ Error cargando productos', { error: error.message }, 'error');
        }
    }

    renderProducts(products) {
        this.log('🔄 Renderizando productos', { count: products.length }, 'info');
        
        const container = document.getElementById('productsContainer');
        if (!container) {
            this.log('⚠️ Contenedor de productos no encontrado', {}, 'warn');
            return;
        }
        
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
            this.log('✅ Estado vacío renderizado', {}, 'success');
            return;
        }
        
        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
        this.log('✅ Productos renderizados correctamente', { count: products.length }, 'success');
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
        
        // ✨ Enhanced product card with conversion optimization
        const urgencyBadge = product.stock_quantity <= 3 && product.stock_quantity > 0 
            ? `<span class="urgency-badge position-absolute" style="top: 10px; left: 10px; z-index: 10;">
                🔥 Solo ${product.stock_quantity} left!
               </span>` 
            : '';
            
        const socialProof = Math.random() > 0.7 
            ? `<div class="position-absolute" style="bottom: 10px; left: 10px; z-index: 10;">
                <small class="badge" style="background: rgba(40, 167, 69, 0.9); color: white;">
                    <i class="bi bi-eye"></i> ${Math.floor(Math.random() * 20) + 5} viendo
                </small>
               </div>`
            : '';
            
        const cardHTML = `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card product-card-premium h-100 hover-lift" data-product-id="${product.id}">
                    <div class="product-image-container position-relative">
                        ${product.featured ? '<span class="badge-featured position-absolute top-0 start-0 m-2 badge premium-gradient text-white fw-bold z-index-10"><i class="bi bi-star-fill me-1"></i>Destacado</span>' : ''}
                        ${urgencyBadge}
                        ${socialProof}
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
                        <!-- Enhanced Trust Indicators -->
                        <div class="text-center mb-3">
                            <div class="d-flex justify-content-center align-items-center gap-2 mb-2">
                                <div class="testimonial-rating">
                                    <span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span>
                                </div>
                                <span class="fw-medium text-success">4.9</span>
                            </div>
                            <small class="text-muted d-block">
                                <i class="bi bi-shield-check text-success me-1"></i>100% garantizado
                                <span class="mx-2">•</span>
                                <i class="bi bi-truck text-success me-1"></i>Envío gratis
                            </small>
                        </div>
                        <div class="mt-auto">
                            ${product.stock_quantity > 0 ? `
                                <div class="d-grid gap-2">
                                    <button class="btn cta-primary fw-bold" data-product-id="${product.id}" onclick="floresyaApp.buyNow(${product.id})">
                                        <i class="bi bi-lightning-fill me-2"></i>¡Comprar Ahora!
                                        <small class="d-block" style="font-size: 0.75rem; opacity: 0.9;">Entrega en 24h</small>
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

    renderPagination(pagination) {
        this.log('🔄 Renderizando paginación', { currentPage: pagination.page, totalPages: pagination.pages }, 'info');
        
        const container = document.getElementById('pagination');
        if (!container) {
            this.log('⚠️ Contenedor de paginación no encontrado', {}, 'warn');
            return;
        }
        
        const { page, pages, total } = pagination;
        if (pages <= 1) {
            container.innerHTML = '';
            this.log('ℹ️ Paginación no necesaria (solo una página)', {}, 'info');
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
        this.log('✅ Paginación renderizada correctamente', { currentPage: page, totalPages: pages }, 'success');
    }

    truncateText(text, maxLength) {
        this.log('🔄 Truncando texto', { length: text.length, maxLength }, 'info');
        
        if (text.length <= maxLength) {
            this.log('ℹ️ Texto no necesita truncamiento', {}, 'info');
            return text;
        }
        
        const truncated = text.substr(0, maxLength) + '...';
        this.log('✅ Texto truncado', { originalLength: text.length, truncatedLength: truncated.length }, 'success');
        return truncated;
    }

    // ============ CARRUSEL DINÁMICO ============
    async loadDynamicCarousel() {
        this.log('🔄 Cargando carrusel dinámico', {}, 'info');
        
        await this.loadCarouselSettings();
        await this.loadCarouselImages();
        this.log('✅ Carrusel dinámico cargado completamente', {}, 'success');
    }

    async loadCarouselSettings() {
        this.log('🔄 Cargando configuración de carrusel', {}, 'info');
        
        try {
            const response = await fetch('/api/settings/homepage/all');
            const data = await response.json();
            if (data.success) {
                const settings = data.data;
                const titleElement = document.getElementById('carouselSectionTitle');
                const subtitleElement = document.getElementById('carouselSectionSubtitle');
                if (titleElement && settings.carousel_section_title) {
                    titleElement.textContent = settings.carousel_section_title;
                    this.log('✅ Título del carrusel actualizado', { title: settings.carousel_section_title }, 'success');
                }
                if (subtitleElement && settings.carousel_section_subtitle) {
                    subtitleElement.textContent = settings.carousel_section_subtitle;
                    this.log('✅ Subtítulo del carrusel actualizado', { subtitle: settings.carousel_section_subtitle }, 'success');
                }
            } else {
                this.log('⚠️ Respuesta no exitosa al cargar configuración de carrusel', { response: data }, 'warn');
            }
        } catch (error) {
            this.log('❌ Error cargando configuración de carrusel', { error: error.message }, 'error');
        }
    }

    async loadCarouselImages() {
        this.log('🔄 Cargando imágenes de carrusel', {}, 'info');
        
        try {
            const response = await fetch('/api/carousel');
            const data = await response.json();
            if (data.success && data.data.images.length > 0) {
                this.renderCarouselImages(data.data.images);
                this.log('✅ Imágenes de carrusel cargadas y renderizadas', { count: data.data.images.length }, 'success');
            } else {
                this.renderFallbackCarousel();
                this.log('⚠️ No se encontraron imágenes de carrusel, usando fallback', {}, 'warn');
            }
        } catch (error) {
            this.log('❌ Error cargando imágenes de carrusel', { error: error.message }, 'error');
            this.renderFallbackCarousel();
        }
    }

    renderCarouselImages(images) {
        this.log('🔄 Renderizando imágenes de carrusel', { count: images.length }, 'info');
        
        const carousel = document.getElementById('dynamicCarousel');
        if (!carousel) {
            this.log('⚠️ Elemento de carrusel no encontrado', {}, 'warn');
            return;
        }
        
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
                this.log('✅ Navegación desde carrusel', { url: item.dataset.linkUrl }, 'success');
                window.location.href = item.dataset.linkUrl;
            }
        });
        
        this.log('✅ Carrusel de imágenes renderizado e inicializado', {}, 'success');
    }

    renderFallbackCarousel() {
        this.log('🔄 Renderizando carrusel de fallback', {}, 'info');
        
        const carousel = document.getElementById('dynamicCarousel');
        if (!carousel) {
            this.log('⚠️ Elemento de carrusel no encontrado', {}, 'warn');
            return;
        }
        
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
        this.log('✅ Carrusel de fallback renderizado', { count: fallbackItems.length }, 'success');
    }

    // ============ MENÚ Y FORMULARIOS ============
    bindMenuEvents() {
        this.log('🔄 Vinculando eventos de menú', {}, 'info');
        
        // Inicializar dropdowns de Bootstrap
        const dropdownElements = document.querySelectorAll('[data-bs-toggle="dropdown"]');
        dropdownElements.forEach(element => {
            if (!bootstrap.Dropdown.getInstance(element)) {
                new bootstrap.Dropdown(element);
                this.log('✅ Dropdown inicializado', { element }, 'success');
            } else {
                this.log('ℹ️ Dropdown ya inicializado', { element }, 'info');
            }
        });
        
        // Footer links
        document.addEventListener('click', (e) => {
            if (e.target.dataset && e.target.dataset.occasion) {
                e.preventDefault();
                this.log('✅ Filtrando por ocasión desde footer', { occasion: e.target.dataset.occasion }, 'success');
                this.filterByOccasion(e.target.dataset.occasion);
            }
        });
        
        // Formulario Flores Ya Novias
        this.bindFloresNoviasForm();
        this.log('✅ Eventos de menú vinculados correctamente', {}, 'success');
    }

    bindFloresNoviasForm() {
        this.log('🔄 Vinculando eventos de formulario Flores Ya Novias', {}, 'info');
        
        const form = document.getElementById('noviasContactForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!form.checkValidity()) {
                    e.stopPropagation();
                    form.classList.add('was-validated');
                    this.log('⚠️ Formulario de Flores Ya Novias inválido', {}, 'warn');
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
                    
                    this.log('✅ Formulario de Flores Ya Novias enviado correctamente', { formData }, 'success');
                } catch (error) {
                    api.showNotification('Ha ocurrido un error. Por favor intenta nuevamente.', 'danger');
                    const submitBtn = form.querySelector('button[type="submit"]');
                    submitBtn.innerHTML = '<i class="bi bi-send me-2"></i>Solicitar Consulta Gratuita';
                    submitBtn.disabled = false;
                    this.log('❌ Error enviando formulario de Flores Ya Novias', { error: error.message }, 'error');
                }
            });
            this.log('✅ Evento de submit vinculado al formulario Flores Ya Novias', {}, 'success');
        } else {
            this.log('⚠️ Formulario de Flores Ya Novias no encontrado', {}, 'warn');
        }
    }

    // ============ COMPRA RÁPIDA ============
    async buyNow(productId, quantity = 1) {
        this.log('🔄 Iniciando compra rápida', { productId, quantity }, 'info');
        
        // ✨ Track conversion funnel step
        this.trackConversionStep('buy_now_clicked', { productId, quantity });
        
        try {
            const button = document.querySelector(`[onclick*="buyNow(${productId})"]`);
            if (button) {
                button.disabled = true;
                button.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';
                this.log('✅ Botón de compra rápida deshabilitado', {}, 'success');
            }
            
            const productResponse = await api.getProductById(productId);
            if (!productResponse.success) {
                api.showNotification('Error al obtener información del producto', 'danger');
                this.log('❌ Error obteniendo información del producto', { productId, response: productResponse }, 'error');
                return;
            }
            
            const product = productResponse.data;
            if (product.stock_quantity < quantity) {
                api.showNotification('Stock insuficiente', 'warning');
                this.log('⚠️ Stock insuficiente para compra rápida', { productId, requested: quantity, available: product.stock_quantity }, 'warn');
                return;
            }
            
            const user = api.getUser();
            if (!user) {
                this.log('ℹ️ Usuario no autenticado, mostrando modal de compra rápida', { productId, quantity }, 'info');
                this.showQuickPurchaseModal(product, quantity);
                return;
            }
            
            const addResponse = await cart.addItem(productId, quantity);
            if (addResponse.success) {
                this.log('✅ Producto agregado al carrito para compra rápida', { productId, quantity }, 'success');
                this.showFloresYaAnimation();
                setTimeout(() => {
                    window.location.href = '/pages/payment.html?floresya=true';
                }, 1500);
            } else {
                this.log('⚠️ Error al agregar producto al carrito', { productId, quantity, response: addResponse }, 'warn');
            }
        } catch (error) {
            this.log('❌ Error en buyNow', { error: error.message, productId, quantity }, 'error');
            api.showNotification('Error al procesar la compra', 'danger');
        } finally {
            const button = document.querySelector(`[onclick*="buyNow(${productId})"]`);
            if (button) {
                button.disabled = false;
                button.innerHTML = '<i class="bi bi-lightning-fill"></i> ¡FloresYa!';
                this.log('✅ Botón de compra rápida reactivado', {}, 'success');
            }
        }
    }

    showQuickPurchaseModal(product, quantity) {
        this.log('🔄 Mostrando modal de compra rápida', { productId: product.id, quantity }, 'info');
        
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
        if (existingModal) {
            existingModal.remove();
            this.log('✅ Modal de compra rápida existente removido', {}, 'success');
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('quickPurchaseModal'));
        modal.show();
        this.log('✅ Modal de compra rápida mostrado', {}, 'success');
    }

    async processQuickPurchase(productId, quantity) {
        this.log('🔄 Procesando compra rápida', { productId, quantity }, 'info');
        
        try {
            const form = document.getElementById('quickPurchaseForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                this.log('⚠️ Formulario de compra rápida inválido', {}, 'warn');
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
            this.log('✅ Datos de invitado guardados y producto agregado al carrito', { guestData, productId, quantity }, 'success');
            
            this.showFloresYaAnimation();
            const modal = bootstrap.Modal.getInstance(document.getElementById('quickPurchaseModal'));
            modal.hide();
            
            setTimeout(() => {
                window.location.href = '/pages/payment.html?floresya=true&guest=true';
            }, 1500);
        } catch (error) {
            this.log('❌ Error procesando compra rápida', { error: error.message, productId, quantity }, 'error');
            api.showNotification('Error al procesar la compra', 'danger');
        }
    }

    showFloresYaAnimation() {
        this.log('🔄 Mostrando animación FloresYa', {}, 'info');
        
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
        this.log('✅ Animación FloresYa agregada al DOM', {}, 'success');
        
        setTimeout(() => {
            const animation = document.getElementById('floresya-animation');
            if (animation) {
                animation.remove();
                this.log('✅ Animación FloresYa removida', {}, 'success');
            }
        }, 1500);
    }

    // ✨ CONVERSION TRACKING METHODS ✨
    trackConversionStep(step, data = {}) {
        this.log(`📈 Conversion step: ${step}`, data, 'info');
        
        // Send to analytics (placeholder)
        if (window.gtag) {
            window.gtag('event', step, {
                event_category: 'conversion_funnel',
                ...data
            });
        }
    }
    
    // Enhanced method to show success animations
    showSuccessAnimation(message = '¡Éxito!') {
        const animation = document.createElement('div');
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999;
            text-align: center;
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(255, 105, 180, 0.3);
        `;
        
        animation.innerHTML = `
            <div class="success-checkmark"></div>
            <h4 class="fw-bold text-success mt-3">${message}</h4>
        `;
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.style.opacity = '0';
            animation.style.transform = 'translate(-50%, -50%) scale(0.8)';
            animation.style.transition = 'all 0.3s ease';
            setTimeout(() => animation.remove(), 300);
        }, 2000);
    }
    
    clearAllFilters() {
        this.log('🔄 Limpiando todos los filtros', {}, 'info');
        
        this.currentFilters = {};
        this.currentPage = 1;
        const occasionFilter = document.getElementById('occasionFilter');
        const sortFilter = document.getElementById('sortFilter');
        const searchInput = document.getElementById('searchInput');
        
        if (occasionFilter) {
            occasionFilter.value = '';
            this.log('✅ Filtro de ocasión limpiado', {}, 'success');
        }
        
        if (sortFilter) {
            sortFilter.value = 'created_at:DESC';
            this.log('✅ Filtro de ordenamiento limpiado', {}, 'success');
        }
        
        if (searchInput) {
            searchInput.value = '';
            this.log('✅ Búsqueda limpiada', {}, 'success');
        }
        
        this.updateNavbarDropdownText('');
        this.loadProducts();
    }

    updateNavbarDropdownText(occasionId) {
        this.log('🔄 Actualizando texto del dropdown de navegación', { occasionId }, 'info');
        
        const navbarDropdownToggle = document.getElementById('occasionsDropdownToggle');
        if (!navbarDropdownToggle) {
            this.log('⚠️ Dropdown de navegación no encontrado', {}, 'warn');
            return;
        }
        
        if (!occasionId || occasionId === '') {
            navbarDropdownToggle.textContent = 'Ocasiones';
            this.log('✅ Texto del dropdown actualizado a "Ocasiones"', {}, 'success');
            return;
        }
        
        const selectedOccasion = this.occasions.find(occ => occ.id == occasionId);
        if (selectedOccasion) {
            navbarDropdownToggle.innerHTML = `<i class="${selectedOccasion.icon || 'bi bi-calendar-event'} me-2"></i>${selectedOccasion.name}`;
            this.log('✅ Texto del dropdown actualizado con ocasión seleccionada', { occasion: selectedOccasion.name }, 'success');
        } else {
            navbarDropdownToggle.textContent = 'Ocasiones';
            this.log('⚠️ Ocasión no encontrada, texto del dropdown actualizado a "Ocasiones"', {}, 'warn');
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

// ✨ ADVANCED PAGE OPTIMIZATION ✨

// Smart preloader with conversion psychology
function showSmartPreloader() {
    const preloader = document.createElement('div');
    preloader.id = 'smart-preloader';
    preloader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #FF69B4, #FF1493);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: white;
    `;
    
    preloader.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 80px; height: 80px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
            <h3 style="margin-bottom: 10px;">🌹 FloresYa</h3>
            <p style="opacity: 0.9;">Preparando las mejores flores para ti...</p>
            <div style="margin-top: 20px; font-size: 0.9rem; opacity: 0.8;">
                <p>✨ Flores frescas garantizadas</p>
                <p>🚚 Entrega en 24 horas</p>
                <p>💰 100% seguro</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(preloader);
    return preloader;
}

// Inicializar app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌸 FloresYa: DOM loaded, waiting for stylesheets...');
    
    const preloader = showSmartPreloader();
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
        
        // Hide preloader with style
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.transform = 'scale(0.8)';
            preloader.style.transition = 'all 0.5s ease';
            setTimeout(() => preloader.remove(), 500);
        }, 1000);
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