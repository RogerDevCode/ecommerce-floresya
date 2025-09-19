import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from 'dotenv';
import { createProductRoutes } from './routes/productRoutes.js';
import { createOrderRoutes } from './routes/orderRoutes.js';
import { createOccasionsRoutes } from './routes/occasionsRoutes.js';
import { createLogsRoutes } from './routes/logsRoutes.js';
import { createImageRoutes } from './routes/imageRoutes.js';
import { createUserRoutes } from './routes/userRoutes.js';
import { createSchemaRoutes } from './routes/schemaRoutes.js';
import { supabaseManager } from '../config/supabase.js';
import { serverLogger } from '../utils/serverLogger.js';
import { swaggerUi, swaggerSpec } from '../config/swagger.js';
config();
class FloresYaServer {
    constructor() {
        this.app = express();
        this.port = parseInt(process.env.PORT ?? '3000');
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeMiddleware() {
        serverLogger.info('SYSTEM', 'Initializing middleware stack');
        serverLogger.info('SECURITY', 'Setting up Helmet security headers');
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    scriptSrcAttr: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:", "blob:"],
                    connectSrc: ["'self'", "https://*.supabase.co"],
                    fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
                },
            },
            crossOriginEmbedderPolicy: false,
        }));
        const corsOrigins = process.env.NODE_ENV === 'production'
            ? ['https://ecommerce-floresya-7-q8xi75ljr-floresyas-projects.vercel.app', 'https://floresya.vercel.app', 'https://floresya.com']
            : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'];
        serverLogger.info('SECURITY', 'Configuring CORS', { origins: corsOrigins });
        this.app.use(cors({
            origin: corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));
        const rateLimitMax = process.env.NODE_ENV === 'production' ? 100 : 1000;
        serverLogger.info('SECURITY', 'Setting up rate limiting', {
            windowMs: '15 minutes',
            maxRequests: rateLimitMax
        });
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: rateLimitMax,
            message: {
                success: false,
                message: 'Too many requests, please try again later.'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api', limiter);
        serverLogger.info('PERF', 'Enabling response compression');
        this.app.use(compression());
        serverLogger.info('SYSTEM', 'Setting up body parsers', { jsonLimit: '10mb', urlencodedLimit: '10mb' });
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        const publicPath = path.join(process.cwd(), 'public');
        const staticMaxAge = process.env.NODE_ENV === 'production' ? '1y' : '0';
        serverLogger.info('STATIC', 'Setting up static file serving', {
            path: publicPath,
            maxAge: staticMaxAge
        });
        this.app.use(express.static(publicPath, {
            maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
            etag: true,
            lastModified: true
        }));
        const distPath = path.join(process.cwd(), 'dist');
        serverLogger.info('STATIC', 'Setting up dist file serving', { path: distPath });
        this.app.use('/dist', express.static(distPath, {
            setHeaders: (res, filePath) => {
                if (filePath.endsWith('.js')) {
                    res.setHeader('Content-Type', 'application/javascript');
                }
                if (filePath.endsWith('.js.map')) {
                    res.setHeader('Content-Type', 'application/json');
                }
            }
        }));
        serverLogger.info('SYSTEM', 'Enabling request logging middleware');
        this.app.use(serverLogger.createRequestLogger());
        serverLogger.success('SYSTEM', 'Middleware stack initialized successfully');
    }
    initializeRoutes() {
        serverLogger.info('SYSTEM', 'Initializing API routes');
        this.app.get('/api/health', (req, res) => {
            const healthData = {
                success: true,
                message: 'FloresYa API is running',
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                environment: process.env.NODE_ENV ?? 'development',
                uptime: process.uptime(),
                memory: process.memoryUsage()
            };
            serverLogger.info('HEALTH', 'Health check requested', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(200).json(healthData);
        });
        serverLogger.info('SYSTEM', 'Setting up product routes');
        this.app.use('/api/products', createProductRoutes());
        serverLogger.info('SYSTEM', 'Setting up order routes');
        this.app.use('/api/orders', createOrderRoutes());
        serverLogger.info('SYSTEM', 'Setting up occasions routes');
        this.app.use('/api/occasions', createOccasionsRoutes());
        serverLogger.info('SYSTEM', 'Setting up logs routes');
        this.app.use('/api/logs', createLogsRoutes());
        serverLogger.info('SYSTEM', 'Setting up image routes');
        this.app.use('/api/images', createImageRoutes());
        serverLogger.info('SYSTEM', 'Setting up user routes');
        this.app.use('/api/users', createUserRoutes());
        serverLogger.info('SYSTEM', 'Setting up schema routes');
        this.app.use('/api/admin/schema', createSchemaRoutes());
        serverLogger.info('SYSTEM', 'Setting up Swagger API documentation');
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
            explorer: true,
            swaggerOptions: {
                docExpansion: 'list',
                filter: true,
                showRequestDuration: true
            }
        }));
        this.app.get('/api-docs.json', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerSpec);
        });
        this.app.get(/^\/(?!dist\/)(.*)/, (req, res) => {
            const indexPath = path.join(process.cwd(), 'public/index.html');
            if (req.path !== '/' && req.path !== '/index.html') {
                serverLogger.debug('STATIC', `Serving index.html for route: ${req.path}`, {
                    originalPath: req.path,
                    indexPath
                });
            }
            res.sendFile(indexPath, (err) => {
                if (err) {
                    serverLogger.error('STATIC', 'Failed to serve index.html', {
                        error: err.message,
                        path: req.path,
                        indexPath
                    });
                }
            });
        });
        serverLogger.success('SYSTEM', 'All routes initialized successfully');
    }
    initializeErrorHandling() {
        this.app.use('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'API endpoint not found',
                path: req.path
            });
        });
        this.app.use((error, req, res, _next) => {
            serverLogger.error('SYSTEM', 'Unhandled application error', {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                },
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({
                success: false,
                message: process.env.NODE_ENV === 'production'
                    ? 'Internal server error'
                    : error.message,
                ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
            });
        });
    }
    async start() {
        const timer = serverLogger.startTimer('Server Startup');
        try {
            serverLogger.info('SYSTEM', 'Initializing FloresYa Server', {
                port: this.port,
                environment: process.env.NODE_ENV ?? 'development'
            });
            const isConnected = await supabaseManager.testConnection();
            if (!isConnected) {
                serverLogger.warn('DATABASE', 'Could not connect to Supabase', {
                    message: 'Check your database configuration'
                });
            }
            else {
                serverLogger.success('DATABASE', 'Supabase connection verified');
            }
            this.app.listen(this.port, '0.0.0.0', () => {
                serverLogger.success('SYSTEM', 'FloresYa Server started successfully', {
                    port: this.port,
                    environment: process.env.NODE_ENV ?? 'development',
                    apiBaseUrl: `http://localhost:${this.port}/api`,
                    healthCheckUrl: `http://localhost:${this.port}/api/health`
                });
                timer();
            });
        }
        catch (error) {
            serverLogger.error('SYSTEM', 'Failed to start server', {
                error: error instanceof Error ? error.message : String(error),
                port: this.port
            });
            timer();
            process.exit(1);
        }
    }
    getApp() {
        return this.app;
    }
}
const serverInstance = new FloresYaServer();
if (import.meta.url === `file://${process.argv[1]}`) {
    void serverInstance.start();
}
export { FloresYaServer };
export default serverInstance.getApp();
