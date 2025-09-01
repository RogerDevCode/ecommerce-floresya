const nodemailer = require('nodemailer');

let transporter;

const initializeEmailService = () => {
    transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    console.log('✅ Email service initialized');
};

const sendOrderConfirmationEmail = async (email, orderData) => {
    try {
        if (!transporter) {
            initializeEmailService();
        }

        const { orderNumber, items, totalAmount, shipping_address } = orderData;

        const itemsHtml = items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${item.product_snapshot.name}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    ${item.quantity}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    $${item.unit_price.toFixed(2)}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    $${item.total_price.toFixed(2)}
                </td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Confirmación de Pedido - FloresYa</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .order-info { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background-color: #6c757d; color: white; padding: 12px; text-align: left; }
                    .total { font-weight: bold; font-size: 18px; color: #28a745; }
                    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="color: #28a745; margin: 0;">FloresYa</h1>
                        <p style="margin: 5px 0 0 0;">Tu floristería en línea de confianza</p>
                    </div>
                    
                    <div class="content">
                        <h2>¡Gracias por tu pedido!</h2>
                        <p>Hemos recibido tu pedido exitosamente. A continuación encontrarás los detalles:</p>
                        
                        <div class="order-info">
                            <h3>Información del Pedido</h3>
                            <p><strong>Número de Orden:</strong> ${orderNumber}</p>
                            <p><strong>Estado:</strong> Pendiente de verificación</p>
                            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-VE')}</p>
                        </div>

                        <h3>Productos Pedidos</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th style="text-align: center;">Cantidad</th>
                                    <th style="text-align: right;">Precio Unit.</th>
                                    <th style="text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                                <tr style="background-color: #f8f9fa;">
                                    <td colspan="3" style="padding: 15px; font-weight: bold;">Total del Pedido:</td>
                                    <td style="padding: 15px; text-align: right;" class="total">$${totalAmount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <h3>Dirección de Entrega</h3>
                        <div class="order-info">
                            <p><strong>${shipping_address.first_name} ${shipping_address.last_name}</strong></p>
                            <p>${shipping_address.address_line_1}</p>
                            ${shipping_address.address_line_2 ? `<p>${shipping_address.address_line_2}</p>` : ''}
                            <p>${shipping_address.city}, ${shipping_address.state}</p>
                            <p>Teléfono: ${shipping_address.phone}</p>
                        </div>

                        <h3>Próximos Pasos</h3>
                        <ol>
                            <li>Procede a realizar el pago usando uno de nuestros métodos disponibles</li>
                            <li>Sube el comprobante de pago en nuestra página web</li>
                            <li>Verificaremos tu pago y cambiaremos el estado a "Verificado"</li>
                            <li>Comenzaremos la preparación de tu pedido</li>
                            <li>Te notificaremos cuando esté listo para entrega</li>
                        </ol>

                        <p><strong>¡Importante!</strong> Tu pedido estará reservado por 24 horas. Si no recibes el pago en ese tiempo, la orden será cancelada automáticamente.</p>
                    </div>
                    
                    <div class="footer">
                        <p>¿Necesitas ayuda? Contáctanos:</p>
                        <p>📧 contacto@floresya.com | 📱 +58412-1234567</p>
                        <p style="font-size: 12px; color: #666; margin-top: 15px;">
                            Este es un correo automático, por favor no respondas a esta dirección.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `FloresYa <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Confirmación de Pedido ${orderNumber} - FloresYa`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de confirmación enviado a ${email}`);

    } catch (error) {
        console.error('❌ Error enviando email de confirmación:', error);
        throw error;
    }
};

const sendOrderStatusUpdateEmail = async (email, orderData) => {
    try {
        if (!transporter) {
            initializeEmailService();
        }

        const { orderNumber, newStatus, notes } = orderData;

        const statusMessages = {
            verified: {
                title: 'Pago Verificado',
                message: 'Hemos verificado tu pago exitosamente. Tu pedido está siendo preparado.',
                color: '#28a745'
            },
            preparing: {
                title: 'Preparando Pedido',
                message: 'Tu pedido está siendo preparado con mucho cuidado por nuestro equipo.',
                color: '#ffc107'
            },
            shipped: {
                title: 'Pedido Enviado',
                message: 'Tu pedido ha sido enviado y está en camino a tu dirección.',
                color: '#17a2b8'
            },
            delivered: {
                title: 'Pedido Entregado',
                message: '¡Tu pedido ha sido entregado exitosamente! Esperamos que disfrutes tus flores.',
                color: '#28a745'
            },
            cancelled: {
                title: 'Pedido Cancelado',
                message: 'Tu pedido ha sido cancelado. Si tienes preguntas, contáctanos.',
                color: '#dc3545'
            }
        };

        const statusInfo = statusMessages[newStatus] || {
            title: 'Actualización de Pedido',
            message: 'Tu pedido ha sido actualizado.',
            color: '#6c757d'
        };

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Actualización de Pedido - FloresYa</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .status-box { 
                        background-color: ${statusInfo.color}; 
                        color: white; 
                        padding: 20px; 
                        text-align: center; 
                        margin: 20px 0; 
                        border-radius: 5px; 
                    }
                    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="color: #28a745; margin: 0;">FloresYa</h1>
                        <p style="margin: 5px 0 0 0;">Tu floristería en línea de confianza</p>
                    </div>
                    
                    <div class="content">
                        <h2>Actualización de tu Pedido</h2>
                        
                        <div class="status-box">
                            <h3 style="margin: 0 0 10px 0;">${statusInfo.title}</h3>
                            <p style="margin: 0;">Orden: ${orderNumber}</p>
                        </div>
                        
                        <p>${statusInfo.message}</p>
                        
                        ${notes ? `<p><strong>Notas adicionales:</strong> ${notes}</p>` : ''}
                        
                        <p>Puedes revisar el estado completo de tu pedido en nuestra página web usando tu número de orden.</p>
                    </div>
                    
                    <div class="footer">
                        <p>¿Necesitas ayuda? Contáctanos:</p>
                        <p>📧 contacto@floresya.com | 📱 +58412-1234567</p>
                        <p style="font-size: 12px; color: #666; margin-top: 15px;">
                            Este es un correo automático, por favor no respondas a esta dirección.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `FloresYa <${process.env.SMTP_USER}>`,
            to: email,
            subject: `${statusInfo.title} - Orden ${orderNumber}`,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de actualización enviado a ${email}`);

    } catch (error) {
        console.error('❌ Error enviando email de actualización:', error);
        throw error;
    }
};

module.exports = {
    initializeEmailService,
    sendOrderConfirmationEmail,
    sendOrderStatusUpdateEmail
};