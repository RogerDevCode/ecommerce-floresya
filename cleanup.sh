#!/bin/bash

# Script de limpieza para FloresYa E-commerce
# Elimina archivos innecesarios y optimiza el directorio del proyecto
# Versión: 1.0 - Claude Code

# Configuración
PROJECT_DIR="/home/manager/Sync/ecommerce-floresya"
LOG_FILE="$PROJECT_DIR/cleanup.log"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo -e "$1"
}

# Función para mostrar banner
show_banner() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                 🌸 FloresYa Cleanup Script 🌸            ║"
    echo "║              Limpieza de Archivos Innecesarios           ║"
    echo "║                     v1.0 - Claude Code                   ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Función para obtener tamaño de directorio
get_dir_size() {
    du -sh "$1" 2>/dev/null | cut -f1
}

# Función para contar archivos
count_files() {
    find "$1" -type f 2>/dev/null | wc -l
}

show_banner

# Verificar que estamos en el directorio correcto
if [ ! -d "$PROJECT_DIR" ]; then
    log "${RED}❌ [ERROR] Directorio del proyecto no encontrado: $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

log "${BLUE}ℹ️ [INFO] Iniciando limpieza en: $(pwd)${NC}"

# Obtener estadísticas iniciales
INITIAL_SIZE=$(get_dir_size ".")
INITIAL_FILES=$(count_files ".")
log "${BLUE}ℹ️ [INFO] Tamaño inicial: $INITIAL_SIZE (${INITIAL_FILES} archivos)${NC}"

# Contador de archivos eliminados
DELETED_COUNT=0

# 1. Limpiar archivos temporales del sistema
log "${YELLOW}⚠️ [CLEANING] Eliminando archivos temporales del sistema...${NC}"

# Archivos temporales comunes
TEMP_PATTERNS=(
    "*.tmp"
    "*.temp"
    "*~"
    ".DS_Store"
    "Thumbs.db"
    "desktop.ini"
    "*.swp"
    "*.swo"
    ".*.swp"
    ".*.swo"
)

for pattern in "${TEMP_PATTERNS[@]}"; do
    files_found=$(find . -name "$pattern" -type f 2>/dev/null)
    if [ -n "$files_found" ]; then
        count=$(echo "$files_found" | wc -l)
        find . -name "$pattern" -type f -delete 2>/dev/null
        DELETED_COUNT=$((DELETED_COUNT + count))
        log "${GREEN}✅ [SUCCESS] Eliminados $count archivos $pattern${NC}"
    fi
done

# 2. Limpiar logs antiguos
log "${YELLOW}⚠️ [CLEANING] Limpiando logs antiguos...${NC}"

# Mantener solo los logs de los últimos 7 días
find . -name "*.log" -type f -mtime +7 -exec rm -f {} \; 2>/dev/null
log "${GREEN}✅ [SUCCESS] Logs antiguos eliminados${NC}"

# 3. Limpiar archivos de respaldo automático
log "${YELLOW}⚠️ [CLEANING] Eliminando archivos de respaldo automático...${NC}"

BACKUP_PATTERNS=(
    "*.bak"
    "*.backup"
    "*_backup"
    "*.orig"
    "*.save"
)

for pattern in "${BACKUP_PATTERNS[@]}"; do
    files_found=$(find . -name "$pattern" -type f 2>/dev/null)
    if [ -n "$files_found" ]; then
        count=$(echo "$files_found" | wc -l)
        find . -name "$pattern" -type f -delete 2>/dev/null
        DELETED_COUNT=$((DELETED_COUNT + count))
        log "${GREEN}✅ [SUCCESS] Eliminados $count archivos de respaldo $pattern${NC}"
    fi
done

# 4. Limpiar archivos de desarrollo
log "${YELLOW}⚠️ [CLEANING] Limpiando archivos de desarrollo innecesarios...${NC}"

# Eliminar archivos de debug y test temporales
if [ -f "debug-images.html" ]; then
    rm -f "debug-images.html"
    DELETED_COUNT=$((DELETED_COUNT + 1))
    log "${GREEN}✅ [SUCCESS] debug-images.html eliminado${NC}"
fi

if [ -f "simple-test.html" ]; then
    rm -f "simple-test.html"
    DELETED_COUNT=$((DELETED_COUNT + 1))
    log "${GREEN}✅ [SUCCESS] simple-test.html eliminado${NC}"
fi

if [ -f "test-frontend.html" ]; then
    rm -f "test-frontend.html"
    DELETED_COUNT=$((DELETED_COUNT + 1))
    log "${GREEN}✅ [SUCCESS] test-frontend.html eliminado${NC}"
fi

# 5. Limpiar archivos de cache de Node.js
log "${YELLOW}⚠️ [CLEANING] Limpiando cache de Node.js...${NC}"

if [ -d ".npm" ]; then
    rm -rf ".npm"
    log "${GREEN}✅ [SUCCESS] .npm cache eliminado${NC}"
fi

if [ -d ".node_repl_history" ]; then
    rm -f ".node_repl_history"
    log "${GREEN}✅ [SUCCESS] .node_repl_history eliminado${NC}"
fi

# 6. Optimizar directorio uploads/
log "${YELLOW}⚠️ [CLEANING] Optimizando directorio uploads/...${NC}"

if [ -d "uploads" ]; then
    # Eliminar archivos de uploads temporales o corruptos
    find uploads/ -name "temp_*" -type f -delete 2>/dev/null
    find uploads/ -name "tmp_*" -type f -delete 2>/dev/null
    find uploads/ -size 0 -type f -delete 2>/dev/null
    log "${GREEN}✅ [SUCCESS] Uploads temporales eliminados${NC}"
fi

# 7. Limpiar archivos de editor
log "${YELLOW}⚠️ [CLEANING] Eliminando archivos de editores...${NC}"

EDITOR_PATTERNS=(
    ".vscode/settings.json"
    ".idea/"
    "*.sublime-project"
    "*.sublime-workspace"
)

for pattern in "${EDITOR_PATTERNS[@]}"; do
    if [[ "$pattern" == *"/" ]]; then
        # Es un directorio
        if [ -d "$pattern" ]; then
            rm -rf "$pattern"
            log "${GREEN}✅ [SUCCESS] Directorio $pattern eliminado${NC}"
        fi
    else
        # Es un archivo
        files_found=$(find . -name "$pattern" -type f 2>/dev/null)
        if [ -n "$files_found" ]; then
            count=$(echo "$files_found" | wc -l)
            find . -name "$pattern" -type f -delete 2>/dev/null
            DELETED_COUNT=$((DELETED_COUNT + count))
            log "${GREEN}✅ [SUCCESS] Eliminados $count archivos $pattern${NC}"
        fi
    fi
done

# 8. Limpiar archivos SQL temporales antiguos
log "${YELLOW}⚠️ [CLEANING] Limpiando archivos SQL temporales...${NC}"

SQL_TEMP_FILES=(
    "database-updates.sql"
    "update-primary-images.sql"
    "temp_*.sql"
    "backup_*.sql"
)

for pattern in "${SQL_TEMP_FILES[@]}"; do
    if [ -f "$pattern" ]; then
        # Verificar si es más antiguo que 30 días
        if [ $(find . -name "$pattern" -mtime +30 2>/dev/null | wc -l) -gt 0 ]; then
            rm -f "$pattern"
            DELETED_COUNT=$((DELETED_COUNT + 1))
            log "${GREEN}✅ [SUCCESS] SQL temporal $pattern eliminado${NC}"
        fi
    fi
done

# 9. Comprimir logs antiguos (opcional)
log "${YELLOW}⚠️ [CLEANING] Comprimiendo logs antiguos...${NC}"

if command -v gzip &> /dev/null; then
    find . -name "*.log" -type f -mtime +1 -exec gzip {} \; 2>/dev/null
    log "${GREEN}✅ [SUCCESS] Logs antiguos comprimidos${NC}"
else
    log "${YELLOW}⚠️ [WARNING] gzip no disponible, logs no comprimidos${NC}"
fi

# 10. Limpiar directorios vacíos
log "${YELLOW}⚠️ [CLEANING] Eliminando directorios vacíos...${NC}"

# Buscar y eliminar directorios vacíos (excepto .git y node_modules)
find . -type d -empty -not -path "./.git/*" -not -path "./node_modules/*" -delete 2>/dev/null
log "${GREEN}✅ [SUCCESS] Directorios vacíos eliminados${NC}"

# Obtener estadísticas finales
FINAL_SIZE=$(get_dir_size ".")
FINAL_FILES=$(count_files ".")

# Mostrar resumen
echo
log "${GREEN}🚀 [SUCCESS] ¡Limpieza completada!${NC}"
log "${BLUE}ℹ️ [INFO] Estadísticas finales:${NC}"
log "${BLUE}  📊 Tamaño inicial: $INITIAL_SIZE (${INITIAL_FILES} archivos)${NC}"
log "${BLUE}  📊 Tamaño final: $FINAL_SIZE (${FINAL_FILES} archivos)${NC}"
log "${BLUE}  🗑️ Archivos eliminados: $DELETED_COUNT${NC}"

# Calcular espacio liberado (aproximado)
SPACE_SAVED=$((INITIAL_FILES - FINAL_FILES))
if [ $SPACE_SAVED -gt 0 ]; then
    log "${GREEN}  💾 Archivos reducidos: $SPACE_SAVED${NC}"
else
    log "${YELLOW}  💾 No se redujo significativamente el número de archivos${NC}"
fi

# Sugerencias adicionales
echo
log "${YELLOW}💡 [TIP] Sugerencias adicionales:${NC}"
log "${YELLOW}  - Ejecuta 'npm audit fix' para actualizar dependencias${NC}"
log "${YELLOW}  - Considera ejecutar './gitpush.sh -q' para respaldar cambios${NC}"
log "${YELLOW}  - Revisa el archivo cleanup.log para detalles completos${NC}"

echo
log "${GREEN}🌸 ¡FloresYa optimizado exitosamente! 🌸${NC}"

exit 0