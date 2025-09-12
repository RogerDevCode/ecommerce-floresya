#!/usr/bin/env node

/**
 * Script de prueba rápida de endpoints FloresYa
 * Prueba directamente con Supabase sin queryBuilder
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

console.log('🧪 Probando endpoints de FloresYa\n');

async function testEndpoints() {
    // Probar productos
    console.log('🌸 Probando productos...');
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .limit(3);
        
        if (error) {
            console.error('❌ Error productos:', error.message);
        } else {
            console.log(`✅ Productos: ${products.length} encontrados`);
            if (products.length > 0) {
                console.log(`   - ${products[0].name}: $${products[0].price_usd}`);
                if (products[0].image_url) {
                    console.log(`   - Imagen: ${products[0].image_url.substring(0, 60)}...`);
                }
            }
        }
    } catch (err) {
        console.error('❌ Error productos:', err.message);
    }

    console.log('');

    // Probar ocasiones
    console.log('🎯 Probando ocasiones...');
    try {
        const { data: occasions, error } = await supabase
            .from('occasions')
            .select('*')
            .limit(5);
        
        if (error) {
            console.error('❌ Error ocasiones:', error.message);
        } else {
            console.log(`✅ Ocasiones: ${occasions.length} encontradas`);
            occasions.forEach(occ => {
                console.log(`   - ${occ.name} (${occ.type})`);
            });
        }
    } catch (err) {
        console.error('❌ Error ocasiones:', err.message);
    }

    console.log('');

    // Probar métodos de pago
    console.log('💳 Probando métodos de pago...');
    try {
        const { data: payments, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('is_active', true);
        
        if (error) {
            console.error('❌ Error pagos:', error.message);
        } else {
            console.log(`✅ Métodos de pago: ${payments.length} activos`);
            payments.forEach(pm => {
                console.log(`   - ${pm.name} (${pm.type})`);
            });
        }
    } catch (err) {
        console.error('❌ Error pagos:', err.message);
    }

    console.log('');

    // Probar carrusel
    console.log('🖼️  Probando carrusel...');
    try {
        const { data: carousel, error } = await supabase
            .from('carousel_images')
            .select('*')
            .eq('is_active', true)
            .order('display_order');
        
        if (error) {
            console.error('❌ Error carrusel:', error.message);
        } else {
            console.log(`✅ Imágenes carrusel: ${carousel.length} activas`);
            carousel.forEach(img => {
                console.log(`   - ${img.title || 'Sin título'}`);
                if (img.image_url) {
                    console.log(`     URL: ${img.image_url.substring(0, 80)}...`);
                }
            });
        }
    } catch (err) {
        console.error('❌ Error carrusel:', err.message);
    }

    console.log('');

    // Probar configuraciones
    console.log('⚙️  Probando configuraciones...');
    try {
        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .eq('is_public', true)
            .limit(5);
        
        if (error) {
            console.error('❌ Error configuraciones:', error.message);
        } else {
            console.log(`✅ Configuraciones: ${settings.length} públicas`);
            settings.forEach(setting => {
                console.log(`   - ${setting.key}: ${setting.value}`);
            });
        }
    } catch (err) {
        console.error('❌ Error configuraciones:', err.message);
    }

    console.log('\n🎉 Prueba de endpoints completada!');
}

testEndpoints().catch(console.error);