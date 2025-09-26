/**
 * 🌸 FloresYa tRPC Image Router
 * ============================================
 * Router para operaciones relacionadas con imágenes
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { router, adminProcedure } from '../trpc.js';

export const imageRouter = router({
  /**
   * Placeholder para operaciones de imagen
   * TODO: Implementar subida y gestión de imágenes
   */
  getImagesByProduct: adminProcedure
    .input(z.object({ productId: z.number().int().positive() }))
    .output(
      z.object({
        success: z.boolean(),
        data: z.array(z.any()).optional(),
        message: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Placeholder implementation
      return {
        success: true,
        data: [],
        message: 'Funcionalidad pendiente de implementación',
      };
    }),
});