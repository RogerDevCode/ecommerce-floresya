/**
 * 🌸 FloresYa Test Data Factories - Silicon Valley Simple Edition
 * Centralized test data factories for consistent mock data across all tests
 */

// Product Factories
export const createTestProduct = (overrides = {}) => ({
  id: 1,
  name: 'Rosas Rojas',
  summary: 'Hermosas rosas rojas',
  description: 'Descripción detallada de rosas rojas para cualquier ocasión especial',
  price_usd: 25.99,
  stock: 100,
  active: true,
  featured: false,
  carousel_order: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createTestProductList = (products = [createTestProduct()], overrides = {}) => ({
  products,
  pagination: {
    current_page: 1,
    total_pages: 1,
    total_items: products.length,
    items_per_page: 20,
    ...overrides
  }
});

export const createTestCarouselProduct = (overrides = {}) => ({
  id: 1,
  name: 'Rosas Rojas',
  summary: 'Hermosas rosas rojas',
  price_usd: 25.99,
  carousel_order: 1,
  primary_thumb_url: '/images/rosas-thumb.webp',
  images: [{ url: '/images/rosas-small.webp', size: 'small' }],
  ...overrides
});

export const createTestCarouselData = (products = [createTestCarouselProduct()], overrides = {}) => ({
  products,
  total_count: products.length,
  ...overrides
});

// Occasion Factories
export const createTestOccasion = (overrides = {}) => ({
  id: 1,
  name: 'Cumpleaños',
  description: 'Celebraciones de cumpleaños',
  slug: 'cumpleanos',
  is_active: true,
  display_order: 1,
  ...overrides
});

export const createTestOccasionsList = (occasions = [createTestOccasion()], overrides = []) => [
  ...occasions,
  ...overrides
];

// Image Factories
export const createTestProductImage = (overrides = {}) => ({
  id: 1,
  product_id: 1,
  url: '/images/rosas-thumb.webp',
  size: 'small',
  is_primary: true,
  ...overrides
});

// Database Row Factories (for direct database tests)
export const createTestProductRow = (overrides = {}) => ({
  id: 1,
  name: 'Rose Bouquet',
  price_usd: 75.00,
  active: true,
  carousel_order: 1,
  ...overrides
});

export const createTestOccasionRow = (overrides = {}) => ({
  id: 1,
  name: 'Cumpleaños',
  description: 'Celebraciones de cumpleaños',
  is_active: true,
  display_order: 1,
  slug: 'cumpleanos',
  ...overrides
});

export const createTestProductImageRow = (overrides = {}) => ({
  id: 1,
  product_id: 1,
  url: 'https://example.com/image.jpg',
  size: 'medium',
  is_primary: true,
  ...overrides
});

export const createTestProductOccasionRow = (overrides = {}) => ({
  id: 1,
  product_id: 1,
  occasion_id: 1,
  products: { id: 1, name: 'Rose Bouquet' },
  occasions: { id: 1, name: 'Cumpleaños', description: 'Celebraciones de cumpleaños', slug: 'cumpleanos' },
  ...overrides
});

// Health Status Factory
export const createTestHealthStatus = (overrides = {}) => ({
  connected: true,
  metrics: {
    connectionAttempts: 5,
    successfulConnections: 5,
    averageConnectionTime: 150,
    successRate: 100,
    lastConnectionTime: Date.now()
  },
  timestamp: Date.now(),
  ...overrides
});

// Mock Request/Response Factories
export const createMockRequest = (options: any = {}) => ({
  params: options.params || {},
  query: options.query || {},
  body: options.body || {},
  ...options
});

export const createMockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
};

// Mock Supabase Response Factory
export const createMockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error
});

// Order Factories
export const createTestOrder = (overrides = {}) => ({
  id: 1,
  customer_email: 'customer@example.com',
  customer_name: 'Test Customer',
  customer_phone: '+1234567890',
  delivery_address: '123 Test Street',
  delivery_city: 'Test City',
  delivery_state: 'Test State',
  delivery_zip: '12345',
  delivery_date: '2024-01-20',
  delivery_time_slot: '10:00-12:00',
  delivery_notes: 'Please ring the doorbell',
  status: 'pending' as const,
  total_amount_usd: 150.00,
  notes: 'Birthday order',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  items: [
    {
      id: 1,
      order_id: 1,
      product_id: 1,
      product_name: 'Rose Bouquet',
      product_summary: 'Beautiful red roses',
      unit_price_usd: 75.00,
      quantity: 2,
      subtotal_usd: 150.00
    }
  ],
  payments: [],
  status_history: [],
  ...overrides
});

export const createTestOrderList = (overrides = {}) => ({
  orders: [createTestOrder()],
  pagination: {
    current_page: 1,
    total_pages: 1,
    total_items: 1,
    items_per_page: 20,
    ...overrides
  },
  ...overrides
});

export const createTestStatusHistory = (overrides = {}) => [
  {
    id: 1,
    order_id: 1,
    old_status: 'pending',
    new_status: 'confirmed',
    notes: 'Order confirmed by admin',
    changed_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
];

// Mock Chain Builder for Supabase
export const createMockSupabaseChain = (finalResult: any) => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  then: vi.fn((resolve) => resolve(finalResult)),
  ...finalResult
});