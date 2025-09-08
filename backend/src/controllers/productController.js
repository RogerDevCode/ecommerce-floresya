const {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} = require('../utils/logger.js');

// EXCLUSIVAMENTE SUPABASE - Todas las operaciones redirigen al controlador de Supabase
const supabaseController = require('./productControllerSupabase');
const logger = require('../utils/logger');

// Todas las funciones redirigen al controlador de Supabase con logging
const getAllProducts = async (req, res) => {
    const timer = logger.timer('getAllProducts');
    logger.setContext({ 
        controller: 'productController',
        action: 'getAllProducts',
        userId: req.user?.id,
        requestId: req.headers['x-request-id']
    });
    
    try {
        logger.api(req.method, req.originalUrl, {
            query: req.query,
            userRole: req.user?.role
        });
        
        const result = await supabaseController.getAllProducts(req, res);
        timer.end('CONTROLLER');
        
        logger.success('CONTROLLER', 'getAllProducts completed successfully', {
            query: req.query
        });
        
        return result;
    } catch (error) {
        timer.end('CONTROLLER');
        logger.error('CONTROLLER', 'getAllProducts failed', {
            query: req.query,
            error: error.message
        }, error);
        throw error;
    } finally {
        logger.clearContext();
    }
};

const getProductById = async (req, res) => {
    const timer = logger.timer('getProductById');
    logger.setContext({ 
        controller: 'productController',
        action: 'getProductById',
        productId: req.params.id,
        userId: req.user?.id
    });
    
    try {
        logger.api(req.method, req.originalUrl, {
            params: req.params,
            userRole: req.user?.role
        });
        
        const result = await supabaseController.getProductById(req, res);
        timer.end('CONTROLLER');
        
        logger.success('CONTROLLER', 'getProductById completed successfully', {
            productId: req.params.id
        });
        
        return result;
    } catch (error) {
        timer.end('CONTROLLER');
        logger.error('CONTROLLER', 'getProductById failed', {
            productId: req.params.id,
            error: error.message
        }, error);
        throw error;
    } finally {
        logger.clearContext();
    }
};

const getFeaturedProducts = async (req, res) => {
    const timer = logger.timer('getFeaturedProducts');
    logger.setContext({ 
        controller: 'productController',
        action: 'getFeaturedProducts',
        userId: req.user?.id
    });
    
    try {
        logger.api(req.method, req.originalUrl, {
            query: req.query
        });
        
        const result = await supabaseController.getFeaturedProducts(req, res);
        timer.end('CONTROLLER');
        
        logger.success('CONTROLLER', 'getFeaturedProducts completed successfully');
        return result;
    } catch (error) {
        timer.end('CONTROLLER');
        logger.error('CONTROLLER', 'getFeaturedProducts failed', {
            error: error.message
        }, error);
        throw error;
    } finally {
        logger.clearContext();
    }
};

const createProduct = async (req, res) => {
    const timer = logger.timer('createProduct');
    logger.setContext({ 
        controller: 'productController',
        action: 'createProduct',
        userId: req.user?.id,
        userRole: req.user?.role
    });
    
    try {
        logger.api(req.method, req.originalUrl, {
            body: logger.sanitizeBody(req.body),
            userRole: req.user?.role
        });
        
        const result = await supabaseController.createProduct(req, res);
        timer.end('CONTROLLER');
        
        logger.success('CONTROLLER', 'createProduct completed successfully', {
            productName: req.body.name
        });
        
        return result;
    } catch (error) {
        timer.end('CONTROLLER');
        logger.error('CONTROLLER', 'createProduct failed', {
            productName: req.body.name,
            error: error.message
        }, error);
        throw error;
    } finally {
        logger.clearContext();
    }
};

const updateProduct = async (req, res) => {
    const timer = logger.timer('updateProduct');
    logger.setContext({ 
        controller: 'productController',
        action: 'updateProduct',
        productId: req.params.id,
        userId: req.user?.id,
        userRole: req.user?.role
    });
    
    try {
        logger.api(req.method, req.originalUrl, {
            params: req.params,
            body: logger.sanitizeBody(req.body),
            userRole: req.user?.role
        });
        
        const result = await supabaseController.updateProduct(req, res);
        timer.end('CONTROLLER');
        
        logger.success('CONTROLLER', 'updateProduct completed successfully', {
            productId: req.params.id,
            productName: req.body.name
        });
        
        return result;
    } catch (error) {
        timer.end('CONTROLLER');
        logger.error('CONTROLLER', 'updateProduct failed', {
            productId: req.params.id,
            productName: req.body.name,
            error: error.message
        }, error);
        throw error;
    } finally {
        logger.clearContext();
    }
};

const deleteProduct = async (req, res) => {
    const timer = logger.timer('deleteProduct');
    logger.setContext({ 
        controller: 'productController',
        action: 'deleteProduct',
        productId: req.params.id,
        userId: req.user?.id,
        userRole: req.user?.role
    });
    
    try {
        logger.api(req.method, req.originalUrl, {
            params: req.params,
            userRole: req.user?.role
        });
        
        logger.warn('CONTROLLER', 'Attempting to delete product', {
            productId: req.params.id,
            adminUser: req.user?.email
        });
        
        const result = await supabaseController.deleteProduct(req, res);
        timer.end('CONTROLLER');
        
        logger.success('CONTROLLER', 'deleteProduct completed successfully', {
            productId: req.params.id
        });
        
        return result;
    } catch (error) {
        timer.end('CONTROLLER');
        logger.error('CONTROLLER', 'deleteProduct failed', {
            productId: req.params.id,
            error: error.message
        }, error);
        throw error;
    } finally {
        logger.clearContext();
    }
};

const getHomepageProducts = async (req, res) => {
    return supabaseController.getHomepageProducts(req, res);
};

const updateHomepageSettings = async (req, res) => {
    return supabaseController.updateHomepageSettings(req, res);
};

module.exports = {
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    getHomepageProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateHomepageSettings,
};
