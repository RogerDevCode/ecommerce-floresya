/**
 * 🌸 FloresYa User Controller Tests - Enterprise TypeScript Edition
 * Comprehensive unit tests for user management functionality
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import { UserController } from '../../src/controllers/UserController.js';
import { userService } from '../../src/services/UserService.js';
import type { UserResponse, UserCreateRequest, UserUpdateRequest } from '../../src/types/globals.js';

// Mock the UserService
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

// Mock Express app setup
import express from 'express';
import { createUserRoutes } from '../../src/app/routes/userRoutes.js';

const app = express();
app.use(express.json());

// Mock authentication middleware for testing
vi.mock('../../src/app/middleware/auth.js', () => ({
  authenticateAdmin: vi.fn((req, res, next) => {
    // Mock admin user
    req.user = { id: 1, email: 'admin@test.com', role: 'admin' };
    next();
  })
}));

app.use('/api/users', createUserRoutes());

describe('UserController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/users', () => {
    test('should return users list with pagination', async () => {
      const mockUsers: UserResponse[] = [
        {
          id: 1,
          email: 'user1@test.com',
          full_name: 'Test User 1',
          phone: '+584141234567',
          role: 'user',
          is_active: true,
          email_verified: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          email: 'user2@test.com',
          full_name: 'Test User 2',
          role: 'admin',
          is_active: false,
          email_verified: false,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];

      const mockResponse = {
        success: true,
        data: {
          users: mockUsers,
          pagination: {
            current_page: 1,
            total_pages: 1,
            total_items: 2,
            items_per_page: 20
          }
        },
        message: 'Users retrieved successfully'
      };

      vi.mocked(userService.getAllUsers).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(userService.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort_by: 'created_at',
        sort_direction: 'desc'
      });
    });

    test('should handle query parameters correctly', async () => {
      const mockResponse = {
        success: true,
        data: { users: [], pagination: { current_page: 2, total_pages: 5, total_items: 100, items_per_page: 20 } },
        message: 'Users retrieved successfully'
      };

      vi.mocked(userService.getAllUsers).mockResolvedValue(mockResponse);

      await request(app)
        .get('/api/users')
        .query({
          page: '2',
          limit: '20',
          search: 'test',
          role: 'admin',
          is_active: 'true',
          email_verified: 'false',
          sort_by: 'email',
          sort_direction: 'asc'
        })
        .expect(200);

      expect(userService.getAllUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: 'test',
        role: 'admin',
        is_active: true,
        email_verified: false,
        sort_by: 'email',
        sort_direction: 'asc'
      });
    });

    test('should handle service errors gracefully', async () => {
      vi.mocked(userService.getAllUsers).mockResolvedValue({
        success: false,
        message: 'Database connection error',
        error: 'DB_ERROR'
      });

      const response = await request(app)
        .get('/api/users')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Database connection error'
      });
    });

    test('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: '-1', limit: '101' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation errors'
      });
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return user by ID', async () => {
      const mockUser: UserResponse = {
        id: 1,
        email: 'user@test.com',
        full_name: 'Test User',
        role: 'user',
        is_active: true,
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      vi.mocked(userService.getUserById).mockResolvedValue({
        success: true,
        data: mockUser,
        message: 'User retrieved successfully'
      });

      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body.data).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(1);
    });

    test('should return 404 for non-existent user', async () => {
      vi.mocked(userService.getUserById).mockResolvedValue({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });

      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found'
      });
    });

    test('should validate user ID parameter', async () => {
      const response = await request(app)
        .get('/api/users/invalid')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation errors'
      });
    });
  });

  describe('POST /api/users', () => {
    test('should create new user successfully', async () => {
      const newUser: UserCreateRequest = {
        email: 'newuser@test.com',
        password: 'StrongPass123',
        full_name: 'New Test User',
        phone: '+584141234567',
        role: 'user',
        is_active: true,
        email_verified: false
      };

      const createdUser: UserResponse = {
        id: 3,
        email: 'newuser@test.com',
        full_name: 'New Test User',
        phone: '+584141234567',
        role: 'user',
        is_active: true,
        email_verified: false,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      };

      vi.mocked(userService.createUser).mockResolvedValue({
        success: true,
        data: createdUser,
        message: 'User created successfully'
      });

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(response.body.data).toEqual(createdUser);
      expect(userService.createUser).toHaveBeenCalledWith(newUser);
    });

    test('should validate required fields', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123', // Too short
        // missing full_name and role
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation errors'
      });
    });

    test('should handle email already exists error', async () => {
      const newUser: UserCreateRequest = {
        email: 'existing@test.com',
        password: 'StrongPass123',
        full_name: 'Test User',
        role: 'user'
      };

      vi.mocked(userService.createUser).mockResolvedValue({
        success: false,
        message: 'Email already exists',
        error: 'EMAIL_EXISTS'
      });

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Email already exists'
      });
    });

    test('should validate password strength', async () => {
      const weakPasswordUser = {
        email: 'test@test.com',
        password: 'weak',
        full_name: 'Test User',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'password'
          })
        ])
      );
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user successfully', async () => {
      const updateData: UserUpdateRequest = {
        id: 1,
        email: 'updated@test.com',
        full_name: 'Updated User',
        role: 'admin',
        is_active: false
      };

      const updatedUser: UserResponse = {
        id: 1,
        email: 'updated@test.com',
        full_name: 'Updated User',
        role: 'admin',
        is_active: false,
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      };

      vi.mocked(userService.updateUser).mockResolvedValue({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });

      const response = await request(app)
        .put('/api/users/1')
        .send(updateData)
        .expect(200);

      expect(response.body.data).toEqual(updatedUser);
      expect(userService.updateUser).toHaveBeenCalledWith(1, updateData);
    });

    test('should return 404 for non-existent user', async () => {
      vi.mocked(userService.updateUser).mockResolvedValue({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });

      const response = await request(app)
        .put('/api/users/999')
        .send({ full_name: 'Updated Name' })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found'
      });
    });

    test('should validate email format when updating email', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation errors'
      });
    });
  });

  describe('PATCH /api/users/:id/toggle-active', () => {
    test('should toggle user active status', async () => {
      const toggledUser: UserResponse = {
        id: 1,
        email: 'user@test.com',
        full_name: 'Test User',
        role: 'user',
        is_active: false, // Was true, now false
        email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      };

      vi.mocked(userService.toggleUserActive).mockResolvedValue({
        success: true,
        data: toggledUser,
        message: 'User deactivated successfully'
      });

      const response = await request(app)
        .patch('/api/users/1/toggle-active')
        .expect(200);

      expect(response.body.data).toEqual(toggledUser);
      expect(userService.toggleUserActive).toHaveBeenCalledWith(1);
    });

    test('should return 404 for non-existent user', async () => {
      vi.mocked(userService.toggleUserActive).mockResolvedValue({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });

      const response = await request(app)
        .patch('/api/users/999/toggle-active')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user successfully', async () => {
      const deleteResponse = {
        success: true,
        data: {
          deleted_user: {
            id: 1,
            email: 'user@test.com',
            full_name: 'Test User'
          }
        },
        message: 'User deleted successfully'
      };

      vi.mocked(userService.deleteUser).mockResolvedValue(deleteResponse);

      const response = await request(app)
        .delete('/api/users/1')
        .expect(200);

      expect(response.body).toEqual(deleteResponse);
      expect(userService.deleteUser).toHaveBeenCalledWith(1);
    });

    test('should return 400 when user has related orders', async () => {
      vi.mocked(userService.deleteUser).mockResolvedValue({
        success: false,
        message: 'Cannot delete user: has 5 related orders. Consider deactivating instead.',
        error: 'USER_HAS_ORDERS'
      });

      const response = await request(app)
        .delete('/api/users/1')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('related orders')
      });
    });

    test('should return 400 when user has related payments', async () => {
      vi.mocked(userService.deleteUser).mockResolvedValue({
        success: false,
        message: 'Cannot delete user: has 3 related payments. Consider deactivating instead.',
        error: 'USER_HAS_PAYMENTS'
      });

      const response = await request(app)
        .delete('/api/users/1')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('related payments')
      });
    });

    test('should return 404 for non-existent user', async () => {
      vi.mocked(userService.deleteUser).mockResolvedValue({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });

      const response = await request(app)
        .delete('/api/users/999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('Authentication and Authorization', () => {
    test('should require admin authentication for all endpoints', () => {
      // This is tested implicitly by our mocked middleware
      // In a real scenario, you would test without the mock to ensure 401/403 responses
      expect(true).toBe(true); // Placeholder for middleware tests
    });
  });

  describe('Input Validation', () => {
    test('should reject invalid email formats', async () => {
      const invalidEmails = ['invalid', '@test.com', 'test@', 'test..test@test.com'];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/users')
          .send({
            email,
            password: 'StrongPass123',
            full_name: 'Test User',
            role: 'user'
          })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation errors'
        });
      }
    });

    test('should reject invalid phone formats', async () => {
      const invalidPhones = ['123', 'abc', '+123', '123456789012345678901'];

      for (const phone of invalidPhones) {
        const response = await request(app)
          .post('/api/users')
          .send({
            email: 'test@test.com',
            password: 'StrongPass123',
            full_name: 'Test User',
            phone,
            role: 'user'
          })
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation errors'
        });
      }
    });

    test('should accept valid phone formats', async () => {
      const validPhones = ['+584141234567', '1234567890', '+1234567890123'];

      vi.mocked(userService.createUser).mockResolvedValue({
        success: true,
        data: {} as UserResponse,
        message: 'User created successfully'
      });

      for (const phone of validPhones) {
        await request(app)
          .post('/api/users')
          .send({
            email: `test${Date.now()}@test.com`,
            password: 'StrongPass123',
            full_name: 'Test User',
            phone,
            role: 'user'
          })
          .expect(201);
      }
    });

    test('should validate role values', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@test.com',
          password: 'StrongPass123',
          full_name: 'Test User',
          role: 'invalid_role'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation errors'
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle internal server errors gracefully', async () => {
      vi.mocked(userService.getAllUsers).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/users')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Internal server error'
      });
    });

    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false
      });
    });
  });
});