#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

async function updateCategories() {
    console.log('🌸 Actualizando categorías de FloresYa...');
    
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida.');
        
        // Clear existing data (respecting foreign key constraints)
        console.log('🗑️ Eliminando datos existentes...');
        await sequelize.query('DELETE FROM products');
        await sequelize.query('DELETE FROM categories');
        
        // Insert new categories
        console.log('📝 Insertando nuevas categorías...');
        const categories = [
            ['Amor', 'Arreglos florales perfectos para expresar amor y romance', '/images/categories/amor.jpg'],
            ['Cumpleaños', 'Hermosos ramos para celebrar cumpleaños y fechas especiales', '/images/categories/cumpleanos.jpg'],
            ['Aniversario', 'Flores elegantes para conmemorar aniversarios y momentos importantes', '/images/categories/aniversario.jpg'],
            ['Graduación', 'Arreglos florales para celebrar logros académicos y profesionales', '/images/categories/graduacion.jpg'],
            ['Día de la Amistad', 'Flores especiales para demostrar amistad y cariño', '/images/categories/dia-amistad.jpg'],
            ['Condolencias', 'Arreglos respetuosos para expresar condolencias y acompañamiento', '/images/categories/condolencias.jpg'],
            ['Día de la Madre', 'Flores especiales para honrar y celebrar a mamá', '/images/categories/dia-madre.jpg'],
            ['Flor Amarilla', 'Hermosas flores amarillas para alegrar cualquier ocasión', '/images/categories/flor-amarilla.jpg']
        ];
        
        for (const [name, description, image_url] of categories) {
            await sequelize.query(`
                INSERT INTO categories (name, description, image_url, active, created_at, updated_at) 
                VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, {
                replacements: [name, description, image_url]
            });
            console.log(`✅ Categoría "${name}" creada`);
        }
        
        // Skip updating existing products since we deleted them
        console.log('🔄 Los productos antiguos fueron eliminados, creando nuevos...');
        
        // Add sample products for each category
        console.log('🛒 Agregando productos de ejemplo...');
        const sampleProducts = [
            // Amor (category_id: 1)
            ['Rosas Rojas del Amor', 'Docena de rosas rojas perfectas para declarar tu amor', 35.00, 1, 25, '/images/products/rosas-rojas-amor.jpg', 'amor', true],
            ['Bouquet Romántico', 'Hermoso ramo romántico con rosas y flores complementarias', 42.00, 1, 20, '/images/products/bouquet-romantico.jpg', 'amor', true],
            
            // Cumpleaños (category_id: 2)
            ['Ramo Cumpleañero', 'Colorido ramo de flores mixtas perfecto para cumpleaños', 28.00, 2, 30, '/images/products/ramo-cumpleanos.jpg', 'birthday', true],
            ['Arreglo Festivo', 'Alegre arreglo floral para celebrar el día especial', 38.00, 2, 25, '/images/products/arreglo-festivo.jpg', 'birthday', false],
            
            // Aniversario (category_id: 3)
            ['Elegancia Aniversario', 'Sofisticado arreglo para celebrar aniversarios importantes', 55.00, 3, 15, '/images/products/elegancia-aniversario.jpg', 'anniversary', true],
            ['Rosas Blancas Aniversario', 'Clásicas rosas blancas simbolizando amor duradero', 45.00, 3, 20, '/images/products/rosas-blancas-aniversario.jpg', 'anniversary', false],
            
            // Graduación (category_id: 4)
            ['Orgullo de Graduación', 'Arreglo especial para celebrar logros académicos', 32.00, 4, 20, '/images/products/orgullo-graduacion.jpg', 'graduation', true],
            ['Éxito Floral', 'Bouquet que celebra el éxito y los nuevos comienzos', 40.00, 4, 15, '/images/products/exito-floral.jpg', 'graduation', false],
            
            // Día de la Amistad (category_id: 5)
            ['Amistad Eterna', 'Flores que simbolizan la amistad verdadera y duradera', 25.00, 5, 35, '/images/products/amistad-eterna.jpg', 'friendship', true],
            ['Colores de Amistad', 'Vibrante mezcla de colores para celebrar la amistad', 30.00, 5, 25, '/images/products/colores-amistad.jpg', 'friendship', false],
            
            // Condolencias (category_id: 6)
            ['Paz Eterna', 'Respetuoso arreglo blanco para expresar condolencias', 65.00, 6, 10, '/images/products/paz-eterna.jpg', 'condolencia', false],
            ['Memoria Floral', 'Elegante corona para honrar la memoria del ser querido', 75.00, 6, 8, '/images/products/memoria-floral.jpg', 'condolencia', false],
            
            // Día de la Madre (category_id: 7)
            ['Amor de Madre', 'Hermoso ramo especialmente diseñado para mamá', 48.00, 7, 30, '/images/products/amor-madre.jpg', 'mother', true],
            ['Ternura Maternal', 'Delicado arreglo en tonos suaves para el día de la madre', 52.00, 7, 25, '/images/products/ternura-maternal.jpg', 'mother', true],
            
            // Flor Amarilla (category_id: 8)
            ['Alegría Amarilla', 'Radiantes flores amarillas que transmiten felicidad', 35.00, 8, 40, '/images/products/alegria-amarilla.jpg', 'yellow_flower', true],
            ['Sol Floral', 'Brillante arreglo amarillo como un rayo de sol', 42.00, 8, 30, '/images/products/sol-floral.jpg', 'yellow_flower', false]
        ];
        
        for (const [name, description, price, category_id, stock, image_url, occasion, featured] of sampleProducts) {
            await sequelize.query(`
                INSERT INTO products (name, description, price, category_id, stock_quantity, image_url, occasion, featured, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, {
                replacements: [name, description, price, category_id, stock, image_url, occasion, featured]
            });
        }
        
        console.log(`✅ ${sampleProducts.length} productos de ejemplo agregados`)
        
        console.log('🎉 ¡Categorías actualizadas exitosamente!');
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
        console.log('🛒 Productos de ejemplo agregados para cada categoría');
        
    } catch (error) {
        console.error('❌ Error actualizando las categorías:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run the script
updateCategories();