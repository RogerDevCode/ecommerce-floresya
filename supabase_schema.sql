-- 🌸 FloresYa Database Schema
-- Generated: 2025-09-26T17:12:16.073Z
-- Extracted using table sampling method

-- Table: products
-- Sample structure based on existing data:
CREATE TABLE public.products (
  id uuid,
  name varchar(255),
  summary varchar(255),
  description varchar(418),
  price_usd numeric,
  price_ves integer,
  stock integer,
  sku varchar(255),
  active boolean,
  featured boolean,
  carousel_order integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Table: product_images
-- Sample structure based on existing data:
CREATE TABLE public.product_images (
  id uuid,
  product_id uuid,
  image_index integer,
  size varchar(255),
  url varchar(255),
  file_hash varchar(255),
  mime_type varchar(255),
  is_primary boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Table: occasions
-- Sample structure based on existing data:
CREATE TABLE public.occasions (
  id uuid,
  name varchar(255),
  description varchar(255),
  is_active boolean,
  display_order integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  slug varchar(255)
);

-- Table: orders
-- Empty table
CREATE TABLE public.orders (
  -- Structure unknown (empty table)
);

-- Table: order_items
-- Empty table
CREATE TABLE public.order_items (
  -- Structure unknown (empty table)
);

-- Table: order_status_history
-- Empty table
CREATE TABLE public.order_status_history (
  -- Structure unknown (empty table)
);

-- Table: users
-- Sample structure based on existing data:
CREATE TABLE public.users (
  id uuid,
  email varchar(255),
  password_hash text,
  full_name varchar(255),
  phone varchar(255),
  role varchar(255),
  is_active boolean,
  email_verified boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Table: logs (access restricted)

-- NOTES:
-- This schema was extracted by sampling existing data
-- Column types are inferred from JavaScript types and may not match exact PostgreSQL definitions
-- For authoritative schema, use Supabase Dashboard or pg_dump with direct database access
-- Generated on: 2025-09-26T17:12:19.658Z
