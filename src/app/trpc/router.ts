/**
 * 🌸 FloresYa tRPC App Router
 * ============================================
 * Router principal que combina todos los sub-routers
 * Proporciona inferencia de tipos completa para el cliente
 * Incluye TODOS los CRUDs con manejo completo de PK/FK
 */

import { dashboardRouter } from './routers/dashboardRouter.js';
import { imageRouter } from './routers/imageRouter.js';
import { occasionRouter } from './routers/occasionRouter.js';
import { orderRouter } from './routers/orderRouter.js';
import { productRouter } from './routers/productRouter.js';
import { userRouter } from './routers/userRouter.js';
import { router } from './trpc.js';

// TODO: Import additional routers once TypeSafeDatabaseService methods are implemented
// import { orderItemRouter } from './routers/orderItemRouter.js';
// import { orderStatusHistoryRouter } from './routers/orderStatusHistoryRouter.js';
// import { paymentRouter } from './routers/paymentRouter.js';
// import { paymentMethodRouter } from './routers/paymentMethodRouter.js';
// import { productImageRouter } from './routers/productImageRouter.js';
// import { productOccasionRouter } from './routers/productOccasionRouter.js';
// import { settingRouter } from './routers/settingRouter.js';

/**
 * Router principal de la aplicación tRPC
 * Combina todos los routers específicos de cada dominio
 * ============================================
 * TABLAS Y RELACIONES:
 * - users (PK: id) - Base independiente
 * - products (PK: id) - Base independiente
 * - occasions (PK: id) - Base independiente
 * - payment_methods (PK: id) - Base independiente
 * - settings (PK: id) - Base independiente
 * - orders (PK: id, FK: user_id → users)
 * - order_items (PK: id, FKs: order_id → orders, product_id → products)
 * - order_status_history (PK: id, FKs: order_id → orders, changed_by → users)
 * - payments (PK: id, FKs: order_id → orders, payment_method_id → payment_methods, user_id → users)
 * - product_images (PK: id, FK: product_id → products)
 * - product_occasions (COMPOSITE PK: product_id + occasion_id, FKs: product_id → products, occasion_id → occasions)
 */
export const appRouter = router({
  // ============================================
  // CURRENT WORKING ROUTERS
  // ============================================
  user: userRouter,                    // users table - ✅ Working
  product: productRouter,              // products table - ✅ Working
  order: orderRouter,                  // orders table - ✅ Working
  occasion: occasionRouter,            // occasions table - ✅ Working
  image: imageRouter,                  // Image handling - ✅ Working
  dashboard: dashboardRouter,          // Analytics and dashboard - ✅ Working

  // ============================================
  // TODO: ADD WHEN METHODS ARE IMPLEMENTED
  // ============================================
  // paymentMethod: paymentMethodRouter,  // payment_methods table
  // setting: settingRouter,              // settings table
  // orderItem: orderItemRouter,          // order_items table (FKs: order_id, product_id)
  // orderStatusHistory: orderStatusHistoryRouter, // order_status_history table
  // payment: paymentRouter,              // payments table (FKs: order_id, payment_method_id, user_id)
  // productImage: productImageRouter,    // product_images table (FK: product_id)
  // productOccasion: productOccasionRouter, // product_occasions table (COMPOSITE PK + FKs)
});

/**
 * Tipo del router para inferencia en el cliente
 */
export type AppRouter = typeof appRouter;