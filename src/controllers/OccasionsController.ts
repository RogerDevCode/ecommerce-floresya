/**
 * 🌸 FloresYa Occasions Controller - API REST Enterprise Edition
 * Manages occasion data for product categorization
 */

import { Request, Response } from 'express';
import { query, param, body, validationResult } from 'express-validator';
import { supabaseService } from '../config/supabase.js';
// Import removed - ApiResponse unused

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
    if (word.length === 0) return word;
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
    try {
      let query = supabaseService
        .from('occasions')
        .select('id, name');

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data: occasions, error } = await query;

      if (error) {
        throw new Error(`Failed to check name uniqueness: ${error.message}`);
      }

      if (!occasions || occasions.length === 0) {
        return false;
      }

      // Check if any existing occasion has the same normalized name
      return occasions.some(occasion => {
        const existingNormalized = this.normalizeOccasionName(occasion.name);
        return existingNormalized === normalizedName;
      });
    } catch (error) {
      console.error('Error checking occasion name uniqueness:', error);
      throw error;
    }
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

      const { data, error } = await supabaseService
        .from('occasions')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch occasions: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: data,
        message: 'Occasions retrieved successfully'
      });
    } catch (error) {
      console.error('OccasionsController.getOccasions error:', error);
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

      const occasionId = parseInt(req.params.id as string);
      const { data, error } = await supabaseService
        .from('occasions')
        .select('*')
        .eq('id', occasionId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          res.status(404).json({
            success: false,
            message: 'Occasion not found'
          });
          return;
        }
        throw new Error(`Failed to fetch occasion: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: { occasion: data },
        message: 'Occasion retrieved successfully'
      });
    } catch (error) {
      console.error('OccasionsController.getOccasionById error:', error);
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
      const { data: maxOrderData, error: maxOrderError } = await supabaseService
        .from('occasions')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      if (maxOrderError) {
        throw new Error(`Failed to get max display order: ${maxOrderError.message}`);
      }

      const nextDisplayOrder = maxOrderData && maxOrderData.length > 0 && maxOrderData[0]
        ? (maxOrderData[0].display_order ?? 0) + 1
        : 1;

      const { data, error } = await supabaseService
        .from('occasions')
        .insert({
          name: capitalizedName, // Use capitalized name for display
          slug,
          description,
          is_active,
          display_order: nextDisplayOrder
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create occasion: ${error.message}`);
      }

      res.status(201).json({
        success: true,
        data: { occasion: data },
        message: 'Occasion created successfully'
      });
    } catch (error) {
      console.error('OccasionsController.createOccasion error:', error);
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

      const occasionId = parseInt(req.params.id as string);
      const { name, description, is_active = true } = req.body as {
        name?: string;
        description?: string;
        is_active?: boolean;
      };

      // Get current occasion data
      const { data: currentOccasion, error: fetchError } = await supabaseService
        .from('occasions')
        .select('*')
        .eq('id', occasionId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          res.status(404).json({
            success: false,
            message: 'Occasion not found'
          });
          return;
        }
        throw new Error(`Failed to fetch occasion: ${fetchError.message}`);
      }

      // Prepare update data
      const updateData: any = {
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
          const { data: existingSlug, error: slugCheckError } = await supabaseService
            .from('occasions')
            .select('id')
            .eq('slug', newSlug)
            .neq('id', occasionId)
            .single();

          if (slugCheckError && slugCheckError.code !== 'PGRST116') {
            throw new Error(`Failed to check slug uniqueness: ${slugCheckError.message}`);
          }

          if (existingSlug) {
            // Slug exists, generate unique slug with suffix
            let counter = 1;
            let uniqueSlug = `${newSlug}-${counter}`;

            while (true) {
              const { data: conflictCheck, error: conflictError } = await supabaseService
                .from('occasions')
                .select('id')
                .eq('slug', uniqueSlug)
                .neq('id', occasionId)
                .single();

              if (conflictError && conflictError.code !== 'PGRST116') {
                throw new Error(`Failed to check slug uniqueness: ${conflictError.message}`);
              }

              if (!conflictCheck) {
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

      // Handle description change
      if (description !== undefined) {
        updateData.description = description || null;
      }

      // Update the occasion
      const { data, error } = await supabaseService
        .from('occasions')
        .update(updateData)
        .eq('id', occasionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update occasion: ${error.message}`);
      }

      res.status(200).json({
        success: true,
        data: {
          occasion: data,
          slug_changed: slugChanged
        },
        message: 'Occasion updated successfully'
      });
    } catch (error) {
      console.error('OccasionsController.updateOccasion error:', error);
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

      const occasionId = parseInt(req.params.id as string);

      // Get current occasion data
      const { data: occasion, error: fetchError } = await supabaseService
        .from('occasions')
        .select('*')
        .eq('id', occasionId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          res.status(404).json({
            success: false,
            message: 'Occasion not found'
          });
          return;
        }
        throw new Error(`Failed to fetch occasion: ${fetchError.message}`);
      }

      // Check if occasion has references in product_occasions
      const { data: references, error: refError } = await supabaseService
        .from('product_occasions')
        .select('id')
        .eq('occasion_id', occasionId)
        .limit(1);

      if (refError) {
        throw new Error(`Failed to check references: ${refError.message}`);
      }

      const hasReferences = references && references.length > 0;

      if (hasReferences) {
        // Logical deletion - just deactivate
        const { data, error } = await supabaseService
          .from('occasions')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', occasionId)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to deactivate occasion: ${error.message}`);
        }

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
        const { error } = await supabaseService
          .from('occasions')
          .delete()
          .eq('id', occasionId);

        if (error) {
          throw new Error(`Failed to delete occasion: ${error.message}`);
        }

        // Return 204 No Content for successful physical deletion
        res.status(204).send();
      }
    } catch (error) {
      console.error('OccasionsController.deleteOccasion error:', error);
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
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
  ],

  updateOccasion: [
    param('id').isInt({ min: 1 }).withMessage('Occasion ID must be a positive integer'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
  ],

  deleteOccasion: [
    param('id').isInt({ min: 1 }).withMessage('Occasion ID must be a positive integer')
  ]
};