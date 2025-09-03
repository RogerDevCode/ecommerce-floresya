-- FloresYa: Mejoras para Categorías y Ocasiones
-- Basado en mejores prácticas de la industria florista (1800Flowers, Teleflora, FTD)
-- Fecha: 2025-09-02

-- =============================================================================
-- ANÁLISIS DE LA SITUACIÓN ACTUAL
-- =============================================================================
-- ✅ CATEGORIES: Bien implementada (tipo de producto: Rosas, Bouquets, Plantas)
-- ❌ OCCASIONS: No existe como tabla, solo campo 'occasion' en products
-- 🔄 PROBLEMA: Un producto puede tener múltiples ocasiones pero el diseño actual no lo permite

-- =============================================================================
-- SOLUCIÓN 1: Crear tabla de OCCASIONS
-- =============================================================================

-- Crear tabla de ocasiones si no existe
CREATE TABLE IF NOT EXISTS occasions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Para Bootstrap icons (bi-heart, bi-gift, etc.)
    color VARCHAR(7) DEFAULT '#28a745', -- Color hex para UI
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_occasions_active ON occasions(active);
CREATE INDEX IF NOT EXISTS idx_occasions_sort_order ON occasions(sort_order);

-- =============================================================================
-- SOLUCIÓN 2: Tabla de relación Many-to-Many
-- =============================================================================

-- Tabla intermedia para productos y ocasiones (relación N:N)
CREATE TABLE IF NOT EXISTS product_occasions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    occasion_id INTEGER NOT NULL REFERENCES occasions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, occasion_id)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_product_occasions_product ON product_occasions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_occasions_occasion ON product_occasions(occasion_id);

-- =============================================================================
-- DATOS INICIALES - OCASIONES BASADAS EN MEJORES PRÁCTICAS
-- =============================================================================

-- Insertar ocasiones comunes en la industria florista
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

-- =============================================================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- =============================================================================

-- Migrar las ocasiones actuales del campo 'occasion' a la nueva tabla
-- Primero, obtener todas las ocasiones únicas existentes
INSERT INTO occasions (name, description, icon, color, sort_order)
SELECT DISTINCT 
    CASE 
        WHEN occasion = 'birthday' THEN 'Cumpleaños'
        WHEN occasion = 'anniversary' THEN 'Aniversario'
        WHEN occasion = 'valentines' THEN 'San Valentín'
        WHEN occasion = 'mothers_day' THEN 'Día de la Madre'
        WHEN occasion = 'wedding' THEN 'Bodas'
        WHEN occasion = 'sympathy' THEN 'Condolencias'
        WHEN occasion = 'graduation' THEN 'Graduación'
        ELSE INITCAP(occasion)
    END as name,
    'Ocasión migrada desde datos existentes' as description,
    'bi-star' as icon,
    '#6c757d' as color,
    99 as sort_order
FROM products 
WHERE occasion IS NOT NULL AND occasion != ''
ON CONFLICT (name) DO NOTHING;

-- Crear las relaciones en product_occasions basadas en el campo actual 'occasion'
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
    (p.occasion = 'graduation' AND o.name = 'Graduación') OR
    (p.occasion IS NOT NULL AND o.name = INITCAP(p.occasion))
)
WHERE p.occasion IS NOT NULL AND p.occasion != ''
ON CONFLICT (product_id, occasion_id) DO NOTHING;

-- =============================================================================
-- FUNCIONES ÚTILES PARA LA API
-- =============================================================================

-- Función para obtener ocasiones de un producto
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

-- Función para obtener productos por ocasión
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

-- =============================================================================
-- VISTAS ÚTILES
-- =============================================================================

-- Vista para productos con sus categorías y ocasiones
CREATE OR REPLACE VIEW products_with_details AS
SELECT 
    p.*,
    c.name as category_name,
    c.description as category_description,
    ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'id', o.id,
            'name', o.name,
            'icon', o.icon,
            'color', o.color
        ) ORDER BY o.sort_order
    ) FILTER (WHERE o.id IS NOT NULL) as occasions
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_occasions po ON p.id = po.product_id
LEFT JOIN occasions o ON po.occasion_id = o.id AND o.active = true
GROUP BY p.id, c.id, c.name, c.description;

-- =============================================================================
-- COMENTARIOS SOBRE EL DISEÑO
-- =============================================================================

/*
JUSTIFICACIÓN DEL DISEÑO BASADO EN MEJORES PRÁCTICAS:

1. SEPARACIÓN DE CONCEPTOS:
   - CATEGORIES: "QUÉ es" (Rosas, Bouquets, Plantas) - Tipo de producto
   - OCCASIONS: "PARA QUÉ es" (Boda, Cumpleaños, San Valentín) - Propósito

2. FLEXIBILIDAD:
   - Un producto puede estar en múltiples ocasiones (ej: Rosas para San Valentín Y Aniversario)
   - Fácil agregar/quitar ocasiones sin afectar productos
   - Ordenamiento personalizable para promociones estacionales

3. UX MEJORADA:
   - Navegación dual: por tipo de producto O por ocasión
   - Filtros combinados (Rosas para San Valentín)
   - Promociones estacionales fáciles de implementar

4. BASADO EN LÍDERES DE LA INDUSTRIA:
   - 1800Flowers, Teleflora, FTD usan esta estructura
   - Permite marketing estacional efectivo
   - Facilita cross-selling y up-selling

IMPACTO EN EL PANEL ADMIN:
- Necesita interfaz para gestionar ocasiones
- Asignar múltiples ocasiones por producto  
- Vista de productos por ocasión para marketing
*/

-- =============================================================================
-- NOTAS PARA EL DESARROLLADOR
-- =============================================================================

/*
PRÓXIMOS PASOS:
1. Ejecutar este script en Supabase
2. Modificar API para usar product_occasions en lugar de campo 'occasion'
3. Actualizar panel admin para gestionar ocasiones
4. Actualizar frontend para mostrar ocasiones múltiples
5. Eventualmente deprecar campo 'occasion' en products (mantener por compatibilidad)

CONSULTAS EJEMPLO:
- Productos para San Valentín: SELECT * FROM get_products_by_occasion(1);
- Ocasiones de un producto: SELECT * FROM get_product_occasions(6);
- Vista completa: SELECT * FROM products_with_details WHERE active = true;
*/