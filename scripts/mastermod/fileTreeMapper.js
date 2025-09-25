// scripts/mastermod/fileTreeMapper.js
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class FileTreeMapper {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Mapeador de Árbol de Archivos';
  }

  async buildFileTree(dir = this.projectRoot, tree = {}) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        tree[entry.name] = {};
        await this.buildFileTree(fullPath, tree[entry.name]);
      } else {
        const stats = await fs.stat(fullPath);
        tree[entry.name] = {
          path: path.relative(this.projectRoot, fullPath),
          size: stats.size,
          mtime: stats.mtimeMs
        };
      }
    }
    return tree;
  }

  async detectDuplicateFiles() {
    const fileHashes = new Map();
    const duplicates = [];

    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.ts')) {
          const content = await fs.readFile(fullPath);
          const hash = crypto.createHash('sha256').update(content).digest('hex');
          if (fileHashes.has(hash)) {
            duplicates.push({
              original: fileHashes.get(hash),
              duplicate: path.relative(this.projectRoot, fullPath),
              hash
            });
          } else {
            fileHashes.set(hash, path.relative(this.projectRoot, fullPath));
          }
        } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        }
      }
    };

    await walk(this.projectRoot);
    return duplicates;
  }

  async validate() {
    const tree = await this.buildFileTree();
    const duplicates = await this.detectDuplicateFiles();

    if (duplicates.length > 0) {
      this.logger.error('ARCHIVOS DUPLICADOS DETECTADOS:');
      duplicates.forEach(d => this.logger.error(`  - ${d.original} ↔ ${d.duplicate}`));
    }
  }
}