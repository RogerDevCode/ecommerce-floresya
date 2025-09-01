-- Sample data for FloresYa E-commerce
-- PostgreSQL Version

\c floresya_db;

-- Insert categories
INSERT INTO categories (name, description, image_url, active) VALUES
('Rosas', 'Hermosas rosas frescas para toda ocasión', '/images/categories/roses.jpg', TRUE),
('Arreglos de Mesa', 'Elegantes arreglos florales para decorar tu mesa', '/images/categories/table-arrangements.jpg', TRUE),
('Bouquets', 'Ramos de flores perfectos para regalar', '/images/categories/bouquets.jpg', TRUE),
('Plantas', 'Plantas decorativas para el hogar y oficina', '/images/categories/plants.jpg', TRUE),
('Bodas', 'Arreglos especiales para el día más importante', '/images/categories/weddings.jpg', TRUE);

-- Insert payment methods
INSERT INTO payment_methods (name, type, active, configuration, instructions) VALUES
('Pago Móvil', 'pago_movil', TRUE, 
 '{"banks": ["Banesco", "Mercantil", "Venezuela", "Provincial", "Bicentenario", "Tesoro"]}',
 'Realiza tu pago móvil y sube el comprobante. Asegúrate de incluir tu cédula, teléfono y banco.'),
('Transferencia Bancaria', 'bank_transfer', TRUE,
 '{"account_number": "0102-0000-0000000000-00", "account_holder": "FloresYa C.A.", "bank": "Banesco", "rif": "J-12345678-9"}',
 'Realiza la transferencia a nuestra cuenta y sube el comprobante de pago.'),
('Zelle', 'zelle', TRUE,
 '{"email": "payments@floresya.com"}',
 'Envía tu pago por Zelle a nuestra cuenta registrada y proporciona el número de confirmación.'),
('Binance Pay', 'binance_pay', TRUE,
 '{"user_id": "FloresYaVE"}',
 'Utiliza Binance Pay para realizar tu pago y proporciona el ID de transacción.');

-- Insert sample products
INSERT INTO products (name, description, price, category_id, stock_quantity, image_url, occasion, featured) VALUES
('Rosas Rojas Clásicas', 'Docena de rosas rojas frescas, perfectas para expresar amor y pasión', 25.00, 1, 50, '/images/products/red-roses-classic.jpg', 'valentine', TRUE),
('Bouquet Primaveral', 'Hermoso ramo mixto con flores de temporada en tonos pasteles', 35.00, 3, 30, '/images/products/spring-bouquet.jpg', 'birthday', TRUE),
('Arreglo de Mesa Elegante', 'Sofisticado arreglo floral para centros de mesa en eventos especiales', 45.00, 2, 20, '/images/products/elegant-table.jpg', 'wedding', FALSE),
('Rosa Blanca Premium', 'Rosas blancas de la más alta calidad, símbolo de pureza y elegancia', 30.00, 1, 40, '/images/products/white-roses-premium.jpg', 'wedding', TRUE),
('Plantas Suculentas', 'Colección de suculentas decorativas de bajo mantenimiento', 18.00, 4, 60, '/images/products/succulents.jpg', 'other', FALSE),
('Bouquet de Girasoles', 'Radiante ramo de girasoles que transmite alegría y energía positiva', 28.00, 3, 35, '/images/products/sunflower-bouquet.jpg', 'birthday', FALSE),
('Arreglo Fúnebre', 'Respetuoso arreglo floral para expresar condolencias', 55.00, 2, 15, '/images/products/funeral-arrangement.jpg', 'funeral', FALSE),
('Rosas Rosadas Románticas', 'Delicadas rosas rosadas que expresan admiración y gratitud', 27.00, 1, 45, '/images/products/pink-roses-romantic.jpg', 'anniversary', FALSE);

-- Insert admin user (password: admin123)
-- Hash generated with: bcryptjs.hashSync('admin123', 12)
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified, active) VALUES
('admin@floresya.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/QFmmUr8gJnuTAUj4i', 'Admin', 'FloresYa', '+58414-1234567', 'admin', TRUE, TRUE);

-- Insert sample customer (password: customer123)
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified, active) VALUES
('cliente@ejemplo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/QFmmUr8gJnuTAUj4i', 'María', 'González', '+58416-7654321', 'customer', TRUE, TRUE);

-- Insert sample address
INSERT INTO addresses (user_id, type, first_name, last_name, address_line_1, city, state, phone, is_default) VALUES
(2, 'shipping', 'María', 'González', 'Av. Francisco de Miranda, Edificio Los Rosales, Apto 15-B', 'Caracas', 'Distrito Capital', '+58416-7654321', TRUE);

-- Insert sample order
INSERT INTO orders (order_number, user_id, status, total_amount, shipping_address, delivery_date) VALUES
('FL-2024-001', 2, 'preparing', 60.00, 
'{"first_name": "María", "last_name": "González", "address_line_1": "Av. Francisco de Miranda, Edificio Los Rosales, Apto 15-B", "city": "Caracas", "state": "Distrito Capital", "phone": "+58416-7654321"}',
'2024-02-15');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 2, 25.00, 50.00),
(1, 5, 1, 18.00, 18.00);

-- Insert sample payment
INSERT INTO payments (order_id, payment_method_id, amount, status, reference_number, payment_details) VALUES
(1, 2, 60.00, 'verified', 'TRF-20240214-001', '{"bank": "Banesco", "reference": "123456789", "date": "2024-02-14"}');

-- Insert application settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('site_name', 'FloresYa', 'Nombre del sitio web'),
('site_description', 'Tu floristería en línea de confianza', 'Descripción del sitio'),
('contact_email', 'contacto@floresya.com', 'Email de contacto'),
('contact_phone', '+58412-1234567', 'Teléfono de contacto'),
('currency', 'USD', 'Moneda principal del sitio'),
('tax_rate', '0.00', 'Tasa de impuestos (0% para Venezuela)'),
('shipping_fee', '5.00', 'Costo de envío estándar'),
('min_order_free_shipping', '50.00', 'Monto mínimo para envío gratis'),
('business_hours', '{"monday": "8:00-18:00", "tuesday": "8:00-18:00", "wednesday": "8:00-18:00", "thursday": "8:00-18:00", "friday": "8:00-18:00", "saturday": "9:00-16:00", "sunday": "closed"}', 'Horarios de atención');