import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const IMAGES_DIR = '/home/manager/Sync/ecommerce-floresya/dbimagenes/images-renamed';

async function generateImageVersions(filePath, baseName) {
    const versions = [
        { size: 1200, quality: 80, subdir: 'large', suffix: '_large' },
        { size: 600, quality: 75, subdir: 'medium', suffix: '_medium' },
        { size: 200, quality: 70, subdir: 'thumb', suffix: '_thumb' }
    ];

    const results = [];
    
    for (const version of versions) {
        const outputFileName = `${baseName}${version.suffix}.webp`;
        const outputPath = path.join('/tmp', outputFileName);
        
        await sharp(filePath)
            .resize(version.size)
            .webp({ quality: version.quality })
            .toFile(outputPath);
            
        const fileBuffer = fs.readFileSync(outputPath);
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(`${version.subdir}/${outputFileName}`, fileBuffer, {
                contentType: 'image/webp',
                upsert: true
            });
            
        if (uploadError) {
            console.error(`❌ Error subiendo ${version.subdir}/${outputFileName}:`, uploadError.message);
            fs.unlinkSync(outputPath);
            continue;
        }
        
        // 🚨 VERIFICA QUE LA RESPUESTA EXISTE 🚨
        const publicUrlResponse = supabase.storage
            .from('product-images')
            .getPublicUrl(`${version.subdir}/${outputFileName}`);
            
        if (!publicUrlResponse || !publicUrlResponse.data) {
            console.error(`❌ Error obteniendo URL pública para ${version.subdir}/${outputFileName}`);
            fs.unlinkSync(outputPath);
            continue;
        }
        
        results.push({
            size: version.subdir,
            url: publicUrlResponse.data.publicUrl,
            fileName: outputFileName
        });
        
        fs.unlinkSync(outputPath);
    }
    
    return results;
}

async function uploadImages() {
    try {
        const files = fs.readdirSync(IMAGES_DIR);
        
        for (const fileName of files) {
            const match = fileName.match(/^product_(\d+)_(main|extra\d+)/);
            if (!match) continue;
            
            const productId = match[1];
            const isMain = match[2] === 'main';
            const filePath = path.join(IMAGES_DIR, fileName);
            const fileBuffer = fs.readFileSync(filePath);
            const fileSize = fs.statSync(filePath).size;
            const baseName = path.parse(fileName).name;
            const fileHash = fileName.split('_')[3].replace('.webp', '');
            
            // Verifica si el hash ya existe
            const { data: existingImage, error: checkError } = await supabase
                .from('product_images')
                .select('id')
                .eq('file_hash', fileHash)
                .single();
                
            const versions = await generateImageVersions(filePath, baseName);
            
            if (versions.length === 0) {
                console.error(`❌ No se pudieron generar versiones para ${fileName}`);
                continue;
            }
            
            const urlLarge = versions.find(v => v.size === 'large')?.url;
            const urlMedium = versions.find(v => v.size === 'medium')?.url;
            const urlThumb = versions.find(v => v.size === 'thumb')?.url;
            
            if (!urlLarge) {
                console.error(`❌ Falta URL large para ${fileName}`);
                continue;
            }
            
            let operation = 'insert';
            let result;
            
            if (existingImage) {
                // Actualiza registro existente
                const { data: updatedImage, error: updateError } = await supabase
                    .from('product_images')
                    .update({
                        product_id: parseInt(productId),
                        original_filename: fileName,
                        original_size: fileSize,
                        mime_type: 'image/webp',
                        url_large: urlLarge,
                        url_medium: urlMedium,
                        url_thumb: urlThumb,
                        is_primary: isMain,
                        display_order: isMain ? 0 : parseInt(match[2].replace('extra', '')) || 1
                    })
                    .eq('file_hash', fileHash)
                    .select()
                    .single();
                    
                if (updateError) {
                    console.error(`❌ Error actualizando imagen ${fileName}:`, updateError.message);
                    continue;
                }
                
                result = updatedImage;
                operation = 'update';
            } else {
                // Inserta nuevo registro
                const { data: newImage, error: insertError } = await supabase
                    .from('product_images')
                    .insert({
                        product_id: parseInt(productId),
                        file_hash: fileHash,
                        original_filename: fileName,
                        original_size: fileSize,
                        mime_type: 'image/webp',
                        url_large: urlLarge,
                        url_medium: urlMedium,
                        url_thumb: urlThumb,
                        is_primary: isMain,
                        display_order: isMain ? 0 : parseInt(match[2].replace('extra', '')) || 1
                    })
                    .select()
                    .single();
                    
                if (insertError) {
                    console.error(`❌ Error insertando imagen ${fileName}:`, insertError.message);
                    continue;
                }
                
                result = newImage;
            }
            
            console.log(`✅ Imagen ${operation}ada: ${fileName}`);
            
            // Actualiza image_url en products si es imagen principal
            if (isMain) {
                const { error: productError } = await supabase
                    .from('products')
                    .update({ image_url: urlLarge })
                    .eq('id', parseInt(productId));
                    
                if (productError) {
                    console.error(`❌ Error actualizando producto ${productId}:`, productError.message);
                } else {
                    console.log(`✅ Producto ${productId} actualizado con image_url`);
                }
            }
        }
        
        console.log('🎉 ¡Todas las imágenes procesadas han sido subidas!');
    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

uploadImages();
