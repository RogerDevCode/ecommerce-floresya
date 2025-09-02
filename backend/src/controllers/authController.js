const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery, useSupabase } = require('../config/database');

// Import Supabase controller if using Supabase
let supabaseAuthController;
if (useSupabase) {
    supabaseAuthController = require('./authControllerSupabase');
}

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

        const existingUser = await executeQuery(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await executeQuery(
            'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, first_name, last_name, phone || null]
        );

        const userId = result.id;
        const token = generateToken(userId, 'customer');

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: userId,
                    email,
                    first_name,
                    last_name,
                    phone,
                    role: 'customer'
                },
                token
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const login = async (req, res) => {
    // Use Supabase controller if available
    if (useSupabase && supabaseAuthController) {
        return supabaseAuthController.login(req, res);
    }

    // Fallback to traditional database
    try {
        const { email, password } = req.body;

        const user = await executeQuery(
            'SELECT id, email, password_hash, first_name, last_name, phone, role, active FROM users WHERE email = ?',
            [email]
        );

        if (user.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const userData = user[0];

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
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await executeQuery(
            'SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: { user: user[0] }
        });

    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, phone } = req.body;

        await executeQuery(
            'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
            [first_name, last_name, phone || null, userId]
        );

        const updatedUser = await executeQuery(
            'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: { user: updatedUser[0] }
        });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};