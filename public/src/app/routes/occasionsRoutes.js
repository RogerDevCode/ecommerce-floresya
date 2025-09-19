import { Router } from 'express';
import { OccasionsController, occasionsValidators } from '../../controllers/OccasionsController.js';
export function createOccasionsRoutes() {
    const router = Router();
    const occasionsController = new OccasionsController();
    router.get('/', occasionsValidators.getOccasions, occasionsController.getOccasions.bind(occasionsController));
    router.get('/:id', occasionsValidators.getOccasionById, occasionsController.getOccasionById.bind(occasionsController));
    router.post('/', occasionsValidators.createOccasion, occasionsController.createOccasion.bind(occasionsController));
    router.put('/:id', occasionsValidators.updateOccasion, occasionsController.updateOccasion.bind(occasionsController));
    router.delete('/:id', occasionsValidators.deleteOccasion, occasionsController.deleteOccasion.bind(occasionsController));
    return router;
}
