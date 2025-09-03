#!/bin/bash

# FloresYa - Script para iniciar servidor
# Mata procesos en puerto 3000 y ejecuta el servidor

echo "🌸 FloresYa - Iniciando servidor..."

# Función para matar procesos en puerto 3000
kill_port_3000() {
    echo "🔍 Buscando procesos en puerto 3000..."
    
    # Buscar procesos usando el puerto 3000
    PIDS=$(lsof -ti:3000 2>/dev/null)
    
    if [ -z "$PIDS" ]; then
        echo "✅ No hay procesos ejecutándose en puerto 3000"
    else
        echo "🚫 Matando procesos en puerto 3000: $PIDS"
        
        # Intentar terminar procesos de forma elegante primero
        kill $PIDS 2>/dev/null
        
        # Esperar un momento
        sleep 2
        
        # Verificar si aún hay procesos corriendo
        REMAINING_PIDS=$(lsof -ti:3000 2>/dev/null)
        
        if [ ! -z "$REMAINING_PIDS" ]; then
            echo "⚠️  Forzando terminación de procesos restantes: $REMAINING_PIDS"
            kill -9 $REMAINING_PIDS 2>/dev/null
        fi
        
        echo "✅ Procesos eliminados exitosamente"
    fi
}

# Función para verificar si Node.js está instalado
check_node() {
    if ! command -v node &> /dev/null; then
        echo "❌ Error: Node.js no está instalado"
        echo "   Instala Node.js desde: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION encontrado"
}

# Función para verificar dependencias
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo "📦 Instalando dependencias..."
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Error instalando dependencias"
            exit 1
        fi
    else
        echo "✅ Dependencias encontradas"
    fi
}

# Función principal
main() {
    # Verificar que estamos en el directorio correcto
    if [ ! -f "package.json" ]; then
        echo "❌ Error: No se encuentra package.json"
        echo "   Asegúrate de ejecutar este script desde la raíz del proyecto FloresYa"
        exit 1
    fi
    
    # Verificaciones
    check_node
    check_dependencies
    
    # Matar procesos en puerto 3000
    kill_port_3000
    
    # Esperar un momento para asegurar que el puerto esté libre
    echo "⏳ Esperando que el puerto 3000 esté completamente libre..."
    sleep 3
    
    # Verificar que el puerto esté realmente libre
    if lsof -ti:3000 >/dev/null 2>&1; then
        echo "❌ Error: El puerto 3000 sigue ocupado"
        echo "   Intenta reiniciar la terminal o reiniciar el sistema"
        exit 1
    fi
    
    echo "🚀 Puerto 3000 libre, iniciando servidor..."
    echo "📊 Puedes acceder a:"
    echo "   🌐 Frontend: http://localhost:3000"
    echo "   🔧 API: http://localhost:3000/api"
    echo "   ❤️  Health: http://localhost:3000/api/health"
    echo "   👨‍💼 Admin: http://localhost:3000/pages/admin.html"
    echo ""
    echo "⚠️  Presiona Ctrl+C para detener el servidor"
    echo "────────────────────────────────────────────"
    echo ""
    
    # Ejecutar el servidor en modo demo (con datos de ejemplo)
    npm run demo
}

# Manejar Ctrl+C
trap 'echo -e "\n🛑 Deteniendo servidor FloresYa..."; exit 0' INT

# Ejecutar función principal
main