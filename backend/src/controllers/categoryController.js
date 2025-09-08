const {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} = require('../utils/logger.js');

const { supabase, useSupabase } = require('../config/database');

const getAllCategories = async (req, res) => {
    try {
        let categories;

        if (useSupabase) {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('active', true)
                .order('name', { ascending: true });
            
            if (error) {
                throw error;
            }
            categories = data || [];
        } else {
            throw new Error('Only Supabase is supported in this application');
        }

        res.json({ success: true, data: { categories } });
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getAllCategories };
