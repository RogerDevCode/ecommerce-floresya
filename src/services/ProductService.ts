/**
 * 🌸 FloresYa Product Service - Enterprise TypeScript Edition
 * Implements new carousel_order logic with optimal performance
 */

import {
  type CarouselProduct,
  type CarouselResponse,
  type ImageSize,
  type Product,
  type ProductCreateRequest,
  type ProductImage,
  type ProductInsert,
  type ProductQuery,
  type ProductResponse,
  type ProductUpdateRequest,
  type ProductWithImages,
  type RawProductWithImages
} from '../shared/types/index.js';
// Import consolidated utility function
import { omitFunction as _omitFunction } from '../shared/utils/index.js';

import { typeSafeDatabaseService } from './TypeSafeDatabaseService.js';

// Using TypeSafeDatabaseService for type-safe operations

export class ProductService {
  /**
   * Get carousel products with their primary thumb images
   * Optimized query to fetch only carousel products and their primary thumb images
   */
  public async getCarouselProducts(): Promise<CarouselResponse> {
    // Get products with carousel_order
    const { data: productsData, error: productsError } = await typeSafeDatabaseService.getClient()
      .from('products')
      .select('id, name, summary, price_usd, carousel_order')
      .not('carousel_order', 'is', null)
      .eq('active', true)
      .order('carousel_order', { ascending: true });

    if (productsError) {
      throw new Error(`Failed to fetch carousel products: ${productsError.message}`);
    }

    if (!productsData || productsData.length === 0) {
      return {
        products: [],
        total_count: 0
      };
    }

    // Get primary medium images AND all large images for these products (better quality for carousel)
    const productIds = (productsData as { id: number }[]).map(p => p.id);

    // Get primary medium for carousel display (better quality)
    // First try to get primary medium, then fallback to any medium, then small, then thumb
    const { data: mediumData, error: mediumError } = await typeSafeDatabaseService.getClient()
      .from('product_images')
      .select('product_id, url, is_primary, size')
      .in('product_id', productIds)
      .in('size', ['medium', 'small', 'thumb'])
      .order('is_primary', { ascending: false })
      .order('size', { ascending: false }); // medium, small, thumb order

    if (mediumError) {
      throw new Error(`Failed to fetch display images: ${mediumError.message}`);
    }

    // Get all large images for hover effect (higher quality)
    const { data: largeImagesData, error: largeImagesError } = await typeSafeDatabaseService.getClient()
      .from('product_images')
      .select('product_id, url, image_index')
      .in('product_id', productIds)
      .eq('size', 'large')
      .order('image_index', { ascending: true });

    if (largeImagesError) {
      throw new Error(`Failed to fetch large images: ${largeImagesError.message}`);
    }

    // Create map for display images with smart fallback
    const displayImageMap = new Map<number, string>();
    (mediumData as Array<{product_id: number, url: string, is_primary: boolean, size: string}> ?? []).forEach(img => {
      // Only take first image per product (ordered by is_primary desc, then by size desc)
      if (!displayImageMap.has(img.product_id)) {
        // Convert database path to Supabase storage URL
        const imageUrl = this.getSupabaseImageUrl(img.url);
        displayImageMap.set(img.product_id, imageUrl);
      }
    });

    const largeImagesMap = new Map<number, Array<{url: string, image_index: number}>>();
    (largeImagesData as Array<{product_id: number, url: string, image_index: number}> ?? []).forEach(img => {
      if (!largeImagesMap.has(img.product_id)) {
        largeImagesMap.set(img.product_id, []);
      }
      const productImages = largeImagesMap.get(img.product_id);
      if (productImages) {
        // Convert database path to Supabase storage URL
        const imageUrl = this.getSupabaseImageUrl(img.url);
        productImages.push({
          url: imageUrl,
          image_index: img.image_index
        });
      }
    });

    // Build carousel products with images for hover effect
    const carouselProducts: CarouselProduct[] = (productsData as Array<{id: number, name: string, summary?: string, price_usd: number, carousel_order: number}>).map((product) => {
      const displayImageUrl = displayImageMap.get(product.id);
      const largeImages = largeImagesMap.get(product.id) ?? [];

      // Use actual image URL if available, fallback to placeholder
      const finalImageUrl = displayImageUrl ?? '/images/placeholder-product.webp';

      // Sort large images by image_index and extract URLs
      const sortedLargeImages = largeImages
        .sort((a, b) => a.image_index - b.image_index)
        .map(img => ({ url: img.url, size: 'large' as ImageSize }));

      return {
        id: product.id,
        name: product.name,
        summary: product.summary ?? undefined,
        price_usd: product.price_usd,
        carousel_order: product.carousel_order,
        primary_image_url: finalImageUrl, // Using best available quality with fallback
        primary_thumb_url: finalImageUrl, // Mantener compatibilidad
        images: sortedLargeImages // Usando large para hover effect
      };
    });

    return {
      products: carouselProducts,
      total_count: carouselProducts.length
    } as CarouselResponse;
  }

  /**
   * Get all products with advanced filtering
   */
  public async getProducts(query: ProductQuery = {}): Promise<ProductResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      occasion,
      featured,
      active = true,
      has_carousel_order,
      sort_by = 'created_at',
      sort_direction = 'desc'
    } = query;

    const offset = (page - 1) * limit;

    let queryBuilder = typeSafeDatabaseService.getClient()
      .from('products')
      .select(`
        *,
        product_images(
          id,
          product_id,
          image_index,
          size,
          url,
          file_hash,
          mime_type,
          is_primary,
          created_at,
          updated_at
        )
      `, { count: 'exact' })
      .eq('active', active);

    // Apply filters
    if (search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Filter by occasion using N:N relationship through product_occasions
    if (occasion) {
      // Filter by occasion slug - resolve slug to ID first
      const { data: occasionData, error: occasionError } = await typeSafeDatabaseService.getClient()
        .from('occasions')
        .select('id')
        .eq('slug', occasion)
        .single();

      if (occasionError || !occasionData) {
        throw new Error(`Invalid occasion slug: ${occasion}`);
      }

      // Get product IDs for this occasion
      const { data: productIds, error: productIdsError } = await typeSafeDatabaseService.getClient()
        .from('product_occasions')
        .select('product_id')
        .eq('occasion_id', occasionData.id);

      if (productIdsError) {
        throw new Error(`Error filtering by occasion: ${productIdsError.message}`);
      }

      if (productIds && productIds.length > 0) {
        const ids = (productIds as Array<{ product_id: number }>).map((row) => row.product_id);
        queryBuilder = queryBuilder.in('id', ids);
      } else {
        // No products for this occasion - return empty result
        queryBuilder = queryBuilder.eq('id', -1); // Non-existent ID
      }
    }


    if (typeof featured === 'boolean') {
      queryBuilder = queryBuilder.eq('featured', featured);
    }

    if (typeof has_carousel_order === 'boolean') {
      if (has_carousel_order) {
        queryBuilder = queryBuilder.not('carousel_order', 'is', null);
      } else {
        queryBuilder = queryBuilder.is('carousel_order', null);
      }
    }

    const ascending = sort_direction === 'asc';
    queryBuilder = queryBuilder.order(sort_by, { ascending });
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    // Get product IDs to fetch medium images for hover effect
    const productIds = (data as RawProductWithImages[] ?? []).map(p => p.id);

    // Get all medium images for hover effect
    const { data: mediumImagesData, error: mediumImagesError } = await typeSafeDatabaseService.getClient()
      .from('product_images')
      .select('product_id, url, image_index')
      .in('product_id', productIds)
      .eq('size', 'medium')
      .order('image_index', { ascending: true });

    if (mediumImagesError) {
            }

    // Group medium images by product_id
    const mediumImagesByProduct: Record<number, string[]> = (mediumImagesData as Array<{product_id: number, url: string, image_index: number}> ?? []).reduce((acc: Record<number, string[]>, img) => {
      acc[img.product_id] ??= [];
      // Convert database path to Supabase storage URL
      const imageUrl = this.getSupabaseImageUrl(img.url);
      acc[img.product_id]?.push(imageUrl);
      return acc;
    }, {} as Record<number, string[]>);

    const productsWithImages: ProductWithImages[] = (data as RawProductWithImages[] ?? []).map((product) => {
      const sortedImages = (product.product_images ?? []).sort((a: ProductImage, b: ProductImage) => a.image_index - b.image_index);
      const mediumImages = mediumImagesByProduct[product.id] ?? [];

      // Convert image URLs to Supabase storage URLs
      const imagesWithSupabaseUrls = sortedImages.map(img => ({
        ...img,
        url: this.getSupabaseImageUrl(img.url)
      }));

      const primaryImageUrl = imagesWithSupabaseUrls.find((img) => img.is_primary)?.url;

      const { product_images: _product_images, ...productWithoutImages } = product;
      return {
        ...productWithoutImages,
        images: imagesWithSupabaseUrls,
        primary_image_url: primaryImageUrl,
        medium_images: mediumImages // Agregar imágenes medium para hover
      } as ProductWithImages & { medium_images: string[] };
    });

    const totalPages = Math.ceil((count ?? 0) / limit);

    return {
      products: productsWithImages,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: count ?? 0,
        items_per_page: limit
      }
    };
  }

  /**
   * Get single product by ID with images and occasions
   */
  public async getProductById(id: number): Promise<ProductWithImages | null> {
    const { data, error } = await typeSafeDatabaseService.getClient()
      .from('products')
      .select(`
        *,
        product_images(
          id,
          product_id,
          image_index,
          size,
          url,
          file_hash,
          mime_type,
          is_primary,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Product not found
      }
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const rawProduct = data as RawProductWithImages;
    const sortedImages = (rawProduct.product_images ?? []).sort((a: ProductImage, b: ProductImage) => a.image_index - b.image_index);

    const { product_images: _product_images, ...productWithoutImages } = rawProduct;
    const productWithImages: ProductWithImages = {
      ...productWithoutImages,
      images: sortedImages,
      primary_image_url: sortedImages.find((img) => img.is_primary)?.url
    };

    return productWithImages;
  }

  /**
   * Get single product by ID with images and occasions for editing
   */
  public async getProductByIdWithOccasions(id: number): Promise<ProductWithImages & { occasion_ids: number[] } | null> {
    // Get product with images
    const product = await this.getProductById(id);
    if (!product) {
      return null;
    }

    // Get associated occasion IDs
    const { data: occasionData, error: occasionError } = await typeSafeDatabaseService.getClient()
      .from('product_occasions')
      .select('occasion_id')
      .eq('product_id', id);

    if (occasionError) {
      throw new Error(`Failed to fetch product occasions: ${occasionError.message}`);
    }

    const occasionIds = ((occasionData ?? []) as { occasion_id: number }[]).map(row => row.occasion_id);

    return {
      ...product,
      occasion_ids: occasionIds
    };
  }

  /**
   * Handle carousel order reorganization when inserting/updating
   * Note: This method is now handled by the PostgreSQL function update_carousel_order_atomic
   * Keeping for backward compatibility but it now delegates to the atomic function
   */
  private reorganizeCarouselOrder(desiredOrder: number, _excludeProductId?: number): Promise<void> {
    // This method is now deprecated - carousel reorganization is handled
    // atomically by the PostgreSQL function update_carousel_order_atomic
        // _excludeProductId is kept for backward compatibility but not used
    return Promise.resolve();
  }

  /**
   * Create new product (admin only)
   */
  public async createProduct(productData: ProductCreateRequest): Promise<Product> {
    const { stock, featured, carousel_order, sku, occasion_ids, ...restData } = productData;

    // Debug log to see what we're receiving
    console.warn('ProductService.createProduct received data:', JSON.stringify(productData, null, 2));

    // Handle carousel reorganization if carousel_order is provided
    if (carousel_order && carousel_order > 0) {
              await this.reorganizeCarouselOrder(carousel_order);
    }

    // Prepare insert data according to actual schema (excluding occasion_ids)
    const insertData = {
      ...restData,
      stock,
      sku: sku ?? undefined,
      featured: featured ?? false,
      active: true,
      carousel_order: carousel_order ?? undefined
    };

    // Use transaction to ensure data integrity
    let createdProduct: Product;

    if (occasion_ids && occasion_ids.length > 0) {
              // Execute within a single transaction
      const data = await typeSafeDatabaseService.executeRpc('create_product_with_occasions', {
        product_data: insertData,
        occasion_ids
      });

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('No data returned from transaction');
      }

      createdProduct = data[0] as Product;
            } else {
      // Simple product creation without occasions
      const { data, error } = await typeSafeDatabaseService.getClient()
        .from('products')
        .insert(insertData as ProductInsert)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create product: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from product creation');
      }

      createdProduct = data as Product;
            }

    return createdProduct;
  }

  /**
   * Update product (admin only)
   */
  public async updateProduct(updateData: ProductUpdateRequest): Promise<Product> {
    const { id, stock, active, featured, carousel_order, ...updates } = updateData;

    // Handle carousel reorganization if carousel_order is being changed
    if (carousel_order !== undefined) {
      if (carousel_order && carousel_order > 0) {
                  await this.reorganizeCarouselOrder(carousel_order, id);
      }
    }

    const updatePayload: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>> = {
      ...updates
    };

    if (stock !== undefined) {
      updatePayload.stock = stock;
    }
    if (active !== undefined) {
      updatePayload.active = active;
    }
    if (featured !== undefined) {
      updatePayload.featured = featured;
    }
    if (carousel_order !== undefined) {
      updatePayload.carousel_order = carousel_order ?? undefined;
    }

    const { data, error } = await typeSafeDatabaseService.getClient()
      .from('products')
      .update(updatePayload as Partial<Product>)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from product update');
    }

    return data as Product;
  }

  /**
   * Update carousel order for product (admin only) using transaction
   * Enables/disables product in carousel by setting/clearing carousel_order
   */
  public async updateCarouselOrder(productId: number, carouselOrder: number | null): Promise<Product> {
    // Use PostgreSQL function for atomic carousel order update
    const data = await typeSafeDatabaseService.executeRpc('update_carousel_order_atomic', {
      product_id: productId,
      new_order: carouselOrder
    });

    if (!data) {
      throw new Error('No data returned from carousel order update transaction');
    }

    return data as Product;
  }

  /**
   * Get featured products
   */
  public async getFeaturedProducts(limit = 8): Promise<ProductWithImages[]> {
    const response = await this.getProducts({
      featured: true,
      limit,
      sort_by: 'created_at',
      sort_direction: 'desc'
    });

    return response.products;
  }

  /**
   * Search products by name or description
   */
  public async searchProducts(searchTerm: string, limit = 20): Promise<ProductWithImages[]> {
    const response = await this.getProducts({
      search: searchTerm,
      limit,
      sort_by: 'name',
      sort_direction: 'asc'
    });

    return response.products;
  }

  /**
   * Delete product (conditional logic)
   * Performs logical deletion if product has references, physical deletion if not
   */
  public async deleteProduct(productId: number): Promise<void> {
    // Check if product exists
    const product = await this.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check for references in related tables
    const hasReferences = await this.checkProductReferences(productId);

    if (hasReferences) {
      // Logical deletion - just deactivate
      const { error } = await typeSafeDatabaseService.getClient()
        .from('products')
        .update({
          active: false,
          updated_at: new Date().toISOString()
        } as Partial<Product>)
        .eq('id', productId);

      if (error) {
        throw new Error(`Failed to deactivate product: ${error.message}`);
      }

      console.warn(`✅ Product ${productId} deactivated (has references)`);
    } else {
      // Physical deletion - safe to delete
      const { error } = await typeSafeDatabaseService.getClient()
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw new Error(`Failed to delete product: ${error.message}`);
      }

      console.warn(`✅ Product ${productId} physically deleted (no references)`);
    }
  }

  /**
   * Check if product has references in related tables
   */
  private async checkProductReferences(productId: number): Promise<boolean> {
    // Check product_images table
    const { data: images, error: imagesError } = await typeSafeDatabaseService.getClient()
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (imagesError) {
      throw new Error(`Failed to check product images: ${imagesError.message}`);
    }

    if (images && images.length > 0) {
      return true;
    }

    // Check product_occasions table
    const { data: occasions, error: occasionsError } = await typeSafeDatabaseService.getClient()
      .from('product_occasions')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (occasionsError) {
      throw new Error(`Failed to check product occasions: ${occasionsError.message}`);
    }

    if (occasions && occasions.length > 0) {
      return true;
    }

    // Check order_items table (if orders exist)
    const { data: orderItems, error: orderItemsError } = await typeSafeDatabaseService.getClient()
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (orderItemsError) {
      // If order_items table doesn't exist yet, continue
            } else if (orderItems && orderItems.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Convert database image path to Supabase storage URL
   * @param dbPath - Image path stored in database
   * @returns Full Supabase storage URL
   */
  private getSupabaseImageUrl(dbPath: string): string {
    // If already a full URL, return as is
    if (dbPath.startsWith('http')) {
      return dbPath;
    }

    // Get Supabase URL from environment
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('SUPABASE_URL not configured, using placeholder');
      return '/images/placeholder-product.webp';
    }

    // Remove leading slash if present
    const cleanPath = dbPath.startsWith('/') ? dbPath.slice(1) : dbPath;

    // Construct Supabase storage URL
    // Format: https://project.supabase.co/storage/v1/object/public/product-images/path
    return `${supabaseUrl}/storage/v1/object/public/product-images/${cleanPath}`;
  }
}
