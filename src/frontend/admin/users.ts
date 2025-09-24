/**
 * 🌸 FloresYa Admin Users Module
 * Handles user management, CRUD operations, and user table rendering
 */

import type { UserRole } from '@shared/types';

import type { AdminUser, AdminPanelLogger } from './types';

export class AdminUsers {
  private logger: AdminPanelLogger;

  constructor(logger: AdminPanelLogger) {
    this.logger = logger;
  }

  /**
   * Load users data from API
   */
  public async loadUsersData(): Promise<void> {
    try {
      this.showLoading();

      // Fetch real users data from API
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');

      const usersData = await response.json();
      this.logger.log(`Loaded ${usersData.users?.length ?? 0} users from API`, 'success');

      this.renderUsersTable(usersData.users ?? []);

      // Bind user management buttons after DOM is ready
      this.bindUserButtons();
    } catch (error: unknown) {
      this.logger.log('Error loading users: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al cargar usuarios');
      this.renderUsersTable([]);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Create new user
   */
  public async createUser(userData: Partial<AdminUser>): Promise<void> {
    try {
      this.logger.log('Creating new user', 'info');

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) throw new Error('Failed to create user');

      this.logger.log('User created successfully', 'success');
      this.showSuccess('Usuario creado exitosamente');

      // Reload users to reflect changes
      void this.loadUsersData();

    } catch (error: unknown) {
      this.logger.log('Error creating user: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al crear usuario');
    }
  }

  /**
   * Update user
   */
  public async updateUser(userId: number, userData: Partial<AdminUser>): Promise<void> {
    try {
      this.logger.log(`Updating user ${userId}`, 'info');

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) throw new Error('Failed to update user');

      this.logger.log(`User ${userId} updated successfully`, 'success');
      this.showSuccess('Usuario actualizado exitosamente');

      // Reload users to reflect changes
      void this.loadUsersData();

    } catch (error: unknown) {
      this.logger.log('Error updating user: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al actualizar usuario');
    }
  }

  /**
   * Delete user
   */
  public async deleteUser(userId: number): Promise<void> {
    try {
      if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
        return;
      }

      this.logger.log(`Deleting user ${userId}`, 'info');

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete user');

      this.logger.log(`User ${userId} deleted successfully`, 'success');
      this.showSuccess('Usuario eliminado exitosamente');

      // Reload users to reflect changes
      void this.loadUsersData();

    } catch (error: unknown) {
      this.logger.log('Error deleting user: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al eliminar usuario');
    }
  }

  /**
   * Toggle user active status
   */
  public async toggleUserStatus(userId: number, currentStatus: boolean): Promise<void> {
    try {
      const newStatus = !currentStatus;
      this.logger.log(`Toggling user ${userId} status to ${newStatus}`, 'info');

      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update user status');

      this.logger.log(`User ${userId} status updated successfully`, 'success');
      this.showSuccess(`Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`);

      // Reload users to reflect changes
      void this.loadUsersData();

    } catch (error: unknown) {
      this.logger.log('Error updating user status: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al actualizar estado del usuario');
    }
  }

  /**
   * Render users table
   */
  private renderUsersTable(users: AdminUser[]): void {
    const usersTableBody = document.getElementById('usersTableBody');
    if (!usersTableBody) return;

    if (users.length === 0) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">
            <div class="text-muted">
              <i class="bi bi-people display-4 mb-3"></i>
              <p>No se encontraron usuarios</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    usersTableBody.innerHTML = users.map(user => `
      <tr>
        <td><strong>#${user.id}</strong></td>
        <td>
          <div class="fw-medium">${user.full_name ?? 'Sin nombre'}</div>
          <small class="text-muted">${user.email}</small>
        </td>
        <td>
          <span class="badge bg-${this.getRoleColor(user.role)}">${this.getRoleLabel(user.role)}</span>
        </td>
        <td>
          <span class="badge bg-${user.is_active ? 'success' : 'secondary'}">
            ${user.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="adminPanel.users.editUser(${user.id})"
                    title="Editar usuario">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-${user.is_active ? 'warning' : 'success'}"
                    onclick="adminPanel.users.toggleUserStatus(${user.id}, ${user.is_active})"
                    title="${user.is_active ? 'Desactivar' : 'Activar'} usuario">
              <i class="bi bi-${user.is_active ? 'pause' : 'play'}"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="adminPanel.users.deleteUser(${user.id})"
                    title="Eliminar usuario">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Show user creation modal
   */
  public showCreateUserModal(): void {
    const modalElement = document.getElementById('createUserModal');
    if (modalElement) {
      // Reset form
      const form = modalElement.querySelector('form');
      if (!(form instanceof HTMLFormElement)) return;
      if (form) form.reset();

      // Show modal (implementation depends on UI framework)
      this.showModal(modalElement);
    }
  }

  /**
   * Show user edit modal
   */
  public editUser(userId: number): void {
    this.logger.log(`Editing user ${userId}`, 'info');
    // Implementation would fetch user data and populate edit form
    // Then show edit modal
  }

  /**
   * Bind user management buttons
   */
  private bindUserButtons(): void {
    const createUserBtn = document.getElementById('createUserBtn');
    if (createUserBtn) {
      createUserBtn.addEventListener('click', () => this.showCreateUserModal());
    }

    // Additional event bindings for user management
    const userFormButtons = document.querySelectorAll('[data-user-action]');
    userFormButtons.forEach(button => {
      const action = button.getAttribute('data-user-action');
      if (action === 'save') {
        button.addEventListener('click', () => this.handleUserFormSubmit());
      }
    });
  }

  /**
   * Handle user form submission
   */
  private handleUserFormSubmit(): void {
    const form = document.getElementById('userForm') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const userData = {
      email: formData.get('email') as string,
      full_name: formData.get('full_name') as string,
      role: formData.get('role') as UserRole,
      is_active: formData.get('is_active') === 'true'
    };

    const userId = formData.get('user_id') as string;
    if (userId) {
      void this.updateUser(parseInt(userId), userData);
    } else {
      void this.createUser(userData);
    }
  }

  /**
   * Get role color for badges
   */
  private getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      'admin': 'danger',
      'manager': 'warning',
      'user': 'primary',
      'customer': 'info'
    };
    return colors[role] ?? 'secondary';
  }

  /**
   * Get role label
   */
  private getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'admin': 'Administrador',
      'manager': 'Gerente',
      'user': 'Usuario',
      'customer': 'Cliente'
    };
    return labels[role] ?? role;
  }

  /**
   * Show loading state
   */
  private showLoading(): void {
    const loadingEl = document.getElementById('usersLoading');
    if (loadingEl) loadingEl.style.display = 'block';
  }

  /**
   * Hide loading state
   */
  private hideLoading(): void {
    const loadingEl = document.getElementById('usersLoading');
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
    // This is a placeholder
    console.warn('Modal implementation needed');
  }
}