-- =====================================================
-- FloresYa: Migración para Ocasiones v1.0
-- Para ejecutar en Supabase SQL Editor
-- =====================================================

-- Paso 1: Crear tabla occasions
CREATE TABLE IF NOT EXISTS occasions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#28a745',
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Paso 2: Crear índices para occasions
CREATE INDEX IF NOT EXISTS idx_occasions_active ON occasions(active);
CREATE INDEX IF NOT EXISTS idx_occasions_sort_order ON occasions(sort_order);

-- Paso 3: Crear tabla product_occasions (relación many-to-many)
CREATE TABLE IF NOT EXISTS product_occasions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    occasion_id INTEGER NOT NULL REFERENCES occasions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, occasion_id)
);

-- Paso 4: Crear índices para product_occasions
CREATE INDEX IF NOT EXISTS idx_product_occasions_product ON product_occasions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_occasions_occasion ON product_occasions(occasion_id);

-- Paso 5: Insertar ocasiones predefinidas
INSERT INTO occasions (name, description, icon, color, sort_order) VALUES
('San Valentín', 'Arreglos románticos para el día del amor', 'bi-heart-fill', '#dc3545', 1),
('Día de la Madre', 'Flores especiales para celebrar a mamá', 'bi-person-heart', '#fd7e14', 2),
('Día del Padre', 'Arreglos únicos para papá', 'bi-person-check', '#0d6efd', 3),
('Cumpleaños', 'Flores alegres para celebrar la vida', 'bi-gift-fill', '#ffc107', 4),
('Aniversario', 'Arreglos románticos para celebrar el amor', 'bi-heart-arrow', '#e91e63', 5),
('Graduación', 'Flores para celebrar logros académicos', 'bi-mortarboard', '#6f42c1', 6),
('Bodas', 'Arreglos nupciales y decoración', 'bi-suit-heart', '#20c997', 7),
('Nuevo Bebé', 'Flores tiernas para recibir al bebé', 'bi-baby', '#fd7e14', 8),
('Recuperación', 'Arreglos para desear pronta mejoría', 'bi-bandaid', '#17a2b8', 9),
('Condolencias', 'Flores para expresar pésame', 'bi-flower3', '#6c757d', 10),
('Agradecimiento', 'Arreglos para expresar gratitud', 'bi-hand-thumbs-up', '#28a745', 11),
('Decoración Hogar', 'Flores para embellecer espacios', 'bi-house-heart', '#795548', 12),
('Corporativo', 'Arreglos para eventos empresariales', 'bi-building', '#607d8b', 13)
ON CONFLICT (name) DO NOTHING;

-- Paso 6: Migrar datos existentes del campo 'occasion' 
INSERT INTO product_occasions (product_id, occasion_id)
SELECT DISTINCT p.id, o.id
FROM products p
JOIN occasions o ON (
    (p.occasion = 'birthday' AND o.name = 'Cumpleaños') OR
    (p.occasion = 'anniversary' AND o.name = 'Aniversario') OR
    (p.occasion = 'valentines' AND o.name = 'San Valentín') OR
    (p.occasion = 'mothers_day' AND o.name = 'Día de la Madre') OR
    (p.occasion = 'wedding' AND o.name = 'Bodas') OR
    (p.occasion = 'sympathy' AND o.name = 'Condolencias') OR
    (p.occasion = 'graduation' AND o.name = 'Graduación')
)
WHERE p.occasion IS NOT NULL AND p.occasion != ''
ON CONFLICT (product_id, occasion_id) DO NOTHING;

-- Paso 7: Funciones útiles para la API
CREATE OR REPLACE FUNCTION get_product_occasions(p_product_id INTEGER)
RETURNS TABLE(id INTEGER, name VARCHAR, description TEXT, icon VARCHAR, color VARCHAR) 
LANGUAGE sql STABLE
AS $$
    SELECT o.id, o.name, o.description, o.icon, o.color
    FROM occasions o
    JOIN product_occasions po ON o.id = po.occasion_id
    WHERE po.product_id = p_product_id AND o.active = true
    ORDER BY o.sort_order, o.name;
$$;

CREATE OR REPLACE FUNCTION get_products_by_occasion(p_occasion_id INTEGER, p_limit INTEGER DEFAULT 50)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR,
    description TEXT,
    price DECIMAL,
    image_url VARCHAR,
    primary_image VARCHAR
) 
LANGUAGE sql STABLE
AS $$
    SELECT p.id, p.name, p.description, p.price, p.image_url, p.primary_image
    FROM products p
    JOIN product_occasions po ON p.id = po.product_id
    WHERE po.occasion_id = p_occasion_id 
    AND p.active = true
    ORDER BY p.featured DESC, p.created_at DESC
    LIMIT p_limit;
$$;

-- Paso 8: Vista para productos con ocasiones
CREATE OR REPLACE VIEW products_with_occasions AS
SELECT 
    p.*,
    c.name as category_name,
    c.description as category_description,
    COALESCE(
        ARRAY_AGG(
            DISTINCT jsonb_build_object(
                'id', o.id,
                'name', o.name,
                'icon', o.icon,
                'color', o.color
            ) ORDER BY o.sort_order
        ) FILTER (WHERE o.id IS NOT NULL),
        '{}'::jsonb[]
    ) as occasions
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_occasions po ON p.id = po.product_id
LEFT JOIN occasions o ON po.occasion_id = o.id AND o.active = true
GROUP BY p.id, c.id, c.name, c.description;

-- Verificación final
SELECT 
    'occasions' as table_name,
    COUNT(*) as records
FROM occasions
UNION ALL
SELECT 
    'product_occasions' as table_name,
    COUNT(*) as records
FROM product_occasions;