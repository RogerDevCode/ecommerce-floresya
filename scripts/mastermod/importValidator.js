// scripts/mastermod/importValidator.js
import fs from 'fs/promises';
import path from 'path';

export class ImportValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Imports';
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async validate() {
    const invalidImports = [];

    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.ts')) {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const importMatch = line.match(/import\s+.*from\s+['"](.*)['"]/);
            if (importMatch) {
              let importPath = importMatch[1];
              let resolvedPath = null;

              if (importPath.startsWith('.')) {
                resolvedPath = path.resolve(path.dirname(fullPath), importPath);
                if (!resolvedPath.endsWith('.ts')) {
                  resolvedPath += '.ts';
                }
              } else {
                continue; // node_modules
              }

              if (resolvedPath && !(await this.fileExists(resolvedPath))) {
                invalidImports.push({
                  file: path.relative(this.projectRoot, fullPath),
                  line: i + 1,
                  import: importPath,
                  resolved: resolvedPath
                });
              }
            }
          }
        } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        }
      }
    };

    await walk(this.projectRoot);

    if (invalidImports.length > 0) {
      this.logger.error('IMPORTS INVÁLIDOS DETECTADOS:');
      invalidImports.forEach(imp => 
        this.logger.error(`  - ${imp.file}:${imp.line} → ${imp.import} (resuelve a: ${imp.resolved})`)
      );
    }
  }
}