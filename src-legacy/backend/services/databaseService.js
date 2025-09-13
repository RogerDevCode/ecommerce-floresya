/**
 * 🗄️ DATABASE SERVICE - CONEXIÓN ESTÁNDAR PARA TODA LA APLICACIÓN
 * Servicio unificado para conexión a Supabase PostgreSQL
 * Usado por: API, Testing, Scripts de migración
 */

import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

class DatabaseService {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.connectionConfig = null;
        this.init();
    }

    init() {
        // Validar variables de entorno requeridas
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            throw new Error('❌ SUPABASE_URL y SUPABASE_ANON_KEY son requeridos en .env');
        }

        this.connectionConfig = {
            url: process.env.SUPABASE_URL,
            anonKey: process.env.SUPABASE_ANON_KEY,
            serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || null
        };

        // Crear cliente Supabase
        this.supabase = createClient(
            this.connectionConfig.url, 
            this.connectionConfig.anonKey,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            }
        );

        console.log('🚀 DatabaseService initialized with Supabase');
    }

    // Test de conexión
    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('count', { count: 'exact', head: true });

            if (error) {
                console.error('❌ Database connection test failed:', error);
                this.isConnected = false;
                return false;
            }

            this.isConnected = true;
            console.log('✅ Database connection test successful');
            return true;
        } catch (error) {
            console.error('❌ Database connection error:', error);
            this.isConnected = false;
            return false;
        }
    }

    // Obtener cliente Supabase
    getClient() {
        if (!this.supabase) {
            throw new Error('❌ DatabaseService not initialized');
        }
        return this.supabase;
    }

    // Query genérico usando el nuevo QueryBuilder moderno
    async query(tableName, options = {}) {
        try {
            const { createQueryBuilder } = await import('./queryBuilder.js');
            const client = this.getClient();
            const qb = createQueryBuilder(client, tableName);
            
            // Aplicar select
            if (options.select) {
                qb.select(options.select);
            }
            
            // Aplicar filtros eq
            if (options.eq) {
                Object.entries(options.eq).forEach(([key, value]) => {
                    qb.eq(key, value);
                });
            }
            
            // Aplicar limit
            if (options.limit) {
                qb.limit(options.limit);
            }
            
            // Aplicar orden
            if (options.order) {
                qb.orderBy(options.order.column, { ascending: options.order.ascending !== false });
            }
            
            // Ejecutar query
            const result = await qb.execute();
            
            if (!result.success) {
                throw new Error(`Database query error: ${result.error?.message || 'Unknown error'}`);
            }
            
            return { data: result.data, count: result.count };
            
        } catch (error) {
            throw new Error(`Database query error: ${error.message}`);
        }
    }

    // Método para obtener el QueryBuilder directamente
    async getQueryBuilder(tableName) {
        const { createQueryBuilder } = await import('./queryBuilder.js');
        return createQueryBuilder(this.getClient(), tableName);
    }

    // Método para obtener la API tipo Prisma
    async getPrismaAPI() {
        const { createPrismaLikeAPI } = await import('./queryBuilder.js');
        return createPrismaLikeAPI(this.getClient());
    }

    // Contar registros en una tabla
    async count(tableName, whereConditions = {}) {
        const client = this.getClient();
        let query = client.from(tableName).select('*', { count: 'exact', head: true });

        Object.entries(whereConditions).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        const { count, error } = await query;

        if (error) {
            throw new Error(`Count query error: ${error.message}`);
        }

        return count || 0;
    }

    // Insertar datos
    async insert(tableName, data) {
        const client = this.getClient();
        const { data: result, error } = await client
            .from(tableName)
            .insert(data)
            .select();

        if (error) {
            throw new Error(`Insert error: ${error.message}`);
        }

        return result;
    }

    // Actualizar datos
    async update(tableName, updateData, whereConditions) {
        const client = this.getClient();
        let query = client.from(tableName).update(updateData);

        Object.entries(whereConditions).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        const { data, error } = await query.select();

        if (error) {
            throw new Error(`Update error: ${error.message}`);
        }

        return data;
    }

    // Eliminar datos
    async delete(tableName, whereConditions) {
        const client = this.getClient();
        let query = client.from(tableName).delete();

        Object.entries(whereConditions).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        const { error } = await query;

        if (error) {
            throw new Error(`Delete error: ${error.message}`);
        }

        return true;
    }

    // Ejecutar función RPC
    async rpc(functionName, params = {}) {
        const client = this.getClient();
        const { data, error } = await client.rpc(functionName, params);

        if (error) {
            throw new Error(`RPC error: ${error.message}`);
        }

        return data;
    }

    // Obtener estadísticas de la base de datos
    async getStats() {
        const stats = {};
        const tables = ['products', 'product_images', 'occasions', 'orders'];

        for (const table of tables) {
            try {
                stats[table] = await this.count(table);
            } catch (error) {
                stats[table] = `Error: ${error.message}`;
            }
        }

        return stats;
    }

    // Verificar integridad de datos
    async verifyDataIntegrity() {
        const issues = [];

        try {
            // Verificar productos sin imágenes
            const { data: productsWithoutImages } = await this.query('products', {
                select: `
                    id, name,
                    images:product_images(id)
                `,
                eq: { active: true }
            });

            const orphanProducts = productsWithoutImages.filter(p => !p.images || p.images.length === 0);
            if (orphanProducts.length > 0) {
                issues.push({
                    type: 'orphan_products',
                    count: orphanProducts.length,
                    message: `${orphanProducts.length} productos activos sin imágenes`
                });
            }

            // Verificar imágenes huérfanas
            const { data: orphanImages } = await this.getClient()
                .from('product_images')
                .select('id, product_id')
                .not('product_id', 'in', '(SELECT id FROM products WHERE active = true)');

            if (orphanImages && orphanImages.length > 0) {
                issues.push({
                    type: 'orphan_images',
                    count: orphanImages.length,
                    message: `${orphanImages.length} imágenes sin producto válido`
                });
            }

            // Verificar hashes SHA256
            const { data: invalidHashes } = await this.query('product_images', {
                select: 'id, file_hash, original_filename'
            });

            const badHashes = invalidHashes.filter(img => !img.file_hash || img.file_hash.length !== 64);
            if (badHashes.length > 0) {
                issues.push({
                    type: 'invalid_hashes',
                    count: badHashes.length,
                    message: `${badHashes.length} imágenes con hash SHA256 inválido`
                });
            }

        } catch (error) {
            issues.push({
                type: 'integrity_check_error',
                message: `Error verificando integridad: ${error.message}`
            });
        }

        return issues;
    }
}

// Singleton instance
const databaseService = new DatabaseService();

export {
    DatabaseService,
    databaseService,
    // Export directo del cliente para compatibilidad
    databaseService as supabase
};

// Export default for convenience
export default databaseService;