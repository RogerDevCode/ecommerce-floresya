/**
 * 🌸 FloresYa Global Types - Strict TypeScript Edition
 * Tipos estrictos para eliminar cualquier uso de 'any'
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
