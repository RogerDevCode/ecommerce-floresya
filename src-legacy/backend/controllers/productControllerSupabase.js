import {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} from '../utils/bked_logger.js';

/**
 * 🏪 PRODUCT CONTROLLER - NUEVO SISTEMA EXCLUSIVO
 * Controlador para productos usando ÚNICAMENTE:
 * - products table (sin category_id)
 * - product_images table (con SHA256 hash)
 * - occasions table
 * - databaseService estándar
 */

import { databaseService } from '../services/databaseService.js';
import { uploadMultiple, handleUploadError } from '../middleware/upload.js';
import imageProcessing from '../services/imageProcessing.js';
import imageHashService from '../services/imageHashService.js';
import path from 'path';
import fs from 'fs';

/**
 * 📋 GET ALL PRODUCTS
 * Obtener productos con paginación y filtros
 */
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
        
        // Construir query base
        const client = databaseService.getClient();
        let query = client
            .from('products')
            .select(`
                id, name, description, price, stock_quantity,
                featured, active, occasion, show_on_homepage, homepage_order,
                created_at, updated_at,
                images:product_images(
                    id, file_hash, original_filename,
                    url_large, url_medium, url_small, url_thumb,
                    width, height, is_primary, display_order
                )
            `);

        // Filtros
        if (active !== 'all') {
            query = query.eq('active', active === 'true');
        }

        if (featured) {
            query = query.eq('featured', featured === 'true');
        }

        if (occasion) {
            query = query.eq('occasion', occasion);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`);
        }

        // Ordenamiento
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Paginación
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: products, error, count } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            return res.status(500).json({
                success: false,
                message: 'Error fetching products',
                error: error.message
            });
        }

        // Procesar imágenes - ordenar por display_order
        const processedProducts = products.map(product => {
            if (product.images && product.images.length > 0) {
                product.images = product.images.sort((a, b) => a.display_order - b.display_order);
            }
            return product;
        });

        // Contar total para paginación
        const { count: totalCount } = await client
            .from('products')
            .select('*', { count: 'exact', head: true });

        res.json({
            success: true,
            data: {
                products: processedProducts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Error in getAllProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * 🔍 GET SINGLE PRODUCT
 * Obtener un producto específico por ID
 */
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const client = databaseService.getClient();
        const { data: product, error } = await client
            .from('products')
            .select(`
                id, name, description, price, stock_quantity,
                featured, active, occasion, show_on_homepage, homepage_order,
                created_at, updated_at,
                images:product_images(
                    id, file_hash, original_filename,
                    url_large, url_medium, url_small, url_thumb,
                    width, height, is_primary, display_order
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                error: error.message
            });
        }

        // Procesar imágenes
        if (product.images && product.images.length > 0) {
            product.images = product.images.sort((a, b) => a.display_order - b.display_order);
        }

        res.json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error('Error in getProductById:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * ➕ CREATE PRODUCT
 * Crear nuevo producto con imágenes
 */
const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            stock_quantity = 0,
            featured = false,
            active = true,
            occasion = null,
            show_on_homepage = false,
            homepage_order = 0
        } = req.body;

        // Validaciones básicas
        if (!name || !description || !price) {
            return res.status(400).json({
                success: false,
                message: 'Name, description, and price are required'
            });
        }

        // Crear producto en la base de datos
        const productData = {
            name,
            description,
            price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity),
            featured: Boolean(featured),
            active: Boolean(active),
            occasion,
            show_on_homepage: Boolean(show_on_homepage),
            homepage_order: parseInt(homepage_order)
        };

        const newProduct = await databaseService.insert('products', productData);

        if (!newProduct || newProduct.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create product'
            });
        }

        const product = newProduct[0];

        // Procesar imágenes si se proporcionaron
        if (req.files && req.files.length > 0) {
            try {
                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i];
                    
                    // Procesar imagen con diferentes tamaños
                    const imageResult = await imageProcessing.processImage(file.buffer, file.originalname);
                    
                    // Calcular hash y verificar duplicados
                    const hashResult = await imageHashService.processImageWithDuplicateCheck(
                        file.buffer,
                        file.originalname,
                        file.mimetype,
                        imageResult.sizes,
                        product.id,
                        i + 1,
                        i === 0
                    );

                    console.log(`✅ Image ${i + 1} processed:`, {
                        filename: file.originalname,
                        hash: hashResult.hash,
                        isDuplicate: hashResult.isDuplicate
                    });
                }
            } catch (imageError) {
                console.error('Error processing images:', imageError);
                // No fallar la creación del producto por error en imágenes
            }
        }

        // Obtener producto completo con imágenes
        const client = databaseService.getClient();
        const { data: completeProduct } = await client
            .from('products')
            .select(`
                id, name, description, price, stock_quantity,
                featured, active, occasion, show_on_homepage, homepage_order,
                created_at, updated_at,
                images:product_images(
                    id, file_hash, original_filename,
                    url_large, url_medium, url_small, url_thumb,
                    width, height, is_primary, display_order
                )
            `)
            .eq('id', product.id)
            .single();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: completeProduct
        });

    } catch (error) {
        console.error('Error in createProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * ✏️ UPDATE PRODUCT
 * Actualizar producto existente
 */
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Remover campos que no se pueden actualizar directamente
        delete updateData.id;
        delete updateData.created_at;
        delete updateData.images;

        // Convertir tipos de datos
        if (updateData.price) updateData.price = parseFloat(updateData.price);
        if (updateData.stock_quantity) updateData.stock_quantity = parseInt(updateData.stock_quantity);
        if (updateData.featured !== undefined) updateData.featured = Boolean(updateData.featured);
        if (updateData.active !== undefined) updateData.active = Boolean(updateData.active);
        if (updateData.show_on_homepage !== undefined) updateData.show_on_homepage = Boolean(updateData.show_on_homepage);
        if (updateData.homepage_order) updateData.homepage_order = parseInt(updateData.homepage_order);

        const updatedProduct = await databaseService.update('products', updateData, { id });

        if (!updatedProduct || updatedProduct.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Obtener producto completo con imágenes
        const client = databaseService.getClient();
        const { data: completeProduct } = await client
            .from('products')
            .select(`
                id, name, description, price, stock_quantity,
                featured, active, occasion, show_on_homepage, homepage_order,
                created_at, updated_at,
                images:product_images(
                    id, file_hash, original_filename,
                    url_large, url_medium, url_small, url_thumb,
                    width, height, is_primary, display_order
                )
            `)
            .eq('id', id)
            .single();

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: completeProduct
        });

    } catch (error) {
        console.error('Error in updateProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * 🗑️ DELETE PRODUCT
 * Eliminar producto y sus imágenes
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el producto existe
        const { data: product } = await databaseService.query('products', {
            eq: { id }
        });

        if (!product || product.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Eliminar producto (las imágenes se eliminan automáticamente por CASCADE)
        await databaseService.delete('products', { id });

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Error in deleteProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * 📊 GET PRODUCT STATS
 * Obtener estadísticas de productos
 */
const getProductStats = async (req, res) => {
    try {
        const stats = await databaseService.getStats();

        const client = databaseService.getClient();
        
        // Productos destacados
        const { count: featuredCount } = await client
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('featured', true)
            .eq('active', true);

        // Productos sin imágenes
        const { data: productsWithoutImages } = await client
            .from('products')
            .select(`
                id, name,
                images:product_images(id)
            `)
            .eq('active', true);

        const orphanProductsCount = productsWithoutImages.filter(p => 
            !p.images || p.images.length === 0
        ).length;

        res.json({
            success: true,
            data: {
                total: stats.products || 0,
                images: stats.product_images || 0,
                occasions: stats.occasions || 0,
                featured: featuredCount || 0,
                withoutImages: orphanProductsCount
            }
        });

    } catch (error) {
        console.error('Error in getProductStats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Exportar todas las funciones
export {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductStats
};
