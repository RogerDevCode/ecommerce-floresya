/**
 * 🌸 FloresYa Admin Types - Consolidated with Global Types
 * Central type definitions for admin panel modules
 * Uses consolidated types from single source of truth
 */

// Import consolidated admin types
import type {
  AdminUser,
  AdminOrder,
  AdminOccasion,
  AdminProduct,
  OrdersFilters,
  OrdersData,
  OrderDetails,
  DashboardMetrics,
  AlertData,
  ActivityData,
  AdminPanelLogger,
  WindowWithBootstrap,
  Product,
  ProductImage,
  PaginationInfo
} from '../../shared/types/index.js';

// Re-export admin types for local use
export type {
  AdminUser,
  AdminOrder,
  AdminOccasion,
  AdminProduct,
  OrdersFilters,
  OrdersData,
  OrderDetails,
  DashboardMetrics,
  AlertData,
  ActivityData,
  AdminPanelLogger,
  WindowWithBootstrap
};

// Re-export database types for local use
export type {
  Product,
  ProductImage,
  PaginationInfo
};

// Window interface extensions are now centralized in src/types/globals.ts
export {};