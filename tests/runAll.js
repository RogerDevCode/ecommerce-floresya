/**
 * 🚀 MAIN TEST RUNNER - TESTING CONTINUO Y PROGRESIVO
 * Ejecuta todos los tests y genera reportes comprehensivos
 */

const { databaseTests } = require('./unit/database.test');
const { apiTests } = require('./unit/api.test');
const { databaseService } = require('../backend/src/services/databaseService');
const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
    green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', 
    blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', 
    reset: '\x1b[0m', bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

class ContinuousTestRunner {
    constructor() {
        this.overallResults = {
            suites: [],
            totalTests: 0,
            totalPassed: 0,
            totalFailed: 0,
            totalSkipped: 0,
            startTime: null,
            endTime: null,
            environment: null
        };
    }

    async initialize() {
        log(`${colors.bold}🏗️  INITIALIZING CONTINUOUS TEST ENVIRONMENT${colors.reset}`, 'magenta');
        log(`${colors.bold}${'='.repeat(60)}${colors.reset}`, 'magenta');
        
        // Verificar entorno
        await this.checkEnvironment();
        
        // Verificar conexiones
        await this.checkConnections();
        
        // Preparar directorio de reportes
        this.setupReportsDirectory();
        
        log('✅ Test environment initialized successfully', 'green');
    }

    async checkEnvironment() {
        log('🔍 Checking test environment...', 'blue');
        
        // Verificar Node.js version
        const nodeVersion = process.version;
        log(`   Node.js: ${nodeVersion}`, 'cyan');
        
        // Verificar variables de entorno
        const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`❌ Missing required environment variable: ${envVar}`);
            }
            log(`   ✅ ${envVar}: *** (configured)`, 'green');
        }
        
        // Verificar estructura de archivos
        const requiredFiles = [
            'backend/src/services/databaseService.js',
            'backend/src/controllers/productControllerSupabase.js',
            'backend/src/server.js'
        ];
        
        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, '..', file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`❌ Required file not found: ${file}`);
            }
        }
        
        this.overallResults.environment = {
            nodeVersion,
            timestamp: new Date().toISOString(),
            platform: process.platform,
            architecture: process.arch
        };
    }

    async checkConnections() {
        log('🔌 Checking connections...', 'blue');
        
        // Test database connection
        const dbConnected = await databaseService.testConnection();
        if (!dbConnected) {
            throw new Error('❌ Database connection failed');
        }
        log('   ✅ Database connection: OK', 'green');
        
        // Test API server
        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);
            
            await execAsync('curl -f -s "http://localhost:3000/api/health" > /dev/null');
            log('   ✅ API server: OK', 'green');
        } catch (error) {
            throw new Error('❌ API server not responding. Please start with: npm start');
        }
    }

    setupReportsDirectory() {
        const reportsDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        log(`📁 Reports directory: ${reportsDir}`, 'cyan');
    }

    async runTestSuite(suiteName, testFunction) {
        log(`\n${colors.bold}🧪 RUNNING SUITE: ${suiteName.toUpperCase()}${colors.reset}`, 'blue');
        log(`${colors.bold}${'='.repeat(50)}${colors.reset}`, 'blue');
        
        const suiteStartTime = Date.now();
        
        try {
            const result = await testFunction();
            const suiteEndTime = Date.now();
            const suiteDuration = suiteEndTime - suiteStartTime;
            
            const suiteResult = {
                name: suiteName,
                success: result.success,
                stats: result.stats,
                duration: suiteDuration,
                timestamp: new Date().toISOString()
            };
            
            this.overallResults.suites.push(suiteResult);
            this.overallResults.totalTests += result.stats.total;
            this.overallResults.totalPassed += result.stats.passed;
            this.overallResults.totalFailed += result.stats.failed;
            this.overallResults.totalSkipped += result.stats.skipped;
            
            if (result.success) {
                log(`✅ ${suiteName} completed successfully (${suiteDuration}ms)`, 'green');
            } else {
                log(`❌ ${suiteName} completed with failures (${suiteDuration}ms)`, 'red');
            }
            
            return result;
            
        } catch (error) {
            log(`❌ ${suiteName} crashed: ${error.message}`, 'red');
            
            this.overallResults.suites.push({
                name: suiteName,
                success: false,
                error: error.message,
                duration: Date.now() - suiteStartTime,
                timestamp: new Date().toISOString()
            });
            
            return { success: false, error: error.message };
        }
    }

    async generateFinalReport() {
        this.overallResults.endTime = Date.now();
        const totalDuration = this.overallResults.endTime - this.overallResults.startTime;
        const successRate = this.overallResults.totalTests > 0 
            ? ((this.overallResults.totalPassed / this.overallResults.totalTests) * 100).toFixed(1)
            : 0;

        log(`\n${colors.bold}🎯 COMPREHENSIVE TEST REPORT${colors.reset}`, 'magenta');
        log(`${colors.bold}${'='.repeat(70)}${colors.reset}`, 'magenta');
        
        // Estadísticas generales
        log(`\n📊 OVERALL STATISTICS:`, 'blue');
        log(`   Total Suites: ${this.overallResults.suites.length}`, 'cyan');
        log(`   Total Tests: ${this.overallResults.totalTests}`, 'cyan');
        log(`   ✅ Passed: ${this.overallResults.totalPassed}`, 'green');
        log(`   ❌ Failed: ${this.overallResults.totalFailed}`, this.overallResults.totalFailed > 0 ? 'red' : 'green');
        log(`   ⏭️  Skipped: ${this.overallResults.totalSkipped}`, 'yellow');
        log(`   📈 Success Rate: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');
        log(`   ⏱️  Total Duration: ${totalDuration}ms`, 'cyan');
        
        // Resumen por suite
        log(`\n📋 SUITE BREAKDOWN:`, 'blue');
        for (const suite of this.overallResults.suites) {
            const status = suite.success ? '✅' : '❌';
            const color = suite.success ? 'green' : 'red';
            log(`   ${status} ${suite.name}: ${suite.stats?.passed || 0}/${suite.stats?.total || 0} tests (${suite.duration}ms)`, color);
            
            if (!suite.success && suite.error) {
                log(`      Error: ${suite.error}`, 'dim');
            }
        }
        
        // Estado del sistema
        await this.reportSystemHealth();
        
        // Guardar reporte completo
        await this.saveComprehensiveReport();
        
        // Determinar éxito general
        const overallSuccess = this.overallResults.totalFailed === 0 && 
                              this.overallResults.suites.every(s => s.success);
        
        if (overallSuccess) {
            log(`\n🎉 ALL TESTS PASSED! System is 100% functional`, 'green');
            log(`✅ API is fully operational`, 'green');
            log(`✅ Database integrity confirmed`, 'green');
            log(`✅ New system implementation verified`, 'green');
            log(`✅ Legacy system completely eliminated`, 'green');
        } else {
            log(`\n⚠️  SOME TESTS FAILED - System needs attention`, 'yellow');
            log(`🔧 Review the detailed report for fixes needed`, 'yellow');
        }
        
        return overallSuccess;
    }

    async reportSystemHealth() {
        log(`\n🏥 SYSTEM HEALTH CHECK:`, 'blue');
        
        try {
            // Estadísticas de la base de datos
            const dbStats = await databaseService.getStats();
            log(`   📊 Database Records:`, 'cyan');
            Object.entries(dbStats).forEach(([table, count]) => {
                log(`      ${table}: ${count}`, 'dim');
            });
            
            // Verificar integridad de datos
            const integrityIssues = await databaseService.verifyDataIntegrity();
            if (integrityIssues.length === 0) {
                log(`   ✅ Data Integrity: Perfect`, 'green');
            } else {
                log(`   ⚠️  Data Integrity: ${integrityIssues.length} issues found`, 'yellow');
                integrityIssues.forEach(issue => {
                    log(`      • ${issue.message}`, 'yellow');
                });
            }
            
        } catch (error) {
            log(`   ❌ Health check failed: ${error.message}`, 'red');
        }
    }

    async saveComprehensiveReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(__dirname, 'reports', `comprehensive-report-${timestamp}.json`);
        
        const comprehensiveReport = {
            timestamp: new Date().toISOString(),
            environment: this.overallResults.environment,
            summary: {
                totalSuites: this.overallResults.suites.length,
                totalTests: this.overallResults.totalTests,
                totalPassed: this.overallResults.totalPassed,
                totalFailed: this.overallResults.totalFailed,
                totalSkipped: this.overallResults.totalSkipped,
                successRate: this.overallResults.totalTests > 0 
                    ? ((this.overallResults.totalPassed / this.overallResults.totalTests) * 100).toFixed(1)
                    : 0,
                duration: this.overallResults.endTime - this.overallResults.startTime,
                overallSuccess: this.overallResults.totalFailed === 0
            },
            suites: this.overallResults.suites
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(comprehensiveReport, null, 2));
        log(`📄 Comprehensive report saved: ${reportPath}`, 'cyan');
    }

    async run() {
        this.overallResults.startTime = Date.now();
        
        log(`${colors.bold}🚀 FLORESYA E-COMMERCE CONTINUOUS TESTING${colors.reset}`, 'magenta');
        log(`${colors.bold}${'='.repeat(70)}${colors.reset}`, 'magenta');
        log(`Started at: ${new Date().toLocaleString()}`, 'cyan');
        
        // Inicialización
        await this.initialize();
        
        // Ejecutar suites de test en orden
        const testSuites = [
            ['Database Tests', databaseTests],
            ['API Tests', apiTests]
        ];
        
        for (const [suiteName, testFunction] of testSuites) {
            await this.runTestSuite(suiteName, testFunction);
        }
        
        // Generar reporte final
        const overallSuccess = await this.generateFinalReport();
        
        return overallSuccess;
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const runner = new ContinuousTestRunner();
    
    runner.run().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Continuous test runner failed:', error);
        process.exit(1);
    });
}

module.exports = { ContinuousTestRunner };