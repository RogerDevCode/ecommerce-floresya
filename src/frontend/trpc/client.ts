/**
 * 🌸 FloresYa tRPC Frontend Client
 * ============================================
 * Cliente tRPC con type safety completo para frontend
 * Elimina problemas de tipos entre frontend y backend
 */

import { createTRPCClient, httpBatchLink } from '@trpc/client';

import type { AppRouter } from '../../app/trpc/router.js';

/**
 * Cliente tRPC configurado para comunicación type-safe con el backend
 */
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/trpc',

      // Headers dinámicos para autenticación
      headers: () => {
        const token = localStorage.getItem('token');

        return {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        };
      },

      // Configuración adicional para manejo de errores
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          credentials: 'include', // Incluir cookies si es necesario
        }).then(response => {
          // Manejar errores HTTP generales
          if (!response.ok && response.status !== 400) {
            // 400 se maneja por tRPC para errores de validación
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response;
        });
      },
    }),
  ],
});

/**
 * Tipo del cliente tRPC para uso en otros archivos
 */
export type TRPCClient = typeof trpc;

/**
 * Hook personalizado para manejo de errores tRPC
 */
export function handleTRPCError(error: unknown): string {
  if (error && typeof error === 'object') {
    // Error de tRPC con datos estructurados
    if ('data' in error && error.data && typeof error.data === 'object') {
      const data = error.data as any;

      // Error de validación Zod
      if (data.zodError) {
        const fieldErrors = data.zodError.fieldErrors;
        if (fieldErrors && typeof fieldErrors === 'object') {
          const firstField = Object.keys(fieldErrors)[0];
          const firstError = fieldErrors[firstField];
          if (Array.isArray(firstError) && firstError.length > 0) {
            return `Error en ${firstField}: ${firstError[0]}`;
          }
        }
        return 'Error de validación en los datos enviados';
      }
    }

    // Error con mensaje
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }

  return 'Ha ocurrido un error inesperado';
}

/**
 * Utilidad para hacer llamadas tRPC con manejo de errores consistente
 */
export async function safeTRPCCall<T>(
  call: () => Promise<T>,
  onError?: (error: string) => void
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await call();
    return { success: true, data };
  } catch (error) {
    const errorMessage = handleTRPCError(error);

    if (onError) {
      onError(errorMessage);
    } else {
      console.error('tRPC Error:', errorMessage);
    }

    return { success: false, error: errorMessage };
  }
}