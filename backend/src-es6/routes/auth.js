/**
 * Authentication Routes - ES6+ Version
 * Enhanced with modern JavaScript patterns and improved error handling
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { registerValidation, loginValidation } from '../middleware/validation.js';
import { logger, trackPerformance } from '../utils/logger.js';
import { asyncErrorHandler } from '../utils/errorHandler.js';
import { 
    register, 
    login, 
    getProfile, 
    updateProfile 
} from '../controllers/authController.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register new user account with enhanced security tracking
 * @access Public
 */
router.post('/register', 
    registerValidation, 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('user-registration');
        
        // Sanitized logging (exclude sensitive data)
        logger.info('AUTH_API', 'User registration initiated', {
            email: req.body.email,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });

        try {
            await register(req, res, next);
            performanceTracker.end();
            
            logger.success('AUTH_API', 'User registration completed', {
                email: req.body.email,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            logger.error('AUTH_API', 'User registration failed', {
                email: req.body.email,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user login with enhanced security monitoring
 * @access Public
 */
router.post('/login', 
    loginValidation, 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('user-login');
        
        // Enhanced security logging
        logger.info('AUTH_API', 'Login attempt initiated', {
            email: req.body.email,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });

        try {
            await login(req, res, next);
            performanceTracker.end();
            
            logger.success('AUTH_API', 'Login successful', {
                email: req.body.email,
                ip: req.ip,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            
            // Enhanced security logging for failed attempts
            logger.warn('AUTH_API', 'Login attempt failed', {
                email: req.body.email,
                ip: req.ip,
                error: error.message,
                performance: performanceTracker.getDuration(),
                securityAlert: true
            });
            throw error;
        }
    })
);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile with enhanced data processing
 * @access Private
 */
router.get('/profile', 
    authenticateToken, 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('get-user-profile');
        
        logger.info('AUTH_API', 'Profile data requested', {
            userId: req.user?.id,
            timestamp: new Date().toISOString()
        });

        try {
            await getProfile(req, res, next);
            performanceTracker.end();
            
            logger.success('AUTH_API', 'Profile data retrieved', {
                userId: req.user?.id,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            logger.error('AUTH_API', 'Profile retrieval failed', {
                userId: req.user?.id,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile with enhanced validation and auditing
 * @access Private
 */
router.put('/profile', 
    authenticateToken, 
    asyncErrorHandler(async (req, res, next) => {
        const performanceTracker = trackPerformance('update-user-profile');
        
        // Enhanced audit logging for profile changes
        const updatedFields = Object.keys(req.body).filter(key => 
            !['password', 'token', 'currentPassword', 'newPassword'].includes(key)
        );

        logger.info('AUTH_API', 'Profile update initiated', {
            userId: req.user?.id,
            updatedFields,
            timestamp: new Date().toISOString()
        });

        try {
            await updateProfile(req, res, next);
            performanceTracker.end();
            
            logger.success('AUTH_API', 'Profile updated successfully', {
                userId: req.user?.id,
                updatedFields,
                performance: performanceTracker.getDuration()
            });
        } catch (error) {
            performanceTracker.end();
            logger.error('AUTH_API', 'Profile update failed', {
                userId: req.user?.id,
                updatedFields,
                error: error.message,
                performance: performanceTracker.getDuration()
            });
            throw error;
        }
    })
);

export default router;