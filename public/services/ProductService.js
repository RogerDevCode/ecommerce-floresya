import { supabaseService } from '../config/supabase.js';
export class ProductService {
    async getCarouselProducts() {
        try {
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
            const productIds = productsData.map(p => p.id);
            const { data: thumbData, error: thumbError } = await supabaseService
                .from('product_images')
                .select('product_id, url')
                .in('product_id', productIds)
                .eq('is_primary', true)
                .eq('size', 'thumb');
            if (thumbError) {
                throw new Error(`Failed to fetch thumb images: ${thumbError.message}`);
            }
            const { data: smallImagesData, error: smallImagesError } = await supabaseService
                .from('product_images')
                .select('product_id, url, image_index')
                .in('product_id', productIds)
                .eq('size', 'small')
                .order('image_index', { ascending: true });
            if (smallImagesError) {
                throw new Error(`Failed to fetch small images: ${smallImagesError.message}`);
            }
            const thumbMap = new Map();
            (thumbData ?? []).forEach(img => {
                thumbMap.set(img.product_id, img.url);
            });
            const smallImagesMap = new Map();
            (smallImagesData ?? []).forEach(img => {
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
            const carouselProducts = productsData.map((product) => {
                const thumbUrl = thumbMap.get(product.id);
                const smallImages = smallImagesMap.get(product.id) ?? [];
                const finalThumbUrl = thumbUrl ?? '/images/placeholder-product.webp';
                const sortedSmallImages = smallImages
                    .sort((a, b) => a.image_index - b.image_index)
                    .map(img => ({ url: img.url, size: 'small' }));
                return {
                    id: product.id,
                    name: product.name,
                    summary: product.summary ?? undefined,
                    price_usd: product.price_usd,
                    carousel_order: product.carousel_order,
                    primary_thumb_url: finalThumbUrl,
                    images: sortedSmallImages
                };
            });
            return {
                carousel_products: carouselProducts,
                total_count: carouselProducts.length
            };
        }
        catch (error) {
            console.error('ProductService.getCarouselProducts error:', error);
            throw error;
        }
    }
    async getProducts(query = {}) {
        try {
            const { page = 1, limit = 20, search, occasion, featured, active = true, has_carousel_order, sort_by = 'created_at', sort_direction = 'desc' } = query;
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
            if (search) {
                queryBuilder = queryBuilder.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
            }
            if (occasion) {
                const { data: occasionData, error: occasionError } = await supabaseService
                    .from('occasions')
                    .select('id')
                    .eq('slug', occasion)
                    .single();
                if (occasionError || !occasionData) {
                    throw new Error(`Invalid occasion slug: ${occasion}`);
                }
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
                }
                else {
                    queryBuilder = queryBuilder.eq('id', -1);
                }
            }
            if (typeof featured === 'boolean') {
                queryBuilder = queryBuilder.eq('featured', featured);
            }
            if (typeof has_carousel_order === 'boolean') {
                if (has_carousel_order) {
                    queryBuilder = queryBuilder.not('carousel_order', 'is', null);
                }
                else {
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
            const productIds = (data ?? []).map(p => p.id);
            const { data: mediumImagesData, error: mediumImagesError } = await supabaseService
                .from('product_images')
                .select('product_id, url, image_index')
                .in('product_id', productIds)
                .eq('size', 'medium')
                .order('image_index', { ascending: true });
            if (mediumImagesError) {
                console.error('Error fetching medium images:', mediumImagesError);
            }
            const mediumImagesByProduct = (mediumImagesData ?? []).reduce((acc, img) => {
                var _a;
                acc[_a = img.product_id] ?? (acc[_a] = []);
                acc[img.product_id]?.push(img.url);
                return acc;
            }, {});
            const productsWithImages = (data ?? []).map((product) => {
                const sortedImages = (product.product_images ?? []).sort((a, b) => a.image_index - b.image_index);
                const mediumImages = mediumImagesByProduct[product.id] ?? [];
                return {
                    ...product,
                    images: sortedImages,
                    primary_image: sortedImages.find((img) => img.is_primary),
                    medium_images: mediumImages
                };
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
        catch (error) {
            console.error('ProductService.getProducts error:', error);
            throw error;
        }
    }
    async getProductById(id) {
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
                    return null;
                }
                throw new Error(`Failed to fetch product: ${error.message}`);
            }
            if (!data) {
                return null;
            }
            const rawProduct = data;
            const sortedImages = (rawProduct.product_images ?? []).sort((a, b) => a.image_index - b.image_index);
            const productWithImages = {
                ...rawProduct,
                images: sortedImages,
                primary_image: sortedImages.find((img) => img.is_primary)
            };
            return productWithImages;
        }
        catch (error) {
            console.error('ProductService.getProductById error:', error);
            throw error;
        }
    }
    async getProductByIdWithOccasions(id) {
        try {
            const product = await this.getProductById(id);
            if (!product) {
                return null;
            }
            const { data: occasionData, error: occasionError } = await supabaseService
                .from('product_occasions')
                .select('occasion_id')
                .eq('product_id', id);
            if (occasionError) {
                throw new Error(`Failed to fetch product occasions: ${occasionError.message}`);
            }
            const occasionIds = (occasionData ?? []).map(row => row.occasion_id);
            return {
                ...product,
                occasion_ids: occasionIds
            };
        }
        catch (error) {
            console.error('ProductService.getProductByIdWithOccasions error:', error);
            throw error;
        }
    }
    async reorganizeCarouselOrder(desiredOrder, _excludeProductId) {
        console.log(`🔄 Carousel reorganization delegated to PostgreSQL function for position ${desiredOrder}`);
    }
    async createProduct(productData) {
        try {
            const { stock, featured, carousel_order, price_ves, sku, occasion_ids, ...restData } = productData;
            console.log('ProductService.createProduct received data:', JSON.stringify(productData, null, 2));
            if (carousel_order && carousel_order > 0) {
                console.log(`🔄 Reorganizing carousel for new product at position ${carousel_order}`);
                await this.reorganizeCarouselOrder(carousel_order);
            }
            const insertData = {
                ...restData,
                price_ves: price_ves ?? undefined,
                stock: stock,
                sku: sku ?? undefined,
                featured: featured ?? false,
                active: true,
                carousel_order: carousel_order ?? undefined
            };
            let createdProduct;
            if (occasion_ids && occasion_ids.length > 0) {
                console.log(`🔄 Using transaction for product creation with ${occasion_ids.length} occasion associations`);
                const { data, error } = await supabaseService.rpc('create_product_with_occasions', {
                    product_data: insertData,
                    occasion_ids: occasion_ids
                });
                if (error) {
                    throw new Error(`Transaction failed: ${error.message}`);
                }
                if (!data || data.length === 0) {
                    throw new Error('No data returned from transaction');
                }
                createdProduct = data[0];
                console.log(`✅ Successfully created product ${createdProduct.id} with occasion associations via transaction`);
            }
            else {
                console.log('🔄 Creating product without occasion associations');
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
                createdProduct = data;
                console.log(`✅ Successfully created product ${createdProduct.id} without occasions`);
            }
            return createdProduct;
        }
        catch (error) {
            console.error('ProductService.createProduct error:', error);
            throw error;
        }
    }
    async updateProduct(updateData) {
        try {
            const { id, stock, active, featured, carousel_order, ...updates } = updateData;
            if (carousel_order !== undefined) {
                if (carousel_order && carousel_order > 0) {
                    console.log(`🔄 Reorganizing carousel for product ${id} to position ${carousel_order}`);
                    await this.reorganizeCarouselOrder(carousel_order, id);
                }
            }
            const updatePayload = {
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
            if (carousel_order !== undefined) {
                updatePayload.carousel_order = carousel_order ?? undefined;
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
            return data;
        }
        catch (error) {
            console.error('ProductService.updateProduct error:', error);
            throw error;
        }
    }
    async updateCarouselOrder(productId, carouselOrder) {
        try {
            const { data, error } = await supabaseService.rpc('update_carousel_order_atomic', {
                product_id: productId,
                new_order: carouselOrder
            });
            if (error) {
                throw new Error(`Failed to update carousel order transaction: ${error.message}`);
            }
            if (!data) {
                throw new Error('No data returned from carousel order update transaction');
            }
            return data;
        }
        catch (error) {
            console.error('ProductService.updateCarouselOrder error:', error);
            throw error;
        }
    }
    async getFeaturedProducts(limit = 8) {
        try {
            const response = await this.getProducts({
                featured: true,
                limit,
                sort_by: 'created_at',
                sort_direction: 'desc'
            });
            return response.products;
        }
        catch (error) {
            console.error('ProductService.getFeaturedProducts error:', error);
            throw error;
        }
    }
    async searchProducts(searchTerm, limit = 20) {
        try {
            const response = await this.getProducts({
                search: searchTerm,
                limit,
                sort_by: 'name',
                sort_direction: 'asc'
            });
            return response.products;
        }
        catch (error) {
            console.error('ProductService.searchProducts error:', error);
            throw error;
        }
    }
    async deleteProduct(productId) {
        try {
            const product = await this.getProductById(productId);
            if (!product) {
                throw new Error('Product not found');
            }
            const hasReferences = await this.checkProductReferences(productId);
            if (hasReferences) {
                const { error } = await supabaseService
                    .from('products')
                    .update({
                    active: false,
                    updated_at: new Date().toISOString()
                })
                    .eq('id', productId);
                if (error) {
                    throw new Error(`Failed to deactivate product: ${error.message}`);
                }
                console.log(`✅ Product ${productId} deactivated (has references)`);
            }
            else {
                const { error } = await supabaseService
                    .from('products')
                    .delete()
                    .eq('id', productId);
                if (error) {
                    throw new Error(`Failed to delete product: ${error.message}`);
                }
                console.log(`✅ Product ${productId} physically deleted (no references)`);
            }
        }
        catch (error) {
            console.error('ProductService.deleteProduct error:', error);
            throw error;
        }
    }
    async checkProductReferences(productId) {
        try {
            const { data: images, error: imagesError } = await supabaseService
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
            const { data: occasions, error: occasionsError } = await supabaseService
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
            const { data: orderItems, error: orderItemsError } = await supabaseService
                .from('order_items')
                .select('id')
                .eq('product_id', productId)
                .limit(1);
            if (orderItemsError) {
                console.warn('Order items table may not exist yet:', orderItemsError.message);
            }
            else if (orderItems && orderItems.length > 0) {
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error checking product references:', error);
            throw error;
        }
    }
}
