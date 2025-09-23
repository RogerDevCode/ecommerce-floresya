// scripts/mastermod/typeSafetyValidator.js
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { parse } from '@typescript-eslint/parser';
import { analyze } from '@typescript-eslint/scope-manager';

export class TypeSafetyValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Seguridad de Tipos - Enterprise Edition';
    this.sharedTypesPath = path.join(projectRoot, 'src/shared/types/index.ts');
    this.legacyTypesPaths = [
      'src/types/database.ts',
      'src/types/api.ts',
      'src/types/admin.ts',
      'src/types/logging.ts',
      'src/frontend/types/'
    ];
  }

  async validate() {
    const errors = [];

    try {
      // Validaciones básicas mejoradas
      await this.validateNoAnyTypes(errors);
      await this.validateTypeSafeUsage(errors);
      await this.validateSingleSourceOfTruth(errors);
      await this.validateSupabaseTypes(errors);

      // NUEVAS VALIDACIONES AVANZADAS
      await this.validateStrictTypeChecking(errors);
      await this.validateInterfaceCompleteness(errors);
      await this.validateTypeImports(errors);
      await this.validateGenericUsage(errors);
      await this.validateNullSafety(errors);
      await this.validateTypeAssertions(errors);
      await this.validateSharedTypesUsage(errors);

      return {
        hasErrors: errors.length > 0,
        details: errors
      };
    } catch (error) {
      return {
        hasErrors: true,
        details: [`Error crítico en validación de tipos: ${error.message}`]
      };
    }
  }

  async validateNoAnyTypes(errors) {
    const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of tsFiles) {
      // Saltar archivos de tipos generados y archivos JS
      if (file.includes('supabase-types') || file.includes('swagger.d.ts') ||
          file.endsWith('.js') || file.includes('node_modules') || file.includes('dist')) {
        continue;
      }

      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Buscar uso de 'any' fuera de comentarios
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Ignorar comentarios y eslint-disable
        if (line.trim().startsWith('//') || line.trim().startsWith('*') ||
            line.includes('eslint-disable') || line.includes('@typescript-eslint/no-explicit-any')) {
          continue;
        }

        // Buscar patrones de 'any'
        const anyPatterns = [
          /:\s*any\b/,           // : any
          /as\s+any\b/,          // as any
          /<any>/,               // <any>
          /Array<any>/,          // Array<any>
          /Promise<any>/         // Promise<any>
        ];

        for (const pattern of anyPatterns) {
          if (pattern.test(line)) {
            errors.push(`❌ Uso prohibido de 'any' en ${file}:${lineNumber} - "${line.trim()}"`);
          }
        }
      }
    }
  }

  async validateTypeSafeUsage(errors) {
    const serviceFiles = await glob('src/services/*.ts', { cwd: this.projectRoot });

    for (const file of serviceFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar que no se use casting de supabase
      if (content.includes('supabaseService as any') || content.includes('supabase as any')) {
        errors.push(`❌ Uso de casting prohibido en ${file} - Usar TypeSafeDatabaseService`);
      }

      // Verificar importación de TypeSafeDatabaseService
      if (file !== 'src/services/TypeSafeDatabaseService.ts' &&
          content.includes('from \'@supabase/supabase-js\'') &&
          !content.includes('TypeSafeDatabaseService')) {
        errors.push(`⚠️ ${file} accede directamente a Supabase - Considerar usar TypeSafeDatabaseService`);
      }
    }
  }

  async validateSingleSourceOfTruth(errors) {
    // Verificar que tipos estén centralizados - Solo buscar en archivos de tipos específicos
    const typeFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });
    const duplicateInterfaces = new Map();

    // Archivos que pueden contener definiciones reales de tipos (excluir JS y archivos generados)
    const allowedTypeFiles = typeFiles.filter(file => {
      // Excluir archivos JS completamente
      if (file.endsWith('.js')) return false;

      // Excluir archivos generados
      if (file.includes('node_modules') || file.includes('dist') ||
          file.includes('supabase-types') || file.includes('swagger.d.ts')) {
        return false;
      }

      // Solo considerar archivos que son definiciones de tipos reales
      return file.includes('src/types/') ||
             file.includes('src/shared/types/') ||
             file.includes('src/frontend/types/') ||
             file.includes('src/config/');
    });

    for (const file of allowedTypeFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Buscar definiciones de interfaces (excluir imports y re-exports)
      const interfaceMatches = content.match(/(?:export\s+)?interface\s+(\w+)/g);
      if (interfaceMatches) {
        for (const match of interfaceMatches) {
          const interfaceName = match.replace(/(?:export\s+)?interface\s+/, '');

          // Verificar que esta sea una definición real, no un import/re-export
          const lines = content.split('\n');
          let isRealDefinition = false;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(`interface ${interfaceName}`) && line.includes('{')) {
              // Verificar que no sea solo un import/export sin definición
              const nextLines = lines.slice(i, Math.min(i + 5, lines.length));
              const hasDefinition = nextLines.some(l => l.includes('{') && !l.includes('from'));
              if (hasDefinition) {
                isRealDefinition = true;
                break;
              }
            }
          }

          if (isRealDefinition) {
            if (!duplicateInterfaces.has(interfaceName)) {
              duplicateInterfaces.set(interfaceName, []);
            }
            duplicateInterfaces.get(interfaceName).push(file);
          }
        }
      }
    }

    // Reportar duplicados (solo si hay múltiples definiciones reales)
    for (const [interfaceName, files] of duplicateInterfaces) {
      if (files.length > 1) {
        // Verificar que no sean solo imports del shared types
        const realDefinitions = [];
        for (const file of files) {
          const isOnlyImport = await this.isOnlyImport(file, interfaceName);
          if (!isOnlyImport) {
            realDefinitions.push(file);
          }
        }

        if (realDefinitions.length > 1) {
          errors.push(`❌ Interface duplicada '${interfaceName}' encontrada en: ${realDefinitions.join(', ')}`);
        }
      }
    }
  }

  isImportFromSharedTypes(file, interfaceName) {
    // Verificar si este archivo solo importa la interface desde shared types
    // Esta es una simplificación - en una implementación real se analizaría el AST
    return file !== 'src/shared/types/index.ts';
  }

  async isOnlyImport(file, interfaceName) {
    try {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar si el archivo contiene la definición real de la interface
      const interfaceDefinitionRegex = new RegExp(`interface ${interfaceName}[^}]*{[^}]*}`, 's');
      const hasDefinition = interfaceDefinitionRegex.test(content);

      // Verificar si el archivo importa desde shared types
      const hasSharedImport = content.includes('from \'../shared/types/index.js\'') ||
                             content.includes('from \'../../shared/types/index.js\'');

      // Si no tiene definición real pero tiene import de shared types, es solo un import
      return !hasDefinition && hasSharedImport;
    } catch (error) {
      return false;
    }
  }

  async validateSupabaseTypes(errors) {
    const databaseTypesPath = path.join(this.projectRoot, 'src/types/database.ts');

    try {
      const content = await fs.readFile(databaseTypesPath, 'utf8');

      // Verificar que exista el tipo Database principal
      if (!content.includes('export interface Database') && !content.includes('export type Database')) {
        errors.push(`❌ Tipo 'Database' principal no encontrado en src/types/database.ts`);
      }

      // Verificar enums críticos
      const requiredEnums = ['OrderStatus', 'PaymentStatus', 'UserRole'];
      for (const enumName of requiredEnums) {
        if (!content.includes(`export type ${enumName}`)) {
          errors.push(`❌ Enum requerido '${enumName}' no encontrado en database.ts`);
        }
      }

    } catch (error) {
      errors.push(`❌ No se pudo leer src/types/database.ts: ${error.message}`);
    }
  }

  // NUEVAS VALIDACIONES AVANZADAS

  async validateStrictTypeChecking(errors) {
    const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of tsFiles) {
      if (file.includes('node_modules') || file.includes('dist') ||
          file.endsWith('.js') || file.includes('supabase-types') || file.includes('swagger.d.ts')) continue;

      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Detectar patrones de type assertions innecesarios
      const unnecessaryAssertions = [
        /as\s+string/g,  // as string innecesario
        /as\s+number/g,  // as number innecesario
        /as\s+boolean/g, // as boolean innecesario
      ];

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        for (const pattern of unnecessaryAssertions) {
          if (pattern.test(line)) {
            errors.push(`⚠️ Type assertion innecesario en ${file}:${lineNumber} - "${line.trim()}"`);
          }
        }
      }
    }
  }

  async validateInterfaceCompleteness(errors) {
    try {
      const sharedTypesContent = await fs.readFile(this.sharedTypesPath, 'utf8');

      // Verificar que interfaces críticas estén completas
      const criticalInterfaces = [
        { name: 'User', requiredFields: ['id', 'email', 'role', 'is_active'] },
        { name: 'Product', requiredFields: ['id', 'name', 'price_usd', 'stock'] },
        { name: 'Order', requiredFields: ['id', 'customer_name', 'customer_email', 'total_amount_usd'] },
        { name: 'ApiResponse', requiredFields: ['success', 'data'] }
      ];

      for (const interfaceDef of criticalInterfaces) {
        const interfaceRegex = new RegExp(`interface ${interfaceDef.name}[^}]+([^}]+)`, 's');
        const match = sharedTypesContent.match(interfaceRegex);

        if (match) {
          const interfaceBody = match[1];
          for (const field of interfaceDef.requiredFields) {
            if (!interfaceBody.includes(field)) {
              errors.push(`❌ Interface '${interfaceDef.name}' incompleta - falta campo '${field}'`);
            }
          }
        } else {
          errors.push(`❌ Interface crítica '${interfaceDef.name}' no encontrada en shared types`);
        }
      }

    } catch (error) {
      errors.push(`❌ Error validando interfaces: ${error.message}`);
    }
  }

  async validateTypeImports(errors) {
    const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of tsFiles) {
      if (file.includes('node_modules') || file.includes('dist') ||
          file.endsWith('.js') || file.includes('supabase-types') || file.includes('swagger.d.ts')) continue;

      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar imports de tipos legacy
      for (const legacyPath of this.legacyTypesPaths) {
        if (content.includes(`from '${legacyPath}'`) || content.includes(`from "${legacyPath}"`)) {
          errors.push(`❌ Import de tipos legacy en ${file} - Usar src/shared/types/index.ts`);
        }
      }

      // Verificar imports relativos inconsistentes
      const relativeImports = content.match(/from ['"][^'"]+['"]/g) || [];
      for (const importStmt of relativeImports) {
        if (importStmt.includes('../shared/types/') && !importStmt.includes('index.js')) {
          errors.push(`❌ Import relativo inconsistente en ${file} - Usar solo index.js`);
        }
      }
    }
  }

  async validateGenericUsage(errors) {
    const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of tsFiles) {
      if (file.includes('node_modules') || file.includes('dist') ||
          file.endsWith('.js') || file.includes('supabase-types') || file.includes('swagger.d.ts')) continue;

      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Detectar uso de genéricos sin constraints
      const unconstrainedGenerics = [
        /<T>/g,      // T sin extends
        /<K>/g,      // K sin extends
        /<V>/g,      // V sin extends
      ];

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        for (const pattern of unconstrainedGenerics) {
          if (pattern.test(line)) {
            errors.push(`⚠️ Genérico sin constraints en ${file}:${lineNumber} - "${line.trim()}"`);
          }
        }
      }
    }
  }

  async validateNullSafety(errors) {
    const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of tsFiles) {
      if (file.includes('node_modules') || file.includes('dist') ||
          file.endsWith('.js') || file.includes('supabase-types') || file.includes('swagger.d.ts')) continue;

      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Detectar acceso a propiedades sin null checking
      const unsafeAccessPatterns = [
        /\.data\./g,     // response.data.property sin verificar
        /\.body\./g,     // req.body.property sin verificar
        /\.params\./g,   // req.params.property sin verificar
        /\.query\./g,    // req.query.property sin verificar
      ];

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        for (const pattern of unsafeAccessPatterns) {
          if (pattern.test(line)) {
            // Verificar si hay null checking en líneas cercanas
            const hasNullCheck = this.hasNullCheckNearby(lines, i);
            if (!hasNullCheck) {
              errors.push(`⚠️ Acceso potencialmente unsafe en ${file}:${lineNumber} - "${line.trim()}"`);
            }
          }
        }
      }
    }
  }

  hasNullCheckNearby(lines, lineIndex, range = 3) {
    for (let i = Math.max(0, lineIndex - range); i <= Math.min(lines.length - 1, lineIndex + range); i++) {
      const line = lines[i];
      if (line.includes('if (!') || line.includes('if (') || line.includes('?.') ||
          line.includes('null') || line.includes('undefined')) {
        return true;
      }
    }
    return false;
  }

  async validateTypeAssertions(errors) {
    const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });

    for (const file of tsFiles) {
      if (file.includes('node_modules') || file.includes('dist') ||
          file.endsWith('.js') || file.includes('supabase-types') || file.includes('swagger.d.ts')) continue;

      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Detectar type assertions excesivas
      const typeAssertions = content.match(/as\s+\w+/g) || [];
      if (typeAssertions.length > 10) {
        errors.push(`⚠️ Exceso de type assertions en ${file} (${typeAssertions.length}) - Considerar refactoring`);
      }

      // Detectar as any
      if (content.includes('as any')) {
        errors.push(`❌ 'as any' prohibido en ${file} - Usar tipos específicos`);
      }

      // Detectar as unknown
      if (content.includes('as unknown')) {
        errors.push(`⚠️ 'as unknown' en ${file} - Verificar si es necesario`);
      }
    }
  }

  async validateSharedTypesUsage(errors) {
    try {
      const sharedTypesContent = await fs.readFile(this.sharedTypesPath, 'utf8');

      // Verificar que shared types esté siendo usado
      const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });
      let sharedTypesUsage = 0;

      for (const file of tsFiles) {
        if (file.includes('node_modules') || file.includes('dist') ||
            file.endsWith('.js') || file.includes('supabase-types') || file.includes('swagger.d.ts')) continue;

        const filePath = path.join(this.projectRoot, file);
        const content = await fs.readFile(filePath, 'utf8');

        if (content.includes('from \'../shared/types/index.js\'') ||
            content.includes('from \'../../shared/types/index.js\'')) {
          sharedTypesUsage++;
        }
      }

      if (sharedTypesUsage < tsFiles.length * 0.8) {
        errors.push(`⚠️ Bajo uso de shared types (${sharedTypesUsage}/${tsFiles.length}) - Verificar imports`);
      }

      // Verificar que shared types tenga contenido significativo
      const linesOfCode = sharedTypesContent.split('\n').length;
      if (linesOfCode < 50) {
        errors.push(`⚠️ src/shared/types/index.ts parece incompleto (${linesOfCode} líneas)`);
      }

    } catch (error) {
      errors.push(`❌ Error validando uso de shared types: ${error.message}`);
    }
  }
}