// /home/manager/Sync/ecommerce-floresya/backend/src/routes/logs.js
import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Directorio donde se guardarán los logs del frontend
const LOGS_DIR = path.join(__dirname, '../../../logs/frontend');

// Asegurar que el directorio exista (crearlo si no existe)
async function ensureLogsDirectory() {
    try {
        await fs.access(LOGS_DIR);
    } catch {
        await fs.mkdir(LOGS_DIR, { recursive: true });
        console.log('✅ [LOGS] Directorio de logs creado:', LOGS_DIR);
    }
}

// Llamar a la función al cargar el módulo
ensureLogsDirectory().catch(err => {
    console.error('❌ [LOGS] Error al crear directorio de logs:', err);
});

/**
 * @route POST /api/logs/frontend
 * @desc Recibe logs del frontend de FloresYa y los almacena en archivos JSON
 * @access Public
 */
router.post('/frontend', async (req, res) => {
    try {
        const { sessionId, logs, url, timestamp } = req.body;

        // Validación básica: asegurarse de que hay logs
        if (!Array.isArray(logs) || logs.length === 0) {
            console.warn('⚠️ [LOGS] Se recibió una petición sin logs válidos');
            return res.status(400).json({
                success: false,
                message: 'No se recibieron logs válidos'
            });
        }

        // Crear nombre de archivo: sessionId_fecha.json
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const safeSessionId = (sessionId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${safeSessionId}_${date}.json`;
        const filePath = path.join(LOGS_DIR, fileName);

        // Leer logs existentes (si el archivo ya existe)
        let existingLogs = [];
        try {
            const existingData = await fs.readFile(filePath, 'utf8');
            existingLogs = JSON.parse(existingData);
            if (!Array.isArray(existingLogs)) existingLogs = [];
        } catch (err) {
            // Si el archivo no existe o está corrupto, empezamos con un array vacío
            existingLogs = [];
        }

        // Combinar logs existentes con los nuevos
        const combinedLogs = [...existingLogs, ...logs];

        // Guardar en archivo (sobrescribir)
        await fs.writeFile(filePath, JSON.stringify(combinedLogs, null, 2), 'utf8');

        console.log(`✅ [LOGS] Guardados ${logs.length} logs de sesión: ${sessionId || 'unknown'}`);

        // Responder con éxito (siempre 200 para no romper el frontend)
        return res.status(200).json({
            success: true,
            message: 'Logs recibidos y almacenados correctamente',
            count: logs.length
        });

    } catch (error) {
        console.error('❌ [LOGS] Error al procesar logs del frontend:', error.message);

        // IMPORTANTE: Nunca dejar que falle. Siempre responder 200 para no romper la UX.
        return res.status(200).json({
            success: false,
            message: 'Logs recibidos pero hubo un error al procesarlos (no crítico)',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;