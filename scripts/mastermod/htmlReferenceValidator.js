// scripts/mastermod/htmlReferenceValidator.js
import fs from 'fs/promises';
import path from 'path';

export class HTMLReferenceValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Referencias en HTML';
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
    const publicPath = path.join(this.projectRoot, 'public');
    const distPath = path.join(this.projectRoot, 'dist');

    const invalidRefs = [];

    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.html')) {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Busca <script src="..."> y <link href="...">
            const scriptMatch = line.match(/<script[^>]*src\s*=\s*["']([^"']*)["'][^>]*>/i);
            const linkMatch = line.match(/<link[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/i);

            if (scriptMatch || linkMatch) {
              const refPath = (scriptMatch || linkMatch)[1];
              if (refPath.startsWith('/')) {
                // Ruta absoluta desde raíz
                const targetPath = path.join(distPath, refPath.substring(1));
                if (!(await this.fileExists(targetPath))) {
                  invalidRefs.push({
                    file: path.relative(this.projectRoot, fullPath),
                    line: i + 1,
                    ref: refPath,
                    type: scriptMatch ? 'script' : 'link'
                  });
                }
              }
            }
          }
        } else if (entry.isDirectory()) {
          await walk(fullPath);
        }
      }
    };

    await walk(publicPath);

    if (invalidRefs.length > 0) {
      this.logger.error('REFERENCIAS INVÁLIDAS EN HTML DETECTADAS:');
      invalidRefs.forEach(ref => 
        this.logger.error(`  - ${ref.file}:${ref.line} → ${ref.type} "${ref.ref}" no existe en dist/`)
      );
    }
  }
}