#!/usr/bin/env node

const { Category, Product } = require('../models');
const { sequelize } = require('../config/database');

async function seedCategories() {
    console.log('🌸 Agregando categorías específicas de FloresYa...');
    
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida.');
        
        // Insert specific categories
        const categories = [
            { name: 'Amor', description: 'Arreglos florales perfectos para expresar amor y romance', image_url: '/images/categories/amor.jpg' },
            { name: 'Cumpleaños', description: 'Hermosos ramos para celebrar cumpleaños y fechas especiales', image_url: '/images/categories/cumpleanos.jpg' },
            { name: 'Aniversario', description: 'Flores elegantes para conmemorar aniversarios y momentos importantes', image_url: '/images/categories/aniversario.jpg' },
            { name: 'Graduación', description: 'Arreglos florales para celebrar logros académicos y profesionales', image_url: '/images/categories/graduacion.jpg' },
            { name: 'Día de la Amistad', description: 'Flores especiales para demostrar amistad y cariño', image_url: '/images/categories/dia-amistad.jpg' },
            { name: 'Condolencias', description: 'Arreglos respetuosos para expresar condolencias y acompañamiento', image_url: '/images/categories/condolencias.jpg' },
            { name: 'Día de la Madre', description: 'Flores especiales para honrar y celebrar a mamá', image_url: '/images/categories/dia-madre.jpg' },
            { name: 'Flor Amarilla', description: 'Hermosas flores amarillas para alegrar cualquier ocasión', image_url: '/images/categories/flor-amarilla.jpg' }
        ];
        
        // Clear existing categories if any
        try {
            await Category.destroy({ where: {}, truncate: false });
        } catch (error) {
            console.log('ℹ️ Algunas categorías ya existen, continuando...');
        }
        
        console.log('📝 Creando categorías...');
        for (const categoryData of categories) {
            const category = await Category.create(categoryData);
            console.log(`✅ Categoría "${category.name}" creada con ID ${category.id}`);
        }
        
        // Create sample products for each category
        console.log('🛒 Agregando productos de ejemplo...');
        const sampleProducts = [
            // Amor (category_id: 1)
            { name: 'Rosas Rojas del Amor', description: 'Docena de rosas rojas perfectas para declarar tu amor', price: 35.00, category_id: 1, stock_quantity: 25, image_url: '/images/products/rosas-rojas-amor.jpg', occasion: 'amor', featured: true },
            { name: 'Bouquet Romántico', description: 'Hermoso ramo romántico con rosas y flores complementarias', price: 42.00, category_id: 1, stock_quantity: 20, image_url: '/images/products/bouquet-romantico.jpg', occasion: 'amor', featured: true },
            
            // Cumpleaños (category_id: 2)  
            { name: 'Ramo Cumpleañero', description: 'Colorido ramo de flores mixtas perfecto para cumpleaños', price: 28.00, category_id: 2, stock_quantity: 30, image_url: '/images/products/ramo-cumpleanos.jpg', occasion: 'birthday', featured: true },
            { name: 'Arreglo Festivo', description: 'Alegre arreglo floral para celebrar el día especial', price: 38.00, category_id: 2, stock_quantity: 25, image_url: '/images/products/arreglo-festivo.jpg', occasion: 'birthday', featured: false },
            
            // Aniversario (category_id: 3)
            { name: 'Elegancia Aniversario', description: 'Sofisticado arreglo para celebrar aniversarios importantes', price: 55.00, category_id: 3, stock_quantity: 15, image_url: '/images/products/elegancia-aniversario.jpg', occasion: 'anniversary', featured: true },
            { name: 'Rosas Blancas Aniversario', description: 'Clásicas rosas blancas simbolizando amor duradero', price: 45.00, category_id: 3, stock_quantity: 20, image_url: '/images/products/rosas-blancas-aniversario.jpg', occasion: 'anniversary', featured: false },
            
            // Graduación (category_id: 4)
            { name: 'Orgullo de Graduación', description: 'Arreglo especial para celebrar logros académicos', price: 32.00, category_id: 4, stock_quantity: 20, image_url: '/images/products/orgullo-graduacion.jpg', occasion: 'graduation', featured: true },
            { name: 'Éxito Floral', description: 'Bouquet que celebra el éxito y los nuevos comienzos', price: 40.00, category_id: 4, stock_quantity: 15, image_url: '/images/products/exito-floral.jpg', occasion: 'graduation', featured: false },
            
            // Día de la Amistad (category_id: 5)
            { name: 'Amistad Eterna', description: 'Flores que simbolizan la amistad verdadera y duradera', price: 25.00, category_id: 5, stock_quantity: 35, image_url: '/images/products/amistad-eterna.jpg', occasion: 'friendship', featured: true },
            { name: 'Colores de Amistad', description: 'Vibrante mezcla de colores para celebrar la amistad', price: 30.00, category_id: 5, stock_quantity: 25, image_url: '/images/products/colores-amistad.jpg', occasion: 'friendship', featured: false },
            
            // Condolencias (category_id: 6)
            { name: 'Paz Eterna', description: 'Respetuoso arreglo blanco para expresar condolencias', price: 65.00, category_id: 6, stock_quantity: 10, image_url: '/images/products/paz-eterna.jpg', occasion: 'condolencia', featured: false },
            { name: 'Memoria Floral', description: 'Elegante corona para honrar la memoria del ser querido', price: 75.00, category_id: 6, stock_quantity: 8, image_url: '/images/products/memoria-floral.jpg', occasion: 'condolencia', featured: false },
            
            // Día de la Madre (category_id: 7)
            { name: 'Amor de Madre', description: 'Hermoso ramo especialmente diseñado para mamá', price: 48.00, category_id: 7, stock_quantity: 30, image_url: '/images/products/amor-madre.jpg', occasion: 'mother', featured: true },
            { name: 'Ternura Maternal', description: 'Delicado arreglo en tonos suaves para el día de la madre', price: 52.00, category_id: 7, stock_quantity: 25, image_url: '/images/products/ternura-maternal.jpg', occasion: 'mother', featured: true },
            
            // Flor Amarilla (category_id: 8)
            { name: 'Alegría Amarilla', description: 'Radiantes flores amarillas que transmiten felicidad', price: 35.00, category_id: 8, stock_quantity: 40, image_url: '/images/products/alegria-amarilla.jpg', occasion: 'yellow_flower', featured: true },
            { name: 'Sol Floral', description: 'Brillante arreglo amarillo como un rayo de sol', price: 42.00, category_id: 8, stock_quantity: 30, image_url: '/images/products/sol-floral.jpg', occasion: 'yellow_flower', featured: false }
        ];
        
        // Add sample products (skip if they already exist)
        for (const productData of sampleProducts) {
            try {
                const product = await Product.create(productData);
                console.log(`✅ Producto "${product.name}" creado para categoría ${product.category_id}`);
            } catch (error) {
                console.log(`ℹ️ Producto "${productData.name}" ya existe, continuando...`);
            }
        }
        
        console.log('🎉 ¡Categorías y productos agregados exitosamente!');
        console.log('');
        console.log('📂 Categorías creadas:');
        console.log('   1. Amor - Arreglos florales para expresar amor y romance');
        console.log('   2. Cumpleaños - Flores para celebrar cumpleaños');
        console.log('   3. Aniversario - Flores elegantes para aniversarios');
        console.log('   4. Graduación - Arreglos para celebrar logros académicos');
        console.log('   5. Día de la Amistad - Flores especiales para la amistad');
        console.log('   6. Condolencias - Arreglos respetuosos para condolencias');
        console.log('   7. Día de la Madre - Flores especiales para mamá');
        console.log('   8. Flor Amarilla - Hermosas flores amarillas');
        console.log('');
        console.log(`🛒 ${sampleProducts.length} productos de ejemplo agregados`);
        
    } catch (error) {
        console.error('❌ Error agregando las categorías:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run the script
seedCategories();