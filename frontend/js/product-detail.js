/**
 * 🌸 Product Detail Page JavaScript - FloresYa
 * Versión mejorada con logging detallado, tracking de errores y seguimiento de progreso.
 */

class ProductDetail {
    constructor() {
        this.productId = null;
        this.product = null;
        this.currentImageIndex = 0;
        this.images = [];
        this.cart = null;
        this.exchangeRate = 36.5; // Default fallback
        this.logger = window.floresyaLogger || console;
        this.init();
    }

    async init() {
        const initTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.init') : null;
        
        try {
            this.logger.info('PRODUCT-DETAIL', '🚀 Inicializando página de detalle de producto', {
                url: window.location.href,
                timestamp: new Date().toISOString()
            });

            // Get product ID from URL parameters
            this.productId = this.getProductIdFromURL();
            if (!this.productId) {
                this.logger.error('PRODUCT-DETAIL', '❌ ID de producto no válido', {
                    url: window.location.href
                });
                this.showError('ID de producto no válido');
                return;
            }

            this.logger.info('PRODUCT-DETAIL', '🔍 ID de producto extraído', {
                productId: this.productId
            });

            // Initialize cart
            this.logger.info('PRODUCT-DETAIL', '🛒 Inicializando carrito...');
            this.cart = new ShoppingCart();

            // Wait for cart to initialize and get exchange rate
            this.logger.info('PRODUCT-DETAIL', '💱 Obteniendo tasa de cambio...');
            await this.cart.init();
            this.exchangeRate = this.cart.exchangeRateBCV || 36.5;
            this.logger.info('PRODUCT-DETAIL', '💱 Tasa de cambio establecida', {
                rate: this.exchangeRate
            });

            // Load product data
            this.logger.info('PRODUCT-DETAIL', '📦 Cargando datos del producto...');
            await this.loadProduct();
            this.logger.success('PRODUCT-DETAIL', '✅ Producto cargado exitosamente');

            // Update cart display
            this.logger.info('PRODUCT-DETAIL', '🛒 Actualizando conteo del carrito...');
            this.updateCartCount();

            // Listen for cart changes
            this.logger.info('PRODUCT-DETAIL', '👂 Configurando listeners de cambios en el carrito...');
            this.cart.onChange(() => {
                this.logger.info('PRODUCT-DETAIL', '🔄 Carrito modificado - actualizando displays');
                this.updateCartCount();
                this.updateCartDisplay();
            });

            this.logger.success('PRODUCT-DETAIL', '✅ Inicialización completada');

        } catch (error) {
            this.logger.error('PRODUCT-DETAIL', '❌ Error crítico durante la inicialización', {
                error: error.message,
                stack: error.stack,
                productId: this.productId
            });
            this.showError('Error al inicializar la página: ' + error.message);
        } finally {
            if (initTimer) initTimer.end('PRODUCT-DETAIL');
        }
    }

    getProductIdFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            this.logger.info('PRODUCT-DETAIL', '🔗 ID de producto extraído de URL', {
                id: id,
                url: window.location.href
            });
            return id;
        } catch (error) {
            this.logger.error('PRODUCT-DETAIL', '❌ Error al extraer ID de URL', {
                error: error.message,
                url: window.location.href
            });
            return null;
        }
    }

    async loadProduct() {
        const loadTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.loadProduct') : null;
        
        try {
            this.logger.info('PRODUCT-DETAIL', '🔄 Iniciando proceso de carga de producto...', {
                productId: this.productId
            });

            const startTime = performance.now();
            const response = await api.getProduct(this.productId);
            
            this.logger.info('PRODUCT-DETAIL', '📡 Respuesta de API recibida', {
                success: response.success,
                hasData: !!response.data,
                status: response.status,
                duration: performance.now() - startTime
            });

            if (!response.success) {
                throw new Error(response.message || 'Producto no encontrado');
            }

            this.product = response.data;
            this.logger.info('PRODUCT-DETAIL', '📦 Datos del producto recibidos', {
                product: {
                    id: this.product.id,
                    name: this.product.name,
                    price: this.product.price,
                    stock_quantity: this.product.stock_quantity
                }
            });

            // Setup images
            this.logger.info('PRODUCT-DETAIL', '🖼️ Configurando imágenes del producto...');
            this.setupImages();

            // Render product
            this.logger.info('PRODUCT-DETAIL', '🎨 Renderizando producto en página...');
            this.renderProduct();

            const loadTime = performance.now() - startTime;
            this.logger.success('PRODUCT-DETAIL', '✅ Carga de producto completada', {
                duration: loadTime.toFixed(2) + 'ms'
            });

        } catch (error) {
            const loadTime = performance.now() - startTime;
            this.logger.error('PRODUCT-DETAIL', '❌ Fallo en carga de producto', {
                error: error.message,
                stack: error.stack,
                productId: this.productId,
                duration: loadTime.toFixed(2) + 'ms'
            });
            this.showError('Error al cargar el producto: ' + error.message);
        } finally {
            if (loadTimer) loadTimer.end('PRODUCT-DETAIL');
        }
    }

    setupImages() {
        const imageTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.setupImages') : null;
        
        try {
            this.logger.info('IMAGES', '🖼️ Iniciando configuración de imágenes...', {
                hasPrimaryImage: !!this.product.primary_image,
                hasImages: !!this.product.images,
                imagesCount: this.product.images ? this.product.images.length : 0
            });

            this.images = [];

            // Procesar imágenes de Supabase (igual que main.js)
            if (this.product.images && Array.isArray(this.product.images) && this.product.images.length > 0) {
                const sortedImages = this.product.images
                    .sort((a, b) => a.display_order - b.display_order)
                    .map(img => img.url_large)
                    .filter(url => url && url !== '');
                this.images = sortedImages;
                this.logger.info('IMAGES', '✅ Procesadas imágenes de Supabase', { 
                    count: sortedImages.length 
                });
            } else {
                this.logger.warn('IMAGES', '⚠️ No se encontraron imágenes en product.images');
            }

            // Fallback image if no images available
            if (this.images.length === 0) {
                this.images.push('/images/placeholder-product-2.webp');
                this.logger.warn('IMAGES', '⚠️ No se encontraron imágenes, usando placeholder');
            }

            this.logger.success('IMAGES', '✅ Configuración de imágenes completada', {
                totalImages: this.images.length,
                images: this.images
            });

        } catch (error) {
            this.logger.error('IMAGES', '❌ Error en setupImages', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            if (imageTimer) imageTimer.end('IMAGES');
        }
    }

    renderProduct() {
        const renderTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.renderProduct') : null;
        
        try {
            this.logger.info('RENDER', '🔄 Iniciando renderizado del producto...');

            // Hide loading and show content
            const spinner = document.getElementById('loading-spinner');
            const content = document.getElementById('product-content');
            const description = document.getElementById('product-description-section');

            this.logger.info('RENDER', '🔍 Elementos encontrados', {
                spinner: !!spinner,
                content: !!content,
                description: !!description
            });

            if (spinner) {
                spinner.style.display = 'none';
                this.logger.info('RENDER', '✅ Spinner de carga ocultado');
            }

            if (content) {
                content.style.display = 'block';
                this.logger.info('RENDER', '✅ Contenido del producto mostrado');

                // Show product navigation menu
                const productNavMenu = document.getElementById('product-nav-menu');
                if (productNavMenu) {
                    productNavMenu.classList.remove('d-none');
                    this.logger.info('RENDER', '✅ Menú de navegación de producto mostrado');
                }
            } else {
                this.logger.error('RENDER', '❌ Elemento de contenido del producto no encontrado');
            }

            if (description) {
                description.style.display = 'block';
                this.logger.info('RENDER', '✅ Descripción del producto mostrada');
            }

            // Set page title
            document.title = `${this.product.name} - FloresYa`;
            document.getElementById('page-title').textContent = `${this.product.name} - FloresYa`;
            this.logger.info('RENDER', '✅ Título de página actualizado', {
                title: document.title
            });

            // Render images
            this.logger.info('RENDER', '🖼️ Renderizando imágenes...');
            this.renderImages();

            // Render product info
            this.logger.info('RENDER', '📋 Renderizando información del producto...');
            this.renderProductInfo();

            // Render description
            this.logger.info('RENDER', '📝 Renderizando descripción...');
            this.renderDescription();

            // Update breadcrumb
            this.logger.info('RENDER', '🍞 Actualizando breadcrumb...');
            this.updateBreadcrumb();

            this.logger.success('RENDER', '✅ Renderizado del producto completado');

        } catch (error) {
            this.logger.error('RENDER', '❌ Error en renderProduct', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            if (renderTimer) renderTimer.end('RENDER');
        }
    }

    renderImages() {
        const imageRenderTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.renderImages') : null;
        
        try {
            this.logger.info('RENDER-IMAGES', '🖼️ Iniciando renderizado de imágenes...', {
                totalImages: this.images.length,
                currentIndex: this.currentImageIndex
            });

            const mainImage = document.getElementById('main-image');
            if (!mainImage) {
                this.logger.error('RENDER-IMAGES', '❌ Elemento de imagen principal no encontrado');
                return;
            }

            const currentImageUrl = this.images[this.currentImageIndex] || '/images/placeholder-product-2.webp';
            this.logger.info('RENDER-IMAGES', '🔄 Procesando imagen actual', {
                index: this.currentImageIndex,
                url: currentImageUrl,
                isPlaceholder: currentImageUrl.includes('placeholder'),
                isSupabase: currentImageUrl.includes('supabase')
            });

            let displayUrl = currentImageUrl;
            if (!currentImageUrl.includes('placeholder') && currentImageUrl.includes('supabase') && 
                window.responsiveImage && typeof window.responsiveImage.getResponsiveUrls === 'function') {
                this.logger.info('RENDER-IMAGES', '🔄 Usando sistema de imágenes responsivas...');
                try {
                    const responsiveUrls = window.responsiveImage.getResponsiveUrls(currentImageUrl);
                    displayUrl = responsiveUrls.large || responsiveUrls.medium || currentImageUrl;
                    this.logger.info('RENDER-IMAGES', '✅ URLs responsivas generadas', {
                        large: responsiveUrls.large,
                        medium: responsiveUrls.medium
                    });
                } catch (e) {
                    this.logger.warn('RENDER-IMAGES', '⚠️ Error con sistema de imágenes responsivas', {
                        error: e.message
                    });
                }
            } else {
                this.logger.info('RENDER-IMAGES', 'ℹ️ Usando URL directa (sin procesamiento responsivo)');
            }

            this.logger.info('RENDER-IMAGES', '🔧 Estableciendo src de imagen principal', {
                original: currentImageUrl,
                display: displayUrl
            });

            mainImage.src = displayUrl;
            mainImage.alt = this.product.name;
            mainImage.loading = 'eager';

            // Add load/error event listeners
            mainImage.onload = () => {
                this.logger.success('RENDER-IMAGES', '🎉 Imagen principal cargada exitosamente', {
                    naturalWidth: mainImage.naturalWidth,
                    naturalHeight: mainImage.naturalHeight,
                    aspectRatio: (mainImage.naturalWidth / mainImage.naturalHeight).toFixed(2)
                });

                // Check if image is visible
                const rect = mainImage.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(mainImage);
                this.logger.info('RENDER-IMAGES', '👁️ Verificación de visibilidad ANTES de corrección', {
                    width: rect.width,
                    height: rect.height,
                    visible: rect.width > 0 && rect.height > 0,
                    opacity: computedStyle.opacity,
                    display: computedStyle.display,
                    visibility: computedStyle.visibility
                });

                // FORCE visibility
                this.logger.info('RENDER-IMAGES', '🔧 Forzando visibilidad de imagen...');
                mainImage.style.visibility = 'visible';
                mainImage.style.opacity = '1';

                // Additional visibility checks
                setTimeout(() => {
                    const newRect = mainImage.getBoundingClientRect();
                    const newStyle = window.getComputedStyle(mainImage);
                    this.logger.info('RENDER-IMAGES', '🔍 Verificación de visibilidad DESPUÉS de corrección', {
                        width: newRect.width,
                        height: newRect.height,
                        visible: newRect.width > 0 && newRect.height > 0,
                        opacity: newStyle.opacity,
                        display: newStyle.display,
                        visibility: newStyle.visibility
                    });
                }, 100);

                this.logger.info('RENDER-IMAGES', '✅ Visibilidad de imagen forzada a visible');
            };

            mainImage.onerror = (error) => {
                this.logger.error('RENDER-IMAGES', '❌ Fallo al cargar imagen principal', {
                    url: displayUrl,
                    originalUrl: currentImageUrl,
                    error: error.message
                });
            };

            // Set modal image
            document.getElementById('modal-image-title').textContent = this.product.name;

            // Render thumbnails
            this.logger.info('RENDER-IMAGES', '🖼️ Renderizando miniaturas...');
            const thumbnailsContainer = document.getElementById('thumbnails');
            thumbnailsContainer.innerHTML = '';

            this.images.forEach((imageUrl, index) => {
                const thumbnail = document.createElement('img');
                let thumbUrl = imageUrl;
                
                if (!imageUrl.includes('-thumb.webp') && !imageUrl.includes('/thumb/') &&
                    window.responsiveImage && typeof window.responsiveImage.getResponsiveUrls === 'function') {
                    try {
                        const responsiveUrls = window.responsiveImage.getResponsiveUrls(imageUrl);
                        thumbUrl = responsiveUrls.thumb;
                    } catch (e) {
                        this.logger.warn('RENDER-IMAGES', '⚠️ Error al obtener miniatura responsiva', {
                            error: e.message
                        });
                    }
                }

                thumbnail.src = thumbUrl;
                thumbnail.alt = `${this.product.name} - Imagen ${index + 1}`;
                thumbnail.className = `thumbnail ${index === this.currentImageIndex ? 'active' : ''}`;
                thumbnail.onclick = () => this.selectImage(index);
                thumbnail.loading = 'lazy';

                // Add debugging for thumbnails
                thumbnail.onload = () => {
                    this.logger.success('RENDER-IMAGES', `✅ Miniatura ${index + 1} cargada`, {
                        url: thumbUrl
                    });
                    // Force thumbnail visibility
                    thumbnail.style.visibility = 'visible';
                    thumbnail.style.opacity = '1';
                    this.logger.info('RENDER-IMAGES', `🔧 Visibilidad forzada para miniatura ${index + 1}`);
                };

                thumbnail.onerror = (error) => {
                    this.logger.error('RENDER-IMAGES', `❌ Miniatura ${index + 1} falló`, {
                        url: thumbUrl,
                        error: error.message
                    });
                };

                thumbnailsContainer.appendChild(thumbnail);
            });

            this.logger.success('RENDER-IMAGES', '✅ Renderizado de imágenes completado');

        } catch (error) {
            this.logger.error('RENDER-IMAGES', '❌ Error en renderImages', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            if (imageRenderTimer) imageRenderTimer.end('RENDER-IMAGES');
        }
    }

    renderProductInfo() {
        const infoTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.renderProductInfo') : null;
        
        try {
            this.logger.info('RENDER-INFO', '📋 Iniciando renderProductInfo...');

            // Product title
            document.getElementById('product-title').textContent = this.product.name;
            this.logger.info('RENDER-INFO', '✅ Título del producto actualizado', {
                title: this.product.name
            });

            // Product summary
            const summary = this.product.description 
                ? this.product.description.substring(0, 200) + '...'
                : `Hermoso arreglo floral ${this.product.name}`;
            document.getElementById('product-summary').textContent = summary;
            this.logger.info('RENDER-INFO', '✅ Resumen del producto actualizado');

            // Prices
            const priceUSD = parseFloat(this.product.price);
            const priceVES = priceUSD * this.exchangeRate;
            document.getElementById('price-usd').textContent = `$${priceUSD.toFixed(2)}`;
            document.getElementById('price-ves').textContent = `Bs. ${priceVES.toLocaleString('es-VE', {minimumFractionDigits: 2})}`;
            this.logger.info('RENDER-INFO', '✅ Precios actualizados', {
                usd: priceUSD.toFixed(2),
                ves: priceVES.toLocaleString('es-VE', {minimumFractionDigits: 2})
            });

            // Stock status
            const stockQuantity = parseInt(this.product.stock_quantity) || 0;
            const stockAvailable = document.getElementById('stock-available');
            const stockUnavailable = document.getElementById('stock-unavailable');
            const quantityInput = document.getElementById('quantity');
            const addToCartBtn = document.getElementById('add-to-cart-btn');
            const buyNowBtn = document.getElementById('floresya-btn');

            if (stockQuantity > 0) {
                stockAvailable.style.display = 'block';
                stockUnavailable.style.display = 'none';
                document.getElementById('stock-quantity').textContent = stockQuantity;
                quantityInput.max = stockQuantity;
                quantityInput.disabled = false;
                addToCartBtn.disabled = false;
                buyNowBtn.disabled = false;
                this.logger.info('RENDER-INFO', '✅ Producto en stock', {
                    quantity: stockQuantity
                });
            } else {
                stockAvailable.style.display = 'none';
                stockUnavailable.style.display = 'block';
                quantityInput.disabled = true;
                addToCartBtn.disabled = true;
                buyNowBtn.disabled = true;
                addToCartBtn.innerHTML = '<i class="bi bi-x-circle me-2"></i>Agotado';
                buyNowBtn.innerHTML = '<i class="bi bi-x-circle me-2"></i>FloresYa - No Disponible';
                this.logger.warn('RENDER-INFO', '⚠️ Producto agotado');
            }

            // Update additional information in tabs
            this.logger.info('RENDER-INFO', '📝 Actualizando pestañas de información...');
            this.updateProductTabs();

            this.logger.success('RENDER-INFO', '✅ Información del producto renderizada');

        } catch (error) {
            this.logger.error('RENDER-INFO', '❌ Error en renderProductInfo', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            if (infoTimer) infoTimer.end('RENDER-INFO');
        }
    }

    renderDescription() {
        const descTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.renderDescription') : null;
        
        try {
            this.logger.info('RENDER-DESC', '📝 Renderizando descripción...');

            const descriptionContainer = document.getElementById('product-description');
            let description = this.product.description || 'No hay descripción disponible para este producto.';
            description = description.replace(/\n/g, '<br>');
            descriptionContainer.innerHTML = description;

            this.logger.success('RENDER-DESC', '✅ Descripción renderizada');

        } catch (error) {
            this.logger.error('RENDER-DESC', '❌ Error en renderDescription', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            if (descTimer) descTimer.end('RENDER-DESC');
        }
    }

    updateProductTabs() {
        const tabsTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.updateProductTabs') : null;
        
        try {
            this.logger.info('UPDATE-TABS', '📝 Actualizando pestañas con información adicional...');

            // Update category information
            const categoryElement = document.getElementById('product-category');
            if (this.product.category_name) {
                categoryElement.textContent = this.product.category_name;
                this.logger.info('UPDATE-TABS', '✅ Categoría actualizada', {
                    category: this.product.category_name
                });
            } else {
                categoryElement.textContent = 'Categoría general';
                this.logger.info('UPDATE-TABS', 'ℹ️ Categoría no especificada, usando valor por defecto');
            }

            // Update occasion information
            const occasionElement = document.getElementById('product-occasion');
            const occasionMap = {
                'valentine': 'San Valentín',
                'mother': 'Día de la Madre', 
                'father': 'Día del Padre',
                'birthday': 'Cumpleaños',
                'anniversary': 'Aniversario',
                'graduation': 'Graduación',
                'wedding': 'Bodas',
                'newbaby': 'Nuevo Bebé',
                'recovery': 'Recuperación',
                'condolences': 'Condolencias',
                'thankyou': 'Agradecimiento',
                'homedecor': 'Decoración Hogar',
                'corporate': 'Corporativo',
                'other': 'Ocasión especial'
            };
            const occasionText = occasionMap[this.product.occasion] || 'Cualquier ocasión';
            occasionElement.textContent = occasionText;
            this.logger.info('UPDATE-TABS', '✅ Ocasión actualizada', {
                occasion: occasionText
            });

            // Update stock info
            const stockInfoElement = document.getElementById('stock-info');
            const stockQuantity = parseInt(this.product.stock_quantity) || 0;
            if (stockQuantity > 0) {
                stockInfoElement.innerHTML = `<span class="text-success">${stockQuantity} unidades</span>`;
                this.logger.info('UPDATE-TABS', '✅ Stock actualizado', {
                    quantity: stockQuantity
                });
            } else {
                stockInfoElement.innerHTML = `<span class="text-danger">Agotado</span>`;
                this.logger.warn('UPDATE-TABS', '⚠️ Stock agotado');
            }

            // Update product SKU
            const skuElement = document.getElementById('product-sku');
            skuElement.textContent = `FLORE-${this.product.id.toString().padStart(4, '0')}`;
            this.logger.info('UPDATE-TABS', '✅ SKU actualizado', {
                sku: skuElement.textContent
            });

            // Update specifications based on category
            const specTypeElement = document.getElementById('spec-type');
            if (this.product.category_name) {
                specTypeElement.textContent = `${this.product.category_name} profesional`;
                this.logger.info('UPDATE-TABS', '✅ Especificación actualizada', {
                    spec: specTypeElement.textContent
                });
            }

            // Load related products
            this.logger.info('UPDATE-TABS', '🔍 Cargando productos relacionados...');
            this.loadRelatedProducts();

            this.logger.success('UPDATE-TABS', '✅ Pestañas actualizadas');

        } catch (error) {
            this.logger.error('UPDATE-TABS', '❌ Error en updateProductTabs', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            if (tabsTimer) tabsTimer.end('UPDATE-TABS');
        }
    }

    async loadRelatedProducts() {
        const relatedTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.loadRelatedProducts') : null;
        
        try {
            this.logger.info('RELATED', '🔍 Cargando productos relacionados...');

            const filters = {};
            if (this.product.category_id) {
                filters.category_id = this.product.category_id;
                this.logger.info('RELATED', '✅ Filtrando por categoría', {
                    categoryId: this.product.category_id
                });
            } else if (this.product.occasion) {
                filters.occasion = this.product.occasion;
                this.logger.info('RELATED', '✅ Filtrando por ocasión', {
                    occasion: this.product.occasion
                });
            }

            const response = await fetch(`/api/products?limit=4&${new URLSearchParams(filters)}`);
            const data = await response.json();

            if (data.success && data.data.products) {
                const relatedProducts = data.data.products
                    .filter(p => p.id !== this.product.id)
                    .slice(0, 3);
                this.logger.info('RELATED', '✅ Productos relacionados filtrados', {
                    total: data.data.products.length,
                    filtered: relatedProducts.length
                });
                this.renderRelatedProducts(relatedProducts);
            } else {
                this.logger.warn('RELATED', '⚠️ No se encontraron productos relacionados');
                this.renderRelatedProducts([]);
            }

        } catch (error) {
            this.logger.error('RELATED', '❌ Error al cargar productos relacionados', {
                error: error.message,
                stack: error.stack
            });
            document.getElementById('related-products').innerHTML = `
                <div class="col-12 text-center py-4">
                    <p class="text-muted">No se pudieron cargar productos relacionados</p>
                </div>
            `;
        } finally {
            if (relatedTimer) relatedTimer.end('RELATED');
        }
    }

    renderRelatedProducts(products) {
        const relatedRenderTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.renderRelatedProducts') : null;
        
        try {
            // Manejar casos null/undefined
            if (!products || !Array.isArray(products)) {
                products = [];
            }
            
            this.logger.info('RENDER-RELATED', '🖼️ Renderizando productos relacionados...', {
                count: products.length
            });

            const container = document.getElementById('related-products');
            if (products.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <p class="text-muted">No hay productos relacionados disponibles</p>
                    </div>
                `;
                this.logger.info('RENDER-RELATED', 'ℹ️ No hay productos relacionados para mostrar');
                return;
            }

            const productsHTML = products.map(product => {
                // Procesar imágenes igual que main.js
                let productImages = [];
                let primaryImage = '/images/placeholder-product-2.webp';

                // Intentar obtener imagen desde image_url primero (fallback)
                if (product.image_url && product.image_url.includes('http')) {
                    primaryImage = product.image_url;
                    productImages = [product.image_url];
                } 
                // Luego intentar desde primary_image (otro fallback)
                else if (product.primary_image && product.primary_image.includes('http')) {
                    primaryImage = product.primary_image;
                    productImages = [product.primary_image];
                }
                // Finalmente usar el array de images si existe
                else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                    productImages = product.images
                        .sort((a, b) => a.display_order - b.display_order)
                        .map(img => img.url_large)
                        .filter(url => url && url !== '');
                    primaryImage = productImages.length > 0 ? productImages[0] : '/images/placeholder-product-2.webp';
                } else {
                    productImages = ['/images/placeholder-product-2.webp'];
                }
                
                const dataImages = JSON.stringify(productImages);
                
                return `
                    <div class="col-md-4 mb-3">
                        <div class="card h-100">
                            <img src="${primaryImage}" 
                                 class="card-img-top product-image" 
                                 alt="${product.name}"
                                 data-product-id="${product.id}"
                                 data-images='${dataImages}'
                                 style="height: 200px; object-fit: cover;">
                            <div class="card-body d-flex flex-column">
                                <h6 class="card-title">${product.name}</h6>
                                <p class="card-text text-muted small">${product.description?.substring(0, 80) || ''}...</p>
                                <div class="mt-auto">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <strong class="text-primary">$${parseFloat(product.price).toFixed(2)}</strong>
                                        <a href="/pages/product-detail.html?id=${product.id}" 
                                           class="btn btn-sm btn-outline-primary">Ver</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = productsHTML;
            this.logger.success('RENDER-RELATED', '✅ Productos relacionados renderizados', {
                count: products.length
            });

        } catch (error) {
            this.logger.error('RENDER-RELATED', '❌ Error en renderRelatedProducts', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            if (relatedRenderTimer) relatedRenderTimer.end('RENDER-RELATED');
        }
    }

    updateBreadcrumb() {
        const breadcrumbTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.updateBreadcrumb') : null;
        
        try {
            this.logger.info('BREADCRUMB', '🍞 Actualizando breadcrumb...');

            if (this.product.category_name) {
                document.getElementById('category-breadcrumb').textContent = this.product.category_name;
                this.logger.info('BREADCRUMB', '✅ Categoría en breadcrumb actualizada', {
                    category: this.product.category_name
                });
            }

            document.getElementById('product-breadcrumb').textContent = this.product.name;
            this.logger.info('BREADCRUMB', '✅ Producto en breadcrumb actualizado', {
                product: this.product.name
            });

            this.logger.success('BREADCRUMB', '✅ Breadcrumb actualizado');

        } catch (error) {
            this.logger.error('BREADCRUMB', '❌ Error en updateBreadcrumb', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            if (breadcrumbTimer) breadcrumbTimer.end('BREADCRUMB');
        }
    }

    selectImage(index) {
        const selectTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.selectImage') : null;
        
        try {
            this.logger.info('IMAGE-SELECT', '🖼️ Seleccionando imagen', {
                index: index,
                total: this.images.length
            });

            if (index >= 0 && index < this.images.length) {
                this.currentImageIndex = index;
                this.logger.info('IMAGE-SELECT', '✅ Índice de imagen actualizado', {
                    newIndex: this.currentImageIndex
                });
                this.renderImages();
            } else {
                this.logger.warn('IMAGE-SELECT', '⚠️ Índice de imagen fuera de rango', {
                    index: index,
                    total: this.images.length
                });
            }

        } catch (error) {
            this.logger.error('IMAGE-SELECT', '❌ Error en selectImage', {
                error: error.message,
                stack: error.stack,
                index: index
            });
        } finally {
            if (selectTimer) selectTimer.end('IMAGE-SELECT');
        }
    }

    showError(message) {
        const errorTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.showError') : null;
        
        try {
            this.logger.error('ERROR-HANDLER', '❌ Mostrando error al usuario', {
                message: message
            });

            document.getElementById('loading-spinner').innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> ${message}
                    <div class="mt-3">
                        <button class="btn btn-primary" onclick="goBack()">
                            <i class="bi bi-arrow-left me-1"></i>Volver
                        </button>
                    </div>
                </div>
            `;

        } catch (error) {
            this.logger.error('ERROR-HANDLER', '❌ Error en showError', {
                error: error.message,
                stack: error.stack,
                originalMessage: message
            });
        } finally {
            if (errorTimer) errorTimer.end('ERROR-HANDLER');
        }
    }

    updateCartCount() {
        const cartTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.updateCartCount') : null;
        
        try {
            this.logger.info('CART', '🛒 Actualizando conteo del carrito...');

            const cartCount = this.cart.getItemCount();
            const cartBadge = document.getElementById('cart-count');

            if (cartCount > 0) {
                cartBadge.textContent = cartCount;
                cartBadge.style.display = 'block';
                this.logger.info('CART', '✅ Conteo del carrito actualizado', {
                    count: cartCount
                });
            } else {
                cartBadge.style.display = 'none';
                this.logger.info('CART', 'ℹ️ Carrito vacío, ocultando badge');
            }

        } catch (error) {
            this.logger.error('CART', '❌ Error en updateCartCount', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            if (cartTimer) cartTimer.end('CART');
        }
    }

    updateCartDisplay() {
        const cartDisplayTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.updateCartDisplay') : null;
        
        try {
            this.logger.info('CART-DISPLAY', '🛒 Actualizando display del carrito...');

            const cartItems = document.getElementById('cart-items');
            const cartTotal = document.getElementById('cart-total');

            if (this.cart.items.length === 0) {
                cartItems.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-bag display-4 d-block mb-2"></i>
                        <p>Tu carrito está vacío</p>
                    </div>
                `;
                cartTotal.textContent = '$0.00';
                this.logger.info('CART-DISPLAY', 'ℹ️ Carrito vacío, mostrando mensaje');
                return;
            }

            cartItems.innerHTML = this.cart.items.map(item => `
                <div class="cart-item d-flex align-items-center mb-3 pb-3 border-bottom">
                    <img src="${item.image || '/images/placeholder-product-2.webp'}" 
                         alt="${item.name}" 
                         class="cart-item-image me-3"
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${item.name}</h6>
                        <small class="text-muted">$${item.price} × ${item.quantity}</small>
                    </div>
                    <div class="text-end">
                        <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
                        <button class="btn btn-sm btn-outline-danger ms-2" 
                                onclick="productDetail.removeFromCart(${item.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            const total = this.cart.getTotal();
            cartTotal.textContent = `$${total.toFixed(2)}`;
            this.logger.info('CART-DISPLAY', '✅ Display del carrito actualizado', {
                items: this.cart.items.length,
                total: total.toFixed(2)
            });

        } catch (error) {
            this.logger.error('CART-DISPLAY', '❌ Error en updateCartDisplay', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            if (cartDisplayTimer) cartDisplayTimer.end('CART-DISPLAY');
        }
    }

    removeFromCart(productId) {
        const removeTimer = this.logger.startTimer ? this.logger.startTimer('ProductDetail.removeFromCart') : null;
        
        try {
            this.logger.info('CART-REMOVE', '🗑️ Eliminando producto del carrito', {
                productId: productId
            });

            this.cart.removeItem(productId);
            this.logger.success('CART-REMOVE', '✅ Producto eliminado del carrito', {
                productId: productId
            });

        } catch (error) {
            this.logger.error('CART-REMOVE', '❌ Error en removeFromCart', {
                error: error.message,
                stack: error.stack,
                productId: productId
            });
        } finally {
            if (removeTimer) removeTimer.end('CART-REMOVE');
        }
    }
}

// Global functions
function goBack() {
    const backTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.goBack') : null;
    
    try {
        window.floresyaLogger?.info('NAVIGATION', '🔙 Navegando hacia atrás...');
        
        if (document.referrer && document.referrer.includes(window.location.host)) {
            window.floresyaLogger?.info('NAVIGATION', '✅ Volviendo a página anterior');
            window.history.back();
        } else {
            window.floresyaLogger?.info('NAVIGATION', '✅ Redirigiendo a página principal');
            window.location.href = '/';
        }
    } catch (error) {
        window.floresyaLogger?.error('NAVIGATION', '❌ Error en goBack', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        if (backTimer) backTimer.end('NAVIGATION');
    }
}

function changeQuantity(delta) {
    const quantityTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.changeQuantity') : null;
    
    try {
        const quantityInput = document.getElementById('quantity');
        const currentValue = parseInt(quantityInput.value) || 1;
        const newValue = currentValue + delta;
        const maxValue = parseInt(quantityInput.max) || 99;
        const minValue = parseInt(quantityInput.min) || 1;

        window.floresyaLogger?.info('QUANTITY', '🔢 Cambiando cantidad', {
            current: currentValue,
            delta: delta,
            newValue: newValue,
            min: minValue,
            max: maxValue
        });

        if (newValue >= minValue && newValue <= maxValue) {
            quantityInput.value = newValue;
            window.floresyaLogger?.info('QUANTITY', '✅ Cantidad actualizada', {
                value: newValue
            });
        } else {
            window.floresyaLogger?.warn('QUANTITY', '⚠️ Valor fuera de rango', {
                newValue: newValue,
                min: minValue,
                max: maxValue
            });
        }
    } catch (error) {
        window.floresyaLogger?.error('QUANTITY', '❌ Error en changeQuantity', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        if (quantityTimer) quantityTimer.end('QUANTITY');
    }
}

function addToCart() {
    const cartTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.addToCart') : null;
    
    try {
        window.floresyaLogger?.info('CART', '🛒 Iniciando proceso de agregar al carrito...');

        const quantityInput = document.getElementById('quantity');
        const quantity = parseInt(quantityInput.value) || 1;
        window.floresyaLogger?.info('CART', '📊 Cantidad seleccionada', {
            quantity: quantity
        });

        if (!productDetail || !productDetail.product) {
            window.floresyaLogger?.error('CART', '❌ Datos del producto no disponibles');
            return;
        }

        window.floresyaLogger?.info('CART', '📦 Detalles del producto', {
            id: productDetail.product.id,
            name: productDetail.product.name,
            price: productDetail.product.price,
            stock: productDetail.product.stock_quantity
        });

        // Check stock availability
        const stockQuantity = parseInt(productDetail.product.stock_quantity) || 0;
        if (stockQuantity < quantity) {
            window.floresyaLogger?.warn('CART', '⚠️ Stock insuficiente', {
                requested: quantity,
                available: stockQuantity
            });
            return;
        }

        const cartItem = {
            id: productDetail.product.id,
            name: productDetail.product.name,
            price: parseFloat(productDetail.product.price),
            image: productDetail.images[0],
            quantity: quantity
        };

        window.floresyaLogger?.info('CART', '🔄 Agregando item al carrito', cartItem);
        productDetail.cart.addItem(cartItem);
        window.floresyaLogger?.success('CART', '✅ Item agregado al carrito exitosamente');

        // Show success feedback
        const btn = document.getElementById('add-to-cart-btn');
        const originalText = btn.innerHTML;
        window.floresyaLogger?.info('CART', '🎨 Actualizando UI de feedback...');

        btn.innerHTML = '<i class="bi bi-check2 me-2"></i>¡Agregado!';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');

        setTimeout(() => {
            window.floresyaLogger?.info('CART', '🔄 Restableciendo UI del botón');
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-primary');
        }, 2000);

        window.floresyaLogger?.success('CART', '🎉 Proceso de agregar al carrito completado');

    } catch (error) {
        window.floresyaLogger?.error('CART', '❌ Error en addToCart', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        if (cartTimer) cartTimer.end('CART');
    }
}

function buyNow() {
    const buyTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.buyNow') : null;
    
    try {
        window.floresyaLogger?.info('PURCHASE', '🚀 Iniciando compra directa...');
        addToCart();
        setTimeout(() => {
            window.floresyaLogger?.info('PURCHASE', '📄 Redirigiendo a página de pago...');
            window.location.href = '/pages/payment.html';
        }, 500);
    } catch (error) {
        window.floresyaLogger?.error('PURCHASE', '❌ Error en buyNow', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        if (buyTimer) buyTimer.end('PURCHASE');
    }
}

// FloresYa rapid purchase function
function floresYaBuyNow() {
    const floresyaTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.floresYaBuyNow') : null;
    
    try {
        window.floresyaLogger?.info('FLORESYA', '⚡ Iniciando compra express FloresYa...');

        if (!productDetail || !productDetail.product) {
            window.floresyaLogger?.error('FLORESYA', '❌ Datos del producto no disponibles');
            api.showNotification('Error: Producto no cargado', 'danger');
            return;
        }

        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        window.floresyaLogger?.info('FLORESYA', '📊 Cantidad de compra', {
            quantity: quantity
        });

        window.floresyaLogger?.info('FLORESYA', '📦 Producto', {
            id: productDetail.product.id,
            name: productDetail.product.name,
            price: productDetail.product.price,
            stock: productDetail.product.stock_quantity
        });

        // Check stock
        if (productDetail.product.stock_quantity < quantity) {
            window.floresyaLogger?.warn('FLORESYA', '⚠️ Stock insuficiente para compra express', {
                requested: quantity,
                available: productDetail.product.stock_quantity
            });
            api.showNotification('Stock insuficiente', 'warning');
            return;
        }

        // Show loading state
        window.floresyaLogger?.info('FLORESYA', '🎨 Actualizando botón a estado de carga...');
        const button = document.getElementById('floresya-btn');
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Procesando...';

        try {
            // Check if user is logged in
            window.floresyaLogger?.info('FLORESYA', '👤 Verificando estado de autenticación...');
            const user = api.getUser();
            window.floresyaLogger?.info('FLORESYA', '🔍 Estado de usuario', {
                authenticated: !!user
            });

            if (!user) {
                window.floresyaLogger?.info('FLORESYA', '🎭 Mostrando modal de compra para invitados...');
                showFloresYaGuestModal(productDetail.product, quantity);
            } else {
                window.floresyaLogger?.info('FLORESYA', '✅ Usuario autenticado - procesando compra directa');
                const cartItem = {
                    id: productDetail.product.id,
                    name: productDetail.product.name,
                    price: parseFloat(productDetail.product.price),
                    image: productDetail.images[0],
                    quantity: quantity
                };
                window.floresyaLogger?.info('FLORESYA', '🛒 Agregando item al carrito para usuario autenticado', cartItem);
                productDetail.cart.addItem(cartItem);
                window.floresyaLogger?.info('FLORESYA', '✨ Mostrando animación FloresYa...');
                showFloresYaAnimation();
                setTimeout(() => {
                    window.floresyaLogger?.info('FLORESYA', '📄 Redirigiendo a página de pago...');
                    window.location.href = '/pages/payment.html?floresya=true';
                }, 1500);
            }
        } catch (error) {
            window.floresyaLogger?.error('FLORESYA', '❌ Error en proceso de compra FloresYa', {
                error: error.message,
                stack: error.stack,
                productId: productDetail.product.id,
                quantity: quantity
            });
            api.showNotification('Error al procesar la compra', 'danger');
        } finally {
            window.floresyaLogger?.info('FLORESYA', '⏱️ Configurando temporizador de restablecimiento de botón...');
            setTimeout(() => {
                if (button) {
                    window.floresyaLogger?.info('FLORESYA', '🔄 Restableciendo botón a estado original');
                    button.disabled = false;
                    button.innerHTML = originalText;
                }
            }, 2000);
        }

        window.floresyaLogger?.success('FLORESYA', '🏁 Proceso de compra FloresYa iniciado exitosamente');

    } catch (error) {
        window.floresyaLogger?.error('FLORESYA', '❌ Error crítico en floresYaBuyNow', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        if (floresyaTimer) floresyaTimer.end('FLORESYA');
    }
}

function showFloresYaGuestModal(product, quantity) {
    const modalTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.showFloresYaGuestModal') : null;
    
    try {
        window.floresyaLogger?.info('MODAL', '🎭 Mostrando modal de compra express para invitados...', {
            productId: product.id,
            quantity: quantity
        });

        const modalHTML = `
            <div class="modal fade" id="floresyaGuestModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-gradient-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-cart-check"></i> FloresYa Express
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <img src="${product.primary_image || product.image_url}" alt="${product.name}" 
                                     class="img-fluid rounded" style="max-height: 180px; object-fit: cover;">
                                <h6 class="mt-3">${product.name}</h6>
                                <p class="text-primary-custom fw-bold">
                                    ${api.formatCurrency(product.price * quantity)} 
                                    <small class="text-muted">(${quantity} unidad${quantity > 1 ? 'es' : ''})</small>
                                </p>
                            </div>
                            <div class="alert alert-info">
                                <i class="bi bi-rocket-takeoff"></i>
                                <strong>Compra express</strong><br>
                                Solo llena los datos básicos para proceder.
                            </div>
                            <form id="floresyaGuestForm">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Nombre completo *</label>
                                        <input type="text" class="form-control" id="guestNameDetail" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Teléfono *</label>
                                        <input type="tel" class="form-control" id="guestPhoneDetail" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="guestEmailDetail" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Dirección de entrega *</label>
                                    <textarea class="form-control" id="guestAddressDetail" rows="2" 
                                             placeholder="Dirección completa con referencias" required></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary-custom btn-lg" onclick="processFloresYaGuest(${quantity})">
                                <i class="bi bi-cart-check"></i> FloresYa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('floresyaGuestModal');
        if (existingModal) {
            existingModal.remove();
            window.floresyaLogger?.info('MODAL', '🧹 Modal existente removido');
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        window.floresyaLogger?.info('MODAL', '✅ Modal agregado al DOM');

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('floresyaGuestModal'));
        modal.show();
        window.floresyaLogger?.success('MODAL', '✅ Modal mostrado exitosamente');

    } catch (error) {
        window.floresyaLogger?.error('MODAL', '❌ Error en showFloresYaGuestModal', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        if (modalTimer) modalTimer.end('MODAL');
    }
}

function processFloresYaGuest(quantity) {
    const processTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.processFloresYaGuest') : null;
    
    try {
        window.floresyaLogger?.info('GUEST-PURCHASE', '🔄 Procesando compra para invitado...', {
            quantity: quantity
        });

        const form = document.getElementById('floresyaGuestForm');
        if (!form.checkValidity()) {
            window.floresyaLogger?.warn('GUEST-PURCHASE', '⚠️ Formulario inválido');
            form.reportValidity();
            return;
        }

        const guestData = {
            name: document.getElementById('guestNameDetail').value,
            phone: document.getElementById('guestPhoneDetail').value,
            email: document.getElementById('guestEmailDetail').value,
            address: document.getElementById('guestAddressDetail').value
        };

        window.floresyaLogger?.info('GUEST-PURCHASE', '📦 Datos del invitado recopilados', guestData);

        // Store guest data in session storage
        sessionStorage.setItem('floresya_guest', JSON.stringify(guestData));
        sessionStorage.setItem('floresya_purchase', JSON.stringify({
            productId: productDetail.product.id,
            quantity: quantity,
            timestamp: Date.now()
        }));
        window.floresyaLogger?.info('GUEST-PURCHASE', '✅ Datos almacenados en sessionStorage');

        // Add to cart
        const cartItem = {
            id: productDetail.product.id,
            name: productDetail.product.name,
            price: parseFloat(productDetail.product.price),
            image: productDetail.images[0],
            quantity: quantity
        };
        window.floresyaLogger?.info('GUEST-PURCHASE', '🛒 Agregando item al carrito', cartItem);
        productDetail.cart.addItem(cartItem);

        // Show animation
        window.floresyaLogger?.info('GUEST-PURCHASE', '✨ Mostrando animación FloresYa...');
        showFloresYaAnimation();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('floresyaGuestModal'));
        if (modal) {
            modal.hide();
            window.floresyaLogger?.info('GUEST-PURCHASE', '✅ Modal cerrado');
        }

        // Redirect to payment
        setTimeout(() => {
            window.floresyaLogger?.info('GUEST-PURCHASE', '📄 Redirigiendo a página de pago...');
            window.location.href = '/pages/payment.html?floresya=true&guest=true';
        }, 1500);

        window.floresyaLogger?.success('GUEST-PURCHASE', '✅ Proceso de compra para invitado completado');

    } catch (error) {
        window.floresyaLogger?.error('GUEST-PURCHASE', '❌ Error en processFloresYaGuest', {
            error: error.message,
            stack: error.stack,
            quantity: quantity
        });
    } finally {
        if (processTimer) processTimer.end('GUEST-PURCHASE');
    }
}

function showFloresYaAnimation() {
    const animationTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.showFloresYaAnimation') : null;
    
    try {
        window.floresyaLogger?.info('ANIMATION', '✨ Mostrando animación FloresYa...');

        const animationHTML = `
            <div id="floresya-detail-animation" class="position-fixed top-50 start-50 translate-middle" 
                 style="z-index: 9999; text-align: center;">
                <div class="bg-primary-custom text-white p-4 rounded-3 shadow-lg">
                    <i class="bi bi-cart-check display-1 mb-3 floresya-pulse"></i>
                    <h4 class="fw-bold">FloresYa</h4>
                    <p class="mb-0">Procesando compra express...</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', animationHTML);
        window.floresyaLogger?.info('ANIMATION', '✅ Animación agregada al DOM');

        // Remove animation after delay
        setTimeout(() => {
            const animation = document.getElementById('floresya-detail-animation');
            if (animation) {
                animation.remove();
                window.floresyaLogger?.info('ANIMATION', '✅ Animación removida del DOM');
            }
        }, 1500);

        window.floresyaLogger?.success('ANIMATION', '✅ Animación FloresYa mostrada');

    } catch (error) {
        window.floresyaLogger?.error('ANIMATION', '❌ Error en showFloresYaAnimation', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        if (animationTimer) animationTimer.end('ANIMATION');
    }
}

function toggleCart() {
    const cartTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.toggleCart') : null;
    
    try {
        window.floresyaLogger?.info('CART-TOGGLE', '🛒 Alternando visibilidad del carrito...');
        const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
        cartOffcanvas.toggle();
        window.floresyaLogger?.success('CART-TOGGLE', '✅ Carrito alternado');
    } catch (error) {
        window.floresyaLogger?.error('CART-TOGGLE', '❌ Error en toggleCart', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        if (cartTimer) cartTimer.end('CART-TOGGLE');
    }
}

function openImageModal() {
    const modalTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.openImageModal') : null;
    
    try {
        window.floresyaLogger?.info('IMAGE-MODAL', '🖼️ Abriendo modal de imagen...');

        const modalImage = document.getElementById('modal-image');
        const currentImageUrl = productDetail.images[productDetail.currentImageIndex];

        // Use large/zoom context for modal
        if (window.responsiveImage && typeof window.responsiveImage.makeResponsive === 'function') {
            try {
                window.responsiveImage.makeResponsive(modalImage, currentImageUrl, 'zoom');
                window.floresyaLogger?.info('IMAGE-MODAL', '✅ Imagen responsiva configurada para modal');
            } catch (e) {
                window.floresyaLogger?.warn('IMAGE-MODAL', '⚠️ Error al hacer imagen responsiva', {
                    error: e.message
                });
                modalImage.src = currentImageUrl;
            }
        } else {
            modalImage.src = currentImageUrl;
            window.floresyaLogger?.info('IMAGE-MODAL', 'ℹ️ Usando URL directa para modal');
        }

        modalImage.alt = productDetail.product.name;
        const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
        imageModal.show();
        window.floresyaLogger?.success('IMAGE-MODAL', '✅ Modal de imagen mostrado');

    } catch (error) {
        window.floresyaLogger?.error('IMAGE-MODAL', '❌ Error en openImageModal', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        if (modalTimer) modalTimer.end('IMAGE-MODAL');
    }
}

// Smooth scroll navigation for product sections
function initProductNavigation() {
    const navTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.initProductNavigation') : null;
    
    try {
        window.floresyaLogger?.info('NAVIGATION', '🧭 Inicializando navegación de secciones de producto...');

        const productNavLinks = document.querySelectorAll('.product-nav-menu .nav-link');
        window.floresyaLogger?.info('NAVIGATION', '🔍 Enlaces de navegación encontrados', {
            count: productNavLinks.length
        });

        productNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // Update active link
                    productNavLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    window.floresyaLogger?.info('NAVIGATION', '✅ Enlace activo actualizado', {
                        target: targetId
                    });

                    // Smooth scroll to target
                    const offsetTop = targetElement.offsetTop - 120;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                    window.floresyaLogger?.info('NAVIGATION', '✅ Scroll suave a sección', {
                        target: targetId,
                        offset: offsetTop
                    });
                } else {
                    window.floresyaLogger?.warn('NAVIGATION', '⚠️ Elemento objetivo no encontrado', {
                        target: targetId
                    });
                }
            });
        });

        window.floresyaLogger?.success('NAVIGATION', '✅ Navegación de secciones inicializada');

    } catch (error) {
        window.floresyaLogger?.error('NAVIGATION', '❌ Error en initProductNavigation', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        if (navTimer) navTimer.end('NAVIGATION');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const domTimer = window.floresyaLogger?.startTimer ? window.floresyaLogger.startTimer('Global.DOMContentLoaded') : null;
    
    try {
        window.floresyaLogger?.info('INIT', 'DOMContentLoaded - Inicializando ProductDetail...');
        window.productDetail = new ProductDetail();
        initProductNavigation();
        
        // Add smooth scrolling to existing anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            if (!anchor.classList.contains('nav-link')) {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        window.floresyaLogger?.info('SCROLL', '✅ Scroll suave a ancla', {
                            target: this.getAttribute('href')
                        });
                    } else {
                        window.floresyaLogger?.warn('SCROLL', '⚠️ Ancla objetivo no encontrada', {
                            target: this.getAttribute('href')
                        });
                    }
                });
            }
        });

        window.floresyaLogger?.success('INIT', '✅ Inicialización completada');

    } catch (error) {
        window.floresyaLogger?.error('INIT', '❌ Error en DOMContentLoaded', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        if (domTimer) domTimer.end('INIT');
    }
});