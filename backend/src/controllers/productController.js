import {
    log,
    logger,
    requestLogger,
    startTimer
} from '../utils/bked_logger.js';

import { databaseService } from '../services/databaseService.js';
import { createPrismaLikeAPI } from '../services/queryBuilder.js';
import { uploadMultiple, handleUploadError } from '../middleware/upload.js';
import imageProcessing from '../services/imageProcessing.js';
import imageHashService from '../services/imageHashService.js';
import path from 'path';
import fs from 'fs';

// Initialize Prisma-like API
const db = createPrismaLikeAPI(databaseService.getClient());

/**
 * 📋 GET ALL PRODUCTS
 * Obtener productos con paginación y filtros
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API para gestionar productos, incluyendo CRUD, imágenes y filtros.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price_usd
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del producto.
 *           example: 1
 *         name:
 *           type: string
 *           description: Nombre del producto.
 *           example: "Ramo de Rosas Rojas"
 *         description:
 *           type: string
 *           description: Descripción detallada del producto.
 *           example: "Hermoso ramo de 12 rosas rojas frescas, ideal para expresar amor."
 *         price_usd:
 *           type: number
 *           format: float
 *           description: Precio del producto en USD.
 *           example: 25.99
 *         stock:
 *           type: integer
 *           description: Cantidad disponible en inventario.
 *           example: 15
 *         featured:
 *           type: boolean
 *           description: Indica si el producto es destacado en la homepage.
 *           example: true
 *         active:
 *           type: boolean
 *           description: Indica si el producto está activo y visible para los clientes.
 *           example: true
 *         occasion:
 *           type: string
 *           description: Ocasión para la que el producto es apropiado.
 *           example: "valentine"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de creación del producto.
 *           example: "2024-05-23T10:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la última actualización del producto.
 *           example: "2024-05-23T10:00:00Z"
 *         images:
 *           type: array
 *           description: Lista de imágenes asociadas al producto.
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *     ProductImage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la imagen.
 *         file_hash:
 *           type: string
 *           description: Hash SHA256 del archivo para detectar duplicados.
 *         original_filename:
 *           type: string
 *           description: Nombre original del archivo subido.
 *         url_large:
 *           type: string
 *           description: URL de la imagen en tamaño grande.
 *         url_medium:
 *           type: string
 *           description: URL de la imagen en tamaño mediano.
 *         url_small:
 *           type: string
 *           description: URL de la imagen en tamaño pequeño.
 *         url_thumb:
 *           type: string
 *           description: URL de la imagen en tamaño miniatura (thumbnail).
 *         width:
 *           type: integer
 *           description: Ancho de la imagen original en píxeles.
 *         height:
 *           type: integer
 *           description: Alto de la imagen original en píxeles.
 *         is_primary:
 *           type: boolean
 *           description: Indica si esta es la imagen principal del producto.
 *         display_order:
 *           type: integer
 *           description: Orden de visualización de las imágenes (menor número = más arriba).
 *     ProductListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             products:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *                 total:
 *                   type: integer
 *                   example: 150
 *                 pages:
 *                   type: integer
 *                   example: 8
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error fetching products"
 *         error:
 *           type: string
 *           description: Detalles del error (solo en modo desarrollo).
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtiene una lista paginada de productos.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Cantidad de productos por página.
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: 'true'
 *         description: Filtra por productos activos.
 *       - in: query
 *         name: featured
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtra por productos destacados.
 *       - in: query
 *         name: occasion
 *         schema:
 *           type: string
 *         description: Filtra por ocasión.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda en nombre o descripción del producto.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, price_usd, name, stock]
 *           default: 'created_at'
 *         description: Campo por el cual ordenar los productos.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: 'desc'
 *         description: Orden de clasificación (ascendente o descendente).
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductListResponse'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

        // Build Supabase query directly (without relations for now)
        const client = databaseService.getClient();
        let query = client
            .from('products')
            .select('id, name, summary, description, price_usd, price_ves, stock, occasion, sku, active, featured, created_at, updated_at');

        // Apply filters
        if (active !== 'all') {
            query = query.eq('active', active === 'true');
        }

        if (featured !== undefined) {
            query = query.eq('featured', featured === 'true');
        }

        if (occasion) {
            query = query.eq('occasion', occasion);
        }

        // Handle search with OR condition
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply sorting and pagination
        query = query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + parseInt(limit) - 1);

        const { data: products, error } = await query;
        
        if (error) {
            throw error;
        }

        // Get images for all products
        if (products && products.length > 0) {
            const productIds = products.map(p => p.id);
            const { data: images } = await client
                .from('product_images')
                .select('id, product_id, url_large, url_medium, url_small, url_thumb, is_primary, display_order')
                .in('product_id', productIds)
                .order('display_order');

            // Attach images to products
            products.forEach(product => {
                product.images = images ? images.filter(img => img.product_id === product.id) : [];
            });
        }

        // Get total count with same filters
        let countQuery = client
            .from('products')
            .select('*', { count: 'exact', head: true });

        if (active !== 'all') {
            countQuery = countQuery.eq('active', active === 'true');
        }

        if (featured !== undefined) {
            countQuery = countQuery.eq('featured', featured === 'true');
        }

        if (occasion) {
            countQuery = countQuery.eq('occasion', occasion);
        }

        if (search) {
            countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { count: totalCount } = await countQuery;
        const totalPages = Math.ceil(totalCount / parseInt(limit));

        timer.end();
        
        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: totalPages
                }
            }
        });

    } catch (error) {
        timer.end();
        logger.error('Error in getAllProducts:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * 📄 GET PRODUCT BY ID
 * Obtener un producto específico con sus imágenes
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtiene un producto específico por su ID.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a obtener.
 *     responses:
 *       200:
 *         description: Producto obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const getProductById = async (req, res) => {
    const timer = startTimer('getProductById');
    
    try {
        const { id } = req.params;
        
        logger.info(req.method, req.originalUrl, {
            productId: id,
            userRole: req.user?.role
        });

        const product = await db.product.findFirst({
            where: { id: parseInt(id) },
            include: {
                images: {
                    select: ['id', 'url_large', 'url_medium', 'url_small', 'url_thumb', 'is_primary', 'display_order', 'width', 'height']
                }
            }
        });

        if (!product) {
            timer.end();
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        timer.end();
        
        res.json({
            success: true,
            data: product
        });

    } catch (error) {
        timer.end();
        logger.error('Error in getProductById:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * ➕ CREATE PRODUCT
 * Crear un nuevo producto con imágenes
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crea un nuevo producto.
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price_usd
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del producto.
 *               description:
 *                 type: string
 *                 description: Descripción del producto.
 *               price_usd:
 *                 type: number
 *                 format: float
 *                 description: Precio del producto.
 *               stock:
 *                 type: integer
 *                 description: Cantidad en stock.
 *               featured:
 *                 type: boolean
 *                 description: Si el producto es destacado.
 *               occasion:
 *                 type: string
 *                 description: Ocasión del producto.
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Archivos de imagen a subir.
 *     responses:
 *       201:
 *         description: Producto creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *                   example: "Product created successfully"
 *       400:
 *         description: Datos de entrada inválidos (faltan campos obligatorios).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const createProduct = async (req, res) => {
    const timer = startTimer('createProduct');
    
    try {
        logger.info(req.method, req.originalUrl, {
            body: req.body,
            files: req.files?.length || 0,
            userRole: req.user?.role
        });

        const {
            name,
            description,
            price_usd,
            stock = 0,
            featured = false,
            occasion = 'other'
        } = req.body;

        // Validate required fields
        if (!name || !price_usd) {
            return res.status(400).json({
                success: false,
                message: 'Name and price_usd are required'
            });
        }

        // Create product
        const productData = {
            name,
            description,
            price_usd: parseFloat(price_usd),
            stock: parseInt(stock),
            featured: featured === 'true' || featured === true,
            occasion
        };

        const product = await db.product.create({
            data: productData
        });

        // Process images if uploaded
        let processedImages = [];
        if (req.files && req.files.length > 0) {
            processedImages = await processProductImages(req.files, product.id);
        }

        timer.end();
        
        res.status(201).json({
            success: true,
            data: {
                ...product,
                images: processedImages
            },
            message: 'Product created successfully'
        });

    } catch (error) {
        timer.end();
        logger.error('Error in createProduct:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * ✏️ UPDATE PRODUCT
 * Actualizar un producto existente
 */

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualiza un producto existente.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price_usd:
 *                 type: number
 *                 format: float
 *               stock:
 *                 type: integer
 *               featured:
 *                 type: boolean
 *               occasion:
 *                 type: string
 *               active:
 *                 type: boolean
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Nuevos archivos de imagen a subir.
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *                   example: "Product updated successfully"
 *       404:
 *         description: Producto no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const updateProduct = async (req, res) => {
    const timer = startTimer('updateProduct');
    
    try {
        const { id } = req.params;
        
        logger.info(req.method, req.originalUrl, {
            productId: id,
            body: req.body,
            files: req.files?.length || 0,
            userRole: req.user?.role
        });

        // Check if product exists
        const existingProduct = await db.product.findFirst({
            where: { id: parseInt(id) }
        });

        if (!existingProduct) {
            timer.end();
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const updateData = {};
        
        // Update fields that are provided
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.description !== undefined) updateData.description = req.body.description;
        if (req.body.price_usd !== undefined) updateData.price_usd = parseFloat(req.body.price_usd);
        if (req.body.stock !== undefined) updateData.stock = parseInt(req.body.stock);
        if (req.body.featured !== undefined) updateData.featured = req.body.featured === 'true' || req.body.featured === true;
        if (req.body.occasion !== undefined) updateData.occasion = req.body.occasion;
        if (req.body.active !== undefined) updateData.active = req.body.active === 'true' || req.body.active === true;

        updateData.updated_at = new Date().toISOString();

        // Update product
        const updatedProduct = await db.product.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        // Process new images if uploaded
        let newImages = [];
        if (req.files && req.files.length > 0) {
            newImages = await processProductImages(req.files, parseInt(id));
        }

        // Get updated product with images
        const productWithImages = await db.product.findFirst({
            where: { id: parseInt(id) },
            include: {
                images: {
                    select: ['id', 'url_large', 'url_medium', 'url_small', 'url_thumb', 'is_primary', 'display_order']
                }
            }
        });

        timer.end();
        
        res.json({
            success: true,
            data: productWithImages,
            message: 'Product updated successfully'
        });

    } catch (error) {
        timer.end();
        logger.error('Error in updateProduct:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * 🗑️ DELETE PRODUCT
 * Eliminar un producto y sus imágenes
 */

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Elimina un producto y sus imágenes asociadas.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a eliminar.
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product deleted successfully"
 *       404:
 *         description: Producto no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const deleteProduct = async (req, res) => {
    const timer = startTimer('deleteProduct');
    
    try {
        const { id } = req.params;
        
        logger.info(req.method, req.originalUrl, {
            productId: id,
            userRole: req.user?.role
        });

        // Check if product exists
        const existingProduct = await db.product.findFirst({
            where: { id: parseInt(id) },
            include: { images: true }
        });

        if (!existingProduct) {
            timer.end();
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete associated images first
        if (existingProduct.images && existingProduct.images.length > 0) {
            await databaseService.delete('product_images', { product_id: parseInt(id) });
        }

        // Delete product
        await db.product.delete({
            where: { id: parseInt(id) }
        });

        timer.end();
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        timer.end();
        logger.error('Error in deleteProduct:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * 📸 Process Product Images
 * Helper function to process uploaded images
 */

/**
 * @function processProductImages
 * @description Función auxiliar que procesa un array de archivos de imagen, genera hashes, verifica duplicados, 
 *              crea versiones en múltiples resoluciones y guarda los registros en la base de datos.
 * @param {Array} files - Array de objetos de archivo subido por Multer.
 * @param {number} productId - ID del producto al que se asociarán las imágenes.
 * @returns {Promise<Array>} - Promise que resuelve en un array de objetos de imagen guardados en la base de datos.
 * @throws {Error} - Si ocurre un error durante el procesamiento de alguna imagen.
 *
 * @example
 * const processedImages = await processProductImages(req.files, product.id);
 * console.log(`Se procesaron ${processedImages.length} imágenes.`);
 */
const processProductImages = async (files, productId) => {
    const processedImages = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            // Generate file hash
            const fileHash = await imageHashService.generateFileHash(file.path);
            
            // Check for duplicates
            const existingImage = await db.productImage.findMany({
                where: { file_hash: fileHash }
            });
            
            if (existingImage.length > 0) {
                logger.info(`Duplicate image detected: ${file.originalname}`);
                // Delete temp file
                fs.unlinkSync(file.path);
                continue;
            }
            
            // Process image with multiple resolutions
            const processedPaths = await imageProcessing.processProductImage(file.path, {
                generateMultipleResolutions: true,
                optimize: true
            });
            
            // Create image record
            const imageData = {
                product_id: productId,
                file_hash: fileHash,
                original_filename: file.originalname,
                url_large: processedPaths.large,
                url_medium: processedPaths.medium,
                url_small: processedPaths.small,
                url_thumb: processedPaths.thumb,
                width: processedPaths.dimensions?.width,
                height: processedPaths.dimensions?.height,
                is_primary: i === 0, // First image is primary
                display_order: i
            };
            
            const savedImage = await db.productImage.create({
                data: imageData
            });
            
            processedImages.push(savedImage);
            
            // Clean up temp file
            fs.unlinkSync(file.path);
            
        } catch (error) {
            logger.error(`Error processing image ${file.originalname}:`, error);
            // Clean up temp file on error
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
    }
    
    return processedImages;
};

export {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
