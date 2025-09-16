/**
 * 🌸 FloresYa Vercel Serverless Function Handler
 * Simple handler for serverless compatibility
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Simple serverless handler function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // For now, respond with basic JSON to test if the handler works
  res.status(200).json({
    success: true,
    message: 'FloresYa Serverless Function is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}