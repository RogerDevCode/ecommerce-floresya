/**
 * 🌸 FloresYa Admin - User Modal
 * Self-contained module for user creation and editing
 */

import { AdminCore } from './AdminCore.js';
import { apiClient } from './ApiClient.js';

export interface User {
  id?: number;
  email: string;
  full_name: string;
  phone?: string;
  role: 'user' | 'admin' | 'support';
  is_active: boolean;
  email_verified: boolean;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PasswordStrength {
  level: 'weak' | 'medium' | 'strong';
  message: string;
  color: string;
}

export class UserModal extends AdminCore {
  private currentUser: User | null = null;
  private isEditMode: boolean = false;

  protected init(): void {
    this.bindEvents();
    this.log('UserModal initialized', 'success');
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    // Listen for global events
    this.events.on('user:createRequested', () => {
      this.showAddUserModal();
    });

    this.events.on('user:editRequested', (user: User) => {
      this.showEditUserModal(user);
    });

    // Form submission
    const saveUserBtn = document.getElementById('saveUserBtn');
    if (saveUserBtn) {
      saveUserBtn.addEventListener('click', async () => {
        await this.handleFormSubmission();
      });
    }

    // Password strength indicator
    const passwordInput = document.getElementById('userPassword') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        this.updatePasswordStrength(passwordInput.value);
      });
    }
  }

  /**
   * Show modal for adding new user
   */
  public async showAddUserModal(): Promise<void> {
    this.log('Opening user creation modal', 'info');
    this.isEditMode = false;
    this.currentUser = null;
    await this.showUserModal();
  }

  /**
   * Show modal for editing existing user
   */
  public async showEditUserModal(user: User): Promise<void> {
    this.log(`Opening user edit modal for user ${user.id}`, 'info');
    this.isEditMode = true;
    this.currentUser = user;
    await this.showUserModal();
  }

  /**
   * Main modal display logic
   */
  private async showUserModal(): Promise<void> {
    try {
      // Reset form and modal state
      this.resetModal();

      // Populate form if editing
      if (this.isEditMode && this.currentUser) {
        this.populateForm();
      }

      // Update modal title and button text
      this.updateModalLabels();

      // Show modal
      this.showModal('userModal');

      this.log(`User modal ${this.isEditMode ? 'edit' : 'create'} opened successfully`, 'success');

    } catch (error) {
      this.log(`Error showing user modal: ${error}`, 'error');
      this.showError('Error al abrir el modal de usuario');
    }
  }

  /**
   * Update modal labels based on mode
   */
  private updateModalLabels(): void {
    const modalTitle = document.getElementById('userModalLabel');
    const saveBtn = document.getElementById('saveUserBtn');

    if (modalTitle) {
      modalTitle.textContent = this.isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario';
    }

    if (saveBtn) {
      saveBtn.textContent = this.isEditMode ? 'Actualizar Usuario' : 'Crear Usuario';
    }

    // Update password label for edit mode
    const passwordLabel = document.querySelector('label[for="userPassword"]');
    const passwordInput = document.getElementById('userPassword') as HTMLInputElement;

    if (this.isEditMode) {
      if (passwordLabel) {
        passwordLabel.textContent = 'Nueva Contraseña (opcional)';
      }
      if (passwordInput) {
        passwordInput.required = false;
        passwordInput.placeholder = 'Dejar vacío para mantener la actual';
      }
    } else {
      if (passwordLabel) {
        passwordLabel.textContent = 'Contraseña *';
      }
      if (passwordInput) {
        passwordInput.required = true;
        passwordInput.placeholder = 'Mínimo 8 caracteres';
      }
    }
  }

  /**
   * Populate form with user data
   */
  private populateForm(): void {
    if (!this.currentUser) return;

    this.setElementValue('userEmail', this.currentUser.email || '');
    this.setElementValue('userFullName', this.currentUser.full_name || '');
    this.setElementValue('userPhone', this.currentUser.phone || '');
    this.setElementValue('userRole', this.currentUser.role || '');
    this.setCheckboxState('userIsActive', this.currentUser.is_active);
    this.setCheckboxState('userEmailVerified', this.currentUser.email_verified);

    // Clear password field in edit mode
    this.setElementValue('userPassword', '');

    this.log('Form populated with user data', 'info');
  }

  /**
   * Handle form submission
   */
  private async handleFormSubmission(): Promise<void> {
    try {
      const userData = this.extractUserData();

      // Validate data
      const validationErrors = this.validateUserData(userData);
      if (validationErrors.length > 0) {
        this.showUserMessage(validationErrors.join(', '), 'error');
        return;
      }

      this.log(`Submitting user data: ${JSON.stringify(userData)}`, 'debug');

      // Show loading state
      this.setSubmitButtonLoading(true);

      let response;
      if (this.isEditMode && this.currentUser?.id) {
        // Remove password if empty in edit mode
        if (!userData.password) {
          delete userData.password;
        }
        response = await apiClient.updateUser(this.currentUser.id, userData);
      } else {
        response = await apiClient.createUser(userData);
      }

      if (response.success) {
        const action = this.isEditMode ? 'actualizado' : 'creado';
        this.showUserMessage(`Usuario ${action} exitosamente`, 'success');

        // Emit event for other modules
        this.events.emit('user:saved', response.data);

        // Close modal after short delay
        setTimeout(() => {
          this.hideModal('userModal');
        }, 1500);

      } else {
        throw new Error(response.error || 'Error saving user');
      }

    } catch (error) {
      this.log(`Error submitting user form: ${error}`, 'error');
      this.showUserMessage('Error al guardar el usuario', 'error');
    } finally {
      this.setSubmitButtonLoading(false);
    }
  }

  /**
   * Extract user data from form
   */
  private extractUserData(): any {
    return {
      email: this.getElementValue('userEmail').trim(),
      full_name: this.getElementValue('userFullName').trim(),
      phone: this.getElementValue('userPhone').trim() || null,
      role: this.getElementValue('userRole'),
      is_active: this.getCheckboxState('userIsActive'),
      email_verified: this.getCheckboxState('userEmailVerified'),
      password: this.getElementValue('userPassword').trim() || undefined
    };
  }

  /**
   * Validate user data
   */
  private validateUserData(userData: any): string[] {
    const errors: string[] = [];

    // Email validation
    if (!userData.email) {
      errors.push('El email es obligatorio');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('El email no tiene un formato válido');
    }

    // Full name validation
    if (!userData.full_name) {
      errors.push('El nombre completo es obligatorio');
    } else if (userData.full_name.length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    // Role validation
    if (!userData.role) {
      errors.push('El rol es obligatorio');
    }

    // Password validation (only for new users or when password is provided)
    if (!this.isEditMode || userData.password) {
      if (!userData.password) {
        errors.push('La contraseña es obligatoria');
      } else {
        const strength = this.checkPasswordStrength(userData.password);
        if (strength.level === 'weak') {
          errors.push('La contraseña es muy débil. Debe tener al menos 8 caracteres con mayúsculas, minúsculas y números');
        }
      }
    }

    return errors;
  }

  /**
   * Check password strength
   */
  private checkPasswordStrength(password: string): PasswordStrength {
    if (password.length < 8) {
      return {
        level: 'weak',
        message: 'Muy débil - Mínimo 8 caracteres',
        color: '#dc3545'
      };
    }

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (hasLower && hasUpper && hasNumber && hasSpecial && password.length >= 12) {
      return {
        level: 'strong',
        message: 'Muy fuerte',
        color: '#28a745'
      };
    } else if ((hasLower && hasUpper && hasNumber) || (hasLower && hasUpper && hasSpecial) || (hasLower && hasNumber && hasSpecial) || (hasUpper && hasNumber && hasSpecial)) {
      return {
        level: 'medium',
        message: 'Moderada',
        color: '#ffc107'
      };
    } else {
      return {
        level: 'weak',
        message: 'Débil - Añade mayúsculas, números y símbolos',
        color: '#dc3545'
      };
    }
  }

  /**
   * Update password strength indicator
   */
  private updatePasswordStrength(password: string): void {
    const strengthIndicator = document.getElementById('passwordStrength');
    if (!strengthIndicator) return;

    if (!password) {
      strengthIndicator.style.display = 'none';
      return;
    }

    const strength = this.checkPasswordStrength(password);
    strengthIndicator.style.display = 'block';
    strengthIndicator.textContent = strength.message;
    strengthIndicator.style.color = strength.color;
    strengthIndicator.className = `password-strength ${strength.level}`;
  }

  /**
   * Show message in user modal
   */
  private showUserMessage(message: string, type: 'success' | 'error' | 'warning' = 'error'): void {
    const messageArea = document.getElementById('userMessageArea');
    const messageDiv = document.getElementById('userMessage');

    if (!messageArea || !messageDiv) return;

    // Set message and style
    messageDiv.textContent = message;
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'warning'}`;

    // Show message area
    messageArea.style.display = 'block';

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        this.hideUserMessage();
      }, 3000);
    }

    this.log(`User message shown: ${type} - ${message}`, type === 'error' ? 'error' : 'info');
  }

  /**
   * Hide user message
   */
  private hideUserMessage(): void {
    const messageArea = document.getElementById('userMessageArea');
    if (messageArea) {
      messageArea.style.display = 'none';
    }
  }

  /**
   * Set submit button loading state
   */
  private setSubmitButtonLoading(loading: boolean): void {
    const saveBtn = document.getElementById('saveUserBtn') as HTMLButtonElement;
    if (!saveBtn) return;

    if (loading) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Guardando...';
    } else {
      saveBtn.disabled = false;
      saveBtn.innerHTML = this.isEditMode ? 'Actualizar Usuario' : 'Crear Usuario';
    }
  }

  /**
   * Reset modal form and state
   */
  private resetModal(): void {
    // Reset form
    const form = document.getElementById('userForm') as HTMLFormElement;
    if (form) {
      form.reset();
    }

    // Reset checkboxes to default
    this.setCheckboxState('userIsActive', true);
    this.setCheckboxState('userEmailVerified', false);

    // Hide message area
    this.hideUserMessage();

    // Clear validation errors
    this.clearValidationErrors();

    // Hide password strength indicator
    const strengthIndicator = document.getElementById('passwordStrength');
    if (strengthIndicator) {
      strengthIndicator.style.display = 'none';
    }

    // Reset button state
    this.setSubmitButtonLoading(false);

    this.log('User modal reset', 'info');
  }

  /**
   * Clear validation errors
   */
  private clearValidationErrors(): void {
    const errorFields = ['userEmail', 'userFullName', 'userPhone', 'userRole', 'userPassword'];
    errorFields.forEach(field => {
      const errorElement = document.getElementById(`${field}Error`);
      const inputElement = document.getElementById(field) as HTMLInputElement | HTMLSelectElement;

      if (errorElement) {
        errorElement.textContent = '';
      }
      if (inputElement) {
        inputElement.classList.remove('is-invalid');
      }
    });
  }

  /**
   * Public method to delete user
   */
  public async deleteUser(userId: number): Promise<void> {
    if (!confirm(`¿Está seguro de que desea eliminar este usuario?`)) {
      return;
    }

    try {
      const response = await apiClient.deleteUser(userId);
      if (response.success) {
        this.showSuccess('Usuario eliminado exitosamente');
        this.events.emit('user:deleted', userId);
      } else {
        throw new Error(response.error || 'Error deleting user');
      }
    } catch (error) {
      this.log(`Error deleting user: ${error}`, 'error');
      this.showError('Error al eliminar el usuario');
    }
  }

  /**
   * Public method to open modal for new user
   */
  public static openForNew(): void {
    if ((window as any).adminPanel?.userModal) {
      (window as any).adminPanel.userModal.showAddUserModal();
    }
  }

  /**
   * Public method to open modal for editing
   */
  public static openForEdit(user: User): void {
    if ((window as any).adminPanel?.userModal) {
      (window as any).adminPanel.userModal.showEditUserModal(user);
    }
  }
}