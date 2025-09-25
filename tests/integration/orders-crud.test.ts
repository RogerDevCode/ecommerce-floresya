/**
 * 🌸 FloresYa Orders CRUD Integration Tests - Enterprise Edition
 * Comprehensive tests for order management system with real database validation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FloresYaServer } from '../../src/app/server';
import supertest from 'supertest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/shared/types/index';

describe('Orders CRUD Integration Tests', () => {
  let server: FloresYaServer;
  let request: any;
  let supabase: any;
  let testProductId: number;
  let testUserId: number;
  let testOrderId: number;

  beforeAll(async () => {
    // Initialize server
    server = new FloresYaServer();
    const app = server.getApp();
    request = supertest(app);

    // Initialize Supabase client
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
  });

  async function setupTestData() {
    // Create test product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        name: 'Test Roses for Order',
        description: 'Test product for order CRUD testing',
        price_usd: 29.99,
        price_ves: 1090000,
        stock: 100,
        active: true,
        sku: `TEST-ORDER-${Date.now()}`
      })
      .select()
      .single();

    if (productError) throw productError;
    testProductId = productData.id;

    // Create test user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        name: 'Test User',
        email: `test-order-${Date.now()}@example.com`,
        phone: '+58 414 123 4567',
        role: 'customer'
      })
      .select()
      .single();

    if (userError) throw userError;
    testUserId = userData.id;
  }

  async function cleanupTestData() {
    if (testOrderId) {
      await supabase.from('order_items').delete().eq('order_id', testOrderId);
      await supabase.from('orders').delete().eq('id', testOrderId);
    }
    if (testProductId) {
      await supabase.from('products').delete().eq('id', testProductId);
    }
    if (testUserId) {
      await supabase.from('users').delete().eq('id', testUserId);
    }
  }

  describe('POST /api/orders - Create Order', () => {
    it('should create a new order with valid data', async () => {
      const orderData = {
        customer: {
          name: 'Maria González',
          email: 'maria@test.com',
          phone: '+58 414 555 0123',
          address: 'Caracas, Venezuela'
        },
        items: [
          {
            product_id: testProductId,
            quantity: 2,
            unit_price: 29.99
          }
        ],
        payment_method: 'bank_transfer',
        payment_reference: 'REF123456789',
        shipping_cost: 5.00,
        total_amount: 64.98, // (29.99 * 2) + 5.00
        notes: 'Test order for integration testing'
      };

      const response = await request
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Pedido creado exitosamente'
      });

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('order_number');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.total_amount).toBe(64.98);

      testOrderId = response.body.data.id;

      // Verify order was created in database
      const { data: dbOrder, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', testOrderId)
        .single();

      expect(error).toBeNull();
      expect(dbOrder).toBeTruthy();
      expect(dbOrder.customer_name).toBe('Maria González');
      expect(dbOrder.order_items).toHaveLength(1);
      expect(dbOrder.order_items[0].quantity).toBe(2);
    });

    it('should fail with missing required fields', async () => {
      const invalidOrderData = {
        customer: {
          name: 'Test Customer'
          // Missing email, phone, address
        },
        items: [], // Empty items
        total_amount: 0
      };

      const response = await request
        .post('/api/orders')
        .send(invalidOrderData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('requerido')
      });
    });

    it('should validate product availability', async () => {
      // Create order with quantity exceeding stock
      const orderData = {
        customer: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+58 414 123 4567',
          address: 'Test Address'
        },
        items: [
          {
            product_id: testProductId,
            quantity: 200, // Exceeds stock of 100
            unit_price: 29.99
          }
        ],
        payment_method: 'bank_transfer',
        payment_reference: 'REF999',
        total_amount: 5998
      };

      const response = await request
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('stock')
      });
    });
  });

  describe('GET /api/orders - List Orders', () => {
    beforeEach(async () => {
      // Ensure we have a test order
      if (!testOrderId) {
        const { data } = await supabase
          .from('orders')
          .insert({
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            customer_phone: '+58 414 123 4567',
            customer_address: 'Test Address',
            total_amount: 29.99,
            status: 'pending',
            payment_method: 'bank_transfer',
            payment_reference: 'REF123',
            order_number: `ORD-${Date.now()}`
          })
          .select()
          .single();
        testOrderId = data?.id;
      }
    });

    it('should return paginated list of orders', async () => {
      const response = await request
        .get('/api/orders')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String)
      });

      expect(response.body.data).toHaveProperty('orders');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.orders)).toBe(true);

      if (response.body.data.orders.length > 0) {
        const order = response.body.data.orders[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('order_number');
        expect(order).toHaveProperty('status');
        expect(order).toHaveProperty('total_amount');
        expect(order).toHaveProperty('created_at');
      }
    });

    it('should filter orders by status', async () => {
      const response = await request
        .get('/api/orders')
        .query({ status: 'pending' })
        .expect(200);

      expect(response.body.success).toBe(true);

      if (response.body.data.orders.length > 0) {
        response.body.data.orders.forEach((order: any) => {
          expect(order.status).toBe('pending');
        });
      }
    });

    it('should search orders by customer name', async () => {
      const response = await request
        .get('/api/orders')
        .query({ search: 'Test Customer' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/orders/:id - Get Order Details', () => {
    it('should return complete order details', async () => {
      if (!testOrderId) {
        // Create a test order first
        const { data } = await supabase
          .from('orders')
          .insert({
            customer_name: 'Detailed Test Customer',
            customer_email: 'detailed@example.com',
            customer_phone: '+58 414 123 4567',
            customer_address: 'Detailed Test Address',
            total_amount: 59.98,
            status: 'confirmed',
            payment_method: 'zelle',
            payment_reference: 'ZELLE123',
            order_number: `ORD-DETAIL-${Date.now()}`,
            notes: 'Test order for details endpoint'
          })
          .select()
          .single();
        testOrderId = data?.id;
      }

      const response = await request
        .get(`/api/orders/${testOrderId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String)
      });

      const order = response.body.data;
      expect(order).toHaveProperty('id', testOrderId);
      expect(order).toHaveProperty('order_number');
      expect(order).toHaveProperty('customer_name');
      expect(order).toHaveProperty('customer_email');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('total_amount');
      expect(order).toHaveProperty('order_items');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request
        .get('/api/orders/99999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('encontrado')
      });
    });
  });

  describe('PUT /api/orders/:id/status - Update Order Status', () => {
    it('should update order status successfully', async () => {
      if (!testOrderId) {
        const { data } = await supabase
          .from('orders')
          .insert({
            customer_name: 'Status Test Customer',
            customer_email: 'status@example.com',
            customer_phone: '+58 414 123 4567',
            customer_address: 'Status Test Address',
            total_amount: 29.99,
            status: 'pending',
            payment_method: 'bank_transfer',
            payment_reference: 'REF456',
            order_number: `ORD-STATUS-${Date.now()}`
          })
          .select()
          .single();
        testOrderId = data?.id;
      }

      const statusUpdate = {
        status: 'confirmed',
        notes: 'Payment verified by admin'
      };

      const response = await request
        .put(`/api/orders/${testOrderId}/status`)
        .send(statusUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('actualizado')
      });

      // Verify status was updated in database
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', testOrderId)
        .single();

      expect(error).toBeNull();
      expect(updatedOrder.status).toBe('confirmed');
    });

    it('should validate status transitions', async () => {
      const invalidStatusUpdate = {
        status: 'invalid_status'
      };

      const response = await request
        .put(`/api/orders/${testOrderId}/status`)
        .send(invalidStatusUpdate)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('estado')
      });
    });
  });

  describe('DELETE /api/orders/:id - Cancel Order', () => {
    it('should cancel order successfully', async () => {
      // Create a new order specifically for cancellation test
      const { data: orderToCancel } = await supabase
        .from('orders')
        .insert({
          customer_name: 'Cancel Test Customer',
          customer_email: 'cancel@example.com',
          customer_phone: '+58 414 123 4567',
          customer_address: 'Cancel Test Address',
          total_amount: 19.99,
          status: 'pending',
          payment_method: 'mobile_payment',
          payment_reference: 'MOV789',
          order_number: `ORD-CANCEL-${Date.now()}`
        })
        .select()
        .single();

      const orderIdToCancel = orderToCancel?.id;

      const response = await request
        .delete(`/api/orders/${orderIdToCancel}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('cancelado')
      });

      // Verify order was marked as cancelled
      const { data: cancelledOrder, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderIdToCancel)
        .single();

      expect(error).toBeNull();
      expect(cancelledOrder.status).toBe('cancelled');
    });

    it('should not cancel already delivered orders', async () => {
      // Create a delivered order
      const { data: deliveredOrder } = await supabase
        .from('orders')
        .insert({
          customer_name: 'Delivered Test Customer',
          customer_email: 'delivered@example.com',
          customer_phone: '+58 414 123 4567',
          customer_address: 'Delivered Test Address',
          total_amount: 39.99,
          status: 'delivered',
          payment_method: 'zelle',
          payment_reference: 'ZELLE999',
          order_number: `ORD-DELIVERED-${Date.now()}`
        })
        .select()
        .single();

      const response = await request
        .delete(`/api/orders/${deliveredOrder?.id}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('cancelar')
      });
    });
  });

  describe('Order Statistics and Reporting', () => {
    it('should return order statistics', async () => {
      const response = await request
        .get('/api/orders/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String)
      });

      expect(response.body.data).toHaveProperty('total_orders');
      expect(response.body.data).toHaveProperty('orders_by_status');
      expect(response.body.data).toHaveProperty('monthly_revenue');
      expect(response.body.data).toHaveProperty('orders_this_month');
    });

    it('should return orders by date range', async () => {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const response = await request
        .get('/api/orders')
        .query({
          start_date: lastWeek.toISOString(),
          end_date: today.toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });
  });

  describe('Order Item Management', () => {
    it('should handle order items correctly', async () => {
      if (!testOrderId) return;

      // Add item to existing order
      const newItem = {
        product_id: testProductId,
        quantity: 1,
        unit_price: 29.99
      };

      const response = await request
        .post(`/api/orders/${testOrderId}/items`)
        .send(newItem)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('agregado')
      });

      // Verify item was added
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', testOrderId);

      expect(error).toBeNull();
      expect(orderItems.length).toBeGreaterThan(0);
    });
  });
});