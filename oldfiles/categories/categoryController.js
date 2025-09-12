import {
    log,
    logger,
    requestLogger,
    startTimer
} from '../utils/bked_logger.js';

import { databaseService } from '../services/databaseService.js';
import { createPrismaLikeAPI } from '../services/queryBuilder.js';

// Initialize Prisma-like API
const db = createPrismaLikeAPI(databaseService.getClient());

/**
 * 📋 GET ALL CATEGORIES
 * Obtener todas las categorías con productos opcionales
 */
const getAllCategories = async (req, res) => {
    const timer = startTimer('getAllCategories');
    
    try {
        const {
            active = 'true',
            includeProducts = 'false',
            includeProductCount = 'true'
        } = req.query;

        logger.info(req.method, req.originalUrl, {
            query: req.query,
            userRole: req.user?.role
        });

        const whereClause = {};
        
        if (active !== 'all') {
            whereClause.active = active === 'true';
        }

        const includeOptions = {};
        
        if (includeProducts === 'true') {
            includeOptions.products = {
                select: ['id', 'name', 'price', 'featured', 'active']
            };
        }

        let categories = await db.category.findMany({
            where: whereClause,
            include: includeOptions,
            orderBy: { name: 'asc' }
        });

        // Add product count if requested
        if (includeProductCount === 'true' && includeProducts !== 'true') {
            for (let category of categories) {
                const productCount = await databaseService.count('products', { 
                    category_id: category.id,
                    active: true 
                });
                category.product_count = productCount;
            }
        }

        timer.end();
        
        res.json({
            success: true,
            data: categories
        });

    } catch (error) {
        timer.end();
        logger.error('Error in getAllCategories:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * 📄 GET CATEGORY BY ID
 * Obtener una categoría específica
 */
const getCategoryById = async (req, res) => {
    const timer = startTimer('getCategoryById');
    
    try {
        const { id } = req.params;
        const { includeProducts = 'false' } = req.query;
        
        logger.info(req.method, req.originalUrl, {
            categoryId: id,
            includeProducts,
            userRole: req.user?.role
        });

        const includeOptions = {};
        
        if (includeProducts === 'true') {
            includeOptions.products = {
                select: ['id', 'name', 'description', 'price', 'featured', 'active', 'created_at']
            };
        }

        const category = await db.category.findFirst({
            where: { id: parseInt(id) },
            include: includeOptions
        });

        if (!category) {
            timer.end();
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        timer.end();
        
        res.json({
            success: true,
            data: category
        });

    } catch (error) {
        timer.end();
        logger.error('Error in getCategoryById:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * ➕ CREATE CATEGORY
 * Crear una nueva categoría
 */
const createCategory = async (req, res) => {
    const timer = startTimer('createCategory');
    
    try {
        logger.info(req.method, req.originalUrl, {
            body: req.body,
            userRole: req.user?.role
        });

        const { name, description, image_url } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Check if category with same name exists
        const existingCategory = await db.category.findMany({
            where: { 
                name: { contains: name, mode: 'insensitive' }
            }
        });

        if (existingCategory.length > 0) {
            timer.end();
            return res.status(409).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        const categoryData = {
            name,
            description: description || null,
            image_url: image_url || null,
            active: true
        };

        const category = await db.category.create({
            data: categoryData
        });

        timer.end();
        
        res.status(201).json({
            success: true,
            data: category,
            message: 'Category created successfully'
        });

    } catch (error) {
        timer.end();
        logger.error('Error in createCategory:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * ✏️ UPDATE CATEGORY
 * Actualizar una categoría existente
 */
const updateCategory = async (req, res) => {
    const timer = startTimer('updateCategory');
    
    try {
        const { id } = req.params;
        
        logger.info(req.method, req.originalUrl, {
            categoryId: id,
            body: req.body,
            userRole: req.user?.role
        });

        // Check if category exists
        const existingCategory = await db.category.findFirst({
            where: { id: parseInt(id) }
        });

        if (!existingCategory) {
            timer.end();
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const updateData = {};
        
        // Update fields that are provided
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.description !== undefined) updateData.description = req.body.description;
        if (req.body.image_url !== undefined) updateData.image_url = req.body.image_url;
        if (req.body.active !== undefined) updateData.active = req.body.active === 'true' || req.body.active === true;

        updateData.updated_at = new Date().toISOString();

        // Check for name conflicts if name is being updated
        if (updateData.name && updateData.name !== existingCategory.name) {
            const nameConflict = await db.category.findMany({
                where: { 
                    name: { contains: updateData.name, mode: 'insensitive' }
                }
            });

            if (nameConflict.length > 0 && nameConflict[0].id !== parseInt(id)) {
                timer.end();
                return res.status(409).json({
                    success: false,
                    message: 'Category with this name already exists'
                });
            }
        }

        const updatedCategory = await databaseService.update('categories', updateData, { id: parseInt(id) });

        timer.end();
        
        res.json({
            success: true,
            data: updatedCategory[0],
            message: 'Category updated successfully'
        });

    } catch (error) {
        timer.end();
        logger.error('Error in updateCategory:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * 🗑️ DELETE CATEGORY
 * Eliminar una categoría (solo si no tiene productos)
 */
const deleteCategory = async (req, res) => {
    const timer = startTimer('deleteCategory');
    
    try {
        const { id } = req.params;
        const { force = 'false' } = req.query;
        
        logger.info(req.method, req.originalUrl, {
            categoryId: id,
            force,
            userRole: req.user?.role
        });

        // Check if category exists
        const existingCategory = await db.category.findFirst({
            where: { id: parseInt(id) }
        });

        if (!existingCategory) {
            timer.end();
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check for associated products
        const productCount = await databaseService.count('products', { category_id: parseInt(id) });

        if (productCount > 0 && force !== 'true') {
            timer.end();
            return res.status(409).json({
                success: false,
                message: `Cannot delete category with ${productCount} associated products. Use force=true to delete anyway.`,
                productCount
            });
        }

        // If force delete, update products to remove category reference
        if (productCount > 0 && force === 'true') {
            await databaseService.update('products', 
                { category_id: null }, 
                { category_id: parseInt(id) }
            );
            logger.warn(`Force deleted category ${id}, updated ${productCount} products to remove category reference`);
        }

        // Delete category
        await databaseService.delete('categories', { id: parseInt(id) });

        timer.end();
        
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });

    } catch (error) {
        timer.end();
        logger.error('Error in deleteCategory:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * 📊 GET CATEGORY STATS
 * Obtener estadísticas de categorías
 */
const getCategoryStats = async (req, res) => {
    const timer = startTimer('getCategoryStats');
    
    try {
        logger.info(req.method, req.originalUrl, {
            userRole: req.user?.role
        });

        const client = databaseService.getClient();
        
        // Get categories with product counts
        const { data: categoryStats } = await client
            .from('categories')
            .select(`
                id,
                name,
                active,
                products!inner(id)
            `)
            .eq('active', true);

        // Process stats
        const stats = categoryStats?.map(category => ({
            id: category.id,
            name: category.name,
            product_count: category.products?.length || 0
        })) || [];

        // Overall statistics
        const totalCategories = await databaseService.count('categories', { active: true });
        const totalProducts = await databaseService.count('products', { active: true });
        const uncategorizedProducts = await databaseService.count('products', { 
            active: true, 
            category_id: null 
        });

        timer.end();
        
        res.json({
            success: true,
            data: {
                categories: stats,
                totals: {
                    total_categories: totalCategories,
                    total_products: totalProducts,
                    uncategorized_products: uncategorizedProducts
                }
            }
        });

    } catch (error) {
        timer.end();
        logger.error('Error in getCategoryStats:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error fetching category statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats
};