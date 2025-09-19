/**
 * 🌸 FloresYa Admin - API Client
 * Centralized API client for all admin operations
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

export class ApiClient {
  private baseUrl: string = '/api';

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchData<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // === PRODUCT OPERATIONS ===

  /**
   * Get all products
   */
  async getProducts(filters?: Record<string, any>): Promise<ApiResponse<any[]>> {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    return this.fetchData(endpoint);
  }

  /**
   * Get single product
   */
  async getProduct(id: number): Promise<ApiResponse<any>> {
    return this.fetchData(`/products/${id}`);
  }

  /**
   * Get product with occasions for editing
   */
  async getProductWithOccasions(id: number): Promise<ApiResponse<any>> {
    return this.fetchData(`/products/${id}/with-occasions`);
  }

  /**
   * Create new product
   */
  async createProduct(productData: any): Promise<ApiResponse<any>> {
    return this.fetchData('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  /**
   * Update existing product
   */
  async updateProduct(id: number, productData: any): Promise<ApiResponse<any>> {
    return this.fetchData(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  /**
   * Delete product
   */
  async deleteProduct(id: number): Promise<ApiResponse<any>> {
    return this.fetchData(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get product images
   */
  async getProductImages(productId: number): Promise<ApiResponse<any[]>> {
    return this.fetchData(`/products/${productId}/images`);
  }

  // === USER OPERATIONS ===

  /**
   * Get all users
   */
  async getUsers(filters?: Record<string, any>): Promise<ApiResponse<any[]>> {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    return this.fetchData(endpoint);
  }

  /**
   * Create new user
   */
  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.fetchData('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Update existing user
   */
  async updateUser(id: number, userData: any): Promise<ApiResponse<any>> {
    return this.fetchData(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<ApiResponse<any>> {
    return this.fetchData(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  // === OCCASION OPERATIONS ===

  /**
   * Get all occasions
   */
  async getOccasions(): Promise<ApiResponse<any[]>> {
    return this.fetchData('/occasions');
  }

  /**
   * Create new occasion
   */
  async createOccasion(occasionData: any): Promise<ApiResponse<any>> {
    return this.fetchData('/occasions', {
      method: 'POST',
      body: JSON.stringify(occasionData)
    });
  }

  /**
   * Update existing occasion
   */
  async updateOccasion(id: number, occasionData: any): Promise<ApiResponse<any>> {
    return this.fetchData(`/occasions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(occasionData)
    });
  }

  /**
   * Delete occasion
   */
  async deleteOccasion(id: number): Promise<ApiResponse<any>> {
    return this.fetchData(`/occasions/${id}`, {
      method: 'DELETE'
    });
  }

  // === ORDER OPERATIONS ===

  /**
   * Get all orders
   */
  async getOrders(filters?: Record<string, any>): Promise<ApiResponse<any[]>> {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;
    return this.fetchData(endpoint);
  }

  /**
   * Get single order
   */
  async getOrder(id: number): Promise<ApiResponse<any>> {
    return this.fetchData(`/orders/${id}`);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: number, status: string): Promise<ApiResponse<any>> {
    return this.fetchData(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // === IMAGE OPERATIONS ===

  /**
   * Upload product image
   */
  async uploadProductImage(productId: number, file: File, imageIndex?: number, isPrimary?: boolean): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('image', file);
    if (imageIndex !== undefined) formData.append('imageIndex', imageIndex.toString());
    if (isPrimary !== undefined) formData.append('isPrimary', isPrimary.toString());

    return fetch(`${this.baseUrl}/images/upload/${productId}`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    }).then(response => response.json());
  }

  /**
   * Delete product images
   */
  async deleteProductImages(productId: number): Promise<ApiResponse<any>> {
    return this.fetchData(`/images/delete/${productId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Upload site image (hero, logo)
   */
  async uploadSiteImage(file: File, type: 'hero' | 'logo'): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    return fetch(`${this.baseUrl}/images/site`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    }).then(response => response.json());
  }

  // === AUTHENTICATION ===

  /**
   * Verify authentication
   */
  async verifyAuth(): Promise<ApiResponse<any>> {
    return this.fetchData('/auth/verify');
  }

  /**
   * Check user role
   */
  async checkRole(): Promise<ApiResponse<any>> {
    return this.fetchData('/auth/role');
  }
}

// Global API client instance
export const apiClient = new ApiClient();