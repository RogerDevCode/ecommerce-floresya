#!/usr/bin/env node
// scripts/master.js
import path from 'path';
import { fileURLToPath } from 'url';

// Core Validators (Nivel 1 + 2)
import { APIRouteValidator } from './mastermod/apiRouteValidator';
import { ArchitectureValidator } from './mastermod/architectureValidator';
import { AutoFixValidator } from './mastermod/autoFixValidator';
import { BuildValidator } from './mastermod/buildValidator';
import { ComplexityValidator } from './mastermod/complexityValidator';
import { ConfigValidator } from './mastermod/configValidator';
import { ConsoleLogValidator } from './mastermod/consoleLogValidator';
import { EnvVariableValidator } from './mastermod/envVariableValidator';
import { FileTreeMapper } from './mastermod/fileTreeMapper';
import { HTMLReferenceValidator } from './mastermod/htmlReferenceValidator';
import { ImportValidator } from './mastermod/importValidator';
import { NamingConventionValidator } from './mastermod/namingConventionValidator';
import { OrphanFileValidator } from './mastermod/orphanFileValidator';
import { PerformanceValidator } from './mastermod/performanceValidator';
import { ReportGenerator } from './mastermod/reportGenerator';
import { SecurityValidator } from './mastermod/securityValidator';
import { SymbolValidator } from './mastermod/symbolValidator';
import { TestingValidator } from './mastermod/testingValidator';
import { TypeSafetyValidator } from './mastermod/typeSafetyValidator';
import { UnusedDependencyValidator } from './mastermod/unusedDependencyValidator';
// Logger
import { Logger } from './mastermod/utils/logger';

// Enterprise Validators (Nivel 3 - Critical)

// Report Generator

class MasterValidator {
  constructor() {
    // Fix project root path - should be parent directory, not scripts directory
    this.projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    this.logger = new Logger();
    this.validators = [];
  }

  async initializeValidators() {
    this.validators = [
      // NIVEL 1: Configuración básica
      new ConfigValidator(this.projectRoot, this.logger),
      new FileTreeMapper(this.projectRoot, this.logger),

      // NIVEL 2: Calidad de código
      new ImportValidator(this.projectRoot, this.logger),
      new SymbolValidator(this.projectRoot, this.logger),
      new NamingConventionValidator(this.projectRoot, this.logger),
      new ComplexityValidator(this.projectRoot, this.logger),
      new ConsoleLogValidator(this.projectRoot, this.logger),

      // NIVEL 3: Enterprise Critical
      new TypeSafetyValidator(this.projectRoot, this.logger),
      new ArchitectureValidator(this.projectRoot, this.logger),
      new SecurityValidator(this.projectRoot, this.logger),
      new PerformanceValidator(this.projectRoot, this.logger),
      new TestingValidator(this.projectRoot, this.logger),
      new AutoFixValidator(this.projectRoot, this.logger),

      // NIVEL 4: Sistema completo
      new BuildValidator(this.projectRoot, this.logger),
      new HTMLReferenceValidator(this.projectRoot, this.logger),
      new EnvVariableValidator(this.projectRoot, this.logger),
      new APIRouteValidator(this.projectRoot, this.logger),
      new UnusedDependencyValidator(this.projectRoot, this.logger),
      new OrphanFileValidator(this.projectRoot, this.logger)
    ];
  }

  async run() {
    this.logger.info('🏭 INICIANDO MASTER VALIDATOR — Enterprise Edition v2.0');
    this.logger.info('🌸 FloresYa E-commerce - Validación Integral de Calidad');
    this.logger.info('========================================');
    this.logger.info('✅ Niveles de Validación:');
    this.logger.info('  📋 NIVEL 1: Configuración básica');
    this.logger.info('  🔧 NIVEL 2: Calidad de código');
    this.logger.info('  🏢 NIVEL 3: Enterprise Critical (SSOT, Seguridad, Performance)');
    this.logger.info('  🚀 NIVEL 4: Sistema completo');
    this.logger.info('========================================');

    await this.initializeValidators();

    const reportGenerator = new ReportGenerator(this.projectRoot, this.logger);
    let globalHasErrors = false;

    for (const validator of this.validators) {
      try {
        this.logger.info(`\n🚀 Ejecutando: ${validator.name}...`);
        const result = await validator.validate();

        const hasErrors = result?.hasErrors || false;
        const details = result?.details || [];

        reportGenerator.addResult(validator.name, hasErrors, details);

        if (hasErrors) {
          globalHasErrors = true;
          this.logger.error(`❌ ${validator.name} detectó problemas.`);
        } else {
          this.logger.success(`✅ ${validator.name} completado sin problemas.`);
        }
      } catch (error) {
        this.logger.error(`❌ ${validator.name} falló: ${error.message}`);
        reportGenerator.addResult(validator.name, true, [`Error crítico: ${error.message}`]);
        globalHasErrors = true;
      }
    }

    // Generar reporte final
    await reportGenerator.generateReport();

    this.logger.info('\n========================================');
    if (globalHasErrors) {
      this.logger.error('💥 MASTER VALIDATOR COMPLETADO CON ERRORES.');
      this.logger.error('📄 Revisa MASTER_VALIDATOR_REPORT.md para detalles.');
      process.exit(1);
    } else {
      this.logger.success('🎉 MASTER VALIDATOR COMPLETADO SIN ERRORES.');
      this.logger.success('✅ PROYECTO LISTO PARA PRODUCCIÓN.');
      this.logger.success('📄 Reporte generado: MASTER_VALIDATOR_REPORT.md');
    }
  }
}

// Ejecutar validador
const masterValidator = new MasterValidator();
await masterValidator.run();