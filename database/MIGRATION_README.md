# FloresYa - Migración a PostgreSQL 17.5

Este documento describe cómo migrar la base de datos de FloresYa de SQLite a PostgreSQL 17.5.

## 📋 Archivos de Migración

- `migration_postgres_schema.sql` - Esquema de base de datos para PostgreSQL
- `migration_postgres_data.sql` - Datos migrados desde SQLite
- `migrate_to_postgres.sh` - Script automatizado de migración
- `MIGRATION_README.md` - Esta documentación

## 🛠️ Prerequisitos

1. **PostgreSQL 17.5** instalado y ejecutándose
2. **Permisos de usuario** para crear bases de datos
3. **Acceso de red** al servidor PostgreSQL
4. **Cliente psql** instalado

### Instalación de PostgreSQL en Ubuntu/Debian:
```bash
# Agregar repositorio oficial de PostgreSQL
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# Instalar PostgreSQL 17
sudo apt update
sudo apt install postgresql-17 postgresql-client-17 postgresql-contrib-17
```

### Instalación en CentOS/RHEL:
```bash
# Instalar repositorio
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Instalar PostgreSQL 17
sudo dnf install -y postgresql17-server postgresql17
sudo /usr/pgsql-17/bin/postgresql-17-setup initdb
sudo systemctl enable postgresql-17
sudo systemctl start postgresql-17
```

## 🚀 Métodos de Migración

### Método 1: Script Automatizado (Recomendado)

```bash
# Configurar variables de entorno (opcional)
export POSTGRES_DB="floresya"
export POSTGRES_USER="floresya_user"
export POSTGRES_PASSWORD="floresya_password"
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"

# Ejecutar migración
./migrate_to_postgres.sh
```

### Método 2: Migración Manual

#### Paso 1: Crear usuario y base de datos
```bash
sudo -u postgres psql
```

```sql
-- Crear usuario
CREATE USER floresya_user WITH ENCRYPTED PASSWORD 'floresya_password';

-- Crear base de datos
CREATE DATABASE floresya OWNER floresya_user;

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE floresya TO floresya_user;
GRANT ALL ON SCHEMA public TO floresya_user;

-- Salir
\q
```

#### Paso 2: Ejecutar esquema
```bash
PGPASSWORD="floresya_password" psql -h localhost -U floresya_user -d floresya -f migration_postgres_schema.sql
```

#### Paso 3: Migrar datos
```bash
PGPASSWORD="floresya_password" psql -h localhost -U floresya_user -d floresya -f migration_postgres_data.sql
```

## 🔧 Configuración de la Aplicación

### 1. Instalar dependencias de PostgreSQL
```bash
npm install pg
npm uninstall sqlite3  # Opcional: remover SQLite
```

### 2. Actualizar configuración de base de datos

Editar `backend/src/config/database.js`:

```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'floresya',
  username: process.env.DB_USER || 'floresya_user',
  password: process.env.DB_PASSWORD || 'floresya_password',
  logging: process.env.SQL_LOGGING === 'true' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to PostgreSQL has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
};
```

### 3. Crear archivo .env
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=floresya
DB_USER=floresya_user
DB_PASSWORD=floresya_password

# Optional: Enable SQL logging
SQL_LOGGING=false

# Other existing environment variables...
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

### 4. Actualizar scripts de inicialización

Crear `backend/src/scripts/init-db-postgres.js`:

```javascript
#!/usr/bin/env node
const { testConnection } = require('../config/database');

console.log('🐘 Testing PostgreSQL connection...\n');

testConnection().then((success) => {
  if (success) {
    console.log('🎉 PostgreSQL database is ready!');
    console.log('\n📖 Demo Accounts:');
    console.log('   👨‍💼 Admin: admin@floresya.com / admin123');
    console.log('   👤 Customer: cliente@ejemplo.com / customer123');
    console.log('   👤 Customer: juan@ejemplo.com / customer123');
    process.exit(0);
  } else {
    console.error('❌ Database connection failed');
    process.exit(1);
  }
});
```

## 📊 Diferencias Principales entre SQLite y PostgreSQL

| Característica | SQLite | PostgreSQL |
|---------------|--------|------------|
| **Tipo de datos JSON** | TEXT | JSONB |
| **Booleanos** | INTEGER (0/1) | BOOLEAN |
| **Auto increment** | AUTOINCREMENT | SERIAL |
| **Timestamps** | DATETIME | TIMESTAMP WITH TIME ZONE |
| **Triggers para updated_at** | Manual | Función automática |

## 🔍 Verificación Post-Migración

### Verificar tablas y datos:
```bash
PGPASSWORD="floresya_password" psql -h localhost -U floresya_user -d floresya
```

```sql
-- Verificar todas las tablas
\dt

-- Contar registros
SELECT 
  schemaname,
  tablename,
  n_tup_ins - n_tup_del as row_count
FROM pg_stat_user_tables;

-- Verificar datos específicos
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM settings;

-- Verificar funcionamiento de JSON
SELECT setting_key, setting_value FROM settings WHERE setting_key = 'business_hours';

-- Salir
\q
```

### Probar la aplicación:
```bash
npm run dev
```

## 🐛 Troubleshooting

### Error de conexión
```
ECONNREFUSED ::1:5432
```
**Solución**: Verificar que PostgreSQL esté ejecutándose:
```bash
sudo systemctl status postgresql-17
sudo systemctl start postgresql-17
```

### Error de autenticación
```
FATAL: password authentication failed
```
**Solución**: Verificar credenciales y configuración en `pg_hba.conf`

### Error de permisos
```
ERROR: permission denied for schema public
```
**Solución**: Otorgar permisos al usuario:
```sql
GRANT ALL ON SCHEMA public TO floresya_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO floresya_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO floresya_user;
```

### Problemas con secuencias
Si los IDs no se generan correctamente:
```sql
-- Actualizar secuencias manualmente
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
-- Repetir para todas las tablas con SERIAL
```

## 📈 Beneficios de PostgreSQL

1. **Rendimiento**: Mejor para aplicaciones con múltiples usuarios concurrentes
2. **Características avanzadas**: JSONB, índices parciales, funciones personalizadas
3. **Escalabilidad**: Soporte para replicación y clustering
4. **Integridad**: Mejor soporte para transacciones ACID
5. **Extensiones**: Ecosystem rico de extensiones
6. **Concurrencia**: Mejor manejo de escrituras concurrentes

## 🔄 Rollback (Volver a SQLite)

Si necesitas volver a SQLite, simplemente:

1. Restaurar `backend/src/config/database.js` original
2. Ejecutar: `npm install sqlite3 && npm uninstall pg`
3. Usar la base de datos SQLite existente en `database/floresya.db`

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisar logs de PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-17-main.log`
2. Verificar configuración de red y firewall
3. Consultar documentación oficial de PostgreSQL 17.5

---

¡La migración está lista! 🎉 Tu aplicación FloresYa ahora puede aprovechar todas las características avanzadas de PostgreSQL.