const { Category } = require('../models');

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ 
            where: { active: true },
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: { categories } });
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getAllCategories };
