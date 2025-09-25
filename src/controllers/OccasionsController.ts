/**
 * 🌸 FloresYa Occasions Controller - API REST Enterprise Edition
 * Manages occasion data for product categorization
 */

import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';

import { typeSafeDatabaseService } from '../services/TypeSafeDatabaseService.js';

export class OccasionsController {
  /**
   * Apply smart capitalization to occasion names (preserves accents)
   */
  private capitalizeOccasionName(name: string): string {
    // Common words that should not be capitalized (except at start)
    const lowercaseWords = ['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'en', 'con', 'por', 'para', 'sobre', 'tras', 'durante'];

    return name
      .trim()
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        // Always capitalize first word and last word
        if (index === 0) {
          return this.capitalizeWord(word);
        }

        // Don't capitalize common words unless they're the last word
        if (lowercaseWords.includes(word)) {
          return word;
        }

        // Capitalize other words
        return this.capitalizeWord(word);
      })
      .join(' ');
  }

  /**
   * Capitalize first letter of a word while preserving accents
   */
  private capitalizeWord(word: string): string {
    if (word.length === 0) {return word;}
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  /**
   * Process and normalize occasion name by removing diacritics but preserving ñ and Ñ
   */
  private normalizeOccasionName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      // Preserve ñ and Ñ by temporarily replacing them
      .replace(/ñ/g, '___TEMP_N_TILDE___')
      .replace(/Ñ/g, '___TEMP_NN_TILDE___')
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks (but ñ and Ñ are preserved)
      // Restore ñ and Ñ
      .replace(/___TEMP_N_TILDE___/g, 'ñ')
      .replace(/___TEMP_NN_TILDE___/g, 'ñ') // Both become ñ in lowercase
      .replace(/[^a-z0-9\s\-ñ]/g, '') // Remove special characters except spaces, hyphens, and ñ
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Check if an occasion name already exists (ignoring diacritics)
   */
  private async checkOccasionNameExists(normalizedName: string, excludeId?: number): Promise<boolean> {
    const occasions = await typeSafeDatabaseService.getOccasionsForQuery(excludeId);

    if (!occasions || occasions.length === 0) {
      return false;
    }

    // Check if any existing occasion has the same normalized name
    return occasions.some(occasion => {
      const existingNormalized = this.normalizeOccasionName(occasion.name);
      return existingNormalized === normalizedName;
    });
  }
  /**
   * @swagger
   * /api/occasions:
   *   get:
   *     summary: Get all active occasions
   *     description: Retrieves a list of all active occasions ordered by display order
   *     tags: [Occasions]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Maximum number of occasions to return
   *     responses:
   *       200:
   *         description: Occasions retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Occasion'
   *                 message:
   *                   type: string
   *                   example: "Occasions retrieved successfully"
   *       500:
   *         description: Server error
   */
  public async getOccasions(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: errors.array()
        });
        return;
      }

      const data = await typeSafeDatabaseService.getActiveOccasions();

      res.status(200).json({
        success: true,
        data,
        message: 'Occasions retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch occasions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/occasions/{id}:
   *   get:
   *     summary: Get single occasion by ID
   *     description: Retrieves a specific occasion by its ID if it's active
   *     tags: [Occasions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Occasion ID
   *     responses:
   *       200:
   *         description: Occasion retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     occasion:
   *                       $ref: '#/components/schemas/Occasion'
   *                 message:
   *                   type: string
   *                   example: "Occasion retrieved successfully"
   *       404:
   *         description: Occasion not found
   *       500:
   *         description: Server error
   */
  public async getOccasionById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Invalid occasion ID',
          errors: errors.array()
        });
        return;
      }

      const occasionId = parseInt(req.params.id);
      const data = await typeSafeDatabaseService.getActiveOccasionById(occasionId);

      if (!data) {
        res.status(404).json({
          success: false,
          message: 'Occasion not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { occasion: data },
        message: 'Occasion retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch occasion',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/occasions:
   *   post:
   *     summary: Create a new occasion
   *     description: Creates a new occasion with the provided data
   *     tags: [Occasions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - slug
   *             properties:
   *               name:
   *                 type: string
   *                 description: Occasion name
   *               slug:
   *                 type: string
   *                 description: URL-friendly slug
   *               description:
   *                 type: string
   *                 description: Optional description
   *               is_active:
   *                 type: boolean
   *                 description: Whether the occasion is active
   *                 default: true
   *     responses:
   *       201:
   *         description: Occasion created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     occasion:
   *                       $ref: '#/components/schemas/Occasion'
   *                 message:
   *                   type: string
   *                   example: "Occasion created successfully"
   *       400:
   *         description: Invalid input data
   *       500:
   *         description: Server error
   */
  public async createOccasion(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
        return;
      }

      const { name, description, is_active = true } = req.body as {
        name: string;
        description?: string;
        is_active?: boolean;
      };

      // Apply default AFTER validation passes
      // const finalType: OccasionType = (type as OccasionType) ?? 'general'; // REMOVED: Column 'type' eliminated from occasions table

      // Apply smart capitalization to the name
      const capitalizedName = this.capitalizeOccasionName(name);

      // Normalize the name (remove diacritics and clean) for uniqueness check
      const normalizedName = this.normalizeOccasionName(capitalizedName);

      // Check if an occasion with this normalized name already exists
      const nameExists = await this.checkOccasionNameExists(normalizedName);
      if (nameExists) {
        res.status(409).json({
          success: false,
          message: `Ya existe una ocasión con el nombre "${capitalizedName}". Los nombres deben ser únicos (ignorando acentos y caracteres especiales).`,
          error: 'OCCASION_NAME_EXISTS'
        });
        return;
      }

      // Generate slug from the normalized name
      const slug = normalizedName.replace(/\s+/g, '-').replace(/-+/g, '-').trim();

      // Get the next display order
      const maxOrder = await typeSafeDatabaseService.getMaxOccasionDisplayOrder();
      const nextDisplayOrder = maxOrder + 1;

      const data = await typeSafeDatabaseService.createOccasion({
        name: capitalizedName, // Use capitalized name for display
        // type: finalType, // REMOVED: Column 'type' eliminated from occasions table
        slug,
        description,
        is_active,
        display_order: nextDisplayOrder
      });

      res.status(201).json({
        success: true,
        data: { occasion: data },
        message: 'Occasion created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create occasion',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/occasions/{id}:
   *   put:
   *     summary: Update an existing occasion
   *     description: Updates an occasion with the provided data. Slug is automatically managed.
   *     tags: [Occasions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Occasion ID to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Occasion name (2-100 characters)
   *               description:
   *                 type: string
   *                 description: Optional description
   *               is_active:
   *                 type: boolean
   *                 description: Whether the occasion is active
   *                 default: true
   *     responses:
   *       200:
   *         description: Occasion updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     occasion:
   *                       $ref: '#/components/schemas/Occasion'
   *                     slug_changed:
   *                       type: boolean
   *                       description: Whether the slug was changed due to name update
   *                       example: false
   *                 message:
   *                   type: string
   *                   example: "Occasion updated successfully"
   *       400:
   *         description: Invalid input data
   *       404:
   *         description: Occasion not found
   *       500:
   *         description: Server error
   */
  public async updateOccasion(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
        return;
      }

      const occasionId = parseInt(req.params.id);
      const { name, description, is_active = true } = req.body as {
        name?: string;
        description?: string;
        is_active?: boolean;
      };

      // Get current occasion data
      const currentOccasion = await typeSafeDatabaseService.getOccasionById(occasionId);

      if (!currentOccasion) {
        res.status(404).json({
          success: false,
          message: 'Occasion not found'
        });
        return;
      }

      // Prepare update data
      const updateData: {
        is_active: boolean;
        updated_at: string;
        name?: string;
        // type?: OccasionType; // REMOVED: Column 'type' eliminated from occasions table
        slug?: string;
        description?: string | null;
      } = {
        is_active,
        updated_at: new Date().toISOString()
      };

      let slugChanged = false;
      let finalSlug = currentOccasion.slug;

      // Handle name change and slug generation
      if (name && name !== currentOccasion.name) {
        // Apply smart capitalization to the new name
        const capitalizedNewName = this.capitalizeOccasionName(name);

        // Normalize the new name for comparison
        const normalizedNewName = this.normalizeOccasionName(capitalizedNewName);

        // Check if another occasion already has this normalized name
        const nameExists = await this.checkOccasionNameExists(normalizedNewName, occasionId);
        if (nameExists) {
          res.status(409).json({
            success: false,
            message: `Ya existe otra ocasión con el nombre "${capitalizedNewName}". Los nombres deben ser únicos (ignorando acentos y caracteres especiales).`,
            error: 'OCCASION_NAME_EXISTS'
          });
          return;
        }

        updateData.name = capitalizedNewName;

        // Generate new slug from the normalized name
        const newSlug = normalizedNewName.replace(/\s+/g, '-').replace(/-+/g, '-').trim();

        // Check if the new slug is different from current
        if (newSlug !== currentOccasion.slug) {
          // Check if the new slug already exists (excluding current occasion)
          const slugExists = await typeSafeDatabaseService.checkOccasionSlugExists(newSlug, occasionId);

          if (slugExists) {
            // Slug exists, generate unique slug with suffix
            let counter = 1;
            let uniqueSlug = `${newSlug}-${counter}`;
            let conflictExists = true;

            while (conflictExists) {
              conflictExists = await typeSafeDatabaseService.checkOccasionSlugExists(uniqueSlug, occasionId);

              if (!conflictExists) {
                // Found unique slug
                break;
              }

              counter++;
              uniqueSlug = `${newSlug}-${counter}`;
            }

            finalSlug = uniqueSlug;
          } else {
            finalSlug = newSlug;
          }

          updateData.slug = finalSlug;
          slugChanged = true;
        }
      }

      // Handle type change
      // if (type !== undefined) {
      //   updateData.type = type as OccasionType;
      // } // REMOVED: Column 'type' eliminated from occasions table

      // Handle description change
      if (description !== undefined) {
        updateData.description = description ?? null;
      }

      // Update the occasion
      const data = await typeSafeDatabaseService.updateOccasion(occasionId, updateData);

      res.status(200).json({
        success: true,
        data: {
          occasion: data,
          slug_changed: slugChanged
        },
        message: 'Occasion updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update occasion',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * @swagger
   * /api/occasions/{id}:
   *   delete:
   *     summary: Delete an occasion (conditional)
   *     description: |
   *       Deletes an occasion with conditional logic:
   *       - If occasion has references in other tables: performs logical deletion (is_active = false)
   *       - If occasion has no references: performs physical deletion with user confirmation
   *     tags: [Occasions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Occasion ID to delete
   *     responses:
   *       200:
   *         description: Occasion logically deleted (deactivated)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     occasion:
   *                       $ref: '#/components/schemas/Occasion'
   *                     deletion_type:
   *                       type: string
   *                       enum: [logical, physical]
   *                       example: logical
   *                     has_references:
   *                       type: boolean
   *                       example: true
   *                 message:
   *                   type: string
   *                   example: "Occasion deactivated successfully (has product references)"
   *       204:
   *         description: Occasion physically deleted (no content returned)
   *       404:
   *         description: Occasion not found
   *       409:
   *         description: Cannot delete system-required occasion
   *       500:
   *         description: Server error
   */
  public async deleteOccasion(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Invalid occasion ID',
          errors: errors.array()
        });
        return;
      }

      const occasionId = parseInt(req.params.id);

      // Get current occasion data
      const _occasion = await typeSafeDatabaseService.getOccasionById(occasionId);

      if (!_occasion) {
        res.status(404).json({
          success: false,
          message: 'Occasion not found'
        });
        return;
      }

      // Check if occasion has references in product_occasions
      const references = await typeSafeDatabaseService.getProductOccasionReferences(occasionId);
      const hasReferences = references && references.length > 0;

      if (hasReferences) {
        // Logical deletion - just deactivate
        const data = await typeSafeDatabaseService.updateOccasion(occasionId, {
          is_active: false,
          updated_at: new Date().toISOString()
        });

        res.status(200).json({
          success: true,
          data: {
            occasion: data,
            deletion_type: 'logical',
            has_references: true
          },
          message: 'Occasion deactivated successfully (has product references)'
        });
      } else {
        // Physical deletion - no references, safe to delete
        await typeSafeDatabaseService.deleteOccasion(occasionId);

        // Return 204 No Content for successful physical deletion
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete occasion',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Validation middleware
export const occasionsValidators = {
  getOccasions: [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],

  getOccasionById: [
    param('id').isInt({ min: 1 }).withMessage('Occasion ID must be a positive integer')
  ],

  createOccasion: [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('type').optional().isIn(['general', 'birthday', 'anniversary', 'wedding', 'sympathy', 'congratulations']).withMessage('Type must be a valid occasion type'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
  ],

  updateOccasion: [
    param('id').isInt({ min: 1 }).withMessage('Occasion ID must be a positive integer'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('type').optional().isIn(['general', 'birthday', 'anniversary', 'wedding', 'sympathy', 'congratulations']).withMessage('Type must be a valid occasion type'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
  ],

  deleteOccasion: [
    param('id').isInt({ min: 1 }).withMessage('Occasion ID must be a positive integer')
  ]
};