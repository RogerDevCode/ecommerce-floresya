const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Helper function to check if occasions table exists
const occasionsTableExists = async () => {
    try {
        const { data, error } = await supabase.from('occasions').select('id').limit(1);
        return !error;
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

        const { data, error } = await supabase
            .from('occasions')
            .select('*')
            .eq('active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error getting occasions:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ocasiones',
            error: error.message
        });
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

        const { data, error } = await supabase
            .from('occasions')
            .select('*')
            .eq('id', id)
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
            data: data
        });
    } catch (error) {
        console.error('Error getting occasion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ocasión',
            error: error.message
        });
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
            const { data: products, error } = await supabase
                .from('products')
                .select('id, name, description, price, image_url, primary_image, active')
                .in('id', productIds)
                .eq('active', true)
                .limit(parseInt(limit));

            if (error) throw error;

            return res.json({
                success: true,
                data: products,
                message: 'Using mock relations - migration pending'
            });
        }

        // Use SQL function when available
        const { data, error } = await supabase
            .rpc('get_products_by_occasion', {
                p_occasion_id: parseInt(id),
                p_limit: parseInt(limit)
            });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error getting products by occasion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos por ocasión',
            error: error.message
        });
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
        const { data, error } = await supabase
            .rpc('get_product_occasions', {
                p_product_id: parseInt(productId)
            });

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error getting product occasions:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ocasiones del producto',
            error: error.message
        });
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

        const { data, error } = await supabase
            .from('occasions')
            .insert({
                name,
                description,
                icon: icon || 'bi-star',
                color: color || '#28a745',
                sort_order: sort_order || 0
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: data,
            message: 'Ocasión creada exitosamente'
        });
    } catch (error) {
        console.error('Error creating occasion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear ocasión',
            error: error.message
        });
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
        if (sort_order !== undefined) updates.sort_order = sort_order;
        if (active !== undefined) updates.active = active;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('occasions')
            .update(updates)
            .eq('id', id)
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
            data: data,
            message: 'Ocasión actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error updating occasion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar ocasión',
            error: error.message
        });
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

        const { error } = await supabase
            .from('occasions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Ocasión eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error deleting occasion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar ocasión',
            error: error.message
        });
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

        const { data, error } = await supabase
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
            data: data,
            message: 'Producto asociado a ocasión exitosamente'
        });
    } catch (error) {
        console.error('Error adding product to occasion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al asociar producto a ocasión',
            error: error.message
        });
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

        const { error } = await supabase
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
        console.error('Error removing product from occasion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al remover producto de ocasión',
            error: error.message
        });
    }
};

module.exports = {
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