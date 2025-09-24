/**
 * 🌸 FloresYa Admin Images Module
 * Handles image management, upload, gallery, and image operations
 */

import type { ProductImage, AdminPanelLogger } from './types';

export class AdminImages {
  private logger: AdminPanelLogger;

  constructor(logger: AdminPanelLogger) {
    this.logger = logger;
  }

  /**
   * Load images data for gallery
   */
  public async loadImagesData(): Promise<void> {
    try {
      this.showLoading();

      // Load current site images (hero, logo, etc.)
      await this.loadCurrentSiteImages();

      // Load products with image counts
      await this.loadProductsWithImageCounts();

      // Load images gallery
      await this.loadImagesGallery();

      // Bind image events
      this.bindImageEvents();

    } catch (error: unknown) {
      this.logger.log(`Error loading images data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      this.showError('Error al cargar datos de imágenes');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Load product images for gallery
   */
  public async loadProductImages(): Promise<void> {
    try {
      this.logger.log('Loading product images...', 'info');

      // Show loading indicator
      const imagesLoading = document.getElementById('imagesLoading');
      const imagesContainer = document.getElementById('imagesContainer');
      const imagesEmpty = document.getElementById('imagesEmpty');

      if (imagesLoading) imagesLoading.style.display = 'block';
      if (imagesContainer) imagesContainer.style.display = 'none';
      if (imagesEmpty) imagesEmpty.style.display = 'none';

      // Fetch real product images from API
      const response = await fetch('/api/admin/product-images');
      if (!response.ok) throw new Error('Failed to fetch product images');

      const imagesData = await response.json();
      this.logger.log(`Loaded ${imagesData.length ?? 0} product images from API`, 'success');

      this.renderProductImages(imagesData ?? []);

      if (imagesLoading) imagesLoading.style.display = 'none';
      if (imagesContainer) imagesContainer.style.display = 'block';

    } catch (error: unknown) {
      this.logger.log(`❌ Error loading product images: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');

      // Hide loading and show empty state
      const imagesLoading = document.getElementById('imagesLoading');
      const imagesEmpty = document.getElementById('imagesEmpty');

      if (imagesLoading) imagesLoading.style.display = 'none';
      if (imagesEmpty) imagesEmpty.style.display = 'block';

      // Fallback to empty state
      this.renderProductImages([]);
    }
  }

  /**
   * Upload product image
   */
  public async uploadProductImage(file: File, productId: number, isPrimary = false): Promise<void> {
    try {
      this.logger.log(`Uploading image for product ${productId}`, 'info');

      const formData = new FormData();
      formData.append('image', file);
      formData.append('product_id', productId.toString());
      formData.append('is_primary', isPrimary.toString());

      const response = await fetch('/api/admin/product-images', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload image');

      this.logger.log('Product image uploaded successfully', 'success');
      this.showSuccess('Imagen subida exitosamente');

      // Reload images to show the new upload
      void this.loadProductImages();

    } catch (error: unknown) {
      this.logger.log(`❌ Error uploading product image: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      this.showError('Error al subir la imagen');
    }
  }

  /**
   * Delete product image
   */
  public async deleteProductImage(imageId: number): Promise<void> {
    try {
      if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
        return;
      }

      this.logger.log(`Deleting product image ${imageId}`, 'info');

      const response = await fetch(`/api/admin/product-images/${imageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete image');

      this.logger.log('Product image deleted successfully', 'success');
      this.showSuccess('Imagen eliminada exitosamente');

      // Reload images in the modal
      void this.loadProductImages();

    } catch (error: unknown) {
      this.logger.log(`Error deleting product image: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      this.showError('Error al eliminar la imagen');
    }
  }

  /**
   * Set image as primary
   */
  public async setImageAsPrimary(imageId: number, productId: number): Promise<void> {
    try {
      this.logger.log(`Setting image ${imageId} as primary for product ${productId}`, 'info');

      const response = await fetch(`/api/admin/product-images/${imageId}/primary`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId })
      });

      if (!response.ok) throw new Error('Failed to set image as primary');

      this.logger.log('Image set as primary successfully', 'success');
      this.showSuccess('Imagen establecida como principal');

      // Reload images to reflect changes
      void this.loadProductImages();

    } catch (error: unknown) {
      this.logger.log(`Error setting image as primary: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      this.showError('Error al establecer imagen como principal');
    }
  }

  /**
   * Show site image upload modal
   */
  public showSiteImageUploadModal(type: 'hero' | 'logo'): void {
    try {
      this.logger.log(`Opening ${type} image upload modal`, 'info');

      const modalElement = document.getElementById('siteImageUploadModal');
      if (!modalElement) {
        this.logger.log('Site image upload modal not found', 'error');
        return;
      }

      // Set modal title and type
      const modalTitle = modalElement.querySelector('.modal-title');
      const imageTypeInput = modalElement.querySelector('#imageType');

      if (modalTitle) {
        modalTitle.textContent = type === 'hero' ? 'Subir Imagen Hero' : 'Subir Logo';
      }
      if (imageTypeInput && imageTypeInput instanceof HTMLInputElement) {
        imageTypeInput.value = type;
      }

      // Reset file input
      const fileInput = modalElement.querySelector('#siteImageFile');
      if (fileInput && fileInput instanceof HTMLInputElement) {
        fileInput.value = '';
      }

      // Clear preview
      const previewContainer = modalElement.querySelector('#siteImagePreview');
      if (previewContainer) {
        previewContainer.innerHTML = '';
      }

      this.showModal(modalElement);

    } catch (error: unknown) {
      this.logger.log(`Error showing site image upload modal: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }

  /**
   * Upload site image (hero/logo)
   */
  public async uploadSiteImage(type: 'hero' | 'logo', file: File): Promise<void> {
    try {
      this.logger.log(`Uploading ${type} image`, 'info');

      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);

      const response = await fetch('/api/admin/site-images', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload site image');

      this.logger.log(`${type} image uploaded successfully`, 'success');
      this.showSuccess(`Imagen ${type === 'hero' ? 'hero' : 'logo'} subida exitosamente`);

      // Reload current site images
      void this.loadCurrentSiteImages();

    } catch (error: unknown) {
      this.logger.log(`Error uploading ${type} image: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      this.showError(`Error al subir imagen ${type === 'hero' ? 'hero' : 'logo'}`);
    }
  }

  /**
   * Load current site images
   */
  private async loadCurrentSiteImages(): Promise<void> {
    try {
      const response = await fetch('/api/admin/site-images');
      if (!response.ok) throw new Error('Failed to fetch site images');

      const siteImages = await response.json();
      this.renderCurrentSiteImages(siteImages);

    } catch (error: unknown) {
      this.logger.log(`Error loading current site images: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }

  /**
   * Load products with image counts
   */
  private async loadProductsWithImageCounts(
    sortBy: 'name' | 'image_count' = 'image_count',
    sortDirection: 'asc' | 'desc' = 'asc',
    filters: { name?: string; hasImages?: boolean } = {}
  ): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.set('sort_by', sortBy);
      params.set('sort_direction', sortDirection);

      if (filters.name) {
        params.set('name', filters.name);
      }
      if (filters.hasImages !== undefined) {
        params.set('hasImages', String(filters.hasImages));
      }

      const response = await fetch(`/api/admin/products-with-images?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products with image counts');

      const productsData = await response.json();
      this.renderProductsWithImages(productsData);

    } catch (error: unknown) {
      this.logger.log(`Error loading products with image counts: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }

  /**
   * Load images gallery
   */
  private async loadImagesGallery(filter: 'all' | 'used' | 'unused' = 'all'): Promise<void> {
    try {
      const response = await fetch(`/api/admin/images-gallery?filter=${filter}`);
      if (!response.ok) throw new Error('Failed to fetch images gallery');

      const imagesData = await response.json();
      this.renderImagesGallery(imagesData);

    } catch (error: unknown) {
      this.logger.log(`Error loading images gallery: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }

  /**
   * Render product images
   */
  private renderProductImages(images: ProductImage[]): void {
    const imagesContainer = document.getElementById('imagesContainer');
    const imagesCount = document.getElementById('imagesCount');

    if (!imagesContainer) return;

    if (images.length === 0) {
      const imagesEmpty = document.getElementById('imagesEmpty');
      if (imagesEmpty) imagesEmpty.style.display = 'block';
      imagesContainer.style.display = 'none';
      return;
    }

    // Update images count
    if (imagesCount) {
      imagesCount.textContent = `${images.length} imagen${images.length !== 1 ? 'es' : ''}`;
    }

    // Render images grid
    imagesContainer.innerHTML = images.map(image => `
      <div class="image-card" data-image-id="${image.id}">
        <div class="image-wrapper">
          <img src="${image.url}" alt="${image.product_name ?? 'Imagen'}" class="image-preview">
          ${image.is_primary ? '<span class="primary-badge">Principal</span>' : ''}
        </div>
        <div class="image-info">
          <h6 class="image-title">${image.product_name ?? 'Sin producto'}</h6>
          <div class="image-meta">
            <span class="size-badge">${image.size}</span>
            <small class="text-muted">${new Date(image.created_at).toLocaleDateString()}</small>
          </div>
        </div>
        <div class="image-actions">
          <button class="btn btn-sm btn-outline-primary" onclick="adminPanel.images.setImageAsPrimary(${image.id}, ${image.product_id})" title="Establecer como principal">
            <i class="bi bi-star"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="adminPanel.images.deleteProductImage(${image.id})" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

    imagesContainer.style.display = 'block';
  }

  /**
   * Render current site images
   */
  private renderCurrentSiteImages(siteImages: unknown): void {
    // Implementation depends on site images structure
    this.logger.log('Site images loaded', 'info');
    console.warn('Site images rendering implementation needed', siteImages);
  }

  /**
   * Render products with image counts
   */
  private renderProductsWithImages(productsData: unknown): void {
    // Implementation depends on products data structure
    this.logger.log('Products with images loaded', 'info');
    console.warn('Products with images rendering implementation needed', productsData);
  }

  /**
   * Render images gallery
   */
  private renderImagesGallery(imagesData: unknown): void {
    // Implementation depends on images data structure
    this.logger.log('Images gallery loaded', 'info');
    console.warn('Images gallery rendering implementation needed', imagesData);
  }

  /**
   * Bind image events
   */
  private bindImageEvents(): void {
    // Upload button events
    const uploadButtons = document.querySelectorAll('[data-upload-type]');
    uploadButtons.forEach(button => {
      const uploadType = button.getAttribute('data-upload-type') as 'hero' | 'logo';
      button.addEventListener('click', () => this.showSiteImageUploadModal(uploadType));
    });

    // File input change events
    const siteImageFile = document.getElementById('siteImageFile') as HTMLInputElement;
    if (siteImageFile) {
      siteImageFile.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.files?.[0]) {
          this.previewSiteImage(target.files[0]);
        }
      });
    }

    // Gallery filter events
    const filterButtons = document.querySelectorAll('[data-gallery-filter]');
    filterButtons.forEach(button => {
      const filter = button.getAttribute('data-gallery-filter') as 'all' | 'used' | 'unused';
      button.addEventListener('click', () => void this.updateGalleryFilter(filter));
    });
  }

  /**
   * Preview site image before upload
   */
  private previewSiteImage(file: File): void {
    const previewContainer = document.getElementById('siteImagePreview');
    if (!previewContainer) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result && typeof result === 'string') {
        previewContainer.innerHTML = `
          <img src="${result}" alt="Preview" class="img-fluid rounded">
        `;
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Update gallery filter
   */
  private async updateGalleryFilter(filter: 'all' | 'used' | 'unused'): Promise<void> {
    try {
      // Update active filter button
      const filterButtons = document.querySelectorAll('[data-gallery-filter]');
      filterButtons.forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-gallery-filter') === filter);
      });

      // Reload gallery with new filter
      await this.loadImagesGallery(filter);

    } catch (error: unknown) {
      this.logger.log(`Error updating gallery filter: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }

  /**
   * Show loading state
   */
  private showLoading(): void {
    const loadingEl = document.getElementById('imagesLoading');
    if (loadingEl) loadingEl.style.display = 'block';
  }

  /**
   * Hide loading state
   */
  private hideLoading(): void {
    const loadingEl = document.getElementById('imagesLoading');
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