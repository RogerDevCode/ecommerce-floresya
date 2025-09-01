# FloresYa - E-commerce para Floristería

## 🌸 Descripción

FloresYa es una plataforma de e-commerce moderna y escalable especializada en la venta de flores y arreglos florales en línea. Diseñada específicamente para el mercado venezolano, incluye métodos de pago locales como Pago Móvil, transferencias bancarias, Zelle y Binance Pay.

## ✨ Características Principales

- **Catálogo de Productos**: Gestión completa de productos con imágenes, categorías y filtros
- **Carrito de Compras**: Sistema de carrito persistente con cálculo automático de totales
- **Checkout Inteligente**: Proceso de checkout optimizado para usuarios registrados e invitados
- **Métodos de Pago Venezolanos**:
  - Pago Móvil (todos los bancos principales)
  - Transferencias Bancarias
  - Zelle
  - Binance Pay
- **Sistema de Órdenes**: Gestión completa del ciclo de vida de los pedidos
- **Panel de Administración**: Interface completa para gestión de pedidos, pagos y productos
- **Notificaciones por Email**: Confirmaciones automáticas y actualizaciones de estado
- **Diseño Responsivo**: Optimizado para dispositivos móviles y desktop
- **Seguridad**: Autenticación JWT, validación de datos y protección CSRF

## 🛠️ Tecnologías

### Backend
- **Node.js** + **Express.js**
- **MySQL** para base de datos
- **JWT** para autenticación
- **Nodemailer** para envío de emails
- **Multer** para carga de archivos
- **bcryptjs** para encriptación de contraseñas

### Frontend
- **HTML5**, **CSS3**, **JavaScript (ES6+)**
- **Bootstrap 5** para UI/UX
- **Bootstrap Icons** para iconografía
- **Responsive Design** con CSS Grid y Flexbox

### Herramientas de Desarrollo
- **nodemon** para desarrollo
- **dotenv** para variables de entorno
- **express-validator** para validación de datos

## 📋 Requisitos del Sistema

- **Node.js** 16.x o superior
- **MySQL** 8.0 o superior
- **NPM** 8.x o superior
- **Git** para control de versiones

## 🚀 Instalación Rápida (Un Solo Comando)

**Para probar la aplicación inmediatamente sin configuraciones:**

```bash
# Clona, instala y ejecuta todo automáticamente
git clone https://github.com/tu-usuario/ecommerce-floresya.git
cd ecommerce-floresya
npm install && npm run demo
```

**¡Eso es todo!** La aplicación estará disponible en `http://localhost:3000`

### 🔑 Cuentas de Prueba Pre-configuradas:
- **Admin**: admin@floresya.com / admin123
- **Cliente**: cliente@ejemplo.com / customer123

---

## 🗄️ Base de Datos

La aplicación usa **SQLite** - una base de datos en archivo único que no requiere instalación:
- ✅ **Cero configuración**
- ✅ **Datos incluidos**
- ✅ **Listo para usar**

### Comandos de Base de Datos:
```bash
# Resetear base de datos
npm run db:reset

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en modo demostración
npm run demo
```

---

## 🔧 Instalación Avanzada (Opcional)

Si deseas personalizar la configuración:

### 1. Variables de Entorno
```bash
cp .env.example .env
```

### 2. Configurar Email (Opcional)
```env
# Email Configuration (para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
```

### 3. Ejecutar
```bash
npm run dev  # Desarrollo con auto-reload
npm start    # Producción
```

## 📚 Estructura del Proyecto

```
ecommerce-floresya/
├── backend/
│   └── src/
│       ├── config/          # Configuraciones (DB, etc.)
│       ├── controllers/      # Controladores de rutas
│       ├── middleware/       # Middlewares personalizados
│       ├── models/          # Modelos de datos
│       ├── routes/          # Definición de rutas
│       ├── services/        # Servicios (email, etc.)
│       ├── utils/           # Utilidades
│       └── server.js        # Punto de entrada del servidor
├── frontend/
│   ├── css/                 # Estilos CSS
│   ├── js/                  # JavaScript del cliente
│   ├── images/              # Imágenes estáticas
│   ├── pages/               # Páginas HTML adicionales
│   └── index.html           # Página principal
├── database/
│   ├── schema.sql           # Esquema de la base de datos
│   └── seed_data.sql        # Datos de ejemplo
├── docs/                    # Documentación
├── uploads/                 # Archivos subidos
└── package.json
```

## 🗄️ Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema (clientes y administradores)
- **categories**: Categorías de productos
- **products**: Productos del catálogo
- **orders**: Órdenes de compra
- **order_items**: Items de las órdenes
- **payments**: Pagos realizados
- **payment_methods**: Métodos de pago disponibles
- **addresses**: Direcciones de envío
- **cart_items**: Items del carrito (usuarios logueados)

### Relaciones Clave

- Un usuario puede tener múltiples órdenes
- Una orden puede tener múltiples items
- Una orden puede tener múltiples pagos
- Los productos pertenecen a categorías

## 🔐 Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** para autenticación:

- **Registro**: `POST /api/auth/register`
- **Login**: `POST /api/auth/login`
- **Perfil**: `GET /api/auth/profile` (requiere token)

### Roles de Usuario
- **customer**: Cliente regular
- **admin**: Administrador del sistema

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (autenticado)
- `PUT /api/auth/profile` - Actualizar perfil (autenticado)

### Productos
- `GET /api/products` - Listar productos (con filtros y paginación)
- `GET /api/products/featured` - Productos destacados
- `GET /api/products/:id` - Detalle de producto
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)

### Órdenes
- `POST /api/orders` - Crear orden
- `GET /api/orders/my-orders` - Mis órdenes (autenticado)
- `GET /api/orders/:id` - Detalle de orden
- `GET /api/orders/admin/all` - Todas las órdenes (admin)
- `PATCH /api/orders/:id/status` - Actualizar estado (admin)

### Pagos
- `POST /api/payments` - Registrar pago
- `GET /api/payments/order/:order_id` - Pagos de una orden
- `GET /api/payments/admin/all` - Todos los pagos (admin)
- `PATCH /api/payments/:id/verify` - Verificar pago (admin)

### Otros
- `GET /api/categories` - Listar categorías
- `GET /api/payment-methods` - Métodos de pago activos
- `GET /api/settings` - Configuraciones del sistema

## 💳 Métodos de Pago

### Pago Móvil
- Soporte para todos los bancos principales de Venezuela
- Validación de datos requeridos (banco, cédula, teléfono)
- Carga de comprobante de pago

### Transferencia Bancaria
- Información de cuenta bancaria configurable
- Número de referencia requerido
- Comprobante de transferencia

### Zelle
- Pago internacional en USD
- ID de confirmación requerido
- Email del remitente

### Binance Pay
- Pago con criptomonedas
- ID de transacción requerido
- Usuario de Binance del remitente

## 👨‍💼 Panel de Administración

Accesible en `/pages/admin.html` para usuarios con rol `admin`.

### Funcionalidades:
- **Dashboard**: Estadísticas y órdenes recientes
- **Gestión de Órdenes**: Ver, actualizar estados, historial
- **Gestión de Pagos**: Verificar, aprobar o rechazar pagos
- **Gestión de Productos**: CRUD básico (en desarrollo)
- **Reportes**: Métricas de ventas y performance

### Estados de Órdenes:
1. **Pending**: Orden creada, esperando pago
2. **Verified**: Pago verificado
3. **Preparing**: Orden en preparación
4. **Shipped**: Orden enviada
5. **Delivered**: Orden entregada
6. **Cancelled**: Orden cancelada

## 📧 Sistema de Emails

### Emails Automáticos:
- **Confirmación de Orden**: Enviado al crear una orden
- **Actualización de Estado**: Enviado al cambiar estado de orden
- **Verificación de Pago**: Notificaciones de pago

### Configuración SMTP:
Compatible con Gmail, Outlook y otros proveedores SMTP.

## 🔒 Seguridad

### Medidas Implementadas:
- **Rate Limiting**: Protección contra spam/DDoS
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de acceso entre dominios
- **Validación**: Sanitización de entradas
- **Encriptación**: Contraseñas hasheadas con bcrypt
- **JWT**: Tokens seguros con expiración

## 🚀 Despliegue en Producción

### 1. Servidor VPS/Cloud

#### Requisitos del Servidor:
- **Ubuntu 20.04** o superior
- **2GB RAM** mínimo (4GB recomendado)
- **20GB** espacio en disco
- **Node.js 16+**, **MySQL 8.0+**, **Nginx**

#### Pasos de Despliegue:

```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# 4. Instalar Nginx
sudo apt install nginx -y

# 5. Instalar PM2 (Process Manager)
sudo npm install -g pm2

# 6. Clonar proyecto
git clone https://github.com/tu-usuario/ecommerce-floresya.git
cd ecommerce-floresya

# 7. Instalar dependencias
npm install --production

# 8. Configurar base de datos
mysql -u root -p < database/schema.sql

# 9. Configurar variables de entorno
cp .env.example .env
# Editar .env con configuraciones de producción

# 10. Crear directorio de uploads
mkdir -p uploads/payments

# 11. Iniciar con PM2
pm2 start backend/src/server.js --name "floresya"
pm2 save
pm2 startup
```

### 2. Configuración de Nginx

Crear archivo `/etc/nginx/sites-available/floresya`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Serve static files
    location / {
        root /path/to/ecommerce-floresya/frontend;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads/ {
        root /path/to/ecommerce-floresya;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

Activar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/floresya /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## 🔍 Monitoreo y Logs

### Ver logs de la aplicación:
```bash
pm2 logs floresya
```

### Monitorear recursos:
```bash
pm2 monit
```

### Restart aplicación:
```bash
pm2 restart floresya
```

## 🧪 Testing

### Ejecutar tests:
```bash
npm test
```

### Linting:
```bash
npm run lint
```

## 📝 Configuraciones Adicionales

### Variables de Entorno de Producción:
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
# ... otras configuraciones
```

### Backup de Base de Datos:
```bash
# Crear backup
mysqldump -u root -p floresya_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u root -p floresya_db < backup_20241201.sql
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📞 Soporte

Para soporte técnico o consultas:
- **Email**: soporte@floresya.com
- **WhatsApp**: +58412-1234567

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Créditos

Desarrollado con ❤️ para el mercado venezolano de floristerías.

---

**FloresYa** - Tu floristería en línea de confianza 🌸# ecommerce-floresya
# ecommerce-floresya
