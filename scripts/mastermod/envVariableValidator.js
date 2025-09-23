// scripts/mastermod/envVariableValidator.js
import fs from 'fs/promises';
import path from 'path';

export class EnvVariableValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Variables de Entorno';
  }

  async getDeclaredEnvVars() {
    const envFiles = ['.env', '.env.example', '.env.local'];
    const vars = new Set();

    for (const file of envFiles) {
      const envPath = path.join(this.projectRoot, file);
      try {
        const content = await fs.readFile(envPath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine && !cleanLine.startsWith('#') && cleanLine.includes('=')) {
            const [key] = cleanLine.split('=');
            vars.add(key.trim());
          }
        }
      } catch (error) {
        // Archivo no existe — ignorar
      }
    }

    return vars;
  }

  async getUsedEnvVars() {
    const usedVars = new Set();
    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.ts')) {
          const content = await fs.readFile(fullPath, 'utf8');
          const matches = content.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g);
          for (const match of matches) {
            usedVars.add(match[1]);
          }
        } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        }
      }
    };

    await walk(this.projectRoot);
    return usedVars;
  }

  async validate() {
    const declared = await this.getDeclaredEnvVars();
    const used = await this.getUsedEnvVars();

    const unused = [...declared].filter(v => !used.has(v));
    const undeclared = [...used].filter(v => !declared.has(v));

    if (unused.length > 0) {
      this.logger.warn('VARIABLES DE ENTORNO DECLARADAS PERO NO USADAS:');
      unused.forEach(v => this.logger.warn(`  - ${v}`));
    }

    if (undeclared.length > 0) {
      this.logger.error('VARIABLES DE ENTORNO USADAS PERO NO DECLARADAS:');
      undeclared.forEach(v => this.logger.error(`  - ${v}`));
    }
  }
}