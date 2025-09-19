import { body, validationResult } from 'express-validator';
export class LogsController {
    async receiveFrontendLogs(req, res) {
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
            const { logs, sessionId } = req.body;
            if (!Array.isArray(logs)) {
                res.status(400).json({
                    success: false,
                    message: 'Logs must be an array'
                });
                return;
            }
            console.log(`📊 Received ${logs.length} logs from frontend session: ${sessionId ?? 'unknown'}`);
            if (logs.length > 0) {
                const logLevels = logs.reduce((acc, log) => {
                    acc[log.level] = (acc[log.level] ?? 0) + 1;
                    return acc;
                }, {});
                console.log(`📈 Log summary:`, logLevels);
                const errorsAndWarnings = logs.filter((log) => log.level === 'ERROR' || log.level === 'WARN');
                if (errorsAndWarnings.length > 0) {
                    console.log(`⚠️ Issues detected: ${errorsAndWarnings.length} errors/warnings`);
                    errorsAndWarnings.forEach((log) => {
                        console.log(`[${log.level}] ${log.module}: ${log.message}`, log.data ?? {});
                    });
                }
            }
            res.status(200).json({
                success: true,
                message: 'Logs received successfully',
                received: logs.length,
                sessionId: sessionId
            });
        }
        catch (error) {
            console.error('LogsController.receiveFrontendLogs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process frontend logs',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
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
