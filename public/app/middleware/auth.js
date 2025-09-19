import jwt from 'jsonwebtoken';
import { supabaseService } from '../../config/supabase.js';
export async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'No valid authorization token provided',
                error: 'MISSING_TOKEN'
            });
            return;
        }
        const token = authHeader.substring(7);
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET not configured');
            res.status(500).json({
                success: false,
                message: 'Server configuration error',
                error: 'JWT_SECRET_MISSING'
            });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { data: user, error } = await supabaseService
            .from('users')
            .select('id, email, role, is_active')
            .eq('id', parseInt(decoded.sub))
            .eq('is_active', true)
            .single();
        if (error || !user) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
                error: 'INVALID_TOKEN'
            });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token format',
                error: 'INVALID_TOKEN_FORMAT'
            });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token has expired',
                error: 'TOKEN_EXPIRED'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Authentication system error',
            error: 'AUTH_SYSTEM_ERROR'
        });
    }
}
export async function authenticateAdmin(req, res, next) {
    try {
        await authenticate(req, res, () => {
            if (!req.user) {
                return;
            }
            if (req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Admin access required',
                    error: 'INSUFFICIENT_PERMISSIONS'
                });
                return;
            }
            next();
        });
    }
    catch (error) {
        console.error('Admin authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication system error',
            error: 'AUTH_SYSTEM_ERROR'
        });
    }
}
export async function authenticateSupport(req, res, next) {
    try {
        await authenticate(req, res, () => {
            if (!req.user) {
                return;
            }
            if (!['admin', 'support'].includes(req.user.role)) {
                res.status(403).json({
                    success: false,
                    message: 'Support or admin access required',
                    error: 'INSUFFICIENT_PERMISSIONS'
                });
                return;
            }
            next();
        });
    }
    catch (error) {
        console.error('Support authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication system error',
            error: 'AUTH_SYSTEM_ERROR'
        });
    }
}
export async function optionalAuthenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        await authenticate(req, res, next);
    }
    catch (error) {
        console.warn('Optional authentication failed:', error);
        next();
    }
}
