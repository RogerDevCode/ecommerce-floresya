import express from 'express';
import { authenticateToken } from '../middleware/bked_auth_middleware.js';
import { registerValidation, loginValidation } from '../middleware/validation.js';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerValidation, register);

router.post('/login', loginValidation, login);

router.get('/profile', authenticateToken, getProfile);

router.put('/profile', authenticateToken, updateProfile);

export default router;