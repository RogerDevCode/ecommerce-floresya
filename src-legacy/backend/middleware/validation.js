import { body, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array()
        });
    }
    next();
};

const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email debe ser válido'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Contraseña debe tener al menos 6 caracteres'),
    body('first_name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
    body('last_name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Apellido debe tener entre 2 y 100 caracteres'),
    body('phone')
        .optional()
        .isMobilePhone('es-VE')
        .withMessage('Teléfono debe ser válido'),
    handleValidationErrors
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email debe ser válido'),
    body('password')
        .notEmpty()
        .withMessage('Contraseña es requerida'),
    handleValidationErrors
];

const orderValidation = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Debe incluir al menos un producto'),
    body('items.*.product_id')
        .isInt({ min: 1 })
        .withMessage('ID de producto debe ser válido'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Cantidad debe ser mayor a 0'),
    body('shipping_address.first_name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Nombre es requerido'),
    body('shipping_address.last_name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Apellido es requerido'),
    body('shipping_address.address_line_1')
        .trim()
        .isLength({ min: 5 })
        .withMessage('Dirección es requerida'),
    body('shipping_address.city')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Ciudad es requerida'),
    body('shipping_address.state')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Estado es requerido'),
    body('shipping_address.phone')
        .isMobilePhone('es-VE')
        .withMessage('Teléfono debe ser válido'),
    body('guest_email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email debe ser válido'),
    handleValidationErrors
];

const paymentValidation = [
    body('order_id')
        .isInt({ min: 1 })
        .withMessage('ID de orden debe ser válido'),
    body('payment_method_id')
        .isInt({ min: 1 })
        .withMessage('Método de pago debe ser válido'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Monto debe ser mayor a 0'),
    body('reference_number')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Número de referencia es requerido'),
    handleValidationErrors
];

const productValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Nombre debe tener entre 2 y 255 caracteres'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Descripción debe tener máximo 2000 caracteres'),
    body('price')
        .isFloat({ min: 0.01 })
        .withMessage('Precio debe ser mayor a 0'),
    body('category_id')
        .isInt({ min: 1 })
        .withMessage('Categoría debe ser válida'),
    body('stock_quantity')
        .isInt({ min: 0 })
        .withMessage('Cantidad en stock debe ser mayor o igual a 0'),
    handleValidationErrors
];

export {
    registerValidation,
    loginValidation,
    orderValidation,
    paymentValidation,
    productValidation,
    handleValidationErrors
};