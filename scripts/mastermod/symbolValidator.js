// scripts/mastermod/symbolValidator.js
import fs from 'fs/promises';
import path from 'path';

export class SymbolValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Símbolos Duplicados';
  }

  async validate() {
    const symbolMap = new Map();
    const duplicates = [];

    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.ts')) {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Detectar "interface Nombre"
            const interfaceMatch = line.match(/^(export\s+)?interface\s+(\w+)/);
            if (interfaceMatch) {
              const name = interfaceMatch[2];
              this.registerSymbol(symbolMap, duplicates, name, 'interface', fullPath, i + 1);
            }
            
            // Detectar "class Nombre"
            const classMatch = line.match(/^(export\s+)?class\s+(\w+)/);
            if (classMatch) {
              const name = classMatch[2];
              this.registerSymbol(symbolMap, duplicates, name, 'class', fullPath, i + 1);
            }
          }
        } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        }
      }
    };

    await walk(path.join(this.projectRoot, 'src'));

    if (duplicates.length > 0) {
      this.logger.error('SÍMBOLOS DUPLICADOS DETECTADOS:');
      duplicates.forEach(d => 
        this.logger.error(`  - ${d.type} ${d.name}: ${d.first.file}:${d.first.line} ↔ ${d.second.file}:${d.second.line}`)
      );
    }

    return {
      hasErrors: duplicates.length > 0,
      details: duplicates
    };
  }

  registerSymbol(symbolMap, duplicates, name, type, file, line) {
    const relativeFile = path.relative(this.projectRoot, file);
    if (symbolMap.has(name)) {
      const existing = symbolMap.get(name);
      if (existing.type === type) {
        duplicates.push({
          name,
          type,
          first: { file: existing.file, line: existing.line },
          second: { file: relativeFile, line }
        });
      }
    } else {
      symbolMap.set(name, { file: relativeFile, line, type });
    }
  }
}