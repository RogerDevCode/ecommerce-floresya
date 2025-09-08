/**
 * 🧪 TESTING SIMPLIFICADO API FLORESYA
 * Testing directo usando child_process para curl
 */

const { supabase } = require('./backend/src/config/database');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Colores
const colors = {
    green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', blue: '\x1b[34m',
    magenta: '\x1b[35m', cyan: '\x1b[36m', reset: '\x1b[0m', bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

// Resultados
let results = { passed: 0, failed: 0, tests: [] };

const assert = (condition, testName) => {
    const result = { name: testName, passed: Boolean(condition) };
    results.tests.push(result);
    
    if (result.passed) {
        results.passed++;
        log(`  ✅ ${testName}`, 'green');
    } else {
        results.failed++;
        log(`  ❌ ${testName}`, 'red');
    }
    
    return result.passed;
};

async function testAPI() {
    log(`${colors.bold}🧪 TESTING API FLORESYA${colors.reset}`, 'cyan');
    log(`${colors.bold}=====================${colors.reset}`, 'cyan');
    
    try {
        // 1. Test Health Endpoint
        log(`\n🔍 Testing Health Endpoint`, 'blue');
        const { stdout: healthOut } = await execAsync('curl -s "http://localhost:3000/api/health"');
        const healthData = JSON.parse(healthOut);
        assert(healthData.success === true, 'Health endpoint funciona');
        
        // 2. Test Products Endpoint
        log(`\n🔍 Testing Products Endpoint`, 'blue');
        const { stdout: productsOut } = await execAsync('curl -s "http://localhost:3000/api/products?limit=3"');
        const productsData = JSON.parse(productsOut);
        
        assert(productsData.success === true, 'Products endpoint funciona');
        assert(Array.isArray(productsData.data?.products), 'Retorna array de productos');
        
        if (productsData.data?.products?.length > 0) {
            const product = productsData.data.products[0];
            
            // CRÍTICOS: Verificar nuevo sistema (debe NO tener campos legacy)
            assert(!product.hasOwnProperty('image_url'), 'Correctamente NO tiene campo image_url legacy');
            assert(!product.hasOwnProperty('additional_images'), 'Correctamente NO tiene campo additional_images legacy');
            assert(product.hasOwnProperty('images'), 'SÍ tiene campo images nuevo');
            
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                const image = product.images[0];
                assert(image.hasOwnProperty('url_large'), 'Imagen tiene url_large');
                assert(image.hasOwnProperty('file_hash'), 'Imagen tiene file_hash SHA256');
                assert(image.file_hash && image.file_hash.length === 64, 'Hash SHA256 válido');
                
                log(`   📸 Producto ${product.id}: ${product.images.length} imágenes`, 'cyan');
            }
        }
        
        // 3. Test Single Product
        if (productsData.data?.products?.length > 0) {
            const productId = productsData.data.products[0].id;
            log(`\n🔍 Testing Single Product (ID: ${productId})`, 'blue');
            
            const { stdout: singleOut } = await execAsync(`curl -s "http://localhost:3000/api/products/${productId}"`);
            const singleData = JSON.parse(singleOut);
            
            assert(singleData.success === true, 'Single product endpoint funciona');
            assert(singleData.data?.id === productId, 'Retorna producto correcto');
        }
        
        // 4. Test Categories
        log(`\n🔍 Testing Categories Endpoint`, 'blue');
        const { stdout: categoriesOut } = await execAsync('curl -s "http://localhost:3000/api/categories"');
        const categoriesData = JSON.parse(categoriesOut);
        assert(categoriesData.success === true, 'Categories endpoint funciona');
        
        // 5. Test Occasions  
        log(`\n🔍 Testing Occasions Endpoint`, 'blue');
        const { stdout: occasionsOut } = await execAsync('curl -s "http://localhost:3000/api/occasions"');
        const occasionsData = JSON.parse(occasionsOut);
        assert(occasionsData.success === true, 'Occasions endpoint funciona');
        
    } catch (error) {
        assert(false, `Error en API testing: ${error.message}`);
    }
}

async function testDatabase() {
    log(`\n${colors.bold}🗄️ TESTING BASE DE DATOS${colors.reset}`, 'cyan');
    log(`${colors.bold}========================${colors.reset}`, 'cyan');
    
    try {
        // Test conexión
        const { data: healthDB, error: connectionError } = await supabase
            .from('products')
            .select('count', { count: 'exact', head: true });
        assert(!connectionError, 'Conexión a Supabase exitosa');
        
        // Test tabla products
        const { data: sampleProduct } = await supabase
            .from('products')
            .select('*')
            .limit(1)
            .single();
            
        if (sampleProduct) {
            const keys = Object.keys(sampleProduct);
            assert(keys.includes('id'), 'Tabla products tiene campo id');
            assert(keys.includes('name'), 'Tabla products tiene campo name');
            assert(!keys.includes('image_url'), 'Correctamente tabla products NO tiene image_url legacy');
            assert(!keys.includes('additional_images'), 'Correctamente tabla products NO tiene additional_images legacy');
        }
        
        // Test tabla product_images
        const { data: sampleImage, error: imageError } = await supabase
            .from('product_images')
            .select('*')
            .limit(1)
            .single();
            
        assert(!imageError, 'Tabla product_images existe');
        
        if (sampleImage) {
            assert(sampleImage.hasOwnProperty('file_hash'), 'product_images tiene file_hash');
            assert(sampleImage.hasOwnProperty('url_large'), 'product_images tiene url_large');
            assert(sampleImage.file_hash.length === 64, 'file_hash es SHA256 válido');
        }
        
        // Test función hash
        const { data: hashTest, error: hashError } = await supabase
            .rpc('get_existing_image_by_hash', { hash_input: 'test123' });
        assert(!hashError, 'Función get_existing_image_by_hash existe');
        
        // Contar datos
        const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });
            
        const { count: imagesCount } = await supabase
            .from('product_images')
            .select('*', { count: 'exact', head: true });
            
        log(`   📊 Productos en DB: ${productsCount}`, 'cyan');
        log(`   📊 Imágenes en DB: ${imagesCount}`, 'cyan');
        
        assert(productsCount >= 0, 'Conteo de productos válido');
        assert(imagesCount >= 0, 'Conteo de imágenes válido');
        
    } catch (error) {
        assert(false, `Error en DB testing: ${error.message}`);
    }
}

async function testIntegration() {
    log(`\n${colors.bold}🔗 TESTING INTEGRACIÓN${colors.reset}`, 'cyan');
    log(`${colors.bold}===================${colors.reset}`, 'cyan');
    
    try {
        // Obtener productos desde DB
        const { data: dbProducts } = await supabase
            .from('products')
            .select('id, name, price')
            .eq('active', true)
            .limit(2);
            
        // Obtener productos desde API
        const { stdout: apiOut } = await execAsync('curl -s "http://localhost:3000/api/products?limit=2"');
        const apiData = JSON.parse(apiOut);
        
        if (dbProducts && apiData.success) {
            const dbIds = dbProducts.map(p => p.id).sort();
            const apiIds = apiData.data.products.map(p => p.id).sort();
            
            assert(JSON.stringify(dbIds) === JSON.stringify(apiIds), 'IDs coinciden entre DB y API');
            
            // Verificar precios
            for (const dbProduct of dbProducts) {
                const apiProduct = apiData.data.products.find(p => p.id === dbProduct.id);
                if (apiProduct) {
                    assert(dbProduct.price === apiProduct.price, `Precio coincide para producto ${dbProduct.id}`);
                }
            }
        }
        
        // Test imágenes
        if (dbProducts && dbProducts.length > 0) {
            const productId = dbProducts[0].id;
            
            const { data: dbImages } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', productId);
                
            const { stdout: apiProductOut } = await execAsync(`curl -s "http://localhost:3000/api/products/${productId}"`);
            const apiProductData = JSON.parse(apiProductOut);
            
            if (dbImages && apiProductData.success) {
                const apiImages = apiProductData.data.images || [];
                assert(dbImages.length === apiImages.length, `Cantidad de imágenes coincide para producto ${productId}`);
            }
        }
        
    } catch (error) {
        assert(false, `Error en integration testing: ${error.message}`);
    }
}

async function runAllTests() {
    const startTime = Date.now();
    
    log(`${colors.bold}🚀 INICIANDO TESTING COMPLETO${colors.reset}`, 'magenta');
    log(`${colors.bold}==============================${colors.reset}`, 'magenta');
    
    await testDatabase();
    await testAPI();
    await testIntegration();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Reporte final
    log(`\n${colors.bold}📋 REPORTE FINAL${colors.reset}`, 'magenta');
    log(`${colors.bold}===============${colors.reset}`, 'magenta');
    
    const total = results.passed + results.failed;
    const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    
    if (results.failed === 0) {
        log(`\n🎉 TODOS LOS TESTS PASARON: ${results.passed}/${total} (${percentage}%)`, 'green');
        log(`✅ API 100% FUNCIONAL`, 'green');
        log(`✅ Sistema nuevo implementado correctamente`, 'green');
        log(`✅ Base de datos estructura correcta`, 'green');
        log(`✅ Integración DB ↔ API perfecta`, 'green');
    } else {
        log(`\n⚠️  ${results.failed} tests fallaron: ${results.passed}/${total} (${percentage}%)`, 'yellow');
        const failed = results.tests.filter(t => !t.passed);
        failed.forEach(test => log(`   ❌ ${test.name}`, 'red'));
    }
    
    log(`\n⏱️  Tiempo total: ${duration}s`, 'cyan');
    
    return results.failed === 0;
}

if (require.main === module) {
    runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runAllTests };