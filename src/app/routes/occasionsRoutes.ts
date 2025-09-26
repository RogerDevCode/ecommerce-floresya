/**
 * 🌸 FloresYa Occasions Routes - Express Router Configuration
 * Defines API endpoints for occasion management
 */

import { Router } from 'express';

import { OccasionsController } from '../../controllers/OccasionsController.js';

export function createOccasionsRoutes(): Router {
  const router = Router();
  const occasionsController = new OccasionsController();

  // GET /api/occasions - Get all active occasions
  router.get(
    '/',
    occasionsController.getOccasions.bind(occasionsController)
  );

  // GET /api/occasions/:id - Get single occasion by ID
  router.get(
    '/:id',
    occasionsController.getOccasionById.bind(occasionsController)
  );

  // POST /api/occasions - Create new occasion
  router.post(
    '/',
    occasionsController.createOccasion.bind(occasionsController)
  );

  // PUT /api/occasions/:id - Update existing occasion
  router.put(
    '/:id',
    occasionsController.updateOccasion.bind(occasionsController)
  );

  // DELETE /api/occasions/:id - Delete occasion (conditional)
  router.delete(
    '/:id',
    occasionsController.deleteOccasion.bind(occasionsController)
  );

  return router;
}