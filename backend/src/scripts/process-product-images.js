const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { supabase } = require('../config/database');
const { supabaseAdmin } = require('../services/supabaseAdmin');

class ImageProcessor {
    constructor() {
        this.imgTempPath = path.join(__dirname, '../../../imgtemp'); // Solo para leer originales
        this.sizes = {
            large: { width: 800, height: 800, quality: 85 },
            medium: { width: 500, height: 500, quality: 80 },
            thumb: { width: 200, height: 200, quality: 75 }
        };
        this.stats = {
            totalFiles: 0,
            processed: 0,
            uploaded: 0,
            productsUpdated: 0,
            skipped: 0
        };
        this.errors = [];
    }

    async validateInputFile(filePath) {
        try {
            const stats = await fs.stat(filePath);
            if (!stats.isFile()) {
                throw new Error('No es un archivo válido');
            }
            if (stats.size === 0) {
                throw new Error('Archivo vacío');
            }
            return true;
        } catch (error) {
            console.warn(`⚠️  Archivo inválido o no encontrado: ${filePath}`);
            return false;
        }
    }

    async processImageInMemory(inputFile, outputName) {
        console.log(`\n🖼️  Procesando en memoria: ${inputFile}`);
        
        const inputPath = path.join(this.imgTempPath, inputFile);
        
        // Validar archivo original
        if (!(await this.validateInputFile(inputPath))) {
            this.stats.skipped++;
            return null;
        }

        try {
            // Leer archivo original en buffer
            const originalBuffer = await fs.readFile(inputPath);
            const results = {};

            // Procesar cada tamaño en memoria
            for (const [sizeKey, config] of Object.entries(this.sizes)) {
                const outputFileName = `${outputName}-${sizeKey}.webp`;
                const bucketPath = `${sizeKey}/${outputFileName}`;

                // Procesar imagen en memoria
                const processedBuffer = await sharp(originalBuffer)
                    .resize(config.width, config.height, { 
                        fit: 'cover',
                        position: 'center',
                        background: { r: 255, g: 255, b: 255, alpha: 1 }
                    })
                    .webp({ 
                        quality: config.quality,
                        effort: 4,
                        lossless: false
                    })
                    .toBuffer();

                // Subir directamente a Supabase desde buffer
                const { data, error } = await supabaseAdmin.storage
                    .from('product-images')
                    .upload(bucketPath, processedBuffer, {
                        contentType: 'image/webp',
                        cacheControl: 'public, max-age=31536000',
                        upsert: true
                    });

                if (error) {
                    throw new Error(`Error subiendo ${bucketPath}: ${error.message}`);
                }

                // Obtener URL pública
                const { publicUrlData } = supabaseAdmin.storage
                    .from('product-images')
                    .getPublicUrl(bucketPath);

                const publicUrl = publicUrlData?.publicUrl;

                if (!publicUrl) {
                    throw new Error('No se pudo obtener URL pública');
                }

                results[sizeKey] = publicUrl;
                console.log(`   ☁️  ${sizeKey}: ${publicUrl}`);
                this.stats.uploaded++;
            }
            
            this.stats.processed++;
            return results;

        } catch (error) {
            const errorMsg = `Error procesando ${inputFile}: ${error.message}`;
            console.error(`❌ ${errorMsg}`);
            this.errors.push({ file: inputFile, error: errorMsg });
            return null;
        }
    }

    async findMatchingProduct(imageName) {
        // Extraer nombre base del archivo
        let cleanName = imageName
            .replace(/\.(jpg|jpeg|png|webp)$/i, '')
            .replace(/-\d+$/, '')
            .replace(/-/g, ' ')
            .trim();

        cleanName = cleanName.replace(/\s+/g, ' ');

        try {
            let { data: products, error } = await supabase
                .from('products')
                .select('id, name, slug')
                .or(`name.ilike.%${cleanName}%,slug.ilike.%${cleanName}%`);

            if (error) throw error;

            if (!products || products.length === 0) {
                const nameWords = cleanName.split(' ').filter(word => word.length > 3);
                
                for (const word of nameWords) {
                    const { data: products2, error: error2 } = await supabase
                        .from('products')
                        .select('id, name, slug')
                        .or(`name.ilike.%${word}%,slug.ilike.%${word}%`);

                    if (!error2 && products2 && products2.length > 0) {
                        products = products2;
                        break;
                    }
                }
            }

            if (products && products.length > 0) {
                return products[0];
            }

            return null;
        } catch (error) {
            console.error(`❌ Error buscando producto para "${imageName}":`, error.message);
            return null;
        }
    }

    async updateProductImages(productId, imageUrls) {
        try {
            const { data: existingProduct, error: checkError } = await supabase
                .from('products')
                .select('id, name, image_url')
                .eq('id', productId)
                .single();

            if (checkError || !existingProduct) {
                console.warn(`⚠️  Producto no encontrado: ID ${productId}`);
                return false;
            }

            // Actualizar producto con URL principal (large)
            const { error } = await supabase
                .from('products')
                .update({ 
                    image_url: imageUrls.large || existingProduct.image_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId);

            if (error) throw error;

            // Insertar/actualizar en product_images
            const imageRecords = Object.entries(imageUrls).map(([size, url]) => ({
                product_id: productId,
                image_url: url,
                size: size,
                is_primary: size === 'large',
                created_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase
                .from('product_images')
                .upsert(imageRecords, { onConflict: 'product_id,size' });

            if (insertError) {
                console.warn(`⚠️  Error en product_images para producto ${productId}:`, insertError.message);
            }

            console.log(`   📊 Producto actualizado: "${existingProduct.name}" (ID: ${productId})`);
            this.stats.productsUpdated++;
            return true;
        } catch (error) {
            console.error(`❌ Error actualizando producto ${productId}:`, error.message);
            return false;
        }
    }

    async processImageFile(file, index, total) {
        console.log(`\n📸 [${index + 1}/${total}] Procesando: ${file}`);
        
        const outputName = file
            .replace(/\.(jpg|jpeg|png|webp)$/i, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/gi, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        // Procesar directamente en memoria y subir a Supabase
        const imageUrls = await this.processImageInMemory(file, outputName);
        
        if (!imageUrls) {
            return false;
        }

        // Buscar y actualizar producto
        const product = await this.findMatchingProduct(file);
        
        if (product) {
            await this.updateProductImages(product.id, imageUrls);
            return true;
        } else {
            console.log(`   ⚠️  No se encontró producto para: ${file}`);
            return false;
        }
    }

    async processAllImages() {
        console.log('🚀 Iniciando procesamiento de imágenes en memoria para FloresYa (Cloud-Only Mode)...\n');
        
        try {
            const files = await fs.readdir(this.imgTempPath);
            const imageFiles = files.filter(file => 
                /\.(jpg|jpeg|png|webp)$/i.test(file)
            );

            this.stats.totalFiles = imageFiles.length;
            console.log(`📁 Encontradas ${imageFiles.length} imágenes para procesar\n`);

            if (imageFiles.length === 0) {
                console.log('ℹ️  No hay imágenes para procesar en imgtemp/');
                return;
            }

            // Procesar secuencialmente
            for (let i = 0; i < imageFiles.length; i++) {
                await this.processImageFile(imageFiles[i], i, imageFiles.length);
            }

            this.showSummary();

        } catch (error) {
            console.error('❌ Error fatal:', error.message);
            process.exit(1);
        }
    }

    showSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DEL PROCESAMIENTO - FLORESYA (CLOUD-ONLY)');
        console.log('='.repeat(60));
        console.log(`✅ Imágenes procesadas en memoria: ${this.stats.processed}/${this.stats.totalFiles}`);
        console.log(`☁️  Archivos subidos a Supabase: ${this.stats.uploaded}`);
        console.log(`📊 Productos actualizados: ${this.stats.productsUpdated}`);
        console.log(`⏭️  Archivos saltados: ${this.stats.skipped}`);
        
        if (this.errors.length > 0) {
            console.log(`\n❌ ERRORES DETECTADOS (${this.errors.length}):`);
            this.errors.slice(0, 5).forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.file}: ${error.error}`);
            });
            if (this.errors.length > 5) {
                console.log(`   ... y ${this.errors.length - 5} errores más`);
            }
        }

        console.log('\n🌸 ¡Procesamiento completado sin usar almacenamiento local!');
    }
}

async function main() {
    const processor = new ImageProcessor();
    await processor.processAllImages();
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error en script principal:', error.message);
        process.exit(1);
    });
}

module.exports = { ImageProcessor };