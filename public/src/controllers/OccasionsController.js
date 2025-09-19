import { query, param, body, validationResult } from 'express-validator';
import { supabaseService } from '../config/supabase.js';
export class OccasionsController {
    capitalizeOccasionName(name) {
        const lowercaseWords = ['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'en', 'con', 'por', 'para', 'sobre', 'tras', 'durante'];
        return name
            .trim()
            .toLowerCase()
            .split(' ')
            .map((word, index) => {
            if (index === 0) {
                return this.capitalizeWord(word);
            }
            if (lowercaseWords.includes(word)) {
                return word;
            }
            return this.capitalizeWord(word);
        })
            .join(' ');
    }
    capitalizeWord(word) {
        if (word.length === 0)
            return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }
    normalizeOccasionName(name) {
        return name
            .trim()
            .toLowerCase()
            .replace(/ñ/g, '___TEMP_N_TILDE___')
            .replace(/Ñ/g, '___TEMP_NN_TILDE___')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/___TEMP_N_TILDE___/g, 'ñ')
            .replace(/___TEMP_NN_TILDE___/g, 'ñ')
            .replace(/[^a-z0-9\s\-ñ]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    async checkOccasionNameExists(normalizedName, excludeId) {
        try {
            let query = supabaseService
                .from('occasions')
                .select('id, name');
            if (excludeId) {
                query = query.neq('id', excludeId);
            }
            const { data: occasions, error } = await query;
            if (error) {
                throw new Error(`Failed to check name uniqueness: ${error.message}`);
            }
            if (!occasions || occasions.length === 0) {
                return false;
            }
            return occasions.some(occasion => {
                const existingNormalized = this.normalizeOccasionName(occasion.name);
                return existingNormalized === normalizedName;
            });
        }
        catch (error) {
            console.error('Error checking occasion name uniqueness:', error);
            throw error;
        }
    }
    async getOccasions(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid query parameters',
                    errors: errors.array()
                });
                return;
            }
            const { data, error } = await supabaseService
                .from('occasions')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
            if (error) {
                throw new Error(`Failed to fetch occasions: ${error.message}`);
            }
            res.status(200).json({
                success: true,
                data: data,
                message: 'Occasions retrieved successfully'
            });
        }
        catch (error) {
            console.error('OccasionsController.getOccasions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch occasions',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getOccasionById(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid occasion ID',
                    errors: errors.array()
                });
                return;
            }
            const occasionId = parseInt(req.params.id);
            const { data, error } = await supabaseService
                .from('occasions')
                .select('*')
                .eq('id', occasionId)
                .eq('is_active', true)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    res.status(404).json({
                        success: false,
                        message: 'Occasion not found'
                    });
                    return;
                }
                throw new Error(`Failed to fetch occasion: ${error.message}`);
            }
            res.status(200).json({
                success: true,
                data: { occasion: data },
                message: 'Occasion retrieved successfully'
            });
        }
        catch (error) {
            console.error('OccasionsController.getOccasionById error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch occasion',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async createOccasion(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid input data',
                    errors: errors.array()
                });
                return;
            }
            const { name, type, description, is_active = true } = req.body;
            const finalType = type || 'general';
            const capitalizedName = this.capitalizeOccasionName(name);
            const normalizedName = this.normalizeOccasionName(capitalizedName);
            const nameExists = await this.checkOccasionNameExists(normalizedName);
            if (nameExists) {
                res.status(409).json({
                    success: false,
                    message: `Ya existe una ocasión con el nombre "${capitalizedName}". Los nombres deben ser únicos (ignorando acentos y caracteres especiales).`,
                    error: 'OCCASION_NAME_EXISTS'
                });
                return;
            }
            const slug = normalizedName.replace(/\s+/g, '-').replace(/-+/g, '-').trim();
            const { data: maxOrderData, error: maxOrderError } = await supabaseService
                .from('occasions')
                .select('display_order')
                .order('display_order', { ascending: false })
                .limit(1);
            if (maxOrderError) {
                throw new Error(`Failed to get max display order: ${maxOrderError.message}`);
            }
            const nextDisplayOrder = maxOrderData && maxOrderData.length > 0 && maxOrderData[0]
                ? (maxOrderData[0].display_order ?? 0) + 1
                : 1;
            const { data, error } = await supabaseService
                .from('occasions')
                .insert({
                name: capitalizedName,
                type: finalType,
                slug,
                description,
                is_active,
                display_order: nextDisplayOrder
            })
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create occasion: ${error.message}`);
            }
            res.status(201).json({
                success: true,
                data: { occasion: data },
                message: 'Occasion created successfully'
            });
        }
        catch (error) {
            console.error('OccasionsController.createOccasion error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create occasion',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async updateOccasion(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid input data',
                    errors: errors.array()
                });
                return;
            }
            const occasionId = parseInt(req.params.id);
            const { name, type, description, is_active = true } = req.body;
            const { data: currentOccasion, error: fetchError } = await supabaseService
                .from('occasions')
                .select('*')
                .eq('id', occasionId)
                .single();
            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    res.status(404).json({
                        success: false,
                        message: 'Occasion not found'
                    });
                    return;
                }
                throw new Error(`Failed to fetch occasion: ${fetchError.message}`);
            }
            const updateData = {
                is_active,
                updated_at: new Date().toISOString()
            };
            let slugChanged = false;
            let finalSlug = currentOccasion.slug;
            if (name && name !== currentOccasion.name) {
                const capitalizedNewName = this.capitalizeOccasionName(name);
                const normalizedNewName = this.normalizeOccasionName(capitalizedNewName);
                const nameExists = await this.checkOccasionNameExists(normalizedNewName, occasionId);
                if (nameExists) {
                    res.status(409).json({
                        success: false,
                        message: `Ya existe otra ocasión con el nombre "${capitalizedNewName}". Los nombres deben ser únicos (ignorando acentos y caracteres especiales).`,
                        error: 'OCCASION_NAME_EXISTS'
                    });
                    return;
                }
                updateData.name = capitalizedNewName;
                const newSlug = normalizedNewName.replace(/\s+/g, '-').replace(/-+/g, '-').trim();
                if (newSlug !== currentOccasion.slug) {
                    const { data: existingSlug, error: slugCheckError } = await supabaseService
                        .from('occasions')
                        .select('id')
                        .eq('slug', newSlug)
                        .neq('id', occasionId)
                        .single();
                    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
                        throw new Error(`Failed to check slug uniqueness: ${slugCheckError.message}`);
                    }
                    if (existingSlug) {
                        let counter = 1;
                        let uniqueSlug = `${newSlug}-${counter}`;
                        while (true) {
                            const { data: conflictCheck, error: conflictError } = await supabaseService
                                .from('occasions')
                                .select('id')
                                .eq('slug', uniqueSlug)
                                .neq('id', occasionId)
                                .single();
                            if (conflictError && conflictError.code !== 'PGRST116') {
                                throw new Error(`Failed to check slug uniqueness: ${conflictError.message}`);
                            }
                            if (!conflictCheck) {
                                break;
                            }
                            counter++;
                            uniqueSlug = `${newSlug}-${counter}`;
                        }
                        finalSlug = uniqueSlug;
                    }
                    else {
                        finalSlug = newSlug;
                    }
                    updateData.slug = finalSlug;
                    slugChanged = true;
                }
            }
            if (type !== undefined) {
                updateData.type = type;
            }
            if (description !== undefined) {
                updateData.description = description || null;
            }
            const { data, error } = await supabaseService
                .from('occasions')
                .update(updateData)
                .eq('id', occasionId)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to update occasion: ${error.message}`);
            }
            res.status(200).json({
                success: true,
                data: {
                    occasion: data,
                    slug_changed: slugChanged
                },
                message: 'Occasion updated successfully'
            });
        }
        catch (error) {
            console.error('OccasionsController.updateOccasion error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update occasion',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async deleteOccasion(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid occasion ID',
                    errors: errors.array()
                });
                return;
            }
            const occasionId = parseInt(req.params.id);
            const { data: occasion, error: fetchError } = await supabaseService
                .from('occasions')
                .select('*')
                .eq('id', occasionId)
                .single();
            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    res.status(404).json({
                        success: false,
                        message: 'Occasion not found'
                    });
                    return;
                }
                throw new Error(`Failed to fetch occasion: ${fetchError.message}`);
            }
            const { data: references, error: refError } = await supabaseService
                .from('product_occasions')
                .select('id')
                .eq('occasion_id', occasionId)
                .limit(1);
            if (refError) {
                throw new Error(`Failed to check references: ${refError.message}`);
            }
            const hasReferences = references && references.length > 0;
            if (hasReferences) {
                const { data, error } = await supabaseService
                    .from('occasions')
                    .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                    .eq('id', occasionId)
                    .select()
                    .single();
                if (error) {
                    throw new Error(`Failed to deactivate occasion: ${error.message}`);
                }
                res.status(200).json({
                    success: true,
                    data: {
                        occasion: data,
                        deletion_type: 'logical',
                        has_references: true
                    },
                    message: 'Occasion deactivated successfully (has product references)'
                });
            }
            else {
                const { error } = await supabaseService
                    .from('occasions')
                    .delete()
                    .eq('id', occasionId);
                if (error) {
                    throw new Error(`Failed to delete occasion: ${error.message}`);
                }
                res.status(204).send();
            }
        }
        catch (error) {
            console.error('OccasionsController.deleteOccasion error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete occasion',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
export const occasionsValidators = {
    getOccasions: [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    getOccasionById: [
        param('id').isInt({ min: 1 }).withMessage('Occasion ID must be a positive integer')
    ],
    createOccasion: [
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
        body('type').optional().isIn(['general', 'birthday', 'anniversary', 'wedding', 'sympathy', 'congratulations']).withMessage('Type must be a valid occasion type'),
        body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
        body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
    ],
    updateOccasion: [
        param('id').isInt({ min: 1 }).withMessage('Occasion ID must be a positive integer'),
        body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
        body('type').optional().isIn(['general', 'birthday', 'anniversary', 'wedding', 'sympathy', 'congratulations']).withMessage('Type must be a valid occasion type'),
        body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
        body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
    ],
    deleteOccasion: [
        param('id').isInt({ min: 1 }).withMessage('Occasion ID must be a positive integer')
    ]
};
