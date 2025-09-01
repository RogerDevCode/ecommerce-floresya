const { Product, Category, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// Test endpoint to get detailed category information
const testCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            attributes: ['id', 'name', 'description', 'image_url', 'active', 'created_at', 'updated_at'],
            order: [['name', 'ASC']]
        });

        // Get product count for each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const productCount = await Product.count({
                    where: { 
                        category_id: category.id,
                        active: true 
                    }
                });
                
                return {
                    ...category.toJSON(),
                    product_count: productCount
                };
            })
        );

        // Get total counts
        const totalCategories = await Category.count();
        const activeCategories = await Category.count({ where: { active: true } });

        res.json({
            success: true,
            data: {
                categories: categoriesWithCount,
                summary: {
                    total_categories: totalCategories,
                    active_categories: activeCategories,
                    categories_with_products: categoriesWithCount.filter(c => c.product_count > 0).length
                }
            }
        });

    } catch (error) {
        console.error('Error in testCategories:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting test categories data',
            error: error.message
        });
    }
};

// Test endpoint to get detailed product information
const testProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const productLimit = limit === 'all' ? null : parseInt(limit);

        const findOptions = {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'description']
            }],
            order: [['created_at', 'DESC']]
        };

        if (productLimit) {
            findOptions.limit = productLimit;
        }

        const products = await Product.findAll(findOptions);

        // Get summary statistics
        const totalProducts = await Product.count();
        const activeProducts = await Product.count({ where: { active: true } });
        const featuredProducts = await Product.count({ where: { featured: true, active: true } });

        // Get products by occasion
        const occasionStats = await sequelize.query(`
            SELECT occasion, COUNT(*) as count 
            FROM products 
            WHERE active = 1 
            GROUP BY occasion 
            ORDER BY count DESC
        `, { type: QueryTypes.SELECT });

        // Get products by category
        const categoryStats = await sequelize.query(`
            SELECT 
                c.name as category_name,
                c.id as category_id,
                COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.active = 1
            GROUP BY c.id, c.name
            ORDER BY product_count DESC
        `, { type: QueryTypes.SELECT });

        res.json({
            success: true,
            data: {
                products: products.map(product => ({
                    ...product.toJSON(),
                    formatted_price: `$${product.price}`,
                    has_category: !!product.category,
                    created_ago: getTimeAgo(product.created_at)
                })),
                summary: {
                    total_products: totalProducts,
                    active_products: activeProducts,
                    featured_products: featuredProducts,
                    returned_count: products.length
                },
                stats: {
                    by_occasion: occasionStats,
                    by_category: categoryStats
                }
            }
        });

    } catch (error) {
        console.error('Error in testProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting test products data',
            error: error.message
        });
    }
};

// Test endpoint to verify database connection and basic queries
const testConnection = async (req, res) => {
    try {
        // Test database connection
        await sequelize.authenticate();

        // Test basic queries
        const categoriesCount = await Category.count();
        const productsCount = await Product.count();
        
        // Test a join query
        const productsWithCategories = await Product.count({
            include: [{
                model: Category,
                as: 'category',
                required: true
            }]
        });

        // Get database info
        const dbVersion = await sequelize.query('SELECT sqlite_version() as version', 
            { type: QueryTypes.SELECT });

        res.json({
            success: true,
            data: {
                database_connected: true,
                database_type: 'SQLite',
                database_version: dbVersion[0]?.version || 'Unknown',
                tables: {
                    categories: {
                        count: categoriesCount,
                        status: categoriesCount > 0 ? 'OK' : 'EMPTY'
                    },
                    products: {
                        count: productsCount,
                        status: productsCount > 0 ? 'OK' : 'EMPTY'
                    }
                },
                relationships: {
                    products_with_categories: productsWithCategories,
                    join_working: productsWithCategories > 0
                },
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error in testConnection:', error);
        res.status(500).json({
            success: false,
            message: 'Database connection test failed',
            error: error.message,
            database_connected: false
        });
    }
};

// Test filtered products
const testFilteredProducts = async (req, res) => {
    try {
        const { category_id, occasion, featured, limit = 20 } = req.query;
        
        const where = { active: true };
        
        if (category_id && category_id !== '') {
            where.category_id = parseInt(category_id);
        }
        
        if (occasion && occasion !== '') {
            where.occasion = occasion;
        }
        
        if (featured && featured !== '') {
            where.featured = featured === 'true';
        }

        const products = await Product.findAll({
            where,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
            }],
            limit: parseInt(limit),
            order: [['created_at', 'DESC']]
        });

        const totalCount = await Product.count({ where });

        res.json({
            success: true,
            data: {
                products,
                filters_applied: {
                    category_id: category_id || null,
                    occasion: occasion || null,
                    featured: featured || null
                },
                results: {
                    count: products.length,
                    total_matching: totalCount,
                    showing_limited: products.length < totalCount
                }
            }
        });

    } catch (error) {
        console.error('Error in testFilteredProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing filtered products',
            error: error.message
        });
    }
};

// Helper function to get time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} segundos atrás`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutos atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas atrás`;
    return `${Math.floor(diffInSeconds / 86400)} días atrás`;
}

module.exports = {
    testCategories,
    testProducts,
    testConnection,
    testFilteredProducts
};