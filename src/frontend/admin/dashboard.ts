/**
 * 🌸 FloresYa Admin Dashboard Module
 * Handles dashboard data loading, metrics, alerts, and activity feed
 */

import type { DashboardMetrics, AlertData, ActivityData, AdminPanelLogger } from './types';

export class AdminDashboard {
  private logger: AdminPanelLogger;

  constructor(logger: AdminPanelLogger) {
    this.logger = logger;
  }

  /**
   * Load dashboard data and update UI
   */
  public async loadDashboardData(): Promise<void> {
    try {
      this.showLoading();

      // Fetch real metrics from APIs
      const [metricsData, alertsData, activityData] = await Promise.all([
        this.fetchDashboardMetrics(),
        this.fetchDashboardAlerts(),
        this.fetchRecentActivity()
      ]);

      this.updateMetrics(metricsData);
      this.updateAlerts(alertsData);
      this.updateRecentActivity(activityData);

    } catch (error: unknown) {
      this.logger.log('Error loading dashboard data: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      this.showError('Error al cargar datos del dashboard');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Fetch dashboard metrics from API
   */
  private async fetchDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await fetch('/api/admin/dashboard/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();

      return {
        totalProducts: data.totalProducts ?? 0,
        totalOrders: data.totalOrders ?? 0,
        totalUsers: data.totalUsers ?? 0,
        totalRevenue: data.totalRevenue ?? 0
      };
    } catch {
      // Fallback to basic metrics if API fails
      return {
        totalProducts: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalRevenue: 0
      };
    }
  }

  /**
   * Fetch dashboard alerts from API
   */
  private async fetchDashboardAlerts(): Promise<AlertData[]> {
    try {
      const response = await fetch('/api/admin/dashboard/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();

      return (data.alerts as AlertData[]) ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch recent activity from API
   */
  private async fetchRecentActivity(): Promise<ActivityData[]> {
    try {
      const response = await fetch('/api/admin/dashboard/activity');
      if (!response.ok) throw new Error('Failed to fetch activity');
      const data = await response.json();

      return (data.activity as ActivityData[]) ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Update metrics display
   */
  private updateMetrics(metrics: DashboardMetrics): void {
    const totalProductsEl = document.getElementById('totalProducts');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalUsersEl = document.getElementById('totalUsers');
    const totalRevenueEl = document.getElementById('totalRevenue');

    if (totalProductsEl) totalProductsEl.textContent = metrics.totalProducts.toString();
    if (totalOrdersEl) totalOrdersEl.textContent = metrics.totalOrders.toString();
    if (totalUsersEl) totalUsersEl.textContent = metrics.totalUsers.toString();
    if (totalRevenueEl) totalRevenueEl.textContent = `$${metrics.totalRevenue.toFixed(2)}`;
  }

  /**
   * Update alerts display
   */
  private updateAlerts(alerts: AlertData[]): void {
    const alertsContainer = document.getElementById('alertsContainer');
    if (!alertsContainer) return;

    if (alerts.length === 0) {
      alertsContainer.innerHTML = `
        <div class="alert alert-info mb-2">
          <i class="bi bi-info-circle me-2"></i>
          No hay alertas en este momento
        </div>
      `;
      return;
    }

    alertsContainer.innerHTML = alerts.map(alert => `
      <div class="alert alert-${alert.type === 'warning' ? 'warning' : 'info'} mb-2">
        <i class="bi bi-${alert.type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${alert.message}
      </div>
    `).join('');
  }

  /**
   * Update recent activity feed
   */
  private updateRecentActivity(activities: ActivityData[]): void {
    const activityContainer = document.getElementById('recentActivityContainer');
    if (!activityContainer) return;

    if (activities.length === 0) {
      activityContainer.innerHTML = `
        <div class="text-muted text-center py-3">
          <i class="bi bi-clock-history display-6 mb-2"></i>
          <p>No hay actividad reciente</p>
        </div>
      `;
      return;
    }

    activityContainer.innerHTML = activities.map(activity => `
      <div class="d-flex align-items-center mb-2">
        <div class="flex-shrink-0">
          <i class="bi bi-${activity.icon} text-primary"></i>
        </div>
        <div class="flex-grow-1 ms-3">
          <div class="fw-medium">${activity.description}</div>
          <small class="text-muted">${activity.time}</small>
        </div>
      </div>
    `).join('');
  }

  /**
   * Show loading state
   */
  private showLoading(): void {
    const loadingEl = document.getElementById('dashboardLoading');
    const contentEl = document.getElementById('dashboardContent');

    if (loadingEl) loadingEl.style.display = 'block';
    if (contentEl) contentEl.style.display = 'none';
  }

  /**
   * Hide loading state
   */
  private hideLoading(): void {
    const loadingEl = document.getElementById('dashboardLoading');
    const contentEl = document.getElementById('dashboardContent');

    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    const errorEl = document.getElementById('dashboardError');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }
}