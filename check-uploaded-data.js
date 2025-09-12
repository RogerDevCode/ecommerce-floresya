#!/usr/bin/env node

/**
 * Script simple para verificar qué se subió a Supabase
 */

import { databaseService } from './backend/src/services/databaseService.js';

async function main() {
    try {
        console.log('🔍 Verificando datos en Supabase...');
        
        // Obtener productos
        const { data: products, error: productsError } = await databaseService.getClient()
            .from('products')
            .select('id, name')
            .order('id');
            
        if (productsError) throw productsError;
        
        console.log(`\n📦 Productos (${products.length}):`);
        products.forEach(p => console.log(`  ${p.id}: ${p.name}`));
        
        // Obtener imágenes
        const { data: images, error: imagesError } = await databaseService.getClient()
            .from('product_images')
            .select('id, product_id, file_hash, is_primary')
            .order('product_id');
            
        if (imagesError) throw imagesError;
        
        console.log(`\n🖼️ Imágenes (${images.length}):`);
        images.forEach(img => console.log(`  ${img.id}: Producto ${img.product_id} - Hash: ${img.file_hash.substring(0, 8)}... Primary: ${img.is_primary}`));
        
        // Obtener relaciones producto-ocasión
        const { data: relations, error: relationsError } = await databaseService.getClient()
            .from('product_occasions')
            .select('product_id, occasion_id')
            .order('product_id');
            
        if (relationsError) throw relationsError;
        
        console.log(`\n🔗 Relaciones Producto-Ocasión (${relations.length}):`);
        relations.forEach(rel => console.log(`  Producto ${rel.product_id} -> Ocasión ${rel.occasion_id}`));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();