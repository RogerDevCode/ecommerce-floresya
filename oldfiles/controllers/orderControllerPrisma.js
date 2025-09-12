import {
    log,
    logger,
    requestLogger,
    startTimer
} from '../utils/bked_logger.js';

import { prisma } from '../config/prisma.js';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from '../services/bked_emailService.js';

const generateOrderNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FL-${date}-${random}`;
};

const getAllOrders = async (req, res) => {
    const timer = startTimer('getAllOrders');
    
    try {
        const {
            page = 1,
            limit = 20,
            status,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        try {
            logger.info(req.method, req.originalUrl, {
                query: req.query,
                userRole: req.user?.role
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }

        const orderBy = {};
        orderBy[sortBy] = sortOrder;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: whereClause,
                include: {
                    order_items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true,
                                    image_url: true
                                }
                            }
                        }
                    },
                    payment_method: {
                        select: {
                            id: true,
                            name: true,
                            type: true
                        }
                    }
                },
                orderBy,
                skip: offset,
                take: parseInt(limit)
            }),
            prisma.order.count({ where: whereClause })
        ]);

        const totalPages = Math.ceil(total / parseInt(limit));

        timer.end();

        try {
            logger.success('CONTROLLER', 'getAllOrders completed successfully', {
                total,
                page: parseInt(page),
                totalPages
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        res.json({
            success: true,
            data: orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });

    } catch (error) {
        timer.end();
        try {
            logger.error('CONTROLLER', 'getAllOrders failed', {
                query: req.query,
                error: error.message
            }, error);
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getOrderById = async (req, res) => {
    const timer = startTimer('getOrderById');
    
    try {
        const { id } = req.params;

        try {
            logger.info(req.method, req.originalUrl, {
                params: req.params,
                userRole: req.user?.role
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: {
                order_items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                image_url: true,
                                description: true
                            }
                        }
                    }
                },
                payment_method: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        instructions: true
                    }
                }
            }
        });

        if (!order) {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Order not found', { orderId: id });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        timer.end();
        
        try {
            logger.success('CONTROLLER', 'getOrderById completed successfully', {
                orderId: id,
                orderStatus: order.status
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        timer.end();
        try {
            logger.error('CONTROLLER', 'getOrderById failed', {
                orderId: req.params.id,
                error: error.message
            }, error);
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const createOrder = async (req, res) => {
    const timer = startTimer('createOrder');
    
    try {
        const {
            customer_name,
            customer_email,
            customer_phone,
            delivery_address,
            payment_method_id,
            notes,
            items
        } = req.body;

        try {
            logger.info(req.method, req.originalUrl, {
                body: {
                    customer_name,
                    customer_email,
                    items_count: items?.length,
                    payment_method_id
                },
                userRole: req.user?.role
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        if (!customer_name || !customer_email || !items || !Array.isArray(items) || items.length === 0) {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Missing required fields for order creation', {
                    customer_name: !!customer_name,
                    customer_email: !!customer_email,
                    items: Array.isArray(items) ? items.length : 'invalid'
                });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(400).json({
                success: false,
                message: 'Customer name, email, and items are required'
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            const orderItems = [];

            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.product_id },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        stock_quantity: true,
                        active: true
                    }
                });

                if (!product || !product.active) {
                    throw new Error(`Product with ID ${item.product_id} not found or not active`);
                }

                if (product.stock_quantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
                }

                const itemTotal = parseFloat(product.price) * parseInt(item.quantity);
                totalAmount += itemTotal;

                orderItems.push({
                    product_id: item.product_id,
                    quantity: parseInt(item.quantity),
                    unit_price: parseFloat(product.price)
                });

                await tx.product.update({
                    where: { id: item.product_id },
                    data: {
                        stock_quantity: {
                            decrement: parseInt(item.quantity)
                        }
                    }
                });
            }

            const order = await tx.order.create({
                data: {
                    customer_name,
                    customer_email,
                    customer_phone,
                    delivery_address,
                    total_amount: totalAmount,
                    payment_method_id: payment_method_id ? parseInt(payment_method_id) : null,
                    status: 'pending',
                    notes,
                    order_items: {
                        create: orderItems
                    }
                },
                include: {
                    order_items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true,
                                    image_url: true
                                }
                            }
                        }
                    },
                    payment_method: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            instructions: true
                        }
                    }
                }
            });

            return order;
        });

        try {
            if (result.customer_email) {
                await sendOrderConfirmationEmail(result);
            }
        } catch (emailError) {
            try {
                logger.warn('CONTROLLER', 'Failed to send order confirmation email', {
                    orderId: result.id,
                    error: emailError.message
                });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
        }

        timer.end();
        
        try {
            logger.success('CONTROLLER', 'createOrder completed successfully', {
                orderId: result.id,
                totalAmount: result.total_amount,
                itemsCount: result.order_items.length
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        res.status(201).json({
            success: true,
            data: result,
            message: 'Order created successfully'
        });

    } catch (error) {
        timer.end();
        try {
            logger.error('CONTROLLER', 'createOrder failed', {
                customer_email: req.body.customer_email,
                items_count: req.body.items?.length,
                error: error.message
            }, error);
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const updateOrderStatus = async (req, res) => {
    const timer = startTimer('updateOrderStatus');
    
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        try {
            logger.info(req.method, req.originalUrl, {
                params: req.params,
                body: { status, notes },
                userRole: req.user?.role
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Invalid order status', { 
                    orderId: id, 
                    status,
                    validStatuses 
                });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`
            });
        }

        const existingOrder = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: {
                order_items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!existingOrder) {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Order not found for status update', { orderId: id });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const updateData = { status };
        if (notes !== undefined) {
            updateData.notes = notes;
        }

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                order_items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                image_url: true
                            }
                        }
                    }
                },
                payment_method: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            }
        });

        try {
            if (updatedOrder.customer_email && existingOrder.status !== status) {
                await sendOrderStatusUpdateEmail(updatedOrder, existingOrder.status);
            }
        } catch (emailError) {
            try {
                logger.warn('CONTROLLER', 'Failed to send status update email', {
                    orderId: id,
                    error: emailError.message
                });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
        }

        timer.end();
        
        try {
            logger.success('CONTROLLER', 'updateOrderStatus completed successfully', {
                orderId: id,
                oldStatus: existingOrder.status,
                newStatus: status
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        res.json({
            success: true,
            data: updatedOrder,
            message: 'Order status updated successfully'
        });

    } catch (error) {
        timer.end();
        try {
            logger.error('CONTROLLER', 'updateOrderStatus failed', {
                orderId: req.params.id,
                status: req.body.status,
                error: error.message
            }, error);
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const deleteOrder = async (req, res) => {
    const timer = startTimer('deleteOrder');
    
    try {
        const { id } = req.params;

        try {
            logger.info(req.method, req.originalUrl, {
                params: req.params,
                userRole: req.user?.role
            });

            logger.warn('CONTROLLER', 'Attempting to delete order', {
                orderId: id,
                adminUser: req.user?.email
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        const existingOrder = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: {
                order_items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!existingOrder) {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Order not found for deletion', { orderId: id });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (existingOrder.status === 'delivered') {
            timer.end();
            try {
                logger.warn('CONTROLLER', 'Cannot delete delivered order', { 
                    orderId: id,
                    status: existingOrder.status 
                });
            } catch (logError) {
                console.log('Logger error:', logError.message);
            }
            return res.status(400).json({
                success: false,
                message: 'Cannot delete delivered orders'
            });
        }

        await prisma.$transaction(async (tx) => {
            if (existingOrder.status === 'pending' || existingOrder.status === 'cancelled') {
                for (const item of existingOrder.order_items) {
                    await tx.product.update({
                        where: { id: item.product_id },
                        data: {
                            stock_quantity: {
                                increment: item.quantity
                            }
                        }
                    });
                }
            }

            await tx.order.delete({
                where: { id: parseInt(id) }
            });
        });

        timer.end();
        
        try {
            logger.success('CONTROLLER', 'deleteOrder completed successfully', {
                orderId: id,
                customerEmail: existingOrder.customer_email
            });
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }

        res.json({
            success: true,
            message: 'Order deleted successfully'
        });

    } catch (error) {
        timer.end();
        try {
            logger.error('CONTROLLER', 'deleteOrder failed', {
                orderId: req.params.id,
                error: error.message
            }, error);
        } catch (logError) {
            console.log('Logger error:', logError.message);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error deleting order',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    generateOrderNumber
};