/**
 * Script para actualizar las rutas de imagen de los productos
 * Basándose en el nombre del producto, generará rutas aproximadas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables SUPABASE_URL y SUPABASE_ANON_KEY requeridas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeo de nombres de productos a rutas de imagen conocidas
const imageMapping = {
    'Ramo de Novia': 'ramo-de-novia-clasico-3-large.webp',
    'Aniversario de Bodas': 'bouquet-de-girasoles-2-large.webp',
    'Apocalisis': 'orqu-deas-exoticas-2-large.webp',
    'Cumpleaños': 'bouquet-de-girasoles-2-large.webp',
    'Ramo Amistad': 'ramo-de-novia-clasico-3-large.webp'
};

async function updateProductImages() {
    try {
        console.log('🔍 Obteniendo productos...');
        
        // Obtener todos los productos
        const { data: products, error: fetchError } = await supabase
            .from('products')
            .select('id, name, image_path');
            
        if (fetchError) {
            console.error('❌ Error obteniendo productos:', fetchError);
            return;
        }
        
        console.log(`📦 Encontrados ${products.length} productos`);
        
        // Actualizar productos que no tienen imagen_path
        for (const product of products) {
            if (!product.image_path) {
                const imagePath = imageMapping[product.name];
                
                if (imagePath) {
                    console.log(`🔄 Actualizando ${product.name} → ${imagePath}`);
                    
                    const { error: updateError } = await supabase
                        .from('products')
                        .update({ image_path: imagePath })
                        .eq('id', product.id);
                        
                    if (updateError) {
                        console.error(`❌ Error actualizando producto ${product.id}:`, updateError);
                    } else {
                        console.log(`✅ Producto ${product.id} actualizado`);
                    }
                } else {
                    console.log(`⚠️ No hay imagen mapeada para: ${product.name}`);
                }
            } else {
                console.log(`✅ ${product.name} ya tiene imagen: ${product.image_path}`);
            }
        }
        
        console.log('🎉 Proceso completado');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

updateProductImages();