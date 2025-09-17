-- 🌸 FloresYa Database Transactions Setup Script
-- Execute this script in Supabase SQL Editor to set up transaction functions

-- ============================================
-- SETUP INSTRUCTIONS
-- ============================================

-- 1. Copy the contents of database-transactions.sql
-- 2. Execute in Supabase SQL Editor (Dashboard > SQL Editor)
-- 3. Verify functions are created successfully
-- 4. Test with sample data

-- ============================================
-- TESTING THE FUNCTIONS
-- ============================================

-- Test order creation transaction
/*
SELECT create_order_with_items(
    '{
        "customer_email": "test@example.com",
        "customer_name": "Test Customer",
        "delivery_address": "123 Test St",
        "status": "pending",
        "total_amount_usd": 50.00
    }'::jsonb,
    '[
        {
            "product_id": 1,
            "product_name": "Test Product",
            "product_summary": "Test summary",
            "unit_price_usd": 25.00,
            "quantity": 2,
            "subtotal_usd": 50.00
        }
    ]'::jsonb[]
);
*/

-- Test order status update transaction
/*
SELECT update_order_status_with_history(
    1, -- order_id
    'confirmed'::order_status,
    'Status updated via API',
    1 -- changed_by user_id
);
*/

-- Test product creation with occasions transaction
/*
SELECT create_product_with_occasions(
    '{
        "name": "Test Product",
        "description": "Test description",
        "price_usd": 29.99,
        "stock": 10,
        "active": true
    }'::jsonb,
    '{1, 2}'::integer[] -- occasion_ids array
);
*/

-- Test carousel order update transaction
/*
SELECT update_carousel_order_atomic(
    1, -- product_id
    3  -- new_order (null to remove from carousel)
);
*/

-- Test image creation transaction
/*
SELECT create_product_images_atomic(
    1, -- product_id
    1, -- image_index
    '[
        {
            "size": "large",
            "url": "https://example.com/image_large.webp",
            "file_hash": "hash123",
            "mime_type": "image/webp"
        },
        {
            "size": "medium",
            "url": "https://example.com/image_medium.webp",
            "file_hash": "hash123",
            "mime_type": "image/webp"
        }
    ]'::jsonb[],
    true -- is_primary
);
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if functions exist
/*
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN (
    'create_order_with_items',
    'update_order_status_with_history',
    'create_product_with_occasions',
    'update_carousel_order_atomic',
    'create_product_images_atomic',
    'delete_product_images_safe'
)
ORDER BY proname;
*/

-- Check function permissions
/*
SELECT
    r.rolname as role_name,
    p.proname as function_name
FROM pg_proc p
JOIN pg_auth_members m ON p.proowner = m.member
JOIN pg_roles r ON m.roleid = r.oid
WHERE p.proname IN (
    'create_order_with_items',
    'update_order_status_with_history',
    'create_product_with_occasions',
    'update_carousel_order_atomic',
    'create_product_images_atomic',
    'delete_product_images_safe'
);
*/

-- ============================================
-- MONITORING QUERIES
-- ============================================

-- Monitor transaction function usage
/*
SELECT
    schemaname,
    funcname,
    calls,
    total_time,
    self_time,
    mean_time
FROM pg_stat_user_functions
WHERE funcname IN (
    'create_order_with_items',
    'update_order_status_with_history',
    'create_product_with_occasions',
    'update_carousel_order_atomic',
    'create_product_images_atomic',
    'delete_product_images_safe'
)
ORDER BY calls DESC;
*/

-- ============================================
-- ROLLBACK PLAN (if needed)
-- ============================================

-- If you need to drop the functions:
/*
DROP FUNCTION IF EXISTS create_order_with_items(JSONB, JSONB[]);
DROP FUNCTION IF EXISTS update_order_status_with_history(INTEGER, order_status, TEXT, INTEGER);
DROP FUNCTION IF EXISTS create_product_with_occasions(JSONB, INTEGER[]);
DROP FUNCTION IF EXISTS update_carousel_order_atomic(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS create_product_images_atomic(INTEGER, INTEGER, JSONB[], BOOLEAN);
DROP FUNCTION IF EXISTS delete_product_images_safe(INTEGER);
*/

-- ============================================
-- SUCCESS CHECKLIST
-- ============================================

/*
✅ Functions created successfully
✅ Permissions granted to authenticated and service_role
✅ Test queries executed without errors
✅ Application code updated to use transaction functions
✅ Error handling implemented in application code
✅ Rollback mechanisms in place for failed operations
*/