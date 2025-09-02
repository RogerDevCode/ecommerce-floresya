const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

// Proxy route for images from Supabase
router.get('/proxy/:size/:filename', async (req, res) => {
    const { size, filename } = req.params;
    
    // Validate size parameter
    const validSizes = ['large', 'medium', 'thumb'];
    if (!validSizes.includes(size)) {
        return res.status(400).json({ error: 'Invalid size parameter' });
    }
    
    // Construct Supabase URL
    const supabaseUrl = `https://dcbavpdlkcjdtjdkntde.supabase.co/storage/v1/object/public/product-images/${size}/${filename}`;
    
    try {
        // Make request to Supabase
        const protocol = supabaseUrl.startsWith('https:') ? https : http;
        
        const request = protocol.get(supabaseUrl, (response) => {
            // Set appropriate headers
            res.set({
                'Content-Type': response.headers['content-type'] || 'image/webp',
                'Content-Length': response.headers['content-length'],
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*'
            });
            
            // Stream the image data
            response.pipe(res);
        });
        
        request.on('error', (error) => {
            console.error('Error fetching image:', error);
            res.status(500).json({ error: 'Failed to fetch image' });
        });
        
    } catch (error) {
        console.error('Error in image proxy:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Direct image serve route (for testing)
router.get('/direct/:size/:filename', (req, res) => {
    const { size, filename } = req.params;
    const supabaseUrl = `https://dcbavpdlkcjdtjdkntde.supabase.co/storage/v1/object/public/product-images/${size}/${filename}`;
    res.redirect(supabaseUrl);
});

module.exports = router;