/**
 * 🌸 FloresYa UserService Unit Tests - Silicon Valley Simple Mock Edition
 * Clean, maintainable tests with one mock per test pattern
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserService } from '../../src/services/UserService';
import { typeSafeDatabaseService } from '../../src/services/TypeSafeDatabaseService';
import * as bcrypt from 'bcryptjs';
import type { UserUpdateRequest } from '../../src/shared/types/index';

// Mock dependencies
vi.mock('../../src/services/TypeSafeDatabaseService', () => ({
  typeSafeDatabaseService: {
    getClient: vi.fn(),
    executeRpc: vi.fn()
  }
}));

vi.mock('bcryptjs', () => ({
  hash: vi.fn()
}));

describe('UserService', () => {
  let userService: UserService;

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

  const createRpcSuccessResponse = (data = createTestUser(), message = 'Operation successful') => ({
    success: true,
    user: data,
    message
  });

  const createRpcDeleteResponse = (user = createTestUser()) => ({
    success: true,
    deleted_user: { id: user.id, email: user.email, full_name: user.full_name },
    message: 'User deleted successfully'
  });

  beforeEach(() => {
    userService = new UserService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return users successfully with default parameters', async () => {
      // Arrange - Clean silicon valley mock
      const testUser = createTestUser();
      const testUserList = createTestUserList([testUser]);

      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);

      // Simple working mock
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(), 
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [testUser],
              error: null,
              count: 1
            })
          })
        })
      };

      mockTypeSafeDatabaseService.getClient.mockReturnValue(mockClient as any);

      // Act
      const result = await userService.getAllUsers();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testUserList);
      expect(result.message).toBe('Retrieved 1 users successfully');
    });

    it('should handle search filter', async () => {
      // Arrange - Clean search mock
      const testUser = createTestUser();

      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);

      // Simple working chain for search
      const mockRange = vi.fn().mockResolvedValue({
        data: [testUser],
        error: null,
        count: 1
      });

      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: [testUser],
              error: null,
              count: 1
            })
          })
        })
      };

      mockTypeSafeDatabaseService.getClient.mockReturnValue(mockClient as any);

      // Act
      const result = await userService.getAllUsers({ search: 'test' });

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle role filter', async () => {
      // Arrange
      const testUser = createTestUser();
      const mockSupabaseClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn().mockResolvedValue({
                  data: [testUser],
                  error: null,
                  count: 1
                })
              }))
            }))
          }))
        }))
      };

      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);
      mockTypeSafeDatabaseService.getClient.mockReturnValue(mockSupabaseClient as any);

      // Act
      const result = await userService.getAllUsers({ role: 'admin' });

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle database errors', async () => {
       // Arrange - Clean error mock
       const testUser = createTestUser();
       const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);

       // Simple working chain for error
       const mockRange = vi.fn().mockResolvedValue({
         data: null,
         error: { message: 'Database connection failed' },
         count: null
       });

       const mockClient = {
         from: vi.fn().mockReturnValue({
           select: vi.fn().mockReturnValue({
             eq: vi.fn().mockReturnThis(),
             or: vi.fn().mockReturnThis(),
             order: vi.fn().mockReturnThis(),
             range: mockRange
           })
         })
       };

       mockTypeSafeDatabaseService.getClient.mockReturnValue(mockClient as any);

      // Act
      const result = await userService.getAllUsers();

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error: Database connection failed');
      expect(result.error).toBe('FETCH_USERS_ERROR');
    });
  });

  describe('getUserById', () => {
    it('should return user successfully', async () => {
      // Arrange
      const testUser = createTestUser();
      const mockSupabaseClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: testUser,
                error: null
              })
            }))
          }))
        }))
      };

      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);
      mockTypeSafeDatabaseService.getClient.mockReturnValue(mockSupabaseClient as any);

      // Act
      const result = await userService.getUserById(1);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testUser);
      expect(result.message).toBe('User retrieved successfully');
    });

    it('should handle invalid user ID', async () => {
      // Act
      const result = await userService.getUserById(NaN);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid user ID provided');
      expect(result.error).toBe('INVALID_ID');
    });

    it('should handle user not found', async () => {
      // Arrange
      const mockSupabaseClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' }
              })
            }))
          }))
        }))
      };

      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);
      mockTypeSafeDatabaseService.getClient.mockReturnValue(mockSupabaseClient as any);

      // Act
      const result = await userService.getUserById(999);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
      expect(result.error).toBe('USER_NOT_FOUND');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user successfully', async () => {
      // Arrange
      const testUser = createTestUser();
      const mockSupabaseClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: testUser,
                error: null
              })
            }))
          }))
        }))
      };

      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);
      mockTypeSafeDatabaseService.getClient.mockReturnValue(mockSupabaseClient as any);

      // Act
      const result = await userService.getUserByEmail('test@example.com');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testUser);
      expect(result.message).toBe('User retrieved successfully');
    });

    it('should handle empty email', async () => {
      // Act
      const result = await userService.getUserByEmail('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Email is required');
      expect(result.error).toBe('INVALID_EMAIL');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Arrange
      const mockBcrypt = vi.mocked(bcrypt);
      (mockBcrypt.hash as any).mockResolvedValue('hashed_password');

      const testUser = createTestUser();
      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);
      mockTypeSafeDatabaseService.executeRpc.mockResolvedValue(createRpcSuccessResponse(testUser));

      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123',
        full_name: 'Test User',
        phone: '+1234567890',
        role: 'user' as const,
        is_active: true,
        email_verified: false
      };

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith('TestPassword123', 12);
      expect(typeSafeDatabaseService.executeRpc).toHaveBeenCalledWith('create_user_atomic', {
        user_data: {
          email: 'test@example.com',
          password_hash: 'hashed_password',
          full_name: 'Test User',
          phone: '+1234567890',
          role: 'user',
          is_active: true,
          email_verified: false
        }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testUser);
      expect(result.message).toBe('User created successfully');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidUserData = {
        email: 'invalid-email',
        password: '123',
        full_name: 'T',
        role: 'invalid' as any
      };

      // Act
      const result = await userService.createUser(invalidUserData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Validation errors');
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const mockBcrypt = vi.mocked(bcrypt);
      (mockBcrypt.hash as any).mockResolvedValue('new_hashed_password');

      const testUser = createTestUser();
      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);
      mockTypeSafeDatabaseService.executeRpc.mockResolvedValue(createRpcSuccessResponse(testUser));

      const updateData: UserUpdateRequest = {
        id: 1,
        email: 'updated@example.com',
        full_name: 'Updated User',
        password: 'NewPassword123'
      };

      // Act
      const result = await userService.updateUser(1, updateData);

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith('NewPassword123', 12);
      expect(typeSafeDatabaseService.executeRpc).toHaveBeenCalledWith('update_user_atomic', {
        user_id: 1,
        user_data: {
          email: 'updated@example.com',
          full_name: 'Updated User',
          password_hash: 'new_hashed_password'
        }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testUser);
      expect(result.message).toBe('User updated successfully');
    });

    it('should handle invalid user ID', async () => {
      // Act
      const result = await userService.updateUser(NaN, { id: 1, email: 'test@example.com' } as UserUpdateRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid user ID provided');
      expect(result.error).toBe('INVALID_ID');
    });
  });

  describe('toggleUserActive', () => {
    it('should toggle user active status successfully', async () => {
      // Arrange
      const testUser = createTestUser();
      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);
      mockTypeSafeDatabaseService.executeRpc.mockResolvedValue(createRpcSuccessResponse(testUser));

      // Act
      const result = await userService.toggleUserActive(1);

      // Assert
      expect(typeSafeDatabaseService.executeRpc).toHaveBeenCalledWith('toggle_user_active_atomic', {
        user_id: 1
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testUser);
      expect(result.message).toBe('Operation successful');
    });

    it('should handle invalid user ID', async () => {
      // Act
      const result = await userService.toggleUserActive(NaN);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid user ID provided');
      expect(result.error).toBe('INVALID_ID');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const testUser = createTestUser();
      const mockTypeSafeDatabaseService = vi.mocked(typeSafeDatabaseService);
      mockTypeSafeDatabaseService.executeRpc.mockResolvedValue(createRpcDeleteResponse(testUser));

      // Act
      const result = await userService.deleteUser(1);

      // Assert
      expect(typeSafeDatabaseService.executeRpc).toHaveBeenCalledWith('delete_user_atomic', {
        user_id: 1
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        deleted_user: { id: 1, email: 'test@example.com', full_name: 'Test User' }
      });
      expect(result.message).toBe('User deleted successfully');
    });

    it('should handle invalid user ID', async () => {
      // Act
      const result = await userService.deleteUser(NaN);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid user ID provided');
      expect(result.error).toBe('INVALID_ID');
    });
  });
});