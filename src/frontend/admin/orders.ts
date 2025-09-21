/**
 * 🌸 FloresYa Admin Orders Module
 * Handles orders management, filtering, pagination, and order details
 */

import type { AdminOrder, OrdersFilters, OrderDetails, AdminPanelLogger, WindowWithBootstrap } from './types.js';

export class AdminOrders {
  private logger: AdminPanelLogger;

  constructor(logger: AdminPanelLogger) {
    this.logger = logger;
  }

  /**
   * Load orders data with filtering and pagination
   */
  public async loadOrdersData(page = 1, filters: OrdersFilters = {}): Promise<void> {
    try {
      this.showOrdersLoading();

      // Build query parameters
      const queryParams = {
        page,
        limit: 20,
        ...filters
      };

      this.logger.log(`Loading orders with params: ${JSON.stringify(queryParams)}`, 'info');

      // Fetch real orders data from API
      const response = await fetch(`/api/admin/orders?${new URLSearchParams(
        Object.entries(queryParams).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      )}`);

      if (!response.ok) throw new Error('Failed to fetch orders');

      const ordersData = await response.json();
      this.logger.log(`Loaded ${ordersData.orders?.length ?? 0} orders from API`, 'success');

      // Update stats
      this.updateOrdersStats(ordersData.orders ?? []);

      // Render table
      this.renderOrdersTable(ordersData.orders ?? []);

      // Render pagination
      this.renderOrdersPagination(ordersData.pagination ?? { page: 1, totalPages: 1, total: 0 });

      // Update filter info
      this.updateOrdersFilterInfo(filters, ordersData.orders?.length ?? 0);

    } catch (error: unknown) {
      this.logger.log('Error loading orders: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showOrdersError('Error al cargar los pedidos');

      // Fallback to empty state
      this.renderOrdersTable([]);
      this.renderOrdersPagination({ page: 1, totalPages: 1, total: 0 });
    } finally {
      this.hideOrdersLoading();
    }
  }

  /**
   * Load order details for modal
   */
  public async loadOrderDetails(orderId: number): Promise<void> {
    try {
      this.showLoading();

      // Fetch real order details from API
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order details');

      const orderDetails = await response.json();
      this.logger.log(`Loaded order details for order ${orderId}`, 'success');

      // Update modal with order data
      this.renderOrderDetails(orderDetails);

    } catch (error: unknown) {
      this.logger.log('Error loading order details: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al cargar detalles del pedido');
      throw error;
    } finally {
      this.hideLoading();
    }
  }

  /**
   * View order details modal
   */
  public viewOrderDetails(orderId: number): void {
    try {
      this.logger.log(`Viewing order details for order ${orderId}`, 'info');

      // Load order details
      void this.loadOrderDetails(orderId);

    } catch (error: unknown) {
      this.logger.log('Error viewing order details: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  }

  /**
   * Update order status
   */
  public async updateOrderStatus(orderId: number, newStatus: string): Promise<void> {
    try {
      this.logger.log(`Updating order ${orderId} status to ${newStatus}`, 'info');

      // Send status update to API
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update order status');

      this.logger.log(`Order ${orderId} status updated successfully`, 'success');

      // Reload orders to reflect changes
      void this.loadOrdersData();

    } catch (error: unknown) {
      this.logger.log('Error updating order status: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al actualizar estado del pedido');
    }
  }

  /**
   * Save admin notes for order
   */
  public async saveOrderAdminNotes(orderId: number): Promise<void> {
    try {
      const notesInput = document.getElementById('adminNotesInput') as HTMLTextAreaElement;
      if (!notesInput) return;

      const notes = notesInput.value.trim();

      this.logger.log(`Saving admin notes for order ${orderId}`, 'info');

      // Send notes to API
      const response = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_notes: notes })
      });

      if (!response.ok) throw new Error('Failed to save notes');

      this.logger.log(`Admin notes saved for order ${orderId}`, 'success');
      this.showSuccess('Notas guardadas exitosamente');

    } catch (error: unknown) {
      this.logger.log('Error saving admin notes: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al guardar las notas');
    }
  }

  /**
   * Print order
   */
  public printOrder(): void {
    try {
      this.logger.log('Printing order', 'info');
      window.print();
    } catch (error: unknown) {
      this.logger.log('Error printing order: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  }

  /**
   * Render orders table
   */
  private renderOrdersTable(orders: AdminOrder[]): void {
    const ordersTableBody = document.getElementById('ordersTableBody');
    if (!ordersTableBody) return;

    if (orders.length === 0) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">
            <div class="text-muted">
              <i class="bi bi-inbox display-4 mb-3"></i>
              <p>No se encontraron pedidos</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    ordersTableBody.innerHTML = orders.map(order => `
      <tr>
        <td><strong>#${order.id}</strong></td>
        <td>
          <div class="fw-medium">${order.customer_name}</div>
          ${order.customer_email ? `<small class="text-muted">${order.customer_email}</small>` : ''}
        </td>
        <td>$${order.total_amount_usd.toFixed(2)}</td>
        <td>
          <span class="badge bg-${this.getStatusColor(order.status)}">${order.status}</span>
        </td>
        <td>${new Date(order.created_at).toLocaleDateString()}</td>
        <td>${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '-'}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="adminPanel.orders.viewOrderDetails(${order.id})"
                    title="Ver detalles">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-secondary" onclick="adminPanel.orders.printOrder()"
                    title="Imprimir">
              <i class="bi bi-printer"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Render order details in modal
   */
  private renderOrderDetails(orderDetails: OrderDetails): void {
    // Update modal header
    const orderIdEl = document.getElementById('orderModalId');
    if (orderIdEl) orderIdEl.textContent = `#${orderDetails.id}`;

    // Update customer info
    const customerNameEl = document.getElementById('orderCustomerName');
    const customerEmailEl = document.getElementById('orderCustomerEmail');
    const customerPhoneEl = document.getElementById('orderCustomerPhone');

    if (customerNameEl) customerNameEl.textContent = orderDetails.customer_name;
    if (customerEmailEl) customerEmailEl.textContent = orderDetails.customer_email;
    if (customerPhoneEl) customerPhoneEl.textContent = orderDetails.customer_phone ?? 'No especificado';

    // Update order info
    const orderStatusEl = document.getElementById('orderStatus');
    const orderDateEl = document.getElementById('orderDate');
    const orderTotalEl = document.getElementById('orderTotal');

    if (orderStatusEl) {
      orderStatusEl.innerHTML = `<span class="badge bg-${this.getStatusColor(orderDetails.status)}">${orderDetails.status}</span>`;
    }
    if (orderDateEl) orderDateEl.textContent = new Date(orderDetails.created_at).toLocaleDateString();
    if (orderTotalEl) orderTotalEl.textContent = `$${orderDetails.total_amount_usd.toFixed(2)}`;

    // Render order items
    this.renderOrderItems(orderDetails.items);

    // Show modal
    this.showOrderModal();
  }

  /**
   * Render order items
   */
  private renderOrderItems(items: OrderDetails['items']): void {
    const itemsContainer = document.getElementById('orderItemsContainer');
    if (!itemsContainer) return;

    itemsContainer.innerHTML = items.map(item => `
      <div class="row py-2 border-bottom">
        <div class="col-md-6">
          <strong>${item.product_name}</strong>
        </div>
        <div class="col-md-2 text-center">${item.quantity}</div>
        <div class="col-md-2 text-end">$${item.unit_price_usd.toFixed(2)}</div>
        <div class="col-md-2 text-end">$${item.subtotal_usd.toFixed(2)}</div>
      </div>
    `).join('');
  }

  /**
   * Update orders statistics
   */
  private updateOrdersStats(orders: AdminOrder[]): void {
    const totalOrdersEl = document.getElementById('ordersStatsTotal');
    const pendingOrdersEl = document.getElementById('ordersStatsPending');
    const completedOrdersEl = document.getElementById('ordersStatsCompleted');

    const pendingCount = orders.filter(order => order.status === 'pending').length;
    const completedCount = orders.filter(order => order.status === 'completed').length;

    if (totalOrdersEl) totalOrdersEl.textContent = orders.length.toString();
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingCount.toString();
    if (completedOrdersEl) completedOrdersEl.textContent = completedCount.toString();
  }

  /**
   * Render pagination controls
   */
  private renderOrdersPagination(pagination: { page: number; totalPages: number; total: number }): void {
    const paginationContainer = document.getElementById('ordersPagination');
    if (!paginationContainer) return;

    if (pagination.totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(`
        <li class="page-item ${i === pagination.page ? 'active' : ''}">
          <button class="page-link" onclick="adminPanel.orders.loadOrdersData(${i})">${i}</button>
        </li>
      `);
    }

    paginationContainer.innerHTML = `
      <nav>
        <ul class="pagination">
          <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="adminPanel.orders.loadOrdersData(${pagination.page - 1})">Anterior</button>
          </li>
          ${pages.join('')}
          <li class="page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="adminPanel.orders.loadOrdersData(${pagination.page + 1})">Siguiente</button>
          </li>
        </ul>
      </nav>
    `;
  }

  /**
   * Update filter information
   */
  private updateOrdersFilterInfo(filters: OrdersFilters, count: number): void {
    const filterInfoEl = document.getElementById('ordersFilterInfo');
    if (!filterInfoEl) return;

    const activeFilters = Object.entries(filters).filter(([, value]) => value);

    if (activeFilters.length === 0) {
      filterInfoEl.textContent = `Mostrando ${count} pedidos`;
    } else {
      filterInfoEl.textContent = `Mostrando ${count} pedidos con filtros activos`;
    }
  }

  /**
   * Get status color for badges
   */
  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'warning',
      'confirmed': 'info',
      'processing': 'primary',
      'shipped': 'secondary',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    return colors[status] ?? 'secondary';
  }

  /**
   * Show order modal
   */
  private showOrderModal(): void {
    const modalElement = document.getElementById('orderDetailsModal');
    if (modalElement && (window as WindowWithBootstrap).bootstrap?.Modal) {
      const Modal = (window as WindowWithBootstrap).bootstrap.Modal;
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  /**
   * Show orders loading state
   */
  private showOrdersLoading(): void {
    const loadingEl = document.getElementById('ordersLoading');
    if (loadingEl) loadingEl.style.display = 'block';
  }

  /**
   * Hide orders loading state
   */
  private hideOrdersLoading(): void {
    const loadingEl = document.getElementById('ordersLoading');
    if (loadingEl) loadingEl.style.display = 'none';
  }

  /**
   * Show orders error
   */
  private showOrdersError(message: string): void {
    const errorEl = document.getElementById('ordersError');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  /**
   * Show loading state
   */
  private showLoading(): void {
    // Implementation depends on UI structure
  }

  /**
   * Hide loading state
   */
  private hideLoading(): void {
    // Implementation depends on UI structure
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.logger.log(message, 'error');
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.logger.log(message, 'success');
  }
}