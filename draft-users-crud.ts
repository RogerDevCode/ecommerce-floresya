// users-crud.ts
// 🌸 FloresYa - CRUD de Usuarios
// Clean Code, Zero Tech Debt, Tipado estricto

interface User {
    email: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'admin' | 'support';
    is_active: boolean;
    email_verified: boolean;
    // password_hash no se expone en frontend
}

interface UserFormData {
    email: string;
    full_name: string;
    phone?: string;
    role: string;
    is_active: boolean;
    email_verified: boolean;
    password?: string;
}

class UsersCRUD {
    private apiBaseUrl: string;
    private modal: any;
    private isEditing: boolean = false;

    constructor() {
        this.apiBaseUrl = '/api/users'; // ⚠️ PENDIENTE: Configurar URL base de la API
        this.initialize();
    }

    private initialize(): void {
        this.bindEvents();
        this.loadUsers();
    }

    private bindEvents(): void {
        document.getElementById('btnNewUser')?.addEventListener('click', () => {
            this.openModal(false);
        });

        document.getElementById('btnSaveUser')?.addEventListener('click', () => {
            this.saveUser();
        });

        document.getElementById('btnTogglePassword')?.addEventListener('click', (e) => {
            this.togglePasswordVisibility(e.target as HTMLElement);
        });
    }

    private openModal(editing: boolean): void {
        this.isEditing = editing;
        this.resetForm();

        const modalElement = document.getElementById('userModal');
        if (!modalElement) return;

        // Inicializar Bootstrap Modal si no existe
        if (!(window as any).bootstrap) {
            console.error('Bootstrap no está cargado');
            return;
        }

        this.modal = new (window as any).bootstrap.Modal(modalElement);
        this.modal.show();

        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = editing ? 'Editar Usuario' : 'Crear Nuevo Usuario';
        }
    }

    private resetForm(): void {
        (document.getElementById('userId') as HTMLInputElement).value = '';
        (document.getElementById('email') as HTMLInputElement).value = '';
        (document.getElementById('full_name') as HTMLInputElement).value = '';
        (document.getElementById('phone') as HTMLInputElement).value = '';
        (document.getElementById('role') as HTMLSelectElement).value = 'user';
        (document.getElementById('is_active') as HTMLInputElement).checked = true;
        (document.getElementById('email_verified') as HTMLInputElement).checked = false;
        (document.getElementById('password') as HTMLInputElement).value = '';

        // Limpiar errores
        this.clearValidationErrors();
    }

    private clearValidationErrors(): void {
        const errorFields = ['email', 'full_name', 'phone', 'role', 'password'];
        errorFields.forEach(field => {
            const errorElement = document.getElementById(`${field}Error`);
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.classList.remove('d-block');
            }
            const inputElement = document.getElementById(field) as HTMLInputElement | HTMLSelectElement;
            if (inputElement) {
                inputElement.classList.remove('is-invalid');
            }
        });
    }

    private validateForm(): boolean {
        this.clearValidationErrors();
        let isValid = true;

        const formData = this.getFormData();

        // Validar email
        if (!this.validateEmail(formData.email)) {
            this.showError('email', 'Por favor ingrese un email válido');
            isValid = false;
        }

        // Validar nombre completo
        if (!formData.full_name.trim()) {
            this.showError('full_name', 'El nombre completo es requerido');
            isValid = false;
        }

        // Validar rol
        if (!['user', 'admin', 'support'].includes(formData.role)) {
            this.showError('role', 'Seleccione un rol válido');
            isValid = false;
        }

        // Validar contraseña solo si es nuevo usuario
        if (!this.isEditing && formData.password) {
            if (!this.validatePassword(formData.password)) {
                this.showError('password', 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas y números');
                isValid = false;
            }
        }

        return isValid;
    }

    private validateEmail(email: string): boolean {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    private validatePassword(password: string): boolean {
        if (password.length < 8) return false;
        if (!/[A-Z]/.test(password)) return false;
        if (!/[a-z]/.test(password)) return false;
        if (!/[0-9]/.test(password)) return false;
        return true;
    }

    private showError(field: string, message: string): void {
        const errorElement = document.getElementById(`${field}Error`);
        const inputElement = document.getElementById(field) as HTMLInputElement | HTMLSelectElement;

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('d-block');
        }
        if (inputElement) {
            inputElement.classList.add('is-invalid');
        }
    }

    private getFormData(): UserFormData {
        return {
            email: (document.getElementById('email') as HTMLInputElement).value.trim(),
            full_name: (document.getElementById('full_name') as HTMLInputElement).value.trim(),
            phone: (document.getElementById('phone') as HTMLInputElement).value.trim() || undefined,
            role: (document.getElementById('role') as HTMLSelectElement).value,
            is_active: (document.getElementById('is_active') as HTMLInputElement).checked,
            email_verified: (document.getElementById('email_verified') as HTMLInputElement).checked,
            password: (document.getElementById('password') as HTMLInputElement).value || undefined
        };
    }

    private togglePasswordVisibility(button: HTMLElement): void {
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        if (!passwordInput) return;

        const icon = button.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            if (icon) icon.className = 'bi bi-eye-slash';
        } else {
            passwordInput.type = 'password';
            if (icon) icon.className = 'bi bi-eye';
        }
    }

    private async saveUser(): Promise<void> {
        if (!this.validateForm()) return;

        const formData = this.getFormData();
        const userId = (document.getElementById('userId') as HTMLInputElement).value;

        try {
            let response;
            if (this.isEditing && userId) {
                // ⚠️ PENDIENTE: Implementar actualización de usuario
                response = await this.updateUser(userId, formData);
            } else {
                // ⚠️ PENDIENTE: Implementar creación de usuario
                response = await this.createUser(formData);
            }

            if (response.success) {
                this.modal.hide();
                this.loadUsers();
                this.showSuccessToast('Usuario guardado correctamente');
            } else {
                this.showErrorToast('Error al guardar usuario: ' + (response.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error al guardar usuario:', error);
            this.showErrorToast('Error de conexión. Intente nuevamente.');
        }
    }

    private async loadUsers(): Promise<void> {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <div>Cargando usuarios...</div>
                </td>
            </tr>
        `;

        try {
            // ⚠️ PENDIENTE: Implementar obtención de lista de usuarios
            const response = await this.fetchUsers();

            if (response.success && response.data) {
                this.renderUsersTable(response.data);
            } else {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-danger">
                            Error al cargar usuarios. Intente recargar la página.
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        Error de conexión. Verifique su red.
                    </td>
                </tr>
            `;
        }
    }

    private renderUsersTable(users: User[]): void {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        No se encontraron usuarios.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${this.escapeHtml(user.full_name)}</td>
                <td>${user.phone || '-'}</td>
                <td><span class="badge bg-secondary role-badge">${user.role}</span></td>
                <td>
                    <span class="badge status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
                        ${user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <span class="badge ${user.email_verified ? 'bg-success' : 'bg-warning'}">
                        ${user.email_verified ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-email="${this.escapeHtml(user.email)}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-email="${this.escapeHtml(user.email)}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Bind eventos de edición y eliminación
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const email = (e.currentTarget as HTMLElement).dataset.email;
                if (email) this.editUser(email);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const email = (e.currentTarget as HTMLElement).dataset.email;
                if (email) this.deleteUser(email);
            });
        });
    }

    private async editUser(email: string): Promise<void> {
        try {
            // ⚠️ PENDIENTE: Implementar obtención de usuario por email
            const response = await this.fetchUserByEmail(email);

            if (response.success && response.data) {
                this.populateForm(response.data);
                this.openModal(true);
            } else {
                this.showErrorToast('No se pudo cargar los datos del usuario');
            }
        } catch (error) {
            console.error('Error al cargar usuario:', error);
            this.showErrorToast('Error de conexión al cargar usuario');
        }
    }

    private populateForm(user: User): void {
        (document.getElementById('userId') as HTMLInputElement).value = user.email; // Usamos email como ID
        (document.getElementById('email') as HTMLInputElement).value = user.email;
        (document.getElementById('full_name') as HTMLInputElement).value = user.full_name;
        (document.getElementById('phone') as HTMLInputElement).value = user.phone || '';
        (document.getElementById('role') as HTMLSelectElement).value = user.role;
        (document.getElementById('is_active') as HTMLInputElement).checked = user.is_active;
        (document.getElementById('email_verified') as HTMLInputElement).checked = user.email_verified;
        // No se muestra la contraseña por seguridad
    }

    private async deleteUser(email: string): Promise<void> {
        if (!confirm(`¿Está seguro de eliminar al usuario ${email}? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            // ⚠️ PENDIENTE: Implementar eliminación de usuario
            const response = await this.removeUser(email);

            if (response.success) {
                this.loadUsers();
                this.showSuccessToast('Usuario eliminado correctamente');
            } else {
                this.showErrorToast('Error al eliminar usuario: ' + (response.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            this.showErrorToast('Error de conexión. Intente nuevamente.');
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private showSuccessToast(message: string): void {
        this.showToast(message, 'success');
    }

    private showErrorToast(message: string): void {
        this.showToast(message, 'danger');
    }

    private showToast(message: string, type: 'success' | 'danger'): void {
        const toastDiv = document.createElement('div');
        toastDiv.className = `toast align-items-center text-bg-${type} border-0 position-fixed bottom-0 end-0 m-3`;
        toastDiv.setAttribute('role', 'alert');
        toastDiv.setAttribute('aria-live', 'assertive');
        toastDiv.setAttribute('aria-atomic', 'true');
        toastDiv.style.zIndex = '9999';

        toastDiv.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        document.body.appendChild(toastDiv);

        // Inicializar y mostrar toast
        if ((window as any).bootstrap) {
            const toast = new (window as any).bootstrap.Toast(toastDiv, {
                delay: 3000
            });
            toast.show();

            // Eliminar del DOM después de cerrar
            toastDiv.addEventListener('hidden.bs.toast', () => {
                if (toastDiv.parentNode) {
                    toastDiv.parentNode.removeChild(toastDiv);
                }
            });
        }
    }

    // ⚠️ PENDIENTE: Implementar estas funciones según tu API

    private async fetchUsers(): Promise<{ success: boolean; data?: User[]; message?: string }> {
        // ⚠️ PENDIENTE: Implementar llamada a API para obtener lista de usuarios
        throw new Error('fetchUsers no implementado');
    }

    private async fetchUserByEmail(email: string): Promise<{ success: boolean; data?: User; message?: string }> {
        // ⚠️ PENDIENTE: Implementar llamada a API para obtener usuario por email
        throw new Error('fetchUserByEmail no implementado');
    }

    private async createUser(userData: UserFormData): Promise<{ success: boolean; message?: string }> {
        // ⚠️ PENDIENTE: Implementar llamada a API para crear usuario
        throw new Error('createUser no implementado');
    }

    private async updateUser(email: string, userData: UserFormData): Promise<{ success: boolean; message?: string }> {
        // ⚠️ PENDIENTE: Implementar llamada a API para actualizar usuario
        throw new Error('updateUser no implementado');
    }

    private async removeUser(email: string): Promise<{ success: boolean; message?: string }> {
        // ⚠️ PENDIENTE: Implementar llamada a API para eliminar usuario
        throw new Error('removeUser no implementado');
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new UsersCRUD();
    });
} else {
    new UsersCRUD();
}