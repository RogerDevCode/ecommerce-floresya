/**
 * 🌸 FloresYa Occasions Controller Tests - Silicon Valley Simple Mock Edition
 * Clean, maintainable tests with one mock per test pattern
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { OccasionsController } from '../../src/controllers/OccasionsController';
import { typeSafeDatabaseService } from '../../src/services/TypeSafeDatabaseService';
import type { Occasion } from '../../src/shared/types/index';

// Mock the database service
vi.mock('../../src/services/TypeSafeDatabaseService', () => ({
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

  // Test data factories
  const createTestOccasion = (overrides = {}) => ({
    id: 1,
    name: 'Cumpleaños',
    slug: 'cumpleanos',
    description: 'Celebraciones de cumpleaños',
    color: '#FF6B6B',
    display_order: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  });

  const createTestOccasionsList = (occasions = [createTestOccasion()], overrides = []) => [
    ...occasions,
    ...overrides
  ];

  const createMockRequest = (options: any = {}) => ({
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    ...options
  });

  const createMockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    occasionsController = new OccasionsController();

    jsonMock = vi.fn();
    const sendMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock, send: sendMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
      send: sendMock
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getOccasions', () => {
    it('should return all active occasions successfully', async () => {
      // Arrange
      const testOccasions = createTestOccasionsList([
        createTestOccasion(),
        createTestOccasion({
          id: 2,
          name: 'Aniversario',
          slug: 'aniversario',
          description: 'Aniversarios especiales',
          color: '#4ECDC4',
          display_order: 2
        })
      ]);

      vi.mocked(typeSafeDatabaseService.getActiveOccasions).mockResolvedValue(testOccasions);

      mockRequest = createMockRequest({
        query: {}
      });

      // Act
      await occasionsController.getOccasions(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: testOccasions,
        message: 'Occasions retrieved successfully'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      vi.mocked(typeSafeDatabaseService.getActiveOccasions).mockRejectedValue(new Error(errorMessage));

      mockRequest = createMockRequest({
        query: {}
      });

      // Act
      await occasionsController.getOccasions(mockRequest as Request, mockResponse as Response);

      // Assert
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
      // Arrange
      const testOccasion = createTestOccasion();
      vi.mocked(typeSafeDatabaseService.getActiveOccasionById).mockResolvedValue(testOccasion);

      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      // Act
      await occasionsController.getOccasionById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { occasion: testOccasion },
        message: 'Occasion retrieved successfully'
      });
    });

    it('should return 404 when occasion not found', async () => {
      // Arrange
      vi.mocked(typeSafeDatabaseService.getActiveOccasionById).mockResolvedValue(null);

      mockRequest = createMockRequest({
        params: { id: '999' }
      });

      // Act
      await occasionsController.getOccasionById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Occasion not found'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const errorMessage = 'Database query failed';
      vi.mocked(typeSafeDatabaseService.getActiveOccasionById).mockRejectedValue(new Error(errorMessage));

      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      // Act
      await occasionsController.getOccasionById(mockRequest as Request, mockResponse as Response);

      // Assert
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
      // Arrange
      const createData = {
        name: 'nuevo cumpleaños',
        description: 'Nueva ocasión de cumpleaños',
        is_active: true
      };

      const testCreatedOccasion = createTestOccasion({
        id: 3,
        name: 'Nuevo Cumpleaños',
        slug: 'nuevo-cumpleanos',
        description: 'Nueva ocasión de cumpleaños',
        color: '#FF6B6B',
        display_order: 3
      });

      // Mock the helper methods
      vi.spyOn(occasionsController as any, 'checkOccasionNameExists').mockResolvedValue(false);
      vi.mocked(typeSafeDatabaseService.getMaxOccasionDisplayOrder).mockResolvedValue(2);
      vi.mocked(typeSafeDatabaseService.createOccasion).mockResolvedValue(testCreatedOccasion);

      mockRequest = createMockRequest({
        body: createData
      });

      // Act
      await occasionsController.createOccasion(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: { occasion: testCreatedOccasion },
        message: 'Occasion created successfully'
      });
    });

    it('should handle duplicate name error', async () => {
      // Arrange
      const createData = {
        name: 'cumpleaños existente',
        description: 'Intento de duplicado',
        is_active: true
      };

      // Mock the helper method to return true (name exists)
      vi.spyOn(occasionsController as any, 'checkOccasionNameExists').mockResolvedValue(true);

      mockRequest = createMockRequest({
        body: createData
      });

      // Act
      await occasionsController.createOccasion(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Ya existe una ocasión con el nombre "Cumpleaños Existente". Los nombres deben ser únicos (ignorando acentos y caracteres especiales).',
        error: 'OCCASION_NAME_EXISTS'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const errorMessage = 'Database insertion failed';
      vi.spyOn(occasionsController as any, 'checkOccasionNameExists').mockRejectedValue(new Error(errorMessage));

      mockRequest = createMockRequest({
        body: {
          name: 'Test Occasion',
          description: 'Test description',
          is_active: true
        }
      });

      // Act
      await occasionsController.createOccasion(mockRequest as Request, mockResponse as Response);

      // Assert
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
      // Arrange
      const currentOccasion = createTestOccasion();
      const updateData = {
        name: 'nuevo nombre de cumpleaños',
        description: 'Nueva descripción',
        is_active: true
      };

      const testUpdatedOccasion = createTestOccasion({
        ...currentOccasion,
        name: 'Nuevo Nombre De Cumpleaños',
        description: 'Nueva descripción'
      });

      // Mock the helper methods
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(currentOccasion);
      vi.spyOn(occasionsController as any, 'checkOccasionNameExists').mockResolvedValue(false);
      vi.mocked(typeSafeDatabaseService.checkOccasionSlugExists).mockResolvedValue(false);
      vi.mocked(typeSafeDatabaseService.updateOccasion).mockResolvedValue(testUpdatedOccasion);

      mockRequest = createMockRequest({
        params: { id: '1' },
        body: updateData
      });

      // Act
      await occasionsController.updateOccasion(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          occasion: testUpdatedOccasion,
          slug_changed: expect.any(Boolean)
        },
        message: 'Occasion updated successfully'
      });
    });

    it('should return 404 when occasion not found', async () => {
      // Arrange
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(null);

      mockRequest = createMockRequest({
        params: { id: '999' },
        body: {
          name: 'Test Update'
        }
      });

      // Act
      await occasionsController.updateOccasion(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Occasion not found'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const errorMessage = 'Database update failed';
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockRejectedValue(new Error(errorMessage));

      mockRequest = createMockRequest({
        params: { id: '1' },
        body: {
          name: 'Test Update'
        }
      });

      // Act
      await occasionsController.updateOccasion(mockRequest as Request, mockResponse as Response);

      // Assert
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
      // Arrange
      const testOccasion = createTestOccasion();
      const mockReferences = [1, 2, 3]; // Array of product IDs

      const testUpdatedOccasion = createTestOccasion({
        ...testOccasion,
        is_active: false
      });

      // Mock the helper methods
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(testOccasion);
      vi.mocked(typeSafeDatabaseService.getProductOccasionReferences).mockResolvedValue(mockReferences);
      vi.mocked(typeSafeDatabaseService.updateOccasion).mockResolvedValue(testUpdatedOccasion);

      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      // Act
      await occasionsController.deleteOccasion(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          occasion: testUpdatedOccasion,
          deletion_type: 'logical',
          has_references: true
        },
        message: 'Occasion deactivated successfully (has product references)'
      });
    });

    it('should perform physical deletion when occasion has no references', async () => {
      // Arrange
      const testOccasion = createTestOccasion({
        id: 2,
        name: 'Aniversario',
        slug: 'aniversario',
        description: 'Aniversarios especiales',
        color: '#4ECDC4',
        display_order: 2
      });

      // Mock the helper methods
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(testOccasion);
      vi.mocked(typeSafeDatabaseService.getProductOccasionReferences).mockResolvedValue([]);
      vi.mocked(typeSafeDatabaseService.deleteOccasion).mockResolvedValue(undefined);

      mockRequest = createMockRequest({
        params: { id: '2' }
      });

      // Act
      await occasionsController.deleteOccasion(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should return 404 when occasion not found', async () => {
      // Arrange
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockResolvedValue(null);

      mockRequest = createMockRequest({
        params: { id: '999' }
      });

      // Act
      await occasionsController.deleteOccasion(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Occasion not found'
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const errorMessage = 'Database deletion failed';
      vi.mocked(typeSafeDatabaseService.getOccasionById).mockRejectedValue(new Error(errorMessage));

      mockRequest = createMockRequest({
        params: { id: '1' }
      });

      // Act
      await occasionsController.deleteOccasion(mockRequest as Request, mockResponse as Response);

      // Assert
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
        // Arrange
        const controller = new OccasionsController();

        // Act & Assert
        expect((controller as any).capitalizeOccasionName('cumpleaños')).toBe('Cumpleaños');
        expect((controller as any).capitalizeOccasionName('día de la madre')).toBe('Día de la Madre');
        expect((controller as any).capitalizeOccasionName('san valentín')).toBe('San Valentín');
        expect((controller as any).capitalizeOccasionName('navidad y año nuevo')).toBe('Navidad y Año Nuevo');
      });

      it('should handle empty and single word names', () => {
        // Arrange
        const controller = new OccasionsController();

        // Act & Assert
        expect((controller as any).capitalizeOccasionName('')).toBe('');
        expect((controller as any).capitalizeOccasionName('cumpleaños')).toBe('Cumpleaños');
      });
    });

    describe('normalizeOccasionName', () => {
      it('should normalize occasion names correctly', () => {
        // Arrange
        const controller = new OccasionsController();

        // Act & Assert
        expect((controller as any).normalizeOccasionName('Cumpleaños')).toBe('cumpleaños');
        expect((controller as any).normalizeOccasionName('Día de la Madre')).toBe('dia de la madre');
        expect((controller as any).normalizeOccasionName('San Valentín')).toBe('san valentin');
        expect((controller as any).normalizeOccasionName('Navidad y Año Nuevo')).toBe('navidad y año nuevo');
      });

      it('should preserve ñ character', () => {
        // Arrange
        const controller = new OccasionsController();

        // Act & Assert
        expect((controller as any).normalizeOccasionName('Cumpleaños')).toBe('cumpleaños');
        expect((controller as any).normalizeOccasionName('Ñoño')).toBe('ñoño');
      });
    });

    describe('checkOccasionNameExists', () => {
      it('should return false when name does not exist', async () => {
        // Arrange
        const controller = new OccasionsController();
        const testOccasions = createTestOccasionsList();

        vi.mocked(typeSafeDatabaseService.getOccasionsForQuery).mockResolvedValue(testOccasions);

        // Act
        const result = await (controller as any).checkOccasionNameExists('aniversario');

        // Assert
        expect(result).toBe(false);
      });

      it('should return true when name exists', async () => {
        // Arrange
        const controller = new OccasionsController();
        const testOccasions = createTestOccasionsList();

        vi.mocked(typeSafeDatabaseService.getOccasionsForQuery).mockResolvedValue(testOccasions);

        // Act
        const result = await (controller as any).checkOccasionNameExists('cumpleaños');

        // Assert
        expect(result).toBe(true);
      });

      it('should exclude specified ID when checking', async () => {
        // Arrange
        const controller = new OccasionsController();
        const allOccasions = createTestOccasionsList();

        // Mock getOccasionsForQuery to exclude the specified ID
        vi.mocked(typeSafeDatabaseService.getOccasionsForQuery).mockImplementation((excludeId?: number) => {
          if (excludeId === 1) {
            // When excluding ID 1, return empty array
            return Promise.resolve([]);
          }
          return Promise.resolve(allOccasions);
        });

        // Act
        const result = await (controller as any).checkOccasionNameExists('cumpleaños', 1);

        // Assert
        expect(result).toBe(false);
      });
    });
  });
});