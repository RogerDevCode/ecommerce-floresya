const { supabaseAdmin } = require('../services/supabaseAdmin');

async function addPrimaryImageColumn() {
    try {
        console.log('🔧 Adding primary_image column to products table...');
    
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('id, image_url')
            .limit(1);
    
        if (error) {
            console.error('❌ Error accessing products table:', error);
            return;
        }

        console.log('✅ Successfully connected to Supabase');
        console.log('📝 Manual SQL command needed:');
        console.log('   In Supabase Dashboard -> SQL Editor, run:');
        console.log('   ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image VARCHAR(255);');
        console.log('   UPDATE products SET primary_image = image_url WHERE primary_image IS NULL;');
    
        console.log('\n📊 Current products count:', data?.length);
    
    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

if (require.main === module) {
    addPrimaryImageColumn().then(() => {
        console.log('✅ Script completed');
        process.exit(0);
    });
}

module.exports = { addPrimaryImageColumn };