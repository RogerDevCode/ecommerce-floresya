// scripts/mastermod/testingValidator.js
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export class TestingValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Testing y Cobertura de Código';
    this.testingMetrics = {
      coverage: {
        statements: { covered: 0, total: 0, percentage: 0 },
        branches: { covered: 0, total: 0, percentage: 0 },
        functions: { covered: 0, total: 0, percentage: 0 },
        lines: { covered: 0, total: 0, percentage: 0 }
      },
      quality: {
        score: 0,
        issues: [],
        recommendations: []
      },
      structure: {
        score: 0,
        issues: [],
        bestPractices: []
      },
      overall: {
        score: 0,
        grade: 'F',
        totalTests: 0,
        testFiles: 0,
        coverageScore: 0,
        qualityScore: 0,
        structureScore: 0
      }
    };
  }

  async validate() {
    const errors = [];

    try {
      // 📊 COBERTURA DE CÓDIGO
      await this.validateCoverageRequirements(errors);

      // 🧪 ESTRUCTURA Y CALIDAD DE TESTS
      await this.validateTestStructure(errors);
      await this.validateTestQuality(errors);

      // 🔍 COBERTURA DE FUNCIONALIDADES
      await this.validateFeatureCoverage(errors);
      await this.validateEdgeCaseCoverage(errors);

      // 📋 MEJORES PRÁCTICAS
      await this.validateTestingBestPractices(errors);
      await this.validateTestDataManagement(errors);

      // 🏗️ INTEGRACIÓN Y AUTOMATIZACIÓN
      await this.validateTestAutomation(errors);
      await this.validateCIIntegration(errors);

      // 📈 Calcular métricas generales
      this.calculateTestingScore();

      return {
        hasErrors: errors.length > 0,
        details: errors,
        metrics: this.testingMetrics,
        score: this.testingMetrics.overall.score,
        grade: this.testingMetrics.overall.grade
      };
    } catch (error) {
      return {
        hasErrors: true,
        details: [`Error crítico en validación de testing: ${error.message}`],
        metrics: this.testingMetrics,
        score: 0,
        grade: 'F'
      };
    }
  }

  // 📊 VALIDACIÓN DE COBERTURA
  async validateCoverageRequirements(errors) {
    const testFiles = await glob('tests/**/*.test.ts', { cwd: this.projectRoot });
    const sourceFiles = await glob('src/**/*.{ts,js}', { cwd: this.projectRoot });

    this.testingMetrics.overall.testFiles = testFiles.length;
    this.testingMetrics.overall.totalTests = testFiles.length;

    // Verificar cobertura básica
    const testToSourceRatio = testFiles.length / sourceFiles.length;
    if (testToSourceRatio < 0.3) {
      this.addTestingIssue('coverage', 'high', `📊 Baja cobertura de tests: ${testToSourceRatio.toFixed(2)} ratio`);
      errors.push(`📊 Baja cobertura: ${testFiles.length} tests para ${sourceFiles.length} archivos fuente`);
    }

    // Verificar archivos sin tests
    const sourceFilesWithoutTests = [];
    for (const sourceFile of sourceFiles) {
      const testFileName = sourceFile.replace(/\.ts$/, '.test.ts').replace('src/', 'tests/');
      const hasTest = testFiles.some(test => test.includes(testFileName));

      if (!hasTest && !sourceFile.includes('index') && !sourceFile.includes('types')) {
        sourceFilesWithoutTests.push(sourceFile);
      }
    }

    if (sourceFilesWithoutTests.length > 0) {
      this.addTestingIssue('coverage', 'medium', `📊 ${sourceFilesWithoutTests.length} archivos sin tests`);
      errors.push(`📊 Archivos sin tests: ${sourceFilesWithoutTests.slice(0, 5).join(', ')}${sourceFilesWithoutTests.length > 5 ? '...' : ''}`);
    }

    // Verificar configuración de cobertura
    const vitestConfig = path.join(this.projectRoot, 'vitest.config.js');
    try {
      const configContent = await fs.readFile(vitestConfig, 'utf8');

      if (!configContent.includes('coverage')) {
        this.addTestingIssue('coverage', 'medium', `📊 Sin configuración de cobertura en vitest.config.js`);
        errors.push(`📊 Coverage no configurado en vitest.config.js`);
      }

      if (!configContent.includes('thresholds')) {
        this.addTestingIssue('coverage', 'low', `📊 Sin thresholds de cobertura definidos`);
        errors.push(`📊 No coverage thresholds defined`);
      }
    } catch (error) {
      this.addTestingIssue('coverage', 'medium', `📊 vitest.config.js no encontrado o inválido`);
      errors.push(`📊 vitest.config.js no encontrado`);
    }
  }

  // 🧪 ESTRUCTURA DE TESTS
  async validateTestStructure(errors) {
    const testFiles = await glob('tests/**/*.test.ts', { cwd: this.projectRoot });

    for (const testFile of testFiles) {
      const filePath = path.join(this.projectRoot, testFile);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar estructura AAA (Arrange, Act, Assert)
      const describeBlocks = (content.match(/describe\(/g) || []).length;
      const itBlocks = (content.match(/it\(/g) || []).length;
      const testBlocks = (content.match(/\b(test|it)\(/g) || []).length;

      if (describeBlocks === 0) {
        this.addTestingIssue('structure', 'medium', `🧪 ${testFile} sin bloques describe`);
        errors.push(`🧪 No describe blocks: ${testFile}`);
      }

      if (testBlocks === 0) {
        this.addTestingIssue('structure', 'high', `🧪 ${testFile} sin tests`);
        errors.push(`🧪 No test cases: ${testFile}`);
      }

      // Verificar imports de testing utilities
      if (!content.includes('expect') && !content.includes('assert')) {
        this.addTestingIssue('structure', 'medium', `🧪 ${testFile} sin assertions`);
        errors.push(`🧪 No assertions: ${testFile}`);
      }

      // Verificar mocking
      if (content.includes('mock') || content.includes('jest') || content.includes('vitest')) {
        this.addTestingIssue('structure', 'low', `🧪 ${testFile} usa mocking - Verificar necesidad`);
        errors.push(`🧪 Mocking usage: ${testFile}`);
      }
    }
  }

  // 🔍 CALIDAD DE TESTS
  async validateTestQuality(errors) {
    const testFiles = await glob('tests/**/*.test.ts', { cwd: this.projectRoot });

    for (const testFile of testFiles) {
      const filePath = path.join(this.projectRoot, testFile);
      const content = await fs.readFile(filePath, 'utf8');

      const lines = content.split('\n');

      // Verificar tests largos
      let inTestBlock = false;
      let testLineCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('it(') || line.includes('test(')) {
          inTestBlock = true;
          testLineCount = 0;
        }

        if (inTestBlock) {
          testLineCount++;

          if (line.includes('}')) {
            if (testLineCount > 50) {
              this.addTestingIssue('quality', 'medium', `🧪 Test muy largo en ${testFile}:${i + 1} (${testLineCount} líneas)`);
              errors.push(`🧪 Long test: ${testFile} (${testLineCount} lines)`);
            }
            inTestBlock = false;
          }
        }
      }

      // Verificar nombres descriptivos
      const testNames = content.match(/it\(['"]([^'"]+)['"]/g) || [];
      for (const testName of testNames) {
        if (testName.length < 10) {
          this.addTestingIssue('quality', 'low', `🧪 Nombre de test poco descriptivo: ${testName}`);
          errors.push(`🧪 Poor test name: ${testName}`);
        }
      }

      // Verificar cleanup
      if (!content.includes('afterEach') && !content.includes('afterAll') &&
          (content.includes('beforeEach') || content.includes('beforeAll'))) {
        this.addTestingIssue('quality', 'medium', `🧪 Setup sin cleanup en ${testFile}`);
        errors.push(`🧪 Setup without cleanup: ${testFile}`);
      }
    }
  }

  // 🔍 COBERTURA DE FUNCIONALIDADES
  async validateFeatureCoverage(errors) {
    const sourceFiles = await glob('src/**/*.{ts,js}', { cwd: this.projectRoot });
    const testFiles = await glob('tests/**/*.test.ts', { cwd: this.projectRoot });

    // Verificar cobertura de controladores
    const controllers = await glob('src/controllers/*.ts', { cwd: this.projectRoot });
    for (const controller of controllers) {
      const controllerName = controller.replace('src/controllers/', '').replace('.ts', '');
      const hasControllerTest = testFiles.some(test =>
        test.includes('Controller') && test.includes(controllerName)
      );

      if (!hasControllerTest) {
        this.addTestingIssue('coverage', 'high', `🧪 Controlador sin tests: ${controllerName}`);
        errors.push(`🧪 Controller without tests: ${controllerName}`);
      }
    }

    // Verificar cobertura de servicios
    const services = await glob('src/services/*.ts', { cwd: this.projectRoot });
    for (const service of services) {
      const serviceName = service.replace('src/services/', '').replace('.ts', '');
      const hasServiceTest = testFiles.some(test =>
        test.includes('Service') && test.includes(serviceName)
      );

      if (!hasServiceTest) {
        this.addTestingIssue('coverage', 'high', `🧪 Servicio sin tests: ${serviceName}`);
        errors.push(`🧪 Service without tests: ${serviceName}`);
      }
    }

    // Verificar cobertura de rutas
    const routes = await glob('src/app/routes/*.ts', { cwd: this.projectRoot });
    for (const route of routes) {
      const routeName = route.replace('src/app/routes/', '').replace('.ts', '');
      const hasRouteTest = testFiles.some(test =>
        test.includes('Route') && test.includes(routeName)
      );

      if (!hasRouteTest) {
        this.addTestingIssue('coverage', 'medium', `🧪 Ruta sin tests: ${routeName}`);
        errors.push(`🧪 Route without tests: ${routeName}`);
      }
    }
  }

  // 📋 MEJORES PRÁCTICAS DE TESTING
  async validateTestingBestPractices(errors) {
    const testFiles = await glob('tests/**/*.test.ts', { cwd: this.projectRoot });

    for (const testFile of testFiles) {
      const filePath = path.join(this.projectRoot, testFile);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar uso de datos hardcoded
      if (content.includes('test@example.com') || content.includes('123456') ||
          content.includes('password123') || content.includes('localhost')) {
        this.addTestingIssue('quality', 'medium', `🧪 Datos hardcoded en ${testFile}`);
        errors.push(`🧪 Hardcoded test data: ${testFile}`);
      }

      // Verificar timeouts
      if (content.includes('setTimeout') && !content.includes('jest.setTimeout')) {
        this.addTestingIssue('quality', 'low', `🧪 setTimeout sin jest.setTimeout en ${testFile}`);
        errors.push(`🧪 setTimeout without jest.setTimeout: ${testFile}`);
      }

      // Verificar console.log en tests
      if (content.includes('console.log') && !content.includes('expect')) {
        this.addTestingIssue('quality', 'low', `🧪 console.log en tests: ${testFile}`);
        errors.push(`🧪 console.log in tests: ${testFile}`);
      }

      // Verificar tests que modifican estado global
      if (content.includes('global.') || content.includes('window.') ||
          content.includes('process.env')) {
        this.addTestingIssue('quality', 'medium', `🧪 Modificación de estado global en ${testFile}`);
        errors.push(`🧪 Global state modification: ${testFile}`);
      }
    }
  }

  // 📋 GESTIÓN DE DATOS DE TEST
  async validateTestDataManagement(errors) {
    // Verificar factories/patrones de datos
    const testFiles = await glob('tests/**/*.test.ts', { cwd: this.projectRoot });

    let hasFactories = false;
    let hasFixtures = false;

    for (const testFile of testFiles) {
      const filePath = path.join(this.projectRoot, testFile);
      const content = await fs.readFile(filePath, 'utf8');

      if (content.includes('factory') || content.includes('fixture')) {
        hasFactories = true;
      }

      if (content.includes('beforeEach') || content.includes('beforeAll')) {
        hasFixtures = true;
      }
    }

    if (!hasFactories) {
      this.addTestingIssue('structure', 'medium', `🧪 Sin factories para datos de test`);
      errors.push(`🧪 No test data factories found`);
    }

    if (!hasFixtures) {
      this.addTestingIssue('structure', 'low', `🧪 Sin fixtures/setup para tests`);
      errors.push(`🧪 No test fixtures found`);
    }
  }

  // 🏗️ AUTOMATIZACIÓN E INTEGRACIÓN
  async validateTestAutomation(errors) {
    // Verificar scripts de package.json
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      const scripts = packageJson.scripts || {};

      if (!scripts.test) {
        this.addTestingIssue('structure', 'high', `🧪 Sin script 'test' en package.json`);
        errors.push(`🧪 No test script in package.json`);
      }

      if (!scripts['test:coverage']) {
        this.addTestingIssue('structure', 'medium', `🧪 Sin script 'test:coverage' en package.json`);
        errors.push(`🧪 No test:coverage script in package.json`);
      }

      if (!scripts['test:watch']) {
        this.addTestingIssue('structure', 'low', `🧪 Sin script 'test:watch' en package.json`);
        errors.push(`🧪 No test:watch script in package.json`);
      }
    } catch (error) {
      errors.push(`🧪 No se pudo verificar package.json`);
    }

    // Verificar configuración de CI/CD
    const ciFiles = await glob('.github/workflows/*.yml', { cwd: this.projectRoot });
    if (ciFiles.length === 0) {
      this.addTestingIssue('structure', 'medium', `🧪 Sin workflows de CI/CD para tests`);
      errors.push(`🧪 No CI/CD workflows for testing`);
    }
  }

  // 🔗 INTEGRACIÓN CONTINUA
  async validateCIIntegration(errors) {
    const ciFiles = await glob('.github/workflows/*.yml', { cwd: this.projectRoot });

    for (const ciFile of ciFiles) {
      const filePath = path.join(this.projectRoot, ciFile);
      const content = await fs.readFile(filePath, 'utf8');

      if (!content.includes('test')) {
        this.addTestingIssue('structure', 'medium', `🧪 Workflow ${ciFile} sin step de testing`);
        errors.push(`🧪 CI workflow without testing: ${ciFile}`);
      }

      if (!content.includes('coverage')) {
        this.addTestingIssue('structure', 'low', `🧪 Workflow ${ciFile} sin reporte de cobertura`);
        errors.push(`🧪 CI workflow without coverage: ${ciFile}`);
      }
    }
  }

  // 📋 VALIDACIÓN DE EDGE CASES
  async validateEdgeCaseCoverage(errors) {
    const testFiles = await glob('tests/**/*.test.ts', { cwd: this.projectRoot });

    let hasErrorTests = false;
    let hasEdgeCaseTests = false;

    for (const testFile of testFiles) {
      const filePath = path.join(this.projectRoot, testFile);
      const content = await fs.readFile(filePath, 'utf8');

      if (content.includes('error') || content.includes('Error') || content.includes('throw')) {
        hasErrorTests = true;
      }

      if (content.includes('null') || content.includes('undefined') ||
          content.includes('empty') || content.includes('invalid')) {
        hasEdgeCaseTests = true;
      }
    }

    if (!hasErrorTests) {
      this.addTestingIssue('coverage', 'high', `🧪 Sin tests de manejo de errores`);
      errors.push(`🧪 No error handling tests found`);
    }

    if (!hasEdgeCaseTests) {
      this.addTestingIssue('coverage', 'medium', `🧪 Sin tests de edge cases`);
      errors.push(`🧪 No edge case tests found`);
    }
  }

  // 📈 MÉTRICAS Y CÁLCULO DE SCORES
  addTestingIssue(category, severity, message) {
    const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityLevel = severityMap[severity] || 1;

    if (category === 'coverage') {
      this.testingMetrics.coverage.score += severityLevel;
    } else if (category === 'quality') {
      this.testingMetrics.quality.score += severityLevel;
      this.testingMetrics.quality.issues.push(message);
    } else if (category === 'structure') {
      this.testingMetrics.structure.score += severityLevel;
      this.testingMetrics.structure.issues.push(message);
    }

    this.testingMetrics.overall.totalIssues++;
    if (severity === 'critical') this.testingMetrics.overall.critical++;
    else if (severity === 'high') this.testingMetrics.overall.high++;
    else if (severity === 'medium') this.testingMetrics.overall.medium++;
    else if (severity === 'low') this.testingMetrics.overall.low++;
  }

  calculateTestingScore() {
    // Cobertura (40% del peso)
    const coverageScore = Math.max(0, 100 - (this.testingMetrics.coverage.score * 10));

    // Calidad (30% del peso)
    const qualityScore = Math.max(0, 100 - (this.testingMetrics.quality.score * 10));

    // Estructura (30% del peso)
    const structureScore = Math.max(0, 100 - (this.testingMetrics.structure.score * 10));

    const overallScore = (
      coverageScore * 0.4 +
      qualityScore * 0.3 +
      structureScore * 0.3
    );

    this.testingMetrics.overall.score = Math.round(overallScore);
    this.testingMetrics.overall.grade = this.getTestingGrade(overallScore);
    this.testingMetrics.overall.coverageScore = coverageScore;
    this.testingMetrics.overall.qualityScore = qualityScore;
    this.testingMetrics.overall.structureScore = structureScore;
  }

  getTestingGrade(score) {
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