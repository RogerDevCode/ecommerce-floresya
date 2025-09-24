/**
 * 🌸 FloresYa Admin Panel - Modular TypeScript Edition
 * Complete admin panel with role validation and CRUD operations
 * Refactored into modular components for better maintainability
 */

import { AdminDashboard } from './admin/dashboard';
import { AdminImages } from './admin/images';
import { AdminOrders } from './admin/orders';
import { AdminProducts } from './admin/products';
import type {
  AdminUser,
  AdminPanelLogger
} from './admin/types';
import { AdminUsers } from './admin/users';
import { FloresYaAPI } from './services/apiClient';

class AdminPanel implements AdminPanelLogger {
  private api: FloresYaAPI;
  private currentUser: AdminUser | null = null;
  private currentSection = 'dashboard';
  private hoverIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Module instances
  public dashboard: AdminDashboard;
  public orders: AdminOrders;
  public users: AdminUsers;
  public products: AdminProducts;
  public images: AdminImages;

  constructor() {
    this.api = new FloresYaAPI();

    // Initialize modules
    this.dashboard = new AdminDashboard(this);
    this.orders = new AdminOrders(this);
    this.users = new AdminUsers(this);
    this.products = new AdminProducts(this, this.api);
    this.images = new AdminImages(this);
  }

  /**
   * Initialize admin panel
   */
  public async init(): Promise<void> {
    try {
      this.log('🌸 Initializing FloresYa Admin Panel...', 'info');

      // Check authentication first
      if (!this.checkAuthentication()) {
        this.log('❌ Authentication failed - redirecting to login', 'error');
        window.location.href = '/login';
        return;
      }

      // Check admin role
      if (!this.checkAdminRole()) {
        this.log('❌ Access denied - insufficient permissions', 'error');
        this.showAccessDenied();
        return;
      }

      // Initialize UI
      this.bindEvents();
      this.updatePageTitle(this.currentSection);

      // Load initial section data
      await this.loadSectionData(this.currentSection);

      this.log('✅ Admin Panel initialized successfully', 'success');

    } catch (error: unknown) {
      this.log('❌ Failed to initialize admin panel: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al inicializar el panel de administración');
    }
  }

  /**
   * Logger implementation
   */
  public log(message: string, level: 'info' | 'error' | 'success' | 'warn' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warn' ? '⚠️' : 'ℹ️';

    console.warn(`[${timestamp}] ${prefix} ${message}`);

    // Could also send to logging service here
  }

  /**
   * Check if user is authenticated
   */
  private checkAuthentication(): boolean {
    try {
      // Check for user session data
      const userData = localStorage.getItem('floresya_user');
      const sessionTime = localStorage.getItem('floresya_session');

      if (!userData || !sessionTime) {
        this.log('No user session found', 'warn');
        return false;
      }

      // Check if session is still valid (24 hours)
      const sessionAge = Date.now() - parseInt(sessionTime);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge > maxAge) {
        this.log('Session expired', 'warn');
        return false;
      }

      // Parse user info
      try {
        this.currentUser = JSON.parse(userData);
        this.log(`Authenticated as: ${this.currentUser?.email}`, 'info');
      } catch {
        this.log('Failed to parse user data', 'warn');
        return false;
      }

      return true;
    } catch (error: unknown) {
      this.log('Authentication check failed: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      return false;
    }
  }

  /**
   * Check if user has admin role
   */
  private checkAdminRole(): boolean {
    if (!this.currentUser) {
      this.log('No current user for role check', 'warn');
      return false;
    }

    const allowedRoles = ['admin', 'manager'];
    const hasValidRole = allowedRoles.includes(this.currentUser.role);

    if (!hasValidRole) {
      this.log(`Insufficient role: ${this.currentUser.role}. Required: ${allowedRoles.join(' or ')}`, 'warn');
    }

    return hasValidRole;
  }

  /**
   * Bind event handlers
   */
  private bindEvents(): void {
    // Navigation events
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        if (section) {
          this.switchSection(section);
        }
      });
    });

    // Logout event
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Global error handler
    window.addEventListener('error', (event) => {
      this.log(`Global error: ${event.error?.message ?? event.message}`, 'error');
    });

    // Global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.log(`Unhandled promise rejection: ${event.reason}`, 'error');
      event.preventDefault();
    });
  }

  /**
   * Switch between admin sections
   */
  private switchSection(section: string): void {
    try {
      this.log(`Switching to section: ${section}`, 'info');

      // Update navigation
      this.updateNavigation(section);

      // Update content visibility
      this.updateSectionVisibility(section);

      // Update page title
      this.updatePageTitle(section);

      // Load section data
      void this.loadSectionData(section);

      // Update current section
      this.currentSection = section;

    } catch (error: unknown) {
      this.log('Error switching section: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  }

  /**
   * Update navigation active state
   */
  private updateNavigation(section: string): void {
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
      const linkSection = link.getAttribute('data-section');
      link.classList.toggle('active', linkSection === section);
    });
  }

  /**
   * Update section content visibility
   */
  private updateSectionVisibility(section: string): void {
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(sectionEl => {
      const isVisible = sectionEl.id === `${section}Section`;
      sectionEl.classList.toggle('hidden', !isVisible);
    });
  }

  /**
   * Update page title
   */
  private updatePageTitle(section: string): void {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard - FloresYa Admin',
      products: 'Productos - FloresYa Admin',
      orders: 'Pedidos - FloresYa Admin',
      users: 'Usuarios - FloresYa Admin',
      occasions: 'Ocasiones - FloresYa Admin',
      images: 'Imágenes - FloresYa Admin'
    };

    document.title = titles[section] ?? 'FloresYa Admin';
  }

  /**
   * Load data for specific section
   */
  private async loadSectionData(section: string): Promise<void> {
    try {
      this.log(`Loading data for section: ${section}`, 'info');

      switch (section) {
        case 'dashboard':
          await this.dashboard.loadDashboardData();
          break;
        case 'products':
          await this.products.loadProductsData();
          break;
        case 'orders':
          await this.orders.loadOrdersData();
          break;
        case 'users':
          await this.users.loadUsersData();
          break;
        case 'occasions':
          await this.products.loadOccasionsData();
          break;
        case 'images':
          await this.images.loadImagesData();
          break;
        default:
          this.log(`Unknown section: ${section}`, 'warn');
      }
    } catch (error: unknown) {
      this.log(`Error loading ${section} data: ` + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError(`Error al cargar datos de ${section}`);
    }
  }

  /**
   * Logout user
   */
  private logout(): void {
    try {
      this.log('Logging out user', 'info');

      // Clear authentication data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      sessionStorage.removeItem('authToken');

      // Clear current user
      this.currentUser = null;

      // Redirect to login
      window.location.href = '/login';

    } catch (error: unknown) {
      this.log('Error during logout: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  }

  /**
   * Show access denied message
   */
  private showAccessDenied(): void {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="container mx-auto px-4">
          <div class="flex justify-center">
            <div class="w-full max-w-md">
              <div class="bg-white rounded-lg shadow-lg border border-gray-200">
                <div class="p-8 text-center">
                  <i class="bi bi-shield-exclamation text-6xl text-yellow-500 mb-4 block"></i>
                  <h3 class="text-xl font-bold mb-4">Acceso Denegado</h3>
                  <p class="text-gray-600 mb-6">No tienes permisos para acceder al panel de administración.</p>
                  <button class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors" onclick="window.location.href='/'">
                    Volver al Inicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    // Could implement toast notifications here
    this.log(message, 'error');
    alert(message);
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    // Could implement toast notifications here
    this.log(message, 'success');
  }

  /**
   * Show loading indicator
   */
  private showLoading(): void {
    const loadingEl = document.getElementById('globalLoading');
    if (loadingEl) {
      loadingEl.style.display = 'flex';
    }
  }

  /**
   * Hide loading indicator
   */
  private hideLoading(): void {
    const loadingEl = document.getElementById('globalLoading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  }

  /**
   * Show modal (Custom implementation with Tailwind)
   */
  public showModal(element: Element): void {
    const modalElement = element as HTMLElement;
    if (modalElement) {
      modalElement.classList.remove('hidden');
      modalElement.classList.add('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'bg-black', 'bg-opacity-50');

      // Add close functionality
      const closeButtons = modalElement.querySelectorAll('[data-modal-close]');
      closeButtons.forEach(button => {
        button.addEventListener('click', () => this.hideModal(modalElement));
      });

      // Close on backdrop click
      modalElement.addEventListener('click', (e) => {
        if (e.target === modalElement) {
          this.hideModal(modalElement);
        }
      });
    } else {
      this.log('Modal element not found', 'error');
    }
  }

  /**
   * Hide modal (Custom implementation)
   */
  public hideModal(element: Element): void {
    const modalElement = element as HTMLElement;
    if (modalElement) {
      modalElement.classList.add('hidden');
      modalElement.classList.remove('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'bg-black', 'bg-opacity-50');
    }
  }
}

// Auto-initialization only if not being dynamically imported
if (!document.querySelector('[data-dynamic-admin-init]')) {
  // Initialize admin panel when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const adminPanel = new AdminPanel();

    // Make admin panel globally available for onclick handlers
    (window as unknown as { adminPanel: AdminPanel }).adminPanel = adminPanel;

    // Initialize
    void adminPanel.init();
  });
}

export default AdminPanel;

// Auto-initialization only if not being dynamically imported
if (!document.querySelector('[data-dynamic-admin-init]')) {
  document.addEventListener('DOMContentLoaded', () => {
    const adminPanel = new AdminPanel();
    window.adminPanel = adminPanel;
    adminPanel.init().catch(error => {
      console.error('❌ Critical: AdminPanel initialization failed:', error);
      alert('Error crítico: No se pudo cargar el panel de administración. Por favor, recargue la página.');
    });
  });
}
