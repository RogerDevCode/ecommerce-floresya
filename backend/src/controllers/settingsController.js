import { databaseService } from '../services/databaseService.js';

const getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        
        const result = await databaseService.query('settings', {
            select: '*',
            eq: { key }
        });
        
        const setting = result.data?.[0] || null;

        if (!setting) {
            return res.status(404).json({ success: false, message: 'Setting not found' });
        }

        res.json({ success: true, data: setting });
    } catch (error) {
        console.error(`Error getting setting ${req.params.key}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const client = databaseService.getClient();
        
        const { data: updateResult, error: updateError } = await client
            .from('settings')
            .update({ value })
            .eq('key', key)
            .select();
        
        if (updateError && updateError.code !== 'PGRST116') {
            throw updateError;
        }
        
        if (!updateResult || updateResult.length === 0) {
            const { data: insertResult, error: insertError } = await client
                .from('settings')
                .insert({ key, value })
                .select()
                .single();
            
            if (insertError) {
                throw insertError;
            }
            
            return res.json({ success: true, message: `Setting ${key} updated successfully.`, data: insertResult });
        }
        
        res.json({ success: true, message: `Setting ${key} updated successfully.`, data: updateResult[0] });
    } catch (error) {
        console.error(`Error updating setting ${req.params.key}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getHomepageSettings = async (req, res) => {
    try {
        const client = databaseService.getClient();
        const { data, error } = await client
            .from('settings')
            .select('*')
            .like('key', 'homepage_%');
        
        if (error) {
            throw error;
        }
        
        const settings = data || [];

        const homepageSettings = {};
        settings.forEach(setting => {
            homepageSettings[setting.key] = setting.value;
        });

        res.json({ 
            success: true, 
            data: homepageSettings 
        });
    } catch (error) {
        console.error('Error getting homepage settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateHomepageSettings = async (req, res) => {
    try {
        const settings = req.body;

        const client = databaseService.getClient();
        
        for (const [key, value] of Object.entries(settings)) {
            if (key.startsWith('homepage_')) {
                const { data: updateResult, error: updateError } = await client
                    .from('settings')
                    .update({ value })
                    .eq('key', key)
                    .select();
                
                if (!updateResult || updateResult.length === 0) {
                    const { error: insertError } = await client
                        .from('settings')
                        .insert({ key, value });
                    
                    if (insertError) {
                        throw insertError;
                    }
                }
            }
        }

        res.json({ 
            success: true, 
            message: 'Homepage settings updated successfully' 
        });
    } catch (error) {
        console.error('Error updating homepage settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ✅ NUEVO: Obtiene la tasa de cambio BCV desde settings
const getExchangeRateBCV = async (req, res) => {
    try {
        const result = await databaseService.query('settings', {
            select: 'key, value, description, type, is_public',
            eq: { key: 'exchange_rate_usd_ves' } // ✅ Corregido: key correcta según tu tabla
        });

        const rate = result.data?.[0];

        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Exchange rate BCV not configured'
            });
        }

        const parsedValue = parseFloat(rate.value);
        if (isNaN(parsedValue)) {
            return res.status(500).json({
                success: false,
                message: 'Invalid exchange rate value in database'
            });
        }

        res.json({
            success: true,
            data: {
                key: rate.key,
                value: parsedValue,
                description: rate.description || 'Tasa de cambio BCV',
                type: rate.type || 'number',
                is_public: rate.is_public || true,
                last_updated: rate.updated_at
            }
        });

    } catch (error) {
        console.error('Error fetching exchange rate BCV:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


export {
    getSetting,
    updateSetting,
    getHomepageSettings,
    updateHomepageSettings,
    getExchangeRateBCV
};
