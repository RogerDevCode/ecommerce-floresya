const { monitoringService } = require('../services/monitoringService');
const { logger } = require('../utils/logger');

const createMonitoringMiddleware = (options = {}) => {
  const config = {
    trackRequests: true,
    trackPerformance: true,
    trackErrors: true,
    excludePaths: ['/health', '/metrics', '/favicon.ico'],
    ...options
  };

  return (req, res, next) => {
    if (config.excludePaths.includes(req.path)) {
      return next();
    }

    const startTime = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    req.requestId = requestId;
    req.startTime = startTime;

    // Context tracking - simplified without setContext
    req.logContext = {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function(body) {
      trackRequestEnd(req, res, body);
      return originalSend.call(this, body);
    };

    res.json = function(body) {
      trackRequestEnd(req, res, body);
      return originalJson.call(this, body);
    };

    res.on('finish', () => {
      if (!res.headersSent) {
        trackRequestEnd(req, res);
      }
    });

    res.on('error', (error) => {
      trackRequestEnd(req, res, null, error);
    });

    next();
  };

  function trackRequestEnd(req, res, body = null, error = null) {
    const duration = Date.now() - req.startTime;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;

    if (config.trackRequests) {
      monitoringService.trackRequest(
        endpoint,
        req.method,
        res.statusCode,
        duration,
        error
      );
    }

    if (config.trackPerformance) {
      logger.info('REQUEST', 'Request completed', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('Content-Length') || (body ? JSON.stringify(body).length : 0),
        error: error?.message
      });
    }

    if (error && config.trackErrors) {
      logger.error('REQUEST', 'Request error', {
        requestId: req.requestId,
        endpoint,
        error: error.message,
        stack: error.stack
      }, error);
    }

    // Context cleared - simplified without clearContext
    req.logContext = null;
  }
};

const healthCheckMiddleware = (req, res, next) => {
  if (req.path === '/health') {
    const healthReport = monitoringService.getHealthReport();
    return res.json(healthReport);
  }

  if (req.path === '/metrics') {
    const format = req.query.format || 'json';
    const hours = parseInt(req.query.hours) || 1;
    
    try {
      const metrics = monitoringService.exportMetrics(format, hours);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="metrics-${Date.now()}.csv"`);
        return res.send(metrics);
      }
      
      return res.json(metrics);
    } catch (error) {
      logger.error('MONITORING', 'Metrics export error', { error: error.message }, error);
      return res.status(500).json({ error: 'Failed to export metrics' });
    }
  }

  next();
};

const alertsMiddleware = (req, res, next) => {
  if (req.path === '/alerts') {
    if (req.method === 'GET') {
      return res.json({
        alerts: monitoringService.alerts,
        summary: {
          total: monitoringService.alerts.length,
          active: monitoringService.alerts.filter(a => !a.acknowledged).length,
          acknowledged: monitoringService.alerts.filter(a => a.acknowledged).length
        }
      });
    }

    if (req.method === 'POST' && req.body.action === 'acknowledge') {
      const { alertId } = req.body;
      const success = monitoringService.acknowledgeAlert(alertId);
      
      return res.json({
        success,
        message: success ? 'Alert acknowledged' : 'Alert not found'
      });
    }
  }

  next();
};

const systemStatsMiddleware = (req, res, next) => {
  if (req.path === '/system-stats') {
    const stats = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      pid: process.pid,
      env: process.env.NODE_ENV
    };

    return res.json(stats);
  }

  next();
};

module.exports = {
  createMonitoringMiddleware,
  healthCheckMiddleware,
  alertsMiddleware,
  systemStatsMiddleware
};