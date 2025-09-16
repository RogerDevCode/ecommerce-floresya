/**
 * 🌸 FloresYa Vercel Serverless Function Handler
 * Exports the Express app for Vercel's serverless environment
 */

// Import the compiled server directly
// Vercel will handle the path resolution
import app from '../dist/app/server.js';

// Export for Vercel
export default app;