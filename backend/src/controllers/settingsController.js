const { supabase, useSupabase } = require('../config/database');

const getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        let setting;

        if (useSupabase) {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('setting_key', key)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                throw error;
            }
            setting = data;
        } else {
            throw new Error('Only Supabase is supported in this application');
        }

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

        if (useSupabase) {
            // Try to update first
            const { data: updateResult, error: updateError } = await supabase
                .from('settings')
                .update({ setting_value: value })
                .eq('setting_key', key)
                .select();
            
            if (updateError && updateError.code !== 'PGRST116') {
                throw updateError;
            }
            
            // If no rows were updated, insert new
            if (!updateResult || updateResult.length === 0) {
                const { data: insertResult, error: insertError } = await supabase
                    .from('settings')
                    .insert({ setting_key: key, setting_value: value })
                    .select()
                    .single();
                
                if (insertError) {
                    throw insertError;
                }
                
                return res.json({ success: true, message: `Setting ${key} updated successfully.`, data: insertResult });
            }
            
            res.json({ success: true, message: `Setting ${key} updated successfully.`, data: updateResult[0] });
        } else {
            throw new Error('Only Supabase is supported in this application');
        }
    } catch (error) {
        console.error(`Error updating setting ${req.params.key}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get homepage settings
const getHomepageSettings = async (req, res) => {
    try {
        let settings;

        if (useSupabase) {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .like('setting_key', 'homepage_%');
            
            if (error) {
                throw error;
            }
            settings = data || [];
        } else {
            throw new Error('Only Supabase is supported in this application');
        }

        const homepageSettings = {};
        settings.forEach(setting => {
            homepageSettings[setting.setting_key] = setting.setting_value;
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

// Update homepage settings (batch)
const updateHomepageSettings = async (req, res) => {
    try {
        const settings = req.body;

        if (useSupabase) {
            for (const [key, value] of Object.entries(settings)) {
                if (key.startsWith('homepage_')) {
                    // Try to update first
                    const { data: updateResult, error: updateError } = await supabase
                        .from('settings')
                        .update({ setting_value: value })
                        .eq('setting_key', key)
                        .select();
                    
                    // If no rows were updated, insert new
                    if (!updateResult || updateResult.length === 0) {
                        const { error: insertError } = await supabase
                            .from('settings')
                            .insert({ setting_key: key, setting_value: value });
                        
                        if (insertError) {
                            throw insertError;
                        }
                    }
                }
            }
        } else {
            throw new Error('Only Supabase is supported in this application');
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

module.exports = {
    getSetting,
    updateSetting,
    getHomepageSettings,
    updateHomepageSettings,
};