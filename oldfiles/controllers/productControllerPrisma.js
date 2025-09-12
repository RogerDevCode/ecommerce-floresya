import {
    log,
    logger,
    requestLogger,
    startTimer
} from '../utils/bked_logger.js';

import dbAdapter from '../config/database_adapter.js';

const getAllProducts = async (req, res) => {
    const timer = startTimer('getAllProducts');
    
    try {
        const {
            page = 1,
            limit = 20,
            active = 'true',
            featured,
            occasion,
            search,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        logger.info(req.method, req.originalUrl, {
            query: req.query,
            userRole: req.user?.role
        });

        const whereClause = {};

        if (active !== 'all') {
            whereClause.active = active === 'true';
        }

        if (featured !== undefined) {
            whereClause.featured = featured === 'true';
        }

        if (occasion) {
            whereClause.occasion = occasion;
        }

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const orderBy = {};
        orderBy[sortBy] = sortOrder;

        // Convert filters for smart adapter
        const filters = {};
        if (whereClause.active !== undefined) filters.active = whereClause.active;
        if (whereClause.featured !== undefined) filters.featured = whereClause.featured;
        if (whereClause.occasion) filters.occasion = whereClause.occasion;
        if (whereClause.OR) filters.search = search;
        
        // Use smart adapter to get products with automatic fallback
        const products = await dbAdapter.getProducts(filters);
        const total = products.length; // For now, using array length as total

        const totalPages = Math.ceil(total / parseInt(limit));

        timer.end();
        
        logger.success('CONTROLLER', 'getAllProducts completed successfully', {
            total,
            page: parseInt(page),
            totalPages
        });

        res.json({
            data: {
                products: products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'getAllProducts failed', {
            query: req.query,
            error: error.message
        }, error);
        
        res.status(500).json({
            error: 'Error fetching products',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getProductById = async (req, res) => {
    const timer = startTimer('getProductById');
    
    try {
        const { id } = req.params;
        
        logger.info(req.method, req.originalUrl, {
            params: req.params,
            userRole: req.user?.role
        });

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                images: {
                    select: {
                        id: true,
                        file_hash: true,
                        original_filename: true,
                        url_large: true,
                        url_medium: true,
                        url_small: true,
                        url_thumb: true,
                        width: true,
                        height: true,
                        is_primary: true,
                        display_order: true
                    },
                    orderBy: {
                        display_order: 'asc'
                    }
                }
            }
        });

        if (!product) {
            timer.end();
            logger.warn('CONTROLLER', 'Product not found', { productId: id });
            return res.status(404).json({ error: 'Product not found' });
        }

        timer.end();
        
        logger.success('CONTROLLER', 'getProductById completed successfully', {
            productId: id,
            productName: product.name
        });

        res.json({ data: product });

    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'getProductById failed', {
            productId: req.params.id,
            error: error.message
        }, error);
        
        res.status(500).json({
            error: 'Error fetching product',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getFeaturedProducts = async (req, res) => {
    const timer = startTimer('getFeaturedProducts');
    
    try {
        const { limit = 6 } = req.query;
        
        logger.info(req.method, req.originalUrl, {
            query: req.query
        });

        const products = await prisma.product.findMany({
            where: {
                featured: true,
                active: true
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                images: {
                    select: {
                        id: true,
                        file_hash: true,
                        original_filename: true,
                        url_large: true,
                        url_medium: true,
                        url_small: true,
                        url_thumb: true,
                        width: true,
                        height: true,
                        is_primary: true,
                        display_order: true
                    },
                    orderBy: {
                        display_order: 'asc'
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: parseInt(limit)
        });

        timer.end();
        
        logger.success('CONTROLLER', 'getFeaturedProducts completed successfully', {
            count: products.length
        });

        res.json({ data: products });

    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'getFeaturedProducts failed', {
            error: error.message
        }, error);
        
        res.status(500).json({
            error: 'Error fetching featured products',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const createProduct = async (req, res) => {
    const timer = startTimer('createProduct');
    
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

        try {
            logger.info(req.method, req.originalUrl, {
                body: logger.sanitizeBody ? logger.sanitizeBody(req.body) : req.body,
                userRole: req.user?.role
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        if (!name || !price) {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Missing required fields for product creation', {
                    name: !!name,
                    price: !!price
                });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(400).json({
                error: 'Name and price are required'
            });
        }

        const productData = {
            name,
            description,
            price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity),
            image_url,
            additional_images,
            primary_image,
            active: Boolean(active),
            featured: Boolean(featured),
            show_on_homepage: Boolean(show_on_homepage),
            homepage_order: parseInt(homepage_order),
            occasion
        };

        if (category_id) {
            productData.category_id = parseInt(category_id);
        }

        const product = await prisma.product.create({
            data: productData,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        timer.end();
        
        logger.success('CONTROLLER', 'createProduct completed successfully', {
            productId: product.id,
            productName: product.name
        });

        res.status(201).json({ data: product });

    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'createProduct failed', {
            productName: req.body.name,
            error: error.message
        }, error);
        
        res.status(500).json({
            error: 'Error creating product',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const updateProduct = async (req, res) => {
    const timer = startTimer('updateProduct');
    
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        logger.info(req.method, req.originalUrl, {
            params: req.params,
            body: logger.sanitizeBody(req.body),
            userRole: req.user?.role
        });

        const existingProduct = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingProduct) {
            timer.end();
            logger.warn('CONTROLLER', 'Product not found for update', { productId: id });
            return res.status(404).json({ error: 'Product not found' });
        }

        if (updateData.price) {
            updateData.price = parseFloat(updateData.price);
        }
        if (updateData.stock_quantity) {
            updateData.stock_quantity = parseInt(updateData.stock_quantity);
        }
        if (updateData.category_id) {
            updateData.category_id = parseInt(updateData.category_id);
        }
        if (updateData.homepage_order) {
            updateData.homepage_order = parseInt(updateData.homepage_order);
        }

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        timer.end();
        
        logger.success('CONTROLLER', 'updateProduct completed successfully', {
            productId: id,
            productName: product.name
        });

        res.json({ data: product });

    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'updateProduct failed', {
            productId: req.params.id,
            error: error.message
        }, error);
        
        res.status(500).json({
            error: 'Error updating product',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const deleteProduct = async (req, res) => {
    const timer = startTimer('deleteProduct');
    
    try {
        const { id } = req.params;

        logger.info(req.method, req.originalUrl, {
            params: req.params,
            userRole: req.user?.role
        });

        logger.warn('CONTROLLER', 'Attempting to delete product', {
            productId: id,
            adminUser: req.user?.email
        });

        const existingProduct = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingProduct) {
            timer.end();
            logger.warn('CONTROLLER', 'Product not found for deletion', { productId: id });
            return res.status(404).json({ error: 'Product not found' });
        }

        await prisma.product.delete({
            where: { id: parseInt(id) }
        });

        timer.end();
        
        logger.success('CONTROLLER', 'deleteProduct completed successfully', {
            productId: id,
            productName: existingProduct.name
        });

        res.json({ message: 'Product deleted successfully' });

    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'deleteProduct failed', {
            productId: req.params.id,
            error: error.message
        }, error);
        
        res.status(500).json({
            error: 'Error deleting product',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getHomepageProducts = async (req, res) => {
    const timer = startTimer('getHomepageProducts');
    
    try {
        logger.info(req.method, req.originalUrl);

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
                },
                images: {
                    select: {
                        id: true,
                        file_hash: true,
                        original_filename: true,
                        url_large: true,
                        url_medium: true,
                        url_small: true,
                        url_thumb: true,
                        width: true,
                        height: true,
                        is_primary: true,
                        display_order: true
                    },
                    orderBy: {
                        display_order: 'asc'
                    }
                }
            },
            orderBy: {
                homepage_order: 'asc'
            }
        });

        timer.end();
        
        logger.success('CONTROLLER', 'getHomepageProducts completed successfully', {
            count: products.length
        });

        res.json({ data: products });

    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'getHomepageProducts failed', {
            error: error.message
        }, error);
        
        res.status(500).json({
            error: 'Error fetching homepage products',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const updateHomepageSettings = async (req, res) => {
    const timer = startTimer('updateHomepageSettings');
    
    try {
        const { products } = req.body;

        logger.info(req.method, req.originalUrl, {
            body: { productsCount: products?.length },
            userRole: req.user?.role
        });

        if (!Array.isArray(products)) {
            timer.end();
            logger.warn('CONTROLLER', 'Invalid products array for homepage settings');
            return res.status(400).json({ error: 'Products must be an array' });
        }

        await prisma.product.updateMany({
            data: { show_on_homepage: false }
        });

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            await prisma.product.update({
                where: { id: parseInt(product.id) },
                data: {
                    show_on_homepage: true,
                    homepage_order: i + 1
                }
            });
        }

        timer.end();
        
        logger.success('CONTROLLER', 'updateHomepageSettings completed successfully', {
            productsUpdated: products.length
        });

        res.json({ message: 'Homepage settings updated successfully' });

    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'updateHomepageSettings failed', {
            error: error.message
        }, error);
        
        res.status(500).json({
            error: 'Error updating homepage settings',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export {
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    getHomepageProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateHomepageSettings
};