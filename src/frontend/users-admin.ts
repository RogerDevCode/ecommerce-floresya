/**
 * 🌸 FloresYa Users Admin - TypeScript Enterprise Edition
 * Complete user management interface with advanced features
 */


import type {
  WindowWithFloresyaLogger,
  WindowWithUsersAdmin
} from '../shared/types/frontend.js';

import { api } from './services/apiClient.js';
import type {
  PaginationInfo,
  UserCreateRequest,
  UserFormData,
  UserQuery,
  UserResponse,
  UserUpdateRequest
} from "shared/types/index";

// Extend window with our interfaces
declare const window: WindowWithFloresyaLogger & WindowWithUsersAdmin;

interface UsersResponse {
  success: boolean;
  data?: {
    users: UserResponse[];
    pagination?: PaginationInfo;
  };
  users?: UserResponse[];
  pagination?: PaginationInfo;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

class UsersAdminManager {
  private modal: HTMLElement | null = null;
  private isEditing = false;
  private currentPage = 1;
  private currentQuery: UserQuery = {};
  private searchTimeout: NodeJS.Timeout | number | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.bindEvents();
    void this.loadUsers();
    this.handleUrlParameters();
    this.log('info', 'Users admin interface initialized');
  }

  private handleUrlParameters(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const editUserId = urlParams.get('edit');

    if (editUserId) {
      const userId = parseInt(editUserId);
      if (!isNaN(userId)) {
        // Wait a bit for the page to load, then trigger edit
        setTimeout(() => {
          void this.editUser(userId);
        }, 500);

        // Clean up URL without reloading page
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }

  private bindEvents(): void {
    // New user button
    document.getElementById('btnNewUser')?.addEventListener('click', () => {
      this.openModal(false);
    });

    // Save user button
    document.getElementById('btnSaveUser')?.addEventListener('click', () => {
      void this.saveUser();
    });

    // Toggle password visibility
    document.getElementById('btnTogglePassword')?.addEventListener('click', (e) => {
      this.togglePasswordVisibility(e.target as HTMLElement);
    });

    // Search input with debounce
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.debouncedSearch(value);
    });

    // Filter controls
    ['roleFilter', 'statusFilter', 'emailVerifiedFilter', 'sortBy'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        void this.applyFilters();
      });
    });
  }

  private debouncedSearch(searchTerm: string): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = window.setTimeout(() => {
      this.currentQuery.search = searchTerm || undefined;
      this.currentPage = 1;
      void this.loadUsers();
    }, 500);
  }

  private applyFilters(): void {
    const roleFilter = (document.getElementById('roleFilter') as HTMLSelectElement).value;
    const statusFilter = (document.getElementById('statusFilter') as HTMLSelectElement).value;
    const emailVerifiedFilter = (document.getElementById('emailVerifiedFilter') as HTMLSelectElement).value;
    const sortBy = (document.getElementById('sortBy') as HTMLSelectElement).value;

    this.currentQuery = {
      ...this.currentQuery,
      role: (roleFilter as 'user' | 'admin') || undefined,
      is_active: statusFilter ? statusFilter === 'true' : undefined,
      email_verified: emailVerifiedFilter ? emailVerifiedFilter === 'true' : undefined,
      sort_by: (sortBy as 'email' | 'full_name' | 'role' | 'created_at' | 'updated_at') || 'created_at',
      sort_direction: 'desc'
    };

    this.currentPage = 1;
    void this.loadUsers();
  }

  public async loadUsers(): Promise<void> {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) {return;}

    // Show loading state
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5">
          <div class="loading-spinner"></div>
          <div class="mt-2 text-muted">Cargando usuarios...</div>
        </td>
      </tr>
    `;

    try {
      const query: UserQuery = {
        ...this.currentQuery,
        page: this.currentPage,
        limit: 20
      };

      this.log('api', 'Loading users', { query });

      const response = await api.request<UsersResponse>('/api/users', {
        method: 'GET',
        params: query
      });

      if (response.success && response.data?.users) {
        this.renderUsersTable(response.data.users);
        this.renderPagination(response.data.pagination);
        this.log('success', `Loaded ${response.data.users.length} users`);
      } else {
        this.showError('Error al cargar usuarios: ' + (response.message || 'Error desconocido'));
        this.renderErrorState();
      }

    } catch (error) {
      this.log('error', 'Failed to load users', { error });
      this.showError('Error de conexión. Verifique su red.');
      this.renderErrorState();
    }
  }

  private renderUsersTable(users: UserResponse[]): void {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) {return;}

    if (users.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5">
            <i class="bi bi-people display-1 text-muted"></i>
            <div class="mt-3">
              <h5 class="text-muted">No se encontraron usuarios</h5>
              <p class="text-muted">Intenta ajustar los filtros de búsqueda</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = users.map(user => `
      <tr data-user-id="${user.id}">
        <td>
          <div class="d-flex align-items-center">
            <i class="bi bi-envelope-fill text-primary me-2"></i>
            <span class="fw-semibold">${this.escapeHtml(user.email)}</span>
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center">
            <i class="bi bi-person-fill text-secondary me-2"></i>
            <span>${this.escapeHtml(user.full_name || 'Sin nombre')}</span>
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center">
            <i class="bi bi-telephone-fill text-info me-2"></i>
            <span class="font-monospace">${user.phone || '-'}</span>
          </div>
        </td>
        <td>
          <span class="badge role-badge ${this.getRoleBadgeClass(user.role)}">
            <i class="bi ${this.getRoleIcon(user.role)} me-1"></i>
            ${this.getRoleLabel(user.role)}
          </span>
        </td>
        <td>
          <span class="badge status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
            <i class="bi ${user.is_active ? 'bi-check-circle' : 'bi-x-circle'} me-1"></i>
            ${user.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <span class="badge ${user.email_verified ? 'bg-success' : 'bg-warning text-dark'}">
            <i class="bi ${user.email_verified ? 'bi-patch-check' : 'bi-patch-exclamation'} me-1"></i>
            ${user.email_verified ? 'Verificado' : 'Pendiente'}
          </span>
        </td>
        <td>
          <small class="text-muted">
            <i class="bi bi-calendar3 me-1"></i>
            ${this.formatDate(user.created_at)}
          </small>
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary edit-btn" data-user-id="${user.id}"
                    title="Editar usuario">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'} toggle-btn"
                    data-user-id="${user.id}"
                    title="${user.is_active ? 'Desactivar' : 'Activar'} usuario">
              <i class="bi ${user.is_active ? 'bi-toggle-off' : 'bi-toggle-on'}"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-btn" data-user-id="${user.id}"
                    title="Eliminar usuario">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Bind action buttons
    this.bindActionButtons();
  }

  private bindActionButtons(): void {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const userId = parseInt((e.currentTarget as HTMLElement).dataset.userId || '0');
        if (userId) {void this.editUser(userId);}
      });
    });

    // Toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const userId = parseInt((e.currentTarget as HTMLElement).dataset.userId || '0');
        if (userId) {void this.toggleUserActive(userId);}
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const userId = parseInt((e.currentTarget as HTMLElement).dataset.userId || '0');
        if (userId) {void this.deleteUser(userId);}
      });
    });
  }

  private renderPagination(pagination?: PaginationInfo): void {
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');

    if (!paginationInfo || !paginationControls || !pagination) {return;}

    // Update info
    const start = ((pagination.current_page - 1) * pagination.items_per_page) + 1;
    const end = Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items);

    paginationInfo.innerHTML = `
      <i class="bi bi-info-circle me-1"></i>
      Mostrando ${start}-${end} de ${pagination.total_items} usuarios
    `;

    // Generate pagination controls
    const pages: string[] = [];

    // Previous button
    pages.push(`
      <li class="page-item ${pagination.current_page === 1 ? 'disabled' : ''}">
        <button class="page-link" ${pagination.current_page === 1 ? 'disabled' : ''}
                onclick="window.usersAdmin.goToPage(${pagination.current_page - 1})">
          <i class="bi bi-chevron-left"></i>
        </button>
      </li>
    `);

    // Page numbers
    const startPage = Math.max(1, pagination.current_page - 2);
    const endPage = Math.min(pagination.total_pages, pagination.current_page + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(`
        <li class="page-item ${i === pagination.current_page ? 'active' : ''}">
          <button class="page-link" onclick="window.usersAdmin.goToPage(${i})">${i}</button>
        </li>
      `);
    }

    // Next button
    pages.push(`
      <li class="page-item ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}">
        <button class="page-link" ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}
                onclick="window.usersAdmin.goToPage(${pagination.current_page + 1})">
          <i class="bi bi-chevron-right"></i>
        </button>
      </li>
    `);

    paginationControls.innerHTML = pages.join('');
  }

  public goToPage(page: number): void {
    this.currentPage = page;
    void this.loadUsers();
  }

  private renderErrorState(): void {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) {return;}

    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5">
          <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
          <div class="mt-3">
            <h5 class="text-muted">Error al cargar usuarios</h5>
            <p class="text-muted">Verifique su conexión e intente nuevamente</p>
            <button class="btn btn-primary" onclick="window.usersAdmin.loadUsers()"
              <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  private openModal(editing: boolean): void {
    this.isEditing = editing;
    this.resetForm();

    const modalElement = document.getElementById('userModal');
    if (!modalElement) {return;}

    // Show modal using custom implementation
    modalElement.classList.remove('hidden');
    modalElement.classList.add('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'bg-black', 'bg-opacity-50');
    this.modal = modalElement;

    // Add close functionality
    const closeButtons = modalElement.querySelectorAll('[data-modal-close]');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => this.closeModal());
    });

    // Close on backdrop click
    modalElement.addEventListener('click', (e) => {
      if (e.target === modalElement) {
        this.closeModal();
      }
    });

    const modalTitle = document.getElementById('modalTitle');
    const passwordLabel = document.getElementById('passwordLabel');

    if (modalTitle) {
      modalTitle.innerHTML = editing
        ? '<i class="bi bi-person-gear me-2"></i>Editar Usuario'
        : '<i class="bi bi-person-plus me-2"></i>Crear Nuevo Usuario';
    }

    if (passwordLabel) {
      passwordLabel.textContent = editing
        ? '(dejar vacío para no cambiar)'
        : '(requerida para nuevo usuario)';
    }
  }

  /**
   * Close modal
   */
  private closeModal(): void {
    if (this.modal) {
      this.modal.classList.add('hidden');
      this.modal.classList.remove('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'bg-black', 'bg-opacity-50');
      this.modal = null;
    }
  }

  private resetForm(): void {
    const form = document.getElementById('userForm') as HTMLFormElement;
    if (form) {form.reset();}

    // Reset hidden fields
    (document.getElementById('userId') as HTMLInputElement).value = '';

    // Reset checkboxes to default
    (document.getElementById('is_active') as HTMLInputElement).checked = true;
    (document.getElementById('email_verified') as HTMLInputElement).checked = false;

    // Clear validation errors
    this.clearValidationErrors();
  }

  private clearValidationErrors(): void {
    const errorFields = ['email', 'full_name', 'phone', 'role', 'password'];
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

  private async editUser(userId: number): Promise<void> {
    try {
      this.log('api', 'Loading user for edit', { userId });

      const response = await api.request<UserResponse>(`/api/users/${userId}`, {
        method: 'GET'
      });

      if (response.success && response.data) {
        this.log('info', 'User data received', response.data);
        this.populateForm(response.data);
        this.openModal(true);
        this.log('success', 'User loaded for editing');
      } else {
        this.showError('No se pudo cargar los datos del usuario');
      }

    } catch (error) {
      this.log('error', 'Failed to load user for edit', { error });
      this.showError('Error de conexión al cargar usuario');
    }
  }

  private populateForm(user: UserResponse): void {
    (document.getElementById('userId') as HTMLInputElement).value = user.id.toString();
    (document.getElementById('email') as HTMLInputElement).value = user.email;
    (document.getElementById('full_name') as HTMLInputElement).value = user.full_name || '';
    (document.getElementById('phone') as HTMLInputElement).value = user.phone || '';
    (document.getElementById('role') as HTMLSelectElement).value = user.role;
    (document.getElementById('is_active') as HTMLInputElement).checked = user.is_active;
    (document.getElementById('email_verified') as HTMLInputElement).checked = user.email_verified;

    // Clear password field when editing
    (document.getElementById('password') as HTMLInputElement).value = '';
  }

  private async toggleUserActive(userId: number): Promise<void> {
    try {
      this.log('api', 'Toggling user active status', { userId });

      const response = await api.request<{ success: boolean; data?: UserResponse; message: string }>(`/api/users/${userId}/toggle-active`, {
        method: 'PATCH'
      });

      if (response.success) {
        this.showSuccess(response.message || 'Estado del usuario cambiado correctamente');
        void this.loadUsers(); // Reload to show updated status
      } else {
        this.showError('Error al cambiar estado: ' + (response.message || 'Error desconocido'));
      }

    } catch (error) {
      this.log('error', 'Failed to toggle user status', { error });
      this.showError('Error de conexión. Intente nuevamente.');
    }
  }

  private async deleteUser(userId: number): Promise<void> {
    // Get user info for confirmation
    const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
    const userEmail = userRow?.querySelector('td:first-child span')?.textContent || 'el usuario';

    const confirmed = typeof window?.confirm !== 'undefined' &&
                      window.confirm('¿Estás seguro de que deseas eliminar este usuario?');

    if (!confirmed) {return;}

    try {
      this.log('api', 'Deleting user', { userId });

      const response = await api.request<{ success: boolean; message: string }>(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        this.showSuccess('Usuario eliminado correctamente');
        void this.loadUsers(); // Reload to remove deleted user
      } else {
        this.showError('Error al eliminar usuario: ' + (response.message || 'Error desconocido'));
      }

    } catch (error) {
      this.log('error', 'Failed to delete user', { error });
      this.showError('Error de conexión. Intente nuevamente.');
    }
  }

  private async saveUser(): Promise<void> {
    if (!this.validateForm()) {return;}

    const formData = this.getFormData();
    const userId = parseInt((document.getElementById('userId') as HTMLInputElement).value || '0');

    // Disable save button and show loading
    const saveButton = document.getElementById('btnSaveUser') as HTMLButtonElement;
    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="loading-spinner"></span> Guardando...';

    try {
      let response;

      if (this.isEditing && userId) {
        // Update user
        const updateData: UserUpdateRequest = {
          id: userId,
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || undefined,
          role: formData.role as 'user' | 'admin',
          is_active: formData.is_active,
          email_verified: formData.email_verified
        };

        if (formData.password?.trim()) {
          updateData.password = formData.password;
        }

        this.log('api', 'Updating user', { userId, data: { ...updateData, password: updateData.password ? '[REDACTED]' : undefined } });

        response = await api.request<UsersResponse>(`/api/users/${userId}`, {
          method: 'PUT',
          body: updateData
        });
      } else {
        // Create user
        const createData: UserCreateRequest = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone || undefined,
          role: formData.role as 'user' | 'admin',
          is_active: formData.is_active,
          email_verified: formData.email_verified
        };

        this.log('api', 'Creating user', { data: { ...createData, password: '[REDACTED]' } });

        response = await api.request<UsersResponse>('/api/users', {
          method: 'POST',
          body: createData
        });
      }

      if (response.success) {
        this.closeModal();
        void this.loadUsers();
        this.showSuccess(this.isEditing ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
        this.log('success', this.isEditing ? 'User updated' : 'User created');
      } else {
        if (response.errors && Array.isArray(response.errors)) {
          this.showValidationErrors(response.errors);
        } else {
          this.showError('Error al guardar usuario: ' + (response.message || 'Error desconocido'));
        }
      }

    } catch (error) {
      this.log('error', 'Failed to save user', { error });
      this.showError('Error de conexión. Intente nuevamente.');
    } finally {
      // Restore save button
      saveButton.disabled = false;
      saveButton.innerHTML = originalText;
    }
  }

  private validateForm(): boolean {
    this.clearValidationErrors();
    let isValid = true;

    const formData = this.getFormData();

    // Email validation
    if (!formData.email.trim()) {
      this.showFieldError('email', 'El email es requerido');
      isValid = false;
    } else if (!this.isValidEmail(formData.email)) {
      this.showFieldError('email', 'Formato de email inválido');
      isValid = false;
    }

    // Full name validation
    if (!formData.full_name.trim()) {
      this.showFieldError('full_name', 'El nombre completo es requerido');
      isValid = false;
    } else if (formData.full_name.trim().length < 2) {
      this.showFieldError('full_name', 'El nombre debe tener al menos 2 caracteres');
      isValid = false;
    }

    // Role validation
    if (!formData.role) {
      this.showFieldError('role', 'Debe seleccionar un rol');
      isValid = false;
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone?.trim()) {
      if (!this.isValidPhone(formData.phone)) {
        this.showFieldError('phone', 'Formato de teléfono inválido (ej: +58414XXXXXXX)');
        isValid = false;
      }
    }

    // Password validation
    if (!this.isEditing) {
      // Required for new users
      if (!formData.password?.trim()) {
        this.showFieldError('password', 'La contraseña es requerida');
        isValid = false;
      } else if (!this.isValidPassword(formData.password)) {
        this.showFieldError('password', 'La contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas y números');
        isValid = false;
      }
    } else {
      // Optional for editing, but must be valid if provided
      if (formData.password?.trim() && !this.isValidPassword(formData.password)) {
        this.showFieldError('password', 'La contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas y números');
        isValid = false;
      }
    }

    return isValid;
  }

  private getFormData(): UserFormData {
    return {
      email: (document.getElementById('email') as HTMLInputElement).value.trim(),
      full_name: (document.getElementById('full_name') as HTMLInputElement).value.trim(),
      phone: (document.getElementById('phone') as HTMLInputElement).value.trim(),
      role: (document.getElementById('role') as HTMLSelectElement).value,
      is_active: (document.getElementById('is_active') as HTMLInputElement).checked,
      email_verified: (document.getElementById('email_verified') as HTMLInputElement).checked,
      password: (document.getElementById('password') as HTMLInputElement).value
    };
  }

  private showFieldError(field: string, message: string): void {
    const errorElement = document.getElementById(`${field}Error`);
    const inputElement = document.getElementById(field) as HTMLInputElement | HTMLSelectElement;

    if (errorElement) {
      errorElement.textContent = message;
    }
    if (inputElement) {
      inputElement.classList.add('is-invalid');
    }
  }

  private showValidationErrors(errors: Array<{ field: string; message: string }>): void {
    errors.forEach(error => {
      this.showFieldError(error.field, error.message);
    });
  }

  private togglePasswordVisibility(button: HTMLElement): void {
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (!passwordInput) {return;}

    const icon = button.querySelector('i');
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      if (icon) {icon.className = 'bi bi-eye-slash';}
    } else {
      passwordInput.type = 'password';
      if (icon) {icon.className = 'bi bi-eye';}
    }
  }

  // Utility methods
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone: string): boolean {
    return /^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''));
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'user': return 'bg-primary';
      default: return 'bg-secondary';
    }
  }

  private getRoleIcon(role: string): string {
    switch (role) {
      case 'admin': return 'bi-shield-fill-check';
      case 'user': return 'bi-person-fill';
      default: return 'bi-question-circle';
    }
  }

  private getRoleLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'user': return 'Usuario';
      default: return role;
    }
  }

  private showSuccess(message: string): void {
    this.showToast(message, 'success');
  }

  private showError(message: string): void {
    this.showToast(message, 'danger');
  }

  private showToast(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {return;}

    const toastId = `toast-${Date.now()}`;
    const toastElement = document.createElement('div');
    toastElement.id = toastId;
    toastElement.className = `toast align-items-center text-bg-${type} border-0`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');

    const iconMap = {
      success: 'bi-check-circle-fill',
      danger: 'bi-exclamation-triangle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill'
    };

    toastElement.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center">
          <i class="bi ${iconMap[type]} me-2"></i>
          ${this.escapeHtml(message)}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    toastContainer.appendChild(toastElement);

    // Auto remove after delay
    setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.remove();
      }
    }, 5000);
  }

  private log(level: 'info' | 'success' | 'error' | 'warn' | 'api', message: string, data?: unknown): void {
    const logger = window.floresyaLogger;
    if (logger && (level === 'info' || level === 'success' || level === 'error' || level === 'warn')) {
      logger[level]('UsersAdmin', message, data as never);
    } else if (logger && level === 'api') {
      logger.info('UsersAdmin', `[API] ${message}`, data as never);
    } else {
      if (level === 'success' || level === 'api') {
              } else if (level === 'error') {
              } else if (level === 'warn') {
              } else {
              }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
  const manager = new UsersAdminManager();
  // Expose to window for pagination callbacks
  (window as any).usersAdmin = {
    goToPage: (page: number) => manager.goToPage(page),
    loadUsers: () => manager.loadUsers()
  };
});
} else {
const manager = new UsersAdminManager();
// Expose to window for pagination callbacks
(window as any).usersAdmin = {
  goToPage: (page: number) => manager.goToPage(page),
  loadUsers: () => manager.loadUsers()
};
}