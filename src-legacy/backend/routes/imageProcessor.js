import express from 'express';
import fs from 'fs';
import path from 'path';
import { 
    processImageGroupAndCreateProduct,
    OCCASIONS_MAP 
} from '../services/imageUploadService.js';

const router = express.Router();

/**
 * POST /api/images/process-bulk
 * Procesa imágenes masivamente desde un directorio
 */
router.post('/process-bulk', async (req, res) => {
    try {
        const { directory = 'imgtemp' } = req.body;
        
        console.log('🚀 Iniciando procesamiento masivo de imágenes...\\n');
        
        // Verificar que el directorio existe
        const imgDir = path.join(process.cwd(), directory);
        if (!fs.existsSync(imgDir)) {
            return res.status(400).json({
                success: false,
                message: `Directorio ${directory} no encontrado`
            });
        }
        
        // Leer archivos PNG
        const files = fs.readdirSync(imgDir).filter(file => file.endsWith('.png'));
        
        if (files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se encontraron archivos PNG en el directorio'
            });
        }
        
        console.log(`📁 Encontrados ${files.length} archivos PNG`);
        
        // Agrupar imágenes por título
        const groupedImages = {};
        
        files.forEach(filename => {
            const parts = filename.replace('.png', '').split('.');
            if (parts.length === 3) {
                const [title, occasion, sequential] = parts;
                const occasionId = parseInt(occasion);
                
                if (!groupedImages[title]) {
                    groupedImages[title] = {
                        title,
                        occasionId,
                        occasion: OCCASIONS_MAP[occasionId] || 'other',
                        images: []
                    };
                }
                
                groupedImages[title].images.push({
                    filename,
                    sequential: parseInt(sequential),
                    path: path.join(imgDir, filename)
                });
            }
        });
        
        // Ordenar imágenes por secuencial
        Object.keys(groupedImages).forEach(title => {
            groupedImages[title].images.sort((a, b) => a.sequential - b.sequential);
        });
        
        console.log(`📦 ${Object.keys(groupedImages).length} productos agrupados\\n`);
        
        // Procesar cada grupo
        const productNames = Object.keys(groupedImages);
        const results = [];
        let successCount = 0;
        
        for (let i = 0; i < productNames.length; i++) {
            const title = productNames[i];
            const group = groupedImages[title];
            
            console.log(`\\n🔄 Producto ${i + 1}/${productNames.length}: ${title}`);
            
            try {
                const product = await processImageGroupAndCreateProduct(
                    title, 
                    group.images, 
                    group.occasionId
                );
                
                if (product) {
                    successCount++;
                    results.push({
                        title,
                        success: true,
                        product: {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            occasion: product.occasion
                        }
                    });
                } else {
                    results.push({
                        title,
                        success: false,
                        error: 'No se pudo crear el producto'
                    });
                }
            } catch (error) {
                console.error(`   💥 Error procesando ${title}:`, error.message);
                results.push({
                    title,
                    success: false,
                    error: error.message
                });
            }
        }
        
        console.log('\\n🎉 Procesamiento completado!');
        console.log(`✅ ${successCount}/${productNames.length} productos creados exitosamente`);
        
        res.json({
            success: true,
            message: `Procesamiento completado: ${successCount}/${productNames.length} productos creados`,
            data: {
                totalFiles: files.length,
                totalGroups: productNames.length,
                successCount,
                results
            }
        });
        
    } catch (error) {
        console.error('💥 Error en procesamiento masivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor durante el procesamiento',
            error: error.message
        });
    }
});

/**
 * POST /api/images/upload-single
 * Sube una sola imagen usando el servicio
 */
router.post('/upload-single', async (req, res) => {
    try {
        const multer = (await import('multer')).default;
        const { processImageBuffer } = await import('../services/imageUploadService.js');
        
        // Configurar multer para memoria
        const upload = multer({ 
            storage: multer.memoryStorage(),
            limits: { fileSize: 5 * 1024 * 1024 } // 5MB
        }).single('image');
        
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se proporcionó ningún archivo'
                });
            }
            
            try {
                const imageUrl = await processImageBuffer(req.file.buffer, req.file.originalname);
                
                if (imageUrl) {
                    res.json({
                        success: true,
                        message: 'Imagen subida exitosamente',
                        data: {
                            url: imageUrl,
                            originalName: req.file.originalname,
                            size: req.file.size
                        }
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        message: 'Error al subir la imagen a Supabase'
                    });
                }
            } catch (uploadError) {
                console.error('Error subiendo imagen:', uploadError);
                res.status(500).json({
                    success: false,
                    message: 'Error interno al procesar la imagen'
                });
            }
        });
        
    } catch (error) {
        console.error('Error en upload-single:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/images/status
 * Obtiene estado del directorio de imágenes
 */
router.get('/status', (req, res) => {
    try {
        const { directory = 'imgtemp' } = req.query;
        const imgDir = path.join(process.cwd(), directory);
        
        if (!fs.existsSync(imgDir)) {
            return res.json({
                success: true,
                data: {
                    directory,
                    exists: false,
                    totalFiles: 0,
                    pngFiles: 0,
                    groups: []
                }
            });
        }
        
        const allFiles = fs.readdirSync(imgDir);
        const pngFiles = allFiles.filter(file => file.endsWith('.png'));
        
        // Agrupar archivos
        const groups = {};
        pngFiles.forEach(filename => {
            const parts = filename.replace('.png', '').split('.');
            if (parts.length === 3) {
                const [title] = parts;
                if (!groups[title]) {
                    groups[title] = 0;
                }
                groups[title]++;
            }
        });
        
        res.json({
            success: true,
            data: {
                directory,
                exists: true,
                totalFiles: allFiles.length,
                pngFiles: pngFiles.length,
                groups: Object.keys(groups).map(title => ({
                    title,
                    imageCount: groups[title]
                }))
            }
        });
        
    } catch (error) {
        console.error('Error en status:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

export default router;