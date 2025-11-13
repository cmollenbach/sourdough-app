import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, '../node_modules/react'),
      'react/jsx-runtime': path.resolve(__dirname, '../node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(__dirname, '../node_modules/react/jsx-dev-runtime.js'),
      'react/jsx-dev-runtime.react-server': path.resolve(__dirname, '../node_modules/react/jsx-dev-runtime.react-server.js'),
      'react/jsx-runtime.react-server': path.resolve(__dirname, '../node_modules/react/jsx-runtime.react-server.js'),
    },
  },
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
