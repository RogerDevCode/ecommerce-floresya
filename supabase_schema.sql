-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.occasions (
  id integer NOT NULL DEFAULT nextval('occasions_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  type USER-DEFINED DEFAULT 'general'::occasion_type,
  description text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  slug character varying NOT NULL UNIQUE,
  CONSTRAINT occasions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id integer NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id integer NOT NULL,
  product_id integer,
  product_name character varying NOT NULL,
  product_summary text,
  unit_price_usd numeric NOT NULL CHECK (unit_price_usd >= 0::numeric),
  unit_price_ves numeric,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal_usd numeric NOT NULL CHECK (subtotal_usd >= 0::numeric),
  subtotal_ves numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.order_status_history (
  id integer NOT NULL DEFAULT nextval('order_status_history_id_seq'::regclass),
  order_id integer NOT NULL,
  old_status USER-DEFINED,
  new_status USER-DEFINED NOT NULL,
  notes text,
  changed_by integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);
CREATE TABLE public.orders (
  id integer NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  user_id integer,
  customer_email character varying NOT NULL,
  customer_name character varying NOT NULL,
  customer_phone character varying,
  delivery_address text NOT NULL,
  delivery_city character varying,
  delivery_state character varying,
  delivery_zip character varying,
  delivery_date date,
  delivery_time_slot character varying,
  delivery_notes text,
  status USER-DEFINED DEFAULT 'pending'::order_status,
  total_amount_usd numeric NOT NULL CHECK (total_amount_usd >= 0::numeric),
  total_amount_ves numeric,
  currency_rate numeric,
  notes text,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.payment_methods (
  id integer NOT NULL DEFAULT nextval('payment_methods_id_seq'::regclass),
  name character varying NOT NULL,
  type USER-DEFINED NOT NULL,
  description text,
  account_info jsonb,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payments (
  id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
  order_id integer NOT NULL,
  payment_method_id integer,
  user_id integer,
  amount_usd numeric NOT NULL CHECK (amount_usd >= 0::numeric),
  amount_ves numeric,
  currency_rate numeric,
  status USER-DEFINED DEFAULT 'pending'::payment_status,
  payment_method_name character varying NOT NULL,
  transaction_id character varying,
  reference_number character varying,
  payment_details jsonb,
  receipt_image_url text,
  admin_notes text,
  payment_date timestamp with time zone,
  confirmed_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.product_images (
  id integer NOT NULL DEFAULT nextval('product_images_id_seq'::regclass),
  product_id integer NOT NULL,
  image_index integer NOT NULL CHECK (image_index > 0),
  size USER-DEFINED NOT NULL,
  url text NOT NULL,
  file_hash character varying NOT NULL,
  mime_type character varying NOT NULL DEFAULT 'image/webp'::character varying,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_occasions (
  id integer NOT NULL DEFAULT nextval('product_occasions_id_seq'::regclass),
  product_id integer NOT NULL,
  occasion_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_occasions_pkey PRIMARY KEY (id),
  CONSTRAINT product_occasions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_occasions_occasion_id_fkey FOREIGN KEY (occasion_id) REFERENCES public.occasions(id)
);
CREATE TABLE public.products (
  id integer NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  name character varying NOT NULL,
  summary text,
  description text,
  price_usd numeric NOT NULL CHECK (price_usd >= 0::numeric),
  price_ves numeric,
  stock integer DEFAULT 0 CHECK (stock >= 0),
  sku character varying UNIQUE,
  active boolean DEFAULT true,
  featured boolean DEFAULT false,
  carousel_order integer CHECK (carousel_order >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.settings (
  id integer NOT NULL DEFAULT nextval('settings_id_seq'::regclass),
  key character varying NOT NULL UNIQUE,
  value text,
  description text,
  type character varying DEFAULT 'string'::character varying,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  password_hash text,
  full_name character varying,
  phone character varying,
  role USER-DEFINED DEFAULT 'user'::user_role,
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- =============================================================================
-- STORED PROCEDURES FOR TRANSACTIONS
-- =============================================================================

-- Function to create product with occasions in a single transaction
CREATE OR REPLACE FUNCTION create_product_with_occasions(
  product_data jsonb,
  occasion_ids integer[]
)
RETURNS TABLE(
  id integer,
  name varchar,
  description text,
  summary text,
  price_usd numeric,
  price_ves numeric,
  stock integer,
  sku varchar,
  featured boolean,
  active boolean,
  carousel_order integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  product_id integer;
  occasion_id integer;
BEGIN
  -- Start transaction (implicit)
  
  -- Insert the product
  INSERT INTO products (
    name, 
    description, 
    summary, 
    price_usd, 
    price_ves, 
    stock, 
    sku, 
    featured, 
    active, 
    carousel_order,
    created_at,
    updated_at
  )
  VALUES (
    (product_data->>'name')::varchar,
    (product_data->>'description')::text,
    (product_data->>'summary')::text,
    (product_data->>'price_usd')::numeric,
    (product_data->>'price_ves')::numeric,
    (product_data->>'stock')::integer,
    (product_data->>'sku')::varchar,
    COALESCE((product_data->>'featured')::boolean, false),
    COALESCE((product_data->>'active')::boolean, true),
    (product_data->>'carousel_order')::integer,
    NOW(),
    NOW()
  )
  RETURNING products.id INTO product_id;
  
  -- Insert occasion associations
  FOREACH occasion_id IN ARRAY occasion_ids
  LOOP
    INSERT INTO product_occasions (product_id, occasion_id, created_at)
    VALUES (product_id, occasion_id, NOW());
  END LOOP;
  
  -- Return the created product
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.summary,
    p.price_usd,
    p.price_ves,
    p.stock,
    p.sku,
    p.featured,
    p.active,
    p.carousel_order,
    p.created_at,
    p.updated_at
  FROM products p
  WHERE p.id = product_id;
  
  -- Transaction commits automatically on successful completion
  
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction rolls back automatically on error
    RAISE EXCEPTION 'Failed to create product with occasions: %', SQLERRM;
END;
$$;
