# 🌸 FloresYa - Git Auto Push Script

Script mejorado para commit y push automático al repositorio de FloresYa.

## 🚀 Características Nuevas

### ✨ **Mejoras implementadas:**
- 🎨 **Banner visual** con branding FloresYa
- 📱 **Modo rápido** (`-q`) para automatización
- 💬 **Mensajes personalizados** (`-m`) con sugerencias
- 🌐 **Verificación de conexión** a GitHub
- 🔍 **Detección inteligente** de cambios
- 🔄 **Sync automático** con pull antes del push
- 📊 **Estadísticas detalladas** del repositorio
- 🎯 **Emojis y colores** para mejor UX

## 📖 Uso del Script

### 1. **Modo Interactivo** (recomendado)
```bash
./gitpush.sh
```
- Muestra cambios detallados
- Permite revisar diff
- Sugiere mensajes de commit
- Confirmación antes de push

### 2. **Modo Rápido**
```bash
./gitpush.sh -q
```
- Sin confirmaciones
- Mensaje automático
- Push directo

### 3. **Con Mensaje Personalizado**
```bash
./gitpush.sh -m "🌸 FloresYa: Implementar botones compra rápida"
```

### 4. **Rápido con Mensaje**
```bash
./gitpush.sh -q -m "✨ FloresYa: Actualizar carrusel productos"
```

### 5. **Ayuda**
```bash
./gitpush.sh -h
```

## 🎯 Mensajes Sugeridos

El script ahora sugiere mensajes siguiendo las mejores prácticas:

```bash
🌸 FloresYa: Implementar botones compra rápida
✨ FloresYa: Mejorar carrusel de productos  
🛠️ FloresYa: Actualizar panel administrativo
🐛 FloresYa: Corregir bugs en carrito de compras
📱 FloresYa: Optimizar responsive design
🚀 FloresYa: Deploy configuración Vercel
🔧 FloresYa: Refactor código backend
📝 FloresYa: Actualizar documentación
🎨 FloresYa: Mejorar estilos CSS
⚡ FloresYa: Optimizar performance
```

## 📊 Información Mostrada

### **Estado del repositorio:**
- Total de commits
- Rama actual  
- Último tag
- Archivos modificados

### **Información del commit:**
- Hash único
- Autor y fecha
- Mensaje completo

### **Verificaciones de seguridad:**
- Conexión a GitHub
- Cambios remotos
- Pull automático si es necesario

## 🛠️ Aliases Útiles

Agrega estos aliases a tu `~/.bashrc`:

```bash
# FloresYa Git Shortcuts
alias fgit='cd /home/manager/Sync/ecommerce-floresya && ./gitpush.sh'
alias fgitq='cd /home/manager/Sync/ecommerce-floresya && ./gitpush.sh -q'
alias fgitm='cd /home/manager/Sync/ecommerce-floresya && ./gitpush.sh -m'

# Después ejecutar: source ~/.bashrc
```

## 🔧 Solución de Problemas

### **Error de permisos:**
```bash
chmod +x gitpush.sh
```

### **Error de conexión:**
- Verifica conexión a internet
- Confirma acceso SSH a GitHub

### **Conflictos de merge:**
- El script detecta cambios remotos
- Hace pull automático
- Si hay conflictos, los reporta para resolución manual

## 🌸 Versión

**v2.0 - Claude Code Enhanced**
- Actualizado para FloresYa e-commerce
- Optimizado para flujo de trabajo ágil
- Compatible con proyecto Supabase + Vercel