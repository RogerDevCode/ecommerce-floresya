#!/usr/bin/env node

/**
 * 🌸 FloresYa - Bulk Product & Image Upload Script
 * 
 * Este script carga productos e imágenes automáticamente desde un directorio local
 * hacia Supabase storage y base de datos, siguiendo estas reglas:
 * 
 * 1. Parsea nombres de archivo: [Ocasion].[ProductoId].[ImagenNumero].png
 * 2. Procesa imágenes a múltiples resoluciones WebP (large, medium, small, thumb)
 * 3. Sube a Supabase storage: product-images/{large|medium|small|thumb}/
 * 4. Crea productos en base de datos con relación a ocasiones
 * 5. La primera imagen de cada producto es marcada como principal (is_primary=true)
 * 
 * Ejemplo de uso:
 * node backend/scripts/upload-products-with-images.js
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { databaseService } from '../src/services/databaseService.js';
import { 
    logger, 
    log,
    startTimer 
} from '../src/utils/bked_logger.js';

// Helper functions using the logger
const success = (msg, data) => log(msg, data, 'success');
const error = (msg, data) => log(msg, data, 'error');
const info = (msg, data) => log(msg, data, 'info');
const warn = (msg, data) => log(msg, data, 'warn');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const IMAGES_SOURCE_DIR = '/home/manager/Sync/ecommerce-floresya/dbimagenes/imgtemp';
const BATCH_SIZE = 5; // Procesar de a 5 imágenes para no saturar

// Mapeo de ocasiones basado en nombres de archivo a IDs
const OCCASION_MAPPING = {
    'aniversario-de-bodas': 5,      // Aniversario
    'apocalisis': null,             // No mapeable - usar general
    'cuarto-bebe': null,            // No mapeable - usar general  
    'cumpleanos': 4,                // Cumpleaños
    'cumpleaños': 4,                // Cumpleaños (con tilde)
    'dia-de-lamadre': 2,            // Día de la Madre
    'dia-de-la-madre': 2,           // Día de la Madre
    'ramo-amistad': null,           // No mapeable - usar general
    'ramo-de-novia': 7,             // Bodas
    'ramo-sobremesa': null          // No mapeable - usar general
};

// Configuración de tamaños de imagen
const IMAGE_SIZES = {
    large: { width: 1200, height: 1200, quality: 90 },
    medium: { width: 600, height: 600, quality: 85 },
    small: { width: 300, height: 300, quality: 80 },
    thumb: { width: 150, height: 150, quality: 75 }
};

class ProductImageUploader {
    constructor() {
        this.supabaseClient = null;
        this.processedProducts = new Map(); // Rastrea productos ya procesados
        this.stats = {
            totalFiles: 0,
            processedImages: 0,
            createdProducts: 0,
            errors: 0,
            skipped: 0
        };
    }

    async init() {
        try {
            info('🚀 Inicializando ProductImageUploader...');
            
            // Inicializar conexión a Supabase con service key para bypasear RLS
            const { createClient } = await import('@supabase/supabase-js');
            
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service key bypasa RLS
            
            if (!supabaseUrl || !supabaseServiceKey) {
                throw new Error('SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridas');
            }
            
            this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
            
            // Verificar conexión
            const { data, error } = await this.supabaseClient
                .from('products')
                .select('count')
                .limit(1);
            
            if (error) throw error;
            
            success('✅ Conexión a Supabase establecida con service key');
            return true;
        } catch (err) {
            error('❌ Error inicializando:', err.message);
            return false;
        }
    }

    /**
     * Parsea el nombre del archivo para extraer información del producto
     * Formato esperado: [Ocasion].[ProductoId].[ImagenNumero].png
     */
    parseFileName(fileName) {
        const nameWithoutExt = path.parse(fileName).name;
        const parts = nameWithoutExt.split('.');
        
        if (parts.length < 3) {
            warn(`⚠️ Nombre de archivo inválido: ${fileName} (esperado: Ocasion.ProductId.ImageNumber.png)`);
            return null;
        }

        const [occasionName, productIdStr, imageNumberStr] = parts;
        const productId = parseInt(productIdStr);
        const imageNumber = parseInt(imageNumberStr);

        if (isNaN(productId) || isNaN(imageNumber)) {
            warn(`⚠️ IDs inválidos en: ${fileName}`);
            return null;
        }

        // Normalizar nombre de ocasión para mapeo
        const normalizedOccasion = occasionName.toLowerCase()
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n');

        const occasionId = OCCASION_MAPPING[normalizedOccasion] || null;

        return {
            fileName,
            originalOccasionName: occasionName,
            normalizedOccasion,
            productId,
            imageNumber,
            occasionId,
            isFirstImage: imageNumber === 1
        };
    }

    /**
     * Genera hash SHA256 del buffer de imagen para evitar duplicados
     */
    generateImageHash(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Procesa una imagen a múltiples tamaños WebP
     */
    async processImageToSizes(inputBuffer, baseFileName) {
        const processedSizes = {};
        
        for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
            try {
                const processedBuffer = await sharp(inputBuffer)
                    .resize(config.width, config.height, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .webp({ 
                        quality: config.quality,
                        effort: 4 // Balance entre calidad y velocidad
                    })
                    .toBuffer();

                processedSizes[sizeName] = {
                    buffer: processedBuffer,
                    fileName: `${baseFileName}_${sizeName}.webp`
                };
                
            } catch (err) {
                error(`❌ Error procesando tamaño ${sizeName}:`, err.message);
                throw err;
            }
        }

        return processedSizes;
    }

    /**
     * Sube imagen procesada a Supabase storage
     */
    async uploadToSupabaseStorage(buffer, fileName, sizeName) {
        try {
            const storagePath = `${sizeName}/${fileName}`;
            
            const { data, error } = await this.supabaseClient.storage
                .from('product-images')
                .upload(storagePath, buffer, {
                    contentType: 'image/webp',
                    cacheControl: '3600',
                    upsert: true // Sobreescribir si existe
                });

            if (error) throw error;

            // Obtener URL pública
            const { data: urlData } = this.supabaseClient.storage
                .from('product-images')
                .getPublicUrl(storagePath);

            return {
                path: storagePath,
                url: urlData.publicUrl
            };
        } catch (err) {
            error(`❌ Error subiendo a storage (${sizeName}):`, err.message);
            throw err;
        }
    }

    /**
     * Crea o actualiza producto en la base de datos
     */
    async createOrUpdateProduct(productInfo) {
        try {
            const { productId, originalOccasionName } = productInfo;
            
            // Verificar si el producto ya existe
            const { data: existingProduct } = await this.supabaseClient
                .from('products')
                .select('id, name')
                .eq('id', productId)
                .single();

            if (existingProduct) {
                info(`📦 Producto ${productId} ya existe: ${existingProduct.name}`);
                return existingProduct;
            }

            // Crear nuevo producto
            const productName = `${originalOccasionName.replace(/-/g, ' ')} - Arreglo ${productId}`;
            const productData = {
                id: productId,
                name: productName,
                description: `Hermoso arreglo floral para ${originalOccasionName.replace(/-/g, ' ').toLowerCase()}. Elaborado con flores frescas y de la mejor calidad.`,
                price_usd: this.generateRandomPrice(),
                stock: Math.floor(Math.random() * 20) + 5, // Entre 5 y 25
                featured: Math.random() < 0.3, // 30% probabilidad de ser destacado
                active: true,
                created_at: new Date().toISOString()
            };

            const { data: newProduct, error } = await this.supabaseClient
                .from('products')
                .insert(productData)
                .select()
                .single();

            if (error) throw error;

            success(`✅ Producto creado: ${newProduct.name}`);
            this.stats.createdProducts++;
            return newProduct;

        } catch (err) {
            error(`❌ Error creando producto ${productInfo.productId}:`, err.message);
            throw err;
        }
    }

    /**
     * Genera precio aleatorio realista
     */
    generateRandomPrice() {
        const basePrice = Math.random() * 80 + 20; // Entre $20 y $100
        return Math.round(basePrice * 100) / 100; // Redondear a 2 decimales
    }

    /**
     * Crea registro de imagen en product_images table
     */
    async createProductImage(productId, imageUrls, imageHash, isPrimary = false) {
        try {
            const imageData = {
                product_id: productId,
                url_large: imageUrls.large,
                url_medium: imageUrls.medium,
                url_small: imageUrls.small,
                url_thumb: imageUrls.thumb,
                is_primary: isPrimary,
                file_hash: imageHash,
                original_filename: `processed_${Date.now()}.webp`,
                original_size: 0, // Will be calculated if needed
                mime_type: 'image/webp',
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabaseClient
                .from('product_images')
                .insert(imageData)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (err) {
            error(`❌ Error creando registro de imagen:`, err.message);
            throw err;
        }
    }

    /**
     * Vincula producto con ocasión
     */
    async linkProductToOccasion(productId, occasionId) {
        if (!occasionId) return null;

        try {
            // Verificar si ya existe la relación
            const { data: existing } = await this.supabaseClient
                .from('product_occasions')
                .select('*')
                .eq('product_id', productId)
                .eq('occasion_id', occasionId)
                .single();

            if (existing) {
                info(`🔗 Relación producto-ocasión ya existe: ${productId} -> ${occasionId}`);
                return existing;
            }

            const { data, error } = await this.supabaseClient
                .from('product_occasions')
                .insert({
                    product_id: productId,
                    occasion_id: occasionId
                })
                .select()
                .single();

            if (error) throw error;

            success(`✅ Producto vinculado a ocasión: ${productId} -> ${occasionId}`);
            return data;

        } catch (err) {
            warn(`⚠️ Error vinculando producto ${productId} a ocasión ${occasionId}:`, err.message);
            return null;
        }
    }

    /**
     * Procesa un único archivo de imagen
     */
    async processImageFile(filePath) {
        const timer = startTimer('processImage');
        const fileName = path.basename(filePath);
        
        try {
            info(`🔄 Procesando: ${fileName}`);

            // 1. Parsear información del archivo
            const productInfo = this.parseFileName(fileName);
            if (!productInfo) {
                this.stats.skipped++;
                return;
            }

            // 2. Leer archivo de imagen
            const imageBuffer = fs.readFileSync(filePath);
            const imageHash = this.generateImageHash(imageBuffer);

            // 3. Verificar si la imagen ya existe (por hash)
            const { data: existingImage } = await this.supabaseClient
                .from('product_images')
                .select('id, file_hash')
                .eq('file_hash', imageHash)
                .single();

            if (existingImage) {
                warn(`⚠️ Imagen duplicada detectada (hash): ${fileName}`);
                this.stats.skipped++;
                return;
            }

            // 4. Crear o obtener producto
            const product = await this.createOrUpdateProduct(productInfo);

            // 5. Procesar imagen a múltiples tamaños WebP
            const baseFileName = `product_${productInfo.productId}_${productInfo.imageNumber}_${imageHash}`;
            const processedSizes = await this.processImageToSizes(imageBuffer, baseFileName);

            // 6. Subir todas las variantes a Supabase Storage
            const uploadPromises = Object.entries(processedSizes).map(async ([sizeName, sizeData]) => {
                const uploadResult = await this.uploadToSupabaseStorage(
                    sizeData.buffer, 
                    sizeData.fileName, 
                    sizeName
                );
                return [sizeName, uploadResult.url];
            });

            const uploadResults = await Promise.all(uploadPromises);
            const imageUrls = Object.fromEntries(uploadResults);

            // 7. Crear registro de imagen en base de datos
            await this.createProductImage(
                productInfo.productId,
                imageUrls,
                imageHash,
                productInfo.isFirstImage // Primera imagen es principal
            );

            // 8. Vincular producto con ocasión
            await this.linkProductToOccasion(productInfo.productId, productInfo.occasionId);

            this.stats.processedImages++;
            success(`✅ Completado: ${fileName} (${timer.end().toFixed(2)}ms)`);

        } catch (err) {
            error(`❌ Error procesando ${fileName}:`, err.message);
            this.stats.errors++;
        }
    }

    /**
     * Ejecuta el proceso completo de carga
     */
    async run() {
        const totalTimer = startTimer('totalProcess');
        
        try {
            info('🌸 FloresYa - Iniciando carga masiva de productos e imágenes');
            info(`📁 Directorio fuente: ${IMAGES_SOURCE_DIR}`);

            // Verificar que el directorio existe
            if (!fs.existsSync(IMAGES_SOURCE_DIR)) {
                throw new Error(`Directorio no encontrado: ${IMAGES_SOURCE_DIR}`);
            }

            // Obtener lista de archivos de imagen
            const files = fs.readdirSync(IMAGES_SOURCE_DIR)
                .filter(file => file.toLowerCase().match(/\.(png|jpg|jpeg)$/))
                .map(file => path.join(IMAGES_SOURCE_DIR, file));

            if (files.length === 0) {
                warn('⚠️ No se encontraron archivos de imagen en el directorio');
                return;
            }

            this.stats.totalFiles = files.length;
            info(`📊 Total de archivos a procesar: ${files.length}`);

            // Procesar archivos en lotes
            for (let i = 0; i < files.length; i += BATCH_SIZE) {
                const batch = files.slice(i, i + BATCH_SIZE);
                const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
                const totalBatches = Math.ceil(files.length / BATCH_SIZE);
                
                info(`🔄 Procesando lote ${batchNumber}/${totalBatches} (${batch.length} archivos)`);
                
                // Procesar lote en paralelo
                const batchPromises = batch.map(filePath => this.processImageFile(filePath));
                await Promise.allSettled(batchPromises);

                // Pausa breve entre lotes para no saturar
                if (i + BATCH_SIZE < files.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // Mostrar estadísticas finales
            const totalTime = totalTimer.end();
            
            success('🎉 ¡Proceso completado exitosamente!');
            info(`📊 Estadísticas finales:`);
            info(`   • Archivos totales: ${this.stats.totalFiles}`);
            info(`   • Imágenes procesadas: ${this.stats.processedImages}`);
            info(`   • Productos creados: ${this.stats.createdProducts}`);
            info(`   • Archivos omitidos: ${this.stats.skipped}`);
            info(`   • Errores: ${this.stats.errors}`);
            info(`   • Tiempo total: ${(totalTime / 1000).toFixed(2)}s`);
            info(`   • Promedio por imagen: ${(totalTime / this.stats.processedImages / 1000).toFixed(2)}s`);

        } catch (err) {
            error('❌ Error en proceso principal:', err.message);
            throw err;
        }
    }
}

// Función principal
async function main() {
    const uploader = new ProductImageUploader();
    
    try {
        const initialized = await uploader.init();
        if (!initialized) {
            process.exit(1);
        }
        
        await uploader.run();
        
        success('🌸 FloresYa - Proceso completado exitosamente');
        process.exit(0);
        
    } catch (err) {
        error('💥 Error fatal:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default ProductImageUploader;