/**
 * 🌸 FloresYa Shared Utils - SINGLE SOURCE OF TRUTH
 * ============================================
 * CONSOLIDATED UTILITIES - ENTERPRISE EDITION
 * ============================================
 *
 * Silicon Valley Standards:
 * ✅ Single Source of Truth for ALL utility functions
 * ✅ Eliminates duplication across frontend/backend
 * ✅ Centralized utility management
 * ✅ Zero tech debt - No duplicate function declarations
 */
/**
 * Simple omit function to avoid lodash dependency
 * Removes specified keys from an object
 */
export declare function omitFunction<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K | K[]): Omit<T, K>;
/**
 * Pick specific keys from an object
 */
export declare function pickFunction<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Generate a slug from a string
 */
export declare function generateSlug(text: string): string;
/**
 * Capitalize first letter of a string
 */
export declare function capitalize(text: string): string;
/**
 * Convert string to title case
 */
export declare function toTitleCase(text: string): string;
/**
 * Generate a random string of specified length
 */
export declare function generateRandomString(length: number): string;
/**
 * Get time ago string from a date
 */
export declare function getTimeAgo(date: Date): string;
/**
 * Format date for display
 */
export declare function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string;
/**
 * Check if date is today
 */
export declare function isToday(date: Date): boolean;
/**
 * Check if date is yesterday
 */
export declare function isYesterday(date: Date): boolean;
/**
 * Format currency in USD
 */
export declare function formatCurrencyUSD(amount: number): string;
/**
 * Format currency in VES
 */
export declare function formatCurrencyVES(amount: number): string;
/**
 * Round number to specified decimal places
 */
export declare function roundToDecimals(num: number, decimals: number): number;
/**
 * Clamp number between min and max
 */
export declare function clamp(num: number, min: number, max: number): number;
/**
 * Remove duplicates from array
 */
export declare function removeDuplicates<T>(array: T[]): T[];
/**
 * Chunk array into smaller arrays
 */
export declare function chunkArray<T>(array: T[], size: number): T[][];
/**
 * Group array by key function
 */
export declare function groupBy<T, K extends string | number>(array: T[], keyFn: (item: T) => K): Record<K, T[]>;
/**
 * Find item in array by property
 */
export declare function findByProperty<T>(array: T[], property: keyof T, value: unknown): T | undefined;
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate phone number format
 */
export declare function isValidPhone(phone: string): boolean;
/**
 * Validate password strength
 */
export declare function isValidPassword(password: string): boolean;
/**
 * Validate URL format
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Safe error message extraction
 */
export declare function formatError(error: unknown): string;
/**
 * Safe JSON parse with fallback
 */
export declare function safeJsonParse<T>(jsonString: string, fallback: T): T;
/**
 * Safe JSON stringify with fallback
 */
export declare function safeJsonStringify(obj: unknown, fallback?: string): string;
/**
 * Type guard for checking if value is a string
 */
export declare function isString(value: unknown): value is string;
/**
 * Type guard for checking if value is a number
 */
export declare function isNumber(value: unknown): value is number;
/**
 * Type guard for checking if value is a boolean
 */
export declare function isBoolean(value: unknown): value is boolean;
/**
 * Type guard for checking if value is an object
 */
export declare function isObject(value: unknown): value is Record<string, unknown>;
/**
 * Type guard for checking if value is an array
 */
export declare function isArray(value: unknown): value is unknown[];
/**
 * Debounce function calls
 */
export declare function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(func: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Throttle function calls
 */
export declare function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(func: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Simple timer utility
 */
export declare function createTimer(): {
    start: () => void;
    stop: () => number;
    reset: () => void;
};
export {};
