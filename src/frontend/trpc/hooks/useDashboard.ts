/**
 * 🌸 FloresYa tRPC Dashboard Hooks
 * ============================================
 * Hooks para dashboard de administración con type safety completo
 */

import { trpc, safeTRPCCall } from '../client.js';

/**
 * Hook para estadísticas del dashboard (solo admin)
 */
export function useDashboard() {
  return {
    async getDashboardStats() {
      return safeTRPCCall(
        () => trpc.dashboard.getStats.query(),
        (error) => {
          console.error('Error al obtener estadísticas del dashboard:', error);
        }
      );
    },
  };
}