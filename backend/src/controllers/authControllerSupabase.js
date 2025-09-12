import {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} from '../utils/bked_logger.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../services/supabaseClient.js';

const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user from Supabase
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, password_hash, first_name, last_name, phone, role, active')
            .eq('email', email)
            .limit(1);

        if (error) {
            console.error('Supabase query error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }

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
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const register = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone } = req.body;

        // Check if user exists
        const { data: existingUsers, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .limit(1);

        if (checkError) {
            console.error('Supabase check error:', checkError);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }

        if (existingUsers && existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert new user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash: hashedPassword,
                first_name,
                last_name,
                phone: phone || null,
                role: 'customer',
                active: true
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }

        const token = generateToken(newUser.id, 'customer');

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                    phone: newUser.phone,
                    role: newUser.role
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

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, phone, role, created_at')
            .eq('id', userId)
            .limit(1);

        if (error) {
            console.error('Supabase query error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }

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

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({
                first_name,
                last_name,
                phone: phone || null
            })
            .eq('id', userId)
            .select('id, email, first_name, last_name, phone, role')
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export {
    register,
    login,
    getProfile,
    updateProfile
};