import express from 'express';
import { 
    getSetting, 
    updateSetting, 
    getHomepageSettings, 
    updateHomepageSettings,
    getExchangeRateBCV 
} from '../controllers/settingsController.js';

const router = express.Router();

// Get exchange rate from BCV
router.get('/exchange_rate_bcv', getExchangeRateBCV);

// Get homepage settings
router.get('/homepage/all', getHomepageSettings);

// Update homepage settings (batch)
router.put('/homepage/all', updateHomepageSettings);

// Get a specific setting
router.get('/:key', getSetting);

// Update a specific setting
router.put('/:key', updateSetting);

export default router;
