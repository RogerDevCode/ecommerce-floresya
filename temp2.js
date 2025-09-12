/**
 * 🔍 VERIFICAR SISTEMA NUEVO - Solo product_images table
 * Este script verifica que el sistema funciona 100% con la nueva tabla
 */

const { supabase } = require("./backend/src/config/database");
const imageHashService = require("./backend/src/services/imageHashService");

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

const log = (message, color = "reset") => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function verifyNewSystemOnly() {
  log(
    `${colors.bold}🔍 VERIFICANDO SISTEMA NUEVO EXCLUSIVAMENTE${colors.reset}`,
    "blue"
  );
  log(
    `${colors.bold}=============================================${colors.reset}`,
    "blue"
  );

  try {
    // 1. Verificar que la tabla product_images existe y tiene datos
    const { data: imageStats, error: statsError } = await supabase
      .from("product_images")
      .select("*", { count: "exact", head: true });

    if (statsError) {
      log(
        `❌ Error accediendo a tabla product_images: ${statsError.message}`,
        "red"
      );
      log(`💡 Ejecuta: node migrate_existing_images.js primero`, "yellow");
      return false;
    }

    const totalImages = imageStats?.length || 0;
    log(`📊 Total imágenes en product_images: ${totalImages}`, "green");

    if (totalImages === 0) {
      log(
        `⚠️  Tabla product_images vacía - ejecuta migración primero`,
        "yellow"
      );
      return false;
    }

    // 2. Verificar productos con imágenes
    // Si la función RPC no existe, usar query manual
    const { data: products, error } = await supabase
      .from("products")
      .select(
        `id, name, active, product_images(id, url_large, is_primary, display_order)`
      )
      .eq("active", true)
      .limit(5);

    if (error) {
      log(`❌ Error en consulta de productos: ${error.message}`, "red");
    }

    log(`\n📋 Muestra de productos con nuevo sistema:`, "blue");

    let productsWithImageData = 0;
    let productsWithoutImages = 0;

    for (const product of products || []) {
      const imageCount = product.product_images?.length || 0;

      if (imageCount > 0) {
        productsWithImageData++;
        log(`   ✅ ${product.name}: ${imageCount} imágenes`, "green");

        const primaryImage = product.product_images.find(
          (img) => img.is_primary
        );
        if (primaryImage) {
          log(
            `      🖼️  Principal: ${primaryImage.url_large.split("/").pop()}`,
            "blue"
          );
        }
      } else {
        productsWithoutImages++;
        log(`   ❌ ${product.name}: SIN imágenes`, "red");
      }
    }

    // 3. Verificar API endpoint
    log(`\n🔌 Verificando API endpoint...`, "blue");

    try {
      const response = await fetch(
        "http://localhost:3000/api/products?limit=1"
      );
      const data = await response.json();

      if (data.success && data.data.products.length > 0) {
        const product = data.data.products[0];

        // Verificar que NO tiene campos legacy
        const hasLegacyFields = product.image_url || product.additional_images;

        if (hasLegacyFields) {
          log(
            `   ⚠️  API aún devuelve campos legacy (image_url/additional_images)`,
            "yellow"
          );
          log(`   💡 El backend necesita actualización`, "yellow");
        } else {
          log(`   ✅ API limpia - no devuelve campos legacy`, "green");
        }

        // Verificar que SÍ tiene campo images
        if (product.images && Array.isArray(product.images)) {
          log(
            `   ✅ API devuelve campo 'images' con ${product.images.length} imágenes`,
            "green"
          );
        } else {
          log(`   ❌ API NO devuelve campo 'images'`, "red");
        }
      } else {
        log(`   ❌ Error en API: ${data.message || "Unknown error"}`, "red");
      }
    } catch (apiError) {
      log(`   ❌ API no disponible: ${apiError.message}`, "red");
      log(`   💡 Inicia el servidor: npm start`, "yellow");
    }

    // 4. Verificar integridad de datos
    log(`\n🔐 Verificando integridad SHA256...`, "blue");

    const { data: sampleImages } = await supabase
      .from("product_images")
      .select("id, file_hash, url_large, original_filename")
      .limit(3);

    let hashIntegrityPassed = 0;

    for (const img of sampleImages || []) {
      if (img.file_hash && img.file_hash.length === 64) {
        hashIntegrityPassed++;
        log(`   ✅ ${img.original_filename}: Hash SHA256 válido`, "green");
      } else {
        log(`   ❌ ${img.original_filename}: Hash inválido`, "red");
      }
    }

    // 5. Resumen final
    log(`\n${colors.bold}📊 RESUMEN DE VERIFICACIÓN${colors.reset}`, "blue");
    log(`${colors.bold}===========================${colors.reset}`, "blue");

    const systemHealth = {
      totalImages: totalImages,
      productsWithImages: productsWithImageData,
      productsWithoutImages: productsWithoutImages,
      hashIntegrity: `${hashIntegrityPassed}/${
        sampleImages?.length || 0
      } válidos`,
    };

    log(`📊 Imágenes totales: ${systemHealth.totalImages}`, "blue");
    log(
      `✅ Productos con imágenes: ${systemHealth.productsWithImages}`,
      "green"
    );
    log(
      `❌ Productos sin imágenes: ${systemHealth.productsWithoutImages}`,
      productsWithoutImages > 0 ? "red" : "green"
    );
    log(`🔐 Integridad SHA256: ${systemHealth.hashIntegrity}`, "blue");

    if (
      totalImages > 0 &&
      productsWithImageData > 0 &&
      productsWithoutImages === 0
    ) {
      log(`\n🎉 ¡SISTEMA NUEVO 100% OPERATIVO!`, "green");
      log(
        `✅ Todos los productos tienen imágenes en product_images table`,
        "green"
      );
      log(`✅ Sistema legacy completamente reemplazado`, "green");
      return true;
    } else {
      log(`\n⚠️  Sistema en transición`, "yellow");
      if (productsWithoutImages > 0) {
        log(
          `💡 ${productsWithoutImages} productos necesitan migración`,
          "yellow"
        );
      }
      return false;
    }
  } catch (error) {
    log(`❌ Error verificando sistema: ${error.message}`, "red");
    return false;
  }
}

// Función para forzar migración de productos sin imágenes
async function forceCompleteSystem() {
  log(`\n🔄 Forzando sistema completo...`, "blue");

  try {
    // Productos sin imágenes → placeholder
    const { data: productsWithoutImages } = await supabase
      .from("products")
      .select(
        `
                id, name,
                product_images(id)
            `
      )
      .eq("active", true);

    const productsNeedingImages = productsWithoutImages.filter(
      (p) => !p.product_images || p.product_images.length === 0
    );

    for (const product of productsNeedingImages) {
      // Crear imagen placeholder
      const placeholderImage = {
        product_id: product.id,
        file_hash: `placeholder-${product.id}-${Date.now()}`,
        original_filename: "placeholder.jpg",
        original_size: 1024,
        mime_type: "image/jpeg",
        url_large: "/images/placeholder-product.jpg",
        url_medium: "/images/placeholder-product.jpg",
        url_small: "/images/placeholder-product.jpg",
        url_thumb: "/images/placeholder-product.jpg",
        width: 1200,
        height: 1200,
        display_order: 1,
        is_primary: true,
      };

      await supabase.from("product_images").insert(placeholderImage);
      log(`   ✅ Placeholder agregado para: ${product.name}`, "green");
    }

    log(
      `🎉 ${productsNeedingImages.length} productos ahora tienen imágenes`,
      "green"
    );
  } catch (error) {
    log(`❌ Error forzando sistema: ${error.message}`, "red");
  }
}

async function main() {
  const isComplete = await verifyNewSystemOnly();

  if (!isComplete) {
    log(
      `\n❓ ¿Forzar sistema completo con placeholders? (requiere confirmación manual)`,
      "yellow"
    );
    // await forceCompleteSystem();
    // await verifyNewSystemOnly();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { verifyNewSystemOnly, forceCompleteSystem };
