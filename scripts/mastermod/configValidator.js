// scripts/mastermod/configValidator.js
import fs from 'fs/promises';
import path from 'path';

export class ConfigValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Configuración TypeScript';
  }

  async validate() {
    const files = await fs.readdir(this.projectRoot);
    const tsConfigFiles = files.filter(f => f.startsWith('tsconfig') && f.endsWith('.json'));

    for (const file of tsConfigFiles) {
      const configPath = path.join(this.projectRoot, file);
      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content);

      if (config.compilerOptions?.outDir) {
        const outDir = path.resolve(this.projectRoot, config.compilerOptions.outDir);
        if (!outDir.startsWith(this.projectRoot)) {
          this.logger.warn(`[${file}] outDir apunta fuera del proyecto: ${outDir}`);
        }
      }

      if (config.include) {
        for (const pattern of config.include) {
          if (pattern.includes('..')) {
            this.logger.warn(`[${file}] include usa rutas relativas peligrosas: ${pattern}`);
          }
        }
      }
    }
  }
}