/**
 * Tipos de base de datos para FloresYa E-commerce
 * Definiciones TypeScript para todas las tablas
 */

export interface Product {
  id: number;
  name: string;
  summary?: string;
  description?: string;
  price_usd: number;
  price_ves?: number;
  stock: number;
  occasion?: string;
  sku?: string;
  image_url?: string;
  additional_images?: string[];
  active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Occasion {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductOccasion {
  id: number;
  product_id: number;
  occasion_id: number;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'customer' | 'admin';
  email_verified: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  guest_email?: string;
  status: 'pending' | 'verified' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  currency: string;
  shipping_address: ShippingAddress;
  billing_address?: ShippingAddress;
  notes?: string;
  delivery_date?: string;
  delivery_time_slot?: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code?: string;
  country: string;
  phone?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_snapshot?: Product;
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: 'pago_movil' | 'bank_transfer' | 'zelle' | 'binance_pay' | 'cash';
  active: boolean;
  configuration: Record<string, any>;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  payment_method_id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'verified' | 'failed' | 'refunded';
  reference_number?: string;
  payment_details: Record<string, any>;
  proof_image_url?: string;
  verified_by?: number;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CarouselImage {
  id: number;
  title?: string;
  description?: string;
  image_url: string;
  link_url?: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: number;
  setting_key: string;
  setting_value?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Tipos de utilidad para APIs
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductSearchParams extends PaginationParams {
  search?: string;
  occasion?: string;
  featured?: boolean;
  active?: boolean;
  sort?: 'name' | 'price_usd' | 'created_at';
  order?: 'asc' | 'desc';
}

export interface OrderSearchParams extends PaginationParams {
  status?: Order['status'];
  user_id?: number;
  date_from?: string;
  date_to?: string;
}