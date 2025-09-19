# Plan de Acción: Limpieza de Archivos Duplicados y Estructura del Proyecto

## Finalidad
Realizar una limpieza meticulosa del proyecto e-commerce para eliminar archivos duplicados, directorios replicados y archivos JS ubicados incorrectamente fuera de `dist`, manteniendo la integridad funcional y la estructura estándar compatible con Vercel.

## Checklist de Tareas

### Fase 1: Análisis y Diagnóstico
- [x] Analizar estructura completa del proyecto para identificar duplicados
- [x] Identificar archivos JS fuera de directorio dist
- [x] Detectar directorios duplicados en src
- [x] Verificar importaciones y exportaciones activas

### Fase 2: Mapeo y Planificación
- [x] Crear mapa de dependencias entre archivos
- [x] Identificar archivos seguros para eliminación
- [x] Documentar rutas de importación que requieren corrección

### Fase 3: Limpieza Controlada
- [x] Eliminar archivos duplicados confirmados como seguros
- [x] Corregir rutas de importación rotas
- [x] Mantener estructura estándar para Vercel

### Fase 4: Verificación
- [x] Verificar funcionalidad del proyecto post-limpieza
- [x] Ejecutar build y validar compilación
- [x] Confirmar que todas las rutas funcionan correctamente

## ✅ LIMPIEZA COMPLETADA EXITOSAMENTE

### Problemas Detectados y Resueltos
1. **Duplicación masiva**: Se eliminó directorio `public/src/` que duplicaba completamente `src/`
2. **Archivos JS fuera de dist**: Se eliminaron archivos JS esparcidos en `public/`
3. **Configuración TypeScript incorrecta**: Se corrigió `rootDir: "."` a `rootDir: "./src"`
4. **Comandos build con workarounds**: Se eliminaron `build:post` y `build:frontend` innecesarios
5. **Rutas HTML incorrectas**: Se actualizaron todas las rutas para apuntar a `/dist/frontend/`

### Archivos JS Restantes (Legítimos)
- `scripts/check-env.js` - Script de configuración
- `vitest.config.js` - Configuración de testing

### Estructura Final Correcta
```
├── src/              # Código fuente TypeScript
├── dist/             # Código compilado JavaScript
│   ├── app/
│   ├── frontend/
│   ├── controllers/
│   └── services/
└── public/           # Solo archivos estáticos (HTML, CSS, imágenes)
```

## Notas Importantes
- **Precaución máxima**: Cada eliminación debe ser verificada para evitar romper funcionalidad
- **Backup implícito**: Git permite recuperar archivos si es necesario
- **Estructura objetivo**: Mantener TypeScript en `src/` y JavaScript compilado solo en `dist/`