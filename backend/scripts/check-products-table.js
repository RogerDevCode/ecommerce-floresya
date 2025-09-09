/**
 * Script para revisar la estructura de la tabla productos
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

async function checkProductsTable() {
    try {
        console.log('🔍 Revisando estructura de la tabla products...');
        
        // Obtener un producto para ver las columnas disponibles
        const { data: sample, error } = await supabase
            .from('products')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Error:', error);
            return;
        }
        
        if (sample.length > 0) {
            console.log('📊 Columnas disponibles en la tabla products:');
            const columns = Object.keys(sample[0]);
            columns.forEach((col, index) => {
                console.log(`  ${index + 1}. ${col}: ${typeof sample[0][col]} (${sample[0][col]})`);
            });
        } else {
            console.log('⚠️ No hay productos en la tabla');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkProductsTable();