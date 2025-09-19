# Plan de Acción: Limpieza y Verificación de Estructura del Proyecto E-commerce FloresYa

## Finalidad del Plan
Realizar una limpieza minuciosa de la estructura del proyecto, eliminar archivos duplicados o mal ubicados, verificar rutas de importación/exportación, y asegurar que el proyecto siga los estándares establecidos para Vercel y TypeScript. Se enfoca en mantener la separación estricta entre código fuente (src/), archivos compilados (dist/), y archivos estáticos (public/), además de resolver cualquier problema con la funcionalidad del modal de gestión de imágenes.

## Checklist de Tareas

### ✅ Verificación de Estructura del Proyecto
- [x] Buscar archivos JavaScript fuera de ubicaciones permitidas (dist/, scripts/, node_modules/)
- [x] Verificar duplicados de directorios (src/, app/, controllers/, etc.)
- [x] Confirmar que no existen archivos .js en src/ o public/
- [x] Validar que archivos estáticos están solo en public/
- [x] Comprobar que archivos compilados están solo en dist/

### 🔄 Regeneración de Archivos Compilados
- [ ] Ejecutar `npm run build` para regenerar dist/ con código TypeScript actual
- [ ] Verificar que todos los archivos .ts se compilen correctamente
- [ ] Asegurar que rutas de importación en HTML apunten a /dist/frontend/*.js

### 🔍 Verificación de Rutas de Importación/Exportación
- [ ] Revisar imports en archivos TypeScript para rutas correctas
- [ ] Verificar exports en módulos principales (api.ts, main.ts, etc.)
- [ ] Comprobar consistencia de tipos entre frontend y backend
- [ ] Validar que todas las dependencias se resuelvan correctamente

### 🖼️ Diagnóstico y Reparación del Modal de Imágenes
- [ ] Verificar funcionamiento del endpoint `/api/products/:id/images`
- [ ] Probar carga de imágenes en el modal de administración
- [ ] Corregir cualquier problema con la visualización del título del modal
- [ ] Asegurar que las imágenes se muestren correctamente en la galería

### 🧪 Pruebas de Funcionalidad
- [ ] Ejecutar pruebas unitarias existentes
- [ ] Verificar que la aplicación se ejecute sin errores
- [ ] Probar funcionalidades críticas (login, productos, carrito)
- [ ] Validar responsive design y UX

### 📝 Documentación y Limpieza Final
- [ ] Actualizar documentación si es necesario
- [ ] Limpiar archivos temporales generados durante el proceso
- [ ] Verificar que el proyecto esté listo para despliegue en Vercel
- [ ] Confirmar cumplimiento de estándares de código y mejores prácticas

## Notas Importantes
- **NO modificar** archivos de configuración (tsconfig.json, package.json, vercel.json) sin autorización explícita
- Mantener separación estricta: src/ (TS) → dist/ (JS compilado) → public/ (estáticos)
- Priorizar resolución de problemas desde la primera iteración sin stubs o código temporal
- Aplicar estándares rigurosos de TypeScript y ESLint
- Verificar compatibilidad con el esquema de Supabase sin modificarlo

## Estado Actual
- ✅ Estructura del proyecto verificada y limpia
- ✅ No se encontraron archivos duplicados o mal ubicados
- 🔄 Pendiente regeneración de dist/ y verificación de funcionalidades