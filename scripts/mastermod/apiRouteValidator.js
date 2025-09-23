// scripts/mastermod/apiRouteValidator.js
import fs from 'fs/promises';
import path from 'path';

export class APIRouteValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Rutas de API';
  }

  async extractFrontendAPIUrls() {
    const urls = new Set();
    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.ts')) {
          const content = await fs.readFile(fullPath, 'utf8');
          // Busca fetch, axios.get, etc.
          const fetchMatches = content.matchAll(/fetch\s*\(\s*['"`]([^'"]*\/api\/[^'"]*)['"`]/g);
          const axiosMatches = content.matchAll(/axios\.(get|post|put|delete)\s*\(\s*['"`]([^'"]*\/api\/[^'"]*)['"`]/g);

          for (const match of fetchMatches) {
            urls.add(match[1]);
          }
          for (const match of axiosMatches) {
            urls.add(match[2]);
          }
        } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        }
      }
    };

    await walk(path.join(this.projectRoot, 'src/frontend'));
    return urls;
  }

  async extractBackendRoutes() {
    const routes = new Set();
    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.ts') && entry.name.includes('Routes')) {
          const content = await fs.readFile(fullPath, 'utf8');
          const appMatches = content.matchAll(/app\.(get|post|put|delete)\s*\(\s*['"`]([^'"]*)['"`]/g);
          for (const match of appMatches) {
            routes.add(match[2]);
          }
        } else if (entry.isDirectory()) {
          await walk(fullPath);
        }
      }
    };

    await walk(path.join(this.projectRoot, 'src/app/routes'));
    return routes;
  }

  async validate() {
    const frontendUrls = await this.extractFrontendAPIUrls();
    const backendRoutes = await this.extractBackendRoutes();

    const missingRoutes = [...frontendUrls].filter(url => {
      const path = url.split('?')[0]; // Ignora query params
      return ![...backendRoutes].some(route => path.endsWith(route));
    });

    if (missingRoutes.length > 0) {
      this.logger.error('LLAMADAS A ENDPOINTS DE API QUE NO EXISTEN:');
      missingRoutes.forEach(url => this.logger.error(`  - ${url}`));
    }
  }
}