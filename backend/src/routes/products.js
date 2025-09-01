const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { productValidation } = require('../middleware/validation');
const {
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    getHomepageProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateHomepageSettings
} = require('../controllers/productController');

router.get('/', getAllProducts);

router.get('/featured', getFeaturedProducts);

router.get('/homepage', getHomepageProducts);

router.get('/:id', getProductById);

router.post('/', authenticateToken, requireRole(['admin']), productValidation, createProduct);

router.put('/:id', authenticateToken, requireRole(['admin']), productValidation, updateProduct);

router.delete('/:id', authenticateToken, requireRole(['admin']), deleteProduct);

// Homepage management routes (temporarily without auth for development)
router.put('/:id/homepage', updateHomepageSettings);

module.exports = router;