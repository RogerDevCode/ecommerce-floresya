import { body, param, query, validationResult } from 'express-validator';
import { supabaseService } from '../config/supabase.js';
import { userService } from '../services/UserService.js';
export class UserController {
    async getAllUsers(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
                return;
            }
            const query = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                search: req.query.search,
                role: req.query.role,
                is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
                email_verified: req.query.email_verified ? req.query.email_verified === 'true' : undefined,
                sort_by: req.query.sort_by || 'created_at',
                sort_direction: req.query.sort_direction || 'desc'
            };
            const result = await userService.getAllUsers(query);
            if (!result.success) {
                res.status(500).json(result);
                return;
            }
            res.status(200).json(result);
        }
        catch (error) {
            console.error('UserController.getAllUsers error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'INTERNAL_ERROR'
            });
        }
    }
    async getUserById(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
                return;
            }
            const id = parseInt(req.params.id || '0');
            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid user ID',
                    error: 'INVALID_ID'
                });
                return;
            }
            const result = await userService.getUserById(id);
            if (!result.success) {
                const statusCode = result.error === 'USER_NOT_FOUND' ? 404 : 500;
                res.status(statusCode).json(result);
                return;
            }
            res.status(200).json(result);
        }
        catch (error) {
            console.error('UserController.getUserById error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'INTERNAL_ERROR'
            });
        }
    }
    async createUser(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
                return;
            }
            const userData = req.body;
            const result = await userService.createUser(userData);
            if (!result.success) {
                let statusCode = 500;
                if (result.error === 'EMAIL_EXISTS')
                    statusCode = 409;
                if (result.error === 'VALIDATION_ERROR')
                    statusCode = 400;
                res.status(statusCode).json(result);
                return;
            }
            res.status(201).json(result);
        }
        catch (error) {
            console.error('UserController.createUser error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'INTERNAL_ERROR'
            });
        }
    }
    async updateUser(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
                return;
            }
            const id = parseInt(req.params.id ?? '0');
            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid user ID',
                    error: 'INVALID_ID'
                });
                return;
            }
            const userData = { ...req.body, id };
            const result = await userService.updateUser(id, userData);
            if (!result.success) {
                let statusCode = 500;
                if (result.error === 'USER_NOT_FOUND')
                    statusCode = 404;
                if (result.error === 'EMAIL_EXISTS')
                    statusCode = 409;
                if (result.error === 'VALIDATION_ERROR')
                    statusCode = 400;
                res.status(statusCode).json(result);
                return;
            }
            res.status(200).json(result);
        }
        catch (error) {
            console.error('UserController.updateUser error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'INTERNAL_ERROR'
            });
        }
    }
    async toggleUserActive(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
                return;
            }
            const id = parseInt(req.params.id ?? '0');
            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid user ID',
                    error: 'INVALID_ID'
                });
                return;
            }
            const result = await userService.toggleUserActive(id);
            if (!result.success) {
                const statusCode = result.error === 'USER_NOT_FOUND' ? 404 : 500;
                res.status(statusCode).json(result);
                return;
            }
            res.status(200).json(result);
        }
        catch (error) {
            console.error('UserController.toggleUserActive error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'INTERNAL_ERROR'
            });
        }
    }
    async deleteUser(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
                return;
            }
            const id = parseInt(req.params.id ?? '0');
            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid user ID',
                    error: 'INVALID_ID'
                });
                return;
            }
            const userData = await userService.getUserById(id);
            if (!userData.success) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                    error: 'USER_NOT_FOUND'
                });
                return;
            }
            const hasReferences = await this.checkUserReferences(id);
            if (hasReferences) {
                const updateResult = await userService.updateUser(id, { id, is_active: false });
                if (!updateResult.success) {
                    res.status(500).json({
                        success: false,
                        message: 'Failed to deactivate user',
                        error: 'UPDATE_ERROR'
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    data: {
                        user: updateResult.data,
                        deletion_type: 'logical',
                        has_references: true
                    },
                    message: 'User deactivated successfully (has orders or payments)'
                });
            }
            else {
                const result = await userService.deleteUser(id);
                if (!result.success) {
                    let statusCode = 500;
                    if (result.error === 'USER_NOT_FOUND')
                        statusCode = 404;
                    res.status(statusCode).json(result);
                    return;
                }
                res.status(204).send();
            }
        }
        catch (error) {
            console.error('UserController.deleteUser error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'INTERNAL_ERROR'
            });
        }
    }
    async checkUserReferences(userId) {
        try {
            const { data: orders, error: ordersError } = await supabaseService
                .from('orders')
                .select('id')
                .eq('user_id', userId)
                .limit(1);
            if (ordersError) {
                console.warn('Error checking user orders:', ordersError.message);
            }
            else if (orders && orders.length > 0) {
                return true;
            }
            const { data: payments, error: paymentsError } = await supabaseService
                .from('payments')
                .select('id')
                .eq('user_id', userId)
                .limit(1);
            if (paymentsError) {
                console.warn('Error checking user payments:', paymentsError.message);
            }
            else if (payments && payments.length > 0) {
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error checking user references:', error);
            throw error;
        }
    }
}
export const userValidators = {
    getAllUsers: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('search')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Search term too long'),
        query('role')
            .optional()
            .isIn(['user', 'admin', 'support'])
            .withMessage('Invalid role'),
        query('is_active')
            .optional()
            .isBoolean()
            .withMessage('is_active must be boolean'),
        query('email_verified')
            .optional()
            .isBoolean()
            .withMessage('email_verified must be boolean'),
        query('sort_by')
            .optional()
            .isIn(['email', 'full_name', 'role', 'created_at', 'updated_at'])
            .withMessage('Invalid sort field'),
        query('sort_direction')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Invalid sort direction')
    ],
    getUserById: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('User ID must be a positive integer')
    ],
    createUser: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        body('full_name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters'),
        body('phone')
            .optional()
            .matches(/^\+?\d{10,15}$/)
            .withMessage('Phone must be 10-15 digits with optional + prefix'),
        body('role')
            .isIn(['user', 'admin', 'support'])
            .withMessage('Role must be user, admin, or support'),
        body('is_active')
            .optional()
            .isBoolean()
            .withMessage('is_active must be boolean'),
        body('email_verified')
            .optional()
            .isBoolean()
            .withMessage('email_verified must be boolean')
    ],
    updateUser: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('User ID must be a positive integer'),
        body('email')
            .optional()
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .optional()
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        body('full_name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters'),
        body('phone')
            .optional()
            .matches(/^\+?\d{10,15}$/)
            .withMessage('Phone must be 10-15 digits with optional + prefix'),
        body('role')
            .optional()
            .isIn(['user', 'admin', 'support'])
            .withMessage('Role must be user, admin, or support'),
        body('is_active')
            .optional()
            .isBoolean()
            .withMessage('is_active must be boolean'),
        body('email_verified')
            .optional()
            .isBoolean()
            .withMessage('email_verified must be boolean')
    ],
    toggleUserActive: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('User ID must be a positive integer')
    ],
    deleteUser: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('User ID must be a positive integer')
    ]
};
export const userController = new UserController();
