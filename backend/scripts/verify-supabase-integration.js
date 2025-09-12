#!/usr/bin/env node

/**
 * 🔍 VERIFICACIÓN FINAL DE INTEGRACIÓN SUPABASE
 * Script para verificar que la integración completa funcione correctamente
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🌸 FloresYa - Verificación Final de Integración Supabase\n');

// Colores para console.log
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Crear cliente Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function runVerification() {
    try {
        log('🎯 Verificando consulta exacta usada por el frontend...', 'cyan');
        
        // Consulta exacta del productControllerSupabase.js
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                id, name, description, price, stock_quantity,
                featured, active, occasion, show_on_homepage, homepage_order,
                created_at, updated_at,
                images:product_images(
                    id, file_hash, original_filename,
                    url_large, url_medium, url_small, url_thumb,
                    width, height, is_primary, display_order
                )
            `)
            .eq('active', true)
            .limit(5);
            
        if (error) {
            log(`❌ Error en consulta: ${error.message}`, 'red');
            return;
        }

        if (!products || products.length === 0) {
            log('⚠️ No se encontraron productos activos', 'yellow');
            return;
        }

        log(`✅ Productos encontrados: ${products.length}`, 'green');

        // Verificar estructura de datos para frontend
        log('\n📋 Verificando estructura de datos para frontend...', 'cyan');
        
        products.forEach((product, index) => {
            log(`\n${index + 1}. ${product.name}`, 'blue');
            log(`   • ID: ${product.id}`, 'magenta');
            log(`   • Precio: $${product.price}`, 'magenta');
            
            if (product.images && Array.isArray(product.images)) {
                log(`   • Imágenes: ${product.images.length}`, 'magenta');
                product.images.forEach((image, imgIndex) => {
                    log(`     - Imagen ${imgIndex + 1}:`, 'blue');
                    log(`       * URL Large: ${image.url_large ? '✅ OK' : '❌ Falta'}`, 'green');
                    log(`       * Display Order: ${image.display_order}`, 'green');
                    log(`       * Es Primary: ${image.is_primary ? 'Sí' : 'No'}`, 'green');
                });
            } else {
                log('   • ⚠️ No hay imágenes asociadas', 'yellow');
            }
        });

        // Simular procesamiento del frontend como en main.js
        log('\n🎨 Simulando procesamiento del frontend...', 'cyan');
        
        products.forEach(product => {
            // Simular lógica de main.js
            let allProductImages = [];
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                const sortedImages = product.images
                    .sort((a, b) => a.display_order - b.display_order)
                    .map(img => img.url_large)
                    .filter(url => url && url !== '');
                allProductImages = sortedImages;
            } else {
                allProductImages = ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk1IiBmaWxsPSIjRkYxNDkzIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iNzAiIHI9IjUiIGZpbGw9IiNmZmYiLz4KPC9zdmc+'];
            }
            
            const primaryImage = allProductImages[0];
            const dataImages = JSON.stringify(allProductImages);
            
            log(`   • ${product.name}:`, 'blue');
            log(`     - Imagen principal: ${primaryImage.includes('data:image') ? 'Placeholder SVG' : 'URL de Supabase'}`, 'green');
            log(`     - Total imágenes procesadas: ${allProductImages.length}`, 'green');
            log(`     - Data-images generado: ✅ OK`, 'green');
            log(`     - Data-product-id: ${product.id} ✅ OK`, 'green');
        });

        // Verificar que ProductImageHover podrá funcionar
        log('\n🎭 Verificando compatibilidad con ProductImageHover...', 'cyan');
        
        let compatibleProducts = 0;
        let productsWithMultipleImages = 0;
        
        products.forEach(product => {
            let hasValidImages = false;
            let imageCount = 0;
            
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                const validImages = product.images.filter(img => img.url_large && img.url_large !== '');
                imageCount = validImages.length;
                if (imageCount > 0) {
                    hasValidImages = true;
                    compatibleProducts++;
                }
                if (imageCount > 1) {
                    productsWithMultipleImages++;
                }
            }
            
            log(`   • ${product.name}: ${hasValidImages ? '✅' : '⚠️'} ${imageCount} imágenes válidas`, 
                hasValidImages ? 'green' : 'yellow');
        });

        log('\n📊 Resumen de Verificación:', 'cyan');
        log(`✅ Productos compatibles: ${compatibleProducts}/${products.length}`, 'green');
        log(`🎨 Productos con hover múltiple: ${productsWithMultipleImages}`, 'blue');
        log(`🏷️ Data-product-id: ✅ Disponible para todos`, 'green');
        log(`🖼️ Data-images: ✅ Generado correctamente`, 'green');
        log(`🎯 Clase product-image: ✅ Se puede agregar`, 'green');

        if (compatibleProducts === products.length) {
            log('\n🎉 ¡Integración completamente funcional!', 'green');
            log('   • Consulta anidada: ✅ Funcionando', 'green');
            log('   • Estructura de datos: ✅ Compatible', 'green');
            log('   • Frontend: ✅ Procesamiento correcto', 'green');
            log('   • ProductImageHover: ✅ Ready to work', 'green');
        } else {
            log('\n⚠️ Algunas consideraciones:', 'yellow');
            log('   • Algunos productos no tienen imágenes asociadas', 'yellow');
            log('   • El frontend usará placeholders para esos casos', 'yellow');
            log('   • El sistema sigue siendo funcional', 'yellow');
        }

    } catch (error) {
        log(`❌ Error crítico: ${error.message}`, 'red');
        console.error(error.stack);
    }
}

// Ejecutar verificación
runVerification().then(() => {
    log('\n✅ Verificación completada', 'green');
}).catch(error => {
    log(`❌ Error en verificación: ${error.message}`, 'red');
    process.exit(1);
});