-- FloresYa E-commerce - Datos Iniciales ACTUALIZADOS
-- Compatible con el nuevo esquema de supabase_migration_force.sql
-- ✅ Campos verificados y adaptados al nuevo esquema

-- ============================================================================
-- INFORMACIÓN INICIAL
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🌱 INSERTANDO DATOS INICIALES DE FLORESYA';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Fecha: %', NOW()::DATE;
    RAISE NOTICE 'Hora: %', NOW()::TIME;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- USUARIOS DEL SISTEMA
-- ============================================================================

INSERT INTO users (email, password_hash, full_name, phone, role, is_active, email_verified) VALUES
('admin@floresya.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador FloresYa', '+58 212 555-0100', 'admin', TRUE, TRUE),
('usuario@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Usuario de Prueba', '+58 212 555-0101', 'user', TRUE, TRUE),
('cliente@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cliente de Prueba', '+58 212 555-0102', 'user', TRUE, FALSE);

-- ============================================================================
-- OCASIONES (Reemplaza el sistema de categorías obsoleto)
-- ============================================================================

INSERT INTO occasions (name, type, description, is_active, display_order) VALUES
('Cumpleaños', 'birthday', 'Flores perfectas para celebrar cumpleaños especiales', TRUE, 1),
('Aniversario', 'anniversary', 'Arreglos románticos para celebrar aniversarios de amor', TRUE, 2),
('San Valentín', 'valentines', 'Flores especiales para el día del amor y la amistad', TRUE, 3),
('Día de la Madre', 'mothers_day', 'Hermosos detalles florales para honrar a mamá', TRUE, 4),
('Día del Padre', 'fathers_day', 'Arreglos elegantes para celebrar a papá', TRUE, 5),
('Graduación', 'graduation', 'Flores para celebrar logros académicos y profesionales', TRUE, 6),
('Condolencias', 'condolence', 'Arreglos respetuosos para momentos de duelo', TRUE, 7),
('Sin ocasión específica', 'general', 'Flores hermosas para cualquier momento del año', TRUE, 8);

-- ============================================================================
-- MÉTODOS DE PAGO (Adaptados al mercado venezolano)
-- ============================================================================

INSERT INTO payment_methods (name, type, description, account_info, is_active, display_order) VALUES
('Pago Móvil', 'mobile_payment', 'Transferencias instantáneas desde tu teléfono', 
 '{"banks": ["Banesco", "Mercantil", "Venezuela", "Provincial"], "phone": "0414-555-0123", "cedula": "V-12345678"}', 
 TRUE, 1),
 
('Zelle', 'international', 'Pagos internacionales rápidos y seguros', 
 '{"email": "payments@floresya.com", "name": "FloresYa Flowers"}', 
 TRUE, 2),
 
('Binance Pay', 'crypto', 'Pagos con criptomonedas de forma instantánea', 
 '{"user_id": "FloresYaVE", "email": "crypto@floresya.com"}', 
 TRUE, 3),
 
('Transferencia Bancaria', 'bank_transfer', 'Transferencias directas a cuenta bancaria', 
 '{"bank": "Banesco", "account": "0134-0000-00-0000000000", "holder": "FloresYa C.A.", "rif": "J-12345678-9"}', 
 TRUE, 4),
 
('Efectivo', 'cash', 'Pago contra entrega (solo área metropolitana)', 
 '{"delivery_fee": "5.00", "areas": ["Caracas", "Los Teques"]}', 
 TRUE, 5);

-- ============================================================================
-- PRODUCTOS (Catálogo inicial de flores y arreglos)
-- ============================================================================

INSERT INTO products (name, summary, description, price_usd, price_ves, stock, occasion, sku, image_url, active, featured) VALUES
-- Productos destacados para San Valentín
('Ramo de Rosas Rojas', 'Docena de rosas rojas premium', 
 'Hermosa docena de rosas rojas frescas, perfectas para expresar amor y pasión. Importadas directamente, cuidadosamente seleccionadas y envueltas con elegancia.', 
 25.00, 900000, 50, 'San Valentín', 'ROSE-RED-12', '/images/products/rosas-rojas.jpg', TRUE, TRUE),

-- Productos para cumpleaños
('Orquídeas Blancas', 'Elegante planta de orquídea en maceta', 
 'Hermosa orquídea Phalaenopsis blanca en maceta decorativa de cerámica. Perfecta para decorar hogar u oficina. Incluye guía de cuidados.', 
 45.00, 1620000, 25, 'Cumpleaños', 'ORCH-WHITE-01', '/images/products/orquidea-blanca.jpg', TRUE, TRUE),

-- Productos para ocasiones generales
('Girasoles Radiantes', 'Ramo de girasoles frescos', 
 'Brillante ramo de girasoles que simboliza alegría, energía positiva y vitalidad. Perfectos para iluminar cualquier espacio con su belleza natural.', 
 20.00, 720000, 35, 'Sin ocasión específica', 'SUN-FLOW-06', '/images/products/girasoles.jpg', TRUE, FALSE),

-- Productos para el Día de la Madre
('Lirios Rosados', 'Arreglo de lirios perfumados', 
 'Elegante arreglo de lirios rosados con un aroma encantador. Simbolizan pureza, renovación y el amor maternal. Perfectos para el Día de la Madre.', 
 30.00, 1080000, 20, 'Día de la Madre', 'LILY-PINK-ARR', '/images/products/lirios-rosados.jpg', TRUE, TRUE),

-- Productos mixtos
('Claveles Mixtos', 'Colorido ramo de claveles variados', 
 'Vibrante ramo de claveles en colores variados: rojos, blancos, rosados y amarillos. Flores duraderas que expresan admiración y cariño.', 
 18.00, 648000, 40, 'Cumpleaños', 'CARN-MIX-12', '/images/products/claveles-mixtos.jpg', TRUE, FALSE),

-- Productos premium
('Tulipanes Amarillos', 'Ramo primaveral de tulipanes', 
 'Delicado ramo de tulipanes amarillos que anuncia la llegada de la primavera. Representan pensamientos alegres y rayos de sol en el hogar.', 
 28.00, 1008000, 15, 'Sin ocasión específica', 'TUL-YEL-10', '/images/products/tulipanes-amarillos.jpg', TRUE, TRUE);

-- ============================================================================
-- IMÁGENES DEL CARRUSEL (Homepage)
-- ============================================================================

INSERT INTO carousel_images (title, image_url, link_url, alt_text, display_order, is_active) VALUES
('¡Rosas Premium para San Valentín!', '/images/carousel/roses-valentine.jpg', '/productos?ocasion=san-valentin', 'Rosas rojas premium para San Valentín', 1, TRUE),
('Flores Frescas para Mamá', '/images/carousel/mothers-day-flowers.jpg', '/productos?ocasion=dia-madre', 'Arreglos especiales para el Día de la Madre', 2, TRUE),
('Orquídeas Elegantes', '/images/carousel/orchids-collection.jpg', '/productos?buscar=orquidea', 'Colección de orquídeas elegantes', 3, TRUE),
('Entrega Gratis en Caracas', '/images/carousel/free-delivery.jpg', '/info/entregas', 'Entrega gratuita en el área metropolitana', 4, TRUE);

-- ============================================================================
-- CONFIGURACIONES DEL SISTEMA
-- ============================================================================

INSERT INTO settings (key, value, description, type, is_public) VALUES
-- Información básica de la tienda
('store_name', 'FloresYa', 'Nombre de la florería', 'string', TRUE),
('store_tagline', 'Flores Frescas para Cada Ocasión', 'Eslogan de la tienda', 'string', TRUE),
('contact_phone', '+58 212 555-0123', 'Teléfono principal de contacto', 'string', TRUE),
('contact_email', 'info@floresya.com', 'Email principal de contacto', 'string', TRUE),
('contact_whatsapp', '+58 414 555-0123', 'Número de WhatsApp para pedidos', 'string', TRUE),

-- Configuración de entregas
('delivery_areas', 'Caracas, Los Teques, Guarenas, Guatire, La Guaira', 'Zonas de entrega disponibles', 'string', TRUE),
('delivery_fee_caracas', '0', 'Costo de entrega en Caracas (USD)', 'number', TRUE),
('delivery_fee_metropolitan', '5', 'Costo de entrega área metropolitana (USD)', 'number', TRUE),
('delivery_time_slots', '9:00-12:00,12:00-15:00,15:00-18:00', 'Horarios de entrega disponibles', 'string', FALSE),

-- Configuración de monedas
('currency_primary', 'USD', 'Moneda principal (USD)', 'string', TRUE),
('currency_secondary', 'VES', 'Moneda secundaria (VES)', 'string', TRUE),
('exchange_rate_usd_ves', '36000', 'Tasa de cambio USD a VES', 'number', TRUE),
('exchange_rate_updated', NOW()::text, 'Última actualización de tasa de cambio', 'string', FALSE),

-- Estado de la tienda
('store_status', 'open', 'Estado de la tienda: open/closed/maintenance', 'string', FALSE),
('store_announcement', 'Envío gratis en pedidos mayores a $50 en Caracas', 'Anuncio especial mostrado en la página', 'string', TRUE),

-- Configuración de la página web
('homepage_hero_title', '🌹 Las Flores Más Frescas de Venezuela', 'Título principal de la página', 'string', TRUE),
('homepage_hero_subtitle', 'Entrega el mismo día en Caracas y área metropolitana', 'Subtítulo de la página', 'string', TRUE),
('homepage_about_text', 'Somos FloresYa, tu florería de confianza especializada en arreglos frescos, plantas decorativas y regalos florales para toda ocasión especial.', 'Descripción de la empresa', 'string', TRUE),

-- Configuración de email
('email_notifications', 'true', 'Activar notificaciones por email', 'boolean', FALSE),
('email_from_name', 'FloresYa', 'Nombre que aparece en emails', 'string', FALSE),
('email_from_address', 'noreply@floresya.com', 'Dirección de email de envío', 'string', FALSE),

-- Redes sociales
('social_instagram', '@floresya_ve', 'Usuario de Instagram', 'string', TRUE),
('social_facebook', 'FloresYaVenezuela', 'Página de Facebook', 'string', TRUE),
('social_twitter', '@floresya', 'Usuario de Twitter', 'string', TRUE);

-- ============================================================================
-- RELACIONES PRODUCTO-OCASIÓN (Ejemplos)
-- ============================================================================

-- Rosas rojas para San Valentín y Aniversarios
INSERT INTO product_occasions (product_id, occasion_id) VALUES
(1, 3), -- Rosas rojas - San Valentín
(1, 2), -- Rosas rojas - Aniversario

-- Orquídeas para cumpleaños y ocasiones generales
(2, 1), -- Orquídeas - Cumpleaños
(2, 8), -- Orquídeas - Sin ocasión específica

-- Girasoles para cumpleaños y ocasiones generales
(3, 1), -- Girasoles - Cumpleaños
(3, 8), -- Girasoles - Sin ocasión específica

-- Lirios para Día de la Madre
(4, 4), -- Lirios - Día de la Madre

-- Claveles para cumpleaños
(5, 1), -- Claveles - Cumpleaños

-- Tulipanes para ocasiones generales y graduación
(6, 8), -- Tulipanes - Sin ocasión específica
(6, 6); -- Tulipanes - Graduación

-- ============================================================================
-- VERIFICACIÓN FINAL DE DATOS
-- ============================================================================

DO $$
DECLARE
    user_count INTEGER;
    product_count INTEGER;
    occasion_count INTEGER;
    payment_count INTEGER;
    setting_count INTEGER;
    carousel_count INTEGER;
    relation_count INTEGER;
BEGIN
    -- Contar registros insertados
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(*) INTO occasion_count FROM occasions;
    SELECT COUNT(*) INTO payment_count FROM payment_methods;
    SELECT COUNT(*) INTO setting_count FROM settings;
    SELECT COUNT(*) INTO carousel_count FROM carousel_images;
    SELECT COUNT(*) INTO relation_count FROM product_occasions;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ DATOS INICIALES INSERTADOS CORRECTAMENTE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '👥 Usuarios: % (1 admin, 2 de prueba)', user_count;
    RAISE NOTICE '🌸 Productos: % (flores variadas)', product_count;
    RAISE NOTICE '🎯 Ocasiones: % (cumpleaños, san valentín, etc.)', occasion_count;
    RAISE NOTICE '💳 Métodos de pago: % (Pago Móvil, Zelle, etc.)', payment_count;
    RAISE NOTICE '⚙️  Configuraciones: % (tienda, entregas, monedas)', setting_count;
    RAISE NOTICE '🖼️  Imágenes carrusel: %', carousel_count;
    RAISE NOTICE '🔗 Relaciones producto-ocasión: %', relation_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ¡FloresYa está listo para funcionar!';
    RAISE NOTICE '🔐 Usuario admin: admin@floresya.com / admin123';
    RAISE NOTICE '🛒 La tienda tiene productos, métodos de pago y está configurada';
    RAISE NOTICE '🚀 Puedes iniciar el servidor con: npm run dev';
    RAISE NOTICE '';
END $$;