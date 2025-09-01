const { PaymentMethod } = require('../models');

const getAllPaymentMethods = async (req, res) => {
    try {
        const paymentMethods = await PaymentMethod.findAll({ 
            where: { active: true },
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: { payment_methods: paymentMethods } });
    } catch (error) {
        console.error('Error getting payment methods:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getAllPaymentMethods };
