/**
 * 🌸 FloresYa Authentication System - tRPC Edition
 * ============================================
 * Type-safe authentication with tRPC replacing legacy REST calls
 * Provides seamless integration with tRPC backend procedures
 */

// Import tRPC hooks and utilities
import {
  useLogin,
  useRegister,
  useProfile,
  saveAuthData,
  clearAuthData,
  getStoredUser,
  isAuthenticated
} from './trpc/index.js';

// Define types for authentication
interface AuthUser {
  id: number;
  email: string;
  full_name?: string;
  role: 'admin' | 'user';
  is_active?: boolean;
  email_verified?: boolean;
}

export class AuthManagerTRPC {
  private currentUser: AuthUser | null = null;

  constructor() {
    void this.init();
  }

  public init(): void {
    this.bindLoginForm();
    this.bindRegisterForm();
    this.checkExistingSession();
    this.updateUIBasedOnAuth();
    this.setupEventListeners();
  }

  private bindLoginForm(): void {
    const loginForm = document.getElementById('loginForm') as HTMLFormElement;
    if (loginForm) {
      loginForm.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        void this.handleLogin();
      });
    }

    // Logout buttons
    const logoutBtns = ['logoutBtn', 'mainLogoutBtn', 'mainLogoutBtnMobile'];
    logoutBtns.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', (e: Event) => {
          e.preventDefault();
          void this.handleLogout();
        });
      }
    });
  }

  private bindRegisterForm(): void {
    const registerForm = document.getElementById('registerForm') as HTMLFormElement;
    if (registerForm) {
      registerForm.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        void this.handleRegister();
      });
    }
  }

  private async handleLogin(): Promise<void> {
    const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
    const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');

    if (!emailInput || !passwordInput) return;

    // Set loading state
    if (submitBtn instanceof HTMLButtonElement) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i>Iniciando...';
    }

    try {
      const credentials = {
        email: emailInput.value.trim(),
        password: passwordInput.value
      };

      console.log('🔐 [tRPC Auth] Attempting login with:', credentials.email);

      // Use tRPC login procedure with type safety
      const { login } = useLogin();
      const result = await login(credentials.email, credentials.password);

      if (result.success && result.data.data) {
        const { token, user } = result.data.data;

        // Store authentication data
        saveAuthData(token, user);
        this.setUserSession(user);

        // Close login modal
        this.closeModal('loginModal');

        // Redirect based on user role
        this.redirectBasedOnRole(user.role);

        this.showAlert('¡Bienvenido! Has iniciado sesión correctamente.', 'success');

        console.log('✅ [tRPC Auth] Login successful for:', user.email);
      } else {
        const errorMessage = !result.success && 'error' in result ? result.error || 'Error desconocido' : 'Error desconocido';
        this.showAlert(errorMessage, 'danger');
        console.error('❌ [tRPC Auth] Login failed:', errorMessage);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      this.showAlert(errorMessage, 'danger');
      console.error('❌ [tRPC Auth] Login error:', error);
    } finally {
      // Reset button state
      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Iniciar Sesión';
      }
    }
  }

  private async handleRegister(): Promise<void> {
    const firstNameInput = document.getElementById('firstName') as HTMLInputElement;
    const lastNameInput = document.getElementById('lastName') as HTMLInputElement;
    const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
    const phoneInput = document.getElementById('phone') as HTMLInputElement;
    const passwordInput = document.getElementById('registerPassword') as HTMLInputElement;
    const submitBtn = document.querySelector('#registerForm button[type="submit"]');

    if (!firstNameInput || !lastNameInput || !emailInput || !passwordInput) return;

    // Set loading state
    if (submitBtn instanceof HTMLButtonElement) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i>Creando cuenta...';
    }

    try {
      const userData = {
        email: emailInput.value.trim(),
        password: passwordInput.value,
        full_name: `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`,
        phone: phoneInput?.value?.trim() || undefined
      };

      console.log('📝 [tRPC Auth] Attempting registration for:', userData.email);

      // Use tRPC register procedure with type safety
      const { register } = useRegister();
      const result = await register(userData);

      if (result.success && result.data.data) {
        const { token, user } = result.data.data;

        // Store authentication data
        saveAuthData(token, user);
        this.setUserSession(user);

        // Close register modal
        this.closeModal('registerModal');

        // Redirect based on user role
        this.redirectBasedOnRole(user.role);

        this.showAlert('¡Cuenta creada exitosamente! Bienvenido a FloresYa.', 'success');

        console.log('✅ [tRPC Auth] Registration successful for:', user.email);
      } else {
        const errorMessage = !result.success && 'error' in result ? result.error || 'Error desconocido' : 'Error desconocido';
        this.showAlert(errorMessage, 'danger');
        console.error('❌ [tRPC Auth] Registration failed:', errorMessage);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta';
      this.showAlert(errorMessage, 'danger');
      console.error('❌ [tRPC Auth] Registration error:', error);
    } finally {
      // Reset button state
      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Crear Cuenta';
      }
    }
  }

  private async handleLogout(): Promise<void> {
    try {
      console.log('🚪 [tRPC Auth] Logging out user');

      // Clear authentication data
      clearAuthData();
      this.currentUser = null;

      // Update UI
      this.updateUIBasedOnAuth();

      // Redirect to home if on admin page
      if (window.location.pathname.includes('admin')) {
        window.location.href = '/';
      }

      this.showAlert('Has cerrado sesión correctamente.', 'success');
      console.log('✅ [tRPC Auth] Logout successful');

    } catch (error: unknown) {
      console.error('❌ [tRPC Auth] Logout error:', error);
      this.showAlert('Error al cerrar sesión', 'danger');
    }
  }

  private checkExistingSession(): void {
    try {
      // Check if user is authenticated
      if (isAuthenticated()) {
        const userData = getStoredUser();

        if (userData) {
          // Cast the role to the correct type since getStoredUser returns string
          const typedUserData = {
            ...userData,
            role: userData.role === 'admin' ? 'admin' : 'user'
          } as AuthUser;
          this.setUserSession(typedUserData);
          console.log('🔄 [tRPC Auth] Restored session for:', userData.email);

          // Optionally verify session with server
          void this.verifySessionWithServer();
        }
      }
    } catch (error) {
      console.warn('⚠️ [tRPC Auth] Error checking existing session:', error);
      clearAuthData();
    }
  }

  private async verifySessionWithServer(): Promise<void> {
    try {
      const { getProfile } = useProfile();
      const result = await getProfile();

      if (result.success && result.data.data) {
        // Update stored user data with fresh data from server
        this.setUserSession(result.data.data);
        console.log('✅ [tRPC Auth] Session verified with server');
      } else {
        // Session invalid - clear data
        console.warn('⚠️ [tRPC Auth] Session invalid - clearing authentication');
        clearAuthData();
        this.currentUser = null;
        this.updateUIBasedOnAuth();
      }
    } catch (error) {
      console.warn('⚠️ [tRPC Auth] Failed to verify session:', error);
    }
  }

  private setUserSession(user: AuthUser): void {
    this.currentUser = user;
    this.updateUIBasedOnAuth();

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('authChanged', {
      detail: { authenticated: true, user }
    }));
  }

  private updateUIBasedOnAuth(): void {
    const isLoggedIn = this.currentUser !== null;
    const isAdmin = this.currentUser?.role === 'admin';

    // Update login/logout buttons
    this.toggleElement('loginBtn', !isLoggedIn);
    this.toggleElement('loginBtnMobile', !isLoggedIn);
    this.toggleElement('userDropdown', isLoggedIn);
    this.toggleElement('logoutNavItem', isLoggedIn);
    this.toggleElement('logoutNavItemMobile', isLoggedIn);

    // Update admin panel links
    this.toggleElement('adminPanelLink', isAdmin);
    this.toggleElement('adminPanelLinkMobile', isAdmin);
    this.toggleElement('adminPanel', isAdmin);

    // Update guest banner in cart
    this.toggleElement('guestBanner', !isLoggedIn);

    // Update user profile info
    if (this.currentUser) {
      const profileBtn = document.getElementById('viewProfile');
      if (profileBtn) {
        profileBtn.textContent = this.currentUser.full_name || this.currentUser.email;
      }
    }
  }

  private setupEventListeners(): void {
    // Listen for auth changes from other components
    window.addEventListener('authChanged', (event: Event) => {
      const customEvent = event as CustomEvent;
      const { authenticated, user } = customEvent.detail;

      if (authenticated && user) {
        this.setUserSession(user);
      } else {
        this.currentUser = null;
        this.updateUIBasedOnAuth();
      }
    });
  }

  private redirectBasedOnRole(role: 'admin' | 'user'): void {
    if (role === 'admin') {
      // Delay redirect to allow UI updates
      setTimeout(() => {
        window.location.href = '/pages/admin.html';
      }, 1000);
    }
    // Regular users stay on current page
  }

  private closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  private toggleElement(elementId: string, show: boolean): void {
    const element = document.getElementById(elementId);
    if (element) {
      if (show) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    }
  }

  private showAlert(message: string, type: 'success' | 'danger' | 'warning' = 'success'): void {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `fixed top-4 right-4 max-w-sm p-4 rounded-lg shadow-lg z-[9999] transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'danger' ? 'bg-red-500 text-white' :
      'bg-yellow-500 text-black'
    }`;

    alert.innerHTML = `
      <div class="flex items-center">
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'danger' ? 'x-circle' : 'alert-triangle'}" class="h-5 w-5 mr-2"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(alert);

    // Initialize Lucide icons in the alert
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }

    // Show with animation
    setTimeout(() => {
      alert.style.transform = 'translateX(0)';
      alert.style.opacity = '1';
    }, 10);

    // Hide after delay
    setTimeout(() => {
      alert.style.transform = 'translateX(100%)';
      alert.style.opacity = '0';
      setTimeout(() => {
        if (alert.parentNode) {
          alert.parentNode.removeChild(alert);
        }
      }, 300);
    }, 4000);
  }

  // Public API methods
  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }
}

// Create and initialize auth manager
const authManagerTRPC = new AuthManagerTRPC();

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).authManagerTRPC = authManagerTRPC;
}

// Default export
export default authManagerTRPC;

console.log('🔐 [tRPC Auth] Authentication system initialized with type-safe tRPC integration');