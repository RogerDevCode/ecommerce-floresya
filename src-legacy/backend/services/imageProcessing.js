import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ImageProcessingService {
    constructor() {
        this.outputDir = path.join(__dirname, '../../../frontend/images/products');
        this.sizes = {
            large: { width: 1200, height: 1200, suffix: '' },      // product-123456.webp
            medium: { width: 600, height: 600, suffix: '_md' },    // product-123456_md.webp
            small: { width: 300, height: 300, suffix: '_sm' },     // product-123456_sm.webp
            thumb: { width: 150, height: 150, suffix: '_thumb' }   // product-123456_thumb.webp
        };
        
        this.ensureDirectoryExists();
    }

    ensureDirectoryExists() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Generate unique filename for processed image
     * @param {string} originalName - Original filename
     * @returns {string} - Unique base filename without extension
     */
    generateFilename(originalName) {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const baseName = path.parse(originalName).name.replace(/[^a-zA-Z0-9]/g, '');
        return `product-${timestamp}-${random}`;
    }

    /**
     * Process a single image into multiple WebP sizes
     * @param {Buffer} buffer - Image buffer from multer
     * @param {string} originalName - Original filename
     * @returns {Promise<Object>} - Object with URLs for different sizes
     */
    async processImage(buffer, originalName) {
        try {
            const baseFilename = this.generateFilename(originalName);
            const processedSizes = {};

            // Process each size
            for (const [sizeName, config] of Object.entries(this.sizes)) {
                const filename = `${baseFilename}${config.suffix}.webp`;
                const filepath = path.join(this.outputDir, filename);

                await sharp(buffer)
                    .resize(config.width, config.height, {
                        fit: 'cover', // Crop to exact dimensions maintaining aspect ratio
                        position: 'center'
                    })
                    .webp({
                        quality: sizeName === 'large' ? 85 : 80, // Slightly higher quality for large images
                        effort: 4 // Better compression
                    })
                    .toFile(filepath);

                processedSizes[sizeName] = {
                    filename,
                    url: `/images/products/${filename}`,
                    width: config.width,
                    height: config.height,
                    size: fs.statSync(filepath).size
                };
            }

            return {
                success: true,
                baseFilename,
                sizes: processedSizes,
                originalName
            };

        } catch (error) {
            console.error('Error processing image:', error);
            throw new Error(`Failed to process image: ${error.message}`);
        }
    }

    /**
     * Process multiple images
     * @param {Array} files - Array of multer file objects
     * @returns {Promise<Array>} - Array of processed image objects
     */
    async processImages(files) {
        if (!files || files.length === 0) {
            return [];
        }

        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.processImage(file.buffer, file.originalname);
                results.push(result);
            } catch (error) {
                console.error(`Failed to process image ${file.originalname}:`, error);
                // Continue processing other images even if one fails
                results.push({
                    success: false,
                    error: error.message,
                    originalName: file.originalname
                });
            }
        }

        return results;
    }

    /**
     * Delete processed images by base filename
     * @param {string} baseFilename - Base filename without suffix/extension
     * @returns {Promise<boolean>} - Success status
     */
    async deleteProcessedImages(baseFilename) {
        try {
            let deletedCount = 0;

            for (const config of Object.values(this.sizes)) {
                const filename = `${baseFilename}${config.suffix}.webp`;
                const filepath = path.join(this.outputDir, filename);

                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                    deletedCount++;
                }
            }

            console.log(`Deleted ${deletedCount} image variants for ${baseFilename}`);
            return true;

        } catch (error) {
            console.error('Error deleting processed images:', error);
            return false;
        }
    }

    /**
     * Delete images by URL
     * @param {string|Array} urls - Single URL or array of URLs
     * @returns {Promise<boolean>} - Success status
     */
    async deleteImagesByUrl(urls) {
        try {
            const urlArray = Array.isArray(urls) ? urls : [urls];
            
            for (const url of urlArray) {
                // Extract filename from URL
                const filename = url.split('/').pop();
                
                // Extract base filename (remove suffix and extension)
                const baseFilename = filename.replace(/(_md|_sm|_thumb)?\.webp$/, '');
                
                await this.deleteProcessedImages(baseFilename);
            }

            return true;

        } catch (error) {
            console.error('Error deleting images by URL:', error);
            return false;
        }
    }

    /**
     * Get responsive image URLs for frontend
     * @param {string} baseUrl - Base URL of the large image
     * @returns {Object} - Object with all size variants
     */
    getResponsiveUrls(baseUrl) {
        if (!baseUrl) return null;

        const filename = baseUrl.split('/').pop();
        const baseFilename = filename.replace('.webp', '');

        return {
            large: baseUrl, // 1200x1200
            medium: baseUrl.replace('.webp', '_md.webp'), // 600x600
            small: baseUrl.replace('.webp', '_sm.webp'), // 300x300
            thumb: baseUrl.replace('.webp', '_thumb.webp') // 150x150
        };
    }

    /**
     * Generate srcset attribute for responsive images
     * @param {string} baseUrl - Base URL of the large image
     * @returns {string} - srcset attribute value
     */
    generateSrcSet(baseUrl) {
        if (!baseUrl) return '';

        const urls = this.getResponsiveUrls(baseUrl);
        
        return [
            `${urls.thumb} 150w`,
            `${urls.small} 300w`,
            `${urls.medium} 600w`,
            `${urls.large} 1200w`
        ].join(', ');
    }

    /**
     * Get optimal image URL based on container size
     * @param {string} baseUrl - Base URL of the large image
     * @param {number} containerWidth - Expected container width
     * @returns {string} - Optimal image URL
     */
    getOptimalUrl(baseUrl, containerWidth = 300) {
        if (!baseUrl) return baseUrl;

        const urls = this.getResponsiveUrls(baseUrl);
        
        if (containerWidth <= 150) return urls.thumb;
        if (containerWidth <= 300) return urls.small;
        if (containerWidth <= 600) return urls.medium;
        return urls.large;
    }
}

export default new ImageProcessingService();