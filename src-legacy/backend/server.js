// backend/src/server.js
import {
    log,
    logger,
    requestLogger,
    startTimer
} from './utils/bked_logger.js';

import { config } from 'dotenv';
config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { swaggerUi, specs } from './config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

logger.info('SERVER', '🔍 Iniciando carga de dependencias...');

// 🚨 LOG: Antes de cargar cualquier dependencia pesada
logger.info('SERVER', '📦 Cargando módulos del sistema...');

// Database initialization not needed - using Supabase client directly
logger.info('SERVER', '🔌 Usando Supabase client directo (sin inicialización)');

// import { initializeEmailService } from './services/bked_emailService.js';
logger.info('SERVER', '✉️ Módulo de email deshabilitado temporalmente');

// import { monitoringService } from './services/bked_monitoringService.js';
logger.info('SERVER', '📊 Módulo de monitoreo deshabilitado temporalmente');

import { 
    createMonitoringMiddleware,
    healthCheckMiddleware,
    alertsMiddleware,
    systemStatsMiddleware 
} from './middleware/monitoringMiddleware.js';
logger.info('SERVER', '🛡️ Middleware de monitoreo cargado');

// Rutas
logger.info('SERVER', '🛣️ Cargando rutas de API...');
import authRoutes from './routes/bked_auth_routes.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
// import categoryRoutes from './routes/categories.js'; // REMOVED: Categories obsolete
import occasionRoutes from './routes/occasions.js';
import settingsRoutes from './routes/settings.js';
import paymentMethodRoutes from './routes/paymentMethods.js';
import carouselRoutes from './routes/carousel.js';
import uploadRoutes from './routes/upload.js';
import testRoutes from './routes/testRoutes.js';
import imageRoutes from './routes/images.js';
import testFixedRoutes from './routes/test-fixed.js';
import logsRoutes from './routes/logs.js';

logger.success('SERVER', '✅ Todas las rutas cargadas correctamente');

const app = express();
const PORT = process.env.PORT || 3000;

logger.info('SERVER', `⚙️ Configurando servidor en puerto ${PORT}...`);

// 🛡️ Helmet - Seguridad HTTP
logger.info('SERVER', '🛡️ Configurando Helmet (CSP, HSTS, etc.)...');
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ['\'self\''],
            scriptSrc: [
                '\'self\'', 
                '\'unsafe-inline\'', 
                'https://cdn.jsdelivr.net',
                'https://cdnjs.cloudflare.com'
            ],
            scriptSrcAttr: ['\'unsafe-inline\''],
            styleSrc: [
                '\'self\'', 
                '\'unsafe-inline\'', 
                'https://cdn.jsdelivr.net',
                'https://cdnjs.cloudflare.com'
            ],
            imgSrc: ['\'self\'', 'data:', 'https:', 'blob:', 'https://*.supabase.co'],
            fontSrc: [
                '\'self\'', 
                'https://cdn.jsdelivr.net',
                'https://cdnjs.cloudflare.com'
            ],
            connectSrc: ['\'self\'', 'https://*.supabase.co'],
            frameSrc: ['\'self\''],
            objectSrc: ['\'none\'']
        }
    }
}));
logger.success('SERVER', '✅ Helmet configurado');

// 🌐 CORS
logger.info('SERVER', '🌐 Configurando CORS...');
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://floresya.com', 'https://www.floresya.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
logger.success('SERVER', '✅ CORS configurado');

// 🚦 Rate Limiting
logger.info('SERVER', '🚦 Configurando rate limiting...');
// Reemplaza tu configuración actual de rateLimit con esta:

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn('RATE_LIMIT', '🚨 Límite de solicitudes excedido', {
            ip: req.ip,
            path: req.path,
            method: req.method
        });
        res.status(options.statusCode).send(options.message);
    }
});



app.use(limiter);
logger.success('SERVER', '✅ Rate limiting configurado');

// 📦 Compression
logger.info('SERVER', '📦 Configurando compresión GZIP...');
app.use(compression());
logger.success('SERVER', '✅ Compresión configurada');

// 🧠 Parseo de JSON y URL
logger.info('SERVER', '🧠 Configurando parsers de JSON y URL...');
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        if (buf.length > 10 * 1024 * 1024) {
            logger.warn('PAYLOAD', '⚠️ Payload demasiado grande', {
                size: buf.length,
                path: req.path
            });
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
logger.success('SERVER', '✅ Parsers configurados');

// 📊 Monitoreo
logger.info('SERVER', '📊 Configurando middleware de monitoreo...');
app.use(createMonitoringMiddleware({
    trackRequests: true,
    trackPerformance: true,
    trackErrors: true,
    excludePaths: ['/health', '/metrics', '/alerts', '/system-stats', '/favicon.ico', '/api/logs/frontend']
}));
app.use(healthCheckMiddleware);
app.use(alertsMiddleware);
app.use(systemStatsMiddleware);
logger.success('SERVER', '✅ Middleware de monitoreo montado');

// 📚 SWAGGER UI - Documentación de API
logger.info('SERVER', '📚 Configurando Swagger UI para documentación de API...');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
logger.success('SERVER', '✅ Swagger UI montado en /api-docs');

// 📁 Servir archivos estáticos
logger.info('SERVER', '📁 Configurando servidores estáticos...');

// 📁 Servir archivos estáticos
logger.info('SERVER', '📁 Configurando servidores estáticos...');
app.use('/uploads', express.static(path.join(__dirname, '../../uploads'), {
    setHeaders: (res, path) => {
        logger.info('STATIC', '🖼️ Sirviendo archivo estático', { path });
    }
}));
app.use(express.static(path.join(__dirname, '../../frontend'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            logger.info('STATIC', '📄 Sirviendo página HTML', { path });
        }
    }
}));
logger.success('SERVER', '✅ Servidores estáticos configurados');

// 🚀 Rutas de API
logger.info('SERVER', '🚀 Montando rutas de API...');

const routes = [
    { path: '/api/auth', handler: authRoutes, name: 'Auth' },
    { path: '/api/carousel', handler: carouselRoutes, name: 'Carousel' },
    // { path: '/api/categories', handler: categoryRoutes, name: 'Categories' }, // REMOVED: Categories obsolete
    { path: '/api/images', handler: imageRoutes, name: 'Images' },
    { path: '/api/logs', handler: logsRoutes, name: 'Logs' },
    { path: '/api/occasions', handler: occasionRoutes, name: 'Occasions' },
    { path: '/api/test-fixed', handler: testFixedRoutes, name: 'TestFixed' },
    { path: '/api/orders', handler: orderRoutes, name: 'Orders' },
    { path: '/api/payment-methods', handler: paymentMethodRoutes, name: 'PaymentMethods' },
    { path: '/api/payments', handler: paymentRoutes, name: 'Payments' },
    { path: '/api/products', handler: productRoutes, name: 'Products' },
    { path: '/api/settings', handler: settingsRoutes, name: 'Settings' },
    { path: '/api/test', handler: testRoutes, name: 'Test' },
    { path: '/api/upload', handler: uploadRoutes, name: 'Upload' }
];

routes.forEach(route => {
    app.use(route.path, route.handler);
    logger.info('ROUTES', `✅ Ruta montada: ${route.path} (${route.name})`);
});

// ❤️ Health Check
app.get('/api/health', (req, res) => {
    logger.info('HEALTH', '❤️ Health check solicitado');
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
        logger.warn('SERVER', 'Endpoint no encontrado', { path: req.path, method: req.method });
        return res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    }
    logger.info('STATIC', '🏠 Sirviendo index.html para SPA', { path: req.path });
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// 🚨 Manejo global de errores
app.use((err, req, res, next) => {
    logger.error('SERVER', 'Error no manejado', { 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : 'hidden in production',
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
    });

    if (err.type === 'entity.parse.failed') {
        logger.warn('VALIDATION', 'JSON inválido recibido', { url: req.url });
        return res.status(400).json({
            success: false,
            message: 'JSON inválido en el cuerpo de la solicitud'
        });
    }
    
    if (err.type === 'entity.too.large') {
        logger.warn('VALIDATION', 'Payload demasiado grande', { url: req.url, size: req.headers['content-length'] });
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
        
        // 🔌 Base de datos - Usando Supabase client directo (sin inicialización)
        logger.info('DATABASE', '🔌 Usando Supabase client directo...');
        // await initializeDatabase(); // No needed with Supabase
        logger.success('DATABASE', '✅ Supabase client listo para usar');
        
        // ✉️ Servicio de email - Deshabilitado temporalmente
        try {
            logger.info('EMAIL', '✉️ Servicio de email deshabilitado...');
            // initializeEmailService();
            logger.success('EMAIL', '✅ Email service disabled for now');
        } catch (emailError) {
            logger.warn('EMAIL', '⚠️ Servicio de email no disponible', { error: emailError.message });
        }

        // 📈 Monitoreo - Deshabilitado temporalmente
        logger.info('MONITORING', '📊 Sistema de monitoreo deshabilitado...');
        // monitoringService.startMonitoring(30000);
        logger.success('MONITORING', '✅ Monitoring service disabled for now');
        
        // ▶️ Iniciar servidor
        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.success('SERVER', `✅ Servidor FloresYa corriendo en puerto ${PORT}`, {
                port: PORT,
                env: process.env.NODE_ENV,
                pid: process.pid,
                hostname: process.platform
            });
            console.log('\n🌸 FloresYa E-Commerce - Venezuela');
            console.log(`🌐 API: http://localhost:${PORT}/api`);
            console.log(`🛒 Frontend: http://localhost:${PORT}`);
            console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
            console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
            console.log('📋 Logs: /logs/frontend/ (archivos JSON)\n');
        });

        // Eventos del servidor
        server.on('error', (err) => {
            logger.error('SERVER', '❌ Error en servidor HTTP', {
                code: err.code,
                message: err.message,
                stack: err.stack
            });
            if (err.code === 'EADDRINUSE') {
                logger.error('SERVER', `💥 Puerto ${PORT} ya está en uso. Intenta con otro puerto.`);
            }
            process.exit(1);
        });

        server.on('listening', () => {
            logger.info('SERVER', '🔌 Servidor activo y aceptando conexiones');
        });

        server.on('close', () => {
            logger.warn('SERVER', '🔌 Servidor cerrado');
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
    // monitoringService.stopMonitoring();
    logger.info('SERVER', '✅ Monitoreo detenido (disabled)');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('SERVER', '\n🔄 Recibida señal SIGTERM. Apagando servidor...');
    // monitoringService.stopMonitoring();
    logger.info('SERVER', '✅ Monitoreo detenido (disabled)');
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('SERVER', '❌ Promesa rechazada no manejada', {
        reason: reason?.message || reason,
        promise: promise?.constructor?.name || 'Unknown',
        stack: reason?.stack
    });
    // Opcional: cerrar proceso en producción
    // process.exit(1);
});

process.on('uncaughtException', (err) => {
    logger.error('SERVER', '💥 Excepción no capturada - CRITICAL', {
        message: err.message,
        stack: err.stack
    });
    process.exit(1);
});

// ▶️ Iniciar si es el módulo principal
// Check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    logger.info('SERVER', '▶️ Este es el módulo principal. Iniciando servidor...');
    startServer();
} else {
    logger.warn('SERVER', '⚠️ Este módulo fue importado, no se iniciará el servidor');
}

export default app;
