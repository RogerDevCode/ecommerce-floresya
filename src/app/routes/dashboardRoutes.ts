/**
 * 🌸 FloresYa Admin Dashboard Routes
 * API endpoints for admin dashboard metrics, alerts, and activity
 */

import { Router } from 'express';
import { typeSafeDatabaseService } from '../../services/TypeSafeDatabaseService.js';
import { serverLogger } from '../../utils/serverLogger.js';
import { getTimeAgo } from '../../shared/utils/index.js';

export function createDashboardRoutes(): Router {
  const router = Router();

  /**
   * @swagger
   * /api/admin/dashboard/metrics:
   *   get:
   *     summary: Get dashboard metrics
   *     description: Retrieve key metrics for the admin dashboard
   *     tags: [Admin, Dashboard]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dashboard metrics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalProducts:
   *                   type: integer
   *                   example: 150
   *                 totalOrders:
   *                   type: integer
   *                   example: 45
   *                 totalUsers:
   *                   type: integer
   *                   example: 23
   *                 totalRevenue:
   *                   type: number
   *                   format: float
   *                   example: 1250.50
   */
  router.get('/metrics', async (req, res) => {
    try {
      serverLogger.info('DASHBOARD', 'Fetching dashboard metrics');

      // Get total products
      const totalProducts = await typeSafeDatabaseService.getTableCount('products');

      // Get total orders
      const totalOrders = await typeSafeDatabaseService.getTableCount('orders');

      // Get total users
      const totalUsers = await typeSafeDatabaseService.getTableCount('users');

      // Get total revenue (sum of all order totals)
      const orders = await typeSafeDatabaseService.getOrders();
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount_usd || 0), 0);

      const metrics = {
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalUsers: totalUsers || 0,
        totalRevenue: totalRevenue
      };

      serverLogger.success('DASHBOARD', 'Dashboard metrics retrieved', metrics);
      res.json(metrics);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      serverLogger.error('DASHBOARD', 'Failed to fetch dashboard metrics', {
        error: errorMessage || 'Unknown error'
      });
      res.status(500).json({
        success: false,
        message: 'Error al obtener métricas del dashboard'
      });
    }
  });

  /**
   * @swagger
   * /api/admin/dashboard/alerts:
   *   get:
   *     summary: Get dashboard alerts
   *     description: Retrieve active alerts for the admin dashboard
   *     tags: [Admin, Dashboard]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dashboard alerts retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 alerts:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       type:
   *                         type: string
   *                         enum: [info, warning, danger]
   *                         example: "warning"
   *                       message:
   *                         type: string
   *                         example: "Stock bajo en 3 productos"
   */
  router.get('/alerts', async (req, res) => {
    try {
      serverLogger.info('DASHBOARD', 'Fetching dashboard alerts');

      const alerts = [];

      // Check for low stock products
      const lowStockProducts = await typeSafeDatabaseService.getActiveProducts();

      if (lowStockProducts && lowStockProducts.length > 0) {
        alerts.push({
          type: 'warning',
          message: `${lowStockProducts.length} productos con stock bajo`
        });
      }

      // Check for pending orders
      const pendingOrders = await typeSafeDatabaseService.getOrdersByStatus('pending');

      if (pendingOrders && pendingOrders.length > 0) {
        alerts.push({
          type: 'info',
          message: `${pendingOrders.length} pedidos pendientes de confirmación`
        });
      }

      // Default alert if none
      if (alerts.length === 0) {
        alerts.push({
          type: 'info',
          message: 'Sistema funcionando correctamente'
        });
      }

      serverLogger.success('DASHBOARD', 'Dashboard alerts retrieved', { count: alerts.length });
      res.json({ alerts });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      serverLogger.error('DASHBOARD', 'Failed to fetch dashboard alerts', {
        error: errorMessage || 'Unknown error'
      });
      res.status(500).json({
        success: false,
        message: 'Error al obtener alertas del dashboard'
      });
    }
  });

  /**
   * @swagger
   * /api/admin/dashboard/activity:
   *   get:
   *     summary: Get recent activity
   *     description: Retrieve recent activity for the admin dashboard
   *     tags: [Admin, Dashboard]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Recent activity retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 activity:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       icon:
   *                         type: string
   *                         example: "cart-plus"
   *                       description:
   *                         type: string
   *                         example: "Nuevo pedido #123"
   *                       time:
   *                         type: string
   *                         example: "hace 5 minutos"
   */
  router.get('/activity', async (req, res) => {
    try {
      serverLogger.info('DASHBOARD', 'Fetching recent activity');

      const activity = [];

      // Get recent orders
      const recentOrders = await typeSafeDatabaseService.getRecentOrders(3);

      if (recentOrders) {
        recentOrders.forEach((order) => {
          const timeAgo = getTimeAgo(new Date(order.created_at));
          activity.push({
            icon: 'cart-plus',
            description: `Nuevo pedido #${order.id} - ${order.customer_name}`,
            time: timeAgo
          });
        });
      }

      // Get recent products
      const recentProducts = await typeSafeDatabaseService.getRecentProducts(2);

      if (recentProducts) {
        recentProducts.forEach((product) => {
          const timeAgo = getTimeAgo(new Date(product.created_at));
          activity.push({
            icon: 'box-seam',
            description: `Producto agregado: ${product.name}`,
            time: timeAgo
          });
        });
      }

      // Default activity if none
      if (activity.length === 0) {
        activity.push({
          icon: 'info-circle',
          description: 'Sistema inicializado correctamente',
          time: 'recién'
        });
      }

      // Sort by time (most recent first)
      activity.sort((a, b) => {
        if (a.time === 'recién') return -1;
        if (b.time === 'recién') return 1;
        return 0; // Keep order for now
      });

      serverLogger.success('DASHBOARD', 'Recent activity retrieved', { count: activity.length });
      res.json({ activity });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      serverLogger.error('DASHBOARD', 'Failed to fetch recent activity', {
        error: errorMessage || 'Unknown error'
      });
      res.status(500).json({
        success: false,
        message: 'Error al obtener actividad reciente'
      });
    }
  });

  return router;
}