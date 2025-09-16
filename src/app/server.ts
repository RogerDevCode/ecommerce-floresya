/**
 * 🌸 FloresYa Express Server - TypeScript Enterprise Edition
 * Clean architecture with zero technical debt
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Import routes
import { createProductRoutes } from './routes/productRoutes.js';
import { createOrderRoutes } from './routes/orderRoutes.js';
import { createOccasionsRoutes } from './routes/occasionsRoutes.js';
import { createLogsRoutes } from './routes/logsRoutes.js';
import { supabaseManager } from '../config/supabase.js';

// Load environment variables
config();

// ES Module directory resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FloresYaServer {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
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

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production'
        ? ['https://floresya.vercel.app', 'https://floresya.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit requests per windowMs
      message: {
        success: false,
        message: 'Too many requests, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);

    // Compression
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files middleware
    const publicPath = path.join(__dirname, '../../public');
    this.app.use(express.static(publicPath, {
      maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
      etag: true,
      lastModified: true
    }));

    // Serve compiled TypeScript modules with correct MIME types
    this.app.use('/dist', express.static(path.join(__dirname, '../../dist'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
        if (filePath.endsWith('.js.map')) {
          res.setHeader('Content-Type', 'application/json');
        }
      }
    }));

    // Request logging in development
    if (process.env.NODE_ENV !== 'production') {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
      });
    }
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'FloresYa API is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    this.app.use('/api/products', createProductRoutes());
    this.app.use('/api/orders', createOrderRoutes());
    this.app.use('/api/occasions', createOccasionsRoutes());
    this.app.use('/api/logs', createLogsRoutes());

    // Serve index.html for all non-API routes (SPA support)
    this.app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(__dirname, '../../public/index.html');
      res.sendFile(indexPath);
    });
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

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
      console.error('Unhandled error:', error);
      
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
    try {
      const isConnected = await supabaseManager.testConnection();
      
      if (!isConnected) {
        console.warn('⚠️ Warning: Could not connect to Supabase. Check your configuration.');
      } else {
        console.log('✅ Supabase connection verified');
      }

      this.app.listen(this.port, () => {
        console.log(`🌸 FloresYa Server running on port ${this.port}`);
        console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API Base URL: http://localhost:${this.port}/api`);
        console.log(`📊 Health Check: http://localhost:${this.port}/api/health`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

// Create server instance for export (Vercel compatibility)
const serverInstance = new FloresYaServer();

// Start server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  serverInstance.start();
}

// Export both the class and the app instance for different use cases
export { FloresYaServer };

// For Vercel serverless functions - export as default function
export default serverInstance.getApp();