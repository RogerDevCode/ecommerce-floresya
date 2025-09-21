/**
 * 🌸 FloresYa Order Service - Enterprise TypeScript Edition
 * Complete order management with cart calculation and status tracking
 */

import {
  supabaseService,
  type Order,
  type OrderCreateRequest,
  type OrderResponse,
  type OrderStatus,
  type OrderStatusHistory,
  type OrderUpdateRequest,
  type OrderWithItems,
  type OrderWithItemsAndPayments,
  type Product,
  type RawOrderStatusHistoryWithUser,
  type RawOrderWithItemsAndUser,
  type RawOrderWithItemsPaymentsHistory
} from '../config/supabase.js';

interface OrderQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  customer_email?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'total_amount_usd' | 'status';
  sort_direction?: 'asc' | 'desc';
}

export class OrderService {
  /**
   * Get all orders with filtering and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Promise<OrderResponse> - Orders with pagination info
   */
  public async getOrders(query: OrderQuery = {}): Promise<OrderResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        customer_email,
        date_from,
        date_to,
        sort_by = 'created_at',
        sort_direction = 'desc'
      } = query;

      const offset = (page - 1) * limit;

      let queryBuilder = supabaseService
        .from('orders')
        .select(`
          *,
          order_items(*),
          users(id, full_name, email)
        `, { count: 'exact' });

      // Apply filters
      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }
      if (customer_email) {
        queryBuilder = queryBuilder.ilike('customer_email', `%${customer_email}%`);
      }
      if (date_from) {
        queryBuilder = queryBuilder.gte('created_at', date_from);
      }
      if (date_to) {
        queryBuilder = queryBuilder.lte('created_at', date_to);
      }

      const ascending = sort_direction === 'asc';
      queryBuilder = queryBuilder.order(sort_by, { ascending });
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      const ordersWithItems: OrderWithItems[] = (data as RawOrderWithItemsAndUser[] ?? []).map((order) => ({
        ...order,
        items: order.order_items ?? [],
        user: order.users ? { ...order.users } : undefined
      }));

      const totalPages = Math.ceil((count ?? 0) / limit);

      return {
        orders: ordersWithItems,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: count ?? 0,
          items_per_page: limit
        }
      };
    } catch (error) {
      console.error('OrderService.getOrders error:', error);
      throw error;
    }
  }

  /**
   * Get single order by ID with items and payments
   */
  public async getOrderById(id: number): Promise<OrderWithItemsAndPayments | null> {
    try {
      const { data, error } = await supabaseService
        .from('orders')
        .select(`
          *,
          order_items(*),
          payments(*),
          order_status_history(*, users(full_name)),
          users(id, full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Order not found
        }
        throw new Error(`Failed to fetch order: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const rawData = data as RawOrderWithItemsPaymentsHistory;
      const orderWithDetails: OrderWithItemsAndPayments = {
        ...rawData,
        items: rawData.order_items ?? [],
        payments: rawData.payments ?? [],
        status_history: rawData.order_status_history ?? [],
        user: rawData.users ? { ...rawData.users } : undefined
      };

      return orderWithDetails;
    } catch (error) {
      console.error('OrderService.getOrderById error:', error);
      throw error;
    }
  }

  /**
   * Create new order with items using transaction
   */
  public async createOrder(orderData: OrderCreateRequest): Promise<OrderWithItems> {
    try {
      const { items, total_amount_usd } = await this.calculateOrderTotals(orderData.items);

      const { items: _items, ...orderFields } = orderData; // Exclude items from order insert
      void _items; // Silence unused variable warning

      // Use PostgreSQL function for atomic transaction
      const { data, error } = await supabaseService.rpc('create_order_with_items', {
        order_data: {
          ...orderFields,
          status: 'pending',
          total_amount_usd
        },
        order_items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_summary: item.product_summary,
          unit_price_usd: item.unit_price_usd,
          quantity: item.quantity,
          subtotal_usd: item.subtotal_usd
        }))
      });

      if (error) {
        throw new Error(`Failed to create order transaction: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from order creation transaction');
      }

      // The function returns the complete order with items
      return data as OrderWithItems;
    } catch (error) {
      console.error('OrderService.createOrder error:', error);
      throw error;
    }
  }

  /**
   * Update order (admin only)
   */
  public async updateOrder(updateData: OrderUpdateRequest): Promise<Order> {
    try {
      const { id, ...updates } = updateData;

      const { data, error } = await supabaseService
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update order: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from order update');
      }

      return data as Order;
    } catch (error) {
      console.error('OrderService.updateOrder error:', error);
      throw error;
    }
  }

  /**
   * Update order status with history tracking using transaction
   */
  public async updateOrderStatus(orderId: number, newStatus: OrderStatus, notes?: string, changedBy?: number): Promise<Order> {
    try {
      // Use PostgreSQL function for atomic status update with history
      const { data, error } = await supabaseService.rpc('update_order_status_with_history', {
        order_id: orderId,
        new_status: newStatus,
        notes: notes ?? null,
        changed_by: changedBy ?? null
      });

      if (error) {
        throw new Error(`Failed to update order status transaction: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from order status update transaction');
      }

      return data as Order;
    } catch (error) {
      console.error('OrderService.updateOrderStatus error:', error);
      throw error;
    }
  }

  /**
   * Get order status history
   */
  public async getOrderStatusHistory(orderId: number): Promise<OrderStatusHistory[]> {
    try {
      const { data, error } = await supabaseService
        .from('order_status_history')
        .select(`*, users(full_name)`)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch order status history: ${error.message}`);
      }

      return (data as RawOrderStatusHistoryWithUser[]) ?? [];
    } catch (error) {
      console.error('OrderService.getOrderStatusHistory error:', error);
      throw error;
    }
  }

  /**
   * Calculate order totals from items
   */
  private async calculateOrderTotals(items: Array<{ product_id: number; quantity: number }>) {
    const productIds = items.map(item => item.product_id);

    const { data: products, error } = await supabaseService
      .from('products')
      .select('id, name, summary, price_usd, stock')
      .in('id', productIds)
      .eq('active', true);

    if (error || !products) {
      throw new Error(`Failed to fetch product details: ${error?.message ?? 'No products returned'}`);
    }

    const productMap = new Map<number, Product>(products.map((p) => [p.id, p as Product]));
    let total_amount_usd = 0;

    const calculatedItems = items.map(item => {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found or inactive`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }

      const unitPrice = product.price_usd;
      if (isNaN(unitPrice)) {
        throw new Error(`Invalid price format for product ${product.name}`);
      }

      const subtotal = unitPrice * item.quantity;
      total_amount_usd += subtotal;

      return {
        product_id: product.id,
        product_name: product.name,
        product_summary: product.summary,
        unit_price_usd: unitPrice,
        quantity: item.quantity,
        subtotal_usd: subtotal
      };
    });

    return { items: calculatedItems, total_amount_usd };
  }
}