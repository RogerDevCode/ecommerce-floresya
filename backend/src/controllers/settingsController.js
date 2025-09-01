const { Setting } = require('../models');

const getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await Setting.findOne({ where: { setting_key: key } });

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

        const [setting, created] = await Setting.findOrCreate({
            where: { setting_key: key },
            defaults: { setting_value: value }
        });

        if (!created) {
            await setting.update({ setting_value: value });
        }

        res.json({ success: true, message: `Setting ${key} updated successfully.`, data: setting });
    } catch (error) {
        console.error(`Error updating setting ${req.params.key}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get homepage settings
const getHomepageSettings = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const settings = await Setting.findAll({
            where: {
                setting_key: {
                    [Op.like]: 'homepage_%'
                }
            }
        });

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

        for (const [key, value] of Object.entries(settings)) {
            if (key.startsWith('homepage_')) {
                const [setting, created] = await Setting.findOrCreate({
                    where: { setting_key: key },
                    defaults: { setting_value: value }
                });

                if (!created) {
                    await setting.update({ setting_value: value });
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

module.exports = {
    getSetting,
    updateSetting,
    getHomepageSettings,
    updateHomepageSettings,
};