// scripts/mastermod/performanceValidator.js
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export class PerformanceValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Rendimiento Enterprise - Métricas Avanzadas';
    this.performanceMetrics = {
      webVitals: {
        lcp: { score: 0, issues: [] }, // Largest Contentful Paint
        fid: { score: 0, issues: [] }, // First Input Delay
        cls: { score: 0, issues: [] }, // Cumulative Layout Shift
        fcp: { score: 0, issues: [] }, // First Contentful Paint
        ttfb: { score: 0, issues: [] } // Time to First Byte
      },
      memory: {
        score: 0,
        issues: [],
        leaks: [],
        optimizations: []
      },
      network: {
        score: 0,
        issues: [],
        optimizations: []
      },
      database: {
        score: 0,
        issues: [],
        optimizations: []
      },
      frontend: {
        score: 0,
        bundleSize: 0,
        issues: [],
        optimizations: []
      },
      backend: {
        score: 0,
        issues: [],
        optimizations: []
      },
      overall: {
        score: 0,
        grade: 'F',
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };
  }

  async validate() {
    const errors = [];

    try {
      // 📊 WEB VITALS & CORE PERFORMANCE
      await this.validateWebVitals(errors);
      await this.validateCoreWebVitals(errors);

      // 💾 MEMORY & CPU ANALYSIS
      await this.validateMemoryPerformance(errors);
      await this.validateCPUPerformance(errors);

      // 🌐 NETWORK & CACHING
      await this.validateNetworkPerformance(errors);
      await this.validateCachingStrategies(errors);

      // 🗄️ DATABASE PERFORMANCE
      await this.validateDatabasePerformance(errors);
      await this.validateQueryOptimization(errors);

      // ⚛️ FRONTEND PERFORMANCE
      await this.validateBundleSize(errors);
      await this.validateFrontendOptimizations(errors);

      // 🔧 BACKEND PERFORMANCE
      await this.validateBackendPerformance(errors);
      await this.validateConcurrencyPatterns(errors);

      // 📈 SCALABILITY & INFRASTRUCTURE
      await this.validateScalabilityMetrics(errors);
      await this.validateInfrastructureOptimizations(errors);

      // 📊 Calculate overall performance score
      this.calculatePerformanceScore();

      return {
        hasErrors: errors.length > 0,
        details: errors,
        metrics: this.performanceMetrics,
        score: this.performanceMetrics.overall.score,
        grade: this.performanceMetrics.overall.grade
      };
    } catch (error) {
      return {
        hasErrors: true,
        details: [`Error crítico en validación de rendimiento: ${error.message}`],
        metrics: this.performanceMetrics,
        score: 0,
        grade: 'F'
      };
    }
  }

  // 📊 WEB VITALS VALIDATION
  async validateWebVitals(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // LCP (Largest Contentful Paint) - Image optimization
      if (content.includes('<img') || content.includes('Image(')) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;

          if (line.includes('<img') && !line.includes('loading="lazy"') && !line.includes('loading="eager"')) {
            this.addPerformanceIssue('webVitals', 'lcp', 'medium', `🖼️ Imagen sin lazy loading en ${file}:${lineNumber}`);
            errors.push(`🖼️ LCP: Imagen sin lazy loading: ${file}:${lineNumber}`);
          }

          if (line.includes('width=') && line.includes('height=')) {
            this.addPerformanceIssue('webVitals', 'lcp', 'low', `🖼️ Imagen con dimensiones en ${file}:${lineNumber}`);
          }
        }
      }

      // FID (First Input Delay) - Long tasks
      if (content.includes('addEventListener') && content.includes('click')) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;

          if (line.includes('addEventListener') && line.includes('click')) {
            // Check for heavy operations in click handlers
            const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\n');
            if (nextLines.includes('await ') || nextLines.includes('fetch(') || nextLines.includes('querySelectorAll')) {
              this.addPerformanceIssue('webVitals', 'fid', 'medium', `⚡ Click handler pesado en ${file}:${lineNumber}`);
              errors.push(`⚡ FID: Click handler pesado: ${file}:${lineNumber}`);
            }
          }
        }
      }

      // CLS (Cumulative Layout Shift) - Layout stability
      if (content.includes('innerHTML') || content.includes('appendChild') || content.includes('insertAdjacentHTML')) {
        this.addPerformanceIssue('webVitals', 'cls', 'medium', `📐 Contenido dinámico sin dimensiones en ${file}`);
        errors.push(`📐 CLS: Contenido dinámico sin dimensiones: ${file}`);
      }
    }
  }

  // ⚡ CORE WEB VITALS VALIDATION
  async validateCoreWebVitals(errors) {
    // TTFB (Time to First Byte) - Server response time
    const serverFile = path.join(this.projectRoot, 'src/app/server.ts');
    try {
      const content = await fs.readFile(serverFile, 'utf8');

      if (!content.includes('compression')) {
        this.addPerformanceIssue('webVitals', 'ttfb', 'medium', `⚡ Sin compresión GZIP`);
        errors.push(`⚡ TTFB: Sin compresión GZIP`);
      }

      if (!content.includes('helmet')) {
        this.addPerformanceIssue('webVitals', 'ttfb', 'low', `⚡ Headers de seguridad faltantes`);
        errors.push(`⚡ TTFB: Headers de seguridad faltantes`);
      }
    } catch (error) {
      errors.push(`⚡ No se pudo verificar TTFB optimizaciones`);
    }

    // FCP (First Contentful Paint) - Critical CSS
    const cssFiles = await glob('public/css/*.css', { cwd: this.projectRoot });
    let totalCSSSize = 0;

    for (const file of cssFiles) {
      const filePath = path.join(this.projectRoot, file);
      const stats = await fs.stat(filePath);
      totalCSSSize += stats.size;
    }

    if (totalCSSSize > 100 * 1024) { // 100KB
      this.addPerformanceIssue('webVitals', 'fcp', 'high', `🎨 CSS crítico muy grande: ${(totalCSSSize / 1024).toFixed(1)}KB`);
      errors.push(`🎨 FCP: CSS crítico muy grande: ${(totalCSSSize / 1024).toFixed(1)}KB`);
    }
  }

  // 💾 MEMORY PERFORMANCE VALIDATION
  async validateMemoryPerformance(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Memory leaks detection
      if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
        this.addPerformanceIssue('memory', 'high', `💾 Event listener leak en ${file}`);
        errors.push(`💾 Memory Leak: Event listener sin cleanup: ${file}`);
      }

      if (content.includes('setInterval') && !content.includes('clearInterval')) {
        this.addPerformanceIssue('memory', 'high', `💾 Interval leak en ${file}`);
        errors.push(`💾 Memory Leak: setInterval sin clearInterval: ${file}`);
      }

      // Large data structures
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        if (line.includes('new Array(') && line.includes('1000')) {
          this.addPerformanceIssue('memory', 'medium', `💾 Array grande en ${file}:${lineNumber}`);
          errors.push(`💾 Large Array: ${file}:${lineNumber}`);
        }

        if (line.includes('JSON.parse') || line.includes('JSON.stringify')) {
          this.addPerformanceIssue('memory', 'low', `💾 JSON operation en ${file}:${lineNumber}`);
          errors.push(`💾 JSON Operation: ${file}:${lineNumber}`);
        }
      }
    }
  }

  // 🖥️ CPU PERFORMANCE VALIDATION
  async validateCPUPerformance(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Heavy computations
      if (content.includes('for (') && content.includes('1000')) {
        this.addPerformanceIssue('memory', 'medium', `🖥️ Loop pesado en ${file}`);
        errors.push(`🖥️ Heavy Loop: ${file}`);
      }

      // Recursive functions without optimization
      if (content.includes('function') && content.includes('return') && content.includes('arguments.callee')) {
        this.addPerformanceIssue('memory', 'high', `🖥️ Recursión no optimizada en ${file}`);
        errors.push(`🖥️ Unoptimized Recursion: ${file}`);
      }

      // Synchronous operations that should be async
      if (content.includes('forEach') && content.includes('await')) {
        this.addPerformanceIssue('memory', 'medium', `🖥️ await en loop en ${file}`);
        errors.push(`🖥️ await in loop: ${file}`);
      }
    }
  }

  // 🌐 NETWORK PERFORMANCE VALIDATION
  async validateNetworkPerformance(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Multiple sequential network requests
      const fetchCount = (content.match(/fetch\(/g) || []).length;
      if (fetchCount > 3) {
        this.addPerformanceIssue('network', 'medium', `🌐 Múltiples fetch secuenciales en ${file}`);
        errors.push(`🌐 Sequential fetch: ${file} (${fetchCount} requests)`);
      }

      // Missing error handling for network requests
      if (content.includes('fetch(') && !content.includes('catch')) {
        this.addPerformanceIssue('network', 'medium', `🌐 fetch sin error handling en ${file}`);
        errors.push(`🌐 No error handling: ${file}`);
      }

      // Large payloads
      if (content.includes('JSON.stringify') && content.includes('data')) {
        this.addPerformanceIssue('network', 'low', `🌐 Posible payload grande en ${file}`);
        errors.push(`🌐 Large payload: ${file}`);
      }
    }
  }

  // 📦 BUNDLE SIZE & FRONTEND OPTIMIZATION
  async validateBundleSize(errors) {
    const distPath = path.join(this.projectRoot, 'dist');

    try {
      await fs.access(distPath);

      let totalBundleSize = 0;
      const jsFiles = await glob('dist/**/*.js', { cwd: this.projectRoot });

      for (const file of jsFiles) {
        const filePath = path.join(this.projectRoot, file);
        const stats = await fs.stat(filePath);
        const sizeKB = stats.size / 1024;
        totalBundleSize += sizeKB;

        if (sizeKB > 500) {
          this.addPerformanceIssue('frontend', 'high', `📦 Bundle grande: ${file} (${sizeKB.toFixed(1)}KB)`);
          errors.push(`📦 Large bundle: ${file} (${sizeKB.toFixed(1)}KB)`);
        }
      }

      this.performanceMetrics.frontend.bundleSize = totalBundleSize;

      if (totalBundleSize > 2000) { // 2MB
        this.addPerformanceIssue('frontend', 'critical', `📦 Bundle total muy grande: ${(totalBundleSize / 1024).toFixed(1)}MB`);
        errors.push(`📦 Total bundle size: ${(totalBundleSize / 1024).toFixed(1)}MB`);
      }

      // CSS bundle size
      const cssFiles = await glob('public/css/*.css', { cwd: this.projectRoot });
      for (const file of cssFiles) {
        const filePath = path.join(this.projectRoot, file);
        const stats = await fs.stat(filePath);
        const sizeKB = stats.size / 1024;

        if (sizeKB > 200) {
          this.addPerformanceIssue('frontend', 'medium', `📦 CSS grande: ${file} (${sizeKB.toFixed(1)}KB)`);
          errors.push(`📦 Large CSS: ${file} (${sizeKB.toFixed(1)}KB)`);
        }
      }

    } catch (error) {
      this.addPerformanceIssue('frontend', 'low', `📦 No se pudo analizar dist/ - Ejecutar build primero`);
      errors.push(`📦 Build analysis: Ejecutar npm run build primero`);
    }
  }

  async validateDatabaseQueries(errors) {
    const serviceFiles = await glob('src/services/*.ts', { cwd: this.projectRoot });

    for (const file of serviceFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Detectar loops con queries dentro
      const lines = content.split('\n');
      let inLoop = false;
      let loopLevel = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        const trimmedLine = line.trim();

        // Detectar inicio de loops
        if (trimmedLine.includes('for (') || trimmedLine.includes('for(') ||
            trimmedLine.includes('.forEach') || trimmedLine.includes('.map(')) {
          inLoop = true;
          loopLevel++;
        }

        // Detectar queries dentro de loops
        if (inLoop && (
          trimmedLine.includes('.select(') ||
          trimmedLine.includes('.insert(') ||
          trimmedLine.includes('.update(') ||
          trimmedLine.includes('.delete(') ||
          trimmedLine.includes('await ') && trimmedLine.includes('Service')
        )) {
          errors.push(`⚡ Posible N+1 query en ${file}:${lineNumber} - Query dentro de loop`);
        }

        // Detectar fin de loops
        if (line.includes('}')) {
          loopLevel--;
          if (loopLevel <= 0) {
            inLoop = false;
            loopLevel = 0;
          }
        }
      }

      // Detectar falta de batch operations
      const selectCount = (content.match(/\.select\(/g) || []).length;
      if (selectCount > 5) {
        errors.push(`⚡ Muchas queries individuales en ${file} (${selectCount}) - Considerar batch operations`);
      }

      // Verificar uso de transacciones para operaciones múltiples
      if ((content.includes('.insert(') && content.includes('.update(')) &&
          !content.includes('transaction') && !content.includes('atomic')) {
        errors.push(`⚡ ${file} hace múltiples operaciones sin transacción - Considerar atomicidad`);
      }
    }
  }

  async validateMemoryLeaks(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Detectar event listeners sin cleanup
      if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
        errors.push(`⚡ Event listener sin cleanup en ${file} - Posible memory leak`);
      }

      // Detectar intervalos sin clear
      if (content.includes('setInterval') && !content.includes('clearInterval')) {
        errors.push(`⚡ setInterval sin clearInterval en ${file} - Memory leak`);
      }

      // Detectar timeouts sin clear
      if (content.includes('setTimeout') && content.includes('clearTimeout')) {
        // Esto está bien, pero verificar patrones
      }

      // Detectar closures que pueden retener referencias
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Variables grandes en closures
        if (line.includes('const ') && line.includes('= new Array(') ||
            line.includes('= new Map(') || line.includes('= new Set(')) {
          if (i < lines.length - 10) { // Si no está cerca del final de la función
            errors.push(`⚡ Estructura de datos grande en ${file}:${lineNumber} - Verificar lifecycle`);
          }
        }
      }
    }
  }

  async validateAsyncPatterns(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Detectar async sin await
        if (line.includes('async ') && !content.includes('await')) {
          errors.push(`⚡ Función async sin await en ${file}:${lineNumber} - Innecesario`);
        }

        // Detectar Promise sin manejo de errores
        if (line.includes('new Promise') && !line.includes('catch') &&
            !content.substring(content.indexOf(line)).includes('.catch(')) {
          errors.push(`⚡ Promise sin manejo de errores en ${file}:${lineNumber}`);
        }

        // Detectar await en loops (ineficiente)
        if (line.includes('for (') || line.includes('forEach')) {
          const nextLines = lines.slice(i, i + 10).join('\n');
          if (nextLines.includes('await ') && !nextLines.includes('Promise.all')) {
            errors.push(`⚡ await secuencial en loop en ${file}:${lineNumber} - Usar Promise.all`);
          }
        }

        // Detectar Promise.all mal usado
        if (line.includes('Promise.all') && line.includes('await')) {
          const promises = (line.match(/await\s+/g) || []).length;
          if (promises > 1) {
            errors.push(`⚡ Múltiples await con Promise.all en ${file}:${lineNumber} - Redundante`);
          }
        }
      }
    }
  }

  // 📈 UTILITY METHODS FOR PERFORMANCE METRICS
  addPerformanceIssue(category, metric, severity, message) {
    const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityLevel = severityMap[severity] || 1;

    if (category === 'webVitals') {
      this.performanceMetrics.webVitals[metric].score += severityLevel;
      this.performanceMetrics.webVitals[metric].issues.push(message);
    } else {
      this.performanceMetrics[category].score += severityLevel;
      this.performanceMetrics[category].issues.push(message);
    }

    this.performanceMetrics.overall.totalIssues++;
    if (severity === 'critical') this.performanceMetrics.overall.critical++;
    else if (severity === 'high') this.performanceMetrics.overall.high++;
    else if (severity === 'medium') this.performanceMetrics.overall.medium++;
    else if (severity === 'low') this.performanceMetrics.overall.low++;
  }

  calculatePerformanceScore() {
    const webVitalsScore = this.calculateWebVitalsScore();
    const memoryScore = Math.max(0, 100 - (this.performanceMetrics.memory.score * 10));
    const networkScore = Math.max(0, 100 - (this.performanceMetrics.network.score * 10));
    const databaseScore = Math.max(0, 100 - (this.performanceMetrics.database.score * 10));
    const frontendScore = Math.max(0, 100 - (this.performanceMetrics.frontend.score * 10));
    const backendScore = Math.max(0, 100 - (this.performanceMetrics.backend.score * 10));

    const overallScore = (
      webVitalsScore * 0.25 +
      memoryScore * 0.15 +
      networkScore * 0.15 +
      databaseScore * 0.15 +
      frontendScore * 0.15 +
      backendScore * 0.15
    );

    this.performanceMetrics.overall.score = Math.round(overallScore);
    this.performanceMetrics.overall.grade = this.getPerformanceGrade(overallScore);
  }

  calculateWebVitalsScore() {
    const lcpScore = Math.max(0, 100 - (this.performanceMetrics.webVitals.lcp.score * 20));
    const fidScore = Math.max(0, 100 - (this.performanceMetrics.webVitals.fid.score * 20));
    const clsScore = Math.max(0, 100 - (this.performanceMetrics.webVitals.cls.score * 20));
    const fcpScore = Math.max(0, 100 - (this.performanceMetrics.webVitals.fcp.score * 20));
    const ttfbScore = Math.max(0, 100 - (this.performanceMetrics.webVitals.ttfb.score * 20));

    return (lcpScore + fidScore + clsScore + fcpScore + ttfbScore) / 5;
  }

  getPerformanceGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    return 'F';
  }

  // 📊 ADDITIONAL PERFORMANCE VALIDATIONS
  async validateCachingStrategies(errors) {
    const serverFile = path.join(this.projectRoot, 'src/app/server.ts');

    try {
      const content = await fs.readFile(serverFile, 'utf8');

      if (!content.includes('cache')) {
        this.addPerformanceIssue('network', 'medium', `📦 Sin estrategia de caching`);
        errors.push(`📦 No caching strategy found`);
      }

      if (!content.includes('redis') && !content.includes('memcached')) {
        this.addPerformanceIssue('network', 'low', `📦 Sin cache distribuido`);
        errors.push(`📦 No distributed cache found`);
      }
    } catch (error) {
      errors.push(`📦 No se pudo verificar caching strategies`);
    }
  }

  async validateDatabasePerformance(errors) {
    const serviceFiles = await glob('src/services/*.ts', { cwd: this.projectRoot });

    for (const file of serviceFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // N+1 queries detection
      const selectCount = (content.match(/\.select\(/g) || []).length;
      if (selectCount > 5) {
        this.addPerformanceIssue('database', 'high', `🗄️ Múltiples queries: ${file} (${selectCount})`);
        errors.push(`🗄️ N+1 potential: ${file} (${selectCount} queries)`);
      }

      // Missing indexes (heuristic)
      if (content.includes('.eq(') && content.includes('created_at')) {
        this.addPerformanceIssue('database', 'medium', `🗄️ Query por fecha sin índice: ${file}`);
        errors.push(`🗄️ Date query without index: ${file}`);
      }
    }
  }

  async validateQueryOptimization(errors) {
    const serviceFiles = await glob('src/services/*.ts', { cwd: this.projectRoot });

    for (const file of serviceFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Inefficient queries
      if (content.includes('select(') && content.includes('*')) {
        this.addPerformanceIssue('database', 'medium', `🗄️ SELECT * en ${file}`);
        errors.push(`🗄️ SELECT * found: ${file}`);
      }

      // Missing pagination
      if (content.includes('select(') && !content.includes('limit(') && !content.includes('range(')) {
        this.addPerformanceIssue('database', 'low', `🗄️ Query sin límite: ${file}`);
        errors.push(`🗄️ Query without limit: ${file}`);
      }
    }
  }

  async validateFrontendOptimizations(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Missing code splitting
      if (content.includes('import ') && content.length > 1000) {
        this.addPerformanceIssue('frontend', 'medium', `📦 Archivo grande sin code splitting: ${file}`);
        errors.push(`📦 Large file without code splitting: ${file}`);
      }

      // Missing lazy loading
      if (content.includes('React') && content.includes('import') && !content.includes('lazy')) {
        this.addPerformanceIssue('frontend', 'low', `📦 Sin lazy loading: ${file}`);
        errors.push(`📦 No lazy loading: ${file}`);
      }
    }
  }

  async validateBackendPerformance(errors) {
    const serverFile = path.join(this.projectRoot, 'src/app/server.ts');

    try {
      const content = await fs.readFile(serverFile, 'utf8');

      // Missing connection pooling
      if (!content.includes('pool') && content.includes('database')) {
        this.addPerformanceIssue('backend', 'high', `🔧 Sin connection pooling`);
        errors.push(`🔧 No connection pooling`);
      }

      // Missing rate limiting
      if (!content.includes('rate') && !content.includes('limit')) {
        this.addPerformanceIssue('backend', 'medium', `🔧 Sin rate limiting`);
        errors.push(`🔧 No rate limiting`);
      }

      // Missing monitoring
      if (!content.includes('metrics') && !content.includes('monitoring')) {
        this.addPerformanceIssue('backend', 'low', `🔧 Sin monitoring`);
        errors.push(`🔧 No monitoring`);
      }
    } catch (error) {
      errors.push(`🔧 No se pudo verificar backend performance`);
    }
  }

  async validateConcurrencyPatterns(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Race conditions
      if (content.includes('async') && content.includes('shared') && !content.includes('lock')) {
        this.addPerformanceIssue('backend', 'high', `🔧 Posible race condition: ${file}`);
        errors.push(`🔧 Race condition potential: ${file}`);
      }

      // Deadlock potential
      if (content.includes('await') && content.includes('lock') && content.includes('database')) {
        this.addPerformanceIssue('backend', 'medium', `🔧 Posible deadlock: ${file}`);
        errors.push(`🔧 Deadlock potential: ${file}`);
      }
    }
  }

  async validateScalabilityMetrics(errors) {
    const serverFile = path.join(this.projectRoot, 'src/app/server.ts');

    try {
      const content = await fs.readFile(serverFile, 'utf8');

      // Horizontal scaling
      if (!content.includes('cluster') && !content.includes('pm2')) {
        this.addPerformanceIssue('backend', 'medium', `📈 Sin clustering para escalabilidad`);
        errors.push(`📈 No clustering for scalability`);
      }

      // Load balancing
      if (!content.includes('nginx') && !content.includes('load')) {
        this.addPerformanceIssue('backend', 'low', `📈 Sin configuración de load balancing`);
        errors.push(`📈 No load balancing configuration`);
      }
    } catch (error) {
      errors.push(`📈 No se pudo verificar escalabilidad`);
    }
  }

  async validateInfrastructureOptimizations(errors) {
    // Check for CDN configuration
    const publicFiles = await glob('public/**/*', { cwd: this.projectRoot });

    if (publicFiles.length > 50) {
      this.addPerformanceIssue('network', 'medium', `🌐 Muchos archivos estáticos - Considerar CDN`);
      errors.push(`🌐 Many static files - Consider CDN`);
    }

    // Check for Docker configuration
    try {
      await fs.access(path.join(this.projectRoot, 'Dockerfile'));
      this.addPerformanceIssue('backend', 'low', `🐳 Dockerfile encontrado - Verificar optimizaciones`);
      errors.push(`🐳 Dockerfile found - Check optimizations`);
    } catch (error) {
      // No Dockerfile found
    }
  }
}