/**
 * Tipos principales de FloresYa E-commerce
 * Punto de entrada para todas las definiciones TypeScript
 */

// Exportar todos los tipos de base de datos
export * from './database.js';

// Exportar todos los tipos de servicios
export * from './services.js';

// Tipos específicos del frontend
export interface CartItem {
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price_usd: number;
    image_url?: string;
  };
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Tipos para el estado de la aplicación frontend
export interface AppState {
  isLoading: boolean;
  error?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: 'customer' | 'admin';
  };
  cart: Cart;
  products: any[];
  settings: Record<string, any>;
}

// Tipos para eventos del frontend
export interface CustomEventMap {
  'cart:updated': CustomEvent<Cart>;
  'user:login': CustomEvent<AppState['user']>;
  'user:logout': CustomEvent<void>;
  'product:added': CustomEvent<{ productId: number; quantity: number }>;
  'error:display': CustomEvent<{ message: string; type: 'error' | 'warning' | 'info' }>;
}

// Extender el Document interface para eventos personalizados
declare global {
  interface Document {
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
    
    removeEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: Document, ev: CustomEventMap[K]) => void,
      options?: boolean | EventListenerOptions
    ): void;
  }
}

// Tipos de utilidad
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;