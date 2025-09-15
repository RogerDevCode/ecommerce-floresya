-- 🌸 FloresYa - Consulta de Imágenes Medium por Producto
-- Este script muestra todos los productos con sus imágenes de tamaño medium

-- Consulta básica: Productos con imágenes medium
SELECT
    p.id as product_id,
    p.name as product_name,
    pi.image_index,
    pi.url as medium_image_url,
    pi.is_primary,
    pi.created_at as image_created_at
FROM products p
INNER JOIN product_images pi ON p.id = pi.product_id
WHERE pi.size = 'medium'
  AND p.active = true
ORDER BY p.id ASC, pi.image_index ASC;

-- Consulta agrupada: Contar imágenes medium por producto
SELECT
    p.id as product_id,
    p.name as product_name,
    COUNT(pi.id) as total_medium_images,
    STRING_AGG(pi.url, ', ' ORDER BY pi.image_index) as all_medium_urls
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.size = 'medium'
WHERE p.active = true
GROUP BY p.id, p.name
ORDER BY p.id ASC;

-- Consulta detallada: Productos activos con estado de imágenes medium
SELECT
    p.id as product_id,
    p.name as product_name,
    p.stock,
    p.featured,
    CASE
        WHEN COUNT(pi.id) > 0 THEN 'Tiene imágenes medium'
        ELSE 'Sin imágenes medium'
    END as medium_status,
    COUNT(pi.id) as medium_count,
    ARRAY_AGG(pi.url ORDER BY pi.image_index) as medium_urls
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.size = 'medium'
WHERE p.active = true
GROUP BY p.id, p.name, p.stock, p.featured
ORDER BY medium_count DESC, p.id ASC;

-- Consulta de productos SIN imágenes medium (para debug)
SELECT
    p.id as product_id,
    p.name as product_name,
    p.created_at
FROM products p
WHERE p.active = true
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.size = 'medium'
  )
ORDER BY p.id ASC;

-- Estadísticas generales
SELECT
    'Total productos activos' as metric,
    COUNT(*) as value
FROM products
WHERE active = true

UNION ALL

SELECT
    'Productos con imágenes medium' as metric,
    COUNT(DISTINCT p.id) as value
FROM products p
INNER JOIN product_images pi ON p.id = pi.product_id
WHERE p.active = true AND pi.size = 'medium'

UNION ALL

SELECT
    'Total imágenes medium' as metric,
    COUNT(*) as value
FROM product_images
WHERE size = 'medium'

UNION ALL

SELECT
    'Productos sin imágenes medium' as metric,
    COUNT(*) as value
FROM products p
WHERE p.active = true
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.product_id = p.id AND pi.size = 'medium'
  );