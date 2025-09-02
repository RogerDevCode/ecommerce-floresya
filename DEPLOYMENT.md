# 🚀 FloresYa - Guía de Despliegue en Vercel

## 📋 Prerequisitos

1. **Cuenta en Vercel** - https://vercel.com
2. **Cuenta en Supabase** - https://supabase.com (ya configurada)
3. **Repositorio en GitHub** - Tu código debe estar en GitHub

## 🔧 Pasos para el Despliegue

### 1. **Subir código a GitHub**
```bash
# Si no tienes git inicializado
git init
git add .
git commit -m "🌸 FloresYa - Ready for production deployment"

# Si ya tienes un repositorio
git add .
git commit -m "🚀 Updated for Vercel deployment"
git push origin main
```

### 2. **Conectar con Vercel**
1. Ve a https://vercel.com y haz login
2. Click en "New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente la configuración

### 3. **Configurar Variables de Entorno en Vercel**
En el dashboard de Vercel, ve a Settings → Environment Variables y agrega:

#### 🔐 Variables Requeridas:
```
SUPABASE_URL=https://dcbavpdlkcjdtjdkntde.supabase.co
SUPABASE_ANON_KEY=tu_clave_anon_aqui
SUPABASE_SERVICE_KEY=tu_clave_service_aqui
DB_HOST=db.dcbavpdlkcjdtjdkntde.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_SSL=true
JWT_SECRET=tu_jwt_secret_super_seguro
NODE_ENV=production
```

#### 📧 Variables Opcionales:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
```

### 4. **Desplegar**
1. Click en "Deploy"
2. Espera que termine el build (2-3 minutos)
3. ¡Tu app estará lista!

## 🌍 URLs de Producción

Una vez desplegado tendrás:
- **Homepage**: https://tu-app.vercel.app
- **API**: https://tu-app.vercel.app/api/health
- **Admin**: https://tu-app.vercel.app/pages/admin.html

## 🎯 Verificación Post-Despliegue

### Checklist:
- [ ] Homepage carga correctamente
- [ ] API responde: `/api/health`
- [ ] Productos se muestran: `/api/products`
- [ ] Imágenes de Supabase cargan
- [ ] Panel admin funciona
- [ ] Base de datos conectada

### Comandos de Verificación:
```bash
# Test API
curl https://tu-app.vercel.app/api/health

# Test productos
curl https://tu-app.vercel.app/api/products?limit=3
```

## 🔧 Configuraciones Automáticas

### ✅ Ya configurado:
- **vercel.json** - Rutas y configuraciones
- **package.json** - Scripts de build
- **.vercelignore** - Archivos excluidos
- **Variables de entorno** - Template ready

### 🏗️ Build Process:
1. Vercel detecta Node.js
2. Instala dependencias: `npm install`
3. Ejecuta build: `npm run build`
4. Despliega función serverless
5. Sirve archivos estáticos

## 🚨 Solución de Problemas

### Error común: "Build failed"
```bash
# Verifica locally
npm install
npm run build
npm start
```

### Error: "Environment variables missing"
- Verifica que todas las variables estén en Vercel Settings

### Error: "Database connection failed"
- Verifica credenciales de Supabase
- Confirma que DB_SSL=true

## 🎉 ¡Tu E-commerce está LISTO!

### Funcionalidades en Producción:
- ✅ **E-commerce completo** con carrito de compras
- ✅ **Imágenes optimizadas** WebP desde Supabase
- ✅ **Panel administrativo** funcional
- ✅ **API REST completa** para productos, órdenes, etc.
- ✅ **Pagos integrados** con múltiples métodos
- ✅ **Responsive design** para móviles
- ✅ **Base de datos PostgreSQL** escalable
- ✅ **Autenticación segura** con JWT

---
**🌸 FloresYa - E-commerce de Flores Profesional**