-- 🌸 FloresYa - Fix Image URLs Migration
-- Update all product image URLs to use the correct Supabase project

-- Update all image URLs from old project to new project
UPDATE product_images
SET url = REPLACE(url, 'https://ywxjbzksaybmcxtsdoxa.supabase.co', 'https://dcbavpdlkcjdtjdkntde.supabase.co')
WHERE url LIKE 'https://ywxjbzksaybmcxtsdoxa.supabase.co%';

-- Verify the changes
SELECT
  COUNT(*) as total_images,
  COUNT(CASE WHEN url LIKE 'https://dcbavpdlkcjdtjdkntde.supabase.co%' THEN 1 END) as correct_urls,
  COUNT(CASE WHEN url LIKE 'https://ywxjbzksaybmcxtsdoxa.supabase.co%' THEN 1 END) as old_urls
FROM product_images;

-- Show a sample of updated URLs
SELECT id, product_id, size, LEFT(url, 100) as url_preview
FROM product_images
WHERE url LIKE 'https://dcbavpdlkcjdtjdkntde.supabase.co%'
LIMIT 5;