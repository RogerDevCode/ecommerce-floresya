import { body, param, query, validationResult } from 'express-validator';
import { ImageService } from '../services/ImageService.js';
import multer from 'multer';
const imageService = new ImageService();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
        }
    }
});
export class ImageController {
    async uploadProductImage(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'No image file provided'
                });
                return;
            }
            const productId = parseInt(req.params.productId);
            const imageIndex = parseInt(req.body.imageIndex ?? '0');
            const isPrimary = req.body.isPrimary === 'true';
            const validation = imageService.validateImageFile(req.file);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    message: validation.error ?? 'Invalid image file'
                });
                return;
            }
            const result = await imageService.uploadProductImage({
                productId,
                imageIndex,
                file: req.file,
                isPrimary
            });
            if (result.success) {
                res.status(201).json({
                    success: true,
                    data: {
                        images: result.images,
                        primaryImage: result.primaryImage
                    },
                    message: result.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        }
        catch (error) {
            console.error('ImageController.uploadProductImage error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload image',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async deleteProductImages(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const productId = parseInt(req.params.productId);
            const success = await imageService.deleteProductImages(productId);
            if (success) {
                res.status(200).json({
                    success: true,
                    message: `Successfully deleted all images for product ${productId}`
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete product images'
                });
            }
        }
        catch (error) {
            console.error('ImageController.deleteProductImages error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete images',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getImagesGallery(req, res) {
        try {
            const filter = req.query.filter ?? 'all';
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 20, 100);
            const result = await imageService.getImagesGallery(filter, page, limit);
            res.status(200).json({
                success: true,
                data: result,
                message: 'Images gallery retrieved successfully'
            });
        }
        catch (error) {
            console.error('ImageController.getImagesGallery error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve images gallery',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async uploadSiteImage(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'No image file provided'
                });
                return;
            }
            const type = req.body.type;
            if (!['hero', 'logo'].includes(type)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid image type. Must be "hero" or "logo"'
                });
                return;
            }
            const validation = imageService.validateImageFile(req.file);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    message: validation.error ?? 'Invalid image file'
                });
                return;
            }
            const result = await imageService.uploadSiteImage(req.file, type);
            if (result.success) {
                res.status(201).json({
                    success: true,
                    data: {
                        url: result.url,
                        type: result.type
                    },
                    message: `Successfully uploaded ${type} image`
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        }
        catch (error) {
            console.error('ImageController.uploadSiteImage error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload site image',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getCurrentSiteImages(req, res) {
        try {
            const result = await imageService.getCurrentSiteImages();
            res.status(200).json({
                success: true,
                data: result,
                message: 'Current site images retrieved successfully'
            });
        }
        catch (error) {
            console.error('ImageController.getCurrentSiteImages error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve current site images',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getProductsWithImageCounts(req, res) {
        try {
            const sortBy = req.query.sort_by ?? 'image_count';
            const sortDirection = req.query.sort_direction ?? 'asc';
            const result = await imageService.getProductsWithImageCounts(sortBy, sortDirection);
            res.status(200).json({
                success: true,
                data: result,
                message: 'Products with image counts retrieved successfully'
            });
        }
        catch (error) {
            console.error('ImageController.getProductsWithImageCounts error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve products with image counts',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
export const imageUpload = upload.single('image');
export const imageValidators = {
    uploadProductImage: [
        param('productId').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
        body('imageIndex').optional().isInt({ min: 0 }).withMessage('Image index must be a non-negative integer'),
        body('isPrimary').optional().isIn(['true', 'false']).withMessage('isPrimary must be true or false')
    ],
    deleteProductImages: [
        param('productId').isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
    ],
    getImagesGallery: [
        query('filter').optional().isIn(['all', 'used', 'unused']).withMessage('Filter must be all, used, or unused'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    uploadSiteImage: [
        body('type').isIn(['hero', 'logo']).withMessage('Type must be hero or logo')
    ]
};
