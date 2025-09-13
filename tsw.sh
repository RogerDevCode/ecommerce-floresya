#!/bin/bash

# TypeScript Watch Controller - FloresYa
# Uso: ./tsw.sh {on|off|status|logs|restart}

PROJECT_DIR="/home/manager/Sync/ecommerce-floresya"
PIDFILE="$PROJECT_DIR/.ts-watch.pid"
LOGFILE="$PROJECT_DIR/logs/ts-watch.log"

# Crear directorio de logs si no existe
mkdir -p "$PROJECT_DIR/logs"

case "$1" in
    on)
        if [ -f "$PIDFILE" ]; then
            PID=$(cat "$PIDFILE")
            if ps -p "$PID" > /dev/null 2>&1; then
                echo "✅ TypeScript watch ya está ON (PID: $PID)"
                echo "📋 Ver logs: ./tsw.sh logs"
                exit 1
            else
                echo "🧹 Limpiando PID obsoleto..."
                rm -f "$PIDFILE"
            fi
        fi

        echo "🚀 Activando TypeScript watch..."
        cd "$PROJECT_DIR"
        
        # Ejecutar en segundo plano con nohup (independiente de terminal)
        nohup npm run ts:watch > "$LOGFILE" 2>&1 &
        echo $! > "$PIDFILE"
        
        sleep 2
        if ps -p "$(cat $PIDFILE)" > /dev/null 2>&1; then
            echo "✅ TypeScript watch está ON"
            echo "📁 PID: $(cat $PIDFILE)"
            echo "📋 Ver logs: ./tsw.sh logs"
            echo "⏹️  Desactivar: ./tsw.sh off"
        else
            echo "❌ Error al activar TypeScript watch"
            rm -f "$PIDFILE"
            exit 1
        fi
        ;;
        
    off)
        if [ -f "$PIDFILE" ]; then
            PID=$(cat "$PIDFILE")
            if ps -p "$PID" > /dev/null 2>&1; then
                echo "⏹️  Desactivando TypeScript watch (PID: $PID)..."
                kill "$PID"
                rm -f "$PIDFILE"
                echo "✅ TypeScript watch está OFF"
            else
                echo "⚠️  TypeScript watch no está ejecutándose"
                rm -f "$PIDFILE"
            fi
        else
            echo "⚠️  TypeScript watch ya está OFF"
        fi
        ;;
        
    status)
        if [ -f "$PIDFILE" ]; then
            PID=$(cat "$PIDFILE")
            if ps -p "$PID" > /dev/null 2>&1; then
                echo "✅ TypeScript watch está ON (PID: $PID)"
                echo "📋 Ver logs: ./tsw.sh logs"
                echo "💾 Uso de recursos:"
                ps -o pid,ppid,pmem,pcpu,time,comm -p "$PID" | head -2
            else
                echo "❌ TypeScript watch está OFF (PID obsoleto: $PID)"
                rm -f "$PIDFILE"
            fi
        else
            echo "⚠️  TypeScript watch está OFF"
        fi
        ;;
        
    logs)
        if [ -f "$LOGFILE" ]; then
            echo "📋 Logs de TypeScript watch (Ctrl+C para salir):"
            echo "────────────────────────────────────────────────"
            tail -f "$LOGFILE"
        else
            echo "⚠️  No se encontraron logs"
        fi
        ;;
        
    restart)
        echo "🔄 Reiniciando TypeScript watch..."
        "$0" off
        sleep 2
        "$0" on
        ;;
        
    *)
        echo "🔧 TypeScript Watch Controller - FloresYa"
        echo "════════════════════════════════════════"
        echo "Uso: ./tsw.sh {on|off|status|logs|restart}"
        echo ""
        echo "Comandos:"
        echo "  on      - ✅ Activar autocompilación"
        echo "  off     - ⏹️  Desactivar autocompilación" 
        echo "  status  - 📊 Ver estado actual"
        echo "  logs    - 📋 Ver logs en tiempo real"
        echo "  restart - 🔄 Reiniciar proceso"
        echo ""
        echo "Ejemplos:"
        echo "  ./tsw.sh on     # Activar y olvidarse"
        echo "  ./tsw.sh logs   # Ver qué está compilando"  
        echo "  ./tsw.sh off    # Desactivar al terminar"
        echo ""
        echo "💡 Tip: El proceso es independiente de la terminal"
        exit 1
        ;;
esac