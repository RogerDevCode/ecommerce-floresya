// scripts/mastermod/buildValidator.js
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class BuildValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Compilación';
  }

  async runBuild() {
    this.logger.info('Ejecutando compilación...');
    execSync('npm run build:prod', { stdio: 'inherit' });
  }

  async collectFiles(dir, extension) {
    const files = [];
    const walk = async (currentDir) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isFile() && entry.name.endsWith(extension)) {
          files.push(fullPath);
        } else if (entry.isDirectory()) {
          await walk(fullPath);
        }
      }
    };
    await walk(dir);
    return files;
  }

  async validate() {
    await this.runBuild();

    const distPath = path.join(this.projectRoot, 'dist');
    const srcPath = path.join(this.projectRoot, 'src');

    const srcFiles = await this.collectFiles(srcPath, '.ts');
    const distFiles = await this.collectFiles(distPath, '.js');

    const missingInDist = [];
    for (const srcFile of srcFiles) {
      const relative = path.relative(srcPath, srcFile);
      const expectedDist = path.join(distPath, relative.replace(/\.ts$/, '.js'));
      if (!distFiles.includes(expectedDist)) {
        missingInDist.push(relative);
      }
    }

    if (missingInDist.length > 0) {
      this.logger.error('ARCHIVOS .js FALTANTES EN dist/:');
      missingInDist.forEach(f => this.logger.error(`  - ${f}`));
    }
  }
}