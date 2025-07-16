import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@app': resolve(__dirname, './src/app'),
      '@shared': resolve(__dirname, './src/app/shared'),
      '@entities': resolve(__dirname, './src/app/entities'),
      '@features': resolve(__dirname, './src/app/features'),
      '@widgets': resolve(__dirname, './src/app/widgets'),
      '@pages': resolve(__dirname, './src/app/pages'),
      '@processes': resolve(__dirname, './src/app/processes'),
      '@environment': resolve(__dirname, './src/environments')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  optimizeDeps: {
    include: ['@angular/compiler']
  },
});
