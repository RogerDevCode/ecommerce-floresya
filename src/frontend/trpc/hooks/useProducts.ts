/**
 * 🌸 FloresYa tRPC Products Hooks
 * ============================================
 * Hooks para gestión de productos con type safety completo
 */

import { trpc, safeTRPCCall } from '../client.js';

/**
 * Hook para listar productos
 */
export function useProducts() {
  return {
    async getProducts(params?: {
      page?: number;
      limit?: number;
      search?: string;
      active?: boolean;
      featured?: boolean;
      occasion_id?: number;
    }) {
      return safeTRPCCall(
        () => trpc.product.list.query(params || {}),
        (error) => {
          console.error('Error al obtener productos:', error);
        }
      );
    },

    async getProductById(id: number) {
      return safeTRPCCall(
        () => trpc.product.getById.query({ id }),
        (error) => {
          console.error('Error al obtener producto:', error);
        }
      );
    },

    async getActiveProducts(limit?: number) {
      return safeTRPCCall(
        () => trpc.product.getActive.query({ limit: limit || 8 }),
        (error) => {
          console.error('Error al obtener productos activos:', error);
        }
      );
    },

    async createProduct(productData: {
      name: string;
      summary?: string;
      description?: string;
      price_usd: number;
      price_ves?: number;
      stock?: number;
      sku?: string;
      active?: boolean;
      featured?: boolean;
      carousel_order?: number;
    }) {
      return safeTRPCCall(
        () => trpc.product.create.mutate(productData),
        (error) => {
          console.error('Error al crear producto:', error);
        }
      );
    },
  };
}