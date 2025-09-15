/**
 * 🌸 Script de prueba para verificar imágenes medium
 * Ejecuta queries para analizar el estado de las imágenes medium en la base de datos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMediumImages() {
  console.log('🔍 Analizando imágenes medium en FloresYa Database...\n');

  try {
    // 1. Productos con imágenes medium (detallado)
    console.log('📋 1. PRODUCTOS CON IMÁGENES MEDIUM:');
    console.log('=' .repeat(80));

    const { data: productsWithMedium, error: error1 } = await supabase
      .from('products')
      .select(`
        id,
        name,
        stock,
        featured,
        product_images!inner(
          image_index,
          url,
          is_primary
        )
      `)
      .eq('active', true)
      .eq('product_images.size', 'medium')
      .order('id', { ascending: true });

    if (error1) {
      console.error('Error:', error1);
    } else if (productsWithMedium && productsWithMedium.length > 0) {
      productsWithMedium.forEach(product => {
        console.log(`\n🌸 Producto ID: ${product.id}`);
        console.log(`   Nombre: ${product.name}`);
        console.log(`   Stock: ${product.stock} | Featured: ${product.featured ? 'Sí' : 'No'}`);
        console.log(`   Imágenes medium (${product.product_images.length}):`);
        product.product_images.forEach((img, index) => {
          console.log(`     ${index + 1}. [${img.image_index}] ${img.url} ${img.is_primary ? '⭐' : ''}`);
        });
      });

      console.log(`\n✅ Total productos con imágenes medium: ${productsWithMedium.length}`);
    } else {
      console.log('⚠️  No se encontraron productos con imágenes medium');
    }

    // 2. Contar imágenes por tipo
    console.log('\n\n📊 2. ESTADÍSTICAS DE IMÁGENES POR TAMAÑO:');
    console.log('=' .repeat(80));

    const { data: imageStats, error: error2 } = await supabase
      .from('product_images')
      .select('size')
      .order('size');

    if (error2) {
      console.error('Error:', error2);
    } else {
      const stats = imageStats.reduce((acc, img) => {
        acc[img.size] = (acc[img.size] || 0) + 1;
        return acc;
      }, {});

      Object.entries(stats).forEach(([size, count]) => {
        console.log(`   ${size.toUpperCase()}: ${count} imágenes`);
      });
    }

    // 3. Productos sin imágenes medium
    console.log('\n\n⚠️  3. PRODUCTOS SIN IMÁGENES MEDIUM:');
    console.log('=' .repeat(80));

    const { data: allProducts, error: error3 } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('active', true)
      .order('id');

    const { data: productsWithMediumIds, error: error4 } = await supabase
      .from('product_images')
      .select('product_id')
      .eq('size', 'medium');

    if (error3 || error4) {
      console.error('Error:', error3 || error4);
    } else {
      const mediumProductIds = new Set(productsWithMediumIds.map(p => p.product_id));
      const productsWithoutMedium = allProducts.filter(p => !mediumProductIds.has(p.id));

      if (productsWithoutMedium.length > 0) {
        productsWithoutMedium.forEach(product => {
          console.log(`   🔸 ID: ${product.id} | ${product.name} (Stock: ${product.stock})`);
        });
        console.log(`\n❌ Total productos SIN imágenes medium: ${productsWithoutMedium.length}`);
      } else {
        console.log('✅ Todos los productos tienen imágenes medium');
      }
    }

    // 4. Query directo para el hover effect
    console.log('\n\n🎯 4. QUERY DIRECTO PARA HOVER EFFECT:');
    console.log('=' .repeat(80));

    const { data: hoverData, error: error5 } = await supabase
      .from('product_images')
      .select('product_id, url, image_index')
      .eq('size', 'medium')
      .order('product_id')
      .order('image_index');

    if (error5) {
      console.error('Error:', error5);
    } else {
      // Agrupar por product_id
      const groupedByProduct = hoverData.reduce((acc, img) => {
        if (!acc[img.product_id]) {
          acc[img.product_id] = [];
        }
        acc[img.product_id].push(img.url);
        return acc;
      }, {});

      console.log('   Formato para data-medium-images attribute:');
      Object.entries(groupedByProduct).forEach(([productId, urls]) => {
        console.log(`   Producto ${productId}: ${JSON.stringify(urls)}`);
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }

  console.log('\n🌸 Análisis completado!');
}

// Ejecutar el test
testMediumImages();