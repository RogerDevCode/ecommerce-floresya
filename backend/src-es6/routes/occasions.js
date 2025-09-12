/**
 * Occasions Routes - ES6+ Version
 * Enhanced with modern JavaScript patterns and improved error handling
 */

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logger, trackPerformance } from '../utils/logger.js';
import { asyncErrorHandler } from '../utils/errorHandler.js';
import {
    getAllOccasions,
    getOccasionById,
    getProductsByOccasion,
    createOccasion,
    updateOccasion,
    deleteOccasion,
    addProductToOccasion,
    removeProductFromOccasion,
    getProductOccasions
} from '../controllers/occasionController.js';

const router = express.Router();

// Enhanced parameter validation helper
const validateNumericId = (id, fieldName = 'id') => {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
        throw new Error(`Invalid ${fieldName}: expected positive integer, received '${id}'`);
    }
    return numericId;
};

/**
 * @route GET /api/occasions
 * @desc Get all occasions with enhanced caching and performance tracking
 * @access Public
 */
router.get('/', asyncErrorHandler(async (req, res, next) => {
    const performanceTracker = trackPerformance('get-all-occasions');
    
    logger.info('OCCASIONS_API', 'All occasions requested', {
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    try {
        await getAllOccasions(req, res, next);
        performanceTracker.end();
        
        logger.success('OCCASIONS_API', 'All occasions retrieved', {
            performance: performanceTracker.getDuration()
        });
    } catch (error) {
        performanceTracker.end();
        logger.error('OCCASIONS_API', 'Failed to retrieve occasions', {
            error: error.message,
            performance: performanceTracker.getDuration()
        });
        throw error;
    }
}));

/**
 * @route GET /api/occasions/:id
 * @desc Get specific occasion by ID with enhanced validation
 * @access Public
 */
router.get('/:id', asyncErrorHandler(async (req, res, next) => {
    const performanceTracker = trackPerformance('get-occasion-by-id');
    
    try {
        const occasionId = validateNumericId(req.params.id, 'occasion ID');
        
        logger.info('OCCASIONS_API', 'Occasion details requested', {
            occasionId,
            timestamp: new Date().toISOString()
        });

        // Add validated ID to params for controller
        req.params.validatedId = occasionId;
        
        await getOccasionById(req, res, next);
        performanceTracker.end();
        
        logger.success('OCCASIONS_API', 'Occasion details retrieved', {
            occasionId,
            performance: performanceTracker.getDuration()
        });
    } catch (error) {
        performanceTracker.end();
        
        if (error.message.includes('Invalid occasion ID')) {
            logger.warn('OCCASIONS_API', 'Invalid occasion ID provided', {
                providedId: req.params.id,
                performance: performanceTracker.getDuration()
            });
            
            return res.status(400).json({
                success: false,
                message: 'Invalid occasion ID',
                details: {
                    field: 'id',
                    received: req.params.id,
                    expected: 'positive integer'
                }
            });
        }
        
        logger.error('OCCASIONS_API', 'Failed to retrieve occasion', {
            occasionId: req.params.id,
            error: error.message,
            performance: performanceTracker.getDuration()
        });
        throw error;
    }
}));

/**
 * @route GET /api/occasions/:id/products
 * @desc Get products for specific occasion with enhanced filtering
 * @access Public
 */
router.get('/:id/products', asyncErrorHandler(async (req, res, next) => {
    const performanceTracker = trackPerformance('get-products-by-occasion');
    
    try {
        const occasionId = validateNumericId(req.params.id, 'occasion ID');
        const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = req.query;
        
        logger.info('OCCASIONS_API', 'Products by occasion requested', {
            occasionId,
            filters: { page, limit, sortBy, sortOrder },
            timestamp: new Date().toISOString()
        });

        req.params.validatedId = occasionId;
        
        await getProductsByOccasion(req, res, next);
        performanceTracker.end();
        
        logger.success('OCCASIONS_API', 'Products by occasion retrieved', {
            occasionId,
            performance: performanceTracker.getDuration()
        });
    } catch (error) {
        performanceTracker.end();
        
        if (error.message.includes('Invalid occasion ID')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid occasion ID',
                details: {
                    field: 'id',
                    received: req.params.id,
                    expected: 'positive integer'
                }
            });
        }
        
        logger.error('OCCASIONS_API', 'Failed to retrieve products by occasion', {
            occasionId: req.params.id,
            error: error.message,
            performance: performanceTracker.getDuration()
        });
        throw error;
    }
}));

/**
 * @route GET /api/occasions/products/:productId/occasions
 * @desc Get occasions for specific product
 * @access Public
 */
router.get('/products/:productId/occasions', asyncErrorHandler(async (req, res, next) => {
    const performanceTracker = trackPerformance('get-product-occasions');
    
    try {
        const productId = validateNumericId(req.params.productId, 'product ID');
        
        logger.info('OCCASIONS_API', 'Product occasions requested', {
            productId,
            timestamp: new Date().toISOString()
        });

        req.params.validatedProductId = productId;
        
        await getProductOccasions(req, res, next);
        performanceTracker.end();
        
        logger.success('OCCASIONS_API', 'Product occasions retrieved', {
            productId,
            performance: performanceTracker.getDuration()
        });
    } catch (error) {
        performanceTracker.end();
        
        if (error.message.includes('Invalid product ID')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID',
                details: {
                    field: 'productId',
                    received: req.params.productId,
                    expected: 'positive integer'
                }
            });
        }
        
        logger.error('OCCASIONS_API', 'Failed to retrieve product occasions', {
            productId: req.params.productId,
            error: error.message,
            performance: performanceTracker.getDuration()
        });
        throw error;
    }
}));

/**
 * @route POST /api/occasions
 * @desc Create new occasion (admin only) with enhanced validation
 * @access Private (Admin)
 */
router.post('/', 
    authenticateToken, 
    requireRole(['admin']), 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('create-occasion');
        
        logger.info('OCCASIONS_API', 'Occasion creation initiated', {
            adminId: req.user?.id,
            occasionName: req.body.name,
            timestamp: new Date().toISOString()
        });

        try {
            await createOccasion(req, res, next);
            performanceTracker.end();
            
            logger.success('OCCASIONS_API', 'Occasion created successfully', {
                adminId: req.user?.id,
                occasionName: req.body.name,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            logger.error('OCCASIONS_API', 'Occasion creation failed', {
                adminId: req.user?.id,
                occasionName: req.body.name,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route PUT /api/occasions/:id
 * @desc Update occasion (admin only) with enhanced audit logging
 * @access Private (Admin)
 */
router.put('/:id', 
    authenticateToken, 
    requireRole(['admin']), 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('update-occasion');
        
        try {
            const occasionId = validateNumericId(req.params.id, 'occasion ID');
            const updatedFields = Object.keys(req.body);
            
            logger.info('OCCASIONS_API', 'Occasion update initiated', {
                occasionId,
                adminId: req.user?.id,
                updatedFields,
                timestamp: new Date().toISOString()
            });

            req.params.validatedId = occasionId;
            
            await updateOccasion(req, res, next);
            performanceTracker.end();
            
            logger.success('OCCASIONS_API', 'Occasion updated successfully', {
                occasionId,
                adminId: req.user?.id,
                updatedFields,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            
            if (error.message.includes('Invalid occasion ID')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid occasion ID',
                    details: {
                        field: 'id',
                        received: req.params.id,
                        expected: 'positive integer'
                    }
                });
            }
            
            logger.error('OCCASIONS_API', 'Occasion update failed', {
                occasionId: req.params.id,
                adminId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route DELETE /api/occasions/:id
 * @desc Delete occasion (admin only) with cascade validation
 * @access Private (Admin)
 */
router.delete('/:id', 
    authenticateToken, 
    requireRole(['admin']), 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('delete-occasion');
        
        try {
            const occasionId = validateNumericId(req.params.id, 'occasion ID');
            
            logger.warn('OCCASIONS_API', 'Occasion deletion initiated', {
                occasionId,
                adminId: req.user?.id,
                timestamp: new Date().toISOString(),
                securityAlert: true
            });

            req.params.validatedId = occasionId;
            
            await deleteOccasion(req, res, next);
            performanceTracker.end();
            
            logger.success('OCCASIONS_API', 'Occasion deleted successfully', {
                occasionId,
                adminId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            
            if (error.message.includes('Invalid occasion ID')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid occasion ID',
                    details: {
                        field: 'id',
                        received: req.params.id,
                        expected: 'positive integer'
                    }
                });
            }
            
            logger.error('OCCASIONS_API', 'Occasion deletion failed', {
                occasionId: req.params.id,
                adminId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route POST /api/occasions/:id/products/:productId
 * @desc Add product to occasion (admin only)
 * @access Private (Admin)
 */
router.post('/:id/products/:productId', 
    authenticateToken, 
    requireRole(['admin']), 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('add-product-to-occasion');
        
        try {
            const occasionId = validateNumericId(req.params.id, 'occasion ID');
            const productId = validateNumericId(req.params.productId, 'product ID');
            
            logger.info('OCCASIONS_API', 'Adding product to occasion', {
                occasionId,
                productId,
                adminId: req.user?.id,
                timestamp: new Date().toISOString()
            });

            req.params.validatedId = occasionId;
            req.params.validatedProductId = productId;
            
            await addProductToOccasion(req, res, next);
            performanceTracker.end();
            
            logger.success('OCCASIONS_API', 'Product added to occasion successfully', {
                occasionId,
                productId,
                adminId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            
            if (error.message.includes('Invalid')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    details: {
                        occasionId: req.params.id,
                        productId: req.params.productId,
                        expected: 'positive integers'
                    }
                });
            }
            
            logger.error('OCCASIONS_API', 'Failed to add product to occasion', {
                occasionId: req.params.id,
                productId: req.params.productId,
                adminId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route DELETE /api/occasions/:id/products/:productId
 * @desc Remove product from occasion (admin only)
 * @access Private (Admin)
 */
router.delete('/:id/products/:productId', 
    authenticateToken, 
    requireRole(['admin']), 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('remove-product-from-occasion');
        
        try {
            const occasionId = validateNumericId(req.params.id, 'occasion ID');
            const productId = validateNumericId(req.params.productId, 'product ID');
            
            logger.info('OCCASIONS_API', 'Removing product from occasion', {
                occasionId,
                productId,
                adminId: req.user?.id,
                timestamp: new Date().toISOString()
            });

            req.params.validatedId = occasionId;
            req.params.validatedProductId = productId;
            
            await removeProductFromOccasion(req, res, next);
            performanceTracker.end();
            
            logger.success('OCCASIONS_API', 'Product removed from occasion successfully', {
                occasionId,
                productId,
                adminId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            
            if (error.message.includes('Invalid')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    details: {
                        occasionId: req.params.id,
                        productId: req.params.productId,
                        expected: 'positive integers'
                    }
                });
            }
            
            logger.error('OCCASIONS_API', 'Failed to remove product from occasion', {
                occasionId: req.params.id,
                productId: req.params.productId,
                adminId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

export default router;