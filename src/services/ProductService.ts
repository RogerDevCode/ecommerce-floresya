/**
 * 🌸 FloresYa Product Service - Enterprise TypeScript Edition
 * Implements new carousel_order logic with optimal performance
 */

import { supabaseService } from '../config/supabase.js';
import type {
  Product,
  ProductWithImages,
  CarouselProduct,
  ProductQuery,
  ProductResponse,
  CarouselResponse,
  ProductCreateRequest,
  ProductUpdateRequest,
  ImageSize,
  ProductImage,
  RawCarouselProduct,
  RawProductWithImages
} from '../config/supabase.js';

export class ProductService {
  /**
   * Get carousel products with their primary thumb images
   * Optimized query to fetch only carousel products and their primary thumb images
   */
  public async getCarouselProducts(): Promise<CarouselResponse> {
    try {
      // Get products with carousel_order
      const { data: productsData, error: productsError } = await supabaseService
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
          carousel_products: [],
          total_count: 0
        };
      }

      // Get primary thumb images AND all small images for these products
      const productIds = productsData.map(p => p.id);

      // Get primary thumb for carousel display
      const { data: thumbData, error: thumbError } = await supabaseService
        .from('product_images')
        .select('product_id, url')
        .in('product_id', productIds)
        .eq('is_primary', true)
        .eq('size', 'thumb');

      if (thumbError) {
        throw new Error(`Failed to fetch thumb images: ${thumbError.message}`);
      }

      // Get all small images for hover effect
      const { data: smallImagesData, error: smallImagesError } = await supabaseService
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
      (thumbData || []).forEach(img => {
        thumbMap.set(img.product_id, img.url);
      });

      const smallImagesMap = new Map<number, Array<{url: string, image_index: number}>>();
      (smallImagesData || []).forEach(img => {
        if (!smallImagesMap.has(img.product_id)) {
          smallImagesMap.set(img.product_id, []);
        }
        smallImagesMap.get(img.product_id)!.push({
          url: img.url,
          image_index: img.image_index
        });
      });

      // Build carousel products with images for hover effect
      const carouselProducts: CarouselProduct[] = productsData.map((product) => {
        const thumbUrl = thumbMap.get(product.id);
        const smallImages = smallImagesMap.get(product.id) || [];

        // Use actual image URL if available, fallback to placeholder
        const finalThumbUrl = thumbUrl || '/images/placeholder-product.webp';

        // Sort small images by image_index and extract URLs
        const sortedSmallImages = smallImages
          .sort((a, b) => a.image_index - b.image_index)
          .map(img => ({ url: img.url, size: 'small' as ImageSize }));

        return {
          id: product.id,
          name: product.name,
          summary: product.summary || undefined,
          price_usd: product.price_usd,
          carousel_order: product.carousel_order as number,
          primary_thumb_url: finalThumbUrl,
          images: sortedSmallImages // Agregar imágenes small para hover
        };
      });

      return {
        carousel_products: carouselProducts,
        total_count: carouselProducts.length
      };
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
        occasion_id,
        occasion,
        category,
        featured,
        active = true,
        has_carousel_order,
        sort_by = 'created_at',
        sort_direction = 'desc'
      } = query;

      const offset = (page - 1) * limit;

      let queryBuilder = supabaseService
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
      if (occasion_id) {
        // Get product IDs for this occasion
        const { data: productIds, error: productIdsError } = await supabaseService
          .from('product_occasions')
          .select('product_id')
          .eq('occasion_id', occasion_id);

        if (productIdsError) {
          throw new Error(`Error filtering by occasion: ${productIdsError.message}`);
        }

        if (productIds && productIds.length > 0) {
          const ids = productIds.map(row => row.product_id);
          queryBuilder = queryBuilder.in('id', ids);
        } else {
          // No products for this occasion - return empty result
          queryBuilder = queryBuilder.eq('id', -1); // Non-existent ID
        }
      } else if (occasion) {
        // Filter by occasion slug - resolve slug to ID first
        const { data: occasionData, error: occasionError } = await supabaseService
          .from('occasions')
          .select('id')
          .eq('slug', occasion)
          .single();

        if (occasionError || !occasionData) {
          throw new Error(`Invalid occasion slug: ${occasion}`);
        }

        // Get product IDs for this occasion
        const { data: productIds, error: productIdsError } = await supabaseService
          .from('product_occasions')
          .select('product_id')
          .eq('occasion_id', occasionData.id);

        if (productIdsError) {
          throw new Error(`Error filtering by occasion: ${productIdsError.message}`);
        }

        if (productIds && productIds.length > 0) {
          const ids = productIds.map(row => row.product_id);
          queryBuilder = queryBuilder.in('id', ids);
        } else {
          // No products for this occasion - return empty result
          queryBuilder = queryBuilder.eq('id', -1); // Non-existent ID
        }
      }

      if (category) {
        queryBuilder = queryBuilder.ilike('category', `%${category}%`);
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
      const productIds = (data as RawProductWithImages[] || []).map(p => p.id);

      // Get all medium images for hover effect
      const { data: mediumImagesData, error: mediumImagesError } = await supabaseService
        .from('product_images')
        .select('product_id, url, image_index')
        .in('product_id', productIds)
        .eq('size', 'medium')
        .order('image_index', { ascending: true });

      if (mediumImagesError) {
        console.error('Error fetching medium images:', mediumImagesError);
      }

      // Group medium images by product_id
      const mediumImagesByProduct = (mediumImagesData || []).reduce((acc, img) => {
        if (!acc[img.product_id]) {
          acc[img.product_id] = [];
        }
        acc[img.product_id]?.push(img.url);
        return acc;
      }, {} as Record<number, string[]>);

      const productsWithImages: ProductWithImages[] = (data as RawProductWithImages[] || []).map((product) => {
        const sortedImages = (product.product_images || []).sort((a: ProductImage, b: ProductImage) => a.image_index - b.image_index);
        const mediumImages = mediumImagesByProduct[product.id] || [];

        return {
          ...product,
          images: sortedImages,
          primary_image: sortedImages.find((img) => img.is_primary),
          medium_images: mediumImages // Agregar imágenes medium para hover
        } as ProductWithImages & { medium_images: string[] };
      });

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        products: productsWithImages,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: count || 0,
          items_per_page: limit
        }
      };
    } catch (error) {
      console.error('ProductService.getProducts error:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID with images
   */
  public async getProductById(id: number): Promise<ProductWithImages | null> {
    try {
      const { data, error } = await supabaseService
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
      const sortedImages = (rawProduct.product_images || []).sort((a: ProductImage, b: ProductImage) => a.image_index - b.image_index);

      const productWithImages: ProductWithImages = {
        ...rawProduct,
        images: sortedImages,
        primary_image: sortedImages.find((img) => img.is_primary)
      };

      return productWithImages;
    } catch (error) {
      console.error('ProductService.getProductById error:', error);
      throw error;
    }
  }

  /**
   * Create new product (admin only)
   */
  public async createProduct(productData: ProductCreateRequest): Promise<Product> {
    try {
      const { stock, featured, ...restData } = productData;
      const insertData = {
        ...restData,
        stock: stock,
        featured: featured || false,
        active: true
      };

      const { data, error } = await supabaseService
        .from('products')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create product: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from product creation');
      }

      return data as Product;
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
      const { id, stock, active, featured, ...updates } = updateData;

      const updatePayload: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>> = {
        ...updates,
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

      const { data, error } = await supabaseService
        .from('products')
        .update(updatePayload)
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
   * Update carousel order for product (admin only)
   * Enables/disables product in carousel by setting/clearing carousel_order
   */
  public async updateCarouselOrder(productId: number, carouselOrder: number | null): Promise<Product> {
    try {
      const updatePayload = {
        carousel_order: carouselOrder,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseService
        .from('products')
        .update(updatePayload)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update carousel order: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from carousel order update');
      }

      return data;
    } catch (error) {
      console.error('ProductService.updateCarouselOrder error:', error);
      throw error;
    }
  }

  /**
   * Get featured products
   */
  public async getFeaturedProducts(limit: number = 8): Promise<ProductWithImages[]> {
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
  public async searchProducts(searchTerm: string, limit: number = 20): Promise<ProductWithImages[]> {
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
}