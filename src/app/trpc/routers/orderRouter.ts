/**
 * 🌸 FloresYa tRPC Order Router
 * ============================================
 * Router para operaciones relacionadas con órdenes
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { typeSafeDatabaseService } from '../../../services/TypeSafeDatabaseService.js';
import { OrderStatusSchema } from '../../../shared/types/index.js';
import { router, protectedProcedure, adminProcedure } from '../trpc.js';

export const orderRouter = router({
  /**
   * Listar órdenes del usuario autenticado
   */
  getUserOrders: protectedProcedure
    .output(
      z.object({
        success: z.boolean(),
        data: z.array(z.any()).optional(),
        message: z.string().optional(),
      })
    )
    .query(async ({ ctx }) => {
      try {
        // Get user-specific orders by filtering
        // TODO: Implement getUserOrdersByUserId method for better performance
        const allOrders = await typeSafeDatabaseService.getOrders();
        const orders = allOrders.filter(order => order.user_id === ctx.user.id);
        return {
          success: true,
          data: orders,
          message: 'Órdenes obtenidas exitosamente',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener órdenes',
        });
      }
    }),

  /**
   * Obtener órdenes por status - Solo admin
   */
  getByStatus: adminProcedure
    .input(z.object({ status: OrderStatusSchema }))
    .output(
      z.object({
        success: z.boolean(),
        data: z.array(z.any()).optional(),
        message: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const orders = await typeSafeDatabaseService.getOrdersByStatus(input.status);
        return {
          success: true,
          data: orders,
          message: 'Órdenes obtenidas exitosamente',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener órdenes',
        });
      }
    }),
});