import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // Try uncommenting and using 'unsafe-none' for COEP to see if it resolves the issue.
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    proxy: {
      '/api': 'http://localhost:3001', // Change 3001 to your backend port if different
    },
  },
});
