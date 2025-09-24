/**
 * 🌸 FloresYa Admin Products Module
 * Handles product management, CRUD operations, and product table rendering
 */

import type { FloresYaAPI } from '@frontend/services/apiClient';

import type { Product, AdminOccasion, AdminPanelLogger } from './types';

export class AdminProducts {
  private logger: AdminPanelLogger;
  private api: FloresYaAPI;

  constructor(logger: AdminPanelLogger, api: FloresYaAPI) {
    this.logger = logger;
    this.api = api;
  }

  /**
   * Load products data from API
   */
  public async loadProductsData(): Promise<void> {
    try {
      this.showLoading();

      // Fetch products from API with pagination
      const response = await this.api.getProducts({
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_direction: 'desc'
      });

      if (response.success && response.data) {
        this.logger.log(`Loaded ${response.data.products.length} products from API`, 'success');
        this.renderProductsTable(response.data.products as unknown as Product[]);

        // Bind product management buttons after DOM is ready
        this.bindProductButtons();
      } else {
        this.logger.log('Failed to load products from API', 'error');
        this.renderProductsTable([]);

        // Still bind buttons even if no products loaded
        this.bindProductButtons();
      }
    } catch (error: unknown) {
      this.logger.log('Error loading products: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.renderProductsTable([]);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Load occasions data for dropdowns
   */
  public async loadOccasionsData(): Promise<void> {
    try {
      this.showLoading();

      // Fetch real occasions data from API
      const response = await fetch('/api/occasions');
      if (!response.ok) throw new Error('Failed to fetch occasions');

      const occasionsData = await response.json();
      this.logger.log(`Loaded ${occasionsData.length ?? 0} occasions from API`, 'success');

      this.renderOccasionsTable(occasionsData ?? []);
    } catch (error: unknown) {
      this.logger.log('Error loading occasions: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al cargar ocasiones');
      this.renderOccasionsTable([]);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Create new product
   */
  public async createProduct(productData: Partial<Product>): Promise<void> {
    try {
      this.logger.log('Creating new product', 'info');

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) throw new Error('Failed to create product');

      this.logger.log('Product created successfully', 'success');
      this.showSuccess('Producto creado exitosamente');

      // Reload products to reflect changes
      void this.loadProductsData();

    } catch (error: unknown) {
      this.logger.log('Error creating product: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al crear producto');
    }
  }

  /**
   * Update product
   */
  public async updateProduct(productId: number, productData: Partial<Product>): Promise<void> {
    try {
      this.logger.log(`Updating product ${productId}`, 'info');

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) throw new Error('Failed to update product');

      this.logger.log(`Product ${productId} updated successfully`, 'success');
      this.showSuccess('Producto actualizado exitosamente');

      // Reload products to reflect changes
      void this.loadProductsData();

    } catch (error: unknown) {
      this.logger.log('Error updating product: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al actualizar producto');
    }
  }

  /**
   * Delete product
   */
  public async deleteProduct(productId: number): Promise<void> {
    try {
      if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        return;
      }

      this.logger.log(`Deleting product ${productId}`, 'info');

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete product');

      this.logger.log(`Product ${productId} deleted successfully`, 'success');
      this.showSuccess('Producto eliminado exitosamente');

      // Reload products to reflect changes
      void this.loadProductsData();

    } catch (error: unknown) {
      this.logger.log('Error deleting product: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al eliminar producto');
    }
  }

  /**
   * Toggle product availability
   */
  public async toggleProductAvailability(productId: number, currentStatus: boolean): Promise<void> {
    try {
      const newStatus = !currentStatus;
      this.logger.log(`Toggling product ${productId} availability to ${newStatus}`, 'info');

      const response = await fetch(`/api/admin/products/${productId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_available: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update product availability');

      this.logger.log(`Product ${productId} availability updated successfully`, 'success');
      this.showSuccess(`Producto ${newStatus ? 'habilitado' : 'deshabilitado'} exitosamente`);

      // Reload products to reflect changes
      void this.loadProductsData();

    } catch (error: unknown) {
      this.logger.log('Error updating product availability: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al actualizar disponibilidad del producto');
    }
  }

  /**
   * Show product images modal
   */
  public showProductImages(productId: number): void {
    try {
      this.logger.log(`Viewing images for product ${productId}`, 'info');

      // Set current product ID
      (window as { currentProductId?: number }).currentProductId = productId;

      // Load product images
      void this.loadProductImagesForModal(productId);

      // Show modal
      const modalElement = document.getElementById('productImagesModal');
      if (modalElement) {
        this.showModal(modalElement);
      } else {
        this.logger.log('Product images modal not found', 'error');
      }
    } catch (error: unknown) {
      this.logger.log('Error showing product images: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  }

  /**
   * Load product images for modal
   */
  private async loadProductImagesForModal(productId: number): Promise<void> {
    try {
      this.logger.log(`Loading images for product ${productId}`, 'info');

      // Show loading state
      const imagesGrid = document.getElementById('imagesGrid');
      if (imagesGrid) {
        imagesGrid.innerHTML = `
          <div class="text-center py-5" style="grid-column: 1 / -1;">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <h5 class="text-muted">Cargando imágenes...</h5>
          </div>
        `;
      }

      // Fetch product images from API
      const response = await fetch(`/api/admin/products/${productId}/images`);
      if (!response.ok) throw new Error('Failed to fetch product images');

      const images = await response.json();
      this.renderProductImagesModal(images);

    } catch (error: unknown) {
      this.logger.log('Error loading product images for modal: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');

      // Show error state
      const imagesGrid = document.getElementById('imagesGrid');
      if (imagesGrid) {
        imagesGrid.innerHTML = `
          <div class="text-center py-5" style="grid-column: 1 / -1;">
            <i class="bi bi-exclamation-triangle text-warning display-1 mb-3"></i>
            <h5 class="text-muted">Error al cargar imágenes</h5>
            <p class="text-muted">No se pudieron cargar las imágenes del producto.</p>
            <button class="btn btn-outline-primary btn-sm" onclick="adminPanel.products.loadProductImagesForModal(${productId})">
              <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
            </button>
          </div>
        `;
      }
    }
  }

  /**
   * Render products table
   */
  private renderProductsTable(products: Product[]): void {
    const productsTableBody = document.getElementById('productsTableBody');
    if (!productsTableBody) return;

    if (products.length === 0) {
      productsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <div class="text-muted">
              <i class="bi bi-box display-4 mb-3"></i>
              <p>No se encontraron productos</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    productsTableBody.innerHTML = products.map(product => `
      <tr>
        <td><strong>#${product.id}</strong></td>
        <td>
          <div class="d-flex align-items-center">
            ${product.image_url ?
              `<img src="${product.image_url}" alt="${product.name}" class="me-2 rounded" style="width: 40px; height: 40px; object-fit: cover;">` :
              `<div class="me-2 bg-light rounded d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;"><i class="bi bi-image text-muted"></i></div>`
            }
            <div>
              <div class="fw-medium">${product.name}</div>
              ${product.description ? `<small class="text-muted">${product.description.substring(0, 50)}...</small>` : ''}
            </div>
          </div>
        </td>
        <td>$${product.price_usd.toFixed(2)}</td>
        <td>
          <span class="badge bg-${product.is_available ? 'success' : 'secondary'}">
            ${product.is_available ? 'Disponible' : 'No disponible'}
          </span>
        </td>
        <td>${new Date(product.created_at).toLocaleDateString()}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="adminPanel.products.editProduct(${product.id})"
                    title="Editar producto">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-info" onclick="adminPanel.products.showProductImages(${product.id})"
                    title="Ver imágenes">
              <i class="bi bi-images"></i>
            </button>
            <button class="btn btn-outline-${product.is_available ? 'warning' : 'success'}"
                    onclick="adminPanel.products.toggleProductAvailability(${product.id}, ${product.is_available})"
                    title="${product.is_available ? 'Deshabilitar' : 'Habilitar'} producto">
              <i class="bi bi-${product.is_available ? 'pause' : 'play'}"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="adminPanel.products.deleteProduct(${product.id})"
                    title="Eliminar producto">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Render occasions table
   */
  private renderOccasionsTable(occasions: AdminOccasion[]): void {
    const occasionsTableBody = document.getElementById('occasionsTableBody');
    if (!occasionsTableBody) return;

    if (occasions.length === 0) {
      occasionsTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4">
            <div class="text-muted">
              <i class="bi bi-calendar-event display-4 mb-3"></i>
              <p>No se encontraron ocasiones</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    occasionsTableBody.innerHTML = occasions.map(occasion => `
      <tr>
        <td><strong>#${occasion.id}</strong></td>
        <td>${occasion.name}</td>
        <td>${occasion.name}</td>
        <td>
          <span class="badge bg-${occasion.is_active ? 'success' : 'secondary'}">
            ${occasion.is_active ? 'Activa' : 'Inactiva'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Render product images in modal
   */
  private renderProductImagesModal(images: unknown[]): void {
    const imagesGrid = document.getElementById('imagesGrid');
    if (!imagesGrid) return;

    if (images.length === 0) {
      imagesGrid.innerHTML = `
        <div class="text-center py-5" style="grid-column: 1 / -1;">
          <i class="bi bi-images text-muted display-1 mb-3"></i>
          <h5 class="text-muted">Sin imágenes</h5>
          <p class="text-muted">Este producto no tiene imágenes asignadas.</p>
        </div>
      `;
      return;
    }

    // Render images grid (implementation depends on image structure)
    imagesGrid.innerHTML = images.map(() => `
      <div class="image-card">
        <!-- Image rendering implementation -->
      </div>
    `).join('');
  }

  /**
   * Bind product management buttons
   */
  private bindProductButtons(): void {
    const createProductBtn = document.getElementById('createProductBtn');
    if (createProductBtn) {
      createProductBtn.addEventListener('click', () => this.showCreateProductModal());
    }

    // Additional event bindings for product management
    const productFormButtons = document.querySelectorAll('[data-product-action]');
    productFormButtons.forEach(button => {
      const action = button.getAttribute('data-product-action');
      if (action === 'save') {
        button.addEventListener('click', () => this.handleProductFormSubmit());
      }
    });
  }

  /**
   * Show product creation modal
   */
  private showCreateProductModal(): void {
    const modalElement = document.getElementById('createProductModal');
    if (modalElement) {
      // Reset form
      const form = modalElement.querySelector('form');
      if (!(form instanceof HTMLFormElement)) return;
      if (form) form.reset();

      // Show modal
      this.showModal(modalElement);
    }
  }

  /**
   * Edit product
   */
  public editProduct(productId: number): void {
    this.logger.log(`Editing product ${productId}`, 'info');
    // Implementation would fetch product data and populate edit form
  }

  /**
   * Handle product form submission
   */
  private handleProductFormSubmit(): void {
    const form = document.getElementById('productForm') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price_usd: parseFloat(formData.get('price_usd') as string),
      is_available: formData.get('is_available') === 'true',
      category_id: formData.get('category_id') ? parseInt(formData.get('category_id') as string) : undefined,
      occasion_id: formData.get('occasion_id') ? parseInt(formData.get('occasion_id') as string) : undefined
    };

    const productId = formData.get('product_id') as string;
    if (productId) {
      void this.updateProduct(parseInt(productId), productData);
    } else {
      void this.createProduct(productData);
    }
  }

  /**
   * Show loading state
   */
  private showLoading(): void {
    const loadingEl = document.getElementById('productsLoading');
    if (loadingEl) loadingEl.style.display = 'block';
  }

  /**
   * Hide loading state
   */
  private hideLoading(): void {
    const loadingEl = document.getElementById('productsLoading');
    if (loadingEl) loadingEl.style.display = 'none';
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

  /**
   * Show modal
   */
  private showModal(_element: Element): void {
    // Implementation depends on UI framework (Bootstrap, etc.)
    console.warn('Modal implementation needed');
  }
}