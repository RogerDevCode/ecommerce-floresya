/**
 * 🌸 FloresYa Schema Extractor - Enterprise Edition
 * Herramienta profesional para extraer y actualizar el esquema de Supabase
 *
 * Uso:
 * - Desde línea de comandos: npx ts-node /home/manager/Sync/ecommerce-floresya/src/utils/schema-extractor.ts
 * - Desde panel admin: API endpoint /api/admin/schema
 * - Actualización automática: npm run schema:update
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { supabaseService } from '../config/supabase.js';

// Configuración del extractor
interface ExtractorConfig {
  outputFile: string;
  includeData: boolean;
  includeFunctions: boolean;
  includeIndexes: boolean;
  includeTriggers: boolean;
  includeViews: boolean;
  includeSeeds: boolean;
}

// Información de tabla extraída
interface TableInfo {
  name: string;
  recordCount: number;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
  sampleData?: Record<string, unknown>[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: string;
}

interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  condition?: string;
}

interface ConstraintInfo {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  definition: string;
}

interface SchemaStats {
  totalTables: number;
  totalRecords: number;
  totalIndexes: number;
  totalConstraints: number;
  extractionDate: string;
  version: string;
}

class SupabaseSchemaExtractor {
  private config: ExtractorConfig;
  private stats: SchemaStats;

  constructor(config: Partial<ExtractorConfig> = {}) {
    this.config = {
      outputFile: 'supabase_schema.sql',
      includeData: true,
      includeFunctions: true,
      includeIndexes: true,
      includeTriggers: true,
      includeViews: true,
      includeSeeds: true,
      ...config
    };

    this.stats = {
      totalTables: 0,
      totalRecords: 0,
      totalIndexes: 0,
      totalConstraints: 0,
      extractionDate: new Date().toISOString(),
      version: '2.0.0'
    };
  }

  /**
   * Método principal para extraer el esquema completo
   */
  public async extractSchema(): Promise<{
    success: boolean;
    schema?: string;
    stats?: SchemaStats;
    error?: string;
  }> {
    try {
      console.warn('🌸 FloresYa Schema Extractor - Iniciando extracción...');

      // Verificar conexión
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('No se pudo conectar a Supabase');
      }

      // Extraer información de tablas
      const tablesInfo = await this.extractTablesInfo();

      // Generar SQL schema
      const schemaSQL = this.generateSchemaSQL(tablesInfo);

      // Guardar archivo si se especifica
      if (this.config.outputFile) {
        this.saveSchemaToFile(schemaSQL);
      }

      console.warn('✅ Extracción completada exitosamente');
      console.warn(`📊 Estadísticas:`, this.stats);

      return {
        success: true,
        schema: schemaSQL,
        stats: this.stats
      };

    } catch (error) {
      console.error('❌ Error durante la extracción:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Prueba de conexión a Supabase
   */
  private async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabaseService.from('products').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Extrae información de todas las tablas conocidas
   */
  private async extractTablesInfo(): Promise<TableInfo[]> {
    const knownTables = [
      'users',
      'products',
      'product_images',
      'occasions',
      'product_occasions',
      'orders',
      'order_items',
      'payments',
      'settings'
    ];

    const tablesInfo: TableInfo[] = [];

    for (const tableName of knownTables) {
      console.warn(`🔍 Analizando tabla: ${tableName}`);

      try {
        const tableInfo = await this.extractTableInfo(tableName);
        tablesInfo.push(tableInfo);
        this.stats.totalRecords += tableInfo.recordCount;
        this.stats.totalIndexes += tableInfo.indexes.length;
        this.stats.totalConstraints += tableInfo.constraints.length;
      } catch (error) {
        console.warn(`⚠️  Error al analizar tabla ${tableName}:`, error);
      }
    }

    this.stats.totalTables = tablesInfo.length;
    return tablesInfo;
  }

  /**
   * Extrae información detallada de una tabla específica
   */
  private async extractTableInfo(tableName: string): Promise<TableInfo> {
    // Obtener conteo de registros
    const { count } = await supabaseService
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    // Obtener muestra de datos para inferir estructura
    const { data: sampleData } = await supabaseService
      .from(tableName)
      .select('*')
      .limit(3);

    // Inferir columnas desde los datos de muestra
    const columns = this.inferColumnsFromData(sampleData ?? [], tableName);

    // Generar índices basados en conocimiento del esquema
    const indexes = this.generateKnownIndexes(tableName);

    // Generar constraints basadas en conocimiento del esquema
    const constraints = this.generateKnownConstraints(tableName);

    return {
      name: tableName,
      recordCount: count ?? 0,
      columns,
      indexes,
      constraints,
      sampleData: sampleData?.slice(0, 2) // Solo primeros 2 registros como muestra
    };
  }

  /**
   * Infiere columnas desde datos de muestra
   */
  private inferColumnsFromData(data: Record<string, unknown>[], tableName: string): ColumnInfo[] {
    if (data.length === 0) {
      return this.getKnownTableColumns(tableName);
    }

    const firstRecord = data[0];
    if (!firstRecord) {
      return this.getKnownTableColumns(tableName);
    }

    const columns: ColumnInfo[] = [];

    for (const [columnName, value] of Object.entries(firstRecord)) {
      const column: ColumnInfo = {
        name: columnName,
        type: this.inferColumnType(value, columnName),
        nullable: value === null,
        isPrimaryKey: columnName === 'id',
        isForeignKey: columnName.endsWith('_id') && columnName !== 'id',
        references: columnName.endsWith('_id') && columnName !== 'id'
          ? this.inferForeignKeyReference(columnName)
          : undefined
      };

      columns.push(column);
    }

    return columns.sort((a, b) => {
      if (a.isPrimaryKey) {return -1;}
      if (b.isPrimaryKey) {return 1;}
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Infiere el tipo de columna basado en el valor
   */
  private inferColumnType(value: unknown, columnName: string): string {
    if (columnName === 'id') {return 'SERIAL PRIMARY KEY';}
    if (columnName.includes('_at')) {return 'TIMESTAMPTZ DEFAULT NOW()';}
    if (columnName.includes('price_usd')) {return 'DECIMAL(10,2)';}
    if (columnName.includes('price_ves') || columnName.includes('amount_ves')) {return 'DECIMAL(15,2)';}
    if (columnName === 'email') {return 'VARCHAR(255) UNIQUE';}
    if (columnName.includes('password')) {return 'VARCHAR(255)';}
    if (columnName.includes('phone')) {return 'VARCHAR(50)';}
    if (columnName === 'stock' || columnName === 'quantity') {return 'INTEGER DEFAULT 0';}
    if (columnName.includes('active') || columnName.includes('is_') || columnName.includes('featured')) {return 'BOOLEAN DEFAULT';}

    if (typeof value === 'string') {
      if (value.length > 255) {return 'TEXT';}
      return 'VARCHAR(255)';
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL(10,2)';
    }
    if (typeof value === 'boolean') {return 'BOOLEAN';}
    if (value instanceof Date || typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return 'TIMESTAMPTZ';
    }

    return 'TEXT';
  }

  /**
   * Infiere referencia de clave foránea
   */
  private inferForeignKeyReference(columnName: string): string {
    const tableMap: { [key: string]: string } = {
      'user_id': 'users(id)',
      'product_id': 'products(id)',
      'order_id': 'orders(id)',
      'occasion_id': 'occasions(id)',
      'payment_method_id': 'payment_methods(id)'
    };

    return tableMap[columnName] ?? '';
  }

  /**
   * Obtiene columnas conocidas para tabla específica
   */
  private getKnownTableColumns(tableName: string): ColumnInfo[] {
    const knownSchemas: { [key: string]: ColumnInfo[] } = {
      'users': [
        { name: 'id', type: 'SERIAL PRIMARY KEY', nullable: false, isPrimaryKey: true, isForeignKey: false },
        { name: 'email', type: 'VARCHAR(255) UNIQUE NOT NULL', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'password_hash', type: 'VARCHAR(255) NOT NULL', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'full_name', type: 'VARCHAR(255)', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'phone', type: 'VARCHAR(50)', nullable: true, isPrimaryKey: false, isForeignKey: false },
        { name: 'role', type: 'user_role DEFAULT \'user\' NOT NULL', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'is_active', type: 'BOOLEAN DEFAULT true NOT NULL', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'email_verified', type: 'BOOLEAN DEFAULT false NOT NULL', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT NOW() NOT NULL', nullable: false, isPrimaryKey: false, isForeignKey: false },
        { name: 'updated_at', type: 'TIMESTAMPTZ DEFAULT NOW() NOT NULL', nullable: false, isPrimaryKey: false, isForeignKey: false }
      ]
    };

    return knownSchemas[tableName] ?? [];
  }

  /**
   * Genera índices conocidos para tabla específica
   */
  private generateKnownIndexes(tableName: string): IndexInfo[] {
    const knownIndexes: { [key: string]: IndexInfo[] } = {
      'users': [
        { name: 'idx_users_email', columns: ['email'], isUnique: true },
        { name: 'idx_users_role', columns: ['role'], isUnique: false },
        { name: 'idx_users_active', columns: ['is_active'], isUnique: false }
      ],
      'products': [
        { name: 'idx_products_active', columns: ['active'], isUnique: false },
        { name: 'idx_products_featured', columns: ['featured'], isUnique: false },
        { name: 'idx_products_carousel', columns: ['carousel_order'], isUnique: false, condition: 'WHERE carousel_order IS NOT NULL' },
        { name: 'idx_products_sku', columns: ['sku'], isUnique: false, condition: 'WHERE sku IS NOT NULL' },
        { name: 'idx_products_price', columns: ['price_usd'], isUnique: false }
      ],
      'orders': [
        { name: 'idx_orders_user_id', columns: ['user_id'], isUnique: false },
        { name: 'idx_orders_status', columns: ['status'], isUnique: false },
        { name: 'idx_orders_delivery_date', columns: ['delivery_date'], isUnique: false },
        { name: 'idx_orders_created_at', columns: ['created_at'], isUnique: false }
      ]
    };

    return knownIndexes[tableName] ?? [];
  }

  /**
   * Genera constraints conocidas para tabla específica
   */
  private generateKnownConstraints(tableName: string): ConstraintInfo[] {
    const knownConstraints: { [key: string]: ConstraintInfo[] } = {
      'products': [
        { name: 'check_products_price_positive', type: 'CHECK', definition: 'CHECK (price_usd > 0)' },
        { name: 'check_products_stock_non_negative', type: 'CHECK', definition: 'CHECK (stock >= 0)' }
      ],
      'orders': [
        { name: 'check_orders_total_positive', type: 'CHECK', definition: 'CHECK (total_amount_usd > 0)' }
      ],
      'users': [
        { name: 'check_users_email_format', type: 'CHECK', definition: 'CHECK (email ~* \'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$\')' }
      ]
    };

    return knownConstraints[tableName] ?? [];
  }

  /**
   * Genera el SQL schema completo
   */
  private generateSchemaSQL(tablesInfo: TableInfo[]): string {
    let sql = this.generateHeader();

    if (this.config.includeData) {
      sql += this.generateEnumTypes();
    }

    // Generar tablas
    for (const table of tablesInfo) {
      sql += this.generateTableSQL(table);
    }

    if (this.config.includeIndexes) {
      sql += this.generateIndexesSQL(tablesInfo);
    }

    if (this.config.includeTriggers) {
      sql += this.generateTriggersSQL();
    }

    if (this.config.includeFunctions) {
      sql += this.generateFunctionsSQL();
    }

    if (this.config.includeViews) {
      sql += this.generateViewsSQL();
    }

    if (this.config.includeSeeds) {
      sql += this.generateSeedsSQL();
    }

    sql += this.generateFooter();

    return sql;
  }

  /**
   * Genera encabezado del archivo SQL
   */
  private generateHeader(): string {
    const date = new Date().toISOString().split('T')[0];
    return `-- =============================================================================
-- 🌸 FLORESYA E-COMMERCE DATABASE SCHEMA - ACTUALIZADO DESDE SUPABASE
-- =============================================================================
-- Schema actualizado basado en la estructura real de la base de datos
-- Extracción realizada en: ${date}
-- Tablas confirmadas: ${this.stats.totalTables}
-- Total de registros: ${this.stats.totalRecords}
-- Versión: ${this.stats.version}
-- =============================================================================

`;
  }

  /**
   * Genera tipos enum
   */
  private generateEnumTypes(): string {
    return `-- =============================================================================
-- ENUM TYPES (Tipos Personalizados)
-- =============================================================================

-- Tipos de ocasiones para productos florales
-- CREATE TYPE occasion_type AS ENUM (
--     'general',          -- Sin ocasión específica
--     'birthday',         -- Cumpleaños
--     'anniversary',      -- Aniversario
--     'wedding',          -- Boda
--     'sympathy',         -- Pésame
--     'congratulations'   -- Felicitaciones
-- ); -- REMOVED: Enum 'occasion_type' eliminated - no longer used after removing column 'type' from occasions table

-- Estados de órdenes
CREATE TYPE order_status AS ENUM (
    'pending',          -- Pendiente de confirmación
    'confirmed',        -- Confirmada
    'preparing',        -- En preparación
    'ready',           -- Lista para entrega
    'delivered',       -- Entregada
    'cancelled'        -- Cancelada
);

-- Estados de pagos
CREATE TYPE payment_status AS ENUM (
    'pending',         -- Pendiente
    'confirmed',       -- Confirmado
    'failed',          -- Fallido
    'refunded'         -- Reembolsado
);

-- Métodos de pago disponibles
CREATE TYPE payment_method_type AS ENUM (
    'bank_transfer',   -- Transferencia bancaria
    'mobile_payment',  -- Pago móvil
    'cash',           -- Efectivo
    'card'            -- Tarjeta
);

-- Roles de usuario del sistema
CREATE TYPE user_role AS ENUM (
    'admin',          -- Administrador completo
    'user',           -- Usuario regular
    'support'         -- Soporte técnico
);

-- Tamaños de imágenes para optimización
CREATE TYPE image_size AS ENUM (
    'thumb',          -- Miniatura (pequeña)
    'small',          -- Pequeña
    'medium',         -- Mediana
    'large'           -- Grande
);

`;
  }

  /**
   * Genera SQL para una tabla específica
   */
  private generateTableSQL(table: TableInfo): string {
    const tableName = table.name;
    const displayName = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_/g, ' ');

    let sql = `-- =============================================================================
-- TABLA: ${tableName} (${displayName})
-- =============================================================================
-- Registros: ${table.recordCount}

CREATE TABLE ${tableName} (
`;

    // Generar columnas
    const columnDefinitions = table.columns.map(col => {
      let def = `    ${col.name} ${col.type}`;
      if (!col.nullable && !col.type.includes('NOT NULL')) {
        def += ' NOT NULL';
      }
      return def;
    });

    sql += columnDefinitions.join(',\n');
    sql += '\n);\n\n';

    return sql;
  }

  /**
   * Genera SQL de índices
   */
  private generateIndexesSQL(tablesInfo: TableInfo[]): string {
    let sql = '';

    for (const table of tablesInfo) {
      if (table.indexes.length > 0) {
        sql += `-- Índices para ${table.name}\n`;

        for (const index of table.indexes) {
          const uniqueKeyword = index.isUnique ? 'UNIQUE ' : '';
          const condition = index.condition ? ` ${index.condition}` : '';
          sql += `CREATE ${uniqueKeyword}INDEX ${index.name} ON ${table.name}(${index.columns.join(', ')})${condition};\n`;
        }
        sql += '\n';
      }
    }

    return sql;
  }

  /**
   * Genera SQL de triggers
   */
  private generateTriggersSQL(): string {
    return `-- =============================================================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- =============================================================================

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_occasions_updated_at BEFORE UPDATE ON occasions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

`;
  }

  /**
   * Genera funciones SQL
   */
  private generateFunctionsSQL(): string {
    return `-- =============================================================================
-- FUNCIONES DE UTILIDAD
-- =============================================================================

-- Función para obtener el stock disponible de un producto
CREATE OR REPLACE FUNCTION get_available_stock(product_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    current_stock INTEGER;
    reserved_stock INTEGER;
BEGIN
    -- Obtener stock actual
    SELECT stock INTO current_stock
    FROM products
    WHERE id = product_id_param AND active = true;

    IF current_stock IS NULL THEN
        RETURN 0;
    END IF;

    -- Obtener stock reservado en órdenes pendientes
    SELECT COALESCE(SUM(oi.quantity), 0) INTO reserved_stock
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = product_id_param
    AND o.status IN ('pending', 'confirmed', 'preparing');

    RETURN GREATEST(current_stock - reserved_stock, 0);
END;
$$ LANGUAGE plpgsql;

-- Función para calcular el total de una orden
CREATE OR REPLACE FUNCTION calculate_order_total(order_id_param INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_amount DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price_usd), 0) INTO total_amount
    FROM order_items
    WHERE order_id = order_id_param;

    RETURN total_amount;
END;
$$ LANGUAGE plpgsql;

`;
  }

  /**
   * Genera vistas SQL
   */
  private generateViewsSQL(): string {
    return `-- =============================================================================
-- VISTAS ÚTILES
-- =============================================================================

-- Vista para productos con información de imágenes primarias
CREATE VIEW products_with_primary_image AS
SELECT
    p.*,
    pi.url as primary_image_url,
    pi.file_hash as primary_image_hash
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true AND pi.size = 'thumb';

-- Vista para órdenes con información de cliente y estado de pago
CREATE VIEW orders_with_payment_status AS
SELECT
    o.*,
    p.status as payment_status,
    p.method as payment_method,
    p.amount_usd as paid_amount
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id;

`;
  }

  /**
   * Genera datos semilla
   */
  private generateSeedsSQL(): string {
    return `-- =============================================================================
-- DATOS INICIALES (SEEDS)
-- =============================================================================

-- Insertar ocasiones básicas si no existen
INSERT INTO occasions (name, type, description) VALUES
('Sin ocasión específica', 'general', 'Para cualquier momento del año'),
('Cumpleaños', 'birthday', 'Celebración de cumpleaños'),
('Aniversario', 'anniversary', 'Conmemoración de aniversarios'),
('Boda', 'wedding', 'Celebraciones de matrimonio'),
('Pésame', 'sympathy', 'Momentos de duelo y condolencias'),
('Felicitaciones', 'congratulations', 'Logros y celebraciones especiales')
ON CONFLICT DO NOTHING;

-- Insertar usuario administrador por defecto si no existe
INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified) VALUES
('admin@floresya.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu', 'Administrador FloresYa', 'admin', true, true)
ON CONFLICT (email) DO NOTHING;

-- Configuraciones básicas del sistema
INSERT INTO settings (key, value, description, data_type, is_public) VALUES
('site_name', 'FloresYa', 'Nombre del sitio web', 'string', true),
('site_description', 'Tu floristería en línea de confianza', 'Descripción del sitio', 'string', true),
('currency_primary', 'USD', 'Moneda principal del sitio', 'string', true),
('currency_secondary', 'VES', 'Moneda secundaria del sitio', 'string', true),
('delivery_enabled', 'true', 'Si está habilitada la entrega a domicilio', 'boolean', true),
('min_order_amount', '15.00', 'Monto mínimo de orden en USD', 'number', true)
ON CONFLICT (key) DO NOTHING;

`;
  }

  /**
   * Genera pie de archivo SQL
   */
  private generateFooter(): string {
    const date = new Date().toISOString().split('T')[0];
    return `-- =============================================================================
-- COMENTARIOS FINALES
-- =============================================================================

-- Este esquema fue generado automáticamente usando FloresYa Schema Extractor
-- Fecha de extracción: ${date}
-- Versión: ${this.stats.version}
-- Total de tablas: ${this.stats.totalTables}
-- Total de registros: ${this.stats.totalRecords}
-- Total de índices: ${this.stats.totalIndexes}

-- Para actualizar este archivo ejecute:
-- npx ts-node scripts/schema-extractor.ts
-- o desde el panel de administrador: Configuración > Ver Esquema DB

-- Compatible con FloresYa TypeScript types y controllers
`;
  }

  /**
   * Guarda el esquema en archivo
   */
  private saveSchemaToFile(schema: string): void {
    const outputPath = join(process.cwd(), this.config.outputFile);
    writeFileSync(outputPath, schema, 'utf8');
    console.warn(`💾 Esquema guardado en: ${outputPath}`);
  }

  /**
   * Método estático para uso rápido
   */
  public static async quickExtract(): Promise<string> {
    const extractor = new SupabaseSchemaExtractor();
    const result = await extractor.extractSchema();

    if (!result.success) {
      throw new Error(result.error || 'Error desconocido durante la extracción');
    }

    return result.schema ?? '';
  }

  /**
   * Método para el panel de administrador
   */
  public static async getSchemaInfo(): Promise<{
    schema: string;
    stats: SchemaStats;
    lastUpdate: string;
  }> {
    const extractor = new SupabaseSchemaExtractor({ outputFile: '' });
    const result = await extractor.extractSchema();

    if (!result.success) {
      throw new Error(result.error || 'Error al extraer esquema');
    }

    return {
      schema: result.schema ?? '',
      stats: result.stats ?? {
        totalTables: 0,
        totalRecords: 0,
        totalIndexes: 0,
        totalConstraints: 0,
        extractionDate: new Date().toISOString(),
        version: '1.0.0'
      },
      lastUpdate: new Date().toISOString()
    };
  }
}

// Exportar para uso como módulo
export { SupabaseSchemaExtractor };
export type { ExtractorConfig, TableInfo, SchemaStats };

// Ejecutar si es llamado directamente (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  SupabaseSchemaExtractor.quickExtract()
    .then(() => {
      console.warn('✅ Extracción de esquema completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}
