import { body, query, param, validationResult } from 'express-validator';
import { ProductService } from '../services/ProductService.js';
import { supabaseService } from '../config/supabase.js';
const productService = new ProductService();
export class ProductController {
    async getCarousel(req, res) {
        try {
            const result = await productService.getCarouselProducts();
            res.status(200).json({
                success: true,
                data: result,
                message: 'Carousel products retrieved successfully'
            });
        }
        catch (error) {
            console.error('ProductController.getCarousel error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch carousel products',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getProducts(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid query parameters',
                    errors: errors.array()
                });
                return;
            }
            let sort_by = 'created_at';
            let sort_direction = 'desc';
            if (req.query.sort && typeof req.query.sort === 'string') {
                const [sortField, sortDir] = req.query.sort.split(':');
                if (sortField && sortDir) {
                    const fieldMap = {
                        'name': 'name',
                        'price': 'price_usd',
                        'created_at': 'created_at',
                        'carousel_order': 'carousel_order'
                    };
                    sort_by = fieldMap[sortField] ?? 'created_at';
                    sort_direction = sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc';
                }
            }
            const query = {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 20, 100),
                search: req.query.search || undefined,
                occasion: req.query.occasion || undefined,
                featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
                has_carousel_order: req.query.has_carousel_order === 'true' ? true : req.query.has_carousel_order === 'false' ? false : undefined,
                sort_by,
                sort_direction
            };
            const result = await productService.getProducts(query);
            res.status(200).json({
                success: true,
                data: result,
                message: 'Products retrieved successfully'
            });
        }
        catch (error) {
            console.error('ProductController.getProducts error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch products',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getFeatured(req, res) {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 8, 20);
            const products = await productService.getFeaturedProducts(limit);
            res.status(200).json({
                success: true,
                data: { products, count: products.length },
                message: 'Featured products retrieved successfully'
            });
        }
        catch (error) {
            console.error('ProductController.getFeatured error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch featured products',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getProductById(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid product ID',
                    errors: errors.array()
                });
                return;
            }
            const productId = parseInt(req.params.id);
            const product = await productService.getProductById(productId);
            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: { product },
                message: 'Product retrieved successfully'
            });
        }
        catch (error) {
            console.error('ProductController.getProductById error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getProductByIdWithOccasions(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid product ID',
                    errors: errors.array()
                });
                return;
            }
            const productId = parseInt(req.params.id);
            const product = await productService.getProductByIdWithOccasions(productId);
            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: { product },
                message: 'Product with occasions retrieved successfully'
            });
        }
        catch (error) {
            console.error('ProductController.getProductByIdWithOccasions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product with occasions',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async searchProducts(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid search parameters',
                    errors: errors.array()
                });
                return;
            }
            const searchTerm = req.query.q;
            if (!searchTerm) {
                res.status(400).json({
                    success: false,
                    message: 'Search term is required'
                });
                return;
            }
            const limit = Math.min(parseInt(req.query.limit) || 20, 50);
            const products = await productService.searchProducts(searchTerm, limit);
            res.status(200).json({
                success: true,
                data: { products, count: products.length },
                message: 'Search completed successfully'
            });
        }
        catch (error) {
            console.error('ProductController.searchProducts error:', error);
            res.status(500).json({
                success: false,
                message: 'Search failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async createProduct(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const productData = req.body;
            const product = await productService.createProduct(productData);
            res.status(201).json({
                success: true,
                data: { product },
                message: 'Product created successfully'
            });
        }
        catch (error) {
            console.error('ProductController.createProduct error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async updateProduct(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const productId = parseInt(req.params.id);
            const updateData = { ...req.body, id: productId };
            if (Object.keys(req.body).length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No update data provided'
                });
                return;
            }
            const product = await productService.updateProduct(updateData);
            res.status(200).json({
                success: true,
                data: { product },
                message: 'Product updated successfully'
            });
        }
        catch (error) {
            console.error('ProductController.updateProduct error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async updateCarouselOrder(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const productId = parseInt(req.params.id);
            const { carousel_order } = req.body;
            if (carousel_order !== null && (!Number.isInteger(carousel_order) || carousel_order < 1)) {
                res.status(400).json({
                    success: false,
                    message: 'carousel_order must be null or a positive integer'
                });
                return;
            }
            const product = await productService.updateCarouselOrder(productId, carousel_order);
            res.status(200).json({
                success: true,
                data: { product },
                message: 'Carousel order updated successfully'
            });
        }
        catch (error) {
            console.error('ProductController.updateCarouselOrder error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update carousel order',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async deleteProduct(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid product ID',
                    errors: errors.array()
                });
                return;
            }
            const productId = parseInt(req.params.id);
            const product = await productService.getProductById(productId);
            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
                return;
            }
            const hasReferences = await this.checkProductReferences(productId);
            if (hasReferences) {
                const updatedProduct = await productService.updateProduct({
                    id: productId,
                    active: false
                });
                res.status(200).json({
                    success: true,
                    data: {
                        product: updatedProduct,
                        deletion_type: 'logical',
                        has_references: true
                    },
                    message: 'Product deactivated successfully (has references in other tables)'
                });
            }
            else {
                await productService.deleteProduct(productId);
                res.status(204).send();
            }
        }
        catch (error) {
            console.error('ProductController.deleteProduct error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete product',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async checkProductReferences(productId) {
        try {
            const { data: images, error: imagesError } = await supabaseService
                .from('product_images')
                .select('id')
                .eq('product_id', productId)
                .limit(1);
            if (imagesError) {
                throw new Error(`Failed to check product images: ${imagesError.message}`);
            }
            if (images && images.length > 0) {
                return true;
            }
            const { data: occasions, error: occasionsError } = await supabaseService
                .from('product_occasions')
                .select('id')
                .eq('product_id', productId)
                .limit(1);
            if (occasionsError) {
                throw new Error(`Failed to check product occasions: ${occasionsError.message}`);
            }
            if (occasions && occasions.length > 0) {
                return true;
            }
            const { data: orderItems, error: orderItemsError } = await supabaseService
                .from('order_items')
                .select('id')
                .eq('product_id', productId)
                .limit(1);
            if (orderItemsError) {
                console.warn('Order items table may not exist yet:', orderItemsError.message);
            }
            else if (orderItems && orderItems.length > 0) {
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error checking product references:', error);
            throw error;
        }
    }
}
export const productValidators = {
    getProducts: [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('featured').optional().isIn(['true', 'false']).withMessage('featured must be true or false'),
        query('has_carousel_order').optional().isIn(['true', 'false']).withMessage('has_carousel_order must be true or false'),
        query('sort_by').optional().isIn(['name', 'price_usd', 'created_at', 'carousel_order']).withMessage('Invalid sort field'),
        query('sort_direction').optional().isIn(['asc', 'desc']).withMessage('Sort direction must be asc or desc')
    ],
    getProductById: [
        param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    ],
    getProductByIdWithOccasions: [
        param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    ],
    searchProducts: [
        query('q').notEmpty().isLength({ min: 2, max: 100 }).withMessage('Search query must be 2-100 characters'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    ],
    createProduct: [
        body('name').notEmpty().isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
        body('description').notEmpty().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
        body('summary').optional().isLength({ max: 500 }).withMessage('Summary must not exceed 500 characters'),
        body('price_usd').notEmpty().isDecimal().withMessage('price_usd must be a decimal string').custom((value) => {
            const price = parseFloat(value);
            if (price <= 0) {
                throw new Error('Price must be a positive number');
            }
            if (price > 999999.99) {
                throw new Error('Price cannot exceed $999,999.99');
            }
            return true;
        }),
        body('price_ves').optional().isDecimal().withMessage('price_ves must be a decimal'),
        body('stock').isInt({ min: 0, max: 999999 }).withMessage('Stock must be between 0 and 999,999'),
        body('sku').optional().isLength({ max: 100 }).withMessage('SKU must not exceed 100 characters'),
        body('active').optional().isBoolean().withMessage('active must be boolean'),
        body('featured').optional().isBoolean().withMessage('featured must be boolean'),
        body('carousel_order').optional().isInt({ min: 1 }).withMessage('Carousel order must be a positive integer'),
    ],
    updateProduct: [
        param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
        body('name').optional().isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
        body('description').optional().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
        body('summary').optional().isLength({ max: 500 }).withMessage('Summary must not exceed 500 characters'),
        body('price_usd').optional().isDecimal().withMessage('price_usd must be a decimal string').custom((value) => {
            const price = parseFloat(value);
            if (price <= 0) {
                throw new Error('Price must be a positive number');
            }
            if (price > 999999.99) {
                throw new Error('Price cannot exceed $999,999.99');
            }
            return true;
        }),
        body('price_ves').optional().isDecimal().withMessage('price_ves must be a decimal'),
        body('stock').optional().isInt({ min: 0, max: 999999 }).withMessage('Stock must be between 0 and 999,999'),
        body('sku').optional().isLength({ max: 100 }).withMessage('SKU must not exceed 100 characters'),
        body('active').optional().isBoolean().withMessage('active must be boolean'),
        body('featured').optional().isBoolean().withMessage('featured must be boolean'),
        body('carousel_order').optional().custom((value) => {
            if (value === null || (Number.isInteger(value) && value > 0)) {
                return true;
            }
            throw new Error('Carousel order must be null or positive integer');
        })
    ],
    updateCarouselOrder: [
        param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
        body('carousel_order').custom((value) => {
            if (value === null || (Number.isInteger(value) && value > 0)) {
                return true;
            }
            throw new Error('Carousel order must be null or positive integer');
        })
    ],
    deleteProduct: [
        param('id').isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    ]
};
