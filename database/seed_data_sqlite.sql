-- Sample data for FloresYa E-commerce
-- SQLite Version

-- Insert categories
INSERT OR IGNORE INTO categories (name, description, image_url, active) VALUES
('Rosas', 'Hermosas rosas frescas para toda ocasión', '/images/categories/roses.jpg', 1),
('Arreglos de Mesa', 'Elegantes arreglos florales para decorar tu mesa', '/images/categories/table-arrangements.jpg', 1),
('Bouquets', 'Ramos de flores perfectos para regalar', '/images/categories/bouquets.jpg', 1),
('Plantas', 'Plantas decorativas para el hogar y oficina', '/images/categories/plants.jpg', 1),
('Bodas', 'Arreglos especiales para el día más importante', '/images/categories/weddings.jpg', 1);

-- Insert payment methods
INSERT OR IGNORE INTO payment_methods (name, type, active, configuration, instructions) VALUES
('Pago Móvil', 'pago_movil', 1, 
 '{"banks": ["Banesco", "Mercantil", "Venezuela", "Provincial", "Bicentenario", "Tesoro"]}',
 'Realiza tu pago móvil y sube el comprobante. Asegúrate de incluir tu cédula, teléfono y banco.'),
('Transferencia Bancaria', 'bank_transfer', 1,
 '{"account_number": "0102-0000-0000000000-00", "account_holder": "FloresYa C.A.", "bank": "Banesco", "rif": "J-12345678-9"}',
 'Realiza la transferencia a nuestra cuenta y sube el comprobante de pago.'),
('Zelle', 'zelle', 1,
 '{"email": "payments@floresya.com"}',
 'Envía tu pago por Zelle a nuestra cuenta registrada y proporciona el número de confirmación.'),
('Binance Pay', 'binance_pay', 1,
 '{"user_id": "FloresYaVE"}',
 'Utiliza Binance Pay para realizar tu pago y proporciona el ID de transacción.');

-- Insert sample products
INSERT OR IGNORE INTO products (name, description, price, category_id, stock_quantity, image_url, occasion, featured) VALUES
('Rosas Rojas Clásicas', 'Docena de rosas rojas frescas, perfectas para expresar amor y pasión', 25.00, 1, 50, '/images/products/red-roses-classic.jpg', 'valentine', 1),
('Bouquet Primaveral', 'Hermoso ramo mixto con flores de temporada en tonos pasteles', 35.00, 3, 30, '/images/products/spring-bouquet.jpg', 'birthday', 1),
('Arreglo de Mesa Elegante', 'Sofisticado arreglo floral para centros de mesa en eventos especiales', 45.00, 2, 20, '/images/products/elegant-table.jpg', 'wedding', 0),
('Rosa Blanca Premium', 'Rosas blancas de la más alta calidad, símbolo de pureza y elegancia', 30.00, 1, 40, '/images/products/white-roses-premium.jpg', 'wedding', 1),
('Plantas Suculentas', 'Colección de suculentas decorativas de bajo mantenimiento', 18.00, 4, 60, '/images/products/succulents.jpg', 'other', 0),
('Bouquet de Girasoles', 'Radiante ramo de girasoles que transmite alegría y energía positiva', 28.00, 3, 35, '/images/products/sunflower-bouquet.jpg', 'birthday', 0),
('Arreglo Fúnebre', 'Respetuoso arreglo floral para expresar condolencias', 55.00, 2, 15, '/images/products/funeral-arrangement.jpg', 'funeral', 0),
('Rosas Rosadas Románticas', 'Delicadas rosas rosadas que expresan admiración y gratitud', 27.00, 1, 45, '/images/products/pink-roses-romantic.jpg', 'anniversary', 0),
('Orquídeas Exóticas', 'Elegantes orquídeas para decoración sofisticada', 42.00, 4, 25, '/images/products/exotic-orchids.jpg', 'other', 1),
('Ramo de Novia Clásico', 'Hermoso ramo nupcial con rosas blancas y baby breath', 75.00, 5, 10, '/images/products/bridal-bouquet.jpg', 'wedding', 1);

-- Insert admin user (password: admin123)
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/QFmmUr8gJnuTAUj4i
INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, phone, role, email_verified, active) VALUES
('admin@floresya.com', '$2a$12$ANrz/pV805d3OgieVJaOLONo1Up.ZnCclXj0wNOqLXdDISweRscDu', 'Admin', 'FloresYa', '+58414-1234567', 'admin', 1, 1);

-- Insert sample customer (password: customer123)
INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, phone, role, email_verified, active) VALUES
('cliente@ejemplo.com', '$2a$12$hmTbO9ZRJ7GJvdY5qhmDgeoo/E4SR6tyP2zndWs8.pm14ROdyRbuS', 'María', 'González', '+58416-7654321', 'customer', 1, 1),
('juan@ejemplo.com', '$2a$12$hmTbO9ZRJ7GJvdY5qhmDgeoo/E4SR6tyP2zndWs8.pm14ROdyRbuS', 'Juan', 'Pérez', '+58412-9876543', 'customer', 1, 1);

-- Insert sample addresses
INSERT OR IGNORE INTO addresses (user_id, type, first_name, last_name, address_line_1, city, state, phone, is_default) VALUES
(2, 'shipping', 'María', 'González', 'Av. Francisco de Miranda, Edificio Los Rosales, Apto 15-B', 'Caracas', 'Distrito Capital', '+58416-7654321', 1),
(3, 'shipping', 'Juan', 'Pérez', 'Calle Real de Sabana Grande, Centro Comercial City Market', 'Caracas', 'Distrito Capital', '+58412-9876543', 1);

-- Insert sample orders
INSERT OR IGNORE INTO orders (order_number, user_id, status, total_amount, shipping_address, delivery_date) VALUES
('FL-20241201-001', 2, 'preparing', 60.00, 
'{"first_name": "María", "last_name": "González", "address_line_1": "Av. Francisco de Miranda, Edificio Los Rosales, Apto 15-B", "city": "Caracas", "state": "Distrito Capital", "phone": "+58416-7654321"}',
'2024-12-15'),
('FL-20241201-002', 3, 'verified', 105.00, 
'{"first_name": "Juan", "last_name": "Pérez", "address_line_1": "Calle Real de Sabana Grande, Centro Comercial City Market", "city": "Caracas", "state": "Distrito Capital", "phone": "+58412-9876543"}',
'2024-12-16'),
('FL-20241201-003', NULL, 'pending', 25.00, 
'{"first_name": "Ana", "last_name": "López", "address_line_1": "Av. Urdaneta, Torre Urdaneta, Piso 5", "city": "Caracas", "state": "Distrito Capital", "phone": "+58424-5555555"}',
'2024-12-17');

-- Insert order items
INSERT OR IGNORE INTO order_items (order_id, product_id, quantity, unit_price, total_price, product_snapshot) VALUES
(1, 1, 2, 25.00, 50.00, '{"name": "Rosas Rojas Clásicas", "price": 25.00}'),
(1, 5, 1, 18.00, 18.00, '{"name": "Plantas Suculentas", "price": 18.00}'),
(2, 2, 1, 35.00, 35.00, '{"name": "Bouquet Primaveral", "price": 35.00}'),
(2, 3, 1, 45.00, 45.00, '{"name": "Arreglo de Mesa Elegante", "price": 45.00}'),
(2, 1, 1, 25.00, 25.00, '{"name": "Rosas Rojas Clásicas", "price": 25.00}'),
(3, 1, 1, 25.00, 25.00, '{"name": "Rosas Rojas Clásicas", "price": 25.00}');

-- Insert sample payments
INSERT OR IGNORE INTO payments (order_id, payment_method_id, amount, status, reference_number, payment_details) VALUES
(1, 2, 60.00, 'verified', 'TRF-20241201-001', '{"bank": "Banesco", "reference": "123456789", "date": "2024-12-01"}'),
(2, 1, 105.00, 'verified', 'PM-20241201-001', '{"bank": "Mercantil", "cedula": "V-87654321", "phone": "04127777777"}'),
(3, 3, 25.00, 'pending', 'ZEL-20241201-001', '{"sender_email": "ana.lopez@email.com", "confirmation_id": "ZEL123456"}');

-- Insert order status history
INSERT OR IGNORE INTO order_status_history (order_id, old_status, new_status, notes, changed_by) VALUES
(1, 'pending', 'verified', 'Pago verificado correctamente', 1),
(1, 'verified', 'preparing', 'Iniciando preparación del pedido', 1),
(2, 'pending', 'verified', 'Pago móvil confirmado', 1),
(3, 'pending', 'pending', 'Orden creada', NULL);

-- Insert application settings
INSERT OR IGNORE INTO settings (setting_key, setting_value, description) VALUES
('site_name', 'FloresYa', 'Nombre del sitio web'),
('site_description', 'Tu floristería en línea de confianza', 'Descripción del sitio'),
('contact_email', 'contacto@floresya.com', 'Email de contacto'),
('contact_phone', '+58412-1234567', 'Teléfono de contacto'),
('currency', 'USD', 'Moneda principal del sitio'),
('tax_rate', '0.00', 'Tasa de impuestos (0% para Venezuela)'),
('shipping_fee', '5.00', 'Costo de envío estándar'),
('min_order_free_shipping', '50.00', 'Monto mínimo para envío gratis'),
('business_hours', '{"monday": "8:00-18:00", "tuesday": "8:00-18:00", "wednesday": "8:00-18:00", "thursday": "8:00-18:00", "friday": "8:00-18:00", "saturday": "9:00-16:00", "sunday": "closed"}', 'Horarios de atención'),
('demo_mode', 'true', 'Indica si la aplicación está en modo demostración');