-- 🌸 FloresYa - Optimización de Base de Datos para Filtros de Ocasiones
-- Script para crear la tabla product_occasions y optimizar consultas

-- Verificar si existe la tabla product_occasions
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_occasions') THEN
        -- Crear tabla de relaciones N:N entre productos y ocasiones
        CREATE TABLE public.product_occasions (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
            occasion_id INTEGER NOT NULL REFERENCES public.occasions(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

            -- Evitar duplicados
            UNIQUE(product_id, occasion_id)
        );

        RAISE NOTICE 'Tabla product_occasions creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla product_occasions ya existe';
    END IF;
END
$$;

-- Crear índices optimizados para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_product_occasions_product_id
    ON public.product_occasions (product_id);

CREATE INDEX IF NOT EXISTS idx_product_occasions_occasion_id
    ON public.product_occasions (occasion_id);

-- Índice compuesto para consultas que filtran por ambos
CREATE INDEX IF NOT EXISTS idx_product_occasions_composite
    ON public.product_occasions (occasion_id, product_id);

-- Índice en products.active para optimizar filtros
CREATE INDEX IF NOT EXISTS idx_products_active
    ON public.products (active) WHERE active = true;

-- Índice compuesto para ordenación frecuente
CREATE INDEX IF NOT EXISTS idx_products_active_created_at
    ON public.products (active, created_at DESC) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_products_active_price
    ON public.products (active, price_usd) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_products_active_name
    ON public.products (active, name) WHERE active = true;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para product_occasions
DROP TRIGGER IF EXISTS update_product_occasions_updated_at ON public.product_occasions;
CREATE TRIGGER update_product_occasions_updated_at
    BEFORE UPDATE ON public.product_occasions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar relación por defecto para productos existentes sin ocasión
INSERT INTO public.product_occasions (product_id, occasion_id)
SELECT p.id, 1
FROM public.products p
WHERE p.active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.product_occasions po
    WHERE po.product_id = p.id
  )
ON CONFLICT (product_id, occasion_id) DO NOTHING;

-- Verificar datos insertados
SELECT
    'Productos sin ocasión asignada' as descripcion,
    COUNT(*) as cantidad
FROM public.products p
WHERE p.active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.product_occasions po
    WHERE po.product_id = p.id
  )

UNION ALL

SELECT
    'Total de relaciones producto-ocasión' as descripcion,
    COUNT(*) as cantidad
FROM public.product_occasions

UNION ALL

SELECT
    'Productos con ocasión "Sin ocasión específica"' as descripcion,
    COUNT(*) as cantidad
FROM public.product_occasions po
JOIN public.occasions o ON o.id = po.occasion_id
WHERE o.slug = 'sin-ocasion-especifica';

-- Vista optimizada para consultas frecuentes (opcional)
CREATE OR REPLACE VIEW public.products_with_occasions AS
SELECT
    p.*,
    COALESCE(
        array_agg(
            json_build_object(
                'id', o.id,
                'name', o.name,
                'slug', o.slug,
                'type', o.type
            ) ORDER BY o.display_order
        ) FILTER (WHERE o.id IS NOT NULL),
        '{}'::json[]
    ) as occasions
FROM public.products p
LEFT JOIN public.product_occasions po ON p.id = po.product_id
LEFT JOIN public.occasions o ON po.occasion_id = o.id
WHERE p.active = true
GROUP BY p.id, p.name, p.summary, p.description, p.price_usd, p.price_ves,
         p.stock, p.sku, p.active, p.featured, p.carousel_order,
         p.created_at, p.updated_at;

-- Estadísticas finales
SELECT
    'Índices creados para product_occasions' as info,
    COUNT(*) as cantidad
FROM pg_indexes
WHERE tablename = 'product_occasions'
  AND schemaname = 'public';

RAISE NOTICE '✅ Optimización de base de datos completada';
RAISE NOTICE '🔍 Índices creados para mejorar performance de filtros';
RAISE NOTICE '🔗 Relaciones N:N configuradas correctamente';