/**
 * 🌸 FloresYa Shared Constants - SINGLE SOURCE OF TRUTH
 * ============================================
 * CONSOLIDATED CONSTANTS - ENTERPRISE EDITION
 * ============================================
 *
 * Silicon Valley Standards:
 * ✅ Single Source of Truth for ALL constants
 * ✅ Eliminates duplication across frontend/backend
 * ✅ Centralized constant management
 * ✅ Zero tech debt - No duplicate constant declarations
 */

// ============================================
// PAGINATION CONSTANTS
// ============================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================
// DATABASE TABLE NAMES
// ============================================

export const Tables = {
  USERS: 'users',
  PRODUCTS: 'products',
  PRODUCT_IMAGES: 'product_images',
  OCCASIONS: 'occasions',
  PRODUCT_OCCASIONS: 'product_occasions',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  ORDER_STATUS_HISTORY: 'order_status_history',
  PAYMENT_METHODS: 'payment_methods',
  PAYMENTS: 'payments',
  SETTINGS: 'settings'
} as const;

// ============================================
// VALIDATION CONSTANTS
// ============================================

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  PHONE_REGEX: /^\+?\d{10,15}$/,
  PASSWORD_MIN_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
} as const;

// ============================================
// LOGGING CONSTANTS
// ============================================

export const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  SUCCESS: 'SUCCESS',
  API: 'API',
  DB: 'DB',
  SECURITY: 'SECURITY',
  PERF: 'PERF'
} as const;

export const LOG_CONFIG = {
  DEFAULT_BUFFER_SIZE: 1000,
  DEFAULT_FLUSH_INTERVAL: 30000, // 30 seconds
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  DEFAULT_LOG_LEVEL: 'INFO'
} as const;

// ============================================
// IMAGE PROCESSING CONSTANTS
// ============================================

export const IMAGE_SIZES = {
  THUMB: { width: 150, height: 150 },
  SMALL: { width: 300, height: 300 },
  MEDIUM: { width: 600, height: 600 },
  LARGE: { width: 1200, height: 1200 }
} as const;

export const IMAGE_QUALITY = {
  WEBP: 85,
  JPEG: 85
} as const;

// ============================================
// API CONSTANTS
// ============================================

export const API_ENDPOINTS = {
  BASE_URL: '/api',
  USERS: '/api/users',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  OCCASIONS: '/api/occasions',
  IMAGES: '/api/images',
  LOGS: '/api/logs',
  DASHBOARD: '/api/dashboard'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const;

// ============================================
// BUSINESS LOGIC CONSTANTS
// ============================================

export const ORDER_STATUS_FLOW = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  SUPPORT: 'support'
} as const;

export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  MOBILE_PAYMENT: 'mobile_payment',
  CASH: 'cash',
  CARD: 'card'
} as const;

// ============================================
// FRONTEND CONSTANTS
// ============================================

export const UI_CONSTANTS = {
  CAROUSEL_ITEMS_PER_PAGE: 8,
  DEFAULT_PRODUCTS_PER_PAGE: 20,
  MAX_PRODUCTS_PER_PAGE: 100,
  RECENT_PRODUCTS_LIMIT: 5,
  RECENT_ORDERS_LIMIT: 5,
  DASHBOARD_RECENT_LIMIT: 3
} as const;

export const ANIMATION_TIMINGS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000
} as const;

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  GENERIC_ERROR: 'Ha ocurrido un error inesperado',
  NETWORK_ERROR: 'Error de conexión. Por favor, inténtalo de nuevo.',
  VALIDATION_ERROR: 'Por favor, verifica los datos ingresados.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  SERVER_ERROR: 'Error interno del servidor. Por favor, inténtalo más tarde.'
} as const;

// ============================================
// SUCCESS MESSAGES
// ============================================

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
  USER_CREATED: 'Usuario creado exitosamente',
  USER_UPDATED: 'Usuario actualizado exitosamente',
  USER_DELETED: 'Usuario eliminado exitosamente',
  PRODUCT_CREATED: 'Producto creado exitosamente',
  PRODUCT_UPDATED: 'Producto actualizado exitosamente',
  PRODUCT_DELETED: 'Producto eliminado exitosamente',
  ORDER_CREATED: 'Orden creada exitosamente',
  ORDER_UPDATED: 'Orden actualizada exitosamente',
  IMAGE_UPLOADED: 'Imagen subida exitosamente'
} as const;

// Make this file a module
export {};