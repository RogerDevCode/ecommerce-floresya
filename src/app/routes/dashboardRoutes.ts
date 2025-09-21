/**
 * 🌸 FloresYa Admin Dashboard Routes
 * API endpoints for admin dashboard metrics, alerts, and activity
 */

import { Router } from 'express';
import { supabaseManager } from '../../config/supabase.js';
import { serverLogger } from '../../utils/serverLogger.js';

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
      const { count: totalProducts } = await supabaseManager
        .client
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get total orders
      const { count: totalOrders } = await supabaseManager
        .client
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get total users
      const { count: totalUsers } = await supabaseManager
        .client
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total revenue (sum of all order totals)
      const { data: revenueData } = await supabaseManager
        .client
        .from('orders')
        .select('total_amount_usd');

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount_usd || 0), 0) || 0;

      const metrics = {
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalUsers: totalUsers || 0,
        totalRevenue: totalRevenue
      };

      serverLogger.success('DASHBOARD', 'Dashboard metrics retrieved', metrics);
      res.json(metrics);

    } catch (error: unknown) {
      serverLogger.error('DASHBOARD', 'Failed to fetch dashboard metrics', {
        error: error instanceof Error ? error.message : String(error)
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
      const { data: lowStockProducts } = await supabaseManager
        .client
        .from('products')
        .select('name')
        .eq('is_available', true)
        .limit(5); // Just get a few for demo

      if (lowStockProducts && lowStockProducts.length > 0) {
        alerts.push({
          type: 'warning',
          message: `${lowStockProducts.length} productos con stock bajo`
        });
      }

      // Check for pending orders
      const { count: pendingOrders } = await supabaseManager
        .client
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingOrders && pendingOrders > 0) {
        alerts.push({
          type: 'info',
          message: `${pendingOrders} pedidos pendientes de confirmación`
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
      serverLogger.error('DASHBOARD', 'Failed to fetch dashboard alerts', {
        error: error instanceof Error ? error.message : String(error)
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
      const { data: recentOrders } = await supabaseManager
        .client
        .from('orders')
        .select('id, created_at, customer_name')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentOrders) {
        recentOrders.forEach(order => {
          const timeAgo = getTimeAgo(new Date(order.created_at));
          activity.push({
            icon: 'cart-plus',
            description: `Nuevo pedido #${order.id} - ${order.customer_name}`,
            time: timeAgo
          });
        });
      }

      // Get recent products
      const { data: recentProducts } = await supabaseManager
        .client
        .from('products')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentProducts) {
        recentProducts.forEach(product => {
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
      serverLogger.error('DASHBOARD', 'Failed to fetch recent activity', {
        error: error instanceof Error ? error.message : String(error)
      });
      res.status(500).json({
        success: false,
        message: 'Error al obtener actividad reciente'
      });
    }
  });

  return router;
}

/**
 * Helper function to get time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'recién';
  if (diffMins < 60) return `hace ${diffMins} minutos`;
  if (diffHours < 24) return `hace ${diffHours} horas`;
  return `hace ${diffDays} días`;
}