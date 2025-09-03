# FloresYa E-commerce - Guía Completa para Claude Code

## 🌸 Resumen del Proyecto

**FloresYa** es una plataforma e-commerce completa y moderna especializada en floristería para el mercado venezolano. Combina funcionalidad de **one-click buy** y **carrito de compras tradicional**, con integración de métodos de pago locales.

## 📁 Estructura del Proyecto

```
ecommerce-floresya/
├── backend/src/               # Node.js + Express.js Backend
│   ├── config/               # Configuración BD y servicios
│   ├── controllers/          # Lógica de negocio
│   ├── middleware/           # Autenticación, validación
│   ├── models/              # Modelos Sequelize
│   ├── routes/              # Definición de API endpoints
│   ├── scripts/             # Scripts de BD y mantenimiento
│   ├── services/            # Servicios (email, Supabase)
│   └── server.js            # Punto de entrada
├── frontend/                 # Frontend estático (HTML/CSS/JS)
│   ├── css/                 # Estilos personalizados
│   ├── js/                  # JavaScript del cliente
│   ├── images/              # Assets estáticos
│   ├── pages/               # Páginas adicionales (admin, etc.)
│   └── index.html           # Página principal
├── database/                # Esquemas y datos SQL
├── docs/                    # Documentación técnica
├── uploads/                 # Archivos subidos (imágenes, comprobantes)
├── gitpush.sh              # Script de respaldo a GitHub
├── cleanup.sh              # Script de limpieza de archivos
├── promptClaude.md         # Documentación para Claude Code
├── package.json            # Dependencias y scripts
└── .env                    # Variables de entorno
```

## 🛠️ Tecnologías Principales

### Backend
- **Framework**: Node.js + Express.js
- **Base de Datos**: PostgreSQL (Supabase) - **EXCLUSIVAMENTE**
- **ORM**: Sequelize
- **Autenticación**: JWT
- **Email**: Nodemailer
- **Upload**: Multer + Sharp
- **Seguridad**: Helmet, CORS, Rate Limiting

### Frontend
- **HTML5/CSS3/JavaScript ES6+**
- **UI Framework**: Bootstrap 5
- **Icons**: Bootstrap Icons
- **Patrón**: Vanilla JS con clases modulares

### Cloud Services
- **Base de Datos**: Supabase (PostgreSQL) - Sin fallback SQLite
- **Storage**: Supabase Storage
- **Deployment**: Vercel
- **Email Service**: Configurable SMTP

## 🌟 Características Principales

### 1. **Sistema de Compras Dual**
- **Carrito Tradicional**: Agregar múltiples productos, modificar cantidades
- **Compra Directa**: Botones de compra rápida en cada producto
- **Persistencia**: LocalStorage para invitados, BD para usuarios registrados

### 2. **Métodos de Pago Venezolanos** 💳
- **Pago Móvil**: Todos los bancos principales (Banesco, Mercantil, BDV, etc.)
- **Transferencia Bancaria**: Con verificación de comprobantes
- **Zelle**: Para pagos internacionales en USD
- **Binance Pay**: Pagos con criptomonedas
- **Sistema de Verificación**: Panel admin para aprobar/rechazar pagos

### 3. **Panel de Administración**
- **Dashboard**: Métricas de ventas y estadísticas
- **Gestión de Órdenes**: Seguimiento completo del ciclo de vida
- **Verificación de Pagos**: Revisar comprobantes y aprobar transacciones
- **Gestión de Productos**: CRUD completo con imágenes
- **Configuración**: Métodos de pago, tasas de cambio, configuraciones

### 4. **Localización Venezuela**
- **Ubicación**: Caracas, Venezuela
- **Monedas**: USD y BsS con tasa de cambio BCV
- **Métodos de pago**: Adaptados al mercado local
- **Envíos**: Configurables por zona de Caracas
- **Productos**: Organizados por **ocasiones** (reemplaza categorías)

## 🔧 Comandos Importantes

```bash
# Desarrollo
npm run dev          # Inicia servidor con auto-reload + inicialización BD
npm run demo         # Modo demo con datos de prueba
npm start            # Producción

# Base de datos
npm run db:reset     # Resetea y recrea la base de datos

# Utilidades
npm run lint         # Linting de código
npm test             # Ejecutar tests

# Respaldo y Limpieza
./gitpush.sh         # Script completo de commit y push a GitHub
./cleanup.sh         # Limpieza de archivos temporales
```

## 🎯 Flujos de Negocio Principales

### Compra de Productos
1. **Browse** → Catálogo con filtros por **ocasiones**/precio
2. **Select** → Detalle del producto con galería de imágenes
3. **Buy Options** → Agregar al carrito O comprar directamente
4. **Checkout** → Formulario con datos de envío
5. **Payment** → Selección de método de pago venezolano
6. **Confirmation** → Orden creada, email enviado

### Verificación de Pagos
1. **Cliente** → Sube comprobante de pago
2. **Sistema** → Notifica al admin por email
3. **Admin** → Revisa comprobante en panel
4. **Decisión** → Aprobar/rechazar pago
5. **Notificación** → Email automático al cliente
6. **Fulfillment** → Procesamiento de orden

## 📋 Estados del Sistema

### Estados de Órdenes
- `pending` → Orden creada, esperando pago
- `verified` → Pago confirmado
- `preparing` → En preparación
- `shipped` → Enviado
- `delivered` → Entregado
- `cancelled` → Cancelado

### Estados de Pagos
- `pending` → Pendiente verificación
- `verified` → Verificado por admin
- `failed` → Rechazado

## 🔐 Autenticación y Roles

### Roles de Usuario
- **customer**: Cliente regular
- **admin**: Administrador con acceso completo

### Endpoints Principales
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/register` - Registro
- `GET /api/auth/profile` - Perfil de usuario

## 🗄️ Base de Datos

### Tablas Principales
- **users**: Usuarios del sistema
- **products**: Catálogo de productos
- **occasions**: Ocasiones especiales (reemplaza categorías)
- **product_occasions**: Relación many-to-many productos-ocasiones
- **orders**: Órdenes de compra
- **order_items**: Items de cada orden
- **payments**: Pagos realizados
- **payment_methods**: Métodos de pago configurados
- **addresses**: Direcciones de envío

## 🚀 Scripts de Mantenimiento

### Disponibles en `/backend/src/scripts/`
- `init-db.js` - Inicialización completa de BD
- `reset-db.js` - Reset completo
- `seed-categories.js` - Datos de categorías
- `add-products.js` - Productos de ejemplo
- `process-product-images.js` - Procesamiento de imágenes

## ⚠️ Consideraciones Importantes

### Desarrollo
- **Puerto por defecto**: 3000
- **Modo DEV**: Visible solo en desarrollo (oculto en producción)
- **Base de datos**: PostgreSQL/Supabase **EXCLUSIVAMENTE** (sin SQLite)
- **Variables de entorno**: Copiar desde `.env.example`
- **Login rápido**: Botones auto-fill para admin/cliente en desarrollo

### Producción
- **Platform**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage para imágenes
- **Domain**: Configurable en variables de entorno

### Archivos de Configuración
- `.env` - Variables de entorno locales
- `vercel.json` - Configuración de deployment
- `gitpush.sh` - Script automatizado de Git
- `package.json` - Dependencias y scripts

## 🎨 Personalización

### Temas y Estilos
- **CSS principal**: `frontend/css/styles.css`
- **Admin styles**: `frontend/css/admin.css`
- **Responsive**: Bootstrap 5 + custom media queries
- **Colores**: Paleta temática de floristería

### Configuraciones Dinámicas
- Métodos de pago activables desde admin
- Tasas de cambio actualizables
- Configuraciones de envío por zona
- Textos e instrucciones personalizables

## 📚 Documentación Adicional

- `docs/PAYMENT_METHODS.md` - Detalle completo de métodos de pago
- `docs/API_DOCUMENTATION.md` - Documentación de API
- `docs/DEPLOYMENT_GUIDE.md` - Guía de despliegue
- `README.md` - Guía de inicio rápido

## 🔄 Próximos Pasos Sugeridos

### Funcionalidades
- [ ] API de verificación automática de pagos
- [ ] Sistema de notificaciones push
- [ ] Chat de soporte integrado
- [ ] Programa de lealtad y descuentos
- [ ] Integración con redes sociales

### Optimizaciones
- [ ] Implementar Redis para cache
- [ ] Queue system para emails
- [ ] Optimización de imágenes automática
- [ ] PWA (Progressive Web App)
- [ ] Analytics e métricas avanzadas

## 💡 Tips para Claude Code

### Al trabajar en este proyecto:
1. **Siempre revisar** los métodos de pago venezolanos antes de modificar lógica de checkout
2. **Usar el script gitpush.sh** para respaldos automáticos
3. **Verificar variables de entorno** antes de deployments (PostgreSQL/Supabase requerido)
4. **Mantener compatibilidad** con ambos modos: carrito y compra directa
5. **Testear siempre** en modo demo antes de producción
6. **Considerar la localización** (Venezuela, Caracas, métodos de pago locales)
7. **Usar ocasiones** en lugar de categorías para productos
8. **Aprovechar botones de login rápido** en desarrollo

### Comandos de utilidad:
```bash
# Verificar estado del proyecto
npm run demo && open http://localhost:3000

# Reset completo para pruebas
npm run db:reset && npm run demo

# Backup rápido
./gitpush.sh -q -m "Descripción del cambio"
```

---

**FloresYa** - Tu floristería en línea de confianza 🌸
*Desarrollado con ❤️ para el mercado venezolano*