const { Category } = require('../models');
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
            categories = await Category.findAll({ 
                where: { active: true },
                order: [['name', 'ASC']]
            });
        }

        res.json({ success: true, data: { categories } });
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getAllCategories };
