/**
 * Order Controller - ES6+ Version
 * Enhanced with modern JavaScript features and comprehensive business logic
 */

import { prisma, executeTransaction } from '../config/prisma.js';
import { logger, trackUserAction, trackPerformance } from '../utils/logger.js';
import { asyncErrorHandler, classifyError } from '../utils/errorHandler.js';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from '../services/emailService.js';

// Enhanced Order Query Builder with advanced filtering capabilities
class OrderQueryBuilder {
    constructor() {
        this.whereClause = {};
        this.includeClause = this.getDefaultIncludes();
        this.orderByClause = { created_at: 'desc' };
        this.pagination = { skip: 0, take: 20 };
    }

    getDefaultIncludes = () => ({
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
    })

    filterByStatus = (status) => {
        if (status && this.isValidStatus(status)) {
            this.whereClause.status = status;
        }
        return this;
    }

    filterByDateRange = (startDate, endDate) => {
        if (startDate || endDate) {
            this.whereClause.created_at = {};
            if (startDate) this.whereClause.created_at.gte = new Date(startDate);
            if (endDate) this.whereClause.created_at.lte = new Date(endDate);
        }
        return this;
    }

    filterByCustomer = (customerEmail, customerName) => {
        const customerFilters = [];
        if (customerEmail) {
            customerFilters.push({
                customer_email: {
                    contains: customerEmail,
                    mode: 'insensitive'
                }
            });
        }
        if (customerName) {
            customerFilters.push({
                customer_name: {
                    contains: customerName,
                    mode: 'insensitive'
                }
            });
        }
        
        if (customerFilters.length > 0) {
            this.whereClause.OR = customerFilters;
        }
        return this;
    }

    sortBy = (field, order = 'desc') => {
        const validSortFields = ['created_at', 'total_amount', 'status', 'customer_name'];
        if (validSortFields.includes(field)) {
            this.orderByClause = { [field]: order };
        }
        return this;
    }

    paginate = (page = 1, limit = 20) => {
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 items per page
        this.pagination = {
            skip: (pageNum - 1) * limitNum,
            take: limitNum
        };
        return this;
    }

    isValidStatus = (status) => {
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        return validStatuses.includes(status);
    }

    build = () => ({
        where: this.whereClause,
        include: this.includeClause,
        orderBy: this.orderByClause,
        ...this.pagination
    })
}

// Enhanced order number generation with collision avoidance
const generateOrderNumber = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.getTime().toString().slice(-4); // Last 4 digits of timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FL-${date}-${time}-${random}`;
};

// Enhanced order validation with detailed error messages
const validateOrderData = (data, isUpdate = false) => {
    const errors = [];

    if (!isUpdate) {
        // Required fields for creation
        if (!data.customer_name?.trim()) {
            errors.push({
                field: 'customer_name',
                message: 'Customer name is required and cannot be empty',
                code: 'REQUIRED_FIELD'
            });
        }

        if (!data.customer_email?.trim()) {
            errors.push({
                field: 'customer_email',
                message: 'Customer email is required',
                code: 'REQUIRED_FIELD'
            });
        }

        if (!Array.isArray(data.items) || data.items.length === 0) {
            errors.push({
                field: 'items',
                message: 'Order must contain at least one item',
                code: 'REQUIRED_FIELD'
            });
        }
    }

    // Email validation
    if (data.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) {
        errors.push({
            field: 'customer_email',
            message: 'Invalid email format',
            code: 'INVALID_FORMAT'
        });
    }

    // Phone validation (if provided)
    if (data.customer_phone && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(data.customer_phone)) {
        errors.push({
            field: 'customer_phone',
            message: 'Invalid phone number format',
            code: 'INVALID_FORMAT'
        });
    }

    // Items validation
    if (Array.isArray(data.items)) {
        data.items.forEach((item, index) => {
            if (!item.product_id || !Number.isInteger(Number(item.product_id))) {
                errors.push({
                    field: `items[${index}].product_id`,
                    message: 'Product ID is required and must be an integer',
                    code: 'INVALID_TYPE'
                });
            }

            if (!item.quantity || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
                errors.push({
                    field: `items[${index}].quantity`,
                    message: 'Quantity must be a positive integer',
                    code: 'INVALID_VALUE'
                });
            }
        });
    }

    return errors;
};

// Get all orders with enhanced filtering and pagination
export const getAllOrders = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('getAllOrders');

    try {
        const {
            page = 1,
            limit = 20,
            status,
            startDate,
            endDate,
            customerEmail,
            customerName,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        trackUserAction(req.user, 'ORDER_LIST_VIEW', {
            filters: { status, startDate, endDate, customerEmail, sortBy, sortOrder },
            pagination: { page, limit },
            timestamp: new Date().toISOString()
        });

        // Build query using fluent interface
        const queryBuilder = new OrderQueryBuilder()
            .filterByStatus(status)
            .filterByDateRange(startDate, endDate)
            .filterByCustomer(customerEmail, customerName)
            .sortBy(sortBy, sortOrder)
            .paginate(page, limit);

        const queryOptions = queryBuilder.build();

        // Execute queries in parallel for better performance
        const [orders, total] = await Promise.all([
            prisma.order.findMany(queryOptions),
            prisma.order.count({ where: queryOptions.where })
        ]);

        const totalPages = Math.ceil(total / parseInt(limit, 10));
        const currentPage = parseInt(page, 10);

        performanceTracker.end();

        logger.success('ORDER_CONTROLLER', 'Orders retrieved successfully', {
            total,
            page: currentPage,
            totalPages,
            filters: { status, startDate, endDate },
            performance: performanceTracker.getDuration()
        });

        res.json({
            success: true,
            data: orders,
            pagination: {
                page: currentPage,
                limit: parseInt(limit, 10),
                total,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
            },
            meta: {
                filters: { status, startDate, endDate, customerEmail, customerName },
                performance: performanceTracker.getDuration()
            }
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('ORDER_CONTROLLER', 'Failed to get orders', {
            error: errorInfo,
            query: req.query,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

// Get order by ID with enhanced detail
export const getOrderById = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('getOrderById');

    try {
        const { id } = req.params;

        // Enhanced parameter validation
        const orderId = parseInt(id, 10);
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID',
                details: {
                    field: 'id',
                    received: id,
                    expected: 'positive integer'
                }
            });
        }

        trackUserAction(req.user, 'ORDER_VIEW', {
            orderId,
            timestamp: new Date().toISOString()
        });

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: new OrderQueryBuilder().getDefaultIncludes()
        });

        if (!order) {
            performanceTracker.end();
            
            logger.warn('ORDER_CONTROLLER', 'Order not found', { 
                orderId,
                performance: performanceTracker.getDuration()
            });

            return res.status(404).json({
                success: false,
                message: 'Order not found',
                details: {
                    orderId,
                    suggestions: 'Verify the order ID exists in the database'
                }
            });
        }

        performanceTracker.end();

        logger.success('ORDER_CONTROLLER', 'Order retrieved successfully', {
            orderId,
            orderStatus: order.status,
            customerEmail: order.customer_email,
            performance: performanceTracker.getDuration()
        });

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('ORDER_CONTROLLER', 'Failed to get order by ID', {
            error: errorInfo,
            orderId: req.params.id,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

// Create order with enhanced validation and transaction support
export const createOrder = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('createOrder');

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

        // Enhanced validation
        const validationErrors = validateOrderData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        trackUserAction(req.user, 'ORDER_CREATE', {
            customerEmail: customer_email,
            itemsCount: items.length,
            paymentMethodId: payment_method_id,
            timestamp: new Date().toISOString()
        });

        // Enhanced transaction with better error handling and rollback
        const transactionOperations = async (tx) => {
            let totalAmount = 0;
            const orderItems = [];
            const processedProducts = [];

            // Validate all products first
            for (const [index, item] of items.entries()) {
                const product = await tx.product.findUnique({
                    where: { id: parseInt(item.product_id, 10) },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        stock_quantity: true,
                        active: true
                    }
                });

                if (!product) {
                    throw new Error(`Product with ID ${item.product_id} not found (item ${index + 1})`);
                }

                if (!product.active) {
                    throw new Error(`Product "${product.name}" is no longer active and cannot be ordered`);
                }

                const requestedQuantity = parseInt(item.quantity, 10);
                if (product.stock_quantity < requestedQuantity) {
                    throw new Error(
                        `Insufficient stock for "${product.name}". ` +
                        `Available: ${product.stock_quantity}, Requested: ${requestedQuantity}`
                    );
                }

                processedProducts.push({ product, requestedQuantity, index });
            }

            // Process all items after validation
            for (const { product, requestedQuantity } of processedProducts) {
                const itemTotal = parseFloat(product.price) * requestedQuantity;
                totalAmount += itemTotal;

                orderItems.push({
                    product_id: product.id,
                    quantity: requestedQuantity,
                    unit_price: parseFloat(product.price)
                });

                // Update stock
                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        stock_quantity: {
                            decrement: requestedQuantity
                        }
                    }
                });
            }

            // Generate unique order number
            const orderNumber = generateOrderNumber();

            // Create the order
            const order = await tx.order.create({
                data: {
                    order_number: orderNumber,
                    customer_name: customer_name.trim(),
                    customer_email: customer_email.trim().toLowerCase(),
                    customer_phone: customer_phone?.trim() || null,
                    delivery_address: delivery_address?.trim() || null,
                    total_amount: totalAmount,
                    payment_method_id: payment_method_id ? parseInt(payment_method_id, 10) : null,
                    status: 'pending',
                    notes: notes?.trim() || null,
                    order_items: {
                        create: orderItems
                    }
                },
                include: new OrderQueryBuilder().getDefaultIncludes()
            });

            return order;
        };

        // Execute transaction with enhanced error handling
        const transactionResult = await executeTransaction([transactionOperations]);
        
        if (!transactionResult.success) {
            throw transactionResult.error;
        }

        const order = transactionResult.result;

        // Send confirmation email (non-blocking)
        try {
            await sendOrderConfirmationEmail(order);
            logger.info('ORDER_EMAIL', 'Order confirmation email sent successfully', {
                orderId: order.id,
                customerEmail: order.customer_email
            });
        } catch (emailError) {
            logger.warn('ORDER_EMAIL', 'Failed to send order confirmation email', {
                orderId: order.id,
                customerEmail: order.customer_email,
                error: emailError.message
            });
        }

        performanceTracker.end();

        logger.success('ORDER_CONTROLLER', 'Order created successfully', {
            orderId: order.id,
            orderNumber: order.order_number,
            customerEmail: order.customer_email,
            totalAmount: order.total_amount,
            itemsCount: order.order_items.length,
            performance: performanceTracker.getDuration()
        });

        res.status(201).json({
            success: true,
            data: order,
            message: 'Order created successfully'
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('ORDER_CONTROLLER', 'Failed to create order', {
            error: errorInfo,
            customerData: {
                email: req.body.customer_email,
                itemsCount: req.body.items?.length
            },
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

// Update order status with enhanced validation and notifications
export const updateOrderStatus = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('updateOrderStatus');

    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Parameter validation
        const orderId = parseInt(id, 10);
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID',
                details: {
                    field: 'id',
                    received: id,
                    expected: 'positive integer'
                }
            });
        }

        // Status validation
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status provided',
                details: {
                    field: 'status',
                    received: status,
                    validOptions: validStatuses
                }
            });
        }

        // Get existing order
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
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
            performanceTracker.end();
            
            logger.warn('ORDER_CONTROLLER', 'Order not found for status update', { 
                orderId,
                performance: performanceTracker.getDuration()
            });

            return res.status(404).json({
                success: false,
                message: 'Order not found',
                details: {
                    orderId,
                    suggestions: 'Verify the order ID exists in the database'
                }
            });
        }

        // Validate status transitions
        const invalidTransitions = {
            'delivered': ['pending', 'confirmed', 'preparing', 'ready'],
            'cancelled': ['delivered']
        };

        if (invalidTransitions[existingOrder.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change order status from ${existingOrder.status} to ${status}`,
                details: {
                    currentStatus: existingOrder.status,
                    requestedStatus: status,
                    reason: 'Invalid status transition'
                }
            });
        }

        trackUserAction(req.user, 'ORDER_STATUS_UPDATE', {
            orderId,
            oldStatus: existingOrder.status,
            newStatus: status,
            userRole: req.user?.role,
            timestamp: new Date().toISOString()
        });

        // Update order
        const updateData = {
            status,
            status_updated_at: new Date()
        };
        
        if (notes !== undefined) {
            updateData.notes = notes?.trim() || null;
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: new OrderQueryBuilder().getDefaultIncludes()
        });

        // Send status update email (non-blocking)
        if (updatedOrder.customer_email && existingOrder.status !== status) {
            try {
                await sendOrderStatusUpdateEmail(updatedOrder, existingOrder.status);
                logger.info('ORDER_EMAIL', 'Status update email sent successfully', {
                    orderId,
                    customerEmail: updatedOrder.customer_email,
                    statusChange: `${existingOrder.status} → ${status}`
                });
            } catch (emailError) {
                logger.warn('ORDER_EMAIL', 'Failed to send status update email', {
                    orderId,
                    customerEmail: updatedOrder.customer_email,
                    error: emailError.message
                });
            }
        }

        performanceTracker.end();

        logger.success('ORDER_CONTROLLER', 'Order status updated successfully', {
            orderId,
            statusChange: `${existingOrder.status} → ${status}`,
            updatedBy: req.user?.email,
            performance: performanceTracker.getDuration()
        });

        res.json({
            success: true,
            data: updatedOrder,
            message: 'Order status updated successfully'
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('ORDER_CONTROLLER', 'Failed to update order status', {
            error: errorInfo,
            orderId: req.params.id,
            requestedStatus: req.body.status,
            userId: req.user?.id,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

// Delete order with enhanced business logic and stock restoration
export const deleteOrder = asyncErrorHandler(async (req, res) => {
    const performanceTracker = trackPerformance('deleteOrder');

    try {
        const { id } = req.params;

        // Parameter validation
        const orderId = parseInt(id, 10);
        if (isNaN(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID',
                details: {
                    field: 'id',
                    received: id,
                    expected: 'positive integer'
                }
            });
        }

        // Get existing order with all related data
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                order_items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                stock_quantity: true
                            }
                        }
                    }
                }
            }
        });

        if (!existingOrder) {
            performanceTracker.end();
            
            logger.warn('ORDER_CONTROLLER', 'Order not found for deletion', { 
                orderId,
                performance: performanceTracker.getDuration()
            });

            return res.status(404).json({
                success: false,
                message: 'Order not found',
                details: {
                    orderId,
                    suggestions: 'Verify the order ID exists in the database'
                }
            });
        }

        // Business rule: Cannot delete delivered orders
        if (existingOrder.status === 'delivered') {
            performanceTracker.end();
            
            logger.warn('ORDER_CONTROLLER', 'Cannot delete delivered order', { 
                orderId,
                status: existingOrder.status,
                customerEmail: existingOrder.customer_email,
                performance: performanceTracker.getDuration()
            });

            return res.status(400).json({
                success: false,
                message: 'Cannot delete delivered orders',
                details: {
                    orderId,
                    currentStatus: existingOrder.status,
                    reason: 'Delivered orders cannot be deleted for record-keeping purposes'
                }
            });
        }

        trackUserAction(req.user, 'ORDER_DELETE', {
            orderId,
            orderStatus: existingOrder.status,
            customerEmail: existingOrder.customer_email,
            totalAmount: existingOrder.total_amount,
            adminUser: req.user?.email,
            timestamp: new Date().toISOString()
        });

        // Enhanced transaction for deletion with stock restoration
        const transactionOperations = async (tx) => {
            // Restore stock for non-delivered orders
            if (['pending', 'confirmed', 'preparing', 'ready', 'cancelled'].includes(existingOrder.status)) {
                for (const item of existingOrder.order_items) {
                    await tx.product.update({
                        where: { id: item.product_id },
                        data: {
                            stock_quantity: {
                                increment: item.quantity
                            }
                        }
                    });
                    
                    logger.debug('ORDER_STOCK_RESTORATION', 'Stock restored for product', {
                        productId: item.product_id,
                        productName: item.product?.name,
                        quantityRestored: item.quantity
                    });
                }
            }

            // Delete the order (cascade will handle order_items)
            await tx.order.delete({
                where: { id: orderId }
            });

            return {
                deletedOrder: {
                    id: existingOrder.id,
                    order_number: existingOrder.order_number,
                    customer_name: existingOrder.customer_name,
                    status: existingOrder.status
                },
                stockRestored: existingOrder.order_items.map(item => ({
                    productId: item.product_id,
                    productName: item.product?.name,
                    quantityRestored: item.quantity
                }))
            };
        };

        const transactionResult = await executeTransaction([transactionOperations]);
        
        if (!transactionResult.success) {
            throw transactionResult.error;
        }

        const result = transactionResult.result;

        performanceTracker.end();

        logger.success('ORDER_CONTROLLER', 'Order deleted successfully', {
            orderId,
            orderNumber: existingOrder.order_number,
            customerEmail: existingOrder.customer_email,
            stockRestored: result.stockRestored.length > 0,
            deletedBy: req.user?.email,
            performance: performanceTracker.getDuration()
        });

        res.json({
            success: true,
            message: 'Order deleted successfully',
            data: {
                deletedOrder: result.deletedOrder,
                stockRestoration: result.stockRestored
            }
        });

    } catch (error) {
        performanceTracker.end();
        
        const errorInfo = classifyError(error);
        logger.error('ORDER_CONTROLLER', 'Failed to delete order', {
            error: errorInfo,
            orderId: req.params.id,
            userId: req.user?.id,
            performance: performanceTracker.getDuration()
        });

        throw error;
    }
});

// Enhanced exports with default export for main functionality
export {
    generateOrderNumber
};

export default {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    generateOrderNumber
};