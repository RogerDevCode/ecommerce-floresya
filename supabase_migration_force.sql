-- FloresYa E-commerce Database Migration Script - FORCE MODE
-- MIGRACIÓN FORZADA CON CASCADE PARA RESOLVER DEPENDENCIAS COMPLEJAS
-- ⚠️  ESTE SCRIPT ELIMINA TODOS LOS DATOS Y DEPENDENCIAS DE FORMA AGRESIVA

-- ============================================================================
-- INFORMACIÓN INICIAL
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🚨 MIGRACIÓN FORZADA DE FLORESYA';
    RAISE NOTICE '=================================';
    RAISE NOTICE '⚠️  Se eliminarán TODAS las tablas, triggers y funciones';
    RAISE NOTICE '⚠️  Usando CASCADE para resolver dependencias automáticamente';
    RAISE NOTICE 'Fecha: %', NOW()::DATE;
    RAISE NOTICE 'Hora: %', NOW()::TIME;
END $$;

-- ============================================================================
-- FASE 1: ELIMINACIÓN FORZADA DE TODO EL ESQUEMA
-- ============================================================================

-- Eliminar TODAS las funciones que puedan tener dependencias
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Eliminar todas las tablas conocidas con CASCADE (elimina automáticamente triggers y FK)
DROP TABLE IF EXISTS product_occasions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS carousel_images CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS occasions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Eliminar tablas obsoletas/adicionales que puedan existir
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;

-- Eliminar todos los tipos personalizados
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS address_type CASCADE;
DROP TYPE IF EXISTS occasion_type CASCADE;

-- ============================================================================
-- FASE 2: RECREACIÓN COMPLETA DEL ESQUEMA
-- ============================================================================

-- Crear tipos personalizados (enums)
CREATE TYPE user_role AS ENUM ('admin', 'user', 'guest');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled', 'refunded');
CREATE TYPE payment_method_type AS ENUM ('bank_transfer', 'mobile_payment', 'cash', 'crypto', 'international');
CREATE TYPE occasion_type AS ENUM ('birthday', 'anniversary', 'valentines', 'mothers_day', 'fathers_day', 'graduation', 'condolence', 'general');

-- ============================================================================
-- TABLA: users (base - sin dependencias)
-- ============================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: occasions (base - sin dependencias)  
-- ============================================================================

CREATE TABLE occasions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type occasion_type DEFAULT 'general',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: products (base - sin dependencias)
-- ============================================================================

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    summary TEXT,
    description TEXT,
    price_usd DECIMAL(10,2) NOT NULL CHECK (price_usd >= 0),
    price_ves DECIMAL(15,2),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    occasion VARCHAR(100), -- Campo simple para ocasión
    sku VARCHAR(100) UNIQUE,
    image_url TEXT,
    additional_images TEXT[], -- Array de URLs de imágenes
    active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: payment_methods (base - sin dependencias)
-- ============================================================================

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type payment_method_type NOT NULL,
    description TEXT,
    account_info JSONB, -- Información de la cuenta (número, titular, etc.)
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: carousel_images (base - sin dependencias)
-- ============================================================================

CREATE TABLE carousel_images (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    link_url TEXT,
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: settings (base - sin dependencias)
-- ============================================================================

CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    is_public BOOLEAN DEFAULT false, -- Si se puede acceder desde frontend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: orders (depende de users)
-- ============================================================================

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Información del cliente (puede no estar registrado)
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    
    -- Información de entrega
    delivery_address TEXT NOT NULL,
    delivery_city VARCHAR(100),
    delivery_state VARCHAR(100),
    delivery_zip VARCHAR(20),
    delivery_date DATE,
    delivery_time_slot VARCHAR(50),
    delivery_notes TEXT,
    
    -- Información del pedido
    status order_status DEFAULT 'pending',
    total_amount_usd DECIMAL(10,2) NOT NULL CHECK (total_amount_usd >= 0),
    total_amount_ves DECIMAL(15,2),
    currency_rate DECIMAL(10,4), -- Tasa de cambio al momento del pedido
    
    -- Metadatos
    notes TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: order_items (depende de orders + products)
-- ============================================================================

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    
    -- Información del producto (snapshot al momento del pedido)
    product_name VARCHAR(255) NOT NULL,
    product_summary TEXT,
    unit_price_usd DECIMAL(10,2) NOT NULL CHECK (unit_price_usd >= 0),
    unit_price_ves DECIMAL(15,2),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    
    -- Totales calculados
    subtotal_usd DECIMAL(10,2) NOT NULL CHECK (subtotal_usd >= 0),
    subtotal_ves DECIMAL(15,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: payments (depende de orders + payment_methods + users)
-- ============================================================================

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Información del pago
    amount_usd DECIMAL(10,2) NOT NULL CHECK (amount_usd >= 0),
    amount_ves DECIMAL(15,2),
    currency_rate DECIMAL(10,4),
    status payment_status DEFAULT 'pending',
    
    -- Detalles del pago
    payment_method_name VARCHAR(100) NOT NULL, -- Snapshot del método
    transaction_id VARCHAR(255),
    reference_number VARCHAR(255),
    payment_details JSONB, -- Detalles específicos del método de pago
    
    -- Archivos de comprobante
    receipt_image_url TEXT,
    admin_notes TEXT,
    
    -- Fechas
    payment_date TIMESTAMP WITH TIME ZONE,
    confirmed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: product_occasions (depende de products + occasions)
-- ============================================================================

CREATE TABLE product_occasions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    occasion_id INTEGER NOT NULL REFERENCES occasions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar duplicados
    UNIQUE(product_id, occasion_id)
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Productos
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_occasion ON products(occasion);
CREATE INDEX idx_products_price_usd ON products(price_usd);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('spanish', name));

-- Pedidos
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Items de pedido
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Pagos
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);

-- Ocasiones de productos
CREATE INDEX idx_product_occasions_product_id ON product_occasions(product_id);
CREATE INDEX idx_product_occasions_occasion_id ON product_occasions(occasion_id);

-- Métodos de pago
CREATE INDEX idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX idx_payment_methods_type ON payment_methods(type);

-- Carrusel
CREATE INDEX idx_carousel_images_active ON carousel_images(is_active);
CREATE INDEX idx_carousel_images_order ON carousel_images(display_order);

-- Ocasiones
CREATE INDEX idx_occasions_active ON occasions(is_active);
CREATE INDEX idx_occasions_type ON occasions(type);

-- ============================================================================
-- FUNCIÓN Y TRIGGERS PARA updated_at AUTOMÁTICO
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at en todas las tablas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_occasions_updated_at BEFORE UPDATE ON occasions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carousel_images_updated_at BEFORE UPDATE ON carousel_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_occasions_updated_at BEFORE UPDATE ON product_occasions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ MIGRACIÓN FORZADA COMPLETADA';
    RAISE NOTICE '================================';
    RAISE NOTICE '📊 Tablas creadas: users, products, occasions, payment_methods, carousel_images, settings, orders, order_items, payments, product_occasions';
    RAISE NOTICE '🗑️  Tablas eliminadas: categories (obsoleta)';
    RAISE NOTICE '🔧 Triggers configurados para updated_at automático';
    RAISE NOTICE '📊 Índices optimizados creados';
    RAISE NOTICE '🎯 Listo para ejecutar supabase_seed_data.sql';
    RAISE NOTICE '';
END $$;