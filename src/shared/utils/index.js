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
// ============================================
// OBJECT UTILITIES
// ============================================
/**
 * Simple omit function to avoid lodash dependency
 * Removes specified keys from an object
 */
export function omitFunction(obj, keys) {
    const result = { ...obj };
    const keysToRemove = Array.isArray(keys) ? keys : [keys];
    keysToRemove.forEach(key => delete result[key]);
    return result;
}
/**
 * Pick specific keys from an object
 */
export function pickFunction(obj, keys) {
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}
/**
 * Deep clone an object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (Array.isArray(obj)) {
        const clonedArray = [];
        for (let i = 0; i < obj.length; i++) {
            clonedArray[i] = deepClone(obj[i]);
        }
        return clonedArray;
    }
    const clonedObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }
    return clonedObj;
}
// ============================================
// STRING UTILITIES
// ============================================
/**
 * Generate a slug from a string
 */
export function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
/**
 * Capitalize first letter of a string
 */
export function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
/**
 * Convert string to title case
 */
export function toTitleCase(text) {
    return text
        .toLowerCase()
        .split(' ')
        .map(word => capitalize(word))
        .join(' ');
}
/**
 * Generate a random string of specified length
 */
export function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// ============================================
// DATE/TIME UTILITIES
// ============================================
/**
 * Get time ago string from a date
 */
export function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1)
        return 'Justo ahora';
    if (diffMins < 60)
        return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24)
        return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7)
        return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-ES');
}
/**
 * Format date for display
 */
export function formatDate(date, options) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return dateObj.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
}
/**
 * Check if date is today
 */
export function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}
/**
 * Check if date is yesterday
 */
export function isYesterday(date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
}
// ============================================
// NUMBER UTILITIES
// ============================================
/**
 * Format currency in USD
 */
export function formatCurrencyUSD(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}
/**
 * Format currency in VES
 */
export function formatCurrencyVES(amount) {
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2
    }).format(amount);
}
/**
 * Round number to specified decimal places
 */
export function roundToDecimals(num, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}
/**
 * Clamp number between min and max
 */
export function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}
// ============================================
// ARRAY UTILITIES
// ============================================
/**
 * Remove duplicates from array
 */
export function removeDuplicates(array) {
    return [...new Set(array)];
}
/**
 * Chunk array into smaller arrays
 */
export function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
/**
 * Group array by key function
 */
export function groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}
/**
 * Find item in array by property
 */
export function findByProperty(array, property, value) {
    return array.find(item => item[property] === value);
}
// ============================================
// VALIDATION UTILITIES
// ============================================
/**
 * Validate email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email.trim());
}
/**
 * Validate phone number format
 */
export function isValidPhone(phone) {
    const phoneRegex = /^\+?\d{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}
/**
 * Validate password strength
 */
export function isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}
/**
 * Validate URL format
 */
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
// ============================================
// ERROR HANDLING UTILITIES
// ============================================
/**
 * Safe error message extraction
 */
export function formatError(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return formatError(error);
}
/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse(jsonString, fallback) {
    try {
        return JSON.parse(jsonString);
    }
    catch {
        return fallback;
    }
}
/**
 * Safe JSON stringify with fallback
 */
export function safeJsonStringify(obj, fallback = '{}') {
    try {
        return JSON.stringify(obj);
    }
    catch {
        return fallback;
    }
}
// ============================================
// TYPE GUARDS
// ============================================
/**
 * Type guard for checking if value is a string
 */
export function isString(value) {
    return typeof value === 'string';
}
/**
 * Type guard for checking if value is a number
 */
export function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}
/**
 * Type guard for checking if value is a boolean
 */
export function isBoolean(value) {
    return typeof value === 'boolean';
}
/**
 * Type guard for checking if value is an object
 */
export function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/**
 * Type guard for checking if value is an array
 */
export function isArray(value) {
    return Array.isArray(value);
}
// ============================================
// PERFORMANCE UTILITIES
// ============================================
/**
 * Debounce function calls
 */
export function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}
/**
 * Throttle function calls
 */
export function throttle(func, delay) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
}
/**
 * Simple timer utility
 */
export function createTimer() {
    let startTime = 0;
    let elapsed = 0;
    return {
        start: () => {
            startTime = Date.now() - elapsed;
        },
        stop: () => {
            elapsed = Date.now() - startTime;
            return elapsed;
        },
        reset: () => {
            startTime = 0;
            elapsed = 0;
        }
    };
}
