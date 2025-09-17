/**
 * 🌸 FloresYa Schema Routes - Enterprise Edition
 * Rutas para gestionar el esquema de base de datos desde el panel admin
 */

import { Router, Request, Response } from 'express';
import { SupabaseSchemaExtractor } from '../../utils/schema-extractor.js';
import { serverLogger } from '../../utils/serverLogger.js';

export function createSchemaRoutes(): Router {
  const router = Router();

  /**
   * @swagger
   * /api/admin/schema/info:
   *   get:
   *     summary: Obtiene información del esquema de base de datos
   *     description: Retorna estadísticas y metadatos del esquema actual
   *     tags: [Admin, Schema]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Información del esquema obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     stats:
   *                       type: object
   *                       properties:
   *                         totalTables:
   *                           type: number
   *                           example: 9
   *                         totalRecords:
   *                           type: number
   *                           example: 246
   *                         totalIndexes:
   *                           type: number
   *                           example: 26
   *                         extractionDate:
   *                           type: string
   *                           format: date-time
   *                         version:
   *                           type: string
   *                           example: "2.0.0"
   *                     lastUpdate:
   *                       type: string
   *                       format: date-time
   *       500:
   *         description: Error interno del servidor
   */
  router.get('/info', async (req: Request, res: Response) => {
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

      timer(); // End timer

      res.status(200).json({
        success: true,
        data: {
          stats: result.stats,
          lastUpdate: result.lastUpdate
        },
        message: 'Información del esquema obtenida exitosamente'
      });

    } catch (error) {
      serverLogger.error('SCHEMA', 'Error al obtener información del esquema', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      timer(); // End timer

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      });
    }
  });

  /**
   * @swagger
   * /api/admin/schema/extract:
   *   get:
   *     summary: Extrae el esquema completo de la base de datos
   *     description: Genera el SQL schema completo desde Supabase
   *     tags: [Admin, Schema]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Esquema extraído exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     schema:
   *                       type: string
   *                       description: SQL schema completo
   *                     stats:
   *                       type: object
   *                       properties:
   *                         totalTables:
   *                           type: number
   *                         totalRecords:
   *                           type: number
   *                         extractionDate:
   *                           type: string
   *           text/plain:
   *             schema:
   *               type: string
   *               description: SQL schema como texto plano
   *       500:
   *         description: Error durante la extracción
   */
  router.get('/extract', async (req: Request, res: Response) => {
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

      timer(); // End timer

      // Determinar formato de respuesta basado en Accept header
      const acceptHeader = req.get('Accept') || '';

      if (acceptHeader.includes('text/plain') || req.query.format === 'sql') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="supabase_schema.sql"');
        res.send(result.schema);
      } else {
        res.status(200).json({
          success: true,
          data: {
            schema: result.schema,
            stats: result.stats
          },
          message: 'Esquema extraído exitosamente'
        });
      }

    } catch (error) {
      serverLogger.error('SCHEMA', 'Error durante la extracción del esquema', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      timer(); // End timer

      res.status(500).json({
        success: false,
        message: 'Error durante la extracción del esquema',
        error: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      });
    }
  });

  /**
   * @swagger
   * /api/admin/schema/update-file:
   *   post:
   *     summary: Actualiza el archivo supabase_schema.sql
   *     description: Extrae el esquema y actualiza el archivo físico en el proyecto
   *     tags: [Admin, Schema]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Archivo actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     filePath:
   *                       type: string
   *                       example: "supabase_schema.sql"
   *                     stats:
   *                       type: object
   *                 message:
   *                   type: string
   *                   example: "Archivo supabase_schema.sql actualizado exitosamente"
   *       500:
   *         description: Error al actualizar el archivo
   */
  router.post('/update-file', async (req: Request, res: Response) => {
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

      timer(); // End timer

      res.status(200).json({
        success: true,
        data: {
          filePath: 'supabase_schema.sql',
          stats: result.stats
        },
        message: 'Archivo supabase_schema.sql actualizado exitosamente'
      });

    } catch (error) {
      serverLogger.error('SCHEMA', 'Error al actualizar archivo de esquema', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      timer(); // End timer

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
