/**
 * 🌸 FloresYa tRPC Occasions Hooks
 * ============================================
 * Hooks para gestión de ocasiones con type safety completo
 */

import { trpc, safeTRPCCall } from '../client.js';

/**
 * Hook para gestión de ocasiones
 */
export function useOccasions() {
  return {
    async getOccasions() {
      return safeTRPCCall(
        () => trpc.occasion.list.query(),
        (error) => {
          console.error('Error al obtener ocasiones:', error);
        }
      );
    },
  };
}