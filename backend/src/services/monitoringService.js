const logger = require('../utils/logger');
const { getSupabaseHealth } = require('./supabaseClient');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        pending: 0
      },
      system: {
        memory: { used: 0, free: 0, total: 0 },
        cpu: { usage: 0, load: [] },
        uptime: 0
      },
      database: {
        connectionPool: { active: 0, idle: 0, total: 0 },
        queryTimes: [],
        errors: 0
      },
      api: {
        endpoints: new Map(),
        slowQueries: [],
        errorRates: new Map()
      }
    };

    this.alerts = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.metricsHistory = [];
    this.maxHistorySize = 1000;

    this.thresholds = {
      memory: { warning: 80, critical: 95 },
      cpu: { warning: 70, critical: 90 },
      responseTime: { warning: 1000, critical: 3000 },
      errorRate: { warning: 5, critical: 15 }
    };
  }

  startMonitoring(intervalMs = 30000) {
    if (this.isMonitoring) {
      logger.warn('MONITORING', 'Monitoring already started');
      return;
    }

    this.isMonitoring = true;
    logger.info('MONITORING', 'Starting production monitoring', { 
      interval: intervalMs,
      pid: process.pid,
      version: process.version
    });

    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      this.checkThresholds();
      this.pruneHistory();
    }, intervalMs);

    this.collectMetrics();
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('MONITORING', 'Monitoring stopped');
  }

  async collectMetrics() {
    const timer = logger.startTimer('collect-metrics');

    try {
      await this.collectSystemMetrics();
      await this.collectDatabaseMetrics();
      this.collectApiMetrics();
      
      const snapshot = this.createMetricsSnapshot();
      this.metricsHistory.push(snapshot);

      timer.end('MONITORING');
      
      if (this.metricsHistory.length % 10 === 0) {
        logger.debug('MONITORING', 'Metrics collected', {
          historySize: this.metricsHistory.length,
          memory: `${snapshot.system.memory.usedPercent.toFixed(1)}%`,
          requests: snapshot.requests.total,
          errors: snapshot.requests.errors
        });
      }

    } catch (error) {
      timer.end('MONITORING');
      logger.error('MONITORING', 'Error collecting metrics', { error: error.message }, error);
    }
  }

  async collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    
    this.metrics.system.memory = {
      used: memUsage.rss,
      free: freeMemory,
      total: totalMemory,
      usedPercent: (memUsage.rss / totalMemory) * 100,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    };

    this.metrics.system.cpu = {
      load: os.loadavg(),
      usage: this.calculateCpuUsage()
    };

    this.metrics.system.uptime = process.uptime();
  }

  async collectDatabaseMetrics() {
    try {
      const health = await getSupabaseHealth();
      
      this.metrics.database = {
        status: health.status,
        responseTime: health.metrics.responseTime,
        services: health.services,
        lastCheck: health.timestamp,
        errors: health.error ? this.metrics.database.errors + 1 : this.metrics.database.errors
      };

    } catch (error) {
      this.metrics.database.errors++;
      logger.error('MONITORING', 'Database metrics collection failed', { error: error.message });
    }
  }

  collectApiMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    this.metrics.api.endpoints.forEach((stats, endpoint) => {
      stats.recentRequests = stats.requests.filter(req => req.timestamp > oneMinuteAgo);
      stats.errorRate = stats.recentRequests.length > 0 ? 
        (stats.recentRequests.filter(req => req.error).length / stats.recentRequests.length) * 100 : 0;
      stats.avgResponseTime = stats.recentRequests.length > 0 ?
        stats.recentRequests.reduce((sum, req) => sum + req.duration, 0) / stats.recentRequests.length : 0;
    });
  }

  calculateCpuUsage() {
    const stats = process.cpuUsage(this.lastCpuUsage);
    this.lastCpuUsage = process.cpuUsage();
    
    const totalTime = stats.user + stats.system;
    const usage = (totalTime / 1000000) / 1 * 100;
    
    return Math.min(100, Math.max(0, usage));
  }

  createMetricsSnapshot() {
    return {
      timestamp: new Date().toISOString(),
      requests: { ...this.metrics.requests },
      system: { ...this.metrics.system },
      database: { ...this.metrics.database },
      api: {
        totalEndpoints: this.metrics.api.endpoints.size,
        slowQueries: this.metrics.api.slowQueries.length,
        topEndpoints: this.getTopEndpoints(5)
      }
    };
  }

  getTopEndpoints(limit = 5) {
    return Array.from(this.metrics.api.endpoints.entries())
      .sort((a, b) => b[1].recentRequests.length - a[1].recentRequests.length)
      .slice(0, limit)
      .map(([endpoint, stats]) => ({
        endpoint,
        requests: stats.recentRequests.length,
        avgTime: Math.round(stats.avgResponseTime),
        errorRate: Math.round(stats.errorRate * 100) / 100
      }));
  }

  checkThresholds() {
    const current = this.metricsHistory[this.metricsHistory.length - 1];
    if (!current) return;

    this.checkMemoryThreshold(current.system.memory.usedPercent);
    this.checkCpuThreshold(current.system.cpu.usage);
    this.checkDatabaseThreshold();
    this.checkErrorRateThreshold();
  }

  checkMemoryThreshold(memoryPercent) {
    if (memoryPercent >= this.thresholds.memory.critical) {
      this.createAlert('critical', 'memory', `Memory usage critical: ${memoryPercent.toFixed(1)}%`);
    } else if (memoryPercent >= this.thresholds.memory.warning) {
      this.createAlert('warning', 'memory', `Memory usage high: ${memoryPercent.toFixed(1)}%`);
    }
  }

  checkCpuThreshold(cpuUsage) {
    if (cpuUsage >= this.thresholds.cpu.critical) {
      this.createAlert('critical', 'cpu', `CPU usage critical: ${cpuUsage.toFixed(1)}%`);
    } else if (cpuUsage >= this.thresholds.cpu.warning) {
      this.createAlert('warning', 'cpu', `CPU usage high: ${cpuUsage.toFixed(1)}%`);
    }
  }

  checkDatabaseThreshold() {
    const dbStatus = this.metrics.database.status;
    if (dbStatus === 'unhealthy' || dbStatus === 'error') {
      this.createAlert('critical', 'database', `Database status: ${dbStatus}`);
    } else if (dbStatus === 'degraded') {
      this.createAlert('warning', 'database', `Database status: ${dbStatus}`);
    }
  }

  checkErrorRateThreshold() {
    this.metrics.api.endpoints.forEach((stats, endpoint) => {
      if (stats.errorRate >= this.thresholds.errorRate.critical) {
        this.createAlert('critical', 'api', `High error rate on ${endpoint}: ${stats.errorRate.toFixed(1)}%`);
      } else if (stats.errorRate >= this.thresholds.errorRate.warning) {
        this.createAlert('warning', 'api', `Elevated error rate on ${endpoint}: ${stats.errorRate.toFixed(1)}%`);
      }
    });
  }

  createAlert(level, category, message, data = {}) {
    const alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      category,
      message,
      timestamp: new Date().toISOString(),
      data,
      acknowledged: false
    };

    this.alerts.unshift(alert);
    this.alerts = this.alerts.slice(0, 100);

    logger[level === 'critical' ? 'error' : 'warn']('MONITORING', `ALERT [${level.toUpperCase()}]`, {
      category,
      message,
      ...data
    });

    return alert;
  }

  trackRequest(endpoint, method, statusCode, duration, error = null) {
    this.metrics.requests.total++;
    
    if (error) {
      this.metrics.requests.errors++;
    } else {
      this.metrics.requests.success++;
    }

    if (!this.metrics.api.endpoints.has(endpoint)) {
      this.metrics.api.endpoints.set(endpoint, {
        requests: [],
        totalRequests: 0,
        errors: 0,
        totalDuration: 0
      });
    }

    const endpointStats = this.metrics.api.endpoints.get(endpoint);
    const requestData = {
      timestamp: Date.now(),
      method,
      statusCode,
      duration,
      error: !!error
    };

    endpointStats.requests.push(requestData);
    endpointStats.totalRequests++;
    endpointStats.totalDuration += duration;

    if (error) {
      endpointStats.errors++;
    }

    if (duration > this.thresholds.responseTime.warning) {
      this.metrics.api.slowQueries.push({
        endpoint,
        method,
        duration,
        timestamp: new Date().toISOString()
      });
      
      this.metrics.api.slowQueries = this.metrics.api.slowQueries.slice(-50);
    }

    endpointStats.requests = endpointStats.requests.slice(-100);
  }

  pruneHistory() {
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }
  }

  getHealthReport() {
    const current = this.metricsHistory[this.metricsHistory.length - 1];
    const activeAlerts = this.alerts.filter(alert => !alert.acknowledged);

    return {
      status: activeAlerts.some(a => a.level === 'critical') ? 'critical' : 
              activeAlerts.some(a => a.level === 'warning') ? 'warning' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: current,
      alerts: {
        total: this.alerts.length,
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.level === 'critical').length,
        warning: activeAlerts.filter(a => a.level === 'warning').length
      },
      summary: {
        totalRequests: this.metrics.requests.total,
        successRate: this.metrics.requests.total > 0 ? 
          (this.metrics.requests.success / this.metrics.requests.total * 100).toFixed(2) : 0,
        memoryUsage: current?.system.memory.usedPercent.toFixed(1) + '%',
        databaseStatus: this.metrics.database.status
      }
    };
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      logger.info('MONITORING', 'Alert acknowledged', { alertId, message: alert.message });
      return true;
    }
    return false;
  }

  exportMetrics(format = 'json', hours = 1) {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const recentMetrics = this.metricsHistory.filter(m => 
      new Date(m.timestamp).getTime() > cutoffTime
    );

    if (format === 'csv') {
      return this.metricsToCSV(recentMetrics);
    }

    return {
      exportTime: new Date().toISOString(),
      period: `${hours} hour(s)`,
      dataPoints: recentMetrics.length,
      metrics: recentMetrics
    };
  }

  metricsToCSV(metrics) {
    if (metrics.length === 0) return 'No data available';

    const headers = [
      'timestamp', 'requests_total', 'requests_success', 'requests_errors',
      'memory_used_percent', 'cpu_usage', 'database_status', 'database_response_time'
    ];

    const rows = metrics.map(m => [
      m.timestamp,
      m.requests.total,
      m.requests.success,
      m.requests.errors,
      m.system.memory.usedPercent.toFixed(2),
      m.system.cpu.usage.toFixed(2),
      m.database.status,
      m.database.responseTime || 0
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

const monitoringService = new MonitoringService();

module.exports = {
  MonitoringService,
  monitoringService
};