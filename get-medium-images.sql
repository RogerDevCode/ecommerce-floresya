-- 🌸 FloresYa - URLs de Imágenes Medium por Producto
-- Script para obtener el ID del producto y la URL de las imágenes tipo medium

SELECT
    p.id AS product_id,
    pi.url AS image_url
FROM products p
INNER JOIN product_images pi ON p.id = pi.product_id
WHERE pi.size = 'medium'
  AND p.active = true
ORDER BY p.id ASC, pi.image_index ASC;