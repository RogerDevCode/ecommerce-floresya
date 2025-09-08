const { executeQuery } = require('../config/database');
const { errorHandlers } = require('../utils/errorHandler');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../../uploads/payments'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'), false);
        }
    }
});

const createPayment = async (req, res) => {
    try {
        const {
            order_id,
            payment_method_id,
            amount,
            reference_number,
            payment_details
        } = req.body;

        const order = await executeQuery(
            'SELECT id, total_amount, status FROM orders WHERE id = ?',
            [order_id]
        );

        if (order.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        const orderData = order[0];

        if (orderData.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Esta orden ya no acepta pagos'
            });
        }

        if (parseFloat(amount) !== parseFloat(orderData.total_amount)) {
            return res.status(400).json({
                success: false,
                message: 'El monto no coincide con el total de la orden'
            });
        }

        const paymentMethod = await executeQuery(
            'SELECT id, type FROM payment_methods WHERE id = ? AND active = true',
            [payment_method_id]
        );

        if (paymentMethod.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Método de pago no encontrado'
            });
        }

        let proofImageUrl = null;
        if (req.file) {
            proofImageUrl = `/uploads/payments/${req.file.filename}`;
        }

        const result = await executeQuery(`
            INSERT INTO payments (
                order_id, payment_method_id, amount, status, reference_number,
                payment_details, proof_image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            order_id,
            payment_method_id,
            amount,
            'pending',
            reference_number || null,
            payment_details ? JSON.stringify(payment_details) : null,
            proofImageUrl
        ]);

        res.status(201).json({
            success: true,
            message: 'Pago registrado exitosamente. Será verificado pronto.',
            data: {
                payment_id: result.insertId,
                status: 'pending'
            }
        });

    } catch (error) {
        errorHandlers.handlePaymentError(res, error, 'create_payment');
    }
};

const getPaymentsByOrder = async (req, res) => {
    try {
        const { order_id } = req.params;
        const userId = req.user ? req.user.id : null;

        let whereClause = 'WHERE p.order_id = ?';
        let params = [order_id];

        if (req.user && req.user.role !== 'admin') {
            whereClause += ' AND o.user_id = ?';
            params.push(userId);
        }

        const payments = await executeQuery(`
            SELECT 
                p.*,
                pm.name as payment_method_name,
                pm.type as payment_method_type,
                u.first_name as verified_by_first_name,
                u.last_name as verified_by_last_name
            FROM payments p
            LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
            LEFT JOIN orders o ON p.order_id = o.id
            LEFT JOIN users u ON p.verified_by = u.id
            ${whereClause}
            ORDER BY p.created_at DESC
        `, params);

        res.json({
            success: true,
            data: {
                payments: payments.map(payment => ({
                    ...payment,
                    payment_details: payment.payment_details ? JSON.parse(payment.payment_details) : null
                }))
            }
        });

    } catch (error) {
        errorHandlers.handlePaymentError(res, error, 'get_payments_by_order');
    }
};

const getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, payment_method_id, search } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        let params = [];

        if (status) {
            whereClause += ' AND p.status = ?';
            params.push(status);
        }

        if (payment_method_id) {
            whereClause += ' AND p.payment_method_id = ?';
            params.push(payment_method_id);
        }

        if (search) {
            whereClause += ' AND (o.order_number LIKE ? OR p.reference_number LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        const payments = await executeQuery(`
            SELECT 
                p.*,
                o.order_number,
                pm.name as payment_method_name,
                pm.type as payment_method_type,
                u.first_name as user_first_name,
                u.last_name as user_last_name,
                v.first_name as verified_by_first_name,
                v.last_name as verified_by_last_name
            FROM payments p
            LEFT JOIN orders o ON p.order_id = o.id
            LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN users v ON p.verified_by = v.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        const countResult = await executeQuery(`
            SELECT COUNT(*) as total
            FROM payments p
            LEFT JOIN orders o ON p.order_id = o.id
            ${whereClause}
        `, params);

        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                payments: payments.map(payment => ({
                    ...payment,
                    payment_details: payment.payment_details ? JSON.parse(payment.payment_details) : null
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
        errorHandlers.handlePaymentError(res, error, 'get_all_payments');
    }
};

const verifyPayment = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const userId = req.user.id;

        const validStatuses = ['verified', 'failed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado de pago inválido'
            });
        }

        connection = await require('../config/database').getConnection();
        await connection.beginTransaction();

        const payment = await connection.execute(
            'SELECT p.*, o.id as order_id, o.status as order_status FROM payments p LEFT JOIN orders o ON p.order_id = o.id WHERE p.id = ?',
            [id]
        );

        if (payment[0].length === 0) {
            throw new Error('Pago no encontrado');
        }

        const paymentData = payment[0][0];

        if (paymentData.status !== 'pending') {
            throw new Error('Este pago ya ha sido procesado');
        }

        await connection.execute(
            'UPDATE payments SET status = ?, verified_by = ?, verified_at = NOW(), notes = ? WHERE id = ?',
            [status, userId, notes || null, id]
        );

        if (status === 'verified') {
            await connection.execute(
                'UPDATE orders SET status = ? WHERE id = ?',
                ['verified', paymentData.order_id]
            );

            await connection.execute(`
                INSERT INTO order_status_history (order_id, old_status, new_status, notes, changed_by)
                VALUES (?, ?, ?, ?, ?)
            `, [paymentData.order_id, paymentData.order_status, 'verified', 'Pago verificado', userId]);
        }

        await connection.commit();

        res.json({
            success: true,
            message: `Pago ${status === 'verified' ? 'verificado' : 'rechazado'} exitosamente`
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        errorHandlers.handlePaymentError(res, error, 'verify_payment');
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const uploadPaymentProof = upload.single('proof');

module.exports = {
    createPayment,
    getPaymentsByOrder,
    getAllPayments,
    verifyPayment,
    uploadPaymentProof
};