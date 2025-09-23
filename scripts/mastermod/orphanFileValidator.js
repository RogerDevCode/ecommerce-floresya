// scripts/mastermod/orphanFileValidator.js
import fs from 'fs/promises';
import path from 'path';

export class OrphanFileValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Archivos Huérfanos';
  }

  async getAllTSFiles() {
    const files = [];
    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
          files.push(fullPath);
        } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        }
      }
    };
    await walk(path.join(this.projectRoot, 'src'));
    return files;
  }

  async getImportedFiles() {
    const imported = new Set();
    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.ts')) {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');
          for (const line of lines) {
            const importMatch = line.match(/import\s+.*from\s+['"](.*)['"]/);
            if (importMatch) {
              let importPath = importMatch[1];
              if (importPath.startsWith('.')) {
                let resolvedPath = path.resolve(path.dirname(fullPath), importPath);
                if (!resolvedPath.endsWith('.ts')) {
                  resolvedPath += '.ts';
                }
                imported.add(resolvedPath);
              }
            }
          }
        } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        }
      }
    };
    await walk(path.join(this.projectRoot, 'src'));
    return imported;
  }

  async validate() {
    const allFiles = await this.getAllTSFiles();
    const importedFiles = await this.getImportedFiles();

    const orphanFiles = allFiles.filter(file => {
      // Excluye archivos de entrada (como server.ts, main.ts)
      const basename = path.basename(file);
      if (['server.ts', 'main.ts', 'admin.ts'].includes(basename)) {
        return false;
      }
      return !importedFiles.has(file);
    });

    if (orphanFiles.length > 0) {
      this.logger.warn('ARCHIVOS HUÉRFANOS DETECTADOS (no importados por nadie):');
      orphanFiles.forEach(file => 
        this.logger.warn(`  - ${path.relative(this.projectRoot, file)}`)
      );
      this.logger.info('💡 Considera eliminarlos o documentar por qué existen.');
    }
  }
}