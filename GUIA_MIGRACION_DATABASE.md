# 🚀 Guía de Migración de Base de Datos - FloresYa

## 📋 RESUMEN DE LA MIGRACIÓN

Esta migración elimina la tabla obsoleta `categories` y consolida el sistema usando únicamente `occasions` con integridad referencial completa.

### Cambios Principales
- ❌ **Eliminar**: Tabla `categories` (obsoleta)
- ✅ **Mantener**: Sistema `occasions` y `product_occasions` 
- 🔄 **Actualizar**: Todas las relaciones de foreign keys
- 🛡️ **Preservar**: Integridad referencial completa

---

## 🔍 PASO 1: VERIFICACIÓN PRE-MIGRACIÓN

### 1.1 Verificar Estado Actual
```bash
# Conectar a Supabase y ejecutar el script de verificación
psql "postgresql://[tu-conexion-supabase]" -f supabase_check_before_migration.sql
```

**¿Qué hace este script?**
- ✅ Lista todas las tablas existentes
- 📊 Cuenta registros en cada tabla
- 🔗 Muestra foreign keys activas
- 🏷️ Verifica tipos personalizados (enums)
- 📊 Lista índices importantes
- ⚡ Muestra triggers activos

### 1.2 Backup de Imágenes (✅ COMPLETADO)
```bash
# Ya ejecutado exitosamente
node backup_images.js
# Resultado: 18 imágenes respaldadas en dbimagenes/ (1.7MB)
```

---

## 🛡️ PASO 2: BACKUP DE SEGURIDAD

### 2.1 Backup Completo de la Base de Datos
```bash
# Desde terminal local
pg_dump "postgresql://[tu-conexion-supabase]" > backup_floresya_$(date +%Y%m%d_%H%M%S).sql
```

### 2.2 Backup Solo de Datos (Opcional)
```bash
# Solo datos, sin estructura
pg_dump --data-only "postgresql://[tu-conexion-supabase]" > backup_data_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🚀 PASO 3: EJECUCIÓN DE LA MIGRACIÓN

### OPCIÓN A: Migración Completa (RECOMENDADA)

#### 3.1 Recreación Completa y Segura
```bash
# Ejecutar migración completa (elimina y recrea todo)
psql "postgresql://[tu-conexion-supabase]" -f supabase_migration_safe.sql
```

**¿Qué hace `supabase_migration_safe.sql`?**
1. 🗑️ Elimina tablas en orden seguro (respetando FK)
2. 🏗️ Recrea estructura completa sin `categories`
3. 🔧 Establece foreign keys correctos
4. 📊 Crea índices optimizados
5. ⚡ Configura triggers de `updated_at`
6. 🏷️ Define tipos personalizados (enums)

#### 3.2 Población de Datos Iniciales
```bash
# Insertar datos base del sistema
psql "postgresql://[tu-conexion-supabase]" -f supabase_seed_data.sql
```

### OPCIÓN B: Solo Limpieza de Datos (Conserva Estructura)

#### 3.1 Limpiar Solo Datos
```bash
# Solo elimina datos, mantiene estructura de tablas
psql "postgresql://[tu-conexion-supabase]" -f supabase_cleanup_data_only.sql
```

#### 3.2 Insertar Datos Nuevos
```bash
# Después de limpiar, insertar datos base
psql "postgresql://[tu-conexion-supabase]" -f supabase_seed_data.sql
```

---

## ✅ PASO 4: VERIFICACIÓN POST-MIGRACIÓN

### 4.1 Verificar Estructura de Tablas
```sql
-- Conectar a Supabase y ejecutar:

-- Verificar que categories NO existe
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'categories' AND table_schema = 'public';
-- Debe devolver 0 resultados

-- Verificar que occasions SÍ existe
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'occasions' AND table_schema = 'public';
-- Debe devolver 1 resultado

-- Contar datos insertados
SELECT 'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'occasions', COUNT(*) FROM occasions
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods;
```

### 4.2 Verificar Foreign Keys
```sql
-- Verificar relaciones funcionando
SELECT 
    tc.table_name AS tabla_origen,
    kcu.column_name AS columna_origen,
    ccu.table_name AS tabla_destino,
    ccu.column_name AS columna_destino
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

---

## 🖥️ PASO 5: VERIFICACIÓN DE LA APLICACIÓN

### 5.1 Probar Servidor Local
```bash
# Detener procesos existentes si están corriendo
pkill -f "node.*server"

# Iniciar en modo desarrollo
npm run dev
```

### 5.2 Probar Endpoints Críticos
```bash
# Verificar que occasions funciona (reemplazó categories)
curl http://localhost:3000/api/occasions

# Verificar productos
curl http://localhost:3000/api/products

# Verificar métodos de pago
curl http://localhost:3000/api/payment-methods
```

### 5.3 Verificar Frontend
- Abrir http://localhost:3000
- ✅ Verificar que el carrusel carga
- ✅ Verificar que los productos se muestran
- ✅ Verificar filtros por ocasión (no por categoría)
- ✅ Verificar carrito de compras

---

## 🚨 TROUBLESHOOTING

### Error: "relation 'categories' does not exist"
```bash
# Buscar referencias restantes a categories
rg -i "categories" backend/src/ --type js
rg -i "category" backend/src/ --type js

# Eliminar o reemplazar por occasions
```

### Error: Foreign Key Violation
```bash
# Verificar orden de eliminación en migración
# El script ya maneja esto correctamente
```

### Error: Cannot connect to database
```bash
# Verificar variables de entorno
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Verificar en .env
cat .env | grep SUPABASE
```

---

## 📊 DATOS DE PRUEBA INCLUIDOS

El archivo `supabase_seed_data.sql` incluye:

### Usuarios (3)
- Admin: admin@floresya.com
- Usuario: usuario@test.com  
- Cliente: cliente@test.com

### Ocasiones (8)
- Cumpleaños, Aniversario, San Valentín, Día de la Madre
- Día del Padre, Graduación, Condolencias, Sin ocasión específica

### Métodos de Pago (5)
- Pago Móvil, Zelle, Binance Pay, Efectivo, Transferencia Bancaria

### Productos (6)
- Ramo de Rosas Rojas, Orquídeas Blancas, Girasoles
- Lirios Rosados, Claveles Mixtos, Tulipanes Amarillos

### Configuraciones del Sistema
- Nombre de la tienda, monedas, configuraciones de email

---

## ✅ CHECKLIST FINAL

Antes de considerar la migración completa:

- [ ] ✅ Backup de base de datos creado
- [ ] ✅ Backup de imágenes completado (18 archivos)
- [ ] ✅ Script de verificación pre-migración ejecutado
- [ ] 🔄 Migración ejecutada sin errores
- [ ] 🔄 Datos de prueba insertados correctamente
- [ ] 🔄 Servidor inicia sin errores
- [ ] 🔄 Frontend carga correctamente
- [ ] 🔄 APIs responden correctamente
- [ ] 🔄 No hay referencias a 'categories' en logs

---

## 🎯 COMANDOS RÁPIDOS

```bash
# Migración completa en un solo comando
psql "postgresql://[tu-conexion-supabase]" \
  -f supabase_migration_safe.sql \
  -f supabase_seed_data.sql

# Verificar resultado
npm run dev
```

**🚀 ¡La migración está lista para ejecutarse de forma segura!**