import { Router } from 'express';
import { OrderController, orderValidators } from '../../controllers/OrderController.js';
export function createOrderRoutes() {
    const router = Router();
    const orderController = new OrderController();
    router.get('/', orderValidators.getOrders, orderController.getOrders.bind(orderController));
    router.get('/:id/status-history', orderValidators.getOrderById, orderController.getOrderStatusHistory.bind(orderController));
    router.get('/:id', orderValidators.getOrderById, orderController.getOrderById.bind(orderController));
    router.post('/', orderValidators.createOrder, orderController.createOrder.bind(orderController));
    router.put('/:id', orderValidators.updateOrder, orderController.updateOrder.bind(orderController));
    router.patch('/:id/status', orderValidators.updateOrderStatus, orderController.updateOrderStatus.bind(orderController));
    return router;
}
