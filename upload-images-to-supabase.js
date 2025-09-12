import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY  // ✅ Usa SERVICE_KEY para operaciones de escritura
);

const IMAGES_DIR = '/home/manager/Sync/ecommerce-floresya/dbimagenes/images-renamed';

async function uploadImages() {
    try {
        const files = fs.readdirSync(IMAGES_DIR);
        
        for (const fileName of files) {
            // Extraer ID y tipo del nombre (product_5_main_hash.webp)
            const match = fileName.match(/^product_(\d+)_(main|extra\d+)/);
            if (!match) continue;
            
            const productId = match[1];
            const isMain = match[2] === 'main';
            
            // Leer archivo
            const filePath = path.join(IMAGES_DIR, fileName);
            const fileBuffer = fs.readFileSync(filePath);
            const fileSize = fs.statSync(filePath).size; // ✅ Obtener tamaño del archivo
            
            // Subir a storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, fileBuffer, { 
                    upsert: true,
                    contentType: 'image/webp'  // ✅ Especificar tipo MIME
                });
                
            if (uploadError) {
                console.error(`❌ Error subiendo ${fileName}:`, uploadError.message);
                continue;
            }
            
            // Obtener URL pública
            const publicUrlData = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);
                
            const imageUrl = publicUrlData.data.publicUrl; // ✅ Acceso correcto a la URL
            
            if (!imageUrl) {
                console.error(`❌ No se pudo obtener URL pública para ${fileName}`);
                continue;
            }
            
            // ✅ Verificar si el producto existe y obtener su ocasión actual
            const {  productData, error: productError } = await supabase
                .from('products')
                .select('occasion')
                .eq('id', parseInt(productId))
                .single();
                
            let occasionId = 8; // Default: 'Sin ocasión específica'
            if (productData && productData.occasion) {
                // Si el producto ya tiene una ocasión, mantenerla
                occasionId = productData.occasion;
            }
            
            // ✅ Insertar en tabla product_images con todos los campos requeridos
            const { data: imageData, error: dbError } = await supabase
                .from('product_images')
                .insert({
                    product_id: parseInt(productId),
                    file_hash: fileName.split('_')[3].replace('.webp', ''),
                    original_filename: fileName,
                    original_size: fileSize,  // ✅ Campo requerido
                    mime_type: 'image/webp',  // ✅ Campo requerido
                    url_large: imageUrl,
                    is_primary: isMain,
                    display_order: isMain ? 0 : parseInt(match[2].replace('extra', '')) || 1
                })
                .select()
                .single();
                
            if (dbError) {
                console.error(`❌ Error insertando en DB ${fileName}:`, dbError.message);
            } else {
                console.log(`✅ Imagen subida y registrada: ${fileName}`);
                
                // Si es imagen principal, actualizar campos en products
                if (isMain) {
                    const { error: productUpdateError } = await supabase
                        .from('products')
                        .update({ 
                            image_url: imageUrl,
                            occasion: occasionId  // ✅ Asignar ocasión (8 si no tiene)
                        })
                        .eq('id', parseInt(productId));
                        
                    if (productUpdateError) {
                        console.error(`❌ Error actualizando producto ${productId}:`, productUpdateError.message);
                    } else {
                        console.log(`✅ Producto ${productId} actualizado con image_url y occasion`);
                    }
                }
            }
        }
        
        console.log('🎉 ¡Todas las imágenes procesadas han sido subidas!');
    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

uploadImages();
