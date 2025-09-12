#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO DE RELACIONES SUPABASE
 * Script para diagnosticar problemas con consultas anidadas de product_images
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 FloresYa - Diagnóstico de Relaciones Supabase\n');

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

// Verificar variables de entorno
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    log('❌ Error: SUPABASE_URL y SUPABASE_ANON_KEY son requeridos', 'red');
    process.exit(1);
}

// Crear cliente Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function runDiagnosis() {
    try {
        log('📊 1. Verificando conexión básica...', 'cyan');
        
        // Test 1: Conexión básica
        const { data: connectionTest, error: connectionError } = await supabase
            .from('products')
            .select('count', { count: 'exact', head: true });
            
        if (connectionError) {
            log(`❌ Error de conexión: ${connectionError.message}`, 'red');
            return;
        }
        
        log(`✅ Conexión exitosa. Total productos: ${connectionTest?.count || 0}`, 'green');

        // Test 2: Verificar estructura de productos
        log('\n📋 2. Verificando estructura de productos...', 'cyan');
        
        const { data: sampleProducts, error: productsError } = await supabase
            .from('products')
            .select('id, name, active')
            .limit(5);
            
        if (productsError) {
            log(`❌ Error consultando productos: ${productsError.message}`, 'red');
            return;
        }
        
        if (!sampleProducts || sampleProducts.length === 0) {
            log('⚠️ No se encontraron productos en la base de datos', 'yellow');
            return;
        }
        
        log(`✅ Productos encontrados: ${sampleProducts.length}`, 'green');
        sampleProducts.forEach(product => {
            log(`   • ID: ${product.id}, Nombre: ${product.name}, Activo: ${product.active}`, 'blue');
        });

        // Test 3: Verificar tabla product_images
        log('\n🖼️ 3. Verificando tabla product_images...', 'cyan');
        
        const { data: sampleImages, error: imagesError } = await supabase
            .from('product_images')
            .select('id, product_id, original_filename, is_primary, display_order')
            .limit(10);
            
        if (imagesError) {
            log(`❌ Error consultando product_images: ${imagesError.message}`, 'red');
            
            // Verificar si la tabla existe
            log('\n🔍 Verificando si la tabla product_images existe...', 'cyan');
            const { error: tableError } = await supabase
                .from('product_images')
                .select('*')
                .limit(1);
                
            if (tableError?.code === 'PGRST106' || tableError?.message?.includes('does not exist')) {
                log('❌ La tabla product_images NO existe', 'red');
                log('💡 Solución: Crear la tabla product_images con la estructura correcta', 'yellow');
            }
            return;
        }
        
        if (!sampleImages || sampleImages.length === 0) {
            log('⚠️ No se encontraron imágenes en product_images', 'yellow');
            log('💡 Esto explica por qué la consulta anidada retorna arrays vacíos', 'yellow');
        } else {
            log(`✅ Imágenes encontradas: ${sampleImages.length}`, 'green');
            sampleImages.forEach(image => {
                log(`   • ID: ${image.id}, Product ID: ${image.product_id}, Archivo: ${image.original_filename}`, 'blue');
            });
        }

        // Test 4: Verificar relación FK
        log('\n🔗 4. Verificando relación Foreign Key...', 'cyan');
        
        // Buscar productos que tengan imágenes
        const { data: productsWithImages, error: relationError } = await supabase
            .from('product_images')
            .select('product_id')
            .limit(5);
            
        if (relationError) {
            log(`❌ Error verificando relación: ${relationError.message}`, 'red');
        } else if (productsWithImages && productsWithImages.length > 0) {
            const productIds = [...new Set(productsWithImages.map(img => img.product_id))];
            log(`✅ Productos con imágenes encontrados: ${productIds.join(', ')}`, 'green');
            
            // Test 5: Probar consulta anidada simple
            log('\n🔄 5. Probando consulta anidada simple...', 'cyan');
            
            const { data: nestedTest, error: nestedError } = await supabase
                .from('products')
                .select(`
                    id, name, active,
                    product_images(id, url_large, is_primary, display_order)
                `)
                .limit(3);
                
            if (nestedError) {
                log(`❌ Error en consulta anidada: ${nestedError.message}`, 'red');
                log('💡 Posibles causas:', 'yellow');
                log('   • Nombre de relación incorrecto', 'yellow');
                log('   • Política RLS bloqueando el acceso', 'yellow');
                log('   • Configuración de FK incorrecta', 'yellow');
            } else {
                log('✅ Consulta anidada exitosa', 'green');
                nestedTest.forEach(product => {
                    const imageCount = product.product_images ? product.product_images.length : 0;
                    log(`   • ${product.name}: ${imageCount} imágenes`, 'blue');
                    if (imageCount > 0) {
                        product.product_images.forEach((img, index) => {
                            log(`     - Imagen ${index + 1}: ${img.url_large ? 'URL OK' : 'Sin URL'}`, 'magenta');
                        });
                    }
                });
            }
        }

        // Test 6: Verificar políticas RLS
        log('\n🛡️ 6. Verificando políticas RLS...', 'cyan');
        
        try {
            // Test con service role key si está disponible
            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                const serviceClient = createClient(
                    process.env.SUPABASE_URL, 
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                );
                
                const { data: rlsTest, error: rlsError } = await serviceClient
                    .from('product_images')
                    .select('id, product_id')
                    .limit(5);
                    
                if (rlsError) {
                    log(`❌ Error con service key: ${rlsError.message}`, 'red');
                } else {
                    log(`✅ Service key funciona. Registros: ${rlsTest?.length || 0}`, 'green');
                    if (rlsTest && rlsTest.length > 0 && sampleImages && sampleImages.length === 0) {
                        log('⚠️ RLS está bloqueando el acceso con anon key', 'yellow');
                        log('💡 Solución: Revisar políticas RLS en product_images', 'yellow');
                    }
                }
            } else {
                log('⚠️ SUPABASE_SERVICE_ROLE_KEY no disponible para test RLS', 'yellow');
            }
        } catch (rlsError) {
            log(`❌ Error probando RLS: ${rlsError.message}`, 'red');
        }

        // Test 7: Probar la consulta exacta del código
        log('\n🎯 7. Probando consulta exacta del código...', 'cyan');
        
        const { data: exactQuery, error: exactError } = await supabase
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
            .limit(2);
            
        if (exactError) {
            log(`❌ Error en consulta exacta: ${exactError.message}`, 'red');
        } else {
            log('✅ Consulta exacta exitosa', 'green');
            exactQuery.forEach(product => {
                const imageCount = product.images ? product.images.length : 0;
                log(`   • ${product.name}: ${imageCount} imágenes`, 'blue');
            });
        }

    } catch (error) {
        log(`❌ Error crítico: ${error.message}`, 'red');
        console.error(error.stack);
    }
}

// Ejecutar diagnóstico
runDiagnosis().then(() => {
    log('\n🏁 Diagnóstico completado', 'green');
}).catch(error => {
    log(`❌ Error en diagnóstico: ${error.message}`, 'red');
    process.exit(1);
});