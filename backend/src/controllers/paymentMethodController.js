import { databaseService } from '../services/databaseService.js';

const getAllPaymentMethods = async (req, res) => {
    try {
        const client = databaseService.getClient();
        const { data, error } = await client
            .from('payment_methods')
            .select('*')
            .eq('active', true)
            .order('name', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        const paymentMethods = data || [];

        res.json({ success: true, data: { payment_methods: paymentMethods } });
    } catch (error) {
        console.error('Error getting payment methods:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export { getAllPaymentMethods };
