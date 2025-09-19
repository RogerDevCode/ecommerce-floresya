/**
 * 🌸 FloresYa Admin Panel - TypeScript Edition
 * Complete admin panel with role validation and CRUD operations
 */

// Define basic types for admin panel
interface AdminUser {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
}


interface AdminOrder {
  id: number;
  customer_name: string;
  customer_email?: string;
  total_amount_usd: number;
  total_amount_ves?: number;
  status: string;
  created_at: string;
  delivery_date?: string;
  items_count?: number;
}

interface OrdersFilters {
  status?: string;
  customer_email?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: string;
  sort_direction?: string;
}

interface OrdersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OrdersData {
  orders: AdminOrder[];
  pagination: OrdersPagination;
}

interface OrderItemDetails {
  product_name: string;
  product_summary?: string;
  quantity: number;
  unit_price_usd?: number;
  subtotal_usd: number;
}

interface OrderStatusHistoryItem {
  new_status: string;
  created_at: string;
  notes?: string;
}

interface OrderDetails {
  id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  user_id?: number;
  delivery_address: string;
  delivery_city?: string;
  delivery_date?: string;
  delivery_time_slot?: string;
  delivery_notes?: string;
  status: string;
  total_amount_usd?: number;
  total_amount_ves?: number;
  payment_status?: string;
  payment_method?: string;
  payment_date?: string;
  admin_notes?: string;
  created_at: string;
  items: OrderItemDetails[];
  status_history: OrderStatusHistoryItem[];
}

interface AdminOccasion {
  id: number;
  name: string;
  type: string;
  display_order: number;
  is_active: boolean;
}

import { FloresYaAPI } from './services/api.js';
import type { Product, Occasion, OccasionType } from '../config/supabase.js';
import type { WindowWithBootstrap } from '../types/globals.js';

// Admin Panel Class
export class AdminPanel {
  private api: FloresYaAPI;
  private currentUser: AdminUser | null = null;
  private currentSection = 'dashboard';
  private hoverIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.api = new FloresYaAPI();
  }

  /**
   * Initialize the admin panel
   */
  public async init(): Promise<void> {
    try {
      this.log('Starting admin panel initialization', 'info');

      // Wait a bit to ensure DOM is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify that essential DOM elements exist
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

      // Check if user is authenticated and has admin role
      const isAuthenticated = await this.checkAuthentication();
      this.log(`Authentication check result: ${isAuthenticated}`, 'info');

      if (!isAuthenticated) {
        this.log('User not authenticated, redirecting to login', 'warn');
        this.hideLoading();
        this.redirectToLogin();
        return;
      }

      // Check if user has admin role
      const hasAdminRole = await this.checkAdminRole();
      this.log(`Admin role check result: ${hasAdminRole}`, 'info');

      if (!hasAdminRole) {
        this.log('User does not have admin role, showing access denied', 'warn');
        this.hideLoading();
        this.showAccessDenied();
        return;
      }

      // Initialize UI components
      this.bindEvents();

      // 🔧 CRITICAL: Bind product buttons immediately after DOM is ready
      this.bindProductButtons();

      // 🔧 CRITICAL: Ensure SIDEBAR is visible first
      const sidebar = document.getElementById('adminSidebar');
      if (sidebar) {
        this.log(`🔍 SIDEBAR BEFORE forcing visibility - display: ${(sidebar as HTMLElement).style.display}, computed: ${window.getComputedStyle(sidebar).display}, classes: ${sidebar.className}`, 'warn');

        // Force sidebar visibility with maximum priority
        (sidebar as HTMLElement).style.display = 'block !important';
        (sidebar as HTMLElement).style.visibility = 'visible !important';
        (sidebar as HTMLElement).style.opacity = '1 !important';
        (sidebar as HTMLElement).style.position = 'relative !important';
        (sidebar as HTMLElement).style.width = 'auto !important';
        (sidebar as HTMLElement).style.minHeight = '100vh !important';

        // Remove any hide classes that might be applied
        sidebar.classList.remove('d-none', 'd-md-none', 'd-lg-none');
        sidebar.classList.add('d-block', 'emergency-visible');

        this.log(`✅ SIDEBAR FORCED VISIBLE - display: ${(sidebar as HTMLElement).style.display}, computed: ${window.getComputedStyle(sidebar).display}`, 'success');
      } else {
        this.log('❌ CRITICAL: adminSidebar element not found!', 'error');
      }

      // Ensure dashboard is visible and active - with force visibility
      const dashboardSection = document.getElementById('dashboard-section');
      if (dashboardSection) {
        (dashboardSection as HTMLElement).style.display = 'block !important';
        (dashboardSection as HTMLElement).style.visibility = 'visible';
        (dashboardSection as HTMLElement).style.opacity = '1';
        dashboardSection.classList.add('active');
        this.log('Dashboard section forced visible with !important', 'info');
      }

      // Load data first, then hide loading
      await this.loadDashboardData();

      // Final check to ensure dashboard stays visible after loading data
      setTimeout(() => {
        const dashboardCheck = document.getElementById('dashboard-section');
        if (dashboardCheck) {
          (dashboardCheck as HTMLElement).style.display = 'block';
          dashboardCheck.classList.add('active');
          this.log('Dashboard visibility double-checked after data load', 'info');
        }

        // 🔍 CRITICAL: Double-check sidebar visibility after initialization
        const sidebarCheck = document.getElementById('adminSidebar');
        if (sidebarCheck) {
          const computedStyle = window.getComputedStyle(sidebarCheck);
          this.log(`🔍 SIDEBAR FINAL CHECK - display: ${(sidebarCheck as HTMLElement).style.display}, computed: ${computedStyle.display}, visibility: ${computedStyle.visibility}, classes: ${sidebarCheck.className}`, 'warn');

          // Force visibility one more time if needed
          if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            (sidebarCheck as HTMLElement).style.display = 'block !important';
            (sidebarCheck as HTMLElement).style.visibility = 'visible !important';
            this.log('🚨 SIDEBAR WAS HIDDEN - FORCED VISIBLE AGAIN', 'error');
          } else {
            this.log('✅ SIDEBAR REMAINS VISIBLE after final check', 'success');
          }
        } else {
          this.log('❌ SIDEBAR ELEMENT LOST after initialization!', 'error');
        }
      }, 100);

      // CRITICAL: Final state verification before completing initialization
      const finalState = {
        loadingOverlayVisible: document.getElementById('loadingOverlay')?.style.display !== 'none',
        mainContentVisible: document.getElementById('main-content')?.style.display !== 'none',
        dashboardVisible: document.getElementById('dashboard-section')?.style.display !== 'none',
        adminPanelExists: !!window.adminPanel
      };
      this.log('🔍 CRITICAL: Final state before hideLoading() ' + JSON.stringify(finalState), 'warn');

      this.hideLoading();

      // Verify state immediately after hideLoading
      const postHideState = {
        loadingOverlayVisible: document.getElementById('loadingOverlay')?.style.display !== 'none',
        mainContentVisible: document.getElementById('main-content')?.style.display !== 'none',
        dashboardVisible: document.getElementById('dashboard-section')?.style.display !== 'none'
      };
      this.log('🔍 CRITICAL: State after hideLoading() ' + JSON.stringify(postHideState), 'warn');

      this.log('Admin panel initialized successfully', 'success');

    } catch (error) {
      this.hideLoading();
      this.log('Failed to initialize admin panel: ' + error, 'error');
      this.showError('Error al inicializar el panel de administración');
    }
  }

  /**
   * Check if user is authenticated
   */
  private async checkAuthentication(): Promise<boolean> {
    try {
      this.log('🔍 Verificando autenticación...', 'info');

      // Check for user session in localStorage
      const userData = localStorage.getItem('floresya_user');
      const sessionTime = localStorage.getItem('floresya_session');

      this.log(`📊 Datos encontrados - Usuario: ${!!userData}, Sesión: ${!!sessionTime}`, 'info');

      if (!userData || !sessionTime) {
        this.log('❌ Datos de sesión faltantes', 'warn');
        return false;
      }

      // Check if session is still valid (24 hours)
      const sessionAge = Date.now() - parseInt(sessionTime ?? '0');
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge > maxAge) {
        this.log('⏰ Sesión expirada, limpiando datos', 'warn');
        // Session expired, clear it
        localStorage.removeItem('floresya_user');
        localStorage.removeItem('floresya_session');
        return false;
      }

      // Parse user data
      const user = JSON.parse(userData);
      this.currentUser = user;

      this.log(`✅ Usuario autenticado: ${user.email} (Rol: ${user.role})`, 'success');
      return true;
    } catch (error) {
      this.log('❌ Error verificando autenticación: ' + error, 'error');
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Check if current user has admin role
   */
  private async checkAdminRole(): Promise<boolean> {
    try {
      if (!this.currentUser) {
        this.log('❌ No hay usuario actual para verificar rol', 'error');
        return false;
      }

      const isAdmin = this.currentUser.role === 'admin';
      this.log(`🔍 Verificando rol de admin - Usuario: ${this.currentUser.email}, Rol: ${this.currentUser.role}, Es Admin: ${isAdmin}`, 'info');

      if (!isAdmin) {
        this.log('🚫 Usuario no tiene rol de administrador', 'warn');
      } else {
        this.log('✅ Usuario tiene rol de administrador', 'success');
      }

      return isAdmin;
    } catch (error) {
      this.log('❌ Error verificando rol de admin: ' + error, 'error');
      console.error('Admin role check failed:', error);
      return false;
    }
  }

  /**
   * Bind all event listeners using event delegation for better performance and reliability
   */
  private bindEvents(): void {
    // Use event delegation on the main admin container for better performance
    const adminContainer = document.getElementById('adminPanel');

    if (!adminContainer) {
      this.log('❌ Admin container not found for event delegation - RETRYING in 500ms', 'error');

      // Retry after a short delay to handle timing issues
      setTimeout(() => {
        this.bindEvents();
      }, 500);
      return;
    }

    // Remove any existing event listeners to prevent duplicates
    const newContainer = adminContainer.cloneNode(true) as HTMLElement;
    adminContainer.parentNode?.replaceChild(newContainer, adminContainer);

    // Bind event delegation to the fresh container
    newContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Sidebar navigation links
      if (target.matches('.sidebar-nav .nav-link') || target.closest('.sidebar-nav .nav-link')) {
        e.preventDefault();
        const link = target.closest('.sidebar-nav .nav-link') as HTMLElement;
        const section = link?.dataset.section ?? '';
        if (section) {
          this.switchSection(section);
        }
      }

      // Mobile sidebar toggle
      if (target.matches('#sidebarToggle') || target.closest('#sidebarToggle')) {
        const sidebar = document.getElementById('adminSidebar');
        sidebar?.classList.toggle('show');
      }

      // Logout button
      if (target.matches('#logoutBtn') || target.closest('#logoutBtn')) {
        this.logout();
      }

      // Back to site button
      if (target.matches('#backToSite') || target.closest('#backToSite')) {
        window.location.href = '/';
      }

      // Product management buttons
      if (target.matches('#addProductBtn') || target.closest('#addProductBtn')) {
        e.preventDefault();
        this.log('🖱️ addProductBtn clicked via delegation, calling showAddProductModal', 'info');
        try {
          void this.showAddProductModal();
        } catch (error) {
          this.log('❌ Error in showAddProductModal: ' + error, 'error');
          console.error('Error calling showAddProductModal:', error);
        }
      }

      // User management buttons
      if (target.matches('#addUserBtn') || target.closest('#addUserBtn')) {
        e.preventDefault();
        e.stopPropagation();
        this.log('🖱️ addUserBtn clicked via delegation, calling showAddUserModal', 'info');
        try {
          void this.showAddUserModal();
        } catch (error) {
          this.log('❌ Error in showAddUserModal: ' + error, 'error');
          console.error('Error calling showAddUserModal:', error);
          // Fallback: try to show modal directly
          const userModal = document.getElementById('userModal');
          if (userModal && window.bootstrap?.Modal) {
            try {
              const Modal = window.bootstrap.Modal as unknown as new (element: Element) => { show(): void };
              const modal = new Modal(userModal);
              modal.show();
              this.log('✅ Fallback: Modal shown directly', 'info');
            } catch (fallbackError) {
              this.log('❌ Fallback modal failed: ' + fallbackError, 'error');
            }
          }
        }
      }

      // Occasion management buttons
      if (target.matches('#addOccasionBtn') || target.closest('#addOccasionBtn')) {
        this.showAddOccasionModal();
      }

      // Image management buttons
      if (target.matches('#manageProductImagesBtn') || target.closest('#manageProductImagesBtn')) {
        e.preventDefault();
        this.log('🖱️ manageProductImagesBtn clicked via delegation, calling showProductImagesModal', 'info');
        try {
          void this.showProductImagesModal();
        } catch (error) {
          this.log('❌ Error in showProductImagesModal: ' + error, 'error');
          console.error('Error calling showProductImagesModal:', error);
        }
      }

      // Schema management buttons
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

  /**
   * Bind product management buttons (called after products section is loaded)
   * Note: Event handling is now done via event delegation in bindEvents()
   */
  private bindProductButtons(): void {
    this.log('🔧 Product management buttons bound via event delegation', 'info');
    // Event handling is now managed by the event delegation in bindEvents()
    // This method is kept for future extensibility and logging purposes
  }

  /**
   * Bind user management buttons (called after users section is loaded)
   * Uses both event delegation and direct binding for maximum reliability
   */
  private bindUserButtons(): void {
    this.log('🔧 Binding user management buttons with dual approach', 'info');

    // First, ensure event delegation is working
    const adminContainer = document.getElementById('adminPanel');
    if (!adminContainer) {
      this.log('❌ Admin container not found for user button binding', 'error');
      return;
    }

    // Direct binding as backup to event delegation
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
      this.log('✅ addUserBtn found, setting up direct event listener', 'info');

      // Remove any existing listeners to prevent duplicates
      const newBtn = addUserBtn.cloneNode(true) as HTMLElement;
      addUserBtn.parentNode?.replaceChild(newBtn, addUserBtn);

      // Add direct event listener
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling to delegation
        this.log('🖱️ addUserBtn clicked via direct binding, calling showAddUserModal', 'info');
        try {
          void this.showAddUserModal();
        } catch (error) {
          this.log('❌ Error in showAddUserModal: ' + error, 'error');
          console.error('Error calling showAddUserModal:', error);
        }
      });

      this.log('✅ Direct event listener attached to addUserBtn', 'success');
    } else {
      this.log('❌ addUserBtn not found in DOM', 'error');
    }

    // Also ensure the modal exists and is properly configured
    const userModal = document.getElementById('userModal');
    if (!userModal) {
      this.log('❌ userModal not found in DOM', 'error');
    } else {
      this.log('✅ userModal found and ready', 'info');
    }
  }

  /**
   * Switch between admin sections
   */
  private switchSection(section: string): void {
    // If we're already on the target section, don't do anything
    if (this.currentSection === section) {
      this.log(`Already on section: ${section}`, 'info');
      return;
    }

    this.log(`Switching to section: ${section}`, 'info');

    // Update active nav link
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[data-section="${section}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }

    // Hide all sections except the target section
    document.querySelectorAll('.admin-section').forEach(sec => {
      const sectionElement = sec as HTMLElement;
      const sectionId = sectionElement.id;

      if (sectionId === `${section}-section`) {
        // Show target section with force visibility
        sectionElement.style.display = 'block';
        sectionElement.style.visibility = 'visible';
        sectionElement.style.opacity = '1';
        sectionElement.classList.add('active');
        this.log(`Section ${section} made visible`, 'info');
      } else {
        // Hide other sections
        sectionElement.style.display = 'none';
        sectionElement.classList.remove('active');
      }
    });

    // Update page title
    this.updatePageTitle(section);

    // Load section data
    void this.loadSectionData(section);

    this.currentSection = section;
  }

  /**
   * Update page title and subtitle
   */
  private updatePageTitle(section: string): void {
    const titles: { [key: string]: { title: string; subtitle: string } } = {
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

    if (titleElement && titleData) titleElement.textContent = titleData.title;
    if (subtitleElement && titleData) subtitleElement.textContent = titleData.subtitle;
  }

  /**
   * Load data for specific section
   */
  private async loadSectionData(section: string): Promise<void> {
    switch (section) {
      case 'dashboard':
        await this.loadDashboardData();
        break;
      case 'products':
        await this.loadProductsData();
        break;
      case 'orders':
        await this.loadOrdersData();
        this.bindOrdersEvents();
        break;
      case 'users':
        await this.loadUsersData();
        // Ensure user buttons are properly bound after loading users section
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

  /**
   * Load dashboard metrics and data
   */
  private async loadDashboardData(): Promise<void> {
    try {
      // Mock data for demonstration
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

    } catch (error) {
      this.log('Error loading dashboard data: ' + error, 'error');
    }
  }

  /**
   * Load products data
   */
  private async loadProductsData(): Promise<void> {
    try {
      this.log('Loading products from API...', 'info');

      // Use real API instead of mock data
      const response = await this.api.getProducts({
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_direction: 'desc'
      });

      if (response.success && response.data) {
        this.log(`Loaded ${response.data.products.length} products from API`, 'success');
        this.renderProductsTable(response.data.products);

        // Bind product management buttons after DOM is ready
        this.bindProductButtons();
      } else {
        this.log('Failed to load products from API', 'error');
        this.renderProductsTable([]);

        // Still bind buttons even if no products loaded
        this.bindProductButtons();
      }
    } catch (error) {
      this.log('Error loading products: ' + error, 'error');
      this.renderProductsTable([]);
    }
  }

  /**
   * Load orders data with enhanced filtering and pagination
   */
  private async loadOrdersData(page: number = 1, filters: OrdersFilters = {}): Promise<void> {
    try {
      this.showOrdersLoading();

      // Build query parameters
      const queryParams = {
        page,
        limit: 20,
        ...filters
      };

      this.log(`Loading orders with params: ${JSON.stringify(queryParams)}`, 'info');

      // For now, use mock data since API is not implemented yet
      // TODO: Implement real API call when backend is ready
      const ordersData = this.getMockOrdersData(queryParams);
      this.log(`Loaded ${ordersData.orders.length} orders from mock data`, 'info');

      // Update stats
      this.updateOrdersStats(ordersData.orders);

      // Render table
      this.renderOrdersTable(ordersData.orders);

      // Render pagination
      this.renderOrdersPagination(ordersData.pagination);

      // Update filter info
      this.updateOrdersFilterInfo(filters, ordersData.orders.length);

    } catch (error) {
      this.log('Error loading orders: ' + error, 'error');
      this.showOrdersError('Error al cargar los pedidos');
    } finally {
      this.hideOrdersLoading();
    }
  }

  /**
   * Load users data
   */
  private async loadUsersData(): Promise<void> {
    try {
      // Mock data for demonstration
      const mockUsers: AdminUser[] = [
        { id: 1, email: 'admin@floresya.com', full_name: 'Administrador', role: 'admin', is_active: true },
        { id: 2, email: 'cliente@floresya.com', full_name: 'Cliente de Prueba', role: 'user', is_active: true }
      ];
      this.renderUsersTable(mockUsers);

      // Bind user management buttons after DOM is ready
      this.bindUserButtons();
    } catch (error) {
      this.log('Error loading users: ' + error, 'error');
    }
  }

  /**
   * Load occasions data
   */
  private async loadOccasionsData(): Promise<void> {
    try {
      // Mock data for demonstration
      const mockOccasions: AdminOccasion[] = [
        { id: 1, name: 'Cumpleaños', type: 'birthday', display_order: 1, is_active: true },
        { id: 2, name: 'Aniversario', type: 'anniversary', display_order: 2, is_active: true },
        { id: 3, name: 'Boda', type: 'wedding', display_order: 3, is_active: true }
      ];
      this.renderOccasionsTable(mockOccasions);
    } catch (error) {
      this.log('Error loading occasions: ' + error, 'error');
    }
  }

  /**
    * Load images data
    */
  private async loadImagesData(): Promise<void> {
    try {
      this.log('Loading images data...', 'info');

      // Load current site images
      await this.loadCurrentSiteImages();

      // Load products with image counts for the table with default filters
      await this.loadProductsWithImageCounts('image_count', 'asc', {
        productStatus: 'active',
        imageStatus: 'active',
        occasion: 'general'
      });

      // Bind image management events
      this.bindImageEvents();

      this.log('Images data loaded successfully', 'success');
    } catch (error) {
      this.log('Error loading images data: ' + error, 'error');
    }
  }

  /**
   * Load current site images (hero and logo)
   */
  private async loadCurrentSiteImages(): Promise<void> {
    try {
      const response = await this.api.getCurrentSiteImages();

      if (response.success && response.data) {
        // Update hero image preview
        const heroPreview = document.getElementById('heroImagePreview');
        if (heroPreview) {
          const img = heroPreview.querySelector('img');
          if (img) img.src = response.data.hero;
        }

        // Update logo preview
        const logoPreview = document.getElementById('logoPreview');
        if (logoPreview) {
          const img = logoPreview.querySelector('img');
          if (img) img.src = response.data.logo;
        }

        this.log('Current site images loaded', 'success');
      }
    } catch (error) {
      this.log('Error loading current site images: ' + error, 'error');
    }
  }

  /**
    * Load images gallery
    */
  private async loadImagesGallery(filter: 'all' | 'used' | 'unused' = 'all'): Promise<void> {
    try {
      const response = await this.api.getImagesGallery({ filter, page: 1, limit: 20 });

      if (response.success && response.data) {
        this.renderImagesGallery(response.data.images);
        this.log(`Loaded ${response.data.images.length} images for gallery`, 'success');
      } else {
        this.renderImagesGallery([]);
        this.log('Failed to load images gallery', 'error');
      }
    } catch (error) {
      this.log('Error loading images gallery: ' + error, 'error');
      this.renderImagesGallery([]);
    }
  }

  /**
    * Load products with image counts with enhanced filtering
    */
  private async loadProductsWithImageCounts(sortBy: 'name' | 'image_count' = 'image_count', sortDirection: 'asc' | 'desc' = 'asc', filters: {
    productStatus?: 'active' | 'inactive' | 'all';
    imageStatus?: 'active' | 'inactive' | 'all';
    occasion?: string;
  } = {}): Promise<void> {
    try {
      this.log('Loading products with image counts with filters...', 'info');

      // Build query parameters
      const queryParams: {
        sort_by: 'name' | 'image_count';
        sort_direction: 'asc' | 'desc';
        include_image_counts: boolean;
        active?: boolean;
        occasion?: string;
      } = {
        sort_by: sortBy,
        sort_direction: sortDirection,
        include_image_counts: true
      };

      // Add product status filter
      if (filters.productStatus && filters.productStatus !== 'all') {
        queryParams.active = filters.productStatus === 'active';
      }

      // Add occasion filter
      if (filters.occasion && filters.occasion !== 'general') {
        queryParams.occasion = filters.occasion;
      }

      // For image status filter, we'll need to filter client-side since the API doesn't support it yet
      const response = await this.api.getProductsWithImageCounts(queryParams);

      if (response.success && response.data) {
        let products = response.data.products;

        // Apply client-side image status filter
        if (filters.imageStatus && filters.imageStatus !== 'all') {
          const isActive = filters.imageStatus === 'active';
          products = products.filter(product => {
            if (isActive) {
              return product.image_count > 0;
            } else {
              return product.image_count === 0;
            }
          });
        }

        this.renderProductsWithImageCounts(products);
        this.log(`Loaded ${products.length} products with image counts (filtered)`, 'success');
      } else {
        this.renderProductsWithImageCounts([]);
        this.log('Failed to load products with image counts', 'error');
      }
    } catch (error) {
      this.log('Error loading products with image counts: ' + error, 'error');
      this.renderProductsWithImageCounts([]);
    }
  }

  /**
   * Bind image management events
   */
  private bindImageEvents(): void {
    // Site images buttons
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

    // Gallery filter buttons
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

    // Product images filters
    const productStatusFilter = document.getElementById('productStatusFilter');
    const imageStatusFilter = document.getElementById('imageStatusFilter');
    const occasionFilter = document.getElementById('productOccasionFilter');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    // Sorting dropdown for products table
    const sortImagesSelect = document.getElementById('sortImagesSelect') as HTMLSelectElement;
    if (sortImagesSelect) {
      sortImagesSelect.addEventListener('change', () => {
        void this.handleProductsSort();
      });
    }

    // Apply filters button
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        void this.handleApplyFilters();
      });
    }

    // Reset filters button
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        void this.handleResetFilters();
      });
    }

    // Load occasions for filter dropdown
    void this.loadOccasionsForImageFilter();
  }

  /**
   * Update gallery filter
   */
  private async updateGalleryFilter(filter: 'all' | 'used' | 'unused'): Promise<void> {
    // Update active button state
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

    // Reload gallery with new filter
    await this.loadImagesGallery(filter);
  }

  /**
   * Show site image upload modal
   */
  private showSiteImageUploadModal(type: 'hero' | 'logo'): void {
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

    // Remove existing modal
    const existing = document.getElementById('siteImageModal');
    if (existing) existing.remove();

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modalElement = document.getElementById('siteImageModal');
    const bootstrap = (window as WindowWithBootstrap).bootstrap;
    if (modalElement && bootstrap?.Modal) {
      const Modal = bootstrap.Modal;
      const modal = new Modal(modalElement);
      modal.show();

      // Bind file input change event
      const fileInput = document.getElementById('siteImageFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            this.previewSiteImage(file);
          }
        });
      }

      // Bind upload button
      const uploadBtn = document.getElementById('uploadSiteImageBtn');
      if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
          this.uploadSiteImage(type, modal);
        });
      }
    }
  }

  /**
   * Preview site image before upload
   */
  private previewSiteImage(file: File): void {
    const previewContainer = document.getElementById('siteImagePreview');
    const previewImg = document.getElementById('previewImg') as HTMLImageElement;

    if (previewContainer && previewImg) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (previewImg && e.target?.result) {
          previewImg.src = e.target.result as string;
          previewContainer.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Upload site image
   */
  private async uploadSiteImage(type: 'hero' | 'logo', modal: { hide(): void }): Promise<void> {
    try {
      const fileInput = document.getElementById('siteImageFile') as HTMLInputElement;
      const file = fileInput.files?.[0];

      if (!file) {
        alert('Por favor selecciona una imagen');
        return;
      }

      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }

      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Solo se permiten imágenes JPEG, PNG o WebP');
        return;
      }

      // Show loading
      const uploadBtn = document.getElementById('uploadSiteImageBtn') as HTMLButtonElement;
      if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Subiendo...';
      }

      // Create FormData
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);

      // Upload image
      const response = await this.api.uploadSiteImage(formData);

      if (response.success) {
        alert(`Imagen ${type} actualizada exitosamente`);
        modal.hide();

        // Reload current site images
        await this.loadCurrentSiteImages();
      } else {
        alert('Error al subir la imagen: ' + (response.message || 'Error desconocido'));
      }

    } catch (error) {
      console.error('Error uploading site image:', error);
      alert('Error al subir la imagen');
    } finally {
      // Reset button
      const uploadBtn = document.getElementById('uploadSiteImageBtn') as HTMLButtonElement;
      if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = 'Subir Imagen';
      }
    }
  }

  /**
   * Render images gallery
   */
  private renderImagesGallery(images: Array<{
    id: number;
    product_id: number | null;
    product_name: string | null;
    size: string;
    url: string;
    file_hash: string;
    is_primary: boolean;
    created_at: string;
  }>): void {
    const galleryContainer = document.getElementById('imagesGallery');

    if (!galleryContainer) return;

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

  /**
   * Update dashboard metrics
   */
  private updateMetrics(data: { totalProducts?: number; totalOrders?: number; totalUsers?: number; totalRevenue?: number }): void {
    const totalProducts = document.getElementById('totalProducts');
    const totalOrders = document.getElementById('totalOrders');
    const totalUsers = document.getElementById('totalUsers');
    const totalRevenue = document.getElementById('totalRevenue');

    if (totalProducts) totalProducts.textContent = (data.totalProducts ?? 0).toString();
    if (totalOrders) totalOrders.textContent = (data.totalOrders ?? 0).toString();
    if (totalUsers) totalUsers.textContent = (data.totalUsers ?? 0).toString();
    if (totalRevenue) totalRevenue.textContent = `$${(data.totalRevenue ?? 0).toFixed(2)}`;
  }

  /**
   * Update alerts section
   */
  private updateAlerts(alerts: Array<{ type?: string; message: string }>): void {
    const alertsContainer = document.getElementById('alertsList');
    if (!alertsContainer) return;

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

  /**
   * Update recent activity section
   */
  private updateRecentActivity(activities: Array<{ icon?: string; description: string; time: string }>): void {
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer) return;

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

  /**
   * Render products table
   */
  private renderProductsTable(products: Product[]): void {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

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

  /**
   * Render orders table with enhanced features
   */
  private renderOrdersTable(orders: AdminOrder[]): void {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="orders-empty">
            <i class="bi bi-receipt"></i>
            <h5>No hay pedidos</h5>
            <p>No se encontraron pedidos con los filtros aplicados</p>
          </td>
        </tr>
      `;
      return;
    }

    const rows = orders.map(order => `
      <tr>
        <td>
          <strong>#${order.id}</strong>
        </td>
        <td>
          <div>
            <div class="fw-bold">${order.customer_name}</div>
            <small class="text-muted">${order.customer_email || 'Sin email'}</small>
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center">
            <i class="bi bi-basket me-2 text-muted"></i>
            <span>${order.items_count || 0} producto${(order.items_count || 0) !== 1 ? 's' : ''}</span>
          </div>
        </td>
        <td>
          <div>
            <div class="fw-bold">$${order.total_amount_usd.toFixed(2)}</div>
            ${order.total_amount_ves ? `<small class="text-muted">Bs. ${order.total_amount_ves.toLocaleString()}</small>` : ''}
          </div>
        </td>
        <td>
          <span class="badge order-status-${order.status} fs-6">
            ${this.getOrderStatusText(order.status)}
          </span>
        </td>
        <td>
          <div>
            <div>${new Date(order.created_at).toLocaleDateString()}</div>
            <small class="text-muted">${new Date(order.created_at).toLocaleTimeString()}</small>
          </div>
        </td>
        <td>
          ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '<span class="text-muted">No especificada</span>'}
        </td>
        <td>
          <div class="order-actions d-flex gap-1">
            <button class="btn btn-sm btn-outline-primary" onclick="adminPanel.viewOrderDetails(${order.id})" title="Ver detalles">
              <i class="bi bi-eye"></i>
            </button>
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Cambiar estado">
                <i class="bi bi-arrow-repeat"></i>
              </button>
              <ul class="dropdown-menu status-update-dropdown">
                <li><a class="dropdown-item" href="#" onclick="adminPanel.updateOrderStatus(${order.id}, 'pending')">
                  <i class="bi bi-clock"></i> Pendiente
                </a></li>
                <li><a class="dropdown-item" href="#" onclick="adminPanel.updateOrderStatus(${order.id}, 'confirmed')">
                  <i class="bi bi-check-circle"></i> Confirmado
                </a></li>
                <li><a class="dropdown-item" href="#" onclick="adminPanel.updateOrderStatus(${order.id}, 'preparing')">
                  <i class="bi bi-gear"></i> Preparando
                </a></li>
                <li><a class="dropdown-item" href="#" onclick="adminPanel.updateOrderStatus(${order.id}, 'ready')">
                  <i class="bi bi-box-seam"></i> Listo
                </a></li>
                <li><a class="dropdown-item" href="#" onclick="adminPanel.updateOrderStatus(${order.id}, 'delivered')">
                  <i class="bi bi-truck"></i> Entregado
                </a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#" onclick="adminPanel.updateOrderStatus(${order.id}, 'cancelled')">
                  <i class="bi bi-x-circle"></i> Cancelar
                </a></li>
              </ul>
            </div>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.innerHTML = rows;
  }

  /**
   * Show orders loading state
   */
  private showOrdersLoading(): void {
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr id="ordersLoadingRow">
          <td colspan="8" class="orders-loading">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando pedidos...</span>
            </div>
            <div class="mt-2">Cargando pedidos...</div>
          </td>
        </tr>
      `;
    }
  }

  /**
   * Hide orders loading state
   */
  private hideOrdersLoading(): void {
    const loadingRow = document.getElementById('ordersLoadingRow');
    if (loadingRow) {
      loadingRow.remove();
    }
  }

  /**
   * Show orders error state
   */
  private showOrdersError(message: string): void {
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle display-4 mb-3"></i>
            <h5>Error al cargar pedidos</h5>
            <p>${message}</p>
            <button class="btn btn-outline-primary" onclick="adminPanel.loadOrdersData()">
              <i class="bi bi-arrow-clockwise me-2"></i>Reintentar
            </button>
          </td>
        </tr>
      `;
    }
  }

  /**
   * Update orders statistics
   */
  private updateOrdersStats(orders: AdminOrder[]): void {
    const stats = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      if (stats[order.status as keyof typeof stats] !== undefined) {
        stats[order.status as keyof typeof stats]++;
      }
    });

    // Update stat cards
    const statElements = {
      pendingOrdersCount: stats.pending,
      confirmedOrdersCount: stats.confirmed,
      preparingOrdersCount: stats.preparing,
      readyOrdersCount: stats.ready,
      deliveredOrdersCount: stats.delivered,
      cancelledOrdersCount: stats.cancelled
    };

    Object.entries(statElements).forEach(([elementId, count]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = count.toString();
      }
    });
  }

  /**
   * Render orders pagination
   */
  private renderOrdersPagination(pagination: OrdersPagination): void {
    const paginationContainer = document.getElementById('ordersPagination');
    const paginationControls = document.getElementById('ordersPaginationControls');
    const paginationInfo = document.getElementById('ordersPaginationInfo');

    if (!paginationContainer || !paginationControls || !paginationInfo) return;

    if (pagination.totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }

    paginationContainer.style.display = 'flex';

    // Update pagination info
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    paginationInfo.textContent = `Mostrando ${start}-${end} de ${pagination.total} pedidos`;

    // Generate pagination controls
    let paginationHtml = '';

    // Previous button
    paginationHtml += `
      <li class="page-item ${pagination.page <= 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="adminPanel.loadOrdersData(${pagination.page - 1})">
          <i class="bi bi-chevron-left"></i>
        </a>
      </li>
    `;

    // Page numbers
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);

    if (startPage > 1) {
      paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="adminPanel.loadOrdersData(1)">1</a></li>`;
      if (startPage > 2) {
        paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHtml += `
        <li class="page-item ${i === pagination.page ? 'active' : ''}">
          <a class="page-link" href="#" onclick="adminPanel.loadOrdersData(${i})">${i}</a>
        </li>
      `;
    }

    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="adminPanel.loadOrdersData(${pagination.totalPages})">${pagination.totalPages}</a></li>`;
    }

    // Next button
    paginationHtml += `
      <li class="page-item ${pagination.page >= pagination.totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="adminPanel.loadOrdersData(${pagination.page + 1})">
          <i class="bi bi-chevron-right"></i>
        </a>
      </li>
    `;

    paginationControls.innerHTML = paginationHtml;
  }

  /**
   * Update orders filter info
   */
  private updateOrdersFilterInfo(filters: OrdersFilters, resultCount: number): void {
    const filterInfo = document.getElementById('ordersFilterInfo');
    const ordersCount = document.getElementById('ordersCount');

    if (!filterInfo || !ordersCount) return;

    // Update count
    ordersCount.textContent = `${resultCount} pedido${resultCount !== 1 ? 's' : ''}`;

    // Update filter description
    let filterText = 'Mostrando todos los pedidos';
    const activeFilters: string[] = [];

    if (filters.status) {
      activeFilters.push(`Estado: ${this.getOrderStatusText(filters.status)}`);
    }
    if (filters.date_from || filters.date_to) {
      const dateRange = [];
      if (filters.date_from) dateRange.push(`desde ${filters.date_from}`);
      if (filters.date_to) dateRange.push(`hasta ${filters.date_to}`);
      activeFilters.push(`Fecha: ${dateRange.join(' ')}`);
    }
    if (filters.search) {
      activeFilters.push(`Búsqueda: "${filters.search}"`);
    }

    if (activeFilters.length > 0) {
      filterText = `Filtros activos: ${activeFilters.join(', ')}`;
    }

    filterInfo.textContent = filterText;
  }

  /**
   * Get mock orders data for demonstration
   */
  private getMockOrdersData(queryParams: OrdersFilters & { page?: number; limit?: number }): OrdersData {
    const allOrders: AdminOrder[] = [
      {
        id: 1001,
        customer_name: 'María González',
        customer_email: 'maria@example.com',
        total_amount_usd: 45.99,
        total_amount_ves: 1800000,
        status: 'pending',
        created_at: '2024-01-15T10:30:00Z',
        delivery_date: '2024-01-16T14:00:00Z',
        items_count: 2
      },
      {
        id: 1002,
        customer_name: 'Juan Pérez',
        customer_email: 'juan@example.com',
        total_amount_usd: 78.50,
        total_amount_ves: 3100000,
        status: 'confirmed',
        created_at: '2024-01-14T15:45:00Z',
        delivery_date: '2024-01-17T10:00:00Z',
        items_count: 3
      },
      {
        id: 1003,
        customer_name: 'Ana Rodríguez',
        customer_email: 'ana@example.com',
        total_amount_usd: 125.00,
        total_amount_ves: 4900000,
        status: 'preparing',
        created_at: '2024-01-13T09:15:00Z',
        delivery_date: '2024-01-15T16:30:00Z',
        items_count: 5
      },
      {
        id: 1004,
        customer_name: 'Carlos López',
        customer_email: 'carlos@example.com',
        total_amount_usd: 32.75,
        total_amount_ves: 1280000,
        status: 'ready',
        created_at: '2024-01-12T14:20:00Z',
        delivery_date: '2024-01-14T11:00:00Z',
        items_count: 1
      },
      {
        id: 1005,
        customer_name: 'Laura Martínez',
        customer_email: 'laura@example.com',
        total_amount_usd: 89.99,
        total_amount_ves: 3520000,
        status: 'delivered',
        created_at: '2024-01-11T11:10:00Z',
        delivery_date: '2024-01-13T13:00:00Z',
        items_count: 4
      },
      {
        id: 1006,
        customer_name: 'Pedro Sánchez',
        customer_email: 'pedro@example.com',
        total_amount_usd: 67.25,
        total_amount_ves: 2630000,
        status: 'cancelled',
        created_at: '2024-01-10T16:45:00Z',
        delivery_date: '2024-01-12T15:30:00Z',
        items_count: 2
      }
    ];

    // Apply filters
    let filteredOrders = [...allOrders];

    if (queryParams.status) {
      filteredOrders = filteredOrders.filter(order => order.status === queryParams.status);
    }

    if (queryParams.search) {
      const search = queryParams.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.customer_name.toLowerCase().includes(search) ||
        order.customer_email?.toLowerCase().includes(search) ||
        order.id.toString().includes(search)
      );
    }

    if (queryParams.date_from) {
      const dateFrom = new Date(queryParams.date_from);
      filteredOrders = filteredOrders.filter(order =>
        new Date(order.created_at) >= dateFrom
      );
    }

    if (queryParams.date_to) {
      const dateTo = new Date(queryParams.date_to);
      dateTo.setHours(23, 59, 59, 999);
      filteredOrders = filteredOrders.filter(order =>
        new Date(order.created_at) <= dateTo
      );
    }

    // Apply sorting
    const sortBy = queryParams.sort_by || 'created_at';
    const sortDirection = queryParams.sort_direction || 'desc';

    filteredOrders.sort((a, b) => {
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'total_amount_usd':
          aValue = a.total_amount_usd;
          bValue = b.total_amount_usd;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'customer_name':
          aValue = a.customer_name;
          bValue = b.customer_name;
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 20;
    const total = filteredOrders.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Render users table
   */
  private renderUsersTable(users: AdminUser[]): void {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

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

  /**
    * Render occasions table
    */
  private renderOccasionsTable(occasions: AdminOccasion[]): void {
    const tbody = document.getElementById('occasionsTableBody');
    if (!tbody) return;

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

  /**
    * Render products with image counts table
    */
  private renderProductsWithImageCounts(products: Array<{
    id: number;
    name: string;
    price_usd: number;
    image_count: number;
  }>): void {
    const tbody = document.getElementById('productsImagesTableBody');
    if (!tbody) return;

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

  /**
   * Get human readable order status
   */
  private getOrderStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return statusMap[status] ?? status;
  }

  /**
   * Get human readable occasion type
   */
  private getOccasionTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      general: 'General',
      birthday: 'Cumpleaños',
      anniversary: 'Aniversario',
      wedding: 'Boda',
      sympathy: 'Condolencias',
      congratulations: 'Felicitaciones'
    };
    return typeMap[type] ?? type;
  }

  /**
   * Show loading overlay
   */
  private showLoading(): void {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      this.log('Loading overlay shown', 'info');
    } else {
      this.log('Loading overlay element not found', 'warn');
    }
  }

  /**
   * Hide loading overlay
   */
  private hideLoading(): void {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      this.log(`Loading overlay BEFORE hiding - display: ${overlay.style.display}, computed: ${window.getComputedStyle(overlay).display}`, 'info');

      overlay.style.display = 'none';

      this.log(`Loading overlay AFTER hiding - display: ${overlay.style.display}, computed: ${window.getComputedStyle(overlay).display}`, 'info');
      this.log('Loading overlay hidden', 'info');

      // Force verification that content is visible
      setTimeout(() => {
        const mainContent = document.querySelector('.admin-content main');
        if (mainContent) {
          this.log(`Main content visibility check - display: ${(mainContent as HTMLElement).style.display}, computed: ${window.getComputedStyle(mainContent).display}`, 'info');
        }

        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
          this.log(`Dashboard section visibility check - display: ${(dashboardSection as HTMLElement).style.display}, computed: ${window.getComputedStyle(dashboardSection).display}`, 'info');
        }
      }, 100);

    } else {
      this.log('Loading overlay element not found when trying to hide', 'warn');
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    // You could implement a toast notification system here
    alert(message);
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(): void {
    window.location.href = '/';
  }

  /**
   * Show access denied message with diagnostic info
   */
  private showAccessDenied(): void {
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

  /**
   * Logout user - SECURE SESSION CLEANUP
   */
  private logout(): void {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.log('🔐 Iniciando proceso seguro de logout', 'info');

      try {
        // 1. Clear ALL session data from localStorage
        this.clearAllSessionData();

        // 2. Clear current user state
        this.currentUser = null;
        this.currentSection = 'dashboard';

        // 3. Clear any intervals or timers
        this.clearAllIntervals();

        // 4. Clear any cached data
        this.clearCache();

        this.log('✅ Sesión cerrada completamente - Todos los datos eliminados', 'success');

        // 5. Redirect to home page
        window.location.href = '/';

      } catch (error) {
        this.log('❌ Error durante logout: ' + error, 'error');
        // Even if there's an error, redirect to ensure security
        window.location.href = '/';
      }
    }
  }

  /**
   * Clear ALL session data from localStorage
   */
  private clearAllSessionData(): void {
    try {
      // Clear specific session keys
      localStorage.removeItem('floresya_user');
      localStorage.removeItem('floresya_session');
      localStorage.removeItem('floresya_token');

      // Clear any other FloresYa related data
      const keysToRemove: string[] = [];
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

    } catch (error) {
      this.log('❌ Error limpiando localStorage: ' + error, 'error');
      // Try to clear everything as fallback
      try {
        localStorage.clear();
        this.log('🧹 localStorage completamente limpiado como fallback', 'warn');
      } catch (fallbackError) {
        this.log('❌ Error en fallback de limpieza: ' + fallbackError, 'error');
      }
    }
  }

  /**
   * Clear all intervals and timers
   */
  private clearAllIntervals(): void {
    try {
      // Clear hover intervals
      this.hoverIntervals.forEach((interval: NodeJS.Timeout, key: string) => {
        clearInterval(interval);
        this.log(`🕐 Intervalo limpiado: ${key}`, 'info');
      });
      this.hoverIntervals.clear();

      this.log('✅ Todos los intervalos limpiados', 'info');
    } catch (error) {
      this.log('❌ Error limpiando intervalos: ' + error, 'error');
    }
  }

  /**
   * Clear any cached data
   */
  private clearCache(): void {
    try {
      // Clear sessionStorage if used
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
        this.log('🗂️ sessionStorage limpiado', 'info');
      }

      // Clear any global variables
      if (window.floresyaApp) {
        // Reset any cached state in main app if needed
        this.log('🔄 Estado global de aplicación reseteado', 'info');
      }

    } catch (error) {
      this.log('❌ Error limpiando cache: ' + error, 'error');
    }
  }

  /**
   * Log messages
   */
  /**
   * Show modal without Bootstrap (fallback method)
   */
  private showFallbackModal(modalElement: HTMLElement): void {
    this.log('🔧 Showing fallback modal without Bootstrap', 'info');

    // Style the modal for custom display
    modalElement.style.display = 'block';
    modalElement.style.position = 'fixed';
    modalElement.style.top = '0';
    modalElement.style.left = '0';
    modalElement.style.width = '100%';
    modalElement.style.height = '100%';
    modalElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalElement.style.zIndex = '9999';
    modalElement.classList.add('show');

    // Center the modal dialog
    const modalDialog = modalElement.querySelector('.modal-dialog') as HTMLElement;
    if (modalDialog) {
      modalDialog.style.position = 'relative';
      modalDialog.style.top = '50%';
      modalDialog.style.left = '50%';
      modalDialog.style.transform = 'translate(-50%, -50%)';
      modalDialog.style.margin = '0';
    }

    // Add close functionality
    const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modalElement.style.display = 'none';
        modalElement.remove();
      });
    });

    // Close on background click
    modalElement.addEventListener('click', (e) => {
      if (e.target === modalElement) {
        modalElement.style.display = 'none';
        modalElement.remove();
      }
    });

    // Close on Escape key
    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modalElement.style.display = 'none';
        modalElement.remove();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    this.log('✅ Fallback modal shown successfully', 'success');
  }

  /**
   * Get current carousel products with details for interface
   */
  private async getCarouselProducts(): Promise<Array<{id: number; name: string; summary?: string; carousel_order: number}>> {
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
    } catch (error) {
      this.log('Error getting carousel products: ' + error, 'error');
      return [];
    }
  }

  /**
   * Get current carousel count for determining max order
   */
  private async getCurrentCarouselCount(): Promise<number> {
    const products = await this.getCarouselProducts();
    return products.length;
  }

  /**
   * Load occasions for the select dropdown
   */
  private async loadOccasions(): Promise<AdminOccasion[]> {
    try {
      const response = await this.api.getOccasions();
      if (response.success && response.data) {
        // Sort occasions alphabetically by name
        const occasions = response.data ?? [];
        return occasions
          .filter((occasion: Occasion) => occasion.is_active)
          .sort((a: Occasion, b: Occasion) => a.name.localeCompare(b.name));
      }
      return [];
    } catch (error) {
      this.log('Error loading occasions: ' + error, 'error');
      return [];
    }
  }

  /**
   * Load occasions for the image filter dropdown
   */
  private async loadOccasionsForImageFilter(): Promise<void> {
    try {
      const occasions = await this.loadOccasions();
      const occasionFilter = document.getElementById('productOccasionFilter') as HTMLSelectElement;

      if (occasionFilter) {
        // Clear existing options except the first one
        occasionFilter.innerHTML = '<option value="general">Sin ocasión específica</option>';

        // Add occasions alphabetically
        occasions.forEach(occasion => {
          const option = document.createElement('option');
          option.value = occasion.type; // Use type as value for filtering
          option.textContent = occasion.name;
          occasionFilter.appendChild(option);
        });

        this.log(`Loaded ${occasions.length} occasions for image filter dropdown`, 'info');
      }
    } catch (error) {
      this.log('Error loading occasions for image filter: ' + error, 'error');
    }
  }

  /**
   * Utility functions for text processing
   */
  private capitalizeTitle(text: string): string {
    // Smart capitalization for product names
    const prepositions = ['de', 'del', 'la', 'el', 'los', 'las', 'con', 'para', 'por', 'en', 'y', 'o'];

    return text
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        // Always capitalize first word and words that aren't prepositions
        if (index === 0 || !prepositions.includes(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      })
      .join(' ');
  }

  private removeAccents(text: string): string {
    // Remove accents and diacritical marks for better search
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, ''); // Remove other special characters except hyphens
  }

  private processProductName(name: string): { display: string; search: string } {
    const trimmed = name.trim();
    const capitalized = this.capitalizeTitle(trimmed);
    const searchable = this.removeAccents(capitalized).toLowerCase();

    return {
      display: capitalized,      // For display: "Rosa de Amor Premium"
      search: searchable        // For search: "rosa de amor premium"
    };
  }

  /**
   * Generate occasions checkboxes HTML
   */
  private generateOccasionsCheckboxes(occasions: AdminOccasion[], product?: (Product & { occasion_ids?: number[] }) | null): string {
    if (!occasions || occasions.length === 0) {
      return '<p class="text-muted">No hay ocasiones disponibles</p>';
    }

    // Get product's current occasions when editing
    const selectedOccasions = new Set<number>();
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

  /**
   * Generate carousel position radio buttons HTML
   */
  private generateCarouselPositionHTML(carouselProducts: Array<{id: number; name: string; summary?: string; carousel_order: number}>, currentProduct?: (Product & { occasion_ids?: number[] }) | null): string {
    const maxPositions = 7;
    const occupiedPositions = new Map<number, {id: number; name: string; summary?: string}>();

    // Map occupied positions
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

    // Generate positions 1-7
    for (let position = 1; position <= maxPositions; position++) {
      const occupied = occupiedPositions.get(position);
      const _isAvailable = !occupied;
      const inputId = `carouselPos${position}`;

      // Check if this position is the current product's position
      const isCurrentProductPosition = currentProduct?.carousel_order === position;
      const isChecked = isCurrentProductPosition || (position === 0 && !currentProduct?.carousel_order);

      if (occupied && !isCurrentProductPosition) {
        // Occupied position by another product - show product name and allow replacement
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
      } else if (isCurrentProductPosition) {
        // Current product's position - show as occupied by current product
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
      } else {
        // Available position
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

  /**
   * Log messages with reduced verbosity for production
   */
  private log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
    // Reduce verbosity in production - only log errors and important success messages
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    if (isProduction && level === 'warn') {
      // Skip verbose warn messages in production
      return;
    }

    if (isProduction && level === 'info') {
      // Skip info messages in production unless they're critical
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
        // Only show critical warnings
        if (message.includes('CRITICAL') || message.includes('ERROR') || message.includes('FAILED')) {
          console.warn(output);
        }
        break;
      default:
        console.log(output);
        break;
    }
  }

  // Product modal methods
  private async showAddProductModal(): Promise<void> {
    this.log('📝 showAddProductModal called - creating new product modal', 'info');
    try {
      await this.showProductModal(null);
      this.log('✅ showAddProductModal completed successfully', 'success');
    } catch (error) {
      this.log('❌ Error in showAddProductModal: ' + error, 'error');
    }
  }

  private async showEditProductModal(product: Product): Promise<void> {
    await this.showProductModal(product);
  }

  private async showProductModal(product: (Product & { occasion_ids?: number[] }) | null): Promise<void> {
    this.log('🔧 showProductModal called with product: ' + (product ? 'existing' : 'null'));

    // Load occasions for the select dropdown
    const occasions = await this.loadOccasions();
    this.log(`Loaded ${occasions.length} occasions for dropdown`, 'info');

    // Load carousel products for the position interface
    const carouselProducts = await this.getCarouselProducts();
    this.log(`Loaded ${carouselProducts.length} carousel products`, 'info');

    // Debug: Check Bootstrap availability
    const bootstrapAvailable = !!(window as WindowWithBootstrap).bootstrap;
    this.log('🔍 Bootstrap available: ' + bootstrapAvailable, 'info');

    if ((window as WindowWithBootstrap).bootstrap) {
      this.log('🔍 Bootstrap Modal available: ' + !!((window as WindowWithBootstrap).bootstrap?.Modal), 'info');
    }

    const modalTitle = product ? 'Editar Producto' : 'Crear Nuevo Producto';
    const saveButtonText = product ? 'Actualizar' : 'Crear';

    this.log('📝 Creating modal HTML for: ' + modalTitle);

    // Create occasions options HTML (unused for now - checkboxes used instead)
    const _occasionsOptions = occasions.map(occasion =>
      `<option value="${occasion.id}">${occasion.name}</option>`
    ).join('');

    // Generate carousel position HTML
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

    // Remove existing modal if present
    const existingModal = document.getElementById('productModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal with enhanced timing and fallback
    const modalElement = document.getElementById('productModal');
    this.log('🔍 Modal element found: ' + !!modalElement, 'info');

    if (!modalElement) {
      this.log('❌ Modal element not found in DOM', 'error');
      return;
    }

    let modal: { show(): void; hide(): void } | null = null;

    // Wait a bit for Bootstrap to be fully loaded
    setTimeout(() => {
      const bootstrap = (window as WindowWithBootstrap).bootstrap;

      if (bootstrap?.Modal) {
        this.log('✅ Bootstrap and Modal class available, creating modal instance', 'info');
        try {
          modal = new bootstrap.Modal(modalElement);
          this.log('✅ Modal instance created successfully', 'info');

          modal.show();
          this.log('✅ Modal.show() called successfully', 'success');

          // FORCE MODAL VISIBILITY - Critical fix for hidden modal issue
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

          // Verify modal is visible after corrections
          setTimeout(() => {
            const modalCheck = document.getElementById('productModal');
            if (modalCheck) {
              const computedStyle = window.getComputedStyle(modalCheck);
              if (computedStyle.visibility === 'visible' && computedStyle.opacity === '1') {
                this.log('✅ Modal is visible and ready', 'success');
              } else {
                this.log(`⚠️ Modal may have visibility issues - visibility: ${computedStyle.visibility}, opacity: ${computedStyle.opacity}`, 'warn');
              }
            }
          }, 200);
        } catch (error) {
          this.log('❌ Error creating or showing Bootstrap modal: ' + error, 'error');
          console.error('Bootstrap Modal error:', error);
          // Fall back to custom modal display
          this.showFallbackModal(modalElement);
        }
      } else {
        this.log('❌ Bootstrap not available - using fallback modal', 'warn');
        this.showFallbackModal(modalElement);
      }
    }, 100); // Small delay to ensure Bootstrap is ready

    // Add smart capitalization to name field
    const nameInput = document.getElementById('productName') as HTMLInputElement;
    if (nameInput) {
      nameInput.addEventListener('blur', () => {
        const processed = this.processProductName(nameInput.value);
        nameInput.value = processed.display;
        this.log(`Name processed: "${processed.display}" (searchable: "${processed.search}")`, 'info');
      });
    }

    // Handle save button
    const saveBtn = document.getElementById('saveProductBtn');
    if (saveBtn) {
      this.log('✅ Save button found, attaching event listener');
      saveBtn.addEventListener('click', async () => {
        this.log('💾 Save button clicked, calling saveProduct');
        const success = await this.saveProduct(product?.id ?? null);

        // Only hide modal if save was successful AND it's an update (not creation)
        if (success && product?.id) {
          const modalElement = document.getElementById('productModal');
          if (modalElement) {
            if (modal && typeof modal.hide === 'function') {
              modal.hide();
              this.log('✅ Bootstrap modal hidden after successful update');
            } else {
              modalElement.style.display = 'none';
              modalElement.remove();
              this.log('✅ Fallback modal hidden after successful update');
            }
          }
        } else if (success && !product?.id) {
          this.log('✅ Product created successfully - modal remains open for next product');
          // Show the "Terminar y Cerrar" button after successful creation
          const closeModalBtn = document.getElementById('closeModalBtn');
          if (closeModalBtn) {
            closeModalBtn.style.display = 'inline-block';
          }
        } else {
          this.log('⚠️ Modal remains open due to save error');
        }
      });
    } else {
      this.log('❌ Save button not found in modal');
    }

    // Handle close modal button (shown after successful creation)
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        const modalElement = document.getElementById('productModal');
        if (modalElement) {
          if (modal && typeof modal.hide === 'function') {
            modal.hide();
            this.log('✅ Modal closed by user after product creation');
          } else {
            modalElement.style.display = 'none';
            modalElement.remove();
            this.log('✅ Fallback modal closed by user after product creation');
          }
        }
      });
    }

    this.log('✅ showProductModal completed successfully');
  }

  private async saveProduct(productId: number | null): Promise<boolean> {
    try {
      // Get form elements
      const nameInput = document.getElementById('productName') as HTMLInputElement;
      const priceInput = document.getElementById('productPrice') as HTMLInputElement;
      const summaryInput = document.getElementById('productSummary') as HTMLInputElement;
      const descriptionInput = document.getElementById('productDescription') as HTMLTextAreaElement;
      const occasionsContainer = document.getElementById('productOccasions');
      const featuredInput = document.getElementById('productFeatured') as HTMLInputElement;
      const activeInput = document.getElementById('productActive') as HTMLInputElement;
      const saveBtn = document.getElementById('saveProductBtn') as HTMLButtonElement;

      // Client-side validation
      const errors: string[] = [];

      const name = nameInput.value.trim();
      const priceText = priceInput.value.trim().replace(',', '.'); // Allow comma as decimal separator
      const price_usd = parseFloat(priceText);
      const stock = 1; // Default stock for all products
      const description = descriptionInput.value.trim();

      // Debug: Log form values
      this.log(`Form values - name: "${name}", price: ${price_usd}, stock: ${stock}, description: "${description}"`, 'info');

      // Required field validation
      if (!name) {
        errors.push('El nombre del producto es obligatorio');
        nameInput.focus();
      } else if (name.length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
        nameInput.focus();
      } else if (name.length > 200) {
        errors.push('El nombre no puede exceder 200 caracteres');
        nameInput.focus();
      }

      // Price validation with decimal formatting
      if (!priceText || isNaN(price_usd) || price_usd <= 0) {
        errors.push('El precio debe ser un número positivo. Usar formato: 25.50');
        if (!errors.length) priceInput.focus();
      } else if (price_usd > 999999.99) {
        errors.push('El precio no puede exceder $999,999.99');
        if (!errors.length) priceInput.focus();
      } else {
        // Validate decimal places (max 2)
        const decimalMatch = priceText.match(/\.(\d+)$/);
        if (decimalMatch?.[1] && decimalMatch[1].length > 2) {
          errors.push('El precio no puede tener más de 2 decimales');
          if (!errors.length) priceInput.focus();
        }
      }

      if (!description) {
        errors.push('La descripción del producto es obligatoria');
        if (!errors.length) descriptionInput.focus();
      } else if (description.length < 10) {
        errors.push('La descripción debe tener al menos 10 caracteres');
        if (!errors.length) descriptionInput.focus();
      } else if (description.length > 2000) {
        errors.push('La descripción no puede exceder 2000 caracteres');
        if (!errors.length) descriptionInput.focus();
      }

      // Summary validation - required and not empty
      const summary = summaryInput.value.trim();
      this.log(`Summary value: "${summary}"`, 'info');
      if (!summary) {
        errors.push('El resumen del producto es obligatorio');
        if (!errors.length) summaryInput.focus();
      } else if (summary.length < 10) {
        errors.push('El resumen debe tener al menos 10 caracteres');
        if (!errors.length) summaryInput.focus();
      } else if (summary.length > 500) {
        errors.push('El resumen no puede exceder 500 caracteres');
        if (!errors.length) summaryInput.focus();
      }


      // Get selected occasions from checkboxes
      const selectedOccasions: number[] = [];
      if (occasionsContainer) {
        const checkboxes = occasionsContainer.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach((checkbox) => {
          const occasionId = parseInt((checkbox as HTMLInputElement).value);
          if (!isNaN(occasionId)) {
            selectedOccasions.push(occasionId);
          }
        });
      }

      // Get selected carousel position from radio buttons
      const carouselPositionRadio = document.querySelector('input[name="carouselPosition"]:checked') as HTMLInputElement;
      const carouselOrder = carouselPositionRadio ? carouselPositionRadio.value : '';
      // Carousel validation is automatic since it's radio buttons

      // Show validation errors
      if (errors.length > 0) {
        this.showProductMessage('Errores de validación:\n• ' + errors.join('\n• '), 'error');
        return false;
      }

      // Hide any previous messages
      this.hideProductMessage();

      // Disable save button and show loading state
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Guardando...';
      }

      // Prepare form data with properly formatted price
      const formData = {
        name,
        price_usd: parseFloat(price_usd.toFixed(2)), // Ensure 2 decimal places
        stock,
        summary: summary ?? undefined,
        description,
        occasion_ids: selectedOccasions, // Send array of occasion IDs
        carousel_order: carouselOrder ? parseInt(carouselOrder) : undefined,
        featured: featuredInput.checked,
        active: activeInput.checked
      };

      this.log('Submitting product data: ' + JSON.stringify(formData, null, 2), 'info');

      let response;
      if (productId) {
        // Update existing product
        response = await this.api.updateProduct({ id: productId, ...formData });
        this.log('Product updated successfully', 'success');
      } else {
        // Create new product
        response = await this.api.createProduct(formData);
        this.log('Product created successfully', 'success');
      }

      if (response.success) {
        // Success message in modal
        const successMessage = productId ? '✅ Producto actualizado exitosamente' : '✅ Producto creado exitosamente';
        this.showProductMessage(successMessage, 'success');

        // Reload products list
        await this.loadProductsData();

        // For new products (creation), keep modal open and prepare for next entry
        if (!productId) {
          this.clearProductForm();

          // Change modal title to indicate ready for next product
          const modalTitle = document.querySelector('#productModal .modal-title');
          if (modalTitle) {
            modalTitle.innerHTML = '<i class="bi bi-check-circle-fill text-success me-2"></i>Producto Creado - Listo para Crear Otro';
          }

          // Change save button text to indicate ready for next
          const saveBtn = document.getElementById('saveProductBtn') as HTMLButtonElement;
          if (saveBtn) {
            saveBtn.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Crear Otro Producto';
          }

          // Auto-hide success message after 3 seconds and reset title/button
          setTimeout(() => {
            this.hideProductMessage();

            // Reset modal title
            if (modalTitle) {
              modalTitle.innerHTML = 'Crear Nuevo Producto';
            }

            // Reset save button text
            if (saveBtn) {
              saveBtn.innerHTML = 'Crear';
            }
          }, 3000);

          // Return false to keep modal open
          return false;
        } else {
          // For updates, close modal after success
          return true;
        }
      } else {
        // API returned error - show in modal
        const errorMessage = response.message ?? 'Error desconocido al guardar el producto';
        this.showProductMessage(`⚠️ ${errorMessage}`, 'error');
        this.log('API returned error', 'error');
        return false; // Error
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.log('Error saving product: ' + errorMessage, 'error');
      this.showProductMessage(`⚠️ Error al guardar el producto: ${errorMessage}`, 'error');
      return false; // Error
    } finally {
      // Re-enable save button and restore text
      const saveBtn = document.getElementById('saveProductBtn') as HTMLButtonElement;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = productId ? 'Actualizar' : 'Crear';
      }
    }
  }

  /**
   * Show message in product modal
   */
  private showProductMessage(message: string, type: 'success' | 'error' | 'warning' = 'error'): void {
    const messageArea = document.getElementById('productMessageArea');
    const messageDiv = document.getElementById('productMessage');

    if (!messageArea || !messageDiv) return;

    // Set message and style
    messageDiv.textContent = message;
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'warning'}`;

    // Show message area
    messageArea.style.display = 'block';

    // Scroll to top of modal to ensure message is visible
    messageArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Hide message in product modal
   */
  private hideProductMessage(): void {
    const messageArea = document.getElementById('productMessageArea');
    if (messageArea) {
      messageArea.style.display = 'none';
    }
  }

  /**
   * Clear product form after successful creation
   */
  private clearProductForm(): void {
    // Hide any messages
    this.hideProductMessage();

    const formElements = [
      'productName',
      'productPrice',
      'productSummary',
      'productDescription',
    ];

    formElements.forEach(id => {
      const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
      if (element) {
        element.value = '';
      }
    });

    // Reset occasion checkboxes
    const occasionsContainer = document.getElementById('productOccasions');
    if (occasionsContainer) {
      const checkboxes = occasionsContainer.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((checkbox) => {
        (checkbox as HTMLInputElement).checked = false;
      });
    }

    // Reset carousel position radio buttons to "No incluir en carousel"
    const carouselNoneRadio = document.getElementById('carouselNone') as HTMLInputElement;
    if (carouselNoneRadio) carouselNoneRadio.checked = true;

    const featuredInput = document.getElementById('productFeatured') as HTMLInputElement;
    const activeInput = document.getElementById('productActive') as HTMLInputElement;

    if (featuredInput) featuredInput.checked = false;
    if (activeInput) activeInput.checked = true; // Default to active

    // Reset modal title to original state
    const modalTitle = document.querySelector('#productModal .modal-title');
    if (modalTitle) {
      modalTitle.innerHTML = 'Crear Nuevo Producto';
    }

    // Reset save button text to original state
    const saveBtn = document.getElementById('saveProductBtn') as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.innerHTML = 'Crear';
    }

    // Hide the "Terminar y Cerrar" button
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
      closeModalBtn.style.display = 'none';
    }

    this.log('Product form cleared after successful creation', 'info');
  }

  private async showAddUserModal(): Promise<void> {
    this.log('👤 showAddUserModal called - showing user creation modal', 'info');

    try {
      // Use the existing modal from the HTML
      const modalElement = document.getElementById('userModal');
      if (!modalElement) {
        this.log('❌ User modal element not found in DOM', 'error');
        return;
      }

      // Reset form and modal state
      this.resetUserModal();

      let modal: { show(): void; hide(): void } | null = null;

      // Wait for Bootstrap to be ready
      setTimeout(() => {
        const bootstrap = (window as WindowWithBootstrap).bootstrap;

        if (bootstrap?.Modal) {
          try {
            modal = new bootstrap.Modal(modalElement);
            modal.show();

            // Force visibility
            setTimeout(() => {
              if (modalElement) {
                modalElement.style.visibility = 'visible';
                modalElement.style.opacity = '1';
                modalElement.style.display = 'block';
                modalElement.classList.add('show');
              }
            }, 50);

            this.log('✅ User creation modal shown successfully', 'success');
          } catch (error) {
            this.log('❌ Error creating Bootstrap modal: ' + error, 'error');
            this.showFallbackModal(modalElement);
          }
        } else {
          this.log('❌ Bootstrap not available, using fallback modal', 'warn');
          this.showFallbackModal(modalElement);
        }
      }, 100);

      // Add password strength indicator
      const passwordInput = document.getElementById('userPassword') as HTMLInputElement;
      const strengthIndicator = document.getElementById('passwordStrength');

      if (passwordInput && strengthIndicator) {
        passwordInput.addEventListener('input', () => {
          const password = passwordInput.value;
          const strength = this.checkPasswordStrength(password);

          if (password.length > 0) {
            strengthIndicator.style.display = 'block';
            strengthIndicator.className = `password-strength ${strength}`;
            strengthIndicator.textContent = this.getPasswordStrengthText(strength);
          } else {
            strengthIndicator.style.display = 'none';
          }
        });
      }

      // Handle save button
      const saveBtn = document.getElementById('saveUserBtn');
      if (saveBtn) {
        // Remove existing listeners to prevent duplicates
        const newSaveBtn = saveBtn.cloneNode(true) as HTMLElement;
        saveBtn.parentNode?.replaceChild(newSaveBtn, saveBtn);

        newSaveBtn.addEventListener('click', async () => {
          this.log('💾 Save user button clicked, calling saveUser');
          const success = await this.saveUser();

          if (success) {
            // Close modal on success
            if (modal && typeof modal.hide === 'function') {
              modal.hide();
            } else if (modalElement) {
              modalElement.style.display = 'none';
            }
          }
        });
      }

    } catch (error) {
      this.log('❌ Error in showAddUserModal: ' + error, 'error');
      alert('Error al abrir el modal de creación de usuario');
    }
  }

  /**
   * Reset user modal form and state
   */
  private resetUserModal(): void {
    // Reset form
    const form = document.getElementById('userForm') as HTMLFormElement;
    if (form) form.reset();

    // Reset modal title
    const modalTitle = document.getElementById('userModalLabel');
    if (modalTitle) {
      modalTitle.textContent = 'Crear Nuevo Usuario';
    }

    // Reset password label
    const passwordLabel = document.getElementById('passwordLabel');
    if (passwordLabel) {
      passwordLabel.textContent = '(requerida para nuevo usuario)';
    }

    // Reset checkboxes to default
    const isActiveInput = document.getElementById('userIsActive') as HTMLInputElement;
    const emailVerifiedInput = document.getElementById('userEmailVerified') as HTMLInputElement;

    if (isActiveInput) isActiveInput.checked = true;
    if (emailVerifiedInput) emailVerifiedInput.checked = false;

    // Hide message area
    const messageArea = document.getElementById('userMessageArea');
    if (messageArea) {
      messageArea.style.display = 'none';
    }

    // Clear validation errors
    this.clearUserValidationErrors();

    this.log('🔄 User modal reset to creation state', 'info');
  }

  /**
   * Clear user form validation errors
   */
  private clearUserValidationErrors(): void {
    const errorFields = ['userEmail', 'userFullName', 'userPhone', 'userRole', 'userPassword'];
    errorFields.forEach(field => {
      const errorElement = document.getElementById(`${field}Error`);
      const inputElement = document.getElementById(field) as HTMLInputElement | HTMLSelectElement;

      if (errorElement) {
        errorElement.textContent = '';
      }
      if (inputElement) {
        inputElement.classList.remove('is-invalid');
      }
    });
  }

  private async showAddOccasionModal(): Promise<void> {
    this.log('📝 showAddOccasionModal called - creating new occasion modal', 'info');
    await this.showOccasionModal(null);
  }

  private async showOccasionModal(occasion: Occasion | null): Promise<void> {
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

    // Remove existing modal if present
    const existingModal = document.getElementById('occasionModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    const modalElement = document.getElementById('occasionModal');
    if (!modalElement) {
      this.log('❌ Occasion modal element not found in DOM', 'error');
      return;
    }

    setTimeout(() => {
      const bootstrap = (window as WindowWithBootstrap).bootstrap;
      if (bootstrap?.Modal) {
        try {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
          this.log('✅ Occasion modal shown successfully', 'success');

          // Slug is now generated automatically in saveOccasion method

          // Bind save button
          const saveBtn = document.getElementById('saveOccasionBtn');
          if (saveBtn) {
            saveBtn.addEventListener('click', () => {
              void this.saveOccasion(occasion?.id ?? null);
            });
          }

        } catch (error) {
          this.log('❌ Error showing occasion modal: ' + error, 'error');
        }
      } else {
        this.log('❌ Bootstrap Modal not available for occasion modal', 'error');
      }
    }, 100);
  }

  private async saveOccasion(occasionId: number | null): Promise<void> {
    try {
      const nameInput = document.getElementById('occasionName') as HTMLInputElement;
      const descriptionInput = document.getElementById('occasionDescription') as HTMLTextAreaElement;
      const activeInput = document.getElementById('occasionActive') as HTMLInputElement;

      // Validation
      const name = nameInput.value.trim();
      const description = descriptionInput.value.trim();
      const active = activeInput.checked;

      if (!name) {
        this.showOccasionMessage('Por favor, ingresa el nombre de la ocasión.', 'error');
        return;
      }

      // Generate slug automatically from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim(); // Remove leading/trailing whitespace

      // Map data correctly for the API
      const occasionData = {
        name,
        type: 'general' as OccasionType, // Default type value
        description: description || undefined,
        slug,
        is_active: active
      };

      this.showOccasionMessage('Guardando ocasión...', 'info');

      let response;
      if (occasionId) {
        // Update existing occasion
        response = await this.api.updateOccasion({
          id: occasionId,
          ...occasionData
        });
      } else {
        // Create new occasion
        response = await this.api.createOccasion(occasionData);
      }

      if (response.success) {
        this.showOccasionMessage(
          occasionId ? 'Ocasión actualizada exitosamente' : 'Ocasión creada exitosamente',
          'success'
        );

        // Close modal after success
        setTimeout(() => {
          const modal = document.getElementById('occasionModal');
          if (modal) {
            const bootstrap = (window as WindowWithBootstrap).bootstrap;
            if (bootstrap?.Modal) {
              const modalInstance = bootstrap.Modal.getInstance(modal);
              if (modalInstance) {
                modalInstance.hide();
              }
            }
          }
          // Reload occasions in the admin panel
          void this.loadOccasions();
        }, 1500);

      } else {
        this.showOccasionMessage(response.message || 'Error al guardar la ocasión', 'error');
      }

    } catch (error) {
      this.log('❌ Error saving occasion: ' + error, 'error');
      this.showOccasionMessage('Error al guardar la ocasión', 'error');
    }
  }

  private showOccasionMessage(message: string, type: 'success' | 'error' | 'info'): void {
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

  /**
   * Show product images management modal
   */
  private async showProductImagesModal(): Promise<void> {
    this.log('🖼️ showProductImagesModal called - showing image management modal', 'info');

    try {
      // Use the existing modal from the HTML
      const modalElement = document.getElementById('productImagesModal');
      if (!modalElement) {
        this.log('❌ productImagesModal element not found in DOM', 'error');
        this.showError('Modal de gestión de imágenes no encontrado');
        return;
      }

      // Reset modal state
      this.resetProductImagesModal();

      // Load products for dropdowns
      await this.loadProductsForImageModal();

      // Load initial images
      await this.loadProductImages();

      // Bind modal events
      this.bindProductImagesEvents();

      // Show modal using Bootstrap
      const bootstrap = (window as WindowWithBootstrap).bootstrap;
      if (bootstrap?.Modal) {
        try {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
          this.log('✅ Product images modal shown successfully', 'success');

          // Force modal visibility after a delay
          setTimeout(() => {
            if (modalElement) {
              (modalElement as HTMLElement).style.visibility = 'visible';
              (modalElement as HTMLElement).style.opacity = '1';
              (modalElement as HTMLElement).style.display = 'block';
              modalElement.classList.add('show');
              this.log('🔧 FORCED product images modal visibility', 'info');
            }
          }, 50);

        } catch (error) {
          this.log('❌ Error showing product images modal with Bootstrap: ' + error, 'error');
          this.showFallbackProductImagesModal(modalElement);
        }
      } else {
        this.log('❌ Bootstrap Modal not available for product images modal', 'error');
        this.showFallbackProductImagesModal(modalElement);
      }

    } catch (error) {
      this.log('❌ Error in showProductImagesModal: ' + error, 'error');
      this.showError('Error al abrir el modal de gestión de imágenes');
    }
  }

  /**
   * Reset product images modal form and state
   */
  private resetProductImagesModal(): void {
    // Reset filters
    const productFilter = document.getElementById('productFilter') as HTMLSelectElement;
    const sizeFilter = document.getElementById('sizeFilter') as HTMLSelectElement;
    const statusFilter = document.getElementById('statusFilter') as HTMLSelectElement;

    if (productFilter) productFilter.value = '';
    if (sizeFilter) sizeFilter.value = '';
    if (statusFilter) statusFilter.value = '';

    // Reset upload form
    const uploadProductSelect = document.getElementById('uploadProductSelect') as HTMLSelectElement;
    const imageIndex = document.getElementById('imageIndex') as HTMLInputElement;
    const imageFile = document.getElementById('imageFile') as HTMLInputElement;
    const setPrimaryImage = document.getElementById('setPrimaryImage') as HTMLInputElement;

    if (uploadProductSelect) uploadProductSelect.value = '';
    if (imageIndex) imageIndex.value = '1';
    if (imageFile) imageFile.value = '';
    if (setPrimaryImage) setPrimaryImage.checked = false;

    // Hide progress bar
    const uploadProgress = document.getElementById('uploadProgress');
    if (uploadProgress) uploadProgress.style.display = 'none';

    // Clear messages
    const messageArea = document.getElementById('productImagesMessageArea');
    if (messageArea) messageArea.style.display = 'none';

    // Reset view mode to grid
    const viewModeGrid = document.getElementById('viewModeGrid');
    const viewModeList = document.getElementById('viewModeList');
    const imagesContainer = document.getElementById('imagesContainer');

    if (viewModeGrid) viewModeGrid.classList.add('active');
    if (viewModeList) viewModeList.classList.remove('active');
    if (imagesContainer) imagesContainer.classList.remove('images-list-view');
  }

  /**
   * Load products for the image modal dropdowns
   */
  private async loadProductsForImageModal(): Promise<void> {
    try {
      this.log('Loading products for image modal dropdowns...', 'info');

      const response = await this.api.getProducts({ limit: 100 });

      if (response.success && response.data) {
        const products = response.data.products;

        // Populate filter dropdown
        const productFilter = document.getElementById('productFilter') as HTMLSelectElement;
        if (productFilter) {
          productFilter.innerHTML = '<option value="">Todos los productos</option>';
          products.forEach((product: Product) => {
            const option = document.createElement('option');
            option.value = product.id.toString();
            option.textContent = product.name;
            productFilter.appendChild(option);
          });
        }

        // Populate upload dropdown
        const uploadProductSelect = document.getElementById('uploadProductSelect') as HTMLSelectElement;
        if (uploadProductSelect) {
          uploadProductSelect.innerHTML = '<option value="">Seleccionar producto...</option>';
          products.forEach((product: Product) => {
            const option = document.createElement('option');
            option.value = product.id.toString();
            option.textContent = product.name;
            uploadProductSelect.appendChild(option);
          });
        }

        this.log(`✅ Loaded ${products.length} products for image modal`, 'success');
      } else {
        this.log('❌ Failed to load products for image modal', 'error');
      }
    } catch (error) {
      this.log('❌ Error loading products for image modal: ' + error, 'error');
    }
  }

  /**
    * Load product images for the gallery
    */
  private async loadProductImages(page = 1, filters: Record<string, unknown> = {}): Promise<void> {
    try {
      this.log('Loading product images...', 'info');

      // Show loading indicator
      const imagesLoading = document.getElementById('imagesLoading');
      const imagesContainer = document.getElementById('imagesContainer');
      const imagesEmpty = document.getElementById('imagesEmpty');

      if (imagesLoading) imagesLoading.style.display = 'block';
      if (imagesContainer) imagesContainer.style.display = 'none';
      if (imagesEmpty) imagesEmpty.style.display = 'none';

      // Mock data for now (replace with actual API call when implemented)
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

        if (imagesLoading) imagesLoading.style.display = 'none';
        if (imagesContainer) imagesContainer.style.display = 'block';
      }, 500);

    } catch (error) {
      this.log('❌ Error loading product images: ' + error, 'error');

      // Hide loading and show empty state
      const imagesLoading = document.getElementById('imagesLoading');
      const imagesEmpty = document.getElementById('imagesEmpty');

      if (imagesLoading) imagesLoading.style.display = 'none';
      if (imagesEmpty) imagesEmpty.style.display = 'block';
    }
  }

  /**
    * Render product images in the gallery
    */
  private renderProductImages(images: Array<{
    id: number;
    product_id: number | null;
    product_name: string | null;
    size: string;
    url: string;
    file_hash: string;
    is_primary: boolean;
    created_at: string;
  }>): void {
    const imagesContainer = document.getElementById('imagesContainer');
    const imagesCount = document.getElementById('imagesCount');

    if (!imagesContainer) return;

    if (images.length === 0) {
      const imagesEmpty = document.getElementById('imagesEmpty');
      if (imagesEmpty) imagesEmpty.style.display = 'block';
      imagesContainer.style.display = 'none';
      return;
    }

    // Update count
    if (imagesCount) {
      imagesCount.textContent = `${images.length} imagen${images.length !== 1 ? 'es' : ''}`;
    }

    // Render images
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

  /**
   * Bind events for the product images modal
   */
  private bindProductImagesEvents(): void {
    // Filter events
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

    // Upload events
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    if (uploadImageBtn) {
      uploadImageBtn.addEventListener('click', () => void this.uploadProductImage());
    }

    // View mode events
    const viewModeGrid = document.getElementById('viewModeGrid');
    const viewModeList = document.getElementById('viewModeList');

    if (viewModeGrid) {
      viewModeGrid.addEventListener('click', () => this.setViewMode('grid'));
    }
    if (viewModeList) {
      viewModeList.addEventListener('click', () => this.setViewMode('list'));
    }
  }

  /**
   * Apply filters to the image gallery
   */
  private applyImageFilters(): void {
    const productFilter = document.getElementById('productFilter') as HTMLSelectElement;
    const sizeFilter = document.getElementById('sizeFilter') as HTMLSelectElement;
    const statusFilter = document.getElementById('statusFilter') as HTMLSelectElement;

    const filters = {
      productId: productFilter?.value ?? '',
      size: sizeFilter?.value ?? '',
      status: statusFilter?.value ?? ''
    };

    void this.loadProductImages(1, filters);
  }

  /**
    * Set view mode for the gallery
    */
  private setViewMode(mode: 'grid' | 'list'): void {
    const viewModeGrid = document.getElementById('viewModeGrid');
    const viewModeList = document.getElementById('viewModeList');
    const imagesContainer = document.getElementById('imagesContainer');

    if (mode === 'grid') {
      viewModeGrid?.classList.add('active');
      viewModeList?.classList.remove('active');
      imagesContainer?.classList.remove('images-list-view');
    } else {
      viewModeGrid?.classList.remove('active');
      viewModeList?.classList.add('active');
      imagesContainer?.classList.add('images-list-view');
    }
  }

  /**
    * Handle sorting for products table
    */
  private async handleProductsSort(): Promise<void> {
    const sortSelect = document.getElementById('sortImagesSelect') as HTMLSelectElement;
    if (!sortSelect) return;

    const sortValue = sortSelect.value;
    let sortBy: 'name' | 'image_count' = 'image_count';
    let sortDirection: 'asc' | 'desc' = 'asc';

    if (sortValue === 'name_asc') {
      sortBy = 'name';
      sortDirection = 'asc';
    } else if (sortValue === 'name_desc') {
      sortBy = 'name';
      sortDirection = 'desc';
    } else if (sortValue === 'image_count') {
      sortBy = 'image_count';
      sortDirection = 'asc';
    }

    // Get current filter values
    const filters = this.getCurrentImageFilters();
    await this.loadProductsWithImageCounts(sortBy, sortDirection, filters);
  }

  /**
   * Get current image filter values from form
   */
  private getCurrentImageFilters(): {
    productStatus?: 'active' | 'inactive' | 'all';
    imageStatus?: 'active' | 'inactive' | 'all';
    occasion?: string;
  } {
    const productStatusFilter = document.getElementById('productStatusFilter') as HTMLSelectElement;
    const imageStatusFilter = document.getElementById('imageStatusFilter') as HTMLSelectElement;
    const occasionFilter = document.getElementById('productOccasionFilter') as HTMLSelectElement;

    return {
      productStatus: (productStatusFilter?.value as 'active' | 'inactive' | 'all') || 'active',
      imageStatus: (imageStatusFilter?.value as 'active' | 'inactive' | 'all') || 'active',
      occasion: occasionFilter?.value || 'general'
    };
  }

  /**
   * Handle apply filters button
   */
  private async handleApplyFilters(): Promise<void> {
    const filters = this.getCurrentImageFilters();
    await this.loadProductsWithImageCounts('image_count', 'asc', filters);
  }

  /**
   * Handle reset filters button
   */
  private async handleResetFilters(): Promise<void> {
    // Reset all filter selects to default values
    const productStatusFilter = document.getElementById('productStatusFilter') as HTMLSelectElement;
    const imageStatusFilter = document.getElementById('imageStatusFilter') as HTMLSelectElement;
    const occasionFilter = document.getElementById('productOccasionFilter') as HTMLSelectElement;
    const sortSelect = document.getElementById('sortImagesSelect') as HTMLSelectElement;

    if (productStatusFilter) productStatusFilter.value = 'active';
    if (imageStatusFilter) imageStatusFilter.value = 'active';
    if (occasionFilter) occasionFilter.value = 'general';
    if (sortSelect) sortSelect.value = 'image_count';

    // Reload with default filters
    await this.loadProductsWithImageCounts('image_count', 'asc', {
      productStatus: 'active',
      imageStatus: 'active',
      occasion: 'general'
    });
  }

  /**
    * Edit product images - opens modal for managing images of a specific product
    */
  public editProductImages(productId: number, productName: string): void {
    this.log(`Editing images for product: ${productName} (ID: ${productId})`, 'info');
    // For now, show the existing product images modal
    // Later this will be replaced with a dedicated modal for editing images per product
    void this.showProductImagesModal();
  }

  /**
   * Upload a new product image
   */
  private async uploadProductImage(): Promise<void> {
    try {
      const uploadProductSelect = document.getElementById('uploadProductSelect') as HTMLSelectElement;
      const imageIndex = document.getElementById('imageIndex') as HTMLInputElement;
      const imageFile = document.getElementById('imageFile') as HTMLInputElement;
      const setPrimaryImage = document.getElementById('setPrimaryImage') as HTMLInputElement;

      // Validation
      if (!uploadProductSelect.value) {
        this.showProductImagesMessage('Por favor, selecciona un producto.', 'error');
        return;
      }

      if (!imageFile.files || imageFile.files.length === 0) {
        this.showProductImagesMessage('Por favor, selecciona un archivo de imagen.', 'error');
        return;
      }

      const file = imageFile.files[0];

      // Validate file size (5MB max)
      if (file && file.size > 5 * 1024 * 1024) {
        this.showProductImagesMessage('El archivo debe ser menor a 5MB.', 'error');
        return;
      }

      // Validate file type
      if (file && !file.type.startsWith('image/')) {
        this.showProductImagesMessage('Por favor, selecciona un archivo de imagen válido.', 'error');
        return;
      }

      // Show progress
      const uploadProgress = document.getElementById('uploadProgress');
      const progressBar = uploadProgress?.querySelector('.progress-bar') as HTMLElement;

      if (uploadProgress) uploadProgress.style.display = 'block';
      if (progressBar) progressBar.style.width = '0%';

      // Simulate upload progress (replace with actual API call)
      const progressInterval = setInterval(() => {
        if (progressBar) {
          const currentWidth = parseInt(progressBar.style.width) || 0;
          const newWidth = Math.min(currentWidth + 10, 90);
          progressBar.style.width = `${newWidth}%`;
        }
      }, 200);

      // Mock successful upload after 2 seconds
      setTimeout(() => {
        clearInterval(progressInterval);
        if (progressBar) progressBar.style.width = '100%';

        setTimeout(() => {
          if (uploadProgress) uploadProgress.style.display = 'none';
          this.showProductImagesMessage('Imagen subida exitosamente.', 'success');

          // Reset upload form
          uploadProductSelect.value = '';
          imageIndex.value = '1';
          imageFile.value = '';
          setPrimaryImage.checked = false;

          // Reload images
          void this.loadProductImages();
        }, 500);
      }, 2000);

    } catch (error) {
      this.log('❌ Error uploading product image: ' + error, 'error');
      this.showProductImagesMessage('Error al subir la imagen.', 'error');
    }
  }

  /**
   * Show message in product images modal
   */
  private showProductImagesMessage(message: string, type: 'success' | 'error' | 'info'): void {
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

  /**
   * Show fallback product images modal (when Bootstrap is not available)
   */
  private showFallbackProductImagesModal(modalElement: HTMLElement): void {
    modalElement.style.display = 'block';
    modalElement.style.position = 'fixed';
    modalElement.style.top = '0';
    modalElement.style.left = '0';
    modalElement.style.width = '100%';
    modalElement.style.height = '100%';
    modalElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalElement.style.zIndex = '9999';

    // Add close functionality
    const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modalElement.style.display = 'none';
      });
    });

    // Close on background click
    modalElement.addEventListener('click', (e) => {
      if (e.target === modalElement) {
        modalElement.style.display = 'none';
      }
    });

    this.log('✅ Fallback product images modal shown successfully', 'success');
  }

  // Public methods for HTML onclick handlers
  public async editProduct(id: number): Promise<void> {
    try {
      this.log(`Editing product ${id}`, 'info');

      // Get product data with occasions from API
      const response = await this.api.getProductByIdWithOccasions(id);

      if (response.success && response.data) {
        void this.showProductModal(response.data.product);
      } else {
        this.log('Failed to load product for editing', 'error');
        alert('Error al cargar el producto para editar');
      }
    } catch (error) {
      this.log('Error editing product: ' + error, 'error');
      alert('Error al editar el producto');
    }
  }

  public async deleteProduct(id: number): Promise<void> {
    if (confirm(`¿Está seguro de que desea eliminar el producto ${id}? Esta acción no se puede deshacer.`)) {
      try {
        this.log(`Deleting product ${id}`, 'info');

        // For now, we'll implement soft delete by setting active = false
        // In a real implementation, you might want a separate delete endpoint
        const updateResponse = await this.api.updateProduct({
          id: id,
          active: false
        });

        if (updateResponse.success) {
          this.log('Product deactivated successfully', 'success');
          alert('Producto eliminado exitosamente');
          // Reload products list
          await this.loadProductsData();
        } else {
          this.log('Failed to delete product', 'error');
          alert('Error al eliminar el producto');
        }
      } catch (error) {
        this.log('Error deleting product: ' + error, 'error');
        alert('Error al eliminar el producto');
      }
    }
  }

  /**
   * Bind orders section events
   */
  private bindOrdersEvents(): void {
    this.log('Binding orders events', 'info');

    // Refresh orders button
    const refreshBtn = document.getElementById('refreshOrdersBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        void this.loadOrdersData();
      });
    }

    // Export orders button
    const exportBtn = document.getElementById('exportOrdersBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportOrders();
      });
    }

    // Status filter
    const statusFilter = document.getElementById('ordersStatusFilter') as HTMLSelectElement;
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        void this.applyOrdersFilters();
      });
    }

    // Date filters
    const dateFrom = document.getElementById('ordersDateFrom') as HTMLInputElement;
    const dateTo = document.getElementById('ordersDateTo') as HTMLInputElement;
    if (dateFrom) {
      dateFrom.addEventListener('change', () => {
        void this.applyOrdersFilters();
      });
    }
    if (dateTo) {
      dateTo.addEventListener('change', () => {
        void this.applyOrdersFilters();
      });
    }

    // Search
    const searchInput = document.getElementById('ordersSearch') as HTMLInputElement;
    const searchBtn = document.getElementById('ordersSearchBtn');
    if (searchInput) {
      searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          void this.applyOrdersFilters();
        }
      });
    }
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        void this.applyOrdersFilters();
      });
    }

    // Sort controls
    const sortBy = document.getElementById('ordersSortBy') as HTMLSelectElement;
    const sortDirection = document.getElementById('ordersSortDirection') as HTMLSelectElement;
    if (sortBy) {
      sortBy.addEventListener('change', () => {
        void this.applyOrdersFilters();
      });
    }
    if (sortDirection) {
      sortDirection.addEventListener('change', () => {
        void this.applyOrdersFilters();
      });
    }
  }

  /**
   * Apply orders filters and reload data
   */
  private async applyOrdersFilters(): Promise<void> {
    const statusFilter = document.getElementById('ordersStatusFilter') as HTMLSelectElement;
    const dateFrom = document.getElementById('ordersDateFrom') as HTMLInputElement;
    const dateTo = document.getElementById('ordersDateTo') as HTMLInputElement;
    const searchInput = document.getElementById('ordersSearch') as HTMLInputElement;
    const sortBy = document.getElementById('ordersSortBy') as HTMLSelectElement;
    const sortDirection = document.getElementById('ordersSortDirection') as HTMLSelectElement;

    const filters: OrdersFilters = {
      status: statusFilter?.value || undefined,
      date_from: dateFrom?.value || undefined,
      date_to: dateTo?.value || undefined,
      search: searchInput?.value.trim() || undefined,
      sort_by: (sortBy?.value as 'created_at' | 'total_amount_usd' | 'status' | 'customer_name') || 'created_at',
      sort_direction: sortDirection?.value as 'asc' | 'desc' || 'desc'
    };

    await this.loadOrdersData(1, filters);
  }

  /**
   * View order details
   */
  public async viewOrderDetails(orderId: number): Promise<void> {
    try {
      this.log(`Viewing order details for ID: ${orderId}`, 'info');

      // Show loading in modal
      this.showOrderDetailsLoading();

      // Show modal
      const modalElement = document.getElementById('orderDetailsModal');
      if (modalElement) {
        const bootstrap = (window as WindowWithBootstrap).bootstrap;
        if (bootstrap?.Modal) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      }

      // Load order details
      await this.loadOrderDetails(orderId);

    } catch (error) {
      this.log('Error viewing order details: ' + error, 'error');
      this.showOrderDetailsError('Error al cargar los detalles del pedido');
    }
  }

  /**
   * Load order details for modal
   */
  private async loadOrderDetails(orderId: number): Promise<void> {
    try {
      // Mock order details for demonstration
      const mockOrderDetails = this.getMockOrderDetails(orderId);

      // Update modal with order data
      this.renderOrderDetails(mockOrderDetails);

    } catch (error) {
      this.log('Error loading order details: ' + error, 'error');
      throw error;
    }
  }

  /**
   * Render order details in modal
   */
  private renderOrderDetails(orderData: OrderDetails): void {
    // Update modal title
    const modalTitle = document.getElementById('orderDetailsModalLabel');
    if (modalTitle) {
      modalTitle.innerHTML = `<i class="bi bi-receipt me-2"></i>Detalles del Pedido #${orderData.id}`;
    }

    // Update order info
    this.updateElement('orderDetailsId', orderData.id.toString());
    this.updateElement('orderDetailsStatusBadge', this.getOrderStatusText(orderData.status));
    this.updateElement('orderDetailsCreatedAt', new Date(orderData.created_at).toLocaleString());

    // Update customer info
    this.updateElement('orderDetailsCustomerName', orderData.customer_name);
    this.updateElement('orderDetailsCustomerEmail', orderData.customer_email || 'No especificado');
    this.updateElement('orderDetailsCustomerPhone', orderData.customer_phone || 'No especificado');
    this.updateElement('orderDetailsUserId', orderData.user_id?.toString() || 'N/A');

    // Update delivery info
    this.updateElement('orderDetailsDeliveryAddress', orderData.delivery_address);
    this.updateElement('orderDetailsDeliveryCity', orderData.delivery_city || 'No especificado');
    this.updateElement('orderDetailsDeliveryDate', orderData.delivery_date ? new Date(orderData.delivery_date).toLocaleDateString() : 'No especificada');
    this.updateElement('orderDetailsDeliveryTimeSlot', orderData.delivery_time_slot || 'No especificado');
    this.updateElement('orderDetailsDeliveryNotes', orderData.delivery_notes || 'Sin notas');

    // Update payment info
    this.updateElement('orderDetailsPaymentStatus', this.getPaymentStatusText(orderData.payment_status || 'pending'));
    this.updateElement('orderDetailsPaymentMethod', orderData.payment_method || 'No especificado');
    this.updateElement('orderDetailsPaymentAmountUSD', orderData.total_amount_usd ? `$${orderData.total_amount_usd.toFixed(2)}` : 'N/A');
    this.updateElement('orderDetailsPaymentAmountVES', orderData.total_amount_ves ? `Bs. ${orderData.total_amount_ves.toLocaleString()}` : 'N/A');
    this.updateElement('orderDetailsPaymentDate', orderData.payment_date ? new Date(orderData.payment_date).toLocaleString() : 'No pagado');

    // Update admin notes
    const adminNotes = document.getElementById('orderAdminNotes') as HTMLTextAreaElement;
    if (adminNotes) {
      adminNotes.value = orderData.admin_notes || '';
    }

    // Update status select
    const statusSelect = document.getElementById('orderStatusSelect') as HTMLSelectElement;
    if (statusSelect) {
      statusSelect.value = orderData.status;
    }

    // Render order items
    this.renderOrderItems(orderData.items || []);

    // Render status history
    this.renderOrderStatusHistory(orderData.status_history || []);

    // Update total
    this.updateElement('orderDetailsTotal', `$${orderData.total_amount_usd?.toFixed(2) || '0.00'}`);

    // Bind modal events
    this.bindOrderDetailsEvents(orderData.id);
  }

  /**
   * Render order items in modal
   */
  private renderOrderItems(items: OrderItemDetails[]): void {
    const tbody = document.getElementById('orderItemsTableBody');
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay productos en este pedido</td></tr>';
      return;
    }

    const rows = items.map(item => `
      <tr>
        <td>
          <div class="product-info">
            <div class="fw-bold">${item.product_name}</div>
            <small class="text-muted">${item.product_summary || ''}</small>
          </div>
        </td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-end">$${item.unit_price_usd?.toFixed(2) || '0.00'}</td>
        <td class="text-end">$${(item.subtotal_usd || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    tbody.innerHTML = rows;
  }

  /**
   * Render order status history
   */
  private renderOrderStatusHistory(history: OrderStatusHistoryItem[]): void {
    const historyContainer = document.getElementById('orderStatusHistory');
    if (!historyContainer) return;

    if (history.length === 0) {
      historyContainer.innerHTML = '<div class="text-center text-muted">No hay historial de estados</div>';
      return;
    }

    const historyHtml = history.map((item, index) => `
      <div class="status-history-item ${index === history.length - 1 ? 'current' : ''}">
        <div class="status-icon bg-${this.getStatusColor(item.new_status)}">
          <i class="bi ${this.getStatusIcon(item.new_status)}"></i>
        </div>
        <div class="status-content">
          <div class="fw-bold">${this.getOrderStatusText(item.new_status)}</div>
          <div class="status-time">
            ${new Date(item.created_at).toLocaleString()}
            ${item.notes ? ` - ${item.notes}` : ''}
          </div>
        </div>
      </div>
    `).join('');

    historyContainer.innerHTML = historyHtml;
  }

  /**
   * Bind order details modal events
   */
  private bindOrderDetailsEvents(orderId: number): void {
    // Update status button
    const updateStatusBtn = document.getElementById('updateOrderStatusBtn');
    if (updateStatusBtn) {
      updateStatusBtn.addEventListener('click', () => {
        void this.updateOrderStatus(orderId);
      });
    }

    // Save admin notes button
    const saveNotesBtn = document.getElementById('saveAdminNotesBtn');
    if (saveNotesBtn) {
      saveNotesBtn.addEventListener('click', () => {
        void this.saveOrderAdminNotes(orderId);
      });
    }

    // Print order button
    const printBtn = document.getElementById('printOrderBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        this.printOrder(orderId);
      });
    }

    // Cancel order button
    const cancelBtn = document.getElementById('cancelOrderBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        void this.cancelOrder(orderId);
      });
    }
  }

  /**
   * Update order status
   */
  public async updateOrderStatus(orderId: number, newStatus?: string): Promise<void> {
    try {
      // Get status from select or parameter
      let status = newStatus;
      if (!status) {
        const statusSelect = document.getElementById('orderStatusSelect') as HTMLSelectElement;
        status = statusSelect?.value;
      }

      if (!status) {
        alert('Por favor selecciona un estado');
        return;
      }

      this.log(`Updating order ${orderId} status to ${status}`, 'info');

      // Mock API call - in real implementation, call the actual API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Show success message
      alert(`Estado del pedido #${orderId} actualizado a ${this.getOrderStatusText(status)}`);

      // Reload orders data
      await this.loadOrdersData();

      // Close modal if open
      const modalElement = document.getElementById('orderDetailsModal');
      if (modalElement) {
        const bootstrap = (window as WindowWithBootstrap).bootstrap;
        if (bootstrap?.Modal) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
      }

    } catch (error) {
      this.log('Error updating order status: ' + error, 'error');
      alert('Error al actualizar el estado del pedido');
    }
  }

  /**
   * Save order admin notes
   */
  private async saveOrderAdminNotes(orderId: number): Promise<void> {
    try {
      const notesInput = document.getElementById('orderAdminNotes') as HTMLTextAreaElement;
      const notes = notesInput?.value || '';

      this.log(`Saving admin notes for order ${orderId}`, 'info');

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));

      alert('Notas administrativas guardadas exitosamente');

    } catch (error) {
      this.log('Error saving admin notes: ' + error, 'error');
      alert('Error al guardar las notas');
    }
  }

  /**
   * Print order
   */
  private printOrder(orderId: number): void {
    // Simple print functionality
    window.print();
  }

  /**
   * Cancel order
   */
  private async cancelOrder(orderId: number): Promise<void> {
    if (confirm('¿Está seguro de que desea cancelar este pedido? Esta acción no se puede deshacer.')) {
      await this.updateOrderStatus(orderId, 'cancelled');
    }
  }

  /**
   * Export orders
   */
  private exportOrders(): void {
    // Simple CSV export for demonstration
    const csvContent = 'ID,Cliente,Email,Total,Estado,Fecha\n' +
      '1001,María González,maria@example.com,45.99,pending,2024-01-15\n' +
      '1002,Juan Pérez,juan@example.com,78.50,confirmed,2024-01-14\n';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Pedidos exportados exitosamente');
  }

  /**
   * Show order details loading
   */
  private showOrderDetailsLoading(): void {
    // Set loading text in modal elements
    this.updateElement('orderDetailsId', 'Cargando...');
    this.updateElement('orderDetailsStatusBadge', 'Cargando...');
    this.updateElement('orderDetailsCreatedAt', 'Cargando...');
    // ... set other elements to loading
  }

  /**
   * Show order details error
   */
  private showOrderDetailsError(message: string): void {
    const modalBody = document.querySelector('#orderDetailsModal .modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="text-center text-danger py-4">
          <i class="bi bi-exclamation-triangle display-4 mb-3"></i>
          <h5>Error al cargar detalles</h5>
          <p>${message}</p>
        </div>
      `;
    }
  }

  /**
   * Get mock order details
   */
  private getMockOrderDetails(orderId: number): OrderDetails {
    const mockOrders = this.getMockOrdersData({}).orders;
    const order = mockOrders.find(o => o.id === orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    return {
      ...order,
      customer_phone: '+58 412 123 4567',
      delivery_address: 'Calle Principal 123, Caracas, Venezuela',
      delivery_city: 'Caracas',
      delivery_time_slot: '10:00-12:00',
      delivery_notes: 'Llamar al timbre dos veces',
      payment_status: order.status === 'delivered' ? 'confirmed' : 'pending',
      payment_method: 'Transferencia bancaria',
      payment_date: order.status === 'delivered' ? order.created_at : undefined,
      admin_notes: 'Pedido procesado correctamente',
      items: [
        {
          product_name: 'Rosa Roja Premium',
          product_summary: 'Rosas frescas de alta calidad',
          quantity: 2,
          unit_price_usd: 15.99,
          subtotal_usd: 31.98
        },
        {
          product_name: 'Lirios Blancos',
          product_summary: 'Lirios frescos importados',
          quantity: 1,
          unit_price_usd: 14.01,
          subtotal_usd: 14.01
        }
      ],
      status_history: [
        {
          new_status: 'pending',
          created_at: order.created_at,
          notes: 'Pedido creado'
        },
        {
          new_status: 'confirmed',
          created_at: new Date(Date.parse(order.created_at) + 3600000).toISOString(),
          notes: 'Pago confirmado'
        },
        {
          new_status: order.status,
          created_at: new Date(Date.parse(order.created_at) + 7200000).toISOString(),
          notes: 'Estado actualizado'
        }
      ]
    };
  }

  /**
   * Helper method to update element text content
   */
  private updateElement(elementId: string, content: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = content;
    }
  }

  /**
   * Get payment status text
   */
  private getPaymentStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      failed: 'Fallido',
      refunded: 'Reembolsado'
    };
    return statusMap[status] || status;
  }

  /**
   * Get status color for badges
   */
  private getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'warning',
      ready: 'primary',
      delivered: 'success',
      cancelled: 'danger'
    };
    return colorMap[status] || 'secondary';
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      pending: 'bi-clock',
      confirmed: 'bi-check-circle',
      preparing: 'bi-gear',
      ready: 'bi-box-seam',
      delivered: 'bi-truck',
      cancelled: 'bi-x-circle'
    };
    return iconMap[status] || 'bi-circle';
  }

  public viewOrder(id: number): void {
    void this.viewOrderDetails(id);
  }

  public editUser(id: number): void {
    // Redirect to dedicated users admin page where full CRUD is implemented
    window.location.href = `/pages/admin-users.html?edit=${id}`;
  }

  public deleteUser(id: number): void {
    if (confirm(`¿Eliminar usuario ${id}?`)) {
      alert('Funcionalidad de eliminar usuario próximamente...');
    }
  }

  /**
   * Check password strength
   */
  private checkPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    if (password.length < 8) return 'weak';

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (hasLower && hasUpper && hasNumber && password.length >= 10) {
      return 'strong';
    } else if ((hasLower && hasUpper) || (hasLower && hasNumber) || (hasUpper && hasNumber)) {
      return 'medium';
    } else {
      return 'weak';
    }
  }

  /**
   * Get password strength text
   */
  private getPasswordStrengthText(strength: 'weak' | 'medium' | 'strong'): string {
    switch (strength) {
      case 'weak': return 'Débil - Agrega mayúsculas, minúsculas y números';
      case 'medium': return 'Media - Buena, pero puede ser más fuerte';
      case 'strong': return 'Fuerte - Excelente contraseña';
    }
  }

  /**
   * Save user from modal
   */
  private async saveUser(): Promise<boolean> {
    try {
      // Get form elements
      const emailInput = document.getElementById('userEmail') as HTMLInputElement;
      const fullNameInput = document.getElementById('userFullName') as HTMLInputElement;
      const passwordInput = document.getElementById('userPassword') as HTMLInputElement;
      const phoneInput = document.getElementById('userPhone') as HTMLInputElement;
      const roleSelect = document.getElementById('userRole') as HTMLSelectElement;
      const isActiveInput = document.getElementById('userIsActive') as HTMLInputElement;
      const emailVerifiedInput = document.getElementById('userEmailVerified') as HTMLInputElement;
      const saveBtn = document.getElementById('saveUserBtn') as HTMLButtonElement;

      // Client-side validation
      const errors: string[] = [];

      const email = emailInput.value.trim();
      const fullName = fullNameInput.value.trim();
      const password = passwordInput.value.trim();
      const phone = phoneInput.value.trim();
      const role = roleSelect.value;
      const isActive = isActiveInput.checked;
      const emailVerified = emailVerifiedInput.checked;

      // Required field validation
      if (!email) {
        errors.push('El email es obligatorio');
        if (!errors.length) emailInput.focus();
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('El email no tiene un formato válido');
        if (!errors.length) emailInput.focus();
      }

      if (!fullName) {
        errors.push('El nombre completo es obligatorio');
        if (!errors.length) fullNameInput.focus();
      } else if (fullName.length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
        if (!errors.length) fullNameInput.focus();
      }

      if (!password) {
        errors.push('La contraseña es obligatoria');
        if (!errors.length) passwordInput.focus();
      } else {
        const strength = this.checkPasswordStrength(password);
        if (strength === 'weak') {
          errors.push('La contraseña es muy débil. Debe tener al menos 8 caracteres con mayúsculas, minúsculas y números');
          if (!errors.length) passwordInput.focus();
        }
      }

      if (!role) {
        errors.push('Debe seleccionar un rol');
        if (!errors.length) roleSelect.focus();
      }

      // Show validation errors
      if (errors.length > 0) {
        this.showUserMessage('Errores de validación:\n• ' + errors.join('\n• '), 'error');
        return false;
      }

      // Hide any previous messages
      this.hideUserMessage();

      // Disable save button and show loading state
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Creando...';
      }

      // Prepare user data
      const userData = {
        email,
        password,
        full_name: fullName,
        phone: phone || undefined,
        role: role as 'user' | 'admin' | 'support',
        is_active: isActive,
        email_verified: emailVerified
      };

      this.log('Submitting user data: ' + JSON.stringify({ ...userData, password: '[HIDDEN]' }, null, 2), 'info');

      // Create user via API
      const response = await this.api.createUser(userData);

      if (response.success) {
        // Success message
        this.showUserMessage('✅ Usuario creado exitosamente', 'success');

        // Reload users list
        await this.loadUsersData();

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          this.hideUserMessage();
        }, 3000);

        return true;
      } else {
        // API returned error
        const errorMessage = response.message ?? 'Error desconocido al crear el usuario';
        this.showUserMessage(`⚠️ ${errorMessage}`, 'error');
        this.log('API returned error', 'error');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.log('Error saving user: ' + errorMessage, 'error');
      this.showUserMessage(`⚠️ Error al crear el usuario: ${errorMessage}`, 'error');
      return false;
    } finally {
      // Re-enable save button and restore text
      const saveBtn = document.getElementById('saveUserBtn') as HTMLButtonElement;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Crear Usuario';
      }
    }
  }

  /**
   * Show message in user modal
   */
  private showUserMessage(message: string, type: 'success' | 'error' | 'warning' = 'error'): void {
    const messageArea = document.getElementById('userMessageArea');
    const messageDiv = document.getElementById('userMessage');

    if (!messageArea || !messageDiv) return;

    // Set message and style
    messageDiv.textContent = message;
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'warning'}`;

    // Show message area
    messageArea.style.display = 'block';

    // Scroll to top of modal to ensure message is visible
    messageArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Hide message in user modal
   */
  private hideUserMessage(): void {
    const messageArea = document.getElementById('userMessageArea');
    if (messageArea) {
      messageArea.style.display = 'none';
    }
  }

  public async editOccasion(id: number): Promise<void> {
    try {
      this.log(`Editing occasion ${id}`, 'info');

      // Get occasion data from API
      const response = await this.api.getOccasionById(id);

      if (response.success && response.data) {
        await this.showOccasionModal(response.data.occasion);
      } else {
        this.log('Failed to load occasion for editing', 'error');
        alert('Error al cargar la ocasión para editar');
      }
    } catch (error) {
      this.log('Error editing occasion: ' + error, 'error');
      alert('Error al editar la ocasión');
    }
  }

  public deleteOccasion(id: number): void {
    if (confirm(`¿Eliminar ocasión ${id}?`)) {
      alert('Funcionalidad de eliminar ocasión próximamente...');
    }
  }

  public async deleteImage(imageId: number): Promise<void> {
    if (confirm('¿Está seguro de que desea eliminar esta imagen? Esta acción no se puede deshacer.')) {
      try {
        this.log(`Deleting image ${imageId}`, 'info');

        const response = await this.api.deleteImage(imageId);

        if (response.success) {
          this.log('Image deleted successfully', 'success');
          alert('Imagen eliminada exitosamente');

          // Reload images gallery
          await this.loadImagesGallery();
        } else {
          this.log('Failed to delete image', 'error');
          alert('Error al eliminar la imagen');
        }
      } catch (error) {
        this.log('Error deleting image: ' + error, 'error');
        alert('Error al eliminar la imagen');
      }
    }
  }

  public async deleteProductImage(imageId: number): Promise<void> {
    if (confirm('¿Está seguro de que desea eliminar esta imagen? Esta acción no se puede deshacer.')) {
      try {
        this.log(`Deleting product image ${imageId}`, 'info');

        // Mock successful deletion for now (replace with actual API call)
        setTimeout(() => {
          this.log('Product image deleted successfully', 'success');
          this.showProductImagesMessage('Imagen eliminada exitosamente', 'success');

          // Reload images in the modal
          void this.loadProductImages();
        }, 500);

      } catch (error) {
        this.log('Error deleting product image: ' + error, 'error');
        this.showProductImagesMessage('Error al eliminar la imagen', 'error');
      }
    }
  }

  /**
   * Diagnostic function to check admin panel status
   */
  public diagnose(): void {
    console.log('🔍 === DIAGNÓSTICO DEL PANEL DE ADMINISTRACIÓN ===');

    // Check authentication
    const userData = localStorage.getItem('floresya_user');
    const sessionTime = localStorage.getItem('floresya_session');
    console.log('👤 Autenticación:', {
      userData: !!userData,
      sessionTime: !!sessionTime,
      currentUser: !!this.currentUser
    });

    // Check DOM elements
    const elements = {
      addProductBtn: !!document.getElementById('addProductBtn'),
      productsSection: !!document.getElementById('products-section'),
      loadingOverlay: !!document.getElementById('loadingOverlay'),
      adminSidebar: !!document.getElementById('adminSidebar'),
      dashboardSection: !!document.getElementById('dashboard-section')
    };
    console.log('📄 Elementos DOM:', elements);

    // Check Bootstrap
    const bootstrap = (window as WindowWithBootstrap).bootstrap;
    console.log('🎨 Bootstrap:', {
      available: !!bootstrap,
      modal: !!(bootstrap?.Modal)
    });

    // Check current section
    const activeSection = document.querySelector('.admin-section.active');
    console.log('📍 Sección activa:', activeSection ? activeSection.id : 'ninguna');

    // Check if buttons are bound
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
      console.log('🔗 Event listeners en addProductBtn:', addProductBtn.onclick ? 'tiene onclick' : 'no tiene onclick');
      console.log('🔗 Button HTML:', addProductBtn.outerHTML);
    }

    // Check admin panel instance
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

  /**
   * Test modal functionality directly
   */
  public testModal(): void {
    console.log('🧪 Probando modal directamente...');
    try {
      void this.showAddProductModal();
      console.log('✅ testModal ejecutado sin errores');
    } catch (error) {
      console.error('❌ Error en testModal:', error);
    }
  }

  /**
   * Force show products section
   */
  public forceShowProducts(): void {
    console.log('🚨 Forzando mostrar sección de productos...');

    // Switch to products section
    this.switchSection('products');

    // Force bind buttons
    setTimeout(() => {
      this.bindProductButtons();
      console.log('✅ Sección productos forzada y botones vinculados');
    }, 100);
  }

  // ============================================================================
  // SCHEMA DATABASE MANAGEMENT METHODS
  // ============================================================================

  /**
   * Load and display schema statistics
   */
  private async loadSchemaInfo(): Promise<void> {
    this.log('📊 Cargando información del esquema...', 'info');

    try {
      this.showSchemaLoading();
      this.hideSchemaAlerts();

      const response = await this.api.request<{
        stats: {
          totalTables: number;
          totalRecords: number;
          totalIndexes: number;
          totalConstraints: number;
          extractionDate: string;
          version: string;
        };
        lastUpdate: string;
      }>('/admin/schema/info');

      if (response.success && response.data) {
        this.displaySchemaStats(response.data);
        this.hideSchemaLoading();
        this.showSchemaSuccess('Estadísticas del esquema cargadas exitosamente');
      } else {
        throw new Error(response.message || 'Error desconocido');
      }

    } catch (error) {
      this.log('❌ Error cargando información del esquema', 'error');
      this.hideSchemaLoading();
      this.showSchemaError(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Display schema statistics in the UI
   */
  private displaySchemaStats(data: {
    stats: {
      totalTables: number;
      totalRecords: number;
      totalIndexes: number;
      totalConstraints: number;
      extractionDate: string;
      version: string;
    };
    lastUpdate: string;
  }): void {
    const statsCard = document.getElementById('schemaStatsCard');
    const statsContent = document.getElementById('schemaStatsContent');

    if (!statsCard || !statsContent) return;

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

  /**
   * View complete SQL schema
   */
  private async viewSchemaSQL(): Promise<void> {
    this.log('📜 Cargando esquema SQL completo...', 'info');

    try {
      this.showSchemaLoading();
      this.hideSchemaAlerts();

      const response = await this.api.request<{
        schema: string;
        stats: {
          totalTables: number;
          totalRecords: number;
          totalIndexes: number;
          totalConstraints: number;
          extractionDate: string;
          version: string;
        };
      }>('/admin/schema/extract');

      if (response.success && response.data) {
        this.displaySchemaSQL(response.data.schema);
        this.hideSchemaLoading();
        this.showSchemaSuccess('Esquema SQL cargado exitosamente');
      } else {
        throw new Error(response.message || 'Error desconocido');
      }

    } catch (error) {
      this.log('❌ Error cargando esquema SQL', 'error');
      this.hideSchemaLoading();
      this.showSchemaError(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Display SQL schema in the UI
   */
  private displaySchemaSQL(schema: string): void {
    const sqlCard = document.getElementById('schemaSQLCard');
    const sqlContent = document.getElementById('schemaSQLContent');

    if (!sqlCard || !sqlContent) return;

    sqlContent.textContent = schema;
    sqlCard.style.display = 'block';
  }

  /**
   * Update schema file on server
   */
  private async updateSchemaFile(): Promise<void> {
    this.log('🔄 Actualizando archivo de esquema...', 'info');

    try {
      this.showSchemaLoading();
      this.hideSchemaAlerts();

      const response = await this.api.request<{
        filePath: string;
        stats: {
          totalTables: number;
          totalRecords: number;
          totalIndexes: number;
          totalConstraints: number;
          extractionDate: string;
          version: string;
        };
      }>('/admin/schema/update-file', {
        method: 'POST'
      });

      if (response.success && response.data) {
        this.hideSchemaLoading();
        this.showSchemaSuccess(`Archivo ${response.data.filePath} actualizado exitosamente`);
        this.log('✅ Archivo de esquema actualizado', 'success');
      } else {
        throw new Error(response.message || 'Error desconocido');
      }

    } catch (error) {
      this.log('❌ Error actualizando archivo de esquema', 'error');
      this.hideSchemaLoading();
      this.showSchemaError(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Download SQL schema as file
   */
  private async downloadSchemaSQL(): Promise<void> {
    this.log('📥 Descargando esquema SQL...', 'info');

    try {
      this.showSchemaLoading();

      // Fetch schema as text
      const response = await fetch('/api/admin/schema/extract?format=sql', {
        headers: {
          'Accept': 'text/plain'
        }
      });

      if (response.ok) {
        const schema = await response.text();

        // Create download
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
      } else {
        throw new Error('Error en la descarga');
      }

    } catch (error) {
      this.log('❌ Error descargando esquema SQL', 'error');
      this.hideSchemaLoading();
      this.showSchemaError(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Copy SQL schema to clipboard
   */
  private async copySchemaSQLToClipboard(): Promise<void> {
    const sqlContent = document.getElementById('schemaSQLContent');

    if (!sqlContent?.textContent) {
      this.showSchemaError('No hay contenido SQL para copiar. Primero carga el esquema.');
      return;
    }

    try {
      await navigator.clipboard.writeText(sqlContent.textContent);
      this.showSchemaSuccess('Esquema SQL copiado al portapapeles');
      this.log('✅ Esquema SQL copiado al portapapeles', 'success');

      // Update button text temporarily
      const copyBtn = document.getElementById('copySchemaSQLBtn');
      if (copyBtn) {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="bi bi-check"></i> Copiado';
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
      }
    } catch (error) {
      this.log('❌ Error copiando al portapapeles', 'error');
      this.showSchemaError('Error al copiar al portapapeles');
    }
  }

  /**
   * Show loading indicator
   */
  private showSchemaLoading(): void {
    const loading = document.getElementById('schemaLoadingIndicator');
    if (loading) loading.style.display = 'block';
  }

  /**
   * Hide loading indicator
   */
  private hideSchemaLoading(): void {
    const loading = document.getElementById('schemaLoadingIndicator');
    if (loading) loading.style.display = 'none';
  }

  /**
   * Hide all alerts
   */
  private hideSchemaAlerts(): void {
    const errorAlert = document.getElementById('schemaErrorAlert');
    const successAlert = document.getElementById('schemaSuccessAlert');

    if (errorAlert) errorAlert.style.display = 'none';
    if (successAlert) successAlert.style.display = 'none';
  }

  /**
   * Show success message
   */
  private showSchemaSuccess(message: string): void {
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

  /**
   * Show error message
   */
  private showSchemaError(message: string): void {
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

// Make available globally for HTML onclick handlers
declare global {
  interface Window {
    adminPanel: AdminPanel;
  }
}

// Create and export global instance
export const adminPanel = new AdminPanel();
window.adminPanel = adminPanel;