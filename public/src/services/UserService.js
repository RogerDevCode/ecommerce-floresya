import bcrypt from 'bcryptjs';
import { supabaseService } from '../config/supabase.js';
export class UserService {
    constructor() {
        this.SALT_ROUNDS = 12;
    }
    async getAllUsers(query = {}) {
        try {
            const { page = 1, limit = 20, search, role, is_active, email_verified, sort_by = 'created_at', sort_direction = 'desc' } = query;
            let supabaseQuery = supabaseService
                .from('users')
                .select('id, email, full_name, phone, role, is_active, email_verified, created_at, updated_at', { count: 'exact' });
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
            supabaseQuery = supabaseQuery.order(sort_by, { ascending: sort_direction === 'asc' });
            const offset = (page - 1) * limit;
            supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);
            const { data, error, count } = await supabaseQuery;
            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }
            const users = data || [];
            const totalItems = count || 0;
            const totalPages = Math.ceil(totalItems / limit);
            const response = {
                users: users,
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
        }
        catch (error) {
            console.error('UserService.getAllUsers error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                error: 'FETCH_USERS_ERROR'
            };
        }
    }
    async getUserById(id) {
        try {
            if (!id || isNaN(id)) {
                return {
                    success: false,
                    message: 'Invalid user ID provided',
                    error: 'INVALID_ID'
                };
            }
            const { data, error } = await supabaseService
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
                data: data,
                message: 'User retrieved successfully'
            };
        }
        catch (error) {
            console.error('UserService.getUserById error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                error: 'FETCH_USER_ERROR'
            };
        }
    }
    async getUserByEmail(email) {
        try {
            if (!email?.trim()) {
                return {
                    success: false,
                    message: 'Email is required',
                    error: 'INVALID_EMAIL'
                };
            }
            const { data, error } = await supabaseService
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
                data: data,
                message: 'User retrieved successfully'
            };
        }
        catch (error) {
            console.error('UserService.getUserByEmail error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                error: 'FETCH_USER_ERROR'
            };
        }
    }
    async createUser(userData) {
        try {
            const validation = this.validateUserData(userData, true);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Validation errors',
                    error: 'VALIDATION_ERROR',
                    errors: validation.errors
                };
            }
            const password_hash = await bcrypt.hash(userData.password, this.SALT_ROUNDS);
            const userDataForDb = {
                email: userData.email.trim().toLowerCase(),
                password_hash,
                full_name: userData.full_name.trim(),
                phone: userData.phone?.trim() || null,
                role: userData.role,
                is_active: userData.is_active ?? true,
                email_verified: userData.email_verified ?? false
            };
            const { data, error } = await supabaseService
                .rpc('create_user_atomic', { user_data: userDataForDb });
            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }
            if (!data?.success) {
                return {
                    success: false,
                    message: data?.message || 'Failed to create user',
                    error: data?.error_code || 'CREATE_USER_ERROR'
                };
            }
            return {
                success: true,
                data: data.user,
                message: 'User created successfully'
            };
        }
        catch (error) {
            console.error('UserService.createUser error:', error);
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
    async updateUser(id, userData) {
        try {
            if (!id || isNaN(id)) {
                return {
                    success: false,
                    message: 'Invalid user ID provided',
                    error: 'INVALID_ID'
                };
            }
            const validation = this.validateUserData(userData, false);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Validation errors',
                    error: 'VALIDATION_ERROR',
                    errors: validation.errors
                };
            }
            const updateData = {};
            if (userData.email !== undefined) {
                updateData.email = userData.email.trim().toLowerCase();
            }
            if (userData.full_name !== undefined) {
                updateData.full_name = userData.full_name.trim();
            }
            if (userData.phone !== undefined) {
                updateData.phone = userData.phone?.trim() || null;
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
            const { data, error } = await supabaseService
                .rpc('update_user_atomic', {
                user_id: id,
                user_data: updateData
            });
            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }
            if (!data?.success) {
                return {
                    success: false,
                    message: data?.message || 'Failed to update user',
                    error: data?.error_code || 'UPDATE_USER_ERROR'
                };
            }
            return {
                success: true,
                data: data.user,
                message: 'User updated successfully'
            };
        }
        catch (error) {
            console.error('UserService.updateUser error:', error);
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
    async toggleUserActive(id) {
        try {
            if (!id || isNaN(id)) {
                return {
                    success: false,
                    message: 'Invalid user ID provided',
                    error: 'INVALID_ID'
                };
            }
            const { data, error } = await supabaseService
                .rpc('toggle_user_active_atomic', { user_id: id });
            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }
            if (!data?.success) {
                return {
                    success: false,
                    message: data?.message || 'Failed to toggle user status',
                    error: data?.error_code || 'TOGGLE_USER_ERROR'
                };
            }
            return {
                success: true,
                data: data.user,
                message: data.message || 'User status changed successfully'
            };
        }
        catch (error) {
            console.error('UserService.toggleUserActive error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                error: 'TOGGLE_USER_ERROR'
            };
        }
    }
    async deleteUser(id) {
        try {
            if (!id || isNaN(id)) {
                return {
                    success: false,
                    message: 'Invalid user ID provided',
                    error: 'INVALID_ID'
                };
            }
            const { data, error } = await supabaseService
                .rpc('delete_user_atomic', { user_id: id });
            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }
            if (!data?.success) {
                return {
                    success: false,
                    message: data?.message || 'Failed to delete user',
                    error: data?.error_code || 'DELETE_USER_ERROR'
                };
            }
            return {
                success: true,
                data: { deleted_user: data.deleted_user },
                message: data.message || 'User deleted successfully'
            };
        }
        catch (error) {
            console.error('UserService.deleteUser error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                error: 'DELETE_USER_ERROR'
            };
        }
    }
    validateUserData(userData, isCreate) {
        const errors = [];
        if (isCreate || userData.email !== undefined) {
            if (!userData.email?.trim()) {
                errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' });
            }
            else {
                const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
                if (!emailRegex.test(userData.email.trim())) {
                    errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' });
                }
            }
        }
        if (isCreate || userData.full_name !== undefined) {
            if (!userData.full_name?.trim()) {
                errors.push({ field: 'full_name', message: 'Full name is required', code: 'REQUIRED' });
            }
            else if (userData.full_name.trim().length < 2) {
                errors.push({ field: 'full_name', message: 'Full name must be at least 2 characters', code: 'MIN_LENGTH' });
            }
        }
        if (isCreate || userData.password) {
            const password = userData.password || userData.password;
            if (!password?.trim()) {
                if (isCreate) {
                    errors.push({ field: 'password', message: 'Password is required', code: 'REQUIRED' });
                }
            }
            else {
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
        if (isCreate || userData.role !== undefined) {
            const validRoles = ['user', 'admin', 'support'];
            if (!userData.role) {
                if (isCreate) {
                    errors.push({ field: 'role', message: 'Role is required', code: 'REQUIRED' });
                }
            }
            else if (!validRoles.includes(userData.role)) {
                errors.push({ field: 'role', message: 'Invalid role selected', code: 'INVALID_VALUE' });
            }
        }
        if (userData.phone !== undefined && userData.phone?.trim()) {
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
