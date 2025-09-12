import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../frontend/images/products');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage - use memory storage for image processing
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, WebP, GIF)'), false);
    }
};

// Configure multer
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 10 // Maximum 10 files per upload
    },
    fileFilter
});

// Middleware for single file upload
const uploadSingle = upload.single('image');

// Middleware for multiple files upload
const uploadMultiple = upload.array('images', 10);

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'El archivo es demasiado grande. Máximo 5MB por archivo.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Demasiados archivos. Máximo 10 archivos por vez.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Campo de archivo inesperado.'
            });
        }
    }
    
    if (error.message) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next(error);
};

export {
    uploadSingle,
    uploadMultiple,
    handleUploadError
};