/**
 * 🌸 FloresYa - Order Controller Tests
 * Tests para orderController con Vitest y Supabase
 * 
 * @swagger
 * components:
 *   schemas:
 *     OrderTest:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del pedido
 *         customer_name:
 *           type: string
 *           description: Nombre del cliente
 *         customer_email:
 *           type: string
 *           description: Email del cliente
 *         total_amount:
 *           type: number
 *           description: Monto total del pedido
 *         status:
 *           type: string
 *           description: Estado del pedido
 *         payment_method_id:
 *           type: integer
 *           description: ID del método de pago
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock Supabase client with Promise resolution
const mockSupabaseClient = {
    from: vi.fn(() => ({
        select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
            order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({ data: [], error: null }))
            })),
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
    }))
};

// Mock database service  
const mockDatabaseService = {
    getClient: () => mockSupabaseClient,
    count: vi.fn().mockResolvedValue(0),
    insert: vi.fn().mockResolvedValue([{ id: 1 }]),
    update: vi.fn().mockResolvedValue([{ id: 1 }]),
    delete: vi.fn().mockResolvedValue(true),
    query: vi.fn().mockResolvedValue({ data: [], error: null })
};

vi.mock('../../backend/src/services/databaseService.js', () => ({
    databaseService: mockDatabaseService
}));

// Mock logger
vi.mock('../../backend/src/utils/bked_logger.js', () => ({
    log: vi.fn(),
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    },
    startTimer: vi.fn(() => ({
        end: vi.fn()
    }))
}));

// Mock queryBuilder with all required methods
const mockPrismaLikeAPI = {
    order: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    orderItem: {
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
    },
    product: {
        findUnique: vi.fn(),
        update: vi.fn()
    }
};

vi.mock('../../backend/src/services/queryBuilder.js', () => ({
    createPrismaLikeAPI: vi.fn(() => mockPrismaLikeAPI)
}));

// Import controllers after mocks
const { getAllOrders, getOrderById, createOrder, updateOrderStatus, getOrderStats } = await import('../../backend/src/controllers/orderController.js');

// Mock auth middleware
const mockAuth = (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
};

// Setup Express app
const app = express();
app.use(express.json());


app.get('/orders/stats/summary', mockAuth, getOrderStats);
app.get('/orders/admin/all', mockAuth, getAllOrders);
app.get('/orders', getAllOrders); // Direct route for simple tests
app.get('/orders/:id', getOrderById);
app.post('/orders', createOrder);
app.patch('/orders/:id/status', updateOrderStatus);

describe('Order Controller - Supabase Tests', () => {
    const testOrder = {
        id: 1,
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        total_amount: 75.99,
        status: 'pending',
        payment_method_id: 1,
        created_at: new Date(),
        updated_at: new Date()
    };

    const testProduct = {
        id: 1,
        name: 'Test Product',
        price: 25.99,
        stock_quantity: 10
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset basic database service mocks
        mockDatabaseService.count.mockResolvedValue(0);
        mockDatabaseService.insert.mockResolvedValue([{ id: 1 }]);
        mockDatabaseService.update.mockResolvedValue([testOrder]);
        mockDatabaseService.delete.mockResolvedValue(true);
        mockDatabaseService.query.mockResolvedValue({ data: [], error: null });
    });

    describe('GET /orders', () => {
        it('should return all orders with pagination', async () => {
            // Configure mock for the specific query chain
            mockSupabaseClient.from.mockReturnValue({
                select: vi.fn(() => ({
                    order: vi.fn(() => ({
                        range: vi.fn(() => Promise.resolve({ data: [testOrder], error: null }))
                    }))
                }))
            });
            mockDatabaseService.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/orders')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].customer_name).toBe(testOrder.customer_name);
            expect(response.body).toHaveProperty('pagination');
        });

        it('should filter orders by status', async () => {
            // Configure mock for status filter query
            mockSupabaseClient.from.mockReturnValue({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        order: vi.fn(() => ({
                            range: vi.fn(() => Promise.resolve({ data: [testOrder], error: null }))
                        }))
                    }))
                }))
            });
            mockDatabaseService.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/orders?status=pending')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
        });

        it('should filter orders by customer email', async () => {
            mockPrismaLikeAPI.order.findMany.mockResolvedValue([testOrder]);
            mockPrismaLikeAPI.order.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/orders/admin/all?customer_email=john@example.com')
                .expect(200);

            expect(mockPrismaLikeAPI.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        customer_email: expect.objectContaining({
                            ilike: '%john@example.com%'
                        })
                    })
                })
            );
        });

        it('should handle database errors gracefully', async () => {
            mockPrismaLikeAPI.order.findMany.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .get('/orders/admin/all')
                .expect(500);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Error fetching orders');
        });
    });

    describe('GET /orders/:id', () => {
        it('should return an order by ID with full details', async () => {
            const orderWithDetails = {
                ...testOrder,
                order_items: [
                    {
                        id: 1,
                        product_id: 1,
                        quantity: 2,
                        unit_price: 25.99,
                        product: testProduct
                    }
                ],
                payment_method: {
                    id: 1,
                    name: 'Pago Móvil'
                }
            };
            mockPrismaLikeAPI.order.findFirst.mockResolvedValue(orderWithDetails);

            const response = await request(app)
                .get('/orders/1')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.id).toBe(testOrder.id);
            expect(response.body.data.customer_name).toBe(testOrder.customer_name);
            expect(response.body.data.order_items).toHaveLength(1);
        });

        it('should return 404 for non-existent order', async () => {
            mockPrismaLikeAPI.order.findFirst.mockResolvedValue(null);

            const response = await request(app)
                .get('/orders/999')
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Order not found');
        });
    });

    describe('POST /orders', () => {
        it('should create a new order with valid data', async () => {
            const orderData = {
                customer_name: 'Jane Doe',
                customer_email: 'jane@example.com',
                customer_phone: '+58-412-1234567',
                delivery_address: '123 Main St, Caracas',
                payment_method_id: 1,
                items: [
                    {
                        product_id: 1,
                        quantity: 2,
                        unit_price: 25.99
                    }
                ]
            };

            const newOrder = { ...testOrder, id: 2, customer_name: 'Jane Doe' };
            
            // Mock databaseService.query for product lookup
            mockDatabaseService.query.mockResolvedValue({ 
                data: [{ 
                    id: 1, 
                    name: 'Test Product', 
                    price: 25.99, 
                    stock_quantity: 10, 
                    active: true 
                }], 
                error: null 
            });
            
            // Mock databaseService.insert for order creation
            mockDatabaseService.insert
                .mockResolvedValueOnce([{ id: 2 }]) // order creation
                .mockResolvedValueOnce([{ id: 1 }]); // order items creation
            
            // Mock Supabase client for getCompleteOrderData
            mockSupabaseClient.from.mockReturnValue({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({ data: newOrder, error: null }))
                    }))
                }))
            });

            const response = await request(app)
                .post('/orders')
                .send(orderData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.customer_name).toBe('Jane Doe');
        });

        it('should return error for missing required fields', async () => {
            const invalidData = {
                customer_email: 'test@example.com'
            };

            const response = await request(app)
                .post('/orders')
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('required');
        });

        it('should validate product availability', async () => {
            const orderData = {
                customer_name: 'Test Customer',
                customer_email: 'test@example.com',
                customer_phone: '+58-412-1234567',
                delivery_address: '123 Test St',
                payment_method_id: 1,
                items: [
                    {
                        product_id: 999,
                        quantity: 1,
                        unit_price: 25.99
                    }
                ]
            };

            // Mock databaseService.query to return no product (empty array)  
            mockDatabaseService.query.mockReset().mockResolvedValue({ data: [], error: null });

            const response = await request(app)
                .post('/orders')
                .send(orderData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('Product with ID 999 not found');
        });

        it('should validate stock availability', async () => {
            const orderData = {
                customer_name: 'Test Customer',
                customer_email: 'test@example.com',
                customer_phone: '+58-412-1234567',
                delivery_address: '123 Test St',
                payment_method_id: 1,
                items: [
                    {
                        product_id: 1,
                        quantity: 20, // More than available stock
                        unit_price: 25.99
                    }
                ]
            };

            // Mock databaseService.query to return product with low stock
            mockDatabaseService.query.mockResolvedValue({ 
                data: [{ 
                    id: 1, 
                    name: 'Test Product', 
                    price: 25.99, 
                    stock_quantity: 5, // Less than requested quantity (20)
                    active: true 
                }], 
                error: null 
            });

            const response = await request(app)
                .post('/orders')
                .send(orderData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('Insufficient stock');
        });
    });

    describe('PUT /orders/:id/status', () => {
        it('should update order status successfully', async () => {
            const updatedOrder = { ...testOrder, status: 'confirmed' };
            
            // Mock databaseService.query for order lookup
            mockDatabaseService.query.mockResolvedValue({ 
                data: [{ id: 1, status: 'pending' }], 
                error: null 
            });
            
            // Mock databaseService.update for order update
            mockDatabaseService.update.mockResolvedValue([updatedOrder]);
            
            // Mock Supabase client for getCompleteOrderData
            mockSupabaseClient.from.mockReturnValue({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({ data: updatedOrder, error: null }))
                    }))
                }))
            });

            const response = await request(app)
                .patch('/orders/1/status')
                .send({ status: 'confirmed' })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.status).toBe('confirmed');

            // Verify databaseService was called correctly
            expect(mockDatabaseService.query).toHaveBeenCalledWith('orders', {
                select: 'id, status',
                eq: { id: 1 }
            });
            expect(mockDatabaseService.update).toHaveBeenCalledWith(
                'orders', 
                expect.objectContaining({ status: 'confirmed' }), 
                { id: 1 }
            );
        });

        it('should validate status values', async () => {
            const response = await request(app)
                .patch('/orders/1/status')
                .send({ status: 'invalid_status' })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.message).toContain('Invalid status');
        });

        it('should return 404 for non-existent order', async () => {
            mockPrismaLikeAPI.order.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .patch('/orders/999/status')
                .send({ status: 'confirmed' })
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Order not found');
            expect(mockDatabaseService.update).not.toHaveBeenCalled();
        });

        it('should handle database errors during update', async () => {
            // Mock successful order lookup
            mockDatabaseService.query.mockResolvedValue({ 
                data: [{ id: 1, status: 'pending' }], 
                error: null 
            });
            
            // Mock database error during update
            mockDatabaseService.update.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .patch('/orders/1/status')
                .send({ status: 'confirmed' })
                .expect(500);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Error updating order status');
        });
    });

    describe('GET /orders/stats/summary', () => {
        it('should return order statistics', async () => {
            const mockStats = {
                total_orders: 100,
                pending_orders: 25,
                confirmed_orders: 50,
                delivered_orders: 20,
                cancelled_orders: 5,
                total_revenue: 5000.00,
                average_order_value: 50.00
            };

            // Mock the individual count and sum queries
            mockPrismaLikeAPI.order.count
                .mockResolvedValueOnce(100) // total_orders
                .mockResolvedValueOnce(25)  // pending
                .mockResolvedValueOnce(50)  // confirmed
                .mockResolvedValueOnce(20)  // delivered
                .mockResolvedValueOnce(5);  // cancelled

            // Mock Supabase client for revenue aggregate query
            const mockSupabaseSum = {
                sum: vi.fn(() => Promise.resolve({ data: [{ sum: 5000.00 }], error: null }))
            };
            
            // Configure the chain for revenue query
            mockSupabaseClient.from.mockImplementationOnce(() => ({
                select: vi.fn(() => ({
                    gt: vi.fn(() => mockSupabaseSum)
                }))
            }));

            const response = await request(app)
                .get('/orders/stats/summary')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('total_orders');
            expect(response.body.data).toHaveProperty('pending_orders');
            expect(response.body.data).toHaveProperty('total_revenue');
        });

        it('should handle database errors in stats', async () => {
            mockPrismaLikeAPI.order.count.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/orders/stats/summary')
                .expect(500);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('message', 'Error fetching order statistics');
        });
    });
});