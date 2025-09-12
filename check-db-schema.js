import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function checkSchema() {
    try {
        console.log('🔍 Verificando esquema actual de FloresYa...\n');
        
        // 1. Verificar estructura de products
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('❌ Error consultando products:', error.message);
            return;
        }
        
        if (products && products.length > 0) {
            console.log('📋 COLUMNAS EN TABLA PRODUCTS:');
            Object.keys(products[0]).sort().forEach(col => {
                const value = products[0][col];
                const type = typeof value;
                console.log(`   - ${col} (${type})`);
            });
            
            // Verificar específicamente las columnas en cuestión
            console.log('\n🎯 VERIFICACIÓN ESPECÍFICA:');
            console.log(`   - image_url: ${products[0].hasOwnProperty('image_url') ? '✅ EXISTE' : '❌ NO EXISTE'}`);
            console.log(`   - additional_images: ${products[0].hasOwnProperty('additional_images') ? '✅ EXISTE' : '❌ NO EXISTE'}`);
            console.log(`   - primary_image: ${products[0].hasOwnProperty('primary_image') ? '✅ EXISTE' : '❌ NO EXISTE'}`);
            console.log(`   - secondary_images: ${products[0].hasOwnProperty('secondary_images') ? '✅ EXISTE' : '❌ NO EXISTE'}`);
        }
        
        // 2. Verificar otras tablas clave
        const tablesToCheck = ['carousel_images', 'payments', 'orders', 'product_images', 'occasions'];
        
        for (const table of tablesToCheck) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                    
                if (!error && data) {
                    console.log(`\n📋 COLUMNAS EN TABLA ${table.toUpperCase()}:`);
                    if (data.length > 0) {
                        Object.keys(data[0]).sort().forEach(col => {
                            console.log(`   - ${col}`);
                        });
                    } else {
                        console.log('   (tabla vacía, no se pueden determinar columnas)');
                    }
                }
            } catch (err) {
                console.log(`❌ Error consultando ${table}: ${err.message}`);
            }
        }
        
        // 3. Verificar si existe tabla categories
        try {
            const { data: categories, error: catError } = await supabase
                .from('categories')
                .select('*')
                .limit(1);
                
            if (catError) {
                console.log('\n❌ TABLA CATEGORIES: NO EXISTE (confirmado)');
            } else {
                console.log('\n⚠️  TABLA CATEGORIES: EXISTE (inesperado)');
                if (categories && categories.length > 0) {
                    console.log('   Columnas:', Object.keys(categories[0]));
                }
            }
        } catch (err) {
            console.log('\n❌ TABLA CATEGORIES: NO EXISTE (confirmado)');
        }
        
    } catch (err) {
        console.error('❌ Error general:', err.message);
    }
}

checkSchema();