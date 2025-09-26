/**
 * 🌸 FloresYa Type Guards - Runtime Type Safety
 * ============================================
 * Type guards para validación runtime segura
 * Elimina necesidad de casting inseguro (as any)
 */

import type { Database, Enums } from '../types/index.js';

// ============================================
// DATABASE ENUM TYPE GUARDS
// ============================================

/**
 * Verifica si un valor es un OrderStatus válido
 */
export function isOrderStatus(value: unknown): value is Enums<'order_status'> {
  return typeof value === 'string' &&
    ['pending', 'verified', 'preparing', 'shipped', 'delivered', 'cancelled'].includes(value);
}

/**
 * Verifica si un valor es un PaymentStatus válido
 */
export function isPaymentStatus(value: unknown): value is Enums<'payment_status'> {
  return typeof value === 'string' &&
    ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'].includes(value);
}

/**
 * Verifica si un valor es un UserRole válido
 */
export function isUserRole(value: unknown): value is Enums<'user_role'> {
  return typeof value === 'string' &&
    ['user', 'admin'].includes(value);
}

/**
 * Verifica si un valor es un PaymentMethodType válido
 */
export function isPaymentMethodType(value: unknown): value is Enums<'payment_method_type'> {
  return typeof value === 'string' &&
    ['bank_transfer', 'mobile_payment', 'cash', 'crypto', 'international'].includes(value);
}

/**
 * Verifica si un valor es un ImageSize válido
 */
export function isImageSize(value: unknown): value is Enums<'image_size'> {
  return typeof value === 'string' &&
    ['thumb', 'small', 'medium', 'large'].includes(value);
}

// ============================================
// API RESPONSE TYPE GUARDS
// ============================================

/**
 * Verifica si una respuesta es un ApiResponse válido
 */
export function isApiResponse(obj: unknown): obj is { success: boolean; data?: unknown; message?: string; error?: string } {
  return typeof obj === 'object' &&
         obj !== null &&
         'success' in obj &&
         typeof (obj as any).success === 'boolean';
}

/**
 * Verifica si un objeto tiene propiedades de error de Supabase
 */
export function isSupabaseError(obj: unknown): obj is { error: boolean } {
  return typeof obj === 'object' &&
         obj !== null &&
         'error' in obj &&
         (obj as any).error === true;
}

// ============================================
// DATABASE RECORD TYPE GUARDS
// ============================================

/**
 * Verifica si un objeto es un registro de User válido
 */
export function isUserRecord(obj: unknown): obj is Database['public']['Tables']['users']['Row'] {
  return typeof obj === 'object' &&
         obj !== null &&
         'id' in obj &&
         'email' in obj &&
         typeof (obj as any).id === 'number' &&
         typeof (obj as any).email === 'string';
}

/**
 * Verifica si un objeto es un registro de Product válido
 */
export function isProductRecord(obj: unknown): obj is Database['public']['Tables']['products']['Row'] {
  return typeof obj === 'object' &&
         obj !== null &&
         'id' in obj &&
         'name' in obj &&
         'price_usd' in obj &&
         typeof (obj as any).id === 'number' &&
         typeof (obj as any).name === 'string' &&
         typeof (obj as any).price_usd === 'number';
}

/**
 * Verifica si un objeto es un registro de Order válido
 */
export function isOrderRecord(obj: unknown): obj is Database['public']['Tables']['orders']['Row'] {
  return typeof obj === 'object' &&
         obj !== null &&
         'id' in obj &&
         'customer_email' in obj &&
         'customer_name' in obj &&
         'total_amount_usd' in obj &&
         typeof (obj as any).id === 'number' &&
         typeof (obj as any).customer_email === 'string' &&
         typeof (obj as any).customer_name === 'string' &&
         typeof (obj as any).total_amount_usd === 'number';
}

// ============================================
// ARRAY TYPE GUARDS
// ============================================

/**
 * Verifica si un array contiene solo registros de User válidos
 */
export function isUserRecordArray(arr: unknown): arr is Database['public']['Tables']['users']['Row'][] {
  return Array.isArray(arr) && arr.every(isUserRecord);
}

/**
 * Verifica si un array contiene solo registros de Product válidos
 */
export function isProductRecordArray(arr: unknown): arr is Database['public']['Tables']['products']['Row'][] {
  return Array.isArray(arr) && arr.every(isProductRecord);
}

/**
 * Verifica si un array contiene solo registros de Order válidos
 */
export function isOrderRecordArray(arr: unknown): arr is Database['public']['Tables']['orders']['Row'][] {
  return Array.isArray(arr) && arr.every(isOrderRecord);
}

// ============================================
// UTILITY TYPE GUARDS
// ============================================

/**
 * Verifica si un valor es un string no vacío
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Verifica si un valor es un número positivo
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0;
}

/**
 * Verifica si un valor es un ID válido (número entero positivo)
 */
export function isValidId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Verifica si un objeto tiene una propiedad específica con tipo esperado
 */
export function hasProperty<T, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

/**
 * Type guard para verificar si una respuesta de Supabase contiene datos válidos
 */
export function isValidSupabaseResponse<T>(
  response: { data: T | null; error: any },
  validator: (data: unknown) => data is T
): response is { data: T; error: null } {
  return response.error === null &&
         response.data !== null &&
         validator(response.data);
}