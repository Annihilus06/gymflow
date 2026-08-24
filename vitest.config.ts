import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/utils/**',
        'src/lib/auth/**',
        'src/lib/validations/**',
        'src/lib/services/**',
        'src/lib/errors/**',
      ],
      thresholds: {
        'src/lib/utils/**': {
          lines: 100,
          branches: 100,
          functions: 100,
          statements: 100,
        },
      },
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
