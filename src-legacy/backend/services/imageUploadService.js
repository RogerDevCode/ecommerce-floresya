import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
config();

// Cliente Supabase con SERVICE_ROLE para bypasear RLS
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Cliente regular para operaciones de base de datos
import { supabase } from '../config/database.js';

// Mapeo de ocasiones
const OCCASIONS_MAP = {
    1: 'valentine',     // San Valentín
    2: 'mother',        // Día de la Madre  
    3: 'father',        // Día del Padre
    4: 'birthday',      // Cumpleaños
    5: 'anniversary',   // Aniversario
    6: 'graduation',    // Graduación
    7: 'wedding',       // Bodas
    8: 'newbaby',       // Nuevo Bebé
    9: 'recovery',      // Recuperación
    10: 'condolences',  // Condolencias
    11: 'thankyou',     // Agradecimiento
    12: 'homedecor',    // Decoración Hogar
    13: 'corporate'     // Corporativo
};

/**
 * Convierte imagen PNG a WebP usando Sharp
 */
async function convertToWebP(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .webp({ 
                quality: 85,  // Buena calidad con compresión
                effort: 6     // Mayor esfuerzo de compresión
            })
            .toFile(outputPath);
            
        console.log(`   🔄 Convertido a WebP: ${path.basename(outputPath)}`);
        return true;
    } catch (error) {
        console.error(`   ❌ Error convirtiendo ${path.basename(inputPath)}:`, error.message);
        return false;
    }
}

/**
 * Sube imagen a Supabase Storage usando SERVICE_ROLE
 */
async function uploadImageToSupabase(imagePath, filename) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const uploadPath = `large/${filename}`;
        
        console.log(`   📤 Subiendo a Supabase: ${uploadPath}`);
        
        const { data, error } = await supabaseAdmin.storage
            .from('product-images')
            .upload(uploadPath, imageBuffer, {
                contentType: 'image/webp',
                upsert: true,
                cacheControl: '3600'
            });
            
        if (error) {
            console.error('   ❌ Error Supabase Storage:', error);
            return null;
        }
        
        // Construir URL pública
        const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${uploadPath}`;
        
        console.log(`   ✅ Imagen subida: ${filename}`);
        return publicUrl;
        
    } catch (error) {
        console.error(`   💥 Error fatal subiendo ${filename}:`, error.message);
        return null;
    }
}

/**
 * Procesa un buffer de imagen (desde multer) y lo sube a Supabase
 */
async function processImageBuffer(buffer, originalName) {
    try {
        // Crear nombre único
        const timestamp = Date.now();
        const cleanName = originalName.replace(/[^a-z0-9.-]/gi, '').toLowerCase();
        const webpName = `${timestamp}-${cleanName.replace(/\.(png|jpg|jpeg)$/i, '.webp')}`;
        
        // Convertir buffer a WebP
        const webpBuffer = await sharp(buffer)
            .webp({ quality: 85, effort: 6 })
            .toBuffer();
        
        const uploadPath = `large/${webpName}`;
        
        console.log(`   📤 Subiendo buffer a Supabase: ${uploadPath}`);
        
        const { data, error } = await supabaseAdmin.storage
            .from('product-images')
            .upload(uploadPath, webpBuffer, {
                contentType: 'image/webp',
                upsert: true,
                cacheControl: '3600'
            });
            
        if (error) {
            console.error('   ❌ Error Supabase Storage:', error);
            return null;
        }
        
        const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${uploadPath}`;
        
        console.log(`   ✅ Buffer subido como: ${webpName}`);
        return publicUrl;
        
    } catch (error) {
        console.error('   💥 Error procesando buffer:', error.message);
        return null;
    }
}

/**
 * Genera descripción según el título
 */
function generateDescription(title) {
    const titleMap = {
        'Apocalisis': 'Dramático arreglo floral con tonos intensos y flores exóticas que transmite emociones profundas y pasión desbordante',
        'Aniversario-de-Bodas': 'Elegante arreglo conmemorativo que celebra el amor duradero con flores clásicas, rosas premium y detalles dorados',
        'Cuarto-Bebe': 'Tierno arreglo floral en tonos pastel suaves, perfecto para celebrar la llegada de un nuevo miembro a la familia',
        'Cumpleaños': 'Vibrante bouquet lleno de alegría y color, con flores frescas diseñado para hacer cada celebración más especial y memorable',
        'Dia-de-laMadre': 'Hermoso ramo que expresa amor y gratitud hacia las madres, con flores delicadas y colores que tocan el corazón',
        'Ramo-Amistad': 'Colorido arreglo que simboliza la amistad verdadera, con flores alegres llenas de significado y cariño sincero',
        'Ramo-de-Novia': 'Sofisticado ramo nupcial diseñado especialmente para el día más importante, con flores premium y acabado elegante',
        'Ramo-Sobremesa': 'Elegante centro de mesa que aporta distinción y belleza natural a cualquier ambiente del hogar u oficina'
    };
    
    return titleMap[title] || `Hermoso arreglo floral ${title.toLowerCase().replace(/-/g, ' ')}, cuidadosamente diseñado para ocasiones especiales con flores frescas de la más alta calidad`;
}

/**
 * Crea producto en la base de datos
 */
async function createProduct(productData) {
    try {
        console.log(`   💾 Creando producto: ${productData.name}`);
        
        const { data, error } = await supabase
            .from('products')
            .insert({
                name: productData.name,
                description: productData.description,
                price: productData.price,
                stock_quantity: productData.stock_quantity || Math.floor(Math.random() * 20) + 10,
                active: true,
                featured: productData.featured || Math.random() > 0.5,
                show_on_homepage: productData.show_on_homepage || Math.random() > 0.7,
                homepage_order: productData.homepage_order || Math.floor(Math.random() * 100),
                occasion: productData.occasion,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select();
            
        if (error) {
            console.error('   ❌ Error BD:', error);
            return null;
        }
        
        console.log(`   ✅ Producto creado con ID: ${data[0].id}`);
        
        // Crear relación con ocasión si hay occasion_id
        if (productData.occasion_id) {
            try {
                const { error: relationError } = await supabase
                    .from('product_occasions')
                    .insert({
                        product_id: data[0].id,
                        occasion_id: productData.occasion_id
                    });
                    
                if (!relationError) {
                    console.log('   🔗 Relación ocasión creada');
                }
            } catch (e) {
                console.log('   ℹ️ Relación ocasión omitida');
            }
        }
        
        return data[0];
        
    } catch (error) {
        console.error('   💥 Error creando producto:', error.message);
        return null;
    }
}

/**
 * Procesa grupo de imágenes y crea producto
 */
async function processImageGroupAndCreateProduct(title, images, occasionId) {
    console.log(`\\n📦 Procesando: ${title} (${images.length} imágenes, ocasión ${occasionId})`);
    
    const uploadedUrls = [];
    const tempDir = './temp_webp';
    
    // Crear directorio temporal si no existe
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    
    try {
        // Procesar cada imagen
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            console.log(`   🖼️ Procesando imagen ${i + 1}/${images.length}: ${image.filename}`);
            
            // Crear nuevo nombre limpio
            const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const newFilename = `${cleanTitle}-${occasionId}-${image.sequential}.webp`;
            const tempWebpPath = path.join(tempDir, newFilename);
            
            // Convertir PNG a WebP
            const converted = await convertToWebP(image.path, tempWebpPath);
            
            if (converted) {
                // Subir a Supabase
                const url = await uploadImageToSupabase(tempWebpPath, newFilename);
                
                if (url) {
                    uploadedUrls.push(url);
                    console.log('   ✅ Subida exitosa');
                }
                
                // Limpiar archivo temporal
                try {
                    fs.unlinkSync(tempWebpPath);
                } catch (e) {
                    // Ignorar errores de limpieza
                }
            }
            
            // Pausa para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Crear producto si hay imágenes
        if (uploadedUrls.length > 0) {
            const productData = {
                name: title.replace(/-/g, ' '),
                description: generateDescription(title),
                price: Math.floor(Math.random() * (60 - 30 + 1)) + 30,
                image_url: uploadedUrls[0],
                primary_image: uploadedUrls[0],
                additional_images: JSON.stringify(uploadedUrls.slice(1)),
                occasion: OCCASIONS_MAP[occasionId] || 'other',
                occasion_id: occasionId
            };
            
            const product = await createProduct(productData);
            return product;
        }
        
        return null;
        
    } finally {
        // Limpiar directorio temporal
        try {
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                files.forEach(file => {
                    try {
                        fs.unlinkSync(path.join(tempDir, file));
                    } catch (e) {}
                });
                fs.rmdirSync(tempDir);
            }
        } catch (e) {
            // Ignorar errores de limpieza
        }
    }
}

export {
    convertToWebP,
    uploadImageToSupabase,
    processImageBuffer,
    generateDescription,
    createProduct,
    processImageGroupAndCreateProduct,
    OCCASIONS_MAP
};