const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');

// Import database configuration
const { testConnection } = require('../backend/src/config/database');
const { initializeEmailService } = require('../backend/src/services/emailService');

// Import all route modules
const authRoutes = require('../backend/src/routes/auth');
const productRoutes = require('../backend/src/routes/products');
const orderRoutes = require('../backend/src/routes/orders');
const paymentRoutes = require('../backend/src/routes/payments');
const categoryRoutes = require('../backend/src/routes/categories');
const settingsRoutes = require('../backend/src/routes/settings');
const paymentMethodRoutes = require('../backend/src/routes/paymentMethods');
const carouselRoutes = require('../backend/src/routes/carousel');
const uploadRoutes = require('../backend/src/routes/upload');
const testRoutes = require('../backend/src/routes/testRoutes');
const imageRoutes = require('../backend/src/routes/images');
const databaseRoutes = require('../backend/src/routes/database');

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            fontSrc: [
                "'self'", 
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            connectSrc: ["'self'"]
        }
    }
}));

// CORS configuration for Vercel
app.use(cors({
    origin: [
        'https://ecommerce-floresya-7.vercel.app',
        'https://dcbavpdlkcjdtjdkntde.supabase.co',
        'https://floresya.com', 
        'https://www.floresya.com',
        'http://localhost:3000', 
        'http://127.0.0.1:3000'
    ],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde.'
    }
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/carousel', carouselRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/test', testRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/database', databaseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'vercel'
    });
});

// Handle undefined API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    
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

// Serverless optimization - lazy initialization
let initialized = false;
let dbReady = false;

const initializeServices = async () => {
    if (initialized) return dbReady;
    
    try {
        console.log('🚀 Inicializando FloresYa serverless...');
        
        // Test database connection
        dbReady = await testConnection();
        if (!dbReady) {
            console.error('❌ Supabase connection failed');
            return false;
        }
        
        // Initialize email service (non-blocking)
        try {
            initializeEmailService();
            console.log('📧 Email service initialized');
        } catch (emailError) {
            console.warn('⚠️ Email service unavailable (optional):', emailError.message);
        }
        
        initialized = true;
        console.log('✅ FloresYa serverless ready');
        return true;
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        return false;
    }
};

// Efficient initialization middleware
app.use(async (req, res, next) => {
    try {
        const ready = await initializeServices();
        if (!ready) {
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable - database connection failed',
                retry: true
            });
        }
        next();
    } catch (error) {
        console.error('❌ Request initialization failed:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during initialization'
        });
    }
});

module.exports = app;