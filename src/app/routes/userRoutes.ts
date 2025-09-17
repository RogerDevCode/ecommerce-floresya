/**
 * 🌸 FloresYa User Routes - TypeScript Enterprise Edition
 * RESTful API routes for user management with admin authentication
 */

import { Router } from 'express';
import { userController, userValidators } from '../../controllers/UserController.js';
import { authenticateAdmin } from '../middleware/auth.js';

export function createUserRoutes(): Router {
  const router = Router();

  // Apply admin authentication to all user routes
  router.use(authenticateAdmin);

  /**
   * GET /api/users - Get all users with filtering and pagination
   * Query parameters:
   * - page: number (default: 1)
   * - limit: number (default: 20, max: 100)
   * - search: string (searches in email and full_name)
   * - role: 'user' | 'admin' | 'support'
   * - is_active: boolean
   * - email_verified: boolean
   * - sort_by: 'email' | 'full_name' | 'role' | 'created_at' | 'updated_at'
   * - sort_direction: 'asc' | 'desc'
   */
  router.get('/',
    userValidators.getAllUsers,
    userController.getAllUsers.bind(userController)
  );

  /**
   * GET /api/users/:id - Get user by ID
   */
  router.get('/:id',
    userValidators.getUserById,
    userController.getUserById.bind(userController)
  );

  /**
   * POST /api/users - Create new user
   * Body: UserCreateRequest
   */
  router.post('/',
    userValidators.createUser,
    userController.createUser.bind(userController)
  );

  /**
   * PUT /api/users/:id - Update user
   * Body: UserUpdateRequest
   */
  router.put('/:id',
    userValidators.updateUser,
    userController.updateUser.bind(userController)
  );

  /**
   * PATCH /api/users/:id/toggle-active - Toggle user active status
   */
  router.patch('/:id/toggle-active',
    userValidators.toggleUserActive,
    userController.toggleUserActive.bind(userController)
  );

  /**
   * DELETE /api/users/:id - Delete user (with safety checks)
   * Only allows deletion if user has no related orders or payments
   */
  router.delete('/:id',
    userValidators.deleteUser,
    userController.deleteUser.bind(userController)
  );

  return router;
}