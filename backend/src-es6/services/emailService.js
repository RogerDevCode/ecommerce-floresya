/**
 * Email Service - ES6+ Version
 * Enhanced email functionality with modern JavaScript patterns
 */

import { logger } from '../utils/logger.js';

// Email templates using template literals
const emailTemplates = {
    orderConfirmation: (order) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5aa0;">¡Gracias por tu pedido!</h2>
            <p>Hola ${order.customer_name},</p>
            <p>Hemos recibido tu pedido y lo estamos preparando con mucho cariño.</p>
            
            <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3>Detalles del Pedido</h3>
                <p><strong>Número de Pedido:</strong> ${order.order_number || order.id}</p>
                <p><strong>Total:</strong> $${order.total_amount}</p>
                <p><strong>Estado:</strong> ${order.status}</p>
                ${order.delivery_address ? `<p><strong>Dirección de Entrega:</strong> ${order.delivery_address}</p>` : ''}
            </div>

            <div style="margin: 20px 0;">
                <h3>Productos Ordenados</h3>
                ${order.order_items?.map(item => `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                        <p><strong>${item.product?.name || 'Producto'}</strong></p>
                        <p>Cantidad: ${item.quantity} | Precio: $${item.unit_price}</p>
                    </div>
                `).join('') || '<p>Detalles de productos no disponibles</p>'}
            </div>

            <p>Te mantendremos informado sobre el estado de tu pedido.</p>
            <p>¡Gracias por elegirnos!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
                <p>FloresYa - Flores frescas para cada ocasión</p>
            </div>
        </div>
    `,

    statusUpdate: (order, oldStatus) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5aa0;">Actualización de tu Pedido</h2>
            <p>Hola ${order.customer_name},</p>
            <p>Tu pedido ha sido actualizado:</p>
            
            <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3>Estado del Pedido</h3>
                <p><strong>Número de Pedido:</strong> ${order.order_number || order.id}</p>
                <p><strong>Estado Anterior:</strong> ${oldStatus}</p>
                <p><strong>Estado Actual:</strong> ${order.status}</p>
                ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ''}
            </div>

            ${order.status === 'ready' ? `
                <div style="background: #d4edda; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h3 style="color: #155724;">¡Tu pedido está listo!</h3>
                    <p style="color: #155724;">Tu pedido está listo para entrega. Te contactaremos pronto.</p>
                </div>
            ` : ''}

            ${order.status === 'delivered' ? `
                <div style="background: #d1ecf1; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #17a2b8;">
                    <h3 style="color: #0c5460;">¡Pedido Entregado!</h3>
                    <p style="color: #0c5460;">Tu pedido ha sido entregado exitosamente. ¡Esperamos que disfrutes tus flores!</p>
                </div>
            ` : ''}

            <p>Gracias por tu confianza.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
                <p>FloresYa - Flores frescas para cada ocasión</p>
            </div>
        </div>
    `
};

// Enhanced email configuration
const emailConfig = {
    from: process.env.EMAIL_FROM || 'no-reply@floresya.com',
    smtp: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    }
};

// Mock email sending for development/testing
const mockEmailSend = async (to, subject, html) => {
    const emailData = {
        to,
        subject,
        html,
        timestamp: new Date().toISOString()
    };

    logger.info('EMAIL_SERVICE', 'Mock email sent', emailData);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
        success: true,
        messageId: `mock-${Date.now()}`,
        data: emailData
    };
};

// Real email sending function (placeholder for actual implementation)
const sendEmail = async (to, subject, html) => {
    try {
        // In production, this would use a real email service like:
        // - Nodemailer with SMTP
        // - SendGrid
        // - AWS SES
        // - Mailgun, etc.

        const isDevelopment = process.env.NODE_ENV === 'development';
        const isTest = process.env.NODE_ENV === 'test';

        if (isDevelopment || isTest) {
            return await mockEmailSend(to, subject, html);
        }

        // Placeholder for production email sending
        logger.warn('EMAIL_SERVICE', 'Production email service not implemented', {
            to,
            subject
        });

        return {
            success: false,
            error: 'Production email service not configured'
        };

    } catch (error) {
        logger.error('EMAIL_SERVICE', 'Failed to send email', {
            to,
            subject,
            error: error.message
        });

        throw error;
    }
};

// Enhanced order confirmation email
export const sendOrderConfirmationEmail = async (order) => {
    try {
        if (!order || !order.customer_email) {
            throw new Error('Order or customer email not provided');
        }

        const subject = `Confirmación de Pedido #${order.order_number || order.id} - FloresYa`;
        const html = emailTemplates.orderConfirmation(order);

        const result = await sendEmail(order.customer_email, subject, html);

        logger.success('EMAIL_SERVICE', 'Order confirmation email sent', {
            orderId: order.id,
            orderNumber: order.order_number,
            customerEmail: order.customer_email,
            messageId: result.messageId
        });

        return result;

    } catch (error) {
        logger.error('EMAIL_SERVICE', 'Failed to send order confirmation email', {
            orderId: order?.id,
            customerEmail: order?.customer_email,
            error: error.message
        });

        throw error;
    }
};

// Enhanced order status update email
export const sendOrderStatusUpdateEmail = async (order, oldStatus) => {
    try {
        if (!order || !order.customer_email) {
            throw new Error('Order or customer email not provided');
        }

        if (oldStatus === order.status) {
            logger.debug('EMAIL_SERVICE', 'Status unchanged, skipping email', {
                orderId: order.id,
                status: order.status
            });
            return { success: true, skipped: true };
        }

        const subject = `Actualización de Pedido #${order.order_number || order.id} - FloresYa`;
        const html = emailTemplates.statusUpdate(order, oldStatus);

        const result = await sendEmail(order.customer_email, subject, html);

        logger.success('EMAIL_SERVICE', 'Status update email sent', {
            orderId: order.id,
            orderNumber: order.order_number,
            customerEmail: order.customer_email,
            statusChange: `${oldStatus} → ${order.status}`,
            messageId: result.messageId
        });

        return result;

    } catch (error) {
        logger.error('EMAIL_SERVICE', 'Failed to send status update email', {
            orderId: order?.id,
            customerEmail: order?.customer_email,
            statusChange: `${oldStatus} → ${order?.status}`,
            error: error.message
        });

        throw error;
    }
};

// Utility function to validate email addresses
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Get email service status
export const getEmailServiceStatus = () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        environment: process.env.NODE_ENV,
        mode: isDevelopment || isTest ? 'mock' : 'production',
        configured: isProduction ? Boolean(process.env.SMTP_HOST && process.env.SMTP_USER) : true,
        smtpHost: process.env.SMTP_HOST || 'mock',
        fromAddress: emailConfig.from
    };
};

// Enhanced exports with default export
export default {
    sendOrderConfirmationEmail,
    sendOrderStatusUpdateEmail,
    validateEmail,
    getEmailServiceStatus
};