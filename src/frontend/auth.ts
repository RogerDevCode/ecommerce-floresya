/**
 * 🌸 FloresYa Authentication System - TypeScript Edition
 * Basic authentication handling for login/logout with full type safety
 */


// Define types for authentication
interface AuthUser {
  id: number;
  email: string;
  name?: string;
  role: 'admin' | 'user';
}


interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  message?: string;
}

import type { WindowWithBootstrap } from '../types/globals.js';

// Extend Window interface
declare global {
  interface Window {
    authManager?: AuthManager;
    floresyaApp?: import('./main.js').FloresYaApp;
  }
}

export class AuthManager {
  private currentUser: AuthUser | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.bindLoginForm();
    this.checkExistingSession();
    this.updateUIBasedOnAuth();
  }

  private bindLoginForm(): void {
    const loginForm = document.getElementById('loginForm') as HTMLFormElement;
    if (loginForm) {
      loginForm.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        void this.handleLogin();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  private async handleLogin(): Promise<void> {
    const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
    const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;

    const email = emailInput?.value;
    const password = passwordInput?.value;

    if (!email || !password) {
      this.showAlert('Por favor ingresa email y contraseña', 'warning');
      return;
    }

    try {
      // Show loading state
      const submitBtn = document.querySelector('#loginForm button[type="submit"]');
      if (!(submitBtn instanceof HTMLButtonElement)) return;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Cargando...';
      }

      // Simulate API call (replace with real API call)
      const response: AuthResponse = await this.authenticateUser({ email, password });

      if (response.success && response.user) {
        // Store user session
        this.setUserSession(response.user);

        // Close login modal
        const loginModal = document.getElementById('loginModal');
        if (loginModal && (window as WindowWithBootstrap).bootstrap?.Modal?.getInstance) {
          const modal = (window as WindowWithBootstrap).bootstrap.Modal.getInstance(loginModal);
          if (modal) {
            modal.hide();
          }
        }

        // Redirect based on user role
        this.redirectBasedOnRole(response.user.role);

        this.showAlert('¡Bienvenido! Has iniciado sesión correctamente.', 'success');
      } else {
        this.showAlert(response.message ?? 'Credenciales incorrectas', 'danger');
      }

    } catch (error: unknown) {
      console.error('Login error:', error);
      this.showAlert('Error al iniciar sesión. Inténtalo de nuevo.', 'danger');
    } finally {
      // Reset button state
      const submitBtn = document.querySelector('#loginForm button[type="submit"]');
      if (!(submitBtn instanceof HTMLButtonElement)) return;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Iniciar Sesión';
      }
    }
  }

  private async authenticateUser(credentials: LoginCredentials): Promise<AuthResponse> {
    // Mock authentication - replace with real API call
    const mockUsers: Array<{ email: string; password: string; user: AuthUser }> = [
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

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const foundUser = mockUsers.find(u => u.email === credentials.email && u.password === credentials.password);

    if (foundUser) {
      return {
        success: true,
        user: foundUser.user
      };
    } else {
      return {
        success: false,
        message: 'Email o contraseña incorrectos'
      };
    }
  }

  private setUserSession(user: AuthUser): void {
    this.currentUser = user;
    localStorage.setItem('floresya_user', JSON.stringify(user));
    localStorage.setItem('floresya_session', Date.now().toString());
  }

  private getUserSession(): AuthUser | null {
    const userData = localStorage.getItem('floresya_user');
    if (userData) {
      try {
        return JSON.parse(userData) as AuthUser;
      } catch (_e) {
        return null;
      }
    }
    return null;
  }

  private checkExistingSession(): void {
    const user = this.getUserSession();
    if (user) {
      this.currentUser = user;

      // Check if session is still valid (24 hours)
      const sessionTime = localStorage.getItem('floresya_session');
      if (sessionTime) {
        const sessionAge = Date.now() - parseInt(sessionTime);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (sessionAge > maxAge) {
          // Session expired
          this.logout();
          
        }
      }
    }
  }

  /**
   * SECURE LOGOUT - Complete session cleanup
   */
  private logout(): void {
    // Starting secure logout process

    try {
      // 1. Clear current user state
      this.currentUser = null;

      // 2. Clear ALL session data from localStorage
      this.clearAllSessionData();

      // 3. Clear any cached data
      this.clearCache();

      // Session fully closed - All data cleared

      // 4. Redirect to home page
      window.location.href = '/';

    } catch (error: unknown) {
      console.error('[❌ AUTH] Error durante logout:', error);
      // Even if there's an error, redirect to ensure security
      window.location.href = '/';
    }
  }

  /**
   * Clear ALL session data from localStorage
   */
  private clearAllSessionData(): void {
    try {
      // Clear specific session keys
      localStorage.removeItem('floresya_user');
      localStorage.removeItem('floresya_session');
      localStorage.removeItem('floresya_token');

      // Clear any other FloresYa related data
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('floresya_')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        // Removed session key: ${key}
      });

      // Cleared ${keysToRemove.length + 3} localStorage items

    } catch (error: unknown) {
      console.error('[❌ AUTH] Error limpiando localStorage:', error);
      // Try to clear everything as fallback
      try {
        localStorage.clear();
        console.warn('localStorage completely cleared as fallback');
      } catch (fallbackError) {
        console.error('[❌ AUTH] Error en fallback de limpieza:', fallbackError);
      }
    }
  }

  /**
   * Clear any cached data
   */
  private clearCache(): void {
    try {
      // Clear sessionStorage if used
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
        // sessionStorage cleared
      }

      // Clear any global variables or cached state
      if (window.floresyaApp) {
        // Global application state reset
      }

    } catch (error: unknown) {
      console.error('[❌ AUTH] Error limpiando cache:', error);
    }
  }

  private redirectBasedOnRole(role: 'admin' | 'user'): void {
    if (role === 'admin') {
      // Redirect admin to admin panel
      window.location.href = '/pages/admin.html';
    } else {
      // Regular users stay on the main page
      // The page will update UI based on authentication status
      window.location.reload();
    }
  }

  private updateUIBasedOnAuth(): void {
    const user = this.getUserSession();

    // Update login/logout buttons
    const loginBtn = document.getElementById('loginBtn');
    const userDropdown = document.getElementById('userDropdown');
    const adminPanelLink = document.getElementById('adminPanelLink');
    const logoutNavItem = document.getElementById('logoutNavItem');
    const mainLogoutBtn = document.getElementById('mainLogoutBtn');

    if (user) {
      // User is logged in
      if (loginBtn) {loginBtn.style.display = 'none';}
      if (userDropdown) {
        userDropdown.style.display = 'block';
        // Update user name in dropdown if available
        const userMenu = document.getElementById('userMenu');
        if (userMenu && user.name) {
          userMenu.innerHTML = `<i class="bi bi-person-circle"></i> ${user.name}`;
        }
      }

      // Show admin panel link only for admin users
      if (adminPanelLink && user.role === 'admin') {
        adminPanelLink.style.display = 'block';
      }

      // Show main logout button for all logged-in users
      if (logoutNavItem) {logoutNavItem.style.display = 'block';}
      if (mainLogoutBtn) {
        mainLogoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.logout();
        });
      }

    } else {
      // User is not logged in
      if (loginBtn) {loginBtn.style.display = 'block';}
      if (userDropdown) {userDropdown.style.display = 'none';}
      if (adminPanelLink) {adminPanelLink.style.display = 'none';}
      if (logoutNavItem) {logoutNavItem.style.display = 'none';}
    }
  }

  private showAlert(message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info'): void {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Add to page
    document.body.appendChild(alertDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public isAdmin(): boolean {
    return this.currentUser !== null && this.currentUser.role === 'admin';
  }
}

// Create and export global instance
export const authManager = new AuthManager();

// Make available globally
window.authManager = authManager;