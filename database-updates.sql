-- FloresYa Database Updates Script
-- Execute these commands in Supabase SQL Editor

-- 1. Add primary_image column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image VARCHAR(255);

-- 2. Update existing products to set primary_image from image_url where primary_image is null
UPDATE products 
SET primary_image = image_url 
WHERE primary_image IS NULL AND image_url IS NOT NULL;

-- 3. Check if carousel_images table exists and has proper structure
-- (This should already exist based on previous migrations)

-- 4. Update carousel_images with real product data (optional - can be done via admin panel)
-- First, let's ensure we have some active carousel items
UPDATE carousel_images SET active = true WHERE id IN (1, 2, 3, 4, 5);

-- 5. Verify the updates
-- SELECT name, image_url, primary_image, active FROM products LIMIT 10;
-- SELECT * FROM carousel_images WHERE active = true ORDER BY display_order;