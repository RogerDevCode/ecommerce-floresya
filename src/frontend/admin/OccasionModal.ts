/**
 * 🌸 FloresYa Admin - Occasion Modal
 * Self-contained module for occasion creation and editing
 */

import { AdminCore } from './AdminCore.js';
import { apiClient } from './ApiClient.js';

export interface Occasion {
  id?: number;
  name: string;
  description?: string;
  color: string;
  slug?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class OccasionModal extends AdminCore {
  private currentOccasion: Occasion | null = null;
  private isEditMode: boolean = false;

  protected init(): void {
    this.bindEvents();
    this.log('OccasionModal initialized', 'success');
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    // Listen for global events
    this.events.on('occasion:createRequested', () => {
      this.showAddOccasionModal();
    });

    this.events.on('occasion:editRequested', (occasion: Occasion) => {
      this.showEditOccasionModal(occasion);
    });

    // Auto-generate slug from name
    document.addEventListener('input', (e) => {
      if ((e.target as HTMLElement).id === 'occasionName') {
        this.generateSlug();
      }
    });
  }

  /**
   * Show modal for adding new occasion
   */
  public async showAddOccasionModal(): Promise<void> {
    this.log('Opening occasion creation modal', 'info');
    this.isEditMode = false;
    this.currentOccasion = null;
    await this.showOccasionModal();
  }

  /**
   * Show modal for editing existing occasion
   */
  public async showEditOccasionModal(occasion: Occasion): Promise<void> {
    this.log(`Opening occasion edit modal for occasion ${occasion.id}`, 'info');
    this.isEditMode = true;
    this.currentOccasion = occasion;
    await this.showOccasionModal();
  }

  /**
   * Main modal display logic
   */
  private async showOccasionModal(): Promise<void> {
    try {
      // Create modal HTML
      const modalHTML = this.generateModalHTML();

      // Remove existing modal
      this.removeModal('occasionModal');

      // Add new modal to DOM
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      // Bind form submission
      this.bindFormSubmission();

      // Populate form if editing
      if (this.isEditMode && this.currentOccasion) {
        this.populateForm();
      }

      // Show modal
      this.showModal('occasionModal');

      this.log(`Occasion modal ${this.isEditMode ? 'edit' : 'create'} opened successfully`, 'success');

    } catch (error) {
      this.log(`Error showing occasion modal: ${error}`, 'error');
      this.showError('Error al abrir el modal de ocasión');
    }
  }

  /**
   * Generate modal HTML
   */
  private generateModalHTML(): string {
    const title = this.isEditMode ? 'Editar Ocasión' : 'Crear Nueva Ocasión';
    const submitText = this.isEditMode ? 'Actualizar Ocasión' : 'Crear Ocasión';

    return `
      <div class="modal fade" id="occasionModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">
                <i class="bi bi-calendar-event me-2"></i>${title}
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <!-- Message Area -->
              <div id="occasionMessageArea" class="alert-container mb-3" style="display: none;">
                <div id="occasionMessage" class="alert" role="alert"></div>
              </div>

              <form id="occasionForm">
                <div class="mb-3">
                  <label for="occasionName" class="form-label fw-bold">Nombre *</label>
                  <input type="text" class="form-control" id="occasionName" name="name" required
                         placeholder="Nombre de la ocasión">
                  <div class="form-text">El slug se generará automáticamente a partir del nombre</div>
                </div>

                <div class="mb-3">
                  <label for="occasionSlug" class="form-label fw-bold">Slug</label>
                  <input type="text" class="form-control" id="occasionSlug" name="slug" readonly
                         placeholder="se-genera-automaticamente">
                  <div class="form-text">URL amigable generada automáticamente</div>
                </div>

                <div class="mb-3">
                  <label for="occasionDescription" class="form-label fw-bold">Descripción</label>
                  <textarea class="form-control" id="occasionDescription" name="description" rows="3"
                            placeholder="Descripción de la ocasión"></textarea>
                  <div class="form-text">Descripción opcional de la ocasión</div>
                </div>

                <div class="row">
                  <div class="col-md-8">
                    <div class="mb-3">
                      <label for="occasionColor" class="form-label fw-bold">Color *</label>
                      <div class="input-group">
                        <input type="color" class="form-control form-control-color" id="occasionColor" name="color"
                               value="#28a745" title="Elegir color">
                        <input type="text" class="form-control" id="occasionColorText"
                               placeholder="#28a745" pattern="^#[0-9A-Fa-f]{6}$">
                      </div>
                      <div class="form-text">Color representativo de la ocasión</div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="mb-3">
                      <label class="form-label fw-bold">Vista previa</label>
                      <div class="d-flex align-items-center">
                        <span class="badge me-2" id="colorPreview" style="background-color: #28a745;">●</span>
                        <span id="namePreview">Ejemplo</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mb-3 form-check">
                  <input class="form-check-input" type="checkbox" id="occasionIsActive" name="is_active" checked>
                  <label class="form-check-label fw-bold" for="occasionIsActive">
                    Ocasión activa
                  </label>
                  <div class="form-text">Las ocasiones inactivas no aparecen en el catálogo</div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" form="occasionForm" class="btn btn-primary" id="saveOccasionBtn">
                <i class="bi bi-check-circle me-2"></i>${submitText}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Bind form submission and color preview events
   */
  private bindFormSubmission(): void {
    const form = document.getElementById('occasionForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmission();
      });
    }

    // Color picker synchronization
    const colorPicker = document.getElementById('occasionColor') as HTMLInputElement;
    const colorText = document.getElementById('occasionColorText') as HTMLInputElement;
    const colorPreview = document.getElementById('colorPreview');
    const nameInput = document.getElementById('occasionName') as HTMLInputElement;
    const namePreview = document.getElementById('namePreview');

    if (colorPicker && colorText) {
      colorPicker.addEventListener('input', () => {
        colorText.value = colorPicker.value;
        this.updatePreview();
      });

      colorText.addEventListener('input', () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(colorText.value)) {
          colorPicker.value = colorText.value;
          this.updatePreview();
        }
      });
    }

    if (nameInput && namePreview) {
      nameInput.addEventListener('input', () => {
        namePreview.textContent = nameInput.value || 'Ejemplo';
        this.generateSlug();
      });
    }

    // Initial preview update
    this.updatePreview();
  }

  /**
   * Update color preview
   */
  private updatePreview(): void {
    const colorPicker = document.getElementById('occasionColor') as HTMLInputElement;
    const colorPreview = document.getElementById('colorPreview');

    if (colorPicker && colorPreview) {
      colorPreview.style.backgroundColor = colorPicker.value;
    }
  }

  /**
   * Generate slug from name
   */
  private generateSlug(): void {
    const nameInput = document.getElementById('occasionName') as HTMLInputElement;
    const slugInput = document.getElementById('occasionSlug') as HTMLInputElement;

    if (nameInput && slugInput) {
      const slug = nameInput.value
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

      slugInput.value = slug;
    }
  }

  /**
   * Populate form with occasion data
   */
  private populateForm(): void {
    if (!this.currentOccasion) return;

    this.setElementValue('occasionName', this.currentOccasion.name || '');
    this.setElementValue('occasionSlug', this.currentOccasion.slug || '');
    this.setElementValue('occasionDescription', this.currentOccasion.description || '');
    this.setElementValue('occasionColor', this.currentOccasion.color || '#28a745');
    this.setElementValue('occasionColorText', this.currentOccasion.color || '#28a745');
    this.setCheckboxState('occasionIsActive', this.currentOccasion.is_active !== false);

    // Update preview
    const namePreview = document.getElementById('namePreview');
    if (namePreview) {
      namePreview.textContent = this.currentOccasion.name || 'Ejemplo';
    }
    this.updatePreview();

    this.log('Form populated with occasion data', 'info');
  }

  /**
   * Handle form submission
   */
  private async handleFormSubmission(): Promise<void> {
    try {
      const formData = this.getFormData(document.getElementById('occasionForm') as HTMLFormElement);
      const occasionData = this.extractOccasionData(formData);

      // Validate data
      const validationErrors = this.validateOccasionData(occasionData);
      if (validationErrors.length > 0) {
        this.showOccasionMessage(validationErrors.join(', '), 'error');
        return;
      }

      this.log(`Submitting occasion data: ${JSON.stringify(occasionData)}`, 'debug');

      // Show loading state
      this.setSubmitButtonLoading(true);

      let response;
      if (this.isEditMode && this.currentOccasion?.id) {
        response = await apiClient.updateOccasion(this.currentOccasion.id, occasionData);
      } else {
        response = await apiClient.createOccasion(occasionData);
      }

      if (response.success) {
        const action = this.isEditMode ? 'actualizada' : 'creada';
        this.showOccasionMessage(`Ocasión ${action} exitosamente`, 'success');

        // Emit event for other modules
        this.events.emit('occasion:saved', response.data);

        // Close modal after short delay
        setTimeout(() => {
          this.hideModal('occasionModal');
        }, 1500);

      } else {
        throw new Error(response.error || 'Error saving occasion');
      }

    } catch (error) {
      this.log(`Error submitting occasion form: ${error}`, 'error');
      this.showOccasionMessage('Error al guardar la ocasión', 'error');
    } finally {
      this.setSubmitButtonLoading(false);
    }
  }

  /**
   * Extract occasion data from form
   */
  private extractOccasionData(formData: FormData): any {
    return {
      name: formData.get('name')?.toString().trim(),
      slug: formData.get('slug')?.toString().trim(),
      description: formData.get('description')?.toString().trim() || null,
      color: formData.get('color')?.toString(),
      is_active: formData.has('is_active')
    };
  }

  /**
   * Validate occasion data
   */
  private validateOccasionData(occasionData: any): string[] {
    const errors: string[] = [];

    // Name validation
    if (!occasionData.name) {
      errors.push('El nombre es obligatorio');
    } else if (occasionData.name.length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    // Color validation
    if (!occasionData.color) {
      errors.push('El color es obligatorio');
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(occasionData.color)) {
      errors.push('El color debe tener un formato válido (#RRGGBB)');
    }

    // Slug validation (auto-generated, but check if it exists)
    if (!occasionData.slug) {
      errors.push('Error generando el slug');
    }

    return errors;
  }

  /**
   * Show message in occasion modal
   */
  private showOccasionMessage(message: string, type: 'success' | 'error' | 'warning' = 'error'): void {
    const messageArea = document.getElementById('occasionMessageArea');
    const messageDiv = document.getElementById('occasionMessage');

    if (!messageArea || !messageDiv) return;

    // Set message and style
    messageDiv.textContent = message;
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'warning'}`;

    // Show message area
    messageArea.style.display = 'block';

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        this.hideOccasionMessage();
      }, 3000);
    }

    this.log(`Occasion message shown: ${type} - ${message}`, type === 'error' ? 'error' : 'info');
  }

  /**
   * Hide occasion message
   */
  private hideOccasionMessage(): void {
    const messageArea = document.getElementById('occasionMessageArea');
    if (messageArea) {
      messageArea.style.display = 'none';
    }
  }

  /**
   * Set submit button loading state
   */
  private setSubmitButtonLoading(loading: boolean): void {
    const saveBtn = document.getElementById('saveOccasionBtn') as HTMLButtonElement;
    if (!saveBtn) return;

    if (loading) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Guardando...';
    } else {
      saveBtn.disabled = false;
      saveBtn.innerHTML = this.isEditMode ?
        '<i class="bi bi-check-circle me-2"></i>Actualizar Ocasión' :
        '<i class="bi bi-check-circle me-2"></i>Crear Ocasión';
    }
  }

  /**
   * Public method to delete occasion
   */
  public async deleteOccasion(occasionId: number): Promise<void> {
    if (!confirm(`¿Está seguro de que desea eliminar esta ocasión?`)) {
      return;
    }

    try {
      const response = await apiClient.deleteOccasion(occasionId);
      if (response.success) {
        this.showSuccess('Ocasión eliminada exitosamente');
        this.events.emit('occasion:deleted', occasionId);
      } else {
        throw new Error(response.error || 'Error deleting occasion');
      }
    } catch (error) {
      this.log(`Error deleting occasion: ${error}`, 'error');
      this.showError('Error al eliminar la ocasión');
    }
  }

  /**
   * Public method to open modal for new occasion
   */
  public static openForNew(): void {
    if ((window as any).adminPanel?.occasionModal) {
      (window as any).adminPanel.occasionModal.showAddOccasionModal();
    }
  }

  /**
   * Public method to open modal for editing
   */
  public static openForEdit(occasion: Occasion): void {
    if ((window as any).adminPanel?.occasionModal) {
      (window as any).adminPanel.occasionModal.showEditOccasionModal(occasion);
    }
  }
}