/**
 * 🧪 SUITE COMPLETO DE TESTING PARA API FLORESYA
 * Testing unitario e integración completa de toda la API
 * Verificación de base de datos, tablas, columnas y funcionalidad
 */

const { supabase } = require('./backend/src/config/database');
const fs = require('fs');
const path = require('path');

// Fetch compatible con Node.js
let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();

// Configuración de testing
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Colores para reporte
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m', 
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

// Resultados de testing
let testResults = {
    database: { passed: 0, failed: 0, tests: [] },
    api: { passed: 0, failed: 0, tests: [] },
    integration: { passed: 0, failed: 0, tests: [] },
    performance: { passed: 0, failed: 0, tests: [] }
};

// Función helper para testing
const assert = (condition, testName, category = 'api') => {
    const result = {
        name: testName,
        passed: Boolean(condition),
        timestamp: new Date().toISOString(),
        details: condition
    };
    
    testResults[category].tests.push(result);
    
    if (result.passed) {
        testResults[category].passed++;
        log(`  ✅ ${testName}`, 'green');
    } else {
        testResults[category].failed++;
        log(`  ❌ ${testName}`, 'red');
        if (typeof condition !== 'boolean') {
            log(`     Details: ${JSON.stringify(condition)}`, 'dim');
        }
    }
    
    return result.passed;
};

// ================================================================
// 1. TESTING DE ESTRUCTURA DE BASE DE DATOS
// ================================================================

async function testDatabaseStructure() {
    log(`\n${colors.bold}🗄️ TESTING ESTRUCTURA DE BASE DE DATOS${colors.reset}`, 'blue');
    log(`${colors.bold}======================================${colors.reset}`, 'blue');
    
    try {
        // Test: Conexión a Supabase
        const { data: healthCheck, error: connectionError } = await supabase
            .from('products')
            .select('count', { count: 'exact', head: true });
            
        assert(!connectionError, 'Conexión exitosa a Supabase', 'database');
        
        // Test: Tabla products existe y tiene estructura correcta
        const { data: productsColumns, error: columnsError } = await supabase
            .rpc('get_table_columns', { table_name: 'products' })
            .then(result => ({ data: null, error: result.error }))
            .catch(() => ({ data: null, error: null }));
            
        // Método alternativo para verificar columnas
        const { data: sampleProduct } = await supabase
            .from('products')
            .select('*')
            .limit(1)
            .single();
            
        if (sampleProduct) {
            const productKeys = Object.keys(sampleProduct);
            const expectedKeys = ['id', 'name', 'description', 'price', 'category_id', 'stock_quantity', 
                                'featured', 'active', 'occasion', 'show_on_homepage', 'homepage_order', 
                                'created_at', 'updated_at'];
            
            const hasAllKeys = expectedKeys.every(key => productKeys.includes(key));
            assert(hasAllKeys, 'Tabla products tiene columnas requeridas', 'database');
            
            // Verificar que NO tiene columnas legacy
            const hasNoLegacy = !productKeys.includes('image_url') && !productKeys.includes('additional_images');
            assert(hasNoLegacy, 'Tabla products NO tiene columnas legacy', 'database');
        }
        
        // Test: Tabla product_images existe
        const { data: productImages, error: imagesError } = await supabase
            .from('product_images')
            .select('count', { count: 'exact', head: true });
            
        assert(!imagesError, 'Tabla product_images existe', 'database');
        
        // Test: Estructura de product_images
        const { data: sampleImage } = await supabase
            .from('product_images')
            .select('*')
            .limit(1)
            .single();
            
        if (sampleImage) {
            const imageKeys = Object.keys(sampleImage);
            const expectedImageKeys = ['id', 'product_id', 'file_hash', 'original_filename', 
                                     'url_large', 'url_medium', 'url_small', 'url_thumb',
                                     'width', 'height', 'display_order', 'is_primary'];
                                     
            const hasAllImageKeys = expectedImageKeys.every(key => imageKeys.includes(key));
            assert(hasAllImageKeys, 'Tabla product_images tiene estructura correcta', 'database');
        }
        
        // Test: Tabla categories existe
        const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select('count', { count: 'exact', head: true });
            
        assert(!categoriesError, 'Tabla categories existe', 'database');
        
        // Test: Tabla occasions existe
        const { data: occasions, error: occasionsError } = await supabase
            .from('occasions')
            .select('count', { count: 'exact', head: true });
            
        assert(!occasionsError, 'Tabla occasions existe', 'database');
        
        // Test: Función get_existing_image_by_hash existe
        const testHash = 'test123456789abcdef';
        const { data: hashResult, error: hashError } = await supabase
            .rpc('get_existing_image_by_hash', { hash_input: testHash });
            
        assert(!hashError, 'Función get_existing_image_by_hash existe', 'database');
        
        // Test: Integridad referencial
        const { data: productsCount } = await supabase
            .from('products')
            .select('count', { count: 'exact', head: true });
            
        const { data: imagesCount } = await supabase
            .from('product_images')
            .select('count', { count: 'exact', head: true });
            
        log(`   📊 Productos en DB: ${productsCount || 0}`, 'cyan');
        log(`   📊 Imágenes en DB: ${imagesCount || 0}`, 'cyan');
        
        assert(productsCount >= 0 && imagesCount >= 0, 'Conteos de tablas válidos', 'database');
        
    } catch (error) {
        assert(false, `Error en testing de DB: ${error.message}`, 'database');
    }
}

// ================================================================
// 2. TESTING UNITARIO DE ENDPOINTS API
// ================================================================

async function testApiEndpoints() {
    log(`\n${colors.bold}🔌 TESTING ENDPOINTS API${colors.reset}`, 'blue');
    log(`${colors.bold}=======================${colors.reset}`, 'blue');
    
    try {
        // Test: Health check
        const healthResponse = await fetch(`${API_URL}/health`);
        const healthData = await healthResponse.json();
        assert(healthResponse.ok && healthData.success, 'Endpoint /api/health funciona', 'api');
        
        // Test: GET /api/products
        const productsResponse = await fetch(`${API_URL}/products?limit=5`);
        const productsData = await productsResponse.json();
        
        assert(productsResponse.ok, 'GET /api/products responde 200', 'api');
        assert(productsData.success === true, 'GET /api/products retorna success:true', 'api');
        assert(Array.isArray(productsData.data?.products), 'GET /api/products retorna array de productos', 'api');
        
        // Test: Estructura de producto en respuesta
        if (productsData.data?.products?.length > 0) {
            const product = productsData.data.products[0];
            
            assert(typeof product.id === 'number', 'Producto tiene ID numérico', 'api');
            assert(typeof product.name === 'string', 'Producto tiene nombre string', 'api');
            assert(typeof product.price === 'number', 'Producto tiene precio numérico', 'api');
            
            // CRÍTICO: Verificar que NO tiene campos legacy
            assert(!product.hasOwnProperty('image_url'), 'Producto NO tiene campo image_url legacy', 'api');
            assert(!product.hasOwnProperty('additional_images'), 'Producto NO tiene campo additional_images legacy', 'api');
            
            // CRÍTICO: Verificar que SÍ tiene campo images del nuevo sistema
            assert(product.hasOwnProperty('images'), 'Producto tiene campo images del nuevo sistema', 'api');
            
            if (product.images) {
                assert(Array.isArray(product.images), 'Campo images es array', 'api');
                
                if (product.images.length > 0) {
                    const image = product.images[0];
                    assert(image.hasOwnProperty('url_large'), 'Imagen tiene url_large', 'api');
                    assert(image.hasOwnProperty('file_hash'), 'Imagen tiene file_hash', 'api');
                    assert(image.hasOwnProperty('display_order'), 'Imagen tiene display_order', 'api');
                }
            }
        }
        
        // Test: GET /api/products/:id
        if (productsData.data?.products?.length > 0) {
            const productId = productsData.data.products[0].id;
            const singleProductResponse = await fetch(`${API_URL}/products/${productId}`);
            const singleProductData = await singleProductResponse.json();
            
            assert(singleProductResponse.ok, `GET /api/products/${productId} responde 200`, 'api');
            assert(singleProductData.success === true, 'GET /api/products/:id retorna success', 'api');
            assert(singleProductData.data?.id === productId, 'GET /api/products/:id retorna producto correcto', 'api');
        }
        
        // Test: GET /api/products con filtros
        const filteredResponse = await fetch(`${API_URL}/products?occasion=valentine&limit=3`);
        const filteredData = await filteredResponse.json();
        
        assert(filteredResponse.ok, 'GET /api/products con filtros responde 200', 'api');
        assert(filteredData.success === true, 'GET /api/products con filtros retorna success', 'api');
        
        // Test: GET /api/categories
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        const categoriesData = await categoriesResponse.json();
        
        assert(categoriesResponse.ok, 'GET /api/categories responde 200', 'api');
        assert(categoriesData.success === true, 'GET /api/categories retorna success', 'api');
        
        // Test: GET /api/occasions
        const occasionsResponse = await fetch(`${API_URL}/occasions`);
        const occasionsData = await occasionsResponse.json();
        
        assert(occasionsResponse.ok, 'GET /api/occasions responde 200', 'api');
        assert(occasionsData.success === true, 'GET /api/occasions retorna success', 'api');
        
        // Test: Endpoints 404 para recursos inexistentes
        const nonExistentResponse = await fetch(`${API_URL}/products/999999`);
        assert(nonExistentResponse.status === 404, 'GET /api/products/999999 retorna 404', 'api');
        
    } catch (error) {
        assert(false, `Error en testing de API: ${error.message}`, 'api');
    }
}

// ================================================================
// 3. TESTING DE INTEGRACIÓN BASE DE DATOS vs API
// ================================================================

async function testDatabaseApiIntegration() {
    log(`\n${colors.bold}🔗 TESTING INTEGRACIÓN DB ↔ API${colors.reset}`, 'blue');
    log(`${colors.bold}===============================${colors.reset}`, 'blue');
    
    try {
        // Test: Consistencia de datos entre DB y API
        const { data: dbProducts } = await supabase
            .from('products')
            .select('id, name, price, active')
            .eq('active', true)
            .limit(3);
            
        const apiResponse = await fetch(`${API_URL}/products?limit=3`);
        const apiData = await apiResponse.json();
        
        if (dbProducts && apiData.success && apiData.data.products) {
            // Verificar que los IDs coinciden
            const dbIds = dbProducts.map(p => p.id).sort();
            const apiIds = apiData.data.products.map(p => p.id).sort();
            
            assert(JSON.stringify(dbIds) === JSON.stringify(apiIds), 'IDs de productos coinciden entre DB y API', 'integration');
            
            // Verificar precios coinciden
            for (const dbProduct of dbProducts) {
                const apiProduct = apiData.data.products.find(p => p.id === dbProduct.id);
                if (apiProduct) {
                    assert(dbProduct.price === apiProduct.price, `Precio coincide para producto ${dbProduct.id}`, 'integration');
                }
            }
        }
        
        // Test: Imágenes asociadas correctamente
        if (dbProducts && dbProducts.length > 0) {
            const productId = dbProducts[0].id;
            
            // Obtener imágenes desde DB directamente
            const { data: dbImages } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', productId)
                .order('display_order');
                
            // Obtener producto desde API
            const apiProductResponse = await fetch(`${API_URL}/products/${productId}`);
            const apiProductData = await apiProductResponse.json();
            
            if (dbImages && apiProductData.success) {
                const apiImages = apiProductData.data.images || [];
                
                assert(dbImages.length === apiImages.length, `Cantidad de imágenes coincide para producto ${productId}`, 'integration');
                
                // Verificar orden de imágenes
                for (let i = 0; i < dbImages.length; i++) {
                    if (apiImages[i]) {
                        assert(dbImages[i].display_order === apiImages[i].display_order, 
                               `Orden de imagen ${i} coincide`, 'integration');
                        assert(dbImages[i].url_large === apiImages[i].url_large, 
                               `URL large de imagen ${i} coincide`, 'integration');
                    }
                }
            }
        }
        
        // Test: Filtros funcionan correctamente
        const { data: dbValentineProducts } = await supabase
            .from('products')
            .select('id')
            .eq('occasion', 'valentine')
            .eq('active', true);
            
        const apiValentineResponse = await fetch(`${API_URL}/products?occasion=valentine&limit=100`);
        const apiValentineData = await apiValentineResponse.json();
        
        if (dbValentineProducts && apiValentineData.success) {
            const dbCount = dbValentineProducts.length;
            const apiCount = apiValentineData.data.products.length;
            
            assert(dbCount === apiCount, `Filtro por ocasión 'valentine' coincide: DB=${dbCount}, API=${apiCount}`, 'integration');
        }
        
    } catch (error) {
        assert(false, `Error en testing de integración: ${error.message}`, 'integration');
    }
}

// ================================================================
// 4. TESTING DE PERFORMANCE Y CARGA
// ================================================================

async function testPerformance() {
    log(`\n${colors.bold}⚡ TESTING DE PERFORMANCE${colors.reset}`, 'blue');
    log(`${colors.bold}=========================${colors.reset}`, 'blue');
    
    try {
        // Test: Tiempo de respuesta endpoints principales
        const endpointsToTest = [
            '/api/health',
            '/api/products?limit=10',
            '/api/categories',
            '/api/occasions'
        ];
        
        for (const endpoint of endpointsToTest) {
            const startTime = Date.now();
            const response = await fetch(`${BASE_URL}${endpoint}`);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            assert(response.ok, `${endpoint} responde correctamente`, 'performance');
            assert(responseTime < 2000, `${endpoint} responde en < 2s (${responseTime}ms)`, 'performance');
            
            log(`   ⏱️  ${endpoint}: ${responseTime}ms`, 'dim');
        }
        
        // Test: Concurrencia - múltiples requests simultáneos
        const concurrentRequests = Array(5).fill().map(() => 
            fetch(`${API_URL}/products?limit=5`)
        );
        
        const startConcurrent = Date.now();
        const concurrentResults = await Promise.all(concurrentRequests);
        const endConcurrent = Date.now();
        const concurrentTime = endConcurrent - startConcurrent;
        
        const allOk = concurrentResults.every(r => r.ok);
        assert(allOk, 'Requests concurrentes exitosos', 'performance');
        assert(concurrentTime < 5000, `Requests concurrentes < 5s (${concurrentTime}ms)`, 'performance');
        
        // Test: Paginación eficiente
        const page1Response = await fetch(`${API_URL}/products?page=1&limit=5`);
        const page1Data = await page1Response.json();
        
        if (page1Data.success && page1Data.data.pagination) {
            const pagination = page1Data.data.pagination;
            assert(pagination.page === 1, 'Paginación página 1 correcta', 'performance');
            assert(pagination.limit === 5, 'Paginación limit correcto', 'performance');
            assert(typeof pagination.total === 'number', 'Paginación total es numérico', 'performance');
        }
        
    } catch (error) {
        assert(false, `Error en testing de performance: ${error.message}`, 'performance');
    }
}

// ================================================================
// 5. TESTING DE VALIDACIÓN DE DATOS
// ================================================================

async function testDataValidation() {
    log(`\n${colors.bold}✅ TESTING VALIDACIÓN DE DATOS${colors.reset}`, 'blue');
    log(`${colors.bold}===============================${colors.reset}`, 'blue');
    
    try {
        // Test: Parámetros inválidos
        const invalidRequests = [
            { url: `${API_URL}/products?limit=abc`, test: 'Limit inválido manejado' },
            { url: `${API_URL}/products?page=0`, test: 'Página 0 manejada' },
            { url: `${API_URL}/products?limit=1000`, test: 'Limit excesivo manejado' },
            { url: `${API_URL}/products/abc`, test: 'ID no numérico manejado' }
        ];
        
        for (const { url, test } of invalidRequests) {
            try {
                const response = await fetch(url);
                const data = await response.json();
                
                // La API debería manejar gracefully los parámetros inválidos
                assert(response.status >= 200 && response.status < 500, test, 'api');
            } catch (error) {
                assert(false, `${test}: ${error.message}`, 'api');
            }
        }
        
        // Test: Consistencia de tipos de datos
        const productsResponse = await fetch(`${API_URL}/products?limit=3`);
        const productsData = await productsResponse.json();
        
        if (productsData.success && productsData.data.products.length > 0) {
            for (const product of productsData.data.products) {
                assert(typeof product.id === 'number', `Producto ${product.id}: ID es número`, 'api');
                assert(typeof product.name === 'string', `Producto ${product.id}: name es string`, 'api');
                assert(typeof product.price === 'number', `Producto ${product.id}: price es número`, 'api');
                assert(typeof product.active === 'boolean', `Producto ${product.id}: active es boolean`, 'api');
                
                if (product.images) {
                    assert(Array.isArray(product.images), `Producto ${product.id}: images es array`, 'api');
                    
                    for (const image of product.images) {
                        assert(typeof image.id === 'number', `Imagen: ID es número`, 'api');
                        assert(typeof image.file_hash === 'string', `Imagen: file_hash es string`, 'api');
                        assert(image.file_hash.length === 64, `Imagen: file_hash es SHA256 válido`, 'api');
                        assert(typeof image.url_large === 'string', `Imagen: url_large es string`, 'api');
                    }
                }
            }
        }
        
    } catch (error) {
        assert(false, `Error en testing de validación: ${error.message}`, 'api');
    }
}

// ================================================================
// 6. REPORTE FINAL
// ================================================================

function generateTestReport() {
    log(`\n${colors.bold}📋 REPORTE FINAL DE TESTING${colors.reset}`, 'magenta');
    log(`${colors.bold}=============================${colors.reset}`, 'magenta');
    
    const categories = ['database', 'api', 'integration', 'performance'];
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    
    for (const category of categories) {
        const results = testResults[category];
        const total = results.passed + results.failed;
        const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
        
        totalPassed += results.passed;
        totalFailed += results.failed;
        totalTests += total;
        
        const status = results.failed === 0 ? '✅' : '❌';
        const color = results.failed === 0 ? 'green' : 'red';
        
        log(`\n${status} ${category.toUpperCase()}: ${results.passed}/${total} (${percentage}%)`, color);
        
        if (results.failed > 0) {
            const failedTests = results.tests.filter(t => !t.passed);
            failedTests.forEach(test => {
                log(`   ❌ ${test.name}`, 'red');
            });
        }
    }
    
    const overallPercentage = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    const overallStatus = totalFailed === 0 ? '🎉' : '⚠️';
    const overallColor = totalFailed === 0 ? 'green' : 'yellow';
    
    log(`\n${colors.bold}${overallStatus} RESULTADO GENERAL: ${totalPassed}/${totalTests} (${overallPercentage}%)${colors.reset}`, overallColor);
    
    if (totalFailed === 0) {
        log(`\n🎉 ¡TODOS LOS TESTS PASARON! API 100% FUNCIONAL`, 'green');
        log(`✅ Base de datos: Estructura correcta`, 'green');
        log(`✅ API: Todos los endpoints funcionando`, 'green');  
        log(`✅ Integración: DB ↔ API sincronizados`, 'green');
        log(`✅ Performance: Tiempos de respuesta óptimos`, 'green');
    } else {
        log(`\n⚠️  ${totalFailed} tests fallaron. Revisar arriba para detalles.`, 'yellow');
    }
    
    return {
        totalTests,
        totalPassed,
        totalFailed,
        percentage: overallPercentage,
        success: totalFailed === 0
    };
}

// ================================================================
// 7. FUNCIÓN PRINCIPAL
// ================================================================

async function runCompleteTestSuite() {
    log(`${colors.bold}🧪 INICIANDO SUITE COMPLETO DE TESTING FLORESYA${colors.reset}`, 'cyan');
    log(`${colors.bold}===============================================${colors.reset}`, 'cyan');
    
    const startTime = Date.now();
    
    try {
        // Verificar que el servidor esté corriendo
        const serverCheck = await fetch(`${BASE_URL}/api/health`).catch(() => null);
        if (!serverCheck || !serverCheck.ok) {
            log(`❌ Servidor no disponible en ${BASE_URL}`, 'red');
            log(`💡 Inicia el servidor: npm start`, 'yellow');
            return false;
        }
        
        log(`✅ Servidor disponible en ${BASE_URL}`, 'green');
        
        // Ejecutar todos los tests
        await testDatabaseStructure();
        await testApiEndpoints();
        await testDatabaseApiIntegration();
        await testPerformance();
        await testDataValidation();
        
        // Generar reporte
        const results = generateTestReport();
        
        const endTime = Date.now();
        const totalTime = ((endTime - startTime) / 1000).toFixed(2);
        
        log(`\n⏱️  Tiempo total de testing: ${totalTime}s`, 'dim');
        
        return results.success;
        
    } catch (error) {
        log(`\n❌ Error fatal en suite de testing: ${error.message}`, 'red');
        console.error(error);
        return false;
    }
}

// Exportar para uso en otros archivos
module.exports = {
    runCompleteTestSuite,
    testDatabaseStructure,
    testApiEndpoints,
    testDatabaseApiIntegration,
    testPerformance,
    testDataValidation
};

// Ejecutar si es llamado directamente
if (require.main === module) {
    runCompleteTestSuite().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}