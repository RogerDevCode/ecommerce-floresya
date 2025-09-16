/**
 * 🌸 FloresYa Health Check API
 */

export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: "FloresYa API is running",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    environment: process.env.NODE_ENV || 'production'
  });
}