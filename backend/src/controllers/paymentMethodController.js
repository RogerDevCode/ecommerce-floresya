const { supabase, useSupabase } = require('../config/database');

const getAllPaymentMethods = async (req, res) => {
    try {
        let paymentMethods;

        if (useSupabase) {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('active', true)
                .order('name', { ascending: true });
            
            if (error) {
                throw error;
            }
            paymentMethods = data || [];
        } else {
            throw new Error('Only Supabase is supported in this application');
        }

        res.json({ success: true, data: { payment_methods: paymentMethods } });
    } catch (error) {
        console.error('Error getting payment methods:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getAllPaymentMethods };
