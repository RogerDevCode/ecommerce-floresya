#!/usr/bin/env node

/**
 * 🌸 FloresYa Path Alias Converter
 * Convierte imports con alias @ a rutas relativas de forma inteligente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de mapeo de alias a rutas relativas
// Con baseUrl en "./src", desde cualquier archivo en src/:
// - @shared/* → ../shared/*
// - @backend/* → ./*
// - @frontend/* → ../frontend/*
const ALIAS_MAPPINGS = {
  '@shared': '../shared',
  '@backend': '.',
  '@frontend': '../frontend'
};

// Rutas incorrectas que necesitan ser corregidas
const INCORRECT_PATHS = {
  '../../../shared/types': '../shared/types',
  '../../../shared/utils': '../shared/utils',
  '../../../../shared/types': '../shared/types',
  '../../../../shared/utils': '../shared/utils',
  '../../../services/apiClient': '../services/apiClient'
};

// Archivos que necesitan conversión (de la búsqueda anterior)
const FILES_TO_CONVERT = [
  'src/controllers/LogsController.ts',
  'src/controllers/OrderController.ts',
  'src/config/supabase.d.ts',
  'src/services/OrderService.ts',
  'src/services/ImageService.ts',
  'src/services/TypeSafeDatabaseService.ts',
  'src/services/OccasionsService.ts',
  'src/services/UserService.ts',
  'src/services/ProductService.ts',
  'src/frontend/product-detail.ts',
  'src/frontend/admin/products.ts',
  'src/frontend/services/apiClient.ts',
  'src/frontend/admin/types.ts',
  'src/frontend/admin/users.ts',
  'src/frontend/utils/logger.ts',
  'src/frontend/main.ts',
  'src/frontend/types/globals.d.ts',
  'src/frontend/types/frontendTypes.ts',
  'src/frontend/users-admin.ts',
  'src/frontend/authManager.ts'
];

/**
 * Convierte un import con alias a ruta relativa
 */
function convertImportToRelative(importPath, filePath) {
  // Extraer el alias y el resto de la ruta
  const aliasMatch = importPath.match(/^@(\w+)\/(.+)$/);
  if (!aliasMatch) {
    return importPath; // No es un alias, devolver como está
  }

  const alias = aliasMatch[1];
  const relativePath = aliasMatch[2];

  // Obtener el mapeo para este alias
  const basePath = ALIAS_MAPPINGS[`@${alias}`];
  if (!basePath) {
    console.warn(`⚠️  Alias desconocido: @${alias}`);
    return importPath;
  }

  // Calcular la ruta relativa desde el archivo actual
  const currentDir = path.dirname(filePath);
  const targetPath = path.join(basePath, relativePath);

  // Calcular ruta relativa desde el directorio actual
  const relativeRoute = path.relative(currentDir, targetPath);

  // Asegurar que la ruta comience con './' o '../'
  const normalizedPath = relativeRoute.startsWith('.')
    ? relativeRoute
    : `./${relativeRoute}`;

  return normalizedPath;
}

/**
 * Procesa un archivo y convierte sus imports
 */
function processFile(filePath) {
  console.log(`🔄 Procesando: ${filePath}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Buscar todos los imports con alias
    const importRegex = /from ['"](@[^'"]+)['"]/g;
    const matches = [...content.matchAll(importRegex)];

    for (const match of matches) {
      const originalImport = match[1];
      const convertedImport = convertImportToRelative(originalImport, filePath);

      if (convertedImport !== originalImport) {
        console.log(`  ✅ ${originalImport} → ${convertedImport}`);
        content = content.replace(originalImport, convertedImport);
        modified = true;
      }
    }

    // Corregir rutas incorrectas generadas anteriormente
    for (const [incorrect, correct] of Object.entries(INCORRECT_PATHS)) {
      if (content.includes(incorrect)) {
        console.log(`  🔧 ${incorrect} → ${correct}`);
        content = content.replace(new RegExp(incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correct);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Archivo actualizado: ${filePath}`);
    } else {
      console.log(`  ⏭️  Sin cambios necesarios: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

/**
 * Función principal
 */
function main() {
  console.log('🌸 Iniciando conversión de alias de rutas...\n');

  for (const filePath of FILES_TO_CONVERT) {
    if (fs.existsSync(filePath)) {
      processFile(filePath);
    } else {
      console.warn(`⚠️  Archivo no encontrado: ${filePath}`);
    }
  }

  console.log('\n✅ Conversión completada!');
  console.log('📝 Los siguientes archivos fueron procesados:');
  FILES_TO_CONVERT.forEach(file => console.log(`   - ${file}`));
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { convertImportToRelative, processFile };