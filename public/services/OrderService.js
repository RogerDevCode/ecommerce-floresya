import { supabaseService } from '../config/supabase.js';
export class OrderService {
    async getOrders(query = {}) {
        try {
            const { page = 1, limit = 20, status, customer_email, date_from, date_to, sort_by = 'created_at', sort_direction = 'desc' } = query;
            const offset = (page - 1) * limit;
            let queryBuilder = supabaseService
                .from('orders')
                .select(`
          *,
          order_items(*),
          users(id, full_name, email)
        `, { count: 'exact' });
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
            const ordersWithItems = (data ?? []).map((order) => ({
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
        }
        catch (error) {
            console.error('OrderService.getOrders error:', error);
            throw error;
        }
    }
    async getOrderById(id) {
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
                    return null;
                }
                throw new Error(`Failed to fetch order: ${error.message}`);
            }
            if (!data) {
                return null;
            }
            const rawData = data;
            const orderWithDetails = {
                ...rawData,
                items: rawData.order_items ?? [],
                payments: rawData.payments ?? [],
                status_history: rawData.order_status_history ?? [],
                user: rawData.users ? { ...rawData.users } : undefined
            };
            return orderWithDetails;
        }
        catch (error) {
            console.error('OrderService.getOrderById error:', error);
            throw error;
        }
    }
    async createOrder(orderData) {
        try {
            const { items, total_amount_usd } = await this.calculateOrderTotals(orderData.items);
            const { items: _items, ...orderFields } = orderData;
            void _items;
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
            return data;
        }
        catch (error) {
            console.error('OrderService.createOrder error:', error);
            throw error;
        }
    }
    async updateOrder(updateData) {
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
            return data;
        }
        catch (error) {
            console.error('OrderService.updateOrder error:', error);
            throw error;
        }
    }
    async updateOrderStatus(orderId, newStatus, notes, changedBy) {
        try {
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
            return data;
        }
        catch (error) {
            console.error('OrderService.updateOrderStatus error:', error);
            throw error;
        }
    }
    async getOrderStatusHistory(orderId) {
        try {
            const { data, error } = await supabaseService
                .from('order_status_history')
                .select(`*, users(full_name)`)
                .eq('order_id', orderId)
                .order('created_at', { ascending: false });
            if (error) {
                throw new Error(`Failed to fetch order status history: ${error.message}`);
            }
            return data ?? [];
        }
        catch (error) {
            console.error('OrderService.getOrderStatusHistory error:', error);
            throw error;
        }
    }
    async calculateOrderTotals(items) {
        const productIds = items.map(item => item.product_id);
        const { data: products, error } = await supabaseService
            .from('products')
            .select('id, name, summary, price_usd, stock')
            .in('id', productIds)
            .eq('active', true);
        if (error || !products) {
            throw new Error(`Failed to fetch product details: ${error?.message ?? 'No products returned'}`);
        }
        const productMap = new Map(products.map((p) => [p.id, p]));
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
