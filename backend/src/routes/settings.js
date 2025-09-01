const express = require('express');
const router = express.Router();
const { getSetting, updateSetting, getHomepageSettings, updateHomepageSettings } = require('../controllers/settingsController');

// Middleware for admin authentication would go here
// const { isAdmin } = require('../middleware/auth');

// Get homepage settings
router.get('/homepage/all', getHomepageSettings);

// Update homepage settings (batch) - temporarily without auth for development
router.put('/homepage/all', updateHomepageSettings);

// Get a specific setting
router.get('/:key', getSetting);

// Update a specific setting (protected)
// For now, it's open, but we'll add auth later
router.put('/:key', updateSetting);

module.exports = router;