/**
 * 🌸 FloresYa tRPC Auth Hooks
 * ============================================
 * Hooks para autenticación con type safety completo
 */

import type { UserSchema } from '../../../shared/types/index.js';
import { trpc, safeTRPCCall } from '../client.js';

/**
 * Hook para login de usuario
 */
export function useLogin() {
  return {
    async login(email: string, password: string) {
      return safeTRPCCall(
        () => trpc.user.login.mutate({ email, password }),
        (error) => {
          console.error('Error de login:', error);
        }
      );
    },
  };
}

/**
 * Hook para registro de usuario
 */
export function useRegister() {
  return {
    async register(userData: {
      email: string;
      password: string;
      full_name?: string;
      phone?: string;
    }) {
      return safeTRPCCall(
        () => trpc.user.register.mutate(userData),
        (error) => {
          console.error('Error de registro:', error);
        }
      );
    },
  };
}

/**
 * Hook para obtener perfil del usuario autenticado
 */
export function useProfile() {
  return {
    async getProfile() {
      return safeTRPCCall(
        () => trpc.user.getProfile.query(),
        (error) => {
          console.error('Error al obtener perfil:', error);
        }
      );
    },
  };
}

/**
 * Utilidad para guardar token y datos de usuario en localStorage
 */
export function saveAuthData(token: string, user: { id: number; email: string; full_name?: string; role: string }) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));

  // Disparar evento personalizado para notificar otros componentes
  window.dispatchEvent(new CustomEvent('authChanged', {
    detail: { authenticated: true, user }
  }));
}

/**
 * Utilidad para limpiar datos de autenticación
 */
export function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Disparar evento personalizado
  window.dispatchEvent(new CustomEvent('authChanged', {
    detail: { authenticated: false, user: null }
  }));
}

/**
 * Utilidad para obtener datos de usuario del localStorage
 */
export function getStoredUser(): { id: number; email: string; full_name?: string; role: string } | null {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

/**
 * Utilidad para verificar si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return localStorage.getItem('token') !== null;
}

/**
 * Utilidad para obtener el token de autenticación
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}