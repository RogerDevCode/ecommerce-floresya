#!/bin/bash

# FloresYa - Script rápido para reiniciar servidor
# Versión simple y directa

echo "🌸 FloresYa - Reinicio rápido..."

# Matar todo lo que use puerto 3000
echo "🚫 Matando procesos en puerto 3000..."
sudo fuser -k 3000/tcp 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
pkill -f "npm.*demo" 2>/dev/null || true

# Esperar un momento
sleep 2

# Verificar que el puerto esté libre
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "⚠️  Puerto aún ocupado, forzando liberación..."
    sudo kill -9 $(lsof -ti:3000) 2>/dev/null || true
    sleep 1
fi

echo "🚀 Iniciando servidor FloresYa..."
echo "🌐 http://localhost:3000"
echo ""

# Ejecutar servidor
npm run demo