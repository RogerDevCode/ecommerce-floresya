/**
 * 🌸 FloresYa Order Routes - TypeScript Enterprise Edition
 * Complete order management API routes
 */

import { Router } from 'express';
import { OrderController, orderValidators } from '../../controllers/OrderController.js';

export function createOrderRoutes(): Router {
  const router = Router();
  const orderController = new OrderController();

  // GET /api/orders - Get all orders with filtering
  router.get('/',
    orderValidators.getOrders,
    orderController.getOrders.bind(orderController)
  );

  // GET /api/orders/:id/status-history - Get order status history
  router.get('/:id/status-history',
    orderValidators.getOrderById,
    orderController.getOrderStatusHistory.bind(orderController)
  );

  // GET /api/orders/:id - Get single order
  router.get('/:id',
    orderValidators.getOrderById,
    orderController.getOrderById.bind(orderController)
  );

  // POST /api/orders - Create new order
  router.post('/',
    orderValidators.createOrder,
    orderController.createOrder.bind(orderController)
  );

  // PUT /api/orders/:id - Update order (admin only)
  router.put('/:id',
    orderValidators.updateOrder,
    orderController.updateOrder.bind(orderController)
  );

  // PATCH /api/orders/:id/status - Update order status (admin only)
  router.patch('/:id/status',
    orderValidators.updateOrderStatus,
    orderController.updateOrderStatus.bind(orderController)
  );

  return router;
}