import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: './public',
  base: '/',
  plugins: [],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'shared': path.resolve(__dirname, './src/shared'),
      'config': path.resolve(__dirname, './src/config'),
    }
  },
  build: {
    outDir: './dist/frontend',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, './src/frontend/main.ts'),
        authManager: path.resolve(__dirname, './src/frontend/authManager.ts'),
        authManagerTRPC: path.resolve(__dirname, './src/frontend/authManagerTRPC.ts'),
        productDetail: path.resolve(__dirname, './src/frontend/product-detail.ts'),
        usersAdmin: path.resolve(__dirname, './src/frontend/users-admin.ts'),
        adminPanel: path.resolve(__dirname, './src/frontend/adminPanel.ts'),
        'utils-logger': path.resolve(__dirname, './src/frontend/utils/logger.ts'),
        'apiClient': path.resolve(__dirname, './src/frontend/services/apiClient.ts'),
        'scroll-effects-fix': path.resolve(__dirname, './src/frontend/scroll-effects-fix.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          if (name === 'utils-logger') return 'utils/logger.js';
          if (name === 'apiClient') return 'services/apiClient.js';
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 3001,
    strictPort: true,
    host: true
  }
});