// tests/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/lib/prisma';
import { seedEssentialData, cleanupTestData } from './helpers/seedTestData';

// Load test environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Set test environment variables BEFORE any modules are imported
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-purposes';
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  // Setup test database connection or mock services
  console.log('🧪 Setting up test environment...');
  
  // Clean up any existing data from previous runs
  await cleanupTestData();
  
  // Seed essential data once for all tests
  await seedEssentialData();
});

afterAll(async () => {
  // Cleanup test database or close connections
  console.log('🧹 Cleaning up test environment...');
  await prisma.$disconnect();
});

beforeEach(() => {
  // Reset mocks or clear data before each test
});

afterEach(() => {
  // Cleanup after each test
});
