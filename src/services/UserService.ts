/**
 * 🌸 FloresYa User Service - Enterprise TypeScript Edition
 * Business logic for user management with atomic operations
 */

import {
  type ApiResponse,
  type UserCreateRequest,
  type UserListResponse,
  type UserQuery,
  type UserResponse,
  type UserUpdateRequest
} from '@shared/types';
import * as bcrypt from 'bcryptjs';

import { typeSafeDatabaseService } from './TypeSafeDatabaseService.js';

// Using TypeSafeDatabaseService for type-safe operations

// Type guards for RPC responses
interface RpcUserResponse {
  success: boolean;
  message?: string;
  error_code?: string;
  user?: UserResponse;
  deleted_user?: { id: number; email: string; full_name?: string };
}

function isRpcUserResponse(data: unknown): data is RpcUserResponse {
  return typeof data === 'object' && data !== null && 'success' in data;
}

export class UserService {
  private readonly SALT_ROUNDS = 12;

  /**
   * Get all users with optional filtering and pagination
   */
  public async getAllUsers(query: UserQuery = {}): Promise<ApiResponse<UserListResponse>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        is_active,
        email_verified,
        sort_by = 'created_at',
        sort_direction = 'desc'
      } = query;

      let supabaseQuery = typeSafeDatabaseService.getClient()
        .from('users')
        .select('id, email, full_name, phone, role, is_active, email_verified, created_at, updated_at', { count: 'exact' });

      // Apply filters
      if (search) {
        supabaseQuery = supabaseQuery.or(`email.ilike.%${search}%, full_name.ilike.%${search}%`);
      }

      if (role) {
        supabaseQuery = supabaseQuery.eq('role', role);
      }

      if (typeof is_active === 'boolean') {
        supabaseQuery = supabaseQuery.eq('is_active', is_active);
      }

      if (typeof email_verified === 'boolean') {
        supabaseQuery = supabaseQuery.eq('email_verified', email_verified);
      }

      // Apply sorting
      supabaseQuery = supabaseQuery.order(sort_by, { ascending: sort_direction === 'asc' });

      // Apply pagination
      const offset = (page - 1) * limit;
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      const { data, error, count } = await supabaseQuery;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const users = data ?? [];
      const totalItems = count ?? 0;
      const totalPages = Math.ceil(totalItems / limit);

      const response: UserListResponse = {
        users: users as UserResponse[],
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: totalItems,
          items_per_page: limit
        }
      };

      return {
        success: true,
        data: response,
        message: `Retrieved ${users.length} users successfully`
      };

    } catch (error) {
      console.error('UserService.getAllUsers error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'FETCH_USERS_ERROR'
      };
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(id: number): Promise<ApiResponse<UserResponse>> {
    try {
      if (!id || isNaN(id)) {
        return {
          success: false,
          message: 'Invalid user ID provided',
          error: 'INVALID_ID'
        };
      }

      const { data, error } = await typeSafeDatabaseService.getClient()
        .from('users')
        .select('id, email, full_name, phone, role, is_active, email_verified, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            message: 'User not found',
            error: 'USER_NOT_FOUND'
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data as UserResponse,
        message: 'User retrieved successfully'
      };

    } catch (error) {
      console.error('UserService.getUserById error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'FETCH_USER_ERROR'
      };
    }
  }

  /**
   * Get user by email
   */
  public async getUserByEmail(email: string): Promise<ApiResponse<UserResponse>> {
    try {
      if (!email?.trim()) {
        return {
          success: false,
          message: 'Email is required',
          error: 'INVALID_EMAIL'
        };
      }

      const { data, error } = await typeSafeDatabaseService.getClient()
        .from('users')
        .select('id, email, full_name, phone, role, is_active, email_verified, created_at, updated_at')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            message: 'User not found',
            error: 'USER_NOT_FOUND'
          };
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data as UserResponse,
        message: 'User retrieved successfully'
      };

    } catch (error) {
      console.error('UserService.getUserByEmail error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'FETCH_USER_ERROR'
      };
    }
  }

  /**
   * Create new user using atomic transaction
   */
  public async createUser(userData: UserCreateRequest): Promise<ApiResponse<UserResponse>> {
    try {
      // Validate input
      const validation = this.validateUserData(userData, true);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Validation errors',
          error: 'VALIDATION_ERROR',
          errors: validation.errors
        };
      }

      // Hash password
      const password_hash = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

      // Prepare data for atomic function
      const userDataForDb = {
        email: userData.email.trim().toLowerCase(),
        password_hash,
        full_name: userData.full_name.trim(),
        phone: userData.phone?.trim() ?? null,
        role: userData.role,
        is_active: userData.is_active ?? true,
        email_verified: userData.email_verified ?? false
      };

      // Call atomic function
      const data = await typeSafeDatabaseService.executeRpc('create_user_atomic', { user_data: userDataForDb });

      if (!isRpcUserResponse(data) || !data.success) {
        return {
          success: false,
          message: isRpcUserResponse(data) ? data.message ?? 'Failed to create user' : 'Failed to create user',
          error: isRpcUserResponse(data) ? data.error_code ?? 'CREATE_USER_ERROR' : 'CREATE_USER_ERROR'
        };
      }

      return {
        success: true,
        data: data.user,
        message: 'User created successfully'
      };

    } catch (error) {
      console.error('UserService.createUser error:', error);

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return {
            success: false,
            message: 'Email already exists',
            error: 'EMAIL_EXISTS'
          };
        }
        if (error.message.includes('Invalid email')) {
          return {
            success: false,
            message: 'Invalid email format',
            error: 'INVALID_EMAIL'
          };
        }
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'CREATE_USER_ERROR'
      };
    }
  }

  /**
   * Update user using atomic transaction
   */
  public async updateUser(id: number, userData: UserUpdateRequest): Promise<ApiResponse<UserResponse>> {
    try {
      if (!id || isNaN(id)) {
        return {
          success: false,
          message: 'Invalid user ID provided',
          error: 'INVALID_ID'
        };
      }

      // Validate input
      const validation = this.validateUserData(userData, false);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Validation errors',
          error: 'VALIDATION_ERROR',
          errors: validation.errors
        };
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {};

      if (userData.email !== undefined) {
        updateData.email = userData.email.trim().toLowerCase();
      }
      if (userData.full_name !== undefined) {
        updateData.full_name = userData.full_name.trim();
      }
      if (userData.phone !== undefined) {
        updateData.phone = userData.phone?.trim() ?? null;
      }
      if (userData.role !== undefined) {
        updateData.role = userData.role;
      }
      if (userData.is_active !== undefined) {
        updateData.is_active = userData.is_active;
      }
      if (userData.email_verified !== undefined) {
        updateData.email_verified = userData.email_verified;
      }
      if (userData.password?.trim()) {
        updateData.password_hash = await bcrypt.hash(userData.password, this.SALT_ROUNDS);
      }

      // Call atomic function
      const data = await typeSafeDatabaseService.executeRpc('update_user_atomic', {
        user_id: id,
        user_data: updateData
      });

      if (!isRpcUserResponse(data) || !data.success) {
        return {
          success: false,
          message: isRpcUserResponse(data) ? data.message ?? 'Failed to update user' : 'Failed to update user',
          error: isRpcUserResponse(data) ? data.error_code ?? 'UPDATE_USER_ERROR' : 'UPDATE_USER_ERROR'
        };
      }

      return {
        success: true,
        data: data.user,
        message: 'User updated successfully'
      };

    } catch (error) {
      console.error('UserService.updateUser error:', error);

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return {
            success: false,
            message: 'Email already exists',
            error: 'EMAIL_EXISTS'
          };
        }
        if (error.message.includes('not found')) {
          return {
            success: false,
            message: 'User not found',
            error: 'USER_NOT_FOUND'
          };
        }
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'UPDATE_USER_ERROR'
      };
    }
  }

  /**
   * Toggle user active status
   */
  public async toggleUserActive(id: number): Promise<ApiResponse<UserResponse>> {
    try {
      if (!id || isNaN(id)) {
        return {
          success: false,
          message: 'Invalid user ID provided',
          error: 'INVALID_ID'
        };
      }

      // Call atomic function
      const data = await typeSafeDatabaseService.executeRpc('toggle_user_active_atomic', { user_id: id });

      if (!isRpcUserResponse(data) || !data.success) {
        return {
          success: false,
          message: isRpcUserResponse(data) ? data.message ?? 'Failed to toggle user status' : 'Failed to toggle user status',
          error: isRpcUserResponse(data) ? data.error_code ?? 'TOGGLE_USER_ERROR' : 'TOGGLE_USER_ERROR'
        };
      }

      return {
        success: true,
        data: data.user,
        message: isRpcUserResponse(data) ? data.message ?? 'User status changed successfully' : 'User status changed successfully'
      };

    } catch (error) {
      console.error('UserService.toggleUserActive error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'TOGGLE_USER_ERROR'
      };
    }
  }

  /**
   * Delete user with safety checks
   */
  public async deleteUser(id: number): Promise<ApiResponse<{ deleted_user: { id: number; email: string; full_name?: string } }>> {
    try {
      if (!id || isNaN(id)) {
        return {
          success: false,
          message: 'Invalid user ID provided',
          error: 'INVALID_ID'
        };
      }

      // Call atomic function
      const data = await typeSafeDatabaseService.executeRpc('delete_user_atomic', { user_id: id });

      if (!isRpcUserResponse(data) || !data.success) {
        return {
          success: false,
          message: isRpcUserResponse(data) ? data.message ?? 'Failed to delete user' : 'Failed to delete user',
          error: isRpcUserResponse(data) ? data.error_code ?? 'DELETE_USER_ERROR' : 'DELETE_USER_ERROR'
        };
      }

      return {
        success: true,
        data: { deleted_user: data.deleted_user as { id: number; email: string; full_name?: string } },
        message: isRpcUserResponse(data) ? data.message ?? 'User deleted successfully' : 'User deleted successfully'
      };

    } catch (error) {
      console.error('UserService.deleteUser error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: 'DELETE_USER_ERROR'
      };
    }
  }

  /**
   * Validate user data
   */
  private validateUserData(userData: Partial<UserCreateRequest | UserUpdateRequest>, isCreate: boolean): {
    isValid: boolean;
    errors: Array<{ field: string; message: string; code?: string }>;
  } {
    const errors: Array<{ field: string; message: string; code?: string }> = [];

    // Email validation
    if (isCreate || userData.email !== undefined) {
       
      if (!userData.email?.trim()) { // ✅ Lógica correcta — string vacío es inválido
        errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' });
      } else {
        // Email validation that rejects consecutive dots and other common invalid patterns
        const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(userData.email.trim())) {
          errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' });
        }
      }
    }
    
    // Full name validation
    if (isCreate || userData.full_name !== undefined) {
      if (!userData.full_name?.trim()) {
        errors.push({ field: 'full_name', message: 'Full name is required', code: 'REQUIRED' });
      } else if (userData.full_name.trim().length < 2) {
        errors.push({ field: 'full_name', message: 'Full name must be at least 2 characters', code: 'MIN_LENGTH' });
      }
    }

    // Password validation (for create or when password is provided)
    if (isCreate || (userData as UserUpdateRequest).password) {
      const password = (userData as UserCreateRequest).password ?? (userData as UserUpdateRequest).password;
      if (!password?.trim()) {
        if (isCreate) {
          errors.push({ field: 'password', message: 'Password is required', code: 'REQUIRED' });
        }
      } else {
        if (password.length < 8) {
          errors.push({ field: 'password', message: 'Password must be at least 8 characters', code: 'MIN_LENGTH' });
        }
        if (!/[A-Z]/.test(password)) {
          errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter', code: 'UPPERCASE_REQUIRED' });
        }
        if (!/[a-z]/.test(password)) {
          errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter', code: 'LOWERCASE_REQUIRED' });
        }
        if (!/[0-9]/.test(password)) {
          errors.push({ field: 'password', message: 'Password must contain at least one number', code: 'NUMBER_REQUIRED' });
        }
      }
    }

    // Role validation
    if (isCreate || userData.role !== undefined) {
      const validRoles = ['user', 'admin', 'support'];
      if (!userData.role) {
        if (isCreate) {
          errors.push({ field: 'role', message: 'Role is required', code: 'REQUIRED' });
        }
      } else if (!validRoles.includes(userData.role)) {
        errors.push({ field: 'role', message: 'Invalid role selected', code: 'INVALID_VALUE' });
      }
    }

    // Phone validation (optional but must be valid if provided)
    if (userData.phone !== undefined && userData.phone.trim() !== '') {
        const phoneRegex = /^\+?\d{10,15}$/;
        if (!phoneRegex.test(userData.phone.replace(/\s/g, ''))) {
            errors.push({ field: 'phone', message: 'Invalid phone format (10-15 digits)', code: 'INVALID_FORMAT' });
        }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const userService = new UserService();
