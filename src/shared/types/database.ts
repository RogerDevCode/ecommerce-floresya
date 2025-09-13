/**
 * 🌸 FloresYa - Database Type Definitions
 * Types for database entities and operations
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface QueryOptions {
  orderBy?: string;
  order?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
  include?: string[];
}

export interface QueryResult<T = any> {
  rows: T[];
  count: number;
  success: boolean;
  error?: string;
}

export interface DatabaseRow {
  id: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ProductRow extends DatabaseRow {
  name: string;
  description?: string;
  price_usd: number;
  stock?: number;
  occasion?: number;
  image_url?: string;
  is_active?: boolean;
}

export interface ProductImageRow extends DatabaseRow {
  product_id: number;
  image_url?: string;
  url_small?: string;
  url_medium?: string;
  url_large?: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface OccasionRow extends DatabaseRow {
  name: string;
  description?: string;
  icon?: string;
  is_active?: boolean;
}

export interface CarouselImageRow extends DatabaseRow {
  image_url: string;
  title?: string;
  description?: string;
  alt_text?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UserRow extends DatabaseRow {
  email: string;
  name?: string;
  password_hash?: string;
  role?: string;
  is_active?: boolean;
}