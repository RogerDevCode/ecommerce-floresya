#!/usr/bin/env node

/**
 * 🔍 Supabase Storage Verification Script
 * Verifies that product-images bucket has all 4 variations per product
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function verifyStorageStructure() {
  console.log('🔍 Verifying Supabase Storage structure for product-images bucket...');

  const sizes = ['large', 'medium', 'small', 'thumb'];
  const productImageVariations = {};

  for (const size of sizes) {
    try {
      console.log(`📂 Checking ${size} directory...`);

      const { data, error } = await supabase
        .storage
        .from('product-images')
        .list(size, { limit: 1000 });

      if (error) {
        console.error(`❌ Error accessing ${size} directory:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} files in ${size} directory`);

        data.forEach(file => {
          // Extract product ID from filename pattern: product_X_Y_hash.webp
          const match = file.name.match(/^product_(\d+)_/);
          if (match) {
            const productId = match[1];

            if (!productImageVariations[productId]) {
              productImageVariations[productId] = {
                large: 0,
                medium: 0,
                small: 0,
                thumb: 0
              };
            }

            productImageVariations[productId][size]++;
          }
        });
      } else {
        console.log(`⚠️ No files found in ${size} directory`);
      }
    } catch (error) {
      console.error(`❌ Error listing ${size} directory:`, error.message);
    }
  }

  // Analyze results
  console.log('\n📊 Analysis Results:');
  console.log('='.repeat(50));

  const productIds = Object.keys(productImageVariations);
  console.log(`📈 Total products with images: ${productIds.length}`);

  let completeProducts = 0;
  let incompleteProducts = [];

  productIds.forEach(productId => {
    const variations = productImageVariations[productId];
    const hasAllSizes = variations.large > 0 && variations.medium > 0 &&
                       variations.small > 0 && variations.thumb > 0;

    if (hasAllSizes) {
      completeProducts++;
    } else {
      incompleteProducts.push({
        productId,
        variations,
        missing: Object.keys(variations).filter(size => variations[size] === 0)
      });
    }

    console.log(`Product ${productId}: L:${variations.large} M:${variations.medium} S:${variations.small} T:${variations.thumb} ${hasAllSizes ? '✅' : '❌'}`);
  });

  console.log('\n📋 Summary:');
  console.log(`✅ Complete products (4 sizes): ${completeProducts}`);
  console.log(`❌ Incomplete products: ${incompleteProducts.length}`);

  if (incompleteProducts.length > 0) {
    console.log('\n🚨 Products missing image variations:');
    incompleteProducts.forEach(product => {
      console.log(`  Product ${product.productId}: Missing ${product.missing.join(', ')}`);
    });
    return false;
  }

  console.log('\n🎉 All products have complete image variations!');
  return true;
}

verifyStorageStructure()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Verification failed:', error.message);
    process.exit(1);
  });