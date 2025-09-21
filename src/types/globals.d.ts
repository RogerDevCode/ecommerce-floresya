/**
 * 🌸 FloresYa Global Types - Strict TypeScript Edition
 * Tipos estrictos para eliminar cualquier uso de 'any'
 */
export interface LogData {
    timestamp?: string;
    userId?: string | number;
    sessionId?: string;
    url?: string;
    userAgent?: string;
    error?: Error | string;
    stackTrace?: string;
    request?: {
        method?: string;
        url?: string;
        headers?: Record<string, string>;
        body?: unknown;
    };
    response?: {
        status?: number;
        headers?: Record<string, string>;
        body?: unknown;
    };
    performance?: {
        duration?: number;
        memory?: number;
        cpu?: number;
    };
    [key: string]: unknown;
}
export interface Logger {
    startAutoSend(intervalMinutes: number): void;
    stopAutoSend(): void;
    sendLogs(): Promise<void>;
    info(module: string, message: string, data?: LogData | null): void;
    success(module: string, message: string, data?: LogData | null): void;
    error(module: string, message: string, data?: LogData | null): void;
    warn(module: string, message: string, data?: LogData | null): void;
    debug(module: string, message: string, data?: LogData | null): void;
    api(module: string, message: string, data?: LogData | null): void;
    user(module: string, message: string, data?: LogData | null): void;
    cart(module: string, message: string, data?: LogData | null): void;
    perf(module: string, message: string, data?: LogData | null): void;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
}
interface BootstrapModal {
    show(): void;
    hide(): void;
}
interface BootstrapToast {
    show(): void;
    hide(): void;
}
export interface WindowWithBootstrap extends Window {
    bootstrap?: {
        Modal: {
            new (element: HTMLElement): BootstrapModal;
            getInstance(element: HTMLElement | null): BootstrapModal | null;
        };
        Toast: {
            new (element: HTMLElement, options?: {
                delay?: number;
            }): BootstrapToast;
            getInstance(element: HTMLElement): BootstrapToast | null;
        };
        Carousel?: new (element: HTMLElement, options?: unknown) => {
            cycle(): void;
        };
    };
}
export interface WindowWithCart extends Window {
    cart?: {
        addItem(product: {
            id: number;
            name: string;
            price_usd: number;
            quantity?: number;
        }): void;
        removeItem(productId: number): void;
        getItems(): Array<{
            id: number;
            name: string;
            price_usd: number;
            quantity: number;
        }>;
        clear(): void;
    };
}
export interface WindowWithFloresyaLogger extends Window {
    floresyaLogger?: Logger;
}
export interface UserCreateRequest {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'admin' | 'support';
    is_active?: boolean;
    email_verified?: boolean;
}
export interface UserUpdateRequest {
    id: number;
    email?: string;
    password?: string;
    full_name?: string;
    phone?: string;
    role?: 'user' | 'admin' | 'support';
    is_active?: boolean;
    email_verified?: boolean;
}
export interface UserResponse {
    id: number;
    email: string;
    full_name?: string;
    phone?: string;
    role: 'user' | 'admin' | 'support';
    is_active: boolean;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
}
export interface UserListResponse {
    users: UserResponse[];
    pagination?: {
        current_page: number;
        total_pages: number;
        total_items: number;
        items_per_page: number;
    };
}
export interface UserQuery {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'user' | 'admin' | 'support';
    is_active?: boolean;
    email_verified?: boolean;
    sort_by?: 'email' | 'full_name' | 'role' | 'created_at' | 'updated_at';
    sort_direction?: 'asc' | 'desc';
    [key: string]: unknown;
}
export interface UserFormData {
    email: string;
    full_name: string;
    phone?: string;
    role: string;
    is_active: boolean;
    email_verified: boolean;
    password?: string;
}
export interface UserValidationError {
    field: string;
    message: string;
    code?: string;
}
export interface UserOperationResult {
    success: boolean;
    data?: UserResponse;
    message: string;
    errors?: UserValidationError[];
}
export type DebounceFunction<T extends (...args: Parameters<T>) => ReturnType<T>> = {
    (...args: Parameters<T>): void;
    cancel(): void;
};
export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    price_usd: number;
    is_featured: boolean;
    carousel_order?: number;
    occasion_ids?: number[];
    created_at?: string;
    updated_at?: string;
}
export interface AdminOrder {
    id: number;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    total_amount_usd: number;
    total_amount_ves?: number;
    status: string;
    created_at: string;
    delivery_date?: string;
    items_count?: number;
}
export interface AdminUser {
    id: number;
    email: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'admin' | 'support';
    is_active: boolean;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
}
export interface AdminOccasion {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}
export interface ProductCreateRequest {
    name: string;
    description?: string;
    price: number;
    price_usd: number;
    is_featured?: boolean;
    carousel_order?: number;
    occasion_ids?: number[];
}
export interface ProductUpdateRequest extends ProductCreateRequest {
    id: number;
}
export interface OccasionCreateRequest {
    name: string;
    slug: string;
    description?: string;
    color: string;
    is_active?: boolean;
}
export interface OccasionUpdateRequest extends OccasionCreateRequest {
    id: number;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    errors?: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    code?: string;
}
export interface AdminPanelInstance {
    productModal: {
        showEditProductModal(product: Product): void;
    };
    productImagesModal: {
        show?(productId: number, productName: string): void;
    };
    userModal: {
        showEditUserModal(user: AdminUser): void;
    };
    occasionModal: {
        showEditOccasionModal(occasion: AdminOccasion): void;
    };
    orderDetailsModal: {
        show?(orderId: number): void;
    };
    editProductImages(productId: number, productName: string): void;
    viewOrderDetails(orderId: number): void;
    deleteUser(userId: number): void;
    deleteOccasion(occasionId: number): void;
}
export type AdminPanelWindow = Window & {
    adminPanel?: AdminPanelInstance;
    __adminPanelInstance?: unknown;
};
export type SafeError = Error | string;
export declare function formatError(error: SafeError): string;
declare global {
    var NodeJS: {
        Timeout: ReturnType<typeof setTimeout>;
    };
    interface Window {
        adminPanel?: AdminPanelInstance;
        floresyaLogger?: Logger;
        bootstrap?: {
            Modal: new (element: HTMLElement) => {
                show(): void;
                hide(): void;
            };
            Toast: new (element: HTMLElement, options?: {
                delay?: number;
            }) => {
                show(): void;
                hide(): void;
            };
        };
    }
}
export {};
