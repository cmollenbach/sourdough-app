// tests/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Set test environment variables BEFORE any modules are imported
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes';
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  // Setup test database connection or mock services
  console.log('🧪 Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test database or close connections
  console.log('🧹 Cleaning up test environment...');
});

beforeEach(() => {
  // Reset mocks or clear data before each test
});

afterEach(() => {
  // Cleanup after each test
});
