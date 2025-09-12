/**
 * Monitoring Service - ES6+ Version
 * Enhanced production monitoring with modern JavaScript patterns
 */

import { logger, trackPerformance } from '../utils/logger.js';
import { prisma, healthCheck } from '../config/prisma.js';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';

// Enhanced monitoring configuration with ES6+ features
const MONITORING_CONFIG = {
    intervals: {
        default: 30000,
        rapid: 5000,
        slow: 60000
    },
    thresholds: {
        memory: { warning: 80, critical: 95 },
        cpu: { warning: 70, critical: 90 },
        responseTime: { warning: 1000, critical: 3000 },
        errorRate: { warning: 5, critical: 15 },
        diskSpace: { warning: 85, critical: 95 }
    },
    limits: {
        maxHistorySize: 1000,
        maxAlerts: 100,
        maxSlowQueries: 50,
        maxEndpointRequests: 100
    }
};

// Enhanced monitoring service using ES6+ class syntax
export class MonitoringService {
    constructor(config = MONITORING_CONFIG) {
        this.config = { ...MONITORING_CONFIG, ...config };
        
        // Initialize metrics with enhanced structure
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                pending: 0,
                rateLimit: 0
            },
            system: {
                memory: { used: 0, free: 0, total: 0, usedPercent: 0 },
                cpu: { usage: 0, load: [], cores: os.cpus().length },
                uptime: 0,
                diskSpace: { used: 0, free: 0, total: 0, usedPercent: 0 }
            },
            database: {
                status: 'unknown',
                responseTime: 0,
                connectionCount: 0,
                queryTimes: [],
                errors: 0,
                slowQueries: 0
            },
            api: {
                endpoints: new Map(),
                slowQueries: [],
                errorRates: new Map(),
                activeConnections: 0
            }
        };

        this.alerts = [];
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.metricsHistory = [];
        this.lastCpuUsage = process.cpuUsage();
        
        // Enhanced event tracking
        this.eventListeners = new Map();
        this.setupProcessListeners();
    }

    // Enhanced monitoring startup with better error handling
    startMonitoring = (intervalMs = this.config.intervals.default) => {
        if (this.isMonitoring) {
            logger.warn('MONITORING', 'Monitoring already started');
            return false;
        }

        this.isMonitoring = true;
        const monitoringInfo = {
            interval: intervalMs,
            pid: process.pid,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            startTime: new Date().toISOString()
        };

        logger.success('MONITORING', 'Production monitoring started', monitoringInfo);

        // Start monitoring loop with error handling
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.collectMetrics();
                this.checkThresholds();
                this.pruneHistory();
                this.emitEvent('metrics:collected');
            } catch (error) {
                logger.error('MONITORING', 'Monitoring loop error', {
                    error: error.message,
                    stack: error.stack
                });
            }
        }, intervalMs);

        // Initial metrics collection
        this.collectMetrics().catch(error => {
            logger.error('MONITORING', 'Initial metrics collection failed', {
                error: error.message
            });
        });

        return true;
    }

    stopMonitoring = () => {
        if (!this.isMonitoring) return false;

        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        const stopInfo = {
            totalMetrics: this.metricsHistory.length,
            totalAlerts: this.alerts.length,
            uptime: process.uptime()
        };

        logger.info('MONITORING', 'Monitoring stopped', stopInfo);
        this.emitEvent('monitoring:stopped', stopInfo);
        
        return true;
    }

    // Enhanced metrics collection with performance tracking
    collectMetrics = async () => {
        const performanceTracker = trackPerformance('collect-metrics');

        try {
            // Collect all metrics in parallel for better performance
            const [systemMetrics, databaseMetrics] = await Promise.allSettled([
                this.collectSystemMetrics(),
                this.collectDatabaseMetrics()
            ]);

            // Handle any failed collections
            if (systemMetrics.status === 'rejected') {
                logger.warn('MONITORING', 'System metrics collection failed', {
                    error: systemMetrics.reason?.message
                });
            }

            if (databaseMetrics.status === 'rejected') {
                logger.warn('MONITORING', 'Database metrics collection failed', {
                    error: databaseMetrics.reason?.message
                });
            }

            // Collect API metrics (synchronous)
            this.collectApiMetrics();
            
            // Create and store snapshot
            const snapshot = this.createMetricsSnapshot();
            this.metricsHistory.push(snapshot);

            performanceTracker.end();

            // Periodic detailed logging
            if (this.metricsHistory.length % 10 === 0) {
                logger.debug('MONITORING', 'Metrics collected', {
                    historySize: this.metricsHistory.length,
                    memory: `${snapshot.system.memory.usedPercent.toFixed(1)}%`,
                    cpu: `${snapshot.system.cpu.usage.toFixed(1)}%`,
                    requests: snapshot.requests.total,
                    errors: snapshot.requests.errors,
                    performance: performanceTracker.getDuration()
                });
            }

            this.emitEvent('metrics:updated', snapshot);
            return snapshot;

        } catch (error) {
            performanceTracker.end();
            logger.error('MONITORING', 'Error collecting metrics', {
                error: error.message,
                stack: error.stack,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    }

    // Enhanced system metrics with additional data points
    collectSystemMetrics = async () => {
        const memUsage = process.memoryUsage();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const cpuUsage = this.calculateCpuUsage();

        this.metrics.system = {
            memory: {
                used: memUsage.rss,
                free: freeMemory,
                total: totalMemory,
                usedPercent: (memUsage.rss / totalMemory) * 100,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                arrayBuffers: memUsage.arrayBuffers || 0
            },
            cpu: {
                usage: cpuUsage,
                load: os.loadavg(),
                cores: os.cpus().length,
                model: os.cpus()[0]?.model || 'Unknown'
            },
            uptime: process.uptime(),
            diskSpace: await this.collectDiskSpace()
        };

        return this.metrics.system;
    }

    // Enhanced database metrics using Prisma health check
    collectDatabaseMetrics = async () => {
        try {
            const performanceTracker = trackPerformance('database-health-check');
            const health = await healthCheck();
            performanceTracker.end();

            this.metrics.database = {
                status: health.status,
                responseTime: performanceTracker.getDuration(),
                environment: health.environment,
                timestamp: health.timestamp,
                connectionCount: await this.getDatabaseConnectionCount(),
                errors: health.status === 'unhealthy' ? 
                    this.metrics.database.errors + 1 : this.metrics.database.errors,
                slowQueries: this.metrics.database.slowQueries || 0
            };

            return this.metrics.database;

        } catch (error) {
            this.metrics.database.errors++;
            logger.error('MONITORING', 'Database metrics collection failed', {
                error: error.message,
                previousStatus: this.metrics.database.status
            });

            this.metrics.database.status = 'error';
            this.metrics.database.lastError = error.message;
            this.metrics.database.responseTime = -1;
            
            throw error;
        }
    }

    // Enhanced API metrics collection
    collectApiMetrics = () => {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const fiveMinutesAgo = now - 300000;

        this.metrics.api.endpoints.forEach((stats, endpoint) => {
            // Filter recent requests
            stats.recentRequests = stats.requests.filter(req => req.timestamp > oneMinuteAgo);
            stats.recentRequestsLong = stats.requests.filter(req => req.timestamp > fiveMinutesAgo);
            
            // Calculate error rate
            const recentCount = stats.recentRequests.length;
            stats.errorRate = recentCount > 0 ? 
                (stats.recentRequests.filter(req => req.error).length / recentCount) * 100 : 0;
            
            // Calculate average response time
            stats.avgResponseTime = recentCount > 0 ?
                stats.recentRequests.reduce((sum, req) => sum + req.duration, 0) / recentCount : 0;
            
            // Calculate throughput (requests per minute)
            stats.throughput = stats.recentRequests.length;
            
            // Calculate P95 response time
            const sortedTimes = stats.recentRequests
                .map(req => req.duration)
                .sort((a, b) => a - b);
            stats.p95ResponseTime = sortedTimes.length > 0 ?
                sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0 : 0;
        });

        return this.metrics.api;
    }

    // Enhanced CPU usage calculation
    calculateCpuUsage = () => {
        const stats = process.cpuUsage(this.lastCpuUsage);
        this.lastCpuUsage = process.cpuUsage();
        
        const totalTime = stats.user + stats.system;
        const usage = (totalTime / 1000000) / 1 * 100; // Convert to percentage
        
        return Math.min(100, Math.max(0, usage));
    }

    // New: Disk space monitoring
    collectDiskSpace = async () => {
        try {
            const stats = await fs.stat(process.cwd());
            // This is a simplified approach - in production you'd use a library like 'fs-extra' 
            // or system commands to get actual disk usage
            return {
                used: 0,
                free: 0,
                total: 0,
                usedPercent: 0,
                available: true
            };
        } catch (error) {
            logger.warn('MONITORING', 'Disk space collection failed', { error: error.message });
            return { used: 0, free: 0, total: 0, usedPercent: 0, available: false };
        }
    }

    // Enhanced database connection count
    getDatabaseConnectionCount = async () => {
        try {
            // This would need to be implemented based on your database
            // For Prisma, this might involve querying connection pool stats
            return 1; // Placeholder
        } catch (error) {
            return 0;
        }
    }

    // Enhanced metrics snapshot with more data
    createMetricsSnapshot = () => ({
        timestamp: new Date().toISOString(),
        requests: { ...this.metrics.requests },
        system: { ...this.metrics.system },
        database: { ...this.metrics.database },
        api: {
            totalEndpoints: this.metrics.api.endpoints.size,
            slowQueries: this.metrics.api.slowQueries.length,
            activeConnections: this.metrics.api.activeConnections,
            topEndpoints: this.getTopEndpoints(5),
            errorRateByEndpoint: this.getErrorRatesByEndpoint()
        }
    })

    // Enhanced top endpoints analysis
    getTopEndpoints = (limit = 5) => {
        return Array.from(this.metrics.api.endpoints.entries())
            .sort((a, b) => {
                const aScore = (b[1].recentRequests?.length || 0) + (b[1].avgResponseTime || 0) / 1000;
                const bScore = (a[1].recentRequests?.length || 0) + (a[1].avgResponseTime || 0) / 1000;
                return bScore - aScore;
            })
            .slice(0, limit)
            .map(([endpoint, stats]) => ({
                endpoint,
                requests: stats.recentRequests?.length || 0,
                avgTime: Math.round(stats.avgResponseTime || 0),
                p95Time: Math.round(stats.p95ResponseTime || 0),
                errorRate: Math.round((stats.errorRate || 0) * 100) / 100,
                throughput: stats.throughput || 0
            }));
    }

    // New: Error rates by endpoint
    getErrorRatesByEndpoint = () => {
        const errorRates = {};
        this.metrics.api.endpoints.forEach((stats, endpoint) => {
            if ((stats.errorRate || 0) > 0) {
                errorRates[endpoint] = {
                    rate: Math.round((stats.errorRate || 0) * 100) / 100,
                    total: stats.recentRequests?.filter(req => req.error).length || 0,
                    outOf: stats.recentRequests?.length || 0
                };
            }
        });
        return errorRates;
    }

    // Enhanced threshold checking with more sophisticated logic
    checkThresholds = () => {
        const current = this.metricsHistory[this.metricsHistory.length - 1];
        if (!current) return;

        const checks = [
            () => this.checkMemoryThreshold(current.system.memory.usedPercent),
            () => this.checkCpuThreshold(current.system.cpu.usage),
            () => this.checkDatabaseThreshold(current.database),
            () => this.checkErrorRateThreshold(),
            () => this.checkResponseTimeThreshold()
        ];

        checks.forEach(check => {
            try {
                check();
            } catch (error) {
                logger.warn('MONITORING', 'Threshold check failed', {
                    check: check.name,
                    error: error.message
                });
            }
        });
    }

    checkMemoryThreshold = (memoryPercent) => {
        const { warning, critical } = this.config.thresholds.memory;
        
        if (memoryPercent >= critical) {
            this.createAlert('critical', 'memory', 
                `Memory usage critical: ${memoryPercent.toFixed(1)}%`, 
                { threshold: critical, current: memoryPercent }
            );
        } else if (memoryPercent >= warning) {
            this.createAlert('warning', 'memory', 
                `Memory usage high: ${memoryPercent.toFixed(1)}%`, 
                { threshold: warning, current: memoryPercent }
            );
        }
    }

    checkCpuThreshold = (cpuUsage) => {
        const { warning, critical } = this.config.thresholds.cpu;
        
        if (cpuUsage >= critical) {
            this.createAlert('critical', 'cpu', 
                `CPU usage critical: ${cpuUsage.toFixed(1)}%`,
                { threshold: critical, current: cpuUsage }
            );
        } else if (cpuUsage >= warning) {
            this.createAlert('warning', 'cpu', 
                `CPU usage high: ${cpuUsage.toFixed(1)}%`,
                { threshold: warning, current: cpuUsage }
            );
        }
    }

    checkDatabaseThreshold = (dbMetrics) => {
        const { status, responseTime } = dbMetrics;
        
        if (status === 'unhealthy' || status === 'error') {
            this.createAlert('critical', 'database', 
                `Database status: ${status}`,
                { status, responseTime }
            );
        } else if (status === 'degraded') {
            this.createAlert('warning', 'database', 
                `Database status: ${status}`,
                { status, responseTime }
            );
        }

        // Check response time
        if (responseTime > this.config.thresholds.responseTime.critical) {
            this.createAlert('critical', 'database', 
                `Database response time critical: ${responseTime}ms`
            );
        }
    }

    checkErrorRateThreshold = () => {
        this.metrics.api.endpoints.forEach((stats, endpoint) => {
            const errorRate = stats.errorRate || 0;
            const { warning, critical } = this.config.thresholds.errorRate;
            
            if (errorRate >= critical) {
                this.createAlert('critical', 'api', 
                    `High error rate on ${endpoint}: ${errorRate.toFixed(1)}%`,
                    { endpoint, errorRate, threshold: critical }
                );
            } else if (errorRate >= warning) {
                this.createAlert('warning', 'api', 
                    `Elevated error rate on ${endpoint}: ${errorRate.toFixed(1)}%`,
                    { endpoint, errorRate, threshold: warning }
                );
            }
        });
    }

    // New: Response time threshold checking
    checkResponseTimeThreshold = () => {
        this.metrics.api.endpoints.forEach((stats, endpoint) => {
            const avgTime = stats.avgResponseTime || 0;
            const p95Time = stats.p95ResponseTime || 0;
            const { warning, critical } = this.config.thresholds.responseTime;
            
            if (p95Time > critical) {
                this.createAlert('critical', 'performance', 
                    `Slow response times on ${endpoint}: P95 ${p95Time}ms`,
                    { endpoint, avgTime, p95Time, threshold: critical }
                );
            } else if (avgTime > warning) {
                this.createAlert('warning', 'performance', 
                    `Slow average response on ${endpoint}: ${avgTime.toFixed(0)}ms`,
                    { endpoint, avgTime, threshold: warning }
                );
            }
        });
    }

    // Enhanced alert creation with deduplication
    createAlert = (level, category, message, data = {}) => {
        // Simple deduplication: check if similar alert exists in last 5 minutes
        const fiveMinutesAgo = Date.now() - 300000;
        const isDuplicate = this.alerts.some(alert => 
            alert.category === category &&
            alert.level === level &&
            alert.message === message &&
            new Date(alert.timestamp).getTime() > fiveMinutesAgo &&
            !alert.acknowledged
        );

        if (isDuplicate) {
            return null; // Skip duplicate alert
        }

        const alert = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            level,
            category,
            message,
            timestamp: new Date().toISOString(),
            data: { ...data, hostname: os.hostname(), pid: process.pid },
            acknowledged: false,
            count: 1
        };

        this.alerts.unshift(alert);
        this.alerts = this.alerts.slice(0, this.config.limits.maxAlerts);

        const logLevel = level === 'critical' ? 'error' : 'warn';
        logger[logLevel]('MONITORING', `ALERT [${level.toUpperCase()}] ${category}`, {
            message,
            alertId: alert.id,
            ...data
        });

        this.emitEvent('alert:created', alert);
        return alert;
    }

    // Enhanced request tracking with more metrics
    trackRequest = (endpoint, method, statusCode, duration, error = null, userAgent = null) => {
        // Update global request metrics
        this.metrics.requests.total++;
        
        if (error || statusCode >= 400) {
            this.metrics.requests.errors++;
        } else {
            this.metrics.requests.success++;
        }

        // Ensure endpoint stats exist
        if (!this.metrics.api.endpoints.has(endpoint)) {
            this.metrics.api.endpoints.set(endpoint, {
                requests: [],
                totalRequests: 0,
                errors: 0,
                totalDuration: 0,
                methods: new Set(),
                userAgents: new Set()
            });
        }

        const endpointStats = this.metrics.api.endpoints.get(endpoint);
        
        // Create request record
        const requestData = {
            timestamp: Date.now(),
            method,
            statusCode,
            duration,
            error: !!error,
            userAgent: userAgent || 'unknown',
            errorMessage: error?.message || null
        };

        // Update endpoint stats
        endpointStats.requests.push(requestData);
        endpointStats.totalRequests++;
        endpointStats.totalDuration += duration;
        endpointStats.methods.add(method);
        
        if (userAgent) {
            endpointStats.userAgents.add(userAgent);
        }

        if (error || statusCode >= 400) {
            endpointStats.errors++;
        }

        // Track slow queries
        if (duration > this.config.thresholds.responseTime.warning) {
            const slowQuery = {
                endpoint,
                method,
                duration,
                statusCode,
                timestamp: new Date().toISOString(),
                userAgent,
                error: error?.message
            };

            this.metrics.api.slowQueries.push(slowQuery);
            this.metrics.api.slowQueries = this.metrics.api.slowQueries
                .slice(-this.config.limits.maxSlowQueries);
        }

        // Limit stored requests per endpoint
        endpointStats.requests = endpointStats.requests
            .slice(-this.config.limits.maxEndpointRequests);

        this.emitEvent('request:tracked', { endpoint, method, statusCode, duration });
    }

    // Enhanced history pruning
    pruneHistory = () => {
        if (this.metricsHistory.length > this.config.limits.maxHistorySize) {
            const removed = this.metricsHistory.length - this.config.limits.maxHistorySize;
            this.metricsHistory = this.metricsHistory.slice(-this.config.limits.maxHistorySize);
            
            logger.debug('MONITORING', 'Pruned metrics history', {
                removed,
                remaining: this.metricsHistory.length
            });
        }
    }

    // Enhanced health report with trend analysis
    getHealthReport = () => {
        const current = this.metricsHistory[this.metricsHistory.length - 1];
        const previous = this.metricsHistory[this.metricsHistory.length - 10]; // 10 snapshots ago
        
        const activeAlerts = this.alerts.filter(alert => !alert.acknowledged);
        const criticalAlerts = activeAlerts.filter(a => a.level === 'critical');
        const warningAlerts = activeAlerts.filter(a => a.level === 'warning');

        // Calculate trends
        const trends = this.calculateTrends(current, previous);

        return {
            status: criticalAlerts.length > 0 ? 'critical' : 
                    warningAlerts.length > 0 ? 'warning' : 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.version,
            platform: `${process.platform}-${process.arch}`,
            
            metrics: current,
            trends,
            
            alerts: {
                total: this.alerts.length,
                active: activeAlerts.length,
                critical: criticalAlerts.length,
                warning: warningAlerts.length,
                recentAlerts: activeAlerts.slice(0, 5) // Most recent 5
            },
            
            summary: {
                totalRequests: this.metrics.requests.total,
                successRate: this.metrics.requests.total > 0 ? 
                    ((this.metrics.requests.success / this.metrics.requests.total) * 100).toFixed(2) : '0',
                errorRate: this.metrics.requests.total > 0 ?
                    ((this.metrics.requests.errors / this.metrics.requests.total) * 100).toFixed(2) : '0',
                memoryUsage: current?.system.memory.usedPercent.toFixed(1) + '%',
                cpuUsage: current?.system.cpu.usage.toFixed(1) + '%',
                databaseStatus: this.metrics.database.status,
                activeEndpoints: this.metrics.api.endpoints.size,
                slowQueries: this.metrics.api.slowQueries.length
            }
        };
    }

    // New: Calculate trends between two time points
    calculateTrends = (current, previous) => {
        if (!current || !previous) {
            return { available: false, reason: 'Insufficient data' };
        }

        return {
            available: true,
            memory: {
                change: current.system.memory.usedPercent - previous.system.memory.usedPercent,
                trend: this.getTrendDirection(current.system.memory.usedPercent, previous.system.memory.usedPercent)
            },
            cpu: {
                change: current.system.cpu.usage - previous.system.cpu.usage,
                trend: this.getTrendDirection(current.system.cpu.usage, previous.system.cpu.usage)
            },
            requests: {
                change: current.requests.total - previous.requests.total,
                trend: this.getTrendDirection(current.requests.total, previous.requests.total)
            },
            errors: {
                change: current.requests.errors - previous.requests.errors,
                trend: this.getTrendDirection(current.requests.errors, previous.requests.errors, true) // Reverse for errors
            }
        };
    }

    getTrendDirection = (current, previous, reverse = false) => {
        const diff = current - previous;
        const threshold = 0.1; // 0.1% threshold for considering it stable
        
        if (Math.abs(diff) < threshold) return 'stable';
        
        const increasing = diff > 0;
        return reverse ? (increasing ? 'worsening' : 'improving') : 
                        (increasing ? 'increasing' : 'decreasing');
    }

    // Enhanced alert acknowledgment
    acknowledgeAlert = (alertId, acknowledgedBy = 'system') => {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = new Date().toISOString();
            alert.acknowledgedBy = acknowledgedBy;
            
            logger.info('MONITORING', 'Alert acknowledged', { 
                alertId, 
                message: alert.message,
                acknowledgedBy 
            });
            
            this.emitEvent('alert:acknowledged', alert);
            return true;
        }
        return false;
    }

    // Enhanced metrics export with multiple formats
    exportMetrics = (format = 'json', hours = 1, filters = {}) => {
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        let recentMetrics = this.metricsHistory.filter(m => 
            new Date(m.timestamp).getTime() > cutoffTime
        );

        // Apply filters
        if (filters.category) {
            // This would need implementation based on specific filtering needs
        }

        const exportData = {
            exportTime: new Date().toISOString(),
            period: `${hours} hour(s)`,
            dataPoints: recentMetrics.length,
            filters
        };

        switch (format.toLowerCase()) {
            case 'csv':
                return this.metricsToCSV(recentMetrics);
            case 'json':
                return { ...exportData, metrics: recentMetrics };
            case 'summary':
                return { ...exportData, summary: this.createSummaryReport(recentMetrics) };
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    // Enhanced CSV export
    metricsToCSV = (metrics) => {
        if (metrics.length === 0) return 'timestamp\nNo data available';

        const headers = [
            'timestamp', 'requests_total', 'requests_success', 'requests_errors',
            'memory_used_percent', 'cpu_usage', 'cpu_cores', 'database_status', 
            'database_response_time', 'active_endpoints', 'slow_queries'
        ];

        const rows = metrics.map(m => [
            m.timestamp,
            m.requests.total,
            m.requests.success,
            m.requests.errors,
            m.system.memory.usedPercent.toFixed(2),
            m.system.cpu.usage.toFixed(2),
            m.system.cpu.cores,
            m.database.status,
            m.database.responseTime || 0,
            m.api.totalEndpoints,
            m.api.slowQueries
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    // New: Create summary report
    createSummaryReport = (metrics) => {
        if (metrics.length === 0) return { message: 'No data available' };

        const latest = metrics[metrics.length - 1];
        const oldest = metrics[0];

        return {
            period: {
                start: oldest.timestamp,
                end: latest.timestamp,
                dataPoints: metrics.length
            },
            averages: {
                memoryUsage: this.calculateAverage(metrics, 'system.memory.usedPercent'),
                cpuUsage: this.calculateAverage(metrics, 'system.cpu.usage'),
                requestsPerSnapshot: this.calculateAverage(metrics, 'requests.total') / metrics.length
            },
            peaks: {
                maxMemory: Math.max(...metrics.map(m => m.system.memory.usedPercent)),
                maxCpu: Math.max(...metrics.map(m => m.system.cpu.usage)),
                maxRequests: Math.max(...metrics.map(m => m.requests.total))
            },
            totals: {
                requests: latest.requests.total - oldest.requests.total,
                errors: latest.requests.errors - oldest.requests.errors,
                successRate: this.calculateSuccessRate(oldest, latest)
            }
        };
    }

    // Helper methods for calculations
    calculateAverage = (metrics, path) => {
        const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => v !== null);
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }

    getNestedValue = (obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    calculateSuccessRate = (oldest, latest) => {
        const totalRequests = latest.requests.total - oldest.requests.total;
        const totalErrors = latest.requests.errors - oldest.requests.errors;
        const successRequests = totalRequests - totalErrors;
        
        return totalRequests > 0 ? ((successRequests / totalRequests) * 100).toFixed(2) : 0;
    }

    // Event system for extensibility
    setupProcessListeners = () => {
        process.on('uncaughtException', (error) => {
            this.createAlert('critical', 'process', 'Uncaught exception occurred', {
                error: error.message,
                stack: error.stack
            });
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.createAlert('critical', 'process', 'Unhandled promise rejection', {
                reason: reason?.toString() || 'Unknown reason',
                promise: promise?.toString() || 'Unknown promise'
            });
        });

        process.on('SIGTERM', () => {
            logger.info('MONITORING', 'Received SIGTERM, stopping monitoring gracefully');
            this.stopMonitoring();
        });

        process.on('SIGINT', () => {
            logger.info('MONITORING', 'Received SIGINT, stopping monitoring gracefully');
            this.stopMonitoring();
        });
    }

    // Event emitter functionality
    on = (event, listener) => {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(listener);
    }

    off = (event, listener) => {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emitEvent = (event, data) => {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    logger.warn('MONITORING', 'Event listener error', {
                        event,
                        error: error.message
                    });
                }
            });
        }
    }
}

// Create singleton instance
export const monitoringService = new MonitoringService();

// Enhanced exports with default export
export default {
    MonitoringService,
    monitoringService,
    MONITORING_CONFIG
};