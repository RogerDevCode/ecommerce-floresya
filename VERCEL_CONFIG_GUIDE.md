# 🔐 Guía de Configuración de Variables de Entorno en Vercel

## 📋 Paso a Paso para Configurar Variables de Entorno

### 1. Acceder a tu Proyecto en Vercel
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto `ecommerce-floresya`
3. Click en **"Settings"** (Configuración)
4. Click en **"Environment Variables"** (Variables de Entorno)

### 2. Agregar Variables una por una

**COPIA Y PEGA EXACTAMENTE ESTAS VARIABLES:**

#### 🔑 Variables de Base de Datos (CRÍTICAS):
```
Variable: SUPABASE_URL
Value: https://dcbavpdlkcjdtjdkntde.supabase.co

Variable: SUPABASE_ANON_KEY  
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjYmF2cGRsa2NqZHRqZGtudGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Njc4OTksImV4cCI6MjA3MjM0Mzg5OX0._iOdoiQwLCW0tDxWZvTtYZbhqoBivbWLQACPiFjr_yU

Variable: SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjYmF2cGRsa2NqZHRqZGtudGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2Nzg5OSwiZXhwIjoyMDcyMzQzODk5fQ.MwbJfs2vXZJMDXT5bcdYjt0_pZ1OD7V7b_v0q_3tK2Q

Variable: DB_HOST
Value: db.dcbavpdlkcjdtjdkntde.supabase.co

Variable: DB_PASSWORD
Value: r4Hn5lv7xf3JH&

Variable: DB_PORT
Value: 5432

Variable: DB_NAME
Value: postgres

Variable: DB_USER  
Value: postgres

Variable: DB_SSL
Value: true
```

#### 🔐 Variables de Seguridad:
```
Variable: JWT_SECRET
Value: FloresYa_Production_Secret_Key_2024_Vercel

Variable: JWT_EXPIRES_IN
Value: 7d

Variable: NODE_ENV
Value: production
```

#### ⚙️ Variables de Configuración:
```
Variable: RATE_LIMIT_WINDOW_MS
Value: 900000

Variable: RATE_LIMIT_MAX_REQUESTS  
Value: 100

Variable: SQL_LOGGING
Value: false
```

### 3. Configurar Ambientes

**IMPORTANTE:** Para cada variable, selecciona los ambientes:
- ✅ **Production** (Producción)
- ✅ **Preview** (Vista previa)
- ✅ **Development** (Desarrollo)

### 4. Verificar Configuración

Una vez agregadas todas las variables, deberías ver:
- **14 variables de entorno** configuradas
- Todas marcadas para **Production, Preview, Development**

## 🚀 Después de Configurar Variables

### Paso 1: Forzar Nuevo Deployment
1. Ve a la pestaña **"Deployments"**
2. Click en los 3 puntos del deployment más reciente
3. Click **"Redeploy"** 
4. Selecciona **"Use existing Build Cache"** → NO
5. Click **"Redeploy"**

### Paso 2: Verificar que Funciona
Espera 2-3 minutos y prueba:
- **Homepage**: https://ecommerce-floresya-7.vercel.app
- **API Health**: https://ecommerce-floresya-7.vercel.app/api/health
- **Productos**: https://ecommerce-floresya-7.vercel.app/api/products

**✅ Respuesta esperada de /api/health:**
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2025-09-02T...",
  "version": "1.0.0",
  "environment": "vercel"
}
```

## 🔧 Troubleshooting

### Si sigues viendo errores 500:
1. Ve a **Vercel Dashboard** → **Functions** → **View Function Logs**
2. Busca errores de conexión a base de datos
3. Verifica que todas las 14 variables estén configuradas
4. Haz un nuevo deployment

### Si las imágenes no cargan:
- Las imágenes están en Supabase Storage
- URL base: `https://dcbavpdlkcjdtjdkntde.supabase.co/storage/v1/object/public/product-images/`

### Variables Opcionales (Email):
Si quieres emails funcionando (opcional):
```
Variable: EMAIL_SERVICE
Value: gmail

Variable: EMAIL_USER
Value: tu-email@gmail.com

Variable: EMAIL_PASSWORD
Value: tu-app-password-gmail
```

## 📊 Status Check

Una vez configurado correctamente:
- ✅ **API**: Todas las rutas funcionando
- ✅ **Base de datos**: Supabase conectada
- ✅ **Imágenes**: Supabase Storage funcionando
- ✅ **Frontend**: Carga completa sin errores
- ✅ **Admin Panel**: Accesible y funcional

---

**🌸 ¡Tu FloresYa estará completamente funcional en Vercel!**

---
*Última actualización: 2025-09-02*