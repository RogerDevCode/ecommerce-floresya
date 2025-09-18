/**
 * 🌸 FloresYa User Service Tests - Enterprise TypeScript Edition
 * Comprehensive unit tests for user business logic and database operations
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { UserService } from '../../src/services/UserService.js';
import { supabaseService } from '../../src/config/supabase.js';
import bcrypt from 'bcryptjs';
import type { UserCreateRequest, UserUpdateRequest, UserQuery } from '../../src/types/globals.js';

// Mock Supabase will be set up in beforeEach

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn()
  }
}));

describe('UserService', () => {
  let userService: UserService;
  let mockSupabaseQuery: any;

  beforeEach(() => {
    userService = new UserService();
    vi.clearAllMocks();

    // Mock supabaseService
    vi.mock('../../src/config/supabase.js', () => ({
      supabaseService: {
        from: vi.fn(),
        rpc: vi.fn()
      }
    }));

    // Create a fresh mock for each test with proper chaining
    mockSupabaseQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      or: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
      single: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      then: vi.fn(),
    };

    // Make all functions return the same mock instance for chaining
    Object.keys(mockSupabaseQuery).forEach(key => {
      if (key !== 'single' && key !== 'then') {
        mockSupabaseQuery[key as keyof typeof mockSupabaseQuery] = vi.fn().mockReturnValue(mockSupabaseQuery);
      }
    });

    // Setup the from method to return our mock
    vi.mocked(supabaseService.from).mockReturnValue(mockSupabaseQuery);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAllUsers', () => {
    test('should return users with pagination', async () => {
      const mockUsers = [
        {
          id: 1,
          email: 'user1@test.com',
          full_name: 'User One',
          role: 'user',
          is_active: true,
          email_verified: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          email: 'user2@test.com',
          full_name: 'User Two',
          role: 'admin',
          is_active: false,
          email_verified: false,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];

      mockSupabaseQuery.select.mockResolvedValue({
        data: mockUsers,
        error: null,
        count: 2
      });

      const query: UserQuery = {
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_direction: 'desc'
      };

      const result = await userService.getAllUsers(query);

      expect(result.success).toBe(true);
      expect(result.data?.users).toEqual(mockUsers);
      expect(result.data?.pagination).toEqual({
        current_page: 1,
        total_pages: 1,
        total_items: 2,
        items_per_page: 20
      });

      // Verify Supabase query building
      expect(supabaseService.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith(
        'id, email, full_name, phone, role, is_active, email_verified, created_at, updated_at',
        { count: 'exact' }
      );
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabaseQuery.range).toHaveBeenCalledWith(0, 19);
    });

    test('should apply search filter', async () => {
      mockSupabaseQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      const query: UserQuery = {
        search: 'test@example.com'
      };

      await userService.getAllUsers(query);

      expect(mockSupabaseQuery.or).toHaveBeenCalledWith(
        'email.ilike.%test@example.com%, full_name.ilike.%test@example.com%'
      );
    });

    test('should apply role filter', async () => {
      mockSupabaseQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      const query: UserQuery = {
        role: 'admin'
      };

      await userService.getAllUsers(query);

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('role', 'admin');
    });

    test('should apply status filters', async () => {
      mockSupabaseQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      const query: UserQuery = {
        is_active: true,
        email_verified: false
      };

      await userService.getAllUsers(query);

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('email_verified', false);
    });

    test('should handle database errors', async () => {
      mockSupabaseQuery.select.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: null
      });

      const result = await userService.getAllUsers();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Database connection failed');
      expect(result.error).toBe('FETCH_USERS_ERROR');
    });

    test('should calculate pagination correctly', async () => {
      mockSupabaseQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 95
      });

      const query: UserQuery = {
        page: 3,
        limit: 10
      };

      const result = await userService.getAllUsers(query);

      expect(result.data?.pagination).toEqual({
        current_page: 3,
        total_pages: 10,
        total_items: 95,
        items_per_page: 10
      });

      expect(mockSupabaseQuery.range).toHaveBeenCalledWith(20, 29);
    });
  });

  describe('getUserById', () => {
    test('should return user by ID', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        full_name: 'Test User',
        role: 'user',
        is_active: true,
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseQuery.single.mockResolvedValue({
        data: mockUser,
        error: null
      });

      const result = await userService.getUserById(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 1);
      expect(mockSupabaseQuery.single).toHaveBeenCalled();
    });

    test('should return error for invalid ID', async () => {
      const result = await userService.getUserById(NaN);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid user ID provided');
      expect(result.error).toBe('INVALID_ID');
    });

    test('should return error for non-existent user', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await userService.getUserById(999);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
      expect(result.error).toBe('USER_NOT_FOUND');
    });
  });

  describe('getUserByEmail', () => {
    test('should return user by email', async () => {
      const mockUser = {
        id: 1,
        email: 'user@test.com',
        full_name: 'Test User',
        role: 'user',
        is_active: true,
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockSupabaseQuery.single.mockResolvedValue({
        data: mockUser,
        error: null
      });

      const result = await userService.getUserByEmail('user@test.com');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('email', 'user@test.com');
    });

    test('should normalize email to lowercase', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      await userService.getUserByEmail('USER@TEST.COM');

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('email', 'user@test.com');
    });

    test('should return error for empty email', async () => {
      const result = await userService.getUserByEmail('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email is required');
      expect(result.error).toBe('INVALID_EMAIL');
    });
  });

  describe('createUser', () => {
    test('should create user successfully', async () => {
      const newUser: UserCreateRequest = {
        email: 'newuser@test.com',
        password: 'StrongPass123',
        full_name: 'New User',
        phone: '+58414XXXXXXX',
        role: 'user',
        is_active: true,
        email_verified: false
      };

      const createdUser = {
        id: 3,
        email: 'newuser@test.com',
        full_name: 'New User',
        phone: '+58414XXXXXXX',
        role: 'user',
        is_active: true,
        email_verified: false,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      };

      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(supabaseService.rpc).mockResolvedValue({
        data: {
          success: true,
          user: createdUser,
          message: 'User created successfully'
        },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      });

      const result = await userService.createUser(newUser);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass123', 12);
      expect(supabaseService.rpc).toHaveBeenCalledWith('create_user_atomic', {
        user_data: {
          email: 'newuser@test.com',
          password_hash: 'hashed_password',
          full_name: 'New User',
          phone: '+58414XXXXXXX',
          role: 'user',
          is_active: true,
          email_verified: false
        }
      });
    });

    test('should validate user data before creation', async () => {
      const invalidUser: UserCreateRequest = {
        email: 'invalid-email',
        password: '123', // Too weak
        full_name: '', // Empty
        role: 'user'
      };

      const result = await userService.createUser(invalidUser);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Validation errors');
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
          expect.objectContaining({ field: 'full_name' })
        ])
      );
    });

    test('should handle email already exists error', async () => {
      const newUser: UserCreateRequest = {
        email: 'existing@test.com',
        password: 'StrongPass123',
        full_name: 'New User',
        role: 'user'
      };

      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(supabaseService.rpc).mockResolvedValue({
        data: {
          success: false,
          message: 'Email already exists: existing@test.com',
          error_code: 'EMAIL_EXISTS'
        },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      });

      const result = await userService.createUser(newUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Email already exists');
      expect(result.error).toBe('EMAIL_EXISTS');
    });

    test('should handle database errors during creation', async () => {
      const newUser: UserCreateRequest = {
        email: 'newuser@test.com',
        password: 'StrongPass123',
        full_name: 'New User',
        role: 'user'
      };

      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(supabaseService.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', details: '', hint: '', code: 'CONNECTION_ERROR', name: 'PostgrestError' },
        count: null,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await userService.createUser(newUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Database connection failed');
      expect(result.error).toBe('CREATE_USER_ERROR');
    });
  });

  describe('updateUser', () => {
    test('should update user successfully', async () => {
      const updateData: UserUpdateRequest = {
        id: 1,
        email: 'updated@test.com',
        full_name: 'Updated User',
        role: 'admin',
        is_active: false
      };

      const updatedUser = {
        id: 1,
        email: 'updated@test.com',
        full_name: 'Updated User',
        role: 'admin',
        is_active: false,
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      };

      vi.mocked(supabaseService.rpc).mockResolvedValue({
        data: {
          success: true,
          user: updatedUser,
          message: 'User updated successfully'
        },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      });

      const result = await userService.updateUser(1, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedUser);
      expect(supabaseService.rpc).toHaveBeenCalledWith('update_user_atomic', {
        user_id: 1,
        user_data: {
          email: 'updated@test.com',
          full_name: 'Updated User',
          role: 'admin',
          is_active: false
        }
      });
    });

    test('should hash password when provided', async () => {
      const updateData: UserUpdateRequest = {
        id: 1,
        password: 'NewStrongPass123'
      };

      vi.mocked(bcrypt.hash).mockResolvedValue('new_hashed_password' as never);
      vi.mocked(supabaseService.rpc).mockResolvedValue({
        data: {
          success: true,
          user: {},
          message: 'User updated successfully'
        },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      });

      await userService.updateUser(1, updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith('NewStrongPass123', 12);
      expect(supabaseService.rpc).toHaveBeenCalledWith('update_user_atomic', {
        user_id: 1,
        user_data: {
          password_hash: 'new_hashed_password'
        }
      });
    });

    test('should return error for invalid ID', async () => {
      const result = await userService.updateUser(NaN, { id: 1, full_name: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid user ID provided');
      expect(result.error).toBe('INVALID_ID');
    });

    test('should validate update data', async () => {
      const invalidUpdate: UserUpdateRequest = {
        id: 1,
        email: 'invalid-email',
        password: 'weak'
      };

      const result = await userService.updateUser(1, invalidUpdate);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Validation errors');
      expect(result.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('toggleUserActive', () => {
    test('should toggle user active status', async () => {
      const toggledUser = {
        id: 1,
        email: 'user@test.com',
        full_name: 'Test User',
        role: 'user',
        is_active: false,
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      };

      vi.mocked(supabaseService.rpc).mockResolvedValue({
        data: {
          success: true,
          user: toggledUser,
          message: 'User deactivated successfully'
        },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      });

      const result = await userService.toggleUserActive(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(toggledUser);
      expect(result.message).toBe('User deactivated successfully');
      expect(supabaseService.rpc).toHaveBeenCalledWith('toggle_user_active_atomic', {
        user_id: 1
      });
    });

    test('should return error for invalid ID', async () => {
      const result = await userService.toggleUserActive(NaN);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid user ID provided');
      expect(result.error).toBe('INVALID_ID');
    });
  });

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      const deleteResponse = {
        success: true,
        deleted_user: {
          id: 1,
          email: 'user@test.com',
          full_name: 'Test User'
        },
        message: 'User deleted successfully'
      };

      vi.mocked(supabaseService.rpc).mockResolvedValue({
        data: deleteResponse,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      });

      const result = await userService.deleteUser(1);

      expect(result.success).toBe(true);
      expect(result.data?.deleted_user).toEqual(deleteResponse.deleted_user);
      expect(supabaseService.rpc).toHaveBeenCalledWith('delete_user_atomic', {
        user_id: 1
      });
    });

    test('should return error when user has related orders', async () => {
      vi.mocked(supabaseService.rpc).mockResolvedValue({
        data: {
          success: false,
          message: 'Cannot delete user: has 5 related orders. Consider deactivating instead.',
          error_code: 'USER_HAS_ORDERS'
        },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      });

      const result = await userService.deleteUser(1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('related orders');
      expect(result.error).toBe('USER_HAS_ORDERS');
    });

    test('should return error for invalid ID', async () => {
      const result = await userService.deleteUser(NaN);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid user ID provided');
      expect(result.error).toBe('INVALID_ID');
    });
  });

  describe('Validation Methods', () => {
    test('should validate email formats correctly', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+tag@company.org'
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        ''
      ];

      for (const email of validEmails) {
        vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
        vi.mocked(supabaseService.rpc).mockResolvedValue({
          data: { success: true, user: {}, message: 'Created' },
          error: null,
          count: null,
          status: 200,
          statusText: 'OK'
        });

        const result = await userService.createUser({
          email,
          password: 'StrongPass123',
          full_name: 'Test User',
          role: 'user'
        });

        expect(result.success).toBe(true);
      }

      for (const email of invalidEmails) {
        const result = await userService.createUser({
          email,
          password: 'StrongPass123',
          full_name: 'Test User',
          role: 'user'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('VALIDATION_ERROR');
      }
    });

    test('should validate password strength correctly', async () => {
      const validPasswords = [
        'StrongPass123',
        'AnotherGood1',
        'Complex123Pass'
      ];

      const invalidPasswords = [
        'weak',
        '12345678',
        'ALLUPPERCASE123',
        'alllowercase123',
        'NoNumbers',
        'Short1'
      ];

      for (const password of validPasswords) {
        vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
        vi.mocked(supabaseService.rpc).mockResolvedValue({
          data: { success: true, user: {}, message: 'Created' },
          error: null,
          count: null,
          status: 200,
          statusText: 'OK'
        });

        const result = await userService.createUser({
          email: `test${Date.now()}@example.com`,
          password,
          full_name: 'Test User',
          role: 'user'
        });

        expect(result.success).toBe(true);
      }

      for (const password of invalidPasswords) {
        const result = await userService.createUser({
          email: `test${Date.now()}@example.com`,
          password,
          full_name: 'Test User',
          role: 'user'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('VALIDATION_ERROR');
      }
    });

    test('should validate phone formats correctly', async () => {
      const validPhones = [
        '+584141234567',
        '1234567890',
        '+1234567890123'
      ];

      const invalidPhones = [
        '123',
        'abcdefghij',
        '+123',
        '123456789012345678901'
      ];

      for (const phone of validPhones) {
        vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
        vi.mocked(supabaseService.rpc).mockResolvedValue({
          data: { success: true, user: {}, message: 'Created' },
          error: null,
          count: null,
          status: 200,
          statusText: 'OK'
        });

        const result = await userService.createUser({
          email: `test${Date.now()}@example.com`,
          password: 'StrongPass123',
          full_name: 'Test User',
          phone,
          role: 'user'
        });

        expect(result.success).toBe(true);
      }

      for (const phone of invalidPhones) {
        const result = await userService.createUser({
          email: `test${Date.now()}@example.com`,
          password: 'StrongPass123',
          full_name: 'Test User',
          phone,
          role: 'user'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('VALIDATION_ERROR');
      }
    });
  });
});