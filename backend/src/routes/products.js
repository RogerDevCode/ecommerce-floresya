import express from 'express';
import {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} from '../utils/bked_logger.js';

// ✅ MIGRATED: Using native Supabase controller
import * as productController from '../controllers/productController.js';

const router = express.Router();

logger.info('ROUTES', '✅ Using native Supabase productController with optimized queries');

/**
 * @route GET /api/products
 * @desc Obtiene todos los productos con paginación y estructura correcta para frontend
 * @access Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route GET /api/products/:id
 * @desc Obtiene un producto por ID con estructura correcta para frontend
 * @access Public
 */
router.get('/:id', productController.getProductById);

export default router;
