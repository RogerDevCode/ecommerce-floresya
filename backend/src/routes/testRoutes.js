const express = require('express');
const router = express.Router();
const { 
    testCategories, 
    testProducts, 
    testConnection, 
    testHello 
} = require('../controllers/testController');

// Test routes for debugging and verification
router.get('/connection', testConnection);
router.get('/categories', testCategories);
router.get('/products', testProducts);
router.get('/hello', testHello);

// Health check endpoint specifically for test
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Test endpoints are working',
        endpoints: [
            '/api/test/connection - Database connection test',
            '/api/test/categories - Detailed categories info',
            '/api/test/products - Detailed products info', 
            '/api/test/filtered-products - Test product filtering',
            '/api/test/health - This endpoint'
        ],
        timestamp: new Date().toISOString()
    });
});

module.exports = router;