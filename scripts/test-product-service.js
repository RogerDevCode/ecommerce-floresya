/**
 * Script to test ProductService directly
 */
import dotenv from 'dotenv';

import { ProductService } from '../src/services/ProductService.ts';

// Load environment variables
dotenv.config();

async function testProductService() {
  console.log('🧪 Testing ProductService directly...\n');

  const productService = new ProductService();

  try {
    // Test getProducts
    console.log('📦 Testing getProducts()...');
    const productsResponse = await productService.getProducts();
    console.log('✅ getProducts() response:', JSON.stringify(productsResponse, null, 2));

    // Test getCarouselProducts
    console.log('\n🎠 Testing getCarouselProducts()...');
    const carouselResponse = await productService.getCarouselProducts();
    console.log('✅ getCarouselProducts() response:', JSON.stringify(carouselResponse, null, 2));

    // Test getFeaturedProducts
    console.log('\n⭐ Testing getFeaturedProducts()...');
    const featuredProducts = await productService.getFeaturedProducts();
    console.log('✅ getFeaturedProducts() response:', JSON.stringify(featuredProducts, null, 2));

    // Test getProductById
    console.log('\n🔍 Testing getProductById(1)...');
    const product = await productService.getProductById(1);
    console.log('✅ getProductById(1) response:', JSON.stringify(product, null, 2));

  } catch (error) {
    console.error('❌ ProductService test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

testProductService();