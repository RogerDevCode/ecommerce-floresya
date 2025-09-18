import { VercelRequest, VercelResponse } from '@vercel/node';
import { ProductController } from '../dist/controllers/ProductController.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('🚀 Products handler invoked:', req.method, req.url);

    const controller = new ProductController();

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // Check if requesting carousel
        if (req.url?.includes('/carousel')) {
          return await controller.getCarouselProducts(req as any, res as any);
        }
        // Regular products list
        return await controller.getProducts(req as any, res as any);

      case 'POST':
        return await controller.createProduct(req as any, res as any);

      case 'PUT':
        return await controller.updateProduct(req as any, res as any);

      case 'DELETE':
        return await controller.deleteProduct(req as any, res as any);

      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }

  } catch (error) {
    console.error('❌ Products handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}