/**
 * 🌸 FloresYa Comprehensive Data Population Script
 * Populates database with realistic test data for all functionality
 * Including products, users, orders, images, and occasions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Comprehensive test data
const testData = {
  occasions: [
    { name: 'Cumpleaños', description: 'Celebra un cumpleaños especial', color: '#FF6B6B' },
    { name: 'Aniversario', description: 'Conmemora un aniversario importante', color: '#4ECDC4' },
    { name: 'San Valentín', description: 'Expresa tu amor en el día de los enamorados', color: '#FF69B4' },
    { name: 'Día de la Madre', description: 'Honra a mamá en su día especial', color: '#98D8C8' },
    { name: 'Graduación', description: 'Felicita por un logro académico', color: '#F7DC6F' },
    { name: 'Condolencias', description: 'Expresa solidaridad en momentos difíciles', color: '#D5DBDB' },
    { name: 'Nueva Casa', description: 'Celebra un nuevo hogar', color: '#85C1E9' },
    { name: 'Promoción Laboral', description: 'Felicita por un ascenso', color: '#82E0AA' },
    { name: 'Boda', description: 'Celebra la unión matrimonial', color: '#F8C471' },
    { name: 'Baby Shower', description: 'Celebra la llegada de un bebé', color: '#F4A6CD' }
  ],

  products: [
    {
      name: 'Ramo Clásico de Rosas Rojas',
      description: 'Hermoso ramo de 12 rosas rojas frescas, símbolo eterno del amor y la pasión. Incluye follaje decorativo, papel celofán elegante y lazo satinado. Perfecto para San Valentín, aniversarios o para expresar sentimientos profundos.',
      summary: 'Ramo de 12 rosas rojas con follaje',
      price_usd: 35.99,
      price_ves: 1314000,
      stock: 45,
      sku: 'RRR-001',
      active: true,
      featured: true,
      carousel_order: 1,
      category: 'ramos'
    },
    {
      name: 'Arreglo Elegante Mixto Premium',
      description: 'Exquisito arreglo floral en jarrón de cerámica con rosas rosadas, lirios blancos, alstromerias y eucalipto. Un diseño sofisticado que combina elegancia y frescura, ideal para ocasiones especiales, oficinas o como regalo de cumpleaños.',
      summary: 'Arreglo mixto premium en jarrón',
      price_usd: 58.50,
      price_ves: 2135000,
      stock: 25,
      sku: 'AEM-001',
      active: true,
      featured: true,
      carousel_order: 2,
      category: 'arreglos'
    },
    {
      name: 'Bouquet Tropical Paradiso',
      description: 'Vibrante bouquet tropical con aves del paraíso, heliconias, anthurios rojos y follaje exótico. Un diseño audaz y colorido que trae la energía tropical a cualquier espacio. Ideal para celebraciones alegres y decoración moderna.',
      summary: 'Bouquet tropical con aves del paraíso',
      price_usd: 72.00,
      price_ves: 2628000,
      stock: 15,
      sku: 'BTP-001',
      active: true,
      featured: true,
      carousel_order: 3,
      category: 'bouquets'
    },
    {
      name: 'Cesta de Flores Campestres',
      description: 'Encantadora cesta de mimbre con flores silvestres: margaritas, girasoles miniatura, astilbe y paniculata. Un diseño rústico y natural que evoca la belleza del campo. Perfecta para hogares con estilo country o como regalo para amantes de la naturaleza.',
      summary: 'Cesta campestre con flores silvestres',
      price_usd: 28.99,
      price_ves: 1058000,
      stock: 35,
      sku: 'CFC-001',
      active: true,
      featured: false,
      carousel_order: null,
      category: 'cestas'
    },
    {
      name: 'Ramo de Girasoles Brillantes',
      description: 'Alegre ramo de girasoles frescos que irradia positividad y energía. Acompañado de solidago amarillo y follaje verde. Simboliza lealtad, optimismo y vitalidad. Ideal para alegrar el día de alguien especial o decorar espacios que necesitan luz.',
      summary: 'Ramo de girasoles con solidago',
      price_usd: 24.99,
      price_ves: 912000,
      stock: 50,
      sku: 'RGB-001',
      active: true,
      featured: false,
      carousel_order: null,
      category: 'ramos'
    },
    {
      name: 'Arreglo Zen de Orquídeas',
      description: 'Sofisticado arreglo minimalista con orquídeas phalaenopsis blancas en base de bambú. Incluye musgo preservado y piedras decorativas. Un diseño zen que aporta serenidad y elegancia moderna a cualquier ambiente.',
      summary: 'Arreglo zen con orquídeas blancas',
      price_usd: 89.99,
      price_ves: 3285000,
      stock: 10,
      sku: 'AZO-001',
      active: true,
      featured: true,
      carousel_order: 4,
      category: 'arreglos'
    },
    {
      name: 'Centro de Mesa Otoñal',
      description: 'Centro de mesa estacional con crisantemos naranjas y amarillos, ramas secas, calabazas decorativas y velas aromáticas. Captura la esencia del otoño con colores cálidos y texturas naturales.',
      summary: 'Centro otoñal con crisantemos',
      price_usd: 42.50,
      price_ves: 1551000,
      stock: 20,
      sku: 'CMO-001',
      active: true,
      featured: false,
      carousel_order: null,
      category: 'centros'
    },
    {
      name: 'Ramo de Tulipanes Primaverales',
      description: 'Fresco ramo de tulipanes en tonos pastel: rosa, amarillo y blanco. Evoca la llegada de la primavera con su delicadeza y frescura. Perfecto para celebrar nuevos comienzos, Día de la Madre o simplemente alegrar el hogar.',
      summary: 'Ramo de tulipanes en tonos pastel',
      price_usd: 33.75,
      price_ves: 1232000,
      stock: 30,
      sku: 'RTP-001',
      active: true,
      featured: false,
      carousel_order: null,
      category: 'ramos'
    },
    {
      name: 'Arreglo Fúnebre de Condolencias',
      description: 'Arreglo elegante y sobrio con lirios blancos, rosas blancas, claveles y follaje verde. Diseñado con respeto y dignidad para expresar condolencias y acompañar en momentos de duelo.',
      summary: 'Arreglo fúnebre con lirios blancos',
      price_usd: 65.00,
      price_ves: 2373000,
      stock: 8,
      sku: 'AFC-001',
      active: true,
      featured: false,
      carousel_order: null,
      category: 'funebres'
    },
    {
      name: 'Bouquet de Novia Romántico',
      description: 'Exquisito bouquet nupcial con peonías rosadas, rosas garden, astilbe y eucalipto plateado. Diseño romántico y atemporal que complementa perfectamente el vestido de novia. Incluye manija satinada con perlas.',
      summary: 'Bouquet nupcial con peonías',
      price_usd: 125.00,
      price_ves: 4562500,
      stock: 5,
      sku: 'BNR-001',
      active: true,
      featured: true,
      carousel_order: 5,
      category: 'bodas'
    }
  ],

  users: [
    {
      name: 'Admin FloresYa',
      email: 'admin@floresya.com',
      phone: '+58 212 555 0001',
      role: 'admin',
      password: 'admin123', // In real app, this would be hashed
      active: true
    },
    {
      name: 'María González',
      email: 'maria.gonzalez@gmail.com',
      phone: '+58 414 123 4567',
      role: 'customer',
      active: true
    },
    {
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@yahoo.com',
      phone: '+58 412 987 6543',
      role: 'customer',
      active: true
    },
    {
      name: 'Ana Pérez',
      email: 'ana.perez@hotmail.com',
      phone: '+58 424 555 0123',
      role: 'customer',
      active: true
    },
    {
      name: 'Luis Martínez',
      email: 'luis.martinez@gmail.com',
      phone: '+58 416 789 0123',
      role: 'customer',
      active: true
    },
    {
      name: 'Carmen Silva',
      email: 'carmen.silva@outlook.com',
      phone: '+58 426 456 7890',
      role: 'customer',
      active: true
    }
  ],

  productImages: [
    // Ramo Clásico de Rosas Rojas
    {
      sku: 'RRR-001',
      url: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&h=800&fit=crop',
      alt_text: 'Ramo de rosas rojas clásico',
      is_primary: true,
      display_order: 1
    },
    {
      sku: 'RRR-001',
      url: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=800&h=800&fit=crop',
      alt_text: 'Detalle de rosas rojas',
      is_primary: false,
      display_order: 2
    },
    // Arreglo Elegante Mixto Premium
    {
      sku: 'AEM-001',
      url: 'https://images.unsplash.com/photo-1574684891174-df6b02ab38d7?w=800&h=800&fit=crop',
      alt_text: 'Arreglo mixto en jarrón',
      is_primary: true,
      display_order: 1
    },
    // Bouquet Tropical Paradiso
    {
      sku: 'BTP-001',
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
      alt_text: 'Bouquet tropical colorido',
      is_primary: true,
      display_order: 1
    },
    // Cesta de Flores Campestres
    {
      sku: 'CFC-001',
      url: 'https://images.unsplash.com/photo-1574684891761-f5d7a5d2b9e4?w=800&h=800&fit=crop',
      alt_text: 'Cesta campestre con flores',
      is_primary: true,
      display_order: 1
    },
    // Ramo de Girasoles Brillantes
    {
      sku: 'RGB-001',
      url: 'https://images.unsplash.com/photo-1562694428-4968665048d7?w=800&h=800&fit=crop',
      alt_text: 'Ramo de girasoles',
      is_primary: true,
      display_order: 1
    },
    // Arreglo Zen de Orquídeas
    {
      sku: 'AZO-001',
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop',
      alt_text: 'Arreglo zen con orquídeas',
      is_primary: true,
      display_order: 1
    },
    // Centro de Mesa Otoñal
    {
      sku: 'CMO-001',
      url: 'https://images.unsplash.com/photo-1478146787220-98703de297a4?w=800&h=800&fit=crop',
      alt_text: 'Centro de mesa otoñal',
      is_primary: true,
      display_order: 1
    },
    // Ramo de Tulipanes Primaverales
    {
      sku: 'RTP-001',
      url: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800&h=800&fit=crop',
      alt_text: 'Ramo de tulipanes pastel',
      is_primary: true,
      display_order: 1
    },
    // Bouquet de Novia Romántico
    {
      sku: 'BNR-001',
      url: 'https://images.unsplash.com/photo-1606800052052-a7b4d7906ac9?w=800&h=800&fit=crop',
      alt_text: 'Bouquet de novia romántico',
      is_primary: true,
      display_order: 1
    }
  ]
};

async function clearExistingData() {
  console.log('🗑️ Limpiando datos existentes...');

  try {
    // Delete in reverse order of dependencies
    await supabase.from('order_items').delete().neq('id', 0);
    await supabase.from('orders').delete().neq('id', 0);
    await supabase.from('product_images').delete().neq('id', 0);
    await supabase.from('product_occasions').delete().neq('id', 0);
    await supabase.from('products').delete().neq('id', 0);
    await supabase.from('users').delete().neq('id', 0);
    await supabase.from('occasions').delete().neq('id', 0);

    console.log('✅ Datos existentes eliminados');
  } catch (error) {
    console.warn('⚠️ Error limpiando datos (puede ser normal):', error.message);
  }
}

async function insertOccasions() {
  console.log('🎉 Insertando ocasiones...');

  const { data, error } = await supabase
    .from('occasions')
    .insert(testData.occasions)
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
    .insert(testData.users)
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
    .insert(testData.products)
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
  })).filter(image => image.product_id); // Only include images for existing products

  const { data, error } = await supabase
    .from('product_images')
    .insert(imagesWithProductId)
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
    'RRR-001': ['San Valentín', 'Aniversario'], // Rosas rojas
    'AEM-001': ['Cumpleaños', 'Día de la Madre'], // Arreglo elegante
    'BTP-001': ['Graduación', 'Promoción Laboral'], // Tropical
    'CFC-001': ['Nueva Casa', 'Cumpleaños'], // Campestre
    'RGB-001': ['Cumpleaños', 'Graduación'], // Girasoles
    'AZO-001': ['Aniversario', 'Nueva Casa'], // Orquídeas zen
    'CMO-001': ['Día de la Madre'], // Centro otoñal
    'RTP-001': ['Día de la Madre', 'Cumpleaños'], // Tulipanes
    'AFC-001': ['Condolencias'], // Fúnebre
    'BNR-001': ['Boda'] // Novia
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
      .insert(productOccasionLinks)
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
  const sampleOrders = [];

  // Create diverse sample orders
  const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const paymentMethods = ['bank_transfer', 'mobile_payment', 'zelle'];

  for (let i = 0; i < 15; i++) {
    const customer = customers[i % customers.length];
    const status = orderStatuses[i % orderStatuses.length];
    const paymentMethod = paymentMethods[i % paymentMethods.length];
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days

    const order = {
      order_number: `FY-${Date.now()}-${i}`,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_address: `Dirección de ${customer.name}, Caracas, Venezuela`,
      status,
      payment_method: paymentMethod,
      payment_reference: `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      shipping_cost: 5.00,
      total_amount: 0, // Will be calculated after adding items
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
  const orderItems = [];

  for (let i = 0; i < insertedOrders.length; i++) {
    const order = insertedOrders[i];
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
    let orderTotal = 0;

    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
      const itemTotal = product.price_usd * quantity;
      orderTotal += itemTotal;

      orderItems.push({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.price_usd,
        total_price: itemTotal
      });
    }

    // Update order total
    orderTotal += 5.00; // Add shipping
    await supabase
      .from('orders')
      .update({ total_amount: orderTotal })
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

async function insertSystemSettings() {
  console.log('⚙️ Insertando configuraciones del sistema...');

  const systemSettings = [
    { key: 'site_name', value: 'FloresYa', description: 'Nombre del sitio web' },
    { key: 'site_description', value: 'Tu floristería en línea de confianza', description: 'Descripción del sitio' },
    { key: 'contact_email', value: 'info@floresya.com', description: 'Email de contacto principal' },
    { key: 'contact_phone', value: '+58 414 123 4567', description: 'Teléfono de contacto principal' },
    { key: 'business_address', value: 'Caracas, Venezuela', description: 'Dirección del negocio' },
    { key: 'bcv_rate', value: '36.50', description: 'Tasa de cambio BCV (Bs/$)' },
    { key: 'shipping_cost', value: '5.00', description: 'Costo de envío en USD' },
    { key: 'minimum_order_amount', value: '20.00', description: 'Monto mínimo de pedido' },
    { key: 'delivery_radius', value: '15', description: 'Radio de entrega en km' },
    { key: 'business_hours_weekdays', value: '08:00-18:00', description: 'Horario lunes a viernes' },
    { key: 'business_hours_saturday', value: '09:00-15:00', description: 'Horario sábados' },
    { key: 'enable_same_day_delivery', value: 'true', description: 'Habilitar entrega el mismo día' }
  ];

  // Create settings table if it doesn't exist (this would typically be in migrations)
  try {
    const { data, error } = await supabase
      .from('settings')
      .upsert(systemSettings, { onConflict: 'key' })
      .select();

    if (error) {
      console.warn('⚠️ No se pudieron insertar configuraciones (tabla puede no existir):', error.message);
    } else {
      console.log(`✅ ${data.length} configuraciones del sistema insertadas`);
    }
  } catch (error) {
    console.warn('⚠️ Configuraciones del sistema omitidas (tabla no existe)');
  }
}

async function validateData() {
  console.log('🔍 Validando datos insertados...');

  try {
    // Count records in each table
    const counts = {};

    const tables = ['occasions', 'users', 'products', 'product_images', 'product_occasions', 'orders', 'order_items'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.warn(`⚠️ No se pudo contar ${table}:`, error.message);
        counts[table] = 'Error';
      } else {
        counts[table] = count;
      }
    }

    console.log('\n📊 Resumen de datos insertados:');
    console.log('================================');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`${table.padEnd(20)} : ${count}`);
    });
    console.log('================================\n');

    return counts;
  } catch (error) {
    console.error('❌ Error validando datos:', error);
  }
}

async function main() {
  try {
    console.log('🌸 Iniciando población de datos de FloresYa...\n');

    // Step 1: Clear existing data
    await clearExistingData();

    // Step 2: Insert base data
    const occasions = await insertOccasions();
    const users = await insertUsers();
    const products = await insertProducts();

    // Step 3: Insert related data
    const images = await insertProductImages(products);
    await linkProductsToOccasions(products, occasions);
    await insertSampleOrders(products, users);

    // Step 4: Insert system settings
    await insertSystemSettings();

    // Step 5: Validate insertion
    const counts = await validateData();

    console.log('🎉 ¡Población de datos completada exitosamente!');
    console.log('\n🚀 El sistema FloresYa está listo para pruebas con:');
    console.log(`   • ${counts.products || 0} productos con imágenes`);
    console.log(`   • ${counts.occasions || 0} ocasiones especiales`);
    console.log(`   • ${counts.users || 0} usuarios de prueba`);
    console.log(`   • ${counts.orders || 0} pedidos de muestra con diferentes estados`);
    console.log(`   • ${counts.order_items || 0} items de pedidos`);
    console.log('\n📝 Credenciales de prueba:');
    console.log('   Admin: admin@floresya.com / admin123');
    console.log('   Cliente: maria.gonzalez@gmail.com\n');

  } catch (error) {
    console.error('💥 Error durante la población de datos:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Execute main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as populateComprehensiveData };