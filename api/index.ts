/**
 * 🌸 FloresYa Vercel Serverless Function Handler
 * Integrates with the Express server for API routes
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore - Dynamic import of built server
import { FloresYaServer } from '../dist/app/server.js';

// Create server instance once (for reuse across invocations)
let serverInstance: FloresYaServer | undefined;

function getServerInstance() {
  if (!serverInstance) {
    serverInstance = new FloresYaServer();
  }
  return serverInstance.getApp();
}

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
    const app = getServerInstance();
    console.log('✅ Server instance created');
    return app(req, res);
  } catch (error) {
    console.error('❌ Serverless handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}