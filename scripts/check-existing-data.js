/**
 * 🌸 FLORESYA CHECK EXISTING DATA SCRIPT
 * Verifica qué datos ya existen en la base de datos
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

async function checkExistingData() {
  try {
    console.log('🌸 Verificando datos existentes en la base de datos...');

    // Verificar productos
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);

    if (productsError) {
      console.error('❌ Error obteniendo productos:', productsError);
      return;
    }

    console.log('\n📦 PRODUCTOS ACTIVOS:');
    console.log(`Total: ${products?.length || 0}`);
    products?.forEach(p => {
      console.log(`  - ID: ${p.id}, Name: ${p.name}, SKU: ${p.sku}, Featured: ${p.featured}, Carousel: ${p.carousel_order}`);
    });

    // Verificar ocasiones
    const { data: occasions, error: occasionsError } = await supabase
      .from('occasions')
      .select('*')
      .eq('is_active', true);

    if (occasionsError) {
      console.error('❌ Error obteniendo ocasiones:', occasionsError);
      return;
    }

    console.log('\n🎉 OCASIONES ACTIVAS:');
    console.log(`Total: ${occasions?.length || 0}`);
    occasions?.forEach(o => {
      console.log(`  - ID: ${o.id}, Name: ${o.name}, Type: ${o.type}, Slug: ${o.slug}`);
    });

    // Verificar imágenes de productos
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*');

    if (imagesError) {
      console.error('❌ Error obteniendo imágenes:', imagesError);
      return;
    }

    console.log('\n🖼️ IMÁGENES DE PRODUCTOS:');
    console.log(`Total: ${images?.length || 0}`);
    images?.forEach(img => {
      console.log(`  - Product ID: ${img.product_id}, Size: ${img.size}, Index: ${img.image_index}, Primary: ${img.is_primary}, URL: ${img.url}`);
    });

    // Verificar usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true);

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    console.log('\n👥 USUARIOS ACTIVOS:');
    console.log(`Total: ${users?.length || 0}`);
    users?.forEach(u => {
      console.log(`  - ID: ${u.id}, Email: ${u.email}, Name: ${u.full_name}, Role: ${u.role}`);
    });

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
checkExistingData();