const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/database');
const { supabaseAdmin } = require('../services/supabaseAdmin');

class ImageProcessor {
    constructor() {
        this.imgTempPath = path.join(__dirname, '../../../imgtemp');
        this.outputPath = path.join(__dirname, '../../../frontend/images/products');
        this.sizes = {
            large: { width: 800, height: 800, quality: 85 },
            medium: { width: 500, height: 500, quality: 80 },
            thumb: { width: 200, height: 200, quality: 75 }
        };
        this.processedImages = [];
        this.errors = [];
    }

    async ensureDirectories() {
        if (!fs.existsSync(this.outputPath)) {
            fs.mkdirSync(this.outputPath, { recursive: true });
        }
        
        // Create subdirectories for each size
        Object.keys(this.sizes).forEach(size => {
            const sizeDir = path.join(this.outputPath, size);
            if (!fs.existsSync(sizeDir)) {
                fs.mkdirSync(sizeDir, { recursive: true });
            }
        });
    }

    async processImage(inputFile, outputName) {
        console.log(`🖼️  Procesando: ${inputFile}`);
        
        const inputPath = path.join(this.imgTempPath, inputFile);
        const results = {};

        try {
            for (const [sizeKey, config] of Object.entries(this.sizes)) {
                const outputFileName = `${outputName}-${sizeKey}.webp`;
                const outputPath = path.join(this.outputPath, sizeKey, outputFileName);
                
                await sharp(inputPath)
                    .resize(config.width, config.height, { 
                        fit: 'cover',
                        position: 'center'
                    })
                    .webp({ quality: config.quality })
                    .toFile(outputPath);

                const stats = fs.statSync(outputPath);
                const sizeKB = Math.round(stats.size / 1024);
                
                results[sizeKey] = {
                    path: outputPath,
                    relativePath: `/images/products/${sizeKey}/${outputFileName}`,
                    sizeKB: sizeKB
                };
                
                console.log(`   ✅ ${sizeKey}: ${outputFileName} (${sizeKB}KB)`);
            }
            
            return results;
        } catch (error) {
            console.error(`❌ Error procesando ${inputFile}:`, error.message);
            this.errors.push({ file: inputFile, error: error.message });
            return null;
        }
    }

    async uploadToSupabase(filePath, bucketPath) {
        try {
            const fileBuffer = fs.readFileSync(filePath);
            
            const { data, error } = await supabaseAdmin.storage
                .from('product-images')
                .upload(bucketPath, fileBuffer, {
                    contentType: 'image/webp',
                    cacheControl: '3600'
                });

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('product-images')
                .getPublicUrl(bucketPath);

            return publicUrl;
        } catch (error) {
            console.error(`❌ Error subiendo ${bucketPath}:`, error.message);
            return null;
        }
    }

    async findMatchingProduct(imageName) {
        // Extract product name from image filename
        const cleanName = imageName
            .replace(/\.(jpg|jpeg|png|webp)$/i, '')
            .replace(/-\d+$/, '')
            .replace(/-/g, ' ');

        try {
            const { data: products, error } = await supabase
                .from('products')
                .select('id, name')
                .ilike('name', `%${cleanName}%`);

            if (error) throw error;

            if (products && products.length > 0) {
                return products[0];
            }

            // Try a more flexible search
            const nameWords = cleanName.split(' ');
            for (const word of nameWords) {
                if (word.length > 3) {
                    const { data: products2, error: error2 } = await supabase
                        .from('products')
                        .select('id, name')
                        .ilike('name', `%${word}%`);

                    if (!error2 && products2 && products2.length > 0) {
                        return products2[0];
                    }
                }
            }

            return null;
        } catch (error) {
            console.error(`Error buscando producto para ${imageName}:`, error);
            return null;
        }
    }

    async updateProductImages(productId, imageUrls) {
        try {
            const { error } = await supabase
                .from('products')
                .update({ 
                    image_url: imageUrls.large,
                    additional_images: [imageUrls.medium, imageUrls.thumb],
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId);

            if (error) throw error;
            
            console.log(`   📊 Producto ${productId} actualizado con nuevas imágenes`);
            return true;
        } catch (error) {
            console.error(`Error actualizando producto ${productId}:`, error);
            return false;
        }
    }

    async processAllImages() {
        console.log('🚀 Iniciando procesamiento de imágenes...\n');
        
        await this.ensureDirectories();
        
        const files = fs.readdirSync(this.imgTempPath);
        const imageFiles = files.filter(file => 
            /\.(jpg|jpeg|png|webp)$/i.test(file)
        );

        console.log(`📁 Encontradas ${imageFiles.length} imágenes para procesar\n`);

        let processedCount = 0;
        let uploadedCount = 0;
        let databaseUpdates = 0;

        for (const file of imageFiles) {
            console.log(`📸 [${processedCount + 1}/${imageFiles.length}] Procesando: ${file}`);
            
            // Generate output name
            const outputName = file
                .replace(/\.(jpg|jpeg|png|webp)$/i, '')
                .toLowerCase()
                .replace(/[^a-z0-9]/gi, '-');

            // Process image to different sizes
            const processedImages = await this.processImage(file, outputName);
            
            if (processedImages) {
                processedCount++;
                
                // Upload to Supabase Storage
                const imageUrls = {};
                let allUploaded = true;

                for (const [sizeKey, imageData] of Object.entries(processedImages)) {
                    const bucketPath = `${sizeKey}/${path.basename(imageData.relativePath)}`;
                    const publicUrl = await this.uploadToSupabase(imageData.path, bucketPath);
                    
                    if (publicUrl) {
                        imageUrls[sizeKey] = publicUrl;
                        uploadedCount++;
                    } else {
                        allUploaded = false;
                    }
                }

                if (allUploaded) {
                    // Find matching product and update database
                    const product = await this.findMatchingProduct(file);
                    
                    if (product) {
                        const updated = await this.updateProductImages(product.id, imageUrls);
                        if (updated) {
                            databaseUpdates++;
                            console.log(`   ✅ Vinculado con: "${product.name}" (ID: ${product.id})`);
                        }
                    } else {
                        console.log(`   ⚠️  No se encontró producto para: ${file}`);
                    }
                }
            }
            
            console.log(''); // Line break
        }

        // Summary
        console.log('📊 RESUMEN FINAL:');
        console.log(`✅ Imágenes procesadas: ${processedCount}/${imageFiles.length}`);
        console.log(`☁️  Archivos subidos: ${uploadedCount}/${imageFiles.length * 3}`);
        console.log(`📊 Productos actualizados: ${databaseUpdates}`);
        
        if (this.errors.length > 0) {
            console.log(`❌ Errores: ${this.errors.length}`);
            this.errors.forEach(error => {
                console.log(`   - ${error.file}: ${error.error}`);
            });
        }
    }
}

async function main() {
    const processor = new ImageProcessor();
    await processor.processAllImages();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ImageProcessor };