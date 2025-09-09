const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} = require('../utils/logger.js');

const router = express.Router();

// Inicializar cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('❌ Variables SUPABASE_URL y SUPABASE_ANON_KEY requeridas');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 🚫 RUTA PROHIBIDA: NO ACCEDER DIRECTAMENTE A LA BASE DE DATOS
// TODO pasa por la API REST y el cliente de Supabase

/**
 * @route GET /api/products
 * @desc Obtiene todos los productos con paginación
 * @access Public
 */
router.get('/', async (req, res) => {
    const { page = 1, limit = 100, search, occasion, category } = req.query;
    const timer = startTimer('get-all-products');
    
    log('🔍 [API] Obteniendo productos', { page, limit, search, occasion, category }, 'info');
    
    try {
        let query = supabase.from('products').select('*');
        
        // Aplicar filtros si se proporcionan
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }
        
        if (occasion) {
            query = query.eq('occasion_id', occasion);
        }
        
        if (category) {
            query = query.eq('category_id', category);
        }
        
        // Paginación
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
        
        const { data: products, error: dbError, count } = await query;
        
        if (dbError) {
            timer.end();
            log('❌ [API] Error obteniendo productos', { error: dbError.message }, 'error');
            return res.status(500).json({
                success: false,
                message: 'Error obteniendo productos'
            });
        }
        
        // Procesar URLs de imágenes para cada producto
        const processedProducts = products.map(product => {
            return {
                ...product,
                image_url: product.image_url || '/images/placeholder-product.webp'
            };
        });
        
        timer.end();
        log('✅ [API] Productos obtenidos exitosamente', { 
            count: products.length, 
            page, 
            limit 
        }, 'info');
        
        res.json({
            success: true,
            data: processedProducts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || products.length,
                hasMore: products.length === parseInt(limit)
            }
        });
        
    } catch (error) {
        timer.end();
        log('❌ [API] Error inesperado obteniendo productos', { error: error.message }, 'error');
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

/**
 * @route GET /api/products/:id
 * @desc Obtiene un producto por ID. Si no tiene imagen en Supabase, devuelve placeholder local.
 * @access Public
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        log('❌ [API] ID de producto no proporcionado', { url: req.originalUrl }, 'error');
        return res.status(400).json({
            success: false,
            message: 'ID de producto requerido'
        });
    }

    log('🔍 [API] Buscando producto por ID', { id }, 'info');

    try {
        // 1. Obtener producto desde Supabase Postgres
        const { data: product, error: dbError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (dbError || !product) {
            log('❌ [API] Producto no encontrado en DB', { id, error: dbError?.message }, 'error');
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // 2. Usar la URL de imagen almacenada en la base de datos
        let imageUrl = product.image_url;

        // 3. ✅ Fallback a placeholder local si no hay imagen válida
        if (!imageUrl) {
            imageUrl = '/images/placeholder-product-2.webp';
            log('🖼️ [API] Usando placeholder local', { productId: id, reason: 'no image_url in database' }, 'info');
        }

        // 4. Preparar respuesta
        const response = {
            success: true,
            product: {
                id: product.id,
                name: product.name,
                summary: product.summary || '',
                description: product.description || '',
                price_usd: parseFloat(product.price_usd) || 0,
                price_ves: parseFloat(product.price_ves) || 0,
                stock: parseInt(product.stock) || 0,
                category: product.category || '',
                occasion: product.occasion || '',
                sku: product.sku || `FLORE-${String(product.id).padStart(4, '0')}`,
                image_url: imageUrl, // ← ¡SIEMPRE TIENE VALOR!
                images: product.images || [], // Array de URLs adicionales (pueden ser locales o de Supabase)
                created_at: product.created_at,
                updated_at: product.updated_at
            }
        };

        log('✅ [API] Producto encontrado y procesado', {
            id: product.id,
            hasSupabaseImage: imageUrl !== '/images/placeholder-product-2.webp',
            imageUrl
        }, 'success');

        res.status(200).json(response);

    } catch (error) {
        log('❌ [API] Error interno al obtener producto', { id, error: error.message }, 'error');
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;