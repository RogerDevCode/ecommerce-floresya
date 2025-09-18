import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔥 Simple test handler invoked:', req.method, req.url);

  return res.status(200).json({
    success: true,
    message: 'Simple test endpoint working',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
}