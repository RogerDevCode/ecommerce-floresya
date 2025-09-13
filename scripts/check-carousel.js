#!/usr/bin/env node
/**
 * Script para verificar la configuración del carrusel
 * Ejecutar: node scripts/check-carousel.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Necesitamos esta línea para simular __dirname en módulos ES:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando configuración del carrusel...\n');

// 1. Verificar que el CSS existe     /home/manager/Sync/ecommerce-floresya/frontend/css/carousel.css
const cssPath = path.join(__dirname, '../frontend/css/carousel.css');

    console.log(cssPath);

if (fs.existsSync(cssPath)) {
    console.log('✅ /home/manager/Sync/ecommerce-floresya/frontend/css/carousel.css');
} else {
    console.log('❌ /home/manager/Sync/ecommerce-floresya/frontend/css/carousel.css');
}

// 2. Verificar referencia en index.html
const indexPath = path.join(__dirname, '../frontend/index.html');
if (fs.existsSync(indexPath)) {
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    if (htmlContent.includes('carousel.css')) {
        console.log('✅ carousel.css referenciado en index.html');
    } else {
        console.log('❌ carousel.css NO referenciado en index.html');
    }
}

// 3. Verificar estructura del carrusel en main.js
const mainJsPath = path.join(__dirname, '../frontend/js/main.js');
if (fs.existsSync(mainJsPath)) {
    const jsContent = fs.readFileSync(mainJsPath, 'utf8');
    
    if (jsContent.includes('heroCarousel')) {
        console.log('✅ ID heroCarousel encontrado en main.js');
    } else {
        console.log('❌ ID heroCarousel NO encontrado en main.js');
    }
    
    if (jsContent.includes('initializeBootstrapCarousel')) {
        console.log('✅ initializeBootstrapCarousel encontrado en main.js');
    } else {
        console.log('❌ initializeBootstrapCarousel NO encontrado en main.js');
    }
}

console.log('\n📋 Pasos para resolver:');
console.log('1. Crear /css/carousel.css con el código proporcionado');
console.log('2. Reemplazar renderCarousel en main.js con la versión corregida');
console.log('3. Verificar que carousel.css esté referenciado en index.html');
console.log('4. Limpiar cache del navegador (Ctrl+F5)');

