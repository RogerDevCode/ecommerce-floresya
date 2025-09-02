const { Product, Category } = require('../models'); // Sequelize models
const { Op } = require('sequelize');
const { useSupabase } = require('../config/database');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');
const imageProcessing = require('../services/imageProcessing');
const path = require('path');
const fs = require('fs');

// Import Supabase controller if using Supabase
let supabaseController;
if (useSupabase) {
    supabaseController = require('./productControllerSupabase');
}

// Helper function to construct the where clause for filtering
const buildWhereClause = (query, includeInactive = false) => {
    const where = {};
    
    // Only filter by active if not explicitly including inactive products
    if (!includeInactive) {
        where.active = true;
    } else if (query.active !== undefined) {
        // For admin: filter by active status if specified
        where.active = query.active === '1' || query.active === 'true' || query.active === true;
    }
    
    if (query.category_id || query.category) {
        where.category_id = query.category_id || query.category;
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
    // Use Supabase controller if available
    if (useSupabase && supabaseController) {
        return supabaseController.getAllProducts(req, res);
    }

    try {
        const { page = 1, limit = 12, sort = 'created_at', order = 'DESC', admin_mode = 'false' } = req.query;
        const offset = (page - 1) * limit;

        // Check if this is an admin request (includes inactive products)
        const isAdminMode = admin_mode === 'true' || req.user?.role === 'admin';
        const whereClause = buildWhereClause(req.query, isAdminMode);

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

        // Add category_name to each product for easier access
        const productsWithCategoryName = rows.map(product => {
            const productData = product.toJSON();
            productData.category_name = productData.category?.name || null;
            return productData;
        });

        res.json({
            success: true,
            data: {
                products: productsWithCategoryName,
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
    // Use Supabase controller if available
    if (useSupabase && supabaseController) {
        return supabaseController.getProductById(req, res);
    }

    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
            where: { active: true },
            include: [{ model: Category, as: 'category' }],
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Add category_name to product data
        const productData = product.toJSON();
        productData.category_name = productData.category?.name || null;

        const related_products = await Product.findAll({
            where: {
                category_id: product.category_id,
                id: { [Op.ne]: id }, // Exclude the product itself
                active: true,
            },
            limit: 4,
        });

        res.json({ success: true, data: productData });
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
    // Use Supabase controller if available
    if (useSupabase && supabaseController) {
        return supabaseController.createProduct(req, res);
    }

    // Handle file upload first
    uploadMultiple(req, res, async (err) => {
        if (err) {
            return handleUploadError(err, req, res, () => {});
        }

        try {
            const productData = req.body;
            
            // Handle uploaded images with processing
            if (req.files && req.files.length > 0) {
                console.log(`Processing ${req.files.length} images...`);
                
                // Process images to WebP with multiple sizes
                const processedImages = await imageProcessing.processImages(req.files);
                
                // Filter successful results
                const successfulImages = processedImages.filter(img => img.success);
                
                if (successfulImages.length > 0) {
                    // Use large size URLs for storage
                    const imageUrls = successfulImages.map(img => img.sizes.large.url);
                    
                    // Set main image as the first processed image
                    productData.image_url = imageUrls[0];
                    
                    // Set additional images if there are more than 1
                    if (imageUrls.length > 1) {
                        productData.additional_images = JSON.stringify(imageUrls.slice(1));
                    }
                    
                    console.log(`Successfully processed ${successfulImages.length} images`);
                } else {
                    console.warn('No images were successfully processed');
                }
                
                // Log any failed images
                const failedImages = processedImages.filter(img => !img.success);
                if (failedImages.length > 0) {
                    console.error('Failed to process images:', failedImages.map(img => img.originalName));
                }
            }

            // Convert string booleans to actual booleans
            ['active', 'featured', 'show_on_homepage'].forEach(field => {
                if (productData[field] !== undefined) {
                    productData[field] = productData[field] === '1' || productData[field] === 'true' || productData[field] === true;
                }
            });

            const product = await Product.create(productData);
            
            // Load product with category for response
            const productWithCategory = await Product.findByPk(product.id, {
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['name', 'description']
                }]
            });

            res.status(201).json({ 
                success: true, 
                message: 'Producto creado exitosamente', 
                data: productWithCategory
            });
        } catch (error) {
            console.error('Error creating product:', error);
            
            // Clean up processed images on error
            if (req.files && req.files.length > 0) {
                try {
                    // Process images to get base filenames for cleanup
                    const processedImages = await imageProcessing.processImages(req.files);
                    const successfulImages = processedImages.filter(img => img.success);
                    
                    for (const img of successfulImages) {
                        await imageProcessing.deleteProcessedImages(img.baseFilename);
                    }
                } catch (cleanupError) {
                    console.error('Error during cleanup:', cleanupError);
                }
            }
            
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Error interno del servidor' 
            });
        }
    });
};

const updateProduct = async (req, res) => {
    // Handle file upload first
    uploadMultiple(req, res, async (err) => {
        if (err) {
            return handleUploadError(err, req, res, () => {});
        }

        try {
            const { id } = req.params;
            const product = await Product.findByPk(id);

            if (!product) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Producto no encontrado' 
                });
            }

            const productData = req.body;
            
            // Handle new uploaded images with processing
            if (req.files && req.files.length > 0) {
                console.log(`Processing ${req.files.length} new images for product ${id}...`);
                
                // Process new images to WebP with multiple sizes
                const processedImages = await imageProcessing.processImages(req.files);
                const successfulImages = processedImages.filter(img => img.success);
                
                let newImageUrls = [];
                if (successfulImages.length > 0) {
                    newImageUrls = successfulImages.map(img => img.sizes.large.url);
                    console.log(`Successfully processed ${successfulImages.length} new images`);
                }
                
                // Handle existing images
                let existingImages = [];
                if (productData.existing_images) {
                    try {
                        existingImages = JSON.parse(productData.existing_images);
                    } catch (e) {
                        existingImages = [];
                    }
                }
                
                // Combine existing and new images
                const allImages = [...existingImages, ...newImageUrls];
                
                if (allImages.length > 0) {
                    productData.image_url = allImages[0];
                    if (allImages.length > 1) {
                        productData.additional_images = JSON.stringify(allImages.slice(1));
                    } else {
                        productData.additional_images = JSON.stringify([]);
                    }
                }
            } else if (productData.existing_images) {
                // Only existing images, no new uploads
                try {
                    const existingImages = JSON.parse(productData.existing_images);
                    if (existingImages.length > 0) {
                        productData.image_url = existingImages[0];
                        if (existingImages.length > 1) {
                            productData.additional_images = JSON.stringify(existingImages.slice(1));
                        } else {
                            productData.additional_images = JSON.stringify([]);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing existing images:', e);
                }
            }

            // Convert string booleans to actual booleans
            ['active', 'featured', 'show_on_homepage'].forEach(field => {
                if (productData[field] !== undefined) {
                    productData[field] = productData[field] === '1' || productData[field] === 'true' || productData[field] === true;
                }
            });

            // Remove fields that shouldn't be updated directly
            delete productData.existing_images;

            const updatedProduct = await product.update(productData);
            
            // Load product with category for response
            const productWithCategory = await Product.findByPk(id, {
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['name', 'description']
                }]
            });

            res.json({ 
                success: true, 
                message: 'Producto actualizado exitosamente', 
                data: productWithCategory
            });
        } catch (error) {
            console.error('Error updating product:', error);
            
            // Clean up newly processed images on error (keep existing ones)
            if (req.files && req.files.length > 0) {
                try {
                    const processedImages = await imageProcessing.processImages(req.files);
                    const successfulImages = processedImages.filter(img => img.success);
                    
                    for (const img of successfulImages) {
                        await imageProcessing.deleteProcessedImages(img.baseFilename);
                    }
                } catch (cleanupError) {
                    console.error('Error during cleanup:', cleanupError);
                }
            }
            
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Error interno del servidor' 
            });
        }
    });
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
