// scripts/mastermod/namingConventionValidator.js
import fs from 'fs/promises';
import path from 'path';

export class NamingConventionValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Convenciones de Nomenclatura';
  }

  isPascalCase(str) {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str);
  }

  isCamelCase(str) {
    return /^[a-z][a-zA-Z0-9]*$/.test(str);
  }

  isKebabCase(str) {
    return /^[a-z][a-z0-9\-]*[a-z0-9]$/.test(str);
  }

  async validate() {
    const errors = [];

    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.projectRoot, fullPath);

        if (entry.isFile()) {
          // Archivos .ts: PascalCase para clases/interfaces, camelCase para funciones
          if (entry.name.endsWith('.ts')) {
            const content = await fs.readFile(fullPath, 'utf8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();

              // Clases e interfaces
              const classMatch = line.match(/^(export\s+)?class\s+(\w+)/);
              const interfaceMatch = line.match(/^(export\s+)?interface\s+(\w+)/);
              if (classMatch || interfaceMatch) {
                const name = (classMatch || interfaceMatch)[2];
                if (!this.isPascalCase(name)) {
                  errors.push({
                    file: relativePath,
                    line: i + 1,
                    message: `Clase/Interfaz "${name}" debe ser PascalCase`
                  });
                }
              }

              // Funciones
              const funcMatch = line.match(/^(export\s+)?function\s+(\w+)/);
              if (funcMatch) {
                const name = funcMatch[2];
                if (!this.isCamelCase(name)) {
                  errors.push({
                    file: relativePath,
                    line: i + 1,
                    message: `Función "${name}" debe ser camelCase`
                  });
                }
              }
            }
          }

          // Archivos HTML/CSS: kebab-case
          if (entry.name.endsWith('.html') || entry.name.endsWith('.css')) {
            const filename = path.parse(entry.name).name;
            if (!this.isKebabCase(filename)) {
              errors.push({
                file: relativePath,
                line: 1,
                message: `Archivo debe ser kebab-case: ${filename}`
              });
            }
          }
        } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        }
      }
    };

    await walk(this.projectRoot);

    if (errors.length > 0) {
      this.logger.warn('VIOLACIONES DE CONVENCIONES DE NOMENCLATURA:');
      errors.forEach(err => 
        this.logger.warn(`  - ${err.file}:${err.line} → ${err.message}`)
      );
    }
  }
}