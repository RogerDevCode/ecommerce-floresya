import { Router } from 'express';
import { SupabaseSchemaExtractor } from '../../utils/schema-extractor.js';
import { serverLogger } from '../../utils/serverLogger.js';
export function createSchemaRoutes() {
    const router = Router();
    router.get('/info', async (req, res) => {
        const timer = serverLogger.startTimer('Schema Info Request');
        try {
            serverLogger.info('SCHEMA', 'Solicitando información del esquema', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            const result = await SupabaseSchemaExtractor.getSchemaInfo();
            serverLogger.success('SCHEMA', 'Información del esquema obtenida', {
                totalTables: result.stats.totalTables,
                totalRecords: result.stats.totalRecords,
                version: result.stats.version
            });
            timer();
            res.status(200).json({
                success: true,
                data: {
                    stats: result.stats,
                    lastUpdate: result.lastUpdate
                },
                message: 'Información del esquema obtenida exitosamente'
            });
        }
        catch (error) {
            serverLogger.error('SCHEMA', 'Error al obtener información del esquema', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            timer();
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : String(error))
                    : undefined
            });
        }
    });
    router.get('/extract', async (req, res) => {
        const timer = serverLogger.startTimer('Schema Extraction');
        try {
            serverLogger.info('SCHEMA', 'Iniciando extracción de esquema completo', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            const result = await SupabaseSchemaExtractor.getSchemaInfo();
            serverLogger.success('SCHEMA', 'Esquema extraído exitosamente', {
                totalTables: result.stats.totalTables,
                totalRecords: result.stats.totalRecords,
                schemaLength: result.schema.length
            });
            timer();
            const acceptHeader = req.get('Accept') || '';
            if (acceptHeader.includes('text/plain') || req.query.format === 'sql') {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Content-Disposition', 'attachment; filename="supabase_schema.sql"');
                res.send(result.schema);
            }
            else {
                res.status(200).json({
                    success: true,
                    data: {
                        schema: result.schema,
                        stats: result.stats
                    },
                    message: 'Esquema extraído exitosamente'
                });
            }
        }
        catch (error) {
            serverLogger.error('SCHEMA', 'Error durante la extracción del esquema', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            timer();
            res.status(500).json({
                success: false,
                message: 'Error durante la extracción del esquema',
                error: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : String(error))
                    : undefined
            });
        }
    });
    router.post('/update-file', async (req, res) => {
        const timer = serverLogger.startTimer('Schema File Update');
        try {
            serverLogger.info('SCHEMA', 'Iniciando actualización de archivo de esquema', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            const extractor = new SupabaseSchemaExtractor({
                outputFile: 'supabase_schema.sql',
                includeData: true,
                includeFunctions: true,
                includeIndexes: true,
                includeTriggers: true,
                includeViews: true,
                includeSeeds: true
            });
            const result = await extractor.extractSchema();
            if (!result.success) {
                throw new Error(result.error || 'Error desconocido durante la extracción');
            }
            serverLogger.success('SCHEMA', 'Archivo de esquema actualizado exitosamente', {
                filePath: 'supabase_schema.sql',
                totalTables: result.stats?.totalTables || 0,
                totalRecords: result.stats?.totalRecords || 0
            });
            timer();
            res.status(200).json({
                success: true,
                data: {
                    filePath: 'supabase_schema.sql',
                    stats: result.stats
                },
                message: 'Archivo supabase_schema.sql actualizado exitosamente'
            });
        }
        catch (error) {
            serverLogger.error('SCHEMA', 'Error al actualizar archivo de esquema', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            timer();
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el archivo de esquema',
                error: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : String(error))
                    : undefined
            });
        }
    });
    return router;
}
