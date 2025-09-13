import express from 'express';
import { 
    testOccasions, 
    testProducts, 
    testConnection, 
    testHello 
} from '../controllers/testController.js';

const router = express.Router();

// Test routes for debugging and verification
router.get('/connection', testConnection);
router.get('/occasions', testOccasions);
router.get('/products', testProducts);
router.get('/hello', testHello);

// Health check endpoint specifically for test
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Test endpoints are working',
        endpoints: [
            '/api/test/connection - Database connection test',
            '/api/test/occasions - Detailed occasions info',
            '/api/test/products - Detailed products info', 
            '/api/test/filtered-products - Test product filtering',
            '/api/test/health - This endpoint'
        ],
        timestamp: new Date().toISOString()
    });
});

export default router;