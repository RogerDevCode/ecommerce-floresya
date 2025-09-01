const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de acceso requerido' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await executeQuery(
            'SELECT id, email, first_name, last_name, role, active FROM users WHERE id = ? AND active = true',
            [decoded.userId]
        );

        if (user.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no encontrado o inactivo' 
            });
        }

        req.user = user[0];
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Acceso no autorizado' 
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Permisos insuficientes' 
            });
        }

        next();
    };
};

const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await executeQuery(
            'SELECT id, email, first_name, last_name, role, active FROM users WHERE id = ? AND active = true',
            [decoded.userId]
        );

        if (user.length > 0) {
            req.user = user[0];
        } else {
            req.user = null;
        }
        
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    optionalAuth
};