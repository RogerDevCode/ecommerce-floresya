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

        // 2. Construir URL de imagen desde Supabase Storage (si existe)
        let imageUrl = null;
        if (product.image_path) { // Asumiendo que guardas la ruta relativa en la DB, ej: "products/flore-0042.webp"
            const { data: publicUrlData } = supabase
                .storage
                .from('products') // Nombre de tu bucket
                .getPublicUrl(product.image_path);

            imageUrl = publicUrlData?.publicUrl || null;

            // Verificar si la URL es accesible (opcional, para evitar broken images)
            if (imageUrl) {
                try {
                    const headResponse = await fetch(imageUrl, { method: 'HEAD' });
                    if (!headResponse.ok) {
                        log('⚠️ [API] URL de imagen no accesible, usando placeholder', { url: imageUrl }, 'warn');
                        imageUrl = null;
                    }
                } catch (fetchError) {
                    log('⚠️ [API] Error al verificar imagen, usando placeholder', { url: imageUrl, error: fetchError.message }, 'warn');
                    imageUrl = null;
                }
            }
        }

        // 3. ✅ Fallback a placeholder local si no hay imagen válida
        if (!imageUrl) {
            imageUrl = '/images/placeholder-product-2.webp';
            log('🖼️ [API] Usando placeholder local', { productId: id, reason: 'no image in Supabase or broken URL' }, 'info');
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