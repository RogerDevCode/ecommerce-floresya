/**
 * 🌸 FloresYa Image Service - Enterprise Image Processing
 * Handles image upload, resizing, and storage to Supabase
 */

import sharp from 'sharp';
import { supabaseService } from '../config/supabase.js';
import type { ImageSize, ProductImage } from '../config/supabase.js';
import crypto from 'crypto';
import path from 'path';

// Tipo para archivos de Multer
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface ImageUploadRequest {
  productId: number;
  imageIndex: number;
  file: MulterFile;
  isPrimary?: boolean;
}

export interface ProcessedImage {
  size: ImageSize;
  buffer: Buffer;
  width: number;
  height: number;
  fileName: string;
  mimeType: string;
  fileHash: string;
}

export interface ImageUploadResult {
  success: boolean;
  images: Array<{
    size: ImageSize;
    url: string;
    fileHash: string;
  }>;
  primaryImage?: ProductImage;
  message: string;
}

export class ImageService {
  // Dimensiones para cada tamaño de imagen
  private readonly IMAGE_SIZES = {
    large: { width: 1200, height: 1200 },
    medium: { width: 600, height: 600 },
    small: { width: 300, height: 300 },
    thumb: { width: 150, height: 150 }
  } as const;

  /**
   * Procesa una imagen y crea las 4 variaciones de tamaño
   */
  public async processImage(file: MulterFile): Promise<ProcessedImage[]> {
    try {
      const originalBuffer = file.buffer;
      const baseFileName = this.generateFileName(file.originalname);
      const fileHash = this.generateFileHash(originalBuffer);

      const processedImages: ProcessedImage[] = [];

      // Procesar cada tamaño
      for (const [size, dimensions] of Object.entries(this.IMAGE_SIZES)) {
        const processedBuffer = await this.resizeImage(
          originalBuffer,
          dimensions.width,
          dimensions.height
        );

        const fileName = `${baseFileName}_${size}.webp`;

        processedImages.push({
          size: size as ImageSize,
          buffer: processedBuffer,
          width: dimensions.width,
          height: dimensions.height,
          fileName,
          mimeType: 'image/webp',
          fileHash
        });
      }

      return processedImages;
    } catch (error) {
      console.error('ImageService.processImage error:', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sube las imágenes procesadas a Supabase Storage
   */
  public async uploadImagesToStorage(
    productId: number,
    processedImages: ProcessedImage[]
  ): Promise<Array<{ size: ImageSize; url: string; fileHash: string }>> {
    try {
      const uploadedImages: Array<{ size: ImageSize; url: string; fileHash: string }> = [];

      for (const image of processedImages) {
        const filePath = `products/${productId}/${image.fileName}`;

        // Subir a Supabase Storage
        const { error } = await supabaseService.storage
          .from('product-images')
          .upload(filePath, image.buffer, {
            contentType: image.mimeType,
            cacheControl: '31536000', // 1 año de cache
            upsert: true
          });

        if (error) {
          console.error(`Error uploading ${image.size} image:`, error);
          throw new Error(`Failed to upload ${image.size} image: ${error.message}`);
        }

        // Obtener URL pública
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
    } catch (error) {
      console.error('ImageService.uploadImagesToStorage error:', error);
      throw error;
    }
  }

  /**
   * Guarda los registros de imágenes en la base de datos
   */
  public async saveImageRecords(
    productId: number,
    imageIndex: number,
    uploadedImages: Array<{ size: ImageSize; url: string; fileHash: string }>,
    isPrimary = false
  ): Promise<ProductImage[]> {
    try {
      const imageRecords: Omit<ProductImage, 'id' | 'created_at' | 'updated_at'>[] = [];

      for (const image of uploadedImages) {
        imageRecords.push({
          product_id: productId,
          image_index: imageIndex,
          size: image.size,
          url: image.url,
          file_hash: image.fileHash,
          mime_type: 'image/webp',
          is_primary: isPrimary && image.size === 'medium' // Solo medium puede ser primary
        });
      }

      // Insertar todos los registros de imagen
      const { data, error } = await supabaseService
        .from('product_images')
        .insert(imageRecords)
        .select();

      if (error) {
        console.error('Error saving image records:', error);
        throw new Error(`Failed to save image records: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('ImageService.saveImageRecords error:', error);
      throw error;
    }
  }

  /**
   * Procesa la subida completa de una imagen para un producto
   */
  public async uploadProductImage(request: ImageUploadRequest): Promise<ImageUploadResult> {
    try {
      const { productId, imageIndex, file, isPrimary = false } = request;

      // Verificar que el producto existe
      const { data: product, error: productError } = await supabaseService
        .from('products')
        .select('id, name')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Procesar la imagen en las 4 variaciones
      const processedImages = await this.processImage(file);

      // Subir todas las variaciones a Supabase Storage
      const uploadedImages = await this.uploadImagesToStorage(productId, processedImages);

      // Guardar registros en la base de datos
      const savedImages = await this.saveImageRecords(productId, imageIndex, uploadedImages, isPrimary);

      // Encontrar la imagen primary (medium) si fue marcada como tal
      const primaryImage = isPrimary ? savedImages.find(img => img.size === 'medium') : undefined;

      return {
        success: true,
        images: uploadedImages,
        primaryImage,
        message: `Successfully uploaded ${uploadedImages.length} image variations for product "${product.name}"`
      };
    } catch (error) {
      console.error('ImageService.uploadProductImage error:', error);
      return {
        success: false,
        images: [],
        message: error instanceof Error ? error.message : 'Failed to upload image'
      };
    }
  }

  /**
   * Elimina todas las imágenes de un producto
   */
  public async deleteProductImages(productId: number): Promise<boolean> {
    try {
      // Obtener todas las imágenes del producto
      const { data: images, error: fetchError } = await supabaseService
        .from('product_images')
        .select('url')
        .eq('product_id', productId);

      if (fetchError) {
        console.error('Error fetching images for deletion:', fetchError);
        return false;
      }

      // Eliminar archivos del storage
      if (images && images.length > 0) {
        const filePaths = images.map(img => {
          // Extraer el path del URL
          const urlParts = img.url.split('/storage/v1/object/public/product-images/');
          return urlParts[1];
        }).filter(Boolean);

        if (filePaths.length > 0) {
          const { error: storageError } = await supabaseService.storage
            .from('product-images')
            .remove(filePaths);

          if (storageError) {
            console.error('Error deleting files from storage:', storageError);
          }
        }
      }

      // Eliminar registros de la base de datos
      const { error: dbError } = await supabaseService
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (dbError) {
        console.error('Error deleting image records:', dbError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('ImageService.deleteProductImages error:', error);
      return false;
    }
  }

  /**
   * Redimensiona una imagen usando Sharp
   */
  private async resizeImage(
    buffer: Buffer,
    width: number,
    height: number
  ): Promise<Buffer> {
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

  /**
   * Genera un nombre de archivo único
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);

    return `${baseName}_${timestamp}_${random}`;
  }

  /**
   * Genera un hash del archivo para verificar integridad
   */
  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Valida que el archivo sea una imagen válida
   */
  public validateImageFile(file: MulterFile): { valid: boolean; error?: string } {
    // Verificar tamaño máximo (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Image file size must be less than 5MB' };
    }

    // Verificar tipo MIME
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
    }

    return { valid: true };
  }
}