import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@app': resolve(__dirname, './src/app'),
      '@environment': resolve(__dirname, './src/environments'),
    },
  },
});
