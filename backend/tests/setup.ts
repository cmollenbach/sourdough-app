// tests/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import prisma from '../src/lib/prisma';
import { seedEssentialData } from './helpers/seedTestData';

// Set test environment variables BEFORE any modules are imported
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes';
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  // Setup test database connection or mock services
  console.log('🧪 Setting up test environment...');
  
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
