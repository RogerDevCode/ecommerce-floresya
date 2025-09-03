const { supabase } = require('../config/database');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');
const imageProcessing = require('../services/imageProcessing');
const path = require('path');
const fs = require('fs');

// Helper function to check if product_occasions table exists
const checkProductOccasionsTable = async () => {
    try {
        const { data, error } = await supabase
            .from('product_occasions')
            .select('id')
            .limit(1);
        return !error;
    } catch {
        return false;
    }
};

// Helper function to build filters for Supabase
const buildSupabaseFilters = async (query, includeInactive = false) => {
    const hasNewOccasions = await checkProductOccasionsTable();
    
    // Base query - include occasions if new table exists
    let selectClause = `
        *,
        category:categories(name, description)
    `;
    
    if (hasNewOccasions) {
        // Use new occasions structure if available
        selectClause = `
            *,
            category:categories(name, description),
            occasions:product_occasions(
                occasion:occasions(id, name, description, icon, color)
            )
        `;
    }
    
    let supabaseQuery = supabase
        .from('products')
        .select(selectClause);

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

    // Occasion filter - support both old and new systems
    if (query.occasion || query.occasionId) {
        if (hasNewOccasions) {
            // Filter by new occasions system (by occasion name or ID)
            // This will be handled in post-processing since we can't directly filter on nested relations
        } else {
            // Use old occasion field
            if (query.occasion) {
                supabaseQuery = supabaseQuery.eq('occasion', query.occasion);
            }
        }
    }

    // Featured filter
    if (query.featured === 'true') {
        supabaseQuery = supabaseQuery.eq('featured', true);
    }

    // Search filter
    if (query.search) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }

    return { 
        query: supabaseQuery, 
        hasNewOccasions, 
        occasionFilter: query.occasion,
        occasionIdFilter: query.occasionId
    };
};

const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 12, sort = 'created_at', order = 'DESC', admin_mode = 'false' } = req.query;
        const offset = (page - 1) * limit;

        // Check if this is an admin request
        const isAdminMode = admin_mode === 'true' || req.user?.role === 'admin';

        // Build the query (now async)
        const { query: supabaseQuery, hasNewOccasions, occasionFilter, occasionIdFilter } = await buildSupabaseFilters(req.query, isAdminMode);

        // Sorting
        const validSortFields = ['name', 'price', 'created_at'];
        const orderBy = validSortFields.includes(sort) ? sort : 'created_at';
        const orderDirection = order.toLowerCase() === 'asc' ? true : false;
        
        let query = supabaseQuery.order(orderBy, { ascending: orderDirection });

        // Pagination
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: products, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        let filteredProducts = products;

        // Filter by occasion if using new occasions system
        if (hasNewOccasions && (occasionFilter || occasionIdFilter)) {
            filteredProducts = products.filter(product => {
                if (!product.occasions || product.occasions.length === 0) return false;
                return product.occasions.some(po => {
                    if (occasionIdFilter) {
                        return po.occasion?.id?.toString() === occasionIdFilter.toString();
                    }
                    if (occasionFilter) {
                        return po.occasion?.name?.toLowerCase() === occasionFilter.toLowerCase() ||
                               po.occasion?.id?.toString() === occasionFilter.toString();
                    }
                    return false;
                });
            });
        }

        // Transform data to match existing format
        const productsWithCategoryName = filteredProducts.map(product => {
            const transformed = {
                ...product,
                category_name: product.category?.name || null
            };

            // Include occasions array if new system is available
            if (hasNewOccasions && product.occasions) {
                transformed.occasions_list = product.occasions
                    .map(po => po.occasion)
                    .filter(o => o); // Remove nulls
            }

            return transformed;
        });

        res.json({
            success: true,
            data: {
                products: productsWithCategoryName,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count || filteredProducts.length,
                    pages: Math.ceil((count || filteredProducts.length) / limit),
                },
                // Include system info for debugging
                system_info: {
                    has_new_occasions: hasNewOccasions,
                    occasion_filter: occasionFilter
                }
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