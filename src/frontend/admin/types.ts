/**
 * 🌸 FloresYa Admin Types - Shared Interfaces & Types
 * Central type definitions for admin panel modules
 */

export interface AdminUser {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
}

export interface AdminOrder {
  id: number;
  customer_name: string;
  customer_email?: string;
  total_amount_usd: number;
  total_amount_ves?: number;
  status: string;
  created_at: string;
  delivery_date?: string;
  items_count?: number;
}

export interface OrdersFilters {
  status?: string;
  customer_email?: string;
  date_from?: string;
  date_to?: string;
}

export interface OrdersData {
  orders: AdminOrder[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

export interface AdminOccasion {
  id: number;
  name: string;
  type: string;
  display_order: number;
  is_active: boolean;
}

export interface OrderDetails {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount_usd: number;
  total_amount_ves?: number;
  status: string;
  created_at: string;
  delivery_date?: string;
  delivery_address?: string;
  notes?: string;
  items: Array<{
    id: number;
    product_name: string;
    quantity: number;
    unit_price_usd: number;
    unit_price_ves?: number;
    subtotal_usd: number;
    subtotal_ves?: number;
  }>;
  payments?: Array<{
    id: number;
    amount_usd: number;
    amount_ves?: number;
    method: string;
    status: string;
    created_at: string;
  }>;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price_usd: number;
  price_ves?: number;
  is_available: boolean;
  category_id?: number;
  occasion_id?: number;
  created_at: string;
  updated_at: string;
  image_url?: string;
  images?: Array<{
    id: number;
    url: string;
    is_primary: boolean;
  }>;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
}

export interface AlertData {
  type: string;
  message: string;
}

export interface ActivityData {
  icon: string;
  description: string;
  time: string;
}

export interface ProductImage {
  id: number;
  product_id: number | null;
  product_name: string | null;
  size: string;
  url: string;
  file_hash: string;
  is_primary: boolean;
  created_at: string;
}

export interface AdminPanelLogger {
  log(message: string, level: 'info' | 'error' | 'success' | 'warn'): void;
}

// Bootstrap types imported from globals
export interface WindowWithBootstrap {
  bootstrap?: {
    Modal: {
      new (element: HTMLElement): { show(): void; hide(): void; };
      getInstance(element: HTMLElement | null): { show(): void; hide(): void; } | null;
    };
    Toast: {
      new (element: HTMLElement, options?: { delay?: number; }): { show(): void; hide(): void; };
      getInstance(element: HTMLElement): { show(): void; hide(): void; } | null;
    };
  };
}