/**
 * Test script for Occasions API endpoints
 * Run this after applying the SQL migration
 */

const API_BASE = 'http://localhost:3000/api';

async function testOccasionsAPI() {
  console.log('🌸 Testing FloresYa Occasions API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.success ? 'PASSED' : 'FAILED');
    console.log('   Message:', healthData.message);
    console.log();

    // Test 2: Get all occasions
    console.log('2. Testing GET /api/occasions...');
    const occasionsResponse = await fetch(`${API_BASE}/occasions`);

    if (occasionsResponse.ok) {
      const occasionsData = await occasionsResponse.json();
      console.log('✅ Get occasions: PASSED');
      console.log(`   Found ${occasionsData.data?.occasions?.length || 0} occasions`);

      if (occasionsData.data?.occasions?.length > 0) {
        console.log('   Sample occasion:', {
          id: occasionsData.data.occasions[0].id,
          name: occasionsData.data.occasions[0].name,
          slug: occasionsData.data.occasions[0].slug
        });
      }
    } else {
      console.log('❌ Get occasions: FAILED');
      console.log('   Status:', occasionsResponse.status);
      const errorData = await occasionsResponse.text();
      console.log('   Error:', errorData);
    }
    console.log();

    // Test 3: Get specific occasion (if any exist)
    const occasionsResponse2 = await fetch(`${API_BASE}/occasions`);
    if (occasionsResponse2.ok) {
      const occasionsData2 = await occasionsResponse2.json();
      if (occasionsData2.data?.occasions?.length > 0) {
        const firstOccasion = occasionsData2.data.occasions[0];

        console.log('3. Testing GET /api/occasions/:id...');
        const singleResponse = await fetch(`${API_BASE}/occasions/${firstOccasion.id}`);
        if (singleResponse.ok) {
          const singleData = await singleResponse.json();
          console.log('✅ Get single occasion: PASSED');
          console.log('   Occasion:', singleData.data?.occasion?.name);
        } else {
          console.log('❌ Get single occasion: FAILED');
        }
        console.log();

        // Test 4: Get by slug (if slug exists)
        if (firstOccasion.slug) {
          console.log('4. Testing GET /api/occasions/slug/:slug...');
          const slugResponse = await fetch(`${API_BASE}/occasions/slug/${firstOccasion.slug}`);
          if (slugResponse.ok) {
            const slugData = await slugResponse.json();
            console.log('✅ Get occasion by slug: PASSED');
            console.log('   Slug:', firstOccasion.slug);
          } else {
            console.log('❌ Get occasion by slug: FAILED');
            console.log('   Status:', slugResponse.status);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🌸 Occasions API test completed.');
}

// Run the test
testOccasionsAPI();