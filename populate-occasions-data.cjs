/**
 * Script para poblar datos de ocasiones para todos los productos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function populateOccasionsData() {
  console.log('🌸 Poblando datos de ocasiones para productos...');

  try {
    // 1. Obtener todos los productos activos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('active', true)
      .order('id');

    if (productsError) {
      throw new Error(`Error obteniendo productos: ${productsError.message}`);
    }

    console.log(`✅ Productos encontrados: ${products?.length || 0}`);

    // 2. Obtener todas las ocasiones
    const { data: occasions, error: occasionsError } = await supabase
      .from('occasions')
      .select('id, name, slug')
      .order('id');

    if (occasionsError) {
      throw new Error(`Error obteniendo ocasiones: ${occasionsError.message}`);
    }

    console.log(`✅ Ocasiones encontradas: ${occasions?.length || 0}`);

    if (!products || !occasions) {
      throw new Error('No se encontraron productos u ocasiones');
    }

    // 3. Limpiar relaciones existentes (opcional - comentar si no quieres limpiar)
    // const { error: deleteError } = await supabase
    //   .from('product_occasions')
    //   .delete()
    //   .neq('id', 0); // Delete all

    // 4. Crear relaciones diversas para hacer el filtro más interesante
    const relations = [];

    // Estrategia: Distribuir productos entre ocasiones de manera lógica
    products.forEach((product, index) => {
      const productName = product.name.toLowerCase();

      // Todos los productos van en "Sin ocasión específica" por defecto
      relations.push({
        product_id: product.id,
        occasion_id: 1 // Sin ocasión específica
      });

      // Lógica específica por tipo de producto
      if (productName.includes('rosa') || productName.includes('ramo')) {
        // Rosas van bien para cumpleaños, aniversarios y San Valentín
        relations.push(
          { product_id: product.id, occasion_id: 2 }, // Cumpleaños
          { product_id: product.id, occasion_id: 3 }, // Aniversario
          { product_id: product.id, occasion_id: 4 }  // San Valentín
        );
      }

      if (productName.includes('orquídea') || productName.includes('bouquet')) {
        // Orquídeas para eventos más formales
        relations.push(
          { product_id: product.id, occasion_id: 3 }, // Aniversario
          { product_id: product.id, occasion_id: 7 }  // Graduación
        );
      }

      if (productName.includes('lirio') || productName.includes('gardenia')) {
        // Lirios para condolencias y eventos solemnes
        relations.push(
          { product_id: product.id, occasion_id: 8 }  // Condolencias
        );
      }

      if (productName.includes('tulipán') || productName.includes('amarillo')) {
        // Tulipanes amarillos para primavera y celebraciones alegres
        relations.push(
          { product_id: product.id, occasion_id: 2 }, // Cumpleaños
          { product_id: product.id, occasion_id: 5 }  // Día de la Madre
        );
      }

      if (productName.includes('peonía') || productName.includes('rosada')) {
        // Peonías rosadas para eventos femeninos
        relations.push(
          { product_id: product.id, occasion_id: 5 }, // Día de la Madre
          { product_id: product.id, occasion_id: 4 }  // San Valentín
        );
      }

      // Distribución adicional para tener productos en todas las ocasiones
      const occasionIndex = index % occasions.length;
      if (occasionIndex > 0) { // No duplicar "Sin ocasión específica"
        relations.push({
          product_id: product.id,
          occasion_id: occasions[occasionIndex].id
        });
      }
    });

    // 5. Insertar relaciones (con conflicto manejado)
    console.log(`📝 Insertando ${relations.length} relaciones...`);

    const { data: insertResult, error: insertError } = await supabase
      .from('product_occasions')
      .upsert(relations, {
        onConflict: 'product_id,occasion_id',
        ignoreDuplicates: true
      });

    if (insertError) {
      throw new Error(`Error insertando relaciones: ${insertError.message}`);
    }

    console.log('✅ Relaciones insertadas exitosamente');

    // 6. Verificar distribución final
    console.log('\n📊 Distribución final por ocasión:');

    for (const occasion of occasions) {
      const { data: count, error: countError } = await supabase
        .from('product_occasions')
        .select('product_id', { count: 'exact' })
        .eq('occasion_id', occasion.id);

      if (!countError) {
        console.log(`   ${occasion.name}: ${count?.length || 0} productos`);
      }
    }

    console.log('\n🎯 Datos de ocasiones poblados exitosamente');
    console.log('📋 Ahora puedes probar los filtros en: http://localhost:3000');
    console.log('\n🧪 Comandos de prueba:');
    console.log('curl "http://localhost:3000/api/products?occasion=cumpleanos"');
    console.log('curl "http://localhost:3000/api/products?occasion=san-valentin"');
    console.log('curl "http://localhost:3000/api/products?occasion=dia-de-la-madre"');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

populateOccasionsData();