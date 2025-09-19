import sharp from 'sharp';
import { supabaseService } from '../config/supabase.js';
import crypto from 'crypto';
import path from 'path';
export class ImageService {
    constructor() {
        this.IMAGE_SIZES = {
            large: { width: 1200, height: 1200 },
            medium: { width: 600, height: 600 },
            small: { width: 300, height: 300 },
            thumb: { width: 150, height: 150 }
        };
    }
    async processImage(file) {
        try {
            const originalBuffer = file.buffer;
            const baseFileName = this.generateFileName(file.originalname);
            const fileHash = this.generateFileHash(originalBuffer);
            const processedImages = [];
            for (const [size, dimensions] of Object.entries(this.IMAGE_SIZES)) {
                const processedBuffer = await this.resizeImage(originalBuffer, dimensions.width, dimensions.height);
                const fileName = `${baseFileName}_${size}.webp`;
                processedImages.push({
                    size: size,
                    buffer: processedBuffer,
                    width: dimensions.width,
                    height: dimensions.height,
                    fileName,
                    mimeType: 'image/webp',
                    fileHash
                });
            }
            return processedImages;
        }
        catch (error) {
            console.error('ImageService.processImage error:', error);
            throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async uploadImagesToStorage(productId, processedImages) {
        try {
            const uploadedImages = [];
            for (const image of processedImages) {
                const filePath = `products/${productId}/${image.fileName}`;
                const { error } = await supabaseService.storage
                    .from('product-images')
                    .upload(filePath, image.buffer, {
                    contentType: image.mimeType,
                    cacheControl: '31536000',
                    upsert: true
                });
                if (error) {
                    console.error(`Error uploading ${image.size} image:`, error);
                    throw new Error(`Failed to upload ${image.size} image: ${error.message}`);
                }
                const { data: urlData } = supabaseService.storage
                    .from('product-images')
                    .getPublicUrl(filePath);
                if (!urlData?.publicUrl) {
                    throw new Error(`Failed to get public URL for ${image.size} image`);
                }
                uploadedImages.push({
                    size: image.size,
                    url: urlData.publicUrl,
                    fileHash: image.fileHash
                });
            }
            return uploadedImages;
        }
        catch (error) {
            console.error('ImageService.uploadImagesToStorage error:', error);
            throw error;
        }
    }
    async saveImageRecords(productId, imageIndex, uploadedImages, isPrimary = false) {
        try {
            const imagesData = uploadedImages.map(image => ({
                size: image.size,
                url: image.url,
                file_hash: image.fileHash,
                mime_type: 'image/webp'
            }));
            const { data, error } = await supabaseService.rpc('create_product_images_atomic', {
                product_id: productId,
                image_index: imageIndex,
                images_data: imagesData,
                is_primary: isPrimary
            });
            if (error) {
                console.error('Error in image creation transaction:', error);
                throw new Error(`Failed to save image records transaction: ${error.message}`);
            }
            if (!data) {
                throw new Error('No data returned from image creation transaction');
            }
            return data;
        }
        catch (error) {
            console.error('ImageService.saveImageRecords error:', error);
            throw error;
        }
    }
    async uploadProductImage(request) {
        try {
            const { productId, imageIndex, file, isPrimary = false } = request;
            const { data: product, error: productError } = await supabaseService
                .from('products')
                .select('id, name')
                .eq('id', productId)
                .single();
            if (productError || !product) {
                throw new Error(`Product with ID ${productId} not found`);
            }
            const processedImages = await this.processImage(file);
            const uploadedImages = await this.uploadImagesToStorage(productId, processedImages);
            const savedImages = await this.saveImageRecords(productId, imageIndex, uploadedImages, isPrimary);
            const primaryImage = isPrimary ? savedImages.find(img => img.size === 'medium') : undefined;
            return {
                success: true,
                images: uploadedImages,
                primaryImage,
                message: `Successfully uploaded ${uploadedImages.length} image variations for product "${product.name}"`
            };
        }
        catch (error) {
            console.error('ImageService.uploadProductImage error:', error);
            return {
                success: false,
                images: [],
                message: error instanceof Error ? error.message : 'Failed to upload image'
            };
        }
    }
    async deleteProductImages(productId) {
        try {
            const { data, error } = await supabaseService.rpc('delete_product_images_safe', {
                product_id: productId
            });
            if (error) {
                console.error('Error in image deletion transaction:', error);
                return false;
            }
            return data;
        }
        catch (error) {
            console.error('ImageService.deleteProductImages error:', error);
            return false;
        }
    }
    async resizeImage(buffer, width, height) {
        return await sharp(buffer)
            .resize(width, height, {
            fit: 'cover',
            position: 'center',
            withoutEnlargement: true
        })
            .webp({
            quality: 85,
            effort: 6
        })
            .toBuffer();
    }
    generateFileName(originalName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        return `${baseName}_${timestamp}_${random}`;
    }
    generateFileHash(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
    validateImageFile(file) {
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return { valid: false, error: 'Image file size must be less than 5MB' };
        }
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
        }
        return { valid: true };
    }
    async getImagesGallery(filter = 'all', page = 1, limit = 20) {
        try {
            let query = supabaseService
                .from('product_images')
                .select(`
          id,
          product_id,
          size,
          url,
          file_hash,
          is_primary,
          created_at,
          products!product_images_product_id_fkey (
            id,
            name
          )
        `)
                .order('created_at', { ascending: false });
            if (filter === 'used') {
                query = query.not('product_id', 'is', null);
            }
            else if (filter === 'unused') {
                query = query.is('product_id', null);
            }
            const { count } = await supabaseService
                .from('product_images')
                .select('*', { count: 'exact', head: true });
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);
            const { data, error } = await query;
            if (error) {
                throw new Error(`Failed to fetch images gallery: ${error.message}`);
            }
            const images = (data || []).map(image => ({
                id: image.id,
                product_id: image.product_id,
                product_name: Array.isArray(image.products) && image.products.length > 0
                    ? image.products[0]?.name ?? null
                    : null,
                size: image.size,
                url: image.url,
                file_hash: image.file_hash,
                is_primary: image.is_primary,
                created_at: image.created_at
            }));
            const totalPages = Math.ceil((count ?? 0) / limit);
            return {
                images,
                pagination: {
                    page,
                    total: count ?? 0,
                    pages: totalPages
                }
            };
        }
        catch (error) {
            console.error('ImageService.getImagesGallery error:', error);
            throw error;
        }
    }
    async uploadSiteImage(file, type) {
        try {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            const extension = 'webp';
            const fileName = `site_${type}_${timestamp}_${random}.${extension}`;
            const processedBuffer = await this.resizeImage(file.buffer, type === 'logo' ? 200 : 1200, type === 'logo' ? 200 : 600);
            const filePath = `site/${fileName}`;
            const { error } = await supabaseService.storage
                .from('product-images')
                .upload(filePath, processedBuffer, {
                contentType: 'image/webp',
                cacheControl: '31536000',
                upsert: true
            });
            if (error) {
                throw new Error(`Failed to upload site image: ${error.message}`);
            }
            const { data: urlData } = supabaseService.storage
                .from('product-images')
                .getPublicUrl(filePath);
            if (!urlData?.publicUrl) {
                throw new Error('Failed to get public URL for site image');
            }
            return {
                success: true,
                url: urlData.publicUrl,
                type,
                message: `Successfully uploaded ${type} image`
            };
        }
        catch (error) {
            console.error('ImageService.uploadSiteImage error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to upload site image'
            };
        }
    }
    async getCurrentSiteImages() {
        try {
            return {
                hero: '/images/hero-flowers.webp',
                logo: '/images/logoFloresYa.jpeg'
            };
        }
        catch (error) {
            console.error('ImageService.getCurrentSiteImages error:', error);
            return {
                hero: '/images/hero-flowers.webp',
                logo: '/images/logoFloresYa.jpeg'
            };
        }
    }
    async getProductsWithImageCounts(sortBy = 'image_count', sortDirection = 'asc') {
        try {
            const { data, error } = await supabaseService
                .from('products')
                .select(`
          id,
          name,
          price_usd,
          product_images!inner(count)
        `)
                .eq('active', true);
            if (error) {
                throw new Error(`Failed to fetch products with image counts: ${error.message}`);
            }
            const productImageCounts = new Map();
            if (data) {
                data.forEach((product) => {
                    const productId = product.id;
                    const productImages = product.product_images;
                    const imageCount = productImages ? productImages.length : 0;
                    productImageCounts.set(productId, imageCount);
                });
            }
            const { data: allProducts, error: productsError } = await supabaseService
                .from('products')
                .select('id, name, price_usd')
                .eq('active', true);
            if (productsError) {
                throw new Error(`Failed to fetch products: ${productsError.message}`);
            }
            const productsWithCounts = (allProducts || []).map(product => ({
                id: product.id,
                name: product.name,
                price_usd: parseFloat(product.price_usd),
                image_count: productImageCounts.get(product.id) ?? 0
            }));
            productsWithCounts.sort((a, b) => {
                let comparison = 0;
                if (sortBy === 'name') {
                    comparison = a.name.localeCompare(b.name);
                }
                else if (sortBy === 'image_count') {
                    comparison = a.image_count - b.image_count;
                }
                return sortDirection === 'desc' ? -comparison : comparison;
            });
            return {
                products: productsWithCounts
            };
        }
        catch (error) {
            console.error('ImageService.getProductsWithImageCounts error:', error);
            throw error;
        }
    }
}
