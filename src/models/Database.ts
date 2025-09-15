/**
 * 🌸 FloresYa Database Types - Complete Schema Definition
 * Generated from Supabase PostgreSQL schema with strict typing
 */

// Specific Data Types for JSONB fields within the database schema
export interface PaymentDetailsObject {
  bank_name?: string;
  account_number?: string;
  reference_code?: string;
  confirmation_number?: string;
  notes?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface PaymentMethodAccountInfo {
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  routing_number?: string;
  swift_code?: string;
  instructions?: string;
  [key: string]: string | number | boolean | undefined;
}

// Enum Types - Matching Supabase Schema
export type OccasionType = 'general' | 'birthday' | 'anniversary' | 'wedding' | 'sympathy' | 'congratulations';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';
export type PaymentMethodType = 'bank_transfer' | 'mobile_payment' | 'cash' | 'card';
export type UserRole = 'admin' | 'user';
export type ImageSize = 'thumb' | 'small' | 'medium' | 'large';

// Core Entity Types
export interface User {
  id: number;
  email: string;
  password_hash?: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  summary?: string;
  description?: string;
  price_usd: number; // numeric as number for Supabase compatibility
  price_ves?: number; // numeric as number for Supabase compatibility
  stock: number;
  sku?: string;
  active: boolean;
  featured: boolean;
  carousel_order?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_index: number;
  size: ImageSize;
  url: string;
  file_hash: string;
  mime_type: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Occasion {
  id: number;
  name: string;
  type: OccasionType;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  slug: string; // Added slug property
}

export interface ProductOccasion {
  id: number;
  product_id: number;
  occasion_id: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id?: number;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  delivery_address: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip?: string;
  delivery_date?: string; // date type
  delivery_time_slot?: string;
  delivery_notes?: string;
  status: OrderStatus;
  total_amount_usd: number; // numeric as number
  total_amount_ves?: number; // numeric as number
  currency_rate?: number; // numeric as number
  notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number;
  product_name: string;
  product_summary?: string;
  unit_price_usd: number; // numeric as number
  unit_price_ves?: number; // numeric as number
  quantity: number;
  subtotal_usd: number; // numeric as number
  subtotal_ves?: number; // numeric as number
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  old_status?: OrderStatus;
  new_status: OrderStatus;
  notes?: string;
  changed_by?: number;
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: PaymentMethodType;
  description?: string;
  account_info?: PaymentMethodAccountInfo;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  payment_method_id?: number;
  user_id?: number;
  amount_usd: number; // numeric as number
  amount_ves?: number; // numeric as number
  currency_rate?: number; // numeric as number
  status: PaymentStatus;
  payment_method_name: string;
  transaction_id?: string;
  reference_number?: string;
  payment_details?: PaymentDetailsObject;
  receipt_image_url?: string;
  admin_notes?: string;
  payment_date?: string;
  confirmed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: number;
  key: string;
  value?: string;
  description?: string;
  type: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Extended/Joined Types
export interface ProductWithImages extends Product {
  images: ProductImage[];
  primary_image?: ProductImage;
}

export interface ProductWithOccasions extends Product {
  occasions: Occasion[];
}

export interface ProductWithImagesAndOccasions extends Product {
  images: ProductImage[];
  occasions: Occasion[];
  primary_image?: ProductImage;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  user?: User;
}

export interface OrderWithItemsAndPayments extends OrderWithItems {
  payments: Payment[];
  status_history: OrderStatusHistory[];
}

export interface CarouselProduct {
  id: number;
  name: string;
  summary?: string;
  price_usd: number; // numeric as number
  carousel_order: number;
  primary_thumb_url: string;
}

// Request/Response Types
export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  occasion_id?: number;
  category?: string;
  featured?: boolean;
  active?: boolean;
  has_carousel_order?: boolean;
  sort_by?: 'name' | 'price_usd' | 'created_at' | 'carousel_order' | 'stock';
  sort_direction?: 'asc' | 'desc';
  occasion?: string; // Added occasion property
  sort?: string; // Added sort property
  [key: string]: unknown; // Index signature for additional query parameters
}

export interface ProductCreateRequest {
  name: string;
  description: string;
  summary?: string;
  price_usd: number; // numeric as number
  stock_quantity: number;
  is_featured?: boolean;
  carousel_order?: number;
  occasion_id?: number;
  category?: string;
  sku?: string;
  care_instructions?: string;
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  id: number;
  is_active?: boolean;
}

export interface OrderCreateRequest {
  user_id?: number;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  delivery_address: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip?: string;
  delivery_date?: string;
  delivery_time_slot?: string;
  delivery_notes?: string;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  total_amount_usd?: number; // Add for calculation
}

export interface OrderUpdateRequest {
  id: number;
  status?: OrderStatus;
  delivery_date?: string;
  delivery_time_slot?: string;
  delivery_notes?: string;
  admin_notes?: string;
}

export interface PaymentCreateRequest {
  order_id: number;
  payment_method_id: number;
  amount_usd: number; // numeric as number
  amount_ves?: number; // numeric as number
  currency_rate?: number; // numeric as number
  transaction_id?: string;
  reference_number?: string;
  payment_details?: PaymentDetailsObject;
  receipt_image_url?: string;
}

// Response Wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  [key: string]: unknown; // Index signature for additional response properties
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

export interface ProductResponse {
  products: ProductWithImages[];
  pagination: PaginationInfo;
}

export interface CarouselResponse {
  carousel_products: CarouselProduct[];
  total_count: number;
}

export interface OrderResponse {
  orders: OrderWithItems[];
  pagination: PaginationInfo;
}

// Raw response types for Supabase joined queries
export interface RawOrderWithItemsAndUser extends Order {
  order_items: OrderItem[];
  users: User | null;
}

export interface RawOrderWithItemsPaymentsHistory extends Order {
  order_items: OrderItem[];
  payments: Payment[];
  order_status_history: OrderStatusHistory[];
  users: User | null;
}

export interface RawProductWithImages extends Product {
  product_images: ProductImage[];
}

export interface RawOrderStatusHistoryWithUser extends OrderStatusHistory {
  users: User | null;
}

export interface RawCarouselProduct extends Product {
  product_images: Array<{
    size: ImageSize;
    url: string;
    is_primary: boolean;
  }>;
}

export interface RawProductWithImages extends Product {
  product_images: ProductImage[];
}
