/**
 * Settings Routes - ES6+ Version
 * Enhanced with modern JavaScript patterns and improved error handling
 */

import express from 'express';
import { logger, trackPerformance } from '../utils/logger.js';
import { asyncErrorHandler } from '../utils/errorHandler.js';
import { 
    getSetting, 
    updateSetting, 
    getHomepageSettings, 
    updateHomepageSettings 
} from '../controllers/settingsController.js';

const router = express.Router();

// TODO: Implement admin authentication middleware
// import { authenticateToken, requireRole } from '../middleware/auth.js';

// Enhanced parameter validation helper
const validateSettingKey = (key) => {
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
        throw new Error(`Invalid setting key: expected non-empty string, received '${key}'`);
    }
    
    // Validate key format (alphanumeric, underscores, hyphens only)
    const validKeyPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validKeyPattern.test(key)) {
        throw new Error(`Invalid setting key format: '${key}' contains invalid characters`);
    }
    
    return key.trim();
};

/**
 * @route GET /api/settings/homepage/all
 * @desc Get all homepage settings with enhanced caching
 * @access Public (TODO: Add admin auth)
 */
router.get('/homepage/all', asyncErrorHandler(async (req, res, next) => {
    const performanceTracker = trackPerformance('get-homepage-settings');
    
    logger.info('SETTINGS_API', 'Homepage settings requested', {
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    try {
        await getHomepageSettings(req, res, next);
        performanceTracker.end();
        
        logger.success('SETTINGS_API', 'Homepage settings retrieved', {
            performance: performanceTracker.getDuration()
        });
    } catch (error) {
        performanceTracker.end();
        logger.error('SETTINGS_API', 'Failed to retrieve homepage settings', {
            error: error.message,
            performance: performanceTracker.getDuration()
        });
        throw error;
    }
}));

/**
 * @route PUT /api/settings/homepage/all
 * @desc Update homepage settings in batch with enhanced validation
 * @access Public (TODO: Add admin auth)
 */
router.put('/homepage/all', asyncErrorHandler(async (req, res, next) => {
    const performanceTracker = trackPerformance('update-homepage-settings');
    const updatedFields = Object.keys(req.body || {});
    
    logger.info('SETTINGS_API', 'Homepage settings update initiated', {
        updatedFields,
        timestamp: new Date().toISOString(),
        // TODO: Add adminId when auth is implemented
        securityNote: 'TEMPORARY: Auth disabled for development'
    });

    try {
        // Enhanced validation for homepage settings
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No settings provided for update',
                details: {
                    expected: 'object with setting key-value pairs',
                    received: 'empty or undefined body'
                }
            });
        }

        await updateHomepageSettings(req, res, next);
        performanceTracker.end();
        
        logger.success('SETTINGS_API', 'Homepage settings updated', {
            updatedFields,
            performance: performanceTracker.getDuration()
        });
    } catch (error) {
        performanceTracker.end();
        logger.error('SETTINGS_API', 'Homepage settings update failed', {
            updatedFields,
            error: error.message,
            performance: performanceTracker.getDuration()
        });
        throw error;
    }
}));

/**
 * @route GET /api/settings/:key
 * @desc Get specific setting by key with enhanced validation
 * @access Public (TODO: Add admin auth for sensitive settings)
 */
router.get('/:key', asyncErrorHandler(async (req, res, next) => {
    const performanceTracker = trackPerformance('get-setting');
    
    try {
        const settingKey = validateSettingKey(req.params.key);
        
        logger.info('SETTINGS_API', 'Setting requested', {
            key: settingKey,
            timestamp: new Date().toISOString()
        });

        // Add validated key to params for controller
        req.params.validatedKey = settingKey;
        
        await getSetting(req, res, next);
        performanceTracker.end();
        
        logger.success('SETTINGS_API', 'Setting retrieved', {
            key: settingKey,
            performance: performanceTracker.getDuration()
        });
    } catch (error) {
        performanceTracker.end();
        
        if (error.message.includes('Invalid setting key')) {
            logger.warn('SETTINGS_API', 'Invalid setting key provided', {
                providedKey: req.params.key,
                performance: performanceTracker.getDuration()
            });
            
            return res.status(400).json({
                success: false,
                message: error.message,
                details: {
                    field: 'key',
                    received: req.params.key,
                    expected: 'alphanumeric string with underscores/hyphens only'
                }
            });
        }
        
        logger.error('SETTINGS_API', 'Failed to retrieve setting', {
            key: req.params.key,
            error: error.message,
            performance: performanceTracker.getDuration()
        });
        throw error;
    }
}));

/**
 * @route PUT /api/settings/:key
 * @desc Update specific setting with enhanced audit logging
 * @access Public (TODO: Add admin auth)
 */
router.put('/:key', asyncErrorHandler(async (req, res, next) => {
    const performanceTracker = trackPerformance('update-setting');
    
    try {
        const settingKey = validateSettingKey(req.params.key);
        const { value, description } = req.body;
        
        // Enhanced validation for setting value
        if (value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Setting value is required',
                details: {
                    field: 'value',
                    received: 'undefined',
                    expected: 'any valid JSON value'
                }
            });
        }

        logger.info('SETTINGS_API', 'Setting update initiated', {
            key: settingKey,
            hasDescription: !!description,
            valueType: typeof value,
            timestamp: new Date().toISOString(),
            // TODO: Add adminId when auth is implemented
            securityNote: 'TEMPORARY: Auth disabled for development'
        });

        // Add validated data to request for controller
        req.params.validatedKey = settingKey;
        
        await updateSetting(req, res, next);
        performanceTracker.end();
        
        logger.success('SETTINGS_API', 'Setting updated successfully', {
            key: settingKey,
            performance: performanceTracker.getDuration()
        });
    } catch (error) {
        performanceTracker.end();
        
        if (error.message.includes('Invalid setting key')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                details: {
                    field: 'key',
                    received: req.params.key,
                    expected: 'alphanumeric string with underscores/hyphens only'
                }
            });
        }
        
        logger.error('SETTINGS_API', 'Setting update failed', {
            key: req.params.key,
            error: error.message,
            performance: performanceTracker.getDuration()
        });
        throw error;
    }
}));

export default router;