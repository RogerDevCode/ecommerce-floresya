import express from 'express';
import * as categoryController from '../controllers/categoryController.js';

const router = express.Router();

// GET all categories
router.get('/', categoryController.getAllCategories);

// GET category by ID
router.get('/:id', categoryController.getCategoryById);

// POST create category (admin only)
router.post('/', categoryController.createCategory);

// PUT update category (admin only)
router.put('/:id', categoryController.updateCategory);

// DELETE category (admin only)
router.delete('/:id', categoryController.deleteCategory);

// GET category stats (admin only)
router.get('/stats/summary', categoryController.getCategoryStats);

export default router;
