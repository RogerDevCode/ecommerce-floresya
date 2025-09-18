/**
 * 🌸 FloresYa - Vitest Configuration
 * Configuración para tests con soporte completo ES6 modules y Supabase
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Environment
    environment: 'node',

    // Test files patterns
    include: [
      'tests/unit/**/*.test.{js,ts}',
      '!tests/unit-es6/**/*.test.js' // Exclude legacy ES6 tests
    ],

    // Global test setup
    globals: true,

    // Test timeout
    testTimeout: 15000,

    // Setup files
    // setupFiles: ['./tests/unit/vitest.setup.js'],

    // Coverage configuration
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

    // Mock configuration
    clearMocks: true,
    restoreMocks: true,

    // Alias for imports
    alias: {
      '@': path.resolve(__dirname, './'),
      '@backend': path.resolve(__dirname, './backend/src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  },

  // ESbuild configuration for ES6 modules
  esbuild: {
    target: 'node18'
  }
});