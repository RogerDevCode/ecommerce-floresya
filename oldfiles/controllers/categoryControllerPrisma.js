import {
    log,
    logger,
    requestLogger,
    startTimer
} from '../utils/bked_logger.js';

import { prisma } from '../config/prisma.js';

const getAllCategories = async (req, res) => {
    const timer = startTimer('getAllCategories');
    
    try {
        const {
            active = 'true',
            includeProducts = 'false',
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        try {
            logger.info(req.method, req.originalUrl, {
                query: req.query,
                userRole: req.user?.role
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        const whereClause = {};
        if (active !== 'all') {
            whereClause.active = active === 'true';
        }

        const orderBy = {};
        orderBy[sortBy] = sortOrder;

        const includeClause = {};
        if (includeProducts === 'true') {
            includeClause.products = {
                where: { active: true },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    image_url: true,
                    featured: true
                }
            };
        }

        const categories = await prisma.category.findMany({
            where: whereClause,
            include: includeClause,
            orderBy
        });

        timer.end();
        
        try {
            logger.success('CONTROLLER', 'getAllCategories completed successfully', {
                count: categories.length,
                includeProducts
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        res.json({ 
            success: true, 
            data: { categories } 
        });

    } catch (error) {
        timer.end();
        try {
            logger.error('CONTROLLER', 'getAllCategories failed', {
                error: error.message
            }, error);
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getCategoryById = async (req, res) => {
    const timer = startTimer('getCategoryById');
    
    try {
        const { id } = req.params;
        const { includeProducts = 'false' } = req.query;

        try {
            logger.info(req.method, req.originalUrl, {
                params: req.params,
                query: req.query,
                userRole: req.user?.role
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        const includeClause = {};
        if (includeProducts === 'true') {
            includeClause.products = {
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

        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
            include: includeClause
        });

        if (!category) {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Category not found', { categoryId: id });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        timer.end();
        
        try {
            logger.success('CONTROLLER', 'getCategoryById completed successfully', {
                categoryId: id,
                categoryName: category.name
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        res.json({ 
            success: true, 
            data: category 
        });

    } catch (error) {
        timer.end();
        try {
            logger.error('CONTROLLER', 'getCategoryById failed', {
                categoryId: req.params.id,
                error: error.message
            }, error);
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const createCategory = async (req, res) => {
    const timer = startTimer('createCategory');
    
    try {
        const {
            name,
            description,
            image_url,
            active = true
        } = req.body;

        try {
            logger.info(req.method, req.originalUrl, {
                body: { name, description, active },
                userRole: req.user?.role
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        if (!name) {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Missing required fields for category creation', {
                    name: !!name
                });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        const category = await prisma.category.create({
            data: {
                name,
                description,
                image_url,
                active: Boolean(active)
            }
        });

        timer.end();
        
        try {
            logger.success('CONTROLLER', 'createCategory completed successfully', {
                categoryId: category.id,
                categoryName: category.name
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        res.status(201).json({ 
            success: true, 
            data: category 
        });

    } catch (error) {
        timer.end();
        try {
            logger.error('CONTROLLER', 'createCategory failed', {
                categoryName: req.body.name,
                error: error.message
            }, error);
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const updateCategory = async (req, res) => {
    const timer = startTimer('updateCategory');
    
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        try {
            logger.info(req.method, req.originalUrl, {
                params: req.params,
                body: updateData,
                userRole: req.user?.role
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        const existingCategory = await prisma.category.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingCategory) {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Category not found for update', { categoryId: id });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        timer.end();
        
        try {
            logger.success('CONTROLLER', 'updateCategory completed successfully', {
                categoryId: id,
                categoryName: category.name
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        res.json({ 
            success: true, 
            data: category 
        });

    } catch (error) {
        timer.end();
        try {
            logger.error('CONTROLLER', 'updateCategory failed', {
                categoryId: req.params.id,
                error: error.message
            }, error);
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const deleteCategory = async (req, res) => {
    const timer = startTimer('deleteCategory');
    
    try {
        const { id } = req.params;

        try {
            logger.info(req.method, req.originalUrl, {
                params: req.params,
                userRole: req.user?.role
            });

            logger.warn('CONTROLLER', 'Attempting to delete category', {
                categoryId: id,
                adminUser: req.user?.email
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        const existingCategory = await prisma.category.findUnique({
            where: { id: parseInt(id) },
            include: {
                products: true
            }
        });

        if (!existingCategory) {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Category not found for deletion', { categoryId: id });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        if (existingCategory.products && existingCategory.products.length > 0) {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Cannot delete category with products', { 
                    categoryId: id,
                    productsCount: existingCategory.products.length 
                });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category that has products. Please move or delete the products first.'
            });
        }

        await prisma.category.delete({
            where: { id: parseInt(id) }
        });

        timer.end();
        
        try {
            logger.success('CONTROLLER', 'deleteCategory completed successfully', {
                categoryId: id,
                categoryName: existingCategory.name
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        res.json({ 
            success: true, 
            message: 'Category deleted successfully' 
        });

    } catch (error) {
        timer.end();
        try {
            logger.error('CONTROLLER', 'deleteCategory failed', {
                categoryId: req.params.id,
                error: error.message
            }, error);
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export { 
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
