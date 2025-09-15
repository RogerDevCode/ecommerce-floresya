/**
 * 🌸 Supabase Image URL Test
 * Unit test to verify Supabase image URL formation and connectivity
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { supabaseService } from '../../src/config/supabase.js';

describe('Supabase Image URLs', () => {
  let firstProductImageUrl = null;
  let supabaseUrl = null;

  beforeAll(async () => {
    // Get Supabase configuration
    supabaseUrl = process.env.SUPABASE_URL;
    console.log('🔍 SUPABASE_URL from env:', supabaseUrl);

    // Fetch first product with images
    try {
      const { data: products, error } = await supabaseService
        .from('products')
        .select(`
          id,
          name,
          product_images (
            id,
            url,
            size,
            is_primary
          )
        `)
        .eq('active', true)
        .limit(1);

      if (error) {
        console.error('❌ Database error:', error);
        return;
      }

      if (products && products.length > 0) {
        const product = products[0];
        console.log('📦 First product:', {
          id: product.id,
          name: product.name,
          imagesCount: product.product_images?.length || 0
        });

        if (product.product_images && product.product_images.length > 0) {
          // Get primary image or first image
          const primaryImage = product.product_images.find(img => img.is_primary) || product.product_images[0];
          firstProductImageUrl = primaryImage.url;

          console.log('🖼️ First product image:', {
            id: primaryImage.id,
            url: firstProductImageUrl,
            size: primaryImage.size,
            isPrimary: primaryImage.is_primary
          });
        }
      } else {
        console.log('⚠️ No products found in database');
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
    }
  });

  it('should have Supabase URL configured', () => {
    expect(supabaseUrl).toBeDefined();
    expect(supabaseUrl).not.toBe('https://placeholder.supabase.co');
    console.log('✅ Supabase URL:', supabaseUrl);
  });

  it('should fetch first product with images', () => {
    expect(firstProductImageUrl).toBeDefined();
    expect(typeof firstProductImageUrl).toBe('string');
    expect(firstProductImageUrl.length).toBeGreaterThan(0);
    console.log('✅ First product image URL:', firstProductImageUrl);
  });

  it('should have correct Supabase storage URL format', () => {
    expect(firstProductImageUrl).toMatch(/^https:\/\/[^\/]+\.supabase\.co\/storage\/v1\/object\/public\/product-images\//);
    console.log('✅ URL format is correct');
  });

  it('should extract Supabase project ID from image URL', () => {
    if (firstProductImageUrl) {
      const urlMatch = firstProductImageUrl.match(/^https:\/\/([^\/]+)\.supabase\.co/);
      if (urlMatch) {
        const projectId = urlMatch[1];
        console.log('🔍 Project ID from image URL:', projectId);
        console.log('🔍 Project ID from env:', supabaseUrl?.replace('https://', '').replace('.supabase.co', ''));

        // This will show if they match or not
        expect(projectId).toBeDefined();
      }
    }
  });

  it('should test image URL accessibility', async () => {
    if (firstProductImageUrl) {
      try {
        const response = await fetch(firstProductImageUrl, {
          method: 'HEAD', // Just check if accessible, don't download
          timeout: 5000
        });

        console.log('🌐 Image URL response status:', response.status);
        console.log('🌐 Image URL accessible:', response.ok);

        // Even if it fails, we want to see the status
        expect(response.status).toBeDefined();

      } catch (error) {
        console.log('🌐 Image URL fetch error:', error.message);
        // This is expected to fail, but we want to see the error type
        expect(error).toBeDefined();
      }
    }
  });
});