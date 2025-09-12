// Debug server startup
import { config } from 'dotenv';
config();

console.log('🔍 Starting server debug...');

try {
    console.log('1. Loading logger...');
    const { logger } = await import('./backend/src/utils/bked_logger.js');
    console.log('✅ Logger loaded');
    
    console.log('2. Loading express...');
    const express = (await import('express')).default;
    const app = express();
    console.log('✅ Express loaded');
    
    console.log('3. Loading middleware...');
    const cors = (await import('cors')).default;
    app.use(cors());
    console.log('✅ CORS loaded');
    
    console.log('4. Loading database service...');
    const { databaseService } = await import('./backend/src/services/databaseService.js');
    console.log('✅ Database service loaded');
    
    console.log('5. Testing database connection...');
    const connectionTest = await databaseService.testConnection();
    console.log('✅ Database connection test:', connectionTest);
    
    console.log('6. Loading product routes...');
    const productRoutes = await import('./backend/src/routes/products.js');
    app.use('/api/products', productRoutes.default);
    console.log('✅ Product routes loaded');
    
    console.log('7. Starting server...');
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`✅ Server running on port ${port}`);
    });
    
} catch (error) {
    console.error('❌ Server startup error:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
}