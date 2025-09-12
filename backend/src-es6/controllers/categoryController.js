/**
 * Category Controller - ES6+ Version
 * Enhanced with modern JavaScript features and improved patterns
 */

import { prisma } from '../config/prisma.js';
import { logger, trackUserAction, trackPerformance } from '../utils/logger.js';
import { asyncErrorHandler, classifyError } from '../utils/errorHandler.js';

// Enhanced Category Query Builder using class syntax
class CategoryQueryBuilder {
    constructor() {
        this.whereClause = {};
        this.includeClause = {};
        this.orderByClause = { name: 'asc' };
    }

    filterByActive = (active) => {
        if (active !== 'all') {
            this.whereClause.active = active === 'true';
        }
        return this;
    }

    includeProducts = (includeProducts) => {
        if (includeProducts === 'true') {
            this.includeClause.products = {
                where: { active: true },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    image_url: true,
                    featured: true,
                    description: true
                }
            };
        }
        return this;
    }

    sortBy = (field, order = 'asc') => {
        this.orderByClause = { [field]: order };
        return this;
    }

    build = () => ({
        where: this.whereClause,
        include: this.includeClause,
        orderBy: this.orderByClause
    })
}

// Enhanced validation schema with descriptive error messages
const validateCategoryData = (data, isUpdate = false) => {
    const errors = [];

    if (!isUpdate && !data.name?.trim()) {
        errors.push({
            field: 'name',
            message: 'Category name is required and cannot be empty',
            code: 'REQUIRED_FIELD'
        });
    }

    if (data.name && typeof data.name !== 'string') {
        errors.push({
            field: 'name',
            message: 'Category name must be a string',
            code: 'INVALID_TYPE'
        });
    }

    if (data.name && data.name.length > 100) {
        errors.push({
            field: 'name',
            message: 'Category name cannot exceed 100 characters',
            code: 'MAX_LENGTH_EXCEEDED'
        });
    }

    if (data.description && typeof data.description !== 'string') {
        errors.push({
            field: 'description',
            message: 'Description must be a string',
            code: 'INVALID_TYPE'
        });
    }

    if (data.image_url && typeof data.image_url !== 'string') {
        errors.push({
            field: 'image_url',
            message: 'Image URL must be a string',
            code: 'INVALID_TYPE'
        });
    }

    return errors;
};

// Get all categories with enhanced filtering and query building
export const getAllCategories = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('getAllCategories');

    try {
        const {
            active = 'true',
            includeProducts = 'false',
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Track user action
        trackUserAction(req.user, 'CATEGORY_LIST_VIEW', {
            filters: { active, includeProducts, sortBy, sortOrder },
            timestamp: new Date().toISOString()
        });

        // Build query using fluent interface
        const queryOptions = new CategoryQueryBuilder()
            .filterByActive(active)
            .includeProducts(includeProducts)
            .sortBy(sortBy, sortOrder)
            .build();

        const categories = await prisma.category.findMany(queryOptions);

        performanceTracker.end();

        logger.success('CATEGORY_CONTROLLER', 'Categories retrieved successfully', {
            count: categories.length,
            filters: { active, includeProducts, sortBy, sortOrder },
            performance: performanceTracker.getDuration()
        });

        res.json({ 
            success: true, 
            data: { 
                categories,
                meta: {
                    count: categories.length,
                    filters: { active, includeProducts, sortBy, sortOrder }
                }
            } 
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('CATEGORY_CONTROLLER', 'Failed to get categories', {
            error: errorInfo,
            query: req.query,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

// Get category by ID with enhanced error handling
export const getCategoryById = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('getCategoryById');

    try {
        const { id } = req.params;
        const { includeProducts = 'false' } = req.query;

        // Enhanced parameter validation
        const categoryId = parseInt(id, 10);
        if (isNaN(categoryId) || categoryId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID',
                details: {
                    field: 'id',
                    received: id,
                    expected: 'positive integer'
                }
            });
        }

        trackUserAction(req.user, 'CATEGORY_VIEW', {
            categoryId,
            includeProducts,
            timestamp: new Date().toISOString()
        });

        // Build query
        const queryOptions = new CategoryQueryBuilder()
            .includeProducts(includeProducts)
            .build();

        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            ...queryOptions
        });

        if (!category) {
            performanceTracker.end();
            
            logger.warn('CATEGORY_CONTROLLER', 'Category not found', { 
                categoryId,
                performance: performanceTracker.getDuration()
            });

            return res.status(404).json({ 
                success: false, 
                message: 'Category not found',
                details: {
                    categoryId,
                    suggestions: 'Verify the category ID exists in the database'
                }
            });
        }

        performanceTracker.end();

        logger.success('CATEGORY_CONTROLLER', 'Category retrieved successfully', {
            categoryId,
            categoryName: category.name,
            includeProducts,
            performance: performanceTracker.getDuration()
        });

        res.json({ 
            success: true, 
            data: category 
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('CATEGORY_CONTROLLER', 'Failed to get category by ID', {
            error: errorInfo,
            categoryId: req.params.id,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

// Create category with enhanced validation and transaction support
export const createCategory = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('createCategory');

    try {
        const {
            name,
            description,
            image_url,
            active = true
        } = req.body;

        // Enhanced validation
        const validationErrors = validateCategoryData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        trackUserAction(req.user, 'CATEGORY_CREATE', {
            categoryName: name,
            userRole: req.user?.role,
            timestamp: new Date().toISOString()
        });

        // Check for duplicate category name
        const existingCategory = await prisma.category.findFirst({
            where: { 
                name: {
                    equals: name.trim(),
                    mode: 'insensitive'
                }
            }
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: 'Category with this name already exists',
                details: {
                    field: 'name',
                    conflictingId: existingCategory.id
                }
            });
        }

        // Create category with enhanced data processing
        const categoryData = {
            name: name.trim(),
            description: description?.trim() || null,
            image_url: image_url?.trim() || null,
            active: Boolean(active)
        };

        const category = await prisma.category.create({
            data: categoryData
        });

        performanceTracker.end();

        logger.success('CATEGORY_CONTROLLER', 'Category created successfully', {
            categoryId: category.id,
            categoryName: category.name,
            createdBy: req.user?.email,
            performance: performanceTracker.getDuration()
        });

        res.status(201).json({ 
            success: true, 
            data: category,
            message: 'Category created successfully'
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('CATEGORY_CONTROLLER', 'Failed to create category', {
            error: errorInfo,
            categoryData: req.body,
            userId: req.user?.id,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

// Update category with enhanced validation and change tracking
export const updateCategory = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('updateCategory');

    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Parameter validation
        const categoryId = parseInt(id, 10);
        if (isNaN(categoryId) || categoryId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID',
                details: {
                    field: 'id',
                    received: id,
                    expected: 'positive integer'
                }
            });
        }

        // Data validation
        const validationErrors = validateCategoryData(updateData, true);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!existingCategory) {
            performanceTracker.end();
            
            logger.warn('CATEGORY_CONTROLLER', 'Category not found for update', { 
                categoryId,
                performance: performanceTracker.getDuration()
            });

            return res.status(404).json({ 
                success: false, 
                message: 'Category not found',
                details: {
                    categoryId,
                    suggestions: 'Verify the category ID exists in the database'
                }
            });
        }

        // Check for name conflicts (if name is being updated)
        if (updateData.name && updateData.name !== existingCategory.name) {
            const nameConflict = await prisma.category.findFirst({
                where: { 
                    name: {
                        equals: updateData.name.trim(),
                        mode: 'insensitive'
                    },
                    id: { not: categoryId }
                }
            });

            if (nameConflict) {
                return res.status(409).json({
                    success: false,
                    message: 'Category with this name already exists',
                    details: {
                        field: 'name',
                        conflictingId: nameConflict.id
                    }
                });
            }
        }

        // Process update data
        const processedUpdateData = {};
        if (updateData.name) processedUpdateData.name = updateData.name.trim();
        if (updateData.description !== undefined) processedUpdateData.description = updateData.description?.trim() || null;
        if (updateData.image_url !== undefined) processedUpdateData.image_url = updateData.image_url?.trim() || null;
        if (updateData.active !== undefined) processedUpdateData.active = Boolean(updateData.active);

        trackUserAction(req.user, 'CATEGORY_UPDATE', {
            categoryId,
            categoryName: existingCategory.name,
            changes: Object.keys(processedUpdateData),
            userRole: req.user?.role,
            timestamp: new Date().toISOString()
        });

        const category = await prisma.category.update({
            where: { id: categoryId },
            data: processedUpdateData
        });

        performanceTracker.end();

        logger.success('CATEGORY_CONTROLLER', 'Category updated successfully', {
            categoryId,
            categoryName: category.name,
            changes: Object.keys(processedUpdateData),
            updatedBy: req.user?.email,
            performance: performanceTracker.getDuration()
        });

        res.json({ 
            success: true, 
            data: category,
            message: 'Category updated successfully'
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('CATEGORY_CONTROLLER', 'Failed to update category', {
            error: errorInfo,
            categoryId: req.params.id,
            updateData: req.body,
            userId: req.user?.id,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

// Delete category with enhanced checks and cascade validation
export const deleteCategory = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('deleteCategory');

    try {
        const { id } = req.params;

        // Parameter validation
        const categoryId = parseInt(id, 10);
        if (isNaN(categoryId) || categoryId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID',
                details: {
                    field: 'id',
                    received: id,
                    expected: 'positive integer'
                }
            });
        }

        // Check category existence and relationships
        const existingCategory = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                products: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!existingCategory) {
            performanceTracker.end();
            
            logger.warn('CATEGORY_CONTROLLER', 'Category not found for deletion', { 
                categoryId,
                performance: performanceTracker.getDuration()
            });

            return res.status(404).json({ 
                success: false, 
                message: 'Category not found',
                details: {
                    categoryId,
                    suggestions: 'Verify the category ID exists in the database'
                }
            });
        }

        // Check for related products
        if (existingCategory.products && existingCategory.products.length > 0) {
            performanceTracker.end();
            
            logger.warn('CATEGORY_CONTROLLER', 'Cannot delete category with associated products', { 
                categoryId,
                categoryName: existingCategory.name,
                productsCount: existingCategory.products.length,
                relatedProducts: existingCategory.products.map(p => ({ id: p.id, name: p.name })),
                performance: performanceTracker.getDuration()
            });

            return res.status(400).json({
                success: false,
                message: 'Cannot delete category that has associated products',
                details: {
                    productsCount: existingCategory.products.length,
                    relatedProducts: existingCategory.products.map(p => ({ id: p.id, name: p.name })),
                    suggestions: 'Please move or delete the associated products first, or update them to use a different category'
                }
            });
        }

        trackUserAction(req.user, 'CATEGORY_DELETE', {
            categoryId,
            categoryName: existingCategory.name,
            userRole: req.user?.role,
            adminUser: req.user?.email,
            timestamp: new Date().toISOString()
        });

        // Delete category
        await prisma.category.delete({
            where: { id: categoryId }
        });

        performanceTracker.end();

        logger.success('CATEGORY_CONTROLLER', 'Category deleted successfully', {
            categoryId,
            categoryName: existingCategory.name,
            deletedBy: req.user?.email,
            performance: performanceTracker.getDuration()
        });

        res.json({ 
            success: true, 
            message: 'Category deleted successfully',
            data: {
                deletedCategory: {
                    id: existingCategory.id,
                    name: existingCategory.name
                }
            }
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('CATEGORY_CONTROLLER', 'Failed to delete category', {
            error: errorInfo,
            categoryId: req.params.id,
            userId: req.user?.id,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

// Enhanced exports with default export for main functionality
export default {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};