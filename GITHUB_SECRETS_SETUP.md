# 🔐 Configuración de GitHub Secrets para FloresYa

Este documento explica cómo configurar los GitHub Repository Secrets necesarios para que el CI/CD pipeline funcione correctamente.

## 📋 Requisitos Previos

1. Tener acceso de administrador al repositorio de GitHub
2. Tener un proyecto activo en Supabase
3. Tener las credenciales de Supabase a mano

## 🔑 Secrets Requeridos

### Obligatorios para CI/CD:
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
```

### Opcionales para auto-deployment:
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## 🚀 Pasos de Configuración

### 1. Navegar a GitHub Secrets

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (tab superior)
3. En el menú lateral, click en **Secrets and variables** > **Actions**
4. Click en **New repository secret**

### 2. Obtener Valores de Supabase

#### A. SUPABASE_URL y SUPABASE_ANON_KEY

1. Ve a tu [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. Copia los valores:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`

#### B. SUPABASE_SERVICE_ROLE_KEY

⚠️ **IMPORTANTE**: Esta clave es muy sensible, nunca la expongas públicamente.

1. En la misma página de **Settings** > **API**
2. En la sección **Project API keys**
3. Copia el valor de **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

#### C. JWT_SECRET

Usa uno de estos métodos:

**Opción 1**: Usar el que tienes en tu `.env` local
```bash
# Si ya tienes uno configurado
JWT_SECRET=tu-jwt-secret-actual
```

**Opción 2**: Generar uno nuevo
```bash
# En terminal, genera uno seguro:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Configurar Secrets en GitHub

Para cada secret, repite estos pasos:

1. Click en **New repository secret**
2. Ingresa el **Name** (ej: `SUPABASE_URL`)
3. Ingresa el **Secret** (el valor correspondiente)
4. Click en **Add secret**

### 4. Verificar Configuración

#### Opción A: Usar el script de verificación
```bash
# En tu proyecto local:
node scripts/check-env.js
```

#### Opción B: Verificar manualmente
1. Ve a **Settings** > **Secrets and variables** > **Actions**
2. Deberías ver todos los secrets listados (los valores están ocultos)

## 🔧 Valores de Ejemplo

```bash
# ✅ CORRECTO (formato esperado):
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...

# ❌ INCORRECTO:
SUPABASE_URL=localhost:3000  # No es una URL de Supabase
SUPABASE_ANON_KEY=abc123     # Muy corto, no es un JWT válido
```

## 🚨 Troubleshooting

### Error: "SUPABASE_URL not configured"
- Verifica que el secret `SUPABASE_URL` existe en GitHub
- Verifica que el formato sea: `https://tu-proyecto.supabase.co`

### Error: "Authentication failed"
- Verifica que `SUPABASE_ANON_KEY` sea correcto
- Verifica que `SUPABASE_SERVICE_ROLE_KEY` sea correcto
- Asegúrate de no confundir anon key con service role key

### CI/CD sigue fallando
1. Ve a **Actions** tab en GitHub
2. Click en el workflow que falló
3. Revisa los logs para errores específicos
4. Verifica que todos los secrets estén configurados

## 📞 Soporte

Si necesitas ayuda:
1. Revisa los logs del workflow en GitHub Actions
2. Ejecuta `node scripts/check-env.js` localmente
3. Verifica que tu proyecto de Supabase esté activo

---
*Generado para FloresYa E-commerce Platform*