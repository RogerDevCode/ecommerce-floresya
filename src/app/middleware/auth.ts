/**
 * 🌸 FloresYa Authentication Middleware - Enterprise TypeScript Edition
 * JWT and admin role verification for secure API access
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseService } from '../../config/supabase.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to authenticate requests using JWT token
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No valid authorization token provided',
        error: 'MISSING_TOKEN'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: 'JWT_SECRET_MISSING'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;

    // Verify user exists and is active
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

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();

  } catch (error) {
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

/**
 * Middleware to ensure user has admin role
 */
export async function authenticateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // First authenticate the user
    await authenticate(req, res, () => {
      // Check if authentication was successful
      if (!req.user) {
        return; // Response already sent by authenticate middleware
      }

      // Check for admin role
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

  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication system error',
      error: 'AUTH_SYSTEM_ERROR'
    });
  }
}

/**
 * Middleware to ensure user has support or admin role
 */
export async function authenticateSupport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // First authenticate the user
    await authenticate(req, res, () => {
      // Check if authentication was successful
      if (!req.user) {
        return; // Response already sent by authenticate middleware
      }

      // Check for support or admin role
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

  } catch (error) {
    console.error('Support authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication system error',
      error: 'AUTH_SYSTEM_ERROR'
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export async function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // Token provided, try to authenticate
    await authenticate(req, res, next);

  } catch (error) {
    // If optional auth fails, continue without authentication
    console.warn('Optional authentication failed:', error);
    next();
  }
}

// Export type for TypeScript
export type { AuthenticatedRequest };