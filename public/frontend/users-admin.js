import { api } from './services/api.js';
class UsersAdminManager {
    constructor() {
        this.modal = null;
        this.isEditing = false;
        this.currentPage = 1;
        this.currentQuery = {};
        this.searchTimeout = null;
        this.initialize();
    }
    initialize() {
        this.bindEvents();
        void this.loadUsers();
        this.handleUrlParameters();
        this.log('info', 'Users admin interface initialized');
    }
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const editUserId = urlParams.get('edit');
        if (editUserId) {
            const userId = parseInt(editUserId);
            if (!isNaN(userId)) {
                setTimeout(() => {
                    void this.editUser(userId);
                }, 500);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
    bindEvents() {
        document.getElementById('btnNewUser')?.addEventListener('click', () => {
            this.openModal(false);
        });
        document.getElementById('btnSaveUser')?.addEventListener('click', () => {
            void this.saveUser();
        });
        document.getElementById('btnTogglePassword')?.addEventListener('click', (e) => {
            this.togglePasswordVisibility(e.target);
        });
        const searchInput = document.getElementById('searchInput');
        searchInput?.addEventListener('input', (e) => {
            const value = e.target.value;
            this.debouncedSearch(value);
        });
        ['roleFilter', 'statusFilter', 'emailVerifiedFilter', 'sortBy'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                void this.applyFilters();
            });
        });
    }
    debouncedSearch(searchTerm) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = window.setTimeout(() => {
            this.currentQuery.search = searchTerm || undefined;
            this.currentPage = 1;
            void this.loadUsers();
        }, 500);
    }
    applyFilters() {
        const roleFilter = document.getElementById('roleFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const emailVerifiedFilter = document.getElementById('emailVerifiedFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        this.currentQuery = {
            ...this.currentQuery,
            role: roleFilter || undefined,
            is_active: statusFilter ? statusFilter === 'true' : undefined,
            email_verified: emailVerifiedFilter ? emailVerifiedFilter === 'true' : undefined,
            sort_by: sortBy || 'created_at',
            sort_direction: 'desc'
        };
        this.currentPage = 1;
        void this.loadUsers();
    }
    async loadUsers() {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody)
            return;
        tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5">
          <div class="loading-spinner"></div>
          <div class="mt-2 text-muted">Cargando usuarios...</div>
        </td>
      </tr>
    `;
        try {
            const query = {
                ...this.currentQuery,
                page: this.currentPage,
                limit: 20
            };
            this.log('api', 'Loading users', { query });
            const response = await api.request('/api/users', {
                method: 'GET',
                params: query
            });
            if (response.success && response.data?.users) {
                this.renderUsersTable(response.data.users);
                this.renderPagination(response.data.pagination);
                this.log('success', `Loaded ${response.data.users.length} users`);
            }
            else {
                this.showError('Error al cargar usuarios: ' + (response.message || 'Error desconocido'));
                this.renderErrorState();
            }
        }
        catch (error) {
            this.log('error', 'Failed to load users', { error });
            this.showError('Error de conexión. Verifique su red.');
            this.renderErrorState();
        }
    }
    renderUsersTable(users) {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody)
            return;
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
        this.bindActionButtons();
    }
    bindActionButtons() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = parseInt(e.currentTarget.dataset.userId || '0');
                if (userId)
                    this.editUser(userId);
            });
        });
        document.querySelectorAll('.toggle-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = parseInt(e.currentTarget.dataset.userId || '0');
                if (userId)
                    this.toggleUserActive(userId);
            });
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = parseInt(e.currentTarget.dataset.userId || '0');
                if (userId)
                    this.deleteUser(userId);
            });
        });
    }
    renderPagination(pagination) {
        const paginationInfo = document.getElementById('paginationInfo');
        const paginationControls = document.getElementById('paginationControls');
        if (!paginationInfo || !paginationControls || !pagination)
            return;
        const start = ((pagination.current_page - 1) * pagination.items_per_page) + 1;
        const end = Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items);
        paginationInfo.innerHTML = `
      <i class="bi bi-info-circle me-1"></i>
      Mostrando ${start}-${end} de ${pagination.total_items} usuarios
    `;
        const pages = [];
        pages.push(`
      <li class="page-item ${pagination.current_page === 1 ? 'disabled' : ''}">
        <button class="page-link" ${pagination.current_page === 1 ? 'disabled' : ''}
                onclick="(window as any).usersAdmin.goToPage(${pagination.current_page - 1})">
          <i class="bi bi-chevron-left"></i>
        </button>
      </li>
    `);
        const startPage = Math.max(1, pagination.current_page - 2);
        const endPage = Math.min(pagination.total_pages, pagination.current_page + 2);
        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
        <li class="page-item ${i === pagination.current_page ? 'active' : ''}">
          <button class="page-link" onclick="(window as any).usersAdmin.goToPage(${i})">${i}</button>
        </li>
      `);
        }
        pages.push(`
      <li class="page-item ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}">
        <button class="page-link" ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}
                onclick="(window as any).usersAdmin.goToPage(${pagination.current_page + 1})">
          <i class="bi bi-chevron-right"></i>
        </button>
      </li>
    `);
        paginationControls.innerHTML = pages.join('');
    }
    goToPage(page) {
        this.currentPage = page;
        void this.loadUsers();
    }
    renderErrorState() {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody)
            return;
        tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5">
          <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
          <div class="mt-3">
            <h5 class="text-muted">Error al cargar usuarios</h5>
            <p class="text-muted">Verifique su conexión e intente nuevamente</p>
            <button class="btn btn-primary" onclick="(window as any).usersAdmin.loadUsers()"
              <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
            </button>
          </div>
        </td>
      </tr>
    `;
    }
    openModal(editing) {
        this.isEditing = editing;
        this.resetForm();
        const modalElement = document.getElementById('userModal');
        if (!modalElement)
            return;
        if (!window.bootstrap) {
            this.showError('Bootstrap no está cargado correctamente');
            return;
        }
        this.modal = new window.bootstrap.Modal(modalElement);
        this.modal.show();
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
    resetForm() {
        const form = document.getElementById('userForm');
        if (form)
            form.reset();
        document.getElementById('userId').value = '';
        document.getElementById('is_active').checked = true;
        document.getElementById('email_verified').checked = false;
        this.clearValidationErrors();
    }
    clearValidationErrors() {
        const errorFields = ['email', 'full_name', 'phone', 'role', 'password'];
        errorFields.forEach(field => {
            const errorElement = document.getElementById(`${field}Error`);
            const inputElement = document.getElementById(field);
            if (errorElement) {
                errorElement.textContent = '';
            }
            if (inputElement) {
                inputElement.classList.remove('is-invalid');
            }
        });
    }
    async editUser(userId) {
        try {
            this.log('api', 'Loading user for edit', { userId });
            const response = await api.request(`/api/users/${userId}`, {
                method: 'GET'
            });
            if (response.success && response.data) {
                this.log('info', 'User data received', response.data);
                this.populateForm(response.data);
                this.openModal(true);
                this.log('success', 'User loaded for editing');
            }
            else {
                this.showError('No se pudo cargar los datos del usuario');
            }
        }
        catch (error) {
            this.log('error', 'Failed to load user for edit', { error });
            this.showError('Error de conexión al cargar usuario');
        }
    }
    populateForm(user) {
        document.getElementById('userId').value = user.id.toString();
        document.getElementById('email').value = user.email;
        document.getElementById('full_name').value = user.full_name || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('role').value = user.role;
        document.getElementById('is_active').checked = user.is_active;
        document.getElementById('email_verified').checked = user.email_verified;
        document.getElementById('password').value = '';
    }
    async toggleUserActive(userId) {
        try {
            this.log('api', 'Toggling user active status', { userId });
            const response = await api.request(`/api/users/${userId}/toggle-active`, {
                method: 'PATCH'
            });
            if (response.success) {
                this.showSuccess(response.message || 'Estado del usuario cambiado correctamente');
                void this.loadUsers();
            }
            else {
                this.showError('Error al cambiar estado: ' + (response.message || 'Error desconocido'));
            }
        }
        catch (error) {
            this.log('error', 'Failed to toggle user status', { error });
            this.showError('Error de conexión. Intente nuevamente.');
        }
    }
    async deleteUser(userId) {
        const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
        const userEmail = userRow?.querySelector('td:first-child span')?.textContent || 'el usuario';
        const confirmed = confirm(`¿Está seguro de eliminar a ${userEmail}?\n\n` +
            'Esta acción no se puede deshacer. Solo se puede eliminar usuarios que no tengan órdenes o pagos asociados.');
        if (!confirmed)
            return;
        try {
            this.log('api', 'Deleting user', { userId });
            const response = await api.request(`/api/users/${userId}`, {
                method: 'DELETE'
            });
            if (response.success) {
                this.showSuccess('Usuario eliminado correctamente');
                void this.loadUsers();
            }
            else {
                this.showError('Error al eliminar usuario: ' + (response.message || 'Error desconocido'));
            }
        }
        catch (error) {
            this.log('error', 'Failed to delete user', { error });
            this.showError('Error de conexión. Intente nuevamente.');
        }
    }
    async saveUser() {
        if (!this.validateForm())
            return;
        const formData = this.getFormData();
        const userId = parseInt(document.getElementById('userId').value || '0');
        const saveButton = document.getElementById('btnSaveUser');
        const originalText = saveButton.innerHTML;
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="loading-spinner"></span> Guardando...';
        try {
            let response;
            if (this.isEditing && userId) {
                const updateData = {
                    id: userId,
                    email: formData.email,
                    full_name: formData.full_name,
                    phone: formData.phone || undefined,
                    role: formData.role,
                    is_active: formData.is_active,
                    email_verified: formData.email_verified
                };
                if (formData.password?.trim()) {
                    updateData.password = formData.password;
                }
                this.log('api', 'Updating user', { userId, data: { ...updateData, password: updateData.password ? '[REDACTED]' : undefined } });
                response = await api.request(`/api/users/${userId}`, {
                    method: 'PUT',
                    body: updateData
                });
            }
            else {
                const createData = {
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                    phone: formData.phone || undefined,
                    role: formData.role,
                    is_active: formData.is_active,
                    email_verified: formData.email_verified
                };
                this.log('api', 'Creating user', { data: { ...createData, password: '[REDACTED]' } });
                response = await api.request('/api/users', {
                    method: 'POST',
                    body: createData
                });
            }
            if (response.success) {
                this.modal?.hide();
                void this.loadUsers();
                this.showSuccess(this.isEditing ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
                this.log('success', this.isEditing ? 'User updated' : 'User created');
            }
            else {
                if (response.errors && Array.isArray(response.errors)) {
                    this.showValidationErrors(response.errors);
                }
                else {
                    this.showError('Error al guardar usuario: ' + (response.message || 'Error desconocido'));
                }
            }
        }
        catch (error) {
            this.log('error', 'Failed to save user', { error });
            this.showError('Error de conexión. Intente nuevamente.');
        }
        finally {
            saveButton.disabled = false;
            saveButton.innerHTML = originalText;
        }
    }
    validateForm() {
        this.clearValidationErrors();
        let isValid = true;
        const formData = this.getFormData();
        if (!formData.email.trim()) {
            this.showFieldError('email', 'El email es requerido');
            isValid = false;
        }
        else if (!this.isValidEmail(formData.email)) {
            this.showFieldError('email', 'Formato de email inválido');
            isValid = false;
        }
        if (!formData.full_name.trim()) {
            this.showFieldError('full_name', 'El nombre completo es requerido');
            isValid = false;
        }
        else if (formData.full_name.trim().length < 2) {
            this.showFieldError('full_name', 'El nombre debe tener al menos 2 caracteres');
            isValid = false;
        }
        if (!formData.role) {
            this.showFieldError('role', 'Debe seleccionar un rol');
            isValid = false;
        }
        if (formData.phone?.trim()) {
            if (!this.isValidPhone(formData.phone)) {
                this.showFieldError('phone', 'Formato de teléfono inválido (ej: +58414XXXXXXX)');
                isValid = false;
            }
        }
        if (!this.isEditing) {
            if (!formData.password?.trim()) {
                this.showFieldError('password', 'La contraseña es requerida');
                isValid = false;
            }
            else if (!this.isValidPassword(formData.password)) {
                this.showFieldError('password', 'La contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas y números');
                isValid = false;
            }
        }
        else {
            if (formData.password?.trim() && !this.isValidPassword(formData.password)) {
                this.showFieldError('password', 'La contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas y números');
                isValid = false;
            }
        }
        return isValid;
    }
    getFormData() {
        return {
            email: document.getElementById('email').value.trim(),
            full_name: document.getElementById('full_name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            role: document.getElementById('role').value,
            is_active: document.getElementById('is_active').checked,
            email_verified: document.getElementById('email_verified').checked,
            password: document.getElementById('password').value
        };
    }
    showFieldError(field, message) {
        const errorElement = document.getElementById(`${field}Error`);
        const inputElement = document.getElementById(field);
        if (errorElement) {
            errorElement.textContent = message;
        }
        if (inputElement) {
            inputElement.classList.add('is-invalid');
        }
    }
    showValidationErrors(errors) {
        errors.forEach(error => {
            this.showFieldError(error.field, error.message);
        });
    }
    togglePasswordVisibility(button) {
        const passwordInput = document.getElementById('password');
        if (!passwordInput)
            return;
        const icon = button.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            if (icon)
                icon.className = 'bi bi-eye-slash';
        }
        else {
            passwordInput.type = 'password';
            if (icon)
                icon.className = 'bi bi-eye';
        }
    }
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    isValidPhone(phone) {
        return /^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''));
    }
    isValidPassword(password) {
        return password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password);
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    getRoleBadgeClass(role) {
        switch (role) {
            case 'admin': return 'bg-danger';
            case 'support': return 'bg-warning text-dark';
            case 'user': return 'bg-primary';
            default: return 'bg-secondary';
        }
    }
    getRoleIcon(role) {
        switch (role) {
            case 'admin': return 'bi-shield-fill-check';
            case 'support': return 'bi-headset';
            case 'user': return 'bi-person-fill';
            default: return 'bi-question-circle';
        }
    }
    getRoleLabel(role) {
        switch (role) {
            case 'admin': return 'Administrador';
            case 'support': return 'Soporte';
            case 'user': return 'Usuario';
            default: return role;
        }
    }
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    showError(message) {
        this.showToast(message, 'danger');
    }
    showToast(message, type) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer)
            return;
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
        if (window.bootstrap) {
            const toast = new window.bootstrap.Toast(toastElement, { delay: 5000 });
            toast.show();
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
        }
    }
    log(level, message, data) {
        const logger = window.floresyaLogger;
        if (logger && (level === 'info' || level === 'success' || level === 'error' || level === 'warn')) {
            logger[level]('UsersAdmin', message, data);
        }
        else if (logger && level === 'api') {
            logger.info('UsersAdmin', `[API] ${message}`, data);
        }
        else {
            console[level === 'success' ? 'log' : level === 'api' ? 'log' : level](`[UsersAdmin] ${message}`, data);
        }
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const manager = new UsersAdminManager();
        window['usersAdmin'] = manager;
    });
}
else {
    const manager = new UsersAdminManager();
    window['usersAdmin'] = manager;
}
