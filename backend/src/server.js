require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');

const { testConnection } = require('./config/database');
const { initializeEmailService } = require('./services/emailService');

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

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://floresya.com', 'https://www.floresya.com'] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde.'
    }
});
app.use(limiter);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use(express.static(path.join(__dirname, '../../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/occasions', occasionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/carousel', carouselRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/test', testRoutes);
app.use('/api/images', imageRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    }
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

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

const startServer = async () => {
    try {
        console.log('🚀 Iniciando servidor FloresYa...');
        
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos');
            process.exit(1);
        }
        
        try {
            initializeEmailService();
        } catch (emailError) {
            console.warn('⚠️ Servicio de email no disponible:', emailError.message);
        }
        
        app.listen(PORT, () => {
            console.log(`✅ Servidor corriendo en puerto ${PORT}`);
            console.log(`🌐 API disponible en: http://localhost:${PORT}/api`);
            console.log(`🌸 Frontend disponible en: http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        });
        
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
};

process.on('SIGINT', () => {
    console.log('\n🔄 Cerrando servidor...');
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
});

if (require.main === module) {
    startServer();
}

module.exports = app;