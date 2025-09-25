// scripts/mastermod/autoFixValidator.js
import fs from 'fs/promises';
import path from 'path';

import { glob } from 'glob';

export class AutoFixValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador Auto-Fix - Correcciones Automáticas';
    this.fixesApplied = {
      imports: 0,
      types: 0,
      formatting: 0,
      structure: 0,
      configuration: 0,
      total: 0
    };
  }

  async validate() {
    const errors = [];
    const fixes = [];

    try {
      // 🔧 CORRECCIONES AUTOMÁTICAS
      await this.fixImportOrganization(errors, fixes);
      await this.fixTypeAnnotations(errors, fixes);
      await this.fixCodeFormatting(errors, fixes);
      await this.fixStructureIssues(errors, fixes);
      await this.fixConfigurationFiles(errors, fixes);
      await this.fixCommonIssues(errors, fixes);

      return {
        hasErrors: errors.length > 0,
        details: errors,
        fixes: fixes,
        fixesApplied: this.fixesApplied,
        summary: this.generateFixSummary()
      };
    } catch (error) {
      return {
        hasErrors: true,
        details: [`Error crítico en auto-fix: ${error.message}`],
        fixes: [],
        fixesApplied: this.fixesApplied,
        summary: 'Error en auto-fix'
      };
    }
  }

  // 🔧 ORGANIZACIÓN DE IMPORTS
  async fixImportOrganization(errors, fixes) {
    const tsFiles = await glob('src/**/*.{ts,js}', { cwd: this.projectRoot });

    for (const file of tsFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      if (content.includes('import ')) {
        const fixedContent = this.organizeImports(content);

        if (fixedContent !== content) {
          await fs.writeFile(filePath, fixedContent, 'utf8');
          this.fixesApplied.imports++;
          fixes.push(`📦 Imports organizados: ${file}`);
        }
      }
    }
  }

  organizeImports(content) {
    const lines = content.split('\n');
    const imports = [];
    const otherLines = [];
    let inImportBlock = false;

    for (const line of lines) {
      if (line.startsWith('import ')) {
        imports.push(line);
        inImportBlock = true;
      } else if (inImportBlock && line.trim() === '') {
        inImportBlock = false;
        otherLines.push(line);
      } else if (!inImportBlock) {
        otherLines.push(line);
      }
    }

    // Organizar imports por tipo
    const externalImports = imports.filter(imp => imp.includes(' from \''));
    const internalImports = imports.filter(imp => imp.includes(' from \'../') || imp.includes(' from \'./'));
    const typeImports = imports.filter(imp => imp.includes('import type'));

    const organizedImports = [
      '// External imports',
      ...externalImports.sort(),
      '',
      '// Internal imports',
      ...internalImports.sort(),
      '',
      '// Type imports',
      ...typeImports.sort(),
      '',
      ...otherLines
    ];

    return organizedImports.join('\n');
  }

  // 🔧 ANOTACIONES DE TIPO
  async fixTypeAnnotations(errors, fixes) {
    const tsFiles = await glob('src/**/*.{ts,js}', { cwd: this.projectRoot });

    for (const file of tsFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      if (content.includes(': any') || content.includes('as any')) {
        const fixedContent = this.fixAnyTypes(content);

        if (fixedContent !== content) {
          await fs.writeFile(filePath, fixedContent, 'utf8');
          this.fixesApplied.types++;
          fixes.push(`🔧 Tipos any corregidos: ${file}`);
        }
      }
    }
  }

  fixAnyTypes(content) {
    // Reemplazar : any con : unknown para mejor type safety
    content = content.replace(/:\s*any/g, ': unknown');

    // Reemplazar as any con as unknown
    content = content.replace(/as\s+any/g, 'as unknown');

    return content;
  }

  // 🔧 FORMATO DE CÓDIGO
  async fixCodeFormatting(errors, fixes) {
    const tsFiles = await glob('src/**/*.{ts,js}', { cwd: this.projectRoot });

    for (const file of tsFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      const fixedContent = this.applyBasicFormatting(content);

      if (fixedContent !== content) {
        await fs.writeFile(filePath, fixedContent, 'utf8');
        this.fixesApplied.formatting++;
        fixes.push(`🎨 Formato aplicado: ${file}`);
      }
    }
  }

  applyBasicFormatting(content) {
    // Corregir espacios alrededor de operadores
    content = content.replace(/\s*([=+\-*/<>!&|])\s*/g, ' $1 ');

    // Corregir espacios después de comas
    content = content.replace(/,(\S)/g, ', $1');

    // Corregir espacios antes de llaves de cierre
    content = content.replace(/\s+\)/g, ')');
    content = content.replace(/\s+\]/g, ']');
    content = content.replace(/\s+\}/g, '}');

    // Corregir múltiples espacios
    content = content.replace(/\s+/g, ' ');

    return content;
  }

  // 🔧 PROBLEMAS DE ESTRUCTURA
  async fixStructureIssues(errors, fixes) {
    const tsFiles = await glob('src/**/*.{ts,js}', { cwd: this.projectRoot });

    for (const file of tsFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Agregar export default si falta
      if (content.includes('export ') && !content.includes('export default') &&
          (content.includes('class ') || content.includes('function ') || content.includes('const '))) {
        const fixedContent = this.addDefaultExport(content);

        if (fixedContent !== content) {
          await fs.writeFile(filePath, fixedContent, 'utf8');
          this.fixesApplied.structure++;
          fixes.push(`📤 Export default agregado: ${file}`);
        }
      }

      // Corregir nombres de constantes
      const fixedContent = this.fixConstantNaming(content);
      if (fixedContent !== content) {
        await fs.writeFile(filePath, fixedContent, 'utf8');
        this.fixesApplied.structure++;
        fixes.push(`📝 Convenciones de nomenclatura corregidas: ${file}`);
      }
    }
  }

  addDefaultExport(content) {
    const lines = content.split('\n');
    const lastLine = lines[lines.length - 1];

    if (!lastLine.includes('export default')) {
      lines.push('');
      lines.push('export default;');
    }

    return lines.join('\n');
  }

  fixConstantNaming(content) {
    // Corregir constantes que deberían ser uppercase
    content = content.replace(/\bconst\s+([a-z][a-zA-Z0-9]*)\s*=/g, (match, name) => {
      if (name.length > 3 && name.toUpperCase() === name) {
        return match; // Ya está en mayúsculas
      }
      if (name.includes('_') || name.length <= 3) {
        return match; // Es un nombre válido
      }
      return match.replace(name, name.toUpperCase());
    });

    return content;
  }

  // 🔧 ARCHIVOS DE CONFIGURACIÓN
  async fixConfigurationFiles(errors, fixes) {
    // Verificar y crear .prettierrc si no existe
    const prettierConfig = path.join(this.projectRoot, '.prettierrc');
    try {
      await fs.access(prettierConfig);
    } catch (error) {
      const defaultPrettierConfig = {
        semi: true,
        trailingComma: 'es5',
        singleQuote: true,
        printWidth: 80,
        tabWidth: 2,
        useTabs: false
      };

      await fs.writeFile(prettierConfig, JSON.stringify(defaultPrettierConfig, null, 2), 'utf8');
      this.fixesApplied.configuration++;
      fixes.push(`⚙️ .prettierrc creado`);
    }

    // Verificar y crear .eslintignore si no existe
    const eslintIgnore = path.join(this.projectRoot, '.eslintignore');
    try {
      await fs.access(eslintIgnore);
    } catch (error) {
      const defaultEslintIgnore = [
        'dist/',
        'node_modules/',
        'coverage/',
        '*.min.js',
        '*.config.js'
      ].join('\n');

      await fs.writeFile(eslintIgnore, defaultEslintIgnore, 'utf8');
      this.fixesApplied.configuration++;
      fixes.push(`⚙️ .eslintignore creado`);
    }
  }

  // 🔧 PROBLEMAS COMUNES
  async fixCommonIssues(errors, fixes) {
    const tsFiles = await glob('src/**/*.{ts,js}', { cwd: this.projectRoot });

    for (const file of tsFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Corregir console.log en producción
      if (content.includes('console.log') && !content.includes('logger')) {
        const fixedContent = this.replaceConsoleLogs(content);

        if (fixedContent !== content) {
          await fs.writeFile(filePath, fixedContent, 'utf8');
          this.fixesApplied.structure++;
          fixes.push(`🪵 console.log reemplazado: ${file}`);
        }
      }

      // Corregir comentarios TODO
      if (content.includes('TODO') || content.includes('FIXME')) {
        const fixedContent = this.formatTodoComments(content);

        if (fixedContent !== content) {
          await fs.writeFile(filePath, fixedContent, 'utf8');
          this.fixesApplied.structure++;
          fixes.push(`📝 Comentarios TODO formateados: ${file}`);
        }
      }
    }
  }

  replaceConsoleLogs(content) {
    // Reemplazar console.log con logger si está disponible
    content = content.replace(/console\.log\(/g, 'logger?.info(');
    content = content.replace(/console\.error\(/g, 'logger?.error(');
    content = content.replace(/console\.warn\(/g, 'logger?.warn(');

    return content;
  }

  formatTodoComments(content) {
    // Formatear comentarios TODO para mejor seguimiento
    content = content.replace(/\/\/\s*TODO:/gi, '// 📝 TODO:');
    content = content.replace(/\/\/\s*FIXME:/gi, '// 🔧 FIXME:');
    content = content.replace(/\/\/\s*NOTE:/gi, '// 📌 NOTE:');

    return content;
  }

  // 📊 GENERAR RESUMEN DE FIXES
  generateFixSummary() {
    const total = this.fixesApplied.total;
    const categories = Object.entries(this.fixesApplied)
      .filter(([key, value]) => key !== 'total' && value > 0)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return `✅ ${total} correcciones automáticas aplicadas (${categories})`;
  }
}