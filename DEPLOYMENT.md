# 🚀 FloresYa Deployment Guide

## GitHub Actions CI/CD Pipeline

El pipeline está configurado para ejecutarse automáticamente en pushes al branch `main` y `develop`.

### 📊 Estados de Tests

Los tests ahora están configurados para TypeScript y deberían pasar correctamente:

- ✅ **Security Scan** - Audit de dependencias y Snyk
- ✅ **Code Quality** - ESLint + TypeScript type checking
- ✅ **Build Test** - Compilación de TypeScript
- ✅ **Backend Tests** - Tests básicos de API endpoints
- ✅ **Frontend Tests** - Tests básicos de funcionamiento
- ✅ **Performance Tests** - Tests básicos de rendimiento

## 🔧 Configuración de Secretos de GitHub

Para habilitar el despliegue automático a Vercel, configura estos secretos en GitHub:

### Pasos para Configurar Secretos:

1. Ve a tu repositorio en GitHub
2. Navega a **Settings** > **Secrets and variables** > **Actions**
3. Haz clic en **New repository secret**
4. Añade estos secretos:

### Secretos Requeridos:

#### `VERCEL_TOKEN`
- Ve a [Vercel Dashboard](https://vercel.com/account/tokens)
- Crea un nuevo token con permisos de Deploy
- Copia el token y pégalo como secreto

#### `VERCEL_ORG_ID`
- **Si eres usuario individual**:
  - Ve a [Vercel Settings](https://vercel.com/account)
  - En "General", copia tu **User ID**
- **Si estás en un team**:
  - Ve a tu Team Settings en Vercel
  - Copia el **Team ID**

#### `VERCEL_PROJECT_ID`
- Ve a tu proyecto en Vercel Dashboard
- Clic en **Settings** del proyecto
- En la sección **General**, copia el **Project ID**

### 🔍 Cómo Obtener los IDs Correctos:

1. **Crear proyecto en Vercel primero**:
   ```bash
   # Conecta tu repo a Vercel manualmente
   vercel link
   ```

2. **Obtener IDs desde CLI**:
   ```bash
   # Esto te mostrará el proyecto y org ID
   vercel env ls
   ```

3. **Verificar en Dashboard**:
   - Proyecto: `https://vercel.com/[username]/[project-name]/settings`
   - IDs aparecen en la pestaña General

### Secretos Opcionales:

#### `SUPABASE_URL`
- URL de tu proyecto Supabase
- Ejemplo: `https://xyz.supabase.co`

#### `SUPABASE_ANON_KEY`
- Clave anónima de tu proyecto Supabase

#### `JWT_SECRET`
- Secreto para firmar JWTs
- Genera uno seguro: `openssl rand -base64 32`

#### `SNYK_TOKEN`
- Token de Snyk para security scanning (opcional)

#### `SONAR_TOKEN`
- Token de SonarCloud para análisis de código (opcional)

## 🛠️ Despliegue Manual

Si no tienes configurados los secretos de Vercel, puedes desplegar manualmente:

### Prerrequisitos:
```bash
npm install -g vercel
```

### Pasos:
```bash
# 1. Construir el proyecto
npm run build

# 2. Desplegar a Vercel
vercel --prod

# O en una sola línea:
npm run build && vercel --prod
```

## 🔍 Verificación de Despliegue

Una vez desplegado, verifica que todo funciona:

1. **Health Check**: `https://tu-dominio.vercel.app/api/health`
2. **API Products**: `https://tu-dominio.vercel.app/api/products`
3. **Frontend**: `https://tu-dominio.vercel.app`

## 🐛 Troubleshooting

### Si el CI/CD falla:

1. **Revisa los logs** en GitHub Actions
2. **Verifica secretos** estén configurados correctamente
3. **Tests locales**:
   ```bash
   npm run lint
   npm run type:check
   npm run build
   ```

### Si el despliegue falla:

1. **Verifica el build local**:
   ```bash
   npm run clean
   npm run build
   node dist/app/server.js
   ```

2. **Revisa logs de Vercel** en su dashboard

3. **Variables de entorno** en Vercel deben estar configuradas

## 📈 Monitoreo

- **GitHub Actions**: Revisa el estado en la pestaña Actions
- **Vercel Dashboard**: Monitorea performance y errores
- **Health Endpoint**: `GET /api/health` para verificar estado

## 🔄 Workflow

1. **Desarrollo**: Trabaja en branch `develop`
2. **Pull Request**: Crea PR hacia `main`
3. **Tests**: CI/CD ejecuta automáticamente
4. **Merge**: Al hacer merge a `main`, se despliega automáticamente
5. **Verificación**: Revisa que el despliegue sea exitoso

---

*Última actualización: $(date)*