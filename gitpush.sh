#!/bin/bash

# Script para hacer commit y push automático al repositorio ecommerce-floresya
# RogerDevCode - Xubuntu 24+

# Configuración
REPO_DIR="/home/manager/Sync/ecommerce-floresya"
REPO_URL="git@github.com:RogerDevCode/ecommerce-floresya.git"
BRANCH="main"  # Cambia a "master" si es necesario

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes de error
error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Función para imprimir mensajes de éxito
success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Función para imprimir información
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Función para imprimir advertencias
warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

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

# Obtener el estado del repositorio
git status

# Mostrar cambios
info "Cambios detectados:"
git diff --name-status

# Preguntar por el mensaje del commit
echo
read -r -p "Ingrese el mensaje del commit: " COMMIT_MESSAGE

# Si no se ingresa mensaje, usar uno por defecto
if [ -z "$COMMIT_MESSAGE" ]; then
    COMMIT_MESSAGE="Commit automático $(date '+%Y-%m-%d %H:%M:%S')"
    warning "Usando mensaje por defecto: $COMMIT_MESSAGE"
fi

# Agregar todos los cambios al staging area
info "Agregando cambios al staging area..."
git add . || error "Error al agregar cambios"

# Hacer el commit
info "Realizando commit..."
git commit -m "$COMMIT_MESSAGE" || error "Error al hacer commit"

# Hacer push al repositorio remoto
info "Subiendo cambios a GitHub..."
git push origin "$BRANCH" || error "Error al hacer push"

# Mostrar estado final
success "¡Commit y push completados exitosamente!"
info "Estado final:"
git status --short

# Mostrar último commit
echo
info "Último commit:"
git log -1 --oneline