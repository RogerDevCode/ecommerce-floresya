// 🌸 FloresYa Frontend Types - Consolidated with Shared Types
// ========================================================
// Re-export core types from shared types (Single Source of Truth)
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
  CarouselResponse,
  LogData,
  Logger,
  WindowWithCart,
  LoginCredentials,
  RegisterData,
  UserRole,
  OrderStatus,
  PaymentStatus,
  ImageSize,
  CartItem,
  AuthenticatedRequest
} from '../../shared/types/index.js';