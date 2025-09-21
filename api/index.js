/**
 * 🌸 FloresYa Vercel Serverless Function Handler
 * Entry point for Vercel deployment
 */

// Import the pre-configured Express app instance
import app from '../dist/backend/app/server.js';

// Export the default handler for Vercel Functions
export default function handler(req, res) {
  try {
    // Use the exported Express app directly
    return app(req, res);
  } catch (error) {
    console.error('Function invocation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}