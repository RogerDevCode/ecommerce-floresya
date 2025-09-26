/**
 * 🌸 FloresYa tRPC Product Router
 * ============================================
 * Router para operaciones relacionadas con productos
 * Migrado desde ProductController con type safety completo
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { typeSafeDatabaseService } from '../../../services/TypeSafeDatabaseService.js';
import { ProductSchema } from '../../../shared/types/index.js';
import { router, publicProcedure, adminProcedure } from '../trpc.js';

// ============================================
// INPUT SCHEMAS
// ============================================

const ProductListQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  occasion_id: z.number().int().positive().optional(),
});

const ProductCreateSchema = z.object({
  name: z.string().min(1).max(255),
  summary: z.string().optional(),
  description: z.string().optional(),
  price_usd: z.number().positive(),
  price_ves: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  sku: z.string().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  carousel_order: z.number().int().positive().optional(),
});

// ============================================
// PRODUCT ROUTER
// ============================================

export const productRouter = router({
  /**
   * Listar productos - Público
   */
  list: publicProcedure
    .input(ProductListQuerySchema)
    .output(
      z.object({
        success: z.boolean(),
        data: z.object({
          products: z.array(ProductSchema),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
          }),
        }).optional(),
        message: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const query = {
          ...input,
          sort_by: 'created_at' as const,
          sort_direction: 'desc' as const,
        };

        // Get all products and apply filtering manually
        // TODO: Implement server-side filtering and pagination for better performance
        let filteredProducts = await typeSafeDatabaseService.getProducts();

        // Apply filters
        if (input.search) {
          const searchTerm = input.search.toLowerCase();
          filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
          );
        }

        if (input.active !== undefined) {
          filteredProducts = filteredProducts.filter(product => product.active === input.active);
        }

        if (input.featured !== undefined) {
          filteredProducts = filteredProducts.filter(product => product.featured === input.featured);
        }

        // Apply pagination
        const startIndex = (input.page - 1) * input.limit;
        const endIndex = startIndex + input.limit;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        const result = {
          products: paginatedProducts,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: filteredProducts.length,
            totalPages: Math.ceil(filteredProducts.length / input.limit),
          },
        };

        return {
          success: true,
          data: {
            products: result.products,
            pagination: result.pagination,
          },
          message: 'Productos obtenidos exitosamente',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener productos',
        });
      }
    }),

  /**
   * Obtener producto por ID - Público
   */
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .output(
      z.object({
        success: z.boolean(),
        data: ProductSchema.optional(),
        message: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { id } = input;

        const product = await typeSafeDatabaseService.getProductById(id);

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Producto no encontrado',
          });
        }

        return {
          success: true,
          data: product,
          message: 'Producto obtenido exitosamente',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener producto',
        });
      }
    }),

  /**
   * Crear producto - Solo admin
   */
  create: adminProcedure
    .input(ProductCreateSchema)
    .output(
      z.object({
        success: z.boolean(),
        data: ProductSchema.optional(),
        message: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Create product using real TypeSafeDatabaseService method
        const newProduct = await typeSafeDatabaseService.createProduct(input);

        if (!newProduct) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error al crear producto',
          });
        }

        return {
          success: true,
          data: newProduct,
          message: 'Producto creado exitosamente',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al crear producto',
        });
      }
    }),

  /**
   * Obtener productos activos (para carrusel) - Público
   */
  getActive: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(50).default(8) }))
    .output(
      z.object({
        success: z.boolean(),
        data: z.array(z.object({ name: z.string() })).optional(),
        message: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const products = await typeSafeDatabaseService.getActiveProducts();

        return {
          success: true,
          data: products.slice(0, input.limit),
          message: 'Productos activos obtenidos exitosamente',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener productos activos',
        });
      }
    }),
});