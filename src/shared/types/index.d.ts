/**
 * 🌸 FloresYa Shared Types - SINGLE SOURCE OF TRUTH
 * ============================================
 * CONSOLIDATED SHARED TYPES - ENTERPRISE EDITION
 * ============================================
 *
 * Silicon Valley Standards:
 * ✅ Single Source of Truth for ALL shared types
 * ✅ Eliminates duplication across frontend/backend
 * ✅ Centralized type management
 * ✅ Zero tech debt - No duplicate interface declarations
 */
export type OccasionType = 'general' | 'birthday' | 'anniversary' | 'wedding' | 'sympathy' | 'congratulations';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';
export type PaymentMethodType = 'bank_transfer' | 'mobile_payment' | 'cash' | 'crypto' | 'card';
export type UserRole = 'admin' | 'user' | 'support';
export type ImageSize = 'thumb' | 'small' | 'medium' | 'large';
export interface User {
    id: number;
    email: string;
    password?: string;
    password_hash?: string;
    full_name?: string;
    phone?: string;
    role: UserRole;
    is_active: boolean;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
}
export interface Product {
    id: number;
    name: string;
    summary?: string;
    description?: string;
    price: number;
    price_usd: number;
    price_ves?: number;
    stock?: number;
    sku?: string;
    active?: boolean;
    is_featured: boolean;
    featured?: boolean;
    is_available?: boolean;
    carousel_order?: number;
    image_url?: string;
    category_id?: number;
    occasion_id?: number;
    created_at: string;
    updated_at: string;
}
export interface ProductImage {
    id: number;
    product_id: number;
    url: string;
    alt_text?: string;
    size: ImageSize;
    is_primary: boolean;
    display_order?: number;
    image_index?: number;
    file_hash?: string;
    mime_type?: string;
    product_name?: string;
    created_at: string;
    updated_at?: string;
}
export interface Occasion {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color: string;
    type?: OccasionType;
    display_order: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}
export interface Order {
    id: number;
    user_id?: number;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    total_amount_usd: number;
    total_amount_ves?: number;
    status: OrderStatus;
    delivery_address?: string;
    delivery_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}
export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price_usd: number;
    unit_price_ves?: number;
    subtotal_usd: number;
    subtotal_ves?: number;
    created_at?: string;
}
export interface OrderStatusHistory {
    id: number;
    order_id: number;
    status: string;
    notes?: string;
    user_id?: number;
    created_at: string;
}
export interface PaymentMethod {
    id: number;
    name: string;
    type: PaymentMethodType;
    is_active: boolean;
    display_order: number;
    account_info?: PaymentMethodAccountInfo;
    created_at?: string;
    updated_at?: string;
}
export interface PaymentMethodAccountInfo {
    bank_name?: string;
    account_number?: string;
    account_holder?: string;
    phone_number?: string;
    wallet_address?: string;
    qr_code_url?: string;
}
export interface Payment {
    id: number;
    order_id: number;
    payment_method_id: number;
    amount_usd: number;
    amount_ves?: number;
    status: PaymentStatus;
    transaction_reference?: string;
    payment_details?: PaymentDetailsObject;
    confirmed_by?: number;
    confirmed_at?: string;
    created_at: string;
    updated_at?: string;
}
export interface PaymentDetailsObject {
    transaction_id?: string;
    confirmation_code?: string;
    bank_reference?: string;
    notes?: string;
    attachments?: string[];
}
export interface Setting {
    id: number;
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
    is_public: boolean;
    created_at?: string;
    updated_at?: string;
}
export interface ProductWithImages extends Product {
    images?: ProductImage[];
    primary_image_url?: string;
    primary_thumb_url?: string;
}
export interface ProductWithOccasions extends Product {
    occasions?: Occasion[];
    occasion?: Occasion;
}
export interface ProductWithImagesAndOccasions extends Product {
    images?: ProductImage[];
    occasions?: Occasion[];
    occasion?: Occasion;
    primary_image_url?: string;
    primary_thumb_url?: string;
}
export interface ProductWithOccasion extends ProductWithImages {
    occasion?: Occasion;
    price: number;
}
export interface OrderWithItems extends Order {
    items: OrderItem[];
    items_count?: number;
}
export interface OrderWithItemsAndPayments extends OrderWithItems {
    payments?: Payment[];
    status_history?: OrderStatusHistory[];
    user?: {
        id: number;
        full_name?: string;
        email: string;
    };
}
export interface CarouselProduct {
    id: number;
    name: string;
    summary?: string;
    price_usd: number;
    carousel_order: number;
    primary_image_url?: string;
    primary_thumb_url: string;
    images?: Array<{
        url: string;
        size: string;
    }>;
}
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}
export interface ProductQuery {
    page?: number;
    limit?: number;
    search?: string;
    occasion_id?: number;
    occasion?: number;
    is_featured?: boolean;
    featured?: boolean;
    is_available?: boolean;
    active?: boolean;
    min_price?: number;
    max_price?: number;
    sort_by?: 'name' | 'price_usd' | 'created_at' | 'carousel_order' | 'stock';
    sort_direction?: 'asc' | 'desc';
    sort?: string;
    [key: string]: unknown;
}
export interface UserQuery {
    page?: number;
    limit?: number;
    search?: string;
    role?: User['role'];
    is_active?: boolean;
    email_verified?: boolean;
    sort_by?: 'email' | 'full_name' | 'role' | 'created_at' | 'updated_at';
    sort_direction?: 'asc' | 'desc';
    [key: string]: unknown;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    errors?: ValidationError[];
    [key: string]: unknown;
}
export interface ValidationError {
    field: string;
    message: string;
    code?: string;
}
export interface PaginationInfo {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
}
export type LogLevel = 'info' | 'success' | 'error' | 'warn';
export interface LogData {
    [key: string]: unknown;
}
export interface WindowWithLogger {
    logger?: {
        info: (module: string, message: string, data?: LogData) => void;
        success: (module: string, message: string, data?: LogData) => void;
        error: (module: string, message: string, data?: LogData) => void;
        warn: (module: string, message: string, data?: LogData) => void;
    };
}
export interface WindowWithCart {
    cart?: {
        addItem: (item: CartItem) => void;
        removeItem: (productId: number) => void;
        updateQuantity: (productId: number, quantity: number) => void;
        getItems: () => CartItem[];
        getTotal: () => number;
        clear: () => void;
    };
}
export interface AdminBootstrapModal {
    show(): void;
    hide(): void;
}
export interface AdminBootstrapToast {
    show(): void;
    hide(): void;
}
export interface WindowWithBootstrap {
    bootstrap?: {
        Modal: {
            getInstance: (element: Element | HTMLElement | null) => {
                show: () => void;
                hide: () => void;
            } | AdminBootstrapModal | null;
            new (element: HTMLElement): AdminBootstrapModal;
        };
        Toast: {
            new (element: HTMLElement, options?: {
                delay?: number;
            }): AdminBootstrapToast;
            getInstance(element: HTMLElement): AdminBootstrapToast | null;
        };
    };
}
export interface CartItem {
    productId: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
}
export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}
export interface ImageUploadRequest {
    productId: number;
    imageIndex: number;
    file: MulterFile;
    isPrimary?: boolean;
}
export interface ProcessedImage {
    size: ImageSize;
    buffer: Buffer;
    width: number;
    height: number;
    fileName: string;
    mimeType: string;
    fileHash: string;
}
export interface ImageUploadResult {
    success: boolean;
    images: Array<{
        size: ImageSize;
        url: string;
        fileHash: string;
    }>;
    primaryImage?: ProductImage;
    message: string;
}
export interface ConversionOptimizer {
    sessionStartTime: number;
    viewedProducts: Set<number>;
}
export interface ProductCardData {
    id: number;
    name: string;
    summary?: string;
    price_usd: number;
    carousel_order: number;
    primary_thumb_url: string;
    images?: Array<{
        url: string;
        size: string;
    }>;
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
export interface APIProductResponse {
    product: ProductWithImagesAndOccasions;
}
export interface APIRequestData {
    [key: string]: unknown;
}
export interface APIResponseData {
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
export interface UserOperationResult {
    success: boolean;
    data?: UserResponse;
    message: string;
    errors?: ValidationError[];
}
export interface CartManager {
    addItem(product: {
        id: number;
        name: string;
        price_usd: number;
        quantity?: number;
    }): void;
    removeItem(productId: number): void;
    getItems(): CartItem[];
    clear(): void;
}
export type DebounceFunction<T extends (...args: Parameters<T>) => ReturnType<T>> = {
    (...args: Parameters<T>): void;
    cancel(): void;
};
export interface LogEntry {
    id?: string | number;
    level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'SUCCESS' | 'API' | 'DB' | 'SECURITY' | 'PERF' | 'info' | 'error' | 'warn' | 'debug' | 'success' | 'api' | 'user' | 'cart' | 'perf';
    module: string;
    message: string;
    data?: LogData | null;
    timestamp: string;
    session_id?: string;
    user_id?: string | number;
    request_id?: string;
    requestId?: string;
    ip_address?: string;
    ip?: string;
    user_agent?: string;
    userAgent?: string;
    url?: string;
    method?: string;
    status_code?: number;
    statusCode?: number;
    response_time?: number;
    duration?: number;
    error_stack?: string;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    created_at?: string;
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
export interface LogConfig {
    level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
    enableConsole: boolean;
    enableFileLogging: boolean;
    enableDatabase?: boolean;
    enableRemote?: boolean;
    logDirectory: string;
    maxFileSize: number;
    maxFiles: number;
    enableStructured: boolean;
    remoteEndpoint?: string;
    bufferSize?: number;
    flushInterval?: number;
    includeStack?: boolean;
    sanitizeData?: boolean;
    compression?: boolean;
}
export interface LogBatch {
    logs: LogEntry[];
    batch_id: string;
    timestamp: string;
    source: 'frontend' | 'backend' | 'api';
    environment: 'development' | 'staging' | 'production';
    version?: string;
}
export interface LogTransmissionResult {
    success: boolean;
    batch_id: string;
    processed_count: number;
    errors?: string[];
    retry_after?: number;
}
export interface LogQuery {
    level?: LogEntry['level'];
    module?: string;
    user_id?: string | number;
    session_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: 'timestamp' | 'level' | 'module';
    sort_direction?: 'asc' | 'desc';
}
export interface LogQueryResult {
    logs: LogEntry[];
    total_count: number;
    page: number;
    limit: number;
    has_more: boolean;
}
export interface WindowWithFloresyaLogger extends Window {
    floresyaLogger?: Logger;
}
export type SafeError = Error | string;
export declare function formatError(error: SafeError): string;
export declare function formatLogData(data: unknown): LogData;
export interface FloresYaAuthManager {
    init(): Promise<void>;
    login(email: string, password: string): Promise<boolean>;
    logout(): void;
    isAuthenticated(): boolean;
    getCurrentUser(): Promise<User>;
}
export interface ScrollEffectsManager {
    init(): void;
    destroy(): void;
    enableEffects(): void;
    disableEffects(): void;
}
export interface BootstrapModal {
    show(): void;
    hide(): void;
}
export interface BootstrapToast {
    show(): void;
    hide(): void;
}
export interface BootstrapCarousel {
    cycle(): void;
    pause(): void;
    next(): void;
    prev(): void;
}
export interface WindowWithUsersAdmin extends Window {
    usersAdmin?: {
        goToPage(page: number): void;
        loadUsers(): void;
    };
}
export interface AdminUser extends User {
    full_name: string;
}
export interface AdminOrder extends Order {
    items_count?: number;
}
export type AdminOccasion = Occasion;
export interface AdminProduct extends Product {
    is_available: boolean;
    category_id?: number;
    image_url?: string;
    images?: ProductImage[];
}
export interface AdminPanelInstance {
    productModal: {
        showEditProductModal(product: AdminProduct): void;
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
export interface OrdersFilters {
    status?: string;
    customer_email?: string;
    date_from?: string;
    date_to?: string;
}
export interface OrdersData {
    orders: AdminOrder[];
    pagination: {
        page: number;
        totalPages: number;
        total: number;
    };
}
export interface OrderDetails {
    id: number;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    total_amount_usd: number;
    total_amount_ves?: number;
    status: string;
    created_at: string;
    delivery_date?: string;
    delivery_address?: string;
    notes?: string;
    items: Array<{
        id: number;
        product_name: string;
        quantity: number;
        unit_price_usd: number;
        unit_price_ves?: number;
        subtotal_usd: number;
        subtotal_ves?: number;
    }>;
    payments?: Array<{
        id: number;
        amount_usd: number;
        amount_ves?: number;
        method: string;
        status: string;
        created_at: string;
    }>;
}
export interface DashboardMetrics {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
}
export interface AlertData {
    type: string;
    message: string;
}
export interface ActivityData {
    icon: string;
    description: string;
    time: string;
}
export interface AdminPanelLogger {
    log(message: string, level: 'info' | 'error' | 'success' | 'warn'): void;
}
export interface ProductOccasion {
    id: number;
    product_id: number;
    occasion_id: number;
    created_at?: string;
}
export interface RawProductWithImages extends Product {
    image_id?: number;
    image_url?: string;
    image_alt_text?: string;
    image_is_primary?: boolean;
    image_display_order?: number;
    product_images?: ProductImage[];
}
export interface RawCarouselProduct extends Product {
    primary_image_url?: string;
    thumb_image_url?: string;
    image_urls?: string;
}
export interface RawOrderWithItemsAndUser extends Order {
    user_full_name?: string;
    user_email?: string;
    item_id?: number;
    item_product_name?: string;
    item_quantity?: number;
    item_unit_price_usd?: number;
    order_items?: OrderItem[];
    users?: {
        id: number;
        full_name?: string;
        email: string;
    };
}
export interface RawOrderWithItemsPaymentsHistory extends Order {
    payment_id?: number;
    payment_amount_usd?: number;
    payment_status?: string;
    payment_method_name?: string;
    history_id?: number;
    history_status?: string;
    history_notes?: string;
    order_items?: OrderItem[];
    payments?: Payment[];
    order_status_history?: OrderStatusHistory[];
    users?: {
        id: number;
        full_name?: string;
        email: string;
    };
}
export interface RawOrderStatusHistoryWithUser extends OrderStatusHistory {
    user_full_name?: string;
}
export interface ProductCreateRequest {
    name: string;
    description?: string;
    price: number;
    price_usd: number;
    is_featured?: boolean;
    featured?: boolean;
    is_available?: boolean;
    active?: boolean;
    carousel_order?: number;
    category_id?: number;
    occasion_ids?: number[];
    stock?: number;
    sku?: string;
}
export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
    id: number;
}
export interface OccasionCreateRequest {
    name: string;
    slug: string;
    description?: string;
    color: string;
    type?: string;
    display_order?: number;
    is_active?: boolean;
}
export interface OccasionUpdateRequest extends Partial<OccasionCreateRequest> {
    id: number;
}
export interface OrderCreateRequest {
    user_id?: number;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    delivery_address?: string;
    delivery_date?: string;
    notes?: string;
    items: Array<{
        product_id: number;
        quantity: number;
        unit_price_usd: number;
        unit_price_ves?: number;
    }>;
}
export interface OrderUpdateRequest {
    id: number;
    status?: Order['status'];
    delivery_address?: string;
    delivery_date?: string;
    notes?: string;
}
export interface PaymentCreateRequest {
    order_id: number;
    payment_method_id: number;
    amount_usd: number;
    amount_ves?: number;
    transaction_reference?: string;
    payment_details?: PaymentDetailsObject;
}
export interface UserCreateRequest {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role?: User['role'];
    is_active?: boolean;
    email_verified?: boolean;
}
export interface UserUpdateRequest {
    id: number;
    email?: string;
    password?: string;
    full_name?: string;
    phone?: string;
    role?: User['role'];
    is_active?: boolean;
    email_verified?: boolean;
}
export interface UserResponse {
    id: number;
    email: string;
    full_name?: string;
    phone?: string;
    role: User['role'];
    is_active: boolean;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
}
export interface UserListResponse {
    users: UserResponse[];
    pagination?: PaginationInfo;
}
export interface ProductResponse {
    products: ProductWithImagesAndOccasions[];
    pagination?: PaginationInfo;
}
export interface CarouselResponse {
    products: CarouselProduct[];
    total_count?: number;
    carousel_products?: CarouselProduct[];
}
export interface OrderResponse {
    orders: OrderWithItems[];
    pagination?: PaginationInfo;
}
export interface Database {
    public: {
        Tables: {
            users: {
                Row: User;
                Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
            };
            products: {
                Row: Product;
                Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;
            };
            product_images: {
                Row: ProductImage;
                Insert: Omit<ProductImage, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<ProductImage, 'id' | 'created_at' | 'updated_at'>>;
            };
            occasions: {
                Row: Occasion;
                Insert: Omit<Occasion, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Occasion, 'id' | 'created_at' | 'updated_at'>>;
            };
            product_occasions: {
                Row: ProductOccasion;
                Insert: Omit<ProductOccasion, 'id' | 'created_at'>;
                Update: Partial<Omit<ProductOccasion, 'id' | 'created_at'>>;
            };
            orders: {
                Row: Order;
                Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>;
            };
            order_items: {
                Row: OrderItem;
                Insert: Omit<OrderItem, 'id' | 'created_at'>;
                Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>;
            };
            order_status_history: {
                Row: OrderStatusHistory;
                Insert: Omit<OrderStatusHistory, 'id' | 'created_at'>;
                Update: Partial<Omit<OrderStatusHistory, 'id' | 'created_at'>>;
            };
            payment_methods: {
                Row: PaymentMethod;
                Insert: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>>;
            };
            payments: {
                Row: Payment;
                Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at'>>;
            };
            settings: {
                Row: Setting;
                Insert: Omit<Setting, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Setting, 'id' | 'created_at' | 'updated_at'>>;
            };
        };
    };
}
export {};
