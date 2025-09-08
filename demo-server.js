/**
 * 🌸 FloresYa - Servidor DEMO
 * Versión simplificada para mostrar las optimizaciones de conversión
 * SIN requerir Supabase - Solo para demostración visual
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Mock data para demostración
const mockProducts = [
    {
        id: 1,
        name: "Ramo de Rosas Rojas Premium",
        description: "Hermoso ramo de 12 rosas rojas frescas, perfecto para expresar amor y pasión. Incluye envoltura elegante y tarjeta personalizada.",
        summary: "12 rosas rojas premium con envoltura elegante",
        price_usd: 25.99,
        stock: 8,
        category: "Ramos",
        occasion: "Amor",
        featured: true,
        image_url: "/images/placeholder-product-2.webp",
        images: ["/images/placeholder-product-2.webp"],
        sku: "RR-001"
    },
    {
        id: 2,
        name: "Arreglo Tropical Sunshine",
        description: "Vibrante arreglo con flores tropicales que ilumina cualquier espacio. Perfecto para celebraciones y ocasiones especiales.",
        summary: "Flores tropicales vibrantes en arreglo especial",
        price_usd: 32.50,
        stock: 5,
        category: "Arreglos",
        occasion: "Celebración",
        featured: false,
        image_url: "/images/placeholder-product-2.webp",
        images: ["/images/placeholder-product-2.webp"],
        sku: "AT-002"
    },
    {
        id: 3,
        name: "Bouquet Elegant White",
        description: "Sofisticado bouquet en tonos blancos, ideal para bodas y eventos elegantes. Combinación perfecta de rosas, lisianthus y follaje.",
        summary: "Bouquet blanco sofisticado para eventos elegantes",
        price_usd: 45.00,
        stock: 3,
        category: "Bouquets",
        occasion: "Boda",
        featured: true,
        image_url: "/images/placeholder-product-2.webp",
        images: ["/images/placeholder-product-2.webp"],
        sku: "BW-003"
    },
    {
        id: 4,
        name: "Centro de Mesa Primaveral",
        description: "Encantador centro de mesa con flores de temporada en colores pastel. Perfecto para crear un ambiente acogedor.",
        summary: "Centro de mesa con flores primaverales",
        price_usd: 18.75,
        stock: 12,
        category: "Centros de Mesa",
        occasion: "Decoración",
        featured: false,
        image_url: "/images/placeholder-product-2.webp",
        images: ["/images/placeholder-product-2.webp"],
        sku: "CM-004"
    },
    {
        id: 5,
        name: "Ramo Mixto Sorpresa",
        description: "Hermosa combinación de flores mixtas seleccionadas por nuestros expertos floristas. Cada ramo es único y especial.",
        summary: "Ramo mixto único seleccionado por expertos",
        price_usd: 28.90,
        stock: 0, // Sin stock para mostrar el estado
        category: "Ramos",
        occasion: "Sorpresa",
        featured: false,
        image_url: "/images/placeholder-product-2.webp",
        images: ["/images/placeholder-product-2.webp"],
        sku: "RM-005"
    },
    {
        id: 6,
        name: "Arreglo Día de la Madre Especial",
        description: "Tierno arreglo diseñado especialmente para mamá, con sus flores favoritas en colores suaves y cálidos.",
        summary: "Arreglo especial diseñado para el Día de la Madre",
        price_usd: 35.99,
        stock: 15,
        category: "Arreglos",
        occasion: "Día de la Madre",
        featured: true,
        image_url: "/images/placeholder-product-2.webp",
        images: ["/images/placeholder-product-2.webp"],
        sku: "DM-006"
    }
];

const mockOccasions = [
    "Amor", "Celebración", "Boda", "Decoración", "Sorpresa", "Día de la Madre", "Cumpleaños", "Aniversario"
];

// API Routes para DEMO
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '🌸 FloresYa DEMO funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '2.0.0-demo',
        environment: 'demo'
    });
});

app.get('/api/products', (req, res) => {
    const { limit = 10, offset = 0, occasion, search } = req.query;
    
    let filteredProducts = [...mockProducts];
    
    // Filtrar por ocasión
    if (occasion && occasion !== '') {
        filteredProducts = filteredProducts.filter(p => 
            p.occasion.toLowerCase().includes(occasion.toLowerCase())
        );
    }
    
    // Filtrar por búsqueda
    if (search && search !== '') {
        filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const products = filteredProducts.slice(start, end);
    
    res.json({
        success: true,
        products: products,
        total: filteredProducts.length,
        page: Math.floor(start / limit) + 1,
        totalPages: Math.ceil(filteredProducts.length / limit)
    });
});

app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = mockProducts.find(p => p.id === productId);
    
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }
    
    res.json({
        success: true,
        product: product
    });
});

app.get('/api/occasions', (req, res) => {
    res.json({
        success: true,
        occasions: mockOccasions
    });
});

app.get('/api/settings/exchange_rate_bcv', (req, res) => {
    res.json({
        success: true,
        rate: 36.85,
        last_updated: new Date().toISOString(),
        source: 'demo'
    });
});

// Simular carousel dinámico
app.get('/api/carousel', (req, res) => {
    const carouselImages = [
        {
            id: 1,
            title: "Rosas Premium",
            subtitle: "Para momentos especiales",
            image_url: "/images/placeholder-product-2.webp",
            active: true
        },
        {
            id: 2,
            title: "Arreglos Tropicales",
            subtitle: "Colores vibrantes",
            image_url: "/images/placeholder-product-2.webp",
            active: true
        },
        {
            id: 3,
            title: "Bouquets Elegantes",
            subtitle: "Para ocasiones especiales",
            image_url: "/images/placeholder-product-2.webp",
            active: true
        }
    ];
    
    res.json({
        success: true,
        images: carouselImages
    });
});

// Ruta para procesar órdenes FloresYa Express (simulada)
app.post('/api/orders/express', (req, res) => {
    const { name, phone, email, address, productId, quantity } = req.body;
    
    // Simulación de procesamiento
    setTimeout(() => {
        res.json({
            success: true,
            message: '¡Pedido FloresYa Express procesado exitosamente! 🌸',
            order_id: `FY-${Date.now()}`,
            estimated_delivery: '24 horas',
            total: 25.99 * quantity
        });
    }, 1500);
});

// Servir frontend
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    }
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Iniciar servidor DEMO
app.listen(PORT, () => {
    console.log('\n🌸═══════════════════════════════════════════');
    console.log('   FloresYa - SERVIDOR DEMO INICIADO');
    console.log('═══════════════════════════════════════════🌸');
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
    console.log('📱 Optimizado para conversión y mobile');
    console.log('✨ Todas las optimizaciones premium activas');
    console.log('🎯 Modo DEMO - Sin necesidad de Supabase');
    console.log('═══════════════════════════════════════════🌸\n');
    
    console.log('🔗 ENLACES DIRECTOS:');
    console.log(`   🏠 Página principal: http://localhost:${PORT}`);
    console.log(`   🛍️  Producto demo: http://localhost:${PORT}/pages/product-detail.html?id=1`);
    console.log(`   ❤️  Health check: http://localhost:${PORT}/api/health`);
    console.log(`   📊 API productos: http://localhost:${PORT}/api/products\n`);
});

module.exports = app;