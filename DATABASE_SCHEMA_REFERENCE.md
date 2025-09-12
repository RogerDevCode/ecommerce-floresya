# 🗄️ FloresYa Database Schema Reference

## Estado Actual (Verificado 2025-09-11)

### ✅ Tablas Activas

#### 🌸 **products** - Catálogo de Productos
```sql
id (number, PK)
name (string, NOT NULL)
summary (string)
description (string) 
price_usd (number, NOT NULL, ≥0)
price_ves (number)
stock (number, DEFAULT 0, ≥0)
occasion (string)               -- Ocasión legacy, usar product_occasions
sku (string, UNIQUE)
active (boolean, DEFAULT true)
featured (boolean, DEFAULT false)
created_at (timestamp)
updated_at (timestamp)
```

**🚨 IMPORTANTE - Columnas Eliminadas por Normalización**: 
- ❌ **`image_url`**: Redundante con `product_images.url_large WHERE is_primary = true`
- ❌ **`additional_images`**: Viola 1NF, redundante con `product_images WHERE is_primary = false`
- ✅ **Usar SOLO** `product_images` - única fuente de verdad para imágenes

#### 🖼️ **product_images** - Imágenes Multi-Resolución
```sql
id (bigint, PK)
product_id (bigint, FK → products.id)
file_hash (string, UNIQUE, NOT NULL)    -- SHA256 para deduplicación
original_filename (string, NOT NULL)
original_size (number, NOT NULL)
mime_type (string, NOT NULL)
url_large (string, NOT NULL)            -- 1200px
url_medium (string)                      -- 600px  
url_small (string)                       -- 300px
url_thumb (string)                       -- 150px
width (number)
height (number)
processed_at (timestamp, DEFAULT now())
display_order (number, DEFAULT 1)
is_primary (boolean, DEFAULT false)     -- Imagen principal del producto
created_at (timestamp)
updated_at (timestamp)
```

#### 🎉 **occasions** - Sistema de Categorización
```sql
id (number, PK)
name (string, NOT NULL, UNIQUE)
type (enum, DEFAULT 'general')           -- occasion_type
description (string)
is_active (boolean, DEFAULT true)
display_order (number, DEFAULT 0)
created_at (timestamp)
updated_at (timestamp)
```

#### 🔗 **product_occasions** - Relación Productos-Ocasiones
```sql
id (number, PK)
product_id (number, FK → products.id, NOT NULL)
occasion_id (number, FK → occasions.id, NOT NULL)
created_at (timestamp)
updated_at (timestamp)
```

#### 🛒 **orders** - Órdenes de Compra
```sql
id (number, PK)
user_id (number, FK → users.id)
customer_email (string, NOT NULL)
customer_name (string, NOT NULL)
customer_phone (string)
delivery_address (string, NOT NULL)
delivery_city (string)
delivery_state (string)
delivery_zip (string)
delivery_date (date)
delivery_time_slot (string)
delivery_notes (string)
status (enum, DEFAULT 'pending')         -- order_status
total_amount_usd (number, NOT NULL, ≥0)
total_amount_ves (number)
currency_rate (number)
notes (string)
admin_notes (string)
created_at (timestamp)
updated_at (timestamp)
```

#### 🛍️ **order_items** - Líneas de Pedido
```sql
id (number, PK)
order_id (number, FK → orders.id, NOT NULL)
product_id (number, FK → products.id)   -- Puede ser NULL si producto eliminado
product_name (string, NOT NULL)         -- Snapshot del nombre
product_summary (string)                 -- Snapshot del resumen
unit_price_usd (number, NOT NULL, ≥0)   -- Snapshot del precio
unit_price_ves (number)
quantity (number, NOT NULL, DEFAULT 1, >0)
subtotal_usd (number, NOT NULL, ≥0)
subtotal_ves (number)
created_at (timestamp)
updated_at (timestamp)
```

#### 💳 **payments** - Pagos y Comprobantes
```sql
id (number, PK)
order_id (number, FK → orders.id, NOT NULL)
payment_method_id (number, FK → payment_methods.id)
user_id (number, FK → users.id)
amount_usd (number, NOT NULL, ≥0)
amount_ves (number)
currency_rate (number)
status (enum, DEFAULT 'pending')         -- payment_status
payment_method_name (string, NOT NULL)
transaction_id (string)
reference_number (string)
payment_details (jsonb)
receipt_image_url (string)               -- ✅ Campo válido para recibos
admin_notes (string)
payment_date (timestamp)
confirmed_date (timestamp)
created_at (timestamp)
updated_at (timestamp)
```

#### 💰 **payment_methods** - Métodos de Pago
```sql
id (number, PK)
name (string, NOT NULL)
type (enum, NOT NULL)                    -- payment_method_type
description (string)
account_info (jsonb)
is_active (boolean, DEFAULT true)
display_order (number, DEFAULT 0)
created_at (timestamp)
updated_at (timestamp)
```

#### 🎠 **carousel_images** - Carrusel Homepage
```sql
id (number, PK)
title (string)
image_url (string, NOT NULL)            -- ✅ Campo válido para carousel
link_url (string)
alt_text (string)
display_order (number, DEFAULT 0)
is_active (boolean, DEFAULT true)
created_at (timestamp)
updated_at (timestamp)
```

#### 👥 **users** - Usuarios del Sistema
```sql
id (number, PK)
email (string, NOT NULL, UNIQUE)
password_hash (string)
full_name (string)
phone (string)
role (enum, DEFAULT 'user')              -- user_role (user/admin)
is_active (boolean, DEFAULT true)
email_verified (boolean, DEFAULT false)
created_at (timestamp)
updated_at (timestamp)
```

#### ⚙️ **settings** - Configuración de la App
```sql
id (number, PK)
key (string, NOT NULL, UNIQUE)
value (string)
description (string)
type (string, DEFAULT 'string')
is_public (boolean, DEFAULT false)
created_at (timestamp)
updated_at (timestamp)
```

#### 📊 **order_status_history** - Historial de Estados
```sql
id (number, PK)
order_id (number, FK → orders.id, NOT NULL)
old_status (string)
new_status (string, NOT NULL)
notes (string)
changed_by (number)
created_at (timestamp, DEFAULT CURRENT_TIMESTAMP)
```

### ❌ Elementos Eliminados por Arquitectura

#### **categories** (tabla) - ELIMINADA
- **Razón**: Reemplazada por sistema más flexible `occasions` + `product_occasions`
- **Impacto**: ❌ NO usar `categoryController` o referencias a `categories`

#### **products.image_url** (columna) - ELIMINADA
- **Razón**: Redundante con `product_images.url_large WHERE is_primary = true`
- **Problema**: Violaba normalización - dos fuentes de verdad para la misma imagen
- **Impacto**: ❌ NO usar `product.image_url` - usar relación `product_images`

#### **products.additional_images** (columna) - ELIMINADA  
- **Razón**: Violaba Primera Forma Normal (1NF) - arrays en columnas
- **Problema**: Dificulta consultas, índices, y mantenimiento
- **Equivalente**: `product_images WHERE is_primary = false ORDER BY display_order`
- **Impacto**: ❌ NO usar `product.additional_images` - usar relación `product_images`

### 🖼️ Estrategia de Imágenes por Tabla

#### Products → product_images
```javascript
// ❌ OBSOLETO - NO usar
product.image_url
product.additional_images

// ✅ CORRECTO - Usar relación
const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('display_order');

const primaryImage = images.find(img => img.is_primary) || images[0];
```

#### Carousel → image_url directo
```javascript
// ✅ VÁLIDO - carousel_images mantiene image_url
carousel.image_url
```

#### Payments → receipt_image_url directo  
```javascript
// ✅ VÁLIDO - payments mantiene receipt_image_url
payment.receipt_image_url
```

### 🔄 Patrones de Migración Requeridos

#### 1. Controllers de Products
```javascript
// ❌ Eliminar referencias obsoletas
image_url: req.body.image_url
additional_images: req.body.additional_images

// ✅ Usar relación con product_images
const images = await this.getProductImages(productId);
```

#### 2. Frontend Product Display
```javascript
// ❌ Obsoleto
product.image_url || '/placeholder.jpg'

// ✅ Correcto  
primaryImage?.url_large || '/placeholder.jpg'
```

#### 3. QueryBuilder Definitions
```javascript
// ❌ Remover de products schema
columns: ['id', 'name', ..., 'image_url', 'additional_images']

// ✅ Solo columnas actuales
columns: ['id', 'name', 'summary', 'description', 'price_usd', 'price_ves', 'stock', 'occasion', 'sku', 'active', 'featured', 'created_at', 'updated_at']
```

### 🧪 Validación Post-Migración

#### Tests que deben pasar:
```javascript
// Verificar que products NO tiene campos obsoletos
expect(product).not.toHaveProperty('image_url');
expect(product).not.toHaveProperty('additional_images');

// Verificar que carousel SÍ mantiene image_url
expect(carouselImage).toHaveProperty('image_url');

// Verificar que payments SÍ mantiene receipt_image_url  
expect(payment).toHaveProperty('receipt_image_url');
```

### 📝 Notas de Desarrollo

1. **Siempre verificar** tabla antes de usar `image_url`
2. **Products**: Solo via `product_images` con `is_primary`
3. **Carousel y Payments**: Usan campos directos
4. **Categories**: Usar `occasions` + `product_occasions`
5. **Tests**: Validar estructura post-cambios

---
**Última actualización**: 2025-09-11  
**Verificado contra**: Base de datos Supabase en producción