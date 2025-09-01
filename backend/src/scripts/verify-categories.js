#!/usr/bin/env node

const { Category, Product } = require('../models');
const { sequelize } = require('../config/database');

async function verifyCategories() {
    console.log('🔍 Verificando categorías y productos de FloresYa...');
    
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión establecida.\n');
        
        // Get all categories
        const categories = await Category.findAll({ order: [['name', 'ASC']] });
        
        console.log('📂 CATEGORÍAS ENCONTRADAS:');
        console.log('=' .repeat(50));
        
        for (const category of categories) {
            const productCount = await Product.count({ 
                where: { category_id: category.id, active: true } 
            });
            
            console.log(`${category.id}. ${category.name}`);
            console.log(`   📝 ${category.description}`);
            console.log(`   🛒 ${productCount} productos activos`);
            console.log(`   🖼️  ${category.image_url}`);
            console.log('');
        }
        
        // Get products by occasion
        console.log('🎯 PRODUCTOS POR OCASIÓN:');
        console.log('=' .repeat(50));
        
        const occasions = ['amor', 'birthday', 'anniversary', 'graduation', 'friendship', 'condolencia', 'mother', 'yellow_flower'];
        
        for (const occasion of occasions) {
            const count = await Product.count({ where: { occasion, active: true } });
            const occasionName = {
                'amor': 'Amor',
                'birthday': 'Cumpleaños', 
                'anniversary': 'Aniversario',
                'graduation': 'Graduación',
                'friendship': 'Día de la Amistad',
                'condolencia': 'Condolencias',
                'mother': 'Día de la Madre',
                'yellow_flower': 'Flor Amarilla'
            }[occasion];
            
            console.log(`${occasionName}: ${count} productos`);
        }
        
        console.log('\n🎉 VERIFICACIÓN COMPLETADA');
        console.log(`📊 Total categorías: ${categories.length}`);
        
        const totalProducts = await Product.count({ where: { active: true } });
        console.log(`📦 Total productos: ${totalProducts}`);
        
        console.log('\n🌐 URLs de prueba:');
        console.log('   • Homepage: http://localhost:3000');
        console.log('   • API Categorías: http://localhost:3000/api/categories');
        console.log('   • API Productos: http://localhost:3000/api/products');
        console.log('   • Admin Panel: http://localhost:3000/pages/admin.html');
        
    } catch (error) {
        console.error('❌ Error en verificación:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run the verification
verifyCategories();