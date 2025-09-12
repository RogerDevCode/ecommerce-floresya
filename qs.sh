#!/bin/bash

# FloresYa - Script de control para entornos de desarrollo y producción
# Versión mejorada para Xubuntu 24+ y aplicaciones e-commerce

# Colores (solo si la terminal lo soporta)
if [ -t 1 ]; then
    RED=$(tput setaf 1)
    GREEN=$(tput setaf 2)
    YELLOW=$(tput setaf 3)
    BLUE=$(tput setaf 4)
    RESET=$(tput sgr0)
else
    RED=""
    GREEN=""
    YELLOW=""
    BLUE=""
    RESET=""
fi

# Función de ayuda
show_help() {
    echo "${BLUE}🌸 FloresYa - Control de entornos${RESET}"
    echo
    echo "Uso: $0 [OPCIÓN]"
    echo
    echo "Opciones:"
    echo "  ${GREEN}-dev${RESET}        Iniciar en modo desarrollo (sin inicializar BD) [por defecto]"
    echo "  ${GREEN}-initbd${RESET}     Inicializar base de datos + modo desarrollo"
    echo "  ${GREEN}-prod${RESET}       Iniciar en modo producción (sin inicializar BD)"
    echo "  ${GREEN}-start${RESET}      Alias de -prod (modo producción)"
    echo "  ${GREEN}-h, --help${RESET}  Mostrar esta ayuda"
    echo
    echo "Ejemplos:"
    echo "  $0 -dev"
    echo "  $0 -initbd"
    echo "  $0 -prod"
    exit 0
}

# Función para matar procesos en el puerto 3000
kill_port_3000() {
    echo "${YELLOW}🚫 Matando procesos en puerto 3000...${RESET}"
    sudo fuser -k 3000/tcp 2>/dev/null || true
    pkill -f "node.*server" 2>/dev/null || true
    pkill -f "npm.*demo" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    sleep 2

    # Forzar si aún está ocupado
    if lsof -ti:3000 >/dev/null 2>&1; then
        echo "${RED}⚠️  Puerto aún ocupado, forzando liberación...${RESET}"
        sudo kill -9 $(lsof -ti:3000) 2>/dev/null || true
        sleep 1
    fi
}

# Función para inicializar la base de datos
initialize_database() {
    echo "${BLUE}🗃️  Inicializando base de datos...${RESET}"
    # Ajusta este comando según tu stack (ej: prisma, sequelize, scripts personalizados)
    # Ejemplos:
    # npx prisma migrate deploy
    # npm run db:seed
    # node scripts/init-db.js

    # Placeholder - reemplaza con tu comando real
    echo "${YELLOW}⚠️  [Placeholder] Ejecuta aquí tu comando de inicialización de BD.${RESET}"
    echo "${YELLOW}   Ej: npm run db:migrate && npm run db:seed${RESET}"
    # npm run db:migrate && npm run db:seed  # DESCOMENTA Y AJUSTA ESTO

    echo "${GREEN}✅ Base de datos inicializada.${RESET}"
}

# Función para iniciar servidor en modo desarrollo
start_dev() {
    echo "${GREEN}🚀 Iniciando servidor en modo DESARROLLO...${RESET}"
    echo "${BLUE}🌐 http://localhost:3000${RESET}"
    echo ""
    npm run dev
}

# Función para iniciar servidor en modo producción
start_prod() {
    echo "${GREEN}🚀 Iniciando servidor en modo PRODUCCIÓN...${RESET}"
    echo "${BLUE}🌐 http://localhost:3000${RESET}"
    echo ""
    npm run start  # Asume que tienes un script "start" en package.json para producción
}

# Parsear argumentos
case "${1:-}" in
    -h|--help)
        show_help
        ;;
    -initbd)
        echo "${BLUE}🌸 FloresYa - Modo: Desarrollo + Inicializar BD${RESET}"
        kill_port_3000
        initialize_database
        start_dev
        ;;
    -dev)
        echo "${BLUE}🌸 FloresYa - Modo: Desarrollo${RESET}"
        kill_port_3000
        start_dev
        ;;
    -prod|-start)
        echo "${BLUE}🌸 FloresYa - Modo: Producción${RESET}"
        kill_port_3000
        start_prod
        ;;
    "")
        echo "${BLUE}🌸 FloresYa - Modo: Desarrollo (por defecto)${RESET}"
        kill_port_3000
        start_dev
        ;;
    *)
        echo "${RED}❌ Opción no válida: $1${RESET}"
        echo "Usa $0 -h para ver las opciones disponibles."
        exit 1
        ;;
esac
