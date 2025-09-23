// scripts/mastermod/reportGenerator.js
import fs from 'fs/promises';
import path from 'path';

export class ReportGenerator {
  constructor(projectRoot, logger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
    this.name = 'Generador de Reporte Markdown';
    this.results = [];
  }

  addResult(validatorName, hasErrors, details) {
    this.results.push({
      name: validatorName,
      hasErrors,
      details
    });
  }

  generateSummary() {
    const totalValidators = this.results.length;
    const failedValidators = this.results.filter(r => r.hasErrors).length;
    const passedValidators = totalValidators - failedValidators;

    let summary = `# 🏭 MASTER VALIDATOR REPORT — Zero Tech Debt Edition\n\n`;
    summary += `**Fecha:** ${new Date().toISOString()}\n\n`;
    summary += `## 📊 RESUMEN EJECUTIVO\n\n`;
    summary += `| Total Validadores | Pasaron | Fallaron |\n`;
    summary += `|-------------------|---------|----------|\n`;
    summary += `| ${totalValidators} | ${passedValidators} | ${failedValidators} |\n\n`;

    if (failedValidators > 0) {
      summary += `## ❌ PROBLEMAS CRÍTICOS DETECTADOS\n\n`;
      this.results
        .filter(r => r.hasErrors)
        .forEach(r => {
          summary += `- **${r.name}**: ${r.details.length} problemas encontrados\n`;
        });
      summary += `\n> 💡 **Acción inmediata**: Revisa las secciones detalladas abajo y corrige los errores.\n\n`;
    } else {
      summary += `## ✅ TODO ESTÁ EN ORDEN\n\n`;
      summary += `¡Felicidades! Tu proyecto cumple con los estándares industriales de calidad y mantenibilidad.\n\n`;
    }

    return summary;
  }

  generateDetailedSection(validatorName, details) {
    if (details.length === 0) return '';

    let section = `## 🔍 ${validatorName}\n\n`;
    section += `Se encontraron ${details.length} problemas:\n\n`;

    details.forEach(detail => {
      if (typeof detail === 'string') {
        section += `- ${detail}\n`;
      } else if (detail.file) {
        section += `- \`${detail.file}\`:${detail.line || ''} → ${detail.message || detail.code || detail.ref || detail.import}\n`;
      } else {
        section += `- ${JSON.stringify(detail)}\n`;
      }
    });

    section += `\n---\n\n`;
    return section;
  }

  async generateReport() {
    let report = this.generateSummary();

    for (const result of this.results) {
      if (result.hasErrors) {
        report += this.generateDetailedSection(result.name, result.details);
      }
    }

    const reportPath = path.join(this.projectRoot, 'MASTER_VALIDATOR_REPORT.md');
    await fs.writeFile(reportPath, report, 'utf8');
    this.logger.success(`📄 Reporte generado: ${reportPath}`);
  }
}