/**
 * 🌸 FloresYa tRPC Occasion Router
 * ============================================
 * Router para operaciones relacionadas con ocasiones
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { typeSafeDatabaseService } from '../../../services/TypeSafeDatabaseService.js';
import { OccasionSchema } from '../../../shared/types/index.js';
import { router, publicProcedure } from '../trpc.js';

export const occasionRouter = router({
  /**
   * Listar todas las ocasiones - Público
   */
  list: publicProcedure
    .output(
      z.object({
        success: z.boolean(),
        data: z.array(OccasionSchema).optional(),
        message: z.string().optional(),
      })
    )
    .query(async () => {
      try {
        const occasions = await typeSafeDatabaseService.getOccasions();
        return {
          success: true,
          data: occasions,
          message: 'Ocasiones obtenidas exitosamente',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener ocasiones',
        });
      }
    }),
});