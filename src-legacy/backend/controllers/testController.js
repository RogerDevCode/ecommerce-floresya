import {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} from '../utils/bked_logger.js';

import { databaseService } from '../services/databaseService.js';

// Test endpoint to get detailed occasions information  
const testOccasions = async (req, res) => {
    try {
        const client = databaseService.getClient();
        const { data, error } = await client
            .from('occasions')
            .select('id, name, description, active, created_at, updated_at')
            .order('name', { ascending: true });
        
        if (error) {
            throw error;
        }
        const occasions = data || [];

        // Get product count for each occasion
        const occasionsWithCount = await Promise.all(
            occasions.map(async (occasion) => {
                const { count, error: countError } = await client
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('occasion', occasion.name.toLowerCase());
                
                if (countError) {
                    logger.warn('Error counting products for occasion', { occasion: occasion.name, error: countError });
                    return { ...occasion, product_count: 0 };
                }
                
                return { ...occasion, product_count: count || 0 };
            })
        );

        res.json({
            success: true,
            data: {
                occasions: occasionsWithCount,
                total_occasions: occasions.length
            }
        });
    } catch (error) {
        console.error('Error in testOccasions:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Test endpoint to get products with search and filters
const testProducts = async (req, res) => {
    try {
        const { search, occasion, limit = 20, offset = 0 } = req.query;
        
        const client = databaseService.getClient();
        let query = client
            .from('products')
            .select('id, name, summary, description, price_usd, price_ves, stock, occasion, sku, created_at, updated_at')
            .limit(parseInt(limit))
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
            
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
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
    } catch (error) {
        console.error('Error in testProducts:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Test database connection
const testConnection = async (req, res) => {
    try {
        const client = databaseService.getClient();
        // Test connection by querying a simple table
        const { data, error } = await client
            .from('occasions')
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

export {
    testOccasions,
    testProducts,
    testConnection,
    testHello
};
