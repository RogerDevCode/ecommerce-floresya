-- FloresYa E-commerce - VERIFICACIÓN PRE-MIGRACIÓN
-- Script para revisar el estado actual de la base de datos antes de la migración
-- ⚠️  SOLO CONSULTA - NO MODIFICA DATOS

-- ============================================================================
-- INFORMACIÓN GENERAL DE LA BASE DE DATOS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 VERIFICACIÓN PRE-MIGRACIÓN DE FLORESYA';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Fecha: %', NOW()::DATE;
    RAISE NOTICE 'Hora: %', NOW()::TIME;
END $$;

-- ============================================================================
-- VERIFICAR EXISTENCIA DE TABLAS
-- ============================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    current_table TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 TABLAS EXISTENTES:';
    RAISE NOTICE '====================';
    
    FOR current_table IN 
        SELECT unnest(ARRAY[
            'users', 'products', 'occasions', 'payment_methods', 'carousel_images',
            'settings', 'orders', 'order_items', 'payments', 'product_occasions', 'categories'
        ])
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = current_table AND table_schema = 'public'
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '✅ % - Existe', current_table;
        ELSE
            RAISE NOTICE '❌ % - No existe', current_table;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- CONTAR REGISTROS EN CADA TABLA
-- ============================================================================

DO $$
DECLARE
    current_table TEXT;
    row_count INTEGER;
    total_records INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📈 CONTEO DE REGISTROS:';
    RAISE NOTICE '=======================';
    
    -- Solo verificar tablas que existen
    FOR current_table IN 
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name IN (
            'users', 'products', 'occasions', 'payment_methods', 'carousel_images',
            'settings', 'orders', 'order_items', 'payments', 'product_occasions', 'categories'
        )
        ORDER BY t.table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', current_table) INTO row_count;
        total_records := total_records + row_count;
        
        IF row_count > 0 THEN
            RAISE NOTICE '📦 %: % registros', current_table, row_count;
        ELSE
            RAISE NOTICE '📭 %: vacía', current_table;
        END IF;
    END LOOP;
    
    RAISE NOTICE '📊 TOTAL DE REGISTROS: %', total_records;
END $$;

-- ============================================================================
-- VERIFICAR DEPENDENCIAS Y FOREIGN KEYS
-- ============================================================================

DO $$
DECLARE
    fk_record RECORD;
    fk_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔗 FOREIGN KEYS ACTIVAS:';
    RAISE NOTICE '========================';
    
    FOR fk_record IN
        SELECT
            tc.table_name AS from_table,
            kcu.column_name AS from_column,
            ccu.table_name AS to_table,
            ccu.column_name AS to_column,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
    LOOP
        fk_count := fk_count + 1;
        RAISE NOTICE '🔗 %.% → %.% (FK: %)', 
            fk_record.from_table, fk_record.from_column,
            fk_record.to_table, fk_record.to_column,
            fk_record.constraint_name;
    END LOOP;
    
    IF fk_count = 0 THEN
        RAISE NOTICE '❌ No se encontraron foreign keys';
    ELSE
        RAISE NOTICE '📊 Total de foreign keys: %', fk_count;
    END IF;
END $$;

-- ============================================================================
-- VERIFICAR TIPOS PERSONALIZADOS (ENUMS)
-- ============================================================================

DO $$
DECLARE
    enum_record RECORD;
    enum_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🏷️  TIPOS PERSONALIZADOS:';
    RAISE NOTICE '========================';
    
    FOR enum_record IN
        SELECT t.typname
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname IN (
            'order_status', 'payment_status', 'payment_method_type', 
            'user_role', 'address_type', 'occasion_type'
        )
        GROUP BY t.typname
        ORDER BY t.typname
    LOOP
        enum_count := enum_count + 1;
        RAISE NOTICE '🏷️  % - Existe', enum_record.typname;
    END LOOP;
    
    IF enum_count = 0 THEN
        RAISE NOTICE '❌ No se encontraron tipos personalizados';
    ELSE
        RAISE NOTICE '📊 Total de tipos personalizados: %', enum_count;
    END IF;
END $$;

-- ============================================================================
-- VERIFICAR ÍNDICES IMPORTANTES
-- ============================================================================

DO $$
DECLARE
    index_record RECORD;
    index_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 ÍNDICES PRINCIPALES:';
    RAISE NOTICE '======================';
    
    FOR index_record IN
        SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND tablename IN (
            'users', 'products', 'orders', 'payments', 'carousel_images'
        )
        AND indexname NOT LIKE '%_pkey'  -- Excluir primary keys
        ORDER BY tablename, indexname
    LOOP
        index_count := index_count + 1;
        RAISE NOTICE '📊 %.% - %', 
            index_record.tablename, 
            index_record.indexname,
            index_record.indexdef;
    END LOOP;
    
    RAISE NOTICE '📊 Total de índices custom: %', index_count;
END $$;

-- ============================================================================
-- VERIFICAR TRIGGERS
-- ============================================================================

DO $$
DECLARE
    trigger_record RECORD;
    trigger_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '⚡ TRIGGERS ACTIVOS:';
    RAISE NOTICE '===================';
    
    FOR trigger_record IN
        SELECT 
            event_object_table AS table_name,
            trigger_name,
            action_timing,
            event_manipulation
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        ORDER BY event_object_table, trigger_name
    LOOP
        trigger_count := trigger_count + 1;
        RAISE NOTICE '⚡ %.% (% %)', 
            trigger_record.table_name, 
            trigger_record.trigger_name,
            trigger_record.action_timing,
            trigger_record.event_manipulation;
    END LOOP;
    
    IF trigger_count = 0 THEN
        RAISE NOTICE '❌ No se encontraron triggers';
    ELSE
        RAISE NOTICE '📊 Total de triggers: %', trigger_count;
    END IF;
END $$;

-- ============================================================================
-- RESUMEN Y RECOMENDACIONES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 RESUMEN Y RECOMENDACIONES:';
    RAISE NOTICE '=============================';
    RAISE NOTICE '';
    
    -- Verificar si existe la tabla obsoleta 'categories'
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
        RAISE NOTICE '⚠️  IMPORTANTE: La tabla "categories" obsoleta aún existe';
        RAISE NOTICE '   Será eliminada durante la migración (reemplazada por occasions)';
    END IF;
    
    RAISE NOTICE '🎯 ORDEN DE MIGRACIÓN RECOMENDADO:';
    RAISE NOTICE '   1. Ejecutar backup de imágenes (backup_images.js) ✅ COMPLETADO';
    RAISE NOTICE '   2. Ejecutar supabase_migration_safe.sql (recreación completa)';
    RAISE NOTICE '   3. Ejecutar supabase_seed_data.sql (datos iniciales)';
    RAISE NOTICE '   4. Verificar funcionamiento de la aplicación';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ¡Listo para migración segura!';
END $$;