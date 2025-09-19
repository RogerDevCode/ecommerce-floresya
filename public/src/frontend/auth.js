export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }
    init() {
        this.bindLoginForm();
        this.checkExistingSession();
        this.updateUIBasedOnAuth();
    }
    bindLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                void this.handleLogin();
            });
        }
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }
    async handleLogin() {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        const email = emailInput?.value;
        const password = passwordInput?.value;
        if (!email || !password) {
            this.showAlert('Por favor ingresa email y contraseña', 'warning');
            return;
        }
        try {
            const submitBtn = document.querySelector('#loginForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Cargando...';
            }
            const response = await this.authenticateUser({ email, password });
            if (response.success && response.user) {
                this.setUserSession(response.user);
                const loginModal = document.getElementById('loginModal');
                if (loginModal && window.bootstrap) {
                    const Modal = window.bootstrap.Modal;
                    if (Modal?.getInstance) {
                        const modal = Modal.getInstance(loginModal);
                        if (modal)
                            modal.hide();
                    }
                }
                this.redirectBasedOnRole(response.user.role);
                this.showAlert('¡Bienvenido! Has iniciado sesión correctamente.', 'success');
            }
            else {
                this.showAlert(response.message ?? 'Credenciales incorrectas', 'danger');
            }
        }
        catch (error) {
            console.error('Login error:', error);
            this.showAlert('Error al iniciar sesión. Inténtalo de nuevo.', 'danger');
        }
        finally {
            const submitBtn = document.querySelector('#loginForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Iniciar Sesión';
            }
        }
    }
    async authenticateUser(credentials) {
        const mockUsers = [
            {
                email: 'admin@floresya.com',
                password: 'admin',
                user: { id: 1, email: 'admin@floresya.com', name: 'Administrador', role: 'admin' }
            },
            {
                email: 'cliente@floresya.com',
                password: 'cliente',
                user: { id: 2, email: 'cliente@floresya.com', name: 'Cliente', role: 'user' }
            }
        ];
        await new Promise(resolve => setTimeout(resolve, 1000));
        const foundUser = mockUsers.find(u => u.email === credentials.email && u.password === credentials.password);
        if (foundUser) {
            return {
                success: true,
                user: foundUser.user
            };
        }
        else {
            return {
                success: false,
                message: 'Email o contraseña incorrectos'
            };
        }
    }
    setUserSession(user) {
        this.currentUser = user;
        localStorage.setItem('floresya_user', JSON.stringify(user));
        localStorage.setItem('floresya_session', Date.now().toString());
    }
    getUserSession() {
        const userData = localStorage.getItem('floresya_user');
        if (userData) {
            try {
                return JSON.parse(userData);
            }
            catch (_e) {
                return null;
            }
        }
        return null;
    }
    checkExistingSession() {
        const user = this.getUserSession();
        if (user) {
            this.currentUser = user;
            const sessionTime = localStorage.getItem('floresya_session');
            if (sessionTime) {
                const sessionAge = Date.now() - parseInt(sessionTime);
                const maxAge = 24 * 60 * 60 * 1000;
                if (sessionAge > maxAge) {
                    this.logout();
                    return;
                }
            }
        }
    }
    logout() {
        console.log('[🔐 AUTH] Iniciando proceso seguro de logout');
        try {
            this.currentUser = null;
            this.clearAllSessionData();
            this.clearCache();
            console.log('[✅ AUTH] Sesión cerrada completamente - Todos los datos eliminados');
            window.location.href = '/';
        }
        catch (error) {
            console.error('[❌ AUTH] Error durante logout:', error);
            window.location.href = '/';
        }
    }
    clearAllSessionData() {
        try {
            localStorage.removeItem('floresya_user');
            localStorage.removeItem('floresya_session');
            localStorage.removeItem('floresya_token');
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('floresya_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`[🗑️ AUTH] Eliminado: ${key}`);
            });
            console.log(`[🧹 AUTH] Limpiados ${keysToRemove.length + 3} elementos de localStorage`);
        }
        catch (error) {
            console.error('[❌ AUTH] Error limpiando localStorage:', error);
            try {
                localStorage.clear();
                console.warn('[🧹 AUTH] localStorage completamente limpiado como fallback');
            }
            catch (fallbackError) {
                console.error('[❌ AUTH] Error en fallback de limpieza:', fallbackError);
            }
        }
    }
    clearCache() {
        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.clear();
                console.log('[🗂️ AUTH] sessionStorage limpiado');
            }
            if (window.floresyaApp) {
                console.log('[🔄 AUTH] Estado global de aplicación reseteado');
            }
        }
        catch (error) {
            console.error('[❌ AUTH] Error limpiando cache:', error);
        }
    }
    redirectBasedOnRole(role) {
        if (role === 'admin') {
            window.location.href = '/pages/admin.html';
        }
        else {
            window.location.reload();
        }
    }
    updateUIBasedOnAuth() {
        const user = this.getUserSession();
        const loginBtn = document.getElementById('loginBtn');
        const userDropdown = document.getElementById('userDropdown');
        const adminPanelLink = document.getElementById('adminPanelLink');
        const logoutNavItem = document.getElementById('logoutNavItem');
        const mainLogoutBtn = document.getElementById('mainLogoutBtn');
        if (user) {
            if (loginBtn)
                loginBtn.style.display = 'none';
            if (userDropdown) {
                userDropdown.style.display = 'block';
                const userMenu = document.getElementById('userMenu');
                if (userMenu && user.name) {
                    userMenu.innerHTML = `<i class="bi bi-person-circle"></i> ${user.name}`;
                }
            }
            if (adminPanelLink && user.role === 'admin') {
                adminPanelLink.style.display = 'block';
            }
            if (logoutNavItem)
                logoutNavItem.style.display = 'block';
            if (mainLogoutBtn) {
                mainLogoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        }
        else {
            if (loginBtn)
                loginBtn.style.display = 'block';
            if (userDropdown)
                userDropdown.style.display = 'none';
            if (adminPanelLink)
                adminPanelLink.style.display = 'none';
            if (logoutNavItem)
                logoutNavItem.style.display = 'none';
        }
    }
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
        document.body.appendChild(alertDiv);
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
    getCurrentUser() {
        return this.currentUser;
    }
    isAdmin() {
        return this.currentUser !== null && this.currentUser.role === 'admin';
    }
}
export const authManager = new AuthManager();
window.authManager = authManager;
