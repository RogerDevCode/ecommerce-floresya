/**
 * 🌸 FloresYa tRPC User Router
 * ============================================
 * Router para operaciones relacionadas con usuarios
 * Migrado desde UserController con type safety completo
 */

import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { typeSafeDatabaseService } from '../../../services/TypeSafeDatabaseService.js';
import {
  UserSchema,
  UserRoleSchema,
} from '../../../shared/types/index.js';
import { isUserRecord, isValidId } from '../../../shared/utils/typeGuards.js';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc.js';

// ============================================
// INPUT SCHEMAS
// ============================================

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: UserRoleSchema.default('user'),
});

const UserUpdateSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email().optional(),
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: UserRoleSchema.optional(),
  is_active: z.boolean().optional(),
  email_verified: z.boolean().optional(),
});

const UserListQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: UserRoleSchema.optional(),
  is_active: z.boolean().optional(),
  email_verified: z.boolean().optional(),
});

// ============================================
// USER ROUTER
// ============================================

export const userRouter = router({
  /**
   * Login - Público
   */
  login: publicProcedure
    .input(LoginSchema)
    .output(
      z.object({
        success: z.boolean(),
        data: z.object({
          token: z.string(),
          user: UserSchema,
        }).optional(),
        message: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { email, password } = input;

        // Buscar usuario por email (usando método disponible)
        const users = await typeSafeDatabaseService.getUsers();
        const user = users.find(u => u.email === email);

        if (!user || !isUserRecord(user)) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Credenciales inválidas',
          });
        }

        // Verificar contraseña
        if (!user.password_hash) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Credenciales inválidas',
          });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Credenciales inválidas',
          });
        }

        // Verificar que el usuario esté activo
        if (!user.is_active) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Usuario inactivo',
          });
        }

        // Generar JWT
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        );

        // Remover password_hash antes de enviar
        const { password_hash, ...safeUser } = user;

        return {
          success: true,
          data: {
            token,
            user: safeUser,
          },
          message: 'Login exitoso',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error interno del servidor',
        });
      }
    }),

  /**
   * Registro - Público
   */
  register: publicProcedure
    .input(RegisterSchema)
    .output(
      z.object({
        success: z.boolean(),
        data: z.object({
          token: z.string(),
          user: UserSchema,
        }).optional(),
        message: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { email, password, full_name, phone, role } = input;

        // Verificar que el email no exista
        const users = await typeSafeDatabaseService.getUsers();
        const existingUser = users.find(u => u.email === email);

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'El email ya está registrado',
          });
        }

        // Hash de la contraseña
        const password_hash = await bcrypt.hash(password, 12);

        // Create user using real TypeSafeDatabaseService method
        const newUser = await typeSafeDatabaseService.createUser({
          email,
          password_hash,
          full_name,
          phone,
          role,
          is_active: true,
          email_verified: false,
        });

        if (!newUser || !isUserRecord(newUser)) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error al crear usuario',
          });
        }

        // Generar JWT
        const token = jwt.sign(
          { userId: newUser.id, email: newUser.email, role: newUser.role },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        );

        // Remover password_hash antes de enviar
        const { password_hash: _, ...safeUser } = newUser;

        return {
          success: true,
          data: {
            token,
            user: safeUser,
          },
          message: 'Usuario registrado exitosamente',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error interno del servidor',
        });
      }
    }),

  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile: protectedProcedure
    .output(
      z.object({
        success: z.boolean(),
        data: UserSchema.optional(),
        message: z.string().optional(),
      })
    )
    .query(async ({ ctx }) => {
      const { password_hash, ...safeUser } = ctx.user;

      return {
        success: true,
        data: safeUser,
        message: 'Perfil obtenido exitosamente',
      };
    }),

  /**
   * Listar usuarios - Solo admin
   */
  list: adminProcedure
    .input(UserListQuerySchema)
    .output(
      z.object({
        success: z.boolean(),
        data: z.object({
          users: z.array(UserSchema),
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

        // Get all users and apply client-side pagination
        // TODO: Implement server-side pagination for better performance
        const allUsers = await typeSafeDatabaseService.getUsers();

        // Apply pagination
        const startIndex = (input.page - 1) * input.limit;
        const endIndex = startIndex + input.limit;
        const paginatedUsers = allUsers.slice(startIndex, endIndex);

        const result = {
          users: paginatedUsers,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: allUsers.length,
            totalPages: Math.ceil(allUsers.length / input.limit),
          },
        };

        // Remover password_hash de todos los usuarios
        const safeUsers = result.users.map(({ password_hash, ...user }) => user);

        return {
          success: true,
          data: {
            users: safeUsers,
            pagination: result.pagination,
          },
          message: 'Usuarios obtenidos exitosamente',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener usuarios',
        });
      }
    }),

  /**
   * Obtener usuario por ID - Solo admin
   */
  getById: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .output(
      z.object({
        success: z.boolean(),
        data: UserSchema.optional(),
        message: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { id } = input;

        if (!isValidId(id)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'ID inválido',
          });
        }

        const user = await typeSafeDatabaseService.getUserById(id);

        if (!user || !isUserRecord(user)) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Usuario no encontrado',
          });
        }

        // Remover password_hash antes de enviar
        const { password_hash, ...safeUser } = user;

        return {
          success: true,
          data: safeUser,
          message: 'Usuario obtenido exitosamente',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al obtener usuario',
        });
      }
    }),

  /**
   * Actualizar usuario - Solo admin
   */
  update: adminProcedure
    .input(UserUpdateSchema)
    .output(
      z.object({
        success: z.boolean(),
        data: UserSchema.optional(),
        message: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        if (!isValidId(id)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'ID inválido',
          });
        }

        // Verificar que el usuario existe
        const existingUser = await typeSafeDatabaseService.getUserById(id);

        if (!existingUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Usuario no encontrado',
          });
        }

        // Si se está actualizando el email, verificar que no esté en uso
        if (updateData.email && updateData.email !== existingUser.email) {
          const users = await typeSafeDatabaseService.getUsers();
          const emailInUse = users.find(u => u.email === updateData.email);
          if (emailInUse) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'El email ya está en uso',
            });
          }
        }

        // Update user using real TypeSafeDatabaseService method
        const updatedUser = await typeSafeDatabaseService.updateUser(id, updateData);

        if (!updatedUser || !isUserRecord(updatedUser)) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error al actualizar usuario',
          });
        }

        // Remover password_hash antes de enviar
        const { password_hash, ...safeUser } = updatedUser;

        return {
          success: true,
          data: safeUser,
          message: 'Usuario actualizado exitosamente',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al actualizar usuario',
        });
      }
    }),
});