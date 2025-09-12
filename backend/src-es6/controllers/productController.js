/**
 * Product Controller ES6+ Version
 * Enhanced with modern JavaScript features, better error handling and performance optimizations
 */

import { prisma, executeTransaction } from '../config/prisma.js';
import { logger, trackUserAction, trackPerformance } from '../utils/logger.js';
import { asyncErrorHandler, classifyError } from '../utils/errorHandler.js';

// Constants for better maintainability
const DEFAULT_PAGINATION = {
    page: 1,
    limit: 20,
    maxLimit: 100
};

const DEFAULT_SORT = {
    sortBy: 'created_at',
    sortOrder: 'desc'
};

const SEARCH_FIELDS = ['name', 'description'];

/**
 * Enhanced query builder using ES6+ features
 */
class ProductQueryBuilder {
    constructor() {
        this.whereClause = {};
        this.includeClause = {
            category: {
                select: {
                    id: true,
                    name: true
                }
            }
        };
        this.orderByClause = {};
    }

    // Method chaining with fluent interface
    filterByActive(active) {
        if (active !== 'all') {
            this.whereClause.active = active === 'true';
        }
        return this;
    }

    filterByFeatured(featured) {
        if (featured !== undefined) {
            this.whereClause.featured = featured === 'true';
        }
        return this;
    }

    filterByOccasion(occasion) {
        if (occasion) {
            this.whereClause.occasion = occasion;
        }
        return this;
    }

    filterBySearch(search) {
        if (search) {
            this.whereClause.OR = SEARCH_FIELDS.map(field => ({
                [field]: { contains: search, mode: 'insensitive' }
            }));
        }
        return this;
    }

    filterByCategory(categoryId) {
        if (categoryId) {
            this.whereClause.category_id = parseInt(categoryId, 10);
        }
        return this;
    }

    sortBy(sortBy = DEFAULT_SORT.sortBy, sortOrder = DEFAULT_SORT.sortOrder) {
        this.orderByClause[sortBy] = sortOrder;
        return this;
    }

    includeCategoryDetails(includeDetails = false) {
        if (includeDetails) {
            this.includeClause.category.select.description = true;
            this.includeClause.category.select.image_url = true;
            this.includeClause.category.select.active = true;
        }
        return this;
    }

    build() {
        return {
            where: this.whereClause,
            include: this.includeClause,
            orderBy: this.orderByClause
        };
    }
}

/**
 * Enhanced pagination helper
 */
const buildPaginationResponse = (page, limit, total) => {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = Math.min(parseInt(limit, 10), DEFAULT_PAGINATION.maxLimit);
    const totalPages = Math.ceil(total / parsedLimit);

    return {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1,
        startIndex: (parsedPage - 1) * parsedLimit + 1,
        endIndex: Math.min(parsedPage * parsedLimit, total)
    };
};

/**
 * Get all products with enhanced filtering and pagination
 */
const getAllProducts = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('getAllProducts');
    
    try {
        const {
            page = DEFAULT_PAGINATION.page,
            limit = DEFAULT_PAGINATION.limit,
            active = 'true',
            featured,
            occasion,
            search,
            category_id,
            sortBy = DEFAULT_SORT.sortBy,
            sortOrder = DEFAULT_SORT.sortOrder,
            include_details = 'false'
        } = req.query;

        // Track user action
        trackUserAction('PRODUCTS_LIST_VIEW', {
            filters: { active, featured, occasion, search, category_id },
            pagination: { page, limit },
            userAgent: req.get('User-Agent')
        });

        const offset = (parseInt(page, 10) - 1) * Math.min(parseInt(limit, 10), DEFAULT_PAGINATION.maxLimit);
        
        // Build query using fluent interface
        const queryBuilder = new ProductQueryBuilder()
            .filterByActive(active)
            .filterByFeatured(featured)
            .filterByOccasion(occasion)
            .filterBySearch(search)
            .filterByCategory(category_id)
            .sortBy(sortBy, sortOrder)
            .includeCategoryDetails(include_details === 'true');

        const query = queryBuilder.build();

        // Execute queries in parallel for better performance
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                ...query,
                skip: offset,
                take: Math.min(parseInt(limit, 10), DEFAULT_PAGINATION.maxLimit)
            }),
            prisma.product.count({ where: query.where })
        ]);

        const pagination = buildPaginationResponse(page, limit, total);
        
        // Track performance
        performanceTracker.end();
        logger.success('PRODUCT_CONTROLLER', 'Products retrieved successfully', {
            count: products.length,
            total,
            filters: Object.keys(query.where),
            performance: performanceTracker.getDuration()
        });

        logger.info('PRODUCT_CONTROLLER', 'Products retrieved successfully', {
            total,
            page: pagination.page,
            filtersApplied: Object.keys(query.where).length
        });

        res.json({
            success: true,
            data: products,
            pagination,
            meta: {
                filtersApplied: Object.keys(query.where).length,
                queryTime: `${duration.toFixed(2)}ms`
            }
        });

    } catch (error) {
        performanceTracker.end();
        const errorInfo = classifyError(error);
        logger.error('PRODUCT_CONTROLLER', 'Failed to get all products', {
            error: errorInfo,
            query: req.query,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

/**
 * Get single product by ID with enhanced error handling
 */
const getProductById = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('getProductById');
    
    try {
        const { id } = req.params;
        const { include_details = 'true' } = req.query;

        if (!id || isNaN(parseInt(id, 10))) {
            return errorHandlers.handleValidationError(res, 
                new Error('Invalid product ID'), 
                { field: 'id', message: 'Must be a valid number' },
                'getProductById'
            );
        }

        // Track user action
        trackUserAction('PRODUCT_DETAIL_VIEW', {
            productId: id,
            includeDetails: include_details === 'true',
            userAgent: req.get('User-Agent')
        });

        const queryBuilder = new ProductQueryBuilder()
            .includeCategoryDetails(include_details === 'true');
        
        const query = queryBuilder.build();

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id, 10) },
            include: query.include
        });

        if (!product) {
            performanceTracker.end();
            return errorHandlers.handleNotFoundError(res, 'getProductById', 'product');
        }

        // Track performance
        performanceTracker.end();
        logger.success('PRODUCT_CONTROLLER', 'Product retrieved successfully', {
            productId: id,
            productName: product.name,
            performance: performanceTracker.getDuration()
        });

        logger.info('PRODUCT_CONTROLLER', 'Product retrieved successfully', {
            productId: id,
            productName: product.name
        });

        res.json({
            success: true,
            data: product,
            meta: {
                queryTime: `${duration.toFixed(2)}ms`
            }
        });

    } catch (error) {
        performanceTracker.end();
        const errorInfo = classifyError(error);
        logger.error('PRODUCT_CONTROLLER', 'Failed to get product by ID', {
            error: errorInfo,
            productId: req.params.id,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

/**
 * Get featured products with caching considerations
 */
const getFeaturedProducts = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('getFeaturedProducts');
    
    try {
        const { 
            limit = 6, 
            category_id,
            include_details = 'false' 
        } = req.query;

        const queryBuilder = new ProductQueryBuilder()
            .filterByActive('true')
            .filterByFeatured('true')
            .filterByCategory(category_id)
            .sortBy('created_at', 'desc')
            .includeCategoryDetails(include_details === 'true');

        const query = queryBuilder.build();

        const products = await prisma.product.findMany({
            ...query,
            take: Math.min(parseInt(limit, 10), 20) // Max 20 featured products
        });

        performanceTracker.end();
        trackPerformance('featured_products_query_time', duration, { 
            count: products.length,
            categoryFilter: !!category_id 
        });

        logger.info('PRODUCT_CONTROLLER', 'Featured products retrieved', {
            count: products.length,
            categoryFilter: category_id || 'none'
        });

        res.json({
            success: true,
            data: products,
            meta: {
                count: products.length,
                queryTime: `${duration.toFixed(2)}ms`
            }
        });

    } catch (error) {
        performanceTracker.end();
        const errorInfo = classifyError(error);
        logger.error('PRODUCT_CONTROLLER', 'Failed to get featured products', {
            error: errorInfo,
            query: req.query,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

/**
 * Create product with enhanced validation and transaction
 */
const createProduct = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('createProduct');
    
    try {
        const {
            name,
            description,
            price,
            category_id,
            stock_quantity = 0,
            image_url,
            additional_images,
            primary_image,
            active = true,
            featured = false,
            show_on_homepage = false,
            homepage_order = 0,
            occasion = 'other'
        } = req.body;

        // Enhanced validation
        const validationErrors = [];
        if (!name?.trim()) validationErrors.push({ field: 'name', message: 'Name is required' });
        if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            validationErrors.push({ field: 'price', message: 'Price must be a positive number' });
        }
        if (category_id && isNaN(parseInt(category_id, 10))) {
            validationErrors.push({ field: 'category_id', message: 'Category ID must be a valid number' });
        }

        if (validationErrors.length > 0) {
            performanceTracker.end();
            return errorHandlers.handleValidationError(res, 
                new Error('Validation failed'), 
                validationErrors, 
                'createProduct'
            );
        }

        // Track user action
        trackUserAction('PRODUCT_CREATE_ATTEMPT', {
            productName: name,
            price: parseFloat(price),
            categoryId: category_id,
            userAgent: req.get('User-Agent')
        });

        // Build product data with type conversions
        const productData = {
            name: name.trim(),
            description: description?.trim(),
            price: parseFloat(price),
            stock_quantity: Math.max(0, parseInt(stock_quantity, 10) || 0),
            image_url,
            additional_images,
            primary_image,
            active: Boolean(active),
            featured: Boolean(featured),
            show_on_homepage: Boolean(show_on_homepage),
            homepage_order: parseInt(homepage_order, 10) || 0,
            occasion
        };

        if (category_id) {
            productData.category_id = parseInt(category_id, 10);
        }

        // Create product with transaction for data consistency
        const result = await executeTransaction(async (tx) => {
            return await tx.product.create({
                data: productData,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    }
                }
            });
        });

        if (!result.success) {
            throw result.error;
        }

        const product = result.result;
        performanceTracker.end();
        
        trackPerformance('product_create_time', duration, { productId: product.id });
        trackUserAction('PRODUCT_CREATED_SUCCESS', {
            productId: product.id,
            productName: product.name
        });

        logger.success('PRODUCT_CONTROLLER', 'Product created successfully', {
            productId: product.id,
            productName: product.name,
            price: product.price
        });

        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully',
            meta: {
                queryTime: `${duration.toFixed(2)}ms`
            }
        });

    } catch (error) {
        performanceTracker.end();
        trackUserAction('PRODUCT_CREATE_FAILED', {
            error: error.message,
            productName: req.body.name
        });
        const errorInfo = classifyError(error);
        logger.error('PRODUCT_CONTROLLER', 'Failed to create product', {
            error: errorInfo,
            productData: req.body,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

/**
 * Update product with optimistic updates and validation
 */
const updateProduct = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('updateProduct');
    
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (!id || isNaN(parseInt(id, 10))) {
            return errorHandlers.handleValidationError(res,
                new Error('Invalid product ID'),
                { field: 'id', message: 'Must be a valid number' },
                'updateProduct'
            );
        }

        // Type conversions for update data
        const typeConverters = {
            price: (val) => val !== undefined ? parseFloat(val) : undefined,
            stock_quantity: (val) => val !== undefined ? Math.max(0, parseInt(val, 10)) : undefined,
            category_id: (val) => val !== undefined ? parseInt(val, 10) : undefined,
            homepage_order: (val) => val !== undefined ? parseInt(val, 10) : undefined,
            active: (val) => val !== undefined ? Boolean(val) : undefined,
            featured: (val) => val !== undefined ? Boolean(val) : undefined,
            show_on_homepage: (val) => val !== undefined ? Boolean(val) : undefined
        };

        // Apply type conversions
        for (const [key, converter] of Object.entries(typeConverters)) {
            if (updateData[key] !== undefined) {
                updateData[key] = converter(updateData[key]);
            }
        }

        // Clean update data (remove undefined values)
        const cleanUpdateData = Object.fromEntries(
            Object.entries(updateData).filter(([, value]) => value !== undefined)
        );

        trackUserAction('PRODUCT_UPDATE_ATTEMPT', {
            productId: id,
            fieldsUpdated: Object.keys(cleanUpdateData),
            userAgent: req.get('User-Agent')
        });

        // Update with transaction
        const result = await executeTransaction(async (tx) => {
            // Check if product exists
            const existingProduct = await tx.product.findUnique({
                where: { id: parseInt(id, 10) }
            });

            if (!existingProduct) {
                throw new Error(`Product with ID ${id} not found`);
            }

            // Perform update
            return await tx.product.update({
                where: { id: parseInt(id, 10) },
                data: cleanUpdateData,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            description: true
                        }
                    }
                }
            });
        });

        if (!result.success) {
            throw result.error;
        }

        const product = result.result;
        performanceTracker.end();
        
        trackPerformance('product_update_time', duration, { productId: id });
        trackUserAction('PRODUCT_UPDATED_SUCCESS', {
            productId: id,
            fieldsUpdated: Object.keys(cleanUpdateData)
        });

        logger.success('PRODUCT_CONTROLLER', 'Product updated successfully', {
            productId: id,
            productName: product.name,
            fieldsUpdated: Object.keys(cleanUpdateData).length
        });

        res.json({
            success: true,
            data: product,
            message: 'Product updated successfully',
            meta: {
                fieldsUpdated: Object.keys(cleanUpdateData),
                queryTime: `${duration.toFixed(2)}ms`
            }
        });

    } catch (error) {
        performanceTracker.end();
        if (error.message.includes('not found')) {
            return errorHandlers.handleNotFoundError(res, 'updateProduct', 'product');
        }
        const errorInfo = classifyError(error);
        logger.error('PRODUCT_CONTROLLER', 'Failed to update product', {
            error: errorInfo,
            productId: req.params.id,
            updateData: req.body,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

/**
 * Delete product with cascade handling
 */
const deleteProduct = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('deleteProduct');
    
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return errorHandlers.handleValidationError(res,
                new Error('Invalid product ID'),
                { field: 'id', message: 'Must be a valid number' },
                'deleteProduct'
            );
        }

        trackUserAction('PRODUCT_DELETE_ATTEMPT', {
            productId: id,
            userAgent: req.get('User-Agent')
        });

        // Delete with transaction to handle potential cascades
        const result = await executeTransaction(async (tx) => {
            // Check if product exists and get info
            const existingProduct = await tx.product.findUnique({
                where: { id: parseInt(id, 10) },
                select: { id: true, name: true }
            });

            if (!existingProduct) {
                throw new Error(`Product with ID ${id} not found`);
            }

            // Check for related records that might prevent deletion
            const relatedOrders = await tx.orderItem.findFirst({
                where: { product_id: parseInt(id, 10) }
            });

            if (relatedOrders) {
                throw new Error('Cannot delete product with existing orders');
            }

            // Perform deletion
            await tx.product.delete({
                where: { id: parseInt(id, 10) }
            });

            return existingProduct;
        });

        if (!result.success) {
            throw result.error;
        }

        const deletedProduct = result.result;
        performanceTracker.end();
        
        trackPerformance('product_delete_time', duration, { productId: id });
        trackUserAction('PRODUCT_DELETED_SUCCESS', {
            productId: id,
            productName: deletedProduct.name
        });

        logger.warn('PRODUCT_CONTROLLER', 'Product deleted', {
            productId: id,
            productName: deletedProduct.name,
            deletedBy: req.user?.email || 'unknown'
        });

        res.json({
            success: true,
            message: 'Product deleted successfully',
            data: { deletedProduct: { id: deletedProduct.id, name: deletedProduct.name } },
            meta: {
                queryTime: `${duration.toFixed(2)}ms`
            }
        });

    } catch (error) {
        performanceTracker.end();
        if (error.message.includes('not found')) {
            return errorHandlers.handleNotFoundError(res, 'deleteProduct', 'product');
        }
        if (error.message.includes('existing orders')) {
            return errorHandlers.handleValidationError(res, error, 
                { field: 'product', message: 'Product has existing orders and cannot be deleted' },
                'deleteProduct'
            );
        }
        const errorInfo = classifyError(error);
        logger.error('PRODUCT_CONTROLLER', 'Failed to delete product', {
            error: errorInfo,
            productId: req.params.id,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

/**
 * Get homepage products with ordering
 */
const getHomepageProducts = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('getHomepageProducts');
    
    try {
        const products = await prisma.product.findMany({
            where: {
                show_on_homepage: true,
                active: true
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                homepage_order: 'asc'
            }
        });

        performanceTracker.end();
        trackPerformance('homepage_products_query_time', duration, { count: products.length });

        logger.info('PRODUCT_CONTROLLER', 'Homepage products retrieved', {
            count: products.length
        });

        res.json({
            success: true,
            data: products,
            meta: {
                count: products.length,
                queryTime: `${duration.toFixed(2)}ms`
            }
        });

    } catch (error) {
        performanceTracker.end();
        const errorInfo = classifyError(error);
        logger.error('PRODUCT_CONTROLLER', 'Failed to get homepage products', {
            error: errorInfo,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

/**
 * Update homepage settings with bulk operations
 */
const updateHomepageSettings = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('updateHomepageSettings');
    
    try {
        const { products } = req.body;

        if (!Array.isArray(products)) {
            return errorHandlers.handleValidationError(res,
                new Error('Invalid products array'),
                { field: 'products', message: 'Must be an array of product objects' },
                'updateHomepageSettings'
            );
        }

        if (products.length > 20) {
            return errorHandlers.handleValidationError(res,
                new Error('Too many homepage products'),
                { field: 'products', message: 'Maximum 20 products allowed on homepage' },
                'updateHomepageSettings'
            );
        }

        // Bulk update with transaction
        const result = await executeTransaction(async (tx) => {
            // Reset all products
            await tx.product.updateMany({
                data: { show_on_homepage: false, homepage_order: 0 }
            });

            // Set new homepage products
            const updatePromises = products.map((product, index) => {
                if (!product.id || isNaN(parseInt(product.id, 10))) {
                    throw new Error(`Invalid product ID at index ${index}`);
                }

                return tx.product.update({
                    where: { id: parseInt(product.id, 10) },
                    data: {
                        show_on_homepage: true,
                        homepage_order: index + 1
                    }
                });
            });

            return await Promise.all(updatePromises);
        });

        if (!result.success) {
            throw result.error;
        }

        performanceTracker.end();
        trackPerformance('homepage_settings_update_time', duration, { 
            productsUpdated: products.length 
        });

        logger.success('PRODUCT_CONTROLLER', 'Homepage settings updated', {
            productsUpdated: products.length,
            updatedBy: req.user?.email || 'unknown'
        });

        res.json({
            success: true,
            message: 'Homepage settings updated successfully',
            meta: {
                productsUpdated: products.length,
                queryTime: `${duration.toFixed(2)}ms`
            }
        });

    } catch (error) {
        performanceTracker.end();
        const errorInfo = classifyError(error);
        logger.error('PRODUCT_CONTROLLER', 'Failed to update homepage settings', {
            error: errorInfo,
            productsData: req.body,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

// ES6+ exports with named exports
export {
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    getHomepageProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateHomepageSettings,
    ProductQueryBuilder // Export for testing
};

// Default export for main functionality
export default {
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    getHomepageProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateHomepageSettings
};