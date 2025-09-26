#!/bin/bash

# Script simple para hacer commit y push a GitHub
# Elimina dependencias de otros scripts potencialmente problemáticos

echo "🚀 Iniciando proceso de commit y push..."

# Verificar estado del repositorio
echo "🔍 Verificando estado del repositorio..."
git status

# Agregar todos los cambios
echo "📝 Agregando todos los cambios al staging area..."
git add .

# Verificar si hay cambios para hacer commit
if git diff --staged --quiet; then
    echo "✅ No hay cambios para hacer commit."
    echo "💡 Si crees que debería haber cambios, verifica si están excluidos en .gitignore"
    exit 0
fi

# Hacer commit con un mensaje por defecto o uno proporcionado
if [ $# -eq 0 ]; then
    COMMIT_MESSAGE="feat: actualización de archivos"
else
    COMMIT_MESSAGE="$1"
fi

echo "📦 Haciendo commit con el mensaje: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

if [ $? -ne 0 ]; then
    echo "❌ Error al hacer commit. Revisa los mensajes anteriores."
    exit 1
fi

# Hacer push al branch actual
echo " ↑ Haciendo push al repositorio remoto..."
git push origin main

if [ $? -eq 0 ]; then
    echo "🎉 Commit y push realizados exitosamente!"
else
    echo "❌ Error al hacer push. Es posible que necesites hacer pull primero si hay cambios remotos."
    echo "Intenta: git pull origin main --rebase (o --merge) y luego vuelve a ejecutar este script"
    exit 1
fi