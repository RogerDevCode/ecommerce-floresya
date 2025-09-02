-- Update primary_image column with existing image_url values
-- Execute this in Supabase SQL Editor

UPDATE products 
SET primary_image = image_url 
WHERE primary_image IS NULL AND image_url IS NOT NULL;

-- Verify the updates
SELECT id, name, image_url, primary_image 
FROM products 
WHERE primary_image IS NOT NULL
ORDER BY id;