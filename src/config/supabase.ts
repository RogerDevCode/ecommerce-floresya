/**
 * 🌸 FloresYa Supabase Configuration - Enterprise Edition
 * Type-safe Supabase client with performance monitoring
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// --- BEGIN INLINED DATABASE TYPES ---
// All type definitions are inlined here to prevent module resolution issues.

// Enum Types
export type OccasionType = 'general' | 'birthday' | 'anniversary' | 'wedding' | 'sympathy' | 'congratulations';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';
export type PaymentMethodType = 'bank_transfer' | 'mobile_payment' | 'cash' | 'card';
export type UserRole = 'admin' | 'user';
export type ImageSize = 'thumb' | 'small' | 'medium' | 'large';

// Custom JSON object types - strict typing without 'any'
export type PaymentDetailsObject = { [key: string]: string | number | boolean | undefined };
export type PaymentMethodAccountInfo = { [key: string]: string | number | boolean | undefined };

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
  price_usd: number;
  price_ves?: number;
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
  slug: string;
  created_at: string;
  updated_at: string;
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
  delivery_date?: string;
  delivery_time_slot?: string;
  delivery_notes?: string;
  status: OrderStatus;
  total_amount_usd: number;
  total_amount_ves?: number;
  currency_rate?: number;
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
  unit_price_usd: number;
  unit_price_ves?: number;
  quantity: number;
  subtotal_usd: number;
  subtotal_ves?: number;
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
  amount_usd: number;
  amount_ves?: number;
  currency_rate?: number;
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
  medium_images?: string[]; // Para efecto hover en cards de productos
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
  price_usd: number;
  carousel_order: number;
  primary_thumb_url: string;
  images?: Array<{url: string, size: ImageSize}>; // Para efecto hover
}

// Raw response types for Supabase joined queries
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

export interface RawOrderStatusHistoryWithUser extends OrderStatusHistory {
  users: User | null;
}

// Request/Response Types
export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  occasion?: string;
  featured?: boolean;
  active?: boolean;
  has_carousel_order?: boolean;
  sort_by?: 'name' | 'price_usd' | 'created_at' | 'carousel_order' | 'stock';
  sort?: string;
  sort_direction?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface ProductCreateRequest {
  name: string;
  description: string;
  summary?: string;
  price_usd: number;
  price_ves?: number;
  stock: number;
  sku?: string;
  featured?: boolean;
  carousel_order?: number;
}

export interface ProductUpdateRequest {
  id: number;
  name?: string;
  description?: string;
  summary?: string;
  price_usd?: number;
  price_ves?: number;
  stock?: number;
  sku?: string;
  active?: boolean;
  featured?: boolean;
  carousel_order?: number | null;
}

export interface OccasionCreateRequest {
  name: string;
  type?: OccasionType;
  description?: string;
  slug?: string;
  display_order?: number;
}

export interface OccasionUpdateRequest extends Partial<OccasionCreateRequest> {
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
  total_amount_usd?: number;
}

export interface OrderUpdateRequest {
  id: number;
  status?: OrderStatus;
  delivery_date?: string;
  delivery_time_slot?: string;
  delivery_notes?: string;
  admin_notes?: string;
}

export interface OccasionCreateRequest {
  name: string;
  type?: OccasionType;
  description?: string;
  display_order?: number;
  slug?: string;
}

export interface OccasionUpdateRequest extends Partial<OccasionCreateRequest> {
  id: number;
  is_active?: boolean;
}

export interface PaymentCreateRequest {
  order_id: number;
  payment_method_id: number;
  amount_usd: number;
  amount_ves?: number;
  currency_rate?: number;
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
  [key: string]: unknown;
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

// Database Schema for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at'>>;
      };
      product_images: {
        Row: ProductImage;
        Insert: Omit<ProductImage, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProductImage, 'id' | 'created_at'>>;
      };
      occasions: {
        Row: Occasion;
        Insert: Omit<Occasion, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Occasion, 'id' | 'created_at'>>;
      };
      product_occasions: {
        Row: ProductOccasion;
        Insert: Omit<ProductOccasion, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProductOccasion, 'id' | 'created_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>;
      };
      order_status_history: {
        Row: OrderStatusHistory;
        Insert: Omit<OrderStatusHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<OrderStatusHistory, 'id' | 'created_at'>>;
      };
      payment_methods: {
        Row: PaymentMethod;
        Insert: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PaymentMethod, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>;
      };
      settings: {
        Row: Setting;
        Insert: Omit<Setting, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Setting, 'id' | 'created_at'>>;
      };
    };
  };
}

// --- END INLINED DATABASE TYPES ---

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

class SupabaseManager {
  private static instance: SupabaseManager;
  public readonly client: SupabaseClient;
  public readonly serviceClient: SupabaseClient;

  private constructor() {
    const config = this.getConfig();
    
    this.client = createClient(config.url, config.anonKey, {
      auth: { persistSession: false }
    });

    this.serviceClient = createClient(
      config.url,
      config.serviceKey ?? config.anonKey,
      {
        auth: { persistSession: false, autoRefreshToken: false }
      }
    );
  }

  public static getInstance(): SupabaseManager {
    if (!SupabaseManager.instance) {
      SupabaseManager.instance = new SupabaseManager();
    }
    return SupabaseManager.instance;
  }

  private getConfig(): SupabaseConfig {
    const url = process.env.SUPABASE_URL ?? 'https://placeholder.supabase.co';
    const anonKey = process.env.SUPABASE_ANON_KEY ?? 'placeholder-anon-key';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    return { url, anonKey, serviceKey };
  }

  public async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client.from('products').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

export const supabaseManager = SupabaseManager.getInstance();
export const supabase = supabaseManager.client;
export const supabaseService = supabaseManager.serviceClient;

export type { SupabaseClient };
