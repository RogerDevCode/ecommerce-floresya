-- FloresYa E-commerce - LIMPIEZA SOLO DE DATOS
-- Script para eliminar todos los datos manteniendo la estructura de tablas
-- ⚠️  ESTE SCRIPT SOLO ELIMINA DATOS, NO LA ESTRUCTURA

-- ============================================================================
-- ELIMINAR DATOS EN ORDEN SEGURO (RESPETANDO INTEGRIDAD REFERENCIAL)
-- ============================================================================

-- Mostrar información inicial
DO $$
BEGIN
    RAISE NOTICE '🧹 Iniciando limpieza de datos de FloresYa...';
    RAISE NOTICE '⚠️  Se eliminarán TODOS los datos pero se mantendrá la estructura';
END $$;

-- Paso 1: Eliminar datos de tablas dependientes (en orden inverso de dependencias)
DO $$
DECLARE 
    row_count INTEGER;
BEGIN
    -- 1. product_occasions (depende de products + occasions)
    DELETE FROM product_occasions;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '🗑️  product_occasions: % registros eliminados', row_count;

    -- 2. payments (depende de orders + payment_methods + users)  
    DELETE FROM payments;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '🗑️  payments: % registros eliminados', row_count;

    -- 3. order_items (depende de orders + products)
    DELETE FROM order_items;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '🗑️  order_items: % registros eliminados', row_count;

    -- 4. orders (depende de users)
    DELETE FROM orders;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '🗑️  orders: % registros eliminados', row_count;

    -- 5. Tablas base (sin dependencias - pueden eliminarse en cualquier orden)
    
    -- carousel_images
    DELETE FROM carousel_images;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '🗑️  carousel_images: % registros eliminados', row_count;

    -- settings
    DELETE FROM settings;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '🗑️  settings: % registros eliminados', row_count;

    -- payment_methods
    DELETE FROM payment_methods;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '🗑️  payment_methods: % registros eliminados', row_count;

    -- occasions
    DELETE FROM occasions;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '🗑️  occasions: % registros eliminados', row_count;

    -- products
    DELETE FROM products;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '🗑️  products: % registros eliminados', row_count;

    -- users (eliminar al final por si hay referencias)
    DELETE FROM users;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '🗑️  users: % registros eliminados', row_count;
END $$;

-- ============================================================================
-- RESETEAR SECUENCIAS DE AUTO-INCREMENT
-- ============================================================================

DO $$
BEGIN
    -- Resetear todas las secuencias SERIAL a 1
    ALTER SEQUENCE users_id_seq RESTART WITH 1;
    ALTER SEQUENCE products_id_seq RESTART WITH 1;
    ALTER SEQUENCE occasions_id_seq RESTART WITH 1;
    ALTER SEQUENCE payment_methods_id_seq RESTART WITH 1;
    ALTER SEQUENCE carousel_images_id_seq RESTART WITH 1;
    ALTER SEQUENCE settings_id_seq RESTART WITH 1;
    ALTER SEQUENCE orders_id_seq RESTART WITH 1;
    ALTER SEQUENCE order_items_id_seq RESTART WITH 1;
    ALTER SEQUENCE payments_id_seq RESTART WITH 1;
    ALTER SEQUENCE product_occasions_id_seq RESTART WITH 1;
    
    RAISE NOTICE '🔄 Todas las secuencias han sido reiniciadas a 1';
END $$;

-- ============================================================================
-- VERIFICACIÓN DE LIMPIEZA
-- ============================================================================

DO $$
DECLARE 
    current_table TEXT;
    row_count INTEGER;
    total_rows INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 Verificando que todas las tablas estén vacías...';
    
    -- Verificar cada tabla
    FOR current_table IN 
        SELECT unnest(ARRAY[
            'users', 'products', 'occasions', 'payment_methods', 'carousel_images', 
            'settings', 'orders', 'order_items', 'payments', 'product_occasions'
        ])
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', current_table) INTO row_count;
        total_rows := total_rows + row_count;
        
        IF row_count > 0 THEN
            RAISE NOTICE '⚠️  %: % registros restantes', current_table, row_count;
        ELSE
            RAISE NOTICE '✅ %: vacía', current_table;
        END IF;
    END LOOP;
    
    IF total_rows = 0 THEN
        RAISE NOTICE '🎉 ¡Limpieza completada! Todas las tablas están vacías';
        RAISE NOTICE '🚀 Listo para insertar datos nuevos con supabase_seed_data.sql';
    ELSE
        RAISE NOTICE '❌ Quedan % registros en total. Revisar integridad referencial', total_rows;
    END IF;
END $$;

-- ============================================================================
-- MOSTRAR ESTRUCTURA ACTUAL DE TABLAS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📋 Estructura de base de datos mantenida:';
    RAISE NOTICE '   📄 Tablas base: users, products, occasions, payment_methods, carousel_images, settings';
    RAISE NOTICE '   🔗 Tablas con FK: orders, order_items, payments, product_occasions';
    RAISE NOTICE '   🏷️  Tipos personalizados: order_status, payment_status, payment_method_type, user_role, etc.';
    RAISE NOTICE '   📊 Índices: Todos mantenidos para optimización';
    RAISE NOTICE '   ⚡ Triggers: updated_at triggers activos';
END $$;