/**
 * 🌸 FloresYa Logs Controller - Frontend Logging API
 * Handles frontend log submissions for debugging and monitoring
 */

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

interface LogEntry {
  timestamp: string;
  level: string;
  module: string;
  message: string;
  data?: unknown;
}

export class LogsController {
  /**
   * POST /api/logs/frontend
   * Receive and process frontend logs
   */
  public async receiveFrontendLogs(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Invalid log data',
          errors: errors.array()
        });
        return;
      }

      const { logs, sessionId }: { logs: LogEntry[], sessionId?: string } = req.body;

      // Validate required fields
      if (!Array.isArray(logs)) {
        res.status(400).json({
          success: false,
          message: 'Logs must be an array'
        });
        return;
      }

      // Process logs (in production, you might want to store them in a database)
      console.log(`📊 Received ${logs.length} logs from frontend session: ${sessionId ?? 'unknown'}`);

      // Log a summary of the received logs
      if (logs.length > 0) {
        const logLevels = logs.reduce((acc: Record<string, number>, log) => {
          acc[log.level] = (acc[log.level] ?? 0) + 1;
          return acc;
        }, {});

        console.log(`📈 Log summary:`, logLevels);

        // Log any errors or warnings
        const errorsAndWarnings = logs.filter((log) =>
          log.level === 'ERROR' || log.level === 'WARN'
        );

        if (errorsAndWarnings.length > 0) {
          console.log(`⚠️ Issues detected: ${errorsAndWarnings.length} errors/warnings`);
          errorsAndWarnings.forEach((log) => {
            console.log(`[${log.level}] ${log.module}: ${log.message}`, log.data ?? {});
          });
        }
      }

      // In development, you might want to store logs in a file or database
      // For now, just acknowledge receipt
      res.status(200).json({
        success: true,
        message: 'Logs received successfully',
        received: logs.length,
        sessionId: sessionId
      });

    } catch (error) {
      console.error('LogsController.receiveFrontendLogs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process frontend logs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Validation middleware
export const logsValidators = {
  receiveFrontendLogs: [
    body('logs').isArray().withMessage('Logs must be an array'),
    body('logs.*.timestamp').isISO8601().withMessage('Invalid timestamp format'),
    body('logs.*.level').isString().withMessage('Log level must be a string'),
    body('logs.*.module').isString().withMessage('Log module must be a string'),
    body('logs.*.message').isString().withMessage('Log message must be a string'),
    body('sessionId').optional().isString().withMessage('Session ID must be a string')
  ]
};