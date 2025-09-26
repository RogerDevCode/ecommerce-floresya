/**
 * 🌸 FloresYa Image Service - Enterprise Image Processing
 * Handles image upload, resizing, and storage to Supabase
 */

import crypto from 'crypto';
import path from 'path';

import sharp from 'sharp';

import type {
  ImageSize,
  ProductImage,
  MulterFile,
  ImageUploadRequest,
  ProcessedImage,
  ImageUploadResult
} from '../shared/types/index.js';

import { typeSafeDatabaseService } from './TypeSafeDatabaseService.js';

// Using TypeSafeDatabaseService for type-safe operations

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
    const originalBuffer = file.buffer;
    const baseFileName = this.generateFileName(file.originalname);
    const fileHash = this.generateFileHash(originalBuffer);

    const processedImages: ProcessedImage[] = [];

    // Procesar cada tamaño
    for (const [size, dimensions] of Object.entries(this.IMAGE_SIZES)) {
      try {
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
      } catch (error) {
        throw new Error(`Failed to process ${size} image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return processedImages;
  }

  /**
   * Sube las imágenes procesadas a Supabase Storage
   */
  public async uploadImagesToStorage(
    productId: number,
    processedImages: ProcessedImage[]
  ): Promise<Array<{ size: ImageSize; url: string; fileHash: string }>> {
    const uploadedImages: Array<{ size: ImageSize; url: string; fileHash: string }> = [];

    for (const image of processedImages) {
      const filePath = `products/${productId}/${image.fileName}`;

      // Subir a Supabase Storage
      const { error } = await typeSafeDatabaseService.getClient().storage
        .from('product-images')
        .upload(filePath, image.buffer, {
          contentType: image.mimeType,
          cacheControl: '31536000', // 1 año de cache
          upsert: true
        });

      if (error) {
        throw new Error(`Failed to upload ${image.size} image: ${error.message}`);
      }

      // Obtener URL pública
      const { data: urlData } = typeSafeDatabaseService.getClient().storage
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

  /**
   * Guarda los registros de imágenes en la base de datos usando transacción
   */
  public async saveImageRecords(
    productId: number,
    imageIndex: number,
    uploadedImages: Array<{ size: ImageSize; url: string; fileHash: string }>,
    isPrimary = false
  ): Promise<ProductImage[]> {
    // Convert uploaded images to JSONB format for the transaction function
    const imagesData = uploadedImages.map(image => ({
      size: image.size,
      url: image.url,
      file_hash: image.fileHash,
      mime_type: 'image/webp'
    }));

    // Use PostgreSQL function for atomic image creation
    const data = await typeSafeDatabaseService.executeRpc('create_product_images_atomic', {
      product_id: productId,
      image_index: imageIndex,
      images_data: imagesData,
      is_primary: isPrimary
    });

    if (!data) {
      throw new Error('No data returned from image creation transaction');
    }

    return data as ProductImage[];
  }

  /**
   * Procesa la subida completa de una imagen para un producto
   */
  public async uploadProductImage(request: ImageUploadRequest): Promise<ImageUploadResult> {
    try {
      const { productId, imageIndex, file, isPrimary = false } = request;

      // Verificar que el producto existe
      const { data: product, error: productError } = await typeSafeDatabaseService.getClient()
        .from('products')
        .select('id, name')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      // Type assertion para el producto
      const productData = product as { id: number; name: string };

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
        message: `Successfully uploaded ${uploadedImages.length} image variations for product "${productData.name}"`
      };
    } catch (error) {
            return {
        success: false,
        images: [],
        message: error instanceof Error ? error.message : 'Failed to upload image'
      };
    }
  }

  /**
   * Elimina todas las imágenes de un producto usando transacción
   */
  public async deleteProductImages(productId: number): Promise<boolean> {
    try {
      // Use PostgreSQL function for safe image deletion
      const data = await typeSafeDatabaseService.executeRpc('delete_product_images_safe', {
        product_id: productId
      });

      // Note: Storage cleanup should be handled by application
      // as Supabase storage operations are not directly transactional
      // This would need to be implemented separately

      return data as boolean;
    } catch (error) {
            return false;
    }
  }

/**
 * Obtener imágenes de un producto específico
 */
public async getProductImages(productId: number): Promise<ProductImage[]> {
    const { data, error } = await typeSafeDatabaseService.getClient()
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('image_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch product images: ${error.message}`);
    }

    return (data ?? []) as ProductImage[];
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
     // Verificar que el archivo existe
     if (!file) {
       return { valid: false, error: 'No file provided' };
     }

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

  /**
   * Obtiene la galería de imágenes de productos para el admin
   */
  public async getImagesGallery(filter: 'all' | 'used' | 'unused' = 'all', page = 1, limit = 20): Promise<{
    images: Array<{
      id: number;
      product_id: number | null;
      product_name: string | null;
      size: ImageSize;
      url: string;
      file_hash: string;
      is_primary: boolean;
      created_at: string;
    }>;
    pagination: {
      page: number;
      total: number;
      pages: number;
    };
  }> {
      let query = typeSafeDatabaseService.getClient()
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

      // Aplicar filtros
      if (filter === 'used') {
        query = query.not('product_id', 'is', null);
      } else if (filter === 'unused') {
        query = query.is('product_id', null);
      }

      // Obtener total para paginación
      const { count } = await typeSafeDatabaseService.getClient()
        .from('product_images')
        .select('*', { count: 'exact', head: true });

      // Aplicar paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch images gallery: ${error.message}`);
      }

      const images = (data ?? []).map((image: {
        id: number;
        product_id: number | null;
        size: ImageSize;
        url: string;
        file_hash: string;
        is_primary: boolean;
        created_at: string;
        products?: Array<{ name?: string }>;
      }) => ({
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

  /**
   * Sube imágenes del sitio (hero, logo)
   */
  public async uploadSiteImage(file: MulterFile, type: 'hero' | 'logo'): Promise<{
    success: boolean;
    url?: string;
    type?: string;
    message: string;
  }> {
    try {
      // Generar nombre único para la imagen del sitio
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const extension = 'webp'; // Convertir a WebP
      const fileName = `site_${type}_${timestamp}_${random}.${extension}`;

      // Procesar la imagen (solo una versión optimizada)
      const processedBuffer = await this.resizeImage(
        file.buffer,
        type === 'logo' ? 200 : 1200, // Logo más pequeño
        type === 'logo' ? 200 : 600  // Logo más pequeño
      );

      // Subir a Supabase Storage en carpeta 'site'
      const filePath = `site/${fileName}`;
      const { error } = await typeSafeDatabaseService.getClient().storage
        .from('product-images')
        .upload(filePath, processedBuffer, {
          contentType: 'image/webp',
          cacheControl: '31536000', // 1 año de cache
          upsert: true
        });

      if (error) {
        throw new Error(`Failed to upload site image: ${error.message}`);
      }

      // Obtener URL pública
      const { data: urlData } = typeSafeDatabaseService.getClient().storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for site image');
      }

      // Actualizar configuración del sitio (esto podría ir en una tabla settings)
      // Por ahora, solo devolvemos la URL
      return {
        success: true,
        url: urlData.publicUrl,
        type,
        message: `Successfully uploaded ${type} image`
      };
    } catch (error) {
            return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload site image'
      };
    }
  }

/**
 * Obtiene las imágenes actuales del sitio
 */
public getCurrentSiteImages(): { hero: string; logo: string; } {
  // Por ahora, devolver valores por defecto
  // En el futuro, esto podría venir de una tabla settings
  return {
    hero: '/images/hero-flowers.webp',
    logo: '/images/logoFloresYa.jpeg'
  };
}

  /**
    * Obtiene productos con conteo de imágenes para gestión administrativa
    */
  public async getProductsWithImageCounts(
    sortBy: 'name' | 'image_count' = 'image_count',
    sortDirection: 'asc' | 'desc' = 'asc',
    productStatus: 'active' | 'inactive' | 'all' = 'active',
    occasionFilter?: string
  ): Promise<{
    products: Array<{
      id: number;
      name: string;
      price_usd: number;
      image_count: number;
    }>;
  }> {
    // Construir consulta base para productos
    let productsQuery = typeSafeDatabaseService.getClient()
      .from('products')
      .select('id, name, price_usd, active');

    // Aplicar filtro de estado del producto
    if (productStatus === 'active') {
      productsQuery = productsQuery.eq('active', true);
    } else if (productStatus === 'inactive') {
      productsQuery = productsQuery.eq('active', false);
    }
    // Para 'all' no aplicamos filtro de estado

    const { data: allProducts, error: productsError } = await productsQuery;

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!allProducts || allProducts.length === 0) {
      return { products: [] };
    }

    // Si hay filtro de ocasión, necesitamos obtener productos que tengan esa ocasión
    let filteredProductIds = (allProducts as { id: number }[]).map(p => p.id);

    if (occasionFilter && occasionFilter !== 'general') {
      const { data: occasionProducts, error: occasionError } = await typeSafeDatabaseService.getClient()
        .from('product_occasions')
        .select('product_id')
        .eq('occasion_id', parseInt(occasionFilter));

      if (occasionError) {
        console.warn('Warning: Failed to fetch occasion products:', occasionError.message);
      } else if (occasionProducts) {
        const occasionProductIds = (occasionProducts as { product_id: number }[]).map(op => op.product_id);
        filteredProductIds = filteredProductIds.filter(id => occasionProductIds.includes(id));
      }
    }

    // Obtener conteo de imágenes para los productos filtrados
    // Agrupar por product_id para contar imágenes únicas (no por tamaño)
    const { data: imageCounts, error: imagesError } = await typeSafeDatabaseService.getClient()
      .from('product_images')
      .select('product_id, image_index')
      .in('product_id', filteredProductIds);

    if (imagesError) {
      console.warn('Warning: Failed to fetch image counts:', imagesError.message);
    }

    // Contar imágenes únicas por producto (cada image_index representa una imagen)
    const imageCountMap = new Map<number, number>();
    if (imageCounts) {
      // Usar un Set para evitar duplicados por image_index
      const uniqueImages = new Map<number, Set<number>>();
      imageCounts.forEach((image: { product_id: number; image_index: number }) => {
        if (!uniqueImages.has(image.product_id)) {
          uniqueImages.set(image.product_id, new Set());
        }
        uniqueImages.get(image.product_id)?.add(image.image_index);
      });

      // Contar los sets únicos
      uniqueImages.forEach((imageIndexes, productId) => {
        imageCountMap.set(productId, imageIndexes.size);
      });
    }

    // Filtrar productos según los criterios aplicados
    const filteredProducts = allProducts.filter((product: { id: number }) => filteredProductIds.includes(product.id));

    // Combinar productos filtrados con conteo de imágenes
    const productsWithCounts = filteredProducts.map((product: { id: number; name: string; price_usd: number }) => ({
      id: product.id,
      name: product.name,
      price_usd: product.price_usd,
      image_count: imageCountMap.get(product.id) ?? 0
    }));

    // Ordenar según los parámetros
    productsWithCounts.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = (a as { name: string }).name.localeCompare((b as { name: string }).name);
      } else if (sortBy === 'image_count') {
        comparison = (a as { image_count: number }).image_count - (b as { image_count: number }).image_count;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return {
      products: productsWithCounts
    };
  }
}
