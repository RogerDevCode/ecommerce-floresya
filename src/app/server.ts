/**
 * 🌸 FloresYa Express Server - TypeScript Enterprise Edition
 * Clean architecture with zero technical debt
 */

import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from 'dotenv';

// Import routes
import { createProductRoutes } from './routes/productRoutes.js';
import { createOrderRoutes } from './routes/orderRoutes.js';
import { createOccasionsRoutes } from './routes/occasionsRoutes.js';
import { createLogsRoutes } from './routes/logsRoutes.js';
import { createImageRoutes } from './routes/imageRoutes.js';
import { createUserRoutes } from './routes/userRoutes.js';
import { createSchemaRoutes } from './routes/schemaRoutes.js';
import { supabaseManager } from '../config/supabase.js';

// Import comprehensive logging system
import { serverLogger } from '../utils/serverLogger.js';

// Import Swagger configuration
import { swaggerSpec, swaggerUi } from '../config/swagger.js';

// Load environment variables
config();

// Directory resolution removed - not needed for current implementation

class FloresYaServer {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT ?? '3000');
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    serverLogger.info('SYSTEM', 'Initializing middleware stack');

    // Security middleware
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
          fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
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

    // Rate limiting
    const rateLimitMax = process.env.NODE_ENV === 'production' ? 100 : 1000;
    serverLogger.info('SECURITY', 'Setting up rate limiting', {
      windowMs: '15 minutes',
      maxRequests: rateLimitMax
    });

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: rateLimitMax,
      message: {
        success: false,
        message: 'Too many requests, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api', limiter);

    // Compression
    serverLogger.info('PERF', 'Enabling response compression');
    this.app.use(compression());

    // Body parsing middleware
    serverLogger.info('SYSTEM', 'Setting up body parsers', { jsonLimit: '10mb', urlencodedLimit: '10mb' });
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files middleware
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

    // Serve compiled TypeScript modules with correct MIME types
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

    // Request logging middleware
    serverLogger.info('SYSTEM', 'Enabling request logging middleware');
    this.app.use(serverLogger.createRequestLogger());

    serverLogger.success('SYSTEM', 'Middleware stack initialized successfully');
  }

  private initializeRoutes(): void {
    serverLogger.info('SYSTEM', 'Initializing API routes');

    /**
     * @swagger
     * /api/health:
     *   get:
     *     summary: Health check endpoint
     *     description: Returns the health status of the API server with system information
     *     tags: [System]
     *     responses:
     *       200:
     *         description: API is healthy and running
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: "FloresYa API is running"
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                   example: "2024-01-15T10:30:00.000Z"
     *                 version:
     *                   type: string
     *                   example: "2.0.0"
     *                 environment:
     *                   type: string
     *                   example: "production"
     *                 uptime:
     *                   type: number
     *                   description: Server uptime in seconds
     *                   example: 3600.5
     *                 memory:
     *                   type: object
     *                   description: Memory usage statistics
     *                   properties:
     *                     rss:
     *                       type: number
     *                       description: Resident Set Size
     *                     heapTotal:
     *                       type: number
     *                       description: Total heap size
     *                     heapUsed:
     *                       type: number
     *                       description: Used heap size
     *                     external:
     *                       type: number
     *                       description: External memory usage
     */
    this.app.get('/api/health', (req: Request, res: Response) => {
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

    // API routes with logging
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

    // Swagger API documentation
    serverLogger.info('SYSTEM', 'Setting up Swagger API documentation');
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true
      }
    }));

    // Swagger JSON endpoint
    this.app.get('/api-docs.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // Serve index.html for all non-API routes (SPA support)
    // Exclude: /api/, /dist/, files with extensions, and common asset paths
    this.app.get(/^\/(?!api\/|dist\/|.*\.[^\/]+$)(.*)/, (req: Request, res: Response) => {
      const indexPath = path.join(process.cwd(), 'public/index.html');

      // Log static file serving for debugging
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

  private initializeErrorHandling(): void {
    // 404 handler for API routes
    this.app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.path
      });
    });

    // Global error handler with comprehensive logging
    this.app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
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

  public async start(): Promise<void> {
    const timer = serverLogger.startTimer('Server Startup');

    try {
      serverLogger.info('SYSTEM', 'Initializing FloresYa Server', {
        port: this.port,
        environment: process.env.NODE_ENV ?? 'development'
      });

      // Test database connection
      const isConnected = await supabaseManager.testConnection();

      if (!isConnected) {
        serverLogger.warn('DATABASE', 'Could not connect to Supabase', {
          message: 'Check your database configuration'
        });
      } else {
        serverLogger.success('DATABASE', 'Supabase connection verified');
      }

      // Start server
      this.app.listen(this.port, '0.0.0.0', () => {
        serverLogger.success('SYSTEM', 'FloresYa Server started successfully', {
          port: this.port,
          environment: process.env.NODE_ENV ?? 'development',
          apiBaseUrl: `http://localhost:${this.port}/api`,
          healthCheckUrl: `http://localhost:${this.port}/api/health`
        });

        timer(); // End timer
      });
    } catch (error) {
      serverLogger.error('SYSTEM', 'Failed to start server', {
        error: error instanceof Error ? error.message : String(error),
        port: this.port
      });
      timer(); // End timer
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

// Create server instance for export (Vercel compatibility)
const serverInstance = new FloresYaServer();

// Start server if this is the main module (ES module compatibility)
if (import.meta.url === `file://${process.argv[1]}`) {
  void serverInstance.start();
}

// Export both the class and the app instance for different use cases
export { FloresYaServer };

// For Vercel serverless functions - export as default function
export default serverInstance.getApp();