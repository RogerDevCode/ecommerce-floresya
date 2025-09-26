/**
 * 🌸 FloresYa Main Application - tRPC Enhanced Edition
 * ============================================
 * Extends main.ts functionality with type-safe tRPC integration
 * Provides enhanced data fetching with complete type safety
 */

// Import tRPC hooks and utilities
import type { Product, Occasion } from '../shared/types/index.js';

import {
  useProducts,
  useOccasions,
  useOrders,
  handleTRPCError,
  isAuthenticated
} from './trpc/index.js';

// Import shared types

export class FloresYaAppTRPC {
  private products: Product[] = [];
  private occasions: Occasion[] = [];
  private isLoading = false;

  constructor() {
    this.log('🚀 tRPC Enhanced FloresYa App initializing...');
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      this.log('📋 Starting initialization with tRPC...');

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          void this.loadInitialData();
        });
      } else {
        void this.loadInitialData();
      }

      this.setupEventListeners();
      this.log('✅ tRPC App initialized successfully');

    } catch (error) {
      this.log('❌ Error during initialization:', error, 'error');
    }
  }

  /**
   * Load initial data using tRPC with full type safety
   */
  private async loadInitialData(): Promise<void> {
    this.setLoadingState(true);

    try {
      // Load occasions and products in parallel with type safety
      const [occasionsResult, productsResult] = await Promise.all([
        this.loadOccasionsWithTRPC(),
        this.loadProductsWithTRPC()
      ]);

      if (occasionsResult.success && productsResult.success) {
        this.log('✅ All initial data loaded successfully via tRPC');
        this.updateUI();
      } else {
        const errors = [
          !occasionsResult.success && occasionsResult.error,
          !productsResult.success && productsResult.error
        ].filter(Boolean);

        this.log('⚠️ Some data failed to load:', errors, 'warn');
      }

    } catch (error) {
      this.log('❌ Failed to load initial data:', error, 'error');
      this.showErrorMessage('Error cargando datos. Por favor, recarga la página.');
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Load occasions using tRPC with type safety
   */
  private async loadOccasionsWithTRPC(): Promise<{ success: boolean; error?: string }> {
    try {
      this.log('🎉 Loading occasions via tRPC...');

      const { getOccasions } = useOccasions();
      const result = await getOccasions();

      if (result.success && result.data.data) {
        this.occasions = result.data.data;
        this.populateOccasionFilter();

        this.log(`✅ Loaded ${this.occasions.length} occasions via tRPC`);
        return { success: true };
      } else {
        const error = !result.success && 'error' in result ? result.error || 'Unknown error' : 'No occasion data received';
        this.log('❌ Failed to load occasions:', error, 'error');
        return { success: false, error };
      }

    } catch (error) {
      const errorMsg = handleTRPCError(error);
      this.log('❌ tRPC Error loading occasions:', errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Load products using tRPC with type safety and filtering
   */
  private async loadProductsWithTRPC(filters: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    featured?: boolean;
    occasion_id?: number;
  } = {}): Promise<{ success: boolean; error?: string }> {
    try {
      this.log('🛍️ Loading products via tRPC...', filters);

      const queryParams = {
        page: filters.page || 1,
        limit: filters.limit || 20,
        active: true, // Only show active products
        ...filters
      };

      const { getProducts } = useProducts();
      const result = await getProducts(queryParams);

      if (result.success && result.data.data) {
        const { products, pagination } = result.data.data;

        this.products = products;
        this.renderProducts(products);
        this.updatePagination(pagination);

        this.log(`✅ Loaded ${products.length} products via tRPC (page ${pagination.page}/${pagination.totalPages})`);
        return { success: true };
      } else {
        const error = !result.success && 'error' in result ? result.error || 'Unknown error' : 'No product data received';
        this.log('❌ Failed to load products:', error, 'error');
        return { success: false, error };
      }

    } catch (error) {
      const errorMsg = handleTRPCError(error);
      this.log('❌ tRPC Error loading products:', errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Load featured products for carousel using tRPC
   */
  public async loadFeaturedProductsTRPC(): Promise<void> {
    try {
      this.log('🎠 Loading featured products for carousel via tRPC...');

      const { getActiveProducts } = useProducts();
      const result = await getActiveProducts(8);

      if (result.success && result.data.data) {
        const featuredProducts = result.data.data;
        this.renderCarousel(featuredProducts);

        this.log(`✅ Loaded ${featuredProducts.length} featured products for carousel`);
      } else {
        this.log('⚠️ No featured products available for carousel', undefined, 'warn');
      }

    } catch (error) {
      this.log('❌ Error loading featured products:', handleTRPCError(error), 'error');
    }
  }

  /**
   * Search products using tRPC with type safety
   */
  public async searchProductsTRPC(searchQuery: string): Promise<void> {
    if (!searchQuery.trim()) {
      void this.loadProductsWithTRPC(); // Reload all products
      return;
    }

    this.log('🔍 Searching products via tRPC:', searchQuery);

    await this.loadProductsWithTRPC({
      search: searchQuery.trim(),
      page: 1
    });
  }

  /**
   * Filter products by occasion using tRPC
   */
  public async filterByOccasionTRPC(occasionId: number | null): Promise<void> {
    this.log('🎯 Filtering by occasion via tRPC:', occasionId);

    await this.loadProductsWithTRPC({
      occasion_id: occasionId || undefined,
      page: 1
    });
  }

  /**
   * Load user orders (if authenticated) using tRPC
   */
  public async loadUserOrdersTRPC(): Promise<void> {
    if (!isAuthenticated()) {
      this.log('⚠️ User not authenticated - skipping order loading', undefined, 'warn');
      return;
    }

    try {
      this.log('📦 Loading user orders via tRPC...');

      const { getUserOrders } = useOrders();
      const result = await getUserOrders();

      if (result.success && result.data.data) {
        const orders = result.data.data;
        this.updateOrderHistory(orders);

        this.log(`✅ Loaded ${orders.length} user orders via tRPC`);
      } else {
        this.log('ℹ️ No orders found for user');
      }

    } catch (error) {
      this.log('❌ Error loading user orders:', handleTRPCError(error), 'error');
    }
  }

  /**
   * Setup event listeners for tRPC integration
   */
  private setupEventListeners(): void {
    // Search functionality
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const searchBtn = document.getElementById('searchBtn') as HTMLButtonElement;

    if (searchInput && searchBtn) {
      const performSearch = () => {
        void this.searchProductsTRPC(searchInput.value);
      };

      searchBtn.addEventListener('click', performSearch);
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          performSearch();
        }
      });
    }

    // Occasion filter
    const occasionFilter = document.getElementById('occasionFilter') as HTMLSelectElement;
    if (occasionFilter) {
      occasionFilter.addEventListener('change', () => {
        const occasionId = occasionFilter.value ? parseInt(occasionFilter.value) : null;
        void this.filterByOccasionTRPC(occasionId);
      });
    }

    // Listen for authentication changes
    window.addEventListener('authChanged', (event: Event) => {
      const customEvent = event as CustomEvent;
      const { authenticated } = customEvent.detail;
      if (authenticated) {
        // Load user-specific data
        void this.loadUserOrdersTRPC();
      }
    });
  }

  // UI Update methods
  private renderProducts(products: Product[]): void {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i data-lucide="search-x" class="h-16 w-16 text-gray-400 mx-auto mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
          <p class="text-gray-500">Intenta con otros términos de búsqueda</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(product => `
      <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow" data-product-id="${product.id}">
        <div class="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
          <img src="/images/products/${product.id}.jpg" alt="${product.name}" class="h-48 w-full object-cover object-center" onerror="this.src='/images/placeholder-flower.jpg'">
        </div>
        <div class="p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-2">${product.name}</h3>
          ${product.summary ? `<p class="text-sm text-gray-600 mb-3">${product.summary}</p>` : ''}
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-primary-600">$${product.price_usd}</span>
            <button class="btn-primary btn-sm add-to-cart-btn" data-product-id="${product.id}">
              <i data-lucide="heart" class="h-4 w-4 mr-1"></i>Agregar
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Reinitialize Lucide icons
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }

  private renderCarousel(products: any[]): void {
    const container = document.getElementById('carouselSlides');
    if (!container || products.length === 0) return;

    container.innerHTML = products.map(product => `
      <div class="carousel-slide">
        <div class="bg-white rounded-lg shadow-lg p-4 text-center">
          <h4 class="font-semibold text-gray-900">${product.name}</h4>
          <p class="text-primary-600">Producto destacado</p>
        </div>
      </div>
    `).join('');
  }

  private populateOccasionFilter(): void {
    const filter = document.getElementById('occasionFilter') as HTMLSelectElement;
    if (!filter) return;

    // Clear existing options except the first one
    filter.innerHTML = '<option value="">Todas las ocasiones</option>';

    this.occasions.forEach(occasion => {
      const option = document.createElement('option');
      option.value = occasion.id.toString();
      option.textContent = occasion.name;
      filter.appendChild(option);
    });
  }

  private updatePagination(pagination: any): void {
    const container = document.getElementById('pagination');
    if (!container) return;

    // Simple pagination implementation
    container.innerHTML = `
      <div class="flex justify-center space-x-2">
        ${pagination.page > 1 ? `<button class="px-3 py-1 border rounded" onclick="floresyaAppTRPC.loadPage(${pagination.page - 1})">Anterior</button>` : ''}
        <span class="px-3 py-1">Página ${pagination.page} de ${pagination.totalPages}</span>
        ${pagination.page < pagination.totalPages ? `<button class="px-3 py-1 border rounded" onclick="floresyaAppTRPC.loadPage(${pagination.page + 1})">Siguiente</button>` : ''}
      </div>
    `;
  }

  private updateOrderHistory(orders: any[]): void {
    // Update order history in user menu or profile section
    this.log(`📋 Updated order history with ${orders.length} orders`);
  }

  public async loadPage(page: number): Promise<void> {
    await this.loadProductsWithTRPC({ page });
  }

  private setLoadingState(loading: boolean): void {
    this.isLoading = loading;
    const spinner = document.getElementById('loadingSpinner');

    if (spinner) {
      if (loading) {
        spinner.classList.remove('hidden');
      } else {
        spinner.classList.add('hidden');
      }
    }
  }

  private updateUI(): void {
    // Trigger any UI updates needed after data loads
    this.log('🔄 UI updated after data loading');
  }

  private showErrorMessage(message: string): void {
    // Show user-friendly error message
    const container = document.getElementById('productsContainer');
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i data-lucide="alert-triangle" class="h-16 w-16 text-red-400 mx-auto mb-4"></i>
          <h3 class="text-lg font-medium text-red-900 mb-2">Error</h3>
          <p class="text-red-600">${message}</p>
        </div>
      `;
    }
  }

  private log(message: string, data: unknown = null, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
    const prefix = '[🌸 tRPC FloresYa]';
    const timestamp = new Date().toISOString();
    const output = `${prefix} [${level.toUpperCase()}] ${timestamp} — ${message}`;

    if (data) {
      console.log(output, data);
    } else {
      console.log(output);
    }

    // Also use window.logger if available
    if (window.logger) {
      window.logger[level]('tRPC_APP', message, data as Record<string, unknown> | null);
    }
  }
}

// Create and initialize the tRPC-enhanced app
const floresyaAppTRPC = new FloresYaAppTRPC();

// Make available globally for compatibility with HTML onclick handlers
if (typeof window !== 'undefined') {
  (window as any).floresyaAppTRPC = floresyaAppTRPC;
}

// Default export
export default floresyaAppTRPC;

console.log('🚀 [tRPC App] FloresYa application enhanced with type-safe tRPC integration');