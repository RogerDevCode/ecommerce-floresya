#!/usr/bin/env node
/**
 * Script para respaldar imágenes de la base de datos de Supabase
 * Descarga todas las imágenes de productos y carousel al directorio dbimagenes/
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridos');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const backupDir = path.join(__dirname, 'dbimagenes');

// Crear directorio de respaldo si no existe
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

console.log('🌸 FloresYa - Respaldo de Imágenes');
console.log('📂 Directorio de respaldo:', backupDir);
console.log('🔗 Supabase URL:', supabaseUrl);

// Función para descargar archivo
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);
        
        protocol.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(filepath);
                });
            } else {
                fs.unlink(filepath, () => {}); // Eliminar archivo parcial
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => {}); // Eliminar archivo parcial
            reject(err);
        });
    });
}

// Función para obtener un nombre de archivo único
function getUniqueFilename(directory, originalName) {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    let counter = 1;
    let newName = originalName;
    
    while (fs.existsSync(path.join(directory, newName))) {
        newName = `${name}_${counter}${ext}`;
        counter++;
    }
    
    return newName;
}

async function backupProductImages() {
    console.log('\n📦 Obteniendo imágenes de productos...');
    
    try {
        // Obtener todos los productos con imágenes
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, image_url, additional_images')
            .not('image_url', 'is', null);
            
        if (error) {
            throw error;
        }
        
        console.log(`✅ Encontrados ${products.length} productos con imágenes`);
        
        let downloadCount = 0;
        let errorCount = 0;
        
        for (const product of products) {
            console.log(`\n🔄 Procesando producto: ${product.name} (ID: ${product.id})`);
            
            // Descargar imagen principal
            if (product.image_url) {
                try {
                    const imageUrl = product.image_url.startsWith('http') 
                        ? product.image_url 
                        : `${supabaseUrl}/storage/v1/object/public/${product.image_url}`;
                    
                    const filename = `product_${product.id}_main_${path.basename(product.image_url)}`;
                    const uniqueFilename = getUniqueFilename(backupDir, filename);
                    const filepath = path.join(backupDir, uniqueFilename);
                    
                    await downloadFile(imageUrl, filepath);
                    console.log(`  ✅ Descargada imagen principal: ${uniqueFilename}`);
                    downloadCount++;
                } catch (err) {
                    console.log(`  ❌ Error descargando imagen principal: ${err.message}`);
                    errorCount++;
                }
            }
            
            // Descargar imágenes adicionales
            if (product.additional_images && Array.isArray(product.additional_images)) {
                for (let i = 0; i < product.additional_images.length; i++) {
                    const additionalUrl = product.additional_images[i];
                    try {
                        const imageUrl = additionalUrl.startsWith('http') 
                            ? additionalUrl 
                            : `${supabaseUrl}/storage/v1/object/public/${additionalUrl}`;
                        
                        const filename = `product_${product.id}_additional_${i+1}_${path.basename(additionalUrl)}`;
                        const uniqueFilename = getUniqueFilename(backupDir, filename);
                        const filepath = path.join(backupDir, uniqueFilename);
                        
                        await downloadFile(imageUrl, filepath);
                        console.log(`  ✅ Descargada imagen adicional ${i+1}: ${uniqueFilename}`);
                        downloadCount++;
                    } catch (err) {
                        console.log(`  ❌ Error descargando imagen adicional ${i+1}: ${err.message}`);
                        errorCount++;
                    }
                }
            }
        }
        
        console.log(`\n📊 Productos procesados: ${products.length}`);
        console.log(`✅ Imágenes descargadas: ${downloadCount}`);
        console.log(`❌ Errores: ${errorCount}`);
        
    } catch (error) {
        console.error('❌ Error obteniendo productos:', error.message);
    }
}

async function backupCarouselImages() {
    console.log('\n🎠 Obteniendo imágenes de carrusel...');
    
    try {
        // Obtener todas las imágenes de carrusel
        const { data: carouselImages, error } = await supabase
            .from('carousel_images')
            .select('id, title, image_url')
            .not('image_url', 'is', null);
            
        if (error) {
            throw error;
        }
        
        console.log(`✅ Encontradas ${carouselImages.length} imágenes de carrusel`);
        
        let downloadCount = 0;
        let errorCount = 0;
        
        for (const carousel of carouselImages) {
            console.log(`\n🔄 Procesando carrusel: ${carousel.title} (ID: ${carousel.id})`);
            
            try {
                const imageUrl = carousel.image_url.startsWith('http') 
                    ? carousel.image_url 
                    : `${supabaseUrl}/storage/v1/object/public/${carousel.image_url}`;
                
                const filename = `carousel_${carousel.id}_${path.basename(carousel.image_url)}`;
                const uniqueFilename = getUniqueFilename(backupDir, filename);
                const filepath = path.join(backupDir, uniqueFilename);
                
                await downloadFile(imageUrl, filepath);
                console.log(`  ✅ Descargada imagen de carrusel: ${uniqueFilename}`);
                downloadCount++;
            } catch (err) {
                console.log(`  ❌ Error descargando imagen de carrusel: ${err.message}`);
                errorCount++;
            }
        }
        
        console.log(`\n📊 Carruseles procesados: ${carouselImages.length}`);
        console.log(`✅ Imágenes descargadas: ${downloadCount}`);
        console.log(`❌ Errores: ${errorCount}`);
        
    } catch (error) {
        console.error('❌ Error obteniendo imágenes de carrusel:', error.message);
    }
}

async function main() {
    const startTime = Date.now();
    
    try {
        // Verificar conexión a Supabase
        console.log('🔍 Verificando conexión a Supabase...');
        const { error: connectionError } = await supabase
            .from('products')
            .select('count')
            .limit(1);
            
        if (connectionError) {
            throw new Error(`Error de conexión: ${connectionError.message}`);
        }
        
        console.log('✅ Conexión a Supabase exitosa');
        
        // Respaldar imágenes de productos
        await backupProductImages();
        
        // Respaldar imágenes de carrusel
        await backupCarouselImages();
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log('\n🎉 ¡Respaldo completado!');
        console.log(`⏱️ Tiempo total: ${duration.toFixed(2)}s`);
        
        // Mostrar resumen del directorio
        const files = fs.readdirSync(backupDir);
        console.log(`📁 Archivos en directorio de respaldo: ${files.length}`);
        
        if (files.length > 0) {
            console.log('\n📋 Archivos descargados:');
            files.forEach(file => {
                const filepath = path.join(backupDir, file);
                const stats = fs.statSync(filepath);
                const sizeKB = (stats.size / 1024).toFixed(1);
                console.log(`  - ${file} (${sizeKB} KB)`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error en el respaldo:', error.message);
        process.exit(1);
    }
}

// Ejecutar el script
main();