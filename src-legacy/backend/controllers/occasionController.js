import { databaseService } from '../services/databaseService.js';
import { errorHandlers } from '../utils/bked_errorHandler.js';

// Temporary mock data for development until migration is applied
const mockOccasions = [
    {id: 1, name: 'San Valentín', description: 'Arreglos románticos para el día del amor', icon: 'bi-heart-fill', color: '#dc3545', sort_order: 1, active: true},
    {id: 2, name: 'Día de la Madre', description: 'Flores especiales para celebrar a mamá', icon: 'bi-person-heart', color: '#fd7e14', sort_order: 2, active: true},
    {id: 3, name: 'Día del Padre', description: 'Arreglos únicos para papá', icon: 'bi-person-check', color: '#0d6efd', sort_order: 3, active: true},
    {id: 4, name: 'Cumpleaños', description: 'Flores alegres para celebrar la vida', icon: 'bi-gift-fill', color: '#ffc107', sort_order: 4, active: true},
    {id: 5, name: 'Aniversario', description: 'Arreglos románticos para celebrar el amor', icon: 'bi-heart-arrow', color: '#e91e63', sort_order: 5, active: true},
    {id: 6, name: 'Graduación', description: 'Flores para celebrar logros académicos', icon: 'bi-mortarboard', color: '#6f42c1', sort_order: 6, active: true},
    {id: 7, name: 'Bodas', description: 'Arreglos nupciales y decoración', icon: 'bi-suit-heart', color: '#20c997', sort_order: 7, active: true},
    {id: 8, name: 'Condolencias', description: 'Flores para expresar pésame', icon: 'bi-flower3', color: '#6c757d', sort_order: 10, active: true}
];

const mockProductOccasions = [
    {product_id: 6, occasion_id: 4}, // Bouquet de Girasoles -> Cumpleaños
    {product_id: 6, occasion_id: 6}  // Bouquet de Girasoles -> Graduación
];

// Helper function to check if occasions table exists
const occasionsTableExists = async () => {
    try {
        await databaseService.count('occasions');
        return true;
    } catch {
        return false;
    }
};

// GET /api/occasions - Get all occasions
const getAllOccasions = async (req, res) => {
    try {
        const tableExists = await occasionsTableExists();
        
        if (!tableExists) {
            // Return mock data if table doesn't exist yet
            return res.json({
                success: true,
                data: mockOccasions.filter(o => o.active),
                message: 'Using mock data - migration pending'
            });
        }

        const result = await databaseService.query('occasions', {
            select: '*',
            eq: { is_active: true },
            order: { column: 'display_order', ascending: true }
        });

        res.json({
            success: true,
            data: result.data
        });
    } catch (error) {
        errorHandlers.handleGenericError(res, error, 'get_all_occasions');
    }
};

// GET /api/occasions/:id - Get occasion by ID
const getOccasionById = async (req, res) => {
    try {
        const { id } = req.params;
        const tableExists = await occasionsTableExists();
        
        if (!tableExists) {
            const occasion = mockOccasions.find(o => o.id === parseInt(id));
            if (!occasion) {
                return res.status(404).json({
                    success: false,
                    message: 'Ocasión no encontrada'
                });
            }
            return res.json({
                success: true,
                data: occasion,
                message: 'Using mock data - migration pending'
            });
        }

        const result = await databaseService.query('occasions', {
            select: '*',
            eq: { id: parseInt(id) }
        });

        if (!result.data || result.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ocasión no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.data[0]
        });
    } catch (error) {
        errorHandlers.handleGenericError(res, error, 'get_occasion_by_id');
    }
};

// GET /api/occasions/:id/products - Get products by occasion
const getProductsByOccasion = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50 } = req.query;
        
        const tableExists = await occasionsTableExists();
        
        if (!tableExists) {
            // Mock implementation
            const productIds = mockProductOccasions
                .filter(po => po.occasion_id === parseInt(id))
                .map(po => po.product_id);
            
            if (productIds.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'No products found for this occasion (mock data)'
                });
            }

            // Get actual products from products table
            const client = databaseService.getClient();
            const { data, error } = await client
                .from('products')
                .select(`
                    id, name, description, price_usd as price, active,
                    images:product_images(
                        id, url_large, is_primary, display_order
                    )
                `)
                .in('id', productIds)
                .eq('active', true)
                .limit(parseInt(limit));

            if (error) throw error;

            return res.json({
                success: true,
                data,
                message: 'Using mock relations - migration pending'
            });
        }

        // Use SQL function when available
        const client = databaseService.getClient();
        const { data, error } = await client
            .rpc('get_products_by_occasion', {
                p_occasion_id: parseInt(id),
                p_limit: parseInt(limit)
            });

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        errorHandlers.handleGenericError(res, error, 'get_products_by_occasion');
    }
};

// GET /api/occasions/products/:productId/occasions - Get occasions for a product
const getProductOccasions = async (req, res) => {
    try {
        const { productId } = req.params;
        const tableExists = await occasionsTableExists();
        
        if (!tableExists) {
            // Mock implementation
            const occasionIds = mockProductOccasions
                .filter(po => po.product_id === parseInt(productId))
                .map(po => po.occasion_id);
            
            const productOccasions = mockOccasions.filter(o => 
                occasionIds.includes(o.id) && o.active
            );

            return res.json({
                success: true,
                data: productOccasions,
                message: 'Using mock data - migration pending'
            });
        }

        // Use SQL function when available
        const client = databaseService.getClient();
        const { data, error } = await client
            .rpc('get_product_occasions', {
                p_product_id: parseInt(productId)
            });

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        errorHandlers.handleGenericError(res, error, 'get_product_occasions');
    }
};

// POST /api/occasions - Create new occasion (Admin only)
const createOccasion = async (req, res) => {
    try {
        const { name, description, icon, color, sort_order } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre es requerido'
            });
        }

        const tableExists = await occasionsTableExists();
        
        if (!tableExists) {
            return res.status(501).json({
                success: false,
                message: 'Funcionalidad no disponible - migración pendiente'
            });
        }

        const client = databaseService.getClient();
        const { data, error } = await client
            .from('occasions')
            .insert({
                name,
                description,
                type: 'general', // Add required field from schema
                icon: icon || 'bi-star',
                color: color || '#28a745',
                display_order: sort_order || 0, // Map to schema column
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data,
            message: 'Ocasión creada exitosamente'
        });
    } catch (error) {
        errorHandlers.handleGenericError(res, error, 'create_occasion');
    }
};

// PUT /api/occasions/:id - Update occasion (Admin only)
const updateOccasion = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, color, sort_order, active } = req.body;
        
        const tableExists = await occasionsTableExists();
        
        if (!tableExists) {
            return res.status(501).json({
                success: false,
                message: 'Funcionalidad no disponible - migración pendiente'
            });
        }

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (icon !== undefined) updates.icon = icon;
        if (color !== undefined) updates.color = color;
        if (sort_order !== undefined) updates.display_order = sort_order; // Map to schema column
        if (active !== undefined) updates.is_active = active; // Map to schema column
        updates.updated_at = new Date().toISOString();

        const client = databaseService.getClient();
        const { data, error } = await client
            .from('occasions')
            .update(updates)
            .eq('id', parseInt(id))
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Ocasión no encontrada'
                });
            }
            throw error;
        }

        res.json({
            success: true,
            data,
            message: 'Ocasión actualizada exitosamente'
        });
    } catch (error) {
        errorHandlers.handleGenericError(res, error, 'update_occasion');
    }
};

// DELETE /api/occasions/:id - Delete occasion (Admin only)
const deleteOccasion = async (req, res) => {
    try {
        const { id } = req.params;
        
        const tableExists = await occasionsTableExists();
        
        if (!tableExists) {
            return res.status(501).json({
                success: false,
                message: 'Funcionalidad no disponible - migración pendiente'
            });
        }

        const client = databaseService.getClient();
        const { error } = await client
            .from('occasions')
            .delete()
            .eq('id', parseInt(id));

        if (error) throw error;

        res.json({
            success: true,
            message: 'Ocasión eliminada exitosamente'
        });
    } catch (error) {
        errorHandlers.handleGenericError(res, error, 'delete_occasion');
    }
};

// POST /api/occasions/:id/products/:productId - Add product to occasion
const addProductToOccasion = async (req, res) => {
    try {
        const { id: occasionId, productId } = req.params;
        
        const tableExists = await occasionsTableExists();
        
        if (!tableExists) {
            return res.status(501).json({
                success: false,
                message: 'Funcionalidad no disponible - migración pendiente'
            });
        }

        const client = databaseService.getClient();
        const { data, error } = await client
            .from('product_occasions')
            .insert({
                product_id: parseInt(productId),
                occasion_id: parseInt(occasionId)
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({
                    success: false,
                    message: 'El producto ya está asociado a esta ocasión'
                });
            }
            throw error;
        }

        res.status(201).json({
            success: true,
            data,
            message: 'Producto asociado a ocasión exitosamente'
        });
    } catch (error) {
        errorHandlers.handleGenericError(res, error, 'add_product_to_occasion');
    }
};

// DELETE /api/occasions/:id/products/:productId - Remove product from occasion
const removeProductFromOccasion = async (req, res) => {
    try {
        const { id: occasionId, productId } = req.params;
        
        const tableExists = await occasionsTableExists();
        
        if (!tableExists) {
            return res.status(501).json({
                success: false,
                message: 'Funcionalidad no disponible - migración pendiente'
            });
        }

        const client = databaseService.getClient();
        const { error } = await client
            .from('product_occasions')
            .delete()
            .eq('product_id', parseInt(productId))
            .eq('occasion_id', parseInt(occasionId));

        if (error) throw error;

        res.json({
            success: true,
            message: 'Producto removido de ocasión exitosamente'
        });
    } catch (error) {
        errorHandlers.handleGenericError(res, error, 'remove_product_from_occasion');
    }
};

export {
    getAllOccasions,
    getOccasionById,
    getProductsByOccasion,
    createOccasion,
    updateOccasion,
    deleteOccasion,
    addProductToOccasion,
    removeProductFromOccasion,
    getProductOccasions
};
