import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@backend': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@frontend': path.resolve(__dirname, './src/frontend'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },

  test: {
    environment: 'node',

    globals: true,

    setupFiles: [],

    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/public/**',
    ],

    testTimeout: 15000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*',
        '**/types/**',
        '**/public/**',
        '**/*.d.ts',
        'scripts/**',
        '.trunk/**',
        '.vercel/**',
        'logs/**',
      ],
      include: [
        'src/**/*.{js,ts}',
      ],
      thresholds: {
        global: {
          statements: 70,
          branches: 70,
          functions: 70,
          lines: 70,
        },
      },
    },

    reporter: ['verbose', 'json', 'html'],

    outputFile: {
      json: './test-results.json',
      html: './test-results.html',
    },

    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    threads: true,
    maxThreads: 4,
    minThreads: 1,

    watch: false,
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/*.log',
      '**/logs/**',
    ],

    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true,
      },
    },

    retry: 2,

    bail: 5,
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.VITEST': true,
  },

  esbuild: {
    target: 'node18',
  },

  optimizeDeps: {
    include: [
      'vitest',
      '@vitest/utils',
      'supertest',
    ],
  },

  server: {
    fs: {
      allow: ['..'],
    },
  },
});
