/**
 * 🌸 FloresYa UserController Unit Tests
 * Comprehensive test suite for UserController endpoints
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UserController } from '../../src/controllers/UserController.js';
import { userService } from '../../src/services/UserService.js';

// Mock TypeSafeDatabaseService
vi.mock('../../src/services/TypeSafeDatabaseService.js', () => ({
  typeSafeDatabaseService: {
    getClient: vi.fn()
  }
}));

// Mock express-validator
vi.mock('express-validator', () => {
  const mockValidationChain = {
    isEmail: vi.fn().mockReturnThis(),
    isLength: vi.fn().mockReturnThis(),
    isIn: vi.fn().mockReturnThis(),
    isInt: vi.fn().mockReturnThis(),
    isBoolean: vi.fn().mockReturnThis(),
    normalizeEmail: vi.fn().mockReturnThis(),
    trim: vi.fn().mockReturnThis(),
    escape: vi.fn().mockReturnThis(),
    matches: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis()
  };

  const defaultValidationResult = {
    isEmpty: vi.fn().mockReturnValue(true),
    array: vi.fn().mockReturnValue([])
  };

  return {
    body: vi.fn().mockReturnValue(mockValidationChain),
    param: vi.fn().mockReturnValue(mockValidationChain),
    query: vi.fn().mockReturnValue(mockValidationChain),
    validationResult: vi.fn().mockReturnValue(defaultValidationResult)
  };
});

// Mock the userService
vi.mock('../../src/services/UserService.js', () => ({
  userService: {
    getAllUsers: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    toggleUserActive: vi.fn(),
    deleteUser: vi.fn()
  }
}));

// Mock express request and response
const mockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  ...overrides
});

const mockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
  };
  return res;
};

const mockNext = vi.fn();

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    controller = new UserController();
    vi.clearAllMocks();

    // Reset the validationResult mock to default (no errors)
    const { validationResult } = await import('express-validator');
    (validationResult as any).mockReturnValue({
      isEmpty: vi.fn().mockReturnValue(true),
      array: vi.fn().mockReturnValue([])
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return users successfully', async () => {
      const mockUsers = {
        users: [
          {
            id: 1,
            email: 'test@example.com',
            full_name: 'Test User',
            role: 'user' as const,
            is_active: true,
            email_verified: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 1,
          items_per_page: 20
        }
      };

      const mockServiceResponse = {
        success: true,
        data: mockUsers,
        message: 'Users retrieved successfully'
      };

      vi.mocked(userService.getAllUsers).mockResolvedValue(mockServiceResponse);

      const req = mockRequest({
        query: { page: '1', limit: '20' }
      });
      const res = mockResponse();

      await controller.getAllUsers(req as any, res as any);

      expect(userService.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: undefined,
        role: undefined,
        is_active: undefined,
        email_verified: undefined,
        sort_by: 'created_at',
        sort_direction: 'desc'
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle validation errors', async () => {
      // Mock validation errors
      const mockErrors = [{ param: 'page', msg: 'Page must be a positive integer' }];
      const { validationResult } = await import('express-validator');
      (validationResult as any).mockReturnValue({
        isEmpty: vi.fn().mockReturnValue(false),
        array: vi.fn().mockReturnValue(mockErrors)
      });

      const req = mockRequest({
        query: { page: 'invalid' }
      });
      const res = mockResponse();

      await controller.getAllUsers(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: mockErrors
      });
    });

    it('should handle service errors', async () => {
      const mockServiceResponse = {
        success: false,
        message: 'Database error',
        error: 'FETCH_USERS_ERROR'
      };

      vi.mocked(userService.getAllUsers).mockResolvedValue(mockServiceResponse);

      const req = mockRequest({
        query: { page: '1', limit: '20' }
      });
      const res = mockResponse();

      await controller.getAllUsers(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle query parameters correctly', async () => {
      const mockUsers = {
        users: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_items: 0,
          items_per_page: 20
        }
      };

      const mockServiceResponse = {
        success: true,
        data: mockUsers,
        message: 'Users retrieved successfully'
      };

      vi.mocked(userService.getAllUsers).mockResolvedValue(mockServiceResponse);

      const req = mockRequest({
        query: {
          page: '2',
          limit: '10',
          search: 'test',
          role: 'admin',
          is_active: 'true',
          email_verified: 'false',
          sort_by: 'email',
          sort_direction: 'asc'
        }
      });
      const res = mockResponse();

      await controller.getAllUsers(req as any, res as any);

      expect(userService.getAllUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'test',
        role: 'admin',
        is_active: true,
        email_verified: false,
        sort_by: 'email',
        sort_direction: 'asc'
      });
    });
  });

  describe('getUserById', () => {
    it('should return user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user' as const,
        is_active: true,
        email_verified: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockServiceResponse = {
        success: true,
        data: mockUser,
        message: 'User retrieved successfully'
      };

      vi.mocked(userService.getUserById).mockResolvedValue(mockServiceResponse);

      const req = mockRequest({
        params: { id: '1' }
      });
      const res = mockResponse();

      await controller.getUserById(req as any, res as any);

      expect(userService.getUserById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle invalid user ID', async () => {
      const req = mockRequest({
        params: { id: 'invalid' }
      });
      const res = mockResponse();

      await controller.getUserById(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid user ID',
        error: 'INVALID_ID'
      });
    });

    it('should handle user not found', async () => {
      const mockServiceResponse = {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      };

      vi.mocked(userService.getUserById).mockResolvedValue(mockServiceResponse);

      const req = mockRequest({
        params: { id: '999' }
      });
      const res = mockResponse();

      await controller.getUserById(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user' as const,
        is_active: true,
        email_verified: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockServiceResponse = {
        success: true,
        data: mockUser,
        message: 'User created successfully'
      };

      vi.mocked(userService.createUser).mockResolvedValue(mockServiceResponse);

      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'TestPassword123',
          full_name: 'Test User',
          role: 'user'
        }
      });
      const res = mockResponse();

      await controller.createUser(req as any, res as any);

      expect(userService.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'TestPassword123',
        full_name: 'Test User',
        role: 'user'
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle validation errors', async () => {
      // Mock validation errors
      const mockErrors = [
        { param: 'email', msg: 'Please provide a valid email' },
        { param: 'password', msg: 'Password must be at least 6 characters' },
        { param: 'full_name', msg: 'Full name must be at least 2 characters' },
        { param: 'role', msg: 'Role must be either admin, manager, or user' }
      ];
      const { validationResult } = await import('express-validator');
      (validationResult as any).mockReturnValue({
        isEmpty: vi.fn().mockReturnValue(false),
        array: vi.fn().mockReturnValue(mockErrors)
      });

      const req = mockRequest({
        body: {
          email: 'invalid-email',
          password: '123',
          full_name: 'T',
          role: 'invalid'
        }
      });
      const res = mockResponse();

      await controller.createUser(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: mockErrors
      });
    });

    it('should handle email already exists error', async () => {
      const mockServiceResponse = {
        success: false,
        message: 'Email already exists',
        error: 'EMAIL_EXISTS'
      };

      vi.mocked(userService.createUser).mockResolvedValue(mockServiceResponse);

      const req = mockRequest({
        body: {
          email: 'existing@example.com',
          password: 'TestPassword123',
          full_name: 'Test User',
          role: 'user' as const
        }
      });
      const res = mockResponse();

      await controller.createUser(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'updated@example.com',
        full_name: 'Updated User',
        role: 'admin' as const,
        is_active: true,
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockServiceResponse = {
        success: true,
        data: mockUser,
        message: 'User updated successfully'
      };

      vi.mocked(userService.updateUser).mockResolvedValue(mockServiceResponse);

      const req = mockRequest({
        params: { id: '1' },
        body: {
          email: 'updated@example.com',
          full_name: 'Updated User',
          role: 'admin' as const
        }
      });
      const res = mockResponse();

      await controller.updateUser(req as any, res as any);

      expect(userService.updateUser).toHaveBeenCalledWith(1, {
        id: 1,
        email: 'updated@example.com',
        full_name: 'Updated User',
        role: 'admin'
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle invalid user ID', async () => {
      const req = mockRequest({
        params: { id: 'invalid' },
        body: {
          email: 'updated@example.com'
        }
      });
      const res = mockResponse();

      await controller.updateUser(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid user ID',
        error: 'INVALID_ID'
      });
    });

    it('should handle user not found error', async () => {
      const mockServiceResponse = {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      };

      vi.mocked(userService.updateUser).mockResolvedValue(mockServiceResponse);

      const req = mockRequest({
        params: { id: '999' },
        body: {
          email: 'updated@example.com'
        }
      });
      const res = mockResponse();

      await controller.updateUser(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
    });
  });

  describe('toggleUserActive', () => {
    it('should toggle user active status successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user' as const,
        is_active: false,
        email_verified: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockServiceResponse = {
        success: true,
        data: mockUser,
        message: 'User status changed successfully'
      };

      vi.mocked(userService.toggleUserActive).mockResolvedValue(mockServiceResponse);

      const req = mockRequest({
        params: { id: '1' }
      });
      const res = mockResponse();

      await controller.toggleUserActive(req as any, res as any);

      expect(userService.toggleUserActive).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle invalid user ID', async () => {
      const req = mockRequest({
        params: { id: 'invalid' }
      });
      const res = mockResponse();

      await controller.toggleUserActive(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid user ID',
        error: 'INVALID_ID'
      });
    });

    it('should handle user not found error', async () => {
      const mockServiceResponse = {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      };

      vi.mocked(userService.toggleUserActive).mockResolvedValue(mockServiceResponse);

      const req = mockRequest({
        params: { id: '999' }
      });
      const res = mockResponse();

      await controller.toggleUserActive(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(mockServiceResponse);
    });
  });

  describe('deleteUser', () => {
    it('should perform logical deletion when user has references', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user' as const,
        is_active: false,
        email_verified: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock getUserById to return user data
      const getUserResponse = {
        success: true,
        data: mockUser,
        message: 'User retrieved successfully'
      };

      // Mock checkUserReferences to return true (has references)
      vi.spyOn(controller as any, 'checkUserReferences').mockResolvedValue(true);

      // Mock updateUser for logical deletion
      const updateUserResponse = {
        success: true,
        data: { ...mockUser, is_active: false },
        message: 'User updated successfully'
      };

      vi.mocked(userService.getUserById).mockResolvedValue(getUserResponse);
      vi.mocked(userService.updateUser).mockResolvedValue(updateUserResponse);

      const req = mockRequest({
        params: { id: '1' }
      });
      const res = mockResponse();

      await controller.deleteUser(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: { ...mockUser, is_active: false },
          deletion_type: 'logical',
          has_references: true
        },
        message: 'User deactivated successfully (has orders or payments)'
      });
    });

    it('should perform physical deletion when user has no references', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user' as const,
        is_active: true,
        email_verified: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const getUserResponse = {
        success: true,
        data: mockUser,
        message: 'User retrieved successfully'
      };

      const deleteUserResponse = {
        success: true,
        data: { deleted_user: { id: 1, email: 'test@example.com' } },
        message: 'User deleted successfully'
      };

      // Mock checkUserReferences to return false (no references)
      vi.spyOn(controller as any, 'checkUserReferences').mockResolvedValue(false);

      vi.mocked(userService.getUserById).mockResolvedValue(getUserResponse);
      vi.mocked(userService.deleteUser).mockResolvedValue(deleteUserResponse);

      const req = mockRequest({
        params: { id: '1' }
      });
      const res = mockResponse();

      await controller.deleteUser(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should handle invalid user ID', async () => {
      const req = mockRequest({
        params: { id: 'invalid' }
      });
      const res = mockResponse();

      await controller.deleteUser(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid user ID',
        error: 'INVALID_ID'
      });
    });

    it('should handle user not found', async () => {
      const getUserResponse = {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      };

      vi.mocked(userService.getUserById).mockResolvedValue(getUserResponse);

      const req = mockRequest({
        params: { id: '999' }
      });
      const res = mockResponse();

      await controller.deleteUser(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    });
  });

  describe('checkUserReferences', () => {
    it('should return true when user has orders', async () => {
      // Mock database client for orders
      const mockClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 1 }],
          error: null
        })
      };

      const { typeSafeDatabaseService } = await import('../../src/services/TypeSafeDatabaseService.js');
      (typeSafeDatabaseService.getClient as any).mockReturnValue(mockClient);

      const result = await (controller as any).checkUserReferences(1);

      expect(result).toBe(true);
    });

    it('should return true when user has payments', async () => {
      // Mock database client for orders (no orders) then payments (has payments)
      let callCount = 0;
      const mockClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call for orders - no results
            return Promise.resolve({ data: [], error: null });
          }
          // Second call for payments - has results
          return Promise.resolve({ data: [{ id: 1 }], error: null });
        })
      };

      const { typeSafeDatabaseService } = await import('../../src/services/TypeSafeDatabaseService.js');
      (typeSafeDatabaseService.getClient as any).mockReturnValue(mockClient);

      const result = await (controller as any).checkUserReferences(1);

      expect(result).toBe(true);
    });

    it('should return false when user has no references', async () => {
      // Mock database client for no references
      const mockClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      const { typeSafeDatabaseService } = await import('../../src/services/TypeSafeDatabaseService.js');
      (typeSafeDatabaseService.getClient as any).mockReturnValue(mockClient);

      const result = await (controller as any).checkUserReferences(1);

      expect(result).toBe(false);
    });
  });
});