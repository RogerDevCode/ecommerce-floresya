import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carga variables de entorno
config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupStorage() {
    try {
        // Lista y elimina todos los archivos en todos los subdirectorios
        const subdirs = ['', 'large/', 'medium/', 'thumb/'];
        
        for (const subdir of subdirs) {
            console.log(`🧹 Limpiando directorio: ${subdir || 'root'}`);
            
            let { data: files, error } = await supabase
                .storage
                .from('product-images')
                .list(subdir, { limit: 1000 });
                
            if (error) throw error;
            
            if (files && files.length > 0) {
                const paths = files.map(file => `${subdir}${file.name}`);
                const { error: deleteError } = await supabase
                    .storage
                    .from('product-images')
                    .remove(paths);
                    
                if (deleteError) throw deleteError;
                console.log(`✅ Eliminados ${files.length} archivos en ${subdir}`);
            }
        }
        
        console.log('🎉 ¡Limpieza de storage completada!');
    } catch (error) {
        console.error('❌ Error limpiando storage:', error.message);
    }
}

cleanupStorage();
