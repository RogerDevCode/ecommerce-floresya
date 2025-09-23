/**
 * 🌸 FloresYa Occasions Controller Tests - Enterprise TypeScript Edition
 * Comprehensive unit tests for occasion management endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { OccasionsController } from '../../src/controllers/OccasionsController.js';
import { typeSafeDatabaseService } from '../../src/services/TypeSafeDatabaseService.js';
import type { Occasion, OccasionType } from '../../src/shared/types/index.js';

// Mock the database service
vi.mock('../../src/services/TypeSafeDatabaseService.js', () => ({
  typeSafeDatabaseService: {
    getActiveOccasions: vi.fn(),
    getActiveOccasionById: vi.fn(),
    getOccasionById: vi.fn(),
    createOccasion: vi.fn(),
    updateOccasion: vi.fn(),
    deleteOccasion: vi.fn(),
    getMaxOccasionDisplayOrder: vi.fn(),
    getOccasionsForQuery: vi.fn(),
    checkOccasionSlugExists: vi.fn(),
    getProductOccasionReferences: vi.fn()
  }
}));

describe('OccasionsController', () => {
  let occasionsController: OccasionsController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    // Create a new instance of OccasionsController
    occasionsController = new OccasionsController();

    // Mock response methods
    jsonMock = vi.fn();
    const sendMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock, send: sendMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
      send: sendMock
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getOccasions', () => {
    it('should return all active occasions successfully', async () => {
      const mockOccasions: Occasion[] = [
        {
          id: 1,
          name: 'Cumpleaños',
          slug: 'cumpleanos',
          description: 'Celebraciones de cumpleaños',
          color: '#FF6B6B',
          type: 'birthday' as OccasionType,
          display_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Aniversario',
          slug: 'aniversario',
          description: 'Aniversarios especiales',
          color: '#4ECDC4',
          type: 'anniversary' as OccasionType,
          display_order: 2,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      vi.mocked(typeSafeDatabaseService.getActiveOccasions).mockResolvedValue(mockOccasions);

      mockRequest = {
        query: {}
      };

      await occasionsController.getOccasions(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockOccasions,
        message: 'Occasions retrieved successfully'
      });
    });

    it('should return occasions successfully with valid query', async () => {
      const mockOccasions: Occasion[] = [
        {
          id: 1,
          name: 'Cumpleaños',
          slug: 'cumpleanos',
          description: 'Celebraciones de cumpleaños',
          color: '#FF6B6B',
          type: 'birthday' as OccasionType,
          display_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      vi.mocked(typeSafeDatabaseService.getActiveOccasions).mockResolvedValue(mockOccasions);

      mockRequest = {
        query: {
          limit: '10'
        }
      };

      await occasionsController.getOccasions(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockOccasions,
        message: 'Occasions retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Database connection failed';
      vi.mocked(typeSafeDatabaseService.getActiveOccasions).mockRejectedValue(new Error(errorMessage));

      mockRequest = {
        query: {}
      };

      await occasionsController.getOccasions(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch occasions',
        error: errorMessage
      });
    });
  });

  describe('getOccasionById', () => {
    it('should return occasion by ID successfully', async () => {
      const mockOccasion: Occasion = {
        id: 1,
        name: 'Cumpleaños',
        slug: 'cumpleanos',
        description: 'Celebraciones de cumpleaños',
        color: '#FF6B6B',
        type: 'birthday' as OccasionType,
        display_order: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      vi.mocked(typeSafeDatabaseService.getActiveOccasionById).mockResolvedValue(mockOccasion);

      mockRequest = {
        params: { id: '1' }
      };

      await occasionsController.getOccasionById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { occasion: mockOccasion },
        message: 'Occasion retrieved successfully'
      });
    });

    it('should return 404 when occasion not found', async () => {
      vi.mocked(typeSafeDatabaseService.getActiveOccasionById).mockResolvedValue(null);

      mockRequest = {
        params: { id: '999' }
      };

      await occasionsController.getOccasionById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Occasion not found'
      });
    });

    it('should return 404 when occasion ID is not found', async () => {
      // Test with a valid ID format but non-existent occasion
      mockRequest = {
        params: { id: '999' }
      };

      await occasionsController.getOccasionById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Occasion not found'
      });
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Database query failed';
      vi.mocked(typeSafeDatabaseService.getActiveOccasionById).mockRejectedValue(new Error(errorMessage));

      mockRequest = {
        params: { id: '1' }
      };

      await occasionsController.getOccasionById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch occasion',
        error: errorMessage
      });
    });
  });

  describe('createOccasion', () => {
    it('should create occasion successfully', async () => {
      const createData = {
        name: 'nuevo cumpleaños',
        type: 'birthday' as OccasionType,
        description: 'Nueva ocasión de cumpleaños',
        is_active: true
      };

      const mockCreatedOccasion: Occasion = {
        id: 3,
        name: 'Nuevo Cumpleaños',
        slug: 'nuevo-cumpleanos',
        description: 'Nueva ocasión de cumpleaños',
        color: '#FF6B6B',
        type: 'birthday' as OccasionType,
        display_order: 3,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock the helper methods
      vi.spyOn(occasionsController as any, 'checkOccasionNameExists').mockResolvedValue(false);
      vi.mocked(typeSafeDatabaseService.getMaxOccasionDisplayOrder).mockResolvedValue(2);
      vi.mocked(typeSafeDatabaseService.createOccasion).mockResolvedValue(mockCreatedOccasion);

      mockRequest = {
        body: createData
      };

      await occasionsController.createOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { occasion: mockCreatedOccasion },
        message: 'Occasion created successfully'
      });
    });

    it('should handle duplicate name error', async () => {
      const createData = {
        name: 'cumpleaños existente',
        type: 'birthday' as OccasionType,
        description: 'Intento de duplicado',
        is_active: true
      };

      // Mock the helper method to return true (name exists)
      vi.spyOn(occasionsController as any, 'checkOccasionNameExists').mockResolvedValue(true);

      mockRequest = {
        body: createData
      };

      await occasionsController.createOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Ya existe una ocasión con el nombre "Cumpleaños Existente". Los nombres deben ser únicos (ignorando acentos y caracteres especiales).',
        error: 'OCCASION_NAME_EXISTS'
      });
    });

    it('should create occasion with valid data', async () => {
      const createData = {
        name: 'Test Occasion',
        type: 'general' as OccasionType,
        description: 'Test description',
        is_active: true
      };

      const mockCreatedOccasion: Occasion = {
        id: 3,
        name: 'Test Occasion',
        slug: 'test-occasion',
        description: 'Test description',
        color: '#FF6B6B',
        type: 'general' as OccasionType,
        display_order: 3,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock the helper methods
      vi.spyOn(occasionsController as any, 'checkOccasionNameExists').mockResolvedValue(false);
      vi.mocked(typeSafeDatabaseService.getMaxOccasionDisplayOrder).mockResolvedValue(2);
      vi.mocked(typeSafeDatabaseService.createOccasion).mockResolvedValue(mockCreatedOccasion);

      mockRequest = {
        body: createData
      };

      await occasionsController.createOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { occasion: mockCreatedOccasion },
        message: 'Occasion created successfully'
      });
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Database insertion failed';
      vi.spyOn(occasionsController as any, 'checkOccasionNameExists').mockRejectedValue(new Error(errorMessage));

      mockRequest = {
        body: {
          name: 'Test Occasion',
          type: 'general' as OccasionType,
          description: 'Test description',
          is_active: true
        }
      };

      await occasionsController.createOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create occasion',
        error: errorMessage
      });
    });
  });

  describe('updateOccasion', () => {
    it('should update occasion successfully', async () => {
      const currentOccasion: Occasion = {
        id: 1,
        name: 'Cumpleaños',
        slug: 'cumpleanos',
        description: 'Celebraciones de cumpleaños',
        color: '#FF6B6B',
        type: 'birthday' as OccasionType,
        display_order: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const updateData = {
        name: 'nuevo nombre de cumpleaños',
        description: 'Nueva descripción',
        is_active: true
      };

      const mockUpdatedOccasion: Occasion = {
        ...currentOccasion,
        name: 'Nuevo Nombre De Cumpleaños',
        description: 'Nueva descripción',
        updated_at: expect.any(String)
      };

      // Mock the helper methods
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(currentOccasion);
      vi.spyOn(occasionsController as any, 'checkOccasionNameExists').mockResolvedValue(false);
      vi.mocked(typeSafeDatabaseService.checkOccasionSlugExists).mockResolvedValue(false);
      vi.mocked(typeSafeDatabaseService.updateOccasion).mockResolvedValue(mockUpdatedOccasion);

      mockRequest = {
        params: { id: '1' },
        body: updateData
      };

      await occasionsController.updateOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          occasion: mockUpdatedOccasion,
          slug_changed: expect.any(Boolean)
        },
        message: 'Occasion updated successfully'
      });
    });

    it('should handle slug change when name is updated', async () => {
      const currentOccasion: Occasion = {
        id: 1,
        name: 'Cumpleaños',
        slug: 'cumpleanos',
        description: 'Celebraciones de cumpleaños',
        color: '#FF6B6B',
        type: 'birthday' as OccasionType,
        display_order: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const updateData = {
        name: 'fiesta de cumpleaños',
        description: 'Nueva descripción',
        is_active: true
      };

      const mockUpdatedOccasion: Occasion = {
        ...currentOccasion,
        name: 'Fiesta De Cumpleaños',
        slug: 'fiesta-de-cumpleanos',
        description: 'Nueva descripción',
        updated_at: expect.any(String)
      };

      // Mock the helper methods
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(currentOccasion);
      vi.spyOn(occasionsController as any, 'checkOccasionNameExists').mockResolvedValue(false);
      vi.mocked(typeSafeDatabaseService.checkOccasionSlugExists).mockResolvedValue(false);
      vi.mocked(typeSafeDatabaseService.updateOccasion).mockResolvedValue(mockUpdatedOccasion);

      mockRequest = {
        params: { id: '1' },
        body: updateData
      };

      await occasionsController.updateOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          occasion: mockUpdatedOccasion,
          slug_changed: true
        },
        message: 'Occasion updated successfully'
      });
    });

    it('should return 404 when occasion not found', async () => {
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(null);

      mockRequest = {
        params: { id: '999' },
        body: {
          name: 'Test Update'
        }
      };

      await occasionsController.updateOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Occasion not found'
      });
    });

    it('should return 404 when occasion not found for update', async () => {
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(null);

      mockRequest = {
        params: { id: '999' },
        body: {
          name: 'Test Update'
        }
      };

      await occasionsController.updateOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Occasion not found'
      });
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Database update failed';
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockRejectedValue(new Error(errorMessage));

      mockRequest = {
        params: { id: '1' },
        body: {
          name: 'Test Update'
        }
      };

      await occasionsController.updateOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update occasion',
        error: errorMessage
      });
    });
  });

  describe('deleteOccasion', () => {
    it('should perform logical deletion when occasion has references', async () => {
      const mockOccasion: Occasion = {
        id: 1,
        name: 'Cumpleaños',
        slug: 'cumpleanos',
        description: 'Celebraciones de cumpleaños',
        color: '#FF6B6B',
        type: 'birthday' as OccasionType,
        display_order: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockReferences = [1, 2, 3]; // Array of product IDs

      const mockUpdatedOccasion: Occasion = {
        ...mockOccasion,
        is_active: false,
        updated_at: expect.any(String)
      };

      // Mock the helper methods
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(mockOccasion);
      vi.mocked(typeSafeDatabaseService.getProductOccasionReferences).mockResolvedValue(mockReferences);
      vi.mocked(typeSafeDatabaseService.updateOccasion).mockResolvedValue(mockUpdatedOccasion);

      mockRequest = {
        params: { id: '1' }
      };

      await occasionsController.deleteOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          occasion: mockUpdatedOccasion,
          deletion_type: 'logical',
          has_references: true
        },
        message: 'Occasion deactivated successfully (has product references)'
      });
    });

    it('should perform physical deletion when occasion has no references', async () => {
      const mockOccasion: Occasion = {
        id: 2,
        name: 'Aniversario',
        slug: 'aniversario',
        description: 'Aniversarios especiales',
        color: '#4ECDC4',
        type: 'anniversary' as OccasionType,
        display_order: 2,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock the helper methods
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(mockOccasion);
      vi.mocked(typeSafeDatabaseService.getProductOccasionReferences).mockResolvedValue([]);
      vi.mocked(typeSafeDatabaseService.deleteOccasion).mockResolvedValue(undefined);

      mockRequest = {
        params: { id: '2' }
      };

      await occasionsController.deleteOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should return 404 when occasion not found', async () => {
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(null);

      mockRequest = {
        params: { id: '999' }
      };

      await occasionsController.deleteOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Occasion not found'
      });
    });

    it('should return 404 when occasion not found for deletion', async () => {
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(null);

      mockRequest = {
        params: { id: '999' }
      };

      await occasionsController.deleteOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Occasion not found'
      });
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Database deletion failed';
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockRejectedValue(new Error(errorMessage));

      mockRequest = {
        params: { id: '1' }
      };

      await occasionsController.deleteOccasion(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete occasion',
        error: errorMessage
      });
    });
  });

  describe('Private helper methods', () => {
    describe('capitalizeOccasionName', () => {
      it('should capitalize occasion names correctly', () => {
        const controller = new OccasionsController();

        expect((controller as any).capitalizeOccasionName('cumpleaños')).toBe('Cumpleaños');
        expect((controller as any).capitalizeOccasionName('día de la madre')).toBe('Día de la Madre');
        expect((controller as any).capitalizeOccasionName('san valentín')).toBe('San Valentín');
        expect((controller as any).capitalizeOccasionName('navidad y año nuevo')).toBe('Navidad y Año Nuevo');
      });

      it('should handle empty and single word names', () => {
        const controller = new OccasionsController();

        expect((controller as any).capitalizeOccasionName('')).toBe('');
        expect((controller as any).capitalizeOccasionName('cumpleaños')).toBe('Cumpleaños');
      });
    });

    describe('normalizeOccasionName', () => {
      it('should normalize occasion names correctly', () => {
        const controller = new OccasionsController();

        expect((controller as any).normalizeOccasionName('Cumpleaños')).toBe('cumpleaños');
        expect((controller as any).normalizeOccasionName('Día de la Madre')).toBe('dia de la madre');
        expect((controller as any).normalizeOccasionName('San Valentín')).toBe('san valentin');
        expect((controller as any).normalizeOccasionName('Navidad y Año Nuevo')).toBe('navidad y año nuevo');
      });

      it('should preserve ñ character', () => {
        const controller = new OccasionsController();

        expect((controller as any).normalizeOccasionName('Cumpleaños')).toBe('cumpleaños');
        expect((controller as any).normalizeOccasionName('Ñoño')).toBe('ñoño');
      });
    });

    describe('checkOccasionNameExists', () => {
      it('should return false when name does not exist', async () => {
        const controller = new OccasionsController();
        const mockOccasions: Occasion[] = [
          {
            id: 1,
            name: 'Cumpleaños',
            slug: 'cumpleanos',
            description: 'Celebraciones de cumpleaños',
            color: '#FF6B6B',
            type: 'birthday' as OccasionType,
            display_order: 1,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ];

        vi.mocked(typeSafeDatabaseService.getOccasionsForQuery).mockResolvedValue(mockOccasions);

        const result = await (controller as any).checkOccasionNameExists('aniversario');

        expect(result).toBe(false);
      });

      it('should return true when name exists', async () => {
        const controller = new OccasionsController();
        const mockOccasions: Occasion[] = [
          {
            id: 1,
            name: 'Cumpleaños',
            slug: 'cumpleanos',
            description: 'Celebraciones de cumpleaños',
            color: '#FF6B6B',
            type: 'birthday' as OccasionType,
            display_order: 1,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ];

        vi.mocked(typeSafeDatabaseService.getOccasionsForQuery).mockResolvedValue(mockOccasions);

        const result = await (controller as any).checkOccasionNameExists('cumpleaños');

        expect(result).toBe(true);
      });

      it('should exclude specified ID when checking', async () => {
        const controller = new OccasionsController();
        const allOccasions: Occasion[] = [
          {
            id: 1,
            name: 'Cumpleaños',
            slug: 'cumpleanos',
            description: 'Celebraciones de cumpleaños',
            color: '#FF6B6B',
            type: 'birthday' as OccasionType,
            display_order: 1,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ];

        // Mock getOccasionsForQuery to exclude the specified ID
        vi.mocked(typeSafeDatabaseService.getOccasionsForQuery).mockImplementation((excludeId?: number) => {
          if (excludeId === 1) {
            // When excluding ID 1, return empty array
            return Promise.resolve([]);
          }
          return Promise.resolve(allOccasions);
        });

        const result = await (controller as any).checkOccasionNameExists('cumpleaños', 1);

        expect(result).toBe(false);
      });
    });
  });
});