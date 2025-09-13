/**
 * 🗄️ DATABASE SERVICE - CONEXIÓN ESTÁNDAR PARA TODA LA APLICACIÓN
 * Servicio unificado para conexión a Supabase PostgreSQL
 * Usado por: API, Testing, Scripts de migración
 * 
 * MIGRADO A TYPESCRIPT ✨
 */

import { config } from 'dotenv';
config();
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseService as DatabaseServiceInterface, DatabaseConfig, QueryOptions } from '../../../types/services.js';

interface ConnectionConfig {
    url: string;
    anonKey: string;
    serviceKey?: string | null;
}

class DatabaseService implements DatabaseServiceInterface {
    private supabase: SupabaseClient | null = null;
    private isConnected: boolean = false;
    private connectionConfig: ConnectionConfig | null = null;

    constructor() {
        this.init();
    }

    private init(): void {
        // Validar variables de entorno requeridas
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            throw new Error('❌ SUPABASE_URL y SUPABASE_ANON_KEY son requeridos en .env');
        }

        this.connectionConfig = {
            url: process.env.SUPABASE_URL,
            anonKey: process.env.SUPABASE_ANON_KEY,
            serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || null
        };

        try {
            // Usar service key si está disponible, sino usar anon key
            const keyToUse = this.connectionConfig.serviceKey || this.connectionConfig.anonKey;
            
            this.supabase = createClient(this.connectionConfig.url, keyToUse, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });

            this.isConnected = true;
            console.log('🚀 DatabaseService initialized with Supabase');
        } catch (error) {
            console.error('❌ Error inicializando DatabaseService:', error);
            throw error;
        }
    }

    /**
     * Obtener cliente Supabase configurado
     */
    getClient(): SupabaseClient {
        if (!this.supabase) {
            throw new Error('❌ Supabase client not initialized');
        }
        return this.supabase;
    }

    /**
     * Query genérico con opciones tipo Prisma (simplificado)
     */
    async query(table: string, options: QueryOptions = {}): Promise<{ data: any[]; error: any }> {
        if (!this.supabase) {
            throw new Error('❌ Database not initialized');
        }

        try {
            // Usar any para simplificar el tipado por ahora
            let query: any = this.supabase.from(table);

            // SELECT
            if (options.select) {
                query = query.select(options.select);
            } else {
                query = query.select('*');
            }

            // WHERE clauses
            if (options.eq) {
                Object.entries(options.eq).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }

            if (options.neq) {
                Object.entries(options.neq).forEach(([key, value]) => {
                    query = query.neq(key, value);
                });
            }

            if (options.gt) {
                Object.entries(options.gt).forEach(([key, value]) => {
                    query = query.gt(key, value);
                });
            }

            if (options.gte) {
                Object.entries(options.gte).forEach(([key, value]) => {
                    query = query.gte(key, value);
                });
            }

            if (options.lt) {
                Object.entries(options.lt).forEach(([key, value]) => {
                    query = query.lt(key, value);
                });
            }

            if (options.lte) {
                Object.entries(options.lte).forEach(([key, value]) => {
                    query = query.lte(key, value);
                });
            }

            if (options.like) {
                Object.entries(options.like).forEach(([key, value]) => {
                    query = query.like(key, value as string);
                });
            }

            if (options.ilike) {
                Object.entries(options.ilike).forEach(([key, value]) => {
                    query = query.ilike(key, value as string);
                });
            }

            if (options.in) {
                Object.entries(options.in).forEach(([key, value]) => {
                    query = query.in(key, value);
                });
            }

            // ORDER BY
            if (options.order) {
                query = query.order(options.order.column, { 
                    ascending: options.order.ascending 
                });
            }

            // LIMIT y OFFSET
            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.offset) {
                const limit = options.limit || 1000;
                const endRange = options.offset + limit - 1;
                query = query.range(options.offset, endRange);
            }

            const result = await query;
            return { data: result.data || [], error: result.error };
        } catch (error) {
            console.error(`❌ Error in database query for table ${table}:`, error);
            return { data: [], error };
        }
    }

    /**
     * Insertar datos
     */
    async insert(table: string, data: Record<string, any>): Promise<{ data: any; error: any }> {
        if (!this.supabase) {
            throw new Error('❌ Database not initialized');
        }

        try {
            const result = await this.supabase
                .from(table)
                .insert(data)
                .select()
                .single();

            return { data: result.data, error: result.error };
        } catch (error) {
            console.error(`❌ Error inserting into ${table}:`, error);
            return { data: null, error };
        }
    }

    /**
     * Actualizar datos
     */
    async update(
        table: string, 
        data: Record<string, any>, 
        where: Record<string, any>
    ): Promise<{ data: any; error: any }> {
        if (!this.supabase) {
            throw new Error('❌ Database not initialized');
        }

        try {
            let query: any = this.supabase.from(table).update(data);

            // Aplicar condiciones WHERE
            Object.entries(where).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            const result = await query.select();
            return { data: result.data, error: result.error };
        } catch (error) {
            console.error(`❌ Error updating ${table}:`, error);
            return { data: null, error };
        }
    }

    /**
     * Eliminar datos
     */
    async delete(table: string, where: Record<string, any>): Promise<{ error: any }> {
        if (!this.supabase) {
            throw new Error('❌ Database not initialized');
        }

        try {
            let query: any = this.supabase.from(table).delete();

            // Aplicar condiciones WHERE
            Object.entries(where).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            const result = await query;
            return { error: result.error };
        } catch (error) {
            console.error(`❌ Error deleting from ${table}:`, error);
            return { error };
        }
    }

    /**
     * Contar registros
     */
    async count(table: string, where: Record<string, any> = {}): Promise<number> {
        if (!this.supabase) {
            throw new Error('❌ Database not initialized');
        }

        try {
            let query: any = this.supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            // Aplicar condiciones WHERE
            Object.entries(where).forEach(([key, value]) => {
                query = query.eq(key, value);
            });

            const result = await query;
            return result.count || 0;
        } catch (error) {
            console.error(`❌ Error counting ${table}:`, error);
            return 0;
        }
    }

    /**
     * Verificar conexión
     */
    async testConnection(): Promise<boolean> {
        try {
            if (!this.supabase) {
                return false;
            }

            const { data, error } = await this.supabase
                .from('occasions')
                .select('count')
                .limit(1);

            return !error;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }

    /**
     * Obtener información de la conexión
     */
    getConnectionInfo(): { isConnected: boolean; config: ConnectionConfig | null } {
        return {
            isConnected: this.isConnected,
            config: this.connectionConfig
        };
    }
}

// Exportar instancia singleton
export const databaseService = new DatabaseService();
export default databaseService;