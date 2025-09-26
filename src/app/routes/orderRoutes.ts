/**
 * 🌸 FloresYa Order Routes - TypeScript Enterprise Edition
 * Complete order management API routes
 */

import { Router } from 'express';

import { OrderController } from '../../controllers/OrderController.js';

export function createOrderRoutes(): Router {
  const router = Router();
  const orderController = new OrderController();

  // GET /api/orders - Get all orders with filtering
  router.get('/',
    orderController.getOrders.bind(orderController)
  );

  // GET /api/orders/:id/status-history - Get order status history
  router.get('/:id/status-history',
    orderController.getOrderStatusHistory.bind(orderController)
  );

  // GET /api/orders/:id - Get single order
  router.get('/:id',
    orderController.getOrderById.bind(orderController)
  );

  // POST /api/orders - Create new order
  router.post('/',
    orderController.createOrder.bind(orderController)
  );

  // PUT /api/orders/:id - Update order (admin only)
  router.put('/:id',
    orderController.updateOrder.bind(orderController)
  );

  // PATCH /api/orders/:id/status - Update order status (admin only)
  router.patch('/:id/status',
    orderController.updateOrderStatus.bind(orderController)
  );

  return router;
}