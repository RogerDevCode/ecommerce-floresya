const { supabase } = require('../config/database');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');
const imageProcessing = require('../services/imageProcessing');
const path = require('path');
const fs = require('fs');

// Helper function to build filters for Supabase
const buildSupabaseFilters = (query, includeInactive = false) => {
    let supabaseQuery = supabase
        .from('products')
        .select(`
            *,
            category:categories(name, description)
        `);

    // Active filter
    if (!includeInactive) {
        supabaseQuery = supabaseQuery.eq('active', true);
    } else if (query.active !== undefined) {
        supabaseQuery = supabaseQuery.eq('active', query.active === '1' || query.active === 'true' || query.active === true);
    }

    // Category filter
    if (query.category_id || query.category) {
        supabaseQuery = supabaseQuery.eq('category_id', query.category_id || query.category);
    }

    // Occasion filter
    if (query.occasion) {
        supabaseQuery = supabaseQuery.eq('occasion', query.occasion);
    }

    // Featured filter
    if (query.featured === 'true') {
        supabaseQuery = supabaseQuery.eq('featured', true);
    }

    // Search filter
    if (query.search) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }

    return supabaseQuery;
};

const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, sort = 'created_at', order = 'DESC', admin_mode = 'false' } = req.query;
        const offset = (page - 1) * limit;

        // Check if this is an admin request
        const isAdminMode = admin_mode === 'true' || req.user?.role === 'admin';

        // Build the query
        let query = buildSupabaseFilters(req.query, isAdminMode);

        // Sorting
        const validSortFields = ['name', 'price', 'created_at'];
        const orderBy = validSortFields.includes(sort) ? sort : 'created_at';
        const orderDirection = order.toLowerCase() === 'asc' ? true : false;
        
        query = query.order(orderBy, { ascending: orderDirection });

        // Pagination
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: products, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        // Transform data to match existing format
        const productsWithCategoryName = products.map(product => ({
            ...product,
            category_name: product.category?.name || null
        }));

        res.json({
            success: true,
            data: {
                products: productsWithCategoryName,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count || products.length,
                    pages: Math.ceil((count || products.length) / limit),
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
        
        const { data: product, error } = await supabase
            .from('products')
            .select(`
                *,
                category:categories(name, description)
            `)
            .eq('id', id)
            .eq('active', true)
            .single();

        if (error || !product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Transform data to match existing format
        const productData = {
            ...product,
            category_name: product.category?.name || null
        };

        res.json({ success: true, data: productData });
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const createProduct = async (req, res) => {
    try {
        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price),
            category_id: parseInt(req.body.category_id),
            stock_quantity: parseInt(req.body.stock_quantity) || 0,
            featured: req.body.featured === 'true' || req.body.featured === true,
            active: req.body.active !== 'false',
            occasion: req.body.occasion || null,
            colors: req.body.colors || null,
            size: req.body.size || null,
            care_instructions: req.body.care_instructions || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: product, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(400).json({ success: false, message: 'Error creating product' });
        }

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const { data: product, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error || !product) {
            return res.status(404).json({ success: false, message: 'Product not found or error updating' });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: product, error } = await supabase
            .from('products')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error || !product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, message: 'Product deactivated successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const uploadProductImages = async (req, res) => {
    try {
        uploadMultiple(req, res, async (err) => {
            if (err) {
                return handleUploadError(err, res);
            }

            const { id } = req.params;
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            // Process images
            const processedImages = [];
            for (const file of req.files) {
                try {
                    const result = await imageProcessing.processProductImage(file, id);
                    processedImages.push(result);
                } catch (error) {
                    console.error('Error processing image:', error);
                }
            }

            // Update product with image URLs
            const imageUrls = processedImages.map(img => img.url);
            
            const { data: product, error } = await supabase
                .from('products')
                .update({ 
                    images: imageUrls,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            res.json({
                success: true,
                data: {
                    product,
                    uploaded_images: processedImages
                }
            });
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImages,
};