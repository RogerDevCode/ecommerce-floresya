#!/usr/bin/env node

/**
 * 🌸 FloresYa Console Statement Remover
 * Elimina todos los console.log, console.warn, console.error del proyecto
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivos que NO deben ser procesados (tests y archivos específicos)
const EXCLUDE_FILES = [
  'tests/',
  'scripts/',
  'src/frontend/utils/logger.ts', // Este archivo maneja logs intencionalmente
  'src/utils/serverLogger.ts', // Este archivo maneja logs intencionalmente
];

// Archivos que SÍ deben ser procesados
const INCLUDE_EXTENSIONS = ['.ts', '.js'];

/**
 * Verifica si un archivo debe ser procesado
 */
function shouldProcessFile(filePath) {
  // Excluir archivos en directorios excluidos
  for (const exclude of EXCLUDE_FILES) {
    if (filePath.includes(exclude)) {
      return false;
    }
  }

  // Solo procesar archivos con extensiones incluidas
  const ext = path.extname(filePath);
  return INCLUDE_EXTENSIONS.includes(ext);
}

/**
 * Elimina console statements de un archivo
 */
function removeConsoleStatements(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let removedCount = 0;

    // Patrones para diferentes tipos de console statements
    const consolePatterns = [
      // console.log, console.warn, console.error con diferentes formatos
      /console\.(log|warn|error|info|debug)\s*\([^)]*\);?\s*\n/g,
      /console\.(log|warn|error|info|debug)\s*\([^)]*\);/g,
      // console statements en una sola línea
      /^\s*console\.(log|warn|error|info|debug)\s*\([^)]*\);?\s*$/gm,
    ];

    for (const pattern of consolePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        removedCount += matches.length;
        content = content.replace(pattern, '');
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath} - ${removedCount} console statements eliminados`);
      return removedCount;
    }

    return 0;

  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Procesa recursivamente un directorio
 */
function processDirectory(dirPath) {
  let totalRemoved = 0;

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Procesar subdirectorios recursivamente
        totalRemoved += processDirectory(itemPath);
      } else if (stat.isFile() && shouldProcessFile(itemPath)) {
        // Procesar archivo
        totalRemoved += removeConsoleStatements(itemPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error procesando directorio ${dirPath}:`, error.message);
  }

  return totalRemoved;
}

/**
 * Función principal
 */
function main() {
  console.log('🌸 Iniciando eliminación de console statements...\n');

  const srcPath = path.join(__dirname, '..', 'src');
  const totalRemoved = processDirectory(srcPath);

  console.log(`\n✅ Eliminación completada!`);
  console.log(`📊 Total de console statements eliminados: ${totalRemoved}`);

  if (totalRemoved === 0) {
    console.log('✨ No se encontraron console statements para eliminar');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { removeConsoleStatements, processDirectory };