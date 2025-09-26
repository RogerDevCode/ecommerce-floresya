/**
 * 🌸 FloresYa tRPC Base Configuration
 * ============================================
 * Type-safe API configuration with tRPC
 * Elimina problemas de tipos entre frontend y backend
 */

import { initTRPC, TRPCError } from '@trpc/server';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { typeSafeDatabaseService } from '../../services/TypeSafeDatabaseService.js';
import type { User } from '../../shared/types/index.js';
import { isUserRecord } from '../../shared/utils/typeGuards.js';

// ============================================
// CONTEXT CREATION
// ============================================

/**
 * Context que se pasa a todos los procedures de tRPC
 * Incluye request/response y user autenticado si existe
 */
export interface CreateContextOptions {
  req: Request;
  res: Response;
  user?: User;
}

export async function createTRPCContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<CreateContextOptions> {
  // Extraer token de autorización
  const token = req.headers.authorization?.replace('Bearer ', '');

  let user: User | undefined;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

      if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
        const userId = (decoded as any).userId;
        const userData = await typeSafeDatabaseService.getUserById(userId);

        if (userData && isUserRecord(userData)) {
          user = userData as User;
        }
      }
    } catch (error) {
      // Token inválido - continuar sin user autenticado
      console.warn('Token inválido:', error);
    }
  }

  return {
    req,
    res,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// ============================================
// tRPC INSTANCE & MIDDLEWARES
// ============================================

/**
 * Inicializar tRPC
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof z.ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

/**
 * Router base de tRPC
 */
export const router = t.router;

/**
 * Procedure público (no requiere autenticación)
 */
export const publicProcedure = t.procedure;

/**
 * Middleware para verificar autenticación
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // user is now non-nullable
    },
  });
});

/**
 * Middleware para verificar que el usuario es admin
 */
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
  }

  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Requiere permisos de administrador' });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Procedure protegido (requiere autenticación)
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Procedure de admin (requiere autenticación y rol admin)
 */
export const adminProcedure = t.procedure.use(enforceUserIsAdmin);

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Tipo para extraer el tipo de input de un procedure
 */
export type inferProcedureInput<TProcedure> = TProcedure extends {
  _def: { inputs: infer TInputs };
}
  ? TInputs extends readonly [infer TInput, ...any[]]
    ? TInput
    : never
  : never;

/**
 * Tipo para extraer el tipo de output de un procedure
 */
export type inferProcedureOutput<TProcedure> = TProcedure extends {
  _def: { output: infer TOutput };
}
  ? TOutput
  : never;