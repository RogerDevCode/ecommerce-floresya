import {
    log,
    logger,
    requestLogger,
    startTimer
} from '../utils/bked_logger.js';

import { databaseService } from '../services/databaseService.js';
import { createPrismaLikeAPI } from '../services/queryBuilder.js';

// Initialize Prisma-like API
const db = createPrismaLikeAPI(databaseService.getClient());

/**
 * 📋 GET ALL ORDERS
 * Obtener todas las órdenes con paginación y filtros
 */
const getAllOrders = async (req, res) => {
    const timer = startTimer('getAllOrders');
    
    try {
        const {
            page = 1,
            limit = 20,
            status,
            customer_email,
            payment_method_id,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        logger.info(req.method, req.originalUrl, {
            query: req.query,
            userRole: req.user?.role
        });

        const client = databaseService.getClient();
        let query = client
            .from('orders')
            .select(`
                id, customer_name, customer_email, customer_phone,
                delivery_address, total_amount, status, notes,
                created_at, updated_at,
                payment_method:payment_methods(id, name, type),
                order_items:order_items(
                    id, quantity, unit_price,
                    product:products(id, name, price)
                )
            `);

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (customer_email) {
            query = query.ilike('customer_email', `%${customer_email}%`);
        }

        if (payment_method_id) {
            query = query.eq('payment_method_id', parseInt(payment_method_id));
        }

        // Apply sorting and pagination
        query = query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + parseInt(limit) - 1);

        const { data: orders, error } = await query;

        if (error) {
            throw new Error(`Database query error: ${error.message}`);
        }

        // Get total count
        const totalCount = await databaseService.count('orders');
        const totalPages = Math.ceil(totalCount / parseInt(limit));

        timer.end();
        
        res.json({
            success: true,
            data: orders || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                pages: totalPages
            }
        });

    } catch (error) {
        timer.end();
        logger.error('Error in getAllOrders:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * 📄 GET ORDER BY ID
 * Obtener una orden específica con todos sus detalles
 */
const getOrderById = async (req, res) => {
    const timer = startTimer('getOrderById');
    
    try {
        const { id } = req.params;
        
        logger.info(req.method, req.originalUrl, {
            orderId: id,
            userRole: req.user?.role
        });

        const client = databaseService.getClient();
        const { data: order } = await client
            .from('orders')
            .select(`
                id, customer_name, customer_email, customer_phone,
                delivery_address, total_amount, status, notes,
                created_at, updated_at,
                payment_method:payment_methods(id, name, type, instructions),
                order_items:order_items(
                    id, quantity, unit_price,
                    product:products(
                        id, name, description, price,
                        images:product_images(url_thumb, is_primary)
                    )
                )
            `)
            .eq('id', parseInt(id))
            .single();

        if (!order) {
            timer.end();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        timer.end();
        
        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        timer.end();
        logger.error('Error in getOrderById:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * ➕ CREATE ORDER
 * Crear una nueva orden con items
 */
const createOrder = async (req, res) => {
    const timer = startTimer('createOrder');
    
    try {
        logger.info(req.method, req.originalUrl, {
            body: req.body,
            userRole: req.user?.role
        });

        const {
            customer_name,
            customer_email,
            customer_phone,
            delivery_address,
            payment_method_id,
            notes,
            items // Array of { product_id, quantity }
        } = req.body;

        // Validate required fields
        if (!customer_name || !customer_email || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer name, email, and order items are required'
            });
        }

        // Validate and calculate total
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            if (!item.product_id || !item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have product_id and quantity'
                });
            }

            // Get product details
            const product = await databaseService.query('products', {
                select: 'id, name, price, stock_quantity, active',
                eq: { id: parseInt(item.product_id) }
            });

            if (!product.data || product.data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${item.product_id} not found`
                });
            }

            const productData = product.data[0];

            if (!productData.active) {
                return res.status(400).json({
                    success: false,
                    message: `Product ${productData.name} is not available`
                });
            }

            if (productData.stock_quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product ${productData.name}. Available: ${productData.stock_quantity}`
                });
            }

            const itemTotal = parseFloat(productData.price) * parseInt(item.quantity);
            totalAmount += itemTotal;

            orderItems.push({
                product_id: parseInt(item.product_id),
                quantity: parseInt(item.quantity),
                unit_price: parseFloat(productData.price)
            });
        }

        // Create order
        const orderData = {
            customer_name,
            customer_email,
            customer_phone: customer_phone || null,
            delivery_address: delivery_address || null,
            total_amount: totalAmount,
            payment_method_id: payment_method_id ? parseInt(payment_method_id) : null,
            status: 'pending',
            notes: notes || null
        };

        const createdOrder = await databaseService.insert('orders', orderData);
        const orderId = createdOrder[0].id;

        // Create order items
        const orderItemsWithOrderId = orderItems.map(item => ({
            ...item,
            order_id: orderId
        }));

        await databaseService.insert('order_items', orderItemsWithOrderId);

        // Update product stock
        for (const item of items) {
            const currentStock = await databaseService.query('products', {
                select: 'stock_quantity',
                eq: { id: parseInt(item.product_id) }
            });

            const newStock = currentStock.data[0].stock_quantity - parseInt(item.quantity);
            
            await databaseService.update('products', 
                { stock_quantity: newStock }, 
                { id: parseInt(item.product_id) }
            );
        }

        // Get complete order data
        const completeOrder = await getCompleteOrderData(orderId);

        timer.end();
        
        res.status(201).json({
            success: true,
            data: completeOrder,
            message: 'Order created successfully'
        });

    } catch (error) {
        timer.end();
        logger.error('Error in createOrder:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * ✏️ UPDATE ORDER STATUS
 * Actualizar el estado de una orden
 */
const updateOrderStatus = async (req, res) => {
    const timer = startTimer('updateOrderStatus');
    
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        
        logger.info(req.method, req.originalUrl, {
            orderId: id,
            status,
            userRole: req.user?.role
        });

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
            });
        }

        // Check if order exists
        const existingOrder = await databaseService.query('orders', {
            select: 'id, status',
            eq: { id: parseInt(id) }
        });

        if (!existingOrder.data || existingOrder.data.length === 0) {
            timer.end();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const updateData = {
            status,
            updated_at: new Date().toISOString()
        };

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        await databaseService.update('orders', updateData, { id: parseInt(id) });

        // Get updated order
        const updatedOrder = await getCompleteOrderData(parseInt(id));

        timer.end();
        
        res.json({
            success: true,
            data: updatedOrder,
            message: 'Order status updated successfully'
        });

    } catch (error) {
        timer.end();
        logger.error('Error in updateOrderStatus:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * 📊 GET ORDER STATS
 * Obtener estadísticas de órdenes
 */
const getOrderStats = async (req, res) => {
    const timer = startTimer('getOrderStats');
    
    try {
        logger.info(req.method, req.originalUrl, {
            userRole: req.user?.role
        });

        const client = databaseService.getClient();

        // Get order counts by status
        const { data: statusCounts } = await client
            .from('orders')
            .select('status')
            .not('status', 'is', null);

        const statusStats = statusCounts?.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {}) || {};

        // Get revenue stats
        const { data: revenueData } = await client
            .from('orders')
            .select('total_amount, status, created_at')
            .in('status', ['delivered', 'confirmed']);

        const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;

        // Get recent orders count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentOrdersCount = await databaseService.count('orders', {
            created_at: { gte: thirtyDaysAgo.toISOString() }
        });

        timer.end();
        
        res.json({
            success: true,
            data: {
                status_counts: statusStats,
                total_revenue: totalRevenue,
                recent_orders_count: recentOrdersCount,
                total_orders: statusCounts?.length || 0
            }
        });

    } catch (error) {
        timer.end();
        logger.error('Error in getOrderStats:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error fetching order statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

/**
 * Helper function to get complete order data
 */
const getCompleteOrderData = async (orderId) => {
    const client = databaseService.getClient();
    const { data: order } = await client
        .from('orders')
        .select(`
            id, customer_name, customer_email, customer_phone,
            delivery_address, total_amount, status, notes,
            created_at, updated_at,
            payment_method:payment_methods(id, name, type),
            order_items:order_items(
                id, quantity, unit_price,
                product:products(id, name, price)
            )
        `)
        .eq('id', orderId)
        .single();

    return order;
};

export {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    getOrderStats
};