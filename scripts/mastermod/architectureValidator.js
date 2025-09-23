// scripts/mastermod/architectureValidator.js
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export class ArchitectureValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Arquitectura Enterprise - Advanced Edition';
    this.dependencyGraph = new Map();
    this.layerDependencies = {
      'controllers': ['services', 'shared'],
      'services': ['shared', 'types'],
      'routes': ['controllers', 'middleware', 'shared'],
      'middleware': ['shared'],
      'frontend': ['shared'],
      'admin': ['frontend', 'shared']
    };
  }

  async validate() {
    const errors = [];

    try {
      // Validaciones básicas mejoradas
      await this.validateDirectoryStructure(errors);
      await this.validateFrontendBackendSeparation(errors);
      await this.validateUniqueFileNames(errors);
      await this.validateCircularDependencies(errors);
      await this.validateServiceLayer(errors);

      // NUEVAS VALIDACIONES AVANZADAS
      await this.validateLayeredArchitecture(errors);
      await this.validateDependencyInversion(errors);
      await this.validateSOLIDPrinciples(errors);
      await this.validateDesignPatterns(errors);
      await this.validateModuleBoundaries(errors);
      await this.validateInterfaceSegregation(errors);
      await this.validateCodeMetrics(errors);

      return {
        hasErrors: errors.length > 0,
        details: errors
      };
    } catch (error) {
      return {
        hasErrors: true,
        details: [`Error crítico en validación de arquitectura: ${error.message}`]
      };
    }
  }

  async validateDirectoryStructure(errors) {
    const requiredDirs = [
      'src/types',
      'src/services',
      'src/controllers',
      'src/app/routes',
      'src/frontend',
      'public',
      'dist'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      try {
        const stat = await fs.stat(dirPath);
        if (!stat.isDirectory()) {
          errors.push(`❌ ${dir} existe pero no es un directorio`);
        }
      } catch (error) {
        errors.push(`❌ Directorio requerido ${dir} no existe`);
      }
    }

    // Verificar que no existan directorios prohibidos
    const prohibitedDirs = [
      'src/backend',     // Todo debe estar en src/
      'src/client',      // Frontend va en src/frontend
      'app',             // Debe estar en src/app
      'backend',         // No separación física backend
      'frontend'         // Frontend compilado va a dist/frontend
    ];

    for (const dir of prohibitedDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      try {
        await fs.stat(dirPath);
        errors.push(`❌ Directorio prohibido ${dir} encontrado - Revisar arquitectura`);
      } catch (error) {
        // Está bien que no exista
      }
    }
  }

  async validateFrontendBackendSeparation(errors) {
    // Verificar que frontend no importe directamente de servicios backend
    const frontendFiles = await glob('src/frontend/**/*.ts', { cwd: this.projectRoot });

    for (const file of frontendFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Imports prohibidos desde frontend
      const prohibitedImports = [
        /from\s+['"](\.\.\/)+services\//,      // ../services/
        /from\s+['"](\.\.\/)+controllers\//,   // ../controllers/
        /from\s+['"](\.\.\/)+app\//,          // ../app/
        /import.*supabaseService.*from/        // Acceso directo a Supabase
      ];

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        for (const pattern of prohibitedImports) {
          if (pattern.test(line)) {
            errors.push(`❌ Import prohibido en frontend ${file}:${lineNumber} - "${line.trim()}"`);
          }
        }
      }
    }
  }

  getFileLayer(filePath) {
    if (filePath.includes('src/controllers/')) return 'controllers';
    if (filePath.includes('src/services/')) return 'services';
    if (filePath.includes('src/app/routes/')) return 'routes';
    if (filePath.includes('src/app/middleware/')) return 'middleware';
    if (filePath.includes('src/frontend/')) return 'frontend';
    if (filePath.includes('src/shared/')) return 'shared';
    return null;
  }

  extractImports(content) {
    const imports = [];
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (importPath.startsWith('.')) {
        // Resolver path relativo
        const resolved = path.resolve(path.dirname(`src/${importPath}`), importPath);
        const relativePath = path.relative('src', resolved);
        if (!relativePath.startsWith('..')) {
          imports.push(relativePath);
        }
      }
    }

    return imports;
  }

  isInvalidDependency(fromLayer, toLayer) {
    const allowedDependencies = this.layerDependencies[fromLayer] || [];
    return !allowedDependencies.includes(toLayer);
  }

  async validateDependencyInversion(errors) {
    const serviceFiles = await glob('src/services/*.ts', { cwd: this.projectRoot });

    for (const file of serviceFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Verificar que servicios no dependan de controladores
      if (content.includes('from \'../controllers/') || content.includes('from "../../controllers/')) {
        errors.push(`🏗️ Violación DIP: ${file} depende de controladores - Inversión incorrecta`);
      }

      // Verificar que use abstracciones, no concreciones
      if (content.includes('extends') && !content.includes('implements')) {
        errors.push(`🏗️ ${file} usa herencia - Considerar composición o interfaces`);
      }
    }
  }

  async validateSOLIDPrinciples(errors) {
          const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });
      
          for (const file of tsFiles) {
            const filePath = path.join(this.projectRoot, file);
            const content = await fs.readFile(filePath, 'utf8');
      
            // SRP: Single Responsibility Principle
            const classMatches = content.match(/class\s+(\w+)/g) || [];
            for (const classMatch of classMatches) {
              const className = classMatch.replace('class ', '');
              const lines = content.split('\n');
      
              let methodCount = 0;
              let hasMultipleResponsibilities = false;
      
              for (const line of lines) {
                if (line.includes(`  ${className}(`) || line.includes(`${className}(`)) {
                  // Constructor
                  hasMultipleResponsibilities = true;
                }
                if (line.match(/\w+\([^)]*\)\s*{/)) {
                  methodCount++;
                }
              }
      
              if (methodCount > 10) {
                errors.push(`📏 SRP: ${file} tiene demasiados métodos (${methodCount}) - Dividir clase`);
              }
            }
      
            // OCP: Open/Closed Principle
            if (content.includes('switch') && content.includes('type')) {
              errors.push(`📏 OCP: ${file} usa switch en tipos - Considerar polimorfismo`);
            }
      
            // LSP: Liskov Substitution Principle
            if (content.includes('instanceof') && content.includes('throw')) {
              errors.push(`📏 LSP: ${file} puede violar LSP - Verificar substitución`);
            }
      
            // ISP: Interface Segregation Principle
            const interfaceMatches = content.match(/interface\s+(\w+)/g) || [];
            for (const interfaceMatch of interfaceMatches) {
              const interfaceName = interfaceMatch.replace('interface ', '');
              if (interfaceName.length > 20) {
                errors.push(`📏 ISP: Interface ${interfaceName} puede ser demasiado grande - Dividir`);
              }
            }
      
            // DIP: Dependency Inversion Principle
            if (content.includes('new ') && content.includes('Service')) {
              errors.push(`📏 DIP: ${file} usa 'new' directamente - Usar inyección de dependencias`);
            }
          }
        }
      
        async validateDesignPatterns(errors) {
          const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });
      
          for (const file of tsFiles) {
            const filePath = path.join(this.projectRoot, file);
            const content = await fs.readFile(filePath, 'utf8');
      
            // Factory Pattern
            if (content.includes('create') && content.includes('return new')) {
              errors.push(`🏗️ Factory: ${file} puede necesitar patrón Factory para creación compleja`);
            }
      
            // Observer Pattern
            if (content.includes('addEventListener') && content.includes('emit')) {
              errors.push(`🏗️ Observer: ${file} mezcla callbacks con eventos - Considerar Observer pattern`);
            }
      
            // Strategy Pattern
            if (content.includes('if') && content.includes('type') && content.includes('execute')) {
              errors.push(`🏗️ Strategy: ${file} puede beneficiarse del patrón Strategy`);
            }
      
            // Decorator Pattern
            if (content.includes('class') && content.includes('extends') && content.includes('super')) {
              errors.push(`🏗️ Decorator: ${file} usa herencia - Considerar patrón Decorator`);
            }
      
            // Repository Pattern
            if (content.includes('from \'@supabase') && !content.includes('Service')) {
              errors.push(`🏗️ Repository: ${file} accede directamente a DB - Usar Repository pattern`);
            }
          }
        }
      
        async validateModuleBoundaries(errors) {
          const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });
      
          for (const file of tsFiles) {
            const filePath = path.join(this.projectRoot, file);
            const content = await fs.readFile(filePath, 'utf8');
      
            // Verificar que módulos no expongan implementaciones internas
            if (content.includes('export') && content.includes('private')) {
              errors.push(`🏗️ Encapsulación: ${file} exporta métodos privados - Revisar API pública`);
            }
      
            // Verificar que no haya dependencias circulares lógicas
            const hasImports = content.includes('import') || content.includes('from');
            const hasExports = content.includes('export');
      
            if (hasImports && hasExports) {
              const lines = content.split('\n');
              let importCount = 0;
              let exportCount = 0;
      
              for (const line of lines) {
                if (line.includes('import') || line.includes('from')) importCount++;
                if (line.includes('export')) exportCount++;
              }
      
              if (importCount > 15) {
                errors.push(`🏗️ Acoplamiento: ${file} tiene demasiados imports (${importCount}) - Alto acoplamiento`);
              }
      
              if (exportCount > 20) {
                errors.push(`🏗️ Cohesión: ${file} exporta demasiados símbolos (${exportCount}) - Baja cohesión`);
              }
            }
          }
        }
      
        async validateInterfaceSegregation(errors) {
          const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });
      
          for (const file of tsFiles) {
            const filePath = path.join(this.projectRoot, file);
            const content = await fs.readFile(filePath, 'utf8');
      
            // Buscar interfaces grandes
            const interfaceMatches = content.match(/interface\s+\w+[^}]+/gs) || [];
            for (const interfaceMatch of interfaceMatches) {
              const methodCount = (interfaceMatch.match(/^\s*\w+\([^)]*\)/gm) || []).length;
              const propertyCount = (interfaceMatch.match(/^\s*\w+:/gm) || []).length;
      
              if (methodCount + propertyCount > 15) {
                const interfaceName = interfaceMatch.match(/interface\s+(\w+)/)?.[1];
                errors.push(`📏 ISP: Interface ${interfaceName} es demasiado grande (${methodCount + propertyCount} miembros) - Dividir`);
              }
            }
      
            // Verificar que clases implementen interfaces pequeñas
            const classMatches = content.match(/class\s+\w+.*implements[^}]+/gs) || [];
            for (const classMatch of classMatches) {
              const interfaceCount = (classMatch.match(/implements/g) || []).length;
              if (interfaceCount > 3) {
                const className = classMatch.match(/class\s+(\w+)/)?.[1];
                errors.push(`📏 ISP: Clase ${className} implementa demasiadas interfaces (${interfaceCount}) - Dividir responsabilidades`);
              }
            }
          }
        }
      
        async validateCodeMetrics(errors) {
          const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });
      
          for (const file of tsFiles) {
            const filePath = path.join(this.projectRoot, file);
            const content = await fs.readFile(filePath, 'utf8');
      
            const lines = content.split('\n');
            const totalLines = lines.length;
      
            // Métricas de complejidad
            let complexity = 0;
            let nestingLevel = 0;
            let maxNesting = 0;
      
            for (const line of lines) {
              if (line.includes('if') || line.includes('for') || line.includes('while') ||
                  line.includes('catch') || line.includes('case')) {
                complexity++;
              }
      
              const leadingSpaces = line.match(/^(\s*)/)?.[1]?.length || 0;
              nestingLevel = Math.floor(leadingSpaces / 2);
              maxNesting = Math.max(maxNesting, nestingLevel);
            }
      
            // Reportar archivos complejos
            if (totalLines > 500) {
              errors.push(`📏 Complejidad: ${file} es muy largo (${totalLines} líneas) - Dividir en módulos`);
            }
      
            if (complexity > 50) {
              errors.push(`📏 Complejidad: ${file} tiene alta complejidad ciclomática (${complexity}) - Refactorizar`);
            }
      
            if (maxNesting > 5) {
              errors.push(`📏 Anidamiento: ${file} tiene anidamiento excesivo (${maxNesting} niveles) - Extraer métodos`);
            }
      
            // Verificar funciones largas
            const functionMatches = content.match(/^\s*\w+\s+\w+\([^)]*\)\s*{[^}]*}/gms) || [];
            for (const functionMatch of functionMatches) {
              const functionLines = functionMatch.split('\n').length;
              if (functionLines > 50) {
                const functionName = functionMatch.match(/^\s*\w+\s+(\w+)/)?.[1];
                errors.push(`📏 Función larga: ${functionName} en ${file} (${functionLines} líneas) - Extraer lógica`);
              }
            }
          }
        }

  async validateUniqueFileNames(errors) {
    const allFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });
    const fileNameMap = new Map();

    for (const file of allFiles) {
      const fileName = path.basename(file);

      if (!fileNameMap.has(fileName)) {
        fileNameMap.set(fileName, []);
      }
      fileNameMap.get(fileName).push(file);
    }

    // Reportar archivos con nombres duplicados
    for (const [fileName, files] of fileNameMap) {
      if (files.length > 1) {
        errors.push(`❌ Nombre de archivo duplicado '${fileName}' en: ${files.join(', ')}`);
      }
    }
  }

  async validateCircularDependencies(errors) {
    const tsFiles = await glob('src/**/*.ts', { cwd: this.projectRoot });
    const importGraph = new Map();

    // Construir grafo de importaciones
    for (const file of tsFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      const imports = [];
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];

        // Resolver path relativo a absoluto
        if (importPath.startsWith('.')) {
          const resolved = path.resolve(path.dirname(file), importPath);
          const relativePath = path.relative('src', resolved);
          if (!relativePath.startsWith('..')) {
            imports.push(`src/${relativePath}`);
          }
        }
      }

      importGraph.set(file, imports);
    }

    // Detectar ciclos simples (A -> B -> A)
    for (const [file, imports] of importGraph) {
      for (const importedFile of imports) {
        const transitiveImports = importGraph.get(importedFile) || [];
        if (transitiveImports.includes(file)) {
          errors.push(`❌ Dependencia circular detectada: ${file} ↔ ${importedFile}`);
        }
      }
    }
  }

  async validateServiceLayer(errors) {
    // Verificar que controladores no accedan directamente a Supabase
    const controllerFiles = await glob('src/controllers/*.ts', { cwd: this.projectRoot });

    for (const file of controllerFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      if (content.includes('from \'@supabase/supabase-js\'') ||
          content.includes('supabaseService')) {
        errors.push(`❌ Controlador ${file} accede directamente a Supabase - Usar servicios`);
      }

      // Verificar que use servicios
      if (!content.includes('Service') && !content.includes('service')) {
        errors.push(`⚠️ Controlador ${file} no parece usar servicios - Revisar arquitectura`);
      }
    }

    // Verificar que rutas usen controladores
    const routeFiles = await glob('src/app/routes/*.ts', { cwd: this.projectRoot });

    for (const file of routeFiles) {
      const filePath = path.join(this.projectRoot, file);
      const content = await fs.readFile(filePath, 'utf8');

      if (!content.includes('Controller') && !content.includes('controller')) {
        errors.push(`⚠️ Ruta ${file} no parece usar controladores - Revisar arquitectura`);
      }
    }
  }
}