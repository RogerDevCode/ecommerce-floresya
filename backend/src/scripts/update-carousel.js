const { supabaseAdmin } = require('../services/supabaseAdmin');

async function updateCarouselWithRealImages() {
    try {
        console.log('🎠 Updating carousel with real product images...');
        
        // Get 5 real products with images
        const { data: products, error: productError } = await supabaseAdmin
            .from('products')
            .select('id, name, image_url, price')
            .not('image_url', 'is', null)
            .eq('active', true)
            .limit(5);
        
        if (productError) {
            console.error('❌ Error getting products:', productError);
            return;
        }
        
        if (!products || products.length === 0) {
            console.log('❌ No products with images found');
            return;
        }
        
        console.log(`✅ Found ${products.length} products with images`);
        
        // Update carousel items with real product data
        for (let i = 0; i < Math.min(4, products.length); i++) {
            const product = products[i];
            const { error: updateError } = await supabaseAdmin
                .from('carousel_images')
                .update({
                    title: product.name,
                    description: `Hermoso arreglo floral - $${product.price} USD`,
                    image_url: product.image_url,
                    link_url: `/pages/product-detail.html?id=${product.id}`,
                    display_order: i + 1,
                    active: true
                })
                .eq('id', i + 1);
            
            if (updateError) {
                console.error(`❌ Error updating carousel item ${i + 1}:`, updateError);
            } else {
                console.log(`✅ Updated carousel item ${i + 1} - ${product.name}`);
            }
        }
        
        // Add fifth item if we have it
        if (products.length >= 5) {
            const product = products[4];
            const { error: insertError } = await supabaseAdmin
                .from('carousel_images')
                .upsert({
                    id: 5,
                    title: product.name,
                    description: `Hermoso arreglo floral - $${product.price} USD`,
                    image_url: product.image_url,
                    link_url: `/pages/product-detail.html?id=${product.id}`,
                    display_order: 5,
                    active: true
                });
            
            if (!insertError) {
                console.log(`✅ Added carousel item 5 - ${product.name}`);
            }
        }
        
        console.log('🎠 Carousel updated successfully!');
        
    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

if (require.main === module) {
    updateCarouselWithRealImages().then(() => {
        console.log('✅ Script completed');
        process.exit(0);
    });
}

module.exports = { updateCarouselWithRealImages };