import { prisma } from '../config/prisma.js';

const getAllProducts = async (req, res) => {
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

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: whereClause,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy,
                skip: offset,
                take: parseInt(limit)
            }),
            prisma.product.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });

    } catch (error) {
        res.status(500).json({
            error: 'Error fetching products',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
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

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ data: product });

    } catch (error) {
        res.status(500).json({
            error: 'Error fetching product',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 6 } = req.query;

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
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: parseInt(limit)
        });

        res.json({ data: products });

    } catch (error) {
        res.status(500).json({
            error: 'Error fetching featured products',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const createProduct = async (req, res) => {
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

        if (!name || !price) {
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

        res.status(201).json({ data: product });

    } catch (error) {
        res.status(500).json({
            error: 'Error creating product',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        const existingProduct = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingProduct) {
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

        res.json({ data: product });

    } catch (error) {
        res.status(500).json({
            error: 'Error updating product',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const existingProduct = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await prisma.product.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Product deleted successfully' });

    } catch (error) {
        res.status(500).json({
            error: 'Error deleting product',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getHomepageProducts = async (req, res) => {
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

        res.json({ data: products });

    } catch (error) {
        res.status(500).json({
            error: 'Error fetching homepage products',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const updateHomepageSettings = async (req, res) => {
    try {
        const { products } = req.body;

        if (!Array.isArray(products)) {
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

        res.json({ message: 'Homepage settings updated successfully' });

    } catch (error) {
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