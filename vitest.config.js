/**
 * 🌸 FloresYa - Vitest Configuration
 * Configuración para tests con soporte completo ES6 modules y Supabase
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/unit/**/*.test.{js,ts}',
      'tests/integration/**/*.test.{js,ts}',
      '!tests/unit-es6/**/*.test.js'
    ],
    globals: true,
    testTimeout: 15000,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'oldfiles/',
        '*.config.*'
      ]
    },
    alias: {
      '@': path.resolve(__dirname, './'),
      '@backend': path.resolve(__dirname, './src'), // ✅ Ruta corregida — no "backend/src"
      '@tests': path.resolve(__dirname, './tests')
    }
  },
  esbuild: {
    target: 'node18'
  }
});