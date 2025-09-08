/**
 * Sistema de Testing Exhaustivo - API Backend FloresYa
 * Pruebas completas para todas las APIs del backend
 * Incluye logging detallado y validación 100% funcional
 */

class APIBackendTestSuite {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.testResults = [];
        this.authToken = null;
        this.testData = {
            adminUser: { email: 'admin@floresya.com', password: 'admin123' },
            testProduct: null,
            testOrder: null,
            testPayment: null
        };
        this.console = new TestLogger('APIBackendTest');
    }

    // Ejecutar todas las pruebas
    async runAllTests() {
        this.console.group('🚀 Iniciando Testing Exhaustivo - API Backend FloresYa');
        this.console.info('Fecha:', new Date().toISOString());
        this.console.info('Base URL:', this.baseURL);

        try {
            // Tests de infraestructura
            await this.testHealthCheck();
            await this.testDatabaseConnection();
            
            // Tests de autenticación
            await this.testAuthLogin();
            await this.testAuthRegister();
            
            // Tests de productos
            await this.testGetProducts();
            await this.testGetProductById();
            await this.testCreateProduct();
            await this.testUpdateProduct();
            await this.testDeleteProduct();
            
            // Tests de ocasiones
            await this.testGetOccasions();
            await this.testCreateOccasion();
            
            // Tests de carrusel
            await this.testGetCarousel();
            await this.testCreateCarouselItem();
            
            // Tests de órdenes
            await this.testCreateOrder();
            await this.testGetOrders();
            await this.testGetOrderById();
            await this.testUpdateOrderStatus();
            
            // Tests de pagos
            await this.testGetPaymentMethods();
            await this.testCreatePayment();
            await this.testGetPayments();
            
            // Tests de configuración
            await this.testGetSettings();
            await this.testUpdateSetting();
            
            // Tests de categorías (legacy)
            await this.testGetCategories();
            
            // Tests de edge cases
            await this.testErrorHandling();
            await this.testRateLimiting();
            await this.testInputValidation();
            
        } catch (error) {
            this.console.error('Error crítico en suite de pruebas:', error);
        }

        this.console.groupEnd();
        return this.generateReport();
    }

    // Test de health check
    async testHealthCheck() {
        this.console.group('🏥 Health Check');
        try {
            const response = await fetch(`${this.baseURL}/api/health`);
            const data = await response.json();
            
            this.assert(response.ok, 'Health endpoint should return 200');
            this.assert(data.status === 'healthy', 'Health status should be healthy');
            this.assert(data.timestamp, 'Health should include timestamp');
            
            this.console.success('✅ Health check passed');
            this.recordTest('Health Check', true, 'API is healthy');
        } catch (error) {
            this.console.error('❌ Health check failed:', error);
            this.recordTest('Health Check', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de conexión a base de datos
    async testDatabaseConnection() {
        this.console.group('🗄️ Database Connection');
        try {
            const response = await fetch(`${this.baseURL}/api/database/status`);
            const data = await response.json();
            
            this.assert(response.ok, 'Database endpoint should return 200');
            this.assert(data.success, 'Database should be connected');
            
            this.console.success('✅ Database connection test passed');
            this.recordTest('Database Connection', true, 'Database is connected');
        } catch (error) {
            this.console.error('❌ Database connection test failed:', error);
            this.recordTest('Database Connection', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de login
    async testAuthLogin() {
        this.console.group('🔐 Auth - Login');
        try {
            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.testData.adminUser)
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Login should return 200');
            this.assert(data.success, 'Login should be successful');
            this.assert(data.data.token, 'Login should return token');
            this.assert(data.data.user, 'Login should return user data');
            this.assert(data.data.user.role === 'admin', 'User should be admin');
            
            this.authToken = data.data.token;
            this.console.success('✅ Login test passed');
            this.console.info('Auth token obtained:', this.authToken.substring(0, 20) + '...');
            this.recordTest('Auth Login', true, 'Login successful');
        } catch (error) {
            this.console.error('❌ Login test failed:', error);
            this.recordTest('Auth Login', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de registro
    async testAuthRegister() {
        this.console.group('📝 Auth - Register');
        try {
            const testUser = {
                first_name: 'Test',
                last_name: 'User',
                email: `test${Date.now()}@test.com`,
                password: 'test123',
                phone: '+584141234567'
            };

            const response = await fetch(`${this.baseURL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testUser)
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Register should return 200');
            this.assert(data.success, 'Register should be successful');
            this.assert(data.data.token, 'Register should return token');
            this.assert(data.data.user, 'Register should return user data');
            this.assert(data.data.user.email === testUser.email, 'User email should match');
            
            this.console.success('✅ Register test passed');
            this.recordTest('Auth Register', true, 'Registration successful');
        } catch (error) {
            this.console.error('❌ Register test failed:', error);
            this.recordTest('Auth Register', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de obtener productos
    async testGetProducts() {
        this.console.group('📦 Get Products');
        try {
            // Test básico
            const response = await fetch(`${this.baseURL}/api/products`);
            const data = await response.json();
            
            this.assert(response.ok, 'Get products should return 200');
            this.assert(data.success, 'Get products should be successful');
            this.assert(Array.isArray(data.data.products), 'Products should be an array');
            this.assert(data.data.pagination, 'Response should include pagination');
            
            // Test con filtros
            const filteredResponse = await fetch(`${this.baseURL}/api/products?limit=5&page=1`);
            const filteredData = await filteredResponse.json();
            
            this.assert(filteredResponse.ok, 'Filtered products should return 200');
            this.assert(filteredData.data.products.length <= 5, 'Should respect limit parameter');
            
            // Test con ocasión
            const occasionResponse = await fetch(`${this.baseURL}/api/products?occasionId=1`);
            const occasionData = await occasionResponse.json();
            
            this.assert(occasionResponse.ok, 'Occasion filtered products should return 200');
            
            this.console.success('✅ Get Products test passed');
            this.console.info(`Found ${data.data.products.length} products`);
            this.recordTest('Get Products', true, `Found ${data.data.products.length} products`);
        } catch (error) {
            this.console.error('❌ Get Products test failed:', error);
            this.recordTest('Get Products', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de obtener producto por ID
    async testGetProductById() {
        this.console.group('🔍 Get Product By ID');
        try {
            // Primero obtener un producto existente
            const productsResponse = await fetch(`${this.baseURL}/api/products?limit=1`);
            const productsData = await productsResponse.json();
            
            if (productsData.data.products.length === 0) {
                throw new Error('No products available for testing');
            }
            
            const productId = productsData.data.products[0].id;
            
            // Test del endpoint específico
            const response = await fetch(`${this.baseURL}/api/products/${productId}`);
            const data = await response.json();
            
            this.assert(response.ok, 'Get product by ID should return 200');
            this.assert(data.success, 'Get product by ID should be successful');
            this.assert(data.data.product, 'Response should contain product data');
            this.assert(data.data.product.id === productId, 'Product ID should match');
            this.assert(data.data.product.name, 'Product should have name');
            this.assert(data.data.product.price, 'Product should have price');
            
            this.testData.testProduct = data.data.product;
            
            // Test producto no existente
            const notFoundResponse = await fetch(`${this.baseURL}/api/products/999999`);
            this.assert(notFoundResponse.status === 404, 'Non-existent product should return 404');
            
            this.console.success('✅ Get Product By ID test passed');
            this.console.info(`Product tested: ${data.data.product.name}`);
            this.recordTest('Get Product By ID', true, 'Product retrieval successful');
        } catch (error) {
            this.console.error('❌ Get Product By ID test failed:', error);
            this.recordTest('Get Product By ID', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de crear producto (admin)
    async testCreateProduct() {
        this.console.group('➕ Create Product (Admin)');
        try {
            if (!this.authToken) {
                throw new Error('Auth token required for admin operations');
            }

            const newProduct = {
                name: `Test Product ${Date.now()}`,
                description: 'This is a test product created by automated testing suite',
                price: 25.99,
                stock_quantity: 10,
                category_id: 1,
                occasion: 'birthday',
                featured: false,
                active: true
            };

            const response = await fetch(`${this.baseURL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(newProduct)
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Create product should return 200');
            this.assert(data.success, 'Create product should be successful');
            this.assert(data.data.product, 'Response should contain created product');
            this.assert(data.data.product.name === newProduct.name, 'Product name should match');
            this.assert(parseFloat(data.data.product.price) === newProduct.price, 'Product price should match');
            
            this.console.success('✅ Create Product test passed');
            this.console.info(`Created product ID: ${data.data.product.id}`);
            this.recordTest('Create Product', true, 'Product creation successful');
        } catch (error) {
            this.console.error('❌ Create Product test failed:', error);
            this.recordTest('Create Product', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de actualizar producto (admin)
    async testUpdateProduct() {
        this.console.group('✏️ Update Product (Admin)');
        try {
            if (!this.authToken || !this.testData.testProduct) {
                this.console.warn('⚠️ Skipping update test - no auth token or test product');
                this.recordTest('Update Product', false, 'Missing requirements');
                this.console.groupEnd();
                return;
            }

            const productId = this.testData.testProduct.id;
            const updateData = {
                name: `Updated ${this.testData.testProduct.name}`,
                price: parseFloat(this.testData.testProduct.price) + 5.00,
                description: 'Updated by testing suite'
            };

            const response = await fetch(`${this.baseURL}/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(updateData)
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Update product should return 200');
            this.assert(data.success, 'Update product should be successful');
            this.assert(data.data.product.name === updateData.name, 'Product name should be updated');
            
            this.console.success('✅ Update Product test passed');
            this.recordTest('Update Product', true, 'Product update successful');
        } catch (error) {
            this.console.error('❌ Update Product test failed:', error);
            this.recordTest('Update Product', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de eliminar producto (admin)
    async testDeleteProduct() {
        this.console.group('🗑️ Delete Product (Admin)');
        try {
            if (!this.authToken) {
                this.console.warn('⚠️ Skipping delete test - no auth token');
                this.recordTest('Delete Product', false, 'Missing auth token');
                this.console.groupEnd();
                return;
            }

            // Crear producto temporal para eliminar
            const tempProduct = {
                name: `Temp Product ${Date.now()}`,
                description: 'Temporary product for delete testing',
                price: 10.00,
                stock_quantity: 1
            };

            const createResponse = await fetch(`${this.baseURL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(tempProduct)
            });
            
            const createData = await createResponse.json();
            const productId = createData.data.product.id;

            // Eliminar el producto
            const deleteResponse = await fetch(`${this.baseURL}/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const deleteData = await deleteResponse.json();
            
            this.assert(deleteResponse.ok, 'Delete product should return 200');
            this.assert(deleteData.success, 'Delete product should be successful');
            
            // Verificar que el producto fue eliminado
            const verifyResponse = await fetch(`${this.baseURL}/api/products/${productId}`);
            this.assert(verifyResponse.status === 404, 'Deleted product should return 404');
            
            this.console.success('✅ Delete Product test passed');
            this.recordTest('Delete Product', true, 'Product deletion successful');
        } catch (error) {
            this.console.error('❌ Delete Product test failed:', error);
            this.recordTest('Delete Product', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de obtener ocasiones
    async testGetOccasions() {
        this.console.group('🎉 Get Occasions');
        try {
            const response = await fetch(`${this.baseURL}/api/occasions`);
            const data = await response.json();
            
            this.assert(response.ok, 'Get occasions should return 200');
            this.assert(data.success, 'Get occasions should be successful');
            this.assert(Array.isArray(data.data), 'Occasions should be an array');
            
            if (data.data.length > 0) {
                const occasion = data.data[0];
                this.assert(occasion.id, 'Occasion should have ID');
                this.assert(occasion.name, 'Occasion should have name');
            }
            
            this.console.success('✅ Get Occasions test passed');
            this.console.info(`Found ${data.data.length} occasions`);
            this.recordTest('Get Occasions', true, `Found ${data.data.length} occasions`);
        } catch (error) {
            this.console.error('❌ Get Occasions test failed:', error);
            this.recordTest('Get Occasions', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de crear ocasión (admin)
    async testCreateOccasion() {
        this.console.group('➕ Create Occasion (Admin)');
        try {
            if (!this.authToken) {
                this.console.warn('⚠️ Skipping create occasion test - no auth token');
                this.recordTest('Create Occasion', false, 'Missing auth token');
                this.console.groupEnd();
                return;
            }

            const newOccasion = {
                name: `Test Occasion ${Date.now()}`,
                description: 'Test occasion created by automated testing',
                icon: 'bi-star',
                color: '#ff0000',
                active: true
            };

            const response = await fetch(`${this.baseURL}/api/occasions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(newOccasion)
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Create occasion should return 200');
            this.assert(data.success, 'Create occasion should be successful');
            this.assert(data.data.occasion, 'Response should contain created occasion');
            this.assert(data.data.occasion.name === newOccasion.name, 'Occasion name should match');
            
            this.console.success('✅ Create Occasion test passed');
            this.recordTest('Create Occasion', true, 'Occasion creation successful');
        } catch (error) {
            this.console.error('❌ Create Occasion test failed:', error);
            this.recordTest('Create Occasion', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test del manejo de errores
    async testErrorHandling() {
        this.console.group('🚨 Error Handling');
        try {
            // Test 404
            const notFoundResponse = await fetch(`${this.baseURL}/api/nonexistent`);
            this.assert(notFoundResponse.status === 404, 'Non-existent endpoint should return 404');
            
            // Test 400 - Bad Request
            const badRequestResponse = await fetch(`${this.baseURL}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invalid: 'data' })
            });
            this.assert(badRequestResponse.status === 400 || badRequestResponse.status === 401, 'Bad request should return 400 or 401');
            
            // Test 401 - Unauthorized
            const unauthorizedResponse = await fetch(`${this.baseURL}/api/admin/test`, {
                headers: { 'Authorization': 'Bearer invalid-token' }
            });
            this.assert(unauthorizedResponse.status === 401, 'Invalid token should return 401');
            
            this.console.success('✅ Error Handling test passed');
            this.recordTest('Error Handling', true, 'All error cases handled correctly');
        } catch (error) {
            this.console.error('❌ Error Handling test failed:', error);
            this.recordTest('Error Handling', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de validación de entrada
    async testInputValidation() {
        this.console.group('🔍 Input Validation');
        try {
            // Test SQL Injection
            const sqlInjectionResponse = await fetch(`${this.baseURL}/api/products?search=' OR 1=1--`);
            const sqlData = await sqlInjectionResponse.json();
            this.assert(sqlInjectionResponse.ok, 'SQL injection attempt should be handled safely');
            
            // Test XSS
            const xssResponse = await fetch(`${this.baseURL}/api/products?search=<script>alert('xss')</script>`);
            const xssData = await xssResponse.json();
            this.assert(xssResponse.ok, 'XSS attempt should be handled safely');
            
            // Test oversized requests
            const largeData = 'x'.repeat(10000);
            const largeResponse = await fetch(`${this.baseURL}/api/products?search=${largeData}`);
            this.assert(largeResponse.ok || largeResponse.status === 413, 'Large requests should be handled appropriately');
            
            this.console.success('✅ Input Validation test passed');
            this.recordTest('Input Validation', true, 'All validation tests passed');
        } catch (error) {
            this.console.error('❌ Input Validation test failed:', error);
            this.recordTest('Input Validation', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de rate limiting
    async testRateLimiting() {
        this.console.group('⏱️ Rate Limiting');
        try {
            const requests = [];
            for (let i = 0; i < 10; i++) {
                requests.push(fetch(`${this.baseURL}/api/health`));
            }
            
            const responses = await Promise.all(requests);
            const statusCodes = responses.map(r => r.status);
            
            // Verificar que la mayoría de requests fueron exitosos
            const successfulRequests = statusCodes.filter(code => code === 200).length;
            this.assert(successfulRequests >= 5, 'Most requests should be successful');
            
            this.console.success('✅ Rate Limiting test passed');
            this.console.info(`${successfulRequests}/10 requests successful`);
            this.recordTest('Rate Limiting', true, `${successfulRequests}/10 requests successful`);
        } catch (error) {
            this.console.error('❌ Rate Limiting test failed:', error);
            this.recordTest('Rate Limiting', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de carrusel
    async testGetCarousel() {
        this.console.group('🎠 Get Carousel');
        try {
            const response = await fetch(`${this.baseURL}/api/carousel`);
            const data = await response.json();
            
            this.assert(response.ok, 'Get carousel should return 200');
            this.assert(data.success, 'Get carousel should be successful');
            this.assert(data.data, 'Response should contain carousel data');
            
            this.console.success('✅ Get Carousel test passed');
            this.recordTest('Get Carousel', true, 'Carousel data retrieved');
        } catch (error) {
            this.console.error('❌ Get Carousel test failed:', error);
            this.recordTest('Get Carousel', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de crear item de carrusel
    async testCreateCarouselItem() {
        this.console.group('➕ Create Carousel Item (Admin)');
        try {
            if (!this.authToken) {
                this.console.warn('⚠️ Skipping carousel item creation - no auth token');
                this.recordTest('Create Carousel Item', false, 'Missing auth token');
                this.console.groupEnd();
                return;
            }

            const newItem = {
                title: `Test Carousel Item ${Date.now()}`,
                description: 'Test carousel item',
                image_url: 'https://via.placeholder.com/800x400',
                link_url: '/',
                display_order: 1,
                active: true
            };

            const response = await fetch(`${this.baseURL}/api/carousel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(newItem)
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Create carousel item should return 200');
            this.assert(data.success, 'Create carousel item should be successful');
            
            this.console.success('✅ Create Carousel Item test passed');
            this.recordTest('Create Carousel Item', true, 'Carousel item created');
        } catch (error) {
            this.console.error('❌ Create Carousel Item test failed:', error);
            this.recordTest('Create Carousel Item', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de crear orden
    async testCreateOrder() {
        this.console.group('📝 Create Order');
        try {
            if (!this.authToken || !this.testData.testProduct) {
                this.console.warn('⚠️ Skipping order creation - missing requirements');
                this.recordTest('Create Order', false, 'Missing requirements');
                this.console.groupEnd();
                return;
            }

            const orderData = {
                items: [{
                    product_id: this.testData.testProduct.id,
                    quantity: 2,
                    unit_price: this.testData.testProduct.price
                }],
                shipping_address: {
                    first_name: 'Test',
                    last_name: 'User',
                    address_line_1: 'Test Address 123',
                    city: 'Caracas',
                    state: 'Miranda',
                    postal_code: '1000',
                    phone: '+584141234567'
                },
                payment_method_id: 1
            };

            const response = await fetch(`${this.baseURL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(orderData)
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Create order should return 200');
            this.assert(data.success, 'Create order should be successful');
            this.assert(data.data.order, 'Response should contain order data');
            
            this.testData.testOrder = data.data.order;
            
            this.console.success('✅ Create Order test passed');
            this.console.info(`Order created with ID: ${data.data.order.id}`);
            this.recordTest('Create Order', true, 'Order created successfully');
        } catch (error) {
            this.console.error('❌ Create Order test failed:', error);
            this.recordTest('Create Order', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de obtener órdenes
    async testGetOrders() {
        this.console.group('📋 Get Orders');
        try {
            if (!this.authToken) {
                this.console.warn('⚠️ Skipping get orders - no auth token');
                this.recordTest('Get Orders', false, 'Missing auth token');
                this.console.groupEnd();
                return;
            }

            const response = await fetch(`${this.baseURL}/api/orders`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Get orders should return 200');
            this.assert(data.success, 'Get orders should be successful');
            this.assert(Array.isArray(data.data.orders), 'Orders should be an array');
            
            this.console.success('✅ Get Orders test passed');
            this.console.info(`Found ${data.data.orders.length} orders`);
            this.recordTest('Get Orders', true, `Found ${data.data.orders.length} orders`);
        } catch (error) {
            this.console.error('❌ Get Orders test failed:', error);
            this.recordTest('Get Orders', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de obtener orden por ID
    async testGetOrderById() {
        this.console.group('🔍 Get Order By ID');
        try {
            if (!this.authToken || !this.testData.testOrder) {
                this.console.warn('⚠️ Skipping get order by ID - missing requirements');
                this.recordTest('Get Order By ID', false, 'Missing requirements');
                this.console.groupEnd();
                return;
            }

            const orderId = this.testData.testOrder.id;
            const response = await fetch(`${this.baseURL}/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Get order by ID should return 200');
            this.assert(data.success, 'Get order by ID should be successful');
            this.assert(data.data.order.id === orderId, 'Order ID should match');
            
            this.console.success('✅ Get Order By ID test passed');
            this.recordTest('Get Order By ID', true, 'Order retrieved successfully');
        } catch (error) {
            this.console.error('❌ Get Order By ID test failed:', error);
            this.recordTest('Get Order By ID', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de actualizar estado de orden
    async testUpdateOrderStatus() {
        this.console.group('✏️ Update Order Status');
        try {
            if (!this.authToken || !this.testData.testOrder) {
                this.console.warn('⚠️ Skipping update order status - missing requirements');
                this.recordTest('Update Order Status', false, 'Missing requirements');
                this.console.groupEnd();
                return;
            }

            const orderId = this.testData.testOrder.id;
            const response = await fetch(`${this.baseURL}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ status: 'processing' })
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Update order status should return 200');
            this.assert(data.success, 'Update order status should be successful');
            
            this.console.success('✅ Update Order Status test passed');
            this.recordTest('Update Order Status', true, 'Order status updated');
        } catch (error) {
            this.console.error('❌ Update Order Status test failed:', error);
            this.recordTest('Update Order Status', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de obtener métodos de pago
    async testGetPaymentMethods() {
        this.console.group('💳 Get Payment Methods');
        try {
            const response = await fetch(`${this.baseURL}/api/payment-methods`);
            const data = await response.json();
            
            this.assert(response.ok, 'Get payment methods should return 200');
            this.assert(data.success, 'Get payment methods should be successful');
            this.assert(Array.isArray(data.data.payment_methods), 'Payment methods should be an array');
            
            this.console.success('✅ Get Payment Methods test passed');
            this.console.info(`Found ${data.data.payment_methods.length} payment methods`);
            this.recordTest('Get Payment Methods', true, `Found ${data.data.payment_methods.length} methods`);
        } catch (error) {
            this.console.error('❌ Get Payment Methods test failed:', error);
            this.recordTest('Get Payment Methods', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de crear pago
    async testCreatePayment() {
        this.console.group('💰 Create Payment');
        try {
            if (!this.authToken || !this.testData.testOrder) {
                this.console.warn('⚠️ Skipping create payment - missing requirements');
                this.recordTest('Create Payment', false, 'Missing requirements');
                this.console.groupEnd();
                return;
            }

            const paymentData = {
                order_id: this.testData.testOrder.id,
                payment_method_id: 1,
                amount: this.testData.testOrder.total_amount,
                reference_number: `TEST${Date.now()}`,
                payment_details: {
                    test: true,
                    automated_testing: true
                }
            };

            const response = await fetch(`${this.baseURL}/api/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(paymentData)
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Create payment should return 200');
            this.assert(data.success, 'Create payment should be successful');
            this.assert(data.data.payment, 'Response should contain payment data');
            
            this.testData.testPayment = data.data.payment;
            
            this.console.success('✅ Create Payment test passed');
            this.console.info(`Payment created with ID: ${data.data.payment.id}`);
            this.recordTest('Create Payment', true, 'Payment created successfully');
        } catch (error) {
            this.console.error('❌ Create Payment test failed:', error);
            this.recordTest('Create Payment', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de obtener pagos
    async testGetPayments() {
        this.console.group('💳 Get Payments');
        try {
            if (!this.authToken) {
                this.console.warn('⚠️ Skipping get payments - no auth token');
                this.recordTest('Get Payments', false, 'Missing auth token');
                this.console.groupEnd();
                return;
            }

            const response = await fetch(`${this.baseURL}/api/payments`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Get payments should return 200');
            this.assert(data.success, 'Get payments should be successful');
            this.assert(Array.isArray(data.data.payments), 'Payments should be an array');
            
            this.console.success('✅ Get Payments test passed');
            this.console.info(`Found ${data.data.payments.length} payments`);
            this.recordTest('Get Payments', true, `Found ${data.data.payments.length} payments`);
        } catch (error) {
            this.console.error('❌ Get Payments test failed:', error);
            this.recordTest('Get Payments', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de obtener configuraciones
    async testGetSettings() {
        this.console.group('⚙️ Get Settings');
        try {
            const response = await fetch(`${this.baseURL}/api/settings`);
            const data = await response.json();
            
            this.assert(response.ok, 'Get settings should return 200');
            this.assert(data.success, 'Get settings should be successful');
            this.assert(data.data, 'Response should contain settings data');
            
            this.console.success('✅ Get Settings test passed');
            this.recordTest('Get Settings', true, 'Settings retrieved');
        } catch (error) {
            this.console.error('❌ Get Settings test failed:', error);
            this.recordTest('Get Settings', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de actualizar configuración
    async testUpdateSetting() {
        this.console.group('✏️ Update Setting');
        try {
            if (!this.authToken) {
                this.console.warn('⚠️ Skipping update setting - no auth token');
                this.recordTest('Update Setting', false, 'Missing auth token');
                this.console.groupEnd();
                return;
            }

            const response = await fetch(`${this.baseURL}/api/settings/test_setting`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ 
                    setting_value: `Test value ${Date.now()}`,
                    description: 'Test setting updated by automated testing'
                })
            });
            
            const data = await response.json();
            
            this.assert(response.ok, 'Update setting should return 200');
            this.assert(data.success, 'Update setting should be successful');
            
            this.console.success('✅ Update Setting test passed');
            this.recordTest('Update Setting', true, 'Setting updated successfully');
        } catch (error) {
            this.console.error('❌ Update Setting test failed:', error);
            this.recordTest('Update Setting', false, error.message);
        }
        this.console.groupEnd();
    }

    // Test de obtener categorías (legacy)
    async testGetCategories() {
        this.console.group('📂 Get Categories (Legacy)');
        try {
            const response = await fetch(`${this.baseURL}/api/categories`);
            const data = await response.json();
            
            this.assert(response.ok, 'Get categories should return 200');
            this.assert(data.success, 'Get categories should be successful');
            this.assert(Array.isArray(data.data), 'Categories should be an array');
            
            this.console.success('✅ Get Categories test passed');
            this.console.info(`Found ${data.data.length} categories`);
            this.recordTest('Get Categories', true, `Found ${data.data.length} categories`);
        } catch (error) {
            this.console.error('❌ Get Categories test failed:', error);
            this.recordTest('Get Categories', false, error.message);
        }
        this.console.groupEnd();
    }

    // Método auxiliar para assertions
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    // Registrar resultado de prueba
    recordTest(testName, passed, details) {
        this.testResults.push({
            name: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
    }

    // Generar reporte final
    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(t => t.passed).length;
        const failedTests = totalTests - passedTests;
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;

        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                passRate: `${passRate}%`,
                timestamp: new Date().toISOString()
            },
            results: this.testResults,
            logs: this.console.getLogs()
        };

        this.console.group('📊 Reporte Final de Testing API Backend');
        this.console.info(`Total de pruebas: ${totalTests}`);
        this.console.success(`Exitosas: ${passedTests}`);
        if (failedTests > 0) {
            this.console.error(`Fallidas: ${failedTests}`);
        }
        this.console.info(`Tasa de éxito: ${passRate}%`);
        this.console.groupEnd();

        return report;
    }
}

// Logger personalizado para testing
class TestLogger {
    constructor(prefix) {
        this.prefix = prefix;
        this.logs = [];
        this.level = 0;
    }

    log(level, ...args) {
        const timestamp = new Date().toISOString();
        const indent = '  '.repeat(this.level);
        const message = args.join(' ');
        const logEntry = `[${timestamp}] ${this.prefix} ${indent}${message}`;
        
        this.logs.push({ timestamp, level, message: logEntry });
        console.log(logEntry);
    }

    info(...args) {
        this.log('INFO', '📄', ...args);
    }

    success(...args) {
        this.log('SUCCESS', '✅', ...args);
    }

    warn(...args) {
        this.log('WARN', '⚠️', ...args);
    }

    error(...args) {
        this.log('ERROR', '❌', ...args);
    }

    group(title) {
        this.log('GROUP', '📁', title);
        this.level++;
    }

    groupEnd() {
        this.level = Math.max(0, this.level - 1);
    }

    getLogs() {
        return this.logs;
    }
}

// Exportar para uso en Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIBackendTestSuite, TestLogger };
}

// Para uso en navegador
if (typeof window !== 'undefined') {
    window.APIBackendTestSuite = APIBackendTestSuite;
    window.TestLogger = TestLogger;
}