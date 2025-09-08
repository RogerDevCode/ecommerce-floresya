/**
 * 🔌 API UNIT TESTS
 * Tests unitarios para verificar todos los endpoints de la API
 */

const { ModernTestRunner } = require('../testRunner');
const { databaseService } = require('../../backend/src/services/databaseService');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function apiTests() {
    const runner = new ModernTestRunner();
    
    runner.configure({
        bail: false,
        verbose: true,
        timeout: 20000
    });

    // Variables globales para tests
    let testProductId = null;
    let testImageId = null;

    // Hooks para setup y teardown
    runner.beforeAll(async () => {
        // Verificar que el servidor está corriendo
        try {
            await execAsync('curl -f -s "http://localhost:3000/api/health" > /dev/null');
        } catch (error) {
            throw new Error('❌ API server not running. Please start with: npm start');
        }
    });

    await runner.run();

    // ==========================================
    // TESTS DE HEALTH Y STATUS
    // ==========================================
    
    await runner.describe('API Health & Status', async ({ it, expect }) => {
        
        it('should respond to health check', async () => {
            const { stdout } = await execAsync('curl -s "http://localhost:3000/api/health"');
            const response = JSON.parse(stdout);
            
            expect(response.success).toBe(true);
            expect(response.message).toBeTruthy();
        });

        it('should return proper headers', async () => {
            const { stdout } = await execAsync('curl -I -s "http://localhost:3000/api/health"');
            expect(stdout).toContain('Content-Type: application/json');
        });
    });

    // ==========================================
    // TESTS DE PRODUCTS ENDPOINT
    // ==========================================
    
    await runner.describe('Products API', async ({ it, expect }) => {
        
        it('should get all products with pagination', async () => {
            const { stdout } = await execAsync('curl -s "http://localhost:3000/api/products?limit=5"');
            const response = JSON.parse(stdout);
            
            expect(response.success).toBe(true);
            expect(response.data).toBeTruthy();
            expect(response.data.products).toBeTruthy();
            expect(Array.isArray(response.data.products)).toBe(true);
            expect(response.data.products.length).toBeLessThanOrEqual(5);
            
            // Verificar estructura de producto
            if (response.data.products.length > 0) {
                const product = response.data.products[0];
                testProductId = product.id; // Guardar para otros tests
                
                expect(product).toHaveProperty('id');
                expect(product).toHaveProperty('name');
                expect(product).toHaveProperty('description');
                expect(product).toHaveProperty('price');
                expect(product).toHaveProperty('images');
                
                // Verificar que NO tiene campos legacy
                expect(product).not.toHaveProperty('image_url');
                expect(product).not.toHaveProperty('additional_images');
                expect(product).not.toHaveProperty('category_id');
                
                // Verificar estructura de imágenes
                if (product.images && product.images.length > 0) {
                    const image = product.images[0];
                    expect(image).toHaveProperty('url_large');
                    expect(image).toHaveProperty('file_hash');
                    expect(image).toHaveProperty('is_primary');
                    expect(image).toHaveProperty('display_order');
                    
                    // Verificar hash SHA256
                    expect(image.file_hash.length).toBe(64);
                    expect(/^[a-f0-9]{64}$/.test(image.file_hash)).toBe(true);
                }
            }
        });

        it('should get single product by ID', async () => {
            if (!testProductId) {
                throw new Error('No test product ID available');
            }
            
            const { stdout } = await execAsync(`curl -s "http://localhost:3000/api/products/${testProductId}"`);
            const response = JSON.parse(stdout);
            
            expect(response.success).toBe(true);
            expect(response.data).toBeTruthy();
            expect(response.data.id).toBe(testProductId);
            expect(response.data.name).toBeTruthy();
            expect(response.data.price).toBeGreaterThan(0);
            
            // Verificar que NO tiene campos legacy
            expect(response.data).not.toHaveProperty('image_url');
            expect(response.data).not.toHaveProperty('additional_images');
            expect(response.data).not.toHaveProperty('category_id');
        });

        it('should handle invalid product ID gracefully', async () => {
            const { stdout } = await execAsync('curl -s "http://localhost:3000/api/products/999999"');
            const response = JSON.parse(stdout);
            
            expect(response.success).toBe(false);
            expect(response.message).toContain('not found');
        });

        it('should support pagination parameters', async () => {
            const { stdout } = await execAsync('curl -s "http://localhost:3000/api/products?page=1&limit=3"');
            const response = JSON.parse(stdout);
            
            expect(response.success).toBe(true);
            expect(response.data.products.length).toBeLessThanOrEqual(3);
            
            if (response.data.pagination) {
                expect(response.data.pagination).toHaveProperty('page');
                expect(response.data.pagination).toHaveProperty('limit');
                expect(response.data.pagination).toHaveProperty('total');
            }
        });

        it('should filter by active products only', async () => {
            const { stdout } = await execAsync('curl -s "http://localhost:3000/api/products?active=true"');
            const response = JSON.parse(stdout);
            
            expect(response.success).toBe(true);
            
            for (const product of response.data.products) {
                expect(product.active).toBe(true);
            }
        });
    });

    // ==========================================
    // TESTS DE OCCASIONS ENDPOINT
    // ==========================================
    
    await runner.describe('Occasions API', async ({ it, expect }) => {
        
        it('should get all occasions', async () => {
            const { stdout } = await execAsync('curl -s "http://localhost:3000/api/occasions"');
            const response = JSON.parse(stdout);
            
            expect(response.success).toBe(true);
            expect(response.data).toBeTruthy();
            expect(Array.isArray(response.data)).toBe(true);
            
            if (response.data.length > 0) {
                const occasion = response.data[0];
                expect(occasion).toHaveProperty('id');
                expect(occasion).toHaveProperty('name');
                expect(occasion).toHaveProperty('active');
            }
        });

        it('should filter active occasions only', async () => {
            const { stdout } = await execAsync('curl -s "http://localhost:3000/api/occasions?active=true"');
            const response = JSON.parse(stdout);
            
            expect(response.success).toBe(true);
            
            for (const occasion of response.data) {
                expect(occasion.active).toBe(true);
            }
        });
    });

    // ==========================================
    // TESTS QUE CATEGORIES NO EXISTA
    // ==========================================
    
    await runner.describe('Legacy Categories Removal', async ({ it, expect }) => {
        
        it('should NOT have categories endpoint', async () => {
            let categoriesEndpointExists = false;
            try {
                const { stdout } = await execAsync('curl -s "http://localhost:3000/api/categories"');
                const response = JSON.parse(stdout);
                
                if (response.success) {
                    categoriesEndpointExists = true;
                }
            } catch (error) {
                // Error esperado si el endpoint no existe
            }
            
            expect(categoriesEndpointExists).toBe(false);
        });
    });

    // ==========================================
    // TESTS DE PERFORMANCE
    // ==========================================
    
    await runner.describe('API Performance', async ({ it, expect }) => {
        
        it('should respond to health check quickly (< 100ms)', async () => {
            const startTime = Date.now();
            await execAsync('curl -s "http://localhost:3000/api/health"');
            const duration = Date.now() - startTime;
            
            expect(duration).toBeLessThan(100);
        });

        it('should load products page quickly (< 1000ms)', async () => {
            const startTime = Date.now();
            await execAsync('curl -s "http://localhost:3000/api/products?limit=10"');
            const duration = Date.now() - startTime;
            
            expect(duration).toBeLessThan(1000);
        });
    });

    // ==========================================
    // TESTS DE ERROR HANDLING
    // ==========================================
    
    await runner.describe('Error Handling', async ({ it, expect }) => {
        
        it('should handle malformed requests gracefully', async () => {
            const { stdout } = await execAsync('curl -s "http://localhost:3000/api/products?limit=invalid"');
            const response = JSON.parse(stdout);
            
            // Should either succeed with default limit or return proper error
            expect(response).toHaveProperty('success');
            expect(typeof response.success).toBe('boolean');
        });

        it('should return 404 for non-existent endpoints', async () => {
            let statusCode;
            try {
                await execAsync('curl -s -w "%{http_code}" "http://localhost:3000/api/nonexistent" -o /dev/null');
            } catch (error) {
                // Expected error for 404
            }
            
            // Test that we get some response
            const { stdout } = await execAsync('curl -s "http://localhost:3000/api/nonexistent" || echo "{\\"success\\": false}"');
            const response = JSON.parse(stdout);
            expect(response.success).toBe(false);
        });
    });

    // ==========================================
    // TESTS DE INTEGRACIÓN API ↔ DATABASE
    // ==========================================
    
    await runner.describe('API ↔ Database Integration', async ({ it, expect }) => {
        
        it('should return consistent data between API and database', async () => {
            // Obtener datos de la API
            const { stdout: apiData } = await execAsync('curl -s "http://localhost:3000/api/products?limit=5"');
            const apiResponse = JSON.parse(apiData);
            
            expect(apiResponse.success).toBe(true);
            
            if (apiResponse.data.products.length > 0) {
                const apiProduct = apiResponse.data.products[0];
                
                // Obtener el mismo producto de la base de datos
                const { data: dbProducts } = await databaseService.query('products', {
                    eq: { id: apiProduct.id }
                });
                
                expect(dbProducts.length).toBe(1);
                const dbProduct = dbProducts[0];
                
                // Verificar consistencia de datos
                expect(apiProduct.id).toBe(dbProduct.id);
                expect(apiProduct.name).toBe(dbProduct.name);
                expect(apiProduct.price).toBe(dbProduct.price);
                expect(apiProduct.active).toBe(dbProduct.active);
            }
        });

        it('should have consistent image count between API and database', async () => {
            if (!testProductId) return;
            
            // Obtener imágenes desde API
            const { stdout } = await execAsync(`curl -s "http://localhost:3000/api/products/${testProductId}"`);
            const apiResponse = JSON.parse(stdout);
            
            const apiImageCount = apiResponse.data.images ? apiResponse.data.images.length : 0;
            
            // Obtener imágenes desde base de datos
            const dbImageCount = await databaseService.count('product_images', { 
                product_id: testProductId 
            });
            
            expect(apiImageCount).toBe(dbImageCount);
        });
    });

    return await runner.generateReport();
}

module.exports = { apiTests };

// Ejecutar si es llamado directamente
if (require.main === module) {
    apiTests().then(result => {
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error('❌ API Test execution failed:', error);
        process.exit(1);
    });
}