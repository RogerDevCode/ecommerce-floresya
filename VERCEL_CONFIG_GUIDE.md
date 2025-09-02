# 🔐 Guía de Configuración de Variables de Entorno en Vercel

## 📋 Paso a Paso para Configurar Variables de Entorno

### 1. Acceder a tu Proyecto en Vercel
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto `ecommerce-floresya`
3. Click en **"Settings"** (Configuración)
4. Click en **"Environment Variables"** (Variables de Entorno)

### 2. Copiar y Pegar Variables (Una por línea)

**🚀 FORMATO PARA COPIAR/PEGAR FÁCIL:**

#### 🔑 Variables de Base de Datos (CRÍTICAS):
```
SUPABASE_URL=https://dcbavpdlkcjdtjdkntde.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjYmF2cGRsa2NqZHRqZGtudGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Njc4OTksImV4cCI6MjA3MjM0Mzg5OX0._iOdoiQwLCW0tDxWZvTtYZbhqoBivbWLQACPiFjr_yU
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjYmF2cGRsa2NqZHRqZGtudGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2Nzg5OSwiZXhwIjoyMDcyMzQzODk5fQ.MwbJfs2vXZJMDXT5bcdYjt0_pZ1OD7V7b_v0q_3tK2Q
DB_HOST=db.dcbavpdlkcjdtjdkntde.supabase.co
DB_PASSWORD=r4Hn5lv7xf3JH&
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_SSL=true
```

#### 🔐 Variables de Seguridad:
```
JWT_SECRET=FloresYa_Production_Secret_Key_2024_Vercel
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

#### ⚙️ Variables de Configuración:
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SQL_LOGGING=false
```

#### 📝 Instrucciones para cada variable:
1. **Copia** la línea completa (ejemplo: `SUPABASE_URL=https://...`)
2. En Vercel, **pega** en el campo "Name" solo la parte antes del = (ejemplo: `SUPABASE_URL`)
3. **Pega** en el campo "Value" solo la parte después del = (ejemplo: `https://...`)
4. **Selecciona** Production, Preview, Development
5. **Click** "Save"

### 3. Configurar Ambientes

**IMPORTANTE:** Para cada variable, selecciona los ambientes:
- ✅ **Production** (Producción)
- ✅ **Preview** (Vista previa)
- ✅ **Development** (Desarrollo)

### 4. Verificar Configuración

Una vez agregadas todas las variables, deberías ver:
- **14 variables de entorno** configuradas
- Todas marcadas para **Production, Preview, Development**

#### ✅ Checklist de variables (total: 14):
- [ ] SUPABASE_URL
- [ ] SUPABASE_ANON_KEY  
- [ ] SUPABASE_SERVICE_KEY
- [ ] DB_HOST
- [ ] DB_PASSWORD
- [ ] DB_PORT
- [ ] DB_NAME
- [ ] DB_USER
- [ ] DB_SSL
- [ ] JWT_SECRET
- [ ] JWT_EXPIRES_IN
- [ ] NODE_ENV
- [ ] RATE_LIMIT_WINDOW_MS
- [ ] RATE_LIMIT_MAX_REQUESTS
- [ ] SQL_LOGGING

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