// scripts/mastermod/consoleLogValidator.js
import fs from 'fs/promises';
import path from 'path';

export class ConsoleLogValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Console Logs';
  }

  async validate() {
    const consoleLogs = [];

    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.ts')) {
          // Excluir archivos de logger intencional
          if (entry.name.includes('logger') || entry.name.includes('debug')) {
            continue;
          }

          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('console.log') || line.includes('console.warn') || line.includes('console.error')) {
              // Verificar que no sea un comentario
              if (!line.trim().startsWith('//') && !line.trim().startsWith('/*')) {
                consoleLogs.push({
                  file: path.relative(this.projectRoot, fullPath),
                  line: i + 1,
                  code: line.trim()
                });
              }
            }
          }
        } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        }
      }
    };

    await walk(path.join(this.projectRoot, 'src'));

    if (consoleLogs.length > 0) {
      this.logger.warn('CONSOLE.LOG ENCONTRADOS EN CÓDIGO DE PRODUCCIÓN:');
      consoleLogs.forEach(log => 
        this.logger.warn(`  - ${log.file}:${log.line} → ${log.code}`)
      );
    }

    return {
      hasErrors: consoleLogs.length > 0,
      details: consoleLogs
    };
  }
}