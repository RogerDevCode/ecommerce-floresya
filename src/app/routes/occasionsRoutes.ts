/**
 * 🌸 FloresYa Occasions Routes - Express Router Configuration
 * Defines API endpoints for occasion management
 */

import { Router } from 'express';
import { OccasionsController, occasionsValidators } from '../../controllers/OccasionsController.js';

export function createOccasionsRoutes(): Router {
  const router = Router();
  const occasionsController = new OccasionsController();

  // GET /api/occasions - Get all active occasions
  router.get(
    '/',
    occasionsValidators.getOccasions,
    occasionsController.getOccasions.bind(occasionsController)
  );

  // GET /api/occasions/:id - Get single occasion by ID
  router.get(
    '/:id',
    occasionsValidators.getOccasionById,
    occasionsController.getOccasionById.bind(occasionsController)
  );

  return router;
}