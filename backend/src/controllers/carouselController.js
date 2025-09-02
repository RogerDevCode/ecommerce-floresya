const { CarouselImage } = require('../models');
const { supabase, useSupabase } = require('../config/database');

// Get all carousel images
const getAllCarouselImages = async (req, res) => {
    try {
        let images;

        if (useSupabase) {
            const { data, error } = await supabase
                .from('carousel_images')
                .select('*')
                .eq('active', true)
                .order('display_order', { ascending: true });
            
            if (error) {
                throw error;
            }
            images = data || [];
        } else {
            images = await CarouselImage.findAll({
                where: { active: true },
                order: [['display_order', 'ASC'], ['created_at', 'DESC']]
            });
        }

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
        const images = await CarouselImage.findAll({
            order: [['display_order', 'ASC'], ['created_at', 'DESC']]
        });

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
        const image = await CarouselImage.findByPk(id);

        if (!image) {
            return res.status(404).json({ success: false, message: 'Carousel image not found' });
        }

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

        const image = await CarouselImage.create({
            title,
            description,
            image_url,
            link_url,
            display_order: display_order || 0,
            active: active !== undefined ? active : true
        });

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

        const image = await CarouselImage.findByPk(id);
        if (!image) {
            return res.status(404).json({ success: false, message: 'Carousel image not found' });
        }

        await image.update({
            title: title || image.title,
            description: description !== undefined ? description : image.description,
            image_url: image_url || image.image_url,
            link_url: link_url !== undefined ? link_url : image.link_url,
            display_order: display_order !== undefined ? display_order : image.display_order,
            active: active !== undefined ? active : image.active
        });

        res.json({
            success: true,
            message: 'Carousel image updated successfully',
            data: image
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
        const image = await CarouselImage.findByPk(id);

        if (!image) {
            return res.status(404).json({ success: false, message: 'Carousel image not found' });
        }

        // Soft delete by setting active to false
        await image.update({ active: false });
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

        // Update each image order
        for (const { id, display_order } of imageOrders) {
            await CarouselImage.update(
                { display_order },
                { where: { id } }
            );
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

module.exports = {
    getAllCarouselImages,
    getAllCarouselImagesAdmin,
    getCarouselImageById,
    createCarouselImage,
    updateCarouselImage,
    deleteCarouselImage,
    updateCarouselOrder,
};