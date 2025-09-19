/**
 * 🌸 FloresYa Admin Panel - Main Orchestrator
 * Central controller that manages all admin modules and their interactions
 */

import { AdminCore } from './AdminCore.js';
import { apiClient } from './ApiClient.js';
import { adminEvents } from './EventEmitter.js';
import { ProductModal } from './ProductModal.js';
import { ProductImagesModal } from './ProductImagesModal.js';
import { UserModal } from './UserModal.js';
import { OccasionModal } from './OccasionModal.js';
import { OrderDetailsModal } from './OrderDetailsModal.js';

export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    completed: number;
    revenue: number;
  };
  products: {
    total: number;
    active: number;
    outOfStock: number;
  };
  users: {
    total: number;
    active: number;
    newThisMonth: number;
  };
}

export class AdminPanel extends AdminCore {
  // Module instances
  private productModal: ProductModal;
  private productImagesModal: ProductImagesModal;
  private userModal: UserModal;
  private occasionModal: OccasionModal;
  private orderDetailsModal: OrderDetailsModal;

  // State
  private currentSection: string = 'dashboard';
  private isInitialized: boolean = false;

  constructor() {
    super();

    // Initialize all modal modules
    this.productModal = new ProductModal();
    this.productImagesModal = new ProductImagesModal();
    this.userModal = new UserModal();
    this.occasionModal = new OccasionModal();
    this.orderDetailsModal = new OrderDetailsModal();

    // Make modules globally available for backward compatibility
    (window as any).adminPanel = {
      productModal: this.productModal,
      productImagesModal: this.productImagesModal,
      userModal: this.userModal,
      occasionModal: this.occasionModal,
      orderDetailsModal: this.orderDetailsModal,
      // Legacy methods for backward compatibility
      editProductImages: (productId: number, productName: string) => {
        this.events.emit('product:imagesRequested', productId, productName);
      },
      viewOrderDetails: (orderId: number) => {
        this.events.emit('order:detailsRequested', orderId);
      },
      deleteUser: (userId: number) => {
        this.userModal.deleteUser(userId);
      },
      deleteOccasion: (occasionId: number) => {
        this.occasionModal.deleteOccasion(occasionId);
      }
    };
  }

  protected init(): void {
    this.bindGlobalNavigation();
    this.bindModuleEvents();
    this.log('AdminPanel initialized', 'success');
    this.isInitialized = true;
  }

  /**
   * Main initialization method
   */
  public async initialize(): Promise<void> {
    try {
      this.log('🚀 Starting AdminPanel initialization', 'info');

      // Check authentication
      const isAuthenticated = await this.checkAuthentication();
      if (!isAuthenticated) {
        this.redirectToLogin();
        return;
      }

      // Check admin role
      const isAdmin = await this.checkAdminRole();
      if (!isAdmin) {
        this.showError('No tiene permisos de administrador');
        return;
      }

      // Initialize UI
      this.hideLoading();
      await this.loadDashboard();

      this.log('✅ AdminPanel initialization completed', 'success');

    } catch (error) {
      this.log(`❌ Error initializing AdminPanel: ${error}`, 'error');
      this.showError('Error al inicializar el panel de administración');
    }
  }

  /**
   * Bind main navigation events
   */
  private bindGlobalNavigation(): void {
    // Sidebar navigation
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const navLink = target.closest('[data-section]') as HTMLElement;

      if (navLink) {
        e.preventDefault();
        const section = navLink.dataset.section;
        if (section) {
          this.switchSection(section);
        }
      }
    });

    // Main action buttons
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Add buttons
      if (target.matches('#addProductBtn') || target.closest('#addProductBtn')) {
        this.events.emit('product:createRequested');
      }
      if (target.matches('#addUserBtn') || target.closest('#addUserBtn')) {
        this.events.emit('user:createRequested');
      }
      if (target.matches('#addOccasionBtn') || target.closest('#addOccasionBtn')) {
        this.events.emit('occasion:createRequested');
      }

      // Product management buttons
      if (target.matches('[onclick*="editProductImages"]') || target.closest('[onclick*="editProductImages"]')) {
        e.preventDefault();
        const productId = this.extractProductIdFromOnclick(target.getAttribute('onclick') || target.closest('[onclick]')?.getAttribute('onclick') || '');
        const productName = this.extractProductNameFromRow(target);
        if (productId) {
          this.events.emit('product:imagesRequested', productId, productName);
        }
      }

      // Order management buttons
      if (target.matches('[onclick*="viewOrderDetails"]') || target.closest('[onclick*="viewOrderDetails"]')) {
        e.preventDefault();
        const orderId = this.extractOrderIdFromOnclick(target.getAttribute('onclick') || target.closest('[onclick]')?.getAttribute('onclick') || '');
        if (orderId) {
          this.events.emit('order:detailsRequested', orderId);
        }
      }
    });
  }

  /**
   * Bind inter-module events
   */
  private bindModuleEvents(): void {
    // Product events
    this.events.on('product:saved', () => {
      this.loadProductsData();
      this.loadDashboardStats();
    });

    // User events
    this.events.on('user:saved', () => {
      this.loadUsersData();
      this.loadDashboardStats();
    });

    this.events.on('user:deleted', () => {
      this.loadUsersData();
      this.loadDashboardStats();
    });

    // Occasion events
    this.events.on('occasion:saved', () => {
      this.loadOccasionsData();
    });

    this.events.on('occasion:deleted', () => {
      this.loadOccasionsData();
    });

    // Order events
    this.events.on('order:statusUpdated', () => {
      this.loadOrdersData();
      this.loadDashboardStats();
    });

    // Product images events
    this.events.on('product:imagesUpdated', () => {
      this.loadProductsData(); // Refresh products list
    });
  }

  /**
   * Switch between admin sections
   */
  private switchSection(section: string): void {
    if (this.currentSection === section) {
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

    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
      const sectionElement = sec as HTMLElement;
      sectionElement.style.display = 'none';
      sectionElement.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
      targetSection.style.display = 'block';
      targetSection.classList.add('active');
    }

    // Load section data
    this.loadSectionData(section);

    this.currentSection = section;
  }

  /**
   * Load data for specific section
   */
  private async loadSectionData(section: string): Promise<void> {
    try {
      switch (section) {
        case 'dashboard':
          await this.loadDashboard();
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
        default:
          this.log(`Unknown section: ${section}`, 'warn');
      }
    } catch (error) {
      this.log(`Error loading section ${section}: ${error}`, 'error');
    }
  }

  /**
   * Load dashboard data
   */
  private async loadDashboard(): Promise<void> {
    try {
      await this.loadDashboardStats();
      this.log('Dashboard loaded successfully', 'success');
    } catch (error) {
      this.log(`Error loading dashboard: ${error}`, 'error');
    }
  }

  /**
   * Load dashboard statistics
   */
  private async loadDashboardStats(): Promise<void> {
    try {
      // For now, use mock data
      const stats: DashboardStats = {
        orders: {
          total: 127,
          pending: 15,
          completed: 98,
          revenue: 12450.00
        },
        products: {
          total: 45,
          active: 42,
          outOfStock: 3
        },
        users: {
          total: 1250,
          active: 1180,
          newThisMonth: 95
        }
      };

      this.renderDashboardStats(stats);

    } catch (error) {
      this.log(`Error loading dashboard stats: ${error}`, 'error');
    }
  }

  /**
   * Render dashboard statistics
   */
  private renderDashboardStats(stats: DashboardStats): void {
    // Update stats cards
    this.updateElement('totalOrdersCount', stats.orders.total.toString());
    this.updateElement('pendingOrdersCount', stats.orders.pending.toString());
    this.updateElement('completedOrdersCount', stats.orders.completed.toString());
    this.updateElement('totalRevenueAmount', `$${stats.orders.revenue.toFixed(2)}`);

    this.updateElement('totalProductsCount', stats.products.total.toString());
    this.updateElement('activeProductsCount', stats.products.active.toString());
    this.updateElement('outOfStockCount', stats.products.outOfStock.toString());

    this.updateElement('totalUsersCount', stats.users.total.toString());
    this.updateElement('activeUsersCount', stats.users.active.toString());
    this.updateElement('newUsersCount', stats.users.newThisMonth.toString());
  }

  /**
   * Load products data
   */
  private async loadProductsData(): Promise<void> {
    try {
      const response = await apiClient.getProducts();

      if (response.success && response.data) {
        this.renderProductsTable(response.data);
      } else {
        // Fallback to mock data
        this.renderProductsTable(this.getMockProductsData());
      }

    } catch (error) {
      this.log(`Error loading products: ${error}`, 'error');
      this.renderProductsTable(this.getMockProductsData());
    }
  }

  /**
   * Load orders data
   */
  private async loadOrdersData(): Promise<void> {
    try {
      const response = await apiClient.getOrders();

      if (response.success && response.data) {
        this.renderOrdersTable(response.data);
      } else {
        // Fallback to mock data
        this.renderOrdersTable(this.getMockOrdersData());
      }

    } catch (error) {
      this.log(`Error loading orders: ${error}`, 'error');
      this.renderOrdersTable(this.getMockOrdersData());
    }
  }

  /**
   * Load users data
   */
  private async loadUsersData(): Promise<void> {
    try {
      const response = await apiClient.getUsers();

      if (response.success && response.data) {
        this.renderUsersTable(response.data);
      } else {
        // Fallback to mock data
        this.renderUsersTable(this.getMockUsersData());
      }

    } catch (error) {
      this.log(`Error loading users: ${error}`, 'error');
      this.renderUsersTable(this.getMockUsersData());
    }
  }

  /**
   * Load occasions data
   */
  private async loadOccasionsData(): Promise<void> {
    try {
      const response = await apiClient.getOccasions();

      if (response.success && response.data) {
        this.renderOccasionsTable(response.data);
      } else {
        // Fallback to mock data
        this.renderOccasionsTable(this.getMockOccasionsData());
      }

    } catch (error) {
      this.log(`Error loading occasions: ${error}`, 'error');
      this.renderOccasionsTable(this.getMockOccasionsData());
    }
  }

  /**
   * Utility methods for rendering tables
   */
  private renderProductsTable(products: any[]): void {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay productos</td></tr>';
      return;
    }

    const rows = products.map(product => `
      <tr>
        <td>${product.id}</td>
        <td>
          <strong>${product.name}</strong>
          ${product.description ? `<br><small class="text-muted">${product.description.substring(0, 50)}...</small>` : ''}
        </td>
        <td>$${product.price}</td>
        <td>$${product.price_usd}</td>
        <td>
          <span class="badge ${product.is_featured ? 'bg-success' : 'bg-secondary'}">
            ${product.is_featured ? 'Destacado' : 'Normal'}
          </span>
        </td>
        <td>${product.carousel_order || 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="adminPanel.productModal.showEditProductModal(${JSON.stringify(product).replace(/"/g, '&quot;')})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-info me-1" onclick="adminPanel.editProductImages(${product.id}, '${product.name}')">
            <i class="bi bi-images"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="adminPanel.deleteProduct(${product.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.innerHTML = rows;
  }

  private renderOrdersTable(orders: any[]): void {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay pedidos</td></tr>';
      return;
    }

    const rows = orders.map(order => `
      <tr>
        <td>#${order.id}</td>
        <td>${order.customer_name}</td>
        <td>$${order.total_amount_usd}</td>
        <td>
          <span class="badge ${this.getOrderStatusClass(order.status)}">
            ${this.getOrderStatusText(order.status)}
          </span>
        </td>
        <td>${new Date(order.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="adminPanel.viewOrderDetails(${order.id})">
            <i class="bi bi-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');

    tbody.innerHTML = rows;
  }

  private renderUsersTable(users: any[]): void {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay usuarios</td></tr>';
      return;
    }

    const rows = users.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>
          <strong>${user.full_name}</strong>
          <br><small class="text-muted">${user.email}</small>
        </td>
        <td><span class="badge bg-primary">${user.role}</span></td>
        <td>
          <span class="badge ${user.is_active ? 'bg-success' : 'bg-danger'}">
            ${user.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="adminPanel.userModal.showEditUserModal(${JSON.stringify(user).replace(/"/g, '&quot;')})">
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

  private renderOccasionsTable(occasions: any[]): void {
    const tbody = document.getElementById('occasionsTableBody');
    if (!tbody) return;

    if (occasions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay ocasiones</td></tr>';
      return;
    }

    const rows = occasions.map(occasion => `
      <tr>
        <td>${occasion.id}</td>
        <td>
          <span class="badge me-2" style="background-color: ${occasion.color};">●</span>
          ${occasion.name}
        </td>
        <td><code>${occasion.slug}</code></td>
        <td>
          <span class="badge ${occasion.is_active ? 'bg-success' : 'bg-danger'}">
            ${occasion.is_active ? 'Activa' : 'Inactiva'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="adminPanel.occasionModal.showEditOccasionModal(${JSON.stringify(occasion).replace(/"/g, '&quot;')})">
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
   * Utility methods
   */
  private getOrderStatusClass(status: string): string {
    const classes = {
      pending: 'bg-warning',
      confirmed: 'bg-info',
      preparing: 'bg-primary',
      ready: 'bg-success',
      delivered: 'bg-success',
      cancelled: 'bg-danger'
    };
    return classes[status as keyof typeof classes] || 'bg-secondary';
  }

  private getOrderStatusText(status: string): string {
    const texts = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return texts[status as keyof typeof texts] || status;
  }

  private extractProductIdFromOnclick(onclickStr: string): number | null {
    const match = onclickStr.match(/editProductImages\((\d+)/);
    return match && match[1] ? parseInt(match[1]) : null;
  }

  private extractOrderIdFromOnclick(onclickStr: string): number | null {
    const match = onclickStr.match(/viewOrderDetails\((\d+)/);
    return match && match[1] ? parseInt(match[1]) : null;
  }

  private extractProductNameFromRow(element: HTMLElement): string {
    const row = element.closest('tr');
    if (row && row.cells && row.cells.length > 1) {
      const nameCell = row.cells[1];
      return nameCell?.textContent?.trim() || 'Producto';
    }
    return 'Producto';
  }

  private redirectToLogin(): void {
    window.location.href = '/auth/login';
  }

  private hideLoading(): void {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  /**
   * Mock data methods for fallback
   */
  private getMockProductsData(): any[] {
    return [
      { id: 1, name: 'Ramo de 12 Rosas Rojas', description: 'Hermosas rosas rojas ecuatorianas', price: 45.00, price_usd: 45.00, is_featured: true, carousel_order: 1 },
      { id: 2, name: 'Arreglo Floral Elegante', description: 'Lirios y rosas en base de cristal', price: 65.50, price_usd: 65.50, is_featured: false, carousel_order: null }
    ];
  }

  private getMockOrdersData(): any[] {
    return [
      { id: 1, customer_name: 'María González', total_amount_usd: 125.50, status: 'confirmed', created_at: '2024-01-12T10:30:00Z' },
      { id: 2, customer_name: 'Carlos Pérez', total_amount_usd: 89.00, status: 'pending', created_at: '2024-01-11T15:20:00Z' }
    ];
  }

  private getMockUsersData(): any[] {
    return [
      { id: 1, full_name: 'Admin User', email: 'admin@floresya.com', role: 'admin', is_active: true },
      { id: 2, full_name: 'María González', email: 'maria@example.com', role: 'user', is_active: true }
    ];
  }

  private getMockOccasionsData(): any[] {
    return [
      { id: 1, name: 'San Valentín', slug: 'san-valentin', color: '#e91e63', is_active: true },
      { id: 2, name: 'Día de la Madre', slug: 'dia-madre', color: '#ff9800', is_active: true }
    ];
  }

  /**
   * Public methods for global access
   */
  public static getInstance(): AdminPanel {
    if (!(window as any).__adminPanelInstance) {
      (window as any).__adminPanelInstance = new AdminPanel();
    }
    return (window as any).__adminPanelInstance;
  }
}