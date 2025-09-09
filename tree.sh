#!/bin/bash
# Script para generar árbol de directorios y guardarlo en tree.txt

# Ruta base, puedes cambiar "." por la ruta que desees listar
BASE_DIR="."

# Generar árbol y guardar en archivo
tree "$BASE_DIR" > tree.txt

echo "Árbol de directorios generado en tree.txt"
