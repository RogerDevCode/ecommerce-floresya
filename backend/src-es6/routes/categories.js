/**
 * Categories Routes - ES6+ Version
 * Enhanced with modern JavaScript patterns and improved error handling
 */

import express from 'express';
import { getAllCategories } from '../controllers/categoryController.js';
import { logger } from '../utils/logger.js';
import { asyncErrorHandler } from '../utils/errorHandler.js';

const router = express.Router();

/**
 * @route GET /api/categories
 * @desc Get all categories with enhanced error handling
 * @access Public
 */
router.get('/', asyncErrorHandler(async (req, res, next) => {
    logger.info('CATEGORIES_API', 'Categories endpoint accessed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Delegate to controller with proper context
    await getAllCategories(req, res, next);
}));

export default router;