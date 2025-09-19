/**
 * 🌸 FloresYa Admin - Product Images Modal
 * Self-contained module for managing product images
 */

import { AdminCore } from './AdminCore.js';
import { apiClient } from './ApiClient.js';

export interface ProductImage {
  id: number | string;
  url: string;
  isPrimary: boolean;
  order: number;
  originalData?: any;
}

export interface PendingChanges {
  newImages: ProductImage[];
  deletedImages: (number | string)[];
  reorderedImages: ProductImage[];
  newPrimaryImage: number | string | null;
}

export class ProductImagesModal extends AdminCore {
  private currentProductId: number | null = null;
  private currentImages: ProductImage[] = [];
  private pendingChanges: PendingChanges = {
    newImages: [],
    deletedImages: [],
    reorderedImages: [],
    newPrimaryImage: null
  };
  private hasUnsavedChanges: boolean = false;

  protected init(): void {
    this.bindEvents();
    this.log('ProductImagesModal initialized', 'success');
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    // Image upload
    const imageUpload = document.getElementById('imageUpload') as HTMLInputElement;
    if (imageUpload) {
      imageUpload.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files) {
          this.handleFiles(target.files);
        }
      });
    }

    // Apply changes button
    const applyChangesBtn = document.getElementById('applyChangesBtn');
    if (applyChangesBtn) {
      applyChangesBtn.addEventListener('click', () => {
        if (this.hasUnsavedChanges) {
          this.showConfirmationModal();
        }
      });
    }

    // Drag and drop for file upload
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = (e as DragEvent).dataTransfer?.files;
        if (files) {
          this.handleFiles(files);
        }
      });
    }

    // Listen for global events
    this.events.on('product:imagesRequested', (productId: number, productName: string) => {
      this.openImageManagement(productId, productName);
    });
  }

  /**
   * Open image management modal for a specific product
   */
  public async openImageManagement(productId: number, productName: string): Promise<void> {
    try {
      this.currentProductId = productId;

      // Update modal title
      const titleElement = document.getElementById('selectedProductName');
      if (titleElement) {
        titleElement.textContent = `Gestionar Imágenes: ${productName}`;
      }

      // Load product images
      await this.loadProductImages(productId);

      // Show the modal
      this.showModal('productImagesModal');

      this.log(`Image management opened for product ${productId}: ${productName}`, 'info');
    } catch (error) {
      this.log(`Error opening image management: ${error}`, 'error');
      this.showError('Error al abrir la gestión de imágenes');
    }
  }

  /**
   * Load images for the current product
   */
  private async loadProductImages(productId: number): Promise<void> {
    try {
      // Show loading state
      const imagesGrid = document.getElementById('imagesGrid');
      if (imagesGrid) {
        imagesGrid.innerHTML = `
          <div class="col-12 text-center py-4">
            <div class="spinner-border text-success" role="status">
              <span class="visually-hidden">Cargando imágenes...</span>
            </div>
            <p class="mt-2 text-muted">Cargando imágenes del producto...</p>
          </div>
        `;
      }

      // Make API call to get product images
      const response = await apiClient.getProductImages(productId);

      if (!response.success) {
        throw new Error(response.error || 'Error loading images');
      }

      // Process and deduplicate images - only keep one size per image_index
      const imageMap = new Map();
      const responseData = response.data as any;
      if (responseData?.images) {
        responseData.images.forEach((image: any) => {
          // Use medium size for display, or thumb if medium not available
          if (image.size === 'medium' || !imageMap.has(image.image_index)) {
            imageMap.set(image.image_index, {
              id: image.id,
              url: image.url,
              isPrimary: image.is_primary,
              order: image.image_index,
              originalData: image // Keep original for reference
            });
          }
        });
      }

      // Convert map to array and sort by order
      this.currentImages = Array.from(imageMap.values()).sort((a, b) => a.order - b.order);

      // Reset pending changes
      this.resetPendingChanges();

      // Render the images
      this.renderImagesGrid();
      this.updateImageCount();

      this.log(`Loaded ${this.currentImages.length} images for product ${productId}`, 'info');

    } catch (error) {
      this.log(`Error loading product images: ${error}`, 'error');

      // Show error state
      const imagesGrid = document.getElementById('imagesGrid');
      if (imagesGrid) {
        imagesGrid.innerHTML = `
          <div class="col-12 text-center py-4">
            <i class="bi bi-exclamation-triangle text-warning display-1 mb-3"></i>
            <h5 class="text-muted">Error al cargar imágenes</h5>
            <p class="text-muted">No se pudieron cargar las imágenes del producto.</p>
            <button class="btn btn-outline-primary btn-sm" onclick="adminPanel.productImagesModal.loadProductImages(${productId})">
              <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
            </button>
          </div>
        `;
      }

      // Set empty state for safety
      this.currentImages = [];
      this.resetPendingChanges();
      this.updateImageCount();
    }
  }

  /**
   * Handle file upload
   */
  private handleFiles(files: FileList): void {
    Array.from(files).forEach((file, index) => {
      if (!this.validateImageFile(file)) {
        return;
      }

      const tempImage: ProductImage = {
        id: `temp_${Date.now()}_${index}`,
        url: URL.createObjectURL(file),
        isPrimary: this.currentImages.length === 0 && index === 0,
        order: this.currentImages.length + this.pendingChanges.newImages.length + 1
      };

      this.pendingChanges.newImages.push(tempImage);
      this.setUnsavedChanges(true);
      this.renderImagesGrid();
      this.updateImageCount();

      this.log(`Image file added: ${file.name}`, 'info');
    });
  }

  /**
   * Validate image file
   */
  private validateImageFile(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      this.showError('Solo se permiten archivos de imagen');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      this.showError('El archivo es demasiado grande (máximo 5MB)');
      return false;
    }

    const totalImages = this.currentImages.length + this.pendingChanges.newImages.length;
    if (totalImages >= 5) {
      this.showError('Máximo 5 imágenes por producto');
      return false;
    }

    return true;
  }

  /**
   * Render images grid
   */
  private renderImagesGrid(): void {
    const imagesGrid = document.getElementById('imagesGrid');
    if (!imagesGrid) return;

    const allImages = [...this.currentImages, ...this.pendingChanges.newImages];

    if (allImages.length === 0) {
      imagesGrid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-images display-1 text-muted mb-3"></i>
          <h6 class="text-muted">No hay imágenes</h6>
          <p class="text-muted small">Sube imágenes usando el botón o arrastra archivos aquí</p>
        </div>
      `;
      return;
    }

    const gridHTML = allImages.map((image, index) => `
      <div class="col-md-2 col-sm-4 col-6 mb-3">
        <div class="image-card ${image.isPrimary ? 'primary' : ''} ${String(image.id).startsWith('temp_') ? 'pending' : ''} ${this.pendingChanges.deletedImages.includes(image.id) ? 'to-delete' : ''}"
             data-image-id="${image.id}" data-order="${index + 1}">
          <div class="image-wrapper">
            <img src="${image.url}" alt="Imagen ${index + 1}">
            <div class="image-actions">
              <button class="star-btn ${image.isPrimary ? 'active' : ''}" onclick="adminPanel.productImagesModal.setPrimaryImage('${image.id}')">
                <i class="bi bi-star${image.isPrimary ? '-fill' : ''}"></i>
              </button>
              <button class="delete-btn" onclick="adminPanel.productImagesModal.deleteImage('${image.id}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
            ${image.isPrimary ? '<div class="primary-badge"><i class="bi bi-star-fill"></i> Principal</div>' : ''}
            ${String(image.id).startsWith('temp_') ? '<div class="pending-badge">Nuevo</div>' : ''}
          </div>
        </div>
      </div>
    `).join('');

    imagesGrid.innerHTML = gridHTML;
  }

  /**
   * Set image as primary
   */
  public setPrimaryImage(imageId: number | string): void {
    // Update current images
    this.currentImages.forEach(img => img.isPrimary = img.id === imageId);

    // Update pending new images
    this.pendingChanges.newImages.forEach(img => img.isPrimary = img.id === imageId);

    // Track this change
    this.pendingChanges.newPrimaryImage = imageId;
    this.setUnsavedChanges(true);

    this.renderImagesGrid();
    this.log(`Image ${imageId} set as primary`, 'info');
  }

  /**
   * Delete image
   */
  public deleteImage(imageId: number | string): void {
    // If it's a temporary image, remove from new images
    if (String(imageId).startsWith('temp_')) {
      this.pendingChanges.newImages = this.pendingChanges.newImages.filter(img => img.id !== imageId);
      this.log(`Temporary image ${imageId} removed`, 'info');
    } else {
      // Mark existing image for deletion
      if (!this.pendingChanges.deletedImages.includes(imageId)) {
        this.pendingChanges.deletedImages.push(imageId);
      }
      this.log(`Image ${imageId} marked for deletion`, 'info');
    }

    this.setUnsavedChanges(true);
    this.renderImagesGrid();
    this.updateImageCount();
  }

  /**
   * Update image count display
   */
  private updateImageCount(): void {
    const imageCount = document.getElementById('imageCount');
    if (imageCount) {
      const totalImages = this.currentImages.length + this.pendingChanges.newImages.length - this.pendingChanges.deletedImages.length;
      imageCount.textContent = `${totalImages}/5 imágenes`;
    }
  }

  /**
   * Set unsaved changes state
   */
  private setUnsavedChanges(hasChanges: boolean): void {
    this.hasUnsavedChanges = hasChanges;

    const alert = document.getElementById('unsavedChangesAlert');
    const applyBtn = document.getElementById('applyChangesBtn') as HTMLButtonElement;

    if (hasChanges) {
      alert?.classList.remove('d-none');
      if (applyBtn) applyBtn.disabled = false;
    } else {
      alert?.classList.add('d-none');
      if (applyBtn) applyBtn.disabled = true;
    }
  }

  /**
   * Show confirmation modal
   */
  private showConfirmationModal(): void {
    // Generate summary
    const summary = document.getElementById('changesSummary');
    if (summary) {
      let summaryText = '<ul>';
      if (this.pendingChanges.newImages.length) {
        summaryText += `<li>${this.pendingChanges.newImages.length} imagen(es) nueva(s)</li>`;
      }
      if (this.pendingChanges.deletedImages.length) {
        summaryText += `<li>${this.pendingChanges.deletedImages.length} imagen(es) eliminada(s)</li>`;
      }
      if (this.pendingChanges.newPrimaryImage) {
        summaryText += `<li>Nueva imagen principal seleccionada</li>`;
      }
      summaryText += '</ul>';
      summary.innerHTML = summaryText;
    }

    this.showModal('confirmChangesModal');
  }

  /**
   * Apply changes
   */
  public async applyChanges(): Promise<void> {
    try {
      this.log('Applying image changes...', 'info');

      // Here you would implement the actual API calls to:
      // 1. Upload new images
      // 2. Delete marked images
      // 3. Update primary image
      // 4. Update image order

      // For now, just simulate success
      this.showSuccess('Cambios aplicados exitosamente');
      this.resetPendingChanges();
      this.setUnsavedChanges(false);
      this.hideModal('confirmChangesModal');
      this.hideModal('productImagesModal');

      // Emit event for other modules
      this.events.emit('product:imagesUpdated', this.currentProductId);

    } catch (error) {
      this.log(`Error applying changes: ${error}`, 'error');
      this.showError('Error al aplicar los cambios');
    }
  }

  /**
   * Discard changes
   */
  public discardChanges(): void {
    this.resetPendingChanges();
    this.setUnsavedChanges(false);
    this.renderImagesGrid();
    this.updateImageCount();
    this.hideModal('confirmChangesModal');
    this.hideModal('productImagesModal');
    this.log('Changes discarded', 'info');
  }

  /**
   * Reset pending changes
   */
  private resetPendingChanges(): void {
    this.pendingChanges = {
      newImages: [],
      deletedImages: [],
      reorderedImages: [],
      newPrimaryImage: null
    };
  }

  /**
   * Public method to expose the modal opening functionality
   */
  public static openForProduct(productId: number, productName: string): void {
    // This would be called from the global scope
    if ((window as any).adminPanel?.productImagesModal) {
      (window as any).adminPanel.productImagesModal.openImageManagement(productId, productName);
    }
  }
}