import express from 'express';
import { supabase, useSupabase } from '../config/database.js';

const router = express.Router();

// Database browser endpoint
router.get('/browse/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const limit = parseInt(req.query.limit) || 25;
        const offset = parseInt(req.query.offset) || 0;

        // Validate table name (security)
        const allowedTables = [
            'products', 'occasions', 'users', 'orders', 'order_items', 
            'payments', 'payment_methods', 'settings', 'carousel_images'
        ];

        if (!allowedTables.includes(table)) {
            return res.status(400).json({
                success: false,
                message: 'Tabla no permitida'
            });
        }

        if (useSupabase) {
            // Use Supabase
            const query = supabase
                .from(table)
                .select('*')
                .range(offset, offset + limit - 1)
                .order('id', { ascending: false });

            const { data, error, count } = await query;

            if (error) {
                console.error('Supabase browse error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error consultando la base de datos'
                });
            }

            // Get column information
            let columns = [];
            if (data && data.length > 0) {
                columns = Object.keys(data[0]);
            }

            res.json({
                success: true,
                data: {
                    table,
                    columns,
                    rows: data || [],
                    count: data ? data.length : 0,
                    limit,
                    offset,
                    hasMore: data && data.length === limit
                }
            });

        } else {
            // Use Sequelize (fallback)
            const { sequelize } = await import('../config/database.js');
            
            // Get data
            const [rows] = await sequelize.query(
                `SELECT * FROM ${table} ORDER BY id DESC LIMIT ? OFFSET ?`,
                {
                    replacements: [limit, offset],
                    type: sequelize.QueryTypes.SELECT
                }
            );

            // Get column information
            const [columns] = await sequelize.query(
                `PRAGMA table_info(${table})`,
                { type: sequelize.QueryTypes.SELECT }
            );

            const columnNames = columns.map(col => col.name);

            res.json({
                success: true,
                data: {
                    table,
                    columns: columnNames,
                    rows: rows || [],
                    count: rows ? rows.length : 0,
                    limit,
                    offset,
                    hasMore: rows && rows.length === limit
                }
            });
        }

    } catch (error) {
        console.error('Database browse error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Get table info
router.get('/tables', async (req, res) => {
    try {
        const tables = [
            { name: 'products', description: 'Productos' },
            { name: 'occasions', description: 'Ocasiones' },
            { name: 'users', description: 'Usuarios' },
            { name: 'orders', description: 'Pedidos' },
            { name: 'order_items', description: 'Items de Pedidos' },
            { name: 'payments', description: 'Pagos' },
            { name: 'payment_methods', description: 'Métodos de Pago' },
            { name: 'settings', description: 'Configuraciones' },
            { name: 'carousel_images', description: 'Imágenes Carrusel' }
        ];

        res.json({
            success: true,
            data: { tables }
        });

    } catch (error) {
        console.error('Tables list error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

export default router;