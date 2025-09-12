/**
 * Centralized Error Handler for FloresYa
 * Provides user-friendly error messages while logging technical details
 */

// Contact information for users
const ADMIN_CONTACT = {
    phone: '+58-XXX-XXXXXXX', // TODO: Replace with actual phone
    email: 'admin@floresya.com',
    hours: 'Lunes a Viernes 8:00 AM - 6:00 PM'
};

/**
 * Generic user-friendly error messages
 */
const USER_MESSAGES = {
    DATABASE_ERROR: 'Lo sentimos, ocurrió un problema con la base de datos. Por favor contacte al administrador.',
    PRODUCT_ERROR: 'No pudimos procesar su solicitud de producto en este momento. Por favor contacte al administrador.',
    ORDER_ERROR: 'Ocurrió un problema al procesar su pedido. Por favor contacte al administrador.',
    PAYMENT_ERROR: 'No se pudo procesar el pago en este momento. Por favor contacte al administrador.',
    AUTH_ERROR: 'Problema con la autenticación. Por favor contacte al administrador.',
    GENERAL_ERROR: 'Lo sentimos, ocurrió un error inesperado. Por favor contacte al administrador.',
    FILE_ERROR: 'No se pudo procesar el archivo. Por favor contacte al administrador.',
    CONNECTION_ERROR: 'No se pudo establecer conexión con el servidor. Por favor contacte al administrador.',
    NOT_FOUND: 'El recurso solicitado no fue encontrado.',
    VALIDATION_ERROR: 'Los datos proporcionados no son válidos. Por favor revise e intente nuevamente.'
};

/**
 * Standard error response structure
 * @param {Object} res - Express response object
 * @param {Error} error - The error object
 * @param {string} userMessage - User-friendly message
 * @param {number} statusCode - HTTP status code
 * @param {Object} additionalData - Additional data to include in response
 */
function sendErrorResponse(res, error, userMessage, statusCode = 500, additionalData = {}) {
    // Log technical details for debugging
    console.error('=== ERROR LOG ===');
    console.error('Time:', new Date().toISOString());
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Additional Data:', additionalData);
    console.error('================');

    // Send user-friendly response
    res.status(statusCode).json({
        success: false,
        message: userMessage || USER_MESSAGES.GENERAL_ERROR,
        contact: ADMIN_CONTACT,
        timestamp: new Date().toISOString(),
        ...additionalData
    });
}

/**
 * Specific error handlers
 */
const errorHandlers = {
    // Database errors
    handleDatabaseError: (res, error, context = '') => {
        sendErrorResponse(res, error, USER_MESSAGES.DATABASE_ERROR, 500, {
            context: context || 'database_operation'
        });
    },

    // Product related errors
    handleProductError: (res, error, context = '') => {
        sendErrorResponse(res, error, USER_MESSAGES.PRODUCT_ERROR, 500, {
            context: context || 'product_operation'
        });
    },

    // Order processing errors
    handleOrderError: (res, error, context = '') => {
        sendErrorResponse(res, error, USER_MESSAGES.ORDER_ERROR, 500, {
            context: context || 'order_processing'
        });
    },

    // Payment processing errors
    handlePaymentError: (res, error, context = '') => {
        sendErrorResponse(res, error, USER_MESSAGES.PAYMENT_ERROR, 500, {
            context: context || 'payment_processing'
        });
    },

    // Authentication errors
    handleAuthError: (res, error, context = '') => {
        sendErrorResponse(res, error, USER_MESSAGES.AUTH_ERROR, 401, {
            context: context || 'authentication'
        });
    },

    // File processing errors
    handleFileError: (res, error, context = '') => {
        sendErrorResponse(res, error, USER_MESSAGES.FILE_ERROR, 400, {
            context: context || 'file_processing'
        });
    },

    // Connection errors
    handleConnectionError: (res, error, context = '') => {
        sendErrorResponse(res, error, USER_MESSAGES.CONNECTION_ERROR, 503, {
            context: context || 'connection'
        });
    },

    // Not found errors
    handleNotFoundError: (res, context = '') => {
        res.status(404).json({
            success: false,
            message: USER_MESSAGES.NOT_FOUND,
            contact: ADMIN_CONTACT,
            context: context || 'resource_not_found',
            timestamp: new Date().toISOString()
        });
    },

    // Validation errors
    handleValidationError: (res, error, validationDetails = null) => {
        sendErrorResponse(res, error, USER_MESSAGES.VALIDATION_ERROR, 400, {
            context: 'validation',
            validation_details: validationDetails
        });
    },

    // Generic error handler
    handleGenericError: (res, error, context = '') => {
        sendErrorResponse(res, error, USER_MESSAGES.GENERAL_ERROR, 500, {
            context: context || 'general'
        });
    }
};

/**
 * Middleware for unhandled errors
 */
function globalErrorHandler(err, req, res, next) {
    console.error('=== UNHANDLED ERROR ===');
    console.error('URL:', req.originalUrl);
    console.error('Method:', req.method);
    console.error('Error:', err);
    console.error('=====================');

    if (res.headersSent) {
        return next(err);
    }

    errorHandlers.handleGenericError(res, err, 'unhandled_error');
}

/**
 * Update contact information
 */
function updateContactInfo(newContact) {
    Object.assign(ADMIN_CONTACT, newContact);
}

export {
    sendErrorResponse,
    errorHandlers,
    globalErrorHandler,
    updateContactInfo,
    USER_MESSAGES,
    ADMIN_CONTACT
};