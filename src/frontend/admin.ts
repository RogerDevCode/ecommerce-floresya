/**
 * 🌸 FloresYa Admin Panel - Modular TypeScript Edition
 * Complete admin panel with role validation and CRUD operations
 * Refactored into modular components for better maintainability
 */

import { FloresYaAPI } from './services/api.js';
import { AdminDashboard } from './admin/dashboard.js';
import { AdminOrders } from './admin/orders.js';
import { AdminUsers } from './admin/users.js';
import { AdminProducts } from './admin/products.js';
import { AdminImages } from './admin/images.js';
import type {
  AdminUser,
  AdminPanelLogger,
  WindowWithBootstrap
} from './admin/types.js';

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
      // Check for authentication token
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        this.log('No authentication token found', 'warn');
        return false;
      }

      // Validate token format (basic check)
      if (token.length < 10) {
        this.log('Invalid token format', 'warn');
        return false;
      }

      // Get user info from token or storage
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          this.currentUser = JSON.parse(userInfo);
          this.log(`Authenticated as: ${this.currentUser?.email}`, 'info');
        } catch {
          this.log('Failed to parse user info', 'warn');
          return false;
        }
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
      sectionEl.classList.toggle('d-none', !isVisible);
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
        <div class="container-fluid">
          <div class="row justify-content-center">
            <div class="col-md-6">
              <div class="card">
                <div class="card-body text-center">
                  <i class="bi bi-shield-exclamation display-1 text-warning mb-3"></i>
                  <h3>Acceso Denegado</h3>
                  <p class="text-muted">No tienes permisos para acceder al panel de administración.</p>
                  <button class="btn btn-primary" onclick="window.location.href='/'">
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
   * Show modal (Bootstrap implementation)
   */
  public showModal(element: Element): void {
    if ((window as WindowWithBootstrap).bootstrap?.Modal) {
      const Modal = (window as WindowWithBootstrap).bootstrap.Modal;
      const modal = new Modal(element);
      modal.show();
    } else {
      this.log('Bootstrap Modal not available', 'error');
    }
  }

  /**
   * Hide modal (Bootstrap implementation)
   */
  public hideModal(element: Element): void {
    if ((window as WindowWithBootstrap).bootstrap?.Modal?.getInstance) {
      const modal = (window as WindowWithBootstrap).bootstrap.Modal.getInstance(element as HTMLElement);
      if (modal) {
        modal.hide();
      }
    }
  }
}

// Initialize admin panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const adminPanel = new AdminPanel();

  // Make admin panel globally available for onclick handlers
  (window as unknown as { adminPanel: AdminPanel }).adminPanel = adminPanel;

  // Initialize
  void adminPanel.init();
});

export default AdminPanel;