const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');

// Upload single image
router.post('/single', authenticateToken, requireRole(['admin']), (req, res, next) => {
    uploadSingle(req, res, (err) => {
        if (err) {
            return handleUploadError(err, req, res, next);
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ningún archivo.'
            });
        }
        
        const imageUrl = `/images/products/${req.file.filename}`;
        
        res.json({
            success: true,
            message: 'Imagen subida exitosamente.',
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                url: imageUrl,
                size: req.file.size
            }
        });
    });
});

// Upload multiple images
router.post('/multiple', authenticateToken, requireRole(['admin']), (req, res, next) => {
    uploadMultiple(req, res, (err) => {
        if (err) {
            return handleUploadError(err, req, res, next);
        }
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron archivos.'
            });
        }
        
        const uploadedImages = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            url: `/images/products/${file.filename}`,
            size: file.size
        }));
        
        res.json({
            success: true,
            message: `${req.files.length} imagen(es) subida(s) exitosamente.`,
            data: uploadedImages
        });
    });
});

// Delete image
router.delete('/:filename', authenticateToken, requireRole(['admin']), (req, res) => {
    try {
        const { filename } = req.params;
        
        // Validate filename to prevent path traversal
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({
                success: false,
                message: 'Nombre de archivo inválido.'
            });
        }
        
        const filePath = path.join(__dirname, '../../../frontend/images/products', filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado.'
            });
        }
        
        // Delete file
        fs.unlinkSync(filePath);
        
        res.json({
            success: true,
            message: 'Imagen eliminada exitosamente.'
        });
        
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
});

// Get uploaded images list
router.get('/list', authenticateToken, requireRole(['admin']), (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../../../frontend/images/products');
        
        if (!fs.existsSync(uploadsDir)) {
            return res.json({
                success: true,
                data: []
            });
        }
        
        const files = fs.readdirSync(uploadsDir)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
            })
            .map(filename => {
                const filePath = path.join(uploadsDir, filename);
                const stats = fs.statSync(filePath);
                
                return {
                    filename,
                    url: `/images/products/${filename}`,
                    size: stats.size,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => b.modified - a.modified); // Sort by most recent first
        
        res.json({
            success: true,
            data: files
        });
        
    } catch (error) {
        console.error('Error listing images:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
});

module.exports = router;