import { VercelRequest, VercelResponse } from '@vercel/node';
import { OccasionsController } from '../dist/controllers/OccasionsController.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('🚀 Occasions handler invoked:', req.method, req.url);

    const controller = new OccasionsController();

    if (req.method === 'GET') {
      return await controller.getOccasions(req as any, res as any);
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Occasions handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}