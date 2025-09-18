/**
 * 🌸 FloresYa Vercel Serverless Function Handler
 * Integrates with the Express server for API routes
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Export serverless handler function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('🚀 Vercel handler invoked:', req.method, req.url);

    // Add basic environment check
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      console.error('❌ SUPABASE_URL not configured in Vercel environment variables');
      return res.status(500).json({
        success: false,
        message: 'Database configuration missing',
        error: 'SUPABASE_URL environment variable not set'
      });
    }

    console.log('✅ Environment variables verified');

    // Dynamic import with explicit error handling
    console.log('🔄 Importing FloresYaServer...');
    const serverModule = await import('../dist/app/server.js');
    console.log('✅ FloresYaServer module imported:', Object.keys(serverModule));

    const { FloresYaServer } = serverModule;
    if (!FloresYaServer) {
      throw new Error('FloresYaServer class not found in module exports');
    }

    console.log('✅ Creating FloresYaServer instance...');
    const serverInstance = new FloresYaServer();
    const app = serverInstance.getApp();
    console.log('✅ Server instance created');

    return app(req, res);
  } catch (error) {
    console.error('❌ Serverless handler error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}