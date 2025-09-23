// scripts/mastermod/complexityValidator.js
import fs from 'fs/promises';
import path from 'path';

export class ComplexityValidator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Validador de Complejidad Ciclomática';
  }

  calculateComplexity(code) {
    let complexity = 1;
    const keywords = ['if', 'for', 'while', 'case', '&&', '||', 'catch', '?:'];
    
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      let match;
      while ((match = regex.exec(code)) !== null) {
        complexity++;
      }
    }
    
    return complexity;
  }

  async validate() {
    const highComplexityFunctions = [];

    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.endsWith('.ts')) {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const funcMatch = line.match(/^(export\s+)?function\s+(\w+)/);
            if (funcMatch) {
              const functionName = funcMatch[2];
              let funcBody = '';
              let braceCount = 0;
              let j = i;

              // Extraer cuerpo de la función
              for (; j < lines.length; j++) {
                const currentLine = lines[j];
                funcBody += currentLine + '\n';
                braceCount += (currentLine.match(/{/g) || []).length;
                braceCount -= (currentLine.match(/}/g) || []).length;
                if (braceCount === 0 && j > i) break;
              }

              const complexity = this.calculateComplexity(funcBody);
              if (complexity > 10) {
                highComplexityFunctions.push({
                  file: path.relative(this.projectRoot, fullPath),
                  line: i + 1,
                  function: functionName,
                  complexity
                });
              }

              i = j; // Saltar al final de la función
            }
          }
        } else if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await walk(fullPath);
        }
      }
    };

    await walk(path.join(this.projectRoot, 'src'));

    if (highComplexityFunctions.length > 0) {
      this.logger.warn('FUNCIONES CON ALTA COMPLEJIDAD CICLOMÁTICA (>10):');
      highComplexityFunctions.forEach(func => 
        this.logger.warn(`  - ${func.file}:${func.line} → ${func.function} (complejidad: ${func.complexity})`)
      );
      this.logger.info('💡 Considera dividir estas funciones en partes más pequeñas.');
    }
  }
}