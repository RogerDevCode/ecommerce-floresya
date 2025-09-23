-- =============================================================================
-- 🌸 FLORESYA TEST DATA INSERTION SCRIPT
-- =============================================================================
-- Inserta datos de prueba que coincidan con las expectativas de los tests
-- Ejecutar este script en la base de datos de pruebas
-- =============================================================================

-- Insertar productos de prueba activos
INSERT INTO products (
    name,
    description,
    summary,
    price_usd,
    price_ves,
    stock,
    sku,
    active,
    featured,
    carousel_order,
    created_at,
    updated_at
) VALUES
(
    'Ramo de Rosas Rojas',
    'Hermoso ramo de 12 rosas rojas frescas, perfectas para expresar amor y pasión. Incluye follaje decorativo y una tarjeta personalizada.',
    'Ramo de 12 rosas rojas con follaje',
    25.99,
    950000.00,
    50,
    'ROSAS-ROJAS-12',
    true,
    true,
    1,
    NOW(),
    NOW()
),
(
    'Arreglo Elegante Mixto',
    'Elegante arreglo floral mixto con rosas, lirios y margaritas en tonos pasteles. Ideal para cualquier ocasión especial.',
    'Arreglo mixto con rosas y lirios',
    45.50,
    1650000.00,
    30,
    'ARREGLO-MIXTO-ELEG',
    true,
    true,
    2,
    NOW(),
    NOW()
),
(
    'Bouquet de Cumpleaños',
    'Colorido bouquet especialmente diseñado para cumpleaños, con rosas, gerberas y globos. ¡Celebra con flores!',
    'Bouquet especial para cumpleaños',
    35.75,
    1300000.00,
    25,
    'BOUQUET-CUMPLE',
    true,
    false,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (sku) DO NOTHING;

-- Insertar imágenes de productos de prueba
INSERT INTO product_images (
    product_id,
    url,
    size,
    image_index,
    is_primary,
    mime_type,
    file_hash,
    created_at,
    updated_at
) VALUES
-- Imágenes para Ramo de Rosas Rojas (ID 1)
(1, '/images/products/ramo-rosas-rojas.jpg', 'thumb', 0, true, 'image/jpeg', 'hash1', NOW(), NOW()),
(1, '/images/products/ramo-rosas-rojas-2.jpg', 'small', 1, false, 'image/jpeg', 'hash2', NOW(), NOW()),
(1, '/images/products/ramo-rosas-rojas-3.jpg', 'medium', 2, false, 'image/jpeg', 'hash3', NOW(), NOW()),

-- Imágenes para Arreglo Elegante Mixto (ID 2)
(2, '/images/products/arreglo-elegante.jpg', 'thumb', 0, true, 'image/jpeg', 'hash4', NOW(), NOW()),
(2, '/images/products/arreglo-elegante-2.jpg', 'small', 1, false, 'image/jpeg', 'hash5', NOW(), NOW()),
(2, '/images/products/arreglo-elegante-3.jpg', 'medium', 2, false, 'image/jpeg', 'hash6', NOW(), NOW()),

-- Imágenes para Bouquet de Cumpleaños (ID 3)
(3, '/images/products/bouquet-mixto.jpg', 'thumb', 0, true, 'image/jpeg', 'hash7', NOW(), NOW()),
(3, '/images/products/bouquet-mixto-2.jpg', 'small', 1, false, 'image/jpeg', 'hash8', NOW(), NOW()),
(3, '/images/products/bouquet-mixto-3.jpg', 'medium', 2, false, 'image/jpeg', 'hash9', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insertar ocasiones de prueba con tipos que coincidan con los tests
INSERT INTO occasions (
    name,
    type,
    description,
    slug,
    is_active,
    display_order,
    created_at,
    updated_at
) VALUES
(
    'Cumpleaños',
    'birthday',
    'Celebración de cumpleaños con flores',
    'cumpleanos',
    true,
    1,
    NOW(),
    NOW()
),
(
    'Sin ocasión específica',
    'general',
    'Para cualquier momento del año',
    'general',
    true,
    2,
    NOW(),
    NOW()
),
(
    'Aniversario',
    'anniversary',
    'Conmemoración de aniversarios',
    'aniversario',
    true,
    3,
    NOW(),
    NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Asociar productos con ocasiones
INSERT INTO product_occasions (
    product_id,
    occasion_id,
    created_at,
    updated_at
)
SELECT
    p.id,
    o.id,
    NOW(),
    NOW()
FROM products p
CROSS JOIN occasions o
WHERE p.sku = 'BOUQUET-CUMPLE' AND o.type = 'birthday'
ON CONFLICT DO NOTHING;

-- Insertar usuarios de prueba
INSERT INTO users (
    email,
    password_hash,
    full_name,
    role,
    is_active,
    email_verified,
    phone,
    created_at,
    updated_at
) VALUES
(
    'test@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu',
    'Usuario de Prueba',
    'user',
    true,
    true,
    '+1234567890',
    NOW(),
    NOW()
),
(
    'admin@test.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu',
    'Administrador de Prueba',
    'admin',
    true,
    true,
    '+1234567891',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verificar que los datos se insertaron correctamente
SELECT
    'Products inserted: ' || COUNT(*) as products_count
FROM products
WHERE active = true;

SELECT
    'Images inserted: ' || COUNT(*) as images_count
FROM product_images;

SELECT
    'Occasions inserted: ' || COUNT(*) as occasions_count
FROM occasions
WHERE is_active = true;

SELECT
    'Users inserted: ' || COUNT(*) as users_count
FROM users
WHERE is_active = true;