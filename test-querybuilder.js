#!/usr/bin/env node

/**
 * Script de prueba para el nuevo QueryBuilder
 */

import { createClient } from '@supabase/supabase-js';
import { createQueryBuilder, createPrismaLikeAPI } from './backend/src/services/queryBuilder.js';

const supabase = createClient(
    'https://dcbavpdlkcjdtjdkntde.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjYmF2cGRsa2NqZHRqZGtudGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc2Nzg5OSwiZXhwIjoyMDcyMzQzODk5fQ.MwbJfs2vXZJMDXT5bcdYjt0_pZ1OD7V7b_v0q_3tK2Q'
);

console.log('🧪 Probando nuevo QueryBuilder de FloresYa\n');

async function testQueryBuilder() {
    try {
        console.log('1. Probando QueryBuilder básico...');
        
        const qb = createQueryBuilder(supabase, 'occasions');
        const result = await qb
            .select('*')
            .eq('is_active', true)
            .orderBy('display_order', { ascending: true })
            .execute();
        
        console.log('✅ QueryBuilder básico:', result.success);
        if (result.success) {
            console.log(`   - Encontradas ${result.data?.length || 0} ocasiones`);
            result.data?.slice(0, 3).forEach(item => {
                console.log(`   - ${item.name} (${item.type})`);
            });
        } else {
            console.log('   - Error:', result.error?.message);
        }
        
    } catch (error) {
        console.error('❌ Error en QueryBuilder básico:', error.message);
    }
    
    console.log('');
    
    try {
        console.log('2. Probando API tipo Prisma...');
        
        const prisma = createPrismaLikeAPI(supabase);
        const occasions = await prisma.occasion.findMany({
            where: { is_active: true },
            orderBy: { display_order: 'asc' }
        });
        
        console.log('✅ API tipo Prisma funcionando');
        console.log(`   - Encontradas ${occasions.length} ocasiones`);
        occasions.slice(0, 3).forEach(item => {
            console.log(`   - ${item.name} (${item.type})`);
        });
        
    } catch (error) {
        console.error('❌ Error en API tipo Prisma:', error.message);
    }
    
    console.log('');
    
    try {
        console.log('3. Probando productos...');
        
        const qb = createQueryBuilder(supabase, 'products');
        const result = await qb
            .select('*')
            .eq('active', true)
            .limit(3)
            .execute();
        
        console.log('✅ Productos:', result.success);
        if (result.success) {
            console.log(`   - Encontrados ${result.data?.length || 0} productos`);
            result.data?.forEach(item => {
                console.log(`   - ${item.name}: $${item.price_usd}`);
            });
        } else {
            console.log('   - Error:', result.error?.message);
        }
        
    } catch (error) {
        console.error('❌ Error en productos:', error.message);
    }
    
    console.log('');
    
    try {
        console.log('4. Probando configuraciones...');
        
        const prisma = createPrismaLikeAPI(supabase);
        const setting = await prisma.setting.findUnique({
            where: { key: 'store_name' }
        });
        
        console.log('✅ Setting encontrado:', setting ? `${setting.key} = ${setting.value}` : 'No encontrado');
        
    } catch (error) {
        console.error('❌ Error en configuraciones:', error.message);
    }
}

testQueryBuilder();