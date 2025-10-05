#!/usr/bin/env node

// Simple script to start backend dev server
const { spawn } = require('child_process');
const path = require('path');

const tsNodeDevPath = path.join(__dirname, 'node_modules', '.bin', 'ts-node-dev');

const backend = spawn('node', [path.join(__dirname, 'node_modules', 'ts-node-dev', 'lib', 'index.js'), '--respawn', '--transpile-only', 'src/index.ts'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

backend.on('error', (err) => {
  console.error('Failed to start backend:', err);
  process.exit(1);
});

backend.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code);
});
