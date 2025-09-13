/**
 * 🌸 FloresYa - API Type Definitions
 * Types for API requests, responses and data structures
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price_usd: number;
  stock?: number;
  occasion?: number;
  image_url?: string;
  images?: ProductImage[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id?: number;
  product_id: number;
  url_small?: string;
  url_medium?: string;
  url_large?: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface Occasion {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  role?: 'admin' | 'user';
  created_at?: string;
}

export interface AuthResponse {
  user?: User;
  token?: string;
  expires_in?: number;
}