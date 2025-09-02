const { supabase } = require('../config/database');

async function inspectTables() {
    console.log('🔍 Inspeccionando tablas de Supabase...\n');
    
    try {
        // Inspeccionar tabla categories
        console.log('📋 TABLA: categories');
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .limit(1);
        
        if (catError) {
            console.log('❌ Error:', catError.message);
        } else {
            console.log('✅ Estructura encontrada:', categories[0] ? Object.keys(categories[0]) : 'Vacía');
            console.log('📊 Registros:', categories.length > 0 ? 'Tiene datos' : 'Vacía');
        }
        console.log('');

        // Inspeccionar tabla products
        console.log('📋 TABLA: products');
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('*')
            .limit(1);
        
        if (prodError) {
            console.log('❌ Error:', prodError.message);
        } else {
            console.log('✅ Estructura encontrada:', products[0] ? Object.keys(products[0]) : 'Vacía');
            console.log('📊 Registros:', products.length > 0 ? 'Tiene datos' : 'Vacía');
        }
        console.log('');

        // Inspeccionar tabla settings
        console.log('📋 TABLA: settings');
        const { data: settings, error: setError } = await supabase
            .from('settings')
            .select('*')
            .limit(1);
        
        if (setError) {
            console.log('❌ Error:', setError.message);
        } else {
            console.log('✅ Estructura encontrada:', settings[0] ? Object.keys(settings[0]) : 'Vacía');
            console.log('📊 Registros:', settings.length > 0 ? 'Tiene datos' : 'Vacía');
        }
        console.log('');

        // Inspeccionar tabla carousel_images
        console.log('📋 TABLA: carousel_images');
        const { data: carousel, error: carError } = await supabase
            .from('carousel_images')
            .select('*')
            .limit(1);
        
        if (carError) {
            console.log('❌ Error:', carError.message);
        } else {
            console.log('✅ Estructura encontrada:', carousel[0] ? Object.keys(carousel[0]) : 'Vacía');
            console.log('📊 Registros:', carousel.length > 0 ? 'Tiene datos' : 'Vacía');
        }
        console.log('');

        // Inspeccionar tabla users
        console.log('📋 TABLA: users');
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .limit(1);
        
        if (userError) {
            console.log('❌ Error:', userError.message);
        } else {
            console.log('✅ Estructura encontrada:', users[0] ? Object.keys(users[0]) : 'Vacía');
            console.log('📊 Registros:', users.length > 0 ? 'Tiene datos' : 'Vacía');
        }
        console.log('');

        // Inspeccionar tabla orders
        console.log('📋 TABLA: orders');
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .limit(1);
        
        if (orderError) {
            console.log('❌ Error:', orderError.message);
        } else {
            console.log('✅ Estructura encontrada:', orders[0] ? Object.keys(orders[0]) : 'Vacía');
            console.log('📊 Registros:', orders.length > 0 ? 'Tiene datos' : 'Vacía');
        }

        console.log('\n✅ Inspección completada');
        
    } catch (error) {
        console.error('❌ Error durante la inspección:', error);
    }
}

if (require.main === module) {
    inspectTables();
}

module.exports = { inspectTables };