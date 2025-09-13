/**
 * FloresYa QueryBuilder - Modern Supabase Query Builder
 * Reescrito completamente para la nueva estructura de base de datos
 * Sin tabla 'categories' (reemplazada por 'occasions')
 * Compatible con el esquema actual: users, products, occasions, payment_methods, etc.
 */

// Esquema actual de la base de datos FloresYa
const FLORESYA_SCHEMA = {
    // Tablas base (sin dependencias)
    users: {
        columns: ['id', 'email', 'password_hash', 'full_name', 'phone', 'role', 'is_active', 'email_verified', 'created_at', 'updated_at'],
        pk: 'id'
    },
    occasions: {
        columns: ['id', 'name', 'type', 'description', 'is_active', 'display_order', 'created_at', 'updated_at'],
        pk: 'id'
    },
    products: {
        columns: ['id', 'name', 'summary', 'description', 'price_usd', 'price_ves', 'stock', 'occasion', 'sku', 'active', 'featured', 'created_at', 'updated_at'],
        pk: 'id'
    },
    payment_methods: {
        columns: ['id', 'name', 'type', 'description', 'account_info', 'is_active', 'display_order', 'created_at', 'updated_at'],
        pk: 'id'
    },
    carousel_images: {
        columns: ['id', 'title', 'image_url', 'link_url', 'alt_text', 'display_order', 'is_active', 'created_at', 'updated_at'],
        pk: 'id'
    },
    settings: {
        columns: ['id', 'key', 'value', 'description', 'type', 'is_public', 'created_at', 'updated_at'],
        pk: 'id'
    },
    
    // Tablas con dependencias
    orders: {
        columns: ['id', 'user_id', 'customer_email', 'customer_name', 'customer_phone', 'delivery_address', 'delivery_city', 'delivery_state', 'delivery_zip', 'delivery_date', 'delivery_time_slot', 'delivery_notes', 'status', 'total_amount_usd', 'total_amount_ves', 'currency_rate', 'notes', 'admin_notes', 'created_at', 'updated_at'],
        pk: 'id',
        relations: { user_id: 'users' }
    },
    order_items: {
        columns: ['id', 'order_id', 'product_id', 'product_name', 'product_summary', 'unit_price_usd', 'unit_price_ves', 'quantity', 'subtotal_usd', 'subtotal_ves', 'created_at', 'updated_at'],
        pk: 'id',
        relations: { order_id: 'orders', product_id: 'products' }
    },
    payments: {
        columns: ['id', 'order_id', 'payment_method_id', 'user_id', 'amount_usd', 'amount_ves', 'currency_rate', 'status', 'payment_method_name', 'transaction_id', 'reference_number', 'payment_details', 'receipt_image_url', 'admin_notes', 'payment_date', 'confirmed_date', 'created_at', 'updated_at'],
        pk: 'id',
        relations: { order_id: 'orders', payment_method_id: 'payment_methods', user_id: 'users' }
    },
    product_occasions: {
        columns: ['id', 'product_id', 'occasion_id', 'created_at', 'updated_at'],
        pk: 'id',
        relations: { product_id: 'products', occasion_id: 'occasions' }
    }
};

/**
 * Clase QueryBuilder moderna para Supabase
 */
class SupabaseQueryBuilder {
    constructor(supabaseClient, tableName) {
        this.client = supabaseClient;
        this.table = tableName;
        this.query = null;
        this.reset();
    }

    /**
     * Reinicia el query builder
     */
    reset() {
        this.query = this.client.from(this.table);
        return this;
    }

    /**
     * Select campos específicos
     */
    select(fields = '*') {
        if (Array.isArray(fields)) {
            fields = fields.join(', ');
        }
        this.query = this.query.select(fields);
        return this;
    }

    /**
     * Filtro de igualdad
     */
    eq(column, value) {
        this.query = this.query.eq(column, value);
        return this;
    }

    /**
     * Filtro diferente de
     */
    neq(column, value) {
        this.query = this.query.neq(column, value);
        return this;
    }

    /**
     * Filtro mayor que
     */
    gt(column, value) {
        this.query = this.query.gt(column, value);
        return this;
    }

    /**
     * Filtro menor que
     */
    lt(column, value) {
        this.query = this.query.lt(column, value);
        return this;
    }

    /**
     * Filtro mayor o igual que
     */
    gte(column, value) {
        this.query = this.query.gte(column, value);
        return this;
    }

    /**
     * Filtro menor o igual que
     */
    lte(column, value) {
        this.query = this.query.lte(column, value);
        return this;
    }

    /**
     * Filtro LIKE para búsqueda de texto
     */
    like(column, pattern) {
        this.query = this.query.like(column, pattern);
        return this;
    }

    /**
     * Filtro ILIKE (case insensitive)
     */
    ilike(column, pattern) {
        this.query = this.query.ilike(column, pattern);
        return this;
    }

    /**
     * Filtro IN (valor en array)
     */
    in(column, values) {
        this.query = this.query.in(column, values);
        return this;
    }

    /**
     * Filtro IS NULL
     */
    isNull(column) {
        this.query = this.query.is(column, null);
        return this;
    }

    /**
     * Filtro IS NOT NULL
     */
    isNotNull(column) {
        this.query = this.query.not(column, 'is', null);
        return this;
    }

    /**
     * Ordenar resultados
     */
    orderBy(column, options = {}) {
        const { ascending = true, nullsFirst = false } = options;
        this.query = this.query.order(column, { ascending, nullsFirst });
        return this;
    }

    /**
     * Limitar resultados
     */
    limit(count) {
        this.query = this.query.limit(count);
        return this;
    }

    /**
     * Offset/Skip resultados
     */
    offset(count) {
        this.query = this.query.range(count, count + 999); // Supabase usa range
        return this;
    }

    /**
     * Range específico
     */
    range(from, to) {
        this.query = this.query.range(from, to);
        return this;
    }

    /**
     * Single result
     */
    single() {
        this.query = this.query.single();
        return this;
    }

    /**
     * Maybe single (puede devolver null sin error)
     */
    maybeSingle() {
        this.query = this.query.maybeSingle();
        return this;
    }

    /**
     * Ejecutar query
     */
    async execute() {
        try {
            const result = await this.query;
            return {
                success: !result.error,
                data: result.data,
                error: result.error,
                count: result.count
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error,
                count: 0
            };
        }
    }

    /**
     * Insert data
     */
    async insert(data) {
        try {
            const result = await this.client
                .from(this.table)
                .insert(data)
                .select();
            
            return {
                success: !result.error,
                data: result.data,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error
            };
        }
    }

    /**
     * Update data
     */
    async update(data, filters = {}) {
        try {
            let query = this.client
                .from(this.table)
                .update(data);

            // Aplicar filtros
            Object.entries(filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            const result = await query.select();
            
            return {
                success: !result.error,
                data: result.data,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error
            };
        }
    }

    /**
     * Delete data
     */
    async delete(filters = {}) {
        try {
            let query = this.client
                .from(this.table)
                .delete();

            // Aplicar filtros
            Object.entries(filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            const result = await query.select();
            
            return {
                success: !result.error,
                data: result.data,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error
            };
        }
    }
}

/**
 * Factory para crear QueryBuilders
 */
export function createQueryBuilder(supabaseClient, tableName) {
    // Validar que la tabla existe en nuestro esquema
    if (!FLORESYA_SCHEMA[tableName]) {
        throw new Error(`Tabla '${tableName}' no existe en el esquema FloresYa. Tablas disponibles: ${Object.keys(FLORESYA_SCHEMA).join(', ')}`);
    }
    
    return new SupabaseQueryBuilder(supabaseClient, tableName);
}

/**
 * API tipo Prisma para compatibilidad con código existente
 */
export function createPrismaLikeAPI(supabaseClient) {
    return {
        // Usuarios
        user: {
            findMany: async (options = {}) => {
                const qb = createQueryBuilder(supabaseClient, 'users');
                
                if (options.where) {
                    Object.entries(options.where).forEach(([key, value]) => {
                        qb.eq(key, value);
                    });
                }
                
                if (options.orderBy) {
                    const [[column, direction]] = Object.entries(options.orderBy);
                    qb.orderBy(column, { ascending: direction === 'asc' });
                }
                
                if (options.take) qb.limit(options.take);
                if (options.skip) qb.offset(options.skip);
                
                const result = await qb.execute();
                return result.data || [];
            },

            findUnique: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'users');
                
                Object.entries(options.where).forEach(([key, value]) => {
                    qb.eq(key, value);
                });
                
                const result = await qb.maybeSingle().execute();
                return result.data;
            },

            create: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'users');
                const result = await qb.insert(options.data);
                return result.data?.[0];
            },

            update: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'users');
                const result = await qb.update(options.data, options.where);
                return result.data?.[0];
            },

            delete: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'users');
                const result = await qb.delete(options.where);
                return result.data?.[0];
            }
        },

        // Productos
        product: {
            findMany: async (options = {}) => {
                const qb = createQueryBuilder(supabaseClient, 'products');
                
                if (options.where) {
                    Object.entries(options.where).forEach(([key, value]) => {
                        qb.eq(key, value);
                    });
                }
                
                if (options.orderBy) {
                    const [[column, direction]] = Object.entries(options.orderBy);
                    qb.orderBy(column, { ascending: direction === 'asc' });
                }
                
                if (options.take) qb.limit(options.take);
                if (options.skip) qb.offset(options.skip);
                
                const result = await qb.execute();
                return result.data || [];
            },

            findUnique: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'products');
                
                Object.entries(options.where).forEach(([key, value]) => {
                    qb.eq(key, value);
                });
                
                const result = await qb.maybeSingle().execute();
                return result.data;
            },

            create: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'products');
                const result = await qb.insert(options.data);
                return result.data?.[0];
            },

            update: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'products');
                const result = await qb.update(options.data, options.where);
                return result.data?.[0];
            },

            delete: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'products');
                const result = await qb.delete(options.where);
                return result.data?.[0];
            }
        },

        // Ocasiones (reemplaza categories)
        occasion: {
            findMany: async (options = {}) => {
                const qb = createQueryBuilder(supabaseClient, 'occasions');
                
                if (options.where) {
                    Object.entries(options.where).forEach(([key, value]) => {
                        qb.eq(key, value);
                    });
                }
                
                if (options.orderBy) {
                    const [[column, direction]] = Object.entries(options.orderBy);
                    qb.orderBy(column, { ascending: direction === 'asc' });
                }
                
                if (options.take) qb.limit(options.take);
                if (options.skip) qb.offset(options.skip);
                
                const result = await qb.execute();
                return result.data || [];
            },

            findUnique: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'occasions');
                
                Object.entries(options.where).forEach(([key, value]) => {
                    qb.eq(key, value);
                });
                
                const result = await qb.maybeSingle().execute();
                return result.data;
            },

            create: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'occasions');
                const result = await qb.insert(options.data);
                return result.data?.[0];
            }
        },

        // Métodos de pago
        paymentMethod: {
            findMany: async (options = {}) => {
                const qb = createQueryBuilder(supabaseClient, 'payment_methods');
                
                if (options.where) {
                    Object.entries(options.where).forEach(([key, value]) => {
                        qb.eq(key, value);
                    });
                }
                
                if (options.orderBy) {
                    const [[column, direction]] = Object.entries(options.orderBy);
                    qb.orderBy(column, { ascending: direction === 'asc' });
                }
                
                const result = await qb.execute();
                return result.data || [];
            }
        },

        // Carrusel
        carouselImage: {
            findMany: async (options = {}) => {
                const qb = createQueryBuilder(supabaseClient, 'carousel_images');
                
                if (options.where) {
                    Object.entries(options.where).forEach(([key, value]) => {
                        qb.eq(key, value);
                    });
                }
                
                if (options.orderBy) {
                    const [[column, direction]] = Object.entries(options.orderBy);
                    qb.orderBy(column, { ascending: direction === 'asc' });
                }
                
                const result = await qb.execute();
                return result.data || [];
            }
        },

        // Settings
        setting: {
            findUnique: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'settings');
                
                Object.entries(options.where).forEach(([key, value]) => {
                    qb.eq(key, value);
                });
                
                const result = await qb.maybeSingle().execute();
                return result.data;
            },

            findMany: async (options = {}) => {
                const qb = createQueryBuilder(supabaseClient, 'settings');
                
                if (options.where) {
                    Object.entries(options.where).forEach(([key, value]) => {
                        qb.eq(key, value);
                    });
                }
                
                const result = await qb.execute();
                return result.data || [];
            }
        },

        // Pedidos
        order: {
            findMany: async (options = {}) => {
                const qb = createQueryBuilder(supabaseClient, 'orders');
                
                if (options.where) {
                    Object.entries(options.where).forEach(([key, value]) => {
                        qb.eq(key, value);
                    });
                }
                
                if (options.orderBy) {
                    const [[column, direction]] = Object.entries(options.orderBy);
                    qb.orderBy(column, { ascending: direction === 'asc' });
                }
                
                if (options.take) qb.limit(options.take);
                
                const result = await qb.execute();
                return result.data || [];
            },

            create: async (options) => {
                const qb = createQueryBuilder(supabaseClient, 'orders');
                const result = await qb.insert(options.data);
                return result.data?.[0];
            }
        }
    };
}

export default {
    createQueryBuilder,
    createPrismaLikeAPI,
    FLORESYA_SCHEMA
};