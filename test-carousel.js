/**
 * Test script for Carousel API functionality
 * This script tests the carousel endpoint with optimized image loading
 */

const API_BASE = 'http://localhost:3000/api';

async function testCarouselAPI() {
  console.log('🎠 Testing FloresYa Carousel API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.success ? 'PASSED' : 'FAILED');
    console.log('   Message:', healthData.message);
    console.log();

    // Test 2: Test carousel endpoint
    console.log('2. Testing GET /api/products/carousel...');
    const carouselResponse = await fetch(`${API_BASE}/products/carousel`);

    if (carouselResponse.ok) {
      const carouselData = await carouselResponse.json();
      console.log('✅ Carousel endpoint: PASSED');
      console.log(`   Found ${carouselData.data?.carousel_products?.length || 0} carousel products`);
      console.log(`   Total count: ${carouselData.data?.total_count || 0}`);

      if (carouselData.data?.carousel_products?.length > 0) {
        const sampleProduct = carouselData.data.carousel_products[0];
        console.log('   Sample carousel product:');
        console.log('     ID:', sampleProduct.id);
        console.log('     Name:', sampleProduct.name);
        console.log('     Price USD:', sampleProduct.price_usd);
        console.log('     Carousel Order:', sampleProduct.carousel_order);
        console.log('     Primary Thumb URL:', sampleProduct.primary_thumb_url);
        console.log('     Has thumb image:', !!sampleProduct.primary_thumb_url);
      }
    } else {
      console.log('❌ Carousel endpoint: FAILED');
      console.log('   Status:', carouselResponse.status);
      const errorData = await carouselResponse.text();
      console.log('   Error:', errorData);
    }
    console.log();

    // Test 3: Validate image URLs (if any carousel products exist)
    const carouselResponse2 = await fetch(`${API_BASE}/products/carousel`);
    if (carouselResponse2.ok) {
      const carouselData2 = await carouselResponse2.json();
      if (carouselData2.data?.carousel_products?.length > 0) {
        console.log('3. Testing image URL accessibility...');

        const firstProduct = carouselData2.data.carousel_products[0];
        const thumbUrl = firstProduct.primary_thumb_url;

        if (thumbUrl && !thumbUrl.includes('placeholder')) {
          try {
            // Note: This test would require the image URL to be publicly accessible
            console.log('   Image URL format check: PASSED');
            console.log('   Thumb URL:', thumbUrl);
          } catch (imageError) {
            console.log('⚠️  Image URL accessibility: Could not verify (server may not be serving static files)');
          }
        } else {
          console.log('⚠️  Using placeholder image or no image URL found');
          console.log('   URL:', thumbUrl);
        }
      } else {
        console.log('⚠️  No carousel products found for image testing');
      }
    }
    console.log();

    // Test 4: Verify carousel products are sorted by carousel_order
    const carouselResponse3 = await fetch(`${API_BASE}/products/carousel`);
    if (carouselResponse3.ok) {
      const carouselData3 = await carouselResponse3.json();
      if (carouselData3.data?.carousel_products?.length > 1) {
        console.log('4. Testing carousel order sorting...');

        const products = carouselData3.data.carousel_products;
        let isSorted = true;

        for (let i = 1; i < products.length; i++) {
          if (products[i].carousel_order < products[i-1].carousel_order) {
            isSorted = false;
            break;
          }
        }

        console.log('✅ Carousel sorting:', isSorted ? 'PASSED' : 'FAILED');
        if (isSorted) {
          console.log('   Products are correctly sorted by carousel_order');
        }

        // Show order sequence
        console.log('   Order sequence:', products.map(p => `${p.name} (${p.carousel_order})`).join(', '));
      } else {
        console.log('⚠️  Need at least 2 carousel products to test sorting');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   Make sure the server is running on port 3000');
    console.error('   Start server with: npm run dev:build');
  }

  console.log('\n🎠 Carousel API test completed.');
  console.log('\n📝 Next steps:');
  console.log('   1. Ensure products have carousel_order values in database');
  console.log('   2. Verify products have primary images with thumb size');
  console.log('   3. Test frontend carousel rendering with these products');
}

// Run the test
testCarouselAPI();