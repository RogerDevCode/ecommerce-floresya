import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Cliente Supabase directo
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Test endpoint para verificar que todo funciona sin queryBuilder
router.get('/health', async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Test endpoints funcionando',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en test health',
            error: error.message
        });
    }
});

// Test products
router.get('/products', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('active', true)  // La columna 'active' SÍ existe en products
            .limit(5);
        
        if (error) throw error;
        
        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting products',
            error: error.message
        });
    }
});

// Test occasions (reemplazo de categories)
router.get('/occasions', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('occasions')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting occasions',
            error: error.message
        });
    }
});

// Test carousel
router.get('/carousel', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('carousel_images')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting carousel',
            error: error.message
        });
    }
});

// Test settings
router.get('/settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('key', key)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Setting not found'
                });
            }
            throw error;
        }
        
        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting setting',
            error: error.message
        });
    }
});

// Test exchange rate (sin llamar API externa)
router.get('/exchange-rate', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'exchange_rate_usd_ves')
            .single();
        
        let rate = 36000; // Default rate
        
        if (!error && data) {
            rate = parseFloat(data.value) || 36000;
        }
        
        res.json({
            success: true,
            data: {
                rate,
                currency: 'USD/VES',
                source: 'database',
                updated: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting exchange rate',
            error: error.message
        });
    }
});

export default router;