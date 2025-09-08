const jwt = require('jsonwebtoken');
const { supabase, useSupabase } = require('../config/database');

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
        
        if (useSupabase) {
            const { data: users, error } = await supabase
                .from('users')
                .select('id, email, first_name, last_name, role, active')
                .eq('id', decoded.userId)
                .eq('active', true)
                .single();
            
            if (error || !users) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Usuario no encontrado o inactivo' 
                });
            }

            req.user = users;
        } else {
            throw new Error('Only Supabase is supported in this application');
        }
        
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
        
        if (useSupabase) {
            const { data: users, error } = await supabase
                .from('users')
                .select('id, email, first_name, last_name, role, active')
                .eq('id', decoded.userId)
                .eq('active', true)
                .single();
            
            if (error || !users) {
                req.user = null;
            } else {
                req.user = users;
            }
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