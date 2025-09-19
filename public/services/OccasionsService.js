import { supabaseService } from '../config/supabase.js';
function generateSlug(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .replace(/^-+|-+$/g, '');
}
export class OccasionsService {
    async getActiveOccasions() {
        try {
            const { data, error } = await supabaseService
                .from('occasions')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
            if (error) {
                throw new Error(`Failed to fetch occasions: ${error.message}`);
            }
            return data ?? [];
        }
        catch (error) {
            console.error('OccasionsService.getActiveOccasions error:', error);
            throw error;
        }
    }
    async getAllOccasions() {
        try {
            const { data, error } = await supabaseService
                .from('occasions')
                .select('*')
                .order('display_order', { ascending: true });
            if (error) {
                throw new Error(`Failed to fetch all occasions: ${error.message}`);
            }
            return data ?? [];
        }
        catch (error) {
            console.error('OccasionsService.getAllOccasions error:', error);
            throw error;
        }
    }
    async getOccasionById(id) {
        try {
            const { data, error } = await supabaseService
                .from('occasions')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch occasion: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            console.error('OccasionsService.getOccasionById error:', error);
            throw error;
        }
    }
    async getOccasionBySlug(slug) {
        try {
            const { data, error } = await supabaseService
                .from('occasions')
                .select('*')
                .eq('slug', slug)
                .eq('is_active', true)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch occasion by slug: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            console.error('OccasionsService.getOccasionBySlug error:', error);
            throw error;
        }
    }
    async createOccasion(occasionData) {
        try {
            const slug = occasionData.slug ?? generateSlug(occasionData.name);
            const existingOccasion = await this.getOccasionBySlug(slug);
            if (existingOccasion) {
                throw new Error(`Occasion with slug '${slug}' already exists`);
            }
            const insertData = {
                ...occasionData,
                slug,
                type: occasionData.type ?? 'general',
                is_active: true,
                display_order: occasionData.display_order ?? 0
            };
            const { data, error } = await supabaseService
                .from('occasions')
                .insert(insertData)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create occasion: ${error.message}`);
            }
            if (!data) {
                throw new Error('No data returned from occasion creation');
            }
            return data;
        }
        catch (error) {
            console.error('OccasionsService.createOccasion error:', error);
            throw error;
        }
    }
    async updateOccasion(updateData) {
        try {
            const { id, ...updates } = updateData;
            if (updates.name && !updates.slug) {
                const newSlug = generateSlug(updates.name);
                const existingOccasion = await this.getOccasionBySlug(newSlug);
                if (existingOccasion && existingOccasion.id !== id) {
                    throw new Error(`Occasion with slug '${newSlug}' already exists`);
                }
                updates.slug = newSlug;
            }
            const { data, error } = await supabaseService
                .from('occasions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to update occasion: ${error.message}`);
            }
            if (!data) {
                throw new Error('No data returned from occasion update');
            }
            return data;
        }
        catch (error) {
            console.error('OccasionsService.updateOccasion error:', error);
            throw error;
        }
    }
    async deleteOccasion(id) {
        try {
            const occasion = await this.getOccasionById(id);
            if (!occasion) {
                throw new Error(`Occasion with ID ${id} not found`);
            }
            const { error } = await supabaseService
                .from('occasions')
                .update({ is_active: false })
                .eq('id', id);
            if (error) {
                throw new Error(`Failed to delete occasion: ${error.message}`);
            }
        }
        catch (error) {
            console.error('OccasionsService.deleteOccasion error:', error);
            throw error;
        }
    }
    async getOccasionsByType(type) {
        try {
            const { data, error } = await supabaseService
                .from('occasions')
                .select('*')
                .eq('type', type)
                .eq('is_active', true)
                .order('display_order', { ascending: true });
            if (error) {
                throw new Error(`Failed to fetch occasions by type: ${error.message}`);
            }
            return data ?? [];
        }
        catch (error) {
            console.error('OccasionsService.getOccasionsByType error:', error);
            throw error;
        }
    }
    async updateDisplayOrder(updates) {
        try {
            const promises = updates.map(({ id, display_order }) => supabaseService
                .from('occasions')
                .update({ display_order })
                .eq('id', id));
            const results = await Promise.all(promises);
            const errors = results.filter(result => result.error);
            if (errors.length > 0) {
                throw new Error(`Failed to update display order: ${errors[0]?.error?.message}`);
            }
        }
        catch (error) {
            console.error('OccasionsService.updateDisplayOrder error:', error);
            throw error;
        }
    }
}
