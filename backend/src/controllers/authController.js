const {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} = require('../utils/logger.js');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { databaseService } = require('../services/databaseService');
const { errorHandlers } = require('../utils/errorHandler');

const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

const register = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone } = req.body;

        // Check if user exists
        const { data: existingUsers } = await databaseService.query('users', {
            eq: { email }
        });

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const userData = {
            email,
            password_hash: hashedPassword,
            first_name,
            last_name,
            phone: phone || null,
            role: 'customer'
        };

        const result = await databaseService.insert('users', userData);
        const user = result[0];

        const token = generateToken(user.id, 'customer');

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    phone: user.phone,
                    role: user.role
                },
                token
            }
        });

    } catch (error) {
        errorHandlers.handleAuthError(res, error, 'user_registration');
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: users } = await databaseService.query('users', {
            select: 'id, email, password_hash, first_name, last_name, phone, role, active',
            eq: { email }
        });

        if (!users || users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const userData = users[0];

        if (!userData.active) {
            return res.status(401).json({
                success: false,
                message: 'Cuenta desactivada'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, userData.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const token = generateToken(userData.id, userData.role);

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                user: {
                    id: userData.id,
                    email: userData.email,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    phone: userData.phone,
                    role: userData.role
                },
                token
            }
        });

    } catch (error) {
        errorHandlers.handleAuthError(res, error, 'user_login');
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: users } = await databaseService.query('users', {
            select: 'id, email, first_name, last_name, phone, role, created_at',
            eq: { id: userId }
        });

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: { user: users[0] }
        });

    } catch (error) {
        errorHandlers.handleAuthError(res, error, 'get_user_profile');
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, phone } = req.body;

        const updateData = {
            first_name,
            last_name,
            phone: phone || null
        };

        await databaseService.update('users', updateData, { id: userId });

        const { data: users } = await databaseService.query('users', {
            select: 'id, email, first_name, last_name, phone, role',
            eq: { id: userId }
        });

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: { user: users[0] }
        });

    } catch (error) {
        errorHandlers.handleAuthError(res, error, 'update_user_profile');
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};