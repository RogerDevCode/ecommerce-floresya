"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.systemInfo = exports.greetUser = exports.default = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} // Test file ES6+ - Validación de configuración Babel

// Arrow functions
const greetUser = (name = 'Usuario') => {
  return `¡Hola ${name}! Bienvenido a FloresYa ES6+`;
};

// Destructuring
exports.greetUser = greetUser;const { version } = JSON.parse(_fs.default.readFileSync(_path.default.join(process.cwd(), 'package.json'), 'utf8'));

// Template literals
const systemInfo = exports.systemInfo = `
🚀 FloresYa E-commerce - ES6+ Test
Version: ${version}
Node: ${process.version}
Platform: ${process.platform}
`;

// Classes
class ES6Test {
  constructor() {
    this.features = ['arrow-functions', 'template-literals', 'destructuring', 'classes', 'modules'];
  }

  // Method shorthand
  showFeatures() {
    return this.features.map((feature) => `✅ ${feature}`).join('\n');
  }

  // Async/await
  async validateSetup() {
    try {
      console.log(systemInfo);
      console.log(greetUser('Desarrollador'));
      console.log('\n🎯 Features ES6+ habilitadas:');
      console.log(this.showFeatures());

      // Spread operator
      const newFeatures = [...this.features, 'async-await', 'spread-operator'];
      console.log(`\n📦 Total features: ${newFeatures.length}`);

      return { success: true, features: newFeatures };
    } catch (error) {
      console.error('❌ Error en validación ES6+:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export default
var _default = exports.default = ES6Test;

// Named export


// Auto-execution if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ES6Test();
  tester.validateSetup().then((result) => {
    if (result.success) {
      console.log('\n✅ Configuración ES6+ funcionando correctamente!');
      process.exit(0);
    } else {
      console.log('\n❌ Error en configuración ES6+');
      process.exit(1);
    }
  });
}
//# sourceMappingURL=test-es6.js.map