const { supabaseAdmin } = require('../services/supabaseAdmin');

async function setupStorage() {
    console.log('🗄️  Configurando Supabase Storage...\n');

    try {
        // Check if bucket exists
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
        
        if (listError) {
            console.error('❌ Error listando buckets:', listError);
            return false;
        }

        console.log('📋 Buckets existentes:', buckets.map(b => b.name).join(', '));

        const bucketExists = buckets.some(bucket => bucket.name === 'product-images');

        if (!bucketExists) {
            console.log('📦 Creando bucket "product-images"...');
            
            const { data, error } = await supabaseAdmin.storage.createBucket('product-images', {
                public: true,
                allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
                fileSizeLimit: 5242880 // 5MB
            });

            if (error) {
                console.error('❌ Error creando bucket:', error);
                return false;
            }

            console.log('✅ Bucket "product-images" creado exitosamente');
        } else {
            console.log('✅ Bucket "product-images" ya existe');
        }

        // Test upload and delete
        console.log('🧪 Probando subida de archivo...');
        const testContent = Buffer.from('test image content');
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('product-images')
            .upload('test/test-image.webp', testContent, {
                contentType: 'image/webp'
            });

        if (uploadError) {
            console.error('❌ Error en prueba de subida:', uploadError);
            return false;
        }

        console.log('✅ Prueba de subida exitosa');

        // Clean up test file
        await supabaseAdmin.storage
            .from('product-images')
            .remove(['test/test-image.webp']);

        console.log('🧹 Archivo de prueba eliminado');
        console.log('\n✅ Storage configurado correctamente\n');
        return true;

    } catch (error) {
        console.error('❌ Error configurando storage:', error);
        return false;
    }
}

if (require.main === module) {
    setupStorage();
}

module.exports = { setupStorage };