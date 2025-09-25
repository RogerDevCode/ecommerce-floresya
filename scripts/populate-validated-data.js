/**
 * 🌸 FloresYa Validated Data Population Script
 * Populates database with schema-validated test data
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

// Schema-validated test data
const testData = {
  occasions: [
    { name: 'Cumpleaños', slug: 'cumpleanos', description: 'Celebra un cumpleaños especial' },
    { name: 'Aniversario', slug: 'aniversario', description: 'Conmemora un aniversario importante' },
    { name: 'San Valentín', slug: 'san-valentin', description: 'Expresa tu amor en el día de los enamorados' },
    { name: 'Día de la Madre', slug: 'dia-de-la-madre', description: 'Honra a mamá en su día especial' },
    { name: 'Graduación', slug: 'graduacion', description: 'Felicita por un logro académico' },
    { name: 'Condolencias', slug: 'condolencias', description: 'Expresa solidaridad en momentos difíciles' },
    { name: 'Nueva Casa', slug: 'nueva-casa', description: 'Celebra un nuevo hogar' },
    { name: 'Boda', slug: 'boda', description: 'Celebra la unión matrimonial' }
  ],

  products: [
    {
      name: 'Ramo Clásico de Rosas Rojas',
      description: 'Hermoso ramo de 12 rosas rojas frescas, símbolo eterno del amor y la pasión. Incluye follaje decorativo y presentación elegante. Perfecto para San Valentín, aniversarios o para expresar sentimientos profundos.',
      summary: 'Ramo de 12 rosas rojas con follaje',
      price_usd: 35.99,
      price_ves: 1314000,
      stock: 45,
      sku: 'RRR-001',
      active: true,
      featured: true,
      carousel_order: 1
    },
    {
      name: 'Arreglo Elegante Mixto Premium',
      description: 'Exquisito arreglo floral en jarrón de cerámica con rosas rosadas, lirios blancos, alstromerias y eucalipto. Un diseño sofisticado que combina elegancia y frescura, ideal para ocasiones especiales.',
      summary: 'Arreglo mixto premium en jarrón',
      price_usd: 58.50,
      price_ves: 2135000,
      stock: 25,
      sku: 'AEM-001',
      active: true,
      featured: true,
      carousel_order: 2
    },
    {
      name: 'Bouquet Tropical Paradiso',
      description: 'Vibrante bouquet tropical con aves del paraíso, heliconias y follaje exótico. Un diseño audaz y colorido que trae la energía tropical a cualquier espacio. Ideal para celebraciones alegres.',
      summary: 'Bouquet tropical con aves del paraíso',
      price_usd: 72.00,
      price_ves: 2628000,
      stock: 15,
      sku: 'BTP-001',
      active: true,
      featured: true,
      carousel_order: 3
    },
    {
      name: 'Cesta de Flores Campestres',
      description: 'Encantadora cesta de mimbre con flores silvestres: margaritas, girasoles miniatura y paniculata. Un diseño rústico y natural que evoca la belleza del campo.',
      summary: 'Cesta campestre con flores silvestres',
      price_usd: 28.99,
      price_ves: 1058000,
      stock: 35,
      sku: 'CFC-001',
      active: true,
      featured: false,
      carousel_order: null
    },
    {
      name: 'Ramo de Girasoles Brillantes',
      description: 'Alegre ramo de girasoles frescos que irradia positividad y energía. Acompañado de solidago amarillo y follaje verde. Simboliza lealtad, optimismo y vitalidad.',
      summary: 'Ramo de girasoles con solidago',
      price_usd: 24.99,
      price_ves: 912000,
      stock: 50,
      sku: 'RGB-001',
      active: true,
      featured: false,
      carousel_order: null
    },
    {
      name: 'Arreglo Zen de Orquídeas',
      description: 'Sofisticado arreglo minimalista con orquídeas phalaenopsis blancas en base de bambú. Incluye musgo preservado y piedras decorativas.',
      summary: 'Arreglo zen con orquídeas blancas',
      price_usd: 89.99,
      price_ves: 3285000,
      stock: 10,
      sku: 'AZO-001',
      active: true,
      featured: true,
      carousel_order: 4
    },
    {
      name: 'Centro de Mesa Otoñal',
      description: 'Centro de mesa estacional con crisantemos naranjas y amarillos, ramas secas y velas aromáticas. Captura la esencia del otoño con colores cálidos.',
      summary: 'Centro otoñal con crisantemos',
      price_usd: 42.50,
      price_ves: 1551000,
      stock: 20,
      sku: 'CMO-001',
      active: true,
      featured: false,
      carousel_order: null
    },
    {
      name: 'Bouquet de Novia Romántico',
      description: 'Exquisito bouquet nupcial con peonías rosadas, rosas garden y eucalipto plateado. Diseño romántico y atemporal que complementa perfectamente el vestido de novia.',
      summary: 'Bouquet nupcial con peonías',
      price_usd: 125.00,
      price_ves: 4562500,
      stock: 5,
      sku: 'BNR-001',
      active: true,
      featured: true,
      carousel_order: 5
    }
  ],

  users: [
    {
      full_name: 'Admin FloresYa',
      email: 'admin@floresya.com',
      phone: '+58 212 555 0001',
      role: 'admin'
    },
    {
      full_name: 'María González',
      email: 'maria.gonzalez@gmail.com',
      phone: '+58 414 123 4567',
      role: 'user'
    },
    {
      full_name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@yahoo.com',
      phone: '+58 412 987 6543',
      role: 'user'
    },
    {
      full_name: 'Ana Pérez',
      email: 'ana.perez@hotmail.com',
      phone: '+58 424 555 0123',
      role: 'user'
    },
    {
      full_name: 'Luis Martínez',
      email: 'luis.martinez@gmail.com',
      phone: '+58 416 789 0123',
      role: 'user'
    }
  ],

  productImages: [
    {
      sku: 'RRR-001',
      url: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&h=800&fit=crop',
      alt_text: 'Ramo de rosas rojas clásico',
    },
    {
      sku: 'AEM-001',
      url: 'https://images.unsplash.com/photo-1574684891174-df6b02ab38d7?w=800&h=800&fit=crop',
      alt_text: 'Arreglo mixto en jarrón',
    },
    {
      sku: 'BTP-001',
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
      alt_text: 'Bouquet tropical colorido',
    },
    {
      sku: 'CFC-001',
      url: 'https://images.unsplash.com/photo-1574684891761-f5d7a5d2b9e4?w=800&h=800&fit=crop',
      alt_text: 'Cesta campestre con flores',
    },
    {
      sku: 'RGB-001',
      url: 'https://images.unsplash.com/photo-1562694428-4968665048d7?w=800&h=800&fit=crop',
      alt_text: 'Ramo de girasoles',
    },
    {
      sku: 'AZO-001',
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
      alt_text: 'Arreglo zen con orquídeas',
    },
    {
      sku: 'CMO-001',
      url: 'https://images.unsplash.com/photo-1478146787220-98703de297a4?w=800&h=800&fit=crop',
      alt_text: 'Centro de mesa otoñal',
    },
    {
      sku: 'BNR-001',
      url: 'https://images.unsplash.com/photo-1606800052052-a7b4d7906ac9?w=800&h=800&fit=crop',
      alt_text: 'Bouquet de novia romántico',
    }
  ]
};

async function insertOccasions() {
  console.log('🎉 Insertando ocasiones...');

  const { data, error } = await supabase
    .from('occasions')
    .upsert(testData.occasions, { onConflict: 'name' })
    .select();

  if (error) {
    console.error('❌ Error insertando ocasiones:', error);
    throw error;
  }

  console.log(`✅ ${data.length} ocasiones insertadas`);
  return data;
}

async function insertUsers() {
  console.log('👥 Insertando usuarios...');

  const { data, error } = await supabase
    .from('users')
    .upsert(testData.users, { onConflict: 'email' })
    .select();

  if (error) {
    console.error('❌ Error insertando usuarios:', error);
    throw error;
  }

  console.log(`✅ ${data.length} usuarios insertados`);
  return data;
}

async function insertProducts() {
  console.log('🌸 Insertando productos...');

  const { data, error } = await supabase
    .from('products')
    .upsert(testData.products, { onConflict: 'sku' })
    .select();

  if (error) {
    console.error('❌ Error insertando productos:', error);
    throw error;
  }

  console.log(`✅ ${data.length} productos insertados`);
  return data;
}

async function insertProductImages(products) {
  console.log('🖼️ Insertando imágenes de productos...');

  // Map SKUs to product IDs
  const productMap = {};
  products.forEach(product => {
    productMap[product.sku] = product.id;
  });

  // Add product_id to each image
  const imagesWithProductId = testData.productImages.map(image => ({
    ...image,
    product_id: productMap[image.sku]
  })).filter(image => image.product_id);

  if (imagesWithProductId.length === 0) {
    console.log('⚠️ No se encontraron productos para las imágenes');
    return [];
  }

  const { data, error } = await supabase
    .from('product_images')
    .upsert(imagesWithProductId, { onConflict: 'product_id,url' })
    .select();

  if (error) {
    console.error('❌ Error insertando imágenes:', error);
    throw error;
  }

  console.log(`✅ ${data.length} imágenes insertadas`);
  return data;
}

async function linkProductsToOccasions(products, occasions) {
  console.log('🔗 Vinculando productos con ocasiones...');

  const productOccasionLinks = [];

  // Link specific products to relevant occasions
  const linkMap = {
    'RRR-001': ['San Valentín', 'Aniversario'],
    'AEM-001': ['Cumpleaños', 'Día de la Madre'],
    'BTP-001': ['Graduación'],
    'CFC-001': ['Nueva Casa', 'Cumpleaños'],
    'RGB-001': ['Cumpleaños', 'Graduación'],
    'AZO-001': ['Aniversario', 'Nueva Casa'],
    'CMO-001': ['Día de la Madre'],
    'BNR-001': ['Boda']
  };

  products.forEach(product => {
    const occasionNames = linkMap[product.sku] || [];
    occasionNames.forEach(occasionName => {
      const occasion = occasions.find(o => o.name === occasionName);
      if (occasion) {
        productOccasionLinks.push({
          product_id: product.id,
          occasion_id: occasion.id
        });
      }
    });
  });

  if (productOccasionLinks.length > 0) {
    const { data, error } = await supabase
      .from('product_occasions')
      .upsert(productOccasionLinks, { onConflict: 'product_id,occasion_id' })
      .select();

    if (error) {
      console.error('❌ Error vinculando productos con ocasiones:', error);
      throw error;
    }

    console.log(`✅ ${data.length} vínculos producto-ocasión creados`);
  }
}

async function insertSampleOrders(products, users) {
  console.log('📦 Insertando pedidos de muestra...');

  const customers = users.filter(user => user.role === 'customer');
  if (customers.length === 0) {
    console.log('⚠️ No hay clientes para crear pedidos');
    return;
  }

  const sampleOrders = [];
  const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const paymentMethods = ['bank_transfer', 'mobile_payment', 'zelle'];

  for (let i = 0; i < 10; i++) {
    const customer = customers[i % customers.length];
    const status = orderStatuses[i % orderStatuses.length];
    const paymentMethod = paymentMethods[i % paymentMethods.length];
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));

    const order = {
      order_number: `FY-${Date.now()}-${i.toString().padStart(3, '0')}`,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_address: `Dirección de ${customer.name}, Caracas, Venezuela`,
      status,
      payment_method: paymentMethod,
      payment_reference: `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      shipping_cost: 5.00,
      total_amount: 0,
      notes: i % 3 === 0 ? 'Pedido urgente - entregar en la mañana' : null,
      created_at: orderDate.toISOString(),
      updated_at: orderDate.toISOString()
    };

    sampleOrders.push(order);
  }

  const { data: insertedOrders, error: ordersError } = await supabase
    .from('orders')
    .insert(sampleOrders)
    .select();

  if (ordersError) {
    console.error('❌ Error insertando pedidos:', ordersError);
    throw ordersError;
  }

  console.log(`✅ ${insertedOrders.length} pedidos insertados`);

  // Add order items
  if (products.length === 0) {
    console.log('⚠️ No hay productos para crear items de pedidos');
    return;
  }

  const orderItems = [];

  for (const order of insertedOrders) {
    const numItems = Math.floor(Math.random() * 2) + 1; // 1-2 items per order
    let orderTotal = 0;

    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
      const unitPrice = product.price_usd || 25.00;
      const itemTotal = unitPrice * quantity;
      orderTotal += itemTotal;

      orderItems.push({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: unitPrice,
        total_price: itemTotal
      });
    }

    // Update order total
    orderTotal += 5.00; // Add shipping
    await supabase
      .from('orders')
      .update({ total_amount: Math.round(orderTotal * 100) / 100 })
      .eq('id', order.id);
  }

  // Insert order items
  const { data: insertedItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  if (itemsError) {
    console.error('❌ Error insertando items de pedidos:', itemsError);
    throw itemsError;
  }

  console.log(`✅ ${insertedItems.length} items de pedidos insertados`);
}

async function validateData() {
  console.log('🔍 Validando datos insertados...');

  const tables = ['occasions', 'users', 'products', 'product_images', 'orders', 'order_items'];
  const counts = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.warn(`⚠️ Error contando ${table}:`, error.message);
        counts[table] = 'Error';
      } else {
        counts[table] = count || 0;
      }
    } catch (error) {
      counts[table] = 'N/A';
    }
  }

  console.log('\n📊 Resumen de datos insertados:');
  console.log('================================');
  Object.entries(counts).forEach(([table, count]) => {
    console.log(`${table.padEnd(20)} : ${count}`);
  });
  console.log('================================\n');

  return counts;
}

async function main() {
  try {
    console.log('🌸 Iniciando población de datos validados de FloresYa...\n');

    // Insert base data
    const occasions = await insertOccasions();
    const users = await insertUsers();
    const products = await insertProducts();

    // Insert related data
    const images = await insertProductImages(products);
    await linkProductsToOccasions(products, occasions);
    await insertSampleOrders(products, users);

    // Validate insertion
    const counts = await validateData();

    console.log('🎉 ¡Población de datos completada exitosamente!');
    console.log('\n🚀 El sistema FloresYa está listo para pruebas con:');
    console.log(`   • ${counts.products || 0} productos con imágenes`);
    console.log(`   • ${counts.occasions || 0} ocasiones especiales`);
    console.log(`   • ${counts.users || 0} usuarios de prueba`);
    console.log(`   • ${counts.orders || 0} pedidos de muestra`);
    console.log('\n📝 Datos de prueba disponibles:');
    console.log('   Admin: admin@floresya.com');
    console.log('   Cliente: maria.gonzalez@gmail.com\n');

  } catch (error) {
    console.error('💥 Error durante la población de datos:', error);
    process.exit(1);
  }
}

// Execute main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as populateValidatedData };