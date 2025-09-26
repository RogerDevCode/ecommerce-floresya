/**
 * 🌸 FloresYa tRPC Orders Hooks
 * ============================================
 * Hooks para gestión de órdenes con type safety completo
 */

import type { OrderStatus } from '../../../shared/types/index.js';
import { trpc, safeTRPCCall } from '../client.js';

/**
 * Hook para gestión de órdenes
 */
export function useOrders() {
  return {
    async getUserOrders() {
      return safeTRPCCall(
        () => trpc.order.getUserOrders.query(),
        (error) => {
          console.error('Error al obtener órdenes del usuario:', error);
        }
      );
    },

    async getOrdersByStatus(status: OrderStatus) {
      return safeTRPCCall(
        () => trpc.order.getByStatus.query({ status }),
        (error) => {
          console.error('Error al obtener órdenes por status:', error);
        }
      );
    },
  };
}