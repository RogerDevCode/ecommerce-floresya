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

type AdminProduct = Product;

interface AdminOrder {
  id: number;
  customer_name: string;
  total_amount_usd: number;
  status: string;
  created_at: string;
}

interface AdminOccasion {
  id: number;
  name: string;
  type: string;
  display_order: number;
  is_active: boolean;
}

import { FloresYaAPI } from './services/api.js';
import type { Product, Occasion } from '../config/supabase.js';
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
      const sessionAge = Date.now() - parseInt(sessionTime);
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
   * Bind all event listeners
   */
  private bindEvents(): void {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = (e.target as HTMLElement).dataset.section || '';
        this.switchSection(section);
      });
    });

    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('adminSidebar');
        sidebar?.classList.toggle('show');
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Back to site button
    const backToSiteBtn = document.getElementById('backToSite');
    if (backToSiteBtn) {
      backToSiteBtn.addEventListener('click', () => {
        window.location.href = '/';
      });
    }

    // Product management buttons
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
      this.log('✅ addProductBtn found in bindEvents, adding event listener', 'info');
      addProductBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.log('🖱️ addProductBtn clicked from bindEvents, calling showAddProductModal', 'info');
        try {
          this.showAddProductModal();
        } catch (error) {
          this.log('❌ Error in showAddProductModal from bindEvents: ' + error, 'error');
          console.error('Error calling showAddProductModal:', error);
        }
      });
    } else {
      this.log('❌ addProductBtn not found in bindEvents', 'warn');
    }

    // User management buttons
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => {
        this.showAddUserModal();
      });
    }

    // Occasion management buttons
    const addOccasionBtn = document.getElementById('addOccasionBtn');
    if (addOccasionBtn) {
      addOccasionBtn.addEventListener('click', () => {
        this.showAddOccasionModal();
      });
    }
  }

  /**
   * Bind product management buttons (called after products section is loaded)
   */
  private bindProductButtons(): void {
    this.log('🔧 Binding product management buttons...', 'info');

    // Debug: Check if we're in the products section
    const currentSection = document.querySelector('.admin-section.active');
    this.log('📍 Current active section: ' + (currentSection ? currentSection.id : 'none'), 'info');

    // Product management buttons
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
      this.log('✅ addProductBtn found, adding event listener', 'info');
      this.log('📋 Button details: ' + addProductBtn.outerHTML.substring(0, 100) + '...', 'info');

      // Remove any existing event listeners to prevent duplicates
      const newBtn = addProductBtn.cloneNode(true) as HTMLElement;
      addProductBtn.parentNode?.replaceChild(newBtn, addProductBtn);

      // Add new event listener
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.log('🖱️ addProductBtn clicked, calling showAddProductModal', 'info');
        try {
          this.showAddProductModal();
        } catch (error) {
          this.log('❌ Error in showAddProductModal: ' + error, 'error');
          console.error('Error calling showAddProductModal:', error);
        }
      });

      this.log('✅ Event listener successfully attached to addProductBtn', 'success');
    } else {
      this.log('❌ addProductBtn not found in DOM', 'error');

      // Debug: List all buttons in the document
      const allButtons = document.querySelectorAll('button');
      this.log('🔍 All buttons found: ' + allButtons.length, 'info');
      allButtons.forEach((btn, index) => {
        if (btn.id) {
          this.log(`🔍 Button ${index}: #${btn.id} - ${btn.textContent?.trim()}`, 'info');
        }
      });

      // Try to find it in the products section specifically
      const productsSection = document.getElementById('products-section');
      if (productsSection) {
        this.log('📂 Products section found, searching for button inside it', 'info');
        const btnInSection = productsSection.querySelector('#addProductBtn');
        if (btnInSection) {
          this.log('✅ Found addProductBtn in products section, attaching listener', 'info');
          btnInSection.addEventListener('click', (e) => {
            e.preventDefault();
            this.log('🖱️ addProductBtn (in section) clicked, calling showAddProductModal', 'info');
            try {
              this.showAddProductModal();
            } catch (error) {
              this.log('❌ Error in showAddProductModal: ' + error, 'error');
              console.error('Error calling showAddProductModal:', error);
            }
          });
        } else {
          this.log('❌ addProductBtn not found even in products section', 'error');
          // Debug: List all elements in products section
          const allElements = productsSection.querySelectorAll('*');
          this.log('🔍 All elements in products section: ' + allElements.length, 'info');
          allElements.forEach((el, index) => {
            if (el.id && el.id.includes('Btn')) {
              this.log(`🔍 Element ${index}: #${el.id} - ${el.tagName}`, 'info');
            }
          });
        }
      } else {
        this.log('❌ Products section not found', 'error');
      }
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
    this.loadSectionData(section);

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

    const titleData = titles[section] || titles.dashboard;

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
        break;
      case 'users':
        await this.loadUsersData();
        break;
      case 'occasions':
        await this.loadOccasionsData();
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
   * Load orders data
   */
  private async loadOrdersData(): Promise<void> {
    try {
      // Mock data for demonstration
      const mockOrders: AdminOrder[] = [
        { id: 1234, customer_name: 'María González', total_amount_usd: 45.99, status: 'pending', created_at: '2024-01-15' },
        { id: 1235, customer_name: 'Juan Pérez', total_amount_usd: 78.50, status: 'confirmed', created_at: '2024-01-14' }
      ];
      this.renderOrdersTable(mockOrders);
    } catch (error) {
      this.log('Error loading orders: ' + error, 'error');
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
   * Update dashboard metrics
   */
  private updateMetrics(data: { totalProducts?: number; totalOrders?: number; totalUsers?: number; totalRevenue?: number }): void {
    const totalProducts = document.getElementById('totalProducts');
    const totalOrders = document.getElementById('totalOrders');
    const totalUsers = document.getElementById('totalUsers');
    const totalRevenue = document.getElementById('totalRevenue');

    if (totalProducts) totalProducts.textContent = (data.totalProducts || 0).toString();
    if (totalOrders) totalOrders.textContent = (data.totalOrders || 0).toString();
    if (totalUsers) totalUsers.textContent = (data.totalUsers || 0).toString();
    if (totalRevenue) totalRevenue.textContent = `$${(data.totalRevenue || 0).toFixed(2)}`;
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
      <div class="alert alert-${alert.type || 'info'} mb-2">
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
        <i class="bi bi-${activity.icon || 'circle'} me-2 text-muted"></i>
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
   * Render orders table
   */
  private renderOrdersTable(orders: AdminOrder[]): void {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

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
        <td>${user.full_name || 'N/A'}</td>
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
    return statusMap[status] || status;
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
    return typeMap[type] || type;
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
        if (key && key.startsWith('floresya_')) {
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
            carousel_order: p.carousel_order!
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
        const occasions = response.data || [];
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
  private generateOccasionsCheckboxes(occasions: AdminOccasion[], product?: AdminProduct): string {
    if (!occasions || occasions.length === 0) {
      return '<p class="text-muted">No hay ocasiones disponibles</p>';
    }

    // TODO: Get product's current occasions when editing
    const selectedOccasions = new Set<number>(); // For now, empty set for new products

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
  private generateCarouselPositionHTML(carouselProducts: Array<{id: number; name: string; summary?: string; carousel_order: number}>, currentProductId?: number): string {
    const maxPositions = 7;
    const occupiedPositions = new Map<number, {id: number; name: string; summary?: string}>();

    // Map occupied positions
    carouselProducts.forEach(product => {
      if (product.carousel_order && product.id !== currentProductId) {
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
      const isAvailable = !occupied;
      const inputId = `carouselPos${position}`;

      if (occupied) {
        // Occupied position - show product name and allow replacement
        const truncatedName = occupied.name.length > 25 ? occupied.name.substring(0, 25) + '...' : occupied.name;
        html += `
          <div class="carousel-position occupied">
            <input type="radio" name="carouselPosition" id="${inputId}" value="${position}">
            <label for="${inputId}">
              <strong>Posición ${position}</strong> - "${truncatedName}"
              <small class="text-muted d-block">🔄 Reemplazar</small>
            </label>
          </div>
        `;
      } else {
        // Available position
        const isDisabled = isFull && position > carouselCount + 1;
        html += `
          <div class="carousel-position available">
            <input type="radio" name="carouselPosition" id="${inputId}" value="${position}" ${isDisabled ? 'disabled' : ''}>
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

  private log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
    const prefix = '[🌸 Admin Panel]';
    const timestamp = new Date().toISOString();
    const output = `${prefix} [${level.toUpperCase()}] ${timestamp} — ${message}`;

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
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

  private async showProductModal(product: Product | null): Promise<void> {
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
      this.log('🔍 Bootstrap Modal available: ' + !!((window as WindowWithBootstrap).bootstrap!.Modal), 'info');
    }

    const modalTitle = product ? 'Editar Producto' : 'Crear Nuevo Producto';
    const saveButtonText = product ? 'Actualizar' : 'Crear';

    this.log('📝 Creating modal HTML for: ' + modalTitle);

    // Create occasions options HTML
    const occasionsOptions = occasions.map(occasion =>
      `<option value="${occasion.id}">${occasion.name}</option>`
    ).join('');

    // Generate carousel position HTML
    const carouselPositionHTML = this.generateCarouselPositionHTML(carouselProducts, product?.id);

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
                             value="${product?.name || ''}">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="productPrice" class="form-label">Precio USD *</label>
                      <input type="text" class="form-control" id="productPrice" required
                             value="${product?.price_usd || ''}" placeholder="0.00">
                      <div class="form-text">Usar punto (.) como separador decimal. Ej: 25.50</div>
                    </div>
                  </div>
                </div>


                <div class="mb-3">
                  <label for="productSummary" class="form-label">Resumen *</label>
                  <input type="text" class="form-control" id="productSummary" required
                         value="${product?.summary || ''}" placeholder="Breve descripción del producto">
                  <div class="form-text">Mínimo 10 caracteres, máximo 500</div>
                </div>

                <div class="mb-3">
                  <label for="productDescription" class="form-label">Descripción *</label>
                  <textarea class="form-control" id="productDescription" rows="3" required>${product?.description || ''}</textarea>
                </div>

                <div class="mb-3">
                  <label class="form-label">Ocasiones</label>
                  <div class="form-text mb-2">Selecciona las ocasiones donde aparecerá este producto</div>
                  <div class="occasions-checkboxes" id="productOccasions">
                    ${this.generateOccasionsCheckboxes(occasions, product || undefined)}
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
        const success = await this.saveProduct(product?.id || null);

        // Only hide modal if save was successful
        if (success) {
          const modalElement = document.getElementById('productModal');
          if (modalElement) {
            if (modal && typeof modal.hide === 'function') {
              modal.hide();
              this.log('✅ Bootstrap modal hidden after successful save');
            } else {
              modalElement.style.display = 'none';
              modalElement.remove();
              this.log('✅ Fallback modal hidden after successful save');
            }
          }
        } else {
          this.log('⚠️ Modal remains open due to save error');
        }
      });
    } else {
      this.log('❌ Save button not found in modal');
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
        summary: summary || undefined,
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

        // Clear form for new products and prepare for next entry
        if (!productId) {
          this.clearProductForm();
          // Auto-hide success message after showing it briefly
          setTimeout(() => {
            this.hideProductMessage();
          }, 2000);
        }
        return true; // Success
      } else {
        // API returned error - show in modal
        const errorMessage = response.message || 'Error desconocido al guardar el producto';
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

    this.log('Product form cleared after successful creation', 'info');
  }

  private showAddUserModal(): void {
    alert('Funcionalidad de agregar usuario próximamente...');
  }

  private showAddOccasionModal(): void {
    alert('Funcionalidad de agregar ocasión próximamente...');
  }

  // Public methods for HTML onclick handlers
  public async editProduct(id: number): Promise<void> {
    try {
      this.log(`Editing product ${id}`, 'info');

      // Get product data from API
      const response = await this.api.getProduct(id);

      if (response.success && response.data) {
        this.showProductModal(response.data);
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

  public viewOrder(id: number): void {
    alert(`Ver pedido ${id} - Próximamente...`);
  }

  public editUser(id: number): void {
    alert(`Editar usuario ${id} - Próximamente...`);
  }

  public deleteUser(id: number): void {
    if (confirm(`¿Eliminar usuario ${id}?`)) {
      alert('Funcionalidad de eliminar usuario próximamente...');
    }
  }

  public editOccasion(id: number): void {
    alert(`Editar ocasión ${id} - Próximamente...`);
  }

  public deleteOccasion(id: number): void {
    if (confirm(`¿Eliminar ocasión ${id}?`)) {
      alert('Funcionalidad de eliminar ocasión próximamente...');
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
      this.showAddProductModal();
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