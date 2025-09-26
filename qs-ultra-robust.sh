#!/bin/bash

# 🚀 FloresYa - QS Ultra Robust Server Management Script
# Handles server startup, signal management, and graceful shutdown

# Variables globales
SERVER_PID=""
LOG_FILE="server.log"
ERROR_LOG="server_error.log"

# Función para limpiar procesos
cleanup() {
    echo "🛑 Received signal to stop. Cleaning up..."
    
    # Verificar si el proceso del servidor aún está corriendo
    if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "⏳ Stopping server process (PID: $SERVER_PID)..."
        kill -TERM "$SERVER_PID" 2>/dev/null
        
        # Esperar un momento para que el proceso termine elegantemente
        sleep 2
        
        # Si aún está corriendo, forzar la terminación
        if kill -0 "$SERVER_PID" 2>/dev/null; then
            echo "⏳ Force stopping server process..."
            kill -KILL "$SERVER_PID" 2>/dev/null
        fi
    fi
    
    echo "✅ Cleanup completed"
    exit 0
}

# Función para manejar errores
error_handler() {
    echo "❌ Error occurred in main process. Initiating cleanup..."
    cleanup
    exit 1
}

# Configurar captura de señales
trap cleanup SIGINT SIGTERM SIGQUIT SIGHUP  # Ctrl+C, terminate, etc.
trap error_handler ERR  # Captura de errores

# Verificar si ya hay un servidor corriendo
if pgrep -f "node.*server" >/dev/null 2>&1; then
    echo "⚠️  Another server instance might be running. Stopping it..."
    pkill -f "node.*server" 2>/dev/null
    sleep 2
fi

# Iniciar el servidor
echo "🚀 Starting Express server..."
npm run dev:server > "$LOG_FILE" 2> "$ERROR_LOG" &
SERVER_PID=$!

# Verificar que el proceso se haya iniciado correctamente
if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "✅ Server started successfully with PID: $SERVER_PID"
    echo "🌐 Server logs redirected to: $LOG_FILE"
    echo "❌ Server errors redirected to: $ERROR_LOG"
    echo "💡 Press Ctrl+C to stop the server gracefully"
else
    echo "❌ Failed to start server"
    exit 1
fi

# Esperar al proceso del servidor
wait "$SERVER_PID" 2>/dev/null

# Capturar el código de salida del servidor
SERVER_EXIT_CODE=$?

# Manejar la terminación del servidor
if [[ $SERVER_EXIT_CODE -ne 0 ]]; then
    echo "⚠️  Server terminated with exit code: $SERVER_EXIT_CODE"
    error_handler
else
    echo "✅ Server terminated normally"
    cleanup
fi