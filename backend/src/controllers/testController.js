const {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} = require('../utils/logger.js');

const { supabase, useSupabase } = require('../config/database');

// Test endpoint to get detailed category information
const testCategories = async (req, res) => {
    try {
        let categories;

        if (useSupabase) {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name, description, image_url, active, created_at, updated_at')
                .order('name', { ascending: true });
            
            if (error) {
                throw error;
            }
            categories = data || [];

            // Get product count for each category
            const categoriesWithCount = await Promise.all(
                categories.map(async (category) => {
                    const { count, error: countError } = await supabase
                        .from('products')
                        .select('*', { count: 'exact', head: true })
                        .eq('category', category.name);
                    
                    if (countError) {
                        logger.warn('Error counting products for category', { category: category.name, error: countError });
                        return { ...category, product_count: 0 };
                    }
                    
                    return { ...category, product_count: count || 0 };
                })
            );

            res.json({
                success: true,
                data: {
                    categories: categoriesWithCount,
                    total_categories: categories.length
                }
            });
        } else {
            throw new Error('Only Supabase is supported in this application');
        }
    } catch (error) {
        console.error('Error in testCategories:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Test endpoint to get products with search and filters
const testProducts = async (req, res) => {
    try {
        const { search, category, occasion, limit = 20, offset = 0 } = req.query;
        
        if (useSupabase) {
            let query = supabase
                .from('products')
                .select('id, name, summary, description, price_usd, price_ves, stock, category, occasion, sku, created_at, updated_at')
                .limit(parseInt(limit))
                .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
            
            if (search) {
                query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
            }
            
            if (category) {
                query = query.eq('category', category);
            }
            
            if (occasion) {
                query = query.eq('occasion', occasion);
            }
            
            const { data: products, error } = await query.order('created_at', { ascending: false });
            
            if (error) {
                throw error;
            }

            res.json({
                success: true,
                data: {
                    products: products || [],
                    count: products?.length || 0,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            });
        } else {
            throw new Error('Only Supabase is supported in this application');
        }
    } catch (error) {
        console.error('Error in testProducts:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Test database connection
const testConnection = async (req, res) => {
    try {
        if (useSupabase) {
            // Test connection by querying a simple table
            const { data, error } = await supabase
                .from('categories')
                .select('count')
                .limit(1);
            
            if (error) {
                throw error;
            }

            res.json({
                success: true,
                message: 'Database connection successful',
                data: {
                    connection_type: 'Supabase PostgreSQL',
                    status: 'Connected'
                }
            });
        } else {
            throw new Error('Only Supabase is supported in this application');
        }
    } catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed',
            error: error.message 
        });
    }
};

// Test simple response
const testHello = async (req, res) => {
    res.json({
        success: true,
        message: 'Hello from FloresYa Test Controller!',
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    testCategories,
    testProducts,
    testConnection,
    testHello
};