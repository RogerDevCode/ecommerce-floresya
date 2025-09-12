// Test file ES6+ - Validación de configuración Babel
import fs from 'fs';
import path from 'path';

// Arrow functions
const greetUser = (name = 'Usuario') => {
    return `¡Hola ${name}! Bienvenido a FloresYa ES6+`;
};

// Destructuring
const { version } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

// Template literals
const systemInfo = `
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
        return this.features.map(feature => `✅ ${feature}`).join('\n');
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
export default ES6Test;

// Named export
export { greetUser, systemInfo };

// Auto-execution if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new ES6Test();
    tester.validateSetup().then(result => {
        if (result.success) {
            console.log('\n✅ Configuración ES6+ funcionando correctamente!');
            process.exit(0);
        } else {
            console.log('\n❌ Error en configuración ES6+');
            process.exit(1);
        }
    });
}