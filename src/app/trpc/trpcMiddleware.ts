/**
 * 🌸 FloresYa tRPC Express Middleware
 * ============================================
 * Integración de tRPC con Express.js
 * Proporciona endpoint /trpc para todas las operaciones tRPC
 */

import * as trpcExpress from '@trpc/server/adapters/express';
import type { Application } from 'express';

import { appRouter } from './router.js';
import { createTRPCContext } from './trpc.js';

/**
 * Configura el middleware tRPC en la aplicación Express
 */
export function setupTRPCMiddleware(app: Application): void {
  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: createTRPCContext,
      onError: ({ path, error }) => {
        console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, error);
      },
    })
  );

  console.log('✅ tRPC middleware configurado en /trpc');
}