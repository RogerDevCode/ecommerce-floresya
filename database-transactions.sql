-- 🌸 FloresYa Database Transactions - PostgreSQL Functions
-- Atomic operations for data integrity

-- ============================================
-- ORDER TRANSACTIONS
-- ============================================

-- Function to create order with items atomically
CREATE OR REPLACE FUNCTION create_order_with_items(
    order_data JSONB,
    order_items JSONB[]
) RETURNS JSONB AS $$
DECLARE
    new_order_id INTEGER;
    item_record JSONB;
    result_order JSONB;
BEGIN
    -- Start transaction (implicit in function)

    -- Insert order
    INSERT INTO public.orders (
        user_id,
        customer_email,
        customer_name,
        customer_phone,
        delivery_address,
        delivery_city,
        delivery_state,
        delivery_zip,
        delivery_date,
        delivery_time_slot,
        delivery_notes,
        status,
        total_amount_usd,
        total_amount_ves,
        currency_rate,
        notes,
        admin_notes
    ) VALUES (
        (order_data->>'user_id')::INTEGER,
        order_data->>'customer_email',
        order_data->>'customer_name',
        order_data->>'customer_phone',
        order_data->>'delivery_address',
        order_data->>'delivery_city',
        order_data->>'delivery_state',
        order_data->>'delivery_zip',
        (order_data->>'delivery_date')::DATE,
        order_data->>'delivery_time_slot',
        order_data->>'delivery_notes',
        (order_data->>'status')::order_status,
        (order_data->>'total_amount_usd')::NUMERIC,
        (order_data->>'total_amount_ves')::NUMERIC,
        (order_data->>'currency_rate')::NUMERIC,
        order_data->>'notes',
        order_data->>'admin_notes'
    ) RETURNING id INTO new_order_id;

    -- Insert order items
    FOREACH item_record IN ARRAY order_items LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            product_summary,
            unit_price_usd,
            unit_price_ves,
            quantity,
            subtotal_usd,
            subtotal_ves
        ) VALUES (
            new_order_id,
            (item_record->>'product_id')::INTEGER,
            item_record->>'product_name',
            item_record->>'product_summary',
            (item_record->>'unit_price_usd')::NUMERIC,
            (item_record->>'unit_price_ves')::NUMERIC,
            (item_record->>'quantity')::INTEGER,
            (item_record->>'subtotal_usd')::NUMERIC,
            (item_record->>'subtotal_ves')::NUMERIC
        );
    END LOOP;

    -- Insert initial status history
    INSERT INTO public.order_status_history (
        order_id,
        old_status,
        new_status,
        notes
    ) VALUES (
        new_order_id,
        NULL,
        (order_data->>'status')::order_status,
        'Order created'
    );

    -- Return complete order with items
    SELECT jsonb_build_object(
        'id', o.id,
        'user_id', o.user_id,
        'customer_email', o.customer_email,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'delivery_address', o.delivery_address,
        'delivery_city', o.delivery_city,
        'delivery_state', o.delivery_state,
        'delivery_zip', o.delivery_zip,
        'delivery_date', o.delivery_date,
        'delivery_time_slot', o.delivery_time_slot,
        'delivery_notes', o.delivery_notes,
        'status', o.status,
        'total_amount_usd', o.total_amount_usd,
        'total_amount_ves', o.total_amount_ves,
        'currency_rate', o.currency_rate,
        'notes', o.notes,
        'admin_notes', o.admin_notes,
        'created_at', o.created_at,
        'updated_at', o.updated_at,
        'items', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', oi.id,
                    'order_id', oi.order_id,
                    'product_id', oi.product_id,
                    'product_name', oi.product_name,
                    'product_summary', oi.product_summary,
                    'unit_price_usd', oi.unit_price_usd,
                    'unit_price_ves', oi.unit_price_ves,
                    'quantity', oi.quantity,
                    'subtotal_usd', oi.subtotal_usd,
                    'subtotal_ves', oi.subtotal_ves,
                    'created_at', oi.created_at,
                    'updated_at', oi.updated_at
                )
            )
            FROM public.order_items oi
            WHERE oi.order_id = o.id
        )
    ) INTO result_order
    FROM public.orders o
    WHERE o.id = new_order_id;

    RETURN result_order;

EXCEPTION
    WHEN OTHERS THEN
        -- Transaction will be rolled back automatically
        RAISE EXCEPTION 'Failed to create order: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update order status with history atomically
CREATE OR REPLACE FUNCTION update_order_status_with_history(
    order_id INTEGER,
    new_status order_status,
    notes TEXT DEFAULT NULL,
    changed_by INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    current_status order_status;
    updated_order JSONB;
BEGIN
    -- Get current status
    SELECT status INTO current_status
    FROM public.orders
    WHERE id = order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order with ID % not found', order_id;
    END IF;

    -- Update order status
    UPDATE public.orders
    SET status = new_status,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = order_id;

    -- Insert status history
    INSERT INTO public.order_status_history (
        order_id,
        old_status,
        new_status,
        notes,
        changed_by
    ) VALUES (
        order_id,
        current_status,
        new_status,
        notes,
        changed_by
    );

    -- Return updated order
    SELECT jsonb_build_object(
        'id', o.id,
        'status', o.status,
        'updated_at', o.updated_at
    ) INTO updated_order
    FROM public.orders o
    WHERE o.id = order_id;

    RETURN updated_order;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to update order status: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PRODUCT TRANSACTIONS
-- ============================================

-- Function to update carousel order atomically
CREATE OR REPLACE FUNCTION update_carousel_order_atomic(
    product_id INTEGER,
    new_order INTEGER
) RETURNS JSONB AS $$
DECLARE
    current_order INTEGER;
    affected_products INTEGER[];
    result_product JSONB;
BEGIN
    -- Get current carousel order
    SELECT carousel_order INTO current_order
    FROM public.products
    WHERE id = product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', product_id;
    END IF;

    -- If setting to null, just update this product
    IF new_order IS NULL THEN
        UPDATE public.products
        SET carousel_order = NULL,
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = product_id;

        SELECT jsonb_build_object(
            'id', p.id,
            'carousel_order', p.carousel_order,
            'updated_at', p.updated_at
        ) INTO result_product
        FROM public.products p
        WHERE p.id = product_id;

        RETURN result_product;
    END IF;

    -- Handle carousel order reassignment
    -- Get all products that need to be shifted
    SELECT array_agg(id)
    INTO affected_products
    FROM public.products
    WHERE carousel_order >= new_order
      AND carousel_order IS NOT NULL
      AND id != product_id
    ORDER BY carousel_order;

    -- Shift existing products
    IF array_length(affected_products, 1) > 0 THEN
        UPDATE public.products
        SET carousel_order = carousel_order + 1,
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = ANY(affected_products)
          AND carousel_order <= 6; -- Prevent overflow beyond 7 positions

        -- Remove products that would exceed max positions
        UPDATE public.products
        SET carousel_order = NULL,
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = ANY(affected_products)
          AND carousel_order > 7;
    END IF;

    -- Update target product
    UPDATE public.products
    SET carousel_order = new_order,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = product_id;

    -- Return updated product
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'carousel_order', p.carousel_order,
        'updated_at', p.updated_at
    ) INTO result_product
    FROM public.products p
    WHERE p.id = product_id;

    RETURN result_product;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to update carousel order: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- IMAGE TRANSACTIONS
-- ============================================

-- Function to create product with occasion associations atomically
CREATE OR REPLACE FUNCTION create_product_with_occasions(
    product_data JSONB,
    occasion_ids INTEGER[]
) RETURNS JSONB[] AS $$
DECLARE
    new_product_id INTEGER;
    occasion_id INTEGER;
    result_product JSONB;
BEGIN
    -- Insert product
    INSERT INTO public.products (
        name,
        summary,
        description,
        price_usd,
        price_ves,
        stock,
        sku,
        active,
        featured,
        carousel_order
    ) VALUES (
        product_data->>'name',
        product_data->>'summary',
        product_data->>'description',
        (product_data->>'price_usd')::NUMERIC,
        (product_data->>'price_ves')::NUMERIC,
        (product_data->>'stock')::INTEGER,
        product_data->>'sku',
        COALESCE((product_data->>'active')::BOOLEAN, true),
        COALESCE((product_data->>'featured')::BOOLEAN, false),
        (product_data->>'carousel_order')::INTEGER
    ) RETURNING id INTO new_product_id;

    -- Insert occasion associations if provided
    IF occasion_ids IS NOT NULL AND array_length(occasion_ids, 1) > 0 THEN
        FOREACH occasion_id IN ARRAY occasion_ids LOOP
            INSERT INTO public.product_occasions (
                product_id,
                occasion_id
            ) VALUES (
                new_product_id,
                occasion_id
            );
        END LOOP;
    END IF;

    -- Return created product
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'summary', p.summary,
        'description', p.description,
        'price_usd', p.price_usd,
        'price_ves', p.price_ves,
        'stock', p.stock,
        'sku', p.sku,
        'active', p.active,
        'featured', p.featured,
        'carousel_order', p.carousel_order,
        'created_at', p.created_at,
        'updated_at', p.updated_at
    ) INTO result_product
    FROM public.products p
    WHERE p.id = new_product_id;

    RETURN ARRAY[result_product];

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create product with occasions: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create product images atomically
CREATE OR REPLACE FUNCTION create_product_images_atomic(
    product_id INTEGER,
    image_index INTEGER,
    images_data JSONB[],
    is_primary BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
    image_record JSONB;
    primary_image_id INTEGER;
    result_images JSONB;
BEGIN
    -- Insert all image records
    FOREACH image_record IN ARRAY images_data LOOP
        INSERT INTO public.product_images (
            product_id,
            image_index,
            size,
            url,
            file_hash,
            mime_type,
            is_primary
        ) VALUES (
            product_id,
            image_index,
            (image_record->>'size')::image_size,
            image_record->>'url',
            image_record->>'file_hash',
            COALESCE(image_record->>'mime_type', 'image/webp'),
            CASE
                WHEN (image_record->>'size') = 'medium' AND is_primary THEN TRUE
                ELSE FALSE
            END
        );
    END LOOP;

    -- If setting as primary, ensure no other images are primary
    IF is_primary THEN
        UPDATE public.product_images
        SET is_primary = FALSE
        WHERE product_id = product_id
          AND size = 'medium'
          AND id NOT IN (
              SELECT id FROM public.product_images
              WHERE product_id = product_id
                AND image_index = image_index
                AND size = 'medium'
          );
    END IF;

    -- Return created images
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', pi.id,
            'product_id', pi.product_id,
            'image_index', pi.image_index,
            'size', pi.size,
            'url', pi.url,
            'file_hash', pi.file_hash,
            'mime_type', pi.mime_type,
            'is_primary', pi.is_primary,
            'created_at', pi.created_at
        )
    ) INTO result_images
    FROM public.product_images pi
    WHERE pi.product_id = product_id
      AND pi.image_index = image_index;

    RETURN result_images;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create product images: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to safely delete product images with cleanup
CREATE OR REPLACE FUNCTION delete_product_images_safe(
    product_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    image_urls TEXT[];
BEGIN
    -- Get all image URLs for the product
    SELECT array_agg(url)
    INTO image_urls
    FROM public.product_images
    WHERE product_id = product_id;

    -- Delete database records first
    DELETE FROM public.product_images
    WHERE product_id = product_id;

    -- Note: Storage cleanup should be handled by application
    -- as Supabase storage operations are not directly transactional

    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to delete product images: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PERMISSIONS
-- ============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_order_with_items(JSONB, JSONB[]) TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status_with_history(INTEGER, order_status, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_product_with_occasions(JSONB, INTEGER[]) TO authenticated;
GRANT EXECUTE ON FUNCTION update_carousel_order_atomic(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_product_images_atomic(INTEGER, INTEGER, JSONB[], BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_product_images_safe(INTEGER) TO authenticated;

-- Grant execute permissions to service role for server-side operations
GRANT EXECUTE ON FUNCTION create_order_with_items(JSONB, JSONB[]) TO service_role;
GRANT EXECUTE ON FUNCTION update_order_status_with_history(INTEGER, order_status, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION create_product_with_occasions(JSONB, INTEGER[]) TO service_role;
GRANT EXECUTE ON FUNCTION update_carousel_order_atomic(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION create_product_images_atomic(INTEGER, INTEGER, JSONB[], BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION delete_product_images_safe(INTEGER) TO service_role;