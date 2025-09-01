const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');

router.post('/register', registerValidation, register);

router.post('/login', loginValidation, login);

router.get('/profile', authenticateToken, getProfile);

router.put('/profile', authenticateToken, updateProfile);

module.exports = router;