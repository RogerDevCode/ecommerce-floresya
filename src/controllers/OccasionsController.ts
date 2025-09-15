/**
 * 🌸 FloresYa Occasions Controller - API REST Enterprise Edition
 * Manages occasion data for product categorization
 */

import { Request, Response } from 'express';
import { query, param, validationResult } from 'express-validator';
import { supabaseService } from '../config/supabase.js';
import type { ApiResponse, Occasion } from '../config/supabase.js';

export class OccasionsController {
  /**
   * GET /api/occasions
   * Get all active occasions
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
   * GET /api/occasions/:id
   * Get single occasion by ID
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
}

// Validation middleware
export const occasionsValidators = {
  getOccasions: [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],

  getOccasionById: [
    param('id').isInt({ min: 1 }).withMessage('Occasion ID must be a positive integer')
  ]
};