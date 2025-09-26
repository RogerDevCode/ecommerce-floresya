/**
 * 🌸 FloresYa tRPC Frontend - Exports consolidados
 * ============================================
 * Punto único de importación para tRPC en frontend
 */

// Cliente principal
export { trpc, handleTRPCError, safeTRPCCall } from './client.js';
export type { TRPCClient } from './client.js';

// Hooks de autenticación
export {
  useLogin,
  useRegister,
  useProfile,
  saveAuthData,
  clearAuthData,
  getStoredUser,
  isAuthenticated,
  getAuthToken,
} from './hooks/useAuth.js';

// Hooks disponibles - Importar individualmente:
// import { useProducts } from './hooks/useProducts.js';
// import { useOrders } from './hooks/useOrders.js';
// import { useOccasions } from './hooks/useOccasions.js';
// import { useDashboard } from './hooks/useDashboard.js';