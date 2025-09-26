/**
 * 🌸 FloresYa Shared Types - SINGLE SOURCE OF TRUTH
 * ============================================
 * CONSOLIDATED SHARED TYPES - ENTERPRISE EDITION
 * ============================================
 *
 * Silicon Valley Standards:
 * ✅ Single Source of Truth for ALL shared types
 * ✅ Runtime validation with Zod schemas
 * ✅ Eliminates duplication across frontend/backend
 * ✅ Zero generics - Specific validated types only
 * ✅ Centralized type management
 * ✅ Zero tech debt - No duplicate interface declarations
 */

import { z } from 'zod';

// Import official Supabase generated types - SINGLE SOURCE OF TRUTH
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './schema_supabase.js';

// ============================================
// ZOD SCHEMAS - RUNTIME VALIDATED ENUMS
// ============================================

// Order Status Schema - Updated to match Supabase enums exactly
export const OrderStatusSchema = z.enum(['pending', 'verified', 'preparing', 'shipped', 'delivered', 'cancelled']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

// Payment Status Schema - Updated to match Supabase enums exactly
export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded', 'partially_refunded']);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// Payment Method Schema - Updated to match Supabase enums exactly
export const PaymentMethodTypeSchema = z.enum(['bank_transfer', 'mobile_payment', 'cash', 'crypto', 'international']);
export type PaymentMethodType = z.infer<typeof PaymentMethodTypeSchema>;

// User Role Schema - Updated to match Supabase enums exactly
export const UserRoleSchema = z.enum(['user', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Image Size Schema
export const ImageSizeSchema = z.enum(['thumb', 'small', 'medium', 'large']);
export type ImageSize = z.infer<typeof ImageSizeSchema>;

// ============================================
// ZOD SCHEMAS - DATETIME UTILITIES (2025 BEST PRACTICES)
// ============================================

// Silicon Valley Standard: Flexible datetime coercion for API responses
// Handles both ISO strings, date objects and null values from database/API
export const FlexibleDatetimeSchema = z.union([
  z.string().datetime({ offset: true }),
  z.string().datetime(),
  z.coerce.date().transform(date => date.toISOString()),
  z.string().min(1),
  z.null(),
  z.undefined()
]).transform(val => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string' && val.trim() === '') return null;

  // Handle valid datetime strings
  if (typeof val === 'string') {
    try {
      // Validate it's a proper datetime format
      const date = new Date(val);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
      return null;
    }
  }

  return val;
}).nullable().optional();

// Non-nullable datetime for required fields
export const RequiredDatetimeSchema = z.union([
  z.string().datetime({ offset: true }),
  z.string().datetime(),
  z.coerce.date().transform(date => date.toISOString()),
  z.string().min(1)
]).transform(val => {
  if (typeof val === 'string') {
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid datetime: ${val}`);
      }
      return date.toISOString();
    } catch {
      throw new Error(`Invalid datetime format: ${val}`);
    }
  }
  return val;
});

// ============================================
// ZOD SCHEMAS - CORE SHARED TYPES
// ============================================

// User Schema
export const UserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  password: z.string().min(8).optional(), // Optional for response objects
  password_hash: z.string().optional(), // For DB storage
  full_name: z.string().optional(),
  phone: z.string().optional(),
  role: UserRoleSchema,
  is_active: z.boolean(),
  email_verified: z.boolean(),
  created_at: FlexibleDatetimeSchema,
  updated_at: FlexibleDatetimeSchema,
});
export type User = z.infer<typeof UserSchema>;

// Product Schema - Updated to match Supabase database exactly
export const ProductSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  summary: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price_usd: z.number(), // Primary USD price - required
  price_ves: z.number().nullable().optional(), // Optional VES price
  stock: z.number().int().nullable().optional(),
  sku: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
  featured: z.boolean().nullable().optional(), // Uses 'featured' not 'is_featured'
  carousel_order: z.number().int().nullable().optional(),
  created_at: FlexibleDatetimeSchema,
  updated_at: FlexibleDatetimeSchema,
});
export type Product = z.infer<typeof ProductSchema>;

// Product Image Schema - Updated to match raw database structure
export const ProductImageSchema = z.object({
  id: z.number().int().positive(),
  created_at: FlexibleDatetimeSchema, // Using flexible datetime schema
  file_hash: z.string().min(1), // Must be non-null to match DB
  image_index: z.number().int().nonnegative(), // Non-nullable to match DB
  is_primary: z.boolean(), // Non-nullable to match DB
  mime_type: z.string(), // Non-nullable to match DB
  product_id: z.number().int().positive(), // Non-nullable to match DB
  size: z.string(), // Non-nullable to match DB
  updated_at: FlexibleDatetimeSchema, // Using flexible datetime schema
  url: z.string(), // More flexible - allows relative paths from storage
  image_type: z.string().nullable().optional(), // Nullable to match DB
});
export type ProductImage = z.infer<typeof ProductImageSchema>;

// Occasion Schema - Updated to match raw database structure
export const OccasionSchema = z.object({
  id: z.number().int().positive(),
  created_at: FlexibleDatetimeSchema, // Using flexible datetime schema
  description: z.string().nullable(), // Nullable to match DB
  display_order: z.number().int().nullable(), // Nullable to match DB
  is_active: z.boolean().nullable(), // Nullable to match DB
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  updated_at: FlexibleDatetimeSchema, // Using flexible datetime schema
  // NOTE: color field was removed from the database schema
});
export type Occasion = z.infer<typeof OccasionSchema>;

// Order Schema - Updated to match raw database structure
export const OrderSchema = z.object({
  id: z.number().int().positive(),
  admin_notes: z.string().nullable(), // Nullable to match DB
  created_at: FlexibleDatetimeSchema, // Nullable to match DB
  currency_rate: z.number().nullable(), // Nullable to match DB
  customer_email: z.string().email(), // Non-nullable to match DB
  customer_name: z.string().min(1).max(255), // Non-nullable to match DB
  customer_phone: z.string().nullable(), // Nullable to match DB
  delivery_address: z.string(), // Non-nullable to match DB
  delivery_city: z.string().nullable(), // Nullable to match DB
  delivery_date: FlexibleDatetimeSchema, // Nullable to match DB
  delivery_notes: z.string().nullable(), // Nullable to match DB
  delivery_state: z.string().nullable(), // Nullable to match DB
  delivery_time_slot: z.string().nullable(), // Nullable to match DB
  delivery_zip: z.string().nullable(), // Nullable to match DB
  notes: z.string().nullable(), // Nullable to match DB
  status: z.string().nullable(), // Using string to match DB enum
  total_amount_usd: z.number().positive(), // Non-nullable to match DB
  total_amount_ves: z.number().positive().nullable(), // Nullable to match DB
  updated_at: FlexibleDatetimeSchema, // Nullable to match DB
  user_id: z.number().int().nullable(), // Nullable to match DB
});
export type Order = z.infer<typeof OrderSchema>;

// Order Item Schema - Updated to match raw database structure
export const OrderItemSchema = z.object({
  created_at: FlexibleDatetimeSchema, // Nullable to match DB
  id: z.number().int().positive(),
  order_id: z.number().int().positive(), // Non-nullable to match DB
  product_id: z.number().int().nullable(), // Nullable to match DB
  product_name: z.string().min(1).max(255), // Non-nullable to match DB
  product_summary: z.string().nullable(), // Nullable to match DB
  quantity: z.number().int().positive(), // Non-nullable to match DB
  subtotal_usd: z.number().positive(), // Non-nullable to match DB
  subtotal_ves: z.number().positive().nullable(), // Nullable to match DB
  unit_price_usd: z.number().positive(), // Non-nullable to match DB
  unit_price_ves: z.number().positive().nullable(), // Nullable to match DB
  updated_at: FlexibleDatetimeSchema, // Nullable to match DB
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

// Order Status History Schema - Updated to match raw database structure
export const OrderStatusHistorySchema = z.object({
  changed_by: z.number().int().nullable(), // Nullable to match DB
  created_at: FlexibleDatetimeSchema, // Nullable to match DB
  id: z.number().int().positive(),
  new_status: z.string(), // Using string to match DB enum
  notes: z.string().nullable(), // Nullable to match DB
  old_status: z.string().nullable(), // Using string to match DB enum
  order_id: z.number().int().positive(), // Non-nullable to match DB
});
export type OrderStatusHistory = z.infer<typeof OrderStatusHistorySchema>;

export interface PaymentMethod {
  id: number;
  name: string;
  type: PaymentMethodType;
  is_active: boolean;
  display_order: number;
  account_info?: PaymentMethodAccountInfo;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentMethodAccountInfo {
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  phone_number?: string;
  wallet_address?: string;
  qr_code_url?: string;
}

// Payment Details Object Schema
export const PaymentDetailsObjectSchema = z.object({
  transaction_id: z.string().optional(),
  confirmation_code: z.string().optional(),
  bank_reference: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});
export type PaymentDetailsObject = z.infer<typeof PaymentDetailsObjectSchema>;

// Payment Schema - Updated to match raw database structure
export const PaymentSchema = z.object({
  admin_notes: z.string().nullable(), // Nullable to match DB
  amount_usd: z.number().positive(), // Non-nullable to match DB
  amount_ves: z.number().positive().nullable(), // Nullable to match DB
  confirmed_date: FlexibleDatetimeSchema, // Nullable to match DB
  created_at: FlexibleDatetimeSchema, // Nullable to match DB
  currency_rate: z.number().nullable(), // Nullable to match DB
  id: z.number().int().positive(),
  order_id: z.number().int().positive(), // Non-nullable to match DB
  payment_date: FlexibleDatetimeSchema, // Nullable to match DB
  payment_details: z.unknown().nullable(), // Using unknown for Json type
  payment_method_id: z.number().int().nullable(), // Nullable to match DB
  payment_method_name: z.string(), // Non-nullable to match DB
  receipt_image_url: z.string().nullable(), // Nullable to match DB
  reference_number: z.string().nullable(), // Nullable to match DB
  status: z.string().nullable(), // Using string to match DB enum
  transaction_id: z.string().nullable(), // Nullable to match DB
  updated_at: FlexibleDatetimeSchema, // Nullable to match DB
  user_id: z.number().int().nullable(), // Nullable to match DB
});
export type Payment = z.infer<typeof PaymentSchema>;

export interface Setting {
  id: number;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// EXTENDED SHARED INTERFACES
// ============================================

// ============================================
// ZOD SCHEMAS - EXTENDED PRODUCT TYPES
// ============================================

// Product with Images Schema - Updated for compatibility
export const ProductWithImagesSchema = z.object({
  // Include all Product fields
  id: z.number().int().positive(),
  active: z.boolean().nullable(),
  carousel_order: z.number().int().nullable(),
  created_at: FlexibleDatetimeSchema,
  description: z.string().nullable(),
  featured: z.boolean().nullable(),
  name: z.string().min(1).max(255),
  price_usd: z.number().positive(),
  price_ves: z.number().positive().nullable(),
  sku: z.string().nullable(),
  stock: z.number().int().nullable(),
  summary: z.string().nullable(),
  updated_at: FlexibleDatetimeSchema,
  // Add additional fields
  images: z.array(ProductImageSchema).optional(),
  primary_image_url: z.string().url().optional(),
  primary_thumb_url: z.string().url().optional(),
});
export type ProductWithImages = z.infer<typeof ProductWithImagesSchema>;

// Product with Occasions Schema - Updated for compatibility
export const ProductWithOccasionsSchema = z.object({
  // Include all Product fields
  id: z.number().int().positive(),
  active: z.boolean().nullable(),
  carousel_order: z.number().int().nullable(),
  created_at: FlexibleDatetimeSchema,
  description: z.string().nullable(),
  featured: z.boolean().nullable(),
  name: z.string().min(1).max(255),
  price_usd: z.number().positive(),
  price_ves: z.number().positive().nullable(),
  sku: z.string().nullable(),
  stock: z.number().int().nullable(),
  summary: z.string().nullable(),
  updated_at: FlexibleDatetimeSchema,
  // Add additional fields
  occasions: z.array(OccasionSchema).optional(),
  occasion: OccasionSchema.optional(), // Single occasion for compatibility
});
export type ProductWithOccasions = z.infer<typeof ProductWithOccasionsSchema>;

// Product with Images and Occasions Schema (MOST USED) - Updated for compatibility
export const ProductWithImagesAndOccasionsSchema = z.object({
  // Include all Product fields
  id: z.number().int().positive(),
  active: z.boolean().nullable(),
  carousel_order: z.number().int().nullable(),
  created_at: FlexibleDatetimeSchema,
  description: z.string().nullable(),
  featured: z.boolean().nullable(),
  name: z.string().min(1).max(255),
  price_usd: z.number().positive(),
  price_ves: z.number().positive().nullable(),
  sku: z.string().nullable(),
  stock: z.number().int().nullable(),
  summary: z.string().nullable(),
  updated_at: FlexibleDatetimeSchema,
  // Add additional fields
  images: z.array(ProductImageSchema).optional(),
  occasions: z.array(OccasionSchema).optional(),
  occasion: OccasionSchema.optional(),
  primary_image_url: z.string().optional(),
  primary_thumb_url: z.string().optional(),
});
export type ProductWithImagesAndOccasions = z.infer<typeof ProductWithImagesAndOccasionsSchema>;

// Product with Occasion Schema (Frontend specific) - Updated for compatibility
export const ProductWithOccasionSchema = z.object({
  // Include all ProductWithImages fields
  id: z.number().int().positive(),
  active: z.boolean().nullable(),
  carousel_order: z.number().int().nullable(),
  created_at: FlexibleDatetimeSchema,
  description: z.string().nullable(),
  featured: z.boolean().nullable(),
  name: z.string().min(1).max(255),
  price_usd: z.number().positive(),
  price_ves: z.number().positive().nullable(),
  sku: z.string().nullable(),
  stock: z.number().int().nullable(),
  summary: z.string().nullable(),
  updated_at: FlexibleDatetimeSchema,
  images: z.array(ProductImageSchema).optional(),
  primary_image_url: z.string().optional(),
  primary_thumb_url: z.string().optional(),
  // Add additional fields
  occasion: OccasionSchema.optional(),
  price: z.number().positive(), // Alias for price_usd for easier use
});
export type ProductWithOccasion = z.infer<typeof ProductWithOccasionSchema>;

// Order with Items Schema - Updated for compatibility
export const OrderWithItemsSchema = z.object({
  // Include all Order fields
  id: z.number().int().positive(),
  admin_notes: z.string().nullable(),
  created_at: FlexibleDatetimeSchema,
  currency_rate: z.number().nullable(),
  customer_email: z.string().email(),
  customer_name: z.string().min(1).max(255),
  customer_phone: z.string().nullable(),
  delivery_address: z.string(),
  delivery_city: z.string().nullable(),
  delivery_date: FlexibleDatetimeSchema,
  delivery_notes: z.string().nullable(),
  delivery_state: z.string().nullable(),
  delivery_time_slot: z.string().nullable(),
  delivery_zip: z.string().nullable(),
  notes: z.string().nullable(),
  status: z.string().nullable(),
  total_amount_usd: z.number().positive(),
  total_amount_ves: z.number().positive().nullable(),
  updated_at: FlexibleDatetimeSchema,
  user_id: z.number().int().nullable(),
  // Add additional fields
  items: z.array(OrderItemSchema),
  items_count: z.number().int().nonnegative().optional(),
});
export type OrderWithItems = z.infer<typeof OrderWithItemsSchema>;

// User Summary for Orders Schema
export const UserSummarySchema = z.object({
  id: z.number().int().positive(),
  full_name: z.string().optional(),
  email: z.string().email(),
});
export type UserSummary = z.infer<typeof UserSummarySchema>;

// Order with Items and Payments Schema
export const OrderWithItemsAndPaymentsSchema = OrderWithItemsSchema.extend({
  payments: z.array(z.lazy(() => PaymentSchema)).optional(),
  status_history: z.array(z.lazy(() => OrderStatusHistorySchema)).optional(),
  user: UserSummarySchema.optional(),
});
export type OrderWithItemsAndPayments = z.infer<typeof OrderWithItemsAndPaymentsSchema>;

// ============================================
// ZOD SCHEMAS - CAROUSEL AND PRESENTATION TYPES
// ============================================

// Carousel Product Schema - Updated for compatibility
export const CarouselProductSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  summary: z.string().nullable(), // Using nullable to match DB
  price_usd: z.number().positive(),
  carousel_order: z.number().int().positive(), // Non-nullable to match DB expectation
  primary_image_url: z.string().optional(), // Allow relative URLs and placeholder paths
  primary_thumb_url: z.string(), // More flexible - allows any string, not just valid URLs
  images: z.array(z.object({
    url: z.string(),
    size: z.string(),
  })).optional(),
});
export type CarouselProduct = z.infer<typeof CarouselProductSchema>;

// ============================================
// ZOD VALIDATION SCHEMAS - REQUEST VALIDATION
// ============================================

// Product Request Validation Schemas
export const ProductCreateRequestSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(2000),
  summary: z.string().max(500).optional(),
  price_usd: z.number().positive().max(999999.99),
  price_ves: z.number().positive().optional(),
  stock: z.number().int().nonnegative().max(999999),
  sku: z.string().max(100).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  carousel_order: z.number().int().positive().optional(),
  occasion_id: z.number().int().positive().optional(),
  category: z.string().max(100).optional(),
  care_instructions: z.string().optional(),
});
export type ProductCreateRequestValidated = z.infer<typeof ProductCreateRequestSchema>;

export const ProductUpdateRequestSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  summary: z.string().max(500).optional(),
  price_usd: z.number().positive().max(999999.99).optional(),
  price_ves: z.number().positive().optional(),
  stock: z.number().int().nonnegative().max(999999).optional(),
  sku: z.string().max(100).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  carousel_order: z.number().int().positive().nullable().optional(),
  occasion_id: z.number().int().positive().optional(),
  category: z.string().max(100).optional(),
  care_instructions: z.string().optional(),
});
export type ProductUpdateRequestValidated = z.infer<typeof ProductUpdateRequestSchema>;

export const ProductQueryRequestSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(100)).optional(),
  search: z.string().min(2).max(100).optional(),
  occasion_id: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()).optional(),
  is_featured: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  is_available: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  sort_by: z.enum(['name', 'price_usd', 'created_at', 'carousel_order']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
});
export type ProductQueryRequestValidated = z.infer<typeof ProductQueryRequestSchema>;

export const ProductIdParamsSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive())
});
export type ProductIdParamsValidated = z.infer<typeof ProductIdParamsSchema>;

export const ProductSearchRequestSchema = z.object({
  q: z.string().min(2).max(100),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(50)).optional(),
});
export type ProductSearchRequestValidated = z.infer<typeof ProductSearchRequestSchema>;

export const CarouselUpdateRequestSchema = z.object({
  carousel_order: z.number().int().positive().nullable(),
});
export type CarouselUpdateRequestValidated = z.infer<typeof CarouselUpdateRequestSchema>;

// Order Request Validation Schemas
export const OrderCreateRequestSchema = z.object({
  customer_email: z.string().email(),
  customer_name: z.string().min(2).max(100),
  customer_phone: z.string().optional(),
  delivery_address: z.string().min(10).max(500),
  delivery_city: z.string().optional(),
  delivery_state: z.string().optional(),
  delivery_zip: z.string().optional(),
  delivery_date: z.string().date().optional(),
  delivery_time_slot: z.string().optional(),
  delivery_notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    quantity: z.number().int().positive(),
    unit_price_usd: z.number().positive(),
    unit_price_ves: z.number().positive().optional()
  })).min(1),
  notes: z.string().optional(),
});
export type OrderCreateRequestValidated = z.infer<typeof OrderCreateRequestSchema>;

export const OrderUpdateRequestSchema = z.object({
  id: z.number().int().positive(),
  status: OrderStatusSchema.optional(),
  delivery_date: z.string().date().optional(),
  delivery_time_slot: z.string().optional(),
  delivery_notes: z.string().optional(),
  admin_notes: z.string().max(1000).optional(),
});
export type OrderUpdateRequestValidated = z.infer<typeof OrderUpdateRequestSchema>;

export const OrderStatusUpdateRequestSchema = z.object({
  status: OrderStatusSchema,
  notes: z.string().max(500).optional(),
});
export type OrderStatusUpdateRequestValidated = z.infer<typeof OrderStatusUpdateRequestSchema>;

export const OrderQueryRequestSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(100)).optional(),
  status: OrderStatusSchema.optional(),
  customer_email: z.string().email().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  sort_by: z.enum(['created_at', 'total_amount_usd', 'status']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
});
export type OrderQueryRequestValidated = z.infer<typeof OrderQueryRequestSchema>;

// User Request Validation Schemas
export const UserCreateRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  role: UserRoleSchema.optional(),
});
export type UserCreateRequestValidated = z.infer<typeof UserCreateRequestSchema>;

export const UserUpdateRequestSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  role: UserRoleSchema.optional(),
  is_active: z.boolean().optional(),
  email_verified: z.boolean().optional(),
});
export type UserUpdateRequestValidated = z.infer<typeof UserUpdateRequestSchema>;

export const UserQueryRequestSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(100)).optional(),
  search: z.string().min(2).max(100).optional(),
  role: UserRoleSchema.optional(),
  is_active: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  sort_by: z.enum(['email', 'full_name', 'created_at', 'role']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
});
export type UserQueryRequestValidated = z.infer<typeof UserQueryRequestSchema>;

// Image Request Validation Schemas
export const ImageUploadRequestSchema = z.object({
  productId: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()),
  imageIndex: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().nonnegative()).optional(),
  isPrimary: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
});
export type ImageUploadRequestValidated = z.infer<typeof ImageUploadRequestSchema>;

export const SiteImageUploadRequestSchema = z.object({
  type: z.enum(['hero', 'logo']),
});
export type SiteImageUploadRequestValidated = z.infer<typeof SiteImageUploadRequestSchema>;

export const ImageGalleryQueryRequestSchema = z.object({
  filter: z.enum(['all', 'used', 'unused']).optional(),
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(100)).optional(),
});
export type ImageGalleryQueryRequestValidated = z.infer<typeof ImageGalleryQueryRequestSchema>;

// ============================================
// REQUEST/RESPONSE SHARED TYPES
// ============================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  occasion_id?: number;
  occasion?: number; // Alternative naming
  is_featured?: boolean;
  featured?: boolean; // Alternative naming
  is_available?: boolean;
  active?: boolean; // Alternative naming
  min_price?: number;
  max_price?: number;
  sort_by?: 'name' | 'price_usd' | 'created_at' | 'carousel_order' | 'stock';
  sort_direction?: 'asc' | 'desc';
  sort?: string; // Alternative naming
  [key: string]: unknown;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: User['role'];
  is_active?: boolean;
  email_verified?: boolean;
  sort_by?: 'email' | 'full_name' | 'role' | 'created_at' | 'updated_at';
  sort_direction?: 'asc' | 'desc';
  [key: string]: unknown;
}

// NOTE: API Response schemas will be defined after all base schemas are declared

// Validation Error Schema
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string().optional(),
});
export type ValidationError = z.infer<typeof ValidationErrorSchema>;

// Pagination Info Schema
export const PaginationInfoSchema = z.object({
  current_page: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
  total_items: z.number().int().nonnegative(),
  items_per_page: z.number().int().positive(),
});
export type PaginationInfo = z.infer<typeof PaginationInfoSchema>;

// ============================================
// UTILITY TYPES
// ============================================


export type LogLevel = 'info' | 'success' | 'error' | 'warn';

export interface LogData {
  [key: string]: unknown;
}

export interface WindowWithLogger {
  logger?: {
    info: (module: string, message: string, data?: LogData) => void;
    success: (module: string, message: string, data?: LogData) => void;
    error: (module: string, message: string, data?: LogData) => void;
    warn: (module: string, message: string, data?: LogData) => void;
  };
}

export interface WindowWithCart {
  cart?: {
    addItem: (item: CartItem) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    getItems: () => CartItem[];
    getTotal: () => number;
    clear: () => void;
  };
}

// Modal interfaces for Tailwind-based components
export interface ModalManager {
  show(): void;
  hide(): void;
  toggle(): void;
}

export interface ToastManager {
  show(): void;
  hide(): void;
  dismiss(): void;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

// ============================================
// IMAGE SERVICE TYPES
// ============================================

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface ImageUploadRequest {
  productId: number;
  imageIndex: number;
  file: MulterFile;
  isPrimary?: boolean;
}

export interface ProcessedImage {
  size: ImageSize;
  buffer: Buffer;
  width: number;
  height: number;
  fileName: string;
  mimeType: string;
  fileHash: string;
}

export interface ImageUploadResult {
  success: boolean;
  images: Array<{
    size: ImageSize;
    url: string;
    fileHash: string;
  }>;
  primaryImage?: ProductImage;
  message: string;
}

// ============================================
// FRONTEND SPECIFIC TYPES
// ============================================

export interface ConversionOptimizer {
  sessionStartTime: number;
  viewedProducts: Set<number>;
}

export interface ProductCardData {
  id: number;
  name: string;
  summary?: string;
  price_usd: number;
  carousel_order: number;
  primary_thumb_url: string;
  images?: Array<{ url: string; size: string }>;
}

// ============================================
// API SPECIFIC TYPES
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface APIProductResponse {
  product: ProductWithImagesAndOccasions;
}

export interface APIRequestData {
  [key: string]: unknown;
}

export interface APIResponseData {
  [key: string]: unknown;
}

export interface UserFormData {
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  password?: string;
}

export interface UserOperationResult {
  success: boolean;
  data?: UserResponse;
  message: string;
  errors?: ValidationError[];
}

export interface CartManager {
  addItem(product: {
    id: number;
    name: string;
    price_usd: number;
    quantity?: number;
  }): void;
  removeItem(productId: number): void;
  getItems(): CartItem[];
  clear(): void;
}

export type DebounceFunction<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  (...args: Parameters<T>): void;
  cancel(): void;
};

// ============================================
// LOGGING TYPES
// ============================================

export interface LogEntry {
  id?: string | number;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'SUCCESS' | 'API' | 'DB' | 'SECURITY' | 'PERF' | 'info' | 'error' | 'warn' | 'debug' | 'success' | 'api' | 'user' | 'cart' | 'perf';
  module: string;
  message: string;
  data?: LogData | null;
  timestamp: string;
  session_id?: string;
  user_id?: string | number;
  request_id?: string;
  requestId?: string; // Alternative naming
  ip_address?: string;
  ip?: string; // Alternative naming
  user_agent?: string;
  userAgent?: string; // Alternative naming
  url?: string;
  method?: string;
  status_code?: number;
  statusCode?: number; // Alternative naming
  response_time?: number;
  duration?: number; // Alternative naming
  error_stack?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  created_at?: string;
}

export interface Logger {
  startAutoSend(intervalMinutes: number): void;
  stopAutoSend(): void;
  sendLogs(): Promise<void>;
  info(module: string, message: string, data?: LogData | null): void;
  success(module: string, message: string, data?: LogData | null): void;
  error(module: string, message: string, data?: LogData | null): void;
  warn(module: string, message: string, data?: LogData | null): void;
  debug(module: string, message: string, data?: LogData | null): void;
  api(module: string, message: string, data?: LogData | null): void;
  user(module: string, message: string, data?: LogData | null): void;
  cart(module: string, message: string, data?: LogData | null): void;
  perf(module: string, message: string, data?: LogData | null): void;
}

export interface LogConfig {
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  enableConsole: boolean;
  enableFileLogging: boolean;
  enableDatabase?: boolean;
  enableRemote?: boolean;
  logDirectory: string;
  maxFileSize: number;
  maxFiles: number;
  enableStructured: boolean;
  remoteEndpoint?: string;
  bufferSize?: number;
  flushInterval?: number;
  includeStack?: boolean;
  sanitizeData?: boolean;
  compression?: boolean;
}

export interface LogBatch {
  logs: LogEntry[];
  batch_id: string;
  timestamp: string;
  source: 'frontend' | 'backend' | 'api';
  environment: 'development' | 'staging' | 'production';
  version?: string;
}

export interface LogTransmissionResult {
  success: boolean;
  batch_id: string;
  processed_count: number;
  errors?: string[];
  retry_after?: number;
}

export interface LogQuery {
  level?: LogEntry['level'];
  module?: string;
  user_id?: string | number;
  session_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'timestamp' | 'level' | 'module';
  sort_direction?: 'asc' | 'desc';
}

export interface LogQueryResult {
  logs: LogEntry[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================
// ERROR HANDLING TYPES AND UTILITIES
// ============================================

export type SafeError = Error | string;

export function formatError(error: SafeError): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

export function formatLogData(data: unknown): LogData {
  if (!data) return {};

  try {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      // Type guard to safely spread object
      const obj = data as Record<string, unknown>;
      const safeObj: LogData = {};
      for (const [key, value] of Object.entries(obj)) {
        safeObj[key] = value;
      }
      return safeObj;
    }
    if (typeof data === 'string') {
      return { data };
    }
    if (typeof data === 'number' || typeof data === 'boolean') {
      return { value: data.toString() };
    }
    return { value: JSON.stringify(data) ?? 'null' };
  } catch (_error) {
    return { error: 'Failed to format log data', original: 'Unable to stringify data' };
  }
}

// ============================================
// FRONTEND SYSTEM INTERFACES
// ============================================

export interface FloresYaAuthManager {
  init(): Promise<void>;
  login(email: string, password: string): Promise<boolean>;
  logout(): void;
  isAuthenticated(): boolean;
  getCurrentUser(): Promise<User>;
}

// Frontend system interfaces are defined in their respective modules

export interface ScrollEffectsManager {
  init(): void;
  destroy(): void;
  enableEffects(): void;
  disableEffects(): void;
}

// ============================================
// TAILWIND COMPONENT INTEGRATION TYPES
// ============================================

export interface CarouselManager {
  next(): void;
  prev(): void;
  goToSlide(index: number): void;
  play(): void;
  pause(): void;
}

// ============================================
// ADMIN PANEL TYPES
// ============================================
// Note: Window-related types moved to /shared/types/frontend.ts for DOM context

export interface AdminUser extends User {
  // Inherits all User properties but focuses on admin display
  full_name: string; // Required for admin display
}

export interface AdminOrder extends Order {
  // Extended order information for admin panel
  items_count?: number;
}

export type AdminOccasion = Occasion;

export interface AdminProduct extends Product {
  // Admin-specific product properties
  is_available: boolean;
  category_id?: number;
  image_url?: string;
  images?: ProductImage[];
}

export interface AdminPanelInstance {
  productModal: {
    showEditProductModal(product: AdminProduct): void;
  };
  productImagesModal: {
    show?(productId: number, productName: string): void;
  };
  userModal: {
    showEditUserModal(user: AdminUser): void;
  };
  occasionModal: {
    showEditOccasionModal(occasion: AdminOccasion): void;
  };
  orderDetailsModal: {
    show?(orderId: number): void;
  };
  editProductImages(productId: number, productName: string): void;
  viewOrderDetails(orderId: number): void;
  deleteUser(userId: number): void;
  deleteOccasion(occasionId: number): void;
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

export interface AdminPanelLogger {
  log(message: string, level: 'info' | 'error' | 'success' | 'warn'): void;
}


// ============================================
// PRODUCT OCCASION TYPES
// ============================================

export interface ProductOccasion {
  id: number;
  product_id: number;
  occasion_id: number;
  created_at?: string;
}

// ============================================
// RAW DATABASE QUERY RESULT TYPES
// ============================================

export interface RawProductWithImages extends Product {
  image_id?: number;
  image_url?: string;
  image_alt_text?: string;
  image_is_primary?: boolean;
  image_display_order?: number;
  product_images?: ProductImage[];
}

export interface RawCarouselProduct extends Product {
  primary_image_url?: string;
  thumb_image_url?: string;
  image_urls?: string;
}

export interface RawOrderWithItemsAndUser extends Order {
  user_full_name?: string;
  user_email?: string;
  item_id?: number;
  item_product_name?: string;
  item_quantity?: number;
  item_unit_price_usd?: number;
  order_items?: OrderItem[];
  users?: { id: number; full_name?: string; email: string };
}

export interface RawOrderWithItemsPaymentsHistory extends Order {
  payment_id?: number;
  payment_amount_usd?: number;
  payment_status?: string;
  payment_method_name?: string;
  history_id?: number;
  history_status?: string;
  history_notes?: string;
  order_items?: OrderItem[];
  payments?: Payment[];
  order_status_history?: OrderStatusHistory[];
  users?: { id: number; full_name?: string; email: string };
}

export interface RawOrderStatusHistoryWithUser extends OrderStatusHistory {
  user_full_name?: string;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface ProductCreateRequest {
  name: string;
  description?: string;
  price: number;
  price_usd: number;
  is_featured?: boolean;
  featured?: boolean; // Alternative naming
  is_available?: boolean;
  active?: boolean; // Alternative naming
  carousel_order?: number;
  category_id?: number;
  occasion_ids?: number[];
  stock?: number;
  sku?: string;
}

// Reemplazamos Partial<ProductCreateRequest> por una definición manual
export interface ProductUpdateRequest {
  id: number;
  name?: string;
  description?: string;
  price?: number;
  price_usd?: number;
  is_featured?: boolean;
  featured?: boolean;
  is_available?: boolean;
  active?: boolean;
  carousel_order?: number;
  category_id?: number;
  occasion_ids?: number[];
  stock?: number;
  sku?: string;
}

export interface OccasionCreateRequest {
  name: string;
  slug: string;
  description?: string;
  color: string;
  // type?: string; // REMOVED: Column 'type' eliminated from occasions table
  display_order?: number;
  is_active?: boolean;
}

// Reemplazamos Partial<OccasionCreateRequest> por una definición manual
export interface OccasionUpdateRequest {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  // type?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface OrderCreateRequest {
  user_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price_usd: number;
    unit_price_ves?: number;
  }>;
}

export interface OrderUpdateRequest {
  id: number;
  status?: Order['status'];
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
}

export interface PaymentCreateRequest {
  order_id: number;
  payment_method_id: number;
  amount_usd: number;
  amount_ves?: number;
  transaction_reference?: string;
  payment_details?: PaymentDetailsObject;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: User['role'];
  is_active?: boolean;
  email_verified?: boolean;
}

// Reemplazamos Partial<UserCreateRequest> por una definición manual
export interface UserUpdateRequest {
  id: number;
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  role?: User['role'];
  is_active?: boolean;
  email_verified?: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

// ============================================
// ZOD SCHEMAS - RESPONSE TYPES (RUNTIME VALIDATED)
// ============================================

// User Response Schema (without password)
export const UserResponseSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  role: UserRoleSchema,
  is_active: z.boolean(),
  email_verified: z.boolean(),
  created_at: RequiredDatetimeSchema,
  updated_at: RequiredDatetimeSchema,
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

// User List Response Schema
export const UserListResponseSchema = z.object({
  users: z.array(UserResponseSchema),
  pagination: PaginationInfoSchema.optional(),
});
export type UserListResponse = z.infer<typeof UserListResponseSchema>;

// Product Response Schema
export const ProductResponseSchema = z.object({
  products: z.array(ProductWithImagesAndOccasionsSchema),
  pagination: PaginationInfoSchema.optional(),
});
export type ProductResponse = z.infer<typeof ProductResponseSchema>;

// Carousel Response Schema
export const CarouselResponseSchema = z.object({
  products: z.array(CarouselProductSchema),
  total_count: z.number().int().nonnegative().optional(),
  carousel_products: z.array(CarouselProductSchema).optional(), // Alternative field name for compatibility
});
export type CarouselResponse = z.infer<typeof CarouselResponseSchema>;

// Order Response Schema
export const OrderResponseSchema = z.object({
  orders: z.array(OrderWithItemsSchema),
  pagination: PaginationInfoSchema.optional(),
});
export type OrderResponse = z.infer<typeof OrderResponseSchema>;

// ============================================
// BACKEND SPECIFIC TYPES
// ============================================

export interface UserInsert {
  email: string;
  password?: string;
  password_hash?: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  password_hash?: string;
  full_name?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean;
  email_verified?: boolean;
}

export interface ProductInsert {
  name: string;
  summary?: string;
  description?: string;
  price: number;
  price_usd: number;
  price_ves?: number;
  stock?: number;
  sku?: string;
  active?: boolean;
  is_featured: boolean;
  featured?: boolean;
  is_available?: boolean;
  carousel_order?: number;
  image_url?: string;
  category_id?: number;
  occasion_id?: number;
}

export interface ProductUpdate {
  name?: string;
  summary?: string;
  description?: string;
  price?: number;
  price_usd?: number;
  price_ves?: number;
  stock?: number;
  sku?: string;
  active?: boolean;
  is_featured?: boolean;
  featured?: boolean;
  is_available?: boolean;
  carousel_order?: number;
  image_url?: string;
  category_id?: number;
  occasion_id?: number;
}

export interface ProductImageInsert {
  product_id: number;
  url: string;
  alt_text?: string;
  size: ImageSize;
  is_primary: boolean;
  display_order?: number;
  image_index?: number;
  file_hash?: string;
  mime_type?: string;
}

export interface ProductImageUpdate {
  url?: string;
  alt_text?: string;
  size?: ImageSize;
  is_primary?: boolean;
  display_order?: number;
  image_index?: number;
  file_hash?: string;
  mime_type?: string;
}

export interface OccasionInsert {
  name: string;
  slug: string;
  description?: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

export interface OccasionUpdate {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface ProductOccasionInsert {
  created_at?: string | null;
  id?: number;
  occasion_id: number;
  product_id: number;
  updated_at?: string | null;
}

export interface ProductOccasionUpdate {
  created_at?: string | null;
  id?: number;
  occasion_id?: number;
  product_id?: number;
  updated_at?: string | null;
}

export interface OrderInsert {
  admin_notes?: string | null;
  created_at?: string | null;
  currency_rate?: number | null;
  customer_email: string;
  customer_name: string;
  customer_phone?: string | null;
  delivery_address: string;
  delivery_city?: string | null;
  delivery_date?: string | null;
  delivery_notes?: string | null;
  delivery_state?: string | null;
  delivery_time_slot?: string | null;
  delivery_zip?: string | null;
  notes?: string | null;
  status?: string | null; // Using string for compatibility with custom OrderStatus enum
  total_amount_usd: number;
  total_amount_ves?: number | null;
  updated_at?: string | null;
  user_id?: number | null;
}

export interface OrderUpdate {
  admin_notes?: string | null;
  created_at?: string | null;
  currency_rate?: number | null;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string | null;
  delivery_address?: string;
  delivery_city?: string | null;
  delivery_date?: string | null;
  delivery_notes?: string | null;
  delivery_state?: string | null;
  delivery_time_slot?: string | null;
  delivery_zip?: string | null;
  id?: number;
  notes?: string | null;
  status?: string | null; // Using string for compatibility with custom OrderStatus enum
  total_amount_usd?: number;
  total_amount_ves?: number | null;
  updated_at?: string | null;
  user_id?: number | null;
}

export interface OrderItemInsert {
  created_at?: string | null;
  id?: number;
  order_id: number;
  product_id?: number | null;
  product_name: string;
  product_summary?: string | null;
  quantity: number;
  subtotal_usd: number;
  subtotal_ves?: number | null;
  unit_price_usd: number;
  unit_price_ves?: number | null;
  updated_at?: string | null;
}

export interface OrderItemUpdate {
  created_at?: string | null;
  id?: number;
  order_id?: number;
  product_id?: number | null;
  product_name?: string;
  product_summary?: string | null;
  quantity?: number;
  subtotal_usd?: number;
  subtotal_ves?: number | null;
  unit_price_usd?: number;
  unit_price_ves?: number | null;
  updated_at?: string | null;
}

export interface OrderStatusHistoryInsert {
  changed_by?: number | null;
  created_at?: string | null;
  id?: number;
  new_status: string; // Using string for compatibility with custom OrderStatus enum
  notes?: string | null;
  old_status?: string | null; // Using string for compatibility with custom OrderStatus enum
  order_id: number;
}

export interface OrderStatusHistoryUpdate {
  changed_by?: number | null;
  created_at?: string | null;
  id?: number;
  new_status?: string; // Using string for compatibility with custom OrderStatus enum
  notes?: string | null;
  old_status?: string | null; // Using string for compatibility with custom OrderStatus enum
  order_id?: number;
}

export interface PaymentMethodInsert {
  account_info?: unknown | null; // Json type
  created_at?: string | null;
  description?: string | null;
  display_order?: number | null;
  id?: number;
  is_active?: boolean | null;
  name: string;
  type: string; // Using string for compatibility with custom PaymentMethodType enum
  updated_at?: string | null;
}

export interface PaymentMethodUpdate {
  account_info?: unknown | null; // Json type
  created_at?: string | null;
  description?: string | null;
  display_order?: number | null;
  id?: number;
  is_active?: boolean | null;
  name?: string;
  type?: string; // Using string for compatibility with custom PaymentMethodType enum
  updated_at?: string | null;
}

export interface PaymentInsert {
  admin_notes?: string | null;
  amount_usd: number;
  amount_ves?: number | null;
  confirmed_date?: string | null;
  created_at?: string | null;
  currency_rate?: number | null;
  id?: number;
  order_id: number;
  payment_date?: string | null;
  payment_details?: unknown | null; // Json type
  payment_method_id?: number | null;
  payment_method_name: string;
  receipt_image_url?: string | null;
  reference_number?: string | null;
  status?: string | null; // Using string for compatibility with custom PaymentStatus enum
  transaction_id?: string | null;
  updated_at?: string | null;
  user_id?: number | null;
}

export interface PaymentUpdate {
  admin_notes?: string | null;
  amount_usd?: number;
  amount_ves?: number | null;
  confirmed_date?: string | null;
  created_at?: string | null;
  currency_rate?: number | null;
  id?: number;
  order_id?: number;
  payment_date?: string | null;
  payment_details?: unknown | null; // Json type
  payment_method_id?: number | null;
  payment_method_name?: string;
  receipt_image_url?: string | null;
  reference_number?: string | null;
  status?: string | null; // Using string for compatibility with custom PaymentStatus enum
  transaction_id?: string | null;
  updated_at?: string | null;
  user_id?: number | null;
}

export interface SettingInsert {
  created_at?: string | null;
  description?: string | null;
  id?: number;
  is_public?: boolean | null;
  key: string;
  type?: string | null;
  updated_at?: string | null;
  value?: string | null;
}

export interface SettingUpdate {
  created_at?: string | null;
  description?: string | null;
  id?: number;
  is_public?: boolean | null;
  key?: string;
  type?: string | null;
  updated_at?: string | null;
  value?: string | null;
}

// ============================================
// DATABASE TYPES MIGRATION TO SUPABASE GENERATED
// ============================================
// Database interface is now imported from schema_supabase.ts (line 19)
// This eliminates SSOT violations and ensures compatibility with official Supabase types

// ===================================================================
// SILICON VALLEY BEST PRACTICES - DATABASE TYPE ALIGNMENT
// ===================================================================
// 
// This Database interface follows industry-leading practices used in
// Silicon Valley companies like Meta, Google, and Netflix:
// 
// 1. RAW DATABASE COMPATIBILITY: Structured exactly as Supabase expects
//    for seamless integration with PostgREST API
// 
// 2. ENUM STRING COMPATIBILITY: Uses strings for enum fields to
//    maintain compatibility with both custom Zod enums and DB enums
// 
// 3. RELATIONSHIPS: Includes proper relationship metadata for
//    enhanced type safety and referential integrity
// 
// 4. FUNCTIONS & VIEWS: All database functions and views are typed
//    for complete database interaction coverage
// 
// 5. SSOT PRINCIPLE: Single source of truth for database types
//    used throughout the entire application
// 
// This approach provides enterprise-level type safety with full
// Supabase integration, following Silicon Valley engineering standards.

// ============================================
// ZOD VALIDATED API RESPONSES - NO MORE GENERICS!

// ============================================
// ZOD VALIDATED API RESPONSES - NO MORE GENERICS!
// ============================================

// Base API Response Schema
const BaseApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  errors: z.array(ValidationErrorSchema).optional(),
});

// Product API Response Schema
export const ProductApiResponseSchema = BaseApiResponseSchema.extend({
  data: ProductWithImagesAndOccasionsSchema.optional(),
});
export type ProductApiResponse = z.infer<typeof ProductApiResponseSchema>;

// Product List API Response Schema
export const ProductListApiResponseSchema = BaseApiResponseSchema.extend({
  data: ProductResponseSchema.optional(),
});
export type ProductListApiResponse = z.infer<typeof ProductListApiResponseSchema>;

// User API Response Schema
export const UserApiResponseSchema = BaseApiResponseSchema.extend({
  data: UserResponseSchema.optional(),
});
export type UserApiResponse = z.infer<typeof UserApiResponseSchema>;

// User List API Response Schema
export const UserListApiResponseSchema = BaseApiResponseSchema.extend({
  data: UserListResponseSchema.optional(),
});
export type UserListApiResponse = z.infer<typeof UserListApiResponseSchema>;

// Order API Response Schema
export const OrderApiResponseSchema = BaseApiResponseSchema.extend({
  data: OrderWithItemsSchema.optional(),
});
export type OrderApiResponse = z.infer<typeof OrderApiResponseSchema>;

// Order List API Response Schema
export const OrderListApiResponseSchema = BaseApiResponseSchema.extend({
  data: OrderResponseSchema.optional(),
});
export type OrderListApiResponse = z.infer<typeof OrderListApiResponseSchema>;

// Carousel API Response Schema
export const CarouselApiResponseSchema = BaseApiResponseSchema.extend({
  data: CarouselResponseSchema.optional(),
});
export type CarouselApiResponse = z.infer<typeof CarouselApiResponseSchema>;

// Generic ApiResponse for backward compatibility (DEPRECATED)
// Use specific response schemas instead
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
};

// Make this file a module
export {};
