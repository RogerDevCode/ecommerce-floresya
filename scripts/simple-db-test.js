/**
 * Simple database test to verify connection and data
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simpleDbTest() {
  console.log('🔍 Simple database test...\n');

  try {
    // Test basic connection
    console.log('📡 Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('products')
      .select('id, name, active')
      .limit(3);

    if (connectionError) {
      console.error('❌ Connection error:', connectionError.message);
      return;
    }

    console.log('✅ Connection successful');
    console.log('Sample products:', JSON.stringify(connectionTest, null, 2));

    // Test carousel products query (similar to ProductService)
    console.log('\n🎠 Testing carousel products query...');
    const { data: carouselProducts, error: carouselError } = await supabase
      .from('products')
      .select('id, name, summary, price_usd, carousel_order')
      .not('carousel_order', 'is', null)
      .eq('active', true)
      .order('carousel_order', { ascending: true });

    if (carouselError) {
      console.error('❌ Carousel query error:', carouselError.message);
      return;
    }

    console.log('✅ Carousel query successful');
    console.log(`Found ${carouselProducts?.length || 0} carousel products`);
    if (carouselProducts && carouselProducts.length > 0) {
      console.log('Carousel products:', JSON.stringify(carouselProducts, null, 2));
    }

    // Test products with images query (similar to ProductService)
    console.log('\n🖼️ Testing products with images query...');
    const { data: productsWithImages, error: imagesError } = await supabase
      .from('products')
      .select(`
        *,
        product_images(
          id,
          image_index,
          size,
          url,
          file_hash,
          mime_type,
          is_primary
        )
      `)
      .eq('active', true)
      .limit(2);

    if (imagesError) {
      console.error('❌ Products with images query error:', imagesError.message);
      return;
    }

    console.log('✅ Products with images query successful');
    console.log(`Found ${productsWithImages?.length || 0} products with images`);
    if (productsWithImages && productsWithImages.length > 0) {
      console.log('Sample product with images:', JSON.stringify(productsWithImages[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

simpleDbTest();