const { executeQuery } = require('../config/database');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../services/emailService');

const generateOrderNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FL-${date}-${random}`;
};

const safeParse = (data) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (e) {
            return data;
        }
    }
    return data;
};

const createOrder = async (req, res) => {
    let connection;
    try {
        const { items, shipping_address, billing_address, notes, delivery_date, guest_email } = req.body;
        const userId = req.user ? req.user.id : null;

        connection = await require('../config/database').getConnection();
        await connection.beginTransaction();

        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await connection.execute(
                'SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND active = true',
                [item.product_id]
            );

            if (product[0].length === 0) {
                throw new Error(`Producto con ID ${item.product_id} no encontrado`);
            }

            const productData = product[0][0];

            if (productData.stock_quantity < item.quantity) {
                throw new Error(`Stock insuficiente para ${productData.name}`);
            }

            const itemTotal = productData.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: productData.price,
                total_price: itemTotal,
                product_snapshot: {
                    name: productData.name,
                    price: productData.price
                }
            });
        }

        const orderNumber = generateOrderNumber();

        const orderResult = await connection.execute(`
            INSERT INTO orders (
                order_number, user_id, guest_email, status, total_amount, 
                shipping_address, billing_address, notes, delivery_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            orderNumber,
            userId,
            guest_email || null,
            'pending',
            totalAmount,
            JSON.stringify(shipping_address),
            billing_address ? JSON.stringify(billing_address) : null,
            notes || null,
            delivery_date || null
        ]);

        const orderId = orderResult[0].insertId;

        for (const item of orderItems) {
            await connection.execute(`
                INSERT INTO order_items (
                    order_id, product_id, quantity, unit_price, total_price, product_snapshot
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                orderId,
                item.product_id,
                item.quantity,
                item.unit_price,
                item.total_price,
                JSON.stringify(item.product_snapshot)
            ]);

            await connection.execute(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.execute(`
            INSERT INTO order_status_history (order_id, new_status, notes, changed_by)
            VALUES (?, ?, ?, ?)
        `, [orderId, 'pending', 'Orden creada', userId]);

        if (userId) {
            await connection.execute(
                'DELETE FROM cart_items WHERE user_id = ?',
                [userId]
            );
        }

        await connection.commit();

        try {
            const emailRecipient = userId ? req.user.email : guest_email;
            if (emailRecipient) {
                await sendOrderConfirmationEmail(emailRecipient, {
                    orderNumber,
                    items: orderItems,
                    totalAmount,
                    shipping_address
                });
            }
        } catch (emailError) {
            console.error('Error enviando email de confirmación:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Orden creada exitosamente',
            data: {
                order: {
                    id: orderId,
                    order_number: orderNumber,
                    total_amount: totalAmount,
                    status: 'pending'
                }
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error creando orden:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null;

        let whereClause = 'WHERE o.id = ?';
        let params = [id];

        if (req.user && req.user.role !== 'admin') {
            whereClause += ' AND o.user_id = ?';
            params.push(userId);
        }

        const order = await executeQuery(`
            SELECT 
                o.*,
                u.first_name as user_first_name,
                u.last_name as user_last_name,
                u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ${whereClause}
        `, params);

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        const orderData = order[0];

        const orderItems = await executeQuery(`
            SELECT 
                oi.*,
                p.name as product_name,
                p.image_url as product_image
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);

        const statusHistory = await executeQuery(`
            SELECT 
                osh.*,
                u.first_name,
                u.last_name
            FROM order_status_history osh
            LEFT JOIN users u ON osh.changed_by = u.id
            WHERE osh.order_id = ?
            ORDER BY osh.created_at ASC
        `, [id]);

        res.json({
            success: true,
            data: {
                order: {
                    ...orderData,
                    shipping_address: safeParse(orderData.shipping_address),
                    billing_address: safeParse(orderData.billing_address),
                    items: orderItems.map(item => ({
                        ...item,
                        product_snapshot: safeParse(item.product_snapshot)
                    })),
                    status_history: statusHistory
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo orden:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const getUserOrders = async (req, res) => {
    try {
        console.log('🔍 getUserOrders - Starting request');
        const { page = 1, limit = 10, status } = req.query;
        
        if (!req.user || !req.user.id) {
            console.error('❌ getUserOrders - No user or user ID in request');
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        
        const userId = req.user.id;
        const offset = (page - 1) * limit;
        console.log('📊 getUserOrders - User ID:', userId, 'Page:', page, 'Limit:', limit);

        let whereClause = 'WHERE o.user_id = ?';
        let params = [userId];

        if (status) {
            whereClause += ' AND o.status = ?';
            params.push(status);
        }

        const orders = await executeQuery(`
            SELECT 
                o.*,
                0 as items_count
            FROM orders o
            ${whereClause}
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        const countResult = await executeQuery(`
            SELECT COUNT(*) as total
            FROM orders o
            ${whereClause}
        `, params);

        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                orders: orders.map(order => ({
                    ...order,
                    shipping_address: safeParse(order.shipping_address),
                    billing_address: safeParse(order.billing_address)
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo órdenes del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        let params = [];

        if (status) {
            whereClause += ' AND o.status = ?';
            params.push(status);
        }

        if (search) {
            whereClause += ' AND (o.order_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR o.guest_email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        const orders = await executeQuery(`
            SELECT 
                o.*,
                u.first_name as user_first_name,
                u.last_name as user_last_name,
                u.email as user_email,
                COUNT(oi.id) as items_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            ${whereClause}
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        const countResult = await executeQuery(`
            SELECT COUNT(DISTINCT o.id) as total
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ${whereClause}
        `, params);

        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                orders: orders.map(order => ({
                    ...order,
                    shipping_address: safeParse(order.shipping_address),
                    billing_address: safeParse(order.billing_address)
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo todas las órdenes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const updateOrderStatus = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const userId = req.user.id;

        const validStatuses = ['pending', 'verified', 'preparing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado de orden inválido'
            });
        }

        connection = await require('../config/database').getConnection();
        await connection.beginTransaction();

        const order = await connection.execute(
            'SELECT id, status FROM orders WHERE id = ?',
            [id]
        );

        if (order[0].length === 0) {
            throw new Error('Orden no encontrada');
        }

        const currentOrder = order[0][0];

        await connection.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );

        await connection.execute(`
            INSERT INTO order_status_history (order_id, old_status, new_status, notes, changed_by)
            VALUES (?, ?, ?, ?, ?)
        `, [id, currentOrder.status, status, notes || null, userId]);

        await connection.commit();

        // Send status update email
        try {
            const orderWithDetails = await connection.execute(`
                SELECT o.order_number, u.email, o.guest_email 
                FROM orders o 
                LEFT JOIN users u ON o.user_id = u.id 
                WHERE o.id = ?
            `, [id]);
            
            if (orderWithDetails[0].length > 0) {
                const orderData = orderWithDetails[0][0];
                const emailRecipient = orderData.email || orderData.guest_email;
                
                if (emailRecipient) {
                    await sendOrderStatusUpdateEmail(emailRecipient, {
                        orderNumber: orderData.order_number,
                        newStatus: status,
                        notes: notes
                    });
                }
            }
        } catch (emailError) {
            console.error('Error enviando email de actualización:', emailError);
        }

        res.json({
            success: true,
            message: 'Estado de orden actualizado exitosamente'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error actualizando estado de orden:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    createOrder,
    getOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus
};