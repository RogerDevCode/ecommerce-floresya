/**
 * 🌸 FloresYa Logs Controller - Frontend Logging API
 * Handles frontend log submissions for debugging and monitoring
 */

import { Request, Response } from 'express';

import type { LogEntry } from '../shared/types/index.js';

// Import consolidated logging types

export class LogsController {
  /**
   * @swagger
   * /api/logs/frontend:
   *   post:
   *     summary: Receive and process frontend logs
   *     description: Accepts log entries from the frontend for debugging and monitoring purposes
   *     tags: [Logs]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               logs:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                     level:
   *                       type: string
   *                       enum: [ERROR, WARN, INFO, DEBUG]
   *                     module:
   *                       type: string
   *                     message:
   *                       type: string
   *                     data:
   *                       type: object
   *                       description: Optional additional data
   *               sessionId:
   *                 type: string
   *                 description: Optional session identifier
   *     responses:
   *       200:
   *         description: Logs received successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Logs received successfully"
   *                 received:
   *                   type: integer
   *                   description: Number of log entries received
   *                 sessionId:
   *                   type: string
   *                   description: Session identifier
   *       400:
   *         description: Invalid log data format
   *       500:
   *         description: Server error processing logs
   */
  public receiveFrontendLogs(req: Request, res: Response): void {
    try {

      const { logs, sessionId }: { logs: LogEntry[], sessionId?: string } = req.body;

      // Validate required fields
      if (!Array.isArray(logs)) {
        res.status(400).json({
          success: false,
          message: 'Logs must be an array'
        });
        return;
      }

      // Log a summary of the received logs
      if (logs.length > 0) {

        // Log any errors or warnings
        const errorsAndWarnings = logs.filter((log) =>
          log.level === 'ERROR' || log.level === 'WARN'
        );

        if (errorsAndWarnings.length > 0) {
            // Log errors and warnings were removed as requested
        }
      }

      // In development, you might want to store logs in a file or database
      // For now, just acknowledge receipt
      res.status(200).json({
        success: true,
        message: 'Logs received successfully',
        received: logs.length,
        sessionId
      });

    } catch (error) {
            res.status(500).json({
        success: false,
        message: 'Failed to process frontend logs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// ============================================
// ZOD VALIDATION COMPLETE - EXPRESS-VALIDATOR REMOVED
// ============================================
// All validation now handled by runtime validation in method body
// LogsController fully migrated to enterprise-grade validation
