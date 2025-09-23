/**
 * 🌸 FloresYa Supabase Configuration - Enterprise Edition
 * Type-safe Supabase client with performance monitoring
 * Uses consolidated types from single source of truth
 */
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../shared/types/index.js';
export type { OccasionType, OrderStatus, PaymentStatus, PaymentMethodType, UserRole, ImageSize, User, Product, ProductImage, Occasion, ProductOccasion, Order, OrderItem, OrderStatusHistory, PaymentMethod, Payment, Setting, ProductWithImages, ProductWithOccasions, ProductWithImagesAndOccasions, OrderWithItems, OrderWithItemsAndPayments, CarouselProduct, ProductQuery, ProductCreateRequest, ProductUpdateRequest, OccasionCreateRequest, OccasionUpdateRequest, OrderCreateRequest, OrderUpdateRequest, PaymentCreateRequest, UserCreateRequest, UserUpdateRequest, UserQuery, UserResponse, UserListResponse, ApiResponse, ValidationError, PaginationInfo, ProductResponse, CarouselResponse, OrderResponse, Database } from '../shared/types/index.js';
declare class SupabaseManager {
    private static instance;
    readonly client: SupabaseClient<Database>;
    readonly serviceClient: SupabaseClient<Database>;
    private constructor();
    static getInstance(): SupabaseManager;
    private getConfig;
    testConnection(): Promise<boolean>;
    getPerformanceMetrics(): {
        timestamp: string;
        connectionStatus: string;
        lastQuery: number;
    };
}
declare const supabaseManager: SupabaseManager;
export declare const supabase: SupabaseClient<Database, "public", "public", never, {
    PostgrestVersion: "12";
}>;
export declare const supabaseService: SupabaseClient<Database, "public", "public", never, {
    PostgrestVersion: "12";
}>;
export default supabaseManager;
export declare function testSupabaseConnection(): Promise<boolean>;
export declare function getSupabaseMetrics(): {
    timestamp: string;
    connectionStatus: string;
    lastQuery: number;
};
export declare function isValidOrderStatus(status: string): status is Database['public']['Tables']['orders']['Row']['status'];
export declare function isValidUserRole(role: string): role is Database['public']['Tables']['users']['Row']['role'];
export { Tables, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../shared/constants/index.js';
