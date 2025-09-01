const { Product, Category } = require('../models'); // Sequelize models
const { Op } = require('sequelize');

// Helper function to construct the where clause for filtering
const buildWhereClause = (query) => {
    const where = { active: true };
    if (query.category_id) {
        where.category_id = query.category_id;
    }
    if (query.occasion) {
        where.occasion = query.occasion;
    }
    if (query.featured === 'true') {
        where.featured = true;
    }
    if (query.search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${query.search}%` } },
            { description: { [Op.like]: `%${query.search}%` } },
        ];
    }
    return where;
};

const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, sort = 'created_at', order = 'DESC' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = buildWhereClause(req.query);

        const validSortFields = ['name', 'price', 'created_at'];
        const orderBy = validSortFields.includes(sort) ? sort : 'created_at';
        const orderDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows } = await Product.findAndCountAll({
            where: whereClause,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['name', 'description'],
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[orderBy, orderDirection]],
        });

        res.json({
            success: true,
            data: {
                products: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
            where: { active: true },
            include: [{ model: Category, as: 'category' }],
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const related_products = await Product.findAll({
            where: {
                category_id: product.category_id,
                id: { [Op.ne]: id }, // Exclude the product itself
                active: true,
            },
            limit: 4,
        });

        res.json({ success: true, data: { product, related_products } });
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        const products = await Product.findAll({
            where: { featured: true, active: true },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
        });
        res.json({ success: true, data: { products } });
    } catch (error) {
        console.error('Error getting featured products:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({ 
            success: true, 
            message: 'Product created successfully', 
            data: { product } 
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const updatedProduct = await product.update(req.body);
        res.json({ 
            success: true, 
            message: 'Product updated successfully', 
            data: { product: updatedProduct } 
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Soft delete by setting active to false
        await product.update({ active: false });
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get products for homepage
const getHomepageProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [{
                model: Category,
                as: 'category',
                attributes: ['name']
            }],
            where: {
                active: true,
                show_on_homepage: true
            },
            order: [
                ['homepage_order', 'ASC'],
                ['created_at', 'DESC']
            ],
            limit: 10
        });

        const formattedProducts = products.map(product => {
            const productData = product.toJSON();
            return {
                ...productData,
                price: parseFloat(productData.price),
                category_name: productData.category?.name || null,
                formatted_price: `$${parseFloat(productData.price).toFixed(2)}`
            };
        });

        res.json({
            success: true,
            data: {
                products: formattedProducts,
                count: formattedProducts.length
            }
        });
    } catch (error) {
        console.error('Error fetching homepage products:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update homepage settings for a product
const updateHomepageSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { show_on_homepage, homepage_order } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await product.update({
            show_on_homepage: show_on_homepage || false,
            homepage_order: homepage_order || 0
        });

        res.json({ 
            success: true, 
            message: 'Homepage settings updated successfully',
            data: { show_on_homepage, homepage_order }
        });
    } catch (error) {
        console.error('Error updating homepage settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    getHomepageProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateHomepageSettings,
};
