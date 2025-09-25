// scripts/mastermod/securityValidator.js
import fs from 'fs/promises';
import path from 'path';

import { glob } from 'glob';

export class SecurityValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Seguridad Enterprise - OWASP Top 10';
    this.securityMetrics = {
      owaspTop10: {
        a01: { name: 'Broken Access Control', score: 0, issues: [] },
        a02: { name: 'Cryptographic Failures', score: 0, issues: [] },
        a03: { name: 'Injection', score: 0, issues: [] },
        a04: { name: 'Insecure Design', score: 0, issues: [] },
        a05: { name: 'Security Misconfiguration', score: 0, issues: [] },
        a06: { name: 'Vulnerable Components', score: 0, issues: [] },
        a07: { name: 'Authentication Failures', score: 0, issues: [] },
        a08: { name: 'Software Integrity Failures', score: 0, issues: [] },
        a09: { name: 'Security Logging Failures', score: 0, issues: [] },
        a10: { name: 'Server-Side Request Forgery', score: 0, issues: [] }
      },
      overall: { score: 0, totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 }
    };
  }

  async validate() {
    const errors = [];

    try {
      // 🔐 OWASP TOP 10 VALIDATIONS
      await this.validateBrokenAccessControl(errors);
      await this.validateCryptographicFailures(errors);
      await this.validateInjectionVulnerabilities(errors);
      await this.validateInsecureDesign(errors);
      await this.validateSecurityMisconfiguration(errors);
      await this.validateVulnerableComponents(errors);
      await this.validateAuthenticationFailures(errors);
      await this.validateSoftwareIntegrity(errors);
      await this.validateSecurityLogging(errors);
      await this.validateSSRFVulnerabilities(errors);

      // 🔒 ADVANCED SECURITY VALIDATIONS
      await this.validateSecretsExposure(errors);
      await this.validateAuthPatterns(errors);
      await this.validateInputValidation(errors);
      await this.validateSecurityHeaders(errors);
      await this.validateSQLInjection(errors);
      await this.validateXSSVulnerabilities(errors);
      await this.validateCSRFProtection(errors);
      await this.validateSessionManagement(errors);
      await this.validateFileUploadSecurity(errors);
      await this.validateAPIKeySecurity(errors);

      // 📊 Calculate security score
      this.calculateSecurityScore();

      return {
        hasErrors: errors.length > 0,
        details: errors,
        metrics: this.securityMetrics,
        score: this.securityMetrics.overall.score,
        grade: this.getSecurityGrade()
      };
    } catch (error) {
      return {
        hasErrors: true,
        details: [`Error crítico en validación de seguridad: ${error.message}`],
        metrics: this.securityMetrics,
        score: 0,
        grade: 'F'
      };
    }
  }

  // 🔐 A01:2021 - BROKEN ACCESS CONTROL
  async validateBrokenAccessControl(errors) {
    const routeFiles = await glob('src/app/routes/*.ts', { cwd: this.projectRoot });

    for (const file of routeFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar rutas admin sin autenticación
      if (file.includes('admin') || file.includes('dashboard')) {
        if (!content.includes('auth') && !content.includes('Auth') &&
            !content.includes('authenticate') && !content.includes('protect')) {
          this.addSecurityIssue('a01', 'high', `🔒 Ruta admin ${file} sin autenticación`);
          errors.push(`🔒 A01:2021 - Ruta admin sin autenticación: ${file}`);
        }
      }

      // Verificar autorización por roles
      if (content.includes('req.user') && !content.includes('role') && !content.includes('admin')) {
        this.addSecurityIssue('a01', 'medium', `🔒 Control de acceso insuficiente en ${file}`);
        errors.push(`🔒 A01:2021 - Control de acceso insuficiente: ${file}`);
      }
    }
  }

  // 🔐 A02:2021 - CRYPTOGRAPHIC FAILURES
  async validateCryptographicFailures(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar algoritmos criptográficos débiles
      if (content.includes('md5') || content.includes('sha1')) {
        this.addSecurityIssue('a02', 'high', `🔒 Algoritmo criptográfico débil en ${file}`);
        errors.push(`🔒 A02:2021 - Algoritmo débil: ${file}`);
      }

      // Verificar uso de HTTPS
      if (content.includes('http://') && !content.includes('localhost') && !content.includes('127.0.0.1')) {
        this.addSecurityIssue('a02', 'medium', `🔒 Protocolo HTTP inseguro en ${file}`);
        errors.push(`🔒 A02:2021 - HTTP inseguro: ${file}`);
      }
    }
  }

  // 🔐 A03:2021 - INJECTION
  async validateInjectionVulnerabilities(errors) {
    const serviceFiles = await glob('src/services/*.ts', { cwd: this.projectRoot });

    for (const file of serviceFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // SQL Injection patterns
        if ((line.includes('SELECT') || line.includes('INSERT') ||
             line.includes('UPDATE') || line.includes('DELETE')) &&
            (line.includes('${') || line.includes('" + ') || line.includes('\' + '))) {
          this.addSecurityIssue('a03', 'critical', `🔒 SQL Injection en ${file}:${lineNumber}`);
          errors.push(`🔒 A03:2021 - SQL Injection: ${file}:${lineNumber}`);
        }

        // Command injection
        if (line.includes('exec(') || line.includes('spawn(') || line.includes('eval(')) {
          this.addSecurityIssue('a03', 'high', `🔒 Command injection en ${file}:${lineNumber}`);
          errors.push(`🔒 A03:2021 - Command injection: ${file}:${lineNumber}`);
        }
      }
    }
  }

  // 🔐 A05:2021 - SECURITY MISCONFIGURATION
  async validateSecurityMisconfiguration(errors) {
    // Verificar package.json para dependencias vulnerables
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      // Verificar versiones de dependencias críticas
      const criticalDeps = ['express', 'jsonwebtoken', 'bcrypt', 'helmet', 'cors'];
      for (const dep of criticalDeps) {
        if (packageJson.dependencies?.[dep]) {
          const version = packageJson.dependencies[dep];
          if (version.includes('^') || version.includes('~')) {
            this.addSecurityIssue('a05', 'medium', `🔒 Dependencia ${dep} con versión flexible: ${version}`);
            errors.push(`🔒 A05:2021 - Dependencia flexible: ${dep}@${version}`);
          }
        }
      }
    } catch (error) {
      errors.push(`🔒 No se pudo verificar package.json: ${error.message}`);
    }

    // Verificar configuración de servidor
    const serverFile = path.join(this.projectRoot, 'src/app/server.ts');
    try {
      const content = await fs.readFile(serverFile, 'utf8');

      if (!content.includes('helmet')) {
        this.addSecurityIssue('a05', 'high', `🔒 Helmet no configurado`);
        errors.push(`🔒 A05:2021 - Helmet no configurado`);
      }

      if (!content.includes('cors')) {
        this.addSecurityIssue('a05', 'medium', `🔒 CORS no configurado`);
        errors.push(`🔒 A05:2021 - CORS no configurado`);
      }

      if (!content.includes('rateLimit')) {
        this.addSecurityIssue('a05', 'medium', `🔒 Rate limiting no configurado`);
        errors.push(`🔒 A05:2021 - Rate limiting no configurado`);
      }
    } catch (error) {
      errors.push(`🔒 No se pudo verificar configuración de servidor`);
    }
  }

  // 🔐 A06:2021 - VULNERABLE COMPONENTS
  async validateVulnerableComponents(errors) {
    // Verificar dependencias desactualizadas
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf8'));

      // Lista de dependencias conocidas como vulnerables
      const vulnerableDeps = {
        'lodash': '<4.17.21',
        'moment': '<2.29.0',
        'serialize-javascript': '<3.1.0'
      };

      for (const [dep, vulnerableVersion] of Object.entries(vulnerableDeps)) {
        if (packageJson.dependencies?.[dep]) {
          this.addSecurityIssue('a06', 'high', `🔒 Dependencia vulnerable: ${dep}`);
          errors.push(`🔒 A06:2021 - Dependencia vulnerable: ${dep}`);
        }
      }
    } catch (error) {
      errors.push(`🔒 No se pudo verificar dependencias vulnerables`);
    }
  }

  // 🔐 A07:2021 - AUTHENTICATION FAILURES
  async validateAuthenticationFailures(errors) {
    const authFiles = await glob('src/app/middleware/auth*.ts', { cwd: this.projectRoot });

    for (const file of authFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar configuración JWT
      if (content.includes('jwt')) {
        if (!content.includes('expiresIn') || !content.includes('algorithm')) {
          this.addSecurityIssue('a07', 'high', `🔒 Configuración JWT incompleta en ${file}`);
          errors.push(`🔒 A07:2021 - JWT mal configurado: ${file}`);
        }

        if (content.includes('HS256') && content.includes('secret')) {
          this.addSecurityIssue('a07', 'medium', `🔒 JWT con algoritmo simétrico en ${file}`);
          errors.push(`🔒 A07:2021 - JWT simétrico: ${file}`);
        }
      }

      // Verificar manejo de sesiones
      if (!content.includes('session') && !content.includes('token')) {
        this.addSecurityIssue('a07', 'medium', `🔒 Sin manejo de sesiones en ${file}`);
        errors.push(`🔒 A07:2021 - Sin manejo de sesiones: ${file}`);
      }
    }
  }

  // 🔐 A09:2021 - SECURITY LOGGING FAILURES
  async validateSecurityLogging(errors) {
    const logFiles = await glob('src/**/*.logger*.ts', { cwd: this.projectRoot });

    let hasSecurityLogging = false;
    for (const file of logFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      if (content.includes('auth') || content.includes('login') || content.includes('security')) {
        hasSecurityLogging = true;
        break;
      }
    }

    if (!hasSecurityLogging) {
      this.addSecurityIssue('a09', 'medium', `🔒 Sin logging de seguridad`);
      errors.push(`🔒 A09:2021 - Sin logging de seguridad`);
    }
  }

  // 🔐 A10:2021 - SERVER-SIDE REQUEST FORGERY
  async validateSSRFVulnerabilities(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar requests a URLs externas sin validación
      if (content.includes('fetch(') || content.includes('request(') || content.includes('axios')) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;

          if ((line.includes('http://') || line.includes('https://')) &&
              (line.includes('${') || line.includes('req.') || line.includes('user'))) {
            this.addSecurityIssue('a10', 'high', `🔒 SSRF potencial en ${file}:${lineNumber}`);
            errors.push(`🔒 A10:2021 - SSRF potencial: ${file}:${lineNumber}`);
          }
        }
      }
    }
  }

  // 🔒 ADVANCED SECURITY VALIDATIONS
  async validateSecretsExposure(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    // Patrones de secrets que no deben estar hardcodeados
    const secretPatterns = [
      /(?:password|pwd|secret|token|key|api_key)\s*[:=]\s*['"][^'"]+['"]/i,
      /SUPABASE_URL\s*[:=]\s*['"]https?:\/\/[^'"]+['"]/,
      /SUPABASE_.*KEY\s*[:=]\s*['"][^'"]+['"]/,
      /JWT_SECRET\s*[:=]\s*['"][^'"]+['"]/,
      /database.*password.*[:=].*['"][^'"]+['"]/i
    ];

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Ignorar comentarios
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
          continue;
        }

        for (const pattern of secretPatterns) {
          if (pattern.test(line)) {
            this.addSecurityIssue('a02', 'critical', `🔒 Secret hardcodeado en ${file}:${lineNumber}`);
            errors.push(`🔒 Secret hardcodeado en ${file}:${lineNumber} - "${line.trim()}"`);
          }
        }
      }
    }

    // Verificar archivo .env.example existe pero .env no está committeado
    try {
      await fs.access(path.join(this.projectRoot, '.env'));
      this.addSecurityIssue('a05', 'critical', `🔒 Archivo .env encontrado en repositorio`);
      errors.push(`🔒 Archivo .env encontrado - NO debe estar en el repositorio`);
    } catch (error) {
      // Está bien que no exista .env en el repo
    }
  }

  async validateAuthPatterns(errors) {
    const routeFiles = await glob('src/app/routes/*.ts', { cwd: this.projectRoot });

    for (const file of routeFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar que rutas protegidas usen middleware de autenticación
      if (content.includes('router.') &&
          (content.includes('delete') || content.includes('post') || content.includes('put'))) {

        if (!content.includes('auth') && !content.includes('Auth') &&
            !content.includes('authenticate') && !content.includes('protect')) {
          errors.push(`🔒 Ruta ${file} puede necesitar autenticación - Revisar rutas POST/PUT/DELETE`);
        }
      }

      // Verificar JWT sin validación
      if (content.includes('jwt.sign') && !content.includes('jwt.verify')) {
        errors.push(`🔒 ${file} firma JWT pero no valida - Verificar flujo de autenticación`);
      }
    }

    // Verificar middleware de autenticación existe
    const authMiddlewarePath = path.join(this.projectRoot, 'src/app/middleware/auth.ts');
    try {
      const authContent = await fs.readFile(authMiddlewarePath, 'utf8');

      if (!authContent.includes('jwt.verify') && !authContent.includes('verify')) {
        errors.push(`🔒 Middleware de autenticación no parece validar JWT correctamente`);
      }
    } catch (error) {
      errors.push(`🔒 Middleware de autenticación no encontrado en src/app/middleware/auth.ts`);
    }
  }

  async validateInputValidation(errors) {
    const controllerFiles = await glob('src/controllers/*.ts', { cwd: this.projectRoot });

    for (const file of controllerFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar que use express-validator
      if (content.includes('req.body') || content.includes('req.params') || content.includes('req.query')) {
        if (!content.includes('validationResult') && !content.includes('body(') &&
            !content.includes('param(') && !content.includes('query(')) {
          errors.push(`🔒 ${file} accede a datos de entrada sin validación - Usar express-validator`);
        }
      }

      // Verificar escape de HTML/XSS
      if (content.includes('innerHTML') || content.includes('outerHTML')) {
        errors.push(`🔒 ${file} usa innerHTML - Riesgo de XSS`);
      }
    }
  }

  async validateSecurityHeaders(errors) {
    const serverFile = path.join(this.projectRoot, 'src/app/server.ts');

    try {
      const content = await fs.readFile(serverFile, 'utf8');

      // Verificar helmet
      if (!content.includes('helmet')) {
        errors.push(`🔒 Server no usa helmet para headers de seguridad`);
      }

      // Verificar CORS configurado
      if (!content.includes('cors')) {
        errors.push(`🔒 Server no tiene CORS configurado`);
      }

      // Verificar rate limiting
      if (!content.includes('rateLimit') && !content.includes('express-rate-limit')) {
        errors.push(`🔒 Server no tiene rate limiting configurado`);
      }

    } catch (error) {
      errors.push(`🔒 No se pudo verificar configuración de seguridad en server.ts`);
    }
  }

  async validateSQLInjection(errors) {
    const serviceFiles = await glob('src/services/*.ts', { cwd: this.projectRoot });

    for (const file of serviceFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Buscar concatenación de strings en queries
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Patrones peligrosos de SQL injection
        if (line.includes('SELECT') || line.includes('INSERT') ||
            line.includes('UPDATE') || line.includes('DELETE')) {

          // Concatenación directa con variables
          if (line.includes('${') || line.includes('" + ') || line.includes('\' + ')) {
            this.addSecurityIssue('a03', 'critical', `🔒 SQL Injection en ${file}:${lineNumber}`);
            errors.push(`🔒 A03:2021 - SQL Injection: ${file}:${lineNumber} - "${line.trim()}"`);
          }
        }
      }

      // Verificar uso de parámetros preparados con Supabase
      if (content.includes('.eq(') || content.includes('.select(')) {
        // Supabase ORM es seguro por defecto, pero verificar raw queries
        if (content.includes('.rpc(') && content.includes('${')) {
          this.addSecurityIssue('a03', 'high', `🔒 RPC con interpolación en ${file}`);
          errors.push(`🔒 A03:2021 - RPC con interpolación: ${file} - Usar parámetros`);
        }
      }
    }
  }

  // 🔒 XSS VALIDATION
  async validateXSSVulnerabilities(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // XSS patterns
        if (line.includes('innerHTML') || line.includes('outerHTML')) {
          this.addSecurityIssue('a03', 'high', `🔒 XSS potencial en ${file}:${lineNumber}`);
          errors.push(`🔒 XSS potencial: ${file}:${lineNumber} - "${line.trim()}"`);
        }

        // Dangerous DOM manipulation
        if (line.includes('document.write') || line.includes('eval(')) {
          this.addSecurityIssue('a03', 'high', `🔒 DOM peligroso en ${file}:${lineNumber}`);
          errors.push(`🔒 DOM peligroso: ${file}:${lineNumber} - "${line.trim()}"`);
        }
      }
    }
  }

  // 🔒 CSRF PROTECTION
  async validateCSRFProtection(errors) {
    const serverFile = path.join(this.projectRoot, 'src/app/server.ts');

    try {
      const content = await fs.readFile(serverFile, 'utf8');

      if (!content.includes('csrf') && !content.includes('csurf')) {
        this.addSecurityIssue('a05', 'medium', `🔒 Sin protección CSRF`);
        errors.push(`🔒 Sin protección CSRF en server.ts`);
      }
    } catch (error) {
      errors.push(`🔒 No se pudo verificar protección CSRF`);
    }
  }

  // 🔒 SESSION MANAGEMENT
  async validateSessionManagement(errors) {
    const authFiles = await glob('src/app/middleware/auth*.ts', { cwd: this.projectRoot });

    for (const file of authFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar configuración de cookies seguras
      if (content.includes('cookie') || content.includes('session')) {
        if (!content.includes('secure') || !content.includes('httpOnly')) {
          this.addSecurityIssue('a07', 'medium', `🔒 Cookies inseguras en ${file}`);
          errors.push(`🔒 A07:2021 - Cookies inseguras: ${file}`);
        }

        if (!content.includes('sameSite')) {
          this.addSecurityIssue('a07', 'low', `🔒 Sin sameSite en ${file}`);
          errors.push(`🔒 Sin sameSite: ${file}`);
        }
      }
    }
  }

  // 🔒 FILE UPLOAD SECURITY
  async validateFileUploadSecurity(errors) {
    const uploadFiles = await glob('src/**/*upload*.ts', { cwd: this.projectRoot });

    for (const file of uploadFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar validación de tipos de archivo
      if (content.includes('upload') || content.includes('multer')) {
        if (!content.includes('mimetype') && !content.includes('fileType')) {
          this.addSecurityIssue('a05', 'high', `🔒 Upload sin validación de tipo en ${file}`);
          errors.push(`🔒 Upload sin validación: ${file}`);
        }

        // Verificar límites de tamaño
        if (!content.includes('limits') && !content.includes('fileSize')) {
          this.addSecurityIssue('a05', 'medium', `🔒 Upload sin límites de tamaño en ${file}`);
          errors.push(`🔒 Upload sin límites: ${file}`);
        }
      }
    }
  }

  // 🔒 API KEY SECURITY
  async validateAPIKeySecurity(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of allFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar API keys en código
      const apiKeyPatterns = [
        /api[_-]?key/i,
        /x-api-key/i,
        /authorization.*bearer/i
      ];

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        for (const pattern of apiKeyPatterns) {
          if (pattern.test(line) && (line.includes('=') || line.includes(':'))) {
            this.addSecurityIssue('a02', 'high', `🔒 API Key expuesta en ${file}:${lineNumber}`);
            errors.push(`🔒 API Key expuesta: ${file}:${lineNumber}`);
          }
        }
      }
    }
  }

  // 🔒 UTILITY METHODS
  addSecurityIssue(owaspCategory, severity, message) {
    const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityLevel = severityMap[severity] || 1;

    this.securityMetrics.owaspTop10[owaspCategory].score += severityLevel;
    this.securityMetrics.owaspTop10[owaspCategory].issues.push(message);
    this.securityMetrics.overall.totalIssues++;

    if (severity === 'critical') this.securityMetrics.overall.critical++;
    else if (severity === 'high') this.securityMetrics.overall.high++;
    else if (severity === 'medium') this.securityMetrics.overall.medium++;
    else if (severity === 'low') this.securityMetrics.overall.low++;
  }

  calculateSecurityScore() {
    const totalPossible = Object.keys(this.securityMetrics.owaspTop10).length * 4;
    const totalScore = Object.values(this.securityMetrics.owaspTop10)
      .reduce((sum, cat) => sum + cat.score, 0);

    this.securityMetrics.overall.score = Math.max(0, 100 - (totalScore / totalPossible * 100));
  }

  getSecurityGrade() {
    const score = this.securityMetrics.overall.score;
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
}