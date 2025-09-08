/**
 * 👁️ CONTINUOUS TESTING WATCHER
 * Ejecuta tests automáticamente cuando detecta cambios en código o BD
 */

const fs = require('fs');
const path = require('path');
const { ContinuousTestRunner } = require('./runAll');

const colors = {
    green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', 
    blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', 
    reset: '\x1b[0m', bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

class TestWatcher {
    constructor() {
        this.watchers = new Map();
        this.lastRun = 0;
        this.debounceTimeout = null;
        this.isRunning = false;
        
        // Configuración
        this.config = {
            debounceDelay: 2000, // 2 segundos entre cambios y ejecución
            watchPaths: [
                'backend/src/controllers/',
                'backend/src/services/',
                'backend/src/routes/',
                'backend/src/config/',
                'tests/'
            ],
            fileExtensions: ['.js', '.json', '.sql'],
            excludePatterns: [
                'node_modules',
                '.git',
                'reports',
                'logs'
            ]
        };
    }

    shouldWatchFile(filePath) {
        // Verificar extensión
        const ext = path.extname(filePath);
        if (!this.config.fileExtensions.includes(ext)) {
            return false;
        }
        
        // Verificar patrones excluidos
        for (const pattern of this.config.excludePatterns) {
            if (filePath.includes(pattern)) {
                return false;
            }
        }
        
        return true;
    }

    async runTests(reason = 'File change detected') {
        if (this.isRunning) {
            log('⏳ Tests already running, skipping...', 'yellow');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();
        
        log(`\n${'='.repeat(60)}`, 'cyan');
        log(`🔄 RUNNING TESTS: ${reason}`, 'cyan');
        log(`⏰ ${new Date().toLocaleString()}`, 'dim');
        log(`${'='.repeat(60)}`, 'cyan');

        try {
            const runner = new ContinuousTestRunner();
            const success = await runner.run();
            const duration = Date.now() - startTime;
            
            if (success) {
                log(`\n✅ All tests passed! (${duration}ms)`, 'green');
            } else {
                log(`\n❌ Some tests failed (${duration}ms)`, 'red');
            }
            
            this.lastRun = Date.now();
            
        } catch (error) {
            log(`\n💥 Test execution crashed: ${error.message}`, 'red');
        } finally {
            this.isRunning = false;
            log(`\n👁️ Watching for changes...`, 'blue');
        }
    }

    scheduleTestRun(reason) {
        // Debounce para evitar ejecuciones múltiples
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        
        this.debounceTimeout = setTimeout(() => {
            this.runTests(reason);
        }, this.config.debounceDelay);
    }

    watchDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            log(`⚠️ Directory not found: ${dirPath}`, 'yellow');
            return;
        }

        const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
            if (!filename || !this.shouldWatchFile(filename)) {
                return;
            }

            const fullPath = path.join(dirPath, filename);
            const relativePath = path.relative(process.cwd(), fullPath);
            
            log(`📁 ${eventType}: ${relativePath}`, 'yellow');
            this.scheduleTestRun(`${eventType} in ${relativePath}`);
        });

        this.watchers.set(dirPath, watcher);
        log(`👁️ Watching: ${dirPath}`, 'green');
    }

    async start() {
        log(`${colors.bold}👁️ STARTING CONTINUOUS TEST WATCHER${colors.reset}`, 'magenta');
        log(`${colors.bold}${'='.repeat(50)}${colors.reset}`, 'magenta');
        
        // Ejecutar tests inicialmente
        await this.runTests('Initial test run');
        
        // Configurar watchers para cada directorio
        for (const watchPath of this.config.watchPaths) {
            const fullPath = path.resolve(watchPath);
            this.watchDirectory(fullPath);
        }
        
        log(`\n✅ Test watcher started successfully`, 'green');
        log(`📋 Watching ${this.config.watchPaths.length} directories`, 'cyan');
        log(`🔧 Debounce delay: ${this.config.debounceDelay}ms`, 'cyan');
        log(`📄 File extensions: ${this.config.fileExtensions.join(', ')}`, 'cyan');
        
        // Mantener el proceso vivo
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', this.handleKeyPress.bind(this));
        
        log(`\n⌨️  Press 'r' to run tests manually, 'q' to quit`, 'blue');
    }

    handleKeyPress(key) {
        const keyStr = key.toString();
        
        switch (keyStr) {
            case 'r':
            case 'R':
                log('\n🔄 Manual test run requested', 'cyan');
                this.scheduleTestRun('Manual trigger');
                break;
                
            case 'q':
            case 'Q':
            case '\u0003': // Ctrl+C
                this.stop();
                break;
                
            case 's':
            case 'S':
                this.showStatus();
                break;
                
            default:
                // Ignorar otras teclas
                break;
        }
    }

    showStatus() {
        log(`\n📊 WATCHER STATUS:`, 'blue');
        log(`   Last run: ${this.lastRun ? new Date(this.lastRun).toLocaleString() : 'Never'}`, 'cyan');
        log(`   Currently running: ${this.isRunning ? 'Yes' : 'No'}`, this.isRunning ? 'yellow' : 'green');
        log(`   Active watchers: ${this.watchers.size}`, 'cyan');
        log(`   Debounce timeout: ${this.debounceTimeout ? 'Active' : 'None'}`, 'cyan');
    }

    stop() {
        log(`\n🛑 Stopping test watcher...`, 'yellow');
        
        // Cerrar todos los watchers
        for (const [path, watcher] of this.watchers) {
            watcher.close();
            log(`   Stopped watching: ${path}`, 'dim');
        }
        this.watchers.clear();
        
        // Limpiar timeouts
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        
        log(`✅ Test watcher stopped cleanly`, 'green');
        process.exit(0);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const watcher = new TestWatcher();
    
    // Manejar señales de terminación
    process.on('SIGINT', () => watcher.stop());
    process.on('SIGTERM', () => watcher.stop());
    
    watcher.start().catch(error => {
        console.error('❌ Test watcher failed:', error);
        process.exit(1);
    });
}

module.exports = { TestWatcher };