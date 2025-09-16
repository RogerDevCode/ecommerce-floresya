/**
 * 🌸 FloresYa Vercel Serverless Function Handler
 * Integrates with the Express server for API routes
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { FloresYaServer } from '../src/app/server.js';

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
  const app = getServerInstance();
  return app(req, res);
}