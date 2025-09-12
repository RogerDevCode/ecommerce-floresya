import {
    log,          // Función principal
    logger,       // Alias con métodos .info(), .warn(), etc.
    requestLogger, // Middleware Express
    startTimer     // Para medir tiempos de ejecución
} from '../utils/bked_logger.js';

import { databaseService } from '../services/databaseService.js';

// Get all carousel images
const getAllCarouselImages = async (req, res) => {
    try {
        // Use databaseService to get carousel images
        const client = databaseService.getClient();
        const { data, error } = await client
            .from('carousel_images')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        const images = data || [];

        res.json({
            success: true,
            data: {
                images,
                count: images.length
            }
        });
    } catch (error) {
        console.error('Error fetching carousel images:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get all carousel images for admin (including inactive)
const getAllCarouselImagesAdmin = async (req, res) => {
    try {
        const client = databaseService.getClient();
        const { data, error } = await client
            .from('carousel_images')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        const images = data || [];

        res.json({
            success: true,
            data: {
                images,
                count: images.length
            }
        });
    } catch (error) {
        console.error('Error fetching carousel images for admin:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get single carousel image
const getCarouselImageById = async (req, res) => {
    try {
        const { id } = req.params;
        const client = databaseService.getClient();
        const { data, error } = await client
            .from('carousel_images')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') { // No rows found
                return res.status(404).json({ success: false, message: 'Carousel image not found' });
            }
            throw error;
        }
        
        const image = data;

        res.json({ success: true, data: image });
    } catch (error) {
        console.error('Error fetching carousel image:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Create new carousel image
const createCarouselImage = async (req, res) => {
    try {
        const { title, description, image_url, link_url, display_order, active } = req.body;
        const client = databaseService.getClient();
        const { data, error } = await client
            .from('carousel_images')
            .insert({
                title,
                description,
                image_url,
                link_url,
                display_order: display_order || 0,
                is_active: active !== undefined ? active : true
            })
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        const image = data;

        res.status(201).json({
            success: true,
            message: 'Carousel image created successfully',
            data: image
        });
    } catch (error) {
        console.error('Error creating carousel image:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update carousel image
const updateCarouselImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, image_url, link_url, display_order, active } = req.body;
        const client = databaseService.getClient();
        
        // First check if the image exists
        const { data: existingImage, error: findError } = await client
            .from('carousel_images')
            .select('*')
            .eq('id', id)
            .single();

        if (findError) {
            if (findError.code === 'PGRST116') {
                return res.status(404).json({ success: false, message: 'Carousel image not found' });
            }
            throw findError;
        }

        // Update the image
        const updateData = {
            title: title || existingImage.title,
            description: description !== undefined ? description : existingImage.description,
            image_url: image_url || existingImage.image_url,
            link_url: link_url !== undefined ? link_url : existingImage.link_url,
            display_order: display_order !== undefined ? display_order : existingImage.display_order,
            active: active !== undefined ? active : existingImage.active
        };

        const { data, error } = await client
            .from('carousel_images')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        const updatedImage = data;

        res.json({
            success: true,
            message: 'Carousel image updated successfully',
            data: updatedImage
        });
    } catch (error) {
        console.error('Error updating carousel image:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete carousel image (soft delete)
const deleteCarouselImage = async (req, res) => {
    try {
        const { id } = req.params;
        const client = databaseService.getClient();
        
        // Check if image exists first
        const { data: existingImage, error: findError } = await client
            .from('carousel_images')
            .select('id')
            .eq('id', id)
            .single();

        if (findError) {
            if (findError.code === 'PGRST116') {
                return res.status(404).json({ success: false, message: 'Carousel image not found' });
            }
            throw findError;
        }

        // Soft delete by setting active to false
        const { error } = await client
            .from('carousel_images')
            .update({ active: false })
            .eq('id', id);
        
        if (error) {
            throw error;
        }

        res.json({ success: true, message: 'Carousel image deleted successfully' });
    } catch (error) {
        console.error('Error deleting carousel image:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update display order of carousel images
const updateCarouselOrder = async (req, res) => {
    try {
        const { imageOrders } = req.body; // Array of {id, display_order}

        if (!Array.isArray(imageOrders)) {
            return res.status(400).json({ success: false, message: 'imageOrders must be an array' });
        }

        const client = databaseService.getClient();
        
        // Update each image order
        for (const { id, display_order } of imageOrders) {
            const { error } = await client
                .from('carousel_images')
                .update({ display_order })
                .eq('id', id);
            
            if (error) {
                throw error;
            }
        }

        res.json({
            success: true,
            message: 'Carousel order updated successfully'
        });
    } catch (error) {
        console.error('Error updating carousel order:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export {
    getAllCarouselImages,
    getAllCarouselImagesAdmin,
    getCarouselImageById,
    createCarouselImage,
    updateCarouselImage,
    deleteCarouselImage,
    updateCarouselOrder
};
