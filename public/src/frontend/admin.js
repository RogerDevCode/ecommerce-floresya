import { FloresYaAPI } from './services/api.js';
export class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.hoverIntervals = new Map();
        this.api = new FloresYaAPI();
    }
    async init() {
        try {
            this.log('Starting admin panel initialization', 'info');
            await new Promise(resolve => setTimeout(resolve, 100));
            const essentialElements = [
                'loadingOverlay',
                'adminSidebar',
                'dashboard-section'
            ];
            for (const elementId of essentialElements) {
                const element = document.getElementById(elementId);
                if (!element) {
                    throw new Error(`Required DOM element '${elementId}' not found`);
                }
            }
            this.log('All essential DOM elements found', 'info');
            this.showLoading();
            const isAuthenticated = await this.checkAuthentication();
            this.log(`Authentication check result: ${isAuthenticated}`, 'info');
            if (!isAuthenticated) {
                this.log('User not authenticated, redirecting to login', 'warn');
                this.hideLoading();
                this.redirectToLogin();
                return;
            }
            const hasAdminRole = await this.checkAdminRole();
            this.log(`Admin role check result: ${hasAdminRole}`, 'info');
            if (!hasAdminRole) {
                this.log('User does not have admin role, showing access denied', 'warn');
                this.hideLoading();
                this.showAccessDenied();
                return;
            }
            this.bindEvents();
            this.bindProductButtons();
            const sidebar = document.getElementById('adminSidebar');
            if (sidebar) {
                this.log(`🔍 SIDEBAR BEFORE forcing visibility - display: ${sidebar.style.display}, computed: ${window.getComputedStyle(sidebar).display}, classes: ${sidebar.className}`, 'warn');
                sidebar.style.display = 'block !important';
                sidebar.style.visibility = 'visible !important';
                sidebar.style.opacity = '1 !important';
                sidebar.style.position = 'relative !important';
                sidebar.style.width = 'auto !important';
                sidebar.style.minHeight = '100vh !important';
                sidebar.classList.remove('d-none', 'd-md-none', 'd-lg-none');
                sidebar.classList.add('d-block', 'emergency-visible');
                this.log(`✅ SIDEBAR FORCED VISIBLE - display: ${sidebar.style.display}, computed: ${window.getComputedStyle(sidebar).display}`, 'success');
            }
            else {
                this.log('❌ CRITICAL: adminSidebar element not found!', 'error');
            }
            const dashboardSection = document.getElementById('dashboard-section');
            if (dashboardSection) {
                dashboardSection.style.display = 'block !important';
                dashboardSection.style.visibility = 'visible';
                dashboardSection.style.opacity = '1';
                dashboardSection.classList.add('active');
                this.log('Dashboard section forced visible with !important', 'info');
            }
            await this.loadDashboardData();
            setTimeout(() => {
                const dashboardCheck = document.getElementById('dashboard-section');
                if (dashboardCheck) {
                    dashboardCheck.style.display = 'block';
                    dashboardCheck.classList.add('active');
                    this.log('Dashboard visibility double-checked after data load', 'info');
                }
                const sidebarCheck = document.getElementById('adminSidebar');
                if (sidebarCheck) {
                    const computedStyle = window.getComputedStyle(sidebarCheck);
                    this.log(`🔍 SIDEBAR FINAL CHECK - display: ${sidebarCheck.style.display}, computed: ${computedStyle.display}, visibility: ${computedStyle.visibility}, classes: ${sidebarCheck.className}`, 'warn');
                    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
                        sidebarCheck.style.display = 'block !important';
                        sidebarCheck.style.visibility = 'visible !important';
                        this.log('🚨 SIDEBAR WAS HIDDEN - FORCED VISIBLE AGAIN', 'error');
                    }
                    else {
                        this.log('✅ SIDEBAR REMAINS VISIBLE after final check', 'success');
                    }
                }
                else {
                    this.log('❌ SIDEBAR ELEMENT LOST after initialization!', 'error');
                }
            }, 100);
            const finalState = {
                loadingOverlayVisible: document.getElementById('loadingOverlay')?.style.display !== 'none',
                mainContentVisible: document.getElementById('main-content')?.style.display !== 'none',
                dashboardVisible: document.getElementById('dashboard-section')?.style.display !== 'none',
                adminPanelExists: !!window.adminPanel
            };
            this.log('🔍 CRITICAL: Final state before hideLoading() ' + JSON.stringify(finalState), 'warn');
            this.hideLoading();
            const postHideState = {
                loadingOverlayVisible: document.getElementById('loadingOverlay')?.style.display !== 'none',
                mainContentVisible: document.getElementById('main-content')?.style.display !== 'none',
                dashboardVisible: document.getElementById('dashboard-section')?.style.display !== 'none'
            };
            this.log('🔍 CRITICAL: State after hideLoading() ' + JSON.stringify(postHideState), 'warn');
            this.log('Admin panel initialized successfully', 'success');
        }
        catch (error) {
            this.hideLoading();
            this.log('Failed to initialize admin panel: ' + error, 'error');
            this.showError('Error al inicializar el panel de administración');
        }
    }
    async checkAuthentication() {
        try {
            this.log('🔍 Verificando autenticación...', 'info');
            const userData = localStorage.getItem('floresya_user');
            const sessionTime = localStorage.getItem('floresya_session');
            this.log(`📊 Datos encontrados - Usuario: ${!!userData}, Sesión: ${!!sessionTime}`, 'info');
            if (!userData || !sessionTime) {
                this.log('❌ Datos de sesión faltantes', 'warn');
                return false;
            }
            const sessionAge = Date.now() - parseInt(sessionTime ?? '0');
            const maxAge = 24 * 60 * 60 * 1000;
            if (sessionAge > maxAge) {
                this.log('⏰ Sesión expirada, limpiando datos', 'warn');
                localStorage.removeItem('floresya_user');
                localStorage.removeItem('floresya_session');
                return false;
            }
            const user = JSON.parse(userData);
            this.currentUser = user;
            this.log(`✅ Usuario autenticado: ${user.email} (Rol: ${user.role})`, 'success');
            return true;
        }
        catch (error) {
            this.log('❌ Error verificando autenticación: ' + error, 'error');
            console.error('Authentication check failed:', error);
            return false;
        }
    }
    async checkAdminRole() {
        try {
            if (!this.currentUser) {
                this.log('❌ No hay usuario actual para verificar rol', 'error');
                return false;
            }
            const isAdmin = this.currentUser.role === 'admin';
            this.log(`🔍 Verificando rol de admin - Usuario: ${this.currentUser.email}, Rol: ${this.currentUser.role}, Es Admin: ${isAdmin}`, 'info');
            if (!isAdmin) {
                this.log('🚫 Usuario no tiene rol de administrador', 'warn');
            }
            else {
                this.log('✅ Usuario tiene rol de administrador', 'success');
            }
            return isAdmin;
        }
        catch (error) {
            this.log('❌ Error verificando rol de admin: ' + error, 'error');
            console.error('Admin role check failed:', error);
            return false;
        }
    }
    bindEvents() {
        const adminContainer = document.getElementById('adminPanel');
        if (!adminContainer) {
            this.log('❌ Admin container not found for event delegation - RETRYING in 500ms', 'error');
            setTimeout(() => {
                this.bindEvents();
            }, 500);
            return;
        }
        const newContainer = adminContainer.cloneNode(true);
        adminContainer.parentNode?.replaceChild(newContainer, adminContainer);
        newContainer.addEventListener('click', (e) => {
            const target = e.target;
            if (target.matches('.sidebar-nav .nav-link') || target.closest('.sidebar-nav .nav-link')) {
                e.preventDefault();
                const link = target.closest('.sidebar-nav .nav-link');
                const section = link?.dataset.section ?? '';
                if (section) {
                    this.switchSection(section);
                }
            }
            if (target.matches('#sidebarToggle') || target.closest('#sidebarToggle')) {
                const sidebar = document.getElementById('adminSidebar');
                sidebar?.classList.toggle('show');
            }
            if (target.matches('#logoutBtn') || target.closest('#logoutBtn')) {
                this.logout();
            }
            if (target.matches('#backToSite') || target.closest('#backToSite')) {
                window.location.href = '/';
            }
            if (target.matches('#addProductBtn') || target.closest('#addProductBtn')) {
                e.preventDefault();
                this.log('🖱️ addProductBtn clicked via delegation, calling showAddProductModal', 'info');
                try {
                    void this.showAddProductModal();
                }
                catch (error) {
                    this.log('❌ Error in showAddProductModal: ' + error, 'error');
                    console.error('Error calling showAddProductModal:', error);
                }
            }
            if (target.matches('#addUserBtn') || target.closest('#addUserBtn')) {
                e.preventDefault();
                e.stopPropagation();
                this.log('🖱️ addUserBtn clicked via delegation, calling showAddUserModal', 'info');
                try {
                    void this.showAddUserModal();
                }
                catch (error) {
                    this.log('❌ Error in showAddUserModal: ' + error, 'error');
                    console.error('Error calling showAddUserModal:', error);
                    const userModal = document.getElementById('userModal');
                    if (userModal && window.bootstrap?.Modal) {
                        try {
                            const Modal = window.bootstrap.Modal;
                            const modal = new Modal(userModal);
                            modal.show();
                            this.log('✅ Fallback: Modal shown directly', 'info');
                        }
                        catch (fallbackError) {
                            this.log('❌ Fallback modal failed: ' + fallbackError, 'error');
                        }
                    }
                }
            }
            if (target.matches('#addOccasionBtn') || target.closest('#addOccasionBtn')) {
                this.showAddOccasionModal();
            }
            if (target.matches('#manageProductImagesBtn') || target.closest('#manageProductImagesBtn')) {
                e.preventDefault();
                this.log('🖱️ manageProductImagesBtn clicked via delegation, calling showProductImagesModal', 'info');
                try {
                    void this.showProductImagesModal();
                }
                catch (error) {
                    this.log('❌ Error in showProductImagesModal: ' + error, 'error');
                    console.error('Error calling showProductImagesModal:', error);
                }
            }
            if (target.matches('#loadSchemaInfo') || target.closest('#loadSchemaInfo')) {
                void this.loadSchemaInfo();
            }
            if (target.matches('#viewSchemaSQL') || target.closest('#viewSchemaSQL')) {
                void this.viewSchemaSQL();
            }
            if (target.matches('#updateSchemaFile') || target.closest('#updateSchemaFile')) {
                void this.updateSchemaFile();
            }
            if (target.matches('#downloadSchemaSQL') || target.closest('#downloadSchemaSQL')) {
                void this.downloadSchemaSQL();
            }
            if (target.matches('#copySchemaSQLBtn') || target.closest('#copySchemaSQLBtn')) {
                void this.copySchemaSQLToClipboard();
            }
        });
        this.log('✅ Event delegation bound to admin container', 'success');
    }
    bindProductButtons() {
        this.log('🔧 Product management buttons bound via event delegation', 'info');
    }
    bindUserButtons() {
        this.log('🔧 Binding user management buttons with dual approach', 'info');
        const adminContainer = document.getElementById('adminPanel');
        if (!adminContainer) {
            this.log('❌ Admin container not found for user button binding', 'error');
            return;
        }
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            this.log('✅ addUserBtn found, setting up direct event listener', 'info');
            const newBtn = addUserBtn.cloneNode(true);
            addUserBtn.parentNode?.replaceChild(newBtn, addUserBtn);
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.log('🖱️ addUserBtn clicked via direct binding, calling showAddUserModal', 'info');
                try {
                    void this.showAddUserModal();
                }
                catch (error) {
                    this.log('❌ Error in showAddUserModal: ' + error, 'error');
                    console.error('Error calling showAddUserModal:', error);
                }
            });
            this.log('✅ Direct event listener attached to addUserBtn', 'success');
        }
        else {
            this.log('❌ addUserBtn not found in DOM', 'error');
        }
        const userModal = document.getElementById('userModal');
        if (!userModal) {
            this.log('❌ userModal not found in DOM', 'error');
        }
        else {
            this.log('✅ userModal found and ready', 'info');
        }
    }
    switchSection(section) {
        if (this.currentSection === section) {
            this.log(`Already on section: ${section}`, 'info');
            return;
        }
        this.log(`Switching to section: ${section}`, 'info');
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        document.querySelectorAll('.admin-section').forEach(sec => {
            const sectionElement = sec;
            const sectionId = sectionElement.id;
            if (sectionId === `${section}-section`) {
                sectionElement.style.display = 'block';
                sectionElement.style.visibility = 'visible';
                sectionElement.style.opacity = '1';
                sectionElement.classList.add('active');
                this.log(`Section ${section} made visible`, 'info');
            }
            else {
                sectionElement.style.display = 'none';
                sectionElement.classList.remove('active');
            }
        });
        this.updatePageTitle(section);
        void this.loadSectionData(section);
        this.currentSection = section;
    }
    updatePageTitle(section) {
        const titles = {
            dashboard: { title: 'Dashboard', subtitle: 'Vista general del sistema' },
            products: { title: 'Productos', subtitle: 'Gestión de catálogo de productos' },
            orders: { title: 'Pedidos', subtitle: 'Administración de órdenes de compra' },
            users: { title: 'Usuarios', subtitle: 'Gestión de usuarios y roles' },
            occasions: { title: 'Ocasiones', subtitle: 'Configuración de ocasiones especiales' },
            settings: { title: 'Configuración', subtitle: 'Parámetros del sistema' },
            logs: { title: 'Logs', subtitle: 'Registro de actividad del sistema' }
        };
        const titleData = titles[section] ?? titles.dashboard;
        const titleElement = document.getElementById('pageTitle');
        const subtitleElement = document.getElementById('pageSubtitle');
        if (titleElement && titleData)
            titleElement.textContent = titleData.title;
        if (subtitleElement && titleData)
            subtitleElement.textContent = titleData.subtitle;
    }
    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'products':
                await this.loadProductsData();
                break;
            case 'orders':
                await this.loadOrdersData();
                break;
            case 'users':
                await this.loadUsersData();
                setTimeout(() => this.bindUserButtons(), 100);
                break;
            case 'occasions':
                await this.loadOccasionsData();
                break;
            case 'images':
                await this.loadImagesData();
                break;
        }
    }
    async loadDashboardData() {
        try {
            const mockMetrics = {
                totalProducts: 25,
                totalOrders: 12,
                totalUsers: 8,
                totalRevenue: 1250.50
            };
            const mockAlerts = [
                { type: 'warning', message: 'Producto "Rosa Roja" tiene stock bajo (3 unidades)' },
                { type: 'info', message: 'Nuevo pedido recibido de María González' }
            ];
            const mockActivity = [
                { icon: 'cart-plus', description: 'Nuevo pedido #1234', time: '2 min' },
                { icon: 'user-plus', description: 'Usuario registrado: Juan Pérez', time: '15 min' },
                { icon: 'box', description: 'Producto actualizado: Tulipanes', time: '1 hora' }
            ];
            this.updateMetrics(mockMetrics);
            this.updateAlerts(mockAlerts);
            this.updateRecentActivity(mockActivity);
        }
        catch (error) {
            this.log('Error loading dashboard data: ' + error, 'error');
        }
    }
    async loadProductsData() {
        try {
            this.log('Loading products from API...', 'info');
            const response = await this.api.getProducts({
                page: 1,
                limit: 20,
                sort_by: 'created_at',
                sort_direction: 'desc'
            });
            if (response.success && response.data) {
                this.log(`Loaded ${response.data.products.length} products from API`, 'success');
                this.renderProductsTable(response.data.products);
                this.bindProductButtons();
            }
            else {
                this.log('Failed to load products from API', 'error');
                this.renderProductsTable([]);
                this.bindProductButtons();
            }
        }
        catch (error) {
            this.log('Error loading products: ' + error, 'error');
            this.renderProductsTable([]);
        }
    }
    async loadOrdersData() {
        try {
            const mockOrders = [
                { id: 1234, customer_name: 'María González', total_amount_usd: 45.99, status: 'pending', created_at: '2024-01-15' },
                { id: 1235, customer_name: 'Juan Pérez', total_amount_usd: 78.50, status: 'confirmed', created_at: '2024-01-14' }
            ];
            this.renderOrdersTable(mockOrders);
        }
        catch (error) {
            this.log('Error loading orders: ' + error, 'error');
        }
    }
    async loadUsersData() {
        try {
            const mockUsers = [
                { id: 1, email: 'admin@floresya.com', full_name: 'Administrador', role: 'admin', is_active: true },
                { id: 2, email: 'cliente@floresya.com', full_name: 'Cliente de Prueba', role: 'user', is_active: true }
            ];
            this.renderUsersTable(mockUsers);
            this.bindUserButtons();
        }
        catch (error) {
            this.log('Error loading users: ' + error, 'error');
        }
    }
    async loadOccasionsData() {
        try {
            const mockOccasions = [
                { id: 1, name: 'Cumpleaños', type: 'birthday', display_order: 1, is_active: true },
                { id: 2, name: 'Aniversario', type: 'anniversary', display_order: 2, is_active: true },
                { id: 3, name: 'Boda', type: 'wedding', display_order: 3, is_active: true }
            ];
            this.renderOccasionsTable(mockOccasions);
        }
        catch (error) {
            this.log('Error loading occasions: ' + error, 'error');
        }
    }
    async loadImagesData() {
        try {
            this.log('Loading images data...', 'info');
            await this.loadCurrentSiteImages();
            await this.loadProductsWithImageCounts('image_count', 'asc');
            this.bindImageEvents();
            this.log('Images data loaded successfully', 'success');
        }
        catch (error) {
            this.log('Error loading images data: ' + error, 'error');
        }
    }
    async loadCurrentSiteImages() {
        try {
            const response = await this.api.getCurrentSiteImages();
            if (response.success && response.data) {
                const heroPreview = document.getElementById('heroImagePreview');
                if (heroPreview) {
                    const img = heroPreview.querySelector('img');
                    if (img)
                        img.src = response.data.hero;
                }
                const logoPreview = document.getElementById('logoPreview');
                if (logoPreview) {
                    const img = logoPreview.querySelector('img');
                    if (img)
                        img.src = response.data.logo;
                }
                this.log('Current site images loaded', 'success');
            }
        }
        catch (error) {
            this.log('Error loading current site images: ' + error, 'error');
        }
    }
    async loadImagesGallery(filter = 'all') {
        try {
            const response = await this.api.getImagesGallery({ filter, page: 1, limit: 20 });
            if (response.success && response.data) {
                this.renderImagesGallery(response.data.images);
                this.log(`Loaded ${response.data.images.length} images for gallery`, 'success');
            }
            else {
                this.renderImagesGallery([]);
                this.log('Failed to load images gallery', 'error');
            }
        }
        catch (error) {
            this.log('Error loading images gallery: ' + error, 'error');
            this.renderImagesGallery([]);
        }
    }
    async loadProductsWithImageCounts(sortBy = 'image_count', sortDirection = 'asc') {
        try {
            this.log('Loading products with image counts...', 'info');
            const response = await this.api.getProductsWithImageCounts({ sort_by: sortBy, sort_direction: sortDirection });
            if (response.success && response.data) {
                this.renderProductsWithImageCounts(response.data.products);
                this.log(`Loaded ${response.data.products.length} products with image counts`, 'success');
            }
            else {
                this.renderProductsWithImageCounts([]);
                this.log('Failed to load products with image counts', 'error');
            }
        }
        catch (error) {
            this.log('Error loading products with image counts: ' + error, 'error');
            this.renderProductsWithImageCounts([]);
        }
    }
    bindImageEvents() {
        const changeHeroBtn = document.getElementById('changeHeroImageBtn');
        if (changeHeroBtn) {
            changeHeroBtn.addEventListener('click', () => {
                void this.showSiteImageUploadModal('hero');
            });
        }
        const changeLogoBtn = document.getElementById('changeLogoBtn');
        if (changeLogoBtn) {
            changeLogoBtn.addEventListener('click', () => {
                void this.showSiteImageUploadModal('logo');
            });
        }
        const filterAllBtn = document.getElementById('filterAllImages');
        const filterUnusedBtn = document.getElementById('filterUnusedImages');
        const filterProductBtn = document.getElementById('filterProductImages');
        if (filterAllBtn) {
            filterAllBtn.addEventListener('click', () => {
                void this.updateGalleryFilter('all');
            });
        }
        if (filterUnusedBtn) {
            filterUnusedBtn.addEventListener('click', () => {
                void this.updateGalleryFilter('unused');
            });
        }
        if (filterProductBtn) {
            filterProductBtn.addEventListener('click', () => {
                void this.updateGalleryFilter('used');
            });
        }
        const sortImagesSelect = document.getElementById('sortImagesSelect');
        if (sortImagesSelect) {
            sortImagesSelect.addEventListener('change', () => {
                void this.handleProductsSort();
            });
        }
    }
    async updateGalleryFilter(filter) {
        const buttons = ['filterAllImages', 'filterUnusedImages', 'filterProductImages'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.classList.remove('active');
            }
        });
        const activeBtnId = filter === 'all' ? 'filterAllImages' :
            filter === 'unused' ? 'filterUnusedImages' : 'filterProductImages';
        const activeBtn = document.getElementById(activeBtnId);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        await this.loadImagesGallery(filter);
    }
    showSiteImageUploadModal(type) {
        const title = type === 'hero' ? 'Cambiar Imagen Hero' : 'Cambiar Logo';
        const description = type === 'hero'
            ? 'La imagen hero se muestra en la parte superior de la página principal'
            : 'El logo se muestra en la barra de navegación y otros lugares del sitio';
        const modalHtml = `
      <div class="modal fade" id="siteImageModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p class="text-muted mb-3">${description}</p>

              <div class="mb-3">
                <label for="siteImageFile" class="form-label">Seleccionar nueva imagen</label>
                <input type="file" class="form-control" id="siteImageFile" accept="image/*" required>
                <div class="form-text">Formatos soportados: JPEG, PNG, WebP. Tamaño máximo: 5MB</div>
              </div>

              <div id="siteImagePreview" class="text-center mb-3" style="display: none;">
                <img id="previewImg" class="img-fluid rounded" style="max-height: 200px;">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" id="uploadSiteImageBtn">Subir Imagen</button>
            </div>
          </div>
        </div>
      </div>
    `;
        const existing = document.getElementById('siteImageModal');
        if (existing)
            existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalElement = document.getElementById('siteImageModal');
        const bootstrap = window.bootstrap;
        if (modalElement && bootstrap?.Modal) {
            const Modal = bootstrap.Modal;
            const modal = new Modal(modalElement);
            modal.show();
            const fileInput = document.getElementById('siteImageFile');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        this.previewSiteImage(file);
                    }
                });
            }
            const uploadBtn = document.getElementById('uploadSiteImageBtn');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', () => {
                    this.uploadSiteImage(type, modal);
                });
            }
        }
    }
    previewSiteImage(file) {
        const previewContainer = document.getElementById('siteImagePreview');
        const previewImg = document.getElementById('previewImg');
        if (previewContainer && previewImg) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (previewImg && e.target?.result) {
                    previewImg.src = e.target.result;
                    previewContainer.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    }
    async uploadSiteImage(type, modal) {
        try {
            const fileInput = document.getElementById('siteImageFile');
            const file = fileInput.files?.[0];
            if (!file) {
                alert('Por favor selecciona una imagen');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen debe ser menor a 5MB');
                return;
            }
            if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
                alert('Solo se permiten imágenes JPEG, PNG o WebP');
                return;
            }
            const uploadBtn = document.getElementById('uploadSiteImageBtn');
            if (uploadBtn) {
                uploadBtn.disabled = true;
                uploadBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Subiendo...';
            }
            const formData = new FormData();
            formData.append('image', file);
            formData.append('type', type);
            const response = await this.api.uploadSiteImage(formData);
            if (response.success) {
                alert(`Imagen ${type} actualizada exitosamente`);
                modal.hide();
                await this.loadCurrentSiteImages();
            }
            else {
                alert('Error al subir la imagen: ' + (response.message || 'Error desconocido'));
            }
        }
        catch (error) {
            console.error('Error uploading site image:', error);
            alert('Error al subir la imagen');
        }
        finally {
            const uploadBtn = document.getElementById('uploadSiteImageBtn');
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = 'Subir Imagen';
            }
        }
    }
    renderImagesGallery(images) {
        const galleryContainer = document.getElementById('imagesGallery');
        if (!galleryContainer)
            return;
        if (images.length === 0) {
            galleryContainer.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-images display-1 text-muted mb-3"></i>
          <h5 class="text-muted">No hay imágenes</h5>
          <p class="text-muted">Las imágenes de productos aparecerán aquí</p>
        </div>
      `;
            return;
        }
        const imagesHtml = images.map(image => `
      <div class="col-md-3 col-sm-6 mb-4">
        <div class="card h-100">
          <div class="position-relative">
            <img src="${image.url}" class="card-img-top" alt="Product image" style="height: 150px; object-fit: cover;">
            ${image.is_primary ? '<span class="badge bg-success position-absolute top-0 end-0 m-2">Principal</span>' : ''}
            <span class="badge bg-secondary position-absolute bottom-0 start-0 m-2">${image.size}</span>
          </div>
          <div class="card-body p-2">
            <small class="text-muted d-block">
              ${image.product_name ? `Producto: ${image.product_name}` : 'Sin asignar'}
            </small>
            <small class="text-muted d-block">
              ${new Date(image.created_at).toLocaleDateString()}
            </small>
          </div>
          <div class="card-footer p-2">
            <div class="btn-group btn-group-sm w-100">
              <button class="btn btn-outline-primary btn-sm" onclick="window.open('${image.url}', '_blank')" title="Ver imagen completa">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-outline-danger btn-sm" onclick="adminPanel.deleteImage(${image.id})" title="Eliminar imagen">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
        galleryContainer.innerHTML = imagesHtml;
    }
    updateMetrics(data) {
        const totalProducts = document.getElementById('totalProducts');
        const totalOrders = document.getElementById('totalOrders');
        const totalUsers = document.getElementById('totalUsers');
        const totalRevenue = document.getElementById('totalRevenue');
        if (totalProducts)
            totalProducts.textContent = (data.totalProducts ?? 0).toString();
        if (totalOrders)
            totalOrders.textContent = (data.totalOrders ?? 0).toString();
        if (totalUsers)
            totalUsers.textContent = (data.totalUsers ?? 0).toString();
        if (totalRevenue)
            totalRevenue.textContent = `$${(data.totalRevenue ?? 0).toFixed(2)}`;
    }
    updateAlerts(alerts) {
        const alertsContainer = document.getElementById('alertsList');
        if (!alertsContainer)
            return;
        if (alerts.length === 0) {
            alertsContainer.innerHTML = '<p class="text-muted mb-0">No hay alertas pendientes</p>';
            return;
        }
        const alertsHtml = alerts.map(alert => `
      <div class="alert alert-${alert.type ?? 'info'} mb-2">
        <small>${alert.message}</small>
      </div>
    `).join('');
        alertsContainer.innerHTML = alertsHtml;
    }
    updateRecentActivity(activities) {
        const activityContainer = document.getElementById('recentActivity');
        if (!activityContainer)
            return;
        if (activities.length === 0) {
            activityContainer.innerHTML = '<p class="text-muted mb-0">No hay actividad reciente</p>';
            return;
        }
        const activityHtml = activities.map(activity => `
      <div class="d-flex align-items-center mb-2">
        <i class="bi bi-${activity.icon ?? 'circle'} me-2 text-muted"></i>
        <div class="flex-grow-1">
          <small class="text-muted">${activity.description}</small>
        </div>
        <small class="text-muted">${activity.time}</small>
      </div>
    `).join('');
        activityContainer.innerHTML = activityHtml;
    }
    renderProductsTable(products) {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody)
            return;
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay productos</td></tr>';
            return;
        }
        const rows = products.map(product => `
      <tr>
        <td>${product.id}</td>
        <td>
          <div class="d-flex align-items-center">
            ${product.featured ? '<i class="bi bi-star-fill text-warning me-2" title="Producto destacado"></i>' : ''}
            <strong>${product.name}</strong>
          </div>
        </td>
        <td>$${product.price_usd.toFixed(2)}</td>
        <td>${product.stock}</td>
        <td>
          <span class="status-badge ${product.active ? 'status-active' : 'status-inactive'}">
            ${product.active ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="adminPanel.editProduct(${product.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="adminPanel.deleteProduct(${product.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
        tbody.innerHTML = rows;
    }
    renderOrdersTable(orders) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody)
            return;
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay pedidos</td></tr>';
            return;
        }
        const rows = orders.map(order => `
      <tr>
        <td>${order.id}</td>
        <td>${order.customer_name}</td>
        <td>$${order.total_amount_usd.toFixed(2)}</td>
        <td>
          <span class="status-badge status-${order.status}">
            ${this.getOrderStatusText(order.status)}
          </span>
        </td>
        <td>${new Date(order.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-outline-info" onclick="adminPanel.viewOrder(${order.id})">
            <i class="bi bi-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');
        tbody.innerHTML = rows;
    }
    renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody)
            return;
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay usuarios</td></tr>';
            return;
        }
        const rows = users.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>${user.full_name ?? 'N/A'}</td>
        <td>${user.email}</td>
        <td>
          <span class="badge bg-${user.role === 'admin' ? 'primary' : 'secondary'}">
            ${user.role === 'admin' ? 'Admin' : 'Usuario'}
          </span>
        </td>
        <td>
          <span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
            ${user.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="adminPanel.editUser(${user.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="adminPanel.deleteUser(${user.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
        tbody.innerHTML = rows;
    }
    renderOccasionsTable(occasions) {
        const tbody = document.getElementById('occasionsTableBody');
        if (!tbody)
            return;
        if (occasions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay ocasiones</td></tr>';
            return;
        }
        const rows = occasions.map(occasion => `
      <tr>
        <td>${occasion.id}</td>
        <td>${occasion.name}</td>
        <td>
          <span class="badge bg-info">
            ${this.getOccasionTypeText(occasion.type)}
          </span>
        </td>
        <td>${occasion.display_order}</td>
        <td>
          <span class="status-badge ${occasion.is_active ? 'status-active' : 'status-inactive'}">
            ${occasion.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="adminPanel.editOccasion(${occasion.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="adminPanel.deleteOccasion(${occasion.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
        tbody.innerHTML = rows;
    }
    renderProductsWithImageCounts(products) {
        const tbody = document.getElementById('productsImagesTableBody');
        if (!tbody)
            return;
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay productos</td></tr>';
            return;
        }
        const rows = products.map(product => `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <strong>${product.name}</strong>
          </div>
        </td>
        <td>$${product.price_usd.toFixed(2)}</td>
        <td>
          <span class="badge ${product.image_count === 0 ? 'bg-danger' : product.image_count < 3 ? 'bg-warning' : 'bg-success'}">
            ${product.image_count} ${product.image_count === 1 ? 'imagen' : 'imágenes'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="adminPanel.editProductImages(${product.id}, '${product.name}')">
            <i class="bi bi-images me-1"></i>Gestionar Imágenes
          </button>
        </td>
      </tr>
    `).join('');
        tbody.innerHTML = rows;
    }
    getOrderStatusText(status) {
        const statusMap = {
            pending: 'Pendiente',
            confirmed: 'Confirmado',
            preparing: 'Preparando',
            ready: 'Listo',
            delivered: 'Entregado',
            cancelled: 'Cancelado'
        };
        return statusMap[status] ?? status;
    }
    getOccasionTypeText(type) {
        const typeMap = {
            general: 'General',
            birthday: 'Cumpleaños',
            anniversary: 'Aniversario',
            wedding: 'Boda',
            sympathy: 'Condolencias',
            congratulations: 'Felicitaciones'
        };
        return typeMap[type] ?? type;
    }
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            this.log('Loading overlay shown', 'info');
        }
        else {
            this.log('Loading overlay element not found', 'warn');
        }
    }
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            this.log(`Loading overlay BEFORE hiding - display: ${overlay.style.display}, computed: ${window.getComputedStyle(overlay).display}`, 'info');
            overlay.style.display = 'none';
            this.log(`Loading overlay AFTER hiding - display: ${overlay.style.display}, computed: ${window.getComputedStyle(overlay).display}`, 'info');
            this.log('Loading overlay hidden', 'info');
            setTimeout(() => {
                const mainContent = document.querySelector('.admin-content main');
                if (mainContent) {
                    this.log(`Main content visibility check - display: ${mainContent.style.display}, computed: ${window.getComputedStyle(mainContent).display}`, 'info');
                }
                const dashboardSection = document.getElementById('dashboard-section');
                if (dashboardSection) {
                    this.log(`Dashboard section visibility check - display: ${dashboardSection.style.display}, computed: ${window.getComputedStyle(dashboardSection).display}`, 'info');
                }
            }, 100);
        }
        else {
            this.log('Loading overlay element not found when trying to hide', 'warn');
        }
    }
    showError(message) {
        alert(message);
    }
    redirectToLogin() {
        window.location.href = '/';
    }
    showAccessDenied() {
        const mainContent = document.querySelector('.admin-content main');
        if (mainContent) {
            const userInfo = this.currentUser ?
                `Usuario: ${this.currentUser.email} | Rol: ${this.currentUser.role}` :
                'No hay usuario autenticado';
            mainContent.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-shield-x display-1 text-danger mb-4"></i>
          <h2 class="text-danger">Acceso Denegado</h2>
          <p class="text-muted mb-3">No tienes permisos para acceder al panel de administración.</p>

          <div class="alert alert-info text-start mb-4" style="max-width: 600px; margin: 0 auto;">
            <h6 class="alert-heading mb-2"><i class="bi bi-info-circle me-2"></i>Información de Diagnóstico:</h6>
            <p class="mb-1"><strong>Estado de autenticación:</strong> ${userInfo}</p>
            <p class="mb-1"><strong>Para acceder como administrador:</strong></p>
            <ul class="mb-0">
              <li>Inicia sesión con email: <code>admin@floresya.com</code></li>
              <li>Contraseña: <code>admin</code></li>
            </ul>
          </div>

          <div class="d-flex gap-2 justify-content-center">
            <a href="/" class="btn btn-primary">Volver al sitio</a>
            <button onclick="window.location.reload()" class="btn btn-outline-secondary">Reintentar</button>
          </div>
        </div>
      `;
        }
    }
    logout() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            this.log('🔐 Iniciando proceso seguro de logout', 'info');
            try {
                this.clearAllSessionData();
                this.currentUser = null;
                this.currentSection = 'dashboard';
                this.clearAllIntervals();
                this.clearCache();
                this.log('✅ Sesión cerrada completamente - Todos los datos eliminados', 'success');
                window.location.href = '/';
            }
            catch (error) {
                this.log('❌ Error durante logout: ' + error, 'error');
                window.location.href = '/';
            }
        }
    }
    clearAllSessionData() {
        try {
            localStorage.removeItem('floresya_user');
            localStorage.removeItem('floresya_session');
            localStorage.removeItem('floresya_token');
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('floresya_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                this.log(`🗑️ Eliminado: ${key}`, 'info');
            });
            this.log(`🧹 Limpiados ${keysToRemove.length + 3} elementos de localStorage`, 'info');
        }
        catch (error) {
            this.log('❌ Error limpiando localStorage: ' + error, 'error');
            try {
                localStorage.clear();
                this.log('🧹 localStorage completamente limpiado como fallback', 'warn');
            }
            catch (fallbackError) {
                this.log('❌ Error en fallback de limpieza: ' + fallbackError, 'error');
            }
        }
    }
    clearAllIntervals() {
        try {
            this.hoverIntervals.forEach((interval, key) => {
                clearInterval(interval);
                this.log(`🕐 Intervalo limpiado: ${key}`, 'info');
            });
            this.hoverIntervals.clear();
            this.log('✅ Todos los intervalos limpiados', 'info');
        }
        catch (error) {
            this.log('❌ Error limpiando intervalos: ' + error, 'error');
        }
    }
    clearCache() {
        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.clear();
                this.log('🗂️ sessionStorage limpiado', 'info');
            }
            if (window.floresyaApp) {
                this.log('🔄 Estado global de aplicación reseteado', 'info');
            }
        }
        catch (error) {
            this.log('❌ Error limpiando cache: ' + error, 'error');
        }
    }
    showFallbackModal(modalElement) {
        this.log('🔧 Showing fallback modal without Bootstrap', 'info');
        modalElement.style.display = 'block';
        modalElement.style.position = 'fixed';
        modalElement.style.top = '0';
        modalElement.style.left = '0';
        modalElement.style.width = '100%';
        modalElement.style.height = '100%';
        modalElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modalElement.style.zIndex = '9999';
        modalElement.classList.add('show');
        const modalDialog = modalElement.querySelector('.modal-dialog');
        if (modalDialog) {
            modalDialog.style.position = 'relative';
            modalDialog.style.top = '50%';
            modalDialog.style.left = '50%';
            modalDialog.style.transform = 'translate(-50%, -50%)';
            modalDialog.style.margin = '0';
        }
        const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modalElement.style.display = 'none';
                modalElement.remove();
            });
        });
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                modalElement.style.display = 'none';
                modalElement.remove();
            }
        });
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modalElement.style.display = 'none';
                modalElement.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        this.log('✅ Fallback modal shown successfully', 'success');
    }
    async getCarouselProducts() {
        try {
            const response = await this.api.getProducts({
                has_carousel_order: true,
                sort_by: 'carousel_order',
                sort_direction: 'asc',
                limit: 7
            });
            if (response.success && response.data) {
                return response.data.products
                    .filter(p => p.carousel_order !== null && p.carousel_order !== undefined)
                    .map(p => ({
                    id: p.id,
                    name: p.name,
                    summary: p.summary,
                    carousel_order: p.carousel_order ?? 0
                }))
                    .sort((a, b) => a.carousel_order - b.carousel_order);
            }
            return [];
        }
        catch (error) {
            this.log('Error getting carousel products: ' + error, 'error');
            return [];
        }
    }
    async getCurrentCarouselCount() {
        const products = await this.getCarouselProducts();
        return products.length;
    }
    async loadOccasions() {
        try {
            const response = await this.api.getOccasions();
            if (response.success && response.data) {
                const occasions = response.data ?? [];
                return occasions
                    .filter((occasion) => occasion.is_active)
                    .sort((a, b) => a.name.localeCompare(b.name));
            }
            return [];
        }
        catch (error) {
            this.log('Error loading occasions: ' + error, 'error');
            return [];
        }
    }
    capitalizeTitle(text) {
        const prepositions = ['de', 'del', 'la', 'el', 'los', 'las', 'con', 'para', 'por', 'en', 'y', 'o'];
        return text
            .toLowerCase()
            .split(' ')
            .map((word, index) => {
            if (index === 0 || !prepositions.includes(word)) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
        })
            .join(' ');
    }
    removeAccents(text) {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '');
    }
    processProductName(name) {
        const trimmed = name.trim();
        const capitalized = this.capitalizeTitle(trimmed);
        const searchable = this.removeAccents(capitalized).toLowerCase();
        return {
            display: capitalized,
            search: searchable
        };
    }
    generateOccasionsCheckboxes(occasions, product) {
        if (!occasions || occasions.length === 0) {
            return '<p class="text-muted">No hay ocasiones disponibles</p>';
        }
        const selectedOccasions = new Set();
        if (product?.occasion_ids) {
            product.occasion_ids.forEach(id => selectedOccasions.add(id));
        }
        const checkboxes = occasions
            .filter(occasion => occasion.is_active)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(occasion => {
            const isChecked = selectedOccasions.has(occasion.id);
            return `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" value="${occasion.id}"
                   id="occasion_${occasion.id}" ${isChecked ? 'checked' : ''}>
            <label class="form-check-label" for="occasion_${occasion.id}">
              ${occasion.name}
              <small class="text-muted"> (${this.getOccasionTypeText(occasion.type)})</small>
            </label>
          </div>
        `;
        })
            .join('');
        return `
      <div class="occasions-list">
        ${checkboxes}
      </div>
    `;
    }
    generateCarouselPositionHTML(carouselProducts, currentProduct) {
        const maxPositions = 7;
        const occupiedPositions = new Map();
        carouselProducts.forEach(product => {
            if (product.carousel_order && product.id !== currentProduct?.id) {
                occupiedPositions.set(product.carousel_order, product);
            }
        });
        const carouselCount = occupiedPositions.size;
        const isFull = carouselCount >= maxPositions;
        let html = `
      <div class="mb-4">
        <label class="form-label fw-bold">Posición en Carousel (${carouselCount}/${maxPositions})</label>
        <div class="carousel-positions">
          <!-- No incluir option -->
          <div class="carousel-position">
            <input type="radio" name="carouselPosition" id="carouselNone" value="">
            <label for="carouselNone">
              <span class="position-text">No incluir en carousel</span>
            </label>
          </div>
    `;
        for (let position = 1; position <= maxPositions; position++) {
            const occupied = occupiedPositions.get(position);
            const _isAvailable = !occupied;
            const inputId = `carouselPos${position}`;
            const isCurrentProductPosition = currentProduct?.carousel_order === position;
            const isChecked = isCurrentProductPosition || (position === 0 && !currentProduct?.carousel_order);
            if (occupied && !isCurrentProductPosition) {
                const truncatedName = occupied.name.length > 25 ? occupied.name.substring(0, 25) + '...' : occupied.name;
                html += `
          <div class="carousel-position occupied">
            <input type="radio" name="carouselPosition" id="${inputId}" value="${position}" ${isChecked ? 'checked' : ''}>
            <label for="${inputId}">
              <strong>Posición ${position}</strong> - "${truncatedName}"
              <small class="text-muted d-block">🔄 Reemplazar</small>
            </label>
          </div>
        `;
            }
            else if (isCurrentProductPosition) {
                const truncatedName = currentProduct.name.length > 25 ? currentProduct.name.substring(0, 25) + '...' : currentProduct.name;
                html += `
          <div class="carousel-position current">
            <input type="radio" name="carouselPosition" id="${inputId}" value="${position}" ${isChecked ? 'checked' : ''}>
            <label for="${inputId}">
              <strong>Posición ${position}</strong> - "${truncatedName}"
              <small class="text-primary d-block">📍 Posición actual</small>
            </label>
          </div>
        `;
            }
            else {
                const isDisabled = isFull && position > carouselCount + 1;
                html += `
          <div class="carousel-position available">
            <input type="radio" name="carouselPosition" id="${inputId}" value="${position}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
            <label for="${inputId}">
              <strong>Posición ${position}</strong> - Disponible
              ${position <= carouselCount + 1 ? '<small class="text-success d-block">✓ Insertar aquí</small>' : '<small class="text-muted d-block">Los posteriores se reorganizarán +1</small>'}
            </label>
          </div>
        `;
            }
        }
        html += `
        </div>
        <small class="form-text text-muted">
          💡 <strong>Móvil:</strong> Toca 📝 para ver detalles del producto<br>
          📋 <strong>Reorganización:</strong> Los productos posteriores se moverán automáticamente +1
          ${isFull ? '<br>⚠️ <strong>Carousel lleno:</strong> Selecciona una posición ocupada para reemplazar' : ''}
        </small>
      </div>
    `;
        return html;
    }
    log(message, level = 'info') {
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        if (isProduction && level === 'warn') {
            return;
        }
        if (isProduction && level === 'info') {
            if (!message.includes('CRITICAL') && !message.includes('ERROR') && !message.includes('FAILED')) {
                return;
            }
        }
        const prefix = '[🌸 Admin Panel]';
        const timestamp = new Date().toISOString();
        const output = `${prefix} [${level.toUpperCase()}] ${timestamp} — ${message}`;
        switch (level) {
            case 'error':
                console.error(output);
                break;
            case 'warn':
                if (message.includes('CRITICAL') || message.includes('ERROR') || message.includes('FAILED')) {
                    console.warn(output);
                }
                break;
            default:
                console.log(output);
                break;
        }
    }
    async showAddProductModal() {
        this.log('📝 showAddProductModal called - creating new product modal', 'info');
        try {
            await this.showProductModal(null);
            this.log('✅ showAddProductModal completed successfully', 'success');
        }
        catch (error) {
            this.log('❌ Error in showAddProductModal: ' + error, 'error');
        }
    }
    async showEditProductModal(product) {
        await this.showProductModal(product);
    }
    async showProductModal(product) {
        this.log('🔧 showProductModal called with product: ' + (product ? 'existing' : 'null'));
        const occasions = await this.loadOccasions();
        this.log(`Loaded ${occasions.length} occasions for dropdown`, 'info');
        const carouselProducts = await this.getCarouselProducts();
        this.log(`Loaded ${carouselProducts.length} carousel products`, 'info');
        const bootstrapAvailable = !!window.bootstrap;
        this.log('🔍 Bootstrap available: ' + bootstrapAvailable, 'info');
        if (window.bootstrap) {
            this.log('🔍 Bootstrap Modal available: ' + !!(window.bootstrap?.Modal), 'info');
        }
        const modalTitle = product ? 'Editar Producto' : 'Crear Nuevo Producto';
        const saveButtonText = product ? 'Actualizar' : 'Crear';
        this.log('📝 Creating modal HTML for: ' + modalTitle);
        const _occasionsOptions = occasions.map(occasion => `<option value="${occasion.id}">${occasion.name}</option>`).join('');
        const carouselPositionHTML = this.generateCarouselPositionHTML(carouselProducts, product);
        const modalHtml = `
      <div class="modal fade" id="productModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${modalTitle}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <!-- Message Area -->
              <div id="productMessageArea" class="alert-container mb-3" style="display: none;">
                <div id="productMessage" class="alert" role="alert"></div>
              </div>

              <form id="productForm">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="productName" class="form-label">Nombre *</label>
                      <input type="text" class="form-control" id="productName" required
                             value="${product?.name ?? ''}">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="productPrice" class="form-label">Precio USD *</label>
                      <input type="text" class="form-control" id="productPrice" required
                             value="${product?.price_usd ?? ''}" placeholder="0.00">
                      <div class="form-text">Usar punto (.) como separador decimal. Ej: 25.50</div>
                    </div>
                  </div>
                </div>


                <div class="mb-3">
                  <label for="productSummary" class="form-label">Resumen *</label>
                  <input type="text" class="form-control" id="productSummary" required
                         value="${product?.summary ?? ''}" placeholder="Breve descripción del producto">
                  <div class="form-text">Mínimo 10 caracteres, máximo 500</div>
                </div>

                <div class="mb-3">
                  <label for="productDescription" class="form-label">Descripción *</label>
                  <textarea class="form-control" id="productDescription" rows="3" required>${product?.description ?? ''}</textarea>
                </div>

                <div class="mb-3">
                  <label class="form-label">Ocasiones</label>
                  <div class="form-text mb-2">Selecciona las ocasiones donde aparecerá este producto</div>
                  <div class="occasions-checkboxes" id="productOccasions">
                    ${this.generateOccasionsCheckboxes(occasions, product)}
                  </div>
                </div>

                <!-- Carousel Position Section -->
                ${carouselPositionHTML}

                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3 form-check">
                      <input type="checkbox" class="form-check-input" id="productFeatured" ${product?.featured ? 'checked' : ''}>
                      <label class="form-check-label" for="productFeatured">
                        Producto destacado
                      </label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3 form-check">
                      <input type="checkbox" class="form-check-input" id="productActive" ${product?.active !== false ? 'checked' : ''}>
                      <label class="form-check-label" for="productActive">
                        Producto activo
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-success me-2" id="closeModalBtn" style="display: none;">
                <i class="bi bi-check-circle me-2"></i>Terminar y Cerrar
              </button>
              <button type="button" class="btn btn-primary" id="saveProductBtn">${saveButtonText}</button>
            </div>
          </div>
        </div>
      </div>
    `;
        const existingModal = document.getElementById('productModal');
        if (existingModal) {
            existingModal.remove();
        }
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalElement = document.getElementById('productModal');
        this.log('🔍 Modal element found: ' + !!modalElement, 'info');
        if (!modalElement) {
            this.log('❌ Modal element not found in DOM', 'error');
            return;
        }
        let modal = null;
        setTimeout(() => {
            const bootstrap = window.bootstrap;
            if (bootstrap?.Modal) {
                this.log('✅ Bootstrap and Modal class available, creating modal instance', 'info');
                try {
                    modal = new bootstrap.Modal(modalElement);
                    this.log('✅ Modal instance created successfully', 'info');
                    modal.show();
                    this.log('✅ Modal.show() called successfully', 'success');
                    setTimeout(() => {
                        const modalToFix = document.getElementById('productModal');
                        if (modalToFix) {
                            modalToFix.style.visibility = 'visible';
                            modalToFix.style.opacity = '1';
                            modalToFix.style.display = 'block';
                            modalToFix.classList.add('show');
                            this.log('🔧 FORCED modal visibility after Bootstrap show()', 'warn');
                        }
                    }, 50);
                    setTimeout(() => {
                        const modalCheck = document.getElementById('productModal');
                        if (modalCheck) {
                            const computedStyle = window.getComputedStyle(modalCheck);
                            if (computedStyle.visibility === 'visible' && computedStyle.opacity === '1') {
                                this.log('✅ Modal is visible and ready', 'success');
                            }
                            else {
                                this.log(`⚠️ Modal may have visibility issues - visibility: ${computedStyle.visibility}, opacity: ${computedStyle.opacity}`, 'warn');
                            }
                        }
                    }, 200);
                }
                catch (error) {
                    this.log('❌ Error creating or showing Bootstrap modal: ' + error, 'error');
                    console.error('Bootstrap Modal error:', error);
                    this.showFallbackModal(modalElement);
                }
            }
            else {
                this.log('❌ Bootstrap not available - using fallback modal', 'warn');
                this.showFallbackModal(modalElement);
            }
        }, 100);
        const nameInput = document.getElementById('productName');
        if (nameInput) {
            nameInput.addEventListener('blur', () => {
                const processed = this.processProductName(nameInput.value);
                nameInput.value = processed.display;
                this.log(`Name processed: "${processed.display}" (searchable: "${processed.search}")`, 'info');
            });
        }
        const saveBtn = document.getElementById('saveProductBtn');
        if (saveBtn) {
            this.log('✅ Save button found, attaching event listener');
            saveBtn.addEventListener('click', async () => {
                this.log('💾 Save button clicked, calling saveProduct');
                const success = await this.saveProduct(product?.id ?? null);
                if (success && product?.id) {
                    const modalElement = document.getElementById('productModal');
                    if (modalElement) {
                        if (modal && typeof modal.hide === 'function') {
                            modal.hide();
                            this.log('✅ Bootstrap modal hidden after successful update');
                        }
                        else {
                            modalElement.style.display = 'none';
                            modalElement.remove();
                            this.log('✅ Fallback modal hidden after successful update');
                        }
                    }
                }
                else if (success && !product?.id) {
                    this.log('✅ Product created successfully - modal remains open for next product');
                    const closeModalBtn = document.getElementById('closeModalBtn');
                    if (closeModalBtn) {
                        closeModalBtn.style.display = 'inline-block';
                    }
                }
                else {
                    this.log('⚠️ Modal remains open due to save error');
                }
            });
        }
        else {
            this.log('❌ Save button not found in modal');
        }
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                const modalElement = document.getElementById('productModal');
                if (modalElement) {
                    if (modal && typeof modal.hide === 'function') {
                        modal.hide();
                        this.log('✅ Modal closed by user after product creation');
                    }
                    else {
                        modalElement.style.display = 'none';
                        modalElement.remove();
                        this.log('✅ Fallback modal closed by user after product creation');
                    }
                }
            });
        }
        this.log('✅ showProductModal completed successfully');
    }
    async saveProduct(productId) {
        try {
            const nameInput = document.getElementById('productName');
            const priceInput = document.getElementById('productPrice');
            const summaryInput = document.getElementById('productSummary');
            const descriptionInput = document.getElementById('productDescription');
            const occasionsContainer = document.getElementById('productOccasions');
            const featuredInput = document.getElementById('productFeatured');
            const activeInput = document.getElementById('productActive');
            const saveBtn = document.getElementById('saveProductBtn');
            const errors = [];
            const name = nameInput.value.trim();
            const priceText = priceInput.value.trim().replace(',', '.');
            const price_usd = parseFloat(priceText);
            const stock = 1;
            const description = descriptionInput.value.trim();
            this.log(`Form values - name: "${name}", price: ${price_usd}, stock: ${stock}, description: "${description}"`, 'info');
            if (!name) {
                errors.push('El nombre del producto es obligatorio');
                nameInput.focus();
            }
            else if (name.length < 2) {
                errors.push('El nombre debe tener al menos 2 caracteres');
                nameInput.focus();
            }
            else if (name.length > 200) {
                errors.push('El nombre no puede exceder 200 caracteres');
                nameInput.focus();
            }
            if (!priceText || isNaN(price_usd) || price_usd <= 0) {
                errors.push('El precio debe ser un número positivo. Usar formato: 25.50');
                if (!errors.length)
                    priceInput.focus();
            }
            else if (price_usd > 999999.99) {
                errors.push('El precio no puede exceder $999,999.99');
                if (!errors.length)
                    priceInput.focus();
            }
            else {
                const decimalMatch = priceText.match(/\.(\d+)$/);
                if (decimalMatch?.[1] && decimalMatch[1].length > 2) {
                    errors.push('El precio no puede tener más de 2 decimales');
                    if (!errors.length)
                        priceInput.focus();
                }
            }
            if (!description) {
                errors.push('La descripción del producto es obligatoria');
                if (!errors.length)
                    descriptionInput.focus();
            }
            else if (description.length < 10) {
                errors.push('La descripción debe tener al menos 10 caracteres');
                if (!errors.length)
                    descriptionInput.focus();
            }
            else if (description.length > 2000) {
                errors.push('La descripción no puede exceder 2000 caracteres');
                if (!errors.length)
                    descriptionInput.focus();
            }
            const summary = summaryInput.value.trim();
            this.log(`Summary value: "${summary}"`, 'info');
            if (!summary) {
                errors.push('El resumen del producto es obligatorio');
                if (!errors.length)
                    summaryInput.focus();
            }
            else if (summary.length < 10) {
                errors.push('El resumen debe tener al menos 10 caracteres');
                if (!errors.length)
                    summaryInput.focus();
            }
            else if (summary.length > 500) {
                errors.push('El resumen no puede exceder 500 caracteres');
                if (!errors.length)
                    summaryInput.focus();
            }
            const selectedOccasions = [];
            if (occasionsContainer) {
                const checkboxes = occasionsContainer.querySelectorAll('input[type="checkbox"]:checked');
                checkboxes.forEach((checkbox) => {
                    const occasionId = parseInt(checkbox.value);
                    if (!isNaN(occasionId)) {
                        selectedOccasions.push(occasionId);
                    }
                });
            }
            const carouselPositionRadio = document.querySelector('input[name="carouselPosition"]:checked');
            const carouselOrder = carouselPositionRadio ? carouselPositionRadio.value : '';
            if (errors.length > 0) {
                this.showProductMessage('Errores de validación:\n• ' + errors.join('\n• '), 'error');
                return false;
            }
            this.hideProductMessage();
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Guardando...';
            }
            const formData = {
                name,
                price_usd: parseFloat(price_usd.toFixed(2)),
                stock,
                summary: summary ?? undefined,
                description,
                occasion_ids: selectedOccasions,
                carousel_order: carouselOrder ? parseInt(carouselOrder) : undefined,
                featured: featuredInput.checked,
                active: activeInput.checked
            };
            this.log('Submitting product data: ' + JSON.stringify(formData, null, 2), 'info');
            let response;
            if (productId) {
                response = await this.api.updateProduct({ id: productId, ...formData });
                this.log('Product updated successfully', 'success');
            }
            else {
                response = await this.api.createProduct(formData);
                this.log('Product created successfully', 'success');
            }
            if (response.success) {
                const successMessage = productId ? '✅ Producto actualizado exitosamente' : '✅ Producto creado exitosamente';
                this.showProductMessage(successMessage, 'success');
                await this.loadProductsData();
                if (!productId) {
                    this.clearProductForm();
                    const modalTitle = document.querySelector('#productModal .modal-title');
                    if (modalTitle) {
                        modalTitle.innerHTML = '<i class="bi bi-check-circle-fill text-success me-2"></i>Producto Creado - Listo para Crear Otro';
                    }
                    const saveBtn = document.getElementById('saveProductBtn');
                    if (saveBtn) {
                        saveBtn.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Crear Otro Producto';
                    }
                    setTimeout(() => {
                        this.hideProductMessage();
                        if (modalTitle) {
                            modalTitle.innerHTML = 'Crear Nuevo Producto';
                        }
                        if (saveBtn) {
                            saveBtn.innerHTML = 'Crear';
                        }
                    }, 3000);
                    return false;
                }
                else {
                    return true;
                }
            }
            else {
                const errorMessage = response.message ?? 'Error desconocido al guardar el producto';
                this.showProductMessage(`⚠️ ${errorMessage}`, 'error');
                this.log('API returned error', 'error');
                return false;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.log('Error saving product: ' + errorMessage, 'error');
            this.showProductMessage(`⚠️ Error al guardar el producto: ${errorMessage}`, 'error');
            return false;
        }
        finally {
            const saveBtn = document.getElementById('saveProductBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = productId ? 'Actualizar' : 'Crear';
            }
        }
    }
    showProductMessage(message, type = 'error') {
        const messageArea = document.getElementById('productMessageArea');
        const messageDiv = document.getElementById('productMessage');
        if (!messageArea || !messageDiv)
            return;
        messageDiv.textContent = message;
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'warning'}`;
        messageArea.style.display = 'block';
        messageArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    hideProductMessage() {
        const messageArea = document.getElementById('productMessageArea');
        if (messageArea) {
            messageArea.style.display = 'none';
        }
    }
    clearProductForm() {
        this.hideProductMessage();
        const formElements = [
            'productName',
            'productPrice',
            'productSummary',
            'productDescription',
        ];
        formElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
        const occasionsContainer = document.getElementById('productOccasions');
        if (occasionsContainer) {
            const checkboxes = occasionsContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach((checkbox) => {
                checkbox.checked = false;
            });
        }
        const carouselNoneRadio = document.getElementById('carouselNone');
        if (carouselNoneRadio)
            carouselNoneRadio.checked = true;
        const featuredInput = document.getElementById('productFeatured');
        const activeInput = document.getElementById('productActive');
        if (featuredInput)
            featuredInput.checked = false;
        if (activeInput)
            activeInput.checked = true;
        const modalTitle = document.querySelector('#productModal .modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = 'Crear Nuevo Producto';
        }
        const saveBtn = document.getElementById('saveProductBtn');
        if (saveBtn) {
            saveBtn.innerHTML = 'Crear';
        }
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.style.display = 'none';
        }
        this.log('Product form cleared after successful creation', 'info');
    }
    async showAddUserModal() {
        this.log('👤 showAddUserModal called - showing user creation modal', 'info');
        try {
            const modalElement = document.getElementById('userModal');
            if (!modalElement) {
                this.log('❌ User modal element not found in DOM', 'error');
                return;
            }
            this.resetUserModal();
            let modal = null;
            setTimeout(() => {
                const bootstrap = window.bootstrap;
                if (bootstrap?.Modal) {
                    try {
                        modal = new bootstrap.Modal(modalElement);
                        modal.show();
                        setTimeout(() => {
                            if (modalElement) {
                                modalElement.style.visibility = 'visible';
                                modalElement.style.opacity = '1';
                                modalElement.style.display = 'block';
                                modalElement.classList.add('show');
                            }
                        }, 50);
                        this.log('✅ User creation modal shown successfully', 'success');
                    }
                    catch (error) {
                        this.log('❌ Error creating Bootstrap modal: ' + error, 'error');
                        this.showFallbackModal(modalElement);
                    }
                }
                else {
                    this.log('❌ Bootstrap not available, using fallback modal', 'warn');
                    this.showFallbackModal(modalElement);
                }
            }, 100);
            const passwordInput = document.getElementById('userPassword');
            const strengthIndicator = document.getElementById('passwordStrength');
            if (passwordInput && strengthIndicator) {
                passwordInput.addEventListener('input', () => {
                    const password = passwordInput.value;
                    const strength = this.checkPasswordStrength(password);
                    if (password.length > 0) {
                        strengthIndicator.style.display = 'block';
                        strengthIndicator.className = `password-strength ${strength}`;
                        strengthIndicator.textContent = this.getPasswordStrengthText(strength);
                    }
                    else {
                        strengthIndicator.style.display = 'none';
                    }
                });
            }
            const saveBtn = document.getElementById('saveUserBtn');
            if (saveBtn) {
                const newSaveBtn = saveBtn.cloneNode(true);
                saveBtn.parentNode?.replaceChild(newSaveBtn, saveBtn);
                newSaveBtn.addEventListener('click', async () => {
                    this.log('💾 Save user button clicked, calling saveUser');
                    const success = await this.saveUser();
                    if (success) {
                        if (modal && typeof modal.hide === 'function') {
                            modal.hide();
                        }
                        else if (modalElement) {
                            modalElement.style.display = 'none';
                        }
                    }
                });
            }
        }
        catch (error) {
            this.log('❌ Error in showAddUserModal: ' + error, 'error');
            alert('Error al abrir el modal de creación de usuario');
        }
    }
    resetUserModal() {
        const form = document.getElementById('userForm');
        if (form)
            form.reset();
        const modalTitle = document.getElementById('userModalLabel');
        if (modalTitle) {
            modalTitle.textContent = 'Crear Nuevo Usuario';
        }
        const passwordLabel = document.getElementById('passwordLabel');
        if (passwordLabel) {
            passwordLabel.textContent = '(requerida para nuevo usuario)';
        }
        const isActiveInput = document.getElementById('userIsActive');
        const emailVerifiedInput = document.getElementById('userEmailVerified');
        if (isActiveInput)
            isActiveInput.checked = true;
        if (emailVerifiedInput)
            emailVerifiedInput.checked = false;
        const messageArea = document.getElementById('userMessageArea');
        if (messageArea) {
            messageArea.style.display = 'none';
        }
        this.clearUserValidationErrors();
        this.log('🔄 User modal reset to creation state', 'info');
    }
    clearUserValidationErrors() {
        const errorFields = ['userEmail', 'userFullName', 'userPhone', 'userRole', 'userPassword'];
        errorFields.forEach(field => {
            const errorElement = document.getElementById(`${field}Error`);
            const inputElement = document.getElementById(field);
            if (errorElement) {
                errorElement.textContent = '';
            }
            if (inputElement) {
                inputElement.classList.remove('is-invalid');
            }
        });
    }
    async showAddOccasionModal() {
        this.log('📝 showAddOccasionModal called - creating new occasion modal', 'info');
        await this.showOccasionModal(null);
    }
    async showOccasionModal(occasion) {
        this.log('🔧 showOccasionModal called with occasion: ' + (occasion ? 'existing' : 'null'));
        const modalTitle = occasion ? 'Editar Ocasión' : 'Crear Nueva Ocasión';
        const saveButtonText = occasion ? 'Actualizar' : 'Crear';
        const modalHtml = `
      <div class="modal fade" id="occasionModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${modalTitle}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <!-- Message Area -->
              <div id="occasionMessageArea" class="alert-container mb-3" style="display: none;">
                <div id="occasionMessage" class="alert" role="alert"></div>
              </div>

              <form id="occasionForm">
                <div class="mb-3">
                  <label for="occasionName" class="form-label">Nombre *</label>
                  <input type="text" class="form-control" id="occasionName" required
                         value="${occasion?.name ?? ''}" placeholder="Nombre de la ocasión">
                  <div class="form-text">El slug se generará automáticamente a partir del nombre.</div>
                </div>

                <div class="mb-3">
                  <label for="occasionDescription" class="form-label">Descripción</label>
                  <textarea class="form-control" id="occasionDescription" rows="3">${occasion?.description ?? ''}</textarea>
                </div>

                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="occasionActive" ${occasion?.is_active !== false ? 'checked' : ''}>
                  <label class="form-check-label" for="occasionActive">
                    Ocasión activa
                  </label>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" id="saveOccasionBtn">${saveButtonText}</button>
            </div>
          </div>
        </div>
      </div>
    `;
        const existingModal = document.getElementById('occasionModal');
        if (existingModal) {
            existingModal.remove();
        }
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalElement = document.getElementById('occasionModal');
        if (!modalElement) {
            this.log('❌ Occasion modal element not found in DOM', 'error');
            return;
        }
        setTimeout(() => {
            const bootstrap = window.bootstrap;
            if (bootstrap?.Modal) {
                try {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                    this.log('✅ Occasion modal shown successfully', 'success');
                    const saveBtn = document.getElementById('saveOccasionBtn');
                    if (saveBtn) {
                        saveBtn.addEventListener('click', () => {
                            void this.saveOccasion(occasion?.id ?? null);
                        });
                    }
                }
                catch (error) {
                    this.log('❌ Error showing occasion modal: ' + error, 'error');
                }
            }
            else {
                this.log('❌ Bootstrap Modal not available for occasion modal', 'error');
            }
        }, 100);
    }
    async saveOccasion(occasionId) {
        try {
            const nameInput = document.getElementById('occasionName');
            const descriptionInput = document.getElementById('occasionDescription');
            const activeInput = document.getElementById('occasionActive');
            const name = nameInput.value.trim();
            const description = descriptionInput.value.trim();
            const active = activeInput.checked;
            if (!name) {
                this.showOccasionMessage('Por favor, ingresa el nombre de la ocasión.', 'error');
                return;
            }
            const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            const occasionData = {
                name,
                type: 'general',
                description: description || undefined,
                slug,
                is_active: active
            };
            this.showOccasionMessage('Guardando ocasión...', 'info');
            let response;
            if (occasionId) {
                response = await this.api.updateOccasion({
                    id: occasionId,
                    ...occasionData
                });
            }
            else {
                response = await this.api.createOccasion(occasionData);
            }
            if (response.success) {
                this.showOccasionMessage(occasionId ? 'Ocasión actualizada exitosamente' : 'Ocasión creada exitosamente', 'success');
                setTimeout(() => {
                    const modal = document.getElementById('occasionModal');
                    if (modal) {
                        const bootstrap = window.bootstrap;
                        if (bootstrap?.Modal) {
                            const modalInstance = bootstrap.Modal.getInstance(modal);
                            if (modalInstance) {
                                modalInstance.hide();
                            }
                        }
                    }
                    void this.loadOccasions();
                }, 1500);
            }
            else {
                this.showOccasionMessage(response.message || 'Error al guardar la ocasión', 'error');
            }
        }
        catch (error) {
            this.log('❌ Error saving occasion: ' + error, 'error');
            this.showOccasionMessage('Error al guardar la ocasión', 'error');
        }
    }
    showOccasionMessage(message, type) {
        const messageArea = document.getElementById('occasionMessageArea');
        const messageDiv = document.getElementById('occasionMessage');
        if (messageArea && messageDiv) {
            messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type}`;
            messageDiv.textContent = message;
            messageArea.style.display = 'block';
            if (type === 'success') {
                setTimeout(() => {
                    messageArea.style.display = 'none';
                }, 3000);
            }
        }
    }
    async showProductImagesModal() {
        this.log('🖼️ showProductImagesModal called - showing image management modal', 'info');
        try {
            const modalElement = document.getElementById('productImagesModal');
            if (!modalElement) {
                this.log('❌ productImagesModal element not found in DOM', 'error');
                this.showError('Modal de gestión de imágenes no encontrado');
                return;
            }
            this.resetProductImagesModal();
            await this.loadProductsForImageModal();
            await this.loadProductImages();
            this.bindProductImagesEvents();
            const bootstrap = window.bootstrap;
            if (bootstrap?.Modal) {
                try {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                    this.log('✅ Product images modal shown successfully', 'success');
                    setTimeout(() => {
                        if (modalElement) {
                            modalElement.style.visibility = 'visible';
                            modalElement.style.opacity = '1';
                            modalElement.style.display = 'block';
                            modalElement.classList.add('show');
                            this.log('🔧 FORCED product images modal visibility', 'info');
                        }
                    }, 50);
                }
                catch (error) {
                    this.log('❌ Error showing product images modal with Bootstrap: ' + error, 'error');
                    this.showFallbackProductImagesModal(modalElement);
                }
            }
            else {
                this.log('❌ Bootstrap Modal not available for product images modal', 'error');
                this.showFallbackProductImagesModal(modalElement);
            }
        }
        catch (error) {
            this.log('❌ Error in showProductImagesModal: ' + error, 'error');
            this.showError('Error al abrir el modal de gestión de imágenes');
        }
    }
    resetProductImagesModal() {
        const productFilter = document.getElementById('productFilter');
        const sizeFilter = document.getElementById('sizeFilter');
        const statusFilter = document.getElementById('statusFilter');
        if (productFilter)
            productFilter.value = '';
        if (sizeFilter)
            sizeFilter.value = '';
        if (statusFilter)
            statusFilter.value = '';
        const uploadProductSelect = document.getElementById('uploadProductSelect');
        const imageIndex = document.getElementById('imageIndex');
        const imageFile = document.getElementById('imageFile');
        const setPrimaryImage = document.getElementById('setPrimaryImage');
        if (uploadProductSelect)
            uploadProductSelect.value = '';
        if (imageIndex)
            imageIndex.value = '1';
        if (imageFile)
            imageFile.value = '';
        if (setPrimaryImage)
            setPrimaryImage.checked = false;
        const uploadProgress = document.getElementById('uploadProgress');
        if (uploadProgress)
            uploadProgress.style.display = 'none';
        const messageArea = document.getElementById('productImagesMessageArea');
        if (messageArea)
            messageArea.style.display = 'none';
        const viewModeGrid = document.getElementById('viewModeGrid');
        const viewModeList = document.getElementById('viewModeList');
        const imagesContainer = document.getElementById('imagesContainer');
        if (viewModeGrid)
            viewModeGrid.classList.add('active');
        if (viewModeList)
            viewModeList.classList.remove('active');
        if (imagesContainer)
            imagesContainer.classList.remove('images-list-view');
    }
    async loadProductsForImageModal() {
        try {
            this.log('Loading products for image modal dropdowns...', 'info');
            const response = await this.api.getProducts({ limit: 100 });
            if (response.success && response.data) {
                const products = response.data.products;
                const productFilter = document.getElementById('productFilter');
                if (productFilter) {
                    productFilter.innerHTML = '<option value="">Todos los productos</option>';
                    products.forEach((product) => {
                        const option = document.createElement('option');
                        option.value = product.id.toString();
                        option.textContent = product.name;
                        productFilter.appendChild(option);
                    });
                }
                const uploadProductSelect = document.getElementById('uploadProductSelect');
                if (uploadProductSelect) {
                    uploadProductSelect.innerHTML = '<option value="">Seleccionar producto...</option>';
                    products.forEach((product) => {
                        const option = document.createElement('option');
                        option.value = product.id.toString();
                        option.textContent = product.name;
                        uploadProductSelect.appendChild(option);
                    });
                }
                this.log(`✅ Loaded ${products.length} products for image modal`, 'success');
            }
            else {
                this.log('❌ Failed to load products for image modal', 'error');
            }
        }
        catch (error) {
            this.log('❌ Error loading products for image modal: ' + error, 'error');
        }
    }
    async loadProductImages(page = 1, filters = {}) {
        try {
            this.log('Loading product images...', 'info');
            const imagesLoading = document.getElementById('imagesLoading');
            const imagesContainer = document.getElementById('imagesContainer');
            const imagesEmpty = document.getElementById('imagesEmpty');
            if (imagesLoading)
                imagesLoading.style.display = 'block';
            if (imagesContainer)
                imagesContainer.style.display = 'none';
            if (imagesEmpty)
                imagesEmpty.style.display = 'none';
            const mockImages = [
                {
                    id: 1,
                    product_id: 1,
                    product_name: 'Rosa Roja Premium',
                    size: 'medium',
                    url: '/images/placeholder-flower.jpg',
                    file_hash: 'mock_hash_1',
                    is_primary: true,
                    created_at: '2024-01-15T10:30:00Z'
                },
                {
                    id: 2,
                    product_id: 1,
                    product_name: 'Rosa Roja Premium',
                    size: 'thumb',
                    url: '/images/placeholder-flower.jpg',
                    file_hash: 'mock_hash_2',
                    is_primary: false,
                    created_at: '2024-01-15T10:30:00Z'
                }
            ];
            setTimeout(() => {
                this.renderProductImages(mockImages);
                if (imagesLoading)
                    imagesLoading.style.display = 'none';
                if (imagesContainer)
                    imagesContainer.style.display = 'block';
            }, 500);
        }
        catch (error) {
            this.log('❌ Error loading product images: ' + error, 'error');
            const imagesLoading = document.getElementById('imagesLoading');
            const imagesEmpty = document.getElementById('imagesEmpty');
            if (imagesLoading)
                imagesLoading.style.display = 'none';
            if (imagesEmpty)
                imagesEmpty.style.display = 'block';
        }
    }
    renderProductImages(images) {
        const imagesContainer = document.getElementById('imagesContainer');
        const imagesCount = document.getElementById('imagesCount');
        if (!imagesContainer)
            return;
        if (images.length === 0) {
            const imagesEmpty = document.getElementById('imagesEmpty');
            if (imagesEmpty)
                imagesEmpty.style.display = 'block';
            imagesContainer.style.display = 'none';
            return;
        }
        if (imagesCount) {
            imagesCount.textContent = `${images.length} imagen${images.length !== 1 ? 'es' : ''}`;
        }
        imagesContainer.innerHTML = images.map(image => `
      <div class="col-md-3 col-sm-6 mb-4">
        <div class="product-image-card position-relative">
          <img src="${image.url}" alt="${image.product_name || 'Imagen de producto'}" loading="lazy">

          <div class="image-actions">
            <button class="btn btn-sm btn-outline-primary" onclick="window.open('${image.url}', '_blank')" title="Ver imagen completa">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="adminPanel.deleteProductImage(${image.id})" title="Eliminar imagen">
              <i class="bi bi-trash"></i>
            </button>
          </div>

          <div class="card-body">
            <h6 class="card-title mb-2">${image.product_name || 'Sin producto'}</h6>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-${image.is_primary ? 'primary' : 'secondary'}">${image.is_primary ? 'Principal' : 'Secundaria'}</span>
              <small class="text-muted">${image.size}</small>
            </div>
            <small class="text-muted">${new Date(image.created_at).toLocaleDateString()}</small>
          </div>
        </div>
      </div>
    `).join('');
    }
    bindProductImagesEvents() {
        const productFilter = document.getElementById('productFilter');
        const sizeFilter = document.getElementById('sizeFilter');
        const statusFilter = document.getElementById('statusFilter');
        const refreshImagesBtn = document.getElementById('refreshImagesBtn');
        if (productFilter) {
            productFilter.addEventListener('change', () => this.applyImageFilters());
        }
        if (sizeFilter) {
            sizeFilter.addEventListener('change', () => this.applyImageFilters());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyImageFilters());
        }
        if (refreshImagesBtn) {
            refreshImagesBtn.addEventListener('click', () => void this.loadProductImages());
        }
        const uploadImageBtn = document.getElementById('uploadImageBtn');
        if (uploadImageBtn) {
            uploadImageBtn.addEventListener('click', () => void this.uploadProductImage());
        }
        const viewModeGrid = document.getElementById('viewModeGrid');
        const viewModeList = document.getElementById('viewModeList');
        if (viewModeGrid) {
            viewModeGrid.addEventListener('click', () => this.setViewMode('grid'));
        }
        if (viewModeList) {
            viewModeList.addEventListener('click', () => this.setViewMode('list'));
        }
    }
    applyImageFilters() {
        const productFilter = document.getElementById('productFilter');
        const sizeFilter = document.getElementById('sizeFilter');
        const statusFilter = document.getElementById('statusFilter');
        const filters = {
            productId: productFilter?.value ?? '',
            size: sizeFilter?.value ?? '',
            status: statusFilter?.value ?? ''
        };
        void this.loadProductImages(1, filters);
    }
    setViewMode(mode) {
        const viewModeGrid = document.getElementById('viewModeGrid');
        const viewModeList = document.getElementById('viewModeList');
        const imagesContainer = document.getElementById('imagesContainer');
        if (mode === 'grid') {
            viewModeGrid?.classList.add('active');
            viewModeList?.classList.remove('active');
            imagesContainer?.classList.remove('images-list-view');
        }
        else {
            viewModeGrid?.classList.remove('active');
            viewModeList?.classList.add('active');
            imagesContainer?.classList.add('images-list-view');
        }
    }
    async handleProductsSort() {
        const sortSelect = document.getElementById('sortImagesSelect');
        if (!sortSelect)
            return;
        const sortValue = sortSelect.value;
        let sortBy = 'image_count';
        let sortDirection = 'asc';
        if (sortValue === 'name_asc') {
            sortBy = 'name';
            sortDirection = 'asc';
        }
        else if (sortValue === 'name_desc') {
            sortBy = 'name';
            sortDirection = 'desc';
        }
        else if (sortValue === 'image_count') {
            sortBy = 'image_count';
            sortDirection = 'asc';
        }
        await this.loadProductsWithImageCounts(sortBy, sortDirection);
    }
    editProductImages(productId, productName) {
        this.log(`Editing images for product: ${productName} (ID: ${productId})`, 'info');
        void this.showProductImagesModal();
    }
    async uploadProductImage() {
        try {
            const uploadProductSelect = document.getElementById('uploadProductSelect');
            const imageIndex = document.getElementById('imageIndex');
            const imageFile = document.getElementById('imageFile');
            const setPrimaryImage = document.getElementById('setPrimaryImage');
            if (!uploadProductSelect.value) {
                this.showProductImagesMessage('Por favor, selecciona un producto.', 'error');
                return;
            }
            if (!imageFile.files || imageFile.files.length === 0) {
                this.showProductImagesMessage('Por favor, selecciona un archivo de imagen.', 'error');
                return;
            }
            const file = imageFile.files[0];
            if (file && file.size > 5 * 1024 * 1024) {
                this.showProductImagesMessage('El archivo debe ser menor a 5MB.', 'error');
                return;
            }
            if (file && !file.type.startsWith('image/')) {
                this.showProductImagesMessage('Por favor, selecciona un archivo de imagen válido.', 'error');
                return;
            }
            const uploadProgress = document.getElementById('uploadProgress');
            const progressBar = uploadProgress?.querySelector('.progress-bar');
            if (uploadProgress)
                uploadProgress.style.display = 'block';
            if (progressBar)
                progressBar.style.width = '0%';
            const progressInterval = setInterval(() => {
                if (progressBar) {
                    const currentWidth = parseInt(progressBar.style.width) || 0;
                    const newWidth = Math.min(currentWidth + 10, 90);
                    progressBar.style.width = `${newWidth}%`;
                }
            }, 200);
            setTimeout(() => {
                clearInterval(progressInterval);
                if (progressBar)
                    progressBar.style.width = '100%';
                setTimeout(() => {
                    if (uploadProgress)
                        uploadProgress.style.display = 'none';
                    this.showProductImagesMessage('Imagen subida exitosamente.', 'success');
                    uploadProductSelect.value = '';
                    imageIndex.value = '1';
                    imageFile.value = '';
                    setPrimaryImage.checked = false;
                    void this.loadProductImages();
                }, 500);
            }, 2000);
        }
        catch (error) {
            this.log('❌ Error uploading product image: ' + error, 'error');
            this.showProductImagesMessage('Error al subir la imagen.', 'error');
        }
    }
    showProductImagesMessage(message, type) {
        const messageArea = document.getElementById('productImagesMessageArea');
        const messageDiv = document.getElementById('productImagesMessage');
        if (messageArea && messageDiv) {
            messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type}`;
            messageDiv.textContent = message;
            messageArea.style.display = 'block';
            if (type === 'success') {
                setTimeout(() => {
                    messageArea.style.display = 'none';
                }, 3000);
            }
        }
    }
    showFallbackProductImagesModal(modalElement) {
        modalElement.style.display = 'block';
        modalElement.style.position = 'fixed';
        modalElement.style.top = '0';
        modalElement.style.left = '0';
        modalElement.style.width = '100%';
        modalElement.style.height = '100%';
        modalElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modalElement.style.zIndex = '9999';
        const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modalElement.style.display = 'none';
            });
        });
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                modalElement.style.display = 'none';
            }
        });
        this.log('✅ Fallback product images modal shown successfully', 'success');
    }
    async editProduct(id) {
        try {
            this.log(`Editing product ${id}`, 'info');
            const response = await this.api.getProductByIdWithOccasions(id);
            if (response.success && response.data) {
                void this.showProductModal(response.data.product);
            }
            else {
                this.log('Failed to load product for editing', 'error');
                alert('Error al cargar el producto para editar');
            }
        }
        catch (error) {
            this.log('Error editing product: ' + error, 'error');
            alert('Error al editar el producto');
        }
    }
    async deleteProduct(id) {
        if (confirm(`¿Está seguro de que desea eliminar el producto ${id}? Esta acción no se puede deshacer.`)) {
            try {
                this.log(`Deleting product ${id}`, 'info');
                const updateResponse = await this.api.updateProduct({
                    id: id,
                    active: false
                });
                if (updateResponse.success) {
                    this.log('Product deactivated successfully', 'success');
                    alert('Producto eliminado exitosamente');
                    await this.loadProductsData();
                }
                else {
                    this.log('Failed to delete product', 'error');
                    alert('Error al eliminar el producto');
                }
            }
            catch (error) {
                this.log('Error deleting product: ' + error, 'error');
                alert('Error al eliminar el producto');
            }
        }
    }
    viewOrder(id) {
        alert(`Ver pedido ${id} - Próximamente...`);
    }
    editUser(id) {
        window.location.href = `/pages/admin-users.html?edit=${id}`;
    }
    deleteUser(id) {
        if (confirm(`¿Eliminar usuario ${id}?`)) {
            alert('Funcionalidad de eliminar usuario próximamente...');
        }
    }
    checkPasswordStrength(password) {
        if (password.length < 8)
            return 'weak';
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        if (hasLower && hasUpper && hasNumber && password.length >= 10) {
            return 'strong';
        }
        else if ((hasLower && hasUpper) || (hasLower && hasNumber) || (hasUpper && hasNumber)) {
            return 'medium';
        }
        else {
            return 'weak';
        }
    }
    getPasswordStrengthText(strength) {
        switch (strength) {
            case 'weak': return 'Débil - Agrega mayúsculas, minúsculas y números';
            case 'medium': return 'Media - Buena, pero puede ser más fuerte';
            case 'strong': return 'Fuerte - Excelente contraseña';
        }
    }
    async saveUser() {
        try {
            const emailInput = document.getElementById('userEmail');
            const fullNameInput = document.getElementById('userFullName');
            const passwordInput = document.getElementById('userPassword');
            const phoneInput = document.getElementById('userPhone');
            const roleSelect = document.getElementById('userRole');
            const isActiveInput = document.getElementById('userIsActive');
            const emailVerifiedInput = document.getElementById('userEmailVerified');
            const saveBtn = document.getElementById('saveUserBtn');
            const errors = [];
            const email = emailInput.value.trim();
            const fullName = fullNameInput.value.trim();
            const password = passwordInput.value.trim();
            const phone = phoneInput.value.trim();
            const role = roleSelect.value;
            const isActive = isActiveInput.checked;
            const emailVerified = emailVerifiedInput.checked;
            if (!email) {
                errors.push('El email es obligatorio');
                if (!errors.length)
                    emailInput.focus();
            }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('El email no tiene un formato válido');
                if (!errors.length)
                    emailInput.focus();
            }
            if (!fullName) {
                errors.push('El nombre completo es obligatorio');
                if (!errors.length)
                    fullNameInput.focus();
            }
            else if (fullName.length < 2) {
                errors.push('El nombre debe tener al menos 2 caracteres');
                if (!errors.length)
                    fullNameInput.focus();
            }
            if (!password) {
                errors.push('La contraseña es obligatoria');
                if (!errors.length)
                    passwordInput.focus();
            }
            else {
                const strength = this.checkPasswordStrength(password);
                if (strength === 'weak') {
                    errors.push('La contraseña es muy débil. Debe tener al menos 8 caracteres con mayúsculas, minúsculas y números');
                    if (!errors.length)
                        passwordInput.focus();
                }
            }
            if (!role) {
                errors.push('Debe seleccionar un rol');
                if (!errors.length)
                    roleSelect.focus();
            }
            if (errors.length > 0) {
                this.showUserMessage('Errores de validación:\n• ' + errors.join('\n• '), 'error');
                return false;
            }
            this.hideUserMessage();
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Creando...';
            }
            const userData = {
                email,
                password,
                full_name: fullName,
                phone: phone || undefined,
                role: role,
                is_active: isActive,
                email_verified: emailVerified
            };
            this.log('Submitting user data: ' + JSON.stringify({ ...userData, password: '[HIDDEN]' }, null, 2), 'info');
            const response = await this.api.createUser(userData);
            if (response.success) {
                this.showUserMessage('✅ Usuario creado exitosamente', 'success');
                await this.loadUsersData();
                setTimeout(() => {
                    this.hideUserMessage();
                }, 3000);
                return true;
            }
            else {
                const errorMessage = response.message ?? 'Error desconocido al crear el usuario';
                this.showUserMessage(`⚠️ ${errorMessage}`, 'error');
                this.log('API returned error', 'error');
                return false;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.log('Error saving user: ' + errorMessage, 'error');
            this.showUserMessage(`⚠️ Error al crear el usuario: ${errorMessage}`, 'error');
            return false;
        }
        finally {
            const saveBtn = document.getElementById('saveUserBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Crear Usuario';
            }
        }
    }
    showUserMessage(message, type = 'error') {
        const messageArea = document.getElementById('userMessageArea');
        const messageDiv = document.getElementById('userMessage');
        if (!messageArea || !messageDiv)
            return;
        messageDiv.textContent = message;
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'warning'}`;
        messageArea.style.display = 'block';
        messageArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    hideUserMessage() {
        const messageArea = document.getElementById('userMessageArea');
        if (messageArea) {
            messageArea.style.display = 'none';
        }
    }
    async editOccasion(id) {
        try {
            this.log(`Editing occasion ${id}`, 'info');
            const response = await this.api.getOccasionById(id);
            if (response.success && response.data) {
                await this.showOccasionModal(response.data.occasion);
            }
            else {
                this.log('Failed to load occasion for editing', 'error');
                alert('Error al cargar la ocasión para editar');
            }
        }
        catch (error) {
            this.log('Error editing occasion: ' + error, 'error');
            alert('Error al editar la ocasión');
        }
    }
    deleteOccasion(id) {
        if (confirm(`¿Eliminar ocasión ${id}?`)) {
            alert('Funcionalidad de eliminar ocasión próximamente...');
        }
    }
    async deleteImage(imageId) {
        if (confirm('¿Está seguro de que desea eliminar esta imagen? Esta acción no se puede deshacer.')) {
            try {
                this.log(`Deleting image ${imageId}`, 'info');
                const response = await this.api.deleteImage(imageId);
                if (response.success) {
                    this.log('Image deleted successfully', 'success');
                    alert('Imagen eliminada exitosamente');
                    await this.loadImagesGallery();
                }
                else {
                    this.log('Failed to delete image', 'error');
                    alert('Error al eliminar la imagen');
                }
            }
            catch (error) {
                this.log('Error deleting image: ' + error, 'error');
                alert('Error al eliminar la imagen');
            }
        }
    }
    async deleteProductImage(imageId) {
        if (confirm('¿Está seguro de que desea eliminar esta imagen? Esta acción no se puede deshacer.')) {
            try {
                this.log(`Deleting product image ${imageId}`, 'info');
                setTimeout(() => {
                    this.log('Product image deleted successfully', 'success');
                    this.showProductImagesMessage('Imagen eliminada exitosamente', 'success');
                    void this.loadProductImages();
                }, 500);
            }
            catch (error) {
                this.log('Error deleting product image: ' + error, 'error');
                this.showProductImagesMessage('Error al eliminar la imagen', 'error');
            }
        }
    }
    diagnose() {
        console.log('🔍 === DIAGNÓSTICO DEL PANEL DE ADMINISTRACIÓN ===');
        const userData = localStorage.getItem('floresya_user');
        const sessionTime = localStorage.getItem('floresya_session');
        console.log('👤 Autenticación:', {
            userData: !!userData,
            sessionTime: !!sessionTime,
            currentUser: !!this.currentUser
        });
        const elements = {
            addProductBtn: !!document.getElementById('addProductBtn'),
            productsSection: !!document.getElementById('products-section'),
            loadingOverlay: !!document.getElementById('loadingOverlay'),
            adminSidebar: !!document.getElementById('adminSidebar'),
            dashboardSection: !!document.getElementById('dashboard-section')
        };
        console.log('📄 Elementos DOM:', elements);
        const bootstrap = window.bootstrap;
        console.log('🎨 Bootstrap:', {
            available: !!bootstrap,
            modal: !!(bootstrap?.Modal)
        });
        const activeSection = document.querySelector('.admin-section.active');
        console.log('📍 Sección activa:', activeSection ? activeSection.id : 'ninguna');
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            console.log('🔗 Event listeners en addProductBtn:', addProductBtn.onclick ? 'tiene onclick' : 'no tiene onclick');
            console.log('🔗 Button HTML:', addProductBtn.outerHTML);
        }
        console.log('🏗️ Admin Panel instance:', {
            exists: !!window.adminPanel,
            isThisInstance: window.adminPanel === this
        });
        console.log('=====================================');
        console.log('💡 COMANDOS DE DIAGNÓSTICO:');
        console.log('   - adminPanel.diagnose() - Estado general');
        console.log('   - adminPanel.testModal() - Probar modal directamente');
        console.log('   - adminPanel.forceShowProducts() - Forzar mostrar sección productos');
        console.log('=====================================');
    }
    testModal() {
        console.log('🧪 Probando modal directamente...');
        try {
            void this.showAddProductModal();
            console.log('✅ testModal ejecutado sin errores');
        }
        catch (error) {
            console.error('❌ Error en testModal:', error);
        }
    }
    forceShowProducts() {
        console.log('🚨 Forzando mostrar sección de productos...');
        this.switchSection('products');
        setTimeout(() => {
            this.bindProductButtons();
            console.log('✅ Sección productos forzada y botones vinculados');
        }, 100);
    }
    async loadSchemaInfo() {
        this.log('📊 Cargando información del esquema...', 'info');
        try {
            this.showSchemaLoading();
            this.hideSchemaAlerts();
            const response = await this.api.request('/admin/schema/info');
            if (response.success && response.data) {
                this.displaySchemaStats(response.data);
                this.hideSchemaLoading();
                this.showSchemaSuccess('Estadísticas del esquema cargadas exitosamente');
            }
            else {
                throw new Error(response.message || 'Error desconocido');
            }
        }
        catch (error) {
            this.log('❌ Error cargando información del esquema', 'error');
            this.hideSchemaLoading();
            this.showSchemaError(error instanceof Error ? error.message : 'Error desconocido');
        }
    }
    displaySchemaStats(data) {
        const statsCard = document.getElementById('schemaStatsCard');
        const statsContent = document.getElementById('schemaStatsContent');
        if (!statsCard || !statsContent)
            return;
        const { stats, lastUpdate } = data;
        const lastUpdateDate = new Date(lastUpdate).toLocaleString();
        statsContent.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="d-flex align-items-center mb-3">
            <div class="bg-primary text-white rounded-circle p-2 me-3">
              <i class="bi bi-table"></i>
            </div>
            <div>
              <h6 class="mb-0">Total de Tablas</h6>
              <span class="text-primary fw-bold">${stats.totalTables}</span>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="d-flex align-items-center mb-3">
            <div class="bg-success text-white rounded-circle p-2 me-3">
              <i class="bi bi-database"></i>
            </div>
            <div>
              <h6 class="mb-0">Total de Registros</h6>
              <span class="text-success fw-bold">${stats.totalRecords.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="d-flex align-items-center mb-3">
            <div class="bg-warning text-white rounded-circle p-2 me-3">
              <i class="bi bi-lightning"></i>
            </div>
            <div>
              <h6 class="mb-0">Total de Índices</h6>
              <span class="text-warning fw-bold">${stats.totalIndexes}</span>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="d-flex align-items-center mb-3">
            <div class="bg-info text-white rounded-circle p-2 me-3">
              <i class="bi bi-shield-check"></i>
            </div>
            <div>
              <h6 class="mb-0">Total de Constraints</h6>
              <span class="text-info fw-bold">${stats.totalConstraints}</span>
            </div>
          </div>
        </div>
      </div>
      <hr>
      <div class="row">
        <div class="col-md-6">
          <small class="text-muted">
            <i class="bi bi-calendar3 me-1"></i>
            Última extracción: ${new Date(stats.extractionDate).toLocaleString()}
          </small>
        </div>
        <div class="col-md-6">
          <small class="text-muted">
            <i class="bi bi-clock me-1"></i>
            Última actualización: ${lastUpdateDate}
          </small>
        </div>
      </div>
      <div class="mt-2">
        <small class="text-muted">
          <i class="bi bi-tag me-1"></i>
          Versión: ${stats.version}
        </small>
      </div>
    `;
        statsCard.style.display = 'block';
    }
    async viewSchemaSQL() {
        this.log('📜 Cargando esquema SQL completo...', 'info');
        try {
            this.showSchemaLoading();
            this.hideSchemaAlerts();
            const response = await this.api.request('/admin/schema/extract');
            if (response.success && response.data) {
                this.displaySchemaSQL(response.data.schema);
                this.hideSchemaLoading();
                this.showSchemaSuccess('Esquema SQL cargado exitosamente');
            }
            else {
                throw new Error(response.message || 'Error desconocido');
            }
        }
        catch (error) {
            this.log('❌ Error cargando esquema SQL', 'error');
            this.hideSchemaLoading();
            this.showSchemaError(error instanceof Error ? error.message : 'Error desconocido');
        }
    }
    displaySchemaSQL(schema) {
        const sqlCard = document.getElementById('schemaSQLCard');
        const sqlContent = document.getElementById('schemaSQLContent');
        if (!sqlCard || !sqlContent)
            return;
        sqlContent.textContent = schema;
        sqlCard.style.display = 'block';
    }
    async updateSchemaFile() {
        this.log('🔄 Actualizando archivo de esquema...', 'info');
        try {
            this.showSchemaLoading();
            this.hideSchemaAlerts();
            const response = await this.api.request('/admin/schema/update-file', {
                method: 'POST'
            });
            if (response.success && response.data) {
                this.hideSchemaLoading();
                this.showSchemaSuccess(`Archivo ${response.data.filePath} actualizado exitosamente`);
                this.log('✅ Archivo de esquema actualizado', 'success');
            }
            else {
                throw new Error(response.message || 'Error desconocido');
            }
        }
        catch (error) {
            this.log('❌ Error actualizando archivo de esquema', 'error');
            this.hideSchemaLoading();
            this.showSchemaError(error instanceof Error ? error.message : 'Error desconocido');
        }
    }
    async downloadSchemaSQL() {
        this.log('📥 Descargando esquema SQL...', 'info');
        try {
            this.showSchemaLoading();
            const response = await fetch('/api/admin/schema/extract?format=sql', {
                headers: {
                    'Accept': 'text/plain'
                }
            });
            if (response.ok) {
                const schema = await response.text();
                const blob = new Blob([schema], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `supabase_schema_${new Date().toISOString().split('T')[0]}.sql`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                this.hideSchemaLoading();
                this.showSchemaSuccess('Esquema SQL descargado exitosamente');
                this.log('✅ Esquema SQL descargado', 'success');
            }
            else {
                throw new Error('Error en la descarga');
            }
        }
        catch (error) {
            this.log('❌ Error descargando esquema SQL', 'error');
            this.hideSchemaLoading();
            this.showSchemaError(error instanceof Error ? error.message : 'Error desconocido');
        }
    }
    async copySchemaSQLToClipboard() {
        const sqlContent = document.getElementById('schemaSQLContent');
        if (!sqlContent?.textContent) {
            this.showSchemaError('No hay contenido SQL para copiar. Primero carga el esquema.');
            return;
        }
        try {
            await navigator.clipboard.writeText(sqlContent.textContent);
            this.showSchemaSuccess('Esquema SQL copiado al portapapeles');
            this.log('✅ Esquema SQL copiado al portapapeles', 'success');
            const copyBtn = document.getElementById('copySchemaSQLBtn');
            if (copyBtn) {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="bi bi-check"></i> Copiado';
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            }
        }
        catch (error) {
            this.log('❌ Error copiando al portapapeles', 'error');
            this.showSchemaError('Error al copiar al portapapeles');
        }
    }
    showSchemaLoading() {
        const loading = document.getElementById('schemaLoadingIndicator');
        if (loading)
            loading.style.display = 'block';
    }
    hideSchemaLoading() {
        const loading = document.getElementById('schemaLoadingIndicator');
        if (loading)
            loading.style.display = 'none';
    }
    hideSchemaAlerts() {
        const errorAlert = document.getElementById('schemaErrorAlert');
        const successAlert = document.getElementById('schemaSuccessAlert');
        if (errorAlert)
            errorAlert.style.display = 'none';
        if (successAlert)
            successAlert.style.display = 'none';
    }
    showSchemaSuccess(message) {
        const successAlert = document.getElementById('schemaSuccessAlert');
        const successMessage = document.getElementById('schemaSuccessMessage');
        if (successAlert && successMessage) {
            successMessage.textContent = message;
            successAlert.style.display = 'block';
            setTimeout(() => {
                successAlert.style.display = 'none';
            }, 5000);
        }
    }
    showSchemaError(message) {
        const errorAlert = document.getElementById('schemaErrorAlert');
        const errorMessage = document.getElementById('schemaErrorMessage');
        if (errorAlert && errorMessage) {
            errorMessage.textContent = message;
            errorAlert.style.display = 'block';
            setTimeout(() => {
                errorAlert.style.display = 'none';
            }, 10000);
        }
    }
}
export const adminPanel = new AdminPanel();
window.adminPanel = adminPanel;
