// tests/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables from .env.test FIRST, before importing prisma
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Set test environment variables BEFORE any modules are imported
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-purposes';
process.env.NODE_ENV = 'test';

// Validate DATABASE_URL is set before importing Prisma
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set! Tests cannot run.');
  console.error('In CI, it should be set by workflow env vars.');
  console.error('Locally, it should be in .env.test file.');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@')); // Log with password masked

// NOW import prisma after env vars are set
import prisma from '../src/lib/prisma';
import { seedEssentialData, cleanupTestData } from './helpers/seedTestData';

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
