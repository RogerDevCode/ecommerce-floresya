// scripts/mastermod/unusedDependencyValidator.js
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export class UnusedDependencyValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Dependencias No Usadas';
  }

  async getInstalledDependencies() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    return Object.keys(deps);
  }

  async getUsedImports() {
    const imports = new Set();
    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.ts')) {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');
          for (const line of lines) {
            const importMatch = line.match(/import\s+.*from\s+['"]([^'"]*)['"]/);
            if (importMatch) {
              const pkg = importMatch[1];
              if (!pkg.startsWith('.')) {
                // Es un paquete de node_modules
                const pkgName = pkg.split('/')[0];
                imports.add(pkgName);
              }
            }
          }
        } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        }
      }
    };

    await walk(path.join(this.projectRoot, 'src'));
    return imports;
  }

  async validate() {
    const installed = await this.getInstalledDependencies();
    const used = await this.getUsedImports();

    const unused = installed.filter(pkg => !used.has(pkg) && pkg !== 'typescript');

    if (unused.length > 0) {
      this.logger.warn('DEPENDENCIAS INSTALADAS PERO NO USADAS:');
      unused.forEach(pkg => this.logger.warn(`  - ${pkg}`));
      
      // Opcional: sugerir comando para eliminarlas
      this.logger.info(`💡 Sugerencia: npm uninstall ${unused.join(' ')}`);
    }
  }
}