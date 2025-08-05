import { beforeAll, afterAll, afterEach } from '@jest/globals';
import TestDatabase from './utils/testDatabase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

const testDb = TestDatabase.getInstance();

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await testDb.connect();
}, 30000); // Increase timeout for database setup

// Global test teardown
afterAll(async () => {
  // Disconnect from test database
  await testDb.disconnect();
}, 30000); // Increase timeout for database teardown

// Clean up after each test
afterEach(async () => {
  // Skip database clearing for E2E tests to maintain state across tests
  if (process.env.SKIP_DATABASE_CLEARING === 'true') {
    return;
  }
  
  // Clear all collections between tests
  await testDb.clearDatabase();
}, 10000);

// Set test environment variables - use same JWT_SECRET as .env.test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-not-for-production-use';
process.env.BCRYPT_SALT_ROUNDS = '4'; // Lower rounds for faster tests
