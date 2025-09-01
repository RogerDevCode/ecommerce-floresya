# API Documentation - FloresYa

## 🌐 Base URL
```
Development: http://localhost:3000/api
Production: https://tu-dominio.com/api
```

## 🔐 Autenticación

La API utiliza **JWT (JSON Web Tokens)** para autenticación. Include el token en el header `Authorization`:

```
Authorization: Bearer <token>
```

## 📋 Respuestas Estándar

Todas las respuestas siguen este formato:

### Éxito
```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": {
    // Datos específicos del endpoint
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [
    // Array de errores específicos (validación)
  ]
}
```

## 🔐 Endpoints de Autenticación

### Registrar Usuario
```http
POST /api/auth/register
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "+58414-1234567"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "first_name": "Juan",
      "last_name": "Pérez",
      "phone": "+58414-1234567",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Iniciar Sesión
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

### Obtener Perfil
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Actualizar Perfil
```http
PUT /api/auth/profile
Authorization: Bearer <token>
```

**Body:**
```json
{
  "first_name": "Juan Carlos",
  "last_name": "Pérez González",
  "phone": "+58416-7654321"
}
```

## 🛍️ Endpoints de Productos

### Listar Productos
```http
GET /api/products
```

**Parámetros de Query:**
- `page` (int): Página (default: 1)
- `limit` (int): Items por página (default: 12)
- `category_id` (int): Filtrar por categoría
- `occasion` (string): Filtrar por ocasión
- `featured` (boolean): Solo productos destacados
- `search` (string): Búsqueda por nombre/descripción
- `sort` (string): Campo para ordenar (name, price, created_at)
- `order` (string): Dirección del ordenamiento (ASC, DESC)

**Ejemplo:**
```http
GET /api/products?page=1&limit=8&category_id=1&featured=true&sort=price&order=ASC
```

### Productos Destacados
```http
GET /api/products/featured?limit=8
```

### Detalle de Producto
```http
GET /api/products/123
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 123,
      "name": "Rosas Rojas Clásicas",
      "description": "Docena de rosas rojas frescas...",
      "price": 25.00,
      "category_id": 1,
      "category_name": "Rosas",
      "stock_quantity": 50,
      "image_url": "/images/products/red-roses.jpg",
      "additional_images": [],
      "occasion": "valentine",
      "featured": true,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "related_products": [...]
  }
}
```

## 📦 Endpoints de Órdenes

### Crear Orden
```http
POST /api/orders
Authorization: Bearer <token> (opcional para invitados)
```

**Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ],
  "shipping_address": {
    "first_name": "María",
    "last_name": "González",
    "phone": "+58416-7654321",
    "address_line_1": "Av. Francisco de Miranda, Edif. Los Rosales",
    "address_line_2": "Apto 15-B",
    "city": "Caracas",
    "state": "Distrito Capital"
  },
  "guest_email": "cliente@ejemplo.com", // Solo para invitados
  "notes": "Entregar después de las 2pm",
  "delivery_date": "2024-02-15"
}
```

### Mis Órdenes
```http
GET /api/orders/my-orders
Authorization: Bearer <token>
```

**Parámetros:**
- `page`, `limit`, `status`

### Detalle de Orden
```http
GET /api/orders/123
Authorization: Bearer <token>
```

### Todas las Órdenes (Admin)
```http
GET /api/orders/admin/all
Authorization: Bearer <admin-token>
```

### Actualizar Estado de Orden (Admin)
```http
PATCH /api/orders/123/status
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "status": "verified",
  "notes": "Pago confirmado"
}
```

## 💰 Endpoints de Pagos

### Registrar Pago
```http
POST /api/payments
Content-Type: multipart/form-data
Authorization: Bearer <token> (opcional)
```

**Form Data:**
- `order_id` (int): ID de la orden
- `payment_method_id` (int): ID del método de pago
- `amount` (decimal): Monto pagado
- `reference_number` (string): Número de referencia
- `payment_details` (JSON): Detalles específicos del método
- `proof` (file): Comprobante de pago (imagen)

**Ejemplo para Pago Móvil:**
```javascript
const formData = new FormData();
formData.append('order_id', '123');
formData.append('payment_method_id', '1');
formData.append('amount', '50.00');
formData.append('reference_number', '987654321');
formData.append('payment_details', JSON.stringify({
  "bank": "Banesco",
  "cedula": "V-12345678",
  "phone": "04141234567"
}));
formData.append('proof', fileInput.files[0]);
```

### Pagos de una Orden
```http
GET /api/payments/order/123
Authorization: Bearer <token>
```

### Verificar Pago (Admin)
```http
PATCH /api/payments/456/verify
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "status": "verified", // o "failed"
  "notes": "Pago confirmado correctamente"
}
```

## 📂 Endpoints Auxiliares

### Categorías
```http
GET /api/categories
```

### Métodos de Pago
```http
GET /api/payment-methods
```

### Configuraciones del Sistema
```http
GET /api/settings
```

### Health Check
```http
GET /api/health
```

## 🔍 Códigos de Estado HTTP

- `200` - OK: Solicitud exitosa
- `201` - Created: Recurso creado exitosamente
- `400` - Bad Request: Error en los datos enviados
- `401` - Unauthorized: Token inválido o faltante
- `403` - Forbidden: Permisos insuficientes
- `404` - Not Found: Recurso no encontrado
- `409` - Conflict: Conflicto (ej: email ya registrado)
- `422` - Unprocessable Entity: Errores de validación
- `429` - Too Many Requests: Rate limit excedido
- `500` - Internal Server Error: Error del servidor

## 📊 Paginación

Los endpoints que retornan listas incluyen información de paginación:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 145,
      "pages": 13
    }
  }
}
```

## 🔄 Rate Limiting

La API implementa rate limiting:
- **Ventana**: 15 minutos
- **Límite**: 100 solicitudes por IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## 📝 Ejemplos de Uso

### JavaScript (Frontend)
```javascript
// Obtener productos
const response = await fetch('/api/products?featured=true');
const data = await response.json();

if (data.success) {
    console.log('Productos:', data.data.products);
}

// Crear orden con autenticación
const orderResponse = await fetch('/api/orders', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
});
```

### cURL Examples

#### Obtener productos:
```bash
curl -X GET "http://localhost:3000/api/products?page=1&limit=5"
```

#### Crear usuario:
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

#### Crear orden:
```bash
curl -X POST "http://localhost:3000/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [{"product_id": 1, "quantity": 2}],
    "shipping_address": {
      "first_name": "Juan",
      "last_name": "Pérez",
      "phone": "+58414-1234567",
      "address_line_1": "Av. Principal 123",
      "city": "Caracas",
      "state": "Distrito Capital"
    }
  }'
```

## ⚠️ Notas Importantes

1. **Autenticación Opcional**: Algunos endpoints funcionan tanto para usuarios autenticados como invitados
2. **Validación**: Todos los endpoints validan datos de entrada
3. **Transacciones**: Las operaciones críticas usan transacciones de DB
4. **Archivos**: Los uploads están limitados a 5MB
5. **Emails**: Las notificaciones por email son asíncronas

## 🐛 Manejo de Errores

### Errores Comunes:

#### Token Expirado (401)
```json
{
  "success": false,
  "message": "Token inválido"
}
```

#### Validación Fallida (400)
```json
{
  "success": false,
  "message": "Errores de validación",
  "errors": [
    {
      "field": "email",
      "message": "Email debe ser válido"
    }
  ]
}
```

#### Stock Insuficiente (400)
```json
{
  "success": false,
  "message": "Stock insuficiente para Rosas Rojas Clásicas"
}
```