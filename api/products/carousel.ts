import { VercelRequest, VercelResponse } from '@vercel/node';
import { ProductController } from '../../dist/controllers/ProductController.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('🎠 Carousel handler invoked:', req.method, req.url);

    const controller = new ProductController();

    if (req.method === 'GET') {
      // Set query to get carousel products
      (req as any).query = { carousel: 'true' };
      return await controller.getProducts(req as any, res as any);
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('❌ Carousel handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}