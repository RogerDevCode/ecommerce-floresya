/**
 * 🌸 FloresYa tRPC Dashboard Router
 * ============================================
 * Router para datos del dashboard de administración
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { typeSafeDatabaseService } from '../../../services/TypeSafeDatabaseService.js';
import { router, adminProcedure } from '../trpc.js';

export const dashboardRouter = router({
  /**
   * Obtener estadísticas del dashboard
   */
  getStats: adminProcedure
    .output(
      z.object({
        success: z.boolean(),
        data: z.object({
          userCount: z.number(),
          productCount: z.number(),
          orderCount: z.number(),
          recentOrders: z.array(z.any()),
        }).optional(),
        message: z.string().optional(),
      })
    )
    .query(async () => {
      try {
        // TODO: Implementar métodos de conteo específicos
        const [users, products, orders, recentOrders] = await Promise.all([
          typeSafeDatabaseService.getUsers(),
          typeSafeDatabaseService.getProducts(),
          typeSafeDatabaseService.getOrders(),
          typeSafeDatabaseService.getRecentOrders(5),
        ]);

        const userCount = users.length;
        const productCount = products.length;
        const orderCount = orders.length;

        return {
          success: true,
          data: {
            userCount,
            productCount,
            orderCount,
            recentOrders,
          },
          message: 'Estadísticas obtenidas exitosamente',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener estadísticas',
        });
      }
    }),
});