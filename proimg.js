import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Script para procesar TODAS las imágenes del directorio al formato: product_{ID}_{TIPO}_{HASH}.webp
 * Convierte a WebP y genera versiones optimizadas
 */

async function processAllProductImages(inputDir, outputDir) {
    // Crear directorio de salida si no existe
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Leer todos los archivos del directorio de entrada
    const files = fs.readdirSync(inputDir).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });

    console.log(`🔄 Procesando ${files.length} imágenes...`);

    for (const fileName of files) {
        try {
            // Extraer ID y tipo del nombre (product_5_main.jpg)
            const match = fileName.match(/^product_(\d+)_(main|extra\d+)(\.[a-zA-Z]+)$/);
            if (!match) {
                console.warn(`⚠️  Formato no reconocido: ${fileName}`);
                continue;
            }

            const productId = match[1];
            const imageType = match[2];
            const originalExt = match[3];
            const filePath = path.join(inputDir, fileName);

            // Calcular hash SHA256
            const fileBuffer = fs.readFileSync(filePath);
            const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

            // Convertir a WebP usando sharp
            const newFileName = `product_${productId}_${imageType}_${hash}.webp`;
            const newFilePath = path.join(outputDir, newFileName);

            // Usar sharp para convertir a WebP
            const sharp = (await import('sharp')).default;
            await sharp(filePath)
                .webp({ quality: 80 })
                .toFile(newFilePath);

            console.log(`✅ ${fileName} → ${newFileName}`);

        } catch (error) {
            console.error(`❌ Error procesando ${fileName}:`, error.message);
        }
    }

    console.log('🎉 ¡Proceso completado!');
}

// Configuración
const INPUT_DIRECTORY = '/home/manager/Sync/ecommerce-floresya/dbimagenes/images-original';  // Directorio con imágenes originales
const OUTPUT_DIRECTORY = '/home/manager/Sync/ecommerce-floresya/dbimagenes/images-renamed';  // Directorio para imágenes procesadas

// Ejecutar script
processAllProductImages(INPUT_DIRECTORY, OUTPUT_DIRECTORY)
    .catch(console.error);