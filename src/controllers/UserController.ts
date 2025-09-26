/**
 * 🌸 FloresYa User Controller - ZOD VALIDATED EDITION
 * RESTful API controller with runtime Zod validation - NO MORE EXPRESS-VALIDATOR!
 */

import { Request, Response } from 'express';
import { z } from 'zod';

import { typeSafeDatabaseService } from '../services/TypeSafeDatabaseService.js';
import { userService } from '../services/UserService.js';
import {
  // Types only (no unused schemas)
  UserCreateRequest,
  UserQuery,
  UserUpdateRequest,
  UserApiResponse,
  UserListApiResponse
} from '../shared/types/index.js';

// ============================================
// ZOD VALIDATION HELPERS - GOODBYE EXPRESS-VALIDATOR!
// ============================================

/**
 * Validates request body with Zod schema
 */
function validateRequestBody<T>(schema: z.ZodSchema<T>, req: Request): T {
  try {
    return schema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      throw new ValidationError('Request body validation failed', errors);
    }
    throw error;
  }
}

/**
 * Validates request params with Zod schema
 */
function validateRequestParams<T>(schema: z.ZodSchema<T>, req: Request): T {
  try {
    return schema.parse(req.params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      throw new ValidationError('Request params validation failed', errors);
    }
    throw error;
  }
}

/**
 * Validates request query with Zod schema
 */
function validateRequestQuery<T>(schema: z.ZodSchema<T>, req: Request): T {
  try {
    return schema.parse(req.query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      throw new ValidationError('Request query validation failed', errors);
    }
    throw error;
  }
}

/**
 * Custom validation error class
 */
class ValidationError extends Error {
  constructor(public message: string, public errors: Array<{ field: string; message: string; code: string }>) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================
// ZOD REQUEST SCHEMAS FOR VALIDATION
// ============================================

const UserIdParamsSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive())
});

const UserCreateRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin']).default('user')
});

const UserUpdateRequestSchema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
  is_active: z.boolean().optional(),
  email_verified: z.boolean().optional()
}).strict(); // Prevent additional fields

const UserQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(100)).optional(),
  search: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
  is_active: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  email_verified: z.string().transform(val => val === 'true').pipe(z.boolean()).optional()
});

export class UserController {

  /**
   * @swagger
   * components:
   *   schemas:
   *     User:
   *       type: object
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier
   *         email:
   *           type: string
   *           format: email
   *           description: User email address
   *         full_name:
   *           type: string
   *           description: Full name of the user
   *         phone:
   *           type: string
   *           nullable: true
   *           description: Phone number
   *         role:
   *           type: string
   *           enum: [user, admin, support]
   *           description: User role
   *         is_active:
   *           type: boolean
   *           description: Whether user is active
   *         email_verified:
   *           type: boolean
   *           description: Whether email is verified
   *         created_at:
   *           type: string
   *           format: date-time
   *         updated_at:
   *           type: string
   *           format: date-time
   *     UserCreateRequest:
   *       type: object
   *       required: [email, password, full_name, role]
   *       properties:
   *         email:
   *           type: string
   *           format: email
   *         password:
   *           type: string
   *           minLength: 8
   *         full_name:
   *           type: string
   *           minLength: 2
   *         phone:
   *           type: string
   *           nullable: true
   *         role:
   *           type: string
   *           enum: [user, admin, support]
   *         is_active:
   *           type: boolean
   *           default: true
   *         email_verified:
   *           type: boolean
   *           default: false
   *     UserUpdateRequest:
   *       type: object
   *       properties:
   *         email:
   *           type: string
   *           format: email
   *         password:
   *           type: string
   *           minLength: 8
   *         full_name:
   *           type: string
   *           minLength: 2
   *         phone:
   *           type: string
   *           nullable: true
   *         role:
   *           type: string
   *           enum: [user, admin, support]
   *         is_active:
   *           type: boolean
   *         email_verified:
   *           type: boolean
   */

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Get all users with filtering and pagination
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in email and full name
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [user, admin, support]
   *         description: Filter by role
   *       - in: query
   *         name: is_active
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - in: query
   *         name: email_verified
   *         schema:
   *           type: boolean
   *         description: Filter by email verification status
   *       - in: query
   *         name: sort_by
   *         schema:
   *           type: string
   *           enum: [email, full_name, role, created_at, updated_at]
   *           default: created_at
   *         description: Sort field
   *       - in: query
   *         name: sort_direction
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Sort direction
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     users:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/User'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         current_page:
   *                           type: integer
   *                         total_pages:
   *                           type: integer
   *                         total_items:
   *                           type: integer
   *                         items_per_page:
   *                           type: integer
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid query parameters
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       500:
   *         description: Internal server error
   */
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // 🔥 ZOD RUNTIME VALIDATION - NO MORE MANUAL PARSING!
      const query = validateRequestQuery(UserQuerySchema, req);

      // Convert to UserQuery type (with defaults)
      const userQuery: UserQuery = {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        search: query.search,
        role: query.role,
        is_active: query.is_active,
        email_verified: query.email_verified,
        sort_by: 'created_at', // Default
        sort_direction: 'desc' // Default
      };

      // Call service with validated query
      const result: UserListApiResponse = await userService.getAllUsers(userQuery);

      // Service response already validated
      const validatedResponse = result;

      if (!validatedResponse.success) {
        res.status(500).json(validatedResponse);
        return;
      }

      res.status(200).json(validatedResponse);

    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid user ID
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  public async getUserById(req: Request, res: Response): Promise<void> {
    try {
      // 🔥 ZOD RUNTIME VALIDATION - AUTOMATIC ID PARSING & VALIDATION!
      const params = validateRequestParams(UserIdParamsSchema, req);

      // Call service with validated ID
      const result: UserApiResponse = await userService.getUserById(params.id);

      if (!result.success) {
        const statusCode = result.error === 'USER_NOT_FOUND' ? 404 : 500;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);

    } catch (error) {
            res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Create a new user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserCreateRequest'
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation errors
   *       409:
   *         description: Email already exists
   *       500:
   *         description: Internal server error
   */
  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      // 🔥 ZOD RUNTIME VALIDATION - CREATE USER!
      const validatedData = validateRequestBody(UserCreateRequestSchema, req);

      // Convert to expected type
      const userData: UserCreateRequest = {
        ...validatedData,
        full_name: validatedData.full_name || '' // Ensure required field
      };

      const result: UserApiResponse = await userService.createUser(userData);

      if (!result.success) {
        let statusCode = 500;
        if (result.error === 'EMAIL_EXISTS') {statusCode = 409;}
        if (result.error === 'VALIDATION_ERROR') {statusCode = 400;}

        res.status(statusCode).json(result);
        return;
      }

      res.status(201).json(result);

    } catch (error) {
            res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Update user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserUpdateRequest'
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation errors
   *       404:
   *         description: User not found
   *       409:
   *         description: Email already exists
   *       500:
   *         description: Internal server error
   */
  public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      // 🔥 ZOD VALIDATION - PARAMS + BODY!
      const params = validateRequestParams(UserIdParamsSchema, req);
      const validatedData = validateRequestBody(UserUpdateRequestSchema, req);

      // Convert to expected type with ID
      const userData: UserUpdateRequest = {
        ...validatedData,
        id: params.id
      };

      const result: UserApiResponse = await userService.updateUser(params.id, userData);

      if (!result.success) {
        let statusCode = 500;
        if (result.error === 'USER_NOT_FOUND') {statusCode = 404;}
        if (result.error === 'EMAIL_EXISTS') {statusCode = 409;}
        if (result.error === 'VALIDATION_ERROR') {statusCode = 400;}

        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);

    } catch (error) {
            res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * @swagger
   * /api/users/{id}/toggle-active:
   *   patch:
   *     summary: Toggle user active status
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     responses:
   *       200:
   *         description: User status toggled successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid user ID
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  public async toggleUserActive(req: Request, res: Response): Promise<void> {
    try {
      // 🔥 ZOD VALIDATION - TOGGLE USER ACTIVE!
      const params = validateRequestParams(UserIdParamsSchema, req);
      const result: UserApiResponse = await userService.toggleUserActive(params.id);

      if (!result.success) {
        const statusCode = result.error === 'USER_NOT_FOUND' ? 404 : 500;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);

    } catch (error) {
            res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * @swagger
   * /api/users/{id}:
   *   delete:
   *     summary: Delete user (conditional logic)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     responses:
   *       200:
   *         description: User logically deleted (deactivated)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     deletion_type:
   *                       type: string
   *                       enum: [logical, physical]
   *                       example: logical
   *                     has_references:
   *                       type: boolean
   *                       example: true
   *                 message:
   *                   type: string
   *                   example: "User deactivated successfully (has orders or payments)"
   *       204:
   *         description: User physically deleted (no content returned)
   *       400:
   *         description: Invalid user ID
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      // 🔥 ZOD VALIDATION - DELETE USER!
      const params = validateRequestParams(UserIdParamsSchema, req);

      // Get user data first to check references
      const userData = await userService.getUserById(params.id);
      if (!userData.success) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
        return;
      }

      // Check for references in related tables
      const hasReferences = await this.checkUserReferences(params.id);

      if (hasReferences) {
        // Logical deletion - just deactivate
        const updateResult = await userService.updateUser(params.id, { id: params.id, is_active: false });

        if (!updateResult.success) {
          res.status(500).json({
            success: false,
            message: 'Failed to deactivate user',
            error: 'UPDATE_ERROR'
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: {
            user: updateResult.data,
            deletion_type: 'logical',
            has_references: true
          },
          message: 'User deactivated successfully (has orders or payments)'
        });
      } else {
        // Physical deletion - no references, safe to delete
        const result = await userService.deleteUser(params.id);

        if (!result.success) {
          let statusCode = 500;
          if (result.error === 'USER_NOT_FOUND') {statusCode = 404;}

          res.status(statusCode).json(result);
          return;
        }

        // Return 204 No Content for successful physical deletion
        res.status(204).send();
      }

    } catch (error) {
            res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Check if user has references in related tables
   */
  private async checkUserReferences(userId: number): Promise<boolean> {
    // Use TypeSafe database service client for direct table access
    const client = typeSafeDatabaseService.getClient();

    // Check orders table
    try {
      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (ordersError) {
        return false;
      } else if (orders && orders.length > 0) {
        return true;
      }
    } catch (orderError) {
      return false;
    }

    // Check payments table
    try {
      const { data: payments, error: paymentsError } = await client
        .from('payments')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (paymentsError) {
        return false;
      } else if (payments && payments.length > 0) {
        return true;
      }
    } catch (paymentError) {
      return false;
    }

    return false;
  }
}

// 🔥 LEGACY EXPRESS-VALIDATOR REMOVED - NOW USING ZOD POWER!
// All validation now handled by Zod schemas with runtime validation

// Export controller instance
export const userController = new UserController();
