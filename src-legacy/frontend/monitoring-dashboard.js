class MonitoringDashboard {
  constructor(container) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    this.isRunning = false;
    this.refreshInterval = null;
    this.data = {
      health: null,
      metrics: null,
      alerts: null,
      systemStats: null
    };
    
    this.config = {
      refreshRate: 10000,
      maxDataPoints: 50,
      alertSound: true,
      autoRefresh: true
    };

    this.charts = {
      memory: null,
      cpu: null,
      requests: null,
      responseTime: null
    };

    this.init();
  }

  init() {
    this.createDashboardHTML();
    this.bindEvents();
    if (this.config.autoRefresh) {
      this.start();
    }
  }

  createDashboardHTML() {
    this.container.innerHTML = `
      <div class="monitoring-dashboard">
        <header class="dashboard-header">
          <h1>🔍 Panel de Monitoreo</h1>
          <div class="dashboard-controls">
            <button id="refresh-btn" class="btn btn-primary">🔄 Actualizar</button>
            <button id="toggle-btn" class="btn btn-secondary">⏸️ Pausar</button>
            <button id="export-btn" class="btn btn-info">📊 Exportar</button>
            <select id="refresh-rate">
              <option value="5000">5s</option>
              <option value="10000" selected>10s</option>
              <option value="30000">30s</option>
              <option value="60000">1min</option>
            </select>
          </div>
        </header>

        <div class="dashboard-alerts" id="alerts-panel" style="display: none;">
          <h3>🚨 Alertas Activas</h3>
          <div id="alerts-list"></div>
        </div>

        <div class="dashboard-grid">
          <div class="dashboard-card status-card">
            <h3>🏥 Estado General</h3>
            <div id="overall-status" class="status-indicator">
              <div class="status-dot unknown"></div>
              <span>Conectando...</span>
            </div>
            <div class="status-details">
              <div class="stat">
                <label>Uptime:</label>
                <span id="uptime">-</span>
              </div>
              <div class="stat">
                <label>Solicitudes:</label>
                <span id="total-requests">-</span>
              </div>
              <div class="stat">
                <label>Éxito:</label>
                <span id="success-rate">-</span>
              </div>
            </div>
          </div>

          <div class="dashboard-card">
            <h3>💾 Memoria</h3>
            <div class="metric-display">
              <div class="metric-value" id="memory-percent">-</div>
              <div class="metric-label">Usado</div>
            </div>
            <canvas id="memory-chart" width="300" height="150"></canvas>
          </div>

          <div class="dashboard-card">
            <h3>⚡ CPU</h3>
            <div class="metric-display">
              <div class="metric-value" id="cpu-percent">-</div>
              <div class="metric-label">Uso</div>
            </div>
            <canvas id="cpu-chart" width="300" height="150"></canvas>
          </div>

          <div class="dashboard-card">
            <h3>🌐 Solicitudes</h3>
            <div class="requests-stats">
              <div class="stat-item">
                <div class="stat-value" id="requests-success">0</div>
                <div class="stat-label">Exitosas</div>
              </div>
              <div class="stat-item">
                <div class="stat-value error" id="requests-errors">0</div>
                <div class="stat-label">Errores</div>
              </div>
            </div>
            <canvas id="requests-chart" width="300" height="150"></canvas>
          </div>

          <div class="dashboard-card">
            <h3>🗄️ Base de Datos</h3>
            <div id="database-status" class="status-indicator">
              <div class="status-dot unknown"></div>
              <span>Verificando...</span>
            </div>
            <div class="db-stats">
              <div class="stat">
                <label>Estado:</label>
                <span id="db-status-text">-</span>
              </div>
              <div class="stat">
                <label>Tiempo Resp.:</label>
                <span id="db-response-time">-</span>
              </div>
            </div>
          </div>

          <div class="dashboard-card endpoints-card">
            <h3>🔗 Endpoints</h3>
            <div id="top-endpoints">
              <div class="loading">Cargando endpoints...</div>
            </div>
          </div>
        </div>

        <div class="dashboard-footer">
          <div class="last-update">
            Última actualización: <span id="last-update">-</span>
          </div>
          <div class="connection-status" id="connection-status">
            <div class="status-dot unknown"></div>
            <span>Desconectado</span>
          </div>
        </div>
      </div>
    `;

    this.addDashboardCSS();
  }

  addDashboardCSS() {
    if (document.getElementById('monitoring-dashboard-css')) return;

    const style = document.createElement('style');
    style.id = 'monitoring-dashboard-css';
    style.textContent = `
      .monitoring-dashboard {
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        background: #f5f5f5;
        min-height: 100vh;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .dashboard-header h1 {
        margin: 0;
        color: #333;
        font-size: 1.8rem;
      }

      .dashboard-controls {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.2s;
      }

      .btn:hover { opacity: 0.9; transform: translateY(-1px); }
      .btn-primary { background: #007bff; color: white; }
      .btn-secondary { background: #6c757d; color: white; }
      .btn-info { background: #17a2b8; color: white; }
      .btn-danger { background: #dc3545; color: white; }

      #refresh-rate {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
      }

      .dashboard-alerts {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
      }

      .dashboard-alerts.critical {
        background: #f8d7da;
        border-color: #f1aeb5;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }

      .dashboard-card {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s;
      }

      .dashboard-card:hover {
        transform: translateY(-2px);
      }

      .dashboard-card h3 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 1.1rem;
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 8px;
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
      }

      .status-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      .status-dot.healthy { background: #28a745; }
      .status-dot.warning { background: #ffc107; }
      .status-dot.critical { background: #dc3545; }
      .status-dot.unknown { background: #6c757d; }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }

      .metric-display {
        text-align: center;
        margin-bottom: 15px;
      }

      .metric-value {
        font-size: 2.5rem;
        font-weight: bold;
        color: #28a745;
      }

      .metric-value.warning { color: #ffc107; }
      .metric-value.critical { color: #dc3545; }

      .metric-label {
        color: #666;
        font-size: 0.9rem;
        margin-top: 5px;
      }

      .status-details, .db-stats {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .stat {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .stat:last-child {
        border-bottom: none;
      }

      .stat label {
        font-weight: 500;
        color: #666;
      }

      .stat span {
        color: #333;
        font-weight: 600;
      }

      .requests-stats {
        display: flex;
        justify-content: space-around;
        margin-bottom: 15px;
      }

      .stat-item {
        text-align: center;
      }

      .stat-value {
        font-size: 1.8rem;
        font-weight: bold;
        color: #28a745;
      }

      .stat-value.error {
        color: #dc3545;
      }

      .stat-label {
        color: #666;
        font-size: 0.9rem;
        margin-top: 5px;
      }

      .endpoints-card {
        grid-column: 1 / -1;
      }

      .endpoint-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        margin: 5px 0;
        background: #f8f9fa;
        border-radius: 6px;
        font-family: monospace;
      }

      .endpoint-stats {
        display: flex;
        gap: 15px;
        font-size: 0.9rem;
      }

      .endpoint-stat {
        color: #666;
      }

      .dashboard-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        padding: 15px 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        font-size: 0.9rem;
        color: #666;
      }

      .connection-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .loading {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 20px;
      }

      .alert-item {
        padding: 10px;
        margin: 5px 0;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .alert-item.warning {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
      }

      .alert-item.critical {
        background: #f8d7da;
        border: 1px solid #f1aeb5;
      }

      .alert-acknowledge {
        background: #007bff;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
      }

      @media (max-width: 768px) {
        .dashboard-header {
          flex-direction: column;
          gap: 15px;
        }

        .dashboard-grid {
          grid-template-columns: 1fr;
        }

        .dashboard-footer {
          flex-direction: column;
          gap: 10px;
          text-align: center;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  bindEvents() {
    document.getElementById('refresh-btn').addEventListener('click', () => this.refresh());
    document.getElementById('toggle-btn').addEventListener('click', () => this.toggle());
    document.getElementById('export-btn').addEventListener('click', () => this.exportData());
    
    document.getElementById('refresh-rate').addEventListener('change', (e) => {
      this.config.refreshRate = parseInt(e.target.value);
      if (this.isRunning) {
        this.stop();
        this.start();
      }
    });
  }

  async start() {
    this.isRunning = true;
    document.getElementById('toggle-btn').textContent = '⏸️ Pausar';
    this.updateConnectionStatus('connected');
    
    await this.refresh();
    this.refreshInterval = setInterval(() => this.refresh(), this.config.refreshRate);
  }

  stop() {
    this.isRunning = false;
    document.getElementById('toggle-btn').textContent = '▶️ Reanudar';
    this.updateConnectionStatus('disconnected');
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  toggle() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  async refresh() {
    try {
      this.updateConnectionStatus('connecting');
      
      const [health, metrics, alerts, systemStats] = await Promise.all([
        this.fetchHealth(),
        this.fetchMetrics(),
        this.fetchAlerts(),
        this.fetchSystemStats()
      ]);

      this.data = { health, metrics, alerts, systemStats };
      
      this.updateOverallStatus();
      this.updateSystemMetrics();
      this.updateDatabaseStatus();
      this.updateRequestsStats();
      this.updateEndpoints();
      this.updateAlerts();
      this.updateLastUpdate();
      
      this.updateConnectionStatus('connected');
      
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      this.updateConnectionStatus('error');
    }
  }

  async fetchHealth() {
    const response = await fetch('/health');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async fetchMetrics() {
    const response = await fetch('/metrics');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async fetchAlerts() {
    const response = await fetch('/alerts');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async fetchSystemStats() {
    const response = await fetch('/system-stats');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  updateOverallStatus() {
    const { health } = this.data;
    if (!health) return;

    const statusElement = document.getElementById('overall-status');
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('span');

    dot.className = `status-dot ${health.status}`;
    text.textContent = this.getStatusText(health.status);

    document.getElementById('uptime').textContent = this.formatUptime(health.uptime);
    document.getElementById('total-requests').textContent = health.summary.totalRequests || 0;
    document.getElementById('success-rate').textContent = `${health.summary.successRate || 0}%`;
  }

  updateSystemMetrics() {
    const { health } = this.data;
    if (!health?.metrics) return;

    const memoryPercent = health.metrics.system.memory.usedPercent;
    const cpuUsage = health.metrics.system.cpu.usage;

    document.getElementById('memory-percent').textContent = `${memoryPercent.toFixed(1)}%`;
    document.getElementById('cpu-percent').textContent = `${cpuUsage.toFixed(1)}%`;

    const memoryElement = document.getElementById('memory-percent');
    const cpuElement = document.getElementById('cpu-percent');

    memoryElement.className = this.getMetricClass(memoryPercent, 70, 90);
    cpuElement.className = this.getMetricClass(cpuUsage, 70, 90);
  }

  updateDatabaseStatus() {
    const { health } = this.data;
    if (!health?.metrics?.database) return;

    const dbStatus = health.metrics.database.status;
    const responseTime = health.metrics.database.responseTime;

    const statusElement = document.getElementById('database-status');
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('span');

    dot.className = `status-dot ${dbStatus}`;
    text.textContent = this.getStatusText(dbStatus);

    document.getElementById('db-status-text').textContent = dbStatus.toUpperCase();
    document.getElementById('db-response-time').textContent = `${responseTime}ms`;
  }

  updateRequestsStats() {
    const { health } = this.data;
    if (!health?.metrics?.requests) return;

    const requests = health.metrics.requests;
    
    document.getElementById('requests-success').textContent = requests.success || 0;
    document.getElementById('requests-errors').textContent = requests.errors || 0;
  }

  updateEndpoints() {
    const { health } = this.data;
    if (!health?.metrics?.api?.topEndpoints) return;

    const endpointsContainer = document.getElementById('top-endpoints');
    const endpoints = health.metrics.api.topEndpoints;

    if (endpoints.length === 0) {
      endpointsContainer.innerHTML = '<div class="loading">Sin datos de endpoints</div>';
      return;
    }

    endpointsContainer.innerHTML = endpoints.map(endpoint => `
      <div class="endpoint-item">
        <span class="endpoint-path">${endpoint.endpoint}</span>
        <div class="endpoint-stats">
          <span class="endpoint-stat">Req: ${endpoint.requests}</span>
          <span class="endpoint-stat">Avg: ${endpoint.avgTime}ms</span>
          <span class="endpoint-stat">Err: ${endpoint.errorRate}%</span>
        </div>
      </div>
    `).join('');
  }

  updateAlerts() {
    const { alerts } = this.data;
    if (!alerts) return;

    const alertsPanel = document.getElementById('alerts-panel');
    const alertsList = document.getElementById('alerts-list');

    const activeAlerts = alerts.alerts.filter(alert => !alert.acknowledged);

    if (activeAlerts.length === 0) {
      alertsPanel.style.display = 'none';
      return;
    }

    alertsPanel.style.display = 'block';
    alertsPanel.className = `dashboard-alerts ${activeAlerts.some(a => a.level === 'critical') ? 'critical' : ''}`;

    alertsList.innerHTML = activeAlerts.map(alert => `
      <div class="alert-item ${alert.level}">
        <div>
          <strong>${alert.level.toUpperCase()}</strong>: ${alert.message}
          <br><small>${new Date(alert.timestamp).toLocaleString()}</small>
        </div>
        <button class="alert-acknowledge" onclick="monitoringDashboard.acknowledgeAlert('${alert.id}')">
          Reconocer
        </button>
      </div>
    `).join('');

    if (this.config.alertSound && activeAlerts.some(a => a.level === 'critical')) {
      this.playAlertSound();
    }
  }

  async acknowledgeAlert(alertId) {
    try {
      await fetch('/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge', alertId })
      });
      
      this.refresh();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('span');

    const statusMap = {
      connected: { class: 'healthy', text: 'Conectado' },
      connecting: { class: 'warning', text: 'Conectando...' },
      disconnected: { class: 'unknown', text: 'Desconectado' },
      error: { class: 'critical', text: 'Error de conexión' }
    };

    const statusInfo = statusMap[status] || statusMap.error;
    dot.className = `status-dot ${statusInfo.class}`;
    text.textContent = statusInfo.text;
  }

  updateLastUpdate() {
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
  }

  getStatusText(status) {
    const statusMap = {
      healthy: 'Saludable',
      warning: 'Advertencia',
      critical: 'Crítico',
      degraded: 'Degradado',
      unknown: 'Desconocido',
      error: 'Error'
    };
    return statusMap[status] || 'Desconocido';
  }

  getMetricClass(value, warning, critical) {
    if (value >= critical) return 'metric-value critical';
    if (value >= warning) return 'metric-value warning';
    return 'metric-value';
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  async exportData() {
    try {
      const response = await fetch('/metrics?format=json&hours=24');
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `metrics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos');
    }
  }

  playAlertSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D2ul4dDD+Y2/LNeisFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFApGnt/2ul4dCj+Y2/LNeSsFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFApGnt/2ul4dCj+Y2/LNeSsFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFAlFnt/2ul4dCj+Y2/LNeSsFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFAlFnt/2ul4dCj+Y2/LNeSsFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFAlFnt/2ul4dCj+Y2/LNeSsFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFAlFnt/2ul4dCj+Y2/LNeSsFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFAlFnt/2ul4dCj+Y2/LNeSsFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFAlFnt/2ul4dCj+Y2/LNeSsFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFAlFnt/2ul4dCj+Y2/LNeSsFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFAlFnt/2ul4dCj+Y2/LNeSsFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFAlFnt/2ul4dCj+Y2/LNeSsFJoPO8diJOAYYZrvt559NEAxQp+PwtmMdAjeP1fLNeSsFJH3J8N2QQAoUXrTp66hVFAlFnt/2ul4dCj9YvKL7');
      audio.play().catch(() => {});
    } catch (error) {
    }
  }

  destroy() {
    this.stop();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

if (typeof window !== 'undefined') {
  window.MonitoringDashboard = MonitoringDashboard;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MonitoringDashboard;
}