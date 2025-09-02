-- FloresYa E-commerce Database Migration to PostgreSQL 17.5
-- Data Migration Script

-- Reset sequences to start from the current max ID + 1
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories), false);
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products), false);
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users), false);
SELECT setval('addresses_id_seq', (SELECT COALESCE(MAX(id), 1) FROM addresses), false);
SELECT setval('orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM orders), false);
SELECT setval('order_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM order_items), false);
SELECT setval('payment_methods_id_seq', (SELECT COALESCE(MAX(id), 1) FROM payment_methods), false);
SELECT setval('payments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM payments), false);
SELECT setval('cart_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM cart_items), false);
SELECT setval('order_status_history_id_seq', (SELECT COALESCE(MAX(id), 1) FROM order_status_history), false);
SELECT setval('carousel_images_id_seq', (SELECT COALESCE(MAX(id), 1) FROM carousel_images), false);
SELECT setval('settings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM settings), false);

-- Insert categories
INSERT INTO categories (id, name, description, image_url, active, created_at, updated_at) VALUES
(1, 'Rosas', 'Hermosas rosas frescas para toda ocasión', '/images/categories/roses.jpg', true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(2, 'Arreglos de Mesa', 'Elegantes arreglos florales para decorar tu mesa', '/images/categories/table-arrangements.jpg', true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(3, 'Bouquets', 'Ramos de flores perfectos para regalar', '/images/categories/bouquets.jpg', true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(4, 'Plantas', 'Plantas decorativas para el hogar y oficina', '/images/categories/plants.jpg', true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(5, 'Bodas', 'Arreglos especiales para el día más importante', '/images/categories/weddings.jpg', true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00')
ON CONFLICT (id) DO NOTHING;

-- Insert payment methods
INSERT INTO payment_methods (id, name, type, active, configuration, instructions, created_at, updated_at) VALUES
(1, 'Pago Móvil', 'pago_movil', true, '{"banks": ["Banesco", "Mercantil", "Venezuela", "Provincial", "Bicentenario", "Tesoro"]}'::jsonb, 'Realiza tu pago móvil y sube el comprobante. Asegúrate de incluir tu cédula, teléfono y banco.', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(2, 'Transferencia Bancaria', 'bank_transfer', true, '{"account_number": "0102-0000-0000000000-00", "account_holder": "FloresYa C.A.", "bank": "Banesco", "rif": "J-12345678-9"}'::jsonb, 'Realiza la transferencia a nuestra cuenta y sube el comprobante de pago.', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(3, 'Zelle', 'zelle', true, '{"email": "payments@floresya.com"}'::jsonb, 'Envía tu pago por Zelle a nuestra cuenta registrada y proporciona el número de confirmación.', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(4, 'Binance Pay', 'binance_pay', true, '{"user_id": "FloresYaVE"}'::jsonb, 'Utiliza Binance Pay para realizar tu pago y proporciona el ID de transacción.', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00')
ON CONFLICT (id) DO NOTHING;

-- Insert products
INSERT INTO products (id, name, description, price, category_id, stock_quantity, image_url, additional_images, active, featured, show_on_homepage, homepage_order, occasion, created_at, updated_at) VALUES
(1, 'Rosas Rojas Clásicas', 'Docena de rosas rojas frescas, perfectas para expresar amor y pasión', 25.00, 1, 50, '/images/products/red-roses-classic.jpg', '[]'::jsonb, true, true, false, 0, 'valentine', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(2, 'Bouquet Primaveral', 'Hermoso ramo mixto con flores de temporada en tonos pasteles', 35.00, 3, 30, '/images/products/spring-bouquet.jpg', '[]'::jsonb, true, true, false, 0, 'birthday', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(3, 'Arreglo de Mesa Elegante', 'Sofisticado arreglo floral para centros de mesa en eventos especiales', 45.00, 2, 20, '/images/products/elegant-table.jpg', '[]'::jsonb, true, false, false, 0, 'wedding', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(4, 'Rosa Blanca Premium', 'Rosas blancas de la más alta calidad, símbolo de pureza y elegancia', 30.00, 1, 40, '/images/products/white-roses-premium.jpg', '[]'::jsonb, true, true, false, 0, 'wedding', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(5, 'Plantas Suculentas', 'Colección de suculentas decorativas de bajo mantenimiento', 18.00, 4, 60, '/images/products/succulents.jpg', '[]'::jsonb, true, false, false, 0, 'other', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(6, 'Bouquet de Girasoles', 'Radiante ramo de girasoles que transmite alegría y energía positiva', 28.00, 3, 35, '/images/products/sunflower-bouquet.jpg', '[]'::jsonb, true, false, false, 0, 'birthday', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(7, 'Arreglo Fúnebre', 'Respetuoso arreglo floral para expresar condolencias', 55.00, 2, 15, '/images/products/funeral-arrangement.jpg', '[]'::jsonb, true, false, false, 0, 'funeral', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(8, 'Rosas Rosadas Románticas', 'Delicadas rosas rosadas que expresan admiración y gratitud', 27.00, 1, 45, '/images/products/pink-roses-romantic.jpg', '[]'::jsonb, true, false, false, 0, 'anniversary', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(9, 'Orquídeas Exóticas', 'Elegantes orquídeas para decoración sofisticada', 42.00, 4, 25, '/images/products/exotic-orchids.jpg', '[]'::jsonb, true, true, false, 0, 'other', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(10, 'Ramo de Novia Clásico', 'Hermoso ramo nupcial con rosas blancas y baby breath', 75.00, 5, 10, '/images/products/bridal-bouquet.jpg', '[]'::jsonb, true, true, false, 0, 'wedding', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00')
ON CONFLICT (id) DO NOTHING;

-- Insert users
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, email_verified, active, created_at, updated_at) VALUES
(1, 'admin@floresya.com', '$2a$12$ANrz/pV805d3OgieVJaOLONo1Up.ZnCclXj0wNOqLXdDISweRscDu', 'Admin', 'FloresYa', '+58414-1234567', 'admin', true, true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(2, 'cliente@ejemplo.com', '$2a$12$hmTbO9ZRJ7GJvdY5qhmDgeoo/E4SR6tyP2zndWs8.pm14ROdyRbuS', 'María', 'González', '+58416-7654321', 'customer', true, true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(3, 'juan@ejemplo.com', '$2a$12$hmTbO9ZRJ7GJvdY5qhmDgeoo/E4SR6tyP2zndWs8.pm14ROdyRbuS', 'Juan', 'Pérez', '+58412-9876543', 'customer', true, true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00')
ON CONFLICT (id) DO NOTHING;

-- Insert addresses
INSERT INTO addresses (id, user_id, type, first_name, last_name, company, address_line_1, address_line_2, city, state, postal_code, country, phone, is_default, created_at, updated_at) VALUES
(1, 2, 'shipping', 'María', 'González', null, 'Av. Francisco de Miranda, Edificio Los Rosales, Apto 15-B', null, 'Caracas', 'Distrito Capital', null, 'Venezuela', '+58416-7654321', true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(2, 3, 'shipping', 'Juan', 'Pérez', null, 'Calle Real de Sabana Grande, Centro Comercial City Market', null, 'Caracas', 'Distrito Capital', null, 'Venezuela', '+58412-9876543', true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00')
ON CONFLICT (id) DO NOTHING;

-- Insert orders
INSERT INTO orders (id, order_number, user_id, guest_email, status, total_amount, currency, shipping_address, billing_address, notes, delivery_date, delivery_time_slot, created_at, updated_at) VALUES
(1, 'FL-20241201-001', 2, null, 'preparing', 60.00, 'USD', '{"first_name": "María", "last_name": "González", "address_line_1": "Av. Francisco de Miranda, Edificio Los Rosales, Apto 15-B", "city": "Caracas", "state": "Distrito Capital", "phone": "+58416-7654321"}'::jsonb, null, null, '2024-12-15', null, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(2, 'FL-20241201-002', 3, null, 'verified', 105.00, 'USD', '{"first_name": "Juan", "last_name": "Pérez", "address_line_1": "Calle Real de Sabana Grande, Centro Comercial City Market", "city": "Caracas", "state": "Distrito Capital", "phone": "+58412-9876543"}'::jsonb, null, null, '2024-12-16', null, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(3, 'FL-20241201-003', null, null, 'pending', 25.00, 'USD', '{"first_name": "Ana", "last_name": "López", "address_line_1": "Av. Urdaneta, Torre Urdaneta, Piso 5", "city": "Caracas", "state": "Distrito Capital", "phone": "+58424-5555555"}'::jsonb, null, null, '2024-12-17', null, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00')
ON CONFLICT (id) DO NOTHING;

-- Insert order items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price, product_snapshot, created_at) VALUES
(1, 1, 1, 2, 25.00, 50.00, '{"name": "Rosas Rojas Clásicas", "price": 25.00}'::jsonb, '2025-09-01 19:07:57+00'),
(2, 1, 5, 1, 18.00, 18.00, '{"name": "Plantas Suculentas", "price": 18.00}'::jsonb, '2025-09-01 19:07:57+00'),
(3, 2, 2, 1, 35.00, 35.00, '{"name": "Bouquet Primaveral", "price": 35.00}'::jsonb, '2025-09-01 19:07:57+00'),
(4, 2, 3, 1, 45.00, 45.00, '{"name": "Arreglo de Mesa Elegante", "price": 45.00}'::jsonb, '2025-09-01 19:07:57+00'),
(5, 2, 1, 1, 25.00, 25.00, '{"name": "Rosas Rojas Clásicas", "price": 25.00}'::jsonb, '2025-09-01 19:07:57+00'),
(6, 3, 1, 1, 25.00, 25.00, '{"name": "Rosas Rojas Clásicas", "price": 25.00}'::jsonb, '2025-09-01 19:07:57+00')
ON CONFLICT (id) DO NOTHING;

-- Insert payments
INSERT INTO payments (id, order_id, payment_method_id, amount, currency, status, reference_number, payment_details, proof_image_url, verified_by, verified_at, notes, created_at, updated_at) VALUES
(1, 1, 2, 60.00, 'USD', 'verified', 'TRF-20241201-001', '{"bank": "Banesco", "reference": "123456789", "date": "2024-12-01"}'::jsonb, null, null, null, null, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(2, 2, 1, 105.00, 'USD', 'verified', 'PM-20241201-001', '{"bank": "Mercantil", "cedula": "V-87654321", "phone": "04127777777"}'::jsonb, null, null, null, null, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(3, 3, 3, 25.00, 'USD', 'pending', 'ZEL-20241201-001', '{"sender_email": "ana.lopez@email.com", "confirmation_id": "ZEL123456"}'::jsonb, null, null, null, null, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00')
ON CONFLICT (id) DO NOTHING;

-- Insert order status history
INSERT INTO order_status_history (id, order_id, old_status, new_status, notes, changed_by, created_at) VALUES
(1, 1, 'pending', 'verified', 'Pago verificado correctamente', 1, '2025-09-01 19:07:57+00'),
(2, 1, 'verified', 'preparing', 'Iniciando preparación del pedido', 1, '2025-09-01 19:07:57+00'),
(3, 2, 'pending', 'verified', 'Pago móvil confirmado', 1, '2025-09-01 19:07:57+00'),
(4, 3, 'pending', 'pending', 'Orden creada', null, '2025-09-01 19:07:57+00')
ON CONFLICT (id) DO NOTHING;

-- Insert carousel images
INSERT INTO carousel_images (id, title, description, image_url, link_url, display_order, active, created_at, updated_at) VALUES
(1, 'Rosas Especiales', 'Arreglos únicos de rosas para ocasiones especiales', '/images/carousel/roses-special.jpg', '/productos?categoria=rosas', 1, true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(2, 'Flores de Temporada', 'Las mejores flores frescas de la temporada', '/images/carousel/seasonal-flowers.jpg', '/productos', 2, true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(3, 'Bodas y Eventos', 'Arreglos florales para bodas y eventos especiales', '/images/carousel/wedding-arrangements.jpg', '/productos?ocasion=wedding', 3, true, '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(4, 'Día de la Madre', 'Hermosos arreglos florales para el día de la madre', '/images/carousel/mothers-day.jpg', '/productos?ocasion=mother', 4, true, '2025-09-01 19:08:19.551+00', '2025-09-01 19:08:19.551+00')
ON CONFLICT (id) DO NOTHING;

-- Insert settings
INSERT INTO settings (id, setting_key, setting_value, description, created_at, updated_at) VALUES
(1, 'homepage_featured_title', 'Productos Destacados', 'Título de la sección de productos destacados en homepage', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(2, 'homepage_featured_subtitle', 'Descubre nuestras mejores ofertas y productos especiales', 'Subtítulo de la sección de productos destacados', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(3, 'homepage_hero_title', '¡Bienvenidos a FloresYa!', 'Título principal del hero de homepage', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(4, 'homepage_hero_subtitle', 'Las flores más hermosas para tus momentos especiales', 'Subtítulo del hero de homepage', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(5, 'carousel_section_title', 'Nuestras Creaciones Destacadas', 'Título de la sección del carousel', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(6, 'carousel_section_subtitle', 'Descubre nuestros arreglos más populares', 'Subtítulo de la sección del carousel', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(7, 'site_name', 'FloresYa', 'Nombre del sitio web', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(8, 'site_description', 'Tu floristería en línea de confianza', 'Descripción del sitio', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(9, 'contact_email', 'contacto@floresya.com', 'Email de contacto', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(10, 'contact_phone', '+58412-1234567', 'Teléfono de contacto', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(11, 'currency', 'USD', 'Moneda principal del sitio', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(12, 'tax_rate', '0.00', 'Tasa de impuestos (0% para Venezuela)', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(13, 'shipping_fee', '5.00', 'Costo de envío estándar', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(14, 'min_order_free_shipping', '50.00', 'Monto mínimo para envío gratis', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(15, 'business_hours', '{"monday": "8:00-18:00", "tuesday": "8:00-18:00", "wednesday": "8:00-18:00", "thursday": "8:00-18:00", "friday": "8:00-18:00", "saturday": "9:00-16:00", "sunday": "closed"}', 'Horarios de atención', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(16, 'demo_mode', 'true', 'Indica si la aplicación está en modo demostración', '2025-09-01 19:07:57+00', '2025-09-01 19:07:57+00'),
(17, 'exchange_rate_bcv', '36.5', null, '2025-09-01 20:29:13+00', '2025-09-01 20:29:13+00')
ON CONFLICT (id) DO NOTHING;

-- Update sequences to the correct values after inserting data
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('addresses_id_seq', (SELECT MAX(id) FROM addresses));
SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));
SELECT setval('order_items_id_seq', (SELECT MAX(id) FROM order_items));
SELECT setval('payment_methods_id_seq', (SELECT MAX(id) FROM payment_methods));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('order_status_history_id_seq', (SELECT MAX(id) FROM order_status_history));
SELECT setval('carousel_images_id_seq', (SELECT MAX(id) FROM carousel_images));
SELECT setval('settings_id_seq', (SELECT MAX(id) FROM settings));