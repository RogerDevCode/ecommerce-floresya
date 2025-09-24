/**
 * 🌸 FloresYa UserController Unit Tests - Silicon Valley Simple Mock Edition
 * Clean, maintainable tests with one mock per test pattern
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserController, userValidators } from '../../src/controllers/UserController';
import { userService } from '../../src/services/UserService';
import { typeSafeDatabaseService } from '../../src/services/TypeSafeDatabaseService';

// Mock dependencies
vi.mock('../../src/services/UserService', () => ({
  userService: {
    getAllUsers: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    toggleUserActive: vi.fn(),
    deleteUser: vi.fn()
  }
}));

vi.mock('../../src/services/TypeSafeDatabaseService', () => ({
  typeSafeDatabaseService: {
    getClient: vi.fn()
  }
}));

// Mock express-validator
vi.mock('express-validator', () => ({
  body: vi.fn(() => ({
    isEmail: vi.fn().mockReturnThis(),
    normalizeEmail: vi.fn().mockReturnThis(),
    isLength: vi.fn().mockReturnThis(),
    matches: vi.fn().mockReturnThis(),
    trim: vi.fn().mockReturnThis(),
    isIn: vi.fn().mockReturnThis(),
    isBoolean: vi.fn().mockReturnThis(),
    optional: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis()
  })),
  param: vi.fn(() => ({
    isInt: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis()
  })),
  query: vi.fn(() => ({
    optional: vi.fn().mockReturnThis(),
    isInt: vi.fn().mockReturnThis(),
    isLength: vi.fn().mockReturnThis(),
    isIn: vi.fn().mockReturnThis(),
    isBoolean: vi.fn().mockReturnThis(),
    withMessage: vi.fn().mockReturnThis()
  })),
  validationResult: vi.fn()
}));

describe('UserController', () => {
  let controller: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: any;
  let statusSpy: any;

  // Test data factories
  const createTestUser = (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '+1234567890',
    role: 'user' as const,
    is_active: true,
    email_verified: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  });

  const createTestUserList = (users = [createTestUser()], overrides = {}) => ({
    users,
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_items: users.length,
      items_per_page: 20,
      ...overrides
    }
  });

  const createValidationResult = (isEmpty = true, errors: any[] = []) => ({
    isEmpty: () => isEmpty,
    array: () => errors,
    formatter: vi.fn(),
    errors,
    mapped: vi.fn(),
    formatWith: vi.fn(),
    throw: vi.fn()
  } as any);

  beforeEach(() => {
    controller = new UserController();
    jsonSpy = vi.fn().mockReturnThis();
    statusSpy = vi.fn().mockReturnThis();

    mockResponse = {
      json: jsonSpy,
      status: statusSpy,
      send: vi.fn()
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return users successfully', async () => {
      // Arrange
      const testUser = createTestUser();
      const testUserList = createTestUserList([testUser]);

      const mockUserService = vi.mocked(userService);
      mockUserService.getAllUsers.mockResolvedValue({
        success: true,
        data: testUserList,
        message: 'Users retrieved successfully'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        query: {
          page: '1',
          limit: '20',
          search: '',
          role: 'user',
          is_active: 'true',
          email_verified: 'false',
          sort_by: 'created_at',
          sort_direction: 'desc'
        }
      };

      // Act
      await controller.getAllUsers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockUserService.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: '',
        role: 'user',
        is_active: true,
        email_verified: false,
        sort_by: 'created_at',
        sort_direction: 'desc'
      });
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: testUserList,
        message: 'Users retrieved successfully'
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult(false, [{ field: 'page', message: 'Invalid page' }]));

      mockRequest = {
        query: { page: 'invalid' }
      };

      // Act
      await controller.getAllUsers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: [{ field: 'page', message: 'Invalid page' }]
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const mockUserService = vi.mocked(userService);
      mockUserService.getAllUsers.mockResolvedValue({
        success: false,
        message: 'Database error',
        error: 'FETCH_USERS_ERROR'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        query: { page: '1', limit: '20' }
      };

      // Act
      await controller.getAllUsers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
        error: 'FETCH_USERS_ERROR'
      });
    });
  });

  describe('getUserById', () => {
    it('should return user successfully', async () => {
      // Arrange
      const testUser = createTestUser();
      const mockUserService = vi.mocked(userService);
      mockUserService.getUserById.mockResolvedValue({
        success: true,
        data: testUser,
        message: 'User retrieved successfully'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: '1' }
      };

      // Act
      await controller.getUserById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: testUser,
        message: 'User retrieved successfully'
      });
    });

    it('should handle invalid user ID', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: 'invalid' }
      };

      // Act
      await controller.getUserById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid user ID',
        error: 'INVALID_ID'
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      const mockUserService = vi.mocked(userService);
      mockUserService.getUserById.mockResolvedValue({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: '1' }
      };

      // Act
      await controller.getUserById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Arrange
      const testUser = createTestUser();
      const mockUserService = vi.mocked(userService);
      mockUserService.createUser.mockResolvedValue({
        success: true,
        data: testUser,
        message: 'User created successfully'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const newUserData = {
        email: 'newuser@example.com',
        password: 'Password123',
        full_name: 'New User',
        phone: '+1234567890',
        role: 'user' as const,
        is_active: true,
        email_verified: false
      };

      mockRequest = {
        body: newUserData
      };

      // Act
      await controller.createUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockUserService.createUser).toHaveBeenCalledWith(newUserData);
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: testUser,
        message: 'User created successfully'
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult(false, [{ field: 'email', message: 'Invalid email' }]));

      mockRequest = {
        body: { email: 'invalid-email' }
      };

      // Act
      await controller.createUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Validation errors',
        errors: [{ field: 'email', message: 'Invalid email' }]
      });
    });

    it('should handle email already exists', async () => {
      // Arrange
      const mockUserService = vi.mocked(userService);
      mockUserService.createUser.mockResolvedValue({
        success: false,
        message: 'Email already exists',
        error: 'EMAIL_EXISTS'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        body: {
          email: 'existing@example.com',
          password: 'Password123',
          full_name: 'Test User',
          role: 'user'
        }
      };

      // Act
      await controller.createUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(409);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Email already exists',
        error: 'EMAIL_EXISTS'
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const testUser = createTestUser();
      const mockUserService = vi.mocked(userService);
      mockUserService.updateUser.mockResolvedValue({
        success: true,
        data: testUser,
        message: 'User updated successfully'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      const updateData = {
        id: 1,
        email: 'updated@example.com',
        full_name: 'Updated User'
      };

      mockRequest = {
        params: { id: '1' },
        body: updateData
      };

      // Act
      await controller.updateUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, updateData);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: testUser,
        message: 'User updated successfully'
      });
    });

    it('should handle invalid user ID', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: 'invalid' },
        body: { email: 'test@example.com' }
      };

      // Act
      await controller.updateUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid user ID',
        error: 'INVALID_ID'
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      const mockUserService = vi.mocked(userService);
      mockUserService.updateUser.mockResolvedValue({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: '1' },
        body: { email: 'test@example.com' }
      };

      // Act
      await controller.updateUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    });
  });

  describe('toggleUserActive', () => {
    it('should toggle user active status successfully', async () => {
      // Arrange
      const testUser = createTestUser();
      const mockUserService = vi.mocked(userService);
      mockUserService.toggleUserActive.mockResolvedValue({
        success: true,
        data: { ...testUser, is_active: false },
        message: 'User status changed successfully'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: '1' }
      };

      // Act
      await controller.toggleUserActive(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockUserService.toggleUserActive).toHaveBeenCalledWith(1);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { ...testUser, is_active: false },
        message: 'User status changed successfully'
      });
    });

    it('should handle invalid user ID', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: 'invalid' }
      };

      // Act
      await controller.toggleUserActive(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid user ID',
        error: 'INVALID_ID'
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      const mockUserService = vi.mocked(userService);
      mockUserService.toggleUserActive.mockResolvedValue({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: '1' }
      };

      // Act
      await controller.toggleUserActive(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    });
  });

  describe('deleteUser', () => {
    it('should perform logical deletion when user has references', async () => {
      // Arrange
      const testUser = createTestUser();
      const mockUserService = vi.mocked(userService);
      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);

      // Mock user exists
      mockUserService.getUserById.mockResolvedValue({
        success: true,
        data: testUser,
        message: 'User retrieved successfully'
      });

      // Mock user has references
      const mockClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
      };
      mockTypeSafeDatabaseService.getClient.mockReturnValue(mockClient as any);

      // Mock successful update (deactivation)
      mockUserService.updateUser.mockResolvedValue({
        success: true,
        data: { ...testUser, is_active: false },
        message: 'User updated successfully'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: '1' }
      };

      // Act
      await controller.deleteUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockTypeSafeDatabaseService.getClient).toHaveBeenCalled();
      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, { id: 1, is_active: false });
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          user: { ...testUser, is_active: false },
          deletion_type: 'logical',
          has_references: true
        },
        message: 'User deactivated successfully (has orders or payments)'
      });
    });

    it('should perform physical deletion when user has no references', async () => {
      // Arrange
      const testUser = createTestUser();
      const mockUserService = vi.mocked(userService);
      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);

      // Mock user exists
      mockUserService.getUserById.mockResolvedValue({
        success: true,
        data: testUser,
        message: 'User retrieved successfully'
      });

      // Mock user has no references
      const mockClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      };
      mockTypeSafeDatabaseService.getClient.mockReturnValue(mockClient as any);

      // Mock successful physical deletion
      mockUserService.deleteUser.mockResolvedValue({
        success: true,
        data: { deleted_user: { id: 1, email: 'test@example.com', full_name: 'Test User' } },
        message: 'User deleted successfully'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: '1' }
      };

      // Act
      await controller.deleteUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockValidationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockTypeSafeDatabaseService.getClient).toHaveBeenCalled();
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(1);
      expect(statusSpy).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle invalid user ID', async () => {
      // Arrange
      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: 'invalid' }
      };

      // Act
      await controller.deleteUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid user ID',
        error: 'INVALID_ID'
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      const mockUserService = vi.mocked(userService);
      mockUserService.getUserById.mockResolvedValue({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });

      const mockValidationResult = vi.mocked(validationResult);
      mockValidationResult.mockReturnValue(createValidationResult());

      mockRequest = {
        params: { id: '1' }
      };

      // Act
      await controller.deleteUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    });
  });

  describe('userValidators', () => {
    it('should validate getAllUsers correctly', () => {
      // Arrange
      const validators = userValidators.getAllUsers;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate getUserById correctly', () => {
      // Arrange
      const validators = userValidators.getUserById;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate createUser correctly', () => {
      // Arrange
      const validators = userValidators.createUser;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate updateUser correctly', () => {
      // Arrange
      const validators = userValidators.updateUser;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate toggleUserActive correctly', () => {
      // Arrange
      const validators = userValidators.toggleUserActive;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });

    it('should validate deleteUser correctly', () => {
      // Arrange
      const validators = userValidators.deleteUser;

      // Act & Assert
      expect(validators).toBeDefined();
      expect(validators.length).toBeGreaterThan(0);
    });
  });
});