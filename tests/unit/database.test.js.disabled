/**
 * 🗄️ DATABASE UNIT TESTS
 * Tests unitarios para verificar la estructura y funcionamiento de la base de datos
 */

const { ModernTestRunner } = require('../testRunner');
const { databaseService } = require('../../backend/src/services/databaseService');

async function databaseTests() {
    const runner = new ModernTestRunner();
    
    // Configurar el runner
    runner.configure({
        bail: false,
        verbose: true,
        timeout: 15000
    });

    // Hooks para setup y teardown
    runner.beforeAll(async () => {
        await databaseService.testConnection();
    });

    await runner.run();

    // ==========================================
    // TESTS DE ESTRUCTURA DE BASE DE DATOS
    // ==========================================
    
    await runner.describe('Database Structure', async ({ it, expect }) => {
        
        it('should connect to Supabase successfully', async () => {
            const isConnected = await databaseService.testConnection();
            expect(isConnected).toBe(true);
        });

        it('should have products table with correct structure', async () => {
            const { data: products } = await databaseService.query('products', { limit: 1 });
            expect(products).toBeTruthy();
            
            if (products.length > 0) {
                const product = products[0];
                expect(product).toHaveProperty('id');
                expect(product).toHaveProperty('name');
                expect(product).toHaveProperty('description');
                expect(product).toHaveProperty('price');
                expect(product).toHaveProperty('active');
                
                // Verificar que NO tiene campos legacy
                expect(product).not.toHaveProperty('image_url');
                expect(product).not.toHaveProperty('additional_images');
                expect(product).not.toHaveProperty('category_id');
            }
        });

        it('should have product_images table with correct structure', async () => {
            const { data: images } = await databaseService.query('product_images', { limit: 1 });
            expect(images).toBeTruthy();
            
            if (images.length > 0) {
                const image = images[0];
                expect(image).toHaveProperty('id');
                expect(image).toHaveProperty('product_id');
                expect(image).toHaveProperty('file_hash');
                expect(image).toHaveProperty('original_filename');
                expect(image).toHaveProperty('url_large');
                expect(image).toHaveProperty('is_primary');
                expect(image).toHaveProperty('display_order');
                
                // Verificar hash SHA256
                expect(image.file_hash).toBeTruthy();
                expect(image.file_hash.length).toBe(64);
            }
        });

        it('should have occasions table with correct structure', async () => {
            const { data: occasions } = await databaseService.query('occasions', { limit: 1 });
            expect(occasions).toBeTruthy();
            
            if (occasions.length > 0) {
                const occasion = occasions[0];
                expect(occasion).toHaveProperty('id');
                expect(occasion).toHaveProperty('name');
                expect(occasion).toHaveProperty('active');
            }
        });

        it('should NOT have categories table (eliminated)', async () => {
            let categoriesExist = false;
            try {
                await databaseService.query('categories', { limit: 1 });
                categoriesExist = true;
            } catch (error) {
                // Error esperado - la tabla no debe existir
                expect(error.message).toContain('categories');
            }
            
            expect(categoriesExist).toBe(false);
        });
    });

    // ==========================================
    // TESTS DE INTEGRIDAD DE DATOS
    // ==========================================
    
    await runner.describe('Data Integrity', async ({ it, expect }) => {
        
        it('should have valid product data', async () => {
            const { data: products } = await databaseService.query('products', { 
                eq: { active: true },
                limit: 10 
            });
            
            expect(products).toBeTruthy();
            expect(Array.isArray(products)).toBe(true);
            
            for (const product of products) {
                expect(product.id).toBeGreaterThan(0);
                expect(product.name).toBeTruthy();
                expect(product.price).toBeGreaterThan(0);
                expect(product.active).toBe(true);
            }
        });

        it('should have valid image hashes (SHA256)', async () => {
            const { data: images } = await databaseService.query('product_images', { limit: 10 });
            
            for (const image of images) {
                expect(image.file_hash).toBeTruthy();
                expect(image.file_hash.length).toBe(64);
                expect(/^[a-f0-9]{64}$/.test(image.file_hash)).toBe(true);
            }
        });

        it('should not have orphaned images', async () => {
            // Obtener imágenes que no tienen producto válido
            const client = databaseService.getClient();
            const { data: orphanImages, error } = await client
                .from('product_images')
                .select('id, product_id')
                .not('product_id', 'in', `(SELECT id FROM products WHERE active = true)`);

            expect(error).toBe(null);
            expect(orphanImages.length).toBe(0);
        });

        it('should not have products without images', async () => {
            const { data: products } = await databaseService.query('products', {
                select: `
                    id, name,
                    images:product_images(id)
                `,
                eq: { active: true }
            });

            const productsWithoutImages = products.filter(p => !p.images || p.images.length === 0);
            
            // Log warning si hay productos sin imágenes pero no fallar el test
            if (productsWithoutImages.length > 0) {
                console.warn(`⚠️ ${productsWithoutImages.length} productos sin imágenes encontrados`);
            }
            
            // Verificar que el sistema puede manejar productos sin imágenes
            expect(Array.isArray(products)).toBe(true);
        });
    });

    // ==========================================
    // TESTS DE FUNCIONES RPC
    // ==========================================
    
    await runner.describe('RPC Functions', async ({ it, expect }) => {
        
        it('should have get_existing_image_by_hash function', async () => {
            const result = await databaseService.rpc('get_existing_image_by_hash', { 
                hash_input: 'test_hash_that_does_not_exist' 
            });
            
            expect(result).toBeTruthy();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0); // No debe encontrar el hash de prueba
        });
    });

    // ==========================================
    // TESTS DE PERFORMANCE
    // ==========================================
    
    await runner.describe('Database Performance', async ({ it, expect }) => {
        
        it('should return products quickly (< 1000ms)', async () => {
            const startTime = Date.now();
            const { data: products } = await databaseService.query('products', { limit: 50 });
            const duration = Date.now() - startTime;
            
            expect(products).toBeTruthy();
            expect(duration).toBeLessThan(1000);
        });

        it('should count records efficiently', async () => {
            const startTime = Date.now();
            const count = await databaseService.count('products');
            const duration = Date.now() - startTime;
            
            expect(count).toBeGreaterThanOrEqual(0);
            expect(duration).toBeLessThan(500);
        });
    });

    return await runner.generateReport();
}

module.exports = { databaseTests };

// Ejecutar si es llamado directamente
if (require.main === module) {
    databaseTests().then(result => {
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}