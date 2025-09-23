/**
 * Script to check current database status and data
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

async function checkDatabaseStatus() {
  console.log('🔍 Checking database status...\n');

  try {
    // Check products table
    console.log('📦 Checking products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError.message);
    } else {
      console.log(`✅ Found ${products?.length || 0} products`);
      if (products && products.length > 0) {
        console.log('Sample products:');
        products.forEach(p => {
          console.log(`  - ID: ${p.id}, Name: ${p.name}, Active: ${p.active}, Featured: ${p.featured}, Carousel Order: ${p.carousel_order}`);
        });
      }
    }

    // Check active products
    console.log('\n🎯 Checking active products...');
    const { data: activeProducts, error: activeError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .limit(5);

    if (activeError) {
      console.error('❌ Error fetching active products:', activeError.message);
    } else {
      console.log(`✅ Found ${activeProducts?.length || 0} active products`);
      if (activeProducts && activeProducts.length > 0) {
        console.log('Active products:');
        activeProducts.forEach(p => {
          console.log(`  - ID: ${p.id}, Name: ${p.name}, Featured: ${p.featured}, Carousel Order: ${p.carousel_order}`);
        });
      }
    }

    // Check carousel products
    console.log('\n🎠 Checking carousel products...');
    const { data: carouselProducts, error: carouselError } = await supabase
      .from('products')
      .select('*')
      .not('carousel_order', 'is', null)
      .eq('active', true)
      .order('carousel_order', { ascending: true });

    if (carouselError) {
      console.error('❌ Error fetching carousel products:', carouselError.message);
    } else {
      console.log(`✅ Found ${carouselProducts?.length || 0} carousel products`);
      if (carouselProducts && carouselProducts.length > 0) {
        console.log('Carousel products:');
        carouselProducts.forEach(p => {
          console.log(`  - ID: ${p.id}, Name: ${p.name}, Carousel Order: ${p.carousel_order}`);
        });
      }
    }

    // Check featured products
    console.log('\n⭐ Checking featured products...');
    const { data: featuredProducts, error: featuredError } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .eq('active', true)
      .limit(5);

    if (featuredError) {
      console.error('❌ Error fetching featured products:', featuredError.message);
    } else {
      console.log(`✅ Found ${featuredProducts?.length || 0} featured products`);
      if (featuredProducts && featuredProducts.length > 0) {
        console.log('Featured products:');
        featuredProducts.forEach(p => {
          console.log(`  - ID: ${p.id}, Name: ${p.name}`);
        });
      }
    }

    // Check product images
    console.log('\n🖼️ Checking product images...');
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .limit(5);

    if (imagesError) {
      console.error('❌ Error fetching product images:', imagesError.message);
    } else {
      console.log(`✅ Found ${images?.length || 0} product images`);
      if (images && images.length > 0) {
        console.log('Sample images:');
        images.forEach(img => {
          console.log(`  - Product ID: ${img.product_id}, Size: ${img.size}, Primary: ${img.is_primary}, URL: ${img.url}`);
        });
      }
    }

    // Check occasions
    console.log('\n🎉 Checking occasions...');
    const { data: occasions, error: occasionsError } = await supabase
      .from('occasions')
      .select('*')
      .limit(5);

    if (occasionsError) {
      console.error('❌ Error fetching occasions:', occasionsError.message);
    } else {
      console.log(`✅ Found ${occasions?.length || 0} occasions`);
      if (occasions && occasions.length > 0) {
        console.log('Sample occasions:');
        occasions.forEach(o => {
          console.log(`  - ID: ${o.id}, Name: ${o.name}, Type: ${o.type}, Active: ${o.active}`);
        });
      }
    }

    // Check users
    console.log('\n👥 Checking users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`✅ Found ${users?.length || 0} users`);
      if (users && users.length > 0) {
        console.log('Sample users:');
        users.forEach(u => {
          console.log(`  - ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Active: ${u.active}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
}

checkDatabaseStatus();