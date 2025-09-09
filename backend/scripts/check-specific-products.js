/**
 * Script para revisar productos específicos y sus imágenes
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

async function checkProducts() {
    try {
        console.log('🔍 Revisando productos específicos...');
        
        // Obtener algunos productos específicos
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, image_url, additional_images')
            .limit(5);
            
        if (error) {
            console.error('❌ Error:', error);
            return;
        }
        
        products.forEach((product, index) => {
            console.log(`\n📦 Producto ${index + 1}:`);
            console.log(`  ID: ${product.id}`);
            console.log(`  Nombre: ${product.name}`);
            console.log(`  image_url: ${product.image_url || 'NULL'}`);
            console.log(`  additional_images: ${product.additional_images || 'NULL'}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkProducts();