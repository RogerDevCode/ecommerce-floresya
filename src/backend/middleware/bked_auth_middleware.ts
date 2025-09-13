import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
// import { supabase, useSupabase } from '../config/database.js';

interface JWTPayload {
    userId: number;
    iat?: number;
    exp?: number;
}

interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    active: boolean;
}

interface AuthenticatedRequest extends Request {
    user?: User | null;
}

type RoleMiddleware = (req: Request, res: Response, next: NextFunction) => void;

const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ 
            success: false, 
            message: 'Token de acceso requerido' 
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
        
        // Temporarily stub user for migration - database access disabled
        req.user = {
            id: decoded.userId,
            email: 'stubbed@example.com',
            first_name: 'Stubbed',
            last_name: 'User',
            role: 'admin',
            active: true
        } as User;
        
        next();
    } catch (error) {
        res.status(403).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
};

const requireRole = (roles: string[]): RoleMiddleware => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ 
                success: false, 
                message: 'Acceso no autorizado' 
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ 
                success: false, 
                message: 'Permisos insuficientes' 
            });
            return;
        }

        next();
    };
};

const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        next();
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
        
        // Temporarily stub user for migration - database access disabled
        req.user = {
            id: decoded.userId,
            email: 'stubbed@example.com',
            first_name: 'Stubbed',
            last_name: 'User',
            role: 'admin',
            active: true
        } as User;
        
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

export {
    authenticateToken,
    requireRole,
    optionalAuth
};

export type {
    AuthenticatedRequest,
    User,
    JWTPayload,
    RoleMiddleware
};