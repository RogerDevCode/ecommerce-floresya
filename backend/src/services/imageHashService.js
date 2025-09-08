const crypto = require('crypto');
const { supabase } = require('../config/database');

class ImageHashService {
    /**
     * Calcular SHA256 hash del buffer de imagen
     * @param {Buffer} buffer - Buffer del archivo de imagen
     * @returns {string} - Hash SHA256 en hexadecimal
     */
    calculateHash(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Verificar si una imagen ya existe por su hash
     * @param {string} fileHash - Hash SHA256 del archivo
     * @returns {Promise<Object|null>} - Datos de imagen existente o null
     */
    async findExistingImage(fileHash) {
        try {
            const { data, error } = await supabase
                .rpc('get_existing_image_by_hash', { hash_input: fileHash });

            if (error) {
                console.error('Error finding existing image:', error);
                return null;
            }

            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error in findExistingImage:', error);
            return null;
        }
    }

    /**
     * Guardar metadatos de imagen procesada en la base de datos
     * @param {Object} imageData - Datos de la imagen procesada
     * @returns {Promise<Object>} - Resultado de la inserción
     */
    async saveImageMetadata(imageData) {
        try {
            const {
                product_id,
                file_hash,
                original_filename,
                original_size,
                mime_type,
                url_large,
                url_medium,
                url_small,
                url_thumb,
                width,
                height,
                display_order = 1,
                is_primary = false
            } = imageData;

            const { data, error } = await supabase
                .from('product_images')
                .insert({
                    product_id,
                    file_hash,
                    original_filename,
                    original_size,
                    mime_type,
                    url_large,
                    url_medium,
                    url_small,
                    url_thumb,
                    width,
                    height,
                    display_order,
                    is_primary
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error saving image metadata:', error);
            
            // Si es error de duplicado (violación de constraint UNIQUE)
            if (error.code === '23505' && error.constraint === 'product_images_file_hash_key') {
                console.log('Image with this hash already exists, finding existing...');
                const existingImage = await this.findExistingImage(imageData.file_hash);
                return { 
                    success: true, 
                    data: existingImage, 
                    isDuplicate: true,
                    message: 'Image already exists, using existing version'
                };
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener todas las imágenes de un producto
     * @param {number} productId - ID del producto
     * @returns {Promise<Array>} - Array de imágenes del producto
     */
    async getProductImages(productId) {
        try {
            const { data, error } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', productId)
                .order('display_order', { ascending: true });

            if (error) {
                throw error;
            }

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error getting product images:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Establecer imagen principal de un producto
     * @param {number} productId - ID del producto
     * @param {number} imageId - ID de la imagen a establecer como principal
     * @returns {Promise<Object>} - Resultado de la operación
     */
    async setPrimaryImage(productId, imageId) {
        try {
            // Primero quitar primary de todas las imágenes del producto
            await supabase
                .from('product_images')
                .update({ is_primary: false })
                .eq('product_id', productId);

            // Luego establecer la nueva imagen como primary
            const { data, error } = await supabase
                .from('product_images')
                .update({ is_primary: true })
                .eq('id', imageId)
                .eq('product_id', productId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error setting primary image:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Eliminar imagen y sus metadatos
     * @param {number} imageId - ID de la imagen a eliminar
     * @returns {Promise<Object>} - Resultado de la operación
     */
    async deleteImage(imageId) {
        try {
            const { data, error } = await supabase
                .from('product_images')
                .delete()
                .eq('id', imageId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error deleting image:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Procesar imagen: verificar duplicados y guardar si es nueva
     * @param {Buffer} buffer - Buffer del archivo
     * @param {string} originalname - Nombre original del archivo
     * @param {string} mimetype - Tipo MIME
     * @param {Object} processedSizes - URLs de diferentes tamaños procesados
     * @param {number} productId - ID del producto
     * @param {number} displayOrder - Orden de visualización
     * @param {boolean} isPrimary - Si es imagen principal
     * @returns {Promise<Object>} - Resultado con datos de imagen (nueva o existente)
     */
    async processImageWithDuplicateCheck(buffer, originalname, mimetype, processedSizes, productId, displayOrder = 1, isPrimary = false) {
        try {
            // 1. Calcular hash del archivo
            const fileHash = this.calculateHash(buffer);
            
            // 2. Verificar si ya existe
            const existingImage = await this.findExistingImage(fileHash);
            
            if (existingImage) {
                console.log(`🔄 Imagen duplicada detectada: ${originalname} (hash: ${fileHash.substring(0, 8)}...)`);
                
                // Retornar imagen existente sin procesarla nuevamente
                return {
                    success: true,
                    data: existingImage,
                    isDuplicate: true,
                    message: 'Imagen ya existe, usando versión existente',
                    fileHash
                };
            }

            // 3. Si no existe, guardar metadatos
            console.log(`✅ Nueva imagen: ${originalname} (hash: ${fileHash.substring(0, 8)}...)`);
            
            const imageMetadata = {
                product_id: productId,
                file_hash: fileHash,
                original_filename: originalname,
                original_size: buffer.length,
                mime_type: mimetype,
                url_large: processedSizes.large?.url,
                url_medium: processedSizes.medium?.url,
                url_small: processedSizes.small?.url,
                url_thumb: processedSizes.thumb?.url,
                width: processedSizes.large?.width,
                height: processedSizes.large?.height,
                display_order: displayOrder,
                is_primary: isPrimary
            };

            const result = await this.saveImageMetadata(imageMetadata);
            
            return {
                ...result,
                fileHash,
                isDuplicate: false
            };

        } catch (error) {
            console.error('Error in processImageWithDuplicateCheck:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new ImageHashService();