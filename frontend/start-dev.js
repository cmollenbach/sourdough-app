#!/usr/bin/env node

// Simple script to start Vite dev server
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const vitePath = join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');

const vite = spawn('node', [vitePath], {
  stdio: 'inherit',
  shell: true
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});

vite.on('exit', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});
