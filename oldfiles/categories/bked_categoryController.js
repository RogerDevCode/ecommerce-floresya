import {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} from '../utils/bked_logger.js';

// USANDO PRISMA - Todas las operaciones redirigen al controlador de Prisma
import * as prismaController from './categoryControllerPrisma.js';

const getAllCategories = async (req, res) => {
    return prismaController.getAllCategories(req, res);
};

const getCategoryById = async (req, res) => {
    return prismaController.getCategoryById(req, res);
};

const createCategory = async (req, res) => {
    return prismaController.createCategory(req, res);
};

const updateCategory = async (req, res) => {
    return prismaController.updateCategory(req, res);
};

const deleteCategory = async (req, res) => {
    return prismaController.deleteCategory(req, res);
};

export { 
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
