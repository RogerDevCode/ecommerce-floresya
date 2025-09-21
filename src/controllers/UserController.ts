/**
 * 🌸 FloresYa User Controller - Enterprise TypeScript Edition
 * RESTful API controller with comprehensive validation and security
 */

import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { type UserCreateRequest, UserQuery, UserUpdateRequest, supabaseService } from '../config/supabase.js';
import { userService } from '../services/UserService.js';

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
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const query: UserQuery = {
        page: parseInt(req.query.page as string) ?? 1,
        limit: parseInt(req.query.limit as string) ?? 20,
        search: req.query.search as string,
        role: req.query.role as 'user' | 'admin' | 'support',
        is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
        email_verified: req.query.email_verified ? req.query.email_verified === 'true' : undefined,
        sort_by: req.query.sort_by as 'email' | 'full_name' | 'role' | 'created_at' | 'updated_at' ?? 'created_at',
        sort_direction: req.query.sort_direction as 'asc' | 'desc' ?? 'desc'
      };

      const result = await userService.getAllUsers(query);

      if (!result.success) {
        res.status(500).json(result);
        return;
      }

      res.status(200).json(result);

    } catch (error) {
      console.error('UserController.getAllUsers error:', error);
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const id = parseInt(req.params.id ?? '0');
      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
          error: 'INVALID_ID'
        });
        return;
      }
      const result = await userService.getUserById(id);

      if (!result.success) {
        const statusCode = result.error === 'USER_NOT_FOUND' ? 404 : 500;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);

    } catch (error) {
      console.error('UserController.getUserById error:', error);
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const userData: UserCreateRequest = req.body;
      const result = await userService.createUser(userData);

      if (!result.success) {
        let statusCode = 500;
        if (result.error === 'EMAIL_EXISTS') {statusCode = 409;}
        if (result.error === 'VALIDATION_ERROR') {statusCode = 400;}

        res.status(statusCode).json(result);
        return;
      }

      res.status(201).json(result);

    } catch (error) {
      console.error('UserController.createUser error:', error);
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const id = parseInt(req.params.id ?? '0');
      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
          error: 'INVALID_ID'
        });
        return;
      }
      const userData: UserUpdateRequest = { ...req.body, id };
      const result = await userService.updateUser(id, userData);

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
      console.error('UserController.updateUser error:', error);
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const id = parseInt(req.params.id ?? '0');
      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
          error: 'INVALID_ID'
        });
        return;
      }
      const result = await userService.toggleUserActive(id);

      if (!result.success) {
        const statusCode = result.error === 'USER_NOT_FOUND' ? 404 : 500;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);

    } catch (error) {
      console.error('UserController.toggleUserActive error:', error);
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const id = parseInt(req.params.id ?? '0');
      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
          error: 'INVALID_ID'
        });
        return;
      }

      // Get user data first to check references
      const userData = await userService.getUserById(id);
      if (!userData.success) {
        res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
        return;
      }

      // Check for references in related tables
      const hasReferences = await this.checkUserReferences(id);

      if (hasReferences) {
        // Logical deletion - just deactivate
        const updateResult = await userService.updateUser(id, { id, is_active: false });

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
        const result = await userService.deleteUser(id);

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
      console.error('UserController.deleteUser error:', error);
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
    try {
      // Check orders table
      const { data: orders, error: ordersError } = await supabaseService
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (ordersError) {
        console.warn('Error checking user orders:', ordersError.message);
      } else if (orders && orders.length > 0) {
        return true;
      }

      // Check payments table
      const { data: payments, error: paymentsError } = await supabaseService
        .from('payments')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (paymentsError) {
        console.warn('Error checking user payments:', paymentsError.message);
      } else if (payments && payments.length > 0) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking user references:', error);
      throw error;
    }
  }
}

// Validation middleware using express-validator
export const userValidators = {
  // Validation for getting all users
  getAllUsers: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Search term too long'),
    query('role')
      .optional()
      .isIn(['user', 'admin', 'support'])
      .withMessage('Invalid role'),
    query('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be boolean'),
    query('email_verified')
      .optional()
      .isBoolean()
      .withMessage('email_verified must be boolean'),
    query('sort_by')
      .optional()
      .isIn(['email', 'full_name', 'role', 'created_at', 'updated_at'])
      .withMessage('Invalid sort field'),
    query('sort_direction')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Invalid sort direction')
  ],

  // Validation for getting user by ID
  getUserById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer')
  ],

  // Validation for creating user
  createUser: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('full_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .matches(/^\+?\d{10,15}$/)
      .withMessage('Phone must be 10-15 digits with optional + prefix'),
    body('role')
      .isIn(['user', 'admin', 'support'])
      .withMessage('Role must be user, admin, or support'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be boolean'),
    body('email_verified')
      .optional()
      .isBoolean()
      .withMessage('email_verified must be boolean')
  ],

  // Validation for updating user
  updateUser: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('full_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .matches(/^\+?\d{10,15}$/)
      .withMessage('Phone must be 10-15 digits with optional + prefix'),
    body('role')
      .optional()
      .isIn(['user', 'admin', 'support'])
      .withMessage('Role must be user, admin, or support'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be boolean'),
    body('email_verified')
      .optional()
      .isBoolean()
      .withMessage('email_verified must be boolean')
  ],

  // Validation for toggling user active status
  toggleUserActive: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer')
  ],

  // Validation for deleting user
  deleteUser: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer')
  ]
};

export const userController = new UserController();