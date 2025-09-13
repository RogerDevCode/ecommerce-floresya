// Test page JavaScript for FloresYa Database Browser

class TestManager {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🔍 Initializing FloresYa Test Manager...');
        await this.checkApiStatus();
        this.updateLastUpdate();
        this.loadCategoryOptions();
    }

    // Check API status
    async checkApiStatus() {
        try {
            const response = await fetch('/api/test/health');
            const data = await response.json();
            
            const statusContainer = document.getElementById('apiStatus');
            
            if (data.success) {
                statusContainer.innerHTML = `
                    <div class="d-flex align-items-center text-success">
                        <i class="bi bi-check-circle-fill me-2"></i>
                        <span><strong>API Conectada</strong> - Todos los endpoints funcionando</span>
                    </div>
                    <small class="text-muted">Endpoints disponibles: ${data.endpoints.length}</small>
                `;
            } else {
                throw new Error('API no disponible');
            }
            
        } catch (error) {
            const statusContainer = document.getElementById('apiStatus');
            statusContainer.innerHTML = `
                <div class="d-flex align-items-center text-danger">
                    <i class="bi bi-x-circle-fill me-2"></i>
                    <span><strong>API Error</strong> - ${error.message}</span>
                </div>
            `;
        }
    }

    // Update last update time
    updateLastUpdate() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        lastUpdateElement.textContent = new Date().toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // Load categories data
    async loadCategories() {
        try {
            console.log('📂 Loading categories...');
            
            const response = await fetch('/api/test/categories');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }

            const container = document.getElementById('categoriesContainer');
            const countBadge = document.getElementById('categoriesCount');
            
            countBadge.textContent = data.data.categories.length;
            
            // Build categories HTML
            let html = '';
            
            if (data.data.categories.length === 0) {
                html = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i>
                        No se encontraron categorías en la base de datos.
                    </div>
                `;
            } else {
                // Summary first
                html += `
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <h6>Total Categorías</h6>
                                    <h3 class="text-primary">${data.data.summary.total_categories}</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <h6>Categorías Activas</h6>
                                    <h3 class="text-success">${data.data.summary.active_categories}</h3>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <h6>Con Productos</h6>
                                    <h3 class="text-info">${data.data.summary.categories_with_products}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Categories table
                html += `
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead class="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Descripción</th>
                                    <th>Productos</th>
                                    <th>Estado</th>
                                    <th>Creada</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                data.data.categories.forEach(category => {
                    const statusBadge = category.active 
                        ? '<span class="badge bg-success">Activa</span>'
                        : '<span class="badge bg-secondary">Inactiva</span>';
                    
                    const productsBadge = category.product_count > 0 
                        ? `<span class="badge bg-info">${category.product_count} productos</span>`
                        : '<span class="badge bg-light text-dark">Sin productos</span>';
                    
                    html += `
                        <tr>
                            <td><strong>${category.id}</strong></td>
                            <td>
                                <strong>${category.name}</strong>
                                <br>
                                <small class="text-muted">${category.image_url}</small>
                            </td>
                            <td>${category.description}</td>
                            <td>${productsBadge}</td>
                            <td>${statusBadge}</td>
                            <td>
                                <small>${new Date(category.created_at).toLocaleDateString('es-ES')}</small>
                            </td>
                        </tr>
                    `;
                });
                
                html += '</tbody></table></div>';
            }
            
            container.innerHTML = html;
            this.updateLastUpdate();
            
            // Update category filter options
            this.loadCategoryOptions();
            
        } catch (error) {
            console.error('Error loading categories:', error);
            document.getElementById('categoriesContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
        }
    }

    // Load products data
    async loadProducts() {
        try {
            console.log('📦 Loading products...');
            
            const limit = document.getElementById('productsLimit').value;
            const response = await fetch(`/api/test/products?limit=${limit}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }

            const container = document.getElementById('productsContainer');
            const countBadge = document.getElementById('productsCount');
            
            countBadge.textContent = data.data.products.length;
            
            let html = '';
            
            if (data.data.products.length === 0) {
                html = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i>
                        No se encontraron productos en la base de datos.
                    </div>
                `;
            } else {
                // Summary
                html += `
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <h6>Total</h6>
                                    <h4 class="text-primary">${data.data.summary.total_products}</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <h6>Activos</h6>
                                    <h4 class="text-success">${data.data.summary.active_products}</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <h6>Destacados</h6>
                                    <h4 class="text-warning">${data.data.summary.featured_products}</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <h6>Mostrando</h6>
                                    <h4 class="text-info">${data.data.summary.returned_count}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Products table
                html += `
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead class="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Producto</th>
                                    <th>Precio</th>
                                    <th>Categoría</th>
                                    <th>Ocasión</th>
                                    <th>Estado</th>
                                    <th>Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                data.data.products.forEach(product => {
                    const featuredBadge = product.featured 
                        ? '<span class="badge bg-warning text-dark">Destacado</span>'
                        : '';
                    
                    const activeBadge = product.active 
                        ? '<span class="badge bg-success">Activo</span>'
                        : '<span class="badge bg-secondary">Inactivo</span>';
                    
                    const categoryName = product.category ? product.category.name : 'Sin categoría';
                    const categoryBadge = product.has_category 
                        ? `<span class="badge bg-info">${categoryName}</span>`
                        : '<span class="badge bg-light text-dark">Sin categoría</span>';
                    
                    const stockBadge = product.stock_quantity > 0 
                        ? `<span class="badge bg-success">${product.stock_quantity}</span>`
                        : '<span class="badge bg-danger">0</span>';
                    
                    html += `
                        <tr>
                            <td><strong>${product.id}</strong></td>
                            <td>
                                <strong>${product.name}</strong>
                                ${featuredBadge}
                                <br>
                                <small class="text-muted">${product.description.substring(0, 60)}...</small>
                            </td>
                            <td><strong class="text-success">${product.formatted_price}</strong></td>
                            <td>${categoryBadge}</td>
                            <td>
                                <span class="badge bg-secondary">${product.occasion}</span>
                            </td>
                            <td>${activeBadge}</td>
                            <td>${stockBadge}</td>
                        </tr>
                    `;
                });
                
                html += '</tbody></table></div>';

                // Stats
                if (data.data.stats) {
                    html += `
                        <div class="row mt-4">
                            <div class="col-md-6">
                                <h6>Por Ocasión:</h6>
                                <div class="d-flex flex-wrap">
                    `;
                    
                    data.data.stats.by_occasion.forEach(stat => {
                        html += `<span class="badge bg-secondary me-2 mb-2">${stat.occasion}: ${stat.count}</span>`;
                    });
                    
                    html += '</div></div>';
                    
                    html += `
                            <div class="col-md-6">
                                <h6>Por Categoría:</h6>
                                <div class="d-flex flex-wrap">
                    `;
                    
                    data.data.stats.by_category.forEach(stat => {
                        html += `<span class="badge bg-info me-2 mb-2">${stat.category_name}: ${stat.product_count}</span>`;
                    });
                    
                    html += '</div></div></div>';
                }
            }
            
            container.innerHTML = html;
            this.updateLastUpdate();
            
        } catch (error) {
            console.error('Error loading products:', error);
            document.getElementById('productsContainer').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
        }
    }

    // Load category options for filters
    async loadCategoryOptions() {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            
            if (data.success) {
                const select = document.getElementById('filterCategory');
                select.innerHTML = '<option value="">Todas las categorías</option>';
                
                data.data.categories.forEach(category => {
                    select.innerHTML += `<option value="${category.id}">${category.name}</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading category options:', error);
        }
    }

    // Apply filters
    async applyFilters() {
        try {
            const categoryId = document.getElementById('filterCategory').value;
            const occasion = document.getElementById('filterOccasion').value;
            const featured = document.getElementById('filterFeatured').value;
            
            const params = new URLSearchParams();
            if (categoryId) params.append('category_id', categoryId);
            if (occasion) params.append('occasion', occasion);
            if (featured) params.append('featured', featured);
            params.append('limit', '50');
            
            const response = await fetch(`/api/test/filtered-products?${params}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }
            
            const container = document.getElementById('filterResults');
            
            let html = `
                <div class="alert alert-info">
                    <strong>Filtros aplicados:</strong>
                    Categoría: ${categoryId || 'Todas'}, 
                    Ocasión: ${occasion || 'Todas'}, 
                    Destacados: ${featured || 'Todos'}
                    <br>
                    <strong>Resultados:</strong> ${data.data.results.count} de ${data.data.results.total_matching} productos
                </div>
            `;
            
            if (data.data.products.length === 0) {
                html += `
                    <div class="alert alert-warning">
                        <i class="bi bi-search"></i>
                        No se encontraron productos con los filtros aplicados.
                    </div>
                `;
            } else {
                html += '<div class="row">';
                
                data.data.products.slice(0, 12).forEach(product => {
                    const categoryName = product.category ? product.category.name : 'Sin categoría';
                    
                    html += `
                        <div class="col-md-4 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h6 class="card-title">${product.name}</h6>
                                    <p class="card-text">
                                        <strong>$${product.price}</strong> - ${categoryName}
                                        <br>
                                        <span class="badge bg-secondary">${product.occasion}</span>
                                        ${product.featured ? '<span class="badge bg-warning">Destacado</span>' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error applying filters:', error);
            document.getElementById('filterResults').innerHTML = `
                <div class="alert alert-danger">
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
        }
    }

    // Clear filters
    clearFilters() {
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterOccasion').value = '';
        document.getElementById('filterFeatured').value = '';
        document.getElementById('filterResults').innerHTML = '';
    }

    // Test all filters
    async testFilters() {
        await this.applyFilters();
    }

    // Refresh all data
    async refreshAll() {
        console.log('🔄 Refreshing all data...');
        await this.checkApiStatus();
        await this.loadCategories();
        await this.loadProducts();
        this.updateLastUpdate();
    }
}

// Global functions for buttons
function loadCategories() {
    window.testManager.loadCategories();
}

function loadProducts() {
    window.testManager.loadProducts();
}

function testFilters() {
    window.testManager.testFilters();
}

function applyFilters() {
    window.testManager.applyFilters();
}

function clearFilters() {
    window.testManager.clearFilters();
}

function refreshAll() {
    window.testManager.refreshAll();
}

function testConnection() {
    window.testManager.checkApiStatus();
}

function testAll() {
    window.testManager.refreshAll();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.testManager = new TestManager();
});