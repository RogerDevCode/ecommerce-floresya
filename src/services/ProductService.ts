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
  type ProductQuery,
  type ProductResponse,
  type ProductUpdateRequest,
  type ProductWithImages,
  type RawProductWithImages
} from '@shared/types';

// Import consolidated utility function
import { omitFunction as _omitFunction } from '@shared/utils';

import { typeSafeDatabaseService } from './TypeSafeDatabaseService.js';

// Using TypeSafeDatabaseService for type-safe operations

export class ProductService {
  /**
   * Get carousel products with their primary thumb images
   * Optimized query to fetch only carousel products and their primary thumb images
   */
  public async getCarouselProducts(): Promise<CarouselResponse> {
    try {
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

      // Get primary thumb images AND all small images for these products
      const productIds = (productsData as { id: number }[]).map(p => p.id);

      // Get primary thumb for carousel display
      const { data: thumbData, error: thumbError } = await typeSafeDatabaseService.getClient()
        .from('product_images')
        .select('product_id, url')
        .in('product_id', productIds)
        .eq('is_primary', true)
        .eq('size', 'thumb');

      if (thumbError) {
        throw new Error(`Failed to fetch thumb images: ${thumbError.message}`);
      }

      // Get all small images for hover effect
      const { data: smallImagesData, error: smallImagesError } = await typeSafeDatabaseService.getClient()
        .from('product_images')
        .select('product_id, url, image_index')
        .in('product_id', productIds)
        .eq('size', 'small')
        .order('image_index', { ascending: true });

      if (smallImagesError) {
        throw new Error(`Failed to fetch small images: ${smallImagesError.message}`);
      }

      // Create maps for primary thumbs and small images
      const thumbMap = new Map<number, string>();
      (thumbData as Array<{product_id: number, url: string}> ?? []).forEach(img => {
        thumbMap.set(img.product_id, img.url);
      });

      const smallImagesMap = new Map<number, Array<{url: string, image_index: number}>>();
      (smallImagesData as Array<{product_id: number, url: string, image_index: number}> ?? []).forEach(img => {
        if (!smallImagesMap.has(img.product_id)) {
          smallImagesMap.set(img.product_id, []);
        }
        const productImages = smallImagesMap.get(img.product_id);
        if (productImages) {
          productImages.push({
            url: img.url,
            image_index: img.image_index
          });
        }
      });

      // Build carousel products with images for hover effect
      const carouselProducts: CarouselProduct[] = (productsData as Array<{id: number, name: string, summary?: string, price_usd: number, carousel_order: number}>).map((product) => {
        const thumbUrl = thumbMap.get(product.id);
        const smallImages = smallImagesMap.get(product.id) ?? [];

        // Use actual image URL if available, fallback to placeholder
        const finalThumbUrl = thumbUrl ?? '/images/placeholder-product.webp';

        // Sort small images by image_index and extract URLs
        const sortedSmallImages = smallImages
          .sort((a, b) => a.image_index - b.image_index)
          .map(img => ({ url: img.url, size: 'small' as ImageSize }));

        return {
          id: product.id,
          name: product.name,
          summary: product.summary ?? undefined,
          price_usd: product.price_usd,
          carousel_order: product.carousel_order,
          primary_thumb_url: finalThumbUrl,
          images: sortedSmallImages // Agregar imágenes small para hover
        };
      });

      return {
        products: carouselProducts,
        total_count: carouselProducts.length
      } as CarouselResponse;
    } catch (error) {
      console.error('ProductService.getCarouselProducts error:', error);
      throw error;
    }
  }

  /**
   * Get all products with advanced filtering
   */
  public async getProducts(query: ProductQuery = {}): Promise<ProductResponse> {
    try {
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
            image_index,
            size,
            url,
            file_hash,
            mime_type,
            is_primary
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
          const ids = (productIds as any[]).map((row: any) => row.product_id);
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
        console.error('Error fetching medium images:', mediumImagesError);
      }

      // Group medium images by product_id
      const mediumImagesByProduct: Record<number, string[]> = (mediumImagesData as Array<{product_id: number, url: string, image_index: number}> ?? []).reduce((acc: Record<number, string[]>, img) => {
        acc[img.product_id] ??= [];
        acc[img.product_id]?.push(img.url);
        return acc;
      }, {} as Record<number, string[]>);

      const productsWithImages: ProductWithImages[] = (data as RawProductWithImages[] ?? []).map((product) => {
        const sortedImages = (product.product_images ?? []).sort((a: ProductImage, b: ProductImage) => a.image_index - b.image_index);
        const mediumImages = mediumImagesByProduct[product.id] ?? [];

        const { product_images: _product_images, ...productWithoutImages } = product;
        return {
          ...productWithoutImages,
          images: sortedImages,
          primary_image_url: sortedImages.find((img) => img.is_primary)?.url,
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
    } catch (error) {
      console.error('ProductService.getProducts error:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID with images and occasions
   */
  public async getProductById(id: number): Promise<ProductWithImages | null> {
    try {
      const { data, error } = await typeSafeDatabaseService.getClient()
        .from('products')
        .select(`
          *,
          product_images(
            id,
            image_index,
            size,
            url,
            file_hash,
            mime_type,
            is_primary
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
    } catch (error) {
      console.error('ProductService.getProductById error:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID with images and occasions for editing
   */
  public async getProductByIdWithOccasions(id: number): Promise<ProductWithImages & { occasion_ids: number[] } | null> {
    try {
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
    } catch (error) {
      console.error('ProductService.getProductByIdWithOccasions error:', error);
      throw error;
    }
  }

  /**
   * Handle carousel order reorganization when inserting/updating
   * Note: This method is now handled by the PostgreSQL function update_carousel_order_atomic
   * Keeping for backward compatibility but it now delegates to the atomic function
   */
  private reorganizeCarouselOrder(desiredOrder: number, _excludeProductId?: number): Promise<void> {
    // This method is now deprecated - carousel reorganization is handled
    // atomically by the PostgreSQL function update_carousel_order_atomic
    console.warn(`🔄 Carousel reorganization delegated to PostgreSQL function for position ${desiredOrder}`);
    // _excludeProductId is kept for backward compatibility but not used
    return Promise.resolve();
  }

  /**
   * Create new product (admin only)
   */
  public async createProduct(productData: ProductCreateRequest): Promise<Product> {
    try {
      const { stock, featured, carousel_order, sku, occasion_ids, ...restData } = productData;

      // Debug log to see what we're receiving
      console.warn('ProductService.createProduct received data:', JSON.stringify(productData, null, 2));

      // Handle carousel reorganization if carousel_order is provided
      if (carousel_order && carousel_order > 0) {
        console.warn(`🔄 Reorganizing carousel for new product at position ${carousel_order}`);
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
        console.warn(`🔄 Using transaction for product creation with ${occasion_ids.length} occasion associations`);

        // Execute within a single transaction
        const data = await typeSafeDatabaseService.executeRpc('create_product_with_occasions', {
          product_data: insertData,
          occasion_ids
        });

        if (!data || (data as any)?.length === 0) {
          throw new Error('No data returned from transaction');
        }

        createdProduct = data[0] as Product;
        console.warn(`✅ Successfully created product ${createdProduct.id} with occasion associations via transaction`);
      } else {
        // Simple product creation without occasions
        console.warn('🔄 Creating product without occasion associations');

        const { data, error } = await typeSafeDatabaseService.getClient()
          .from('products')
          .insert(insertData as any)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create product: ${error.message}`);
        }

        if (!data) {
          throw new Error('No data returned from product creation');
        }

        createdProduct = data as Product;
        console.warn(`✅ Successfully created product ${createdProduct.id} without occasions`);
      }

      return createdProduct;
    } catch (error) {
      console.error('ProductService.createProduct error:', error);
      throw error;
    }
  }

  /**
   * Update product (admin only)
   */
  public async updateProduct(updateData: ProductUpdateRequest): Promise<Product> {
    try {
      const { id, stock, active, featured, carousel_order, ...updates } = updateData;

      // Handle carousel reorganization if carousel_order is being changed
      if (carousel_order !== undefined) {
        if (carousel_order && carousel_order > 0) {
          console.warn(`🔄 Reorganizing carousel for product ${id} to position ${carousel_order}`);
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
        .update(updatePayload as any)
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
    } catch (error) {
      console.error('ProductService.updateProduct error:', error);
      throw error;
    }
  }

  /**
   * Update carousel order for product (admin only) using transaction
   * Enables/disables product in carousel by setting/clearing carousel_order
   */
  public async updateCarouselOrder(productId: number, carouselOrder: number | null): Promise<Product> {
    try {
      // Use PostgreSQL function for atomic carousel order update
      const data = await typeSafeDatabaseService.executeRpc('update_carousel_order_atomic', {
        product_id: productId,
        new_order: carouselOrder
      });

      if (!data) {
        throw new Error('No data returned from carousel order update transaction');
      }

      return data as Product;
    } catch (error) {
      console.error('ProductService.updateCarouselOrder error:', error);
      throw error;
    }
  }

  /**
   * Get featured products
   */
  public async getFeaturedProducts(limit = 8): Promise<ProductWithImages[]> {
    try {
      const response = await this.getProducts({
        featured: true,
        limit,
        sort_by: 'created_at',
        sort_direction: 'desc'
      });

      return response.products;
    } catch (error) {
      console.error('ProductService.getFeaturedProducts error:', error);
      throw error;
    }
  }

  /**
   * Search products by name or description
   */
  public async searchProducts(searchTerm: string, limit = 20): Promise<ProductWithImages[]> {
    try {
      const response = await this.getProducts({
        search: searchTerm,
        limit,
        sort_by: 'name',
        sort_direction: 'asc'
      });

      return response.products;
    } catch (error) {
      console.error('ProductService.searchProducts error:', error);
      throw error;
    }
  }

  /**
   * Delete product (conditional logic)
   * Performs logical deletion if product has references, physical deletion if not
   */
  public async deleteProduct(productId: number): Promise<void> {
    try {
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
          } as any)
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
    } catch (error) {
      console.error('ProductService.deleteProduct error:', error);
      throw error;
    }
  }

  /**
   * Check if product has references in related tables
   */
  private async checkProductReferences(productId: number): Promise<boolean> {
    try {
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
        console.warn('Order items table may not exist yet:', orderItemsError.message);
      } else if (orderItems && orderItems.length > 0) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking product references:', error);
      throw error;
    }
  }
}
