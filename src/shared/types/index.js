/**
 * 🌸 FloresYa Shared Types - SINGLE SOURCE OF TRUTH
 * ============================================
 * CONSOLIDATED SHARED TYPES - ENTERPRISE EDITION
 * ============================================
 *
 * Silicon Valley Standards:
 * ✅ Single Source of Truth for ALL shared types
 * ✅ Eliminates duplication across frontend/backend
 * ✅ Centralized type management
 * ✅ Zero tech debt - No duplicate interface declarations
 */
export function formatError(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return String(error);
}
export function formatLogData(data) {
    if (!data)
        return {};
    try {
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            // Type guard to safely spread object
            const obj = data;
            const safeObj = {};
            for (const [key, value] of Object.entries(obj)) {
                safeObj[key] = value;
            }
            return safeObj;
        }
        if (typeof data === 'string') {
            return { data };
        }
        if (typeof data === 'number' || typeof data === 'boolean') {
            return { data: data.toString() };
        }
        return { data: JSON.stringify(data) ?? 'null' };
    }
    catch (_error) {
        return { error: 'Failed to format log data', original: 'Unable to stringify data' };
    }
}
