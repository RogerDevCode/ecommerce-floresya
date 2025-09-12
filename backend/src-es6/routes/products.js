/**
 * Product Routes - ES6+ Version
 * Enhanced with modern JavaScript patterns and improved error handling
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger, trackPerformance } from '../utils/logger.js';
import { asyncErrorHandler, classifyError } from '../utils/errorHandler.js';

const router = express.Router();

// Enhanced Supabase client initialization with validation
const initializeSupabaseClient = () => {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('❌ SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }
    
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
};

const supabase = initializeSupabaseClient();

// Enhanced product query builder with ES6+ patterns
class ProductQueryBuilder {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.query = this.supabase.from('products').select('*');
    }

    // Method chaining for filters
    withSearch = (searchTerm) => {
        if (searchTerm?.trim()) {
            this.query = this.query.ilike('name', `%${searchTerm.trim()}%`);
        }
        return this;
    }

    withOccasion = (occasionId) => {
        if (occasionId) {
            this.query = this.query.eq('occasion_id', parseInt(occasionId, 10));
        }
        return this;
    }

    withCategory = (categoryId) => {
        if (categoryId) {
            this.query = this.query.eq('category_id', parseInt(categoryId, 10));
        }
        return this;
    }

    withPagination = (page = 1, limit = 100) => {
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 items
        
        const from = (pageNum - 1) * limitNum;
        const to = from + limitNum - 1;
        
        this.query = this.query.range(from, to);
        return this;
    }

    withSorting = (sortBy = 'created_at', sortOrder = 'desc') => {
        const validSortFields = ['name', 'price_usd', 'created_at', 'updated_at'];
        const field = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const order = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
        
        this.query = this.query.order(field, { ascending: order === 'asc' });
        return this;
    }

    execute = async () => {
        return await this.query;
    }
}

// Enhanced product processing with better image handling
const processProductData = (products) => {
    return products.map(product => ({
        ...product,
        // Enhanced price handling
        price_usd: parseFloat(product.price_usd) || 0,
        price_ves: parseFloat(product.price_ves) || 0,
        stock: parseInt(product.stock, 10) || 0,
        
        // Enhanced image URL processing
        image_url: product.image_url || '/images/placeholder-product.webp',
        images: Array.isArray(product.images) ? product.images : [],
        
        // Enhanced SKU generation
        sku: product.sku || `FLORE-${String(product.id).padStart(4, '0')}`,
        
        // Ensure required fields exist
        name: product.name || 'Producto sin nombre',
        description: product.description || '',
        summary: product.summary || '',
        category: product.category || '',
        occasion: product.occasion || ''
    }));
};

// Validation schemas using ES6+ patterns
const validateProductFilters = (filters) => {
    const errors = [];
    
    const { page, limit, search, occasion, category } = filters;
    
    if (page && (isNaN(page) || parseInt(page, 10) < 1)) {
        errors.push({ field: 'page', message: 'Page must be a positive integer' });
    }
    
    if (limit && (isNaN(limit) || parseInt(limit, 10) < 1 || parseInt(limit, 10) > 100)) {
        errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
    }
    
    if (search && typeof search !== 'string') {
        errors.push({ field: 'search', message: 'Search must be a string' });
    }
    
    if (occasion && isNaN(occasion)) {
        errors.push({ field: 'occasion', message: 'Occasion must be a valid ID' });
    }
    
    if (category && isNaN(category)) {
        errors.push({ field: 'category', message: 'Category must be a valid ID' });
    }
    
    return errors;
};

/**
 * @route GET /api/products
 * @desc Get all products with enhanced filtering and pagination
 * @access Public
 */
router.get('/', asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('get-all-products');
    
    try {
        const {
            page = 1,
            limit = 100,
            search,
            occasion,
            category,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        // Enhanced validation
        const validationErrors = validateProductFilters(req.query);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        logger.info('PRODUCTS_API', 'Fetching products with filters', {
            filters: { page, limit, search, occasion, category, sortBy, sortOrder },
            timestamp: new Date().toISOString()
        });

        // Build and execute query using fluent interface
        const { data: products, error: dbError, count } = await new ProductQueryBuilder(supabase)
            .withSearch(search)
            .withOccasion(occasion)
            .withCategory(category)
            .withPagination(page, limit)
            .withSorting(sortBy, sortOrder)
            .execute();

        if (dbError) {
            const errorInfo = classifyError(dbError);
            logger.error('PRODUCTS_API', 'Database error fetching products', {
                error: errorInfo,
                filters: req.query
            });
            
            return res.status(500).json({
                success: false,
                message: 'Error fetching products from database',
                details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
            });
        }

        // Process products with enhanced data handling
        const processedProducts = processProductData(products || []);
        
        // Enhanced pagination metadata
        const totalPages = count ? Math.ceil(count / parseInt(limit, 10)) : 1;
        const currentPage = parseInt(page, 10);
        
        performanceTracker.end();
        
        logger.success('PRODUCTS_API', 'Products fetched successfully', {
            count: processedProducts.length,
            totalCount: count,
            page: currentPage,
            totalPages,
            filters: { search, occasion, category },
            performance: performanceTracker.getDuration()
        });

        res.json({
            success: true,
            data: processedProducts,
            pagination: {
                page: currentPage,
                limit: parseInt(limit, 10),
                total: count || processedProducts.length,
                totalPages,
                hasMore: processedProducts.length === parseInt(limit, 10),
                hasPrevious: currentPage > 1,
                hasNext: currentPage < totalPages
            },
            meta: {
                filters: { search, occasion, category, sortBy, sortOrder },
                performance: performanceTracker.getDuration(),
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('PRODUCTS_API', 'Unexpected error fetching products', {
            error: errorInfo,
            query: req.query,
            performance: performanceTracker.getDuration()
        });

        throw error; // Let asyncErrorHandler handle it
    }
}));

/**
 * @route GET /api/products/:id
 * @desc Get a single product by ID with enhanced error handling
 * @access Public
 */
router.get('/:id', asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('get-product-by-id');
    
    try {
        const { id } = req.params;

        // Enhanced parameter validation
        const productId = parseInt(id, 10);
        if (isNaN(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID',
                details: {
                    field: 'id',
                    received: id,
                    expected: 'positive integer'
                }
            });
        }

        logger.info('PRODUCTS_API', 'Fetching product by ID', {
            productId,
            timestamp: new Date().toISOString()
        });

        // Fetch product from database
        const { data: product, error: dbError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (dbError || !product) {
            performanceTracker.end();
            
            const logLevel = dbError?.code === 'PGRST116' ? 'warn' : 'error';
            logger[logLevel]('PRODUCTS_API', 'Product not found', {
                productId,
                error: dbError?.message,
                performance: performanceTracker.getDuration()
            });

            return res.status(404).json({
                success: false,
                message: 'Product not found',
                details: {
                    productId,
                    suggestions: 'Verify the product ID exists in the database'
                }
            });
        }

        // Process single product data
        const [processedProduct] = processProductData([product]);
        
        // Enhanced image URL handling
        let imageUrl = processedProduct.image_url;
        const hasSupabaseImage = imageUrl !== '/images/placeholder-product.webp';
        
        if (!hasSupabaseImage) {
            // Try fallback placeholder
            imageUrl = '/images/placeholder-product-2.webp';
            logger.debug('PRODUCTS_API', 'Using fallback placeholder', {
                productId,
                reason: 'no valid image_url in database'
            });
        }

        // Enhanced response structure
        const enhancedProduct = {
            ...processedProduct,
            image_url: imageUrl,
            metadata: {
                hasSupabaseImage,
                fallbackUsed: !hasSupabaseImage,
                lastModified: processedProduct.updated_at || processedProduct.created_at
            }
        };

        performanceTracker.end();
        
        logger.success('PRODUCTS_API', 'Product fetched successfully', {
            productId,
            productName: processedProduct.name,
            hasSupabaseImage,
            performance: performanceTracker.getDuration()
        });

        res.json({
            success: true,
            data: enhancedProduct,
            meta: {
                performance: performanceTracker.getDuration(),
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('PRODUCTS_API', 'Unexpected error fetching product', {
            error: errorInfo,
            productId: req.params.id,
            performance: performanceTracker.getDuration()
        });

        throw error; // Let asyncErrorHandler handle it
    }
}));

// Enhanced exports with default export
export default router;