/**
 * 🌸 FloresYa Admin - Product Modal
 * Self-contained module for product creation and editing
 */

import { AdminCore } from './AdminCore.js';
import { apiClient } from './ApiClient.js';

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  price_usd: number;
  occasion_ids?: number[];
  is_featured?: boolean;
  carousel_order?: number;
}

export interface Occasion {
  id: number;
  name: string;
  color: string;
}

export class ProductModal extends AdminCore {
  private currentProduct: Product | null = null;
  private availableOccasions: Occasion[] = [];
  private isEditMode: boolean = false;

  protected init(): void {
    this.bindEvents();
    this.loadOccasions();
    this.log('ProductModal initialized', 'success');
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    // Listen for global events
    this.events.on('product:createRequested', () => {
      this.showAddProductModal();
    });

    this.events.on('product:editRequested', (product: Product) => {
      this.showEditProductModal(product);
    });

    // Form submission
    document.addEventListener('submit', (e) => {
      if ((e.target as HTMLElement).id === 'productForm') {
        e.preventDefault();
        this.handleFormSubmission(e.target as HTMLFormElement);
      }
    });
  }

  /**
   * Show modal for adding new product
   */
  public async showAddProductModal(): Promise<void> {
    this.log('Opening product creation modal', 'info');
    this.isEditMode = false;
    this.currentProduct = null;
    await this.showProductModal(null);
  }

  /**
   * Show modal for editing existing product
   */
  public async showEditProductModal(product: Product): Promise<void> {
    this.log(`Opening product edit modal for product ${product.id}`, 'info');
    this.isEditMode = true;
    this.currentProduct = product;
    await this.showProductModal(product);
  }

  /**
   * Main modal display logic
   */
  private async showProductModal(product: Product | null): Promise<void> {
    try {
      // Load product with occasions if editing
      if (product?.id) {
        const response = await apiClient.getProductWithOccasions(product.id);
        if (response.success) {
          this.currentProduct = response.data?.product || product;
        }
      }

      // Create modal HTML
      const modalHTML = this.generateModalHTML();

      // Remove existing modal
      this.removeModal('productModal');

      // Add new modal to DOM
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      // Populate form if editing
      if (this.currentProduct) {
        this.populateForm();
      }

      // Show modal
      this.showModal('productModal');

      this.log(`Product modal ${this.isEditMode ? 'edit' : 'create'} opened successfully`, 'success');

    } catch (error) {
      this.log(`Error showing product modal: ${error}`, 'error');
      this.showError('Error al abrir el modal de producto');
    }
  }

  /**
   * Generate modal HTML
   */
  private generateModalHTML(): string {
    const title = this.isEditMode ? 'Editar Producto' : 'Nuevo Producto';
    const submitText = this.isEditMode ? 'Actualizar Producto' : 'Crear Producto';

    return `
      <div class="modal fade" id="productModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title">
                <i class="bi bi-flower1 me-2"></i>${title}
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="productForm">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="productName" class="form-label fw-bold">Nombre del Producto</label>
                      <input type="text" class="form-control" id="productName" name="name" required>
                      <div class="form-text">Nombre descriptivo del producto</div>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="mb-3">
                      <label for="productPrice" class="form-label fw-bold">Precio (VES)</label>
                      <input type="number" step="0.01" class="form-control" id="productPrice" name="price" required>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="mb-3">
                      <label for="productPriceUSD" class="form-label fw-bold">Precio (USD)</label>
                      <input type="number" step="0.01" class="form-control" id="productPriceUSD" name="price_usd" required>
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <label for="productDescription" class="form-label fw-bold">Descripción</label>
                  <textarea class="form-control" id="productDescription" name="description" rows="4" required></textarea>
                  <div class="form-text">Descripción detallada del producto</div>
                </div>

                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label fw-bold">Ocasiones</label>
                      <div id="occasionsContainer" class="border rounded p-3" style="max-height: 200px; overflow-y: auto;">
                        ${this.generateOccasionsHTML()}
                      </div>
                      <div class="form-text">Selecciona las ocasiones para este producto</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="isFeatured" name="is_featured">
                        <label class="form-check-label fw-bold" for="isFeatured">
                          Producto Destacado
                        </label>
                        <div class="form-text">Aparecerá en la sección de productos destacados</div>
                      </div>
                    </div>

                    <div class="mb-3">
                      <label for="carouselOrder" class="form-label fw-bold">Orden en Carrusel</label>
                      <input type="number" class="form-control" id="carouselOrder" name="carousel_order" min="0">
                      <div class="form-text">0 = no aparece en carrusel, 1+ = orden de aparición</div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" form="productForm" class="btn btn-success">
                <i class="bi bi-check-circle me-2"></i>${submitText}
              </button>
              <button type="button" class="btn btn-success me-2" id="closeModalBtn" style="display: none;">
                <i class="bi bi-check-circle me-2"></i>Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate occasions checkboxes HTML
   */
  private generateOccasionsHTML(): string {
    if (this.availableOccasions.length === 0) {
      return '<p class="text-muted">Cargando ocasiones...</p>';
    }

    return this.availableOccasions.map(occasion => `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="occasion_${occasion.id}"
               name="occasion_ids" value="${occasion.id}">
        <label class="form-check-label" for="occasion_${occasion.id}">
          <span class="badge me-2" style="background-color: ${occasion.color};">●</span>
          ${occasion.name}
        </label>
      </div>
    `).join('');
  }

  /**
   * Load available occasions
   */
  private async loadOccasions(): Promise<void> {
    try {
      const response = await apiClient.getOccasions();
      if (response.success && response.data) {
        this.availableOccasions = response.data;
        this.log(`Loaded ${this.availableOccasions.length} occasions`, 'info');
      }
    } catch (error) {
      this.log(`Error loading occasions: ${error}`, 'error');
    }
  }

  /**
   * Populate form with product data
   */
  private populateForm(): void {
    if (!this.currentProduct) return;

    this.setElementValue('productName', this.currentProduct.name || '');
    this.setElementValue('productDescription', this.currentProduct.description || '');
    this.setElementValue('productPrice', this.currentProduct.price?.toString() || '');
    this.setElementValue('productPriceUSD', this.currentProduct.price_usd?.toString() || '');
    this.setCheckboxState('isFeatured', this.currentProduct.is_featured || false);
    this.setElementValue('carouselOrder', this.currentProduct.carousel_order?.toString() || '0');

    // Select occasions
    if (this.currentProduct.occasion_ids) {
      this.currentProduct.occasion_ids.forEach(occasionId => {
        this.setCheckboxState(`occasion_${occasionId}`, true);
      });
    }

    // Update modal title
    const modalTitle = document.querySelector('#productModal .modal-title');
    if (modalTitle) {
      modalTitle.innerHTML = `
        <i class="bi bi-flower1 me-2"></i>Editar: ${this.currentProduct.name}
      `;
    }

    this.log('Form populated with product data', 'info');
  }

  /**
   * Handle form submission
   */
  private async handleFormSubmission(form: HTMLFormElement): Promise<void> {
    try {
      const formData = this.getFormData(form);
      const productData = this.extractProductData(formData);

      this.log(`Submitting product data: ${JSON.stringify(productData)}`, 'debug');

      let response;
      if (this.isEditMode && this.currentProduct?.id) {
        response = await apiClient.updateProduct(this.currentProduct.id, productData);
      } else {
        response = await apiClient.createProduct(productData);
      }

      if (response.success) {
        const action = this.isEditMode ? 'actualizado' : 'creado';
        this.showSuccess(`Producto ${action} exitosamente`);

        // Show close button
        const closeBtn = document.getElementById('closeModalBtn');
        if (closeBtn) {
          closeBtn.style.display = 'inline-block';
        }

        // Emit event for other modules
        this.events.emit('product:saved', response.data);

        // Close modal after short delay
        setTimeout(() => {
          this.hideModal('productModal');
        }, 1500);

      } else {
        throw new Error(response.error || 'Error saving product');
      }

    } catch (error) {
      this.log(`Error submitting product form: ${error}`, 'error');
      this.showError('Error al guardar el producto');
    }
  }

  /**
   * Extract product data from form
   */
  private extractProductData(formData: FormData): any {
    const occasionIds: number[] = [];
    formData.getAll('occasion_ids').forEach(id => {
      occasionIds.push(parseInt(id as string));
    });

    return {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price') as string),
      price_usd: parseFloat(formData.get('price_usd') as string),
      occasion_ids: occasionIds,
      is_featured: formData.has('is_featured'),
      carousel_order: parseInt(formData.get('carousel_order') as string) || 0
    };
  }

  /**
   * Reset modal form
   */
  private resetForm(): void {
    const form = document.getElementById('productForm') as HTMLFormElement;
    if (form) {
      form.reset();
    }

    // Uncheck all occasions
    this.availableOccasions.forEach(occasion => {
      this.setCheckboxState(`occasion_${occasion.id}`, false);
    });

    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
      closeBtn.style.display = 'none';
    }

    this.log('Product form reset', 'info');
  }

  /**
   * Public method to open modal for new product
   */
  public static openForNew(): void {
    if ((window as any).adminPanel?.productModal) {
      (window as any).adminPanel.productModal.showAddProductModal();
    }
  }

  /**
   * Public method to open modal for editing
   */
  public static openForEdit(product: Product): void {
    if ((window as any).adminPanel?.productModal) {
      (window as any).adminPanel.productModal.showEditProductModal(product);
    }
  }
}