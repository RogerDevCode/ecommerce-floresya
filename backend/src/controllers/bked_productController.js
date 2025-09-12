import {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} from '../utils/bked_logger.js';

// USANDO PRISMA - Todas las operaciones redirigen al controlador de Prisma
import * as prismaController from './productControllerPrisma.js';

// Todas las funciones redirigen al controlador de Supabase con logging
const getAllProducts = async (req, res) => {
    const timer = startTimer('getAllProducts');
    // logger.setContext({ 
        controller: 'productController',
        action: 'getAllProducts',
        userId: req.user?.id,
        requestId: req.headers['x-request-id']
    });
    
    try {
        logger.info(req.method, req.originalUrl, {
            query: req.query,
            userRole: req.user?.role
        });
        
        const result = await prismaController.getAllProducts(req, res);
        timer.end();
        
        logger.success('CONTROLLER', 'getAllProducts completed successfully', {
            query: req.query
        });
        
        return result;
    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'getAllProducts failed', {
            query: req.query,
            error: error.message
        }, error);
        throw error;
    } finally {
        // Context cleared
    }
};

const getProductById = async (req, res) => {
    const timer = startTimer('getProductById');
    // logger.setContext({ 
        controller: 'productController',
        action: 'getProductById',
        productId: req.params.id,
        userId: req.user?.id
    });
    
    try {
        logger.info(req.method, req.originalUrl, {
            params: req.params,
            userRole: req.user?.role
        });
        
        const result = await prismaController.getProductById(req, res);
        timer.end();
        
        logger.success('CONTROLLER', 'getProductById completed successfully', {
            productId: req.params.id
        });
        
        return result;
    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'getProductById failed', {
            productId: req.params.id,
            error: error.message
        }, error);
        throw error;
    } finally {
        // Context cleared
    }
};

const getFeaturedProducts = async (req, res) => {
    const timer = startTimer('getFeaturedProducts');
    // logger.setContext({ 
        controller: 'productController',
        action: 'getFeaturedProducts',
        userId: req.user?.id
    });
    
    try {
        logger.info(req.method, req.originalUrl, {
            query: req.query
        });
        
        const result = await prismaController.getFeaturedProducts(req, res);
        timer.end();
        
        logger.success('CONTROLLER', 'getFeaturedProducts completed successfully');
        return result;
    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'getFeaturedProducts failed', {
            error: error.message
        }, error);
        throw error;
    } finally {
        // Context cleared
    }
};

const createProduct = async (req, res) => {
    const timer = startTimer('createProduct');
    // logger.setContext({ 
        controller: 'productController',
        action: 'createProduct',
        userId: req.user?.id,
        userRole: req.user?.role
    });
    
    try {
        logger.info(req.method, req.originalUrl, {
            body: logger.sanitizeBody(req.body),
            userRole: req.user?.role
        });
        
        const result = await prismaController.createProduct(req, res);
        timer.end();
        
        logger.success('CONTROLLER', 'createProduct completed successfully', {
            productName: req.body.name
        });
        
        return result;
    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'createProduct failed', {
            productName: req.body.name,
            error: error.message
        }, error);
        throw error;
    } finally {
        // Context cleared
    }
};

const updateProduct = async (req, res) => {
    const timer = startTimer('updateProduct');
    // logger.setContext({ 
        controller: 'productController',
        action: 'updateProduct',
        productId: req.params.id,
        userId: req.user?.id,
        userRole: req.user?.role
    });
    
    try {
        logger.info(req.method, req.originalUrl, {
            params: req.params,
            body: logger.sanitizeBody(req.body),
            userRole: req.user?.role
        });
        
        const result = await prismaController.updateProduct(req, res);
        timer.end();
        
        logger.success('CONTROLLER', 'updateProduct completed successfully', {
            productId: req.params.id,
            productName: req.body.name
        });
        
        return result;
    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'updateProduct failed', {
            productId: req.params.id,
            productName: req.body.name,
            error: error.message
        }, error);
        throw error;
    } finally {
        // Context cleared
    }
};

const deleteProduct = async (req, res) => {
    const timer = startTimer('deleteProduct');
    // logger.setContext({ 
        controller: 'productController',
        action: 'deleteProduct',
        productId: req.params.id,
        userId: req.user?.id,
        userRole: req.user?.role
    });
    
    try {
        logger.info(req.method, req.originalUrl, {
            params: req.params,
            userRole: req.user?.role
        });
        
        logger.warn('CONTROLLER', 'Attempting to delete product', {
            productId: req.params.id,
            adminUser: req.user?.email
        });
        
        const result = await prismaController.deleteProduct(req, res);
        timer.end();
        
        logger.success('CONTROLLER', 'deleteProduct completed successfully', {
            productId: req.params.id
        });
        
        return result;
    } catch (error) {
        timer.end();
        logger.error('CONTROLLER', 'deleteProduct failed', {
            productId: req.params.id,
            error: error.message
        }, error);
        throw error;
    } finally {
        // Context cleared
    }
};

const getHomepageProducts = async (req, res) => {
    return prismaController.getHomepageProducts(req, res);
};

const updateHomepageSettings = async (req, res) => {
    return prismaController.updateHomepageSettings(req, res);
};

export {
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    getHomepageProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateHomepageSettings
};
