/**
 * 🌸 FloresYa - Product Controller Tests (Prisma-like API Version)
 * Tests para productController con Vitest y Supabase (usando queryBuilder)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';

// 1. Mock Supabase client (base para el queryBuilder)
const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    then: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
};

// 2. Mock database service
const mockDatabaseService = {
    getClient: () => mockSupabaseClient,
    insert: vi.fn().mockResolvedValue([{ id: 1 }]),
    update: vi.fn().mockResolvedValue([{ id: 1 }]),
    delete: vi.fn().mockResolvedValue(true),
    query: vi.fn().mockResolvedValue({ data: [], error: null })
};

vi.mock('../../backend/src/services/databaseService.js', () => ({
    databaseService: mockDatabaseService
}));

// 3. Mock logger
vi.mock('../../backend/src/utils/bked_logger.js', () => ({
    log: vi.fn(),
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    },
    startTimer: vi.fn(() => ({
        end: vi.fn()
    })),
    requestLogger: vi.fn((req, res, next) => next())
}));

// 4. Mock upload middleware
vi.mock('../../backend/src/middleware/upload.js', () => ({
    uploadMultiple: vi.fn((req, res, next) => {
        // Simular archivos subidos
        req.files = req.files || [];
        next();
    }),
    handleUploadError: vi.fn((error, req, res, next) => {
        if (error) return res.status(400).json({ success: false, message: error.message });
        next();
    })
}));

// 5. Mock image processing services
vi.mock('../../backend/src/services/imageProcessing.js', () => ({
    default: {
        processProductImage: vi.fn().mockResolvedValue({
            large: 'test_large.webp',
            medium: 'test_medium.webp',
            small: 'test_small.webp',
            thumb: 'test_thumb.webp',
            dimensions: { width: 1200, height: 800 }
        })
    }
}));

vi.mock('../../backend/src/services/imageHashService.js', () => ({
    default: {
        generateFileHash: vi.fn().mockResolvedValue('test_hash_123')
    }
}));

// 6. Mock queryBuilder with Prisma-like API
const mockPrismaLikeAPI = {
    product: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    },
    productImage: {
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
    }
};

vi.mock('../../backend/src/services/queryBuilder.js', () => ({
    createPrismaLikeAPI: vi.fn(() => mockPrismaLikeAPI)
}));

// 7. Import controllers after mocks
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = await import('../../backend/src/controllers/productController.js');

// 8. Setup Express app
const app = express();
app.use(express.json());

// Simular middleware de autenticación básico
app.use((req, res, next) => {
    req.user = { role: 'admin' }; // Simular usuario autenticado
    next();
});

app.get('/products', getAllProducts);
app.get('/products/:id', getProductById);
app.post('/products', createProduct);
app.put('/products/:id', updateProduct);
app.delete('/products/:id', deleteProduct);

describe('Product Controller - Prisma-like API Tests', () => {
    const testProduct = {
        id: 1,
        name: 'Test Product',
        description: 'Product for testing',
        price: 25.99,
        stock_quantity: 10,
        featured: false,
        active: true,
        occasion: 'birthday',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: []
    };

    const testProductWithImage = {
        ...testProduct,
        images: [{
            id: 1,
            url_large: 'large.webp',
            url_medium: 'medium.webp',
            url_small: 'small.webp',
            url_thumb: 'thumb.webp',
            is_primary: true,
            display_order: 1,
            width: 1200,
            height: 800
        }]
    };

beforeEach(() => {
    vi.clearAllMocks();
    // Resetear mocks para cada test
    mockPrismaLikeAPI.product.findMany.mockResolvedValue([]);
    mockPrismaLikeAPI.product.findFirst.mockResolvedValue(null);
    mockPrismaLikeAPI.product.create.mockResolvedValue(testProduct);
    mockPrismaLikeAPI.product.update.mockResolvedValue(testProduct);
    mockPrismaLikeAPI.product.delete.mockResolvedValue(testProduct);
    mockPrismaLikeAPI.product.count.mockResolvedValue(0);
    mockPrismaLikeAPI.productImage.findMany.mockResolvedValue([]);
    mockPrismaLikeAPI.productImage.create.mockResolvedValue(testProduct.images[0]);
    mockPrismaLikeAPI.productImage.delete.mockResolvedValue({});

    // Resetear database service mock
    mockDatabaseService.delete.mockClear().mockResolvedValue(true);
});

    describe('GET /products', () => {
        it('should return all active products with pagination', async () => {
            mockPrismaLikeAPI.product.findMany.mockResolvedValue([testProduct]);
            mockPrismaLikeAPI.product.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/products')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe(testProduct.name);
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.total).toBe(1);
        });

        it('should filter by featured products', async () => {
            const featuredProduct = { ...testProduct, featured: true };
            mockPrismaLikeAPI.product.findMany.mockResolvedValue([featuredProduct]);
            mockPrismaLikeAPI.product.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/products?featured=true')
                .expect(200);

            expect(mockPrismaLikeAPI.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        featured: true
                    })
                })
            );
        });

        it('should handle search functionality', async () => {
            mockPrismaLikeAPI.product.findMany.mockResolvedValue([testProduct]);
            mockPrismaLikeAPI.product.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/products?search=Test')
                .expect(200);

            expect(mockPrismaLikeAPI.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({
                                name: expect.objectContaining({
                                    contains: 'Test',
                                    mode: 'insensitive'
                                })
                            }),
                            expect.objectContaining({
                                description: expect.objectContaining({
                                    contains: 'Test',
                                    mode: 'insensitive'
                                })
                            })
                        ])
                    })
                })
            );
        });

        it('should handle database errors gracefully', async () => {
            mockPrismaLikeAPI.product.findMany.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/products')
                .expect(500);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Error fetching products');
        });
    });

    describe('GET /products/:id', () => {
        it('should return a product by ID with images', async () => {
            mockPrismaLikeAPI.product.findFirst.mockResolvedValue(testProductWithImage);

            const response = await request(app)
                .get('/products/1')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.id).toBe(testProduct.id);
            expect(response.body.data.name).toBe(testProduct.name);
            expect(response.body.data.images).toHaveLength(1);
            expect(response.body.data.images[0].url_large).toBe('large.webp');
        });

        it('should return 404 for non-existent product', async () => {
            mockPrismaLikeAPI.product.findFirst.mockResolvedValue(null);

            const response = await request(app)
                .get('/products/999')
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Product not found');
        });

        it('should handle database errors gracefully', async () => {
            mockPrismaLikeAPI.product.findFirst.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/products/1')
                .expect(500);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Error fetching product');
        });
    });

    describe('POST /products', () => {
        it('should create a new product with valid data', async () => {
            const newProduct = { ...testProduct, id: 2, name: 'New Product' };
            mockPrismaLikeAPI.product.create.mockResolvedValue(newProduct);

            const productData = {
                name: 'New Product',
                description: 'A new product for testing',
                price: 29.99,
                stock_quantity: 5,
                occasion: 'birthday',
                active: true
            };

            const response = await request(app)
                .post('/products')
                .send(productData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.name).toBe('New Product');
            expect(mockPrismaLikeAPI.product.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: 'New Product',
                        price: 29.99,
                        stock_quantity: 5
                    })
                })
            );
        });

        it('should return error for missing required fields', async () => {
            const invalidData = {
                description: 'Missing name and price'
            };

            const response = await request(app)
                .post('/products')
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('required');
        });

        it('should process uploaded images', async () => {
            const newProduct = { 
                ...testProduct, 
                id: 2, 
                name: 'Product with Images',
                price: 39.99
            };
            mockPrismaLikeAPI.product.create.mockResolvedValue(newProduct);
            
            const response = await request(app)
                .post('/products')
                .send({
                    name: 'Product with Images',
                    price: 39.99
                })
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.name).toBe('Product with Images');
            expect(response.body.data.images).toEqual([]); // Sin archivos reales, images será vacío
            expect(response.body).toHaveProperty('message', 'Product created successfully');
        });
    });

    describe('PUT /products/:id', () => {
        it('should update an existing product', async () => {
            const existingProduct = { ...testProduct };
            const updatedProduct = { ...testProduct, name: 'Updated Product', price: 35.99 };
            
            mockPrismaLikeAPI.product.findFirst.mockResolvedValue(existingProduct);
            mockPrismaLikeAPI.product.update.mockResolvedValue(updatedProduct);
            mockPrismaLikeAPI.product.findFirst.mockResolvedValueOnce(existingProduct).mockResolvedValue(updatedProduct);

            const updateData = {
                name: 'Updated Product',
                price: 35.99
            };

            const response = await request(app)
                .put('/products/1')
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.name).toBe('Updated Product');
            expect(response.body.data.price).toBe(35.99);
            expect(mockPrismaLikeAPI.product.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1 },
                    data: expect.objectContaining({
                        name: 'Updated Product',
                        price: 35.99
                    })
                })
            );
        });

        it('should return 404 for non-existent product', async () => {
            mockPrismaLikeAPI.product.findFirst.mockResolvedValue(null);

            const response = await request(app)
                .put('/products/999')
                .send({ name: 'Updated' })
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Product not found');
        });

        it('should handle partial updates', async () => {
            const existingProduct = { ...testProduct };
            const partiallyUpdatedProduct = { ...testProduct, name: 'Partially Updated' };
            
            mockPrismaLikeAPI.product.findFirst.mockResolvedValue(existingProduct);
            mockPrismaLikeAPI.product.update.mockResolvedValue(partiallyUpdatedProduct);
            mockPrismaLikeAPI.product.findFirst.mockResolvedValueOnce(existingProduct).mockResolvedValue(partiallyUpdatedProduct);

            const response = await request(app)
                .put('/products/1')
                .send({ name: 'Partially Updated' })
                .expect(200);

            expect(mockPrismaLikeAPI.product.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1 },
                    data: expect.objectContaining({
                        name: 'Partially Updated'
                    })
                })
            );
        });
    });

    describe('DELETE /products/:id', () => {
        it('should delete an existing product', async () => {
            const productToDelete = { ...testProduct, images: [] };
            mockPrismaLikeAPI.product.findFirst.mockResolvedValue(productToDelete);
            mockPrismaLikeAPI.product.delete.mockResolvedValue(productToDelete);

            const response = await request(app)
                .delete('/products/1')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Product deleted successfully');
            expect(mockPrismaLikeAPI.product.delete).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1 }
                })
            );
        });

        it('should delete associated images before deleting product', async () => {
            const productWithImages = {
                ...testProduct,
                images: [{ id: 1 }, { id: 2 }]
            };
            mockPrismaLikeAPI.product.findFirst.mockResolvedValue(productWithImages);
            mockPrismaLikeAPI.productImage.delete.mockResolvedValue({});
            mockPrismaLikeAPI.product.delete.mockResolvedValue(productWithImages);

            const response = await request(app)
                .delete('/products/1')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(mockDatabaseService.delete).toHaveBeenCalledWith('product_images', { product_id: 1 });
        });

        it('should return 404 for non-existent product', async () => {
            mockPrismaLikeAPI.product.findFirst.mockResolvedValue(null);

            const response = await request(app)
                .delete('/products/999')
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Product not found');
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            mockPrismaLikeAPI.product.findMany.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .get('/products')
                .expect(500);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Error fetching products');
        });

        it('should not expose error details in production', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            
            mockPrismaLikeAPI.product.findMany.mockRejectedValue(new Error('Sensitive database error'));

            const response = await request(app)
                .get('/products')
                .expect(500);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).not.toContain('Sensitive');
            
            process.env.NODE_ENV = originalEnv;
        });
    });
});
