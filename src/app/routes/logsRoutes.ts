/**
 * 🌸 FloresYa Logs Routes - Frontend Logging API
 * Defines API endpoints for frontend log submissions
 */

import { Router } from 'express';
import { LogsController, logsValidators } from '../../controllers/LogsController.js';

export function createLogsRoutes(): Router {
  const router = Router();
  const logsController = new LogsController();

  // POST /api/logs/frontend - Receive frontend logs
  router.post(
    '/frontend',
    logsValidators.receiveFrontendLogs,
    logsController.receiveFrontendLogs.bind(logsController)
  );

  return router;
}