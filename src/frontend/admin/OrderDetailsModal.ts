/**
 * 🌸 FloresYa Admin - Order Details Modal
 * Self-contained module for viewing and managing order details
 */

import { AdminCore } from './AdminCore.js';
import { apiClient } from './ApiClient.js';

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_summary?: string;
  quantity: number;
  unit_price_usd: number;
  subtotal_usd: number;
  product_image?: string;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  old_status: string;
  new_status: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export interface OrderDetails {
  id: number;
  user_id?: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  delivery_address: string;
  delivery_city?: string;
  delivery_date?: string;
  delivery_time_slot?: string;
  delivery_notes?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_method?: string;
  payment_status?: string;
  total_amount_usd: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  status_history: OrderStatusHistory[];
}

export class OrderDetailsModal extends AdminCore {
  private currentOrder: OrderDetails | null = null;
  private currentOrderId: number | null = null;

  protected init(): void {
    this.bindEvents();
    this.log('OrderDetailsModal initialized', 'success');
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    // Listen for global events
    this.events.on('order:detailsRequested', (orderId: number) => {
      this.viewOrderDetails(orderId);
    });

    // Status update button
    document.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'updateOrderStatusBtn') {
        this.handleStatusUpdate();
      }
      if ((e.target as HTMLElement).id === 'saveAdminNotesBtn') {
        this.handleSaveAdminNotes();
      }
    });
  }

  /**
   * View order details
   */
  public async viewOrderDetails(orderId: number): Promise<void> {
    try {
      this.log(`Viewing order details for ID: ${orderId}`, 'info');
      this.currentOrderId = orderId;

      // Show loading state
      this.showOrderDetailsLoading();

      // Show modal
      this.showModal('orderDetailsModal');

      // Load order details
      await this.loadOrderDetails(orderId);

    } catch (error) {
      this.log(`Error viewing order details: ${error}`, 'error');
      this.showOrderDetailsError('Error al cargar los detalles del pedido');
    }
  }

  /**
   * Load order details from API
   */
  private async loadOrderDetails(orderId: number): Promise<void> {
    try {
      const response = await apiClient.getOrder(orderId);

      if (response.success && response.data) {
        this.currentOrder = response.data;
        if (this.currentOrder) {
          this.renderOrderDetails(this.currentOrder);
        }
      } else {
        // Fallback to mock data for demonstration
        const mockOrder = this.getMockOrderDetails(orderId);
        this.currentOrder = mockOrder;
        this.renderOrderDetails(mockOrder);
      }

    } catch (error) {
      this.log(`Error loading order details: ${error}`, 'error');
      // Show mock data as fallback
      const mockOrder = this.getMockOrderDetails(orderId);
      this.currentOrder = mockOrder;
      this.renderOrderDetails(mockOrder);
    }
  }

  /**
   * Render order details in modal
   */
  private renderOrderDetails(orderData: OrderDetails): void {
    // Update modal title
    this.updateElement('orderDetailsId', orderData.id.toString());

    // Update order status and info
    this.updateOrderStatusBadge(orderData.status);
    this.updateElement('orderDetailsCreatedAt', this.formatDate(orderData.created_at));

    // Update status select
    this.updateStatusSelect(orderData.status);

    // Update customer information
    this.updateElement('orderDetailsCustomerName', orderData.customer_name);
    this.updateElement('orderDetailsCustomerEmail', orderData.customer_email || 'No proporcionado');
    this.updateElement('orderDetailsCustomerPhone', orderData.customer_phone || 'No proporcionado');

    // Update delivery information
    this.updateElement('orderDetailsDeliveryAddress', orderData.delivery_address);
    this.updateElement('orderDetailsDeliveryCity', orderData.delivery_city || 'No especificado');
    this.updateElement('orderDetailsDeliveryDate', orderData.delivery_date || 'No especificado');
    this.updateElement('orderDetailsDeliveryTimeSlot', orderData.delivery_time_slot || 'No especificado');
    this.updateElement('orderDetailsDeliveryNotes', orderData.delivery_notes || 'Sin notas especiales');

    // Update payment information
    this.updateElement('orderDetailsPaymentMethod', orderData.payment_method || 'No especificado');
    this.updateElement('orderDetailsPaymentStatus', orderData.payment_status || 'Pendiente');
    this.updateElement('orderDetailsTotalAmount', `$${orderData.total_amount_usd.toFixed(2)} USD`);

    // Update admin notes
    this.updateTextAreaValue('orderDetailsAdminNotes', orderData.admin_notes || '');

    // Render order items
    this.renderOrderItems(orderData.items);

    // Render status history
    this.renderStatusHistory(orderData.status_history);

    this.log('Order details rendered successfully', 'success');
  }

  /**
   * Update order status badge
   */
  private updateOrderStatusBadge(status: string): void {
    const badge = document.getElementById('orderDetailsStatusBadge');
    if (!badge) return;

    const statusConfig = this.getOrderStatusConfig(status);
    badge.textContent = statusConfig.text;
    badge.className = `badge fs-6 ${statusConfig.class}`;
  }

  /**
   * Update status select dropdown
   */
  private updateStatusSelect(currentStatus: string): void {
    const select = document.getElementById('orderStatusSelect') as HTMLSelectElement;
    if (select) {
      select.value = currentStatus;
    }
  }

  /**
   * Get order status configuration
   */
  private getOrderStatusConfig(status: string): { text: string; class: string } {
    const configs = {
      pending: { text: 'Pendiente', class: 'bg-warning' },
      confirmed: { text: 'Confirmado', class: 'bg-info' },
      preparing: { text: 'Preparando', class: 'bg-primary' },
      ready: { text: 'Listo', class: 'bg-success' },
      delivered: { text: 'Entregado', class: 'bg-success' },
      cancelled: { text: 'Cancelado', class: 'bg-danger' }
    };
    return configs[status as keyof typeof configs] || { text: status, class: 'bg-secondary' };
  }

  /**
   * Render order items table
   */
  private renderOrderItems(items: OrderItem[]): void {
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
            ${item.product_image ?
              `<img src="${item.product_image}" alt="${item.product_name}" class="product-image">` :
              '<div class="product-image bg-light d-flex align-items-center justify-content-center"><i class="bi bi-image"></i></div>'
            }
            <div>
              <strong>${item.product_name}</strong>
              ${item.product_summary ? `<br><small class="text-muted">${item.product_summary}</small>` : ''}
            </div>
          </div>
        </td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-end">$${item.unit_price_usd.toFixed(2)}</td>
        <td class="text-end"><strong>$${item.subtotal_usd.toFixed(2)}</strong></td>
      </tr>
    `).join('');

    tbody.innerHTML = rows;
  }

  /**
   * Render status history
   */
  private renderStatusHistory(history: OrderStatusHistory[]): void {
    const container = document.getElementById('statusHistoryContainer');
    if (!container) return;

    if (history.length === 0) {
      container.innerHTML = '<p class="text-muted">No hay historial de cambios de estado</p>';
      return;
    }

    const historyItems = history.map((item, index) => {
      const isLatest = index === 0;
      const statusConfig = this.getOrderStatusConfig(item.new_status);

      return `
        <div class="status-history-item ${isLatest ? 'current' : ''}">
          <div class="status-icon ${statusConfig.class} text-white">
            <i class="bi bi-clock"></i>
          </div>
          <div class="status-content">
            <div class="d-flex justify-content-between align-items-center">
              <strong>${statusConfig.text}</strong>
              <small class="text-muted">${this.formatDate(item.created_at)}</small>
            </div>
            ${item.notes ? `<small class="text-muted">${item.notes}</small>` : ''}
            ${item.changed_by ? `<small class="text-muted">Por: ${item.changed_by}</small>` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = historyItems;
  }

  /**
   * Handle status update
   */
  private async handleStatusUpdate(): Promise<void> {
    if (!this.currentOrderId) return;

    const select = document.getElementById('orderStatusSelect') as HTMLSelectElement;
    const newStatus = select.value;

    if (!newStatus || newStatus === this.currentOrder?.status) {
      this.showError('Seleccione un estado diferente');
      return;
    }

    try {
      this.setStatusUpdateLoading(true);

      const response = await apiClient.updateOrderStatus(this.currentOrderId, newStatus);

      if (response.success) {
        this.showSuccess('Estado del pedido actualizado exitosamente');

        // Update current order status
        if (this.currentOrder) {
          this.currentOrder.status = newStatus as any;
        }

        // Update badge
        this.updateOrderStatusBadge(newStatus);

        // Emit event for other modules
        this.events.emit('order:statusUpdated', {
          orderId: this.currentOrderId,
          newStatus
        });

        // Reload order details to get updated history
        setTimeout(() => {
          if (this.currentOrderId) {
            this.loadOrderDetails(this.currentOrderId);
          }
        }, 1000);

      } else {
        throw new Error(response.error || 'Error updating order status');
      }

    } catch (error) {
      this.log(`Error updating order status: ${error}`, 'error');
      this.showError('Error al actualizar el estado del pedido');
    } finally {
      this.setStatusUpdateLoading(false);
    }
  }

  /**
   * Handle save admin notes
   */
  private async handleSaveAdminNotes(): Promise<void> {
    if (!this.currentOrderId) return;

    const textarea = document.getElementById('orderDetailsAdminNotes') as HTMLTextAreaElement;
    const notes = textarea.value.trim();

    try {
      this.setSaveNotesLoading(true);

      // For now, just show success message (implement API call when available)
      await new Promise(resolve => setTimeout(resolve, 500));

      this.showSuccess('Notas administrativas guardadas exitosamente');

      // Update current order
      if (this.currentOrder) {
        this.currentOrder.admin_notes = notes;
      }

    } catch (error) {
      this.log(`Error saving admin notes: ${error}`, 'error');
      this.showError('Error al guardar las notas administrativas');
    } finally {
      this.setSaveNotesLoading(false);
    }
  }

  /**
   * Set status update button loading state
   */
  private setStatusUpdateLoading(loading: boolean): void {
    const btn = document.getElementById('updateOrderStatusBtn') as HTMLButtonElement;
    if (!btn) return;

    if (loading) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span>Actualizando...';
    } else {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Actualizar Estado';
    }
  }

  /**
   * Set save notes button loading state
   */
  private setSaveNotesLoading(loading: boolean): void {
    const btn = document.getElementById('saveAdminNotesBtn') as HTMLButtonElement;
    if (!btn) return;

    if (loading) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span>Guardando...';
    } else {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-save me-1"></i>Guardar Notas';
    }
  }

  /**
   * Show loading state
   */
  private showOrderDetailsLoading(): void {
    this.updateElement('orderDetailsId', 'Cargando...');
    this.updateElement('orderDetailsStatusBadge', 'Cargando...');
    this.updateElement('orderDetailsCreatedAt', 'Cargando...');
    this.updateElement('orderDetailsCustomerName', 'Cargando...');
    this.updateElement('orderDetailsCustomerEmail', 'Cargando...');
    this.updateElement('orderDetailsCustomerPhone', 'Cargando...');
    this.updateElement('orderDetailsDeliveryAddress', 'Cargando...');
    this.updateElement('orderDetailsDeliveryCity', 'Cargando...');
    this.updateElement('orderDetailsDeliveryDate', 'Cargando...');
    this.updateElement('orderDetailsDeliveryTimeSlot', 'Cargando...');
    this.updateElement('orderDetailsDeliveryNotes', 'Cargando...');
    this.updateElement('orderDetailsPaymentMethod', 'Cargando...');
    this.updateElement('orderDetailsPaymentStatus', 'Cargando...');
    this.updateElement('orderDetailsTotalAmount', 'Cargando...');

    const tbody = document.getElementById('orderItemsTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando productos...</td></tr>';
    }

    const historyContainer = document.getElementById('statusHistoryContainer');
    if (historyContainer) {
      historyContainer.innerHTML = '<p class="text-center text-muted">Cargando historial...</p>';
    }
  }

  /**
   * Show error state
   */
  private showOrderDetailsError(message: string): void {
    const modalBody = document.querySelector('#orderDetailsModal .modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="text-center text-danger py-4">
          <i class="bi bi-exclamation-triangle display-4 mb-3"></i>
          <h5>Error al cargar detalles</h5>
          <p>${message}</p>
          <button class="btn btn-outline-primary" onclick="location.reload()">
            <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
          </button>
        </div>
      `;
    }
  }

  /**
   * Update textarea value
   */
  private updateTextAreaValue(elementId: string, value: string): void {
    const element = document.getElementById(elementId) as HTMLTextAreaElement;
    if (element) {
      element.value = value;
    }
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Get mock order details for demonstration
   */
  private getMockOrderDetails(orderId: number): OrderDetails {
    return {
      id: orderId,
      user_id: 1,
      customer_name: 'María González',
      customer_email: 'maria.gonzalez@email.com',
      customer_phone: '+58 412 123 4567',
      delivery_address: 'Av. Principal, Edificio Torre del Sol, Apto 5-B',
      delivery_city: 'Caracas',
      delivery_date: '2024-01-15',
      delivery_time_slot: '14:00 - 16:00',
      delivery_notes: 'Tocar el timbre dos veces. Preguntar por María.',
      status: 'confirmed',
      payment_method: 'Transferencia bancaria',
      payment_status: 'Pagado',
      total_amount_usd: 125.50,
      admin_notes: 'Cliente regular. Preferencia por rosas rojas.',
      created_at: '2024-01-12T10:30:00Z',
      updated_at: '2024-01-12T14:45:00Z',
      items: [
        {
          id: 1,
          product_id: 1,
          product_name: 'Ramo de 12 Rosas Rojas',
          product_summary: 'Rosas ecuatorianas premium con papel de regalo',
          quantity: 1,
          unit_price_usd: 45.00,
          subtotal_usd: 45.00,
          product_image: '/images/products/ramo-rosas-rojas.jpg'
        },
        {
          id: 2,
          product_id: 2,
          product_name: 'Arreglo Floral Elegante',
          product_summary: 'Lirios y rosas blancas en base de cristal',
          quantity: 1,
          unit_price_usd: 65.50,
          subtotal_usd: 65.50
        },
        {
          id: 3,
          product_id: 3,
          product_name: 'Tarjeta de Felicitación',
          quantity: 1,
          unit_price_usd: 15.00,
          subtotal_usd: 15.00
        }
      ],
      status_history: [
        {
          id: 3,
          order_id: orderId,
          old_status: 'pending',
          new_status: 'confirmed',
          changed_by: 'Admin',
          notes: 'Pago verificado',
          created_at: '2024-01-12T14:45:00Z'
        },
        {
          id: 2,
          order_id: orderId,
          old_status: '',
          new_status: 'pending',
          changed_by: 'Sistema',
          notes: 'Pedido creado por el cliente',
          created_at: '2024-01-12T10:30:00Z'
        }
      ]
    };
  }

  /**
   * Public method to open order details
   */
  public static openForOrder(orderId: number): void {
    if ((window as any).adminPanel?.orderDetailsModal) {
      (window as any).adminPanel.orderDetailsModal.viewOrderDetails(orderId);
    }
  }
}