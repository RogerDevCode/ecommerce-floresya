import { Router } from 'express';
import { LogsController, logsValidators } from '../../controllers/LogsController.js';
export function createLogsRoutes() {
    const router = Router();
    const logsController = new LogsController();
    router.post('/frontend', logsValidators.receiveFrontendLogs, logsController.receiveFrontendLogs.bind(logsController));
    return router;
}
