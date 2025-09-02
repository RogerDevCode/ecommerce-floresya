const { supabase } = require('../config/database');

async function checkMissingTables() {
    console.log('🔍 Verificando tablas adicionales que podrían faltar...\n');
    
    const tablesToCheck = [
        'order_items',
        'payment_methods', 
        'payments',
        'reviews',
        'wishlist',
        'shopping_cart',
        'coupons',
        'inventory_logs'
    ];
    
    for (const table of tablesToCheck) {
        try {
            console.log(`📋 Verificando: ${table}`);
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                if (error.code === 'PGRST106') {
                    console.log(`❌ No existe: ${table}`);
                } else {
                    console.log(`⚠️ Error consultando ${table}:`, error.message);
                }
            } else {
                console.log(`✅ Existe: ${table} ${data.length > 0 ? '(con datos)' : '(vacía)'}`);
                if (data[0]) {
                    console.log(`   Campos: ${Object.keys(data[0]).join(', ')}`);
                }
            }
        } catch (err) {
            console.log(`❌ Error: ${table} - ${err.message}`);
        }
        console.log('');
    }
    
    console.log('✅ Verificación completada');
}

if (require.main === module) {
    checkMissingTables();
}

module.exports = { checkMissingTables };