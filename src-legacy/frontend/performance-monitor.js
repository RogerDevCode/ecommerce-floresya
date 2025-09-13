class PerformanceMonitor {
  constructor(options = {}) {
    this.config = {
      trackPageLoad: true,
      trackUserInteractions: true,
      trackResourceLoading: true,
      trackMemoryUsage: true,
      trackNetworkQuality: true,
      reportingThreshold: 1000,
      maxReports: 100,
      ...options
    };

    this.metrics = {
      pageLoad: {},
      interactions: [],
      resources: [],
      memory: [],
      network: {},
      errors: []
    };

    this.startTime = performance.now();
    this.isMonitoring = false;
    this.reportQueue = [];

    this.init();
  }

  init() {
    if (this.config.trackPageLoad) {
      this.trackPageLoadMetrics();
    }

    if (this.config.trackUserInteractions) {
      this.setupInteractionTracking();
    }

    if (this.config.trackResourceLoading) {
      this.setupResourceTracking();
    }

    if (this.config.trackMemoryUsage) {
      this.setupMemoryTracking();
    }

    if (this.config.trackNetworkQuality) {
      this.setupNetworkTracking();
    }

    this.setupErrorTracking();
    this.startPeriodicReporting();

    this.isMonitoring = true;

    if (window.logger) {
      window.logger.info('PERFORMANCE', 'Performance monitor initialized', this.config);
    }
  }

  trackPageLoadMetrics() {
    if (typeof PerformanceObserver === 'undefined') {
      this.trackPageLoadFallback();
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          switch (entry.entryType) {
            case 'navigation':
              this.processNavigationTiming(entry);
              break;
            case 'paint':
              this.processPaintTiming(entry);
              break;
            case 'largest-contentful-paint':
              this.processLCPTiming(entry);
              break;
            case 'first-input':
              this.processFIDTiming(entry);
              break;
            case 'layout-shift':
              this.processCLSTiming(entry);
              break;
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      if (window.logger) {
        window.logger.warn('PERFORMANCE', 'PerformanceObserver setup failed, using fallback', { error: error.message });
      }
      this.trackPageLoadFallback();
    }
  }

  trackPageLoadFallback() {
    window.addEventListener('load', () => {
      const timing = performance.timing;
      
      this.metrics.pageLoad = {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        domReady: timing.domInteractive - timing.navigationStart,
        firstPaint: null,
        firstContentfulPaint: null,
        largestContentfulPaint: null,
        firstInputDelay: null,
        cumulativeLayoutShift: null,
        timeToInteractive: timing.domInteractive - timing.navigationStart
      };

      this.reportMetric('pageLoad', this.metrics.pageLoad);
    });
  }

  processNavigationTiming(entry) {
    this.metrics.pageLoad.navigation = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domReady: entry.domInteractive - entry.fetchStart,
      transferSize: entry.transferSize,
      type: entry.type
    };
  }

  processPaintTiming(entry) {
    if (entry.name === 'first-paint') {
      this.metrics.pageLoad.firstPaint = entry.startTime;
    } else if (entry.name === 'first-contentful-paint') {
      this.metrics.pageLoad.firstContentfulPaint = entry.startTime;
    }
  }

  processLCPTiming(entry) {
    this.metrics.pageLoad.largestContentfulPaint = entry.startTime;
    this.metrics.pageLoad.lcpElement = entry.element?.tagName;
    this.metrics.pageLoad.lcpSize = entry.size;
  }

  processFIDTiming(entry) {
    this.metrics.pageLoad.firstInputDelay = entry.processingStart - entry.startTime;
    this.metrics.pageLoad.fidTarget = entry.target?.tagName;
  }

  processCLSTiming(entry) {
    if (!entry.hadRecentInput) {
      this.metrics.pageLoad.cumulativeLayoutShift = 
        (this.metrics.pageLoad.cumulativeLayoutShift || 0) + entry.value;
    }
  }

  setupInteractionTracking() {
    const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart', 'resize'];
    
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, this.debounce((event) => {
        this.trackInteraction(eventType, event);
      }, 100), { passive: true });
    });
  }

  trackInteraction(type, event) {
    const interaction = {
      type,
      timestamp: performance.now(),
      target: event.target?.tagName,
      targetId: event.target?.id,
      targetClass: event.target?.className
    };

    if (type === 'scroll') {
      interaction.scrollY = window.scrollY;
      interaction.scrollPercentage = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    }

    this.metrics.interactions.push(interaction);
    
    if (this.metrics.interactions.length > 50) {
      this.metrics.interactions = this.metrics.interactions.slice(-30);
    }

    this.reportMetric('interaction', interaction);
  }

  setupResourceTracking() {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.trackResource(entry);
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      if (window.logger) {
        window.logger.warn('PERFORMANCE', 'Resource tracking setup failed', { error: error.message });
      }
    }
  }

  trackResource(entry) {
    const resource = {
      name: entry.name,
      type: entry.initiatorType,
      duration: entry.duration,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      startTime: entry.startTime,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    };

    if (entry.initiatorType === 'img') {
      this.trackImageResource(resource);
    }

    this.metrics.resources.push(resource);
    
    if (this.metrics.resources.length > 100) {
      this.metrics.resources = this.metrics.resources.slice(-50);
    }

    if (entry.duration > this.config.reportingThreshold) {
      this.reportMetric('slowResource', resource);
    }
  }

  trackImageResource(resource) {
    const imageMetrics = {
      ...resource,
      compressionRatio: resource.transferSize > 0 ? resource.decodedBodySize / resource.transferSize : 0,
      loadSpeed: resource.transferSize > 0 ? resource.transferSize / resource.duration : 0
    };

    if (resource.duration > 500) {
      this.reportMetric('slowImage', imageMetrics);
    }
  }

  setupMemoryTracking() {
    if (!performance.memory) return;

    setInterval(() => {
      const memoryInfo = {
        timestamp: performance.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };

      this.metrics.memory.push(memoryInfo);
      
      if (this.metrics.memory.length > 60) {
        this.metrics.memory = this.metrics.memory.slice(-30);
      }

      if (memoryInfo.usagePercentage > 80) {
        this.reportMetric('highMemoryUsage', memoryInfo);
      }
    }, 10000);
  }

  setupNetworkTracking() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      this.metrics.network = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      connection.addEventListener('change', () => {
        const networkChange = {
          timestamp: performance.now(),
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };

        this.metrics.network = { ...this.metrics.network, ...networkChange };
        this.reportMetric('networkChange', networkChange);
      });
    }
  }

  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      const error = {
        timestamp: performance.now(),
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript'
      };

      this.metrics.errors.push(error);
      this.reportMetric('error', error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const error = {
        timestamp: performance.now(),
        message: event.reason?.message || 'Unhandled promise rejection',
        type: 'promise',
        reason: event.reason
      };

      this.metrics.errors.push(error);
      this.reportMetric('error', error);
    });
  }

  reportMetric(type, data) {
    if (window.logger) {
      window.logger.info('PERFORMANCE', `${type} metric`, data);
    }

    this.reportQueue.push({
      type,
      data,
      timestamp: Date.now()
    });

    if (this.reportQueue.length > this.config.maxReports) {
      this.reportQueue = this.reportQueue.slice(-50);
    }
  }

  startPeriodicReporting() {
    setInterval(() => {
      this.generatePerformanceReport();
    }, 30000);
  }

  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      runtime: performance.now() - this.startTime,
      pageLoad: this.metrics.pageLoad,
      recentInteractions: this.metrics.interactions.slice(-10),
      recentResources: this.metrics.resources.slice(-10),
      currentMemory: this.metrics.memory.slice(-1)[0],
      network: this.metrics.network,
      recentErrors: this.metrics.errors.slice(-5),
      vitals: this.calculateWebVitals()
    };

    if (window.logger) {
      window.logger.info('PERFORMANCE', 'Periodic performance report', report);
    }

    this.dispatchPerformanceEvent('performanceReport', report);
  }

  calculateWebVitals() {
    const vitals = {};

    if (this.metrics.pageLoad.largestContentfulPaint) {
      vitals.lcp = {
        value: this.metrics.pageLoad.largestContentfulPaint,
        rating: this.metrics.pageLoad.largestContentfulPaint < 2500 ? 'good' : 
                this.metrics.pageLoad.largestContentfulPaint < 4000 ? 'needs-improvement' : 'poor'
      };
    }

    if (this.metrics.pageLoad.firstInputDelay) {
      vitals.fid = {
        value: this.metrics.pageLoad.firstInputDelay,
        rating: this.metrics.pageLoad.firstInputDelay < 100 ? 'good' : 
                this.metrics.pageLoad.firstInputDelay < 300 ? 'needs-improvement' : 'poor'
      };
    }

    if (this.metrics.pageLoad.cumulativeLayoutShift) {
      vitals.cls = {
        value: this.metrics.pageLoad.cumulativeLayoutShift,
        rating: this.metrics.pageLoad.cumulativeLayoutShift < 0.1 ? 'good' : 
                this.metrics.pageLoad.cumulativeLayoutShift < 0.25 ? 'needs-improvement' : 'poor'
      };
    }

    return vitals;
  }

  dispatchPerformanceEvent(type, data) {
    document.dispatchEvent(new CustomEvent(`performance:${type}`, {
      detail: data
    }));
  }

  getMetrics() {
    return {
      ...this.metrics,
      vitals: this.calculateWebVitals(),
      runtime: performance.now() - this.startTime
    };
  }

  exportMetrics(format = 'json') {
    const metrics = this.getMetrics();

    if (format === 'csv') {
      return this.metricsToCSV(metrics);
    }

    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics
    };
  }

  metricsToCSV(metrics) {
    const csvData = [];
    csvData.push(['Metric', 'Value', 'Timestamp']);

    Object.entries(metrics.pageLoad).forEach(([key, value]) => {
      if (typeof value === 'number') {
        csvData.push(['PageLoad_' + key, value, Date.now()]);
      }
    });

    metrics.interactions.forEach((interaction, index) => {
      csvData.push(['Interaction_' + interaction.type, interaction.timestamp, interaction.timestamp]);
    });

    return csvData.map(row => row.join(',')).join('\n');
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  destroy() {
    this.isMonitoring = false;
    this.reportQueue = [];
    
    if (window.logger) {
      window.logger.info('PERFORMANCE', 'Performance monitor destroyed', {
        runtime: performance.now() - this.startTime,
        totalMetrics: this.reportQueue.length
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
}