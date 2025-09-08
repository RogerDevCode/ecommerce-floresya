const {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} = require('./utils/logger.js');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');

const { testConnection } = require('./config/database');
const { initializeEmailService } = require('./services/emailService');
const { monitoringService } = require('./services/monitoringService');
const { 
    createMonitoringMiddleware,
    healthCheckMiddleware,
    alertsMiddleware,
    systemStatsMiddleware 
} = require('./middleware/monitoringMiddleware');

// Rutas existentes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const categoryRoutes = require('./routes/categories');
const occasionRoutes = require('./routes/occasions');
const settingsRoutes = require('./routes/settings');
const paymentMethodRoutes = require('./routes/paymentMethods');
const carouselRoutes = require('./routes/carousel');
const uploadRoutes = require('./routes/upload');
const testRoutes = require('./routes/testRoutes');
const imageRoutes = require('./routes/images');

// ✅ NUEVA RUTA: Logs del frontend
const logsRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3000;

// 🛡️ Helmet - Seguridad HTTP
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://cdn.jsdelivr.net",    // ✅ Eliminado espacio al final
                "https://cdnjs.cloudflare.com" // ✅ Eliminado espacio al final
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://cdn.jsdelivr.net",    // ✅ Eliminado espacio al final
                "https://cdnjs.cloudflare.com" // ✅ Eliminado espacio al final
            ],
            imgSrc: ["'self'", "data:", "https:", "blob:", "https://*.supabase.co"],
            fontSrc: [
                "'self'", 
                "https://cdn.jsdelivr.net",    // ✅ Eliminado espacio al final
                "https://cdnjs.cloudflare.com" // ✅ Eliminado espacio al final
            ],
            connectSrc: ["'self'", "https://*.supabase.co"],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"]
        }
    }
}));

// 🌐 CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://floresya.com', 'https://www.floresya.com'] // ✅ Eliminado espacios
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// 🚦 Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// 📦 Compression
app.use(compression());

// 🧠 Parseo de JSON y URL
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📊 Monitoreo
app.use(createMonitoringMiddleware({
    trackRequests: true,
    trackPerformance: true,
    trackErrors: true,
    excludePaths: ['/health', '/metrics', '/alerts', '/system-stats', '/favicon.ico', '/api/logs/frontend']
}));

app.use(healthCheckMiddleware);
app.use(alertsMiddleware);
app.use(systemStatsMiddleware);

// 📁 Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use(express.static(path.join(__dirname, '../../frontend')));

// 🚀 Rutas de API (ordenadas alfabéticamente para mantenibilidad)
app.use('/api/auth', authRoutes);
app.use('/api/carousel', carouselRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/logs', logsRoutes);          // ✅ NUEVO: Endpoint para logs del frontend
app.use('/api/occasions', occasionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/test', testRoutes);
app.use('/api/upload', uploadRoutes);

// ❤️ Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API FloresYa funcionando correctamente 🌸',
        timestamp: new Date().toISOString(),
        version: '1.0.1',
        environment: process.env.NODE_ENV
    });
});

// 🌐 Manejo de rutas no encontradas
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        logger.warn('SERVER', 'Endpoint no encontrado', { path: req.path });
        return res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    }
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// 🚨 Manejo global de errores
app.use((err, req, res, next) => {
    logger.error('SERVER', 'Error no manejado', { 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method
    });

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'JSON inválido en el cuerpo de la solicitud'
        });
    }
    
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'El archivo es demasiado grande'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});

// 🚀 Iniciar servidor
const startServer = async () => {
    try {
        logger.info('SERVER', '🚀 Iniciando servidor FloresYa...');
        
        // 🔌 Conexión a base de datos
        const dbConnected = await testConnection();
        if (!dbConnected) {
            logger.error('SERVER', '❌ No se pudo conectar a la base de datos');
            process.exit(1);
        }
        logger.success('SERVER', '✅ Conexión a base de datos establecida');
        
        // ✉️ Servicio de email
        try {
            initializeEmailService();
            logger.info('SERVER', '✅ Servicio de email inicializado');
        } catch (emailError) {
            logger.warn('SERVER', '⚠️ Servicio de email no disponible', { error: emailError.message });
        }

        // 📈 Monitoreo
        monitoringService.startMonitoring(30000);
        logger.info('SERVER', '📊 Sistema de monitoreo iniciado');
        
        // ▶️ Iniciar servidor
        app.listen(PORT, () => {
            logger.success('SERVER', `✅ Servidor FloresYa corriendo en puerto ${PORT}`, {
                port: PORT,
                env: process.env.NODE_ENV,
                pid: process.pid
            });
            console.log(`\n🌸 FloresYa E-Commerce - Venezuela`);
            console.log(`🌐 API: http://localhost:${PORT}/api`);
            console.log(`🛒 Frontend: http://localhost:${PORT}`);
            console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
            console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
            console.log(`📋 Logs: /logs/frontend/ (archivos JSON)\n`);
        });
        
    } catch (error) {
        logger.error('SERVER', '❌ Error fatal al iniciar servidor', { 
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
};

// 🔄 Manejo de señales de sistema
process.on('SIGINT', () => {
    logger.info('SERVER', '\n🔄 Cerrando servidor FloresYa...');
    monitoringService.stopMonitoring();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('SERVER', '❌ Promesa rechazada no manejada', {
        reason: reason?.message || reason,
        promise: promise?.constructor?.name || 'Unknown'
    });
});

// ▶️ Iniciar si es el módulo principal
if (require.main === module) {
    startServer();
}

module.exports = app;