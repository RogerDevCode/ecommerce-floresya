/**
 * 🌸 FLORESYA TEST DATA INSERTION SCRIPT
 * Inserta datos de prueba que coincidan con las expectativas de los tests
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestData() {
  try {
    console.log('🌸 Insertando datos de prueba en la base de datos...');

    // Insertar productos de prueba activos
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .upsert([
        {
          name: 'Ramo de Rosas Rojas',
          description: 'Hermoso ramo de 12 rosas rojas frescas, perfectas para expresar amor y pasión. Incluye follaje decorativo y una tarjeta personalizada.',
          summary: 'Ramo de 12 rosas rojas con follaje',
          price_usd: 25.99,
          price_ves: 950000.00,
          stock: 50,
          sku: 'ROSAS-ROJAS-12',
          active: true,
          featured: true,
          carousel_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'Arreglo Elegante Mixto',
          description: 'Elegante arreglo floral mixto con rosas, lirios y margaritas en tonos pasteles. Ideal para cualquier ocasión especial.',
          summary: 'Arreglo mixto con rosas y lirios',
          price_usd: 45.50,
          price_ves: 1650000.00,
          stock: 30,
          sku: 'ARREGLO-MIXTO-ELEG',
          active: true,
          featured: true,
          carousel_order: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'Bouquet de Cumpleaños',
          description: 'Colorido bouquet especialmente diseñado para cumpleaños, con rosas, gerberas y globos. ¡Celebra con flores!',
          summary: 'Bouquet especial para cumpleaños',
          price_usd: 35.75,
          price_ves: 1300000.00,
          stock: 25,
          sku: 'BOUQUET-CUMPLE',
          active: true,
          featured: false,
          carousel_order: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'sku' });

    if (productsError) {
      console.error('❌ Error insertando productos:', productsError);
      return;
    }

    console.log('✅ Productos insertados:', productsData?.length || 0);

    // Obtener IDs de productos insertados
    const { data: products, error: getProductsError } = await supabase
      .from('products')
      .select('id, sku')
      .in('sku', ['ROSAS-ROJAS-12', 'ARREGLO-MIXTO-ELEG', 'BOUQUET-CUMPLE']);

    if (getProductsError) {
      console.error('❌ Error obteniendo productos:', getProductsError);
      return;
    }

    const productMap = {};
    products?.forEach(p => {
      productMap[p.sku] = p.id;
    });

    // Insertar imágenes de productos de prueba
    const imagesToInsert = [];

    // Solo insertar imágenes si los productos existen
    if (productMap['ROSAS-ROJAS-12']) {
      imagesToInsert.push(
        // Imágenes para Ramo de Rosas Rojas
        {
          product_id: productMap['ROSAS-ROJAS-12'],
          url: '/images/products/ramo-rosas-rojas.jpg',
          size: 'thumb',
          image_index: 0,
          is_primary: true,
          mime_type: 'image/jpeg',
          file_hash: 'hash1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          product_id: productMap['ROSAS-ROJAS-12'],
          url: '/images/products/ramo-rosas-rojas-2.jpg',
          size: 'small',
          image_index: 1,
          is_primary: false,
          mime_type: 'image/jpeg',
          file_hash: 'hash2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          product_id: productMap['ROSAS-ROJAS-12'],
          url: '/images/products/ramo-rosas-rojas-3.jpg',
          size: 'medium',
          image_index: 2,
          is_primary: false,
          mime_type: 'image/jpeg',
          file_hash: 'hash3',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
    }

    if (productMap['ARREGLO-MIXTO-ELEG']) {
      imagesToInsert.push(
        // Imágenes para Arreglo Elegante Mixto
        {
          product_id: productMap['ARREGLO-MIXTO-ELEG'],
          url: '/images/products/arreglo-elegante.jpg',
          size: 'thumb',
          image_index: 0,
          is_primary: true,
          mime_type: 'image/jpeg',
          file_hash: 'hash4',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          product_id: productMap['ARREGLO-MIXTO-ELEG'],
          url: '/images/products/arreglo-elegante-2.jpg',
          size: 'small',
          image_index: 1,
          is_primary: false,
          mime_type: 'image/jpeg',
          file_hash: 'hash5',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          product_id: productMap['ARREGLO-MIXTO-ELEG'],
          url: '/images/products/arreglo-elegante-3.jpg',
          size: 'medium',
          image_index: 2,
          is_primary: false,
          mime_type: 'image/jpeg',
          file_hash: 'hash6',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
    }

    if (productMap['BOUQUET-CUMPLE']) {
      imagesToInsert.push(
        // Imágenes para Bouquet de Cumpleaños
        {
          product_id: productMap['BOUQUET-CUMPLE'],
          url: '/images/products/bouquet-mixto.jpg',
          size: 'thumb',
          image_index: 0,
          is_primary: true,
          mime_type: 'image/jpeg',
          file_hash: 'hash7',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          product_id: productMap['BOUQUET-CUMPLE'],
          url: '/images/products/bouquet-mixto-2.jpg',
          size: 'small',
          image_index: 1,
          is_primary: false,
          mime_type: 'image/jpeg',
          file_hash: 'hash8',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          product_id: productMap['BOUQUET-CUMPLE'],
          url: '/images/products/bouquet-mixto-3.jpg',
          size: 'medium',
          image_index: 2,
          is_primary: false,
          mime_type: 'image/jpeg',
          file_hash: 'hash9',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
    }

    if (imagesToInsert.length > 0) {
      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .upsert(imagesToInsert, { onConflict: 'product_id,image_index,size' });

      if (imagesError) {
        console.error('❌ Error insertando imágenes:', imagesError);
        return;
      }

      console.log('✅ Imágenes insertadas:', imagesData?.length || 0);
    } else {
      console.log('⚠️ No se insertaron imágenes - productos no encontrados');
    }

    // Insertar ocasiones de prueba
    const { data: occasionsData, error: occasionsError } = await supabase
      .from('occasions')
      .upsert([
        {
          name: 'Cumpleaños',
          type: 'birthday',
          description: 'Celebración de cumpleaños con flores',
          slug: 'cumpleanos',
          is_active: true,
          display_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'Sin ocasión específica',
          type: 'general',
          description: 'Para cualquier momento del año',
          slug: 'general',
          is_active: true,
          display_order: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          name: 'Aniversario',
          type: 'anniversary',
          description: 'Conmemoración de aniversarios',
          slug: 'aniversario',
          is_active: true,
          display_order: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'slug' });

    if (occasionsError) {
      console.error('❌ Error insertando ocasiones:', occasionsError);
      return;
    }

    console.log('✅ Ocasiones insertadas:', occasionsData?.length || 0);

    // Obtener IDs de ocasiones
    const { data: occasions, error: getOccasionsError } = await supabase
      .from('occasions')
      .select('id, type')
      .in('type', ['birthday', 'general', 'anniversary']);

    if (getOccasionsError) {
      console.error('❌ Error obteniendo ocasiones:', getOccasionsError);
      return;
    }

    const occasionMap = {};
    occasions?.forEach(o => {
      occasionMap[o.type] = o.id;
    });

    // Asociar productos con ocasiones
    const { data: associationsData, error: associationsError } = await supabase
      .from('product_occasions')
      .upsert([
        {
          product_id: productMap['BOUQUET-CUMPLE'],
          occasion_id: occasionMap['birthday'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'product_id,occasion_id' });

    if (associationsError) {
      console.error('❌ Error insertando asociaciones producto-ocasión:', associationsError);
      return;
    }

    console.log('✅ Asociaciones producto-ocasión insertadas:', associationsData?.length || 0);

    // Insertar usuarios de prueba
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .upsert([
        {
          email: 'test@example.com',
          password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu',
          full_name: 'Usuario de Prueba',
          role: 'user',
          is_active: true,
          email_verified: true,
          phone: '+1234567890',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          email: 'admin@test.com',
          password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLfOJy0oCGG.imu',
          full_name: 'Administrador de Prueba',
          role: 'admin',
          is_active: true,
          email_verified: true,
          phone: '+1234567891',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'email' });

    if (usersError) {
      console.error('❌ Error insertando usuarios:', usersError);
      return;
    }

    console.log('✅ Usuarios insertados:', usersData?.length || 0);

    // Verificar datos insertados
    const { data: productsCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('active', true);

    const { data: imagesCount } = await supabase
      .from('product_images')
      .select('id', { count: 'exact', head: true });

    const { data: occasionsCount } = await supabase
      .from('occasions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: usersCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    console.log('\n📊 Resumen de datos insertados:');
    console.log(`✅ Productos activos: ${productsCount?.length || 0}`);
    console.log(`✅ Imágenes: ${imagesCount?.length || 0}`);
    console.log(`✅ Ocasiones activas: ${occasionsCount?.length || 0}`);
    console.log(`✅ Usuarios activos: ${usersCount?.length || 0}`);

    console.log('\n🎉 ¡Datos de prueba insertados exitosamente!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
insertTestData();