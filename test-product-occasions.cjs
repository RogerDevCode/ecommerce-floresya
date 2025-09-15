/**
 * Test script para verificar el estado de product_occasions en Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testProductOccasions() {
  console.log('🔍 Verificando estado de product_occasions...');

  try {
    // 1. Verificar si existe la tabla product_occasions
    console.log('\n1. Verificando tabla product_occasions...');
    const { data: productOccasions, error: poError } = await supabase
      .from('product_occasions')
      .select('*')
      .limit(5);

    if (poError) {
      console.log('❌ Tabla product_occasions no existe:', poError.message);
      console.log('📝 Necesitas ejecutar el script SQL optimize-occasions-db.sql en Supabase');
    } else {
      console.log('✅ Tabla product_occasions existe');
      console.log(`📊 Relaciones encontradas: ${productOccasions?.length || 0}`);
      if (productOccasions?.length > 0) {
        console.log('📋 Primeras relaciones:', productOccasions);
      }
    }

    // 2. Verificar ocasiones disponibles
    console.log('\n2. Verificando ocasiones disponibles...');
    const { data: occasions, error: occasionsError } = await supabase
      .from('occasions')
      .select('id, name, slug')
      .order('display_order');

    if (occasionsError) {
      console.log('❌ Error obteniendo ocasiones:', occasionsError.message);
    } else {
      console.log('✅ Ocasiones disponibles:');
      occasions?.forEach(occasion => {
        console.log(`   - ${occasion.id}: ${occasion.name} (${occasion.slug})`);
      });
    }

    // 3. Verificar productos activos
    console.log('\n3. Verificando productos activos...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('active', true)
      .limit(5);

    if (productsError) {
      console.log('❌ Error obteniendo productos:', productsError.message);
    } else {
      console.log(`✅ Productos activos encontrados: ${products?.length || 0}`);
      if (products?.length > 0) {
        console.log('📋 Primeros productos:', products);
      }
    }

    // 4. Crear algunas relaciones de prueba si la tabla existe
    if (!poError && productOccasions !== null) {
      console.log('\n4. Creando relaciones de prueba...');

      if (products && products.length > 0 && occasions && occasions.length > 0) {
        // Asignar los primeros 3 productos a "Sin ocasión específica" (ID 1)
        const testRelations = products.slice(0, 3).map(product => ({
          product_id: product.id,
          occasion_id: 1 // Sin ocasión específica
        }));

        const { data: insertResult, error: insertError } = await supabase
          .from('product_occasions')
          .upsert(testRelations, { onConflict: 'product_id,occasion_id' });

        if (insertError) {
          console.log('⚠️  Error insertando relaciones de prueba:', insertError.message);
        } else {
          console.log('✅ Relaciones de prueba creadas');
          console.log('📊 Insertadas:', testRelations.length, 'relaciones');
        }

        // Asignar el primer producto también a "Cumpleaños" (ID 2) si existe
        if (occasions.find(o => o.id === 2)) {
          const birthdayRelation = {
            product_id: products[0].id,
            occasion_id: 2
          };

          const { error: birthdayError } = await supabase
            .from('product_occasions')
            .upsert([birthdayRelation], { onConflict: 'product_id,occasion_id' });

          if (!birthdayError) {
            console.log('✅ Relación de cumpleaños creada para prueba');
          }
        }
      }
    }

    console.log('\n🎯 Prueba completada');
    console.log('\n📋 Para continuar:');
    console.log('1. Si la tabla no existe, ejecuta optimize-occasions-db.sql en Supabase');
    console.log('2. Luego ejecuta este script nuevamente para crear datos de prueba');
    console.log('3. Prueba los filtros en: http://localhost:3000');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testProductOccasions();