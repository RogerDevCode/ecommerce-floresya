/**
 * 🌸 FloresYa Product Images Population Script
 * Recreates product-images table by randomly assigning existing images from Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Image size configuration
const IMAGE_SIZES = ['thumb', 'small', 'medium', 'large'];
const BUCKET_NAME = 'product-images';
const BASE_URL = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}`;

/**
 * Parse filename to extract metadata
 * Format: product_ID_SEC_HASH.webp
 * Example: product_1_1_17e2d03c735674d8fd1770a7f042573f6ca5a4bf25d1bad7bfa76b72c9033881.webp
 */
function parseImageFilename(filename) {
  const match = filename.match(/^product_(\d+)_(\d+)_([a-f0-9]{64})\.webp$/);
  if (!match) {
    return null;
  }

  const [, originalProductId, secValue, hash] = match;
  return {
    originalProductId: parseInt(originalProductId),
    secValue: parseInt(secValue),
    hash,
    filename
  };
}

/**
 * Read all images from Supabase Storage and organize by SEC value
 */
async function loadImagesFromStorage() {
  console.log('📂 Cargando imágenes desde Supabase Storage...');

  const imageGroups = new Map(); // SEC value -> { thumb, small, medium, large }

  try {
    // Get images from each size folder
    for (const size of IMAGE_SIZES) {
      console.log(`   📁 Leyendo carpeta: ${size}/`);

      const { data: files, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .list(size, { limit: 1000 });

      if (error) {
        console.error(`❌ Error leyendo carpeta ${size}:`, error);
        continue;
      }

      console.log(`   📋 Encontrados ${files?.length || 0} archivos en ${size}/`);

      if (files) {
        for (const file of files) {
          const parsed = parseImageFilename(file.name);
          if (parsed) {
            const { secValue } = parsed;

            if (!imageGroups.has(secValue)) {
              imageGroups.set(secValue, {});
            }

            imageGroups.get(secValue)[size] = {
              filename: file.name,
              url: `${BASE_URL}/${size}/${file.name}`,
              hash: parsed.hash,
              size: file.metadata?.size || null
            };
          } else {
            console.warn(`⚠️ Nombre de archivo no reconocido: ${file.name}`);
          }
        }
      }
    }

    console.log(`✅ Encontrados ${imageGroups.size} grupos de imágenes únicos`);

    // Validate groups (should have all 4 sizes)
    const completeGroups = [];
    const incompleteGroups = [];

    for (const [secValue, group] of imageGroups.entries()) {
      const hasAllSizes = IMAGE_SIZES.every(size => group[size]);
      if (hasAllSizes) {
        completeGroups.push({ secValue, images: group });
      } else {
        incompleteGroups.push({ secValue, images: group });
        console.warn(`⚠️ Grupo SEC ${secValue} incompleto - faltan: ${IMAGE_SIZES.filter(size => !group[size]).join(', ')}`);
      }
    }

    console.log(`✅ ${completeGroups.length} grupos completos (4 tamaños)`);
    console.log(`⚠️ ${incompleteGroups.length} grupos incompletos`);

    return completeGroups;

  } catch (error) {
    console.error('💥 Error cargando imágenes desde Storage:', error);
    throw error;
  }
}

/**
 * Get all products from database
 */
async function getProducts() {
  console.log('🌸 Obteniendo productos de la base de datos...');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, active')
    .eq('active', true)
    .order('id');

  if (error) {
    console.error('❌ Error obteniendo productos:', error);
    throw error;
  }

  console.log(`✅ Encontrados ${products.length} productos activos`);
  return products;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate file hash for database storage
 */
function generateFileHash(secValue, size, filename) {
  const content = `${secValue}_${size}_${filename}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Clear existing product images
 */
async function clearExistingImages() {
  console.log('🗑️ Eliminando imágenes existentes de product_images...');

  const { error } = await supabase
    .from('product_images')
    .delete()
    .neq('id', 0); // Delete all records

  if (error) {
    console.error('❌ Error eliminando imágenes existentes:', error);
    throw error;
  }

  console.log('✅ Imágenes existentes eliminadas');
}

/**
 * Randomly assign image groups to products
 */
async function assignImagesToProducts(products, imageGroups) {
  console.log('🎲 Asignando grupos de imágenes aleatoriamente a productos...');

  if (imageGroups.length === 0) {
    console.warn('⚠️ No hay grupos de imágenes disponibles');
    return;
  }

  // Clear existing images first
  await clearExistingImages();

  // Shuffle both arrays for randomness
  const shuffledProducts = shuffleArray(products);
  const shuffledImageGroups = shuffleArray(imageGroups);

  const productImages = [];
  let imageGroupIndex = 0;

  for (let productIndex = 0; productIndex < shuffledProducts.length; productIndex++) {
    const product = shuffledProducts[productIndex];
    const imageGroup = shuffledImageGroups[imageGroupIndex % shuffledImageGroups.length];

    console.log(`   🔗 Asignando SEC ${imageGroup.secValue} al producto ${product.sku} (${product.name})`);

    // Create records for all 4 sizes (image_index starts from 1, not 0)
    IMAGE_SIZES.forEach((size, index) => {
      const imageData = imageGroup.images[size];
      if (imageData) {
        productImages.push({
          product_id: product.id,
          url: imageData.url,
          size: size,
          image_index: index + 1, // Database constraint requires image_index >= 1
          is_primary: size === 'thumb', // Thumb is primary for listings
          mime_type: 'image/webp',
          file_hash: generateFileHash(imageGroup.secValue, size, imageData.filename),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });

    imageGroupIndex++;
  }

  console.log(`📝 Preparadas ${productImages.length} entradas de imágenes`);

  // Insert in batches to avoid timeout
  const BATCH_SIZE = 20;
  let insertedCount = 0;

  for (let i = 0; i < productImages.length; i += BATCH_SIZE) {
    const batch = productImages.slice(i, i + BATCH_SIZE);

    console.log(`   📤 Insertando lote ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} imágenes)...`);

    const { data, error } = await supabase
      .from('product_images')
      .insert(batch)
      .select('id');

    if (error) {
      console.error('❌ Error insertando lote de imágenes:', error);
      console.error('   Datos del lote:', JSON.stringify(batch.slice(0, 2), null, 2)); // Show first 2 for debugging
      throw error;
    }

    insertedCount += data?.length || 0;
    console.log(`   ✅ Lote ${Math.floor(i / BATCH_SIZE) + 1} insertado (${data?.length || 0} registros)`);
  }

  console.log(`🎉 ¡${insertedCount} imágenes asignadas exitosamente!`);

  // Summary of assignments
  console.log('\n📊 Resumen de asignaciones:');
  const usedGroups = new Set();
  for (let i = 0; i < shuffledProducts.length; i++) {
    const groupIndex = i % shuffledImageGroups.length;
    const imageGroup = shuffledImageGroups[groupIndex];
    usedGroups.add(imageGroup.secValue);
  }

  console.log(`   • Productos: ${shuffledProducts.length}`);
  console.log(`   • Grupos de imágenes disponibles: ${shuffledImageGroups.length}`);
  console.log(`   • Grupos únicos utilizados: ${usedGroups.size}`);
  console.log(`   • Imágenes no utilizadas: ${shuffledImageGroups.length - usedGroups.size > 0 ? 'Sí, guardadas para uso futuro' : 'No'}`);

  return insertedCount;
}

/**
 * Validate the image assignment results
 */
async function validateImageAssignments() {
  console.log('🔍 Validando asignaciones de imágenes...');

  // Count images per product
  const { data: imageCounts, error: countError } = await supabase
    .from('product_images')
    .select(`
      product_id,
      products!inner(name, sku),
      size
    `);

  if (countError) {
    console.error('❌ Error validando imágenes:', countError);
    return;
  }

  // Group by product
  const productImageMap = new Map();
  imageCounts.forEach(img => {
    if (!productImageMap.has(img.product_id)) {
      productImageMap.set(img.product_id, {
        product: img.products,
        sizes: []
      });
    }
    productImageMap.get(img.product_id).sizes.push(img.size);
  });

  console.log('\n📋 Validación de imágenes por producto:');
  console.log('==========================================');

  let allValid = true;
  for (const [productId, data] of productImageMap.entries()) {
    const { product, sizes } = data;
    const hasFourSizes = sizes.length === 4;
    const hasAllSizes = IMAGE_SIZES.every(size => sizes.includes(size));
    const isValid = hasFourSizes && hasAllSizes;

    const status = isValid ? '✅' : '❌';
    console.log(`${status} ${product.sku.padEnd(10)} | ${product.name.substring(0, 25).padEnd(25)} | ${sizes.length} imágenes`);

    if (!isValid) {
      allValid = false;
      const missingSizes = IMAGE_SIZES.filter(size => !sizes.includes(size));
      if (missingSizes.length > 0) {
        console.log(`     ⚠️ Faltan: ${missingSizes.join(', ')}`);
      }
    }
  }

  console.log('==========================================');
  console.log(`📊 Total: ${productImageMap.size} productos con imágenes`);
  console.log(`${allValid ? '✅' : '❌'} Estado: ${allValid ? 'Todas las validaciones pasaron' : 'Hay problemas de validación'}\n`);

  return allValid;
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🌸 Iniciando recreación de tabla product-images...\n');

    // Step 1: Load images from Supabase Storage
    const imageGroups = await loadImagesFromStorage();

    if (imageGroups.length === 0) {
      throw new Error('No se encontraron grupos de imágenes completos en Storage');
    }

    // Step 2: Get products from database
    const products = await getProducts();

    if (products.length === 0) {
      throw new Error('No se encontraron productos activos en la base de datos');
    }

    // Step 3: Randomly assign image groups to products
    const insertedCount = await assignImagesToProducts(products, imageGroups);

    // Step 4: Validate assignments
    const isValid = await validateImageAssignments();

    // Final summary
    console.log('🎉 ¡Recreación de product-images completada!');
    console.log('\n📈 Resultados finales:');
    console.log(`   • Imágenes insertadas: ${insertedCount}`);
    console.log(`   • Productos con imágenes: ${products.length}`);
    console.log(`   • Grupos de imágenes disponibles: ${imageGroups.length}`);
    console.log(`   • Validación: ${isValid ? '✅ Exitosa' : '❌ Con errores'}`);
    console.log('\n🖼️ Cada producto ahora tiene 4 imágenes (thumb, small, medium, large)');
    console.log('🔄 Las imágenes se asignaron aleatoriamente manteniendo la integridad de los grupos');
    console.log('💾 Las imágenes no utilizadas permanecen en Storage para uso futuro\n');

  } catch (error) {
    console.error('💥 Error durante la recreación de imágenes:', error);
    process.exit(1);
  }
}

// Execute main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as populateProductImages };