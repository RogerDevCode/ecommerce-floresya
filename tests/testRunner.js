/**
 * 🧪 MODERN PROGRESSIVE TEST RUNNER
 * Sistema de testing unitario, progresivo y continuo
 * Basado en técnicas modernas de testing
 */

const { databaseService } = require('../backend/src/services/databaseService');
const path = require('path');
const fs = require('fs');

// Colores para output
const colors = {
    green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', 
    blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', 
    reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

class ModernTestRunner {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            tests: [],
            suites: {},
            startTime: null,
            endTime: null
        };
        
        this.config = {
            bail: false,           // Stop on first failure
            verbose: true,         // Detailed output
            parallel: false,       // Run tests in parallel
            timeout: 30000,        // Default timeout per test
            retries: 0,           // Retry failed tests
            coverage: false        // Code coverage (future)
        };
        
        this.hooks = {
            beforeAll: [],
            afterAll: [],
            beforeEach: [],
            afterEach: []
        };
    }

    // Registrar hooks
    beforeAll(fn) { this.hooks.beforeAll.push(fn); }
    afterAll(fn) { this.hooks.afterAll.push(fn); }
    beforeEach(fn) { this.hooks.beforeEach.push(fn); }
    afterEach(fn) { this.hooks.afterEach.push(fn); }

    // Método principal de testing
    async describe(suiteName, testFn) {
        log(`\n${colors.bold}📝 Test Suite: ${suiteName}${colors.reset}`, 'cyan');
        log(`${colors.bold}${'='.repeat(50)}${colors.reset}`, 'cyan');
        
        this.testResults.suites[suiteName] = {
            passed: 0,
            failed: 0,
            tests: [],
            startTime: Date.now()
        };

        const suite = {
            it: (testName, testFn) => this.it(suiteName, testName, testFn),
            expect: this.expect.bind(this),
            skip: (testName, reason) => this.skip(suiteName, testName, reason)
        };

        // Ejecutar hooks beforeAll
        for (const hook of this.hooks.beforeAll) {
            await hook();
        }

        try {
            await testFn(suite);
        } catch (error) {
            log(`❌ Suite error: ${error.message}`, 'red');
        }

        // Ejecutar hooks afterAll
        for (const hook of this.hooks.afterAll) {
            await hook();
        }

        this.testResults.suites[suiteName].endTime = Date.now();
        this.showSuiteSummary(suiteName);
    }

    // Test individual
    async it(suiteName, testName, testFn) {
        const test = {
            suite: suiteName,
            name: testName,
            status: 'running',
            startTime: Date.now(),
            error: null,
            duration: 0
        };

        this.testResults.total++;

        try {
            // Ejecutar hooks beforeEach
            for (const hook of this.hooks.beforeEach) {
                await hook();
            }

            // Timeout del test
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Test timeout (${this.config.timeout}ms)`)), this.config.timeout)
            );

            await Promise.race([testFn(), timeoutPromise]);

            test.status = 'passed';
            test.duration = Date.now() - test.startTime;
            this.testResults.passed++;
            this.testResults.suites[suiteName].passed++;

            if (this.config.verbose) {
                log(`  ✅ ${testName} (${test.duration}ms)`, 'green');
            }

        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            test.duration = Date.now() - test.startTime;
            this.testResults.failed++;
            this.testResults.suites[suiteName].failed++;

            log(`  ❌ ${testName}`, 'red');
            log(`     ${error.message}`, 'dim');

            // Bail on first failure si está configurado
            if (this.config.bail) {
                throw new Error(`Test failed: ${testName}`);
            }
        } finally {
            // Ejecutar hooks afterEach
            for (const hook of this.hooks.afterEach) {
                await hook();
            }
        }

        this.testResults.tests.push(test);
        this.testResults.suites[suiteName].tests.push(test);
    }

    // Skip test
    skip(suiteName, testName, reason = '') {
        const test = {
            suite: suiteName,
            name: testName,
            status: 'skipped',
            reason: reason,
            duration: 0
        };

        this.testResults.total++;
        this.testResults.skipped++;
        this.testResults.tests.push(test);
        
        log(`  ⏭️  ${testName} ${reason ? `(${reason})` : ''}`, 'yellow');
    }

    // Expect assertions moderno
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
            },
            
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
                }
            },
            
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected ${actual} to be truthy`);
                }
            },
            
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected ${actual} to be falsy`);
                }
            },
            
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            
            toHaveLength: (expected) => {
                if (actual.length !== expected) {
                    throw new Error(`Expected length ${actual.length} to be ${expected}`);
                }
            },
            
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            
            toBeGreaterThanOrEqual: (expected) => {
                if (actual < expected) {
                    throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
                }
            },
            
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            },
            
            toBeLessThanOrEqual: (expected) => {
                if (actual > expected) {
                    throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
                }
            },
            
            toMatchObject: (expected) => {
                for (const [key, value] of Object.entries(expected)) {
                    if (actual[key] !== value) {
                        throw new Error(`Expected ${key}: ${actual[key]} to match ${value}`);
                    }
                }
            },
            
            toHaveProperty: (property, expectedValue = undefined) => {
                if (!actual.hasOwnProperty(property)) {
                    throw new Error(`Expected object to have property ${property}`);
                }
                if (expectedValue !== undefined && actual[property] !== expectedValue) {
                    throw new Error(`Expected property ${property} to be ${expectedValue}, got ${actual[property]}`);
                }
            },
            
            not: {
                toBe: (expected) => {
                    if (actual === expected) {
                        throw new Error(`Expected ${actual} not to be ${expected}`);
                    }
                },
                toContain: (expected) => {
                    if (actual.includes(expected)) {
                        throw new Error(`Expected ${actual} not to contain ${expected}`);
                    }
                },
                toHaveProperty: (property) => {
                    if (actual.hasOwnProperty(property)) {
                        throw new Error(`Expected object not to have property ${property}`);
                    }
                }
            }
        };
    }

    // Mostrar resumen de suite
    showSuiteSummary(suiteName) {
        const suite = this.testResults.suites[suiteName];
        const duration = suite.endTime - suite.startTime;
        const total = suite.passed + suite.failed;
        const percentage = total > 0 ? ((suite.passed / total) * 100).toFixed(1) : 0;

        log(`\n📊 Suite Summary: ${suiteName}`, 'blue');
        log(`   ✅ Passed: ${suite.passed}`, 'green');
        log(`   ❌ Failed: ${suite.failed}`, suite.failed > 0 ? 'red' : 'green');
        log(`   📈 Success Rate: ${percentage}%`, percentage === '100.0' ? 'green' : 'yellow');
        log(`   ⏱️  Duration: ${duration}ms`, 'cyan');
    }

    // Reporte final
    async generateReport() {
        this.testResults.endTime = Date.now();
        const totalDuration = this.testResults.endTime - this.testResults.startTime;
        const successRate = this.testResults.total > 0 
            ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
            : 0;

        log(`\n${colors.bold}🎯 FINAL TEST REPORT${colors.reset}`, 'magenta');
        log(`${colors.bold}${'='.repeat(60)}${colors.reset}`, 'magenta');
        
        log(`📊 Tests: ${this.testResults.total}`, 'blue');
        log(`✅ Passed: ${this.testResults.passed}`, 'green');
        log(`❌ Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'red' : 'green');
        log(`⏭️  Skipped: ${this.testResults.skipped}`, 'yellow');
        log(`📈 Success Rate: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');
        log(`⏱️  Total Duration: ${totalDuration}ms`, 'cyan');
        
        // Mostrar fallos detallados
        if (this.testResults.failed > 0) {
            log(`\n${colors.bold}❌ FAILED TESTS:${colors.reset}`, 'red');
            const failedTests = this.testResults.tests.filter(t => t.status === 'failed');
            failedTests.forEach(test => {
                log(`   • ${test.suite} → ${test.name}`, 'red');
                log(`     ${test.error}`, 'dim');
            });
        }

        // Guardar reporte en archivo
        await this.saveReportToFile();

        return {
            success: this.testResults.failed === 0,
            stats: this.testResults
        };
    }

    // Guardar reporte en archivo
    async saveReportToFile() {
        const reportDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(reportDir, `test-report-${timestamp}.json`);

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.testResults.total,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                skipped: this.testResults.skipped,
                successRate: this.testResults.total > 0 
                    ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
                    : 0,
                duration: this.testResults.endTime - this.testResults.startTime
            },
            suites: this.testResults.suites,
            tests: this.testResults.tests
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        log(`📄 Report saved to: ${reportPath}`, 'cyan');
    }

    // Configurar opciones
    configure(options) {
        this.config = { ...this.config, ...options };
    }

    // Iniciar test run
    async run() {
        this.testResults.startTime = Date.now();
        log(`${colors.bold}🚀 STARTING MODERN TEST RUNNER${colors.reset}`, 'magenta');
        log(`${colors.bold}${'='.repeat(60)}${colors.reset}`, 'magenta');
        
        // Verificar conexión a base de datos
        const dbConnected = await databaseService.testConnection();
        if (!dbConnected) {
            throw new Error('❌ Database connection failed - cannot proceed with tests');
        }
        
        log('✅ Database connection verified', 'green');
    }
}

module.exports = { ModernTestRunner };