const { supabaseAdmin } = require('../services/supabaseAdmin');

async function checkBucketPolicies() {
    console.log('🔍 Verificando políticas del bucket...\n');

    try {
        // Get bucket details
        const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
        
        if (bucketsError) {
            console.error('❌ Error listando buckets:', bucketsError);
            return;
        }

        const productBucket = buckets.find(b => b.name === 'product-images');
        
        if (!productBucket) {
            console.error('❌ Bucket "product-images" no encontrado');
            return;
        }

        console.log('📦 Bucket encontrado:', productBucket);
        console.log('🔓 Público:', productBucket.public);
        console.log();

        // Try to get bucket details with admin client
        const { data: bucketDetails, error: detailsError } = await supabaseAdmin.storage.getBucket('product-images');
        
        if (detailsError) {
            console.error('❌ Error obteniendo detalles del bucket:', detailsError);
        } else {
            console.log('📋 Detalles del bucket:', bucketDetails);
        }

        // List some files to verify they exist
        console.log('\n📂 Listando archivos en el bucket...');
        const { data: files, error: filesError } = await supabaseAdmin.storage
            .from('product-images')
            .list('large', { limit: 5 });

        if (filesError) {
            console.error('❌ Error listando archivos:', filesError);
        } else {
            console.log(`✅ Encontrados ${files.length} archivos en /large:`);
            files.forEach(file => {
                console.log(`   - ${file.name} (${Math.round(file.metadata?.size / 1024)}KB)`);
            });
        }

        // Test direct access to a file
        console.log('\n🧪 Probando acceso directo a un archivo...');
        if (files && files.length > 0) {
            const testFile = files[0].name;
            const { data: publicUrl } = supabaseAdmin.storage
                .from('product-images')
                .getPublicUrl(`large/${testFile}`);

            console.log(`🔗 URL pública: ${publicUrl.publicUrl}`);

            // Try to access the file
            try {
                const response = await fetch(publicUrl.publicUrl, { method: 'HEAD' });
                console.log(`📊 Estado HTTP: ${response.status}`);
                console.log(`📋 Headers:`, Object.fromEntries(response.headers));
            } catch (fetchError) {
                console.error('❌ Error accediendo al archivo:', fetchError.message);
            }
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

if (require.main === module) {
    checkBucketPolicies();
}

module.exports = { checkBucketPolicies };