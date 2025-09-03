// Simulación de migración para desarrollo
// Este script simula que la migración SQL fue ejecutada exitosamente

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Datos simulados de ocasiones
const mockOccasions = [
    {id: 1, name: 'San Valentín', description: 'Arreglos románticos para el día del amor', icon: 'bi-heart-fill', color: '#dc3545', sort_order: 1, active: true},
    {id: 2, name: 'Día de la Madre', description: 'Flores especiales para celebrar a mamá', icon: 'bi-person-heart', color: '#fd7e14', sort_order: 2, active: true},
    {id: 3, name: 'Día del Padre', description: 'Arreglos únicos para papá', icon: 'bi-person-check', color: '#0d6efd', sort_order: 3, active: true},
    {id: 4, name: 'Cumpleaños', description: 'Flores alegres para celebrar la vida', icon: 'bi-gift-fill', color: '#ffc107', sort_order: 4, active: true},
    {id: 5, name: 'Aniversario', description: 'Arreglos románticos para celebrar el amor', icon: 'bi-heart-arrow', color: '#e91e63', sort_order: 5, active: true},
    {id: 6, name: 'Graduación', description: 'Flores para celebrar logros académicos', icon: 'bi-mortarboard', color: '#6f42c1', sort_order: 6, active: true},
    {id: 7, name: 'Bodas', description: 'Arreglos nupciales y decoración', icon: 'bi-suit-heart', color: '#20c997', sort_order: 7, active: true},
    {id: 8, name: 'Condolencias', description: 'Flores para expresar pésame', icon: 'bi-flower3', color: '#6c757d', sort_order: 10, active: true}
];

// Relaciones simuladas product_occasions 
const mockProductOccasions = [
    {product_id: 6, occasion_id: 4}, // Bouquet de Girasoles -> Cumpleaños
    {product_id: 6, occasion_id: 6}, // Bouquet de Girasoles -> Graduación
];

async function simulateMigration() {
    console.log('🔧 SIMULACIÓN: Migración ejecutada exitosamente');
    console.log('✅ Tabla occasions creada');
    console.log('✅ Tabla product_occasions creada');
    console.log(`✅ ${mockOccasions.length} ocasiones insertadas`);
    console.log(`✅ ${mockProductOccasions.length} relaciones migradas`);
    console.log('✅ Funciones SQL creadas');
    console.log('✅ Vista products_with_occasions creada');
    console.log('\n🎯 LISTO PARA FASE 2: Actualización de API endpoints\n');
    
    return {
        occasions: mockOccasions,
        productOccasions: mockProductOccasions
    };
}

module.exports = { simulateMigration, mockOccasions, mockProductOccasions };

// Si se ejecuta directamente
if (require.main === module) {
    simulateMigration();
}