// Re-export core types from supabase.ts
export type {
  Product,
  ProductImage,
  Occasion,
  User,
  ProductQuery,
  ProductQuery as ProductFilters, // Alias ProductQuery as ProductFilters
  PaginationInfo,
  ApiResponse,
  ProductWithImages,
  CarouselProduct,
  CarouselResponse
} from '@database-types/*';

// Re-export global types from globals.ts
export type {
  LogData,
  Logger,
  WindowWithBootstrap,
  WindowWithCart,
  LoginCredentials,
  RegisterData
} from '@shared-types/*';