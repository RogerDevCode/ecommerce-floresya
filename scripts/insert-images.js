/**
 * 🖼️ FloresYa - Relacionador de Imágenes con Productos
 * 
 * Este script automatiza la relación de imágenes almacenadas en Supabase Storage
 * con productos en la base de datos. El proceso incluye:
 * 
 * 1. Limpieza de relaciones existentes (opcional)
 * 2. Obtención de productos activos desde la tabla 'products'
 * 3. Exploración de imágenes en todos los tamaños (large, medium, small, thumb) 
 *    en el bucket 'product-images' de Supabase Storage
 * 4. Agrupación de imágenes por ID de producto basado en el nombre de archivo
 * 5. Asignación equilibrada de imágenes a productos
 * 6. Inserción de relaciones en la tabla 'product_images'
 * 
 * Características:
 * - Distribución aleatoria de imágenes
 * - Asignación de imagen primaria (primera imagen por producto)
 * - Inserción en lotes para mejor rendimiento
 * - Manejo de errores robusto
 * - Soporte para múltiples formatos de imagen
 * 
 * Columnas utilizadas en 'product_images':
 * - product_id: ID del producto
 * - url: URL completa de la imagen
 * - size: Tamaño de la imagen (large, medium, small, thumb)
 * - image_index: Índice de orden de la imagen para el producto
 * - is_primary: Indicador de imagen primaria
 * - file_hash: Hash único del archivo
 * - mime_type: Tipo MIME de la imagen
 * - created_at: Fecha de creación del registro
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Función para mezclar aleatoriamente un array (Fisher-Yates shuffle)
 */
function shuffleArray(array) {
  const shuffled = [...array]; // Copia el array para no modificar el original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Función para extraer el hash de archivo de una URL
 */
function extractFileHash(url) {
  const fileName = url.split('/').pop();
  if (!fileName) return null;
  return fileName.split('_').slice(3).join('_').split('.')[0]; // Quitar extensión
}

/**
 * Función para obtener la extensión del archivo
 */
function getFileExtension(url) {
  const fileName = url.split('/').pop();
  if (!fileName) return 'webp';
  return fileName.split('.').pop() || 'webp';
}

/**
 * Función principal para relacionar imágenes con productos
 */
async function assignImagesToProducts() {
  console.log('🚀 Starting image assignment process...');

  try {
    // 1. Limpiar relaciones existentes (opcional - descomentar si se desea limpiar antes)
    console.log('🧹 Clearing existing product image relationships...');
    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .gt('id', 0); // Elimina todos los registros

    if (deleteError) {
      console.warn(`⚠️ Warning: Error clearing existing images: ${deleteError.message}`);
    } else {
      console.log('✅ Existing product image relationships cleared');
    }

    // 2. Obtener productos activos
    console.log('📦 Fetching products...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .order('id');

    if (productError) {
      throw new Error(`Error fetching products: ${productError.message}`);
    }

    if (!products || products.length === 0) {
      console.log('❌ No products found. Exiting.');
      return;
    }

    console.log(`✅ Found ${products.length} products`);

    // 3. Obtener todas las imágenes del storage en todos los tamaños
    console.log('🖼️ Fetching image files from storage...');
    const allImages = await getAllImagesFromStorage();

    if (!allImages || allImages.length === 0) {
      console.log('❌ No images found in storage. Exiting.');
      return;
    }

    console.log(`✅ Found ${allImages.length} images in storage`);

    // 4. Organizar imágenes por producto basado en el nombre del archivo
    const imageGroups = groupImagesByProduct(allImages);

    // 5. Relacionar imágenes con productos
    console.log('🔗 Assigning images to products...');
    await assignImagesToProductsInBatches(imageGroups, products);

    console.log('✅ Image assignment completed successfully!');

  } catch (error) {
    console.error('❌ Error during image assignment:', error.message);
    throw error;
  }
}

/**
 * Función para obtener imágenes de todos los tamaños del storage
 */
async function getAllImagesFromStorage() {
  const imageGroups = {};
  const sizes = ['large', 'medium', 'small', 'thumb'];

  for (const size of sizes) {
    try {
      const { data, error } = await supabase
        .storage
        .from('product-images')
        .list(size, { limit: 1000 }); // Listar con límite alto

      if (error) {
        console.warn(`⚠️ Error listing images in ${size} directory: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        data.forEach(file => {
          // Extraer el ID del producto del nombre de archivo
          const match = file.name.match(/^product_(\d+)_/);
          if (match) {
            const productId = match[1];
            const key = `${productId}_${file.name}`;
            
            if (!imageGroups[key]) {
              imageGroups[key] = {
                productId: parseInt(productId),
                fileName: file.name,
                size: size
              };
            }
          }
        });
      }
    } catch (error) {
      console.warn(`⚠️ Error listing images in ${size} directory:`, error.message);
    }
  }

  // Convertimos el objeto a array y organizamos las imágenes por producto
  const allImageFiles = Object.values(imageGroups);
  return allImageFiles;
}

/**
 * Agrupa imágenes por producto ID y crea URLs completas
 */
function groupImagesByProduct(imageFiles) {
  const grouped = {};

  imageFiles.forEach(file => {
    const productId = file.productId;
    
    if (!grouped[productId]) {
      grouped[productId] = {
        productId: productId,
        images: {}
      };
    }

    // Crear la URL completa para esta imagen
    const fullUrl = `${file.size}/${file.fileName}`;
    grouped[productId].images[file.size] = fullUrl;
  });

  return Object.values(grouped);
}

/**
 * Asigna imágenes a productos y las inserta en lotes
 */
async function assignImagesToProductsInBatches(imageGroups, products) {
  // Mezclar aleatoriamente las imágenes para una distribución más equilibrada
  const shuffledImageGroups = shuffleArray(imageGroups);
  
  // Crear array de relaciones de producto-imagen
  const imageRecords = [];
  
  // Asociar imágenes con productos
  for (let i = 0; i < shuffledImageGroups.length && i < products.length; i++) {
    const product = products[i];
    const imageGroup = shuffledImageGroups[i];
    
    // Verificar que ambos existen
    if (product && imageGroup && imageGroup.images) {
      // Verificar si hay al menos una imagen en alguna de las variantes
      const availableSizes = ['large', 'medium', 'small', 'thumb'].filter(size => imageGroup.images[size]);
      
      // Si hay imágenes disponibles para este producto
      if (availableSizes.length > 0) {
        // Para cada tamaño disponible, crear un registro
        availableSizes.forEach((size, index) => {
          const imageUrl = imageGroup.images[size];
          const fileHash = extractFileHash(imageUrl);
          const extension = getFileExtension(imageUrl);
          const mimeType = `image/${extension === 'webp' ? 'webp' : extension === 'jpg' || extension === 'jpeg' ? 'jpeg' : 'png'}`;
          
          imageRecords.push({
            product_id: product.id,
            url: imageUrl,
            size: size,
            image_index: index + 1,
            is_primary: index === 0, // La primera imagen es la primaria
            file_hash: fileHash || `hash_${Date.now()}_${Math.random()}`,
            mime_type: mimeType,
            created_at: new Date().toISOString()
          });
        });
      }
    }
  }

  // Si hay más productos que grupos de imágenes, repetir las imágenes existentes
  if (products.length > shuffledImageGroups.length) {
    console.log(`ℹ️ Distributing ${shuffledImageGroups.length} image sets among ${products.length} products...`);
    
    for (let i = shuffledImageGroups.length; i < products.length; i++) {
      const product = products[i];
      // Usar imágenes de uno de los grupos anteriores (distribución cíclica)
      const imageGroupIndex = i % shuffledImageGroups.length;
      const imageGroup = shuffledImageGroups[imageGroupIndex];
      
      if (product && imageGroup && imageGroup.images) {
        const availableSizes = ['large', 'medium', 'small', 'thumb'].filter(size => imageGroup.images[size]);
        
        if (availableSizes.length > 0) {
          availableSizes.forEach((size, index) => {
            const imageUrl = imageGroup.images[size];
            const fileHash = extractFileHash(imageUrl);
            const extension = getFileExtension(imageUrl);
            const mimeType = `image/${extension === 'webp' ? 'webp' : extension === 'jpg' || extension === 'jpeg' ? 'jpeg' : 'png'}`;
            
            imageRecords.push({
              product_id: product.id,
              url: imageUrl,
              size: size,
              image_index: index + 1,
              is_primary: index === 0, // La primera imagen es la primaria
              file_hash: fileHash || `hash_${Date.now()}_${Math.random()}`,
              mime_type: mimeType,
              created_at: new Date().toISOString()
            });
          });
        }
      }
    }
  }

  // Insertar en lotes para mejorar rendimiento
  if (imageRecords.length > 0) {
    console.log(`📊 Inserting ${imageRecords.length} image records...`);
    
    const batchSize = 100; // Tamaño del lote
    for (let i = 0; i < imageRecords.length; i += batchSize) {
      const batch = imageRecords.slice(i, i + batchSize);
      
      try {
        const { error } = await supabase
          .from('product_images')
          .insert(batch, { ignoreDuplicates: true });

        if (error) {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        } else {
          console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(imageRecords.length / batchSize)} completed`);
        }
      } catch (batchError) {
        console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, batchError.message);
      }
    }
  } else {
    console.log('ℹ️ No image records to insert');
  }
}

/**
 * Función alternativa: Asignar imágenes específicas a productos específicos si conoces el mapeo exacto
 */
async function assignSpecificImagesToProducts(mapping) {
  // mapping debe ser un array de objetos con formato:
  // { productId: number, imageFile: string, size: string, display_order: number, is_primary: boolean }
  
  const imageRecords = mapping.map(item => ({
    product_id: item.productId,
    url: `${item.size}/${item.imageFile}`,
    size: item.size,
    image_index: item.image_index,
    is_primary: item.is_primary,
    file_hash: extractFileHash(`${item.size}/${item.imageFile}`),
    mime_type: `image/${getFileExtension(item.imageFile)}`,
    created_at: new Date().toISOString()
  }));

  if (imageRecords.length > 0) {
    const { error } = await supabase
      .from('product_images')
      .insert(imageRecords, { ignoreDuplicates: true });

    if (error) {
      console.error('Error inserting specific image mappings:', error.message);
      throw error;
    }
  }
}

// Ejecutar la función
assignImagesToProducts()
  .then(() => console.log('🎉 Image assignment process completed successfully!'))
  .catch(err => {
    console.error('💥 Error during the image assignment process:', err.message);
    process.exit(1);
  });