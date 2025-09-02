const fs = require('fs');
const path = require('path');

function calculateStorageNeeded() {
    console.log('📊 Calculando espacio de almacenamiento necesario...\n');
    
    const imgTempPath = path.join(__dirname, '../../../imgtemp');
    
    if (!fs.existsSync(imgTempPath)) {
        console.error('❌ Folder imgtemp no encontrado');
        return;
    }
    
    const files = fs.readdirSync(imgTempPath);
    const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|webp)$/i.test(file)
    );
    
    console.log(`📁 Imágenes encontradas: ${imageFiles.length}`);
    console.log(`📂 Ubicación: ${imgTempPath}\n`);
    
    let totalCurrentSize = 0;
    const fileAnalysis = [];
    
    // Analizar cada archivo
    imageFiles.forEach(file => {
        const filePath = path.join(imgTempPath, file);
        const stats = fs.statSync(filePath);
        const sizeInKB = Math.round(stats.size / 1024);
        
        totalCurrentSize += stats.size;
        
        fileAnalysis.push({
            name: file,
            currentSize: sizeInKB,
            productName: file.replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/-\d+$/, '')
        });
    });
    
    // Agrupar por producto
    const productGroups = {};
    fileAnalysis.forEach(file => {
        if (!productGroups[file.productName]) {
            productGroups[file.productName] = [];
        }
        productGroups[file.productName].push(file);
    });
    
    console.log('📋 ANÁLISIS POR PRODUCTO:\n');
    
    let estimatedTotalSize = 0;
    Object.keys(productGroups).forEach(productName => {
        const images = productGroups[productName];
        const currentSize = images.reduce((sum, img) => sum + img.currentSize, 0);
        
        // Estimación de tamaños después de procesamiento WebP:
        // - Large: ~80KB (calidad 85%, 800x800)
        // - Medium: ~45KB (calidad 80%, 500x500) 
        // - Thumbnail: ~15KB (calidad 75%, 200x200)
        const estimatedSizePerImage = 80 + 45 + 15; // 140KB por imagen original
        const productEstimatedSize = images.length * estimatedSizePerImage;
        
        console.log(`🌸 ${productName}:`);
        console.log(`   📸 Imágenes: ${images.length}`);
        console.log(`   📊 Tamaño actual: ${currentSize} KB`);
        console.log(`   📈 Tamaño estimado WebP: ${productEstimatedSize} KB`);
        console.log(`   📁 Archivos generados: ${images.length * 3} (large, medium, thumb)`);
        console.log('');
        
        estimatedTotalSize += productEstimatedSize;
    });
    
    const currentSizeMB = Math.round(totalCurrentSize / 1024 / 1024 * 100) / 100;
    const estimatedSizeMB = Math.round(estimatedTotalSize / 1024 * 100) / 100;
    
    console.log('📊 RESUMEN TOTAL:\n');
    console.log(`📸 Total de imágenes originales: ${imageFiles.length}`);
    console.log(`📁 Total de archivos a generar: ${imageFiles.length * 3}`);
    console.log(`💾 Tamaño actual: ${currentSizeMB} MB`);
    console.log(`💾 Tamaño estimado final: ${estimatedSizeMB} MB`);
    
    // Límites de Supabase
    const supabaseLimit = 1000; // 1GB en el plan gratuito
    const percentage = Math.round(estimatedSizeMB / supabaseLimit * 10000) / 100;
    
    console.log(`\n🔢 ANÁLISIS DE LÍMITES:`);
    console.log(`📊 Límite Supabase (gratuito): 1,000 MB`);
    console.log(`📈 Uso estimado: ${percentage}%`);
    
    if (estimatedSizeMB > supabaseLimit) {
        console.log(`❌ ⚠️  ALERTA: Excede el límite de Supabase`);
        console.log(`💡 Recomendación: Optimizar calidad o usar menos imágenes`);
    } else if (percentage > 50) {
        console.log(`⚠️  Uso alto pero dentro del límite`);
    } else {
        console.log(`✅ Uso dentro del límite seguro`);
    }
    
    return {
        totalImages: imageFiles.length,
        totalFiles: imageFiles.length * 3,
        currentSizeMB,
        estimatedSizeMB,
        percentage,
        withinLimit: estimatedSizeMB <= supabaseLimit,
        productGroups: Object.keys(productGroups).length
    };
}

if (require.main === module) {
    calculateStorageNeeded();
}

module.exports = { calculateStorageNeeded };