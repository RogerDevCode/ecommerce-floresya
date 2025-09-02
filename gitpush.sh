#!/bin/bash

# Script para hacer commit y push automático al repositorio ecommerce-floresya
# FloresYa E-commerce - RogerDevCode
# Versión: 2.0 - Actualizado con mejoras Claude Code

# Configuración
REPO_DIR="/home/manager/Sync/ecommerce-floresya"
REPO_URL="git@github.com:RogerDevCode/ecommerce-floresya.git"
BRANCH="main"  # Rama principal del proyecto FloresYa

# Emojis para mejor UX
EMOJI_SUCCESS="🚀"
EMOJI_ERROR="❌"
EMOJI_INFO="ℹ️"
EMOJI_WARNING="⚠️"
EMOJI_FLOWER="🌸"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes de error
error() {
    echo -e "${RED}${EMOJI_ERROR} [ERROR]${NC} $1"
    exit 1
}

# Función para imprimir mensajes de éxito
success() {
    echo -e "${GREEN}${EMOJI_SUCCESS} [SUCCESS]${NC} $1"
}

# Función para imprimir información
info() {
    echo -e "${BLUE}${EMOJI_INFO} [INFO]${NC} $1"
}

# Función para imprimir advertencias
warning() {
    echo -e "${YELLOW}${EMOJI_WARNING} [WARNING]${NC} $1"
}

# Función para mostrar banner de FloresYa
show_banner() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                    ${EMOJI_FLOWER} FloresYa E-commerce ${EMOJI_FLOWER}                    ║"
    echo "║              Git Auto Commit & Push Script               ║"
    echo "║                     v2.0 - Claude Code                   ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Función para verificar conexión a internet
check_internet() {
    if ! ping -c 1 github.com &> /dev/null; then
        error "Sin conexión a internet o GitHub no disponible"
    fi
}

# Mostrar banner
show_banner

# Verificar argumentos de línea de comandos
QUICK_MODE=false
COMMIT_MESSAGE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -q|--quick)
            QUICK_MODE=true
            shift
            ;;
        -m|--message)
            COMMIT_MESSAGE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Uso: $0 [opciones]"
            echo "  -q, --quick           Modo rápido (sin confirmaciones)"
            echo "  -m, --message MSG     Mensaje de commit personalizado"
            echo "  -h, --help            Mostrar esta ayuda"
            echo ""
            echo "Ejemplos:"
            echo "  $0                                    # Modo interactivo"
            echo "  $0 -q                                # Modo rápido"
            echo "  $0 -m \"Fix: Botones FloresYa CSS\"     # Con mensaje"
            echo "  $0 -q -m \"Update: Carrusel products\"  # Rápido con mensaje"
            exit 0
            ;;
        *)
            warning "Opción desconocida: $1"
            shift
            ;;
    esac
done

# Verificar conexión a internet
info "Verificando conexión a GitHub..."
check_internet
success "Conexión a GitHub verificada"

# Verificar si el directorio del repositorio existe
if [ ! -d "$REPO_DIR" ]; then
    error "El directorio del repositorio no existe: $REPO_DIR"
fi

# Navegar al directorio del repositorio
cd "$REPO_DIR" || error "No se pudo acceder al directorio: $REPO_DIR"

info "Directorio actual: $(pwd)"
info "Repositorio: $REPO_URL"
info "Rama: $BRANCH"

# Verificar que estamos en un repositorio git
if [ ! -d ".git" ]; then
    error "El directorio no es un repositorio Git"
fi

# Verificar que tenemos cambios para commitear
if git diff --quiet && git diff --cached --quiet; then
    warning "No hay cambios para commitear"
    if [ "$QUICK_MODE" = false ]; then
        read -r -p "¿Continuar de todos modos? [y/N]: " response
        case "$response" in
            [yY][eE][sS]|[yY]|[sS]|[sI]) 
                info "Continuando..."
                ;;
            *)
                info "Operación cancelada"
                exit 0
                ;;
        esac
    fi
fi

# Obtener el estado del repositorio
echo
info "Estado actual del repositorio:"
git status --short

# Mostrar cambios detallados si no está en modo rápido
if [ "$QUICK_MODE" = false ]; then
    echo
    info "Archivos modificados:"
    git diff --name-status
    
    echo
    read -r -p "¿Desea ver el diff completo de los cambios? [y/N]: " response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY]|[sS]|[sI])$ ]]; then
        git diff --color=always | less -R
    fi
fi

# Preguntar por el mensaje del commit si no se proporcionó
if [ -z "$COMMIT_MESSAGE" ]; then
    if [ "$QUICK_MODE" = true ]; then
        # Generar mensaje automático más descriptivo
        CHANGES_COUNT=$(git diff --name-only | wc -l)
        STAGED_COUNT=$(git diff --cached --name-only | wc -l)
        COMMIT_MESSAGE="🌸 FloresYa: Actualización automática - $CHANGES_COUNT archivos modificados $(date '+%Y-%m-%d %H:%M')"
        info "Mensaje automático: $COMMIT_MESSAGE"
    else
        echo
        echo -e "${YELLOW}Sugerencias de mensajes:${NC}"
        echo "  🌸 FloresYa: Implementar botones compra rápida"
        echo "  ✨ FloresYa: Mejorar carrusel de productos"
        echo "  🛠️ FloresYa: Actualizar panel administrativo"
        echo "  🐛 FloresYa: Corregir bugs en carrito de compras"
        echo "  📱 FloresYa: Optimizar responsive design"
        echo
        read -r -p "Ingrese el mensaje del commit: " COMMIT_MESSAGE
        
        # Si no se ingresa mensaje, usar uno por defecto
        if [ -z "$COMMIT_MESSAGE" ]; then
            COMMIT_MESSAGE="🌸 FloresYa: Actualización $(date '+%Y-%m-%d %H:%M:%S')"
            warning "Usando mensaje por defecto: $COMMIT_MESSAGE"
        fi
    fi
fi

# Confirmación final si no está en modo rápido
if [ "$QUICK_MODE" = false ]; then
    echo
    info "Resumen de la operación:"
    echo -e "  ${BLUE}Mensaje:${NC} $COMMIT_MESSAGE"
    echo -e "  ${BLUE}Rama:${NC} $BRANCH"
    echo -e "  ${BLUE}Repositorio:${NC} $REPO_URL"
    echo
    read -r -p "¿Continuar con commit y push? [Y/n]: " response
    case "$response" in
        [nN][oO]|[nN]) 
            info "Operación cancelada por el usuario"
            exit 0
            ;;
    esac
fi

# Agregar todos los cambios al staging area
info "Agregando cambios al staging area..."
git add . || error "Error al agregar cambios"

# Verificar que hay cambios staged
if git diff --cached --quiet; then
    warning "No hay cambios staged para commitear"
    exit 0
fi

# Hacer el commit
info "Realizando commit..."
git commit -m "$COMMIT_MESSAGE" || error "Error al hacer commit"

# Verificar si necesitamos pull antes del push
info "Verificando si necesitamos sincronizar con el remoto..."
git fetch origin "$BRANCH" 2>/dev/null || warning "No se pudo hacer fetch del remoto"

# Verificar si hay cambios remotos
if ! git diff --quiet HEAD origin/"$BRANCH" 2>/dev/null; then
    warning "Hay cambios remotos. Haciendo pull primero..."
    git pull origin "$BRANCH" || error "Error al hacer pull. Resuelve conflictos manualmente."
fi

# Hacer push al repositorio remoto
info "Subiendo cambios a GitHub..."
git push origin "$BRANCH" || error "Error al hacer push"

# Mostrar estado final
echo
success "¡Commit y push completados exitosamente!"
success "Cambios subidos a: $REPO_URL"

# Mostrar información del último commit
echo
info "Información del commit:"
git log -1 --pretty=format:"  🆔 Hash: %h%n  👤 Autor: %an%n  📅 Fecha: %ad%n  💬 Mensaje: %s" --date=format:'%Y-%m-%d %H:%M:%S'

# Mostrar estado final del repositorio
echo
info "Estado final del repositorio:"
git status --short

# Mostrar estadísticas del push
echo
info "Estadísticas del repositorio:"
echo "  📊 Total commits: $(git rev-list --count HEAD)"
echo "  🌿 Rama actual: $(git branch --show-current)"
echo "  🏷️ Último tag: $(git describe --tags --abbrev=0 2>/dev/null || echo 'Sin tags')"

echo
success "${EMOJI_FLOWER} ¡FloresYa actualizado exitosamente! ${EMOJI_FLOWER}"