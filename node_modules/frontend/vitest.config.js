// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // Exclude Playwright E2E tests from Vitest
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**', // Playwright tests are in e2e directory
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.{ts,tsx,js,jsx}'
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/e2e/**',
        '**/*.d.ts'
      ]
    },
  },
});