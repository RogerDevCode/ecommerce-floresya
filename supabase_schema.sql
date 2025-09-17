-- =============================================================================
-- 🌸 FLORESYA E-COMMERCE DATABASE SCHEMA - ACTUALIZADO DESDE SUPABASE
-- =============================================================================
-- Schema actualizado basado en la estructura real de la base de datos
-- Extracción realizada en: 2025-09-17
-- Tablas confirmadas: 9
-- Total de registros: 246
-- Versión: 2.0.0
-- =============================================================================

-- =============================================================================
-- ENUM TYPES (Tipos Personalizados)
-- =============================================================================

-- Tipos de ocasiones para productos florales
CREATE TYPE occasion_type AS ENUM (
    'general',          -- Sin ocasión específica
    'birthday',         -- Cumpleaños
    'anniversary',      -- Aniversario
    'wedding',          -- Boda
    'sympathy',         -- Pésame
    'congratulations'   -- Felicitaciones
);

-- Estados de órdenes
CREATE TYPE order_status AS ENUM (
    'pending',          -- Pendiente de confirmación
    'confirmed',        -- Confirmada
    'preparing',        -- En preparación
    'ready',           -- Lista para entrega
    'delivered',       -- Entregada
    'cancelled'        -- Cancelada
);

-- Estados de pagos
CREATE TYPE payment_status AS ENUM (
    'pending',         -- Pendiente
    'confirmed',       -- Confirmado
    'failed',          -- Fallido
    'refunded'         -- Reembolsado
);

-- Métodos de pago disponibles
CREATE TYPE payment_method_type AS ENUM (
    'bank_transfer',   -- Transferencia bancaria
    'mobile_payment',  -- Pago móvil
    'cash',           -- Efectivo
    'card'            -- Tarjeta
);

-- Roles de usuario del sistema
CREATE TYPE user_role AS ENUM (
    'admin',          -- Administrador completo
    'user',           -- Usuario regular
    'support'         -- Soporte técnico
);

-- Tamaños de imágenes para optimización
CREATE TYPE image_size AS ENUM (
    'thumb',          -- Miniatura (pequeña)
    'small',          -- Pequeña
    'medium',         -- Mediana
    'large'           -- Grande
);

-- =============================================================================
-- TABLA: users (Users)
-- =============================================================================
-- Registros: 2

CREATE TABLE users (
    id SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- TABLA: products (Products)
-- =============================================================================
-- Registros: 20

CREATE TABLE products (
    id SERIAL PRIMARY KEY NOT NULL,
    active BOOLEAN DEFAULT NOT NULL,
    carousel_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    description VARCHAR(255) NOT NULL,
    featured BOOLEAN DEFAULT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    price_ves DECIMAL(15,2),
    sku VARCHAR(255) NOT NULL,
    stock INTEGER DEFAULT 0 NOT NULL,
    summary VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- TABLA: product_images (Product images)
-- =============================================================================
-- Registros: 160

CREATE TABLE product_images (
    id SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    file_hash VARCHAR(255) NOT NULL,
    image_index INTEGER NOT NULL,
    is_primary BOOLEAN DEFAULT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    product_id INTEGER NOT NULL,
    size VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    url VARCHAR(255) NOT NULL
);

-- =============================================================================
-- TABLA: occasions (Occasions)
-- =============================================================================
-- Registros: 8

CREATE TABLE occasions (
    id SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- TABLA: product_occasions (Product occasions)
-- =============================================================================
-- Registros: 56

CREATE TABLE product_occasions (
    id SERIAL PRIMARY KEY NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    occasion_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- TABLA: orders (Orders)
-- =============================================================================
-- Registros: 0

CREATE TABLE orders (

);

-- =============================================================================
-- TABLA: order_items (Order items)
-- =============================================================================
-- Registros: 0

CREATE TABLE order_items (

);

-- =============================================================================
-- TABLA: payments (Payments)
-- =============================================================================
-- Registros: 0

CREATE TABLE payments (

);

-- =============================================================================
-- TABLA: settings (Settings)
-- =============================================================================
-- Registros: 0

CREATE TABLE settings (

);

-- Índices para users
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Índices para products
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_carousel ON products(carousel_order) WHERE carousel_order IS NOT NULL;
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_price ON products(price_usd);

-- Índices para orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- =============================================================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- =============================================================================

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_occasions_updated_at BEFORE UPDATE ON occasions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCIONES DE UTILIDAD
-- =============================================================================

-- Función para obtener el stock disponible de un producto
CREATE OR REPLACE FUNCTION get_available_stock(product_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    current_stock INTEGER;
    reserved_stock INTEGER;
BEGIN
    -- Obtener stock actual
    SELECT stock INTO current_stock
    FROM products
    WHERE id = product_id_param AND active = true;

    IF current_stock IS NULL THEN
        RETURN 0;
    END IF;

    -- Obtener stock reservado en órdenes pendientes
    SELECT COALESCE(SUM(oi.quantity), 0) INTO reserved_stock
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = product_id_param
    AND o.status IN ('pending', 'confirmed', 'preparing');

    RETURN GREATEST(current_stock - reserved_stock, 0);
END;
$$ LANGUAGE plpgsql;

-- Función para calcular el total de una orden
CREATE OR REPLACE FUNCTION calculate_order_total(order_id_param INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_amount DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price_usd), 0) INTO total_amount
    FROM order_items
    WHERE order_id = order_id_param;

    RETURN total_amount;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VISTAS ÚTILES
-- =============================================================================

-- Vista para productos con información de imágenes primarias
CREATE VIEW products_with_primary_image AS
SELECT
    p.*,
    pi.url as primary_image_url,
    pi.file_hash as primary_image_hash
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true AND pi.size = 'thumb';

-- Vista para órdenes con información de cliente y estado de pago
CREATE VIEW orders_with_payment_status AS
SELECT
    o.*,
    p.status as payment_status,
    p.method as payment_method,
    p.amount_usd as paid_amount
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id;

-- =============================================================================
-- DATOS INICIALES (SEEDS)
-- =============================================================================

-- Insertar ocasiones básicas si no existen
INSERT INTO occasions (name, type, description) VALUES
('Sin ocasión específica', 'general', 'Para cualquier momento del año'),
('Cumpleaños', 'birthday', 'Celebración de cumpleaños'),
('Aniversario', 'anniversary', 'Conmemoración de aniversarios'),
('Boda', 'wedding', 'Celebraciones de matrimonio'),
('Pésame', 'sympathy', 'Momentos de duelo y condolencias'),
('Felicitaciones', 'congratulations', 'Logros y celebraciones especiales')
ON CONFLICT DO NOTHING;

-- Insertar usuario administrador por defecto si no existe
INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified) VALUES
('admin@floresya.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'Administrador FloresYa', 'admin', true, true)
ON CONFLICT (email) DO NOTHING;

-- Configuraciones básicas del sistema
INSERT INTO settings (key, value, description, data_type, is_public) VALUES
('site_name', 'FloresYa', 'Nombre del sitio web', 'string', true),
('site_description', 'Tu floristería en línea de confianza', 'Descripción del sitio', 'string', true),
('currency_primary', 'USD', 'Moneda principal del sitio', 'string', true),
('currency_secondary', 'VES', 'Moneda secundaria del sitio', 'string', true),
('delivery_enabled', 'true', 'Si está habilitada la entrega a domicilio', 'boolean', true),
('min_order_amount', '15.00', 'Monto mínimo de orden en USD', 'number', true)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- COMENTARIOS FINALES
-- =============================================================================

-- Este esquema fue generado automáticamente usando FloresYa Schema Extractor
-- Fecha de extracción: 2025-09-17
-- Versión: 2.0.0
-- Total de tablas: 9
-- Total de registros: 246
-- Total de índices: 12

-- Para actualizar este archivo ejecute:
-- npx ts-node scripts/schema-extractor.ts
-- o desde el panel de administrador: Configuración > Ver Esquema DB

-- Compatible con FloresYa TypeScript types y controllers
