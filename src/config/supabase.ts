/**
 * 🌸 FloresYa Supabase Configuration - Enterprise Edition
 * Type-safe Supabase client with performance monitoring
 * Uses consolidated types from single source of truth
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Import all database types from consolidated source
import type { Database } from '../shared/types/index.js';

dotenv.config();

// Re-export commonly used database types for backward compatibility
export type {
  // Enum types
  // OccasionType, // REMOVED: Column 'type' eliminated from occasions table
  OrderStatus,
  PaymentStatus,
  PaymentMethodType,
  UserRole,
  ImageSize,
  // Entity types
  User,
  Product,
  ProductImage,
  Occasion,
  ProductOccasion,
  Order,
  OrderItem,
  OrderStatusHistory,
  PaymentMethod,
  Payment,
  Setting,
  ProductWithImages,
  ProductWithOccasions,
  ProductWithImagesAndOccasions,
  OrderWithItems,
  OrderWithItemsAndPayments,
  CarouselProduct,
  ProductQuery,
  ProductCreateRequest,
  ProductUpdateRequest,
  OccasionCreateRequest,
  OccasionUpdateRequest,
  OrderCreateRequest,
  OrderUpdateRequest,
  PaymentCreateRequest,
  UserCreateRequest,
  UserUpdateRequest,
  UserQuery,
  UserResponse,
  UserListResponse,
  ApiResponse,
  ValidationError,
  PaginationInfo,
  ProductResponse,
  CarouselResponse,
  OrderResponse,
  Database
} from '../shared/types/index.js';

// ============================================
// SUPABASE CONFIGURATION
// ============================================

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

class SupabaseManager {
  private static instance: SupabaseManager;
  public readonly client: SupabaseClient<Database>;
  public readonly serviceClient: SupabaseClient<Database>;

  private constructor() {
    const config = this.getConfig();

    this.client = createClient<Database>(config.url, config.anonKey, {
      auth: { persistSession: false }
    });

    this.serviceClient = createClient<Database>(
      config.url,
      config.serviceKey ?? config.anonKey,
      {
        auth: { persistSession: false }
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
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    return { url, anonKey, serviceKey };
  }

  public async testConnection(): Promise<boolean> {
    try {
      const { error } = await this.client.from('settings').select('id').limit(1);
      return !error;
    } catch (error) {
            return false;
    }
  }

  public getPerformanceMetrics() {
    return {
      timestamp: new Date().toISOString(),
      connectionStatus: 'connected',
      lastQuery: Date.now()
    };
  }
}

// Export singleton instance
const supabaseManager = SupabaseManager.getInstance();
export const supabase = supabaseManager.client;
export const supabaseService = supabaseManager.serviceClient;
export default supabaseManager;

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function testSupabaseConnection(): Promise<boolean> {
  return supabaseManager.testConnection();
}

export function getSupabaseMetrics() {
  return supabaseManager.getPerformanceMetrics();
}

// ============================================
// TYPE GUARDS
// ============================================

export function isValidOrderStatus(status: string): status is Database['public']['Tables']['orders']['Row']['status'] {
  return ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status);
}

export function isValidUserRole(role: string): role is Database['public']['Tables']['users']['Row']['role'] {
  return ['user', 'admin', 'support'].includes(role);
}

// ============================================
// CONSOLIDATED CONSTANTS
// ============================================

// Re-export consolidated constants
// Temporarily commented out due to module resolution issues
// export {
//   Tables,
//   DEFAULT_PAGE_SIZE,
//   MAX_PAGE_SIZE
// } from '../shared/constants/index.js';