import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import winston from 'winston';
import type { Database } from '../types/supabase';

// Configuración de Supabase (singleton global)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Usar service_role para admin
);

// Configuración de logging
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.File({ filename: 'error.log' })],
});

// Schemas de validación con Zod
const userCreateSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(2, 'Nombre completo requiere al menos 2 caracteres'),
  phone: z.string().regex(/^\+?\d{10,15}$/, 'Teléfono inválido (10-15 dígitos)').optional(),
  role: z.enum(['user', 'admin', 'support'], { message: 'Rol inválido' }),
  is_active: z.boolean().default(true),
  email_verified: z.boolean().default(false),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .refine(s => /[A-Z]/.test(s), 'Debe contener al menos una mayúscula')
    .refine(s => /[a-z]/.test(s), 'Debe contener al menos una minúscula')
    .refine(s => /[0-9]/.test(s), 'Debe contener al menos un número'),
});

const userUpdateSchema = userCreateSchema.partial().extend({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .refine(s => /[A-Z]/.test(s), 'Debe contener al menos una mayúscula')
    .refine(s => /[a-z]/.test(s), 'Debe contener al menos una minúscula')
    .refine(s => /[0-9]/.test(s), 'Debe contener al menos un número')
    .optional(),
});

// Middleware para verificar rol admin
async function checkAdmin(req: Request, res: Response, next: () => void): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(req.headers.authorization?.split('Bearer ')[1]);
    if (authError || !user) {
      res.status(401).json({ success: false, message: 'No autorizado' });
      return;
    }
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', Number(user.id))
      .single();
    if (error || data?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Solo admins pueden acceder' });
      return;
    }
    next();
  } catch (err) {
    logger.error('Error verificando admin:', { error: err });
    res.status(500).json({ success: false, message: 'Error verificando autorización' });
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         email: { type: string }
 *         full_name: { type: string }
 *         phone: { type: string, nullable: true }
 *         role: { type: string, enum: ['user', 'admin', 'support'] }
 *         is_active: { type: boolean }
 *         email_verified: { type: boolean }
 */
export class UsersController {
  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Obtener todos los usuarios
   *     tags: [Users]
   *     parameters:
   *       - in: query
   *         name: filter
   *         schema: { type: string, enum: ['all', 'active', 'inactive'] }
   *         description: Filtrar por estado
   *     responses:
   *       200:
   *         description: Lista de usuarios
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean }
   *                 data: { type: array, items: { $ref: '#/components/schemas/User' } }
   *                 count: { type: integer }
   */
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const filter = req.query.filter as 'all' | 'active' | 'inactive';
      let query = supabase
        .from('users')
        .select('id, email, full_name, phone, role, is_active, email_verified')
        .order('full_name', { ascending: true });

      if (filter === 'active') query = query.eq('is_active', true);
      else if (filter === 'inactive') query = query.eq('is_active', false);

      const { data, error } = await query;
      if (error) throw error;

      res.status(200).json({
        success: true,
        data: data || [],
        count: data?.length || 0,
      });
    } catch (err) {
      logger.error('Error fetching users:', { error: err });
      res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Obtener usuario por ID
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Detalles del usuario
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean }
   *                 data: { $ref: '#/components/schemas/User' }
   */
  public async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID inválido' });
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, phone, role, is_active, email_verified')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          res.status(404).json({ success: false, message: 'Usuario no encontrado' });
          return;
        }
        throw error;
      }

      res.status(200).json({ success: true, data });
    } catch (err) {
      logger.error('Error fetching user by id:', { error: err });
      res.status(500).json({ success: false, message: 'Error al obtener usuario' });
    }
  }

  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Crear un nuevo usuario
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, full_name, password, role]
   *             properties:
   *               email: { type: string }
   *               full_name: { type: string }
   *               phone: { type: string, nullable: true }
   *               role: { type: string, enum: ['user', 'admin', 'support'] }
   *               is_active: { type: boolean }
   *               email_verified: { type: boolean }
   *               password: { type: string }
   *     responses:
   *       201:
   *         description: Usuario creado
   */
  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = userCreateSchema.parse(req.body);

      // Crear usuario en auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: validatedData.email_verified,
      });
      if (authError) {
        if (authError.message.includes('already registered')) {
          res.status(409).json({ success: false, message: 'El email ya está registrado' });
          return;
        }
        throw authError;
      }

      // Hashear contraseña para users
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(validatedData.password, saltRounds);

      const insertData: Database['public']['Tables']['users']['Insert'] = {
        id: Number(authData.user?.id),
        email: validatedData.email,
        password_hash,
        full_name: validatedData.full_name,
        phone: validatedData.phone,
        role: validatedData.role,
        is_active: validatedData.is_active,
        email_verified: validatedData.email_verified,
      };

      const { data, error } = await supabase.from('users').insert(insertData).select().single();
      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        data: {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          is_active: data.is_active,
          email_verified: data.email_verified,
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Datos inválidos', errors: err.errors });
        return;
      }
      logger.error('Error creating user:', { error: err });
      res.status(500).json({ success: false, message: 'Error al crear usuario' });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   patch:
   *     summary: Actualizar usuario
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email: { type: string }
   *               full_name: { type: string }
   *               phone: { type: string, nullable: true }
   *               role: { type: string, enum: ['user', 'admin', 'support'] }
   *               is_active: { type: boolean }
   *               email_verified: { type: boolean }
   *               password: { type: string }
   *     responses:
   *       200:
   *         description: Usuario actualizado
   */
  public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID inválido' });
        return;
      }

      const validatedData = userUpdateSchema.parse(req.body);

      const updateData: Database['public']['Tables']['users']['Update'] = {
        email: validatedData.email,
        full_name: validatedData.full_name,
        phone: validatedData.phone,
        role: validatedData.role,
        is_active: validatedData.is_active,
        email_verified: validatedData.email_verified,
      };

      if (validatedData.password) {
        const saltRounds = 12;
        updateData.password_hash = await bcrypt.hash(validatedData.password, saltRounds);
        await supabase.auth.admin.updateUserById(id.toString(), { password: validatedData.password });
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          res.status(404).json({ success: false, message: 'Usuario no encontrado' });
          return;
        }
        throw error;
      }

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado correctamente',
        data: {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          is_active: data.is_active,
          email_verified: data.email_verified,
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, message: 'Datos inválidos', errors: err.errors });
        return;
      }
      logger.error('Error updating user:', { error: err });
      res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
  }

  /**
   * @swagger
   * /users/{id}/toggle-active:
   *   patch:
   *     summary: Alternar estado activo/inactivo
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Estado cambiado
   */
  public async toggleUserActive(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID inválido' });
        return;
      }

      const { data: current, error: fetchError } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          res.status(404).json({ success: false, message: 'Usuario no encontrado' });
          return;
        }
        throw fetchError;
      }

      const updateData: Database['public']['Tables']['users']['Update'] = {
        is_active: !current.is_active,
      };

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: `Usuario ${current.is_active ? 'desactivado' : 'reactivado'} correctamente`,
        data: {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          is_active: data.is_active,
          email_verified: data.email_verified,
        },
      });
    } catch (err) {
      logger.error('Error toggling user active:', { error: err });
      res.status(500).json({ success: false, message: 'Error al cambiar estado del usuario' });
    }
  }
}

// Exportar instancia con middleware
export const usersController = new UsersController();
export const usersRouter = (router: import('express').Router) => {
  router.use(checkAdmin);
  router.get('/users', usersController.getAllUsers.bind(usersController));
  router.get('/users/:id', usersController.getUserById.bind(usersController));
  router.post('/users', usersController.createUser.bind(usersController));
  router.patch('/users/:id', usersController.updateUser.bind(usersController));
  router.patch('/users/:id/toggle-active', usersController.toggleUserActive.bind(usersController));
};
