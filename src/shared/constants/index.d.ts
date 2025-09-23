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
export declare const DEFAULT_PAGE_SIZE = 20;
export declare const MAX_PAGE_SIZE = 100;
export declare const Tables: {
    readonly USERS: "users";
    readonly PRODUCTS: "products";
    readonly PRODUCT_IMAGES: "product_images";
    readonly OCCASIONS: "occasions";
    readonly PRODUCT_OCCASIONS: "product_occasions";
    readonly ORDERS: "orders";
    readonly ORDER_ITEMS: "order_items";
    readonly ORDER_STATUS_HISTORY: "order_status_history";
    readonly PAYMENT_METHODS: "payment_methods";
    readonly PAYMENTS: "payments";
    readonly SETTINGS: "settings";
};
export declare const VALIDATION_RULES: {
    readonly EMAIL_REGEX: RegExp;
    readonly PHONE_REGEX: RegExp;
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly MAX_FILE_SIZE: number;
    readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/jpg", "image/png", "image/webp"];
};
export declare const LOG_LEVELS: {
    readonly ERROR: "ERROR";
    readonly WARN: "WARN";
    readonly INFO: "INFO";
    readonly DEBUG: "DEBUG";
    readonly SUCCESS: "SUCCESS";
    readonly API: "API";
    readonly DB: "DB";
    readonly SECURITY: "SECURITY";
    readonly PERF: "PERF";
};
export declare const LOG_CONFIG: {
    readonly DEFAULT_BUFFER_SIZE: 1000;
    readonly DEFAULT_FLUSH_INTERVAL: 30000;
    readonly MAX_FILE_SIZE: number;
    readonly MAX_FILES: 5;
    readonly DEFAULT_LOG_LEVEL: "INFO";
};
export declare const IMAGE_SIZES: {
    readonly THUMB: {
        readonly width: 150;
        readonly height: 150;
    };
    readonly SMALL: {
        readonly width: 300;
        readonly height: 300;
    };
    readonly MEDIUM: {
        readonly width: 600;
        readonly height: 600;
    };
    readonly LARGE: {
        readonly width: 1200;
        readonly height: 1200;
    };
};
export declare const IMAGE_QUALITY: {
    readonly WEBP: 85;
    readonly JPEG: 85;
};
export declare const API_ENDPOINTS: {
    readonly BASE_URL: "/api";
    readonly USERS: "/api/users";
    readonly PRODUCTS: "/api/products";
    readonly ORDERS: "/api/orders";
    readonly OCCASIONS: "/api/occasions";
    readonly IMAGES: "/api/images";
    readonly LOGS: "/api/logs";
    readonly DASHBOARD: "/api/dashboard";
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare const ORDER_STATUS_FLOW: {
    readonly PENDING: "pending";
    readonly CONFIRMED: "confirmed";
    readonly PROCESSING: "processing";
    readonly SHIPPED: "shipped";
    readonly DELIVERED: "delivered";
    readonly CANCELLED: "cancelled";
};
export declare const USER_ROLES: {
    readonly ADMIN: "admin";
    readonly USER: "user";
    readonly SUPPORT: "support";
};
export declare const PAYMENT_METHODS: {
    readonly BANK_TRANSFER: "bank_transfer";
    readonly MOBILE_PAYMENT: "mobile_payment";
    readonly CASH: "cash";
    readonly CARD: "card";
};
export declare const UI_CONSTANTS: {
    readonly CAROUSEL_ITEMS_PER_PAGE: 8;
    readonly DEFAULT_PRODUCTS_PER_PAGE: 20;
    readonly MAX_PRODUCTS_PER_PAGE: 100;
    readonly RECENT_PRODUCTS_LIMIT: 5;
    readonly RECENT_ORDERS_LIMIT: 5;
    readonly DASHBOARD_RECENT_LIMIT: 3;
};
export declare const ANIMATION_TIMINGS: {
    readonly FAST: 150;
    readonly NORMAL: 300;
    readonly SLOW: 500;
    readonly EXTRA_SLOW: 1000;
};
export declare const ERROR_MESSAGES: {
    readonly GENERIC_ERROR: "Ha ocurrido un error inesperado";
    readonly NETWORK_ERROR: "Error de conexión. Por favor, inténtalo de nuevo.";
    readonly VALIDATION_ERROR: "Por favor, verifica los datos ingresados.";
    readonly UNAUTHORIZED: "No tienes permisos para realizar esta acción.";
    readonly NOT_FOUND: "El recurso solicitado no fue encontrado.";
    readonly SERVER_ERROR: "Error interno del servidor. Por favor, inténtalo más tarde.";
};
export declare const SUCCESS_MESSAGES: {
    readonly LOGIN_SUCCESS: "Inicio de sesión exitoso";
    readonly LOGOUT_SUCCESS: "Sesión cerrada exitosamente";
    readonly USER_CREATED: "Usuario creado exitosamente";
    readonly USER_UPDATED: "Usuario actualizado exitosamente";
    readonly USER_DELETED: "Usuario eliminado exitosamente";
    readonly PRODUCT_CREATED: "Producto creado exitosamente";
    readonly PRODUCT_UPDATED: "Producto actualizado exitosamente";
    readonly PRODUCT_DELETED: "Producto eliminado exitosamente";
    readonly ORDER_CREATED: "Orden creada exitosamente";
    readonly ORDER_UPDATED: "Orden actualizada exitosamente";
    readonly IMAGE_UPLOADED: "Imagen subida exitosamente";
};
export {};
