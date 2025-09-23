/**
 * 🌸 FloresYa UserService Integration Tests - Real Database Edition
 * Tests de integración para UserService usando datos reales de Supabase
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { UserService } from '../../src/services/UserService.js';
import { FloresYaServer } from '../../src/app/server.js';
import supertest from 'supertest';
import { testSupabase, setupTestDatabase, teardownTestDatabase } from '../config/test-database.js';

describe('FloresYa UserService Integration Tests - Real Database', () => {
  let server: FloresYaServer;
  let request: any;
  let userService: UserService;

  beforeAll(async () => {
    // Setup test database connection
    await setupTestDatabase();

    // Create server instance
    server = new FloresYaServer();

    // Get the Express app
    const app = server.getApp();

    // Create supertest agent
    request = supertest(app);

    // Create UserService instance for direct testing
    userService = new UserService();
  });

  afterAll(async () => {
    // Cleanup test data
    await teardownTestDatabase();
  });

  describe('UserService Direct Tests', () => {
    it('should get all users from real database', async () => {
      const response = await userService.getAllUsers();

      expect(response.success).toBe(true);
      expect(response.data).toBeTruthy();
      expect(response.data).toHaveProperty('users');
      expect(Array.isArray(response.data!.users)).toBe(true);

      if (response.data!.users.length > 0) {
        const user = response.data!.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('full_name');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('is_active');
      }
    });

    it('should get user by ID from real database', async () => {
      // First get all users to get a valid ID
      const usersResponse = await userService.getAllUsers();
      expect(usersResponse.success).toBe(true);
      expect(usersResponse.data).toBeTruthy();
      expect(usersResponse.data!.users.length).toBeGreaterThan(0);

      const userId = usersResponse.data!.users[0].id;
      const userResponse = await userService.getUserById(userId);

      expect(userResponse.success).toBe(true);
      expect(userResponse.data!.id).toBe(userId);
      expect(userResponse.data).toHaveProperty('email');
      expect(userResponse.data).toHaveProperty('full_name');
      expect(userResponse.data).toHaveProperty('role');
    });

    it('should return error for non-existent user ID', async () => {
      const userResponse = await userService.getUserById(99999);

      expect(userResponse.success).toBe(false);
      expect(userResponse.message).toBe('User not found');
    });

    it('should get user by email from real database', async () => {
      // First get all users to get a valid email
      const usersResponse = await userService.getAllUsers();
      expect(usersResponse.success).toBe(true);
      expect(usersResponse.data).toBeTruthy();
      expect(usersResponse.data!.users.length).toBeGreaterThan(0);

      const userEmail = usersResponse.data!.users[0].email;
      const userResponse = await userService.getUserByEmail(userEmail);

      expect(userResponse.success).toBe(true);
      expect(userResponse.data!.email).toBe(userEmail);
      expect(userResponse.data).toHaveProperty('id');
      expect(userResponse.data).toHaveProperty('full_name');
      expect(userResponse.data).toHaveProperty('role');
    });

    it('should return error for non-existent email', async () => {
      const userResponse = await userService.getUserByEmail('nonexistent@example.com');

      expect(userResponse.success).toBe(false);
      expect(userResponse.message).toBe('User not found');
    });

    it('should create user in real database', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'TestPassword123',
        full_name: 'Test User',
        role: 'user' as const,
        is_active: true
      };

      const createResponse = await userService.createUser(newUser);

      expect(createResponse.success).toBe(true);
      expect(createResponse.data!.email).toBe(newUser.email);
      expect(createResponse.data!.full_name).toBe(newUser.full_name);
      expect(createResponse.data!.role).toBe(newUser.role);
      expect(createResponse.data!.is_active).toBe(newUser.is_active);
      expect(createResponse.data).toHaveProperty('id');
      expect(createResponse.data).toHaveProperty('created_at');
    });

    it('should update user in real database', async () => {
      // First create a user to update
      const newUser = {
        email: 'update-test@example.com',
        password: 'TestPassword123',
        full_name: 'Update Test User',
        role: 'user' as const,
        is_active: true
      };

      const createResponse = await userService.createUser(newUser);
      expect(createResponse.success).toBe(true);

      // Update the user
      const updatedData = {
        id: createResponse.data!.id,
        full_name: 'Updated Test User',
        is_active: false
      };

      const updateResponse = await userService.updateUser(createResponse.data!.id, updatedData);

      expect(updateResponse.success).toBe(true);
      expect(updateResponse.data!.id).toBe(createResponse.data!.id);
      expect(updateResponse.data!.full_name).toBe(updatedData.full_name);
      expect(updateResponse.data!.is_active).toBe(updatedData.is_active);
      expect(updateResponse.data!.email).toBe(createResponse.data!.email); // Should remain unchanged
    });

    it('should delete user from real database', async () => {
      // First create a user to delete
      const newUser = {
        email: 'delete-test@example.com',
        password: 'TestPassword123',
        full_name: 'Delete Test User',
        role: 'user' as const,
        is_active: true
      };

      const createResponse = await userService.createUser(newUser);
      expect(createResponse.success).toBe(true);

      // Delete the user
      const deleteResponse = await userService.deleteUser(createResponse.data!.id);

      expect(deleteResponse.success).toBe(true);
      expect(deleteResponse.data!.deleted_user.id).toBe(createResponse.data!.id);
      expect(deleteResponse.data!.deleted_user.email).toBe(newUser.email);

      // Verify user is deleted
      const deletedUserResponse = await userService.getUserById(createResponse.data!.id);
      expect(deletedUserResponse.success).toBe(false);
      expect(deletedUserResponse.message).toBe('User not found');
    });

    it('should toggle user active status', async () => {
      // First create a user
      const newUser = {
        email: 'toggle-test@example.com',
        password: 'TestPassword123',
        full_name: 'Toggle Test User',
        role: 'user' as const,
        is_active: true
      };

      const createResponse = await userService.createUser(newUser);
      expect(createResponse.success).toBe(true);

      // Toggle user status
      const toggleResponse = await userService.toggleUserActive(createResponse.data!.id);

      expect(toggleResponse.success).toBe(true);
      expect(toggleResponse.data!.id).toBe(createResponse.data!.id);
      expect(toggleResponse.data!.is_active).toBe(false); // Should be toggled to false
    });
  });

  describe('GET /api/users - Real Database Integration', () => {
    it('should return users from real database', async () => {
      const response = await request
        .get('/api/users')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Users retrieved successfully'
      });

      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);

      if (response.body.data.users.length > 0) {
        const user = response.body.data.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('full_name');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('active');
      }
    });

    it('should filter users by active status', async () => {
      const response = await request
        .get('/api/users?active=true')
        .expect(200);

      const users = response.body.data.users;
      expect(users.length).toBeGreaterThan(0);

      // All users should be active
      users.forEach((user: any) => {
        expect(user.active).toBe(true);
      });
    });

    it('should filter users by role', async () => {
      const response = await request
        .get('/api/users?role=customer')
        .expect(200);

      const users = response.body.data.users;

      // All users should have the specified role
      users.forEach((user: any) => {
        expect(user.role).toBe('customer');
      });
    });
  });

  describe('GET /api/users/:id - Real Database Integration', () => {
    it('should return a specific user from real database', async () => {
      // First get all users to get a valid ID
      const usersResponse = await request
        .get('/api/users')
        .expect(200);

      const users = usersResponse.body.data.users;
      expect(users.length).toBeGreaterThan(0);

      const userId = users[0].id;

      const response = await request
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User retrieved successfully'
      });

      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).toHaveProperty('full_name');
      expect(response.body.data.user).toHaveProperty('role');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request
        .get('/api/users/99999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found'
      });
    });
  });
});