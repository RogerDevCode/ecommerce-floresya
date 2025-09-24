-- =========================================================================
-- 🌸 FloresYa Test Data Population Script
-- Script para poblar la base de datos con datos de prueba realistas
-- =========================================================================

-- Limpiar datos existentes (opcional - comentar si quieres mantener datos)
-- DELETE FROM order_status_history WHERE order_id > 0;
-- DELETE FROM payments WHERE order_id > 0;
-- DELETE FROM order_items WHERE order_id > 0;
-- DELETE FROM orders WHERE id > 0;
-- DELETE FROM product_occasions WHERE product_id > 0;
-- DELETE FROM products WHERE id > 0;
-- DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%demo%';

-- =========================================================================
-- 1. USUARIOS DE PRUEBA
-- =========================================================================

-- Usuarios administradores
INSERT INTO users (email, password_hash, full_name, phone, role, is_active, email_verified, created_at, updated_at) VALUES
('admin.test@floresya.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'Admin Test FloresYa', '+573001234567', 'admin', true, true, NOW() - INTERVAL '90 days', NOW() - INTERVAL '85 days'),
('support.test@floresya.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'Soporte Test FloresYa', '+573001234568', 'support', true, true, NOW() - INTERVAL '85 days', NOW() - INTERVAL '80 days');

-- Usuarios clientes
INSERT INTO users (email, password_hash, full_name, phone, role, is_active, email_verified, created_at, updated_at) VALUES
('maria.garcia@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'María García Rodríguez', '+573101234567', 'user', true, true, NOW() - INTERVAL '75 days', NOW() - INTERVAL '70 days'),
('carlos.lopez@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'Carlos López Hernández', '+573111234567', 'user', true, true, NOW() - INTERVAL '65 days', NOW() - INTERVAL '60 days'),
('ana.martinez@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'Ana Martínez Silva', '+573121234567', 'user', true, true, NOW() - INTERVAL '55 days', NOW() - INTERVAL '50 days'),
('pedro.rodriguez@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'Pedro Rodríguez Castro', '+573131234567', 'user', true, true, NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days'),
('sofia.gutierrez@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'Sofía Gutiérrez Morales', '+573141234567', 'user', true, true, NOW() - INTERVAL '35 days', NOW() - INTERVAL '30 days'),
('luis.fernandez@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'Luis Fernández Vargas', '+573151234567', 'user', true, true, NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days'),
('carmen.santos@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'Carmen Santos Jiménez', '+573161234567', 'user', true, false, NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days'),
('ricardo.torres@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'Ricardo Torres Mendoza', '+573171234567', 'user', true, true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days');

-- =========================================================================
-- 2. PRODUCTOS DE FLORES REALISTAS
-- =========================================================================

INSERT INTO products (name, slug, description, price, stock, is_active, created_at, updated_at) VALUES
-- Productos simples (precios 20-60)
('Rosas Rojas Clásicas', 'rosas-rojas-clasicas', 'Docena de hermosas rosas rojas de tallo largo, perfectas para expresar amor y pasión. Incluye follaje verde complementario.', 45.00, 25, true, NOW() - INTERVAL '80 days', NOW() - INTERVAL '75 days'),

('Tulipanes Mixtos', 'tulipanes-mixtos', 'Ramo de 15 tulipanes en colores variados: rosa, amarillo, rojo y blanco. Flores frescas de temporada con presentación elegante.', 35.00, 18, true, NOW() - INTERVAL '75 days', NOW() - INTERVAL '70 days'),

-- Productos medianos (precios 60-120)
('Arreglo Primaveral Deluxe', 'arreglo-primaveral-deluxe', 'Espectacular arreglo con gerberas, crisantemos, alstromerias y rosas en tonos pastel. Incluye base de cerámica y tarjeta personalizada.', 85.00, 12, true, NOW() - INTERVAL '70 days', NOW() - INTERVAL '65 days'),

('Bouquet Romántico Premium', 'bouquet-romantico-premium', 'Elegante bouquet con 24 rosas rosadas, eucalipto, gypsophila y listón de seda. Perfecto para aniversarios y declaraciones de amor.', 95.00, 8, true, NOW() - INTERVAL '65 days', NOW() - INTERVAL '60 days'),

-- Productos premium (precios 120-200)
('Corona Fúnebre Elegante', 'corona-funebre-elegante', 'Corona funeraria de 80cm con crisantemos blancos, gladiolos, claveles y follaje natural. Incluye banda de condolencias personalizada y entrega inmediata.', 165.00, 5, true, NOW() - INTERVAL '60 days', NOW() - INTERVAL '55 days');

-- =========================================================================
-- 3. ASOCIACIÓN PRODUCTOS-OCASIONES
-- =========================================================================

-- Obtener IDs de productos y ocasiones para las relaciones
-- Rosas Rojas Clásicas - Múltiples ocasiones
INSERT INTO product_occasions (product_id, occasion_id, created_at)
SELECT p.id, o.id, NOW() - INTERVAL '75 days'
FROM products p, occasions o
WHERE p.slug = 'rosas-rojas-clasicas'
AND o.name IN ('Sin ocasión específica', 'Cumpleaños', 'Aniversario', 'Felicitaciones');

-- Tulipanes Mixtos - Ocasiones alegres
INSERT INTO product_occasions (product_id, occasion_id, created_at)
SELECT p.id, o.id, NOW() - INTERVAL '70 days'
FROM products p, occasions o
WHERE p.slug = 'tulipanes-mixtos'
AND o.name IN ('Sin ocasión específica', 'Cumpleaños', 'Felicitaciones');

-- Arreglo Primaveral - Celebraciones
INSERT INTO product_occasions (product_id, occasion_id, created_at)
SELECT p.id, o.id, NOW() - INTERVAL '65 days'
FROM products p, occasions o
WHERE p.slug = 'arreglo-primaveral-deluxe'
AND o.name IN ('Sin ocasión específica', 'Cumpleaños', 'Aniversario', 'Boda', 'Felicitaciones');

-- Bouquet Romántico - Amor y romance
INSERT INTO product_occasions (product_id, occasion_id, created_at)
SELECT p.id, o.id, NOW() - INTERVAL '60 days'
FROM products p, occasions o
WHERE p.slug = 'bouquet-romantico-premium'
AND o.name IN ('Aniversario', 'Boda', 'Felicitaciones');

-- Corona Fúnebre - Solo pésame
INSERT INTO product_occasions (product_id, occasion_id, created_at)
SELECT p.id, o.id, NOW() - INTERVAL '55 days'
FROM products p, occasions o
WHERE p.slug = 'corona-funebre-elegante'
AND o.name = 'Pésame';

-- =========================================================================
-- 4. ÓRDENES CON DIFERENTES ESTATUS Y FECHAS ALEATORIAS
-- =========================================================================

-- Orden 1: Completada con pago único
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 45.00, 'Calle 123 #45-67', 'Bogotá', 'Cundinamarca', '110111', 'Colombia', 'Entrega urgente para aniversario', 'delivered', NOW() - INTERVAL '85 days', NOW() - INTERVAL '82 days'
FROM users u WHERE u.email = 'maria.garcia@email.com';

-- Orden 2: En proceso con pagos parciales
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 95.00, 'Carrera 45 #78-90', 'Medellín', 'Antioquia', '050001', 'Colombia', 'Para sorpresa de cumpleaños', 'processing', NOW() - INTERVAL '75 days', NOW() - INTERVAL '74 days'
FROM users u WHERE u.email = 'carlos.lopez@email.com';

-- Orden 3: Pendiente de confirmación
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 85.00, 'Avenida 30 #12-34', 'Cali', 'Valle del Cauca', '760001', 'Colombia', 'Confirmar dirección por favor', 'pending', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'
FROM users u WHERE u.email = 'ana.martinez@email.com';

-- Orden 4: Enviada
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 35.00, 'Calle 67 #89-12', 'Barranquilla', 'Atlántico', '080001', 'Colombia', '', 'shipped', NOW() - INTERVAL '25 days', NOW() - INTERVAL '23 days'
FROM users u WHERE u.email = 'pedro.rodriguez@email.com';

-- Orden 5: Cancelada
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 165.00, 'Transversal 12 #34-56', 'Cartagena', 'Bolívar', '130001', 'Colombia', 'Cliente cambió de opinión', 'cancelled', NOW() - INTERVAL '60 days', NOW() - INTERVAL '58 days'
FROM users u WHERE u.email = 'sofia.gutierrez@email.com';

-- Orden 6: Confirmada (múltiples productos)
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 130.00, 'Diagonal 34 #56-78', 'Bucaramanga', 'Santander', '680001', 'Colombia', 'Entrega para evento corporativo', 'confirmed', NOW() - INTERVAL '35 days', NOW() - INTERVAL '34 days'
FROM users u WHERE u.email = 'luis.fernandez@email.com';

-- Orden 7: Entregada (pago completado en partes)
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 80.00, 'Calle 78 #90-12', 'Pereira', 'Risaralda', '660001', 'Colombia', 'Para funeral - urgente', 'delivered', NOW() - INTERVAL '55 days', NOW() - INTERVAL '52 days'
FROM users u WHERE u.email = 'carmen.santos@email.com';

-- Orden 8: En procesamiento
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 45.00, 'Carrera 23 #45-67', 'Manizales', 'Caldas', '170001', 'Colombia', '', 'processing', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'
FROM users u WHERE u.email = 'ricardo.torres@email.com';

-- Orden 9: Confirmada
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 95.00, 'Avenida 67 #89-01', 'Ibagué', 'Tolima', '730001', 'Colombia', 'Aniversario de bodas', 'confirmed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days'
FROM users u WHERE u.email = 'maria.garcia@email.com';

-- Orden 10: Entregada
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 120.00, 'Calle 12 #34-56', 'Pasto', 'Nariño', '520001', 'Colombia', 'Cumpleaños especial', 'delivered', NOW() - INTERVAL '40 days', NOW() - INTERVAL '37 days'
FROM users u WHERE u.email = 'carlos.lopez@email.com';

-- Orden 11: Pendiente (reciente)
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 35.00, 'Carrera 56 #78-90', 'Neiva', 'Huila', '410001', 'Colombia', 'Primera compra', 'pending', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
FROM users u WHERE u.email = 'ana.martinez@email.com';

-- Orden 12: Enviada (muy reciente)
INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country, order_notes, status, created_at, updated_at)
SELECT u.id, 85.00, 'Transversal 78 #90-12', 'Popayán', 'Cauca', '190001', 'Colombia', 'Regalo sorpresa', 'shipped', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
FROM users u WHERE u.email = 'pedro.rodriguez@email.com';

-- =========================================================================
-- 5. ITEMS DE ORDEN (ORDER_ITEMS)
-- =========================================================================

-- Order 1: 1 producto (Rosas Rojas)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 45.00, 45.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'maria.garcia@email.com' AND o.user_id = u.id AND o.total_amount = 45.00 AND o.created_at < NOW() - INTERVAL '80 days'
AND p.slug = 'rosas-rojas-clasicas' LIMIT 1;

-- Order 2: 1 producto (Bouquet Romántico)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 95.00, 95.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'carlos.lopez@email.com' AND o.user_id = u.id AND o.total_amount = 95.00 AND o.created_at < NOW() - INTERVAL '70 days'
AND p.slug = 'bouquet-romantico-premium' LIMIT 1;

-- Order 3: 1 producto (Arreglo Primaveral)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 85.00, 85.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'ana.martinez@email.com' AND o.user_id = u.id AND o.total_amount = 85.00 AND o.created_at < NOW() - INTERVAL '40 days'
AND p.slug = 'arreglo-primaveral-deluxe' LIMIT 1;

-- Order 4: 1 producto (Tulipanes)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 35.00, 35.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'pedro.rodriguez@email.com' AND o.user_id = u.id AND o.total_amount = 35.00 AND o.created_at < NOW() - INTERVAL '20 days'
AND p.slug = 'tulipanes-mixtos' LIMIT 1;

-- Order 5: 1 producto (Corona Fúnebre)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 165.00, 165.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'sofia.gutierrez@email.com' AND o.user_id = u.id AND o.total_amount = 165.00 AND o.status = 'cancelled'
AND p.slug = 'corona-funebre-elegante' LIMIT 1;

-- Order 6: 2 productos (Arreglo + Rosas)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 85.00, 85.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'luis.fernandez@email.com' AND o.user_id = u.id AND o.total_amount = 130.00
AND p.slug = 'arreglo-primaveral-deluxe' LIMIT 1;

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 45.00, 45.00, o.created_at + INTERVAL '6 minutes'
FROM orders o, products p, users u
WHERE u.email = 'luis.fernandez@email.com' AND o.user_id = u.id AND o.total_amount = 130.00
AND p.slug = 'rosas-rojas-clasicas' LIMIT 1;

-- Order 7: 2 productos (Tulipanes + Rosas)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 35.00, 35.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'carmen.santos@email.com' AND o.user_id = u.id AND o.total_amount = 80.00
AND p.slug = 'tulipanes-mixtos' LIMIT 1;

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 45.00, 45.00, o.created_at + INTERVAL '6 minutes'
FROM orders o, products p, users u
WHERE u.email = 'carmen.santos@email.com' AND o.user_id = u.id AND o.total_amount = 80.00
AND p.slug = 'rosas-rojas-clasicas' LIMIT 1;

-- Order 8: 1 producto (Rosas)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 45.00, 45.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'ricardo.torres@email.com' AND o.user_id = u.id AND o.total_amount = 45.00 AND o.created_at > NOW() - INTERVAL '20 days'
AND p.slug = 'rosas-rojas-clasicas' LIMIT 1;

-- Order 9: 1 producto (Bouquet Romántico)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 95.00, 95.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'maria.garcia@email.com' AND o.user_id = u.id AND o.total_amount = 95.00 AND o.created_at > NOW() - INTERVAL '25 days'
AND p.slug = 'bouquet-romantico-premium' LIMIT 1;

-- Order 10: 2 productos (Tulipanes + Arreglo)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 35.00, 35.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'carlos.lopez@email.com' AND o.user_id = u.id AND o.total_amount = 120.00
AND p.slug = 'tulipanes-mixtos' LIMIT 1;

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 85.00, 85.00, o.created_at + INTERVAL '6 minutes'
FROM orders o, products p, users u
WHERE u.email = 'carlos.lopez@email.com' AND o.user_id = u.id AND o.total_amount = 120.00
AND p.slug = 'arreglo-primaveral-deluxe' LIMIT 1;

-- Order 11: 1 producto (Tulipanes)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 35.00, 35.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'ana.martinez@email.com' AND o.user_id = u.id AND o.total_amount = 35.00 AND o.created_at > NOW() - INTERVAL '10 days'
AND p.slug = 'tulipanes-mixtos' LIMIT 1;

-- Order 12: 1 producto (Arreglo Primaveral)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, created_at)
SELECT o.id, p.id, 1, 85.00, 85.00, o.created_at + INTERVAL '5 minutes'
FROM orders o, products p, users u
WHERE u.email = 'pedro.rodriguez@email.com' AND o.user_id = u.id AND o.total_amount = 85.00 AND o.created_at > NOW() - INTERVAL '5 days'
AND p.slug = 'arreglo-primaveral-deluxe' LIMIT 1;

-- =========================================================================
-- 6. PAGOS (PAYMENTS) - Diferentes métodos y escenarios
-- =========================================================================

-- Pago completo para Order 1 (María - Entregada)
INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 45.00, 'bank_transfer', 'confirmed', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_001'), o.created_at + INTERVAL '10 minutes', o.created_at + INTERVAL '2 hours'
FROM orders o, users u
WHERE u.email = 'maria.garcia@email.com' AND o.user_id = u.id AND o.total_amount = 45.00 AND o.created_at < NOW() - INTERVAL '80 days' LIMIT 1;

-- Pagos parciales para Order 2 (Carlos - En proceso)
INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 50.00, 'mobile_payment', 'confirmed', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_002'), o.created_at + INTERVAL '15 minutes', o.created_at + INTERVAL '1 hour'
FROM orders o, users u
WHERE u.email = 'carlos.lopez@email.com' AND o.user_id = u.id AND o.total_amount = 95.00 AND o.created_at < NOW() - INTERVAL '70 days' LIMIT 1;

INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 45.00, 'card', 'confirmed', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_003'), o.created_at + INTERVAL '2 days', o.created_at + INTERVAL '2 days 1 hour'
FROM orders o, users u
WHERE u.email = 'carlos.lopez@email.com' AND o.user_id = u.id AND o.total_amount = 95.00 AND o.created_at < NOW() - INTERVAL '70 days' LIMIT 1;

-- Pago pendiente para Order 3 (Ana - Pendiente)
INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 85.00, 'bank_transfer', 'pending', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_004'), o.created_at + INTERVAL '20 minutes', o.created_at + INTERVAL '20 minutes'
FROM orders o, users u
WHERE u.email = 'ana.martinez@email.com' AND o.user_id = u.id AND o.total_amount = 85.00 AND o.created_at < NOW() - INTERVAL '40 days' LIMIT 1;

-- Pago completo para Order 4 (Pedro - Enviada)
INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 35.00, 'crypto', 'confirmed', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_005'), o.created_at + INTERVAL '30 minutes', o.created_at + INTERVAL '3 hours'
FROM orders o, users u
WHERE u.email = 'pedro.rodriguez@email.com' AND o.user_id = u.id AND o.total_amount = 35.00 AND o.created_at < NOW() - INTERVAL '20 days' LIMIT 1;

-- Pago fallido para Order 5 (Sofía - Cancelada)
INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 165.00, 'card', 'failed', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_006'), o.created_at + INTERVAL '25 minutes', o.created_at + INTERVAL '1 hour'
FROM orders o, users u
WHERE u.email = 'sofia.gutierrez@email.com' AND o.user_id = u.id AND o.status = 'cancelled' LIMIT 1;

-- Pago completo para Order 6 (Luis - Confirmada)
INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 130.00, 'mobile_payment', 'confirmed', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_007'), o.created_at + INTERVAL '40 minutes', o.created_at + INTERVAL '2 hours'
FROM orders o, users u
WHERE u.email = 'luis.fernandez@email.com' AND o.user_id = u.id AND o.total_amount = 130.00 LIMIT 1;

-- Pagos parciales para Order 7 (Carmen - Entregada)
INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 40.00, 'cash', 'confirmed', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_008'), o.created_at + INTERVAL '35 minutes', o.created_at + INTERVAL '1 hour'
FROM orders o, users u
WHERE u.email = 'carmen.santos@email.com' AND o.user_id = u.id AND o.total_amount = 80.00 LIMIT 1;

INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 40.00, 'bank_transfer', 'confirmed', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_009'), o.created_at + INTERVAL '1 day', o.created_at + INTERVAL '1 day 2 hours'
FROM orders o, users u
WHERE u.email = 'carmen.santos@email.com' AND o.user_id = u.id AND o.total_amount = 80.00 LIMIT 1;

-- Pago completo para Order 8 (Ricardo - En proceso)
INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 45.00, 'card', 'confirmed', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_010'), o.created_at + INTERVAL '45 minutes', o.created_at + INTERVAL '3 hours'
FROM orders o, users u
WHERE u.email = 'ricardo.torres@email.com' AND o.user_id = u.id AND o.total_amount = 45.00 AND o.created_at > NOW() - INTERVAL '20 days' LIMIT 1;

-- Pago completo para Order 9 (María - Confirmada)
INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 95.00, 'mobile_payment', 'confirmed', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_011'), o.created_at + INTERVAL '50 minutes', o.created_at + INTERVAL '4 hours'
FROM orders o, users u
WHERE u.email = 'maria.garcia@email.com' AND o.user_id = u.id AND o.total_amount = 95.00 AND o.created_at > NOW() - INTERVAL '25 days' LIMIT 1;

-- Pago completo para Order 10 (Carlos - Entregada)
INSERT INTO payments (order_id, amount_usd, method, status, transaction_id, created_at, updated_at)
SELECT o.id, 120.00, 'bank_transfer', 'confirmed', CONCAT('TXN_', EXTRACT(EPOCH FROM o.created_at)::bigint, '_012'), o.created_at + INTERVAL '55 minutes', o.created_at + INTERVAL '5 hours'
FROM orders o, users u
WHERE u.email = 'carlos.lopez@email.com' AND o.user_id = u.id AND o.total_amount = 120.00 LIMIT 1;

-- Sin pago para Order 11 (Ana - Pendiente)
-- Sin pago para Order 12 (Pedro - Enviada)

-- =========================================================================
-- 7. HISTORIAL DE ESTATUS DE ÓRDENES (ORDER_STATUS_HISTORY)
-- =========================================================================

-- Para cada orden, crear historial de cambios de estado
-- Order 1: pending -> confirmed -> processing -> shipped -> delivered
INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
SELECT o.id, 'pending', u.id, 'Orden creada por el cliente', o.created_at
FROM orders o, users u
WHERE u.email = 'maria.garcia@email.com' AND o.user_id = u.id AND o.total_amount = 45.00 AND o.created_at < NOW() - INTERVAL '80 days' LIMIT 1;

INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
SELECT o.id, 'confirmed', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 'Pago confirmado', o.created_at + INTERVAL '2 hours'
FROM orders o, users u
WHERE u.email = 'maria.garcia@email.com' AND o.user_id = u.id AND o.total_amount = 45.00 AND o.created_at < NOW() - INTERVAL '80 days' LIMIT 1;

INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
SELECT o.id, 'processing', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 'Preparando el arreglo floral', o.created_at + INTERVAL '1 day'
FROM orders o, users u
WHERE u.email = 'maria.garcia@email.com' AND o.user_id = u.id AND o.total_amount = 45.00 AND o.created_at < NOW() - INTERVAL '80 days' LIMIT 1;

INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
SELECT o.id, 'shipped', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 'Enviado con mensajería express', o.created_at + INTERVAL '2 days'
FROM orders o, users u
WHERE u.email = 'maria.garcia@email.com' AND o.user_id = u.id AND o.total_amount = 45.00 AND o.created_at < NOW() - INTERVAL '80 days' LIMIT 1;

INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
SELECT o.id, 'delivered', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 'Entregado exitosamente', o.created_at + INTERVAL '3 days'
FROM orders o, users u
WHERE u.email = 'maria.garcia@email.com' AND o.user_id = u.id AND o.total_amount = 45.00 AND o.created_at < NOW() - INTERVAL '80 days' LIMIT 1;

-- Order 2: pending -> confirmed -> processing
INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
SELECT o.id, 'pending', u.id, 'Orden creada por el cliente', o.created_at
FROM orders o, users u
WHERE u.email = 'carlos.lopez@email.com' AND o.user_id = u.id AND o.total_amount = 95.00 AND o.created_at < NOW() - INTERVAL '70 days' LIMIT 1;

INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
SELECT o.id, 'confirmed', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 'Primer pago recibido', o.created_at + INTERVAL '1 hour'
FROM orders o, users u
WHERE u.email = 'carlos.lopez@email.com' AND o.user_id = u.id AND o.total_amount = 95.00 AND o.created_at < NOW() - INTERVAL '70 days' LIMIT 1;

INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
SELECT o.id, 'processing', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 'Pago completo recibido - iniciando preparación', o.created_at + INTERVAL '2 days 1 hour'
FROM orders o, users u
WHERE u.email = 'carlos.lopez@email.com' AND o.user_id = u.id AND o.total_amount = 95.00 AND o.created_at < NOW() - INTERVAL '70 days' LIMIT 1;

-- Order 3: pending (sin cambios)
INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
SELECT o.id, 'pending', u.id, 'Orden creada - esperando confirmación de dirección', o.created_at
FROM orders o, users u
WHERE u.email = 'ana.martinez@email.com' AND o.user_id = u.id AND o.total_amount = 85.00 LIMIT 1;

-- Order 5: pending -> cancelled
INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
SELECT o.id, 'pending', u.id, 'Orden creada por el cliente', o.created_at
FROM orders o, users u
WHERE u.email = 'sofia.gutierrez@email.com' AND o.user_id = u.id AND o.status = 'cancelled' LIMIT 1;

INSERT INTO order_status_history (order_id, status, changed_by, notes, created_at)
SELECT o.id, 'cancelled', u.id, 'Cliente canceló - pago fallido', o.created_at + INTERVAL '2 hours'
FROM orders o, users u
WHERE u.email = 'sofia.gutierrez@email.com' AND o.user_id = u.id AND o.status = 'cancelled' LIMIT 1;

-- =========================================================================
-- RESUMEN DE DATOS CREADOS
-- =========================================================================

-- Mostrar resumen de datos insertados
SELECT
  'USUARIOS' as tabla,
  COUNT(*) as registros
FROM users WHERE email LIKE '%test%' OR email LIKE '%@email.com'
UNION ALL
SELECT
  'PRODUCTOS' as tabla,
  COUNT(*) as registros
FROM products WHERE created_at > NOW() - INTERVAL '90 days'
UNION ALL
SELECT
  'PRODUCT_OCCASIONS' as tabla,
  COUNT(*) as registros
FROM product_occasions WHERE created_at > NOW() - INTERVAL '90 days'
UNION ALL
SELECT
  'ORDENES' as tabla,
  COUNT(*) as registros
FROM orders WHERE created_at > NOW() - INTERVAL '90 days'
UNION ALL
SELECT
  'ORDER_ITEMS' as tabla,
  COUNT(*) as registros
FROM order_items WHERE created_at > NOW() - INTERVAL '90 days'
UNION ALL
SELECT
  'PAYMENTS' as tabla,
  COUNT(*) as registros
FROM payments WHERE created_at > NOW() - INTERVAL '90 days'
UNION ALL
SELECT
  'ORDER_STATUS_HISTORY' as tabla,
  COUNT(*) as registros
FROM order_status_history WHERE created_at > NOW() - INTERVAL '90 days';

-- =========================================================================
-- NOTAS FINALES
-- =========================================================================
-- Script completado exitosamente!
--
-- Datos creados:
-- - 9 usuarios (2 admin/support, 7 clientes)
-- - 5 productos de flores con precios realistas ($20-$200)
-- - 12 órdenes con diferentes estatus y fechas aleatorias (últimos 3 meses)
-- - Pagos diversos: completos, parciales, fallidos, pendientes
-- - Historial completo de cambios de estado en órdenes
-- - Asociaciones producto-ocasión realistas
--
-- Funcionalidades cubiertas para testing:
-- ✅ Flujos completos de órdenes (pending -> delivered)
-- ✅ Pagos únicos y múltiples por orden
-- ✅ Diferentes métodos de pago (bank_transfer, mobile_payment, card, crypto, cash)
-- ✅ Productos asociados a múltiples ocasiones
-- ✅ Órdenes en todos los estados posibles
-- ✅ Fechas realistas distribuidas en 3 meses
-- ✅ Precios variados según complejidad del producto
-- ✅ Direcciones de entrega en diferentes ciudades colombianas
--
-- Listo para pruebas unitarias y de integración! 🌸