"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.updateContactInfo = exports.sendErrorResponse = exports.globalErrorHandler = exports.errorHandlers = exports.default = exports.classifyError = exports.asyncErrorHandler = exports.USER_MESSAGES = exports.ADMIN_CONTACT = void 0;





var _logger = require("./logger.js"); /**
 * Centralized Error Handler for FloresYa - ES6+ Version
 * Enhanced with modern JavaScript features and better error handling
 * Provides user-friendly error messages while logging technical details
 */ // Contact information for users - using const with object properties
const ADMIN_CONTACT = exports.ADMIN_CONTACT = { phone: '+58-XXX-XXXXXXX', // TODO: Replace with actual phone
  email: 'admin@floresya.com', hours: 'Lunes a Viernes 8:00 AM - 6:00 PM'
};

/**
 * Enhanced user-friendly error messages with ES6+ features
 */
const USER_MESSAGES = exports.USER_MESSAGES = {
  DATABASE_ERROR: 'Lo sentimos, ocurrió un problema con la base de datos. Por favor contacte al administrador.',
  PRODUCT_ERROR: 'No pudimos procesar su solicitud de producto en este momento. Por favor contacte al administrador.',
  ORDER_ERROR: 'Ocurrió un problema al procesar su pedido. Por favor contacte al administrador.',
  PAYMENT_ERROR: 'No se pudo procesar el pago en este momento. Por favor contacte al administrador.',
  AUTH_ERROR: 'Problema con la autenticación. Por favor contacte al administrador.',
  GENERAL_ERROR: 'Lo sentimos, ocurrió un error inesperado. Por favor contacte al administrador.',
  FILE_ERROR: 'No se pudo procesar el archivo. Por favor contacte al administrador.',
  CONNECTION_ERROR: 'No se pudo establecer conexión con el servidor. Por favor contacte al administrador.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  VALIDATION_ERROR: 'Los datos proporcionados no son válidos. Por favor revise e intente nuevamente.',
  RATE_LIMIT_ERROR: 'Demasiadas solicitudes. Por favor espere un momento antes de intentar nuevamente.',
  FORBIDDEN_ERROR: 'No tiene permisos para realizar esta acción.',
  TIMEOUT_ERROR: 'La solicitud tardó demasiado en procesarse. Por favor intente nuevamente.'
};

/**
 * Enhanced error response structure using ES6+ features
 * @param {Object} res - Express response object
 * @param {Error} error - The error object
 * @param {string} userMessage - User-friendly message
 * @param {number} statusCode - HTTP status code
 * @param {Object} additionalData - Additional data to include in response
 */
const sendErrorResponse = (res, error, userMessage, statusCode = 500, additionalData = {}) => {var _res$req, _res$req2, _res$req3, _res$req4, _res$req5;
  // Enhanced logging using our ES6+ logger
  (0, _logger.logError)('ERROR_HANDLER', 'Error response sent', error, {
    statusCode,
    userMessage,
    url: (_res$req = res.req) === null || _res$req === void 0 ? void 0 : _res$req.originalUrl,
    method: (_res$req2 = res.req) === null || _res$req2 === void 0 ? void 0 : _res$req2.method,
    ip: (_res$req3 = res.req) === null || _res$req3 === void 0 ? void 0 : _res$req3.ip,
    userAgent: (_res$req4 = res.req) === null || _res$req4 === void 0 ? void 0 : _res$req4.get('User-Agent'),
    ...additionalData
  });

  // Enhanced response structure
  const response = {
    success: false,
    message: userMessage || USER_MESSAGES.GENERAL_ERROR,
    contact: ADMIN_CONTACT,
    timestamp: new Date().toISOString(),
    requestId: ((_res$req5 = res.req) === null || _res$req5 === void 0 ? void 0 : _res$req5.headers['x-request-id']) || `req_${Date.now()}`,
    ...additionalData
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name
    };
  }

  res.status(statusCode).json(response);
};

/**
 * Enhanced error classification using ES6+ features
 */exports.sendErrorResponse = sendErrorResponse;
const classifyError = (error) => {
  const { message, name, code } = error;
  const messageString = (message === null || message === void 0 ? void 0 : message.toLowerCase()) || '';

  // Database error patterns
  if (name === 'PrismaClientKnownRequestError' ||
  messageString.includes('database') ||
  messageString.includes('connection') ||
  messageString.includes('timeout')) {
    return 'database';
  }

  // Validation error patterns
  if (name === 'ValidationError' ||
  messageString.includes('validation') ||
  messageString.includes('required') ||
  messageString.includes('invalid')) {
    return 'validation';
  }

  // Authentication error patterns
  if (name === 'AuthenticationError' ||
  messageString.includes('unauthorized') ||
  messageString.includes('authentication') ||
  messageString.includes('token')) {
    return 'auth';
  }

  // File processing error patterns
  if (messageString.includes('file') ||
  messageString.includes('upload') ||
  messageString.includes('image')) {
    return 'file';
  }

  // Rate limiting
  if (code === 'RATE_LIMIT_EXCEEDED' || messageString.includes('rate limit')) {
    return 'rateLimit';
  }

  return 'generic';
};

/**
 * Enhanced error handlers using ES6+ method shorthand and arrow functions
 */exports.classifyError = classifyError;
const errorHandlers = exports.errorHandlers = {
  // Smart error handler that auto-classifies errors
  handleError(res, error, context = '', overrideType = null) {
    const errorType = overrideType || classifyError(error);
    const handlerMap = {
      database: () => this.handleDatabaseError(res, error, context),
      validation: () => this.handleValidationError(res, error, null, context),
      auth: () => this.handleAuthError(res, error, context),
      file: () => this.handleFileError(res, error, context),
      rateLimit: () => this.handleRateLimitError(res, error, context),
      forbidden: () => this.handleForbiddenError(res, error, context),
      timeout: () => this.handleTimeoutError(res, error, context),
      generic: () => this.handleGenericError(res, error, context)
    };

    const handler = handlerMap[errorType] || handlerMap.generic;
    return handler();
  },

  // Database errors with enhanced context
  handleDatabaseError(res, error, context = '') {
    const enhancedContext = {
      context: context || 'database_operation',
      errorType: 'database',
      dbOperation: context.includes('select') ? 'read' :
      context.includes('insert') ? 'create' :
      context.includes('update') ? 'update' :
      context.includes('delete') ? 'delete' : 'unknown'
    };

    sendErrorResponse(res, error, USER_MESSAGES.DATABASE_ERROR, 500, enhancedContext);
  },

  // Product related errors
  handleProductError(res, error, context = '') {
    sendErrorResponse(res, error, USER_MESSAGES.PRODUCT_ERROR, 500, {
      context: context || 'product_operation',
      errorType: 'product'
    });
  },

  // Order processing errors with enhanced tracking
  handleOrderError(res, error, context = '') {
    sendErrorResponse(res, error, USER_MESSAGES.ORDER_ERROR, 500, {
      context: context || 'order_processing',
      errorType: 'order',
      orderStage: context.includes('create') ? 'creation' :
      context.includes('update') ? 'update' :
      context.includes('payment') ? 'payment' : 'unknown'
    });
  },

  // Payment processing errors
  handlePaymentError(res, error, context = '') {
    sendErrorResponse(res, error, USER_MESSAGES.PAYMENT_ERROR, 500, {
      context: context || 'payment_processing',
      errorType: 'payment',
      paymentStage: context
    });
  },

  // Authentication errors with enhanced security logging
  handleAuthError(res, error, context = '') {var _res$req6, _res$req7;
    // Log security events
    _logger.logger.warn('SECURITY', 'Authentication error occurred', {
      context,
      ip: (_res$req6 = res.req) === null || _res$req6 === void 0 ? void 0 : _res$req6.ip,
      userAgent: (_res$req7 = res.req) === null || _res$req7 === void 0 ? void 0 : _res$req7.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    sendErrorResponse(res, error, USER_MESSAGES.AUTH_ERROR, 401, {
      context: context || 'authentication',
      errorType: 'auth'
    });
  },

  // File processing errors
  handleFileError(res, error, context = '') {
    sendErrorResponse(res, error, USER_MESSAGES.FILE_ERROR, 400, {
      context: context || 'file_processing',
      errorType: 'file'
    });
  },

  // Connection errors
  handleConnectionError(res, error, context = '') {
    sendErrorResponse(res, error, USER_MESSAGES.CONNECTION_ERROR, 503, {
      context: context || 'connection',
      errorType: 'connection'
    });
  },

  // Rate limiting errors
  handleRateLimitError(res, error, context = '') {
    sendErrorResponse(res, error, USER_MESSAGES.RATE_LIMIT_ERROR, 429, {
      context: context || 'rate_limit',
      errorType: 'rateLimit',
      retryAfter: 60 // seconds
    });
  },

  // Forbidden errors
  handleForbiddenError(res, error, context = '') {
    sendErrorResponse(res, error, USER_MESSAGES.FORBIDDEN_ERROR, 403, {
      context: context || 'forbidden',
      errorType: 'forbidden'
    });
  },

  // Timeout errors
  handleTimeoutError(res, error, context = '') {
    sendErrorResponse(res, error, USER_MESSAGES.TIMEOUT_ERROR, 408, {
      context: context || 'timeout',
      errorType: 'timeout'
    });
  },

  // Enhanced not found errors
  handleNotFoundError(res, context = '', resource = 'resource') {var _res$req8, _res$req9;
    const response = {
      success: false,
      message: USER_MESSAGES.NOT_FOUND,
      contact: ADMIN_CONTACT,
      context: context || 'resource_not_found',
      errorType: 'notFound',
      resource,
      timestamp: new Date().toISOString()
    };

    _logger.logger.info('ERROR_HANDLER', `Resource not found: ${resource}`, {
      context,
      url: (_res$req8 = res.req) === null || _res$req8 === void 0 ? void 0 : _res$req8.originalUrl,
      method: (_res$req9 = res.req) === null || _res$req9 === void 0 ? void 0 : _res$req9.method
    });

    res.status(404).json(response);
  },

  // Enhanced validation errors with detailed field information
  handleValidationError(res, error, validationDetails = null, context = '') {
    const enhancedDetails = validationDetails ? {
      fields: Array.isArray(validationDetails) ? validationDetails : [validationDetails],
      totalErrors: Array.isArray(validationDetails) ? validationDetails.length : 1
    } : null;

    sendErrorResponse(res, error, USER_MESSAGES.VALIDATION_ERROR, 400, {
      context: context || 'validation',
      errorType: 'validation',
      validation_details: enhancedDetails
    });
  },

  // Generic error handler with enhanced classification
  handleGenericError(res, error, context = '') {
    sendErrorResponse(res, error, USER_MESSAGES.GENERAL_ERROR, 500, {
      context: context || 'general',
      errorType: 'generic'
    });
  }
};

/**
 * Enhanced middleware for unhandled errors using ES6+ features
 */
const globalErrorHandler = (err, req, res, next) => {
  const { method, originalUrl, ip, headers } = req;

  // Enhanced error logging
  (0, _logger.logError)('GLOBAL_ERROR_HANDLER', 'Unhandled error occurred', err, {
    url: originalUrl,
    method,
    ip,
    userAgent: headers['user-agent'],
    requestId: headers['x-request-id']
  });

  if (res.headersSent) {
    return next(err);
  }

  // Use smart error classification
  errorHandlers.handleError(res, err, 'unhandled_error');
};

/**
 * Async error wrapper for express routes
 * Usage: app.get('/route', asyncErrorHandler(async (req, res) => { ... }))
 */exports.globalErrorHandler = globalErrorHandler;
const asyncErrorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Enhanced contact info update with validation
 */exports.asyncErrorHandler = asyncErrorHandler;
const updateContactInfo = (newContact) => {
  // Validate required fields
  const validFields = ['phone', 'email', 'hours'];
  const updates = {};

  for (const [key, value] of Object.entries(newContact)) {
    if (validFields.includes(key) && typeof value === 'string') {
      updates[key] = value;
    }
  }

  Object.assign(ADMIN_CONTACT, updates);

  _logger.logger.info('ERROR_HANDLER', 'Contact information updated', {
    updatedFields: Object.keys(updates),
    timestamp: new Date().toISOString()
  });
};

// ES6+ exports
exports.updateContactInfo = updateContactInfo;










// Default export for main functionality
var _default = exports.default = {
  sendErrorResponse,
  errorHandlers,
  globalErrorHandler,
  asyncErrorHandler,
  updateContactInfo,
  classifyError,
  USER_MESSAGES,
  ADMIN_CONTACT
};
//# sourceMappingURL=errorHandler.js.map